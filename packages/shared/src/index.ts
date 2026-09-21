import { z } from 'zod';
export * from './wristband-colors.js';

export interface WhatsAppOrderDto {
  reference: string;
  message: string;
  phone: string;
}

export interface WhatsAppOrderDto {
  reference: string;
  message: string;
  phone: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const customerRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const customerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export interface CustomerAccountDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  customer: CustomerAccountDto;
}

export const productListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  kind: z.enum(['WRISTBAND', 'MARKETPLACE']).optional(),
  featured: z.enum(['true']).optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc', 'name']).default('featured'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ProductSummaryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  kind: 'WRISTBAND' | 'MARKETPLACE';
  basePrice: number;
  compareAtPrice: number | null;
  imageUrl: string;
  images?: string[];
  isFeatured: boolean;
  category: Pick<CategoryDto, 'name' | 'slug'>;
  brand: { name: string; slug: string } | null;
  availableQuantity: number;
}

export interface ProductDetailDto extends ProductSummaryDto {
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    color: string | null;
    material: string | null;
    size: string | null;
    priceAdjustment: number;
    imageUrl?: string | null;
    isCustomizationEnabled: boolean;
    availableQuantity: number;
  }>;
  pricingTiers: Array<{ minQuantity: number; unitPrice: number }>;
  customizationOptions: Array<{
    id: string;
    type: 'TEXT' | 'LOGO' | 'ARTWORK_UPLOAD' | 'COLOR';
    name: string;
    priceAdjustment: number;
    isRequired: boolean;
  }>;
}

export interface PaginatedProductsDto {
  items: ProductSummaryDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
