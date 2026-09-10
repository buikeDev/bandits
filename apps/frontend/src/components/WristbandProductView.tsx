'use client';

import type { ProductDetailDto } from '@bandit/shared';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import WristbandGallery from './WristbandPhotoGallery';
import WristbandOptions from './WristbandOptions';
import ProductFeatureIcon from './ProductFeatureIcon';
import { useDesignOrder } from './DesignOrderProvider';

const occasions = [
  ['Events & Festivals', 'Access control with style', 'festival', 'shield'],
  ['Clubs & Nightlife', 'Make your event unforgettable', 'nightlife', 'shield'],
  ['Corporate & Conferences', 'Professional and secure', 'conference', 'ticket'],
  ['Schools & Institutions', 'Simple and effective', 'wrist', 'shield'],
] as const;

export default function WristbandProductView({ product }: { product: ProductDetailDto }) {
  const [preview, setPreview] = useState({ name: 'Yellow', hex: '#ffc400' });
  const { items } = useDesignOrder();
  const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });
  return (
    <main className="reference-product">
      <nav className="product-topline">
        <Link href="/shop">
          ← <span>Back to wristbands</span>
        </Link>
        <Link
          href="/order"
          data-order-cart
          aria-label={`Cart, ${items.length} items`}
          className="product-cart"
        >
          <ProductFeatureIcon kind="ticket" />
          <span>{items.length}</span>
        </Link>
      </nav>
      <div className="product-columns">
        <WristbandGallery color={preview.hex} name={preview.name} />
        <div className="product-details">
          <p className="product-brand">
            {product.brand?.name?.replace(/^bandit$/i, 'BAND-IT') ?? 'BAND-IT'}
          </p>
          <h1>{product.name}</h1>
          <p className="product-description">
            {product.description} Lightweight, secure and customisable for any occasion.
          </p>
          <div className="product-features">
            {(['shield', 'feather', 'lock', 'sparkle'] as const).map((kind, index) => (
              <div key={kind}>
                <ProductFeatureIcon kind={kind} />
                <span>
                  {
                    [
                      'Tear & water resistant',
                      'All-day comfort',
                      'Secure fit',
                      'Fully customisable',
                    ][index]
                  }
                </span>
              </div>
            ))}
          </div>
          <WristbandOptions product={product} onColorChange={setPreview} />
          {product.pricingTiers.length > 0 && (
            <section className="product-bulk">
              <div>
                <h2>Bulk pricing</h2>
                <Link href="/order">Get a quote</Link>
              </div>
              <dl>
                {product.pricingTiers.map((tier) => (
                  <div key={tier.minQuantity}>
                    <dt>{tier.minQuantity}+ units</dt>
                    <dd>{money.format(tier.unitPrice)} each</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
      <section id="occasions" className="product-occasions" aria-label="Wristband use cases">
        {occasions.map(([title, description, file, icon]) => (
          <article key={title}>
            <div className="occasion-photo">
              <Image
                src={`/images/product-${file}.png`}
                alt={title}
                fill
                sizes="(min-width: 800px) 24vw, 50vw"
              />
            </div>
            <div className="occasion-caption">
              <ProductFeatureIcon kind={icon} />
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
