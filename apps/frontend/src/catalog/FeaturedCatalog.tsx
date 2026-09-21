'use client';

import type { ProductSummaryDto } from '@bandit/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProducts } from './api';
import { ProductCard } from './ProductCard';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';

export function FeaturedCatalog() {
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts(
      new URLSearchParams({ kind: 'WRISTBAND', sort: 'featured', featured: 'true', limit: '4' })
    )
      .then((result) => setProducts(result.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !products.length) return null;
  return (
    <section className="bg-white pb-14">
      <div className="page-shell">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="section-title">Featured wristbands</h2>
          <Link href="/shop" className="text-link">
            Browse catalog →
          </Link>
        </div>
        {loading ? (
          <CatalogSkeleton count={4} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
