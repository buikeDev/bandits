import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { prisma } from '@bandit/database';
import { notificationsEnabled } from './queue.js';
export const notificationStore = {
  findFirst: (args: Parameters<typeof prisma.orderNotification.findFirst>[0]) =>
    prisma.orderNotification.findFirst(args),
  updateMany: (args: Parameters<typeof prisma.orderNotification.updateMany>[0]) =>
    prisma.orderNotification.updateMany(args),
};

export const retryDelay = (attempt: number) => Math.min(3600000, 30000 * 2 ** Math.min(attempt, 7));
export async function processNotification() {
  if (!notificationsEnabled() || !process.env.RESEND_API_KEY || !process.env.ORDER_EMAIL_FROM)
    return;
  const now = new Date();
  const candidate = await notificationStore.findFirst({
    where: { status: { in: ['PENDING', 'SENDING', 'ACCEPTED'] }, availableAt: { lte: now } },
    orderBy: { availableAt: 'asc' },
  });
  if (!candidate) return;
  const token = randomUUID();
  const claimed = await notificationStore.updateMany({
    where: {
      id: candidate.id,
      status: candidate.status,
      availableAt: candidate.availableAt,
      leaseToken: candidate.leaseToken,
    },
    data: {
      leaseToken: token,
      availableAt: new Date(Date.now() + 60000),
      ...(!candidate.providerId
        ? {
            status: 'SENDING',
            firstAttemptAt: candidate.firstAttemptAt ?? now,
            attempts: { increment: 1 },
          }
        : {}),
    },
  });
  if (!claimed.count) return;
  const update = (data: Parameters<typeof prisma.orderNotification.updateMany>[0]['data']) =>
    notificationStore.updateMany({
      where: { id: candidate.id, leaseToken: token },
      data: { ...data, leaseToken: null },
    });
  const headers = {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (candidate.providerId) {
    try {
      const response = await fetch(
        `https://api.resend.com/emails/${encodeURIComponent(candidate.providerId)}`,
        { headers, signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { last_event?: string };
      const status = ['delivered', 'opened', 'clicked'].includes(body.last_event ?? '')
        ? 'DELIVERED'
        : ['bounced', 'complained', 'failed', 'suppressed'].includes(body.last_event ?? '')
          ? 'UNDELIVERABLE'
          : 'ACCEPTED';
      await update({
        status,
        availableAt: new Date(Date.now() + 900000),
        lastError:
          status === 'UNDELIVERABLE'
            ? 'Provider reported delivery failure. Check the address with the customer.'
            : null,
      });
    } catch {
      await update({
        availableAt: new Date(Date.now() + 900000),
        lastError: 'Delivery status temporarily unavailable.',
      });
    }
    return;
  }
  // Resend retains idempotency keys for 24h. Stop before expiry rather than risk a duplicate.
  if (candidate.firstAttemptAt && Date.now() - candidate.firstAttemptAt.getTime() > 23 * 3600000) {
    await update({
      status: 'REVIEW_REQUIRED',
      lastError: 'Retry window expired. Check provider records before any further send.',
    });
    return;
  }
  try {
    const payload = candidate.payload as Record<string, unknown>;
    if (!payload.from || !candidate.recipient) {
      await update({
        status: 'FAILED',
        lastError: 'Sender or recipient configuration is missing.',
      });
      return;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': candidate.id },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error();
    const body = (await response.json()) as { id?: string };
    if (!body.id) throw new Error();
    await update({
      status: 'ACCEPTED',
      providerId: body.id,
      lastError: null,
      availableAt: new Date(Date.now() + 60000),
    });
  } catch {
    await update({
      status: candidate.attempts + 1 >= 8 ? 'FAILED' : 'PENDING',
      availableAt: new Date(Date.now() + retryDelay(candidate.attempts + 1)),
      lastError:
        'Send attempt failed or acknowledgement was unavailable. Retries use the same idempotency key.',
    });
  }
}
