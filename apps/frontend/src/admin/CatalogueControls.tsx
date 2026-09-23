'use client';
import { useState } from 'react';
import ColorSelect from './ColorSelect';
import { adminApi, inputClass, buttonClass } from './api';
import { useAdminData } from './useAdminData';
export type Category = {
  _count?: { products: number };
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};
type Save = (path: string, data: unknown, method?: string) => Promise<void>;
function Field({
  name,
  title,
  value,
  type = 'text',
  required = true,
}: {
  name: string;
  title: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {title}
      <input
        name={name}
        defaultValue={value}
        type={type}
        required={required}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? '0.01' : undefined}
        className={inputClass}
      />
    </label>
  );
}
export function ImagePicker({
  name = 'imageUrl',
  value = '',
  multiple = false,
}: {
  name?: string;
  value?: string;
  multiple?: boolean;
}) {
  const [url, setUrl] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="space-y-2">
      <label className="block text-sm">
        {multiple ? 'Gallery URLs (one per line; first to last)' : 'Image URL'}
        {multiple ? (
          <textarea
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
        ) : (
          <input
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
        )}
      </label>
      <label className="block text-xs">
        Upload PNG, JPEG or WebP (up to 500 KB)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          className="mt-2 block max-w-full"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');
            if (file.size > 500000) {
              setError('Choose an image under 500 KB.');
              return;
            }
            setBusy(true);
            try {
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              const result = await adminApi<{ url: string }>('/images', { data });
              setUrl((old) =>
                multiple ? [old, result.url].filter(Boolean).join('\n') : result.url
              );
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </label>
      {busy && <p role="status">Uploading… Wait before saving.</p>}
      {url && (
        <div className="flex flex-wrap gap-3">
          {url.split(/\n/).filter(Boolean).map((image, index) => (
            <figure key={image} className="relative w-24">
              <img src={image} alt={`Product upload ${index + 1}`} className="h-20 w-24 rounded border object-cover" />
              <button type="button" className="mt-1 text-xs underline" onClick={() => setUrl((old) => old.split(/\n/).filter((entry) => entry !== image).join('\n'))}>Remove</button>
            </figure>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
export default function CatalogueControls({
  refresh,
  mode,
  onCreated,
}: {
  refresh: () => void;
  mode: 'pricing' | 'create' | 'categories';
  onCreated?: (id: string) => void;
}) {
  const categories = useAdminData<Category[]>('/categories');
  const settings = useAdminData<{ customizationFeeMinor: number; updatedAt: string }>('/settings');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [epoch, setEpoch] = useState(0);
  const save: Save = async (path, data, method = 'POST') => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await adminApi<{ id?: string }>(path, data, method);
      if (path === '/products' && result.id) onCreated?.(result.id);
      setMessage('Saved.');
      refresh();
      categories.refresh();
      settings.refresh();
      setEpoch((v) => v + 1);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="catalogue-controls space-y-4">
      {(message || categories.error || settings.error) && (
        <p role="status" className="rounded-lg bg-white p-4">
          {message || categories.error || settings.error}
        </p>
      )}
      {mode === 'pricing' && (
        <div>
          <h2 className="text-xl font-semibold">Customisation pricing</h2>
          {!settings.data && !settings.error && <p role="status">Loading pricing…</p>}
          {settings.data && (
            <form
              key={settings.data.updatedAt}
              className="mt-4 flex flex-wrap items-end gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save(
                  '/settings',
                  {
                    customizationFeeMinor: Math.round(
                      Number(new FormData(e.currentTarget).get('fee')) * 100
                    ),
                    updatedAt: settings.data!.updatedAt,
                  },
                  'PATCH'
                );
              }}
            >
              <Field
                name="fee"
                title="Fee per printed wristband (NGN)"
                type="number"
                value={settings.data.customizationFeeMinor / 100}
              />
              <button disabled={busy} className={buttonClass}>
                Save fee
              </button>
              <p className="w-full text-sm text-slate-500">
                Applies equally to every material. Saved order prices stay unchanged.
              </p>
            </form>
          )}
        </div>
      )}
      {mode === 'create' && (
        <div>
          <h2 className="text-xl font-semibold">Create product</h2>
          <form
            key={epoch}
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void save('/products', {
                name: f.get('name'),
                slug: f.get('slug'),
                description: f.get('description'),
                categoryId: f.get('categoryId'),
                basePrice: Number(f.get('basePrice')),
                imageUrl: f.get('imageUrl'),
                isActive: false,
                isFeatured: f.get('featured') === 'on',
                featuredOrder: Number(f.get('featuredOrder')),
              });
            }}
          >
            <Field name="name" title="Product name" />
            <Field name="slug" title="URL slug (lowercase-with-hyphens)" />
            <label className="text-sm">
              Category
              <select name="categoryId" required className={inputClass}>
                <option value="">Choose category</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Field name="basePrice" title="Material unit price (NGN)" type="number" />
            <label className="text-sm">
              Description
              <textarea name="description" required maxLength={5000} className={inputClass} />
            </label>
            <ImagePicker />
            <Field
              name="featuredOrder"
              title="Featured display order (lowest first)"
              type="number"
              value={0}
            />
            <label className="flex items-center gap-2">
              <input name="featured" type="checkbox" />
              Featured product
            </label>
            <button disabled={busy} className={buttonClass}>
              Create draft product
            </button>
            <p className="text-sm text-slate-500">
              Next, add variants and stock before publishing.
            </p>
          </form>
        </div>
      )}
      {mode === 'categories' && (
        <div>
          <h2 className="text-xl font-semibold">Manage categories</h2>
          <p className="catalogue-muted">Control how wristband categories appear in the store.</p>
          <details className="my-5 rounded-lg border p-4">
            <summary className="min-h-11 cursor-pointer font-semibold">Add category</summary>
            <CategoryForm key={epoch} busy={busy} save={save} />
          </details>
          {!categories.data && !categories.error && <p role="status">Loading categories…</p>}
          {categories.data?.length === 0 && (
            <p>No categories yet. Add your first category above.</p>
          )}
          {categories.data?.map((c) => (
            <details key={c.id + '-' + c.updatedAt} className="mt-4 border-t pt-3">
              <summary className="min-h-11 cursor-pointer">
                {c.name} · {c._count?.products ?? 0} products ·{' '}
                {c.isActive ? 'Published' : 'Hidden'} · Display order {c.sortOrder}
              </summary>
              <CategoryForm category={c} busy={busy} save={save} />
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
function CategoryForm({
  category,
  busy,
  save,
}: {
  category?: Category;
  busy: boolean;
  save: Save;
}) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void save(
          category ? `/categories/${category.id}` : '/categories',
          {
            name: f.get('name'),
            slug: f.get('slug'),
            description: f.get('description'),
            sortOrder: Number(f.get('sortOrder')),
            isActive: f.get('active') === 'on',
            ...(category ? { updatedAt: category.updatedAt } : {}),
          },
          category ? 'PATCH' : 'POST'
        );
      }}
    >
      <Field name="name" title="Category name" value={category?.name} />
      <Field name="slug" title="Slug" value={category?.slug} />
      <Field
        name="description"
        title="Description"
        value={category?.description ?? ''}
        required={false}
      />
      <Field
        name="sortOrder"
        title="Display order"
        value={category?.sortOrder ?? 0}
        type="number"
      />
      <label className="flex items-center gap-2">
        <input name="active" type="checkbox" defaultChecked={category?.isActive ?? true} />
        Published
      </label>
      <button disabled={busy} className={buttonClass}>
        {category ? 'Save category' : 'Add category'}
      </button>
    </form>
  );
}
export function ProductStockControls({
  product,
  save,
  busy,
}: {
  product: {
    id: string;
    updatedAt: string;
    imageUrl: string;
    images: string[];
    featuredOrder: number;
    categoryId: string;
  };
  save: Save;
  busy: boolean;
}) {
  const categories = useAdminData<Category[]>('/categories');
  return (
    <div className="mt-6 space-y-5 border-t pt-5">
      <details>
        <summary className="min-h-11 cursor-pointer font-semibold">
          Pictures, category and display order
        </summary>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void save(
              `/products/${product.id}/media`,
              {
                updatedAt: product.updatedAt,
                imageUrl: f.get('imageUrl'),
                images: String(f.get('images'))
                  .split('\n')
                  .map((v) => v.trim())
                  .filter(Boolean),
                featuredOrder: Number(f.get('featuredOrder')),
                categoryId: f.get('categoryId'),
              },
              'PATCH'
            );
          }}
        >
          <ImagePicker value={product.imageUrl} />
          <ImagePicker name="images" value={product.images.join('\n')} multiple />
          <Field
            name="featuredOrder"
            title="Featured display order"
            value={product.featuredOrder}
            type="number"
          />
          <label>
            Category
            <select name="categoryId" defaultValue={product.categoryId} className={inputClass}>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button disabled={busy} className={buttonClass}>
            Save pictures and category
          </button>
        </form>
      </details>
      <details>
        <summary className="min-h-11 cursor-pointer font-semibold">
          Add colour / size variant and initial stock
        </summary>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void save(
              `/products/${product.id}/variants`,
              {
                name: f.get('name'),
                sku: f.get('sku'),
                color: f.get('color'),
                material: f.get('material'),
                size: f.get('size'),
                imageUrl: f.get('imageUrl') || null,
                priceAdjustment: Number(f.get('priceAdjustment')),
                quantity: Number(f.get('quantity')),
                lowStockThreshold: Number(f.get('lowStockThreshold')),
                isCustomizationEnabled: f.get('custom') === 'on',
              },
              'POST'
            );
          }}
        >
          {[
            ['name', 'Variant name'],
            ['sku', 'Unique SKU'],
            ['material', 'Material'],
            ['size', 'Size'],
          ].map(([name, title]) => (
            <Field key={name} name={name} title={title} required={name !== 'size'} />
          ))}
          <ColorSelect />
          <Field name="priceAdjustment" title="Price adjustment (NGN)" type="number" value={0} />
          <Field name="quantity" title="Initial units" type="number" value={0} />
          <Field name="lowStockThreshold" title="Low-stock threshold" type="number" value={100} />
          <ImagePicker />
          <label className="flex items-center gap-2">
            <input name="custom" type="checkbox" defaultChecked />
            Custom printing available (uses this stock)
          </label>
          <button disabled={busy} className={buttonClass}>
            Add variant
          </button>
        </form>
      </details>
    </div>
  );
}
export function VariantStockControls({
  variant,
  save,
  busy,
}: {
  variant: {
    id: string;
    updatedAt: string;
    imageUrl: string | null;
    isCustomizationEnabled: boolean;
    inventory: { quantity: number; reservedQuantity: number; lowStockThreshold: number } | null;
  };
  save: Save;
  busy: boolean;
}) {
  const [history, setHistory] = useState(false);
  const [receiptId] = useState(() => crypto.randomUUID());
  return (
    <div className="mt-5 space-y-4 border-t pt-4">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save(
            `/variants/${variant.id}/options`,
            {
              updatedAt: variant.updatedAt,
              imageUrl: f.get('imageUrl') || null,
              isCustomizationEnabled: f.get('custom') === 'on',
            },
            'PATCH'
          );
        }}
      >
        <ImagePicker value={variant.imageUrl ?? ''} />
        <label className="flex items-center gap-2">
          <input name="custom" type="checkbox" defaultChecked={variant.isCustomizationEnabled} />
          Custom printing available
        </label>
        <button disabled={busy} className={buttonClass}>
          Save printing and image options
        </button>
      </form>
      {variant.inventory && (
        <>
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void save(
                `/inventory/${variant.id}/receive`,
                {
                  requestId: receiptId,
                  quantity: Number(f.get('quantity')),
                  reason: f.get('reason'),
                },
                'POST'
              );
            }}
          >
            <Field name="quantity" title="Incoming units" type="number" />
            <Field name="reason" title="Delivery / supplier reference" />
            <button disabled={busy} className={buttonClass}>
              Receive stock
            </button>
          </form>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void save(
                `/inventory/${variant.id}/threshold`,
                { lowStockThreshold: Number(new FormData(e.currentTarget).get('threshold')) },
                'PATCH'
              );
            }}
          >
            <Field
              name="threshold"
              title="Low-stock threshold"
              type="number"
              value={variant.inventory.lowStockThreshold}
            />
            <button disabled={busy} className={buttonClass}>
              Save threshold
            </button>
          </form>
          {variant.inventory.quantity - variant.inventory.reservedQuantity <=
            variant.inventory.lowStockThreshold && (
            <p className="text-sm font-semibold text-amber-800">
              Low stock — replenish this variant.
            </p>
          )}
        </>
      )}
      <button className={buttonClass} onClick={() => setHistory((v) => !v)}>
        {history ? 'Hide' : 'View'} stock history
      </button>
      {history && <StockHistory id={variant.id} />}
    </div>
  );
}
function StockHistory({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const { data, error } = useAdminData<{
    items: {
      id: string;
      action: string;
      staffName: string;
      createdAt: string;
      details: Record<string, unknown>;
    }[];
    hasMore: boolean;
    reservations: {
      id: string;
      quantity: number;
      state: string;
      workflow: {
        order: { reference: string };
        events: { id: string; note: string; staffName: string; createdAt: string }[];
      };
    }[];
  }>(`/inventory/${id}/history?page=${page}`);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading history…</p>;
  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-semibold">Stock receipts and adjustments</h3>
      {data.items.map((row) => (
        <div key={row.id} className="border-t pt-2">
          <p>
            {row.action.replace(/_/g, ' ')} · {row.staffName} ·{' '}
            {new Date(row.createdAt).toLocaleString()}
          </p>
          <p className="break-words">
            {Object.entries(row.details)
              .filter(([key]) =>
                [
                  'quantity',
                  'expectedQuantity',
                  'expectedReserved',
                  'reason',
                  'lowStockThreshold',
                ].includes(key)
              )
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ')}
          </p>
        </div>
      ))}
      <div className="flex gap-3">
        <button disabled={page === 1} onClick={() => setPage((v) => v - 1)} className={buttonClass}>
          Previous
        </button>
        <button
          disabled={!data.hasMore}
          onClick={() => setPage((v) => v + 1)}
          className={buttonClass}
        >
          Next
        </button>
      </div>
      <h3 className="font-semibold">Recent order reservations (up to 100)</h3>
      {data.reservations.map((r) => (
        <details key={r.id}>
          <summary className="min-h-11 cursor-pointer">
            {r.quantity} units · {r.state} · {r.workflow.order.reference}
          </summary>
          {r.workflow.events.map((event) => (
            <p key={event.id} className="py-2">
              {event.note} · {event.staffName} · {new Date(event.createdAt).toLocaleString()}
            </p>
          ))}
        </details>
      ))}
    </div>
  );
}
