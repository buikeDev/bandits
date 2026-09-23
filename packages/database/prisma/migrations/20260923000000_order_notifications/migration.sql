ALTER TABLE "OrderWorkflow" ADD COLUMN "notificationEmail" TEXT NOT NULL DEFAULT '';
CREATE TABLE "OrderNotification" (
  "id" TEXT NOT NULL PRIMARY KEY, "eventKey" TEXT NOT NULL, "reference" TEXT NOT NULL,
  "kind" TEXT NOT NULL, "recipient" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstAttemptAt" TIMESTAMP(3), "leaseToken" TEXT, "providerId" TEXT, "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "OrderNotification_eventKey_key" ON "OrderNotification"("eventKey");
CREATE INDEX "OrderNotification_status_availableAt_idx" ON "OrderNotification"("status", "availableAt");
CREATE INDEX "OrderNotification_reference_createdAt_idx" ON "OrderNotification"("reference", "createdAt");
