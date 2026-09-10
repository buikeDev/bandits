CREATE TABLE "OrderEnquiry" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AWAITING_WHATSAPP',
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "snapshot" JSONB NOT NULL,
  "message" TEXT NOT NULL,
  "totalQuantity" INTEGER NOT NULL,
  "subtotalMinor" BIGINT NOT NULL,
  "quoteRequired" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEnquiry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrderEnquiry_requestId_key" ON "OrderEnquiry"("requestId");
CREATE UNIQUE INDEX "OrderEnquiry_reference_key" ON "OrderEnquiry"("reference");
CREATE INDEX "OrderEnquiry_createdAt_idx" ON "OrderEnquiry"("createdAt");
