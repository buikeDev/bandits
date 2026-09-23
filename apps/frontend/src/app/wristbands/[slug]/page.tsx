import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WristbandProductView from '@/components/WristbandProductView';
import '../product-reference.css';
import { getServerProduct } from '@/catalog/server';

type ProductPageProps = { params: { slug: string } };

function productDescription(name: string, description: string): string {
  return `${description} Shop ${name} from BAND-IT.`.slice(0, 160);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getServerProduct(params.slug);
    if (!product) return { title: 'Product not found | BAND-IT', robots: { index: false } };
    const description = productDescription(product.name, product.description);
    return {
      title: `${product.name} | BAND-IT`,
      description,
      alternates: { canonical: `/wristbands/${product.slug}` },
      openGraph: {
        type: 'website',
        title: `${product.name} | BAND-IT`,
        description,
        url: `/wristbands/${product.slug}`,
        images: [{ url: product.imageUrl, alt: product.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | BAND-IT`,
        description,
        images: [product.imageUrl],
      },
    };
  } catch {
    return { title: 'Wristbands | BAND-IT' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getServerProduct(params.slug).catch(() => null);
  if (!product) notFound();
  const lowestBasePrice = Math.min(
    product.basePrice,
    ...product.pricingTiers.map((tier) => tier.unitPrice)
  );
  const lowestVariantAdjustment = Math.min(
    0,
    ...product.variants.map((variant) => variant.priceAdjustment)
  );
  const highestVariantAdjustment = Math.max(
    0,
    ...product.variants.map((variant) => variant.priceAdjustment)
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: [...new Set([product.imageUrl, ...(product.images ?? [])])],
    sku: product.variants.map((variant) => variant.sku),
    brand: { '@type': 'Brand', name: product.brand?.name ?? 'BAND-IT' },
    category: product.category.name,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'NGN',
      lowPrice: lowestBasePrice + lowestVariantAdjustment,
      highPrice: product.basePrice + highestVariantAdjustment,
      offerCount: product.variants.length,
      availability:
        product.availableQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `/wristbands/${product.slug}`,
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <WristbandProductView product={product} />
    </>
  );
}
