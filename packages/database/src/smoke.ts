import 'dotenv/config';

import { prisma } from './index.js';

const email = `database-smoke-${Date.now()}@bandit.invalid`;

async function main(): Promise<void> {
  const created = await prisma.customerAccount.create({
    data: {
      email,
      name: 'Database Smoke Test',
      passwordHash: 'not-a-real-password-hash',
    },
  });

  const found = await prisma.customerAccount.findUnique({ where: { email } });
  if (!found || found.id !== created.id) {
    throw new Error('Database smoke test could not read the created account');
  }

  await prisma.customerAccount.delete({ where: { id: created.id } });
  console.log('Database smoke test passed');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
