CREATE TABLE "FulfilmentEnquiry" (
 "id" TEXT NOT NULL PRIMARY KEY, "requestId" TEXT NOT NULL, "requestHash" TEXT NOT NULL,
 "reference" TEXT NOT NULL, "name" TEXT NOT NULL, "business" TEXT NOT NULL,
 "email" TEXT NOT NULL, "phone" TEXT NOT NULL, "monthlyOrders" TEXT NOT NULL,
 "requirements" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'NEW',
 "version" INTEGER NOT NULL DEFAULT 0, "history" JSONB NOT NULL DEFAULT '[]',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "FulfilmentEnquiry_requestId_key" ON "FulfilmentEnquiry"("requestId");
CREATE UNIQUE INDEX "FulfilmentEnquiry_reference_key" ON "FulfilmentEnquiry"("reference");
CREATE INDEX "FulfilmentEnquiry_status_createdAt_idx" ON "FulfilmentEnquiry"("status", "createdAt");
