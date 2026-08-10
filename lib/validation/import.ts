import { z } from "zod";
import { ASSET_CONDITION, ASSET_STATUS, REGEX } from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

export const importRowSchema = z.object({
  ain: z.string().regex(REGEX.AIN),
  serialNumber: z.string().regex(REGEX.SERIAL),
  name: z.string().min(2).max(120),
  purchaseDate: z.string().min(1),
  purchaseCost: z.string().regex(REGEX.CURRENCY),
  categoryName: z.string().min(1),
  branchCode: z.string().min(1),
});

const optionalDate = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const date = trimmed.includes("T") ? new Date(trimmed) : new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid warranty expiry date");
    return date.toISOString();
  });

export const confirmImportRowSchema = z.object({
  row: z.number().int().positive(),
  ain: z.string().regex(REGEX.AIN),
  serialNumber: z.string().regex(REGEX.SERIAL),
  name: z.string().min(2).max(120),
  purchaseDate: z
    .string()
    .min(1)
    .transform((value) => {
      const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime())) throw new Error("Invalid purchase date");
      return date.toISOString();
    }),
  purchaseCost: z.string().regex(REGEX.CURRENCY),
  warrantyExpiryDate: optionalDate,
  categoryId: z.string().cuid(),
  branchId: z.string().cuid(),
  departmentId: optionalCuid,
  roomId: optionalCuid,
  shelfId: optionalCuid,
  vendorId: optionalCuid,
  custodianId: optionalCuid,
  status: enumFromConst(ASSET_STATUS).optional(),
  condition: enumFromConst(ASSET_CONDITION).optional(),
});

export const confirmImportSchema = z.object({
  fileName: z.string().max(255).optional(),
  rows: z.array(confirmImportRowSchema).min(1).max(5000),
});
