'use client';
import { useEffect, useState } from 'react';
import { adminApi, AdminError } from './api';
export function useAdminData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    adminApi<T>(path)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof AdminError && cause.status === 401) {
          window.location.assign(
            `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
          );
          return;
        }
        setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, error, refresh: () => setRevision((v) => v + 1) };
}
