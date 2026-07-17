import { PageHeader } from "@/components/shared/page-header";
import { AssetRequestForm } from "@/components/requests/asset-request-form";
import { AssetRequestTable } from "@/components/requests/asset-request-table";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { PERMISSION_KEYS, USER_ROLES } from "@/constants";
import { getReferenceDataForSession } from "@/lib/reference-data";

export default async function AssetRequestsPage() {
  const session = await getRequiredSession();
  const canRequest = hasPermission(session.role, PERMISSION_KEYS.ASSET_REQUEST);
  const canApprove = hasPermission(session.role, PERMISSION_KEYS.ASSET_APPROVE);
  const canFulfill = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const isAdmin = session.role === USER_ROLES.ADMIN;

  const reference = await getReferenceDataForSession(session);

  const requests = await db.assetRequest.findMany({
    where: {
      organizationId: session.organizationId ?? undefined,
      ...(isAdmin ? {} : canApprove ? { branchId: session.branchId ?? undefined } : { requesterId: session.userId }),
    },
    include: {
      requester: { select: { name: true } },
      category: { select: { name: true } },
      department: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Requests"
        description="Submit, review, and track asset requisitions across your organization."
      />
      {canRequest ? (
        <AssetRequestForm
          categories={reference.categories}
          departments={reference.departments.map((d) => ({ id: d.id, label: d.name }))}
        />
      ) : null}
      <AssetRequestTable
        requests={requests.map((r) => ({
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
      />
    </div>
  );
}
