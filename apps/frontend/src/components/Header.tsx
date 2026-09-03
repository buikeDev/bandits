'use client';

import Link from 'next/link';
import { useAuth } from '@/auth/AuthProvider';

const nav = [
  ['Wristbands', '#wristbands'],
  ['Shop', '/shop'],
  ['Custom Printing', '#custom'],
  ['Fulfilment', '#fulfilment'],
  ['Bulk Orders', '#bulk'],
  ['About', '/about'],
];

export default function Header() {
  const { customer, loading } = useAuth();
  return (
    <header className="relative z-50 bg-white">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-[-0.04em]">
          BANDIT.
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
            <span className="text-xl">⌕</span>
          </button>
          <Link
            href={customer ? '/account' : '/login'}
            aria-label={loading ? 'Account' : customer ? `${customer.name}'s account` : 'Sign in'}
            className="header-icon"
          >
            <span className="text-lg">♙</span>
          </Link>
          <button aria-label="Cart" className="header-icon relative">
            <span className="text-lg">▱</span>
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[9px] font-black">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
