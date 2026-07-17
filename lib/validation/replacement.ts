import { z } from "zod";
import { entityId, optionalEntityId, optionalText } from "./helpers";

export const recomputeReplacementSchema = z.object({
  branchId: optionalEntityId,
});

export const acknowledgeDisposalSchema = z.object({
  assetId: entityId,
  reason: optionalText,
});
