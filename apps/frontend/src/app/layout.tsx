import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'BANDIT - Wristbands & Fulfilment',
  description: 'Premium wristbands and fulfilment services',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
