import { z } from "zod";
import { ACKNOWLEDGEMENT_METHOD, ASSIGNMENT_TYPE, MOVEMENT_TYPE, TRANSFER_REASON } from "@/constants";
import { enumFromConst, optionalCuid } from "./helpers";

export const createMovementSchema = z
  .object({
    assetId: z.string().cuid(),
    movementType: enumFromConst(MOVEMENT_TYPE),
    transferReason: enumFromConst(TRANSFER_REASON),
    toBranchId: optionalCuid,
    toRoomId: optionalCuid,
    toShelfId: optionalCuid,
    toCustodianId: optionalCuid,
    toDepartmentId: optionalCuid,
    note: z.string().max(500).optional(),
    assignmentType: enumFromConst(ASSIGNMENT_TYPE).optional().or(z.literal("")),
    expectedReturnDate: z.string().optional(),
    acknowledgementMethod: enumFromConst(ACKNOWLEDGEMENT_METHOD).optional().or(z.literal("")),
    acknowledgementAccepted: z.string().optional(),
    acknowledgementPin: z.string().optional(),
    acknowledgementNote: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.movementType !== MOVEMENT_TYPE.STAFF_ASSIGNMENT) return;
    if (!data.assignmentType) {
      ctx.addIssue({ code: "custom", message: "Assignment type is required.", path: ["assignmentType"] });
    }
    if (!data.acknowledgementMethod) {
      ctx.addIssue({ code: "custom", message: "The assignee must acknowledge the assignment.", path: ["acknowledgementMethod"] });
      return;
    }
    if (data.acknowledgementMethod === ACKNOWLEDGEMENT_METHOD.CHECKBOX && data.acknowledgementAccepted !== "true") {
      ctx.addIssue({ code: "custom", message: "The assignee must accept custody before this assignment is saved.", path: ["acknowledgementAccepted"] });
    }
    if (data.acknowledgementMethod === ACKNOWLEDGEMENT_METHOD.PIN && (data.acknowledgementPin ?? "").trim().length < 4) {
      ctx.addIssue({ code: "custom", message: "Enter the assignee PIN to accept custody.", path: ["acknowledgementPin"] });
    }
    if (data.acknowledgementMethod === ACKNOWLEDGEMENT_METHOD.SIGNATURE && (data.acknowledgementNote ?? "").trim().length < 2) {
      ctx.addIssue({ code: "custom", message: "A signature name is required to accept custody.", path: ["acknowledgementNote"] });
    }
  });
