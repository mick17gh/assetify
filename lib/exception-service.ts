import { EXCEPTION_STATUS, type EXCEPTION_TYPE } from "@/constants";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { Prisma, type ExceptionStatus, type ExceptionType } from "@/lib/generated/prisma/client";

type ExceptionClient = Prisma.TransactionClient | typeof db;

export const OPEN_EXCEPTION_STATUSES: ExceptionStatus[] = [
  EXCEPTION_STATUS.IDENTIFIED,
  EXCEPTION_STATUS.ASSIGNED,
  EXCEPTION_STATUS.INVESTIGATING,
  EXCEPTION_STATUS.RESOLVED,
];

const TRANSITIONS: Record<ExceptionStatus, ExceptionStatus[]> = {
  IDENTIFIED: [EXCEPTION_STATUS.ASSIGNED, EXCEPTION_STATUS.INVESTIGATING, EXCEPTION_STATUS.REJECTED],
  ASSIGNED: [EXCEPTION_STATUS.INVESTIGATING, EXCEPTION_STATUS.REJECTED],
  INVESTIGATING: [EXCEPTION_STATUS.RESOLVED, EXCEPTION_STATUS.REJECTED],
  RESOLVED: [EXCEPTION_STATUS.APPROVED],
  APPROVED: [],
  REJECTED: [],
};

export class ExceptionTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExceptionTransitionError";
  }
}

export type OpenExceptionInput = {
  organizationId: string;
  campaignId?: string | null;
  assetId?: string | null;
  branchId?: string | null;
  type: ExceptionType | (typeof EXCEPTION_TYPE)[keyof typeof EXCEPTION_TYPE];
  description: string;
  identifiedById: string;
  assignedToId?: string | null;
  dueDate?: Date | null;
  audit?: boolean;
};

export async function openException(input: OpenExceptionInput, client: ExceptionClient = db) {
  const description = input.description.trim();
  if (!description) {
    throw new ExceptionTransitionError("A description is required.");
  }

  const type = input.type as ExceptionType;
  if (input.assetId) {
    const existing = await client.assetException.findFirst({
      where: {
        organizationId: input.organizationId,
        campaignId: input.campaignId ?? null,
        assetId: input.assetId,
        type,
        status: { in: OPEN_EXCEPTION_STATUSES },
      },
      select: { id: true },
    });
    if (existing) return { id: existing.id, created: false };
  }

  const created = await client.assetException.create({
    data: {
      organizationId: input.organizationId,
      campaignId: input.campaignId ?? null,
      assetId: input.assetId ?? null,
      branchId: input.branchId ?? null,
      type,
      status: EXCEPTION_STATUS.IDENTIFIED,
      identifiedById: input.identifiedById,
      assignedToId: input.assignedToId ?? null,
      dueDate: input.dueDate ?? null,
      description,
      events: {
        create: {
          fromStatus: null,
          toStatus: EXCEPTION_STATUS.IDENTIFIED,
          actorId: input.identifiedById,
          note: description,
        },
      },
    },
    select: { id: true, branchId: true },
  });

  if (input.audit !== false) {
    await writeAuditLog({
      actorUserId: input.identifiedById,
      organizationId: input.organizationId,
      branchId: created.branchId,
      action: "exception.open",
      entityType: "AssetException",
      entityId: created.id,
      metadata: { type, campaignId: input.campaignId ?? null, assetId: input.assetId ?? null },
    });
  }

  return { id: created.id, created: true };
}

export async function transitionException(input: {
  exceptionId: string;
  organizationId: string;
  actorId: string;
  toStatus: ExceptionStatus;
  note?: string | null;
  assignedToId?: string | null;
}) {
  const note = input.note?.trim() ?? "";
  const row = await db.assetException.findFirst({
    where: { id: input.exceptionId, organizationId: input.organizationId },
  });
  if (!row) throw new ExceptionTransitionError("Exception not found.");

  const allowed = TRANSITIONS[row.status] ?? [];
  if (!allowed.includes(input.toStatus)) {
    throw new ExceptionTransitionError(`Cannot move an exception from ${row.status} to ${input.toStatus}.`);
  }

  if (input.toStatus === EXCEPTION_STATUS.RESOLVED && !note) {
    throw new ExceptionTransitionError("A resolution note is required.");
  }
  if (input.toStatus === EXCEPTION_STATUS.APPROVED && !row.resolution?.trim()) {
    throw new ExceptionTransitionError("A resolution note is required before approval.");
  }
  if (input.toStatus === EXCEPTION_STATUS.ASSIGNED && !input.assignedToId) {
    throw new ExceptionTransitionError("Choose an assignee.");
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.assetException.update({
      where: { id: row.id },
      data: {
        status: input.toStatus,
        assignedToId: input.toStatus === EXCEPTION_STATUS.ASSIGNED ? input.assignedToId : row.assignedToId,
        resolution: input.toStatus === EXCEPTION_STATUS.RESOLVED ? note : row.resolution,
        resolvedAt: input.toStatus === EXCEPTION_STATUS.RESOLVED ? now : row.resolvedAt,
        approvedById: input.toStatus === EXCEPTION_STATUS.APPROVED ? input.actorId : row.approvedById,
        approvedAt: input.toStatus === EXCEPTION_STATUS.APPROVED ? now : row.approvedAt,
      },
    });
    await tx.exceptionEvent.create({
      data: {
        exceptionId: row.id,
        fromStatus: row.status,
        toStatus: input.toStatus,
        actorId: input.actorId,
        note: note || null,
      },
    });
  });

  await writeAuditLog({
    actorUserId: input.actorId,
    organizationId: input.organizationId,
    branchId: row.branchId,
    action: "exception.transition",
    entityType: "AssetException",
    entityId: row.id,
    metadata: { from: row.status, to: input.toStatus },
  });
}

export async function countOpenExceptions(organizationId: string) {
  return db.assetException.count({
    where: { organizationId, status: { in: OPEN_EXCEPTION_STATUSES } },
  });
}
