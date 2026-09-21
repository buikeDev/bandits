import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import type { ProductDetailDto } from '@bandit/shared';
import { prepareOrder, type OrderSnapshot } from './service.js';

const product: ProductDetailDto = {
  id: 'p1',
  name: 'Tyvek wristbands',
  slug: 'tyvek',
  description: '',
  kind: 'WRISTBAND',
  basePrice: 100,
  compareAtPrice: null,
  imageUrl: '',
  isFeatured: false,
  category: { name: 'Tyvek', slug: 'tyvek' },
  brand: null,
  availableQuantity: 500,
  variants: [
    {
      id: 'v1',
      name: 'Yellow',
      sku: 'Y',
      color: 'Yellow',
      material: 'Tyvek',
      size: null,
      priceAdjustment: 10,
      isCustomizationEnabled: true,
      availableQuantity: 500,
    },
  ],
  pricingTiers: [{ minQuantity: 100, unitPrice: 80 }],
  customizationOptions: [],
};
const line = {
  id: 'line',
  material: 'Tyvek',
  colorName: 'Yellow',
  color: '#ffcc00',
  ink: '#000000',
  message: '',
  subtitle: '',
  font: 'Arial',
  logo: '',
  quantity: 100,
  product: { id: 'p1', slug: 'tyvek', variantId: 'v1', pricing: { basePrice: 0 } },
};

function setup() {
  const saved = new Map<string, OrderSnapshot>();
  return {
    saved,
    dependencies: {
      product: async () => product,
      fee: async () => 10000,
      resolve: async () => ({ product, variantId: 'v1' }),
      find: async (id: string) => saved.get(id) ?? null,
      save: async (order: OrderSnapshot) => {
        const result = saved.get(order.requestId) ?? order;
        saved.set(order.requestId, result);
        return result;
      },
    },
  };
}

test('staff links are configurable and do not rewrite the saved message', async () => {
  const previousUrl = process.env.ADMIN_DASHBOARD_URL;
  try {
    process.env.ADMIN_DASHBOARD_URL = 'https://staff.example.test';
    const { saved, dependencies } = setup();
    const input = { requestId: randomUUID(), items: [line] };
    const result = await prepareOrder(input, dependencies);
    assert.ok(
      result.message.includes(`https://staff.example.test/admin/orders/${result.reference}`)
    );
    assert.ok(![...saved.values()][0].message.includes('staff.example.test'));
    delete process.env.ADMIN_DASHBOARD_URL;
    const retry = await prepareOrder(input, dependencies);
    assert.equal(retry.reference, result.reference);
    assert.ok(!retry.message.includes('staff.example.test'));
  } finally {
    if (previousUrl === undefined) delete process.env.ADMIN_DASHBOARD_URL;
    else process.env.ADMIN_DASHBOARD_URL = previousUrl;
  }
});

test('checkout binds the snapshot and retry token to the authenticated customer', async () => {
  const { saved, dependencies } = setup();
  const input = { requestId: randomUUID(), items: [line] };
  await prepareOrder(input, dependencies, 'customer-a');
  assert.equal([...saved.values()][0].customerId, 'customer-a');
  await assert.rejects(prepareOrder(input, dependencies, 'customer-b'), /different cart/);
  await assert.rejects(prepareOrder(input, dependencies), /different cart/);
});

test('prices come from the server, including tier and variant adjustment', async () => {
  const { saved, dependencies } = setup();
  const result = await prepareOrder({ requestId: randomUUID(), items: [line] }, dependencies);
  const snapshot = [...saved.values()][0];
  assert.equal(snapshot.subtotalMinor, 900000);
  assert.equal(snapshot.snapshot.items[0].unitMinor, 9000);
  assert.match(result.message, /9,000\.00/);
  assert.match(result.message, /Printing: Plain/);
  assert.equal(result.phone, '2349137132516');
  assert.doesNotMatch(result.message, /admin\/orders/);
});

test('combined lines cannot exceed stock', async () => {
  const { dependencies, saved } = setup();
  await assert.rejects(
    prepareOrder(
      {
        requestId: randomUUID(),
        items: [
          { ...line, quantity: 300 },
          { ...line, id: 'second', quantity: 300 },
        ],
      },
      dependencies
    ),
    /Only 500 units/
  );
  assert.equal(saved.size, 0);
});

