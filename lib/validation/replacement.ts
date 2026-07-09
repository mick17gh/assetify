import { z } from "zod";
import { optionalCuid } from "./helpers";

export const recomputeReplacementSchema = z.object({
  branchId: optionalCuid,
});

export const acknowledgeDisposalSchema = z.object({
  assetId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});
