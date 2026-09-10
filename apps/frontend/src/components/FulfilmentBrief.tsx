'use client';

import { useState, type FormEvent } from 'react';

export default function FulfilmentBrief() {
  const [saved, setSaved] = useState(false);

  function downloadBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const brief = [
      'BAND-IT — Fulfilment enquiry',
      '',
      ...Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'band-it-fulfilment-brief.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaved(true);
  }

  const inputClass =
    'mt-2 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black';

  return (
    <form
      onSubmit={downloadBrief}
      onChange={() => setSaved(false)}
      className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8"
    >
      <h3 className="text-xl font-black tracking-tight">Tell us about your business</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Prepare a brief to share with the BAND-IT team. Downloading saves it to your device; it does
        not send an enquiry.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-bold">
          Your name
          <input name="Name" autoComplete="name" required maxLength={120} className={inputClass} />
        </label>
        <label className="text-xs font-bold">
          Business name
          <input
            name="Business"
            autoComplete="organization"
            required
            maxLength={160}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-bold">
          Email address
          <input name="Email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="text-xs font-bold">
          Monthly orders
          <select name="Monthly orders" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a range
            </option>
            <option>Just getting started</option>
            <option>1–100</option>
            <option>101–500</option>
            <option>501–2,000</option>
            <option>2,000+</option>
          </select>
        </label>
        <label className="text-xs font-bold sm:col-span-2">
          What do you sell, and where do you deliver?
          <textarea
            name="Requirements"
            required
            rows={4}
            maxLength={3000}
            placeholder="Product types, storage needs, delivery locations and any special packaging…"
            className={inputClass}
          />
        </label>
      </div>
      <button type="submit" className="button-primary mt-5 w-full">
        Download enquiry brief{' '}
        <span aria-hidden="true" className="ml-3">
          ↓
        </span>
      </button>
      <p role="status" className="mt-3 text-xs leading-5 text-neutral-600">
        {saved
          ? 'Your brief is ready. Keep it to share with the team; no information has been submitted.'
          : 'Your details stay in this form until you download them.'}
      </p>
    </form>
  );
}
