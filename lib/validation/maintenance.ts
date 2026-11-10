import { z } from "zod";
import { MAINTENANCE_STATUS, REGEX, REPAIR_OUTCOME } from "@/constants";
import { enumFromConst } from "./helpers";

export const createMaintenanceSchema = z.object({
  assetId: z.string().cuid(),
  description: z.string().min(3).max(2000),
  notes: z.string().max(4000).optional().or(z.literal("")),
  serviceDate: z.string().min(1),
  cost: z.string().regex(REGEX.CURRENCY).optional().or(z.literal("")),
  vendorName: z.string().max(120).optional(),
  nextServiceDate: z.string().optional(),
  status: enumFromConst(MAINTENANCE_STATUS).default(MAINTENANCE_STATUS.COMPLETED),
  reportedDate: z.string().optional(),
  sentDate: z.string().optional(),
  actualReturnDate: z.string().optional(),
  warrantyClaim: z.string().optional(),
  repairOutcome: enumFromConst(REPAIR_OUTCOME).optional().or(z.literal("")),
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
  notes: z.string().max(2000).optional().or(z.literal("")),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const resolveConditionFlagSchema = z.object({
  id: z.string().cuid(),
});
