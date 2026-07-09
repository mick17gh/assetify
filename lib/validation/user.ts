import { z } from "zod";
import { USER_ROLES } from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: enumFromConst(USER_ROLES),
  branchId: optionalCuid,
});

export const updateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(120),
  role: enumFromConst(USER_ROLES),
  branchId: optionalCuid,
  isActive: z.coerce.boolean(),
});
