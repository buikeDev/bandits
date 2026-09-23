CREATE TABLE "ArtworkAsset" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "storageKey" TEXT NOT NULL,
 "ownerHash" TEXT NOT NULL,
 "originalName" TEXT NOT NULL,
 "contentType" TEXT NOT NULL,
 "byteSize" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ArtworkAsset_storageKey_key" ON "ArtworkAsset"("storageKey");
CREATE INDEX "ArtworkAsset_ownerHash_createdAt_idx" ON "ArtworkAsset"("ownerHash", "createdAt");
