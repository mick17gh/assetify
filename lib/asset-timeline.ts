import { ENUM_LABELS } from "@/constants";
import { db } from "@/lib/db";

export type AssetTimelineEvent = {
  id: string;
  at: Date;
  sortKey: number;
  kind:
    | "status"
    | "movement"
    | "acknowledgement"
    | "maintenance"
    | "verification"
    | "exception"
    | "disposal"
    | "document"
    | "replacement";
  title: string;
  detail: string;
};

function label(map: Record<string, string> | undefined, value: string | null | undefined) {
  if (!value) return "N/A";
  return map?.[value] ?? value;
}

export async function buildAssetTimeline(assetId: string, limit = 80): Promise<AssetTimelineEvent[]> {
  const [
    statusHistory,
    movements,
    acknowledgements,
    maintenance,
    verifications,
    exceptions,
    disposal,
    documents,
    replacements,
  ] = await Promise.all([
    db.assetStatusHistory.findMany({ where: { assetId }, orderBy: { createdAt: "desc" }, take: limit }),
    db.assetMovement.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        movedBy: { select: { name: true } },
      },
    }),
    db.assignmentAcknowledgement.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    db.maintenanceRecord.findMany({ where: { assetId }, orderBy: { serviceDate: "desc" }, take: limit }),
    db.assetVerification.findMany({
      where: { assetId },
      orderBy: { verifiedAt: "desc" },
      take: limit,
      include: { campaign: { select: { name: true } } },
    }),
    db.assetException.findMany({
      where: { assetId },
      orderBy: { identifiedAt: "desc" },
      take: limit,
    }),
    db.assetDisposalRecord.findUnique({ where: { assetId } }),
    db.assetDocument.findMany({ where: { assetId }, orderBy: { createdAt: "desc" }, take: limit }),
    db.replacementEvaluation.findMany({ where: { assetId }, orderBy: { calculatedAt: "desc" }, take: 5 }),
  ]);

  const events: AssetTimelineEvent[] = [];

  for (const row of statusHistory) {
    events.push({
      id: `status-${row.id}`,
      at: row.createdAt,
      sortKey: row.createdAt.getTime(),
      kind: "status",
      title: "Status change",
      detail: `${label(ENUM_LABELS.assetStatus, row.fromStatus)} → ${label(ENUM_LABELS.assetStatus, row.toStatus)}${row.note ? ` · ${row.note}` : ""}`,
    });
  }

  for (const row of movements) {
    events.push({
      id: `movement-${row.id}`,
      at: row.createdAt,
      sortKey: row.createdAt.getTime(),
      kind: "movement",
      title: label(ENUM_LABELS.movementType, row.movementType),
      detail: `${label(ENUM_LABELS.transferReason, row.transferReason)} by ${row.movedBy.name}${row.note ? ` · ${row.note}` : ""}`,
    });
  }

  for (const row of acknowledgements) {
    const at = row.acceptedAt ?? row.createdAt;
    events.push({
      id: `ack-${row.id}`,
      at,
      sortKey: at.getTime(),
      kind: "acknowledgement",
      title: row.status === "PENDING" ? "Acknowledgement pending" : "Custody acknowledged",
      detail: `${row.user.name}${row.method ? ` via ${label(ENUM_LABELS.acknowledgementMethod, row.method)}` : ""}${row.note ? ` · ${row.note}` : ""}`,
    });
  }

  for (const row of maintenance) {
    events.push({
      id: `maint-${row.id}`,
      at: row.serviceDate,
      sortKey: row.serviceDate.getTime(),
      kind: "maintenance",
      title: `Maintenance · ${label(ENUM_LABELS.maintenanceStatus, row.status)}`,
      detail: `${row.description}${row.vendorName ? ` · ${row.vendorName}` : ""}${row.cost != null ? ` · GHS ${Number(row.cost).toFixed(2)}` : ""}`,
    });
  }

  for (const row of verifications) {
    events.push({
      id: `verify-${row.id}`,
      at: row.verifiedAt,
      sortKey: row.verifiedAt.getTime(),
      kind: "verification",
      title: `Verification · ${label(ENUM_LABELS.verificationOutcome, row.outcome)}`,
      detail: row.campaign?.name ?? "Campaign verification",
    });
  }

  for (const row of exceptions) {
    events.push({
      id: `exception-${row.id}`,
      at: row.identifiedAt,
      sortKey: row.identifiedAt.getTime(),
      kind: "exception",
      title: `Exception · ${label(ENUM_LABELS.exceptionType, row.type)}`,
      detail: `${label(ENUM_LABELS.exceptionStatus, row.status)}${row.description ? ` · ${row.description}` : ""}`,
    });
  }

  if (disposal) {
    events.push({
      id: `disposal-${disposal.id}`,
      at: disposal.disposalDate,
      sortKey: disposal.disposalDate.getTime(),
      kind: "disposal",
      title: `Disposed · ${label(ENUM_LABELS.disposalMethod, disposal.method)}`,
      detail: disposal.reason,
    });
  }

  for (const row of documents) {
    events.push({
      id: `doc-${row.id}`,
      at: row.createdAt,
      sortKey: row.createdAt.getTime(),
      kind: "document",
      title: `Document · ${label(ENUM_LABELS.documentType, row.documentType)}`,
      detail: row.displayName,
    });
  }

  for (const row of replacements) {
    events.push({
      id: `repl-${row.id}`,
      at: row.calculatedAt,
      sortKey: row.calculatedAt.getTime(),
      kind: "replacement",
      title: `Replacement · ${label(ENUM_LABELS.recommendationState, row.state)}`,
      detail: `Recommended replace ${row.recommendedReplaceDate.toLocaleDateString()}`,
    });
  }

  return events.sort((a, b) => b.sortKey - a.sortKey).slice(0, limit);
}
