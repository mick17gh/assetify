import { ENUM_LABELS } from "@/constants";

type AuditLabel = {
  action: string;
  page: string;
  entity: string;
};

const ACTION_LABELS: Record<string, AuditLabel> = {
  "asset.create": { action: "Created asset", page: "Assets", entity: "Asset" },
  "asset.edit": { action: "Updated asset", page: "Assets", entity: "Asset" },
  "asset.profile.update": { action: "Updated asset profile", page: "Assets", entity: "Asset" },
  "asset.depreciation.update": { action: "Updated depreciation", page: "Assets", entity: "Asset" },
  "asset.dispose": { action: "Disposed asset", page: "Assets", entity: "Asset" },
  "asset.import": { action: "Imported assets", page: "Assets", entity: "Asset" },
  "asset.photo.upload": { action: "Uploaded asset photo", page: "Assets", entity: "Asset" },
  "asset.document.upload": { action: "Uploaded asset document", page: "Assets", entity: "Document" },
  "asset.movement.create": { action: "Recorded asset movement", page: "Locations", entity: "Movement" },
  "asset.request.create": { action: "Submitted asset request", page: "Requests", entity: "Request" },
  "asset.request.review": { action: "Reviewed asset request", page: "Requests", entity: "Request" },
  "asset.request.fulfill": { action: "Fulfilled asset request", page: "Requests", entity: "Request" },
  "document.repository.upload": { action: "Uploaded document", page: "Documents", entity: "Document" },
  "document.type.update": { action: "Updated document", page: "Documents", entity: "Document" },
  "document.delete": { action: "Deleted document", page: "Documents", entity: "Document" },
  "maintenance.create": { action: "Logged maintenance service", page: "Maintenance", entity: "Maintenance" },
  "maintenance.update": { action: "Updated maintenance record", page: "Maintenance", entity: "Maintenance" },
  "maintenance.delete": { action: "Deleted maintenance record", page: "Maintenance", entity: "Maintenance" },
  "maintenance.document.upload": { action: "Uploaded maintenance invoice", page: "Maintenance", entity: "Document" },
  "condition-flag.create": { action: "Created condition flag", page: "Maintenance", entity: "Condition flag" },
  "condition-flag.resolve": { action: "Resolved condition flag", page: "Maintenance", entity: "Condition flag" },
  "branch.create": { action: "Created branch", page: "Settings", entity: "Branch" },
  "depreciation.policy.create": { action: "Created depreciation policy", page: "Settings", entity: "Policy" },
  "depreciation.policy.update": { action: "Updated depreciation policy", page: "Settings", entity: "Policy" },
  "replacement.recompute": { action: "Recalculated replacements", page: "Replacement", entity: "Replacement" },
  "replacement.disposal.acknowledge": { action: "Acknowledged disposal", page: "Replacement", entity: "Replacement" },
  "reports.export": { action: "Exported report", page: "Reports", entity: "Report" },
  "user.create": { action: "Created user", page: "Users", entity: "User" },
  "user.password_reset_requested": { action: "Requested password reset", page: "Users", entity: "User" },
  "offline.sync": { action: "Synced offline changes", page: "System", entity: "Sync" },
  "workorder.create": { action: "Created work order", page: "Maintenance", entity: "Work order" },
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Asset: "Asset",
  AssetDocument: "Document",
  AssetRequest: "Request",
  MaintenanceRecord: "Maintenance",
  ConditionFlag: "Condition flag",
  Branch: "Branch",
  User: "User",
  DepreciationPolicy: "Policy",
  ReplacementEvaluation: "Replacement",
};

export function describeAuditAction(action: string, entityType: string): AuditLabel {
  const mapped = ACTION_LABELS[action];
  if (mapped) return mapped;

  const page = action.includes(".")
    ? action.split(".")[0]!.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "System";
  return {
    action: action
      .split(".")
      .join(" ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    page,
    entity: ENTITY_TYPE_LABELS[entityType] ?? entityType,
  };
}

export function formatAuditEntityType(entityType: string) {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

export function formatAuditAssetLabel(metadata: unknown, entityType: string, entityId: string | null) {
  if (metadata && typeof metadata === "object" && metadata !== null) {
    const record = metadata as Record<string, unknown>;
    if (typeof record.assetName === "string" && record.assetName.trim()) return record.assetName;
    if (typeof record.ain === "string" && record.ain.trim()) return record.ain;
    if (typeof record.fileName === "string" && record.fileName.trim()) return record.fileName;
    if (typeof record.displayName === "string" && record.displayName.trim()) return record.displayName;
  }
  if (entityType === "Asset" && entityId) return entityId.slice(0, 8);
  return "—";
}

export function formatStatusLabel(status: string) {
  return ENUM_LABELS.assetStatus[status] ?? status;
}
