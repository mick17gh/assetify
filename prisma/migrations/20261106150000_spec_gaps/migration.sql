CREATE TYPE "OrganizationType" AS ENUM ('COMMERCIAL_BANK', 'RURAL_COMMUNITY_BANK', 'SAVINGS_AND_LOANS', 'MICROFINANCE', 'INSURANCE', 'FINTECH', 'GOVERNMENT', 'HEALTHCARE', 'EDUCATION', 'MANUFACTURING', 'OTHER');
CREATE TYPE "AssignmentType" AS ENUM ('PERMANENT', 'TEMPORARY', 'SHARED', 'LOANER');
CREATE TYPE "AcknowledgementMethod" AS ENUM ('CHECKBOX', 'PIN', 'SIGNATURE');
CREATE TYPE "NotFoundReason" AS ENUM ('UNABLE_TO_LOCATE', 'EMPLOYEE_NO_LONGER_HAS_ASSET', 'TRANSFERRED', 'UNDER_REPAIR', 'IN_STORAGE', 'DISPOSED', 'MISSING', 'OTHER');
CREATE TYPE "TransferReason" AS ENUM ('EMPLOYEE_TRANSFER', 'BRANCH_TRANSFER', 'DEPARTMENT_TRANSFER', 'TEMPORARY_MOVEMENT', 'REPAIR', 'REPLACEMENT', 'STORAGE', 'OTHER');
CREATE TYPE "RepairOutcome" AS ENUM ('REPAIRED', 'NOT_REPAIRED', 'REPLACEMENT_RECOMMENDED', 'BEYOND_ECONOMICAL_REPAIR', 'AWAITING_PARTS', 'OTHER');
CREATE TYPE "DisposalApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'SURPLUS';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'PENDING_DISPOSAL';
ALTER TYPE "AssetCondition" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "AssetCondition" ADD VALUE IF NOT EXISTS 'DAMAGED';
ALTER TYPE "AssetCondition" ADD VALUE IF NOT EXISTS 'BEYOND_ECONOMICAL_REPAIR';
ALTER TYPE "AssetCondition" ADD VALUE IF NOT EXISTS 'UNKNOWN';

ALTER TABLE "Organization"
  ADD COLUMN "organizationType" "OrganizationType",
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "primaryContactName" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Region" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Region_organizationId_name_key" ON "Region"("organizationId", "name");
CREATE INDEX "Region_organizationId_idx" ON "Region"("organizationId");
ALTER TABLE "Region" ADD CONSTRAINT "Region_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Region" ("id", "organizationId", "name", "updatedAt")
SELECT 'region_' || "id", "id", 'Default', CURRENT_TIMESTAMP FROM "Organization";

ALTER TABLE "Branch" ADD COLUMN "regionId" TEXT;
UPDATE "Branch" SET "regionId" = 'region_' || "organizationId";
ALTER TABLE "Branch" ALTER COLUMN "regionId" SET NOT NULL;
CREATE INDEX "Branch_regionId_idx" ON "Branch"("regionId");
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Asset"
  ADD COLUMN "manufacturer" TEXT,
  ADD COLUMN "modelName" TEXT,
  ADD COLUMN "existingAssetNumber" TEXT,
  ADD COLUMN "assignmentType" "AssignmentType",
  ADD COLUMN "expectedReturnDate" TIMESTAMP(3);

ALTER TABLE "AssetMovement" ADD COLUMN "transferReason" "TransferReason";

ALTER TABLE "MaintenanceRecord"
  ADD COLUMN "reportedDate" TIMESTAMP(3),
  ADD COLUMN "sentDate" TIMESTAMP(3),
  ADD COLUMN "actualReturnDate" TIMESTAMP(3),
  ADD COLUMN "warrantyClaim" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "repairOutcome" "RepairOutcome";

ALTER TABLE "AssetVerification"
  ADD COLUMN "notFoundReason" "NotFoundReason",
  ADD COLUMN "lastKnownLocation" TEXT;

ALTER TABLE "DisposalRecommendation"
  ADD COLUMN "condition" "AssetCondition",
  ADD COLUMN "recommendedAction" TEXT,
  ADD COLUMN "approvalStatus" "DisposalApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

CREATE INDEX "DisposalRecommendation_approvalStatus_idx" ON "DisposalRecommendation"("approvalStatus");
ALTER TABLE "DisposalRecommendation" ADD CONSTRAINT "DisposalRecommendation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AssignmentAcknowledgement" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "method" "AcknowledgementMethod" NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  CONSTRAINT "AssignmentAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssignmentAcknowledgement_assetId_acceptedAt_idx" ON "AssignmentAcknowledgement"("assetId", "acceptedAt");
ALTER TABLE "AssignmentAcknowledgement" ADD CONSTRAINT "AssignmentAcknowledgement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentAcknowledgement" ADD CONSTRAINT "AssignmentAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
