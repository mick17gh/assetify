-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VerificationOutcome" AS ENUM ('VERIFIED', 'NOT_FOUND', 'UNREGISTERED', 'EXCEPTION');
CREATE TYPE "ExceptionType" AS ENUM ('WRONG_LOCATION', 'WRONG_CUSTODIAN', 'MISSING', 'UNREGISTERED', 'DUPLICATE', 'DAMAGED', 'INCORRECT_SERIAL', 'INCORRECT_CATEGORY', 'DISPOSED_BUT_REGISTERED', 'OTHER');
CREATE TYPE "ExceptionStatus" AS ENUM ('IDENTIFIED', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "VerificationCampaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "branchIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignAssignment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignScopeSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    CONSTRAINT "CampaignScopeSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetVerification" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "assetId" TEXT,
    "organizationId" TEXT NOT NULL,
    "outcome" "VerificationOutcome" NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT NOT NULL,
    "locationNote" TEXT,
    "condition" "AssetCondition",
    "photoUrl" TEXT,
    "notes" TEXT,
    CONSTRAINT "AssetVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetException" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "assetId" TEXT,
    "branchId" TEXT,
    "type" "ExceptionType" NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "identifiedById" TEXT NOT NULL,
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    CONSTRAINT "AssetException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExceptionEvent" (
    "id" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "fromStatus" "ExceptionStatus",
    "toStatus" "ExceptionStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExceptionEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExceptionEvidence" (
    "id" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExceptionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationCampaign_organizationId_status_idx" ON "VerificationCampaign"("organizationId", "status");
CREATE INDEX "CampaignAssignment_userId_idx" ON "CampaignAssignment"("userId");
CREATE UNIQUE INDEX "CampaignAssignment_campaignId_userId_branchId_key" ON "CampaignAssignment"("campaignId", "userId", "branchId");
CREATE UNIQUE INDEX "CampaignScopeSnapshot_campaignId_assetId_key" ON "CampaignScopeSnapshot"("campaignId", "assetId");
CREATE INDEX "CampaignScopeSnapshot_campaignId_idx" ON "CampaignScopeSnapshot"("campaignId");
CREATE UNIQUE INDEX "AssetVerification_campaignId_assetId_key" ON "AssetVerification"("campaignId", "assetId");
CREATE INDEX "AssetVerification_campaignId_outcome_idx" ON "AssetVerification"("campaignId", "outcome");
CREATE INDEX "AssetVerification_assetId_idx" ON "AssetVerification"("assetId");
CREATE INDEX "AssetException_organizationId_status_idx" ON "AssetException"("organizationId", "status");
CREATE INDEX "AssetException_campaignId_assetId_type_idx" ON "AssetException"("campaignId", "assetId", "type");
CREATE INDEX "ExceptionEvent_exceptionId_createdAt_idx" ON "ExceptionEvent"("exceptionId", "createdAt");
CREATE INDEX "ExceptionEvidence_exceptionId_idx" ON "ExceptionEvidence"("exceptionId");

-- AddForeignKey
ALTER TABLE "VerificationCampaign" ADD CONSTRAINT "VerificationCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationCampaign" ADD CONSTRAINT "VerificationCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignScopeSnapshot" ADD CONSTRAINT "CampaignScopeSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignScopeSnapshot" ADD CONSTRAINT "CampaignScopeSnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetVerification" ADD CONSTRAINT "AssetVerification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetVerification" ADD CONSTRAINT "AssetVerification_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetVerification" ADD CONSTRAINT "AssetVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_identifiedById_fkey" FOREIGN KEY ("identifiedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetException" ADD CONSTRAINT "AssetException_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExceptionEvent" ADD CONSTRAINT "ExceptionEvent_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "AssetException"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExceptionEvent" ADD CONSTRAINT "ExceptionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExceptionEvidence" ADD CONSTRAINT "ExceptionEvidence_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "AssetException"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExceptionEvidence" ADD CONSTRAINT "ExceptionEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
