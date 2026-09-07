import type { ProductSummaryDto } from '@bandit/shared';
import Link from 'next/link';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Link href={`/wristbands/${product.slug}`} className="group overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="grid aspect-[1.25] place-items-center bg-gradient-to-br from-amber-100 via-white to-blue-100 p-8">
        <span className="text-center text-lg font-black tracking-tight transition-transform group-hover:scale-105">{product.category.name}</span>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase text-neutral-500">{product.brand?.name ?? product.category.name}</p>
        <h2 className="mt-2 font-bold">{product.name}</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <strong>From {money.format(product.basePrice)}</strong>
          <span className={product.availableQuantity ? 'text-green-700' : 'text-red-700'}>{product.availableQuantity ? 'In stock' : 'Out of stock'}</span>
        </div>
      </div>
    </Link>
  );
}
