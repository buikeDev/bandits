import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      {
        // Report-only first: the app relies on external image storage, OAuth and JSON-LD.
        // Enforce only after checking real storefront and staff journeys in production.
        key: 'Content-Security-Policy-Report-Only',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "img-src 'self' blob: data: https:",
          "font-src 'self' data: https:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline'",
          "connect-src 'self' https:",
          "frame-src 'none'",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
    }
    return [{ source: '/:path*', headers }];
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL?.replace(/\/+$/, '');
    if (!backend) return [];
    const destination = new URL(backend);
    if (
      !['http:', 'https:'].includes(destination.protocol) ||
      destination.username ||
      destination.password ||
      destination.pathname !== '/' ||
      destination.search ||
      destination.hash
    ) {
      throw new Error('BACKEND_URL must be an HTTP(S) origin without a path or credentials.');
    }
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default (phase) => ({
  ...nextConfig,
  // Keep production builds from overwriting a running dev server's chunks.
  distDir:
    process.env.NEXT_DIST_DIR || (phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'),
});
