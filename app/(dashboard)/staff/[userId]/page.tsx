import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StaffDetailsTabs } from "@/components/staff/staff-details-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getUserScopeWhere, getAssetScopeWhere } from "@/lib/scoping";

export default async function StaffDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getRequiredSession();
  const { userId } = await params;
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

  const [movements, statusHistory] = await Promise.all([
    db.assetMovement.findMany({
      where: {
        OR: [
          { toCustodianId: member.id },
          { fromCustodianId: member.id },
          ...(assetIds.length ? [{ assetId: { in: assetIds } }] : []),
        ],
        asset: assetScope,
      },
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    assetIds.length
      ? db.assetStatusHistory.findMany({
          where: { assetId: { in: assetIds } },
          include: { asset: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="mb-3">
        <Button variant="ghost" asChild className="cursor-pointer px-0 text-purple-800 hover:bg-transparent">
          <Link href="/staff">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Link>
        </Button>
      </div>
      <PageHeader
        title={member.name}
        description={`Staff profile and asset custody overview for ${member.email}`}
      />
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <StaffDetailsTabs
          allocatedAssets={member.assignedAssets.map((asset) => ({
            id: asset.id,
            ain: asset.ain,
            name: asset.name,
            status: asset.status,
            branch: asset.branch.name,
            location: `${asset.room?.name ?? "N/A"} / ${asset.shelf?.name ?? "N/A"}`,
          }))}
          movements={movements.map((item) => ({
            id: item.id,
            date: item.createdAt.toLocaleDateString(),
            assetName: item.asset.name,
            assetId: item.asset.id,
            movementType: item.movementType,
            note: item.note ?? "",
          }))}
          history={statusHistory.map((item) => ({
            id: item.id,
            date: item.createdAt.toLocaleDateString(),
            assetName: item.asset.name,
            assetId: item.asset.id,
            from: item.fromStatus ?? "N/A",
            to: item.toStatus,
            note: item.note ?? "",
          }))}
        />

        <Card className="h-fit border-purple-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-purple-950">Staff Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ProfileField label="Email" value={member.email} />
            <ProfileField label="Role" value={member.role} />
            <ProfileField label="Branch" value={member.branch?.name ?? "—"} />
            <ProfileField label="Employee code" value={member.staffProfile?.employeeCode ?? "—"} />
            <ProfileField label="Title" value={member.staffProfile?.title ?? "—"} />
            <ProfileField label="Department" value={member.staffProfile?.department ?? "—"} />
            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3">
              <p className="text-xs text-purple-900/60">Allocated assets</p>
              <p className="text-2xl font-semibold text-[#7C3AED]">{member.assignedAssets.length}</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              {member.isActive ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 rounded-lg border border-purple-100 bg-white p-2.5">
      <p className="text-xs text-purple-900/60">{label}</p>
      <p className="font-medium text-purple-950">{value}</p>
    </div>
  );
}
