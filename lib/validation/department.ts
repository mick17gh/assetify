import { z } from "zod";

export const createDepartmentSchema = z.object({
  branchId: z.string().cuid(),
  name: z.string().min(2).max(120),
});

export const updateDepartmentSchema = createDepartmentSchema.extend({
  id: z.string().cuid(),
});

export const deleteDepartmentSchema = z.object({
  id: z.string().cuid(),
});
