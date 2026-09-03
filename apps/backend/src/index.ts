import 'dotenv/config';
import { checkDatabaseConnection, prisma } from '@bandit/database';
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp({
  checkDatabase: checkDatabaseConnection,
  corsOrigin: config.CORS_ORIGIN,
});
const server = app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received; shutting down`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
