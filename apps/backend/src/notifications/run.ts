import { prisma } from '@bandit/database';
import { heartbeatStore } from './heartbeat.js';
import { processNotification } from './worker.js';
let stopped = false;
let lastHeartbeat = 0;
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
  await heartbeatStore.start(new Date());
  while (!stopped) {
    try {
      await processNotification();
      if (Date.now() - lastHeartbeat >= 30000) {
        await heartbeatStore.touch(new Date(), null);
        lastHeartbeat = Date.now();
      }
    } catch {
      console.error('Notification worker could not process queue; retrying shortly.');
      if (Date.now() - lastHeartbeat >= 30000) {
        try {
          await heartbeatStore.touch(new Date(), 'Notification processing failed.');
          lastHeartbeat = Date.now();
        } catch {
          console.error('Notification worker heartbeat could not be recorded.');
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await prisma.$disconnect();
}
void run().catch(() => {
  console.error('Notification worker stopped unexpectedly.');
  process.exitCode = 1;
});
