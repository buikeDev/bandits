CREATE TABLE "NotificationWorkerHeartbeat" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'order-notifications',
  "startedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "lastSuccessAt" TIMESTAMP(3),
  "lastError" TEXT
);
