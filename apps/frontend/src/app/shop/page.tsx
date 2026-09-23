'use client';

import type { CategoryDto, PaginatedProductsDto } from '@bandit/shared';
import { Suspense, FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';
import Footer from '@/components/Footer';
import { getCategories, getProducts } from '@/catalog/api';
import { ProductCard } from '@/catalog/ProductCard';

function ShopContent() {
  const params = useSearchParams();
  const router = useRouter();
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/shop?${next}`, { scroll: false });
  };
  const [catalog, setCatalog] = useState<PaginatedProductsDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const search = (params.get('search') ?? '').slice(0, 150);
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);
  const category = params.get('category') ?? '';
  const kind = ['WRISTBAND', 'MARKETPLACE'].includes(params.get('kind') ?? '')
    ? params.get('kind')!
    : '';
  const sort = ['featured', 'newest', 'best-sellers', 'price-asc', 'price-desc', 'name'].includes(
    params.get('sort') ?? ''
  )
    ? params.get('sort')!
    : 'featured';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then(setCategories)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ sort, page: String(page), limit: '12' });
    if (kind) query.set('kind', kind);
    if (search) query.set('search', search);
    if (category) query.set('category', category);
    setError('');
    setCatalog(null);
    getProducts(query, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCatalog(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Unable to load products');
      });
    return () => {
      controller.abort();
    };
  }, [search, category, sort, page, kind]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({ search: String(form.get('search') ?? '').trim() });
  }

  return (
    <>
      <Header />
      <main className="page-shell min-h-[70vh] py-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">BAND-IT CATALOG</p>
            <h1 className="mt-3 text-4xl font-black">
              {sort === 'best-sellers'
                ? 'Best sellers'
                : sort === 'newest'
                  ? 'New arrivals'
                  : kind === 'WRISTBAND'
                    ? 'Shop wristbands'
                    : 'Shop all products'}
            </h1>
            {sort === 'best-sellers' && (
              <p className="mt-3 text-sm text-neutral-600">Ranked by units in completed orders.</p>
            )}
          </div>
          <form onSubmit={submit} className="flex">
            <input
              id="catalog-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              name="search"
              aria-label="Search products"
              placeholder="Search products"
              className="px-4 py-3 text-sm border rounded-l border-neutral-300"
            />
            <button className="rounded-l-none button-primary">Search</button>
          </form>
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <select
            aria-label="Product type"
            value={kind}
            onChange={(event) => update({ kind: event.target.value, category: '' })}
            className="min-h-11 rounded border px-3 py-2 text-sm"
          >
            <option value="">All products</option>
            <option value="WRISTBAND">Wristbands</option>
            <option value="MARKETPLACE">Other products</option>
          </select>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              update({ category: e.target.value });
            }}
            className="px-3 py-2 text-sm border rounded"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => {
              update({ sort: e.target.value });
            }}
            className="px-3 py-2 text-sm border rounded"
          >
            <option value="featured">Featured</option>
            <option value="newest">New arrivals</option>
            <option value="best-sellers">Best sellers</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
        {error && (
          <p role="alert" className="mt-8 text-red-700">
            {error}
          </p>
        )}
        {!catalog && !error && (
          <div className="mt-8">
            <CatalogSkeleton />
          </div>
        )}
        {catalog && (
          <>
            {catalog.items.length === 0 && (
              <div
                role="status"
                className="mt-8 rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center"
              >
                <h2 className="text-xl font-bold">
                  {sort === 'best-sellers' ? 'No best sellers yet' : 'No products found'}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Try another search or browse all categories.
                </p>
                <button
                  type="button"
                  className="button-secondary mt-5"
                  onClick={() => {
                    update({ search: '', category: '', kind: '', sort: '' });
                  }}
                >
                  Clear search and filters
                </button>
              </div>
            )}
            <div className="grid gap-5 mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalog.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {catalog.items.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  className="button-secondary"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {catalog.page} of {Math.max(1, catalog.totalPages)}
                </span>
                <button
                  className="button-secondary"
                  disabled={page >= catalog.totalPages}
                  onClick={() => update({ page: String(page + 1) })}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}
