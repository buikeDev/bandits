'use client';

import type { CategoryDto, PaginatedProductsDto } from '@bandit/shared';
import { FormEvent, useEffect, useState } from 'react';
import Header from '@/components/Header';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';
import Footer from '@/components/Footer';
import { getCategories, getProducts } from '@/catalog/api';
import { ProductCard } from '@/catalog/ProductCard';

export default function ShopPage() {
  const [catalog, setCatalog] = useState<PaginatedProductsDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ kind: 'WRISTBAND', sort, page: String(page), limit: '12' });
    if (search) query.set('search', search);
    if (category) query.set('category', category);
    setError('');
    setCatalog(null);
    getProducts(query)
      .then((result) => {
        if (active) setCatalog(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load products');
      });
    return () => {
      active = false;
    };
  }, [search, category, sort, page]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPage(1);
    setSearch(String(form.get('search') ?? '').trim());
  }

  return (
    <>
      <Header />
      <main className="page-shell min-h-[70vh] py-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">BAND-IT CATALOG</p>
            <h1 className="mt-3 text-4xl font-black">Shop wristbands</h1>
          </div>
          <form onSubmit={submit} className="flex">
            <input
              name="search"
              aria-label="Search products"
              placeholder="Search wristbands"
              className="px-4 py-3 text-sm border rounded-l border-neutral-300"
            />
            <button className="rounded-l-none button-primary">Search</button>
          </form>
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
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
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border rounded"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
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
            <div className="grid gap-5 mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalog.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                className="button-secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {catalog.page} of {Math.max(1, catalog.totalPages)}
              </span>
              <button
                className="button-secondary"
                disabled={page >= catalog.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
