import {
  ASSET_CONDITION,
  ASSET_STATUS,
  DOCUMENT_TYPE,
  MOVEMENT_TYPE,
  RECOMMENDATION_STATE,
} from "./asset";
import { USER_ROLES } from "./auth";
import { REMINDER_TYPE } from "./status";

export const ENUM_LABELS: Record<string, Record<string, string>> = {
  userRole: {
    [USER_ROLES.ADMIN]: "Admin",
    [USER_ROLES.MANAGER]: "Manager",
    [USER_ROLES.STAFF]: "Staff",
  },
  assetStatus: {
    [ASSET_STATUS.ACTIVE]: "Active",
    [ASSET_STATUS.UNDER_REPAIR]: "Under Repair",
    [ASSET_STATUS.FAULTY]: "Faulty",
    [ASSET_STATUS.IN_STORAGE]: "In Storage",
    [ASSET_STATUS.MISSING]: "Missing",
    [ASSET_STATUS.DISPOSED]: "Disposed",
  },
  assetCondition: {
    [ASSET_CONDITION.EXCELLENT]: "Excellent",
    [ASSET_CONDITION.GOOD]: "Good",
    [ASSET_CONDITION.FAIR]: "Fair",
    [ASSET_CONDITION.POOR]: "Poor",
    [ASSET_CONDITION.CRITICAL]: "Critical",
  },
  movementType: {
    [MOVEMENT_TYPE.BRANCH_TRANSFER]: "Branch Transfer",
    [MOVEMENT_TYPE.STORAGE_TRANSFER]: "Storage Transfer",
    [MOVEMENT_TYPE.STAFF_ASSIGNMENT]: "Staff Assignment",
    [MOVEMENT_TYPE.ROOM_TRANSFER]: "Room Transfer",
    [MOVEMENT_TYPE.SHELF_TRANSFER]: "Shelf Transfer",
  },
  documentType: {
    [DOCUMENT_TYPE.RECEIPT]: "Receipt",
    [DOCUMENT_TYPE.WARRANTY_CARD]: "Warranty Card",
    [DOCUMENT_TYPE.MANUAL]: "Manual",
    [DOCUMENT_TYPE.SERVICE_REPORT]: "Service Report",
    [DOCUMENT_TYPE.OTHER]: "Other",
  },
  reminderType: {
    [REMINDER_TYPE.WARRANTY_EXPIRY]: "Warranty Expiry",
    [REMINDER_TYPE.REPLACEMENT_DUE]: "Replacement Due",
    [REMINDER_TYPE.MAINTENANCE_DUE]: "Maintenance Due",
  },
  recommendationState: {
    [RECOMMENDATION_STATE.HEALTHY]: "Healthy",
    [RECOMMENDATION_STATE.APPROACHING]: "Approaching",
    [RECOMMENDATION_STATE.OVERDUE]: "Overdue",
  },
};
