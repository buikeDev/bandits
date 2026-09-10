import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { config as loadEnvironment } from 'dotenv';
loadEnvironment({ path: '../../packages/database/.env' });

test(
  'account history requires authentication and isolates customers',
  { skip: !process.env.RUN_ORDER_DB_TEST },
  async () => {
    const { prisma } = await import('@bandit/database');
    const { createApp } = await import('../app.js');
    const { createSessionToken, hashSessionToken, SESSION_COOKIE } =
      await import('../customer-auth/session.js');
    const ids: string[] = [];
    const requestId = randomUUID();
    const server = createApp({ checkDatabase: async () => undefined }).listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/orders`;
    try {
      const cookies: string[] = [];
      for (let index = 0; index < 2; index++) {
        const token = createSessionToken();
        const customer = await prisma.customerAccount.create({
          data: {
            email: `history-test-${randomUUID()}@bandit.invalid`,
            name: 'Order history test',
            passwordHash: 'test-not-a-login',
            sessions: {
              create: {
                tokenHash: hashSessionToken(token),
                expiresAt: new Date(Date.now() + 60000),
              },
            },
          },
        });
        ids.push(customer.id);
        cookies.push(`${SESSION_COOKIE}=${token}`);
      }
      const result = await fetch(origin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies[0] },
        body: JSON.stringify({
          requestId,
          customerId: ids[1],
          items: [
            {
              id: 'test',
              material: 'Tyvek',
              colorName: 'Yellow',
              color: '#ffcc00',
              ink: '#000000',
              message: 'HISTORY TEST ONLY',
              subtitle: '',
              font: 'Arial',
              logo: '',
              quantity: 1,
            },
          ],
        }),
      });
      assert.equal(result.status, 201);
      const saved = await prisma.orderEnquiry.findUniqueOrThrow({ where: { requestId } });
      assert.equal(saved.customerId, ids[0]);
      assert.equal((await fetch(`${origin}/mine`)).status, 401);
      const mine = await fetch(`${origin}/mine`, { headers: { Cookie: cookies[0] } });
      assert.equal(mine.headers.get('cache-control'), 'no-store');
      const body = (await mine.json()) as { data: { items: Array<{ reference: string }> } };
      assert.equal(body.data.items[0].reference, saved.reference);
      const other = await fetch(`${origin}/mine`, { headers: { Cookie: cookies[1] } });
      const otherBody = (await other.json()) as { data: { items: unknown[] } };
      assert.equal(otherBody.data.items.length, 0);
    } finally {
      await prisma.orderEnquiry.deleteMany({ where: { requestId } });
      await prisma.customerAccount.deleteMany({ where: { id: { in: ids } } });
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      await prisma.$disconnect();
    }
  }
);
