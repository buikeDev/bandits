'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/auth/api';
import Link from 'next/link';
import { fulfilmentLabel } from '@/admin/api';

type History = {
  page: number;
  hasMore: boolean;
  items: Array<{
    reference: string;
    status: string;
    deliveryMethod?: string;
    createdAt: string;
    message: string;
    totalQuantity: number;
    subtotalMinor: string;
    quoteRequired: boolean;
  }>;
};

export default function CustomerOrders() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setHistory(null);
    setError('');
    apiRequest<History>(`/orders/mine?page=${page}`)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load orders');
      });
    return () => {
      active = false;
    };
  }, [page, retry]);
  return (
    <section
      className="mt-10 border-t border-neutral-200 pt-8"
      aria-labelledby="order-history-heading"
    >
      <h2 id="order-history-heading" className="text-xl font-black">
        Your orders
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Orders placed while signed in are saved here. WhatsApp handoffs await confirmation; opening
        WhatsApp does not confirm payment or completion.
      </p>
      {error ? (
        <div className="mt-4">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <button className="button-secondary mt-3" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      ) : !history ? (
        <p role="status" className="mt-5 text-sm">
          Loading orders…
        </p>
      ) : (
        <>
          {!history.items.length && (
            <p className="mt-5 rounded-lg bg-neutral-50 p-6 text-sm">No orders on this page yet.</p>
          )}
          <div className="mt-5 space-y-4">
            {history.items.map((order) => (
              <article key={order.reference} className="rounded-lg border border-neutral-200 p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="break-all text-xs font-bold">{order.reference}</p>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                    {fulfilmentLabel(order.status, order.deliveryMethod)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-neutral-600">
                  {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                  {order.totalQuantity.toLocaleString()} wristbands
                </p>
                <p className="mt-2 font-bold">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                    Number(order.subtotalMinor) / 100
                  )}{' '}
                  {order.quoteRequired
                    ? 'priced subtotal · additional quote required'
                    : 'items total'}
                </p>
                <Link
                  href={`/account/orders/${order.reference}`}
                  className="my-3 inline-flex min-h-11 items-center text-sm font-semibold underline"
                >
                  View saved design and progress
                </Link>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    View order details
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded bg-neutral-50 p-4 font-sans text-xs leading-6">
                    {order.message}
                  </pre>
                </details>
              </article>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button
              className="button-secondary"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span className="text-sm">Page {page}</span>
            <button
              className="button-secondary"
              disabled={!history.hasMore}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
