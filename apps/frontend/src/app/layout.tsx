import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BANDIT - Wristbands & Fulfilment',
  description: 'Premium wristbands and fulfilment services',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
