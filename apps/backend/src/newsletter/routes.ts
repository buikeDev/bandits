import { createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

const message =
  'Thanks! If your address is eligible, check your inbox and spam folder for a confirmation email. If you already subscribe, you’re all set.';
const inputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  website: z.string().max(500).optional(),
});

// Bounded, per-process limits. No raw email addresses retained in memory.
export function createNewsletterLimiter() {
  const recent = new Map<string, number>();
  let windowStart = 0;
  let count = 0;
  return (email: string, now = Date.now()) => {
    if (now - windowStart >= 15 * 60_000) {
      windowStart = now;
      count = 0;
    }
    for (const [key, expires] of recent) if (expires <= now) recent.delete(key);
    const key = createHash('sha256').update(email).digest('hex');
    if (recent.has(key)) return 'duplicate';
    if (count >= 100) return 'limited';
    recent.set(key, now + 60_000);
    count++;
    return 'allowed';
  };
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const key = process.env.MAILCHIMP_API_KEY?.trim();
  const server = process.env.MAILCHIMP_SERVER_PREFIX?.trim();
  const audience = process.env.MAILCHIMP_AUDIENCE_ID?.trim();
  if (!key || !/^us\d+$/.test(server ?? '') || !/^[a-zA-Z0-9]+$/.test(audience ?? ''))
    throw new AppError(
      'Newsletter signup is temporarily unavailable. Please try again later.',
      503,
      'NEWSLETTER_UNAVAILABLE'
    );
  try {
    const response = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${audience}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`bandit:${key}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: email, status: 'pending' }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (response.ok) return;
    const error = (await response.json().catch(() => ({}))) as { title?: string };
    // Never overwrite an existing member's unsubscribe/cleaned/pending status.
    if (response.status === 400 && error.title === 'Member Exists') return;
    throw new Error('Provider rejected signup');
  } catch {
    // Provider payloads can contain personal information; do not log or return them.
    throw new AppError(
      'We couldn’t submit your signup. Please try again later.',
      503,
      'NEWSLETTER_UNAVAILABLE'
    );
  }
}

export function createNewsletterRouter(): ReturnType<typeof Router> {
  const router = Router();
  const limit = createNewsletterLimiter();
  router.post('/subscribe', async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const input = inputSchema.parse(req.body);
      if (input.website) {
        res.json({ success: true, data: { message } });
        return;
      }
      const result = limit(input.email);
      if (result === 'limited') {
        res.setHeader('Retry-After', '900');
        throw new AppError(
          'Too many signup attempts. Please try again in 15 minutes.',
          429,
          'NEWSLETTER_RATE_LIMIT'
        );
      }
      if (result === 'duplicate')
        throw new AppError(
          'Please wait a minute before trying this email again.',
          429,
          'NEWSLETTER_RATE_LIMIT'
        );
      await subscribeNewsletter(input.email);
      res.json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
