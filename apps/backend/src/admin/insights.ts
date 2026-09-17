import { prisma } from '@bandit/database';
export const lagosDay = (date: Date) =>
  new Date(date.getTime() + 3600000).toISOString().slice(0, 10);
export function fillDays(
  days: number,
  now: Date,
  rows: { day: string; enquiries: number; confirmed: number; ready: number }[]
) {
  const today = new Date(`${lagosDay(now)}T00:00:00Z`).getTime();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(today - (days - i - 1) * 86400000).toISOString().slice(0, 10);
    return byDay.get(day) ?? { day, enquiries: 0, confirmed: 0, ready: 0 };
  });
}
export async function insights(days: number, isAdmin: boolean) {
  const now = new Date();
  const start = new Date(
    `${lagosDay(new Date(now.getTime() - (days - 1) * 86400000))}T00:00:00+01:00`
  );
  const [rows, enquiries, events, audits] = await Promise.all([
    prisma.$queryRaw<Array<{ day: string; enquiries: number; confirmed: number; ready: number }>>`
      SELECT day, SUM(enquiries)::int AS enquiries, SUM(confirmed)::int AS confirmed, SUM(ready)::int AS ready FROM (
        SELECT to_char("createdAt" + interval '1 hour', 'YYYY-MM-DD') AS day, COUNT(*)::int AS enquiries, 0 AS confirmed, 0 AS ready
        FROM "OrderEnquiry" WHERE "createdAt" >= ${start} AND "createdAt" <= ${now} GROUP BY day
        UNION ALL
        SELECT to_char("createdAt" + interval '1 hour', 'YYYY-MM-DD') AS day, 0 AS enquiries,
          COUNT(*) FILTER (WHERE note ~ '^[A-Z_]+ → CONFIRMED:')::int AS confirmed,
          COUNT(*) FILTER (WHERE note ~ '^[A-Z_]+ → READY:')::int AS ready
        FROM "OrderEvent" WHERE action = 'status' AND "createdAt" >= ${start} AND "createdAt" <= ${now} GROUP BY day
      ) daily GROUP BY day ORDER BY day`,
    prisma.orderEnquiry.findMany({
      take: 6,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, reference: true, totalQuantity: true, createdAt: true },
    }),
    prisma.orderEvent.findMany({
      take: 6,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        action: true,
        staffName: true,
        createdAt: true,
        workflow: { select: { order: { select: { reference: true } } } },
      },
    }),
    isAdmin
      ? prisma.adminAudit.findMany({
          take: 6,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { id: true, action: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);
  const activity = [
    ...enquiries.map((row) => ({
      id: row.id,
      title: 'New enquiry received',
      detail: `${row.totalQuantity.toLocaleString('en-NG')} wristbands`,
      href: `/admin/orders/${row.reference}`,
      createdAt: row.createdAt,
      icon: 'quote',
    })),
    ...events.map((row) => ({
      id: row.id,
      title:
        (
          {
            status: 'Order progress updated',
            quote: 'Quote prepared',
            acceptQuote: 'Quote accepted',
            payment: 'Payment record added',
            contact: 'Delivery details updated',
            note: 'Staff note added',
          } as Record<string, string>
        )[row.action] ?? 'Order updated',
      detail: row.staffName,
      href: `/admin/orders/${row.workflow.order.reference}`,
      createdAt: row.createdAt,
      icon: 'orders',
    })),
    ...audits.map((row) => ({
      id: row.id,
      title: row.action.toLowerCase().replace(/_/g, ' '),
      detail: 'Administration',
      href: row.action.startsWith('STAFF')
        ? '/admin/staff'
        : row.action.includes('PASSWORD')
          ? '/admin/security'
          : '/admin/products',
      createdAt: row.createdAt,
      icon: 'settings',
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
    .slice(0, 6);
  return { series: fillDays(days, now, rows), activity, timezone: 'Africa/Lagos' };
}
