'use client';

import { useRef, useState, type FormEvent } from 'react';

type Submission = { reference: string };
const monthlyRanges = ['Just getting started', '1-100', '101-500', '501-2,000', '2,000+'];

export default function FulfilmentBrief() {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef('');
  const email = 'banditwristbandsng@gmail.com';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setReference('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/fulfilment/enquiries`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId.current, name: form.get('name'), business: form.get('business'), email: form.get('email'), phone: form.get('phone'), monthlyOrders: form.get('monthlyOrders'), requirements: form.get('requirements'), website: form.get('website') }),
      });
      const result = (await response.json().catch(() => null)) as { success?: boolean; data?: Submission; error?: string } | null;
      if (!response.ok || !result?.success || !result.data?.reference) throw new Error(result?.error ?? 'We could not send your enquiry. Please try again.');
      setReference(result.data.reference); requestId.current = ''; formElement.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send your enquiry. Please try again.');
    } finally { setBusy(false); }
  }
  const inputClass = 'mt-2 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black';
  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8">
      <h3 className="text-xl font-black tracking-tight">Tell us about your business</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Send your fulfilment requirements directly to our team. We will review them and reply to you by email.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-bold">Your name<input name="name" autoComplete="name" required minLength={2} maxLength={120} className={inputClass} /></label>
        <label className="text-xs font-bold">Business name<input name="business" autoComplete="organization" required minLength={2} maxLength={160} className={inputClass} /></label>
        <label className="text-xs font-bold">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
        <label className="text-xs font-bold">Phone or WhatsApp <span className="font-normal text-neutral-500">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} className={inputClass} /></label>
        <label className="text-xs font-bold sm:col-span-2">Monthly orders<select name="monthlyOrders" required defaultValue="" className={inputClass}><option value="" disabled>Select a range</option>{monthlyRanges.map((range) => <option key={range}>{range}</option>)}</select></label>
        <label className="text-xs font-bold sm:col-span-2">What do you sell, and where do you deliver?<textarea name="requirements" required minLength={10} rows={4} maxLength={3000} placeholder="Product types, storage needs, delivery locations and any special packaging..." className={inputClass} /></label>
        <label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button type="submit" disabled={busy} className="button-primary mt-5 w-full">{busy ? 'Sending enquiry...' : 'Send fulfilment enquiry'}</button>
      {reference && <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-900">Thank you. Your enquiry has been received. Reference: <strong>{reference}</strong>. We will reply to your email.</p>}
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="mt-4 break-words text-sm text-neutral-600">Prefer email? Contact us at <a className="underline" href={`mailto:${email}`}>{email}</a>.</p>
    </form>
  );
}
