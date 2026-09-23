'use client';

import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';
import { buttonClass } from './api';
import { useAdminData } from './useAdminData';

const statusLabel = (status: string) => status.toLowerCase().replace(/_/g, ' ');
type Item = { reference: string; business: string; name: string; status: string; createdAt: string };

export default function FulfilmentEnquiries() {
  const { data, error, refresh } = useAdminData<{ items: Item[]; hasMore: boolean }>('/fulfilment');
  if (error) return <div role="alert" className="admin-panel">{error} <button className={buttonClass} onClick={refresh}>Retry</button></div>;
  if (!data) return <LoadingScreen embedded label="Loading fulfilment enquiries..." />;
  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Fulfilment enquiries</h1><p className="mt-2 text-neutral-600">Business storage and delivery requests sent from the storefront.</p></div>
        <button className={buttonClass} onClick={refresh}>Refresh</button>
      </div>
      <div className="admin-panel mt-6 overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs text-neutral-600"><tr>{['Reference', 'Business', 'Contact', 'Status', 'Received'].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead>
          <tbody>{data.items.map((item) => <tr key={item.reference} className="border-b last:border-0">
            <td className="p-4"><Link className="font-semibold underline" href={`/admin/fulfilment/${encodeURIComponent(item.reference)}`}>{item.reference}</Link></td>
            <td className="p-4">{item.business}</td><td className="p-4">{item.name}</td>
            <td className="p-4"><span className="rounded-full bg-yellow-100 px-3 py-1 capitalize">{statusLabel(item.status)}</span></td>
            <td className="p-4 whitespace-nowrap text-neutral-600">{new Date(item.createdAt).toLocaleString()}</td>
          </tr>)}</tbody>
        </table>
        {!data.items.length && <p className="p-8 text-neutral-600">No fulfilment enquiries yet.</p>}
      </div>
    </main>
  );
}
