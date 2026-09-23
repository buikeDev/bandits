import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BAND-IT',
    short_name: 'BAND-IT',
    description: 'Wristbands, custom printing and fulfilment services.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f5c400',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
