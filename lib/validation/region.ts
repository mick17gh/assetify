import { z } from "zod";

export const createRegionSchema = z.object({
  name: z.string().min(2).max(120),
});

export const updateRegionSchema = createRegionSchema.extend({
  id: z.string().cuid(),
});

export const deleteRegionSchema = z.object({
  id: z.string().cuid(),
});
