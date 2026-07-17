import { PageHeader } from "@/components/shared/page-header";
import { AssetRequestForm } from "@/components/requests/asset-request-form";
import { AssetRequestTable } from "@/components/requests/asset-request-table";
import { AssetRequestFilters } from "@/components/requests/asset-request-filters";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { ASSET_REQUEST_STATUS, ASSET_REQUEST_URGENCY, PERMISSION_KEYS, USER_ROLES } from "@/constants";
import { getReferenceDataForSession } from "@/lib/reference-data";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function AssetRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const canRequest = hasPermission(session.role, PERMISSION_KEYS.ASSET_REQUEST);
  const canApprove = hasPermission(session.role, PERMISSION_KEYS.ASSET_APPROVE);
  const canFulfill = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const isAdmin = session.role === USER_ROLES.ADMIN;

  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const statusFilter = getOptionalQuery(params, "status");
  const urgencyFilter = getOptionalQuery(params, "urgency");
  const branchFilter = getOptionalQuery(params, "branch");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const reference = await getReferenceDataForSession(session);

  const statusValues = Object.values(ASSET_REQUEST_STATUS);
  const urgencyValues = Object.values(ASSET_REQUEST_URGENCY);

  const where: Prisma.AssetRequestWhereInput = {
    organizationId: session.organizationId ?? undefined,
    ...(isAdmin
      ? branchFilter
        ? { branchId: branchFilter }
        : {}
      : canApprove
        ? { branchId: session.branchId ?? undefined }
        : { requesterId: session.userId }),
    ...(statusFilter && statusValues.includes(statusFilter as (typeof ASSET_REQUEST_STATUS)[keyof typeof ASSET_REQUEST_STATUS])
      ? { status: statusFilter as Prisma.AssetRequestWhereInput["status"] }
      : {}),
    ...(urgencyFilter &&
    urgencyValues.includes(urgencyFilter as (typeof ASSET_REQUEST_URGENCY)[keyof typeof ASSET_REQUEST_URGENCY])
      ? { urgency: urgencyFilter as Prisma.AssetRequestWhereInput["urgency"] }
      : {}),
    ...(q
      ? {
          OR: [
            { reason: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            { reviewComment: { contains: q, mode: "insensitive" } },
            { requester: { name: { contains: q, mode: "insensitive" } } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { department: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const requests = await db.assetRequest.findMany({
    where,
    include: {
      requester: { select: { name: true } },
      category: { select: { name: true } },
      department: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(requests, limit);
  const pageItems = requests.slice(0, limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Requests"
        description="Submit, review, and track asset requisitions across your organization."
        action={
          canRequest ? (
            <AssetRequestForm
              categories={reference.categories}
              departments={reference.departments.map((d) => ({ id: d.id, label: d.name }))}
            />
          ) : null
        }
      />
      <AssetRequestTable
        requests={pageItems.map((r) => ({
          id: r.id,
          reason: r.reason,
          urgency: r.urgency,
          status: r.status,
          notes: r.notes,
          reviewComment: r.reviewComment,
          createdAt: r.createdAt.toLocaleDateString(),
          requesterName: r.requester.name,
          categoryName: r.category.name,
          departmentName: r.department?.name ?? "N/A",
          branchName: r.branch.name,
          fulfilledAssetId: r.fulfilledAssetId,
        }))}
        canApprove={canApprove}
        canFulfill={canFulfill}
        showRequester={canApprove || isAdmin}
        toolbar={
          <TableToolbar
            searchPlaceholder="Search by reason, requester, or category"
            defaultLimit={limit}
            filters={
              <AssetRequestFilters
                branches={reference.branches}
                showBranchFilter={isAdmin}
              />
            }
          />
        }
        pagination={<PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />}
      />
    </div>
  );
}
