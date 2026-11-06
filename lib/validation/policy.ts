import { z } from "zod";
import { REMINDER_TYPE } from "@/constants";
import { enumFromConst } from "./helpers";

export const replacementPolicySchema = z.object({
  categoryId: z.string().cuid(),
  replacementYears: z.coerce.number().int().min(1).max(50),
  disposalGraceMonths: z.coerce.number().int().min(0).max(120),
});

export const updateReplacementPolicySchema = replacementPolicySchema.extend({
  id: z.string().cuid(),
});

export const deleteReplacementPolicySchema = z.object({
  id: z.string().cuid(),
});

export const reminderSettingsSchema = z.object({
  reminderType: enumFromConst(REMINDER_TYPE),
  daysBefore: z.coerce.number().int().min(1).max(365),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  organizationType: z.string().optional(),
  industry: z.string().max(80).optional(),
  primaryContactName: z.string().max(120).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional(),
  address: z.string().max(255).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  maintenanceCostThresholdPercent: z.coerce.number().int().min(1).max(500),
});

export const featureSettingsSchema = z.object({
  qrLocationScanning: z.coerce.boolean(),
});
