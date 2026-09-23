'use client';
import { useEffect, useState } from 'react';
import { orderItems, type DesignItem } from './DesignOrderProvider';
type Price = {
  lines: {
    unitMinor: number;
    materialUnitMinor: number;
    customizationUnitMinor: number;
    totalMinor: number;
  }[];
  subtotalMinor: number;
};
export function useOrderPrice(items: DesignItem[]) {
  const key = JSON.stringify(orderItems(items));
  const [result, setResult] = useState<{ key: string; data?: Price; error?: string }>({ key: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!items.length) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/orders/price`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: crypto.randomUUID(), items: JSON.parse(key) }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.headers.get('content-type')?.includes('application/json'))
            throw new Error('Pricing is temporarily unavailable. Please retry.');
          const body = await response.json();
          if (!response.ok || !body.success) throw new Error(body.error || 'Pricing unavailable');
          return body.data as Price;
        })
        .then((data) => {
          if (!controller.signal.aborted) setResult({ key, data });
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setResult({
              key,
              error: error instanceof Error ? error.message : 'Pricing unavailable',
            });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // key includes every field affecting the submitted order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry]);
  return {
    data: result.key === key ? result.data : undefined,
    error: result.key === key ? result.error : undefined,
    loading: items.length > 0 && result.key !== key,
    retry: () => {
      setResult({ key: '' });
      setRetry((v) => v + 1);
    },
  };
}
