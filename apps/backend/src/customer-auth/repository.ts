import { prisma } from '@bandit/database';

export const customerAuthRepository = {
  findCustomerByEmail: (email: string) =>
    prisma.customerAccount.findUnique({ where: { email } }),
  findCustomerBySessionHash: (tokenHash: string) =>
    prisma.customerAccount.findFirst({
      where: { sessions: { some: { tokenHash, expiresAt: { gt: new Date() } } } },
    }),
  createCustomer: (data: { name: string; email: string; passwordHash: string }) =>
    prisma.customerAccount.create({ data }),
  createSession: (customerId: string, tokenHash: string, expiresAt: Date) =>
    prisma.customerSession.create({ data: { customerId, tokenHash, expiresAt } }),
  deleteSession: (tokenHash: string) =>
    prisma.customerSession.deleteMany({ where: { tokenHash } }),
};
