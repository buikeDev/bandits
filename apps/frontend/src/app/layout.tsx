import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/auth/AuthProvider';
import { DesignOrderProvider } from '@/components/DesignOrderProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://band-it-frontend.onrender.com'),
  title: { default: 'BAND-IT | Wristbands & Fulfilment', template: '%s | BAND-IT' },
  description: 'Wristbands, custom printing and fulfilment services for people, events and brands.',
  applicationName: 'BAND-IT',
  keywords: ['wristbands', 'custom wristbands', 'event wristbands', 'wristband printing', 'fulfilment'],
  category: 'ecommerce',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'BAND-IT',
    title: 'BAND-IT | Wristbands & Fulfilment',
    description: 'Wristbands, custom printing and fulfilment services for people, events and brands.',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'BAND-IT' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BAND-IT | Wristbands & Fulfilment',
    description: 'Wristbands, custom printing and fulfilment services for people, events and brands.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DesignOrderProvider>{children}</DesignOrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
