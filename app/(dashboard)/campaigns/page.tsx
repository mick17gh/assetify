import Link from "next/link";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENUM_LABELS, PERMISSION_KEYS, VERIFICATION_OUTCOME } from "@/constants";
import { db } from "@/lib/db";
import { getOptionalQuery, type SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { hasPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const organizationId = requireOrganizationId(session);
  const canWrite = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);

  const where = {
    organizationId,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [campaigns, totalCount, verifiedGroups, branches, departments, categories, regions] = await Promise.all([
    db.verificationCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { snapshots: true } } },
      skip,
      take,
    }),
    db.verificationCampaign.count({ where }),
    db.assetVerification.groupBy({
      by: ["campaignId"],
      where: { organizationId, outcome: VERIFICATION_OUTCOME.VERIFIED },
      _count: { _all: true },
    }),
    db.branch.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true, regionId: true } }),
    db.department.findMany({
      where: { branch: { organizationId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.region.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const verifiedByCampaign = new Map(verifiedGroups.map((row) => [row.campaignId, row._count._all]));

  return (
    <div>
      <PageHeader
        title="Verification Campaigns"
        description="Freeze the assets you expect to find, then record what officers verify."
        action={
          canWrite ? (
            <CampaignFormDialog
              branches={branches.map((item) => ({ id: item.id, label: item.name, regionId: item.regionId }))}
              regions={regions.map((item) => ({ id: item.id, label: item.name }))}
              departments={departments.map((item) => ({ id: item.id, label: item.name }))}
              categories={categories.map((item) => ({ id: item.id, label: item.name }))}
            />
          ) : null
        }
      />
      <Card className="border-navy-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search campaigns" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No campaigns yet.</TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const expected = campaign._count.snapshots;
                  const verified = verifiedByCampaign.get(campaign.id) ?? 0;
                  const percent = expected === 0 ? 0 : Math.round((verified / expected) * 100);
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Link href={`/campaigns/${campaign.id}`} className="font-medium text-navy-900 hover:underline">
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-navy-200 text-navy-900">
                          {ENUM_LABELS.campaignStatus[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.startDate.toLocaleDateString()} – {campaign.endDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="w-40">
                          <div className="mb-1 flex justify-between text-xs text-navy-900/70">
                            <span>
                              {verified} of {expected}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-navy-100">
                            <div className="h-1.5 rounded-full bg-navy-900" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
