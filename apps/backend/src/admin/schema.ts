import { z } from 'zod';
export const statuses = [
  'AWAITING_WHATSAPP',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DISPATCHED',
  'COMPLETED',
  'CANCELLED',
] as const;
const minor = z.number().int().min(0).max(100000000000);
const base = { version: z.number().int().min(0) };
export const actionSchema = z.discriminatedUnion('action', [
  z.object({
    ...base,
    action: z.literal('deliveryFee'),
    deliveryMinor: minor,
    note: z.string().trim().min(1).max(1000),
  }),
  z.object({ ...base, action: z.literal('note'), note: z.string().trim().min(1).max(3000) }),
  z.object({
    ...base,
    action: z.literal('contact'),
    contactName: z.string().trim().max(150),
    contactPhone: z.string().trim().max(40),
    deliveryAddress: z.string().trim().max(1000),
    deliveryMethod: z.enum(['COLLECTION', 'DELIVERY']),
    tracking: z.string().trim().max(300),
  }),
  z.object({
    ...base,
    action: z.literal('status'),
    status: z.enum(statuses),
    note: z.string().trim().min(1).max(1000),
  }),
  z.object({
    ...base,
    action: z.literal('quote'),
    lines: z
      .array(z.object({ unitMinor: minor }))
      .min(1)
      .max(50),
    printingMinor: minor,
    deliveryMinor: minor,
    note: z.string().trim().max(1000),
  }),
  z.object({
    ...base,
    action: z.literal('acceptQuote'),
    quoteId: z.string().min(1),
    note: z.string().trim().min(1).max(1000),
  }),
  z.object({
    ...base,
    action: z.literal('payment'),
    amountMinor: minor.positive(),
    kind: z.enum(['PAYMENT', 'REFUND']),
    reference: z.string().trim().min(3).max(150),
  }),
]);
export type OrderAction = z.infer<typeof actionSchema>;
export const transitions: Record<string, readonly string[]> = {
  AWAITING_WHATSAPP: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'READY', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['DISPATCHED', 'COMPLETED', 'CANCELLED'],
  DISPATCHED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};
export function paymentState(
  total: bigint | null,
  payments: { amountMinor: bigint; kind: string }[]
) {
  const paid = payments.reduce(
    (sum, p) => sum + (p.kind === 'PAYMENT' ? p.amountMinor : -p.amountMinor),
    0n
  );
  const refunded = payments.some((p) => p.kind === 'REFUND');
  return {
    paidMinor: paid.toString(),
    paymentStatus:
      total === 0n && !refunded
        ? 'PAID'
        : paid === 0n
          ? refunded
            ? 'REFUNDED'
            : 'UNPAID'
          : total !== null && paid >= total
            ? 'PAID'
            : 'PART_PAID',
  };
}
