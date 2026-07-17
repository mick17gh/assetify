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
  maintenanceCostThresholdPercent: z.coerce.number().int().min(1).max(500),
});

export const featureSettingsSchema = z.object({
  qrLocationScanning: z.coerce.boolean(),
});
