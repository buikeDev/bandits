'use client';
import LoadingScreen from '@/components/LoadingScreen';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdminData } from '@/admin/useAdminData';
import { useStaff } from '@/admin/AdminShell';
import { money, label, buttonClass } from '@/admin/api';
import AdminIcon, { type IconName } from '@/admin/AdminIcon';
import OverviewActivity from '@/admin/OverviewActivity';
const cards: {
  status: string;
  title: string;
  icon: IconName;
  bg: string;
  ink: string;
  iconBg: string;
}[] = [
  {
    status: 'AWAITING_WHATSAPP',
    title: 'New enquiry',
    icon: 'quote',
    bg: '#fffaf0',
    ink: '#cb8300',
    iconBg: '#fff0c8',
  },
  {
    status: 'CONFIRMED',
    title: 'Confirmed',
    icon: 'check',
    bg: '#f0fbf7',
    ink: '#008553',
    iconBg: '#dff5e9',
  },
  {
    status: 'IN_PRODUCTION',
    title: 'In production',
    icon: 'production',
    bg: '#f1f6ff',
    ink: '#245bef',
    iconBg: '#e0eaff',
  },
  {
    status: 'READY',
    title: 'Ready',
    icon: 'truck',
    bg: '#f7f3ff',
    ink: '#743cdb',
    iconBg: '#ece1ff',
  },
];
export default function Overview() {
  const staff = useStaff();
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Lagos',
      })
    );
  }, []);
  const { data, error, refresh } = useAdminData<{
    counts: { status: string; _count: number }[];
    payments: { kind: string; _sum: { amountMinor: string | null } }[];
    lowStock: number;
    needsQuote: number;
    outstandingMinor: string;
  }>('/overview');
  const actions: { href: string; title: string; icon: IconName }[] = [
    { href: '/admin/orders?status=AWAITING_WHATSAPP', title: 'Review orders', icon: 'quote' },
    { href: '/admin/orders', title: 'View orders', icon: 'orders' },
    ...(staff?.role === 'ADMIN'
      ? [
          { href: '/admin/products', title: 'Manage stock', icon: 'stock' as const },
          { href: '/admin/staff', title: 'Create staff account', icon: 'staff' as const },
        ]
      : []),
  ];
  return (
    <main>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Welcome back{staff?.name ? ', ' + staff.name.split(' ')[0] : ''}.
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Today’s workspace</h1>
          <p className="mt-2 text-sm text-slate-500">Follow enquiries through to delivery.</p>
        </div>
        <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs">
          <AdminIcon name="calendar" />
          <span>{date || 'Africa/Lagos'}</span>
        </div>
      </div>
      {error ? (
        <div role="alert" className="admin-panel">
          {error}{' '}
          <button onClick={refresh} className={buttonClass}>
            Retry
          </button>
        </div>
      ) : !data ? (
        <LoadingScreen embedded label="Loading workspace…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.status}
                href={'/admin/orders?status=' + card.status}
                className="admin-panel flex gap-4"
                style={{ background: card.bg }}
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                  style={{ background: card.iconBg, color: card.ink }}
                >
                  <AdminIcon name={card.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-sm font-medium">{card.title}</h2>
                  <p className="mt-2 text-3xl font-bold tabular-nums">
                    {data.counts.find((c) => c.status === card.status)?._count ?? 0}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Currently {label(card.status)}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {[
              {
                title: 'Orders awaiting confirmation',
                value: String(data.needsQuote),
                icon: 'quote' as const,
                detail: 'Review artwork and confirm stock availability.',
              },
              {
                title: 'Outstanding order balances',
                value: money(data.outstandingMinor),
                icon: 'wallet' as const,
                detail: 'Excludes cancelled orders; pending delivery fees are not included.',
              },
              {
                title: 'Net payments recorded · all time',
                value: money(
                  data.payments.reduce(
                    (sum, row) =>
                      sum + (row.kind === 'PAYMENT' ? 1 : -1) * Number(row._sum.amountMinor ?? 0),
                    0
                  )
                ),
                icon: 'card' as const,
                detail: 'Recorded receipts minus refunds; excludes unpaid enquiries.',
              },
            ].map((card) => (
              <section key={card.title} className="admin-panel flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100">
                  <AdminIcon name={card.icon} className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm text-slate-600">{card.title}</h2>
                  <p className="mt-2 break-words text-2xl font-bold tabular-nums">{card.value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{card.detail}</p>
                </div>
              </section>
            ))}
          </div>
          <OverviewActivity />
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <section className="admin-panel">
              <h2 className="font-bold">Quick actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    href={action.href}
                    key={action.title}
                    className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-xs font-medium"
                  >
                    <AdminIcon name={action.icon} />
                    {action.title}
                  </Link>
                ))}
              </div>
              {staff?.role === 'ADMIN' && (
                <Link
                  href="/admin/products"
                  className="mt-4 inline-flex min-h-8 items-center gap-2 text-xs text-slate-500"
                >
                  <AdminIcon name="stock" className="h-4 w-4" />
                  {data.lowStock} active variants below 100 available units →
                </Link>
              )}
            </section>
            <Link
              href="/admin/orders?status=AWAITING_WHATSAPP"
              className="admin-panel flex items-center gap-4"
              style={{ background: 'linear-gradient(110deg,#fff6e5,#fffdf8)' }}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-yellow-300">
                <AdminIcon name="arrow" className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-bold">Keep things moving</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Review artwork, verify payments and prepare the next order.
                </p>
              </div>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
