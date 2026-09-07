'use client';

import { customerRegistrationSchema } from '@bandit/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = customerRegistrationSchema.safeParse({ name: form.get('name'), email: form.get('email'), password: form.get('password') });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check your details'); return; }
    setSubmitting(true);
    try { await register(parsed.data); router.replace('/'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create account'); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-5 py-12">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <Link href="/" className="text-xl font-black">BANDIT.</Link>
        <h1 className="mt-8 text-3xl font-black">Create an account</h1>
        <p className="mt-2 text-sm text-neutral-600">An account is optional, but keeps your orders and details together.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">Full name
            <input name="name" autoComplete="name" required minLength={2} className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">Email
            <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">Password
            <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 font-normal" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={submitting} className="button-primary w-full disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-sm text-neutral-600">Already registered? <Link href="/login" className="font-bold text-black">Sign in</Link></p>
      </section>
    </main>
  );
}
