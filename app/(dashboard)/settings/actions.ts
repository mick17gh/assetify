"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { APP_ROUTES, ERROR_MESSAGES, PERMISSION_KEYS } from "@/constants";
import { assertPermission } from "@/lib/permissions";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { createBranchSchema, deleteBranchSchema, updateBranchSchema } from "@/lib/validation/branch";
import { createCategorySchema, deleteCategorySchema, updateCategorySchema } from "@/lib/validation/category";
import { createVendorSchema, deleteVendorSchema, updateVendorSchema } from "@/lib/validation/vendor";
import {
  createDepartmentSchema,
  deleteDepartmentSchema,
  updateDepartmentSchema,
} from "@/lib/validation/department";
import { createRoomSchema, deleteRoomSchema, updateRoomSchema } from "@/lib/validation/room";
import { createShelfSchema, deleteShelfSchema, updateShelfSchema } from "@/lib/validation/shelf";
import {
  deleteReplacementPolicySchema,
  featureSettingsSchema,
  reminderSettingsSchema,
  replacementPolicySchema,
  updateOrganizationSchema,
  updateReplacementPolicySchema,
} from "@/lib/validation/policy";
import {
  deleteDepreciationPolicySchema,
  depreciationPolicySchema,
  updateDepreciationPolicySchema,
} from "@/lib/validation/depreciation";
import { parseOptionalCuid } from "@/lib/validation/helpers";

function orgId(session: Awaited<ReturnType<typeof getRequiredSession>>) {
  if (!session.organizationId) throw new Error(ERROR_MESSAGES.FORBIDDEN);
  return session.organizationId;
}

// --- Organization ---
export async function updateOrganizationAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateOrganizationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.organization.update({
    where: { id: orgId(session) },
    data: {
      name: parsed.data.name,
      maintenanceCostThresholdPercent: parsed.data.maintenanceCostThresholdPercent,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_ORGANIZATION);
}

export async function updateReminderSettingsAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = reminderSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const organization = await db.organization.findUnique({ where: { id: orgId(session) } });
  const current = (organization?.settings as Record<string, unknown> | null) ?? {};
  const reminders = (current.reminders as Record<string, number> | undefined) ?? {};

  await db.organization.update({
    where: { id: orgId(session) },
    data: {
      settings: {
        ...current,
        reminders: { ...reminders, [parsed.data.reminderType]: parsed.data.daysBefore },
      } as Prisma.InputJsonValue,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_REMINDERS);
}

export async function updateFeatureSettingsAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = featureSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const organization = await db.organization.findUnique({ where: { id: orgId(session) } });
  const current = (organization?.settings as Record<string, unknown> | null) ?? {};
  const features = (current.features as Record<string, boolean> | undefined) ?? {};

  await db.organization.update({
    where: { id: orgId(session) },
    data: {
      settings: {
        ...current,
        features: {
          ...features,
          qrLocationScanning: parsed.data.qrLocationScanning,
        },
      } as Prisma.InputJsonValue,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_FEATURES);
}

// --- Branches ---
export async function createBranchAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createBranchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.branch.create({
    data: { ...parsed.data, organizationId: orgId(session) },
  });
  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "branch.create",
    entityType: "Branch",
    metadata: { code: parsed.data.code },
  });
  revalidatePath(APP_ROUTES.SETTINGS_BRANCHES);
}

export async function updateBranchAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateBranchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.branch.updateMany({
    where: { id: parsed.data.id, organizationId: orgId(session) },
    data: { name: parsed.data.name, code: parsed.data.code, address: parsed.data.address || null },
  });
  revalidatePath(APP_ROUTES.SETTINGS_BRANCHES);
}

export async function deleteBranchAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteBranchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const counts = await db.branch.findFirst({
    where: { id: parsed.data.id, organizationId: orgId(session) },
    include: { _count: { select: { assets: true, users: true } } },
  });
  if (!counts) throw new Error("Branch not found.");
  if (counts._count.assets || counts._count.users) {
    throw new Error("Cannot delete branch with assigned assets or users.");
  }

  await db.branch.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_BRANCHES);
}

// --- Categories ---
export async function createCategoryAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.category.create({ data: parsed.data });
  revalidatePath(APP_ROUTES.SETTINGS_CATEGORIES);
}

