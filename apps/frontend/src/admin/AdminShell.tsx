'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { adminApi, AdminError, buttonClass } from './api';
import type { Staff } from './types';
const StaffContext = createContext<Staff | null>(null);
export const useStaff = () => useContext(StaffContext);
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (path === '/admin/login') return;
    let active = true;
    setStaff(null);
    setError('');
    adminApi<Staff>('/me')
      .then((value) => {
        if (active) setStaff(value);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof AdminError && cause.status === 401)
          router.replace(`/admin/login?next=${encodeURIComponent(path)}`);
        else setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [path, router, retry]);
  if (path === '/admin/login') return <>{children}</>;
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/admin" aria-label="BAND-IT dashboard">
            <BrandLogo className="w-36" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span>{staff?.name}</span>
            {staff && (
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await adminApi('/logout', {});
                    setStaff(null);
                    router.replace('/admin/login');
                  } catch (cause) {
                    setError((cause as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="min-h-11 px-2"
              >
                Sign out
              </button>
            )}
            <Link href="/" className="min-h-11 content-center underline">
              Storefront
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-6">
        <nav aria-label="Admin navigation" className="mb-8 flex flex-wrap gap-2">
          {[
            ['/admin', 'Overview'],
            ['/admin/orders', 'Orders'],
            ['/admin/security', 'Account security'],
            ...(staff?.role === 'ADMIN'
              ? [
                  ['/admin/products', 'Catalogue & stock'],
                  ['/admin/staff', 'Staff'],
                ]
              : []),
          ].map(([href, text]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className={`min-h-11 rounded-lg px-4 py-3 text-sm font-semibold ${path === href ? 'bg-yellow-400 text-black' : 'bg-white text-neutral-600'}`}
            >
              {text}
            </Link>
          ))}
        </nav>
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-6">
            <p>{error}</p>
            <button className={`${buttonClass} mt-3`} onClick={() => setRetry((v) => v + 1)}>
              Retry
            </button>
          </div>
        ) : !staff ? (
          <p role="status">Checking staff access…</p>
        ) : (
          <StaffContext.Provider value={staff}>{children}</StaffContext.Provider>
        )}
      </div>
    </div>
  );
}
