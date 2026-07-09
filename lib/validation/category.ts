import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  replacementYears: z.coerce.number().int().min(1).max(50),
  disposalGraceMonths: z.coerce.number().int().min(0).max(120),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().cuid(),
});

export const deleteCategorySchema = z.object({
  id: z.string().cuid(),
});
