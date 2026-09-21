import Image from 'next/image';
import type { ProductSummaryDto } from '@bandit/shared';
import Link from 'next/link';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Link
      href={`/wristbands/${product.slug}`}
      className="overflow-hidden bg-white border rounded-lg group border-neutral-200"
    >
      <div className="relative aspect-[1.25] bg-neutral-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      </div>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase text-neutral-500">
          {product.brand?.name?.replace(/^bandit$/i, 'BAND-IT') ?? product.category.name}
        </p>
        <h2 className="mt-2 font-bold">{product.name}</h2>
        <div className="flex items-center justify-between mt-4 text-sm">
          <strong>From {money.format(product.basePrice)}</strong>
          <span className={product.availableQuantity ? 'text-green-700' : 'text-red-700'}>
            {product.availableQuantity ? 'In stock' : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}
