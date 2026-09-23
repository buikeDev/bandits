import { createTestStock, removeTestStock } from './test-stock.js';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { config as loadEnvironment } from 'dotenv';

loadEnvironment({ path: '../../packages/database/.env' });

test(
  'checkout API persists orders, retries safely, and exposes no public order lookup',
  { skip: !process.env.RUN_ORDER_DB_TEST },
  async () => {
    const { prisma } = await import('@bandit/database');
    const { createApp } = await import('../app.js');
    const requestId = randomUUID();
    const server = createApp({ checkDatabase: async () => undefined }).listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const input = {
      requestId,
      items: [
        {
          id: 'integration-only',
          product: undefined as { id: string; slug: string; variantId: string } | undefined,
          material: 'Tyvek',
          colorName: 'Yellow',
          color: '#ffcc00',
          ink: '#000000',
          message: 'CHECKOUT TEST â€” NOT AN ORDER',
          subtitle: '',
          font: 'Arial',
          quantity: 10,
          logo: '',
        },
      ],
    };
    try {
      input.items[0].product = await createTestStock(requestId);
      const submit = () =>
        fetch(`${origin}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
      const first = await submit();
      assert.equal(first.status, 201);
      const body = (await first.json()) as { data: { reference: string } };
      const second = await submit();
      assert.deepEqual(await second.json(), body);
      const saved = await prisma.orderEnquiry.findUniqueOrThrow({ where: { requestId } });
      assert.equal(saved.reference, body.data.reference);
      assert.equal(saved.status, 'AWAITING_WHATSAPP');
      assert.equal(saved.quoteRequired, false);
      assert.equal(saved.subtotalMinor, 200000n);
      assert.equal(saved.totalQuantity, 10);
      assert.doesNotMatch(JSON.stringify(saved.snapshot), /data:image\/[^,]+;base64/);
      assert.equal((await fetch(`${origin}/api/orders/${saved.id}`)).status, 404);
    } finally {
      await prisma.orderEnquiry.deleteMany({ where: { requestId } });
      await removeTestStock(requestId);
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      await prisma.$disconnect();
    }
  }
);
