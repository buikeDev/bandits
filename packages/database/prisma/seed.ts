import { PrismaClient, ProductKind } from '@prisma/client';

const prisma = new PrismaClient();

const catalog = [
  { name: 'Tyvek Wristbands', slug: 'tyvek', material: 'Tyvek', price: 120, color: 'Yellow', custom: true },
  { name: 'Vinyl Wristbands', slug: 'vinyl-plastic', material: 'Vinyl', price: 650, color: 'Blue', custom: true },
  { name: 'Silicone Wristbands', slug: 'rubber-silicone', material: 'Silicone', price: 900, color: 'Black', custom: true },
  { name: 'Fabric Wristbands', slug: 'fabric', material: 'Fabric', price: 1100, color: 'Multi-colour', custom: true },
  { name: 'VIP Wristbands', slug: 'vip', material: 'Holographic', price: 500, color: 'Silver', custom: true },
  { name: 'Hospital ID Wristbands', slug: 'hospital', material: 'Soft Vinyl', price: 350, color: 'White', custom: false },
] as const;

async function main(): Promise<void> {
  const brand = await prisma.brand.upsert({
    where: { slug: 'bandit' }, update: { name: 'BANDIT' }, create: { name: 'BANDIT', slug: 'bandit' },
  });

  for (const [index, item] of catalog.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: item.slug },
      update: { name: item.name, sortOrder: index, isActive: true },
      create: { name: item.name, slug: item.slug, sortOrder: index, description: `${item.material} wristbands for events and identification.` },
    });
    const product = await prisma.product.upsert({
      where: { slug: `${item.slug}-standard` },
      update: { name: item.name, basePrice: item.price, categoryId: category.id, brandId: brand.id, isActive: true },
      create: {
        name: item.name,
        slug: `${item.slug}-standard`,
        description: `Durable ${item.material.toLowerCase()} wristbands available for events, access control and identification.`,
        kind: ProductKind.WRISTBAND,
        basePrice: item.price,
        imageUrl: '/images/wristband-categories.png',
        isFeatured: index < 4,
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    const variant = await prisma.productVariant.upsert({
      where: { sku: `BND-${item.slug.toUpperCase()}-STD` },
      update: { name: `${item.color} standard`, material: item.material, color: item.color, isActive: true },
      create: {
        productId: product.id,
        name: `${item.color} standard`,
        sku: `BND-${item.slug.toUpperCase()}-STD`,
        material: item.material,
        color: item.color,
        isCustomizationEnabled: item.custom,
      },
    });
    await prisma.inventory.upsert({
      where: { variantId: variant.id }, update: { quantity: 5000 }, create: { variantId: variant.id, quantity: 5000 },
    });
    for (const tier of [{ minQuantity: 100, unitPrice: item.price * 0.9 }, { minQuantity: 500, unitPrice: item.price * 0.8 }]) {
      await prisma.productPricingTier.upsert({
        where: { productId_minQuantity: { productId: product.id, minQuantity: tier.minQuantity } },
        update: { unitPrice: tier.unitPrice }, create: { productId: product.id, ...tier },
      });
    }
    if (item.custom) {
      const existing = await prisma.customizationOption.findFirst({ where: { productId: product.id, type: 'LOGO' } });
      if (!existing) await prisma.customizationOption.create({ data: { productId: product.id, type: 'LOGO', name: 'Custom logo printing', priceAdjustment: 50 } });
    }
  }
}

main()
  .then(() => console.log('Catalog seed completed'))
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
