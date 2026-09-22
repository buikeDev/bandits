import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import SocialSignIn from '@/auth/SocialSignIn';

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-5 py-12">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <Link href="/">
          <BrandLogo />
        </Link>
        <h1 className="mt-8 text-3xl font-black">Create an account</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Keep your orders together with a password-free account. You can also shop as a guest.
        </p>
        <SocialSignIn />
        <p className="mt-6 text-sm text-neutral-600">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-black underline">
            Sign in
          </Link>
        </p>
        <Link href="/shop" className="mt-4 inline-flex min-h-11 items-center text-sm underline">
          Continue shopping
        </Link>
      </section>
    </main>
  );
}
