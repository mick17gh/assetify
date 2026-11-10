-- Enums
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'RENTED', 'LEASED', 'DONATED_IN');
CREATE TYPE "AcknowledgementStatus" AS ENUM ('PENDING', 'ACCEPTED');
CREATE TYPE "DepreciationRunStatus" AS ENUM ('DRAFT', 'POSTED');

ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'PENDING_ONBOARDING';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'INVOICE';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'PURCHASE_ORDER';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'DISPOSAL_EVIDENCE';

-- Asset procurement / lease / onboarding
ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "poNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "capitalizedDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ownershipType" "OwnershipType" NOT NULL DEFAULT 'OWNED',
  ADD COLUMN IF NOT EXISTS "lessorName" TEXT,
  ADD COLUMN IF NOT EXISTS "leaseStartDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "leaseEndDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "leaseMonthlyCost" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Asset_ownershipType_idx" ON "Asset"("ownershipType");
CREATE INDEX IF NOT EXISTS "Asset_organizationId_status_idx" ON "Asset"("organizationId", "status");

-- Assignment acknowledgements: support deferred acceptance
ALTER TABLE "AssignmentAcknowledgement"
  ADD COLUMN IF NOT EXISTS "status" "AcknowledgementStatus" NOT NULL DEFAULT 'ACCEPTED',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AssignmentAcknowledgement" ALTER COLUMN "method" DROP NOT NULL;
ALTER TABLE "AssignmentAcknowledgement" ALTER COLUMN "acceptedAt" DROP DEFAULT;
ALTER TABLE "AssignmentAcknowledgement" ALTER COLUMN "acceptedAt" DROP NOT NULL;

UPDATE "AssignmentAcknowledgement"
SET "acceptedAt" = COALESCE("acceptedAt", "createdAt"),
    "status" = 'ACCEPTED'
WHERE "acceptedAt" IS NOT NULL OR "method" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "AssignmentAcknowledgement_userId_status_createdAt_idx"
  ON "AssignmentAcknowledgement"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "AssignmentAcknowledgement_status_createdAt_idx"
  ON "AssignmentAcknowledgement"("status", "createdAt");

-- Period depreciation runs
CREATE TABLE IF NOT EXISTS "DepreciationRun" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" "DepreciationRunStatus" NOT NULL DEFAULT 'POSTED',
  "notes" TEXT,
  "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "runByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepreciationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepreciationRunLine" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "ain" TEXT NOT NULL,
  "branchId" TEXT,
  "departmentId" TEXT,
  "method" "DepreciationMethod" NOT NULL,
  "openingBookValue" DECIMAL(14,2) NOT NULL,
  "periodExpense" DECIMAL(14,2) NOT NULL,
  "closingBookValue" DECIMAL(14,2) NOT NULL,
  "accumulatedDepreciation" DECIMAL(14,2) NOT NULL,
  CONSTRAINT "DepreciationRunLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DepreciationRun_organizationId_periodStart_periodEnd_idx"
  ON "DepreciationRun"("organizationId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "DepreciationRun_organizationId_runAt_idx"
  ON "DepreciationRun"("organizationId", "runAt");
CREATE INDEX IF NOT EXISTS "DepreciationRunLine_runId_idx" ON "DepreciationRunLine"("runId");
CREATE INDEX IF NOT EXISTS "DepreciationRunLine_assetId_idx" ON "DepreciationRunLine"("assetId");

ALTER TABLE "DepreciationRun"
  ADD CONSTRAINT "DepreciationRun_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepreciationRun"
  ADD CONSTRAINT "DepreciationRun_runByUserId_fkey"
  FOREIGN KEY ("runByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepreciationRunLine"
  ADD CONSTRAINT "DepreciationRunLine_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "DepreciationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepreciationRunLine"
  ADD CONSTRAINT "DepreciationRunLine_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
