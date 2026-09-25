import { prisma } from '@bandit/database';
import { notificationsEnabled } from './queue.js';

const heartbeatId = 'order-notifications';
const staleAfterMs = 90_000;

type HeartbeatRow = {
  startedAt: Date;
  lastSeenAt: Date;
  lastSuccessAt: Date | null;
  lastError: string | null;
};

export type NotificationWorkerStatus = {
  enabled: boolean;
  status: 'DISABLED' | 'NOT_STARTED' | 'HEALTHY' | 'STALE';
  startedAt: string | null;
  lastSeenAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
};

export const heartbeatStore = {
  start: async (now: Date) =>
    prisma.$executeRaw`
      INSERT INTO "NotificationWorkerHeartbeat" ("id", "startedAt", "lastSeenAt", "lastSuccessAt", "lastError")
      VALUES (${heartbeatId}, ${now}, ${now}, ${now}, NULL)
      ON CONFLICT ("id") DO UPDATE SET
        "startedAt" = EXCLUDED."startedAt",
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "lastSuccessAt" = EXCLUDED."lastSuccessAt",
        "lastError" = NULL
    `,
  touch: async (now: Date, error: string | null) =>
    prisma.$executeRaw`
      UPDATE "NotificationWorkerHeartbeat"
      SET "lastSeenAt" = ${now},
          "lastSuccessAt" = CASE WHEN ${error}::text IS NULL THEN ${now} ELSE "lastSuccessAt" END,
          "lastError" = ${error}
      WHERE "id" = ${heartbeatId}
    `,
  current: async () =>
    prisma.$queryRaw<HeartbeatRow[]>`
      SELECT "startedAt", "lastSeenAt", "lastSuccessAt", "lastError"
      FROM "NotificationWorkerHeartbeat"
      WHERE "id" = ${heartbeatId}
    `,
};

export function workerStatus(
  row: HeartbeatRow | undefined,
  enabled = notificationsEnabled(),
  now = Date.now()
): NotificationWorkerStatus {
  if (!enabled)
    return {
      enabled: false,
      status: 'DISABLED',
      startedAt: null,
      lastSeenAt: null,
      lastSuccessAt: null,
      lastError: null,
    };
  if (!row)
    return {
      enabled: true,
      status: 'NOT_STARTED',
      startedAt: null,
      lastSeenAt: null,
      lastSuccessAt: null,
      lastError: null,
    };
  return {
    enabled: true,
    status: now - row.lastSeenAt.getTime() <= staleAfterMs ? 'HEALTHY' : 'STALE',
    startedAt: row.startedAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
    lastError: row.lastError,
  };
}

export async function notificationWorkerStatus(): Promise<NotificationWorkerStatus> {
  const rows = await heartbeatStore.current();
  return workerStatus(rows[0]);
}
