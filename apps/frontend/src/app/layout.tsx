import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/auth/AuthProvider';
import { DesignOrderProvider } from '@/components/DesignOrderProvider';

export const metadata: Metadata = {
  title: 'BANDIT - Wristbands & Fulfilment',
  description: 'Premium wristbands and fulfilment services',
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
