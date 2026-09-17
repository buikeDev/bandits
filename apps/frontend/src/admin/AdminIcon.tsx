import type { ReactNode } from 'react';
export type IconName =
  | 'home'
  | 'orders'
  | 'quote'
  | 'stock'
  | 'staff'
  | 'settings'
  | 'search'
  | 'menu'
  | 'close'
  | 'check'
  | 'production'
  | 'truck'
  | 'wallet'
  | 'card'
  | 'arrow'
  | 'calendar';
const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10H3z" />
      <path d="M9 20v-7h6v7" />
    </>
  ),
  orders: (
    <>
      <path d="M3 3h2l3 12h11l2-9H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </>
  ),
  quote: <path d="M21 11a9 8 0 0 1-9 8H6l-4 3 2-7a8 8 0 0 1-1-4 9 8 0 0 1 18 0Z" />,
  stock: (
    <>
      <path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1v4l-2 1 2 4 3 1 1 4h6l1-4 3-1 2-4-2-1V7l-3-1-1-3Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m15 15 6 6" />
    </>
  ),
  menu: <path d="M4 5h16M4 12h16M4 19h16" />,
  close: <path d="m5 5 14 14M5 19 19 5" />,
  check: (
    <>
      <path d="M21 11v1a9 9 0 1 1-5-8" />
      <path d="m8 11 4 4L22 5" />
    </>
  ),
  production: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
  truck: (
    <>
      <path d="M2 4h12v13H2Zm12 5h4l4 5v3h-8" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 8V4l14-2v3m4 7h-6v5h6" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20M6 15h4" />
    </>
  ),
  arrow: <path d="M4 17 10 11l4 3 6-9m-6 0h6v6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 2v6m10-6v6M3 11h18" />
    </>
  ),
};
export default function AdminIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
