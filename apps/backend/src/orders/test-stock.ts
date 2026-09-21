import { prisma } from '@bandit/database';
// Used only by opt-in database integration tests against a disposable database.
export async function createTestStock(slug: string) {
  const row = await prisma.product.create({
    data: {
      slug,
      name: 'Test stock',
      description: 'Integration fixture',
      imageUrl: '/images/test.png',
      basePrice: 100,
      category: { create: { slug, name: 'Test category' } },
      variants: {
        create: {
          name: 'Yellow',
          sku: slug,
          color: 'Yellow',
          material: 'Tyvek',
          isCustomizationEnabled: true,
          inventory: { create: { quantity: 10000 } },
        },
      },
    },
    include: { variants: true },
  });
  return { id: row.id, slug: row.slug, variantId: row.variants[0].id };
}
export async function removeTestStock(slug: string) {
  await prisma.product.deleteMany({ where: { slug } });
  await prisma.category.deleteMany({ where: { slug } });
}
