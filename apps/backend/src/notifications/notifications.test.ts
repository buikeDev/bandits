import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import type { Prisma } from '@bandit/database';
import { customerUpdate, whatsappPhone } from './messages.js';
import { enqueueOrderNotification } from './queue.js';
import { processNotification, notificationStore } from './worker.js';
const originalEnvironment = { ...process.env };
afterEach(() => {
  mock.restoreAll();
  for (const key of ['ORDER_NOTIFICATIONS_ENABLED', 'RESEND_API_KEY', 'ORDER_EMAIL_FROM']) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
});
test('customer messages distinguish acceptance, payment, delivery and pickup', () => {
  assert.match(customerUpdate('ref', 'CONFIRMED'), /separate update/);
  assert.match(customerUpdate('ref', 'PAYMENT_CONFIRMED'), /verified/);
  assert.match(customerUpdate('ref', 'COMPLETED', 'COLLECTION'), /collected/);
  assert.match(customerUpdate('ref', 'COMPLETED', 'DELIVERY'), /delivered/);
  assert.doesNotMatch(
    customerUpdate('ref', 'DISPATCHED', 'DELIVERY', 'Courier 123'),
    /admin\/|bank reference/
  );
  assert.equal(whatsappPhone('08012345678'), '2348012345678');
  assert.equal(whatsappPhone('+44 7700 900123'), '447700900123');
  assert.equal(whatsappPhone('invalid'), null);
});
test('queue uses staff email or verified identity and marks missing legacy email', async () => {
  process.env.ORDER_NOTIFICATIONS_ENABLED = 'true';
  let data: Record<string, unknown> = {};
  const tx = {
    orderEnquiry: {
      findUniqueOrThrow: async () => ({
        workflow: null,
        customer: { email: 'unverified@example.com', supabaseAuthId: null },
      }),
    },
    orderNotification: {
      upsert: async (args: { create: Record<string, unknown> }) => {
        data = args.create;
      },
    },
  } as unknown as Prisma.TransactionClient;
  await enqueueOrderNotification(tx, 'ref', 'RECEIVED', 'unique-event');
  assert.equal(data.status, 'MISSING_CONTACT');
  assert.equal(data.recipient, '');
  assert.equal(data.eventKey, 'unique-event');
});
function workerFixture(overrides: Record<string, unknown> = {}) {
  process.env.ORDER_NOTIFICATIONS_ENABLED = 'true';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.ORDER_EMAIL_FROM = 'orders@example.com';
  const updates: Record<string, unknown>[] = [];
  mock.method(notificationStore, 'findFirst', async () => ({
    id: 'job1',
    recipient: 'customer@example.com',
    status: 'PENDING',
    attempts: 0,
    availableAt: new Date(),
    firstAttemptAt: null,
    leaseToken: null,
    providerId: null,
    payload: {
      from: 'orders@example.com',
      to: ['customer@example.com'],
      text: 'Saved order',
      subject: 'Order update',
    },
    ...overrides,
  }));
  mock.method(notificationStore, 'updateMany', async (args: { data: Record<string, unknown> }) => {
    updates.push(args.data);
    return { count: 1 };
  });
  return updates;
}
test('worker records provider acceptance with stable idempotency key', async () => {
  const updates = workerFixture();
  mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    assert.equal((init.headers as Record<string, string>)['Idempotency-Key'], 'job1');
    return new Response(JSON.stringify({ id: 'provider1' }));
  });
  await processNotification();
  assert.equal(updates[1].status, 'ACCEPTED');
  assert.equal(updates[1].providerId, 'provider1');
});
test('worker retries outages but will not send beyond provider idempotency window', async () => {
  const updates = workerFixture();
  mock.method(globalThis, 'fetch', async () => {
    throw new Error('private error');
  });
  await processNotification();
  assert.equal(updates[1].status, 'PENDING');
  assert.doesNotMatch(String(updates[1].lastError), /private error/);
  mock.restoreAll();
  const expired = workerFixture({ firstAttemptAt: new Date(Date.now() - 24 * 3600000) });
  mock.method(globalThis, 'fetch', async () => {
    assert.fail('must not send expired retry');
  });
  await processNotification();
  assert.equal(expired[1].status, 'REVIEW_REQUIRED');
});
test('worker polls provider for delivery without resending', async () => {
  const updates = workerFixture({ status: 'ACCEPTED', providerId: 'provider1' });
  mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.match(url, /emails\/provider1$/);
    assert.equal(init.method, undefined);
    return new Response(JSON.stringify({ last_event: 'delivered' }));
  });
  await processNotification();
  assert.equal(updates[1].status, 'DELIVERED');
});
test('worker losing a claim never sends', async () => {
  workerFixture();
  mock.method(notificationStore, 'updateMany', async () => ({ count: 0 }));
  mock.method(globalThis, 'fetch', async () => {
    assert.fail('must not send without claim');
  });
  await processNotification();
});
