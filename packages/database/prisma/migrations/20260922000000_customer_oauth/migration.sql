ALTER TABLE "CustomerAccount" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "CustomerAccount" ADD COLUMN "supabaseAuthId" TEXT;
CREATE UNIQUE INDEX "CustomerAccount_supabaseAuthId_key" ON "CustomerAccount"("supabaseAuthId");
