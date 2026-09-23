'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

type Tracking = { reference: string; status: string; deliveryMethod: string | null; tracking: string; updatedAt: string };
const label = (value: string) => ({ AWAITING_WHATSAPP: 'Order received', CONFIRMED: 'Confirmed', IN_PRODUCTION: 'In production', READY: 'Ready', DISPATCHED: 'On route', COMPLETED: 'Completed', CANCELLED: 'Cancelled' } as Record<string, string>)[value] ?? value;

export default function TrackingPage({ params }: { params: { reference: string } }) {
  const [data, setData] = useState<Tracking | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setError('This tracking link is incomplete.'); return; }
    void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/orders/track/${encodeURIComponent(params.reference)}?token=${encodeURIComponent(token)}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error ?? 'Tracking is unavailable.'); return body.data as Tracking; })
      .then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : 'Tracking is unavailable.'));
  }, [params.reference]);
  return <><Header /><main className="page-shell min-h-[65vh] py-12"><section className="mx-auto max-w-xl rounded-xl bg-white p-6 sm:p-10"><p className="eyebrow">PRIVATE ORDER TRACKING</p><h1 className="mt-3 text-3xl font-black">Your BAND-IT order</h1>{error ? <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : !data ? <p role="status" className="mt-6 text-sm">Loading order status...</p> : <div className="mt-6 space-y-4"><p className="break-all text-sm font-bold">Reference: {data.reference}</p><div className="rounded-lg bg-yellow-50 p-5"><p className="text-xs font-bold uppercase tracking-wide">Current status</p><p className="mt-2 text-2xl font-black">{label(data.status)}</p></div>{data.deliveryMethod && <p className="text-sm">Delivery method: {data.deliveryMethod === 'COLLECTION' ? 'Pickup' : 'Delivery'}</p>}{data.tracking && <p className="break-words text-sm">Courier / tracking reference: <strong>{data.tracking}</strong></p>}<p className="text-xs text-neutral-500">Last updated {new Date(data.updatedAt).toLocaleString()}</p><p className="border-t pt-4 text-sm text-neutral-600">For payment, delivery or return questions, reply in your BAND-IT WhatsApp conversation with this reference.</p></div>}</section></main></>;
}
