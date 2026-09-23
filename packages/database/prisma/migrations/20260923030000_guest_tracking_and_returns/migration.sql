ALTER TABLE "OrderEnquiry" ADD COLUMN "trackingTokenHash" TEXT NOT NULL DEFAULT '';
CREATE TABLE "OrderReturn" (
 "id" TEXT NOT NULL PRIMARY KEY, "workflowId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'REQUESTED',
 "reason" TEXT NOT NULL, "units" INTEGER NOT NULL, "note" TEXT NOT NULL DEFAULT '', "resolution" TEXT NOT NULL DEFAULT '',
 "stockReceived" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "OrderReturn_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "OrderWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OrderReturn_workflowId_status_idx" ON "OrderReturn"("workflowId", "status");
