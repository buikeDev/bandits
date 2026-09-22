'use client';
import LoadingScreen from '@/components/LoadingScreen';
import { createContext, useContext, useEffect, useState } from 'react';
import DashboardFrame from './DashboardFrame';
import { usePathname, useRouter } from 'next/navigation';

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
    <DashboardFrame
      staff={staff}
      busy={busy}
      onSignOut={async () => {
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
    >
      {error ? (
        <div role="alert" className="admin-panel">
          <p>{error}</p>
          <button className={buttonClass + ' mt-3'} onClick={() => setRetry((v) => v + 1)}>
            Retry
          </button>
        </div>
      ) : !staff ? (
        <LoadingScreen embedded label="Checking staff access…" />
      ) : (
        <StaffContext.Provider value={staff}>{children}</StaffContext.Provider>
      )}
    </DashboardFrame>
  );
}
