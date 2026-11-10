import { PageHeader } from "@/components/shared/page-header";
import { ReportsCenter } from "@/components/reports/reports-center";
import { getRecentAssetsForPicker } from "@/lib/assets/picker-search";
import { db } from "@/lib/db";
import { permissionsForSession } from "@/lib/reports/auth";
import { canExportReports, canViewReports, getAccessibleReportIds } from "@/lib/reports/permissions";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants";

export default async function ReportsPage() {
  const session = await getRequiredSession();
  const perms = permissionsForSession(session);
  if (!canViewReports(perms)) {
    redirect(APP_ROUTES.DASHBOARD);
  }

  const [branches, departments, categories, assetSeed] = await Promise.all([
    db.branch.findMany({
      where: { organizationId: session.organizationId ?? undefined },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.department.findMany({
      where: { branch: { organizationId: session.organizationId ?? undefined } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    session.organizationId
      ? getRecentAssetsForPicker({ organizationId: session.organizationId })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate executive, operational, and audit reports with shared filters. Preview on screen or export CSV/Excel from the same data."
      />
      <ReportsCenter
        accessibleIds={getAccessibleReportIds(perms)}
        canExport={canExportReports(perms)}
        branches={branches.map((branch) => ({ id: branch.id, label: `${branch.name} (${branch.code})` }))}
        departments={departments.map((item) => ({ id: item.id, label: item.name }))}
        categories={categories.map((item) => ({ id: item.id, label: item.name }))}
        assetSeed={assetSeed}
      />
    </div>
  );
}
