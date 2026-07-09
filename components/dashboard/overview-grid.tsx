import { KpiCard } from "@/components/shared/kpi-card";
import { APP_ROUTES } from "@/constants";

export function OverviewGrid({
  totalAssets,
  warrantyExpiringSoon,
  replacementDueQuarter,
  estimatedBudgetGhs,
  quarterSnapshotDue,
  quarterSnapshotCost,
}: {
  totalAssets: number;
  warrantyExpiringSoon: number;
  replacementDueQuarter: number;
  estimatedBudgetGhs: number;
  quarterSnapshotDue: number | null;
  quarterSnapshotCost: number | null;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard title="Total Assets" value={totalAssets.toLocaleString()} hint="Across all branches" href={APP_ROUTES.ASSETS} />
      <KpiCard
        title="Warranty Expiring"
        value={warrantyExpiringSoon.toLocaleString()}
        hint="Within next 90 days"
        href={`${APP_ROUTES.ASSETS}?q=WARRANTY_DUE`}
      />
      <KpiCard
        title="Replacement Due"
        value={replacementDueQuarter.toLocaleString()}
        hint="Current quarter"
        href={`${APP_ROUTES.REPLACEMENT}?q=APPROACHING`}
      />
      <KpiCard
        title="Estimated Budget"
        value={`GHS ${estimatedBudgetGhs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        hint="Forecast this year"
        href={`${APP_ROUTES.REPORTS}?q=OVERDUE`}
      />
      <KpiCard
        title="Quarter Snapshot"
        value={(quarterSnapshotDue ?? 0).toLocaleString()}
        hint={`GHS ${(quarterSnapshotCost ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        href={`${APP_ROUTES.REPORTS}?state=APPROACHING`}
      />
    </section>
  );
}
