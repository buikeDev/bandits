'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SavedOrderArtwork from '@/components/SavedOrderArtwork';
import { QuoteSummary } from '@/admin/OrderDetail';
import { label, money, fulfilmentLabel } from '@/admin/api';
import type { SavedLine, Quote } from '@/admin/types';
import { apiRequest } from '@/auth/api';
type Detail = {
  reference: string;
  status: string;
  paymentStatus: string;
  paidMinor: string;
  snapshot: { items: SavedLine[] };
  quote: Quote | null;
  calculated: boolean;
  subtotalMinor: string;
  totalMinor: string | null;
  deliveryMinor: string | null;
  deliveryMethod?: string;
  tracking?: string;
};
export default function Page({ params }: { params: { reference: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    apiRequest<Detail>(`/orders/mine/${encodeURIComponent(params.reference)}`)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [params.reference, retry]);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Link href="/account" className="inline-flex min-h-11 items-center underline">
          ← Your account
        </Link>
        <h1 className="mt-4 break-all text-2xl font-bold">{params.reference}</h1>
        {error ? (
          <div role="alert" className="my-6">
            <p>{error}</p>
            <button onClick={() => setRetry((v) => v + 1)} className="button-secondary mt-3">
              Retry
            </button>
            <Link href="/login" className="ml-4 underline">
              Sign in
            </Link>
          </div>
        ) : !data ? (
          <p role="status" className="my-6">
            Loading your order…
          </p>
        ) : (
          <>
            <div className="my-6 rounded-xl bg-neutral-50 p-5">
              <p className="capitalize">
                {fulfilmentLabel(data.status, data.deliveryMethod)} · {label(data.paymentStatus)}
              </p>
              <p className="mt-2 text-sm">Payments recorded: {money(data.paidMinor)}</p>
              {data.tracking && (
                <p className="mt-2 break-words text-sm">Delivery tracking: {data.tracking}</p>
              )}
            </div>
            {data.calculated && (
              <section className="rounded-xl border bg-white p-5">
                <h2 className="font-bold">Order price</h2>
                <p>Items: {money(data.subtotalMinor)}</p>
                <p>
                  Delivery:{' '}
                  {data.deliveryMinor === null ? 'Pending confirmation' : money(data.deliveryMinor)}
                </p>
                <p>
                  {data.deliveryMinor === null ? 'Subtotal before delivery' : 'Total'}:{' '}
                  {money(data.totalMinor ?? data.subtotalMinor)}
                </p>
              </section>
            )}
            {data.quote && (
              <section className="mb-6 rounded-xl border p-5">
                <h2 className="mb-4 text-lg font-bold">Agreed quote</h2>
                <QuoteSummary quote={data.quote} />
              </section>
            )}
            <h2 className="mb-4 text-lg font-bold">Your original order</h2>
            <SavedOrderArtwork items={data.snapshot.items} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