export async function updateCategoryAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.category.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      replacementYears: parsed.data.replacementYears,
      disposalGraceMonths: parsed.data.disposalGraceMonths,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_CATEGORIES);
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const count = await db.asset.count({ where: { categoryId: parsed.data.id } });
  if (count) throw new Error("Cannot delete category with assets.");

  await db.category.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_CATEGORIES);
}

// --- Vendors ---
export async function createVendorAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createVendorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.vendor.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_VENDORS);
}

export async function updateVendorAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateVendorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.vendor.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_VENDORS);
}

export async function deleteVendorAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteVendorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.vendor.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_VENDORS);
}

// --- Departments / Rooms / Shelves ---
export async function createDepartmentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createDepartmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.department.create({ data: parsed.data });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function updateDepartmentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateDepartmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.department.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, branchId: parsed.data.branchId },
  });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function deleteDepartmentAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteDepartmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const count = await db.asset.count({ where: { departmentId: parsed.data.id } });
  if (count) throw new Error("Cannot delete department with assets.");

  await db.department.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function createRoomAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createRoomSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.room.create({ data: parsed.data });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function updateRoomAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateRoomSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.room.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, branchId: parsed.data.branchId },
  });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function deleteRoomAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteRoomSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const count = await db.asset.count({ where: { roomId: parsed.data.id } });
  if (count) throw new Error("Cannot delete room with assets.");

  await db.room.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function createShelfAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = createShelfSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.shelf.create({ data: parsed.data });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function updateShelfAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateShelfSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.shelf.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, roomId: parsed.data.roomId },
  });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

export async function deleteShelfAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteShelfSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  const count = await db.asset.count({ where: { shelfId: parsed.data.id } });
  if (count) throw new Error("Cannot delete shelf with assets.");

  await db.shelf.delete({ where: { id: parsed.data.id } });
  revalidatePath(APP_ROUTES.SETTINGS_LOCATIONS);
}

// --- Replacement policies ---
export async function createReplacementPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = replacementPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.replacementPolicy.create({
    data: { ...parsed.data, organizationId: orgId(session) },
  });
  revalidatePath(APP_ROUTES.SETTINGS_POLICIES);
}

export async function updateReplacementPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateReplacementPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.replacementPolicy.updateMany({
    where: { id: parsed.data.id, organizationId: orgId(session) },
    data: {
      categoryId: parsed.data.categoryId,
      replacementYears: parsed.data.replacementYears,
      disposalGraceMonths: parsed.data.disposalGraceMonths,
    },
  });
  revalidatePath(APP_ROUTES.SETTINGS_POLICIES);
}

export async function deleteReplacementPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteReplacementPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.replacementPolicy.deleteMany({
    where: { id: parsed.data.id, organizationId: orgId(session) },
  });
  revalidatePath(APP_ROUTES.SETTINGS_POLICIES);
}

// --- Depreciation policies ---
export async function createDepreciationPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = depreciationPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.depreciationPolicy.create({
    data: { ...parsed.data, organizationId: orgId(session) },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "depreciation.policy.create",
    entityType: "DepreciationPolicy",
  });

  revalidatePath(APP_ROUTES.SETTINGS_DEPRECIATION);
}

export async function updateDepreciationPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = updateDepreciationPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.depreciationPolicy.updateMany({
    where: { id: parsed.data.id, organizationId: orgId(session) },
    data: {
      categoryId: parsed.data.categoryId,
      method: parsed.data.method,
      usefulLifeYears: parsed.data.usefulLifeYears,
      salvagePercent: parsed.data.salvagePercent,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    action: "depreciation.policy.update",
    entityType: "DepreciationPolicy",
    entityId: parsed.data.id,
  });

  revalidatePath(APP_ROUTES.SETTINGS_DEPRECIATION);
}

export async function deleteDepreciationPolicyAction(formData: FormData) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.POLICY_MANAGE);
  const parsed = deleteDepreciationPolicySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_INPUT);

  await db.depreciationPolicy.deleteMany({
    where: { id: parsed.data.id, organizationId: orgId(session) },
  });
  revalidatePath(APP_ROUTES.SETTINGS_DEPRECIATION);
}
