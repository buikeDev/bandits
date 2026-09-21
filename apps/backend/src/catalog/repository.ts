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
        orderBy,
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
