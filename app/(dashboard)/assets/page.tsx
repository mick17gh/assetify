import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { CreateAssetModal } from "@/components/assets/create-asset-modal";
import { AssetTable } from "@/components/assets/asset-table";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { getReferenceDataForSession } from "@/lib/reference-data";
import { Prisma } from "@/lib/generated/prisma/client";
import { ImportAssetsModal } from "@/components/assets/import-assets-modal";
import { AssetFilters } from "@/components/assets/asset-filters";
import { isQrLocationScanningEnabled } from "@/lib/organization-settings";
import { ASSET_STATUS, PERMISSION_KEYS } from "@/constants";
import { hasPermission } from "@/lib/permissions";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const canWriteAssets = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const qrEnabled = session.organizationId ? await isQrLocationScanningEnabled(session.organizationId) : false;
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const branchFilter = getOptionalQuery(params, "branch");
  const statusFilter = getOptionalQuery(params, "status");
  const isWarrantyDueFilter = q?.toUpperCase() === "WARRANTY_DUE";
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);
  const warrantyDueThreshold = new Date();
  warrantyDueThreshold.setDate(warrantyDueThreshold.getDate() + 90);

  const where: Prisma.AssetWhereInput = {
    ...getAssetScopeWhere(session),
    ...(branchFilter ? { branchId: branchFilter } : {}),
    ...(statusFilter && Object.values(ASSET_STATUS).includes(statusFilter as (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS])
      ? { status: statusFilter as Prisma.AssetWhereInput["status"] }
      : {}),
    ...(!statusFilter || ![ASSET_STATUS.DISPOSED, ASSET_STATUS.DONATED, ASSET_STATUS.SOLD].includes(statusFilter as typeof ASSET_STATUS.DISPOSED)
      ? { isActive: true }
      : {}),
    ...(isWarrantyDueFilter
      ? {
          warrantyExpiryDate: {
            gte: new Date(),
            lte: warrantyDueThreshold,
          },
        }
      : q
      ? {
          OR: [
            { ain: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const assets = await db.asset.findMany({
    where,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
    orderBy: { updatedAt: "desc" },
    include: { branch: true, custodian: true },
  });
  const nextCursor = getNextCursor(assets, limit);
  const pageItems = assets.slice(0, limit);
  const refs = await getReferenceDataForSession(session);

  return (
    <div>
      <PageHeader
        title="Digital Asset Register"
        description="Centralized AIN registry with branch, category, and custodian indexing."
        action={
          canWriteAssets ? (
            <div className="flex flex-wrap items-center gap-2">
              <ImportAssetsModal />
              <CreateAssetModal
                branches={refs.branches}
                categories={refs.categories}
                vendors={refs.vendors}
                custodians={refs.custodians}
                locations={{
                  departments: refs.departments,
                  rooms: refs.rooms,
                  shelves: refs.shelves,
                }}
              />
            </div>
          ) : null
        }
      />
      <AssetTable
        assets={pageItems.map((asset) => ({
          id: asset.id,
          ain: asset.ain,
          name: asset.name,
          serialNumber: asset.serialNumber,
          status: asset.status,
          branch: asset.branch.name,
          custodian: asset.custodian?.name ?? "Unassigned",
        }))}
        toolbar={
          <TableToolbar
            searchPlaceholder="Search by AIN, serial, or name"
            defaultLimit={limit}
            filters={<AssetFilters branches={refs.branches} />}
          />
        }
        pagination={<PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />}
        qrEnabled={qrEnabled}
      />
    </div>
  );
}
