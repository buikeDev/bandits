'use client';
import { useState } from 'react';
import { adminApi, inputClass, buttonClass } from '@/admin/api';
export default function Security() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  return (
    <main className="max-w-lg">
      <h1 className="text-3xl font-bold">Account security</h1>
      <form
        className="mt-6 space-y-4 rounded-xl border bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setError('');
          setSuccess(false);
          if (values.get('password') !== values.get('confirm')) {
            setError('New passwords do not match');
            return;
          }
          setBusy(true);
          try {
            await adminApi('/password', {
              currentPassword: values.get('currentPassword'),
              password: values.get('password'),
            });
            form.reset();
            setSuccess(true);
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          Current password
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Confirm new password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            className={inputClass}
          />
        </label>
        <p className="text-xs text-neutral-600">
          Changing your password signs out your other staff sessions.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-green-800">
            Password changed. Other sessions have been signed out.
          </p>
        )}
        <button disabled={busy} className={buttonClass}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </main>
  );
}
