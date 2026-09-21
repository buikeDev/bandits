'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminIcon from './AdminIcon';
import CatalogueControls, { type Category } from './CatalogueControls';
import { useAdminData } from './useAdminData';
import { useStaff } from './AdminShell';

type Filter = 'all' | 'active' | 'draft' | 'featured' | 'low' | 'out';
type ProductRow = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  variants: number;
  available: number;
  reserved: number;
  onHand: number;
  low: number;
  empty: number;
  isActive: boolean;
  isFeatured: boolean;
  updatedAt: string;
};
type Catalogue = {
  items: ProductRow[];
  page: number;
  total: number;
  hasMore: boolean;
  counts: Record<Filter, number>;
  stats: { products: number; variants: number; low: number; out: number };
};
const filters: [Filter, string][] = [
  ['all', 'All'],
  ['active', 'Active'],
  ['draft', 'Draft'],
  ['featured', 'Featured'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
];
const number = (value: number) => value.toLocaleString('en-NG');
function ProductPicture({ product }: { product: ProductRow }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="catalogue-picture">
      {product.imageUrl && !failed ? (
        <Image
          src={product.imageUrl}
          alt=""
          width={76}
          height={58}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <AdminIcon name="stock" />
      )}
    </span>
  );
}
function Status({ product }: { product: ProductRow }) {
  const state = !product.isActive
    ? 'draft'
    : product.available === 0
      ? 'out'
      : product.low > 0
        ? 'low'
        : 'active';
  return (
    <span className={`catalogue-status ${state}`}>
      <span aria-hidden="true" />
      {{ draft: 'Draft', out: 'Out of stock', low: 'Low stock', active: 'Active' }[state]}
    </span>
  );
}
function CatalogueDialog({
  mode,
  close,
  refresh,
}: {
  mode: 'pricing' | 'create';
  close: () => void;
  refresh: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="catalogue-dialog"
      aria-label={mode === 'pricing' ? 'Customisation pricing' : 'Add product'}
      onCancel={close}
      onClose={close}
    >
      <button
        className="catalogue-dialog-close catalogue-button"
        onClick={close}
        aria-label="Close dialog"
      >
        <AdminIcon name="close" />
      </button>
      <CatalogueControls
        mode={mode}
        refresh={refresh}
        onCreated={(id) => {
          close();
          router.push(`/admin/products/${id}`);
        }}
      />
    </dialog>
  );
}
export default function CatalogueOverview() {
  const actor = useStaff();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') === 'categories' ? 'categories' : 'products';
  const selected = params.get('filter') ?? 'all';
  const filter: Filter = filters.some(([key]) => key === selected) ? (selected as Filter) : 'all';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const search = (params.get('search') ?? '').slice(0, 150);
  const category = params.get('category') ?? '';
  const sort = ['name', 'newest', 'stock'].includes(params.get('sort') ?? '')
    ? params.get('sort')!
    : 'name';
  const [draftSearch, setDraftSearch] = useState(search);
  const [dialog, setDialog] = useState<'pricing' | 'create' | null>(null);
  const query = new URLSearchParams({ page: String(page), search, category, filter, sort });
  const { data, error, refresh } = useAdminData<Catalogue>(`/products?${query}`);
  const categories = useAdminData<Category[]>('/categories');
  useEffect(() => setDraftSearch(search), [search]);
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/admin/products?${next}`, { scroll: false });
  };
  const reload = () => {
    refresh();
    categories.refresh();
  };
  if (actor?.role !== 'ADMIN') return <p>Administrator access required.</p>;
  return (
    <main className="catalogue-page">
      <header className="catalogue-heading">
        <div>
          <h1>Catalogue & stock</h1>
          <p>Manage products, variants, pricing and inventory.</p>
        </div>
        <div className="catalogue-actions">
          <button className="catalogue-button" onClick={() => setDialog('pricing')}>
            <AdminIcon name="settings" />
            Customisation pricing
          </button>
          <button className="catalogue-button" onClick={() => update({ tab: 'categories' })}>
            <AdminIcon name="stock" />
            Manage categories
          </button>
          <button className="catalogue-button primary" onClick={() => setDialog('create')}>
            <span aria-hidden="true" className="text-2xl">
              +
            </span>
            Add product
          </button>
        </div>
      </header>
      <section className="catalogue-metrics" aria-label="Catalogue totals">
        {(
          [
            ['products', 'Total products', 'Includes active and draft products', 'stock'],
            ['variants', 'Total variants', 'All colours and sizes', 'stock'],
            ['low', 'Low-stock variants', 'Active variants at their stock threshold', 'production'],
            ['out', 'Out-of-stock variants', 'Active variants with no available units', 'close'],
          ] as const
        ).map(([key, title, hint, icon]) => (
          <div key={key} className={`catalogue-metric ${key}`}>
            <span className="catalogue-metric-icon">
              <AdminIcon name={icon} />
            </span>
            <div>
              <h2>{title}</h2>
              <strong>{data ? number(data.stats[key]) : '—'}</strong>
              <p>{hint}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="catalogue-panel">
        <nav className="catalogue-tabs" aria-label="Catalogue views">
          {(['products', 'categories'] as const).map((value) => (
            <button
              key={value}
              aria-current={tab === value ? 'page' : undefined}
              onClick={() => update({ tab: value })}
            >
              {value === 'products' ? 'Products' : 'Categories'}
            </button>
          ))}
        </nav>
        {tab === 'categories' ? (
          <div className="catalogue-category-content">
            <CatalogueControls mode="categories" refresh={reload} />
          </div>
        ) : (
          <>
            <div className="catalogue-toolbar">
              <form
                className="catalogue-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  update({ search: draftSearch.trim() });
                }}
                role="search"
              >
                <AdminIcon name="search" />
                <input
                  aria-label="Search products by name or SKU"
                  placeholder="Search products or SKU…"
                  maxLength={150}
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                />
                <button type="submit">Search</button>
              </form>
              <label className="catalogue-select">
                <span className="sr-only">Category</span>
                <select
                  value={category}
                  onChange={(event) => update({ category: event.target.value })}
                >
                  <option value="">All categories</option>
                  {categories.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="catalogue-select">
                <span>Sort by</span>
                <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                  <option value="name">Name (A–Z)</option>
                  <option value="newest">Recently updated</option>
                  <option value="stock">Available stock</option>
                </select>
              </label>
            </div>
            <div className="catalogue-filters" aria-label="Filter products">
              {filters.map(([key, title]) => (
                <button
                  key={key}
                  className="catalogue-button"
                  aria-pressed={filter === key}
                  onClick={() => update({ filter: key })}
                >
                  {title}
                  {data ? ` (${number(data.counts[key])})` : ''}
                </button>
              ))}
            </div>
            {categories.error && (
              <p role="alert" className="catalogue-notice">
                Categories could not be loaded. <button onClick={categories.refresh}>Retry</button>
              </p>
            )}
            {error && (
              <p role="alert" className="catalogue-notice">
                {error} <button onClick={refresh}>Retry</button>
              </p>
            )}
            {!data && !error && (
              <div className="catalogue-loading" role="status">
                Loading catalogue…
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} />
                ))}
              </div>
            )}
            {data && data.items.length === 0 && (
              <div className="catalogue-empty">
                <AdminIcon name="stock" />
                <h2>
                  {data.stats.products ? 'No matching products' : 'Your catalogue starts here'}
                </h2>
                <p>
                  {data.stats.products
                    ? 'Try another name, SKU or filter.'
                    : 'Add your first product, then its colours and opening stock.'}
                </p>
                <button
                  className="catalogue-button"
                  onClick={() =>
                    data.stats.products
                      ? update({ search: '', category: '', filter: 'all', page: '' })
                      : setDialog('create')
                  }
                >
                  {data.stats.products ? 'Clear filters' : 'Add product'}
                </button>
              </div>
            )}
            {data && data.items.length > 0 && (
              <div className="catalogue-table-wrap">
                <table className="catalogue-table">
                  <caption className="sr-only">Products and available inventory</caption>
                  <thead>
                    <tr>
                      {[
                        'Product',
                        'Category',
                        'Variants',
                        'Available stock',
                        'Status',
                        'Last updated',
                        'Actions',
                      ].map((label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="catalogue-product">
                            <ProductPicture product={product} />
                            <div>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="catalogue-product-name"
                              >
                                {product.name}
                              </Link>
                              <p>{product.description}</p>
                              {product.isFeatured && (
                                <span className="catalogue-featured">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-label="Category">
                          <span className="catalogue-category">{product.category}</span>
                        </td>
                        <td data-label="Variants">{number(product.variants)}</td>
                        <td data-label="Available stock">
                          <strong>{number(product.available)}</strong>
                          <small>{number(product.reserved)} reserved</small>
                        </td>
                        <td data-label="Status">
                          <Status product={product} />
                          {product.isActive && product.empty > 0 && product.available > 0 && (
                            <small>{number(product.empty)} variants out of stock</small>
                          )}
                        </td>
                        <td data-label="Last updated">
                          <time dateTime={product.updatedAt}>
                            {new Date(product.updatedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'Africa/Lagos',
                            })}
                          </time>
                        </td>
                        <td className="catalogue-row-action">
                          <Link
                            className="catalogue-button"
                            href={`/admin/products/${product.id}`}
                            aria-label={`Manage ${product.name}`}
                          >
                            Manage <span aria-hidden="true">→</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && (
              <footer className="catalogue-pagination">
                <p>
                  {data.total
                    ? `Showing ${data.items.length ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, data.total)} of ${number(data.total)} products`
                    : '0 products'}
                </p>
                <div>
                  <button
                    className="catalogue-button"
                    disabled={page === 1}
                    onClick={() => update({ page: String(page - 1) })}
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                  <span aria-current="page">{page}</span>
                  <button
                    className="catalogue-button"
                    disabled={!data.hasMore}
                    onClick={() => update({ page: String(page + 1) })}
                    aria-label="Next page"
                  >
                    →
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>
      {dialog && <CatalogueDialog mode={dialog} close={() => setDialog(null)} refresh={reload} />}
    </main>
  );
}
