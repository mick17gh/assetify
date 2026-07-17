import { z } from "zod";
import { DISPOSAL_METHOD, REGEX } from "@/constants";
import { enumFromConst } from "./helpers";

export const recordDisposalSchema = z
  .object({
    assetId: z.string().cuid(),
    method: enumFromConst(DISPOSAL_METHOD),
    disposalDate: z.string().min(1),
    reason: z.string().min(3).max(500),
    salePrice: z.string().regex(REGEX.CURRENCY).optional().or(z.literal("")),
    buyerName: z.string().max(120).optional(),
    buyerContact: z.string().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === DISPOSAL_METHOD.SOLD) {
      if (!data.salePrice) {
        ctx.addIssue({ code: "custom", message: "Sale price is required.", path: ["salePrice"] });
      }
      if (!data.buyerName?.trim()) {
        ctx.addIssue({ code: "custom", message: "Buyer name is required.", path: ["buyerName"] });
      }
    }
  });
