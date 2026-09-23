import type { Prisma } from '@bandit/database';
import { customerUpdate } from './messages.js';

export const notificationsEnabled = () => process.env.ORDER_NOTIFICATIONS_ENABLED === 'true';
export async function enqueueOrderNotification(
  tx: Prisma.TransactionClient,
  reference: string,
  kind: string,
  eventKey: string
) {
  if (!notificationsEnabled()) return;
  const order = await tx.orderEnquiry.findUniqueOrThrow({
    where: { reference },
    include: { workflow: true, customer: true },
  });
  // Legacy password account emails were never verified. Staff can explicitly record an address.
  const recipient =
    order.workflow?.notificationEmail ||
    (order.customer?.supabaseAuthId ? order.customer.email : '');
  const payload = {
    from: process.env.ORDER_EMAIL_FROM || '',
    to: recipient ? [recipient] : [],
    reply_to: 'banditwristbandsng@gmail.com',
    subject: `BAND-IT order update: ${reference}`,
    text: customerUpdate(reference, kind, order.workflow?.deliveryMethod, order.workflow?.tracking),
  };
  await tx.orderNotification.upsert({
    where: { eventKey },
    update: {},
    create: {
      eventKey,
      reference,
      kind,
      recipient,
      payload,
      status: recipient ? 'PENDING' : 'MISSING_CONTACT',
    },
  });
}
