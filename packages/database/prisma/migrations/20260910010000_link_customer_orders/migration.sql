ALTER TABLE "OrderEnquiry" ADD COLUMN "customerId" TEXT;
CREATE INDEX "OrderEnquiry_customerId_createdAt_idx" ON "OrderEnquiry"("customerId", "createdAt");
ALTER TABLE "OrderEnquiry" ADD CONSTRAINT "OrderEnquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
