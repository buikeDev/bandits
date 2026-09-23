import { prisma } from '@bandit/database';
import type { OrderSnapshot } from './service.js';

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
  save: (order: OrderSnapshot) =>
    prisma.orderEnquiry.upsert({
      where: { requestId: order.requestId },
      update: {},
      create: order,
    }),
};
