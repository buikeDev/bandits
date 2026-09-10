import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
