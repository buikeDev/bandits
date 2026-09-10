'use client';

import WristbandProductView from '@/components/WristbandProductView';
import '../product-reference.css';

import type { ProductDetailDto } from '@bandit/shared';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProduct } from '@/catalog/api';
import { ProductSkeleton } from '@/components/CatalogSkeleton';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError('');
    getProduct(slug)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load product');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return product ? (
    <WristbandProductView key={product.id} product={product} />
  ) : (
    <main className="page-shell py-12">{error ? <p role="alert">{error}</p> : <ProductSkeleton />}</main>
  );
}
