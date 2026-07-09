import { z } from "zod";

export const createRoomSchema = z.object({
  branchId: z.string().cuid(),
  name: z.string().min(2).max(120),
});

export const updateRoomSchema = createRoomSchema.extend({
  id: z.string().cuid(),
});

export const deleteRoomSchema = z.object({
  id: z.string().cuid(),
});
