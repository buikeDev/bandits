'use client';
import BrandLogo from '@/components/BrandLogo';
import SocialSignIn from '@/auth/SocialSignIn';

import { customerLoginSchema } from '@bandit/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = customerLoginSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details');
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      const requested = new URLSearchParams(window.location.search).get('next');
      router.replace(
        requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')
          ? requested
          : '/account'
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-5 py-12">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <Link href="/" className="text-xl font-black">
          <BrandLogo />
        </Link>
        <h1 className="mt-8 text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-sm text-neutral-600">Sign in to view your BAND-IT account.</p>
        <SocialSignIn />
        <details className="mt-7">
          <summary className="cursor-pointer py-3 text-sm font-semibold">
            Existing customer? Sign in with your password
          </summary>
          <form onSubmit={submit} className="mt-4 space-y-5">
            <label className="block text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 font-normal"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button disabled={submitting} className="button-primary w-full disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </details>
        <p className="mt-6 text-sm text-neutral-600">
          No account?{' '}
          <Link href="/register" className="font-bold text-black">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
