'use client';
import LoadingScreen from '@/components/LoadingScreen';
import { useState } from 'react';
import Link from 'next/link';
import { useAdminData } from './useAdminData';
import { adminApi, money, label, fulfilmentLabel, inputClass, buttonClass } from './api';
import type { Order, Quote } from './types';
import SavedOrderArtwork from '@/components/SavedOrderArtwork';
const transitions: Record<string, string[]> = {
  AWAITING_WHATSAPP: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'READY', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['DISPATCHED', 'COMPLETED', 'CANCELLED'],
  DISPATCHED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};
function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {title}
      {children}
    </label>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
export function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-2 text-sm">
      {quote.lines.map((line, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span>
            {line.name} × {line.quantity}
          </span>
          <span className="whitespace-nowrap">{money(line.totalMinor)}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span>Printing</span>
        <span>{money(quote.printingMinor)}</span>
      </div>
      <div className="flex justify-between">
        <span>Delivery</span>
        <span>{money(quote.deliveryMinor)}</span>
      </div>
      <div className="flex justify-between border-t pt-2 font-bold">
        <span>Final total</span>
        <span>{money(quote.totalMinor)}</span>
      </div>
    </div>
  );
}
export default function OrderDetail({ reference }: { reference: string }) {
  const { data, error, refresh } = useAdminData<Order>(`/orders/${encodeURIComponent(reference)}`);
  if (error)
    return (
      <div role="alert">
        {error}{' '}
        <button className={buttonClass} onClick={refresh}>
          Retry
        </button>
      </div>
    );
  if (!data) return <LoadingScreen embedded label="Loading order and artwork…" />;
  return (
    <OrderEditor
      key={`${reference}-${data.workflow?.version ?? 0}`}
      order={data}
      refresh={refresh}
    />
  );
}
function OrderEditor({ order, refresh }: { order: Order; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const workflow = order.workflow;
  const quote = workflow?.quotes[0];
  const accepted = workflow?.quotes.find((q) => q.id === workflow.acceptedQuoteId);
  const version = workflow?.version ?? 0;
  const save = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await adminApi(`/orders/${order.reference}/actions`, { ...body, version });
      refresh();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const minor = (form: FormData, key: string) => Math.round(Number(form.get(key)) * 100);
  return (
    <main>
      <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm underline">
        ← All orders
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="max-w-2xl break-all text-xl font-bold sm:text-2xl">{order.reference}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {new Date(order.createdAt).toLocaleString()} ·{' '}
            {order.customer ? `${order.customer.name} (${order.customer.email})` : 'Guest enquiry'}
          </p>
        </div>
        <div className="flex gap-2 text-sm capitalize">
          <span className="rounded-full bg-yellow-200 px-3 py-2">
            {fulfilmentLabel(order.status, workflow?.deliveryMethod)}
          </span>
          <span className="rounded-full bg-white px-3 py-2">{label(order.paymentStatus)}</span>
        </div>
      </div>
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p>{error}</p>
          <button onClick={refresh} className="mt-2 min-h-11 underline">
            Refresh order
          </button>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <Section title="Original order">
            <p className="text-sm text-neutral-600">
              {order.totalQuantity.toLocaleString()} units · {money(order.subtotalMinor)} original
              priced subtotal{order.quoteRequired ? ' · additional quote required' : ''}
            </p>
            <SavedOrderArtwork items={order.snapshot.items} />
          </Section>
          <Section title="Saved WhatsApp message">
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-6">
              {order.message}
            </pre>
          </Section>
          <Section title="Staff activity">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void save({ action: 'note', note: new FormData(e.currentTarget).get('note') });
              }}
            >
              <Field title="Internal note">
                <textarea name="note" required maxLength={3000} className={inputClass} />
              </Field>
              <button disabled={busy} className={buttonClass}>
                Add note
              </button>
            </form>
            <p className="text-xs text-neutral-500">Notes are visible only to staff.</p>
            <ol className="space-y-4">
              {workflow?.events.map((event) => (
                <li key={event.id} className="border-t pt-3 text-sm">
                  <p className="whitespace-pre-wrap break-words">{event.note}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {event.staffName} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Contact & delivery">
            <p className="text-sm text-neutral-600">
              Collect these details in WhatsApp. You can accept the order and reserve stock now;
              contact details are required before dispatch or collection.
            </p>
            {(!workflow?.contactName ||
              !workflow?.contactPhone ||
              (workflow.deliveryMethod === 'DELIVERY' && !workflow.deliveryAddress)) && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Still to collect: contact name, phone and delivery address if sending by courier.
                Agree on delivery or pickup and record it below.
              </p>
            )}
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void save({ action: 'contact', ...Object.fromEntries(form) });
              }}
            >
              <Field title="Contact name">
                <input
                  name="contactName"
                  defaultValue={workflow?.contactName || order.customer?.name}
                  required
                  maxLength={150}
                  className={inputClass}
                />
              </Field>
              <Field title="Phone / WhatsApp">
                <input
                  name="contactPhone"
                  type="tel"
                  defaultValue={workflow?.contactPhone}
                  required
                  maxLength={40}
                  className={inputClass}
                />
              </Field>
              <Field title="Method">
                <select
                  name="deliveryMethod"
                  defaultValue={workflow?.deliveryMethod ?? 'COLLECTION'}
                  className={inputClass}
                >
                  <option value="COLLECTION">Collection</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </Field>
              <Field title="Delivery address">
                <textarea
                  name="deliveryAddress"
                  defaultValue={workflow?.deliveryAddress}
                  maxLength={1000}
                  className={inputClass}
                />
              </Field>
              <Field title="Courier / tracking reference">
                <input
                  name="tracking"
                  defaultValue={workflow?.tracking}
                  maxLength={300}
                  className={inputClass}
                />
              </Field>
              <button
                disabled={busy || ['DISPATCHED', 'COMPLETED', 'CANCELLED'].includes(order.status)}
                className={buttonClass}
              >
                Save details
              </button>
            </form>
          </Section>
          {order.calculated ? (
            <Section title="Calculated order price">
              <p>
                Items: <strong>{money(order.subtotalMinor)}</strong>
              </p>
              <p>
                Delivery:{' '}
                {order.deliveryMinor === null ? 'Pending confirmation' : money(order.deliveryMinor)}
              </p>
              <p>
                {order.deliveryMinor === null ? 'Subtotal before delivery' : 'Total'}:{' '}
                <strong>{money(order.totalMinor ?? order.subtotalMinor)}</strong>
              </p>
              {workflow?.deliveryMethod === 'DELIVERY' && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void save({
                      action: 'deliveryFee',
                      deliveryMinor: minor(form, 'delivery'),
                      note: form.get('note'),
                    });
                  }}
                >
                  <Field title="Delivery charge (NGN)">
                    <input
                      name="delivery"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className={inputClass}
                      defaultValue={
                        order.deliveryMinor === null ? '' : Number(order.deliveryMinor) / 100
                      }
                    />
                  </Field>
                  <Field title="Delivery charge record">
                    <input name="note" required maxLength={1000} className={inputClass} />
                  </Field>
                  <button
                    disabled={
                      busy || ['DISPATCHED', 'COMPLETED', 'CANCELLED'].includes(order.status)
                    }
                    className={buttonClass}
                  >
                    Save delivery charge
                  </button>
                </form>
              )}
            </Section>
          ) : (
            <Section title="Legacy quote & customer agreement">
              {accepted ? (
                <>
                  <p className="text-sm text-green-800">Customer acceptance recorded.</p>
                  <QuoteSummary quote={accepted} />
                </>
              ) : (
                <>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void save({
                        action: 'quote',
                        lines: order.snapshot.items.map((_item, i) => ({
                          unitMinor: minor(form, `unit-${i}`),
                        })),
                        printingMinor: minor(form, 'printing'),
                        deliveryMinor: minor(form, 'delivery'),
                        note: form.get('note'),
                      });
                    }}
                  >
                    {order.snapshot.items.map((item, i) => (
                      <Field
                        key={i}
                        title={`${i + 1}. ${item.name} — unit price (NGN), × ${item.quantity}`}
                      >
                        <input
                          name={`unit-${i}`}
                          type="number"
                          min="0"
                          max="1000000000"
                          step="0.01"
                          required
                          defaultValue={(quote?.lines[i]?.unitMinor ?? item.unitMinor ?? 0) / 100}
                          className={inputClass}
                        />
                      </Field>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <Field title="Printing (NGN)">
                        <input
                          name="printing"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          defaultValue={Number(quote?.printingMinor ?? 0) / 100}
                          className={inputClass}
                        />
                      </Field>
                      <Field title="Delivery (NGN)">
                        <input
                          name="delivery"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          defaultValue={Number(quote?.deliveryMinor ?? 0) / 100}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <Field title="Quote note">
                      <textarea name="note" maxLength={1000} className={inputClass} />
                    </Field>
                    <button
                      disabled={busy || order.status !== 'AWAITING_WHATSAPP'}
                      className={buttonClass}
                    >
                      {quote ? 'Save revised quote' : 'Prepare quote'}
                    </button>
                  </form>
                  {quote && (
                    <div className="space-y-4 border-t pt-4">
                      <QuoteSummary quote={quote} />
                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void save({
                            action: 'acceptQuote',
                            quoteId: quote.id,
                            note: new FormData(e.currentTarget).get('note'),
                          });
                        }}
                      >
                        <Field title="Customer acceptance record">
                          <textarea
                            name="note"
                            placeholder="Who agreed, when, and through which channel?"
                            required
                            maxLength={1000}
                            className={inputClass}
                          />
                        </Field>
                        <button
                          disabled={busy || order.status !== 'AWAITING_WHATSAPP'}
                          className={buttonClass}
                        >
                          Record customer acceptance
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
              {(workflow?.quotes.length ?? 0) > 1 && (
                <details>
                  <summary className="cursor-pointer text-sm">Previous quote revisions</summary>
                  <div className="mt-3 space-y-4">
                    {workflow?.quotes.slice(1).map((q) => (
                      <div key={q.id} className="border-t pt-3">
                        <p className="mb-2 text-xs">
                          {new Date(q.createdAt!).toLocaleString()} · {q.note}
                        </p>
                        <QuoteSummary quote={q} />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </Section>
          )}
          <Section title="Payments">
            <p className="text-sm text-neutral-600">
              Send bank instructions through WhatsApp. Check the bank receipt before recording
              payment here. Payment status updates from recorded payments; accepting an order does
              not mark it paid.
            </p>
            <p className="text-sm">
              Net received: <strong>{money(order.paidMinor)}</strong>
              {order.totalMinor !== null && (
                <>
                  {' '}
                  · Balance:{' '}
                  <strong>{money(Number(order.totalMinor) - Number(order.paidMinor))}</strong>
                </>
              )}
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void save({
                  action: 'payment',
                  kind: form.get('kind'),
                  amountMinor: minor(form, 'amount'),
                  reference: form.get('reference'),
                });
              }}
            >
              <Field title="Record type">
                <select name="kind" className={inputClass}>
                  <option value="PAYMENT">Payment received</option>
                  <option value="REFUND">Refund issued</option>
                </select>
              </Field>
              <Field title="Amount (NGN)">
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </Field>
              <Field title="Bank / receipt reference">
                <input
                  name="reference"
                  required
                  minLength={3}
                  maxLength={150}
                  className={inputClass}
                />
              </Field>
              <p className="text-xs text-neutral-600">
                Record only verified receipts or refunds. This does not move money.
              </p>
              <button disabled={busy || order.totalMinor === null} className={buttonClass}>
                Record transaction
              </button>
            </form>
            <ul className="space-y-2 text-sm">
              {workflow?.payments.map((p) => (
                <li key={p.id} className="border-t pt-2">
                  <span className="capitalize">{label(p.kind)}</span> · {money(p.amountMinor)}
                  <p className="break-all text-xs text-neutral-500">
                    {p.reference} · {new Date(p.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Order progress">
            {transitions[order.status]?.length ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  void save({
                    action: 'status',
                    status: form.get('status'),
                    note: form.get('note'),
                  });
                }}
              >
                <Field title="Next status">
                  <select name="status" className={inputClass}>
                    {transitions[order.status]
                      .filter((s) => s !== 'DISPATCHED' || workflow?.deliveryMethod === 'DELIVERY')
                      .filter(
                        (s) =>
                          s !== 'COMPLETED' ||
                          order.status === 'DISPATCHED' ||
                          workflow?.deliveryMethod === 'COLLECTION'
                      )
                      .map((s) => (
                        <option value={s} key={s}>
                          {fulfilmentLabel(s, workflow?.deliveryMethod)}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field title="Reason / fulfilment record">
                  <textarea name="note" required maxLength={1000} className={inputClass} />
                </Field>
                <button disabled={busy} className={buttonClass}>
                  Update progress
                </button>
              </form>
            ) : (
              <p className="text-sm">
                This order is {fulfilmentLabel(order.status, workflow?.deliveryMethod)}.
              </p>
            )}
            <p className="text-xs text-neutral-600">
              Confirmation reserves the selected blank wristband stock for plain and custom orders.
            </p>
            {workflow?.reservations.map((r) => (
              <p key={r.id} className="text-xs">
                {r.quantity} units · {label(r.state)}
              </p>
            ))}
          </Section>
        </div>
      </div>
    </main>
  );
}
