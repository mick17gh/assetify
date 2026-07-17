import { z } from "zod";
import { DEPRECIATION_METHOD } from "@/constants";
import { enumFromConst } from "./helpers";

export const depreciationPolicySchema = z.object({
  categoryId: z.string().cuid(),
  method: enumFromConst(DEPRECIATION_METHOD).default(DEPRECIATION_METHOD.STRAIGHT_LINE),
  usefulLifeYears: z.coerce.number().int().min(1).max(50),
  salvagePercent: z.coerce.number().min(0).max(100),
});

export const updateDepreciationPolicySchema = depreciationPolicySchema.extend({
  id: z.string().cuid(),
});

export const deleteDepreciationPolicySchema = z.object({
  id: z.string().cuid(),
});
