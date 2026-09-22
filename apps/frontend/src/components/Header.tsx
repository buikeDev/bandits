'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';
import { useAuth } from '@/auth/AuthProvider';
import { useDesignOrder } from '@/components/DesignOrderProvider';

const nav = [
  ['Wristbands', '/#wristbands'],
  ['Shop', '/shop'],
  ['Custom Printing', '/custom'],
  ['Fulfilment', '/fulfilment'],
  ['Bulk Orders', '/#bulk'],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { customer, loading } = useAuth();
  const { items } = useDesignOrder();
  const nameParts = customer?.name.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = nameParts.length
    ? [nameParts[0], ...(nameParts.length > 1 ? [nameParts[nameParts.length - 1]] : [])]
        .map((part) => Array.from(part)[0])
        .join('')
        .toLocaleUpperCase()
    : Array.from(customer?.email ?? 'A')[0].toLocaleUpperCase();
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-[-0.04em]">
          <BrandLogo />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {nav.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className="py-3 text-xs font-semibold hover:text-neutral-500 aria-[current=page]:underline underline-offset-8"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-0 sm:gap-2">
          <Link
            href="/shop#catalog-search"
            aria-label="Search wristbands"
            className="header-icon hidden sm:grid"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </Link>
          <Link
            href={customer || loading ? '/account' : '/login'}
            aria-label={loading ? 'Account' : customer ? `${customer.name}'s account` : 'Sign in'}
            className="header-icon"
          >
            {loading ? (
              <span aria-hidden="true" className="h-8 w-8 rounded-full bg-neutral-100" />
            ) : customer ? (
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-bold leading-none text-black"
              >
                {initials}
              </span>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" />
              </svg>
            )}
          </Link>
          <Link
            href="/order"
            data-order-cart
            aria-label={`Order: ${items.length} items`}
            className="header-icon relative"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M2 3h2l3 12h12l3-9H5M7 15l-1 3h14" />
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
            </svg>
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[9px] font-black">
              {items.length}
            </span>
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="header-icon lg:hidden"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path d={menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!menuOpen}
        className="border-t border-neutral-200 bg-white lg:hidden"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="page-shell grid py-3">
          {[...nav, ['Search wristbands', '/shop#catalog-search']].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-neutral-100"
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
