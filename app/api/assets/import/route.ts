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
import { parseCsv, toCreateAssetInput, validateImportRows } from "@/lib/import-parser";
import { syncReplacementForAsset } from "@/lib/replacement-service";
import { syncRemindersForAsset } from "@/lib/reminder-service";

export async function POST(request: Request) {
  const session = await getRequiredSession();
  assertPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  assertRateLimit(`${API_ROUTES.CSV_IMPORT}:${session.userId}`, RATE_LIMIT.SENSITIVE_MAX);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }
  if (!session.organizationId) {
    return NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 });
  }

  const content = await file.text();
  const rows = parseCsv(content);
  const rowResults = validateImportRows(rows);
  const validRows = rowResults.filter((row) => row.ok && row.data);
  const totalRows = Math.max(rows.length - 1, 0);

  const job = await db.importJob.create({
    data: {
      organizationId: session.organizationId,
      branchId: session.branchId,
      createdByUserId: session.userId,
      fileName: file.name,
      totalRows,
      successRows: 0,
      failedRows: 0,
      status: IMPORT_STATUS.PROCESSING,
    },
  });

  const categoryNames = Array.from(
    new Set(validRows.map((row) => row.data?.categoryName?.trim().toLowerCase()).filter(Boolean)),
  );
  const branchCodes = Array.from(
    new Set(
      validRows
        .map((row) => row.data?.branchCode?.trim().toUpperCase())
        .filter((code): code is string => Boolean(code)),
    ),
  );
  const [categories, branches] = await Promise.all([
    categoryNames.length
      ? db.category.findMany({
          where: {
            OR: categoryNames.map((name) => ({
              name: { equals: name, mode: "insensitive" },
            })),
          },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    db.branch.findMany({
      where: {
        organizationId: session.organizationId,
        code: { in: branchCodes },
      },
      select: { id: true, code: true },
    }),
  ]);
  const categoryMap = new Map(categories.map((item) => [item.name.toLowerCase(), item.id]));
  const branchMap = new Map(branches.map((item) => [item.code.toUpperCase(), item.id]));

  const failures: Array<{ row: number; error: string }> = rowResults
    .filter((row) => !row.ok)
    .map((row) => ({ row: row.row, error: row.errors.join("; ") }));
  let successRows = 0;

  for (const row of validRows) {
    const rowData = row.data!;
    const categoryId = categoryMap.get(rowData.categoryName.trim().toLowerCase());
    const branchId = branchMap.get(rowData.branchCode.trim().toUpperCase());

    if (!categoryId || !branchId) {
      failures.push({
        row: row.row,
        error: !categoryId && !branchId
          ? "Category and branch not found"
          : !categoryId
            ? "Category not found"
            : "Branch not found",
      });
      continue;
    }

    try {
      const input = toCreateAssetInput(rowData, { categoryId, branchId });
      const asset = await db.asset.create({
        data: {
          ain: input.ain,
          serialNumber: input.serialNumber,
          name: input.name,
          purchaseDate: new Date(input.purchaseDate),
          purchaseCost: input.purchaseCost,
          categoryId: input.categoryId,
          branchId: input.branchId,
          status: input.status ?? ASSET_STATUS.ACTIVE,
          condition: input.condition ?? ASSET_CONDITION.GOOD,
          organizationId: session.organizationId,
        },
      });
      await db.assetStatusHistory.create({
        data: {
          assetId: asset.id,
          fromStatus: null,
          toStatus: asset.status,
          note: "Imported from CSV",
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
    metadata: { fileName: file.name, totalRows, successRows, failedRows },
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
