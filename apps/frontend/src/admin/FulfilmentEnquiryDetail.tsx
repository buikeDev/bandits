'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import { adminApi, buttonClass, inputClass } from './api';
import { useAdminData } from './useAdminData';

const statuses = ['NEW', 'CONTACTED', 'IN_DISCUSSION', 'CLOSED'];
const statusLabel = (status: string) => status.toLowerCase().replace(/_/g, ' ');
type History = { at: string; note: string; staffName: string; from: string; to: string };
type Enquiry = { reference: string; name: string; business: string; email: string; phone: string; monthlyOrders: string; requirements: string; status: string; version: number; createdAt: string; history: History[]; notifications: { id: string; kind: string; status: string; lastError: string | null }[] };

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="admin-panel space-y-3"><h2 className="text-lg font-bold">{title}</h2>{children}</section>; }
export default function FulfilmentEnquiryDetail({ reference }: { reference: string }) {
  const { data, error, refresh } = useAdminData<Enquiry>(`/fulfilment/${encodeURIComponent(reference)}`);
  if (error) return <div role="alert" className="admin-panel">{error} <button className={buttonClass} onClick={refresh}>Retry</button></div>;
  if (!data) return <LoadingScreen embedded label="Loading fulfilment enquiry..." />;
  return <Editor key={`${data.reference}-${data.version}`} enquiry={data} refresh={refresh} />;
}
function Editor({ enquiry, refresh }: { enquiry: Enquiry; refresh: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function update(form: HTMLFormElement) {
    if (busy) return; setBusy(true); setError(''); const body = new FormData(form);
    try { await adminApi(`/fulfilment/${encodeURIComponent(enquiry.reference)}`, { version: enquiry.version, status: body.get('status'), note: body.get('note') }); refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update enquiry.'); }
    finally { setBusy(false); }
  }
  return <main>
    <Link href="/admin/fulfilment" className="inline-flex min-h-11 items-center text-sm underline">Back to fulfilment enquiries</Link>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="break-all text-2xl font-bold">{enquiry.reference}</h1><p className="mt-2 text-sm text-neutral-600">Received {new Date(enquiry.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-yellow-100 px-4 py-2 text-sm capitalize">{statusLabel(enquiry.status)}</span></div>
    {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-2"><div className="space-y-6">
      <Panel title="Business request"><dl className="space-y-3 text-sm"><div><dt className="text-neutral-500">Business</dt><dd className="font-semibold">{enquiry.business}</dd></div><div><dt className="text-neutral-500">Monthly orders</dt><dd>{enquiry.monthlyOrders}</dd></div><div><dt className="text-neutral-500">Requirements</dt><dd className="whitespace-pre-wrap leading-6">{enquiry.requirements}</dd></div></dl></Panel>
      <Panel title="Contact"><p className="text-sm"><strong>{enquiry.name}</strong></p><a className="block break-all text-sm underline" href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <a className="block text-sm underline" href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>}</Panel>
      <Panel title="Email delivery"><ul className="space-y-2 text-sm">{enquiry.notifications.map((item) => <li key={item.id} className="border-t pt-2"><strong>{item.kind === 'FULFILMENT_TEAM' ? 'Team notification' : 'Customer acknowledgement'}</strong>: {statusLabel(item.status)}{item.lastError && <p className="mt-1 text-red-700">{item.lastError}</p>}</li>)}</ul></Panel>
    </div><div className="space-y-6"><Panel title="Update enquiry"><form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void update(event.currentTarget); }}><label className="block text-sm font-medium">Status<select name="status" defaultValue={enquiry.status} className={inputClass}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label className="block text-sm font-medium">Internal note<textarea name="note" required maxLength={2000} className={inputClass} /></label><p className="text-xs text-neutral-600">Notes are for staff only and are added to the enquiry history.</p><button disabled={busy} className={buttonClass}>{busy ? 'Saving...' : 'Save update'}</button></form></Panel><Panel title="Staff activity"><ol className="space-y-4">{enquiry.history.length ? enquiry.history.map((item, index) => <li key={`${item.at}-${index}`} className="border-t pt-3 text-sm"><p className="whitespace-pre-wrap">{item.note}</p><p className="mt-1 text-xs text-neutral-500">{item.staffName} changed {statusLabel(item.from)} to {statusLabel(item.to)} · {new Date(item.at).toLocaleString()}</p></li>) : <p className="text-sm text-neutral-600">No staff updates yet.</p>}</ol></Panel></div></div>
  </main>;
}
