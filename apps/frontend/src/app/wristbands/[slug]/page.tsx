'use client';

import type { ProductDetailDto } from '@bandit/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProduct } from '@/catalog/api';
import Header from '@/components/Header';
import { ProductSkeleton } from '@/components/CatalogSkeleton';
import Footer from '@/components/Footer';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError('');
    getProduct(slug)
      .then((result) => { if (active) setProduct(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load product'); });
    return () => { active = false; };
  }, [slug]);

  return <><Header /><main className="page-shell min-h-[70vh] py-12">
    <Link href="/shop" className="text-link">← Back to wristbands</Link>
    {error && <p role="alert" className="mt-10 text-red-700">{error}</p>}
    {!product && !error && <ProductSkeleton />}
    {product && <div className="mt-8 grid gap-10 lg:grid-cols-2">
      <div className="grid min-h-96 place-items-center rounded-xl bg-gradient-to-br from-amber-100 via-white to-blue-100 p-10"><span className="text-center text-4xl font-black">{product.category.name}</span></div>
      <div><p className="eyebrow">{product.brand?.name ?? 'BANDIT'}</p><h1 className="mt-3 text-4xl font-black">{product.name}</h1><p className="mt-5 leading-7 text-neutral-600">{product.description}</p><p className="mt-7 text-2xl font-black">From {money.format(product.basePrice)}</p>
        <h2 className="mt-8 font-black">Available options</h2><div className="mt-3 space-y-2">{product.variants.map((variant) => <div key={variant.id} className="flex justify-between rounded border p-3 text-sm"><span>{variant.name}{variant.material ? ` · ${variant.material}` : ''}</span><span>{variant.availableQuantity} available</span></div>)}</div>
        {product.pricingTiers.length > 0 && <><h2 className="mt-8 font-black">Bulk pricing</h2><div className="mt-3 overflow-hidden rounded border">{product.pricingTiers.map((tier) => <div key={tier.minQuantity} className="flex justify-between border-b p-3 text-sm last:border-0"><span>{tier.minQuantity}+ units</span><strong>{money.format(tier.unitPrice)} each</strong></div>)}</div></>}
        {product.customizationOptions.length > 0 && <><h2 className="mt-8 font-black">Customization</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{product.customizationOptions.map((option) => <li key={option.id}>{option.name}{option.priceAdjustment ? ` (+${money.format(option.priceAdjustment)})` : ''}</li>)}</ul></>}
        <p className="mt-8 rounded bg-neutral-100 p-4 text-sm">Cart and customization ordering will be enabled in the next commerce milestone.</p>
      </div>
    </div>}
  </main><Footer /></>;
}
