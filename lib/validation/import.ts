import { z } from "zod";
import { REGEX } from "@/constants";

export const importRowSchema = z.object({
  ain: z.string().regex(REGEX.AIN),
  serialNumber: z.string().regex(REGEX.SERIAL),
  name: z.string().min(2).max(120),
  purchaseDate: z.string().min(1),
  purchaseCost: z.string().regex(REGEX.CURRENCY),
  categoryName: z.string().min(1),
  branchCode: z.string().min(1),
});
