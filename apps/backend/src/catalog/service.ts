import type { ProductDetailDto, ProductListQuery, ProductSummaryDto } from '@bandit/shared';
import { AppError } from '../errors/app-error.js';
import { catalogRepository, type CatalogProduct } from './repository.js';

const availableQuantity = (product: CatalogProduct): number =>
  product.variants.reduce((sum, variant) => sum + Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0)), 0);

const summary = (product: CatalogProduct): ProductSummaryDto => ({
  id: product.id, name: product.name, slug: product.slug, description: product.description,
  kind: product.kind, basePrice: Number(product.basePrice), compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
  imageUrl: product.imageUrl, isFeatured: product.isFeatured,
  category: { name: product.category.name, slug: product.category.slug },
  brand: product.brand ? { name: product.brand.name, slug: product.brand.slug } : null,
  availableQuantity: availableQuantity(product),
});

export const catalogService = {
  listCategories: () => catalogRepository.listCategories(),
  async listProducts(query: ProductListQuery) {
    const result = await catalogRepository.listProducts(query);
    return { items: result.items.map(summary), page: query.page, limit: query.limit, total: result.total, totalPages: Math.ceil(result.total / query.limit) };
  },
  async getProduct(slug: string): Promise<ProductDetailDto> {
    const product = await catalogRepository.findProductBySlug(slug);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    return {
      ...summary(product),
      variants: product.variants.map((variant) => ({
        id: variant.id, name: variant.name, sku: variant.sku, color: variant.color, material: variant.material, size: variant.size,
        priceAdjustment: Number(variant.priceAdjustment), isCustomizationEnabled: variant.isCustomizationEnabled,
        availableQuantity: Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0)),
      })),
      pricingTiers: product.pricingTiers.map((tier) => ({ minQuantity: tier.minQuantity, unitPrice: Number(tier.unitPrice) })),
      customizationOptions: product.customizationOptions.map((option) => ({
        id: option.id, type: option.type, name: option.name, priceAdjustment: Number(option.priceAdjustment), isRequired: option.isRequired,
      })),
    };
  },
};
