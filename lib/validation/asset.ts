import { z } from "zod";
import {
  ACKNOWLEDGEMENT_METHOD,
  ASSET_CONDITION,
  ASSET_STATUS,
  DEPRECIATION_METHOD,
  OWNERSHIP_TYPE,
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

const optionalDateSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) return undefined;
    const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
    return date.toISOString();
  });

const optionalCurrency = z.string().regex(REGEX.CURRENCY).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || value.startsWith("http://") || value.startsWith("https://"), {
    message: "Invoice URL must start with http:// or https://",
  });

export const createAssetSchema = z
  .object({
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
    manufacturer: z.string().max(120).optional(),
    modelName: z.string().max(120).optional(),
    existingAssetNumber: z.string().max(80).optional(),
    poNumber: z.string().max(80).optional(),
    invoiceNumber: z.string().max(80).optional(),
    invoiceUrl: optionalUrl,
    capitalizedDate: optionalDateSchema,
    ownershipType: enumFromConst(OWNERSHIP_TYPE).optional(),
    lessorName: z.string().max(120).optional(),
    leaseStartDate: optionalDateSchema,
    leaseEndDate: optionalDateSchema,
    leaseMonthlyCost: optionalCurrency,
  })
  .superRefine((data, ctx) => {
    const leased = data.ownershipType === OWNERSHIP_TYPE.LEASED || data.ownershipType === OWNERSHIP_TYPE.RENTED;
    if (leased && !data.lessorName?.trim()) {
      ctx.addIssue({ code: "custom", message: "Lessor / rental company is required for leased or rented assets.", path: ["lessorName"] });
    }
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
  manufacturer: z.string().max(120).optional(),
  modelName: z.string().max(120).optional(),
  existingAssetNumber: z.string().max(80).optional(),
  poNumber: z.string().max(80).optional(),
  invoiceNumber: z.string().max(80).optional(),
  invoiceUrl: optionalUrl,
  capitalizedDate: optionalDateSchema,
  ownershipType: enumFromConst(OWNERSHIP_TYPE).optional(),
  lessorName: z.string().max(120).optional(),
  leaseStartDate: optionalDateSchema,
  leaseEndDate: optionalDateSchema,
  leaseMonthlyCost: optionalCurrency,
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

export const completeAssetOnboardingSchema = z.object({
  assetId: z.string().cuid(),
  ain: z.string().regex(REGEX.AIN).optional(),
  serialNumber: z.string().regex(REGEX.SERIAL).optional(),
  purchaseCost: z.string().regex(REGEX.CURRENCY).optional(),
  purchaseDate: optionalDateSchema,
  poNumber: z.string().max(80).optional(),
  invoiceNumber: z.string().max(80).optional(),
  invoiceUrl: optionalUrl,
  capitalizedDate: optionalDateSchema,
  note: z.string().max(500).optional(),
});

export const acceptAcknowledgementSchema = z
  .object({
    acknowledgementId: z.string().cuid(),
    method: enumFromConst(ACKNOWLEDGEMENT_METHOD),
    acknowledgementAccepted: z.string().optional(),
    acknowledgementPin: z.string().optional(),
    acknowledgementNote: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "CHECKBOX" && data.acknowledgementAccepted !== "true") {
      ctx.addIssue({ code: "custom", message: "Accept custody to continue.", path: ["acknowledgementAccepted"] });
    }
    if (data.method === "PIN" && (data.acknowledgementPin ?? "").trim().length < 4) {
      ctx.addIssue({ code: "custom", message: "Enter a PIN of at least 4 characters.", path: ["acknowledgementPin"] });
    }
    if (data.method === "SIGNATURE" && (data.acknowledgementNote ?? "").trim().length < 2) {
      ctx.addIssue({ code: "custom", message: "Signature name is required.", path: ["acknowledgementNote"] });
    }
  });

export const periodDepreciationRunSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
