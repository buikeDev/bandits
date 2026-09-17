'use client';
import { useState } from 'react';
import { useAdminData } from '@/admin/useAdminData';
import { useStaff } from '@/admin/AdminShell';
import { adminApi, inputClass, buttonClass } from '@/admin/api';
type Variant = {
  id: string;
  name: string;
  color: string | null;
  material: string | null;
  size: string | null;
  updatedAt: string;
  priceAdjustment: string;
  isActive: boolean;
  inventory: { quantity: number; reservedQuantity: number } | null;
};
type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
  isFeatured: boolean;
  updatedAt: string;
  pricingTiers: { minQuantity: number; unitPrice: string }[];
  variants: Variant[];
};
export default function Products() {
  const actor = useStaff();
  const [page, setPage] = useState(1);
  const { data, error, refresh } = useAdminData<{ items: Product[]; hasMore: boolean }>(
    `/products?page=${page}`
  );
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const save = async (path: string, input: unknown, method = 'PATCH') => {
    setBusy(true);
    setFailure('');
    try {
      await adminApi(path, input, method);
      refresh();
    } catch (cause) {
      setFailure((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (actor?.role !== 'ADMIN') return <p>Administrator access required.</p>;
  return (
    <main>
      <h1 className="text-3xl font-bold">Catalogue & stock</h1>
      <p className="mt-2 text-neutral-600">
        Manage current products. Existing order snapshots stay unchanged.
      </p>
      {(error || failure) && (
        <div role="alert" className="my-4 text-red-700">
          {error || failure}{' '}
          <button onClick={refresh} className="min-h-11 underline">
            Refresh catalogue
          </button>
        </div>
      )}
      {!data && !error && (
        <p role="status" className="mt-6">
          Loading catalogue…
        </p>
      )}
      <div className="mt-6 space-y-4">
        {data?.items.map((product) => (
          <details
            key={`${product.id}-${product.updatedAt}`}
            className="rounded-xl border bg-white p-5"
          >
            <summary className="min-h-11 cursor-pointer font-semibold">
              {product.name}{' '}
              <span className="ml-3 text-xs font-normal text-neutral-500">
                {product.isActive ? 'Active' : 'Hidden'} · {product.variants.length} variants
              </span>
            </summary>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const tiers = String(form.get('tiers'))
                  .split('\n')
                  .filter((v) => v.trim())
                  .map((v) => {
                    const [minQuantity, unitPrice] = v.split(':').map(Number);
                    return { minQuantity, unitPrice };
                  });
                if (
                  tiers.some(
                    (t) => !Number.isFinite(t.minQuantity) || !Number.isFinite(t.unitPrice)
                  )
                ) {
                  setFailure('Use quantity:price for each tier, for example 100:80');
                  return;
                }
                void save(`/products/${product.id}`, {
                  updatedAt: product.updatedAt,
                  name: form.get('name'),
                  description: form.get('description'),
                  basePrice: Number(form.get('basePrice')),
                  isActive: form.get('active') === 'on',
                  isFeatured: form.get('featured') === 'on',
                  pricingTiers: tiers,
                });
              }}
            >
              <label className="text-sm">
                Name
                <input name="name" required defaultValue={product.name} className={inputClass} />
              </label>
              <label className="text-sm">
                Base price (NGN)
                <input
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={product.basePrice}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Description
                <textarea
                  name="description"
                  required
                  defaultValue={product.description}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Bulk tiers — minimum quantity:unit price (NGN), one per line
                <textarea
                  name="tiers"
                  defaultValue={product.pricingTiers
                    .map((t) => `${t.minQuantity}:${t.unitPrice}`)
                    .join('\n')}
                  placeholder="100:80"
                  className={inputClass}
                />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input name="active" type="checkbox" defaultChecked={product.isActive} />
                Available in store
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input name="featured" type="checkbox" defaultChecked={product.isFeatured} />
                Featured product
              </label>
              <button disabled={busy} className={buttonClass}>
                Save product
              </button>
            </form>
            <div className="mt-6 space-y-4">
              {product.variants.map((variant) => (
                <div
                  key={`${variant.id}-${variant.updatedAt}-${variant.inventory?.quantity}`}
                  className="rounded-lg bg-neutral-50 p-4"
                >
                  <form
                    className="grid gap-3 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void save(`/variants/${variant.id}`, {
                        updatedAt: variant.updatedAt,
                        name: form.get('name'),
                        color: form.get('color'),
                        material: form.get('material'),
                        size: form.get('size'),
                        priceAdjustment: Number(form.get('priceAdjustment')),
                        isActive: form.get('active') === 'on',
                      });
                    }}
                  >
                    {[
                      ['name', 'Variant name', variant.name],
                      ['color', 'Colour', variant.color],
                      ['material', 'Material', variant.material],
                      ['size', 'Size', variant.size],
                    ].map(([name, title, value]) => (
                      <label key={name} className="text-xs">
                        {title}
                        <input
                          name={name!}
                          defaultValue={value ?? ''}
                          required={name === 'name'}
                          className={inputClass}
                        />
                      </label>
                    ))}
                    <label className="text-xs">
                      Price adjustment (NGN)
                      <input
                        name="priceAdjustment"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        defaultValue={variant.priceAdjustment}
                        className={inputClass}
                      />
                    </label>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input name="active" type="checkbox" defaultChecked={variant.isActive} />
                      Active variant
                    </label>
                    <button disabled={busy} className={buttonClass}>
                      Save variant
                    </button>
                  </form>
                  {variant.inventory ? (
                    <form
                      className="mt-5 grid items-end gap-3 border-t pt-4 sm:grid-cols-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        void save(
                          `/inventory/${variant.id}`,
                          {
                            quantity: Number(form.get('quantity')),
                            expectedQuantity: variant.inventory!.quantity,
                            expectedReserved: variant.inventory!.reservedQuantity,
                            reason: form.get('reason'),
                          },
                          'POST'
                        );
                      }}
                    >
                      <p className="text-sm sm:col-span-3">
                        On hand: {variant.inventory.quantity} · Reserved:{' '}
                        {variant.inventory.reservedQuantity} · Available:{' '}
                        {variant.inventory.quantity - variant.inventory.reservedQuantity}
                      </p>
                      <label className="text-xs">
                        New on-hand quantity
                        <input
                          name="quantity"
                          type="number"
                          min={variant.inventory.reservedQuantity}
                          step="1"
                          required
                          defaultValue={variant.inventory.quantity}
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs">
                        Adjustment reason
                        <input
                          name="reason"
                          required
                          minLength={3}
                          maxLength={500}
                          className={inputClass}
                        />
                      </label>
                      <button disabled={busy} className={buttonClass}>
                        Adjust stock
                      </button>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm">No inventory record configured for this variant.</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      {data && (
        <div className="mt-5 flex justify-between">
          <button
            className={buttonClass}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className={buttonClass}
            disabled={!data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
