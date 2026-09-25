import { prisma, type Prisma } from '@bandit/database';
export const workflowInclude = {
  quotes: { orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }] },
  payments: { orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }] },
  events: { orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }] },
  reservations: true,
  preparationTasks: { orderBy: { key: 'asc' as const } },
  returnCases: { orderBy: { createdAt: 'desc' as const } },
};
export const adminRepository = {
  session: (tokenHash: string) =>
    prisma.staffSession.findUnique({ where: { tokenHash }, include: { staff: true } }),
  detail: (where: Prisma.OrderEnquiryWhereInput) =>
    prisma.orderEnquiry.findFirst({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        workflow: { include: workflowInclude },
      },
    }),
  transaction: <T>(run: (tx: Prisma.TransactionClient) => Promise<T>) =>
    prisma.$transaction(run, { isolationLevel: 'Serializable', timeout: 15000 }),
};
