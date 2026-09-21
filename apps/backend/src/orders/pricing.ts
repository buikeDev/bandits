import { prisma } from '@bandit/database';
import { catalogService } from '../catalog/service.js';
import { AppError } from '../errors/app-error.js';
import type { OrderRequest } from './schema.js';

export async function pricingSettings() {
  const settings = await prisma.commerceSettings.findUnique({ where: { id: 'default' } });
  return { customizationFeeMinor: settings?.customizationFeeMinor ?? 10000 };
}

// Custom designs use the actual blank variant, never a separate stock pool.
export async function resolveDesign(item: OrderRequest['items'][number]) {
  const aliases: Record<string, string[]> = {
    tyvek: ['tyvek'],
    vinyl: ['vinyl', 'plastic'],
    silicone: ['silicone', 'rubber'],
    fabric: ['fabric'],
  };
  const names = aliases[item.material.toLowerCase()] ?? [item.material.toLowerCase()];
  const candidates = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      isCustomizationEnabled: true,
      color: { equals: item.colorName, mode: 'insensitive' },
      product: { isActive: true, kind: 'WRISTBAND', category: { isActive: true } },
      OR: names.map((material) => ({
        material: { equals: material, mode: 'insensitive' as const },
      })),
    },
    include: { product: true },
    orderBy: [{ productId: 'asc' }, { id: 'asc' }],
    take: 2,
  });
  if (candidates.length !== 1)
    throw new AppError(
      'Select a stocked wristband and colour in the designer before checkout.',
      409,
      'VARIANT_REQUIRED'
    );
  const variant = candidates[0];
  return { product: await catalogService.getProduct(variant.product.slug), variantId: variant.id };
}
