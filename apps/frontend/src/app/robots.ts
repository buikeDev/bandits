import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://band-it-frontend.onrender.com').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/order', '/track'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