test('custom artwork persists and customisation is charged per band', async () => {
  const { saved, dependencies } = setup();
  const logo = {
    id: 'logo',
    name: 'Client artwork',
    src: 'data:image/png;base64,aGVsbG8=',
    x: 20,
    y: 30,
    size: 40,
    aspect: 2,
  };
  const custom = { ...line, product: undefined, message: 'Team & friends 🎉', logos: [logo] };
  const result = await prepareOrder(
    { requestId: randomUUID(), items: [line, custom] },
    dependencies
  );
  const snapshot = [...saved.values()][0];
  assert.equal(snapshot.totalQuantity, 200);
  assert.equal(snapshot.quoteRequired, false);
  assert.equal(snapshot.subtotalMinor, 2800000);
  assert.equal(snapshot.snapshot.items[1].customizationUnitMinor, 10000);
  assert.equal(snapshot.snapshot.items[1].materialUnitMinor, 9000);
  assert.deepEqual(snapshot.snapshot.items[1].logos, [logo]);
  assert.match(result.message, /Team & friends 🎉/);
  assert.match(result.message, /not attached to WhatsApp/);
  assert.doesNotMatch(result.message, /base64/);
  assert.equal(
    new URL(
      `https://wa.me/${result.phone}?text=${encodeURIComponent(result.message)}`
    ).searchParams.get('text'),
    result.message
  );
});

test('unlisted colours cannot be priced or saved', async () => {
  const { dependencies, saved } = setup();
  await assert.rejects(
    prepareOrder(
      { requestId: randomUUID(), items: [{ ...line, colorName: 'Pink' }] },
      dependencies
    ),
    /available colour/
  );
  assert.equal(saved.size, 0);
});

test('retry keeps one reference; changed cart cannot reuse the same token', async () => {
  const { saved, dependencies } = setup();
  const input = { requestId: randomUUID(), items: [line] };
  const first = await prepareOrder(input, dependencies);
  const second = await prepareOrder(input, dependencies);
  assert.deepEqual(first, second);
  assert.equal(saved.size, 1);
  await assert.rejects(
    prepareOrder({ ...input, items: [{ ...line, quantity: 2 }] }, dependencies),
    /different cart/
  );
});

test('invalid or empty orders and non-raster artwork are rejected', async () => {
  const { saved, dependencies } = setup();
  for (const items of [
    [],
    [{ ...line, quantity: -1 }],
    [{ ...line, logo: 'data:image/svg+xml;base64,AAAA' }],
  ]) {
    await assert.rejects(prepareOrder({ requestId: randomUUID(), items }, dependencies));
  }
  assert.equal(saved.size, 0);
});

test('unavailable variant prevents saving an order', async () => {
  const { saved, dependencies } = setup();
  await assert.rejects(
    prepareOrder(
      {
        requestId: randomUUID(),
        items: [{ ...line, product: { ...line.product, variantId: 'deleted' } }],
      },
      dependencies
    ),
    /no longer available/
  );
  assert.equal(saved.size, 0);
});

test('fee updates affect new orders but never retries', async () => {
  const { dependencies, saved } = setup();
  let fee = 10000;
  dependencies.fee = async () => fee;
  const input = { requestId: randomUUID(), items: [{ ...line, message: 'Hello' }] };
  const first = await prepareOrder(input, dependencies);
  fee = 15000;
  assert.deepEqual(await prepareOrder(input, dependencies), first);
  await prepareOrder({ ...input, requestId: randomUUID() }, dependencies);
  assert.deepEqual(
    [...saved.values()].map((o) => o.subtotalMinor),
    [1900000, 2400000]
  );
});
test('checkout rejects a stale displayed price without saving', async () => {
  const { dependencies, saved } = setup();
  await assert.rejects(
    prepareOrder(
      { requestId: randomUUID(), items: [line], expectedSubtotalMinor: 1 },
      dependencies
    ),
    /Prices changed/
  );
  assert.equal(saved.size, 0);
});
test('custom and plain lines share stock availability', async () => {
  const { dependencies, saved } = setup();
  await assert.rejects(
    prepareOrder(
      {
        requestId: randomUUID(),
        items: [
          { ...line, quantity: 300 },
          { ...line, id: 'print', quantity: 300, message: 'Hello' },
        ],
      },
      dependencies
    ),
    /Only 500/
  );
  assert.equal(saved.size, 0);
});

test('the same per-band fee applies to every material', async () => {
  for (const material of ['Tyvek', 'Vinyl', 'Silicone', 'Fabric']) {
    const { dependencies, saved } = setup();
    dependencies.product = async () => ({
      ...product,
      variants: product.variants.map((v) => ({ ...v, material })),
    });
    await prepareOrder(
      { requestId: randomUUID(), items: [{ ...line, material, message: 'Printed', quantity: 10 }] },
      dependencies
    );
    const snapshot = [...saved.values()][0];
    assert.equal(snapshot.snapshot.items[0].customizationUnitMinor, 10000);
    assert.equal(snapshot.subtotalMinor, 210000);
  }
});
