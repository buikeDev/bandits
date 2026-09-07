import type { ApiResponse, CategoryDto, PaginatedProductsDto, ProductDetailDto } from '@bandit/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Catalog API returned ${response.status}. Confirm the backend is running on port 3001.`);
  }
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.error ?? 'Unable to load catalog');
  return body.data;
}

export const getCategories = (): Promise<CategoryDto[]> => get('/catalog/categories');
export const getProducts = (query: URLSearchParams): Promise<PaginatedProductsDto> => get(`/catalog/products?${query}`);
export const getProduct = (slug: string): Promise<ProductDetailDto> => get(`/catalog/products/${encodeURIComponent(slug)}`);
