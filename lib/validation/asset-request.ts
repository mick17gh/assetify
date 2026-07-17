import { z } from "zod";
import { ASSET_REQUEST_STATUS, ASSET_REQUEST_URGENCY } from "@/constants";
import { entityId, enumFromConst, optionalEntityId, optionalText } from "./helpers";

export const createAssetRequestSchema = z.object({
  categoryId: entityId,
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
});

export const ASSET_REQUEST_REVIEW_DECISION = {
  APPROVED: ASSET_REQUEST_STATUS.APPROVED,
  REJECTED: ASSET_REQUEST_STATUS.REJECTED,
} as const;
