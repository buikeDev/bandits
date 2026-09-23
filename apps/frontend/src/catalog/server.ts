import 'server-only';

import type { ApiResponse, PaginatedProductsDto, ProductDetailDto } from '@bandit/shared';

const apiOrigin = (process.env.BACKEND_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
const API_URL = `${apiOrigin}/api`;

export async function getServerProduct(slug: string): Promise<ProductDetailDto | null> {
  const response = await fetch(`${API_URL}/catalog/products/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load product (${response.status}).`);
  const body = (await response.json()) as ApiResponse<ProductDetailDto>;
  if (!body.success || !body.data) throw new Error(body.error ?? 'Unable to load product.');
  return body.data;
}

export async function getServerProducts(page: number): Promise<PaginatedProductsDto> {
  const query = new URLSearchParams({ page: String(page), limit: '48', sort: 'name' });
  const response = await fetch(`${API_URL}/catalog/products?${query}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Unable to load catalogue (${response.status}).`);
  const body = (await response.json()) as ApiResponse<PaginatedProductsDto>;
  if (!body.success || !body.data) throw new Error(body.error ?? 'Unable to load catalogue.');
  return body.data;
}
