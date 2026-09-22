'use client';
import { useEffect, useState } from 'react';

export default function SocialSignIn() {
  const [providers, setProviders] = useState<{ google: boolean; apple: boolean } | null>(null);
  const [error, setError] = useState('');
  const [next, setNext] = useState('/account');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get('next') ?? '/account');
    const reason = params.get('oauth');
    if (reason)
      setError(
        reason === 'existing-account'
          ? 'An account already uses this email. Sign in with your existing password to access your orders.'
          : 'Sign-in could not be completed. Please try again.'
      );
    fetch('/api/auth/oauth/providers')
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = await response.json();
        if (!body.success) throw new Error();
        setProviders(body.data);
      })
      .catch(() => {
        setProviders({ google: false, apple: false });
        setError('Sign-in is temporarily unavailable. Please try again later.');
      });
  }, []);
  return (
    <div className="mt-7 space-y-3">
      {(['google', 'apple'] as const).map((provider) =>
        providers?.[provider] ? (
          <a
            key={provider}
            href={`/api/auth/oauth/start/${provider}?next=${encodeURIComponent(next)}`}
            className="button-secondary flex min-h-12 w-full justify-center"
          >
            Continue with {provider === 'google' ? 'Google' : 'Apple'}
          </a>
        ) : (
          <button key={provider} disabled className="button-secondary min-h-12 w-full opacity-50">
            {provider === 'google' ? 'Google' : 'Apple'}{' '}
            {providers ? 'sign-in unavailable' : '— loading…'}
          </button>
        )
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="text-sm leading-6 text-neutral-600">
        Use Google or Apple to create an account or sign in. No BAND-IT password needed.
      </p>
    </div>
  );
}
