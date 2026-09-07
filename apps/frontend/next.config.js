import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default (phase) => ({
  ...nextConfig,
  // Keep production builds from overwriting a running dev server's chunks.
  distDir: process.env.NEXT_DIST_DIR || (phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'),
});
