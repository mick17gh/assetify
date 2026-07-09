import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional(),
});

export const updateVendorSchema = createVendorSchema.extend({
  id: z.string().cuid(),
});

export const deleteVendorSchema = z.object({
  id: z.string().cuid(),
});
