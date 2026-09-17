'use client';
import Link from 'next/link';
import { useAdminData } from '@/admin/useAdminData';
import { money, label, buttonClass } from '@/admin/api';
export default function Overview() {
  const { data, error, refresh } = useAdminData<{
    counts: { status: string; _count: number }[];
    payments: { kind: string; _sum: { amountMinor: string | null } }[];
    lowStock: number;
    needsQuote: number;
    outstandingMinor: string;
  }>('/overview');
  return (
    <main>
      <h1 className="text-3xl font-bold">Today’s workspace</h1>
      <p className="mt-2 text-neutral-600">Follow enquiries through to delivery.</p>
      {error ? (
        <div role="alert" className="mt-6">
          {error}{' '}
          <button className={buttonClass} onClick={refresh}>
            Retry
          </button>
        </div>
      ) : !data ? (
        <p role="status" className="mt-6">
          Loading overview…
        </p>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['AWAITING_WHATSAPP', 'CONFIRMED', 'IN_PRODUCTION', 'READY'].map((status) => (
              <Link
                href={`/admin/orders?status=${status}`}
                key={status}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <p className="text-sm capitalize text-neutral-600">{label(status)}</p>
                <p className="mt-3 text-4xl font-bold tabular-nums">
                  {data.counts.find((c) => c.status === status)?._count ?? 0}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm text-neutral-600">Enquiries awaiting a quote</h2>
              <p className="mt-3 text-2xl font-bold">{data.needsQuote}</p>
            </section>
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm text-neutral-600">Outstanding accepted balances</h2>
              <p className="mt-3 text-2xl font-bold">{money(data.outstandingMinor)}</p>
              <p className="mt-2 text-xs text-neutral-500">
                Excludes cancelled orders and unaccepted quotes.
              </p>
            </section>
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm text-neutral-600">Net payments recorded · all time</h2>
              <p className="mt-3 text-2xl font-bold">
                {money(
                  data.payments.reduce(
                    (sum, row) =>
                      sum + (row.kind === 'PAYMENT' ? 1 : -1) * Number(row._sum.amountMinor ?? 0),
                    0
                  )
                )}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Recorded receipts minus refunds; excludes unpaid enquiries.
              </p>
            </section>
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm text-neutral-600">Variants below 100 available units</h2>
              <p className="mt-3 text-2xl font-bold">{data.lowStock}</p>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
