import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(32).regex(/^[A-Z0-9-]+$/),
  address: z.string().max(255).optional(),
});

export const updateBranchSchema = createBranchSchema.extend({
  id: z.string().cuid(),
});

export const deleteBranchSchema = z.object({
  id: z.string().cuid(),
});
