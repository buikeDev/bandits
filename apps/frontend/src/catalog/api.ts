import type {
  ApiResponse,
  CategoryDto,
  PaginatedProductsDto,
  ProductDetailDto,
} from '@bandit/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const REQUEST_TIMEOUT_MS = 12_000;

type RequestOptions = {
  signal?: AbortSignal;
  /** The catalogue can change during the day; keep this intentionally short. */
  ttlMs: number;
};

type CacheEntry<T> = { expiresAt: number; value: T };
const catalogueCache = new Map<string, CacheEntry<unknown>>();

function requestError(response: Response): Error {
  return new Error(
    response.status >= 500
      ? 'The catalogue is temporarily unavailable. Please try again shortly.'
      : `Unable to load the catalogue (HTTP ${response.status}). Please try again.`
  );
}

async function get<T>(path: string, options: RequestOptions): Promise<T> {
  const cached = catalogueCache.get(path) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (options.signal?.aborted)
    throw new DOMException('The catalogue request was cancelled.', 'AbortError');

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) throw requestError(response);
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !body.success || body.data === undefined)
      throw new Error(body.error ?? 'Unable to load catalogue');
    catalogueCache.set(path, { value: body.data, expiresAt: Date.now() + options.ttlMs });
    return body.data;
  } catch (error) {
    if (timedOut) throw new Error('The catalogue request timed out. Please retry.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export function clearCatalogueCache(): void {
  catalogueCache.clear();
}

export const getCategories = (signal?: AbortSignal): Promise<CategoryDto[]> =>
  get('/catalog/categories', { signal, ttlMs: 5 * 60_000 });
export const getProducts = (
  query: URLSearchParams,
  signal?: AbortSignal
): Promise<PaginatedProductsDto> =>
  get(`/catalog/products?${query.toString()}`, { signal, ttlMs: 20_000 });
export const getProduct = (slug: string, signal?: AbortSignal): Promise<ProductDetailDto> =>
  get(`/catalog/products/${encodeURIComponent(slug)}`, { signal, ttlMs: 30_000 });
export const getDesignOptions = (
  signal?: AbortSignal
): Promise<{ products: ProductDetailDto[]; customizationFeeMinor: number }> =>
  get('/catalog/design-options', { signal, ttlMs: 20_000 });
