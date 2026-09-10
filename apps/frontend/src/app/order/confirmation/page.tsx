'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { WhatsAppOrderDto } from '@bandit/shared';
import Header from '@/components/Header';
import { useAuth } from '@/auth/AuthProvider';

export default function CheckoutConfirmation() {
  const { customer, loading } = useAuth();
  const [receipt, setReceipt] = useState<{
    order: WhatsAppOrderDto;
    customerId: string | null;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (loading) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem('band-it-checkout-receipt') ?? 'null');
      if (
        saved?.customerId === (customer?.id ?? null) &&
        typeof saved?.order?.message === 'string' &&
        typeof saved?.order?.reference === 'string' &&
        saved?.order?.phone === '2349137132516'
      ) {
        setReceipt(saved);
        const link = `https://wa.me/${saved.order.phone}?text=${encodeURIComponent(saved.order.message)}`;
        if (saved.autoOpen) {
          sessionStorage.setItem(
            'band-it-checkout-receipt',
            JSON.stringify({ ...saved, autoOpen: false })
          );
          if (link.length <= 7000) window.location.assign(link);
        }
      }
    } catch {
      setNotice(
        'The local receipt could not be loaded. Signed-in orders are available in your account.'
      );
    }
    setReady(true);
  }, [customer?.id, loading]);
  const order = receipt?.customerId === (customer?.id ?? null) ? receipt.order : null;
  const link = order
    ? `https://wa.me/${order.phone}?text=${encodeURIComponent(order.message)}`
    : '';
  const long = link.length > 7000;
  return (
    <>
      <Header />
      <main className="page-shell py-12">
        <section className="mx-auto max-w-2xl rounded-xl bg-white p-6 sm:p-10">
          <h1 className="text-3xl font-black">
            {order ? 'Your order has been saved' : 'Checkout confirmation'}
          </h1>
          {!ready || loading ? (
            <p role="status" className="mt-5">
              Loading receipt…
            </p>
          ) : order ? (
            <>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                Your checked-out items have been cleared from the cart. Tap Send in WhatsApp to
                finish contacting us. Your order is awaiting confirmation, and payment has not been
                confirmed.
              </p>
              <p className="mt-5 break-all text-sm font-bold">Reference: {order.reference}</p>
              {long && (
                <p className="mt-4 text-sm">
                  Copy the message below, open WhatsApp, then paste and send it.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="button-primary" href={long ? `https://wa.me/${order.phone}` : link}>
                  Open WhatsApp
                </a>
                <button
                  className="button-secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(order.message);
                      setNotice('Order details copied.');
                    } catch {
                      setNotice('Select and copy the message below.');
                    }
                  }}
                >
                  Copy order details
                </button>
              </div>
              <label className="mt-6 block text-sm font-bold">
                Order details
                <textarea
                  readOnly
                  value={order.message}
                  rows={12}
                  className="mt-2 w-full rounded border border-neutral-300 p-4 text-sm font-normal"
                />
              </label>
            </>
          ) : (
            <p className="mt-5 text-sm">
              No receipt is available in this browser session. You can check your account for saved
              orders.
            </p>
          )}
          <p role="status" className="mt-4 text-sm">
            {notice}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link className="text-sm font-bold underline" href="/shop">
              Continue shopping
            </Link>
            {customer && (
              <Link className="text-sm font-bold underline" href="/account">
                View your orders
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
