import { z } from "zod";

export const createShelfSchema = z.object({
  roomId: z.string().cuid(),
  name: z.string().min(2).max(120),
});

export const updateShelfSchema = createShelfSchema.extend({
  id: z.string().cuid(),
});

export const deleteShelfSchema = z.object({
  id: z.string().cuid(),
});
