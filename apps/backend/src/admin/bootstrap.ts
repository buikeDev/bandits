import 'dotenv/config';
import { prisma } from '@bandit/database';
import { z } from 'zod';
import { hashPassword } from '../customer-auth/password.js';

// Run with securely supplied environment values; never print the password.
async function main() {
  const input = z
    .object({
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
      name: z.string().min(2).max(100),
      password: z.string().min(12).max(128),
    })
    .parse({
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME,
      password: process.env.ADMIN_PASSWORD,
    });
  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction(
    async (tx) => {
      if (await tx.staffAccount.count({ where: { role: 'ADMIN', isActive: true } }))
        throw new Error(
          'An administrator already exists. Use the staff dashboard to create accounts.'
        );
      await tx.staffAccount.create({
        data: { email: input.email, name: input.name, passwordHash, role: 'ADMIN' },
      });
    },
    { isolationLevel: 'Serializable' }
  );
  console.log('Administrator created. Sign in at /admin/login.');
}
main()
  .catch(() => {
    console.error(
      'Administrator setup failed. Check required ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD values (12+ characters), migrations, and whether an administrator already exists.'
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
