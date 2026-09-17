-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderWorkflow" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "deliveryAddress" TEXT NOT NULL DEFAULT '',
    "deliveryMethod" TEXT NOT NULL DEFAULT 'COLLECTION',
    "tracking" TEXT NOT NULL DEFAULT '',
    "acceptedQuoteId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderQuote" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "lines" JSONB NOT NULL,
    "printingMinor" BIGINT NOT NULL,
    "deliveryMinor" BIGINT NOT NULL,
    "totalMinor" BIGINT NOT NULL,
    "note" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'RESERVED',

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_tokenHash_key" ON "StaffSession"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_idx" ON "StaffSession"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderWorkflow_orderId_key" ON "OrderWorkflow"("orderId");

-- CreateIndex
CREATE INDEX "OrderQuote_workflowId_createdAt_idx" ON "OrderQuote"("workflowId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPayment_workflowId_reference_key" ON "OrderPayment"("workflowId", "reference");

-- CreateIndex
CREATE INDEX "OrderEvent_workflowId_createdAt_idx" ON "OrderEvent"("workflowId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_workflowId_variantId_key" ON "StockReservation"("workflowId", "variantId");

-- CreateIndex
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderWorkflow" ADD CONSTRAINT "OrderWorkflow_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEnquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderQuote" ADD CONSTRAINT "OrderQuote_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
