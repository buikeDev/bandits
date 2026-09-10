'use client';

import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { useAuth } from '@/auth/AuthProvider';
import { useDesignOrder } from '@/components/DesignOrderProvider';

const nav = [
  ['Wristbands', '/#wristbands'],
  ['Shop', '/shop'],
  ['Custom Printing', '/custom'],
  ['Fulfilment', '/fulfilment'],
  ['Bulk Orders', '/#bulk'],
  ['About', '/about'],
];

export default function Header() {
  const { customer, loading } = useAuth();
  const { items } = useDesignOrder();
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-[-0.04em]">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-[11px] font-semibold hover:text-neutral-500"
            >
              {label}
              {label === 'Wristbands' && <span className="ml-1">⌄</span>}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="header-icon">
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
          </button>
          <Link
            href={customer ? '/account' : '/login'}
            aria-label={loading ? 'Account' : customer ? `${customer.name}'s account` : 'Sign in'}
            className="header-icon"
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
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" />
            </svg>
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
        </div>
      </div>
    </header>
  );
}
