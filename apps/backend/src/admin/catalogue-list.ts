import { prisma, Prisma } from '@bandit/database';
import { z } from 'zod';

export const catalogueQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  search: z.string().trim().max(150).default(''),
  category: z.string().max(150).default(''),
  filter: z.enum(['all', 'active', 'draft', 'featured', 'low', 'out']).default('all'),
  sort: z.enum(['name', 'newest', 'stock']).default('name'),
});

// All dynamic input is bound, including search. Stock is aggregated before pagination;
// inactive variants do not contribute to sellable stock or stock alerts.
export function catalogueSql(query: unknown) {
  const q = catalogueQuery.parse(query);
  const order =
    q.sort === 'newest'
      ? Prisma.sql`"updatedAt" DESC, id`
      : q.sort === 'stock'
        ? Prisma.sql`available ASC, name, id`
        : Prisma.sql`name ASC, id`;
  const condition = {
    all: Prisma.sql`TRUE`,
    active: Prisma.sql`"isActive"`,
    draft: Prisma.sql`NOT "isActive"`,
    featured: Prisma.sql`"isFeatured"`,
    low: Prisma.sql`"isActive" AND low > 0`,
    out: Prisma.sql`"isActive" AND available = 0`,
  }[q.filter];
  const pattern = `%${q.search.replace(/[\\%_]/g, '\\$&')}%`;
  return Prisma.sql`
    WITH catalogue AS (
      SELECT p.id, p.name, p.description, p."imageUrl", p."basePrice", p."categoryId",
        p."isActive", p."isFeatured", p."updatedAt" AT TIME ZONE 'UTC' AS "updatedAt", c.name AS category,
        COUNT(v.id)::int AS variants,
        COALESCE(SUM(i.quantity) FILTER (WHERE v."isActive"), 0)::int AS "onHand",
        COALESCE(SUM(i."reservedQuantity") FILTER (WHERE v."isActive"), 0)::int AS reserved,
        COALESCE(SUM(GREATEST(COALESCE(i.quantity, 0) - COALESCE(i."reservedQuantity", 0), 0))
          FILTER (WHERE v."isActive"), 0)::int AS available,
        COUNT(v.id) FILTER (WHERE v."isActive" AND i.quantity - i."reservedQuantity" > 0
          AND i.quantity - i."reservedQuantity" <= i."lowStockThreshold")::int AS low,
        COUNT(v.id) FILTER (WHERE v."isActive" AND COALESCE(i.quantity - i."reservedQuantity", 0) <= 0)::int AS empty
      FROM "Product" p JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "ProductVariant" v ON v."productId" = p.id
      LEFT JOIN "Inventory" i ON i."variantId" = v.id
      GROUP BY p.id, c.name
    ), matching AS (
      SELECT * FROM catalogue WHERE (${q.category} = '' OR "categoryId" = ${q.category})
      AND (${q.search} = '' OR name ILIKE ${pattern} OR EXISTS (
        SELECT 1 FROM "ProductVariant" s WHERE s."productId" = catalogue.id AND s.sku ILIKE ${pattern}
      ))
    ), filtered AS (SELECT * FROM matching WHERE ${condition}),
    page AS (SELECT * FROM filtered ORDER BY ${order} LIMIT 20 OFFSET ${(q.page - 1) * 20})
    SELECT json_build_object(
      'items', COALESCE((SELECT json_agg(page ORDER BY ${order}) FROM page), '[]'::json),
      'page', ${q.page}::int, 'total', (SELECT COUNT(*)::int FROM filtered),
      'hasMore', (SELECT COUNT(*) FROM filtered) > ${q.page * 20},
      'counts', (SELECT json_build_object('all', COUNT(*),
        'active', COUNT(*) FILTER (WHERE "isActive"), 'draft', COUNT(*) FILTER (WHERE NOT "isActive"),
        'featured', COUNT(*) FILTER (WHERE "isFeatured"),
        'low', COUNT(*) FILTER (WHERE "isActive" AND low > 0),
        'out', COUNT(*) FILTER (WHERE "isActive" AND available = 0)) FROM matching),
      'stats', (SELECT json_build_object('products', COUNT(*), 'variants', COALESCE(SUM(variants), 0),
        'low', COALESCE(SUM(low) FILTER (WHERE "isActive"), 0),
        'out', COALESCE(SUM(empty) FILTER (WHERE "isActive"), 0)) FROM catalogue)
    ) AS result`;
}

export async function listCatalogue(query: unknown) {
  const rows = await prisma.$queryRaw<{ result: unknown }[]>(catalogueSql(query));
  return rows[0].result;
}

export const catalogueRepository = {
  detail: (id: string) =>
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { include: { inventory: true } },
        pricingTiers: { orderBy: { minQuantity: 'asc' } },
      },
    }),
};
