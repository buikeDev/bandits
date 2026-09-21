import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { prisma } from '@bandit/database';
import { adminRepository } from './repository.js';
import { createApp } from '../app.js';
import { WRISTBAND_COLORS, wristbandColorHex, wristbandColorSchema } from '@bandit/shared';
afterEach(() => mock.restoreAll());
async function request(path: string, body: unknown, method = 'POST') {
  mock.method(adminRepository, 'session', async () => ({
    expiresAt: new Date(Date.now() + 60000),
    staff: {
      id: 'admin',
      email: 'admin@example.test',
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  }));
  const server = createApp({ checkDatabase: async () => {} }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as { port: number }).port}/api/admin${path}`,
      {
        method,
        headers: {
          Cookie: 'bandit_staff_session=test',
          'Content-Type': 'application/json',
          'X-Bandit-Admin': '1',
        },
        body: JSON.stringify(body),
      }
    );
    return { status: response.status, body: await response.json() };
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
test('shared colours normalize names and render indigo consistently', () => {
  assert.equal(wristbandColorSchema.parse(' indigo '), 'Indigo');
  assert.equal(wristbandColorHex('INDIGO'), '#4b0082');
  for (const color of WRISTBAND_COLORS) {
    assert.equal(wristbandColorSchema.parse(color.name), color.name);
    assert.equal(wristbandColorHex(color.name), color.hex);
  }
  assert.equal(wristbandColorSchema.safeParse('indig').success, false);
});
test('unsupported colours cannot be created or saved through the admin API', async () => {
  const input = {
    name: 'Indigo standard',
    sku: 'TYV-IND-STD',
    color: 'indig',
    material: 'Tyvek',
    size: '',
    quantity: 20,
    priceAdjustment: 0,
    isActive: true,
    updatedAt: new Date().toISOString(),
  };
  assert.equal((await request('/products/p1/variants', input)).status, 400);
  assert.equal((await request('/variants/v1', input, 'PATCH')).status, 400);
});
test('new variants create their own blank inventory and audit together', async () => {
  let created: unknown;
  let audit: unknown;
  const tx = {
    productVariant: {
      create: async (args: unknown) => {
        created = args;
        return { id: 'v1' };
      },
    },
    adminAudit: {
      create: async (args: unknown) => {
        audit = args;
      },
    },
  };
  mock.method(prisma, '$transaction', async (fn: (tx: unknown) => Promise<unknown>) => fn(tx));
  const result = await request('/products/p1/variants', {
    name: 'Blue large',
    sku: 'BLUE-L',
    color: 'Blue',
    material: 'Tyvek',
    quantity: 500,
    lowStockThreshold: 50,
  });
  assert.equal(result.status, 200);
  assert.deepEqual((created as { data: { inventory: unknown } }).data.inventory, {
    create: { quantity: 500, lowStockThreshold: 50 },
  });
  assert.equal(
    (created as { data: { isCustomizationEnabled: boolean } }).data.isCustomizationEnabled,
    true
  );
  assert.equal((audit as { data: { action: string } }).data.action, 'VARIANT_CREATED');
});
test('stock receipt retries do not increment on-hand stock twice', async () => {
  const rows = new Map<string, unknown>();
  let received = 0;
  const tx = {
    inventory: {
      updateMany: async () => {
        received++;
        return { count: 1 };
      },
    },
    adminAudit: {
      findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null,
      create: async ({ data }: { data: { id: string } }) => {
        rows.set(data.id, data);
      },
    },
  };
  mock.method(prisma, '$transaction', async (fn: (tx: unknown) => Promise<unknown>) => fn(tx));
  const body = { requestId: randomUUID(), quantity: 100, reason: 'Supplier batch 12' };
  assert.equal((await request('/inventory/v1/receive', body)).status, 200);
  assert.equal((await request('/inventory/v1/receive', body)).status, 200);
  assert.equal(received, 1);
  assert.equal((await request('/inventory/v1/receive', { ...body, quantity: 200 })).status, 409);
  assert.equal(received, 1);
});
test('non-raster and mismatched image content is rejected before storage', async () => {
  for (const data of ['data:image/svg+xml;base64,AAAA', 'data:image/png;base64,aGVsbG8=']) {
    assert.equal((await request('/images', { data })).status, 400);
  }
});
