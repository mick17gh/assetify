import Link from "next/link";
import { notFound } from "next/navigation";
import { activateCampaignAction, changeCampaignStatusAction, removeOfficerAction } from "@/app/(dashboard)/campaigns/actions";
import { AssignOfficerDialog } from "@/components/campaigns/assign-officer-dialog";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form-dialog";
import { CampaignExportButtons } from "@/components/campaigns/campaign-export-buttons";
import { CampaignVerifyPanel } from "@/components/campaigns/campaign-verify-panel";
import { PageHeader, pageActionGroupClass } from "@/components/shared/page-header";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAMPAIGN_STATUS, ENUM_LABELS, PERMISSION_KEYS } from "@/constants";
import { getCampaignStats, progressByBranch } from "@/lib/campaign-service";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { requireOrganizationId } from "@/lib/scoping";
import { getRequiredSession } from "@/lib/session";
import { getRecentUsersForPicker } from "@/lib/users/picker-search";

function dayValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getRequiredSession();
  const organizationId = requireOrganizationId(session);
  const canWrite = hasPermission(session.role, PERMISSION_KEYS.ASSET_WRITE);

  const campaign = await db.verificationCampaign.findFirst({
    where: { id, organizationId },
    include: {
      assignments: {
        include: { user: { select: { name: true, email: true } }, branch: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!campaign) notFound();

  const [stats, branches, departments, categories, officerSeed, regions, branchProgress, scopeAssets, assigned, pendingInvestigation] = await Promise.all([
    getCampaignStats(campaign.id, organizationId),
    db.branch.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true, regionId: true } }),
    db.department.findMany({
      where: { branch: { organizationId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getRecentUsersForPicker({ organizationId }),
    db.region.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    progressByBranch(campaign.id, organizationId),
    db.campaignScopeSnapshot.findMany({
      where: { campaignId: campaign.id },
      take: 100,
      orderBy: { asset: { name: "asc" } },
      select: { assetId: true, asset: { select: { ain: true, name: true, branch: { select: { name: true } } } } },
    }),
    db.campaignAssignment.findFirst({
      where: { campaignId: campaign.id, userId: session.userId },
      select: { id: true },
    }),
    db.assetException.count({
      where: { campaignId: campaign.id, organizationId, status: { in: ["IDENTIFIED", "ASSIGNED", "INVESTIGATING"] } },
    }),
  ]);

  const branchOptions = branches.map((item) => ({ id: item.id, label: item.name, regionId: item.regionId }));
  const regionOptions = regions.map((item) => ({ id: item.id, label: item.name }));
  const departmentOptions = departments.map((item) => ({ id: item.id, label: item.name }));
  const categoryOptions = categories.map((item) => ({ id: item.id, label: item.name }));
  const metrics = [
    ["Expected", stats.expected],
    ["Verified", stats.verified],
    ["Not found", stats.notFound],
    ["Unregistered", stats.unregistered],
    ["Exceptions", stats.exceptions],
    ["Pending investigation", pendingInvestigation],
    ["Completion", `${stats.completionPercent}%`],
  ] as const;
  const isDraft = campaign.status === CAMPAIGN_STATUS.DRAFT;
  const isActive = campaign.status === CAMPAIGN_STATUS.ACTIVE;

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={campaign.description || "Verification campaign"}
        action={
          <div className="flex flex-wrap gap-2">
            {canWrite && isDraft ? (
              <CampaignFormDialog
                branches={branchOptions}
                regions={regionOptions}
                departments={departmentOptions}
                categories={categoryOptions}
                campaign={{
                  id: campaign.id,
                  name: campaign.name,
                  description: campaign.description ?? "",
                  startDate: dayValue(campaign.startDate),
                  endDate: dayValue(campaign.endDate),
                  branchIds: campaign.branchIds,
                  departmentIds: campaign.departmentIds,
                  categoryIds: campaign.categoryIds,
                }}
              />
            ) : null}
            <Button variant="outline" asChild className="cursor-pointer border-navy-200">
              <Link href="/campaigns">All campaigns</Link>
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-navy-200 text-navy-900">
          {ENUM_LABELS.campaignStatus[campaign.status]}
        </Badge>
        <span className="text-sm text-navy-900/70">
          {campaign.startDate.toLocaleDateString()} – {campaign.endDate.toLocaleDateString()}
        </span>
      </div>
      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <Card key={label} className="border-navy-200 bg-white/90 py-4 shadow-sm">
            <CardHeader className="px-4 pb-1">
              <CardTitle className="text-xs font-medium text-navy-900/70">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-2xl font-semibold text-navy-900">{value}</CardContent>
          </Card>
        ))}
      </section>

      {canWrite && isDraft ? (
        <PendingForm action={activateCampaignAction} successMessage="Campaign activated." className="mb-4">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <SubmitButton idleLabel="Activate and freeze expected assets" pendingLabel="Activating..." className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto" />
        </PendingForm>
      ) : null}
      {canWrite && isActive ? (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center max-sm:[&_button]:h-auto max-sm:[&_button]:min-h-10 max-sm:[&_button]:w-full max-sm:[&_button]:px-2 sm:[&_button]:w-auto">
          <StatusButton campaignId={campaign.id} status={CAMPAIGN_STATUS.PAUSED} label="Pause" />
          <StatusButton campaignId={campaign.id} status={CAMPAIGN_STATUS.COMPLETED} label="Complete" />
          <StatusButton campaignId={campaign.id} status={CAMPAIGN_STATUS.CANCELLED} label="Cancel" />
        </div>
      ) : null}
      {canWrite && campaign.status === CAMPAIGN_STATUS.PAUSED ? (
        <div className={`${pageActionGroupClass} mb-4 sm:ml-auto`}>
          <StatusButton campaignId={campaign.id} status={CAMPAIGN_STATUS.ACTIVE} label="Resume" />
          <StatusButton campaignId={campaign.id} status={CAMPAIGN_STATUS.CANCELLED} label="Cancel" />
        </div>
      ) : null}
      {canWrite && isActive && assigned ? (
        <div className="mb-6">
          <CampaignVerifyPanel
            campaignId={campaign.id}
            campaignName={campaign.name}
            branches={branchOptions}
            categories={categoryOptions}
          />
        </div>
      ) : null}

      <Tabs defaultValue="scope">
        <TabsList>
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="officers">Officers</TabsTrigger>
          <TabsTrigger value="progress">Progress by branch</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        <TabsContent value="scope">
          <Card className="border-navy-200 shadow-sm">
            <CardContent className="space-y-4 pt-6 text-sm text-navy-900">
              <p>Branches: {namesFor(branches, campaign.branchIds)}</p>
              <p>Departments: {namesFor(departments, campaign.departmentIds)}</p>
              <p>Categories: {namesFor(categories, campaign.categoryIds)}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AIN</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Branch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopeAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No assets are frozen yet. Activate the campaign to snapshot them.</TableCell>
                    </TableRow>
                  ) : (
                    scopeAssets.map((row) => (
                      <TableRow key={row.assetId}>
                        <TableCell>{row.asset.ain}</TableCell>
                        <TableCell>{row.asset.name}</TableCell>
                        <TableCell>{row.asset.branch.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="officers">
          <Card className="border-navy-200 shadow-sm">
            <CardContent className="pt-6">
              {isDraft && canWrite ? (
                <div className={`${pageActionGroupClass} mb-4 sm:ml-auto`}>
                  <AssignOfficerDialog
                    campaignId={campaign.id}
                    officerSeed={officerSeed}
                    branches={branchOptions}
                  />
                </div>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No officers assigned.</TableCell>
                    </TableRow>
                  ) : (
                    campaign.assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {assignment.user.name}
                          <span className="ml-2 text-xs text-navy-900/60">{assignment.user.email}</span>
                        </TableCell>
                        <TableCell>{assignment.branch?.name ?? "All branches"}</TableCell>
                        <TableCell className="text-right">
                          {isDraft && canWrite ? (
                            <PendingForm action={removeOfficerAction} successMessage="Officer removed.">
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <input type="hidden" name="assignmentId" value={assignment.id} />
                              <SubmitButton idleLabel="Remove" pendingLabel="Removing..." variant="outline" className="cursor-pointer border-navy-200" />
                            </PendingForm>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="progress">
          <Card className="border-navy-200 shadow-sm">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Not found</TableHead>
                    <TableHead>Exceptions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchProgress.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>Progress appears after the campaign is activated.</TableCell>
                    </TableRow>
                  ) : (
                    branchProgress.map((row) => (
                      <TableRow key={row.branch}>
                        <TableCell>{row.branch}</TableCell>
                        <TableCell>{row.expected}</TableCell>
                        <TableCell>{row.verified}</TableCell>
                        <TableCell>{row.notFound}</TableCell>
                        <TableCell>{row.exceptions}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="export">
          <Card className="border-navy-200 shadow-sm">
            <CardContent className="space-y-3 pt-6 text-sm text-navy-900">
              <p>
                Expected {stats.expected}, verified {stats.verified}, not found {stats.notFound}, unregistered {stats.unregistered}, exceptions {stats.exceptions}, completion {stats.completionPercent}%.
              </p>
              <CampaignExportButtons campaignId={campaign.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusButton({ campaignId, status, label }: { campaignId: string; status: string; label: string }) {
  return (
    <PendingForm action={changeCampaignStatusAction} successMessage="Status updated.">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton idleLabel={label} pendingLabel="Saving..." variant="outline" className="cursor-pointer border-navy-200" />
    </PendingForm>
  );
}

function namesFor(options: { id: string; name: string }[], ids: string[]) {
  if (!ids.length) return "All";
  const names = options.filter((option) => ids.includes(option.id)).map((option) => option.name);
  return names.length ? names.join(", ") : "All";
}
