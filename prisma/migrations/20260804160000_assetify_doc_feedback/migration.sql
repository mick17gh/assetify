-- AlterTable AssetDocument: add displayName, backfill from fileName
ALTER TABLE "AssetDocument" ADD COLUMN "displayName" TEXT;
UPDATE "AssetDocument" SET "displayName" = "fileName" WHERE "displayName" IS NULL;
ALTER TABLE "AssetDocument" ALTER COLUMN "displayName" SET NOT NULL;

-- AlterTable ConditionFlag: add notes
ALTER TABLE "ConditionFlag" ADD COLUMN "notes" TEXT;

-- AlterTable AssetRequest: add requestedAssetName + custodianId
ALTER TABLE "AssetRequest" ADD COLUMN "requestedAssetName" TEXT;
UPDATE "AssetRequest" SET "requestedAssetName" = 'Pending asset' WHERE "requestedAssetName" IS NULL;
ALTER TABLE "AssetRequest" ALTER COLUMN "requestedAssetName" SET NOT NULL;
ALTER TABLE "AssetRequest" ADD COLUMN "custodianId" TEXT;

-- CreateIndex
CREATE INDEX "AssetRequest_custodianId_idx" ON "AssetRequest"("custodianId");

-- AddForeignKey
ALTER TABLE "AssetRequest" ADD CONSTRAINT "AssetRequest_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
