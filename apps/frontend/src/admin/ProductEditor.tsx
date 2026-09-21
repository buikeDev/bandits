'use client';
import { useState } from 'react';
import ColorSelect from './ColorSelect';
import Link from 'next/link';
import { ProductStockControls, VariantStockControls } from '@/admin/CatalogueControls';
import { useAdminData } from '@/admin/useAdminData';
import { adminApi, inputClass, buttonClass } from '@/admin/api';
type Variant = {
  imageUrl: string | null;
  isCustomizationEnabled: boolean;
  id: string;
  name: string;
  color: string | null;
  material: string | null;
  size: string | null;
  updatedAt: string;
  priceAdjustment: string;
  isActive: boolean;
  inventory: { quantity: number; reservedQuantity: number; lowStockThreshold: number } | null;
};
type Product = {
  imageUrl: string;
  images: string[];
  featuredOrder: number;
  categoryId: string;
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

export default function ProductEditor({ id }: { id: string }) {
  const { data: product, error, refresh } = useAdminData<Product>(`/products/${id}`);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [message, setMessage] = useState('');
  const save = async (path: string, input: unknown, method = 'PATCH') => {
    if (busy) return;
    setBusy(true);
    setFailure('');
    setMessage('');
    try {
      await adminApi(path, input, method);
      refresh();
      setMessage('Changes saved.');
    } catch (cause) {
      setFailure((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="catalogue-editor">
      <Link href="/admin/products" className="catalogue-back">
        ← Catalogue & stock
      </Link>
      <h1>{product?.name ?? 'Product details'}</h1>
      <p className="catalogue-muted">
        Manage pricing, pictures, colours and stock. Saved order prices stay unchanged.
      </p>
      <nav className="catalogue-actions mt-5" aria-label="Product sections">
        <a className="catalogue-button" href="#product-information">
          Information & pricing
        </a>
        <a className="catalogue-button" href="#product-pictures">
          Pictures & new variants
        </a>
        <a className="catalogue-button" href="#product-stock">
          Variants & stock
        </a>
      </nav>
      {(error || failure) && (
        <p role="alert">
          {error || failure} <button onClick={refresh}>Retry</button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!product && !error && <p role="status">Loading product…</p>}
      {product && (
        <section className="admin-panel" key={product.id + product.updatedAt}>
          <h2 id="product-information" className="text-xl font-semibold">
            Product information & pricing
          </h2>
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
                tiers.some((t) => !Number.isFinite(t.minQuantity) || !Number.isFinite(t.unitPrice))
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
          <div id="product-pictures">
            <ProductStockControls product={product} save={save} busy={busy} />
          </div>
          <div id="product-stock" className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Variants & stock</h2>
            {product.variants.length === 0 && (
              <p>Add a colour or size variant above to start tracking stock.</p>
            )}
            {product.variants.map((variant) => (
              <details
                key={`${variant.id}-${variant.updatedAt}-${variant.inventory?.quantity}-${variant.inventory?.reservedQuantity}-${variant.inventory?.lowStockThreshold}`}
                className="rounded-lg bg-neutral-50 p-4"
              >
                <summary className="min-h-11 cursor-pointer font-semibold">
                  {variant.name} · {variant.isActive ? 'Active' : 'Hidden'}
                  <span className="ml-3 text-sm font-normal text-slate-500">
                    {variant.inventory
                      ? `${variant.inventory.quantity - variant.inventory.reservedQuantity} available`
                      : 'No inventory'}
                  </span>
                </summary>
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
                  <ColorSelect value={variant.color} />
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
                <VariantStockControls variant={variant} save={save} busy={busy} />
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
              </details>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
