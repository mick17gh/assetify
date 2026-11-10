import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, Hash, Mail, Shield } from "lucide-react";
import { DetailTabsLoading } from "@/components/shared/detail-page-loading";
import { StaffActivityPanel } from "@/components/staff/staff-activity-panel";
import { StaffProfileHeader } from "@/components/staff/staff-profile-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES, ENUM_LABELS } from "@/constants";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getUserScopeWhere, getAssetScopeWhere } from "@/lib/scoping";
import { cn } from "@/lib/utils";

export default async function StaffDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const [{ userId }, session] = await Promise.all([params, getRequiredSession()]);
  const userScope = getUserScopeWhere(session);
  const assetScope = getAssetScopeWhere(session);

  const member = await db.user.findFirst({
    where: { id: userId, ...userScope },
    include: {
      branch: true,
      staffProfile: true,
      assignedAssets: {
        where: assetScope,
        include: { branch: true, room: true, shelf: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!member) notFound();

  const assetIds = member.assignedAssets.map((asset) => asset.id);

  const [pendingAckCount, movementCount] = await Promise.all([
    db.assignmentAcknowledgement.count({
      where: {
        userId: member.id,
        status: "PENDING",
        asset: assetScope,
      },
    }),
    db.assetMovement.count({
      where: {
        OR: [
          { toCustodianId: member.id },
          { fromCustodianId: member.id },
          ...(assetIds.length ? [{ assetId: { in: assetIds } }] : []),
        ],
        asset: assetScope,
      },
    }),
  ]);

  const allocatedAssets = member.assignedAssets.map((asset) => ({
    id: asset.id,
    ain: asset.ain,
    name: asset.name,
    status: asset.status,
    branch: asset.branch.name,
    location: `${asset.room?.name ?? "N/A"} / ${asset.shelf?.name ?? "N/A"}`,
  }));

  const roleLabel = ENUM_LABELS.userRole[member.role] ?? member.role;
  const branch = member.branch?.name ?? "—";
  const department = member.staffProfile?.department ?? "—";
  const title = member.staffProfile?.title ?? "—";
  const employeeCode = member.staffProfile?.employeeCode ?? "—";

  return (
    <div>
      <div className="mb-3">
        <Button variant="ghost" asChild className="cursor-pointer px-0 text-navy-800 hover:bg-transparent">
          <Link href={APP_ROUTES.STAFF} prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Link>
        </Button>
      </div>

      <div className="mb-5">
        <StaffProfileHeader
          name={member.name}
          email={member.email}
          roleLabel={roleLabel}
          isActive={member.isActive}
          branch={branch}
          department={department}
          title={title}
          employeeCode={employeeCode}
          allocatedCount={member.assignedAssets.length}
          pendingAckCount={pendingAckCount}
          movementCount={movementCount}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Suspense fallback={<DetailTabsLoading />}>
          <StaffActivityPanel
            userId={member.id}
            assetIds={assetIds}
            assetScope={assetScope}
            allocatedAssets={allocatedAssets}
          />
        </Suspense>

        <Card className="h-fit border-navy-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-navy-950">Profile details</CardTitle>
            <p className="text-xs text-navy-900/55">Directory and employment information</p>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <ProfileField icon={Mail} label="Email" value={member.email} />
            <ProfileField icon={Shield} label="Role" value={roleLabel} />
            <ProfileField icon={Building2} label="Branch" value={branch} />
            <ProfileField icon={Hash} label="Employee code" value={employeeCode} />
            <ProfileField icon={Briefcase} label="Title" value={title} />
            <ProfileField icon={Building2} label="Department" value={department} />

            <div className="mt-2 rounded-xl border border-navy-100 bg-gradient-to-br from-navy-50 to-white p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-navy-900/60">Custody load</p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums text-navy-950">
                    {member.assignedAssets.length}
                  </p>
                  <p className="text-xs text-navy-900/55">assets currently assigned</p>
                </div>
                <Badge
                  className={cn(
                    "hover:bg-inherit",
                    member.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-navy-900/50">{label}</p>
        <p className="truncate font-medium text-navy-950">{value}</p>
      </div>
    </div>
  );
}
