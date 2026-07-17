import { z } from "zod";
import { MOVEMENT_TYPE } from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

export const createMovementSchema = z.object({
  assetId: z.string().cuid(),
  movementType: enumFromConst(MOVEMENT_TYPE),
  toBranchId: optionalCuid,
  toRoomId: optionalCuid,
  toShelfId: optionalCuid,
  toCustodianId: optionalCuid,
  toDepartmentId: optionalCuid,
  note: z.string().max(500).optional(),
});
