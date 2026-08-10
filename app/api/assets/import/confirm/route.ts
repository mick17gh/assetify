import { NextResponse } from "next/server";
import {
  API_ROUTES,
  ASSET_CONDITION,
  ASSET_STATUS,
  ERROR_MESSAGES,
  IMPORT_STATUS,
  PERMISSION_KEYS,
  RATE_LIMIT,
} from "@/constants";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRequiredSession } from "@/lib/session";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { formatZodError } from "@/lib/validation/helpers";
import { confirmImportSchema } from "@/lib/validation/import";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";

function emptyToUndefined(value: string | undefined) {
  return value?.trim() ? value : undefined;
}

export async function POST(request: Request) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  assertRateLimit(`${API_ROUTES.CSV_IMPORT_CONFIRM}:${session.userId}`, RATE_LIMIT.SENSITIVE_MAX);

  if (!session.organizationId) {
    return NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = confirmImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { rows, fileName } = parsed.data;
  const totalRows = rows.length;

  const job = await db.importJob.create({
    data: {
      organizationId: session.organizationId,
      branchId: session.branchId,
      createdByUserId: session.userId,
      fileName: fileName ?? "preview-import.csv",
      totalRows,
      successRows: 0,
      failedRows: 0,
      status: IMPORT_STATUS.PROCESSING,
    },
  });

  const categoryIds = Array.from(new Set(rows.map((r) => r.categoryId)));
  const branchIds = Array.from(new Set(rows.map((r) => r.branchId)));
  const [categories, branches] = await Promise.all([
    db.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } }),
    db.branch.findMany({
      where: { id: { in: branchIds }, organizationId: session.organizationId },
      select: { id: true },
    }),
  ]);
  const validCategoryIds = new Set(categories.map((c) => c.id));
  const validBranchIds = new Set(branches.map((b) => b.id));

  const failures: Array<{ row: number; error: string }> = [];
  let successRows = 0;

  for (const row of rows) {
    if (!validCategoryIds.has(row.categoryId) || !validBranchIds.has(row.branchId)) {
      failures.push({
        row: row.row,
        error: !validCategoryIds.has(row.categoryId) && !validBranchIds.has(row.branchId)
          ? "Category and branch not found"
          : !validCategoryIds.has(row.categoryId)
            ? "Category not found"
            : "Branch not found",
      });
      continue;
    }

    try {
      const asset = await db.asset.create({
        data: {
          ain: row.ain,
          serialNumber: row.serialNumber,
          name: row.name,
          purchaseDate: new Date(row.purchaseDate),
          purchaseCost: row.purchaseCost,
          warrantyExpiryDate: row.warrantyExpiryDate ? new Date(row.warrantyExpiryDate) : null,
          categoryId: row.categoryId,
          branchId: row.branchId,
          departmentId: emptyToUndefined(row.departmentId),
          roomId: emptyToUndefined(row.roomId),
          shelfId: emptyToUndefined(row.shelfId),
          vendorId: emptyToUndefined(row.vendorId),
          custodianId: emptyToUndefined(row.custodianId),
          status: row.status ?? ASSET_STATUS.ACTIVE,
          condition: row.condition ?? ASSET_CONDITION.GOOD,
          organizationId: session.organizationId,
        },
      });
      await db.assetStatusHistory.create({
        data: {
          assetId: asset.id,
          fromStatus: null,
          toStatus: asset.status,
          note: "Imported from CSV (preview confirm)",
        },
      });
      await syncReplacementForAsset(asset.id);
      await syncRemindersForAsset(asset.id);
      successRows += 1;
    } catch (error) {
      failures.push({
        row: row.row,
        error: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  const failedRows = failures.length;
  await db.importJob.update({
    where: { id: job.id },
    data: {
      successRows,
      failedRows,
      status: failedRows > 0 && successRows === 0 ? IMPORT_STATUS.FAILED : IMPORT_STATUS.COMPLETED,
      errorReport: failedRows ? failures : undefined,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "asset.import",
    entityType: "ImportJob",
    entityId: job.id,
    metadata: {
      fileName: fileName ?? "preview-import.csv",
      totalRows,
      successRows,
      failedRows,
      mode: "confirm",
    },
  });

  return NextResponse.json({
    id: job.id,
    status: failedRows > 0 && successRows === 0 ? IMPORT_STATUS.FAILED : IMPORT_STATUS.COMPLETED,
    totalRows,
    successRows,
    failedRows,
    failures,
  });
}
