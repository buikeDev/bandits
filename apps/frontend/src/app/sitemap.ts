import type { MetadataRoute } from 'next';
import { getServerProducts } from '@/catalog/server';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://band-it-frontend.onrender.com').replace(/\/+$/, '');
const staticPaths = ['', '/shop', '/custom', '/printing', '/bulk', '/fulfilment', '/company'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/shop' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/shop' ? 0.9 : 0.7,
  }));
  try {
    const firstPage = await getServerProducts(1);
    const pages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) => getServerProducts(index + 2))
    );
    for (const product of [firstPage, ...pages].flatMap((page) => page.items)) {
      entries.push({ url: `${siteUrl}/wristbands/${product.slug}`, changeFrequency: 'weekly', priority: 0.8 });
    }
  } catch {
    // Keep static URLs discoverable if the catalogue API is temporarily unavailable during sitemap generation.
  }
  return entries;
}
