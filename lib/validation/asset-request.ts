import { z } from "zod";
import { ASSET_REQUEST_STATUS, ASSET_REQUEST_URGENCY } from "@/constants";
import { entityId, enumFromConst, optionalEntityId, optionalText } from "./helpers";

export const createAssetRequestSchema = z.object({
  categoryId: entityId,
  requestedAssetName: z.string().trim().min(1).max(200),
  custodianId: optionalEntityId,
  departmentId: optionalEntityId,
  reason: z.string().trim().min(3).max(1000),
  urgency: enumFromConst(ASSET_REQUEST_URGENCY).default(ASSET_REQUEST_URGENCY.MEDIUM),
  notes: optionalText,
});

export const reviewAssetRequestSchema = z
  .object({
    id: entityId,
    decision: z.enum(["APPROVED", "REJECTED"]),
    reviewComment: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECTED" && !data.reviewComment) {
      ctx.addIssue({
        code: "custom",
        message: "A rejection comment is required.",
        path: ["reviewComment"],
      });
    }
  });

export const fulfillAssetRequestSchema = z.object({
  id: entityId,
  ain: z.string().trim().min(4).max(32).optional().or(z.literal("")),
  serialNumber: z.string().trim().min(4).max(50).optional().or(z.literal("")),
  purchaseCost: z.string().trim().optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  poNumber: z.string().max(80).optional().or(z.literal("")),
  invoiceNumber: z.string().max(80).optional().or(z.literal("")),
  capitalizedDate: z.string().optional().or(z.literal("")),
  activateAsset: z.string().optional(),
});

export const ASSET_REQUEST_REVIEW_DECISION = {
  APPROVED: ASSET_REQUEST_STATUS.APPROVED,
  REJECTED: ASSET_REQUEST_STATUS.REJECTED,
} as const;
