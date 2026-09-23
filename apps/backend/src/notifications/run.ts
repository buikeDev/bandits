import { prisma } from '@bandit/database';
import { processNotification } from './worker.js';
let stopped = false;
process.on('SIGINT', () => {
  stopped = true;
});
process.on('SIGTERM', () => {
  stopped = true;
});
if (
  process.env.ORDER_NOTIFICATIONS_ENABLED !== 'true' ||
  !process.env.RESEND_API_KEY ||
  !process.env.ORDER_EMAIL_FROM
)
  throw new Error(
    'Configure notification enable flag, Resend key and verified sender before starting the worker.'
  );
async function run() {
  while (!stopped) {
    try {
      await processNotification();
    } catch {
      console.error('Notification worker could not process queue; retrying shortly.');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await prisma.$disconnect();
}
void run().catch(() => {
  console.error('Notification worker stopped unexpectedly.');
  process.exitCode = 1;
});
