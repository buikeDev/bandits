import type { Metadata } from 'next';
import AdminShell from '@/admin/AdminShell';
import '@/admin/admin.css';
import '@/admin/catalogue.css';
export const metadata: Metadata = {
  title: 'BAND-IT Staff',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
