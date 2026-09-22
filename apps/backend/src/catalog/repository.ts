import { Prisma, prisma } from '@bandit/database';
import type { ProductListQuery } from '@bandit/shared';

const productInclude = {
  category: true,
  brand: true,
  variants: { where: { isActive: true }, include: { inventory: true } },
  pricingTiers: { orderBy: { minQuantity: 'asc' as const } },
  customizationOptions: true,
};

export const catalogRepository = {
  listCategories: () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  async listProducts(query: ProductListQuery) {
    if (query.sort === 'best-sellers') {
      const search = `%${(query.search ?? '').replace(/[\\%_]/g, '\\$&')}%`;
      const [result] = await prisma.$queryRaw<
        { data: { ids: string[]; total: number } }[]
      >(Prisma.sql`
        WITH sales AS (
          SELECT item->'product'->>'id' AS id, SUM((item->>'quantity')::numeric) AS units
          FROM "OrderEnquiry" o CROSS JOIN LATERAL jsonb_array_elements(o.snapshot->'items') item
          WHERE o.status = 'COMPLETED' AND item->'product'->>'id' IS NOT NULL
          GROUP BY item->'product'->>'id'
        ), matches AS (
          SELECT p.id, p.name, sales.units FROM sales JOIN "Product" p ON p.id = sales.id
          JOIN "Category" c ON c.id = p."categoryId"
          WHERE p."isActive" AND c."isActive" AND sales.units > 0
          AND (${query.kind ?? ''} = '' OR p.kind::text = ${query.kind ?? ''})
          AND (${query.category ?? ''} = '' OR c.slug = ${query.category ?? ''})
          AND (${!query.featured} OR p."isFeatured")
          AND (p.name ILIKE ${search} OR p.description ILIKE ${search} OR c.name ILIKE ${search})
        ), page AS (SELECT * FROM matches ORDER BY units DESC, name, id LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit})
        SELECT json_build_object('ids', COALESCE((SELECT json_agg(id ORDER BY units DESC, name, id) FROM page), '[]'::json), 'total', (SELECT COUNT(*) FROM matches)) AS data
      `);
      const rows = await prisma.product.findMany({
        where: { id: { in: result.data.ids }, isActive: true, category: { isActive: true } },
        include: productInclude,
      });
      const positions = new Map(result.data.ids.map((id, index) => [id, index]));
      return {
        items: rows.sort((a, b) => positions.get(a.id)! - positions.get(b.id)!),
        total: result.data.total,
      };
    }
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query.featured ? { isFeatured: true } : {}),
      category: { isActive: true, ...(query.category ? { slug: query.category } : {}) },
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { category: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sort === 'price-asc'
        ? [{ basePrice: 'asc' }]
        : query.sort === 'price-desc'
          ? [{ basePrice: 'desc' }]
          : query.sort === 'newest'
            ? [{ createdAt: 'desc' }]
            : query.sort === 'name'
              ? [{ name: 'asc' }]
              : [{ isFeatured: 'desc' }, { featuredOrder: 'asc' }, { createdAt: 'desc' }];
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [...orderBy, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  },

  findProductBySlug: (slug: string) =>
    prisma.product.findFirst({
      where: { slug, isActive: true, category: { isActive: true } },
      include: productInclude,
    }),
};

export type CatalogProduct = NonNullable<
  Awaited<ReturnType<typeof catalogRepository.findProductBySlug>>
>;
