'use client';
import LoadingScreen from '@/components/LoadingScreen';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminData } from '@/admin/useAdminData';
import { money, label, inputClass, buttonClass } from '@/admin/api';
const statuses = [
  'AWAITING_WHATSAPP',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DISPATCHED',
  'COMPLETED',
  'CANCELLED',
];
type Row = {
  reference: string;
  status: string;
  createdAt: string;
  totalQuantity: number;
  subtotalMinor: string;
  quoteRequired: boolean;
  customer: { name: string; email: string } | null;
};
export default function Orders() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    setQuery(params.toString());
  }, []);
  const filters = new URLSearchParams(query);
  const { data, error, refresh } = useAdminData<{ items: Row[]; hasMore: boolean }>(
    `/orders?${query}&page=${page}`
  );
  return (
    <main>
      <h1 className="text-3xl font-bold">Orders</h1>
      <p className="mt-2 text-neutral-600">Review saved enquiries and prepare the next step.</p>
      <form
        key={query}
        className="my-6 grid items-end gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const params = new URLSearchParams();
          for (const [key, value] of form.entries()) if (value) params.set(key, String(value));
          setPage(1);
          setQuery(params.toString());
        }}
      >
        <label className="text-xs lg:col-span-2">
          Reference or customer email
          <input name="search" defaultValue={filters.get('search') ?? ''} className={inputClass} />
        </label>
        <label className="text-xs">
          Status
          <select name="status" defaultValue={filters.get('status') ?? ''} className={inputClass}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          From
          <input
            name="from"
            type="date"
            defaultValue={filters.get('from') ?? ''}
            className={inputClass}
          />
        </label>
        <label className="text-xs">
          Through
          <input
            name="to"
            type="date"
            defaultValue={filters.get('to') ?? ''}
            className={inputClass}
          />
        </label>
        <button className={buttonClass}>Filter orders</button>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="custom"
            value="true"
            defaultChecked={filters.get('custom') === 'true'}
          />
          Legacy orders requiring a quote
        </label>
      </form>
      {error ? (
        <div role="alert">
          {error}{' '}
          <button onClick={refresh} className={buttonClass}>
            Retry
          </button>
        </div>
      ) : !data ? (
        <LoadingScreen embedded label="Loading orders…" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  {['Order', 'Customer', 'Status', 'Units', 'Original subtotal'].map((t) => (
                    <th key={t} className="p-4">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.reference} className="border-b last:border-0">
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${row.reference}`}
                        className="block min-h-11 max-w-xs break-all font-semibold underline"
                      >
                        {row.reference}
                      </Link>
                      <span className="text-xs text-neutral-500">
                        {new Date(row.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.customer?.name ?? 'Guest'}
                      <p className="text-xs text-neutral-500">{row.customer?.email}</p>
                    </td>
                    <td className="whitespace-nowrap p-4 capitalize">{label(row.status)}</td>
                    <td className="p-4 tabular-nums">{row.totalQuantity}</td>
                    <td className="whitespace-nowrap p-4">
                      {money(row.subtotalMinor)}
                      {row.quoteRequired && (
                        <p className="text-xs text-amber-700">Additional quote required</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.items.length && (
              <p className="p-8 text-neutral-600">No orders match these filters.</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={page === 1}
              className={buttonClass}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-sm">Page {page}</span>
            <button
              disabled={!data.hasMore}
              className={buttonClass}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
