import { z } from "zod";
import {
  ASSET_CONDITION,
  ASSET_STATUS,
  DEPRECIATION_METHOD,
  REGEX,
} from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

const purchaseDateSchema = z
  .string()
  .min(1)
  .transform((value) => {
    const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid purchase date");
    return date.toISOString();
  });

export const createAssetSchema = z.object({
  ain: z.string().regex(REGEX.AIN),
  serialNumber: z.string().regex(REGEX.SERIAL),
  name: z.string().min(2).max(120),
  purchaseDate: purchaseDateSchema,
  purchaseCost: z.string().regex(REGEX.CURRENCY),
  categoryId: z.string().cuid(),
  branchId: z.string().cuid(),
  departmentId: optionalCuid,
  roomId: optionalCuid,
  shelfId: optionalCuid,
  vendorId: optionalCuid,
  custodianId: optionalCuid,
  warrantyExpiryDate: z.string().optional(),
  status: enumFromConst(ASSET_STATUS).optional(),
  condition: enumFromConst(ASSET_CONDITION).optional(),
});

export const updateAssetSchema = z.object({
  assetId: z.string().cuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid(),
  branchId: z.string().cuid(),
  departmentId: optionalCuid,
  roomId: optionalCuid,
  shelfId: optionalCuid,
  vendorId: optionalCuid,
  custodianId: optionalCuid,
  purchaseCost: z.string().regex(REGEX.CURRENCY),
  warrantyExpiryDate: z.string().optional(),
  depreciationUsefulLifeYears: z.coerce.number().int().min(1).max(50).optional().or(z.literal("")),
  depreciationSalvageValue: z.string().regex(REGEX.CURRENCY).optional().or(z.literal("")),
  depreciationMethodOverride: enumFromConst(DEPRECIATION_METHOD).optional().or(z.literal("")),
});

export const updateAssetDepreciationSchema = z.object({
  assetId: z.string().cuid(),
  depreciationUsefulLifeYears: z.coerce.number().int().min(1).max(50).optional().or(z.literal("")),
  depreciationSalvageValue: z.string().regex(REGEX.CURRENCY).optional().or(z.literal("")),
  depreciationMethodOverride: enumFromConst(DEPRECIATION_METHOD).optional().or(z.literal("")),
});

export const updateAssetStatusSchema = z.object({
  assetId: z.string().cuid(),
  status: enumFromConst(ASSET_STATUS),
  condition: enumFromConst(ASSET_CONDITION),
  note: z.string().max(500).optional(),
});

export const disposeAssetSchema = z.object({
  assetId: z.string().cuid(),
  reason: z.string().min(3).max(500),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
