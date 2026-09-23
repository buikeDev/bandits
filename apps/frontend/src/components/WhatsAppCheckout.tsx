'use client';

import { useRef, useState } from 'react';
import type { ApiResponse, WhatsAppOrderDto } from '@bandit/shared';
import type { DesignItem } from './DesignOrderProvider';
import { useDesignOrder } from './DesignOrderProvider';
import { useAuth } from '@/auth/AuthProvider';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function WhatsAppCheckout({
  items,
  disabled,
  expectedSubtotalMinor,
}: {
  items: DesignItem[];
  disabled: boolean;
  expectedSubtotalMinor?: number;
}) {
  const { clearCheckedOut } = useDesignOrder();
  const { customer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [prepared, setPrepared] = useState<{ cart: string; order: WhatsAppOrderDto } | null>(null);
  const cart = JSON.stringify(items);
  const currentCart = useRef(cart);
  currentCart.current = cart;
  const order = prepared?.cart === cart ? prepared.order : null;
  const url = order ? `https://wa.me/${order.phone}?text=${encodeURIComponent(order.message)}` : '';
  // Long messages remain complete in the copyable preview instead of being silently truncated.
  const needsCopy = url.length > 7000;

  async function checkout() {
    if (lock.current || disabled || authLoading || !items.length) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${customer?.id ?? 'guest'}:${cart}`)
      );
      const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
      const key = 'band-it-whatsapp-checkout-v2';
      let requestId = crypto.randomUUID();
      const previous = sessionStorage.getItem(key);
      if (previous) {
        try {
          const saved = JSON.parse(previous);
          if (saved.fingerprint === fingerprint && typeof saved.requestId === 'string')
            requestId = saved.requestId;
        } catch {
          /* Replace an unreadable checkout token. The cart remains untouched. */
        }
      }
      sessionStorage.setItem(key, JSON.stringify({ fingerprint, requestId }));
      const result = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, items, expectedSubtotalMinor }),
        signal: AbortSignal.timeout(30000),
      });
      if (result.status === 413)
        throw new Error('The artwork is too large. Use smaller images and try again.');
      if (!result.headers.get('content-type')?.includes('application/json'))
        throw new Error('Checkout is unavailable. Please try again shortly.');
      const body = (await result.json()) as ApiResponse<WhatsAppOrderDto>;
      if (!result.ok || !body.success || !body.data)
        throw new Error(body.error || 'Your order could not be saved. Please try again.');
      if (currentCart.current !== cart) {
        throw new Error(
          'Your cart changed while saving. Continue to checkout again to use the updated order.'
        );
      }
      setPrepared({ cart, order: body.data });
      sessionStorage.setItem(
        'band-it-checkout-receipt',
        JSON.stringify({
          order: body.data,
          customerId: customer?.id ?? null,
          autoOpen: true,
        })
      );
      if (!clearCheckedOut(items))
        throw new Error(
          'Order saved, but your cart could not be cleared. Please enable browser storage and retry.'
        );
      sessionStorage.removeItem(key);
      router.push('/order/confirmation');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to prepare your order. Your cart is still saved.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function copy() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.message);
      setCopied(true);
    } catch {
      setError('Copy was unavailable. Select and copy the order message below.');
    }
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-5">
      <p className="text-xs leading-5 text-neutral-600">
        Checkout saves your order and artwork with BAND-IT, then opens WhatsApp. Tap Send in
        WhatsApp to contact us. Delivery and payment are arranged there.
      </p>
      <button
        type="button"
        onClick={() => void checkout()}
        disabled={disabled || busy || authLoading || !items.length}
        aria-busy={busy}
        aria-describedby="checkout-status"
        className="button-primary mt-5 w-full"
      >
        {busy ? 'Saving your order…' : 'Checkout on WhatsApp'}
      </button>
      <p id="checkout-status" role="status" className="mt-3 text-xs leading-5 text-neutral-600">
        {order
          ? `Order ${order.reference} saved. Sending the message and payment are not yet confirmed.`
          : 'After your order is saved, checked-out items are removed from your cart. Payment is confirmed separately.'}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {order && (
        <div className="mt-4 space-y-3">
          {needsCopy && (
            <p className="text-xs leading-5 text-amber-800">
              This order is too long to prefill reliably. Copy the full details below, open
              WhatsApp, then paste and send.
            </p>
          )}
          <a
            href={needsCopy ? `https://wa.me/${order.phone}` : url}
            className="button-secondary w-full"
          >
            Open WhatsApp {needsCopy ? '' : 'again'}
          </a>
          <button type="button" onClick={() => void copy()} className="button-secondary w-full">
            {copied ? 'Copied order details' : 'Copy order details'}
          </button>
          <label className="block text-xs font-bold">
            Saved order message
            <textarea
              readOnly
              value={order.message}
              rows={10}
              className="mt-2 w-full rounded border border-neutral-300 p-3 text-xs font-normal leading-5"
            />
          </label>
        </div>
      )}
    </div>
  );
}
