'use client';

import { useId, useState, type FormEvent } from 'react';
import { apiRequest } from '@/auth/api';

export default function NewsletterSignup() {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<{ message: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email: data.get('email'),
          consent: data.get('consent') === 'on',
          website: data.get('website'),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      setMessage(result.message);
      form.reset();
    } catch {
      setError('Signup could not be completed. Please wait a minute and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-4" aria-busy={busy}>
      <label htmlFor={`${id}-email`} className="sr-only">
        Newsletter email address
      </label>
      <div className="flex">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="Enter your email"
          disabled={busy}
          className="min-h-11 min-w-0 flex-1 rounded-l border border-neutral-300 px-3 py-2 text-xs focus:outline focus:outline-2 focus:outline-black"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-r bg-black px-3 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy ? 'Joining…' : 'Join'}
        </button>
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="mt-3 flex min-h-11 items-start gap-2 text-[11px] leading-5 text-neutral-600">
        <input type="checkbox" name="consent" required disabled={busy} className="mt-1 shrink-0" />
        <span>
          I’d like BAND-IT product news and offers by email. Unsubscribe anytime. We use Mailchimp
          to manage subscriptions.
        </span>
      </label>
      <p role="status" className="mt-2 text-xs leading-5 text-neutral-700">
        {message}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
