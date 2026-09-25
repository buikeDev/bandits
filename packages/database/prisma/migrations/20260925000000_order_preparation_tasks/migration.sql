CREATE TABLE "OrderPreparationTask" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "staffId" TEXT,
    "staffName" TEXT,
    CONSTRAINT "OrderPreparationTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderPreparationTask_workflowId_key_key" ON "OrderPreparationTask"("workflowId", "key");
CREATE INDEX "OrderPreparationTask_workflowId_completedAt_idx" ON "OrderPreparationTask"("workflowId", "completedAt");

ALTER TABLE "OrderPreparationTask"
  ADD CONSTRAINT "OrderPreparationTask_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
