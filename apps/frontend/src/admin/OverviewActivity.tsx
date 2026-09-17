'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { useAdminData } from './useAdminData';
import AdminIcon, { type IconName } from './AdminIcon';
type Point = { day: string; enquiries: number; confirmed: number; ready: number };
type Insights = {
  series: Point[];
  activity: {
    id: string;
    title: string;
    detail: string;
    href: string;
    createdAt: string;
    icon: IconName;
  }[];
};
const seriesKeys = [
  { key: 'enquiries' as const, label: 'New enquiries', color: '#edab00' },
  { key: 'confirmed' as const, label: 'Confirmed', color: '#32a783' },
  { key: 'ready' as const, label: 'Ready', color: '#9474d9' },
];
export default function OverviewActivity() {
  const [days, setDays] = useState(7);
  const id = useId().replace(/:/g, '');
  const { data, error, refresh } = useAdminData<Insights>('/insights?days=' + days);
  const max = Math.max(
    4,
    ...(data?.series.flatMap((p) => [p.enquiries, p.confirmed, p.ready]) ?? [])
  );
  const ceiling = Math.ceil(max / 4) * 4;
  const x = (i: number) => 38 + (i * 664) / (days - 1);
  const y = (value: number) => 190 - (value / ceiling) * 156;
  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <section className="admin-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Enquiries overview</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              New enquiries and recorded status changes · Lagos time
            </p>
          </div>
          <label className="text-xs">
            <span className="sr-only">Chart period</span>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="min-h-11 rounded-lg border bg-white px-3"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
        </div>
        {error ? (
          <div role="alert" className="py-10 text-sm">
            {error}
            <button className="ml-3 min-h-11 underline" onClick={refresh}>
              Retry
            </button>
          </div>
        ) : !data ? (
          <p role="status" className="py-20 text-sm text-slate-500">
            Loading activity…
          </p>
        ) : (
          <>
            <svg
              viewBox="0 0 730 230"
              role="img"
              aria-labelledby={id + 'title'}
              className="mt-5 w-full"
            >
              <title id={id + 'title'}>
                Daily enquiries, confirmations and ready orders. Exact counts are available in the
                data table below.
              </title>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#f8c640" stopOpacity=".2" />
                  <stop offset="1" stopColor="#f8c640" stopOpacity=".02" />
                </linearGradient>
              </defs>
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <line
                    x1="38"
                    x2="702"
                    y1={y((i * ceiling) / 4)}
                    y2={y((i * ceiling) / 4)}
                    stroke="#eceef3"
                  />
                  <text
                    x="24"
                    y={y((i * ceiling) / 4) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#687086"
                  >
                    {(i * ceiling) / 4}
                  </text>
                </g>
              ))}
              <path
                d={
                  'M38 190 ' +
                  data.series.map((p, i) => `L${x(i)} ${y(p.enquiries)}`).join(' ') +
                  ' L702 190 Z'
                }
                fill={'url(#' + id + ')'}
              />
              {seriesKeys.map((series) => (
                <g key={series.key}>
                  <polyline
                    points={data.series.map((p, i) => `${x(i)},${y(p[series.key])}`).join(' ')}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2"
                  />
                  {data.series.map((p, i) => (
                    <circle
                      key={p.day}
                      cx={x(i)}
                      cy={y(p[series.key])}
                      r={days === 7 ? 3.5 : 2}
                      fill={series.color}
                    >
                      <title>
                        {p.day}: {p[series.key]} {series.label}
                      </title>
                    </circle>
                  ))}
                </g>
              ))}
              {data.series.map(
                (p, i) =>
                  (i === 0 || i === days - 1 || i % Math.ceil(days / 7) === 0) && (
                    <text
                      key={p.day}
                      x={x(i)}
                      y="216"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#687086"
                    >
                      {new Date(p.day + 'T12:00:00Z').toLocaleDateString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'Africa/Lagos',
                      })}
                    </text>
                  )
              )}
            </svg>
            <div className="flex flex-wrap gap-5 text-xs text-slate-500">
              {seriesKeys.map((s) => (
                <span key={s.key} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
            <details className="mt-4 text-xs text-slate-500">
              <summary className="min-h-8 cursor-pointer">View daily counts</summary>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Daily order activity in Lagos time</caption>
                  <thead>
                    <tr>
                      {['Date', 'New', 'Confirmed', 'Ready'].map((t) => (
                        <th key={t} className="py-2">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.map((p) => (
                      <tr key={p.day}>
                        <th className="py-1 font-normal">{p.day}</th>
                        <td>{p.enquiries}</td>
                        <td>{p.confirmed}</td>
                        <td>{p.ready}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>
      <section className="admin-panel">
        <h2 className="font-bold">Recent activity</h2>
        <p className="mt-1 text-xs text-slate-500">Latest recorded updates · all time</p>
        {!data ? (
          <p className="py-10 text-sm text-slate-500">
            {error ? 'Activity unavailable. Retry the request alongside.' : 'Loading updates…'}
          </p>
        ) : data.activity.length === 0 ? (
          <p className="py-10 text-sm text-slate-500">
            Activity will appear when your team receives or updates orders.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.activity.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="flex items-start gap-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <AdminIcon name={a.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{a.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{a.detail}</p>
                  </div>
                  <time
                    className="shrink-0 text-right text-[10px] leading-5 text-slate-500"
                    dateTime={a.createdAt}
                  >
                    {new Date(a.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'Africa/Lagos',
                    })}
                    <br />
                    {new Date(a.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Africa/Lagos',
                    })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
