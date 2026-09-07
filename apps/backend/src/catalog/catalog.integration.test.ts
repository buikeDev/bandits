import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { config as loadEnvironment } from 'dotenv';

loadEnvironment({ path: '../../packages/database/.env' });

test('catalog lists, filters, searches, and returns product detail', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async () => {
  const { createApp } = await import('../app.js');
  let server: Server | undefined;
  try {
    server = createApp({ checkDatabase: async () => {} }).listen(0);
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api/catalog`;

    const categories = await fetch(`${base}/categories`);
    assert.equal(categories.status, 200);
    assert.equal(((await categories.json()) as { data: unknown[] }).data.length, 6);

    const listing = await fetch(`${base}/products?kind=WRISTBAND&search=Tyvek&limit=4`);
    assert.equal(listing.status, 200);
    const body = (await listing.json()) as { data: { items: Array<{ slug: string }>; total: number } };
    assert.equal(body.data.total, 1);
    assert.equal(body.data.items[0]?.slug, 'tyvek-standard');

    const detail = await fetch(`${base}/products/tyvek-standard`);
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as { data: { variants: unknown[]; pricingTiers: unknown[] } };
    assert.ok(detailBody.data.variants.length > 0);
    assert.equal(detailBody.data.pricingTiers.length, 2);
  } finally {
    server?.close();
  }
});
