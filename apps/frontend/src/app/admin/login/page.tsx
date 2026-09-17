'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { adminApi, inputClass, buttonClass } from '@/admin/api';
export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f5f2] px-5">
      <form
        className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-200 bg-white p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setBusy(true);
          setError('');
          try {
            await adminApi('/login', { email: data.get('email'), password: data.get('password') });
            const next = new URLSearchParams(window.location.search).get('next');
            router.replace(
              next &&
                /^\/admin(?:\/|$)/.test(next) &&
                !next.includes('\\') &&
                !next.startsWith('/admin/login')
                ? next
                : '/admin'
            );
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <BrandLogo className="w-40" />
        <h1 className="text-2xl font-bold">Staff sign in</h1>
        <p className="text-sm text-neutral-600">Manage orders, artwork and fulfilment.</p>
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={busy} className={`${buttonClass} w-full`}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
