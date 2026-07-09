import { z } from "zod";
import { REGEX } from "@/constants";

export const createMaintenanceSchema = z.object({
  assetId: z.string().cuid(),
  description: z.string().min(3).max(2000),
  serviceDate: z.string().min(1),
  cost: z.string().regex(REGEX.CURRENCY).optional().or(z.literal("")),
  vendorName: z.string().max(120).optional(),
  nextServiceDate: z.string().optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.extend({
  id: z.string().cuid(),
});

export const deleteMaintenanceSchema = z.object({
  id: z.string().cuid(),
});

export const createConditionFlagSchema = z.object({
  assetId: z.string().cuid(),
  title: z.string().min(2).max(120),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const resolveConditionFlagSchema = z.object({
  id: z.string().cuid(),
});
