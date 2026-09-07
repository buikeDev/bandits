'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useDesignOrder } from '@/components/DesignOrderProvider';

export default function OrderPage() {
  const { items, ready, error, remove, updateQuantity } = useDesignOrder();
  return (
    <>
      <Header />
      <main className="page-shell min-h-[70vh] py-12">
        <p className="eyebrow">MADE BY YOU</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Your wristband order</h1>
        <p className="mt-4 text-sm text-neutral-600">
          Mix designs, choose your quantities, and bring everyone together.
        </p>
        {error && (
          <p role="alert" className="mt-5 rounded bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {!ready ? (
          <p role="status" className="mt-10">
            Loading your designs…
          </p>
        ) : !items.length ? (
          <div className="mt-8 rounded-xl bg-white p-10 text-center">
            <h2 className="text-xl font-bold">Your next great design starts here.</h2>
            <p className="mt-3 text-sm text-neutral-500">
              Add your first wristband to get started.
            </p>
            <Link href="/custom" className="button-primary mt-6">
              Design a wristband
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-neutral-200 bg-white p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-bold">
                      Design {index + 1} · {item.material}
                    </h2>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="text-xs underline"
                      aria-label={`Remove design ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    className="flex min-h-24 items-center justify-center gap-4 overflow-hidden rounded-lg border border-black/10 px-5 py-4"
                    style={{ backgroundColor: item.color, color: item.ink, fontFamily: item.font }}
                  >
                    {item.logo && (
                      <svg
                        width="48"
                        height="48"
                        role="img"
                        aria-label="Your logo"
                        className="shrink-0"
                      >
                        <image
                          href={item.logo}
                          width="48"
                          height="48"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </svg>
                    )}
                    <div className="min-w-0 text-center">
                      <p className="break-words text-lg font-black">{item.message}</p>
                      <p className="mt-1 break-words text-xs tracking-widest">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-neutral-500">
                      {item.colorName} band · {item.ink === '#ffffff' ? 'White' : 'Black'} print
                    </p>
                    <label className="flex items-center gap-3 text-xs font-bold">
                      Quantity
                      <input
                        key={`${item.id}-${item.quantity}`}
                        type="number"
                        min="1"
                        max="100000"
                        step="1"
                        defaultValue={item.quantity}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isInteger(value) && value >= 1 && value <= 100000)
                            updateQuantity(item.id, value);
                          else event.target.value = String(item.quantity);
                        }}
                        className="w-24 rounded border border-neutral-300 p-2 text-sm"
                      />
                    </label>
                  </div>
                </article>
              ))}
              <Link href="/custom" className="button-secondary w-full">
                + Add another design
              </Link>
            </div>
            <aside className="rounded-xl bg-white p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-black">Order summary</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <dt>Designs</dt>
                  <dd>{items.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Wristbands</dt>
                  <dd>{items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}</dd>
                </div>
              </dl>
              <p className="mt-6 border-t pt-5 text-xs leading-5 text-neutral-500">
                Your designs are saved in this browser, ready for when you place your order.
              </p>
              <button
                type="button"
                disabled
                aria-describedby="checkout-status"
                className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to checkout
              </button>
              <p id="checkout-status" className="mt-3 text-xs leading-5 text-neutral-500">
                WhatsApp checkout is coming soon. Your order has not been sent yet.
              </p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
