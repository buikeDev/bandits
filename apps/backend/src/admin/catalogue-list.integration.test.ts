import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '@bandit/database';
import { catalogueSql } from './catalogue-list.js';

// Temporary tables shadow the catalogue only inside this connection. No application
// rows or schema are changed, and PostgreSQL drops these tables on commit/rollback.
test(
  'catalogue SQL aggregates reservations, filters before pagination and keeps global totals',
  { skip: !process.env.RUN_CATALOGUE_DB_TEST },
  async () => {
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`CREATE TEMP TABLE "Category" (id text PRIMARY KEY, name text) ON COMMIT DROP`;
          await tx.$executeRaw`CREATE TEMP TABLE "Product" (id text PRIMARY KEY, name text, description text, "imageUrl" text, "basePrice" numeric, "categoryId" text, "isActive" boolean, "isFeatured" boolean, "updatedAt" timestamp) ON COMMIT DROP`;
          await tx.$executeRaw`CREATE TEMP TABLE "ProductVariant" (id text PRIMARY KEY, "productId" text, sku text, "isActive" boolean) ON COMMIT DROP`;
          await tx.$executeRaw`CREATE TEMP TABLE "Inventory" ("variantId" text, quantity int, "reservedQuantity" int, "lowStockThreshold" int) ON COMMIT DROP`;
          const read = async (query: unknown) => {
            const rows = await tx.$queryRaw<
              {
                result: {
                  items: { id: string; available: number; reserved: number; variants: number }[];
                  total: number;
                  hasMore: boolean;
                  stats: { products: number; variants: number; low: number; out: number };
                };
              }[]
            >(catalogueSql(query));
            return rows[0].result;
          };
          assert.deepEqual((await read({})).stats, { products: 0, variants: 0, low: 0, out: 0 });
          await tx.$executeRaw`INSERT INTO "Category" VALUES ('c1', 'Tyvek'), ('c2', 'Fabric')`;
          await tx.$executeRaw`INSERT INTO "Product" SELECT 'p' || n, 'Product ' || lpad(n::text, 2, '0'), '', '/images/test.png', 100, CASE WHEN n <= 3 THEN 'c1' ELSE 'c2' END, n <> 3, n = 1, '2026-09-18'::timestamp FROM generate_series(1,24) n`;
          await tx.$executeRaw`INSERT INTO "ProductVariant" VALUES ('v1','p1','SPECIAL%_SKU',true), ('v2','p1','INACTIVE',false), ('v3','p2','NO-INVENTORY',true), ('v4','p3','DRAFT',true)`;
          await tx.$executeRaw`INSERT INTO "Inventory" VALUES ('v1',100,90,10), ('v2',500,0,20), ('v4',2,0,100)`;
          const first = await read({});
          assert.equal(first.total, 24);
          assert.equal(first.items.length, 20);
          assert.equal(first.hasMore, true);
          assert.deepEqual(first.stats, { products: 24, variants: 4, low: 1, out: 1 });
          assert.equal(first.items[0].available, 10);
          assert.equal(first.items[0].reserved, 90);
          assert.equal(first.items[0].variants, 2);
          const second = await read({ page: 2 });
          assert.equal(second.items.length, 4);
          assert.equal(second.hasMore, false);
          assert.deepEqual(second.stats, first.stats);
          assert.equal((await read({ search: '%_SKU' })).total, 1);
          assert.equal((await read({ search: 'missing' })).total, 0);
          assert.equal((await read({ category: 'c1' })).total, 3);
          assert.equal((await read({ filter: 'low' })).items[0].id, 'p1');
          assert.equal((await read({ filter: 'out' })).total, 22);
          assert.equal((await read({ filter: 'draft' })).total, 1);
          assert.equal((await read({ filter: 'featured' })).total, 1);
          assert.equal((await read({ sort: 'stock' })).items[0].available, 0);
          assert.equal((await read({ sort: 'newest' })).items.length, 20);
        },
        { timeout: 30000 }
      );
    } finally {
      await prisma.$disconnect();
    }
  }
);
