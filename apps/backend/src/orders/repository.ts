import { prisma } from '@bandit/database';
import type { OrderSnapshot } from './service.js';
import { enqueueOrderNotification } from '../notifications/queue.js';

export const orderRepository = {
  listForCustomer: (customerId: string, page: number) =>
    prisma.orderEnquiry.findMany({
      where: { customerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * 20,
      take: 21,
      select: {
        reference: true,
        status: true,
        workflow: { select: { deliveryMethod: true } },
        createdAt: true,
        message: true,
        totalQuantity: true,
        subtotalMinor: true,
        quoteRequired: true,
      },
    }),
  find: (requestId: string) => prisma.orderEnquiry.findUnique({ where: { requestId } }),
  track: async (reference: string, trackingTokenHash: string) => {
    const row = await prisma.orderEnquiry.findFirst({ where: { reference, trackingTokenHash }, include: { workflow: true } });
    if (!row) return null;
    return { reference: row.reference, status: row.status, deliveryMethod: row.workflow?.deliveryMethod ?? null, tracking: row.workflow?.tracking ?? '', updatedAt: row.workflow?.updatedAt ?? row.createdAt };
  },
  save: (order: OrderSnapshot) =>
    prisma.$transaction(async (tx) => {
      const saved = await tx.orderEnquiry.upsert({
        where: { requestId: order.requestId },
        update: {},
        create: order,
      });
      await enqueueOrderNotification(tx, saved.reference, 'RECEIVED', `received:${saved.id}`);
      return saved;
    }),
};
