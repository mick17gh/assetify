import {
  ASSET_CONDITION,
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_URGENCY,
  ASSET_STATUS,
  DEPRECIATION_METHOD,
  DISPOSAL_METHOD,
  DOCUMENT_TYPE,
  MAINTENANCE_STATUS,
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
    [USER_ROLES.FINANCE]: "Finance",
  },
  assetStatus: {
    [ASSET_STATUS.ACTIVE]: "Active",
    [ASSET_STATUS.UNDER_REPAIR]: "Under Repair",
    [ASSET_STATUS.FAULTY]: "Faulty",
    [ASSET_STATUS.IN_STORAGE]: "In Storage",
    [ASSET_STATUS.MISSING]: "Missing",
    [ASSET_STATUS.DISPOSED]: "Disposed",
    [ASSET_STATUS.DONATED]: "Donated",
    [ASSET_STATUS.SOLD]: "Sold",
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
    [MOVEMENT_TYPE.DEPARTMENT_TRANSFER]: "Department Transfer",
  },
  documentType: {
    [DOCUMENT_TYPE.RECEIPT]: "Receipt",
    [DOCUMENT_TYPE.WARRANTY_CARD]: "Warranty Card",
    [DOCUMENT_TYPE.MANUAL]: "Manual",
    [DOCUMENT_TYPE.SERVICE_REPORT]: "Service Report",
    [DOCUMENT_TYPE.MAINTENANCE_INVOICE]: "Maintenance Invoice",
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
  assetRequestStatus: {
    [ASSET_REQUEST_STATUS.PENDING]: "Pending",
    [ASSET_REQUEST_STATUS.APPROVED]: "Approved",
    [ASSET_REQUEST_STATUS.REJECTED]: "Rejected",
    [ASSET_REQUEST_STATUS.FULFILLED]: "Fulfilled",
  },
  assetRequestUrgency: {
    [ASSET_REQUEST_URGENCY.LOW]: "Low",
    [ASSET_REQUEST_URGENCY.MEDIUM]: "Medium",
    [ASSET_REQUEST_URGENCY.HIGH]: "High",
    [ASSET_REQUEST_URGENCY.CRITICAL]: "Critical",
  },
  maintenanceStatus: {
    [MAINTENANCE_STATUS.SCHEDULED]: "Scheduled",
    [MAINTENANCE_STATUS.IN_PROGRESS]: "In Progress",
    [MAINTENANCE_STATUS.COMPLETED]: "Completed",
  },
  disposalMethod: {
    [DISPOSAL_METHOD.DONATED]: "Donated",
    [DISPOSAL_METHOD.SOLD]: "Sold",
    [DISPOSAL_METHOD.DISPOSED]: "Thrown Away / Disposed",
  },
  depreciationMethod: {
    [DEPRECIATION_METHOD.STRAIGHT_LINE]: "Straight-Line",
  },
  conditionSeverity: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },
};
