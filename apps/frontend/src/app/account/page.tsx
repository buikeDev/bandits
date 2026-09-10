'use client';
import BrandLogo from '@/components/BrandLogo';
import CustomerOrders from '@/components/CustomerOrders';

import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';

export default function AccountPage() {
  const { customer, loading, logout } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !customer) router.replace('/login?next=/account');
  }, [customer, loading, router]);

  if (loading || !customer) return <LoadingScreen label="Getting your account ready" />;

  async function signOut() {
    try {
      await logout();
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign out');
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-12">
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-black">
            <BrandLogo />
          </Link>
          <button onClick={signOut} className="button-secondary">
            Sign out
          </button>
        </div>
        <h1 className="mt-12 text-3xl font-black">Your account</h1>
        <dl className="mt-7 grid gap-5 rounded border border-neutral-200 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold text-neutral-500">NAME</dt>
            <dd className="mt-1 font-semibold">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-neutral-500">EMAIL</dt>
            <dd className="mt-1 font-semibold">{customer.email}</dd>
          </div>
        </dl>
        <CustomerOrders key={customer.id} />
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
