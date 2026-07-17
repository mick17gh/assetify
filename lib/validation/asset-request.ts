import { z } from "zod";
import { ASSET_REQUEST_STATUS, ASSET_REQUEST_URGENCY } from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

export const createAssetRequestSchema = z.object({
  categoryId: z.string().cuid(),
  departmentId: optionalCuid,
  reason: z.string().min(3).max(1000),
  urgency: enumFromConst(ASSET_REQUEST_URGENCY).default(ASSET_REQUEST_URGENCY.MEDIUM),
  notes: z.string().max(2000).optional(),
});

export const reviewAssetRequestSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewComment: z.string().max(1000).optional(),
});

export const fulfillAssetRequestSchema = z.object({
  id: z.string().cuid(),
});

export const ASSET_REQUEST_REVIEW_DECISION = {
  APPROVED: ASSET_REQUEST_STATUS.APPROVED,
  REJECTED: ASSET_REQUEST_STATUS.REJECTED,
} as const;
