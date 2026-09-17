'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import AdminIcon, { type IconName } from './AdminIcon';
import type { Staff } from './types';
export default function DashboardFrame({
  staff,
  busy,
  onSignOut,
  children,
}: {
  staff: Staff | null;
  busy: boolean;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const links: { href: string; title: string; icon: IconName }[] = [
    { href: '/admin', title: 'Overview', icon: 'home' },
    { href: '/admin/orders', title: 'Orders', icon: 'orders' },
    ...(staff?.role === 'ADMIN'
      ? [
          { href: '/admin/products', title: 'Catalogue & stock', icon: 'stock' as const },
          { href: '/admin/staff', title: 'Staff', icon: 'staff' as const },
        ]
      : []),
    { href: '/admin/security', title: 'Account security', icon: 'settings' },
  ];
  const navigation = (
    <nav aria-label="Admin navigation" className="mt-8 space-y-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => drawer.current?.close()}
          aria-current={
            (link.href === '/admin' ? path === link.href : path.startsWith(link.href))
              ? 'page'
              : undefined
          }
          className="admin-nav-link"
        >
          <AdminIcon name={link.icon} />
          {link.title}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="admin-workspace">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-4"
      >
        Skip to content
      </a>
      <aside className="admin-sidebar">
        <Link href="/admin" aria-label="BAND-IT dashboard" className="px-3">
          <BrandLogo className="w-44" />
        </Link>
        {navigation}
        <div className="mt-auto rounded-xl border-l-4 border-yellow-400 bg-neutral-900 p-5 text-white">
          <p className="font-semibold">Your storefront</p>
          <p className="mt-2 text-xs leading-5 text-neutral-300">
            See the customer experience and your latest products.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center gap-3 rounded-lg bg-yellow-300 px-4 text-sm font-semibold text-black"
          >
            Open store <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
      <dialog ref={drawer} className="admin-drawer" aria-label="Navigation menu">
        <div className="flex items-center justify-between">
          <BrandLogo className="w-36" />
          <button
            className="grid h-11 w-11 place-items-center"
            aria-label="Close navigation"
            onClick={() => drawer.current?.close()}
          >
            <AdminIcon name="close" />
          </button>
        </div>
        {navigation}
        <Link href="/" className="admin-nav-link mt-8">
          Open storefront ↗
        </Link>
      </dialog>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu h-11 w-11 shrink-0 items-center justify-center"
            aria-label="Open navigation"
            onClick={() => drawer.current?.showModal()}
          >
            <AdminIcon name="menu" />
          </button>
          <form
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-[#f5f6f9] px-3 sm:max-w-md"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const search = String(new FormData(event.currentTarget).get('search') ?? '').trim();
              window.location.assign('/admin/orders?search=' + encodeURIComponent(search));
            }}
          >
            <AdminIcon name="search" />
            <input
              name="search"
              aria-label="Search orders by reference or customer email"
              placeholder="Search order reference or email…"
              maxLength={150}
              className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"
            />
            <button type="submit" className="min-h-11 text-xs font-semibold">
              Search
            </button>
          </form>
          <details className="relative shrink-0">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-yellow-300 text-sm font-bold">
                {staff?.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '…'}
              </span>
              <span className="hidden text-sm sm:block">
                <strong className="block">{staff?.name || 'Staff workspace'}</strong>
                <span className="text-xs text-slate-500">
                  {staff?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
                </span>
              </span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="absolute right-0 z-20 mt-3 w-52 rounded-xl border bg-white p-2 shadow-lg">
              <Link href="/admin/security" className="admin-nav-link">
                Account security
              </Link>
              <Link href="/" className="admin-nav-link">
                Storefront
              </Link>
              <button
                disabled={busy || !staff}
                className="admin-nav-link w-full"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          </details>
        </header>
        <div id="admin-content" className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
