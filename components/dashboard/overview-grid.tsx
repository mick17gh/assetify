import { KpiCard } from "@/components/shared/kpi-card";
import { APP_ROUTES } from "@/constants";

export function OverviewGrid({
  totalAssets,
  warrantyExpiringSoon,
  replacementDueQuarter,
  estimatedBudgetGhs,
  quarterSnapshotDue,
  quarterSnapshotCost,
  openExceptions,
  attention,
}: {
  totalAssets: number;
  warrantyExpiringSoon: number;
  replacementDueQuarter: number;
  estimatedBudgetGhs: number;
  quarterSnapshotDue: number | null;
  quarterSnapshotCost: number | null;
  openExceptions: number;
  attention: {
    missing: number;
    unverified: number;
    damaged: number;
    warrantyExpired: number;
    warrantySoon: number;
    highMaintenance: number;
    underRepair: number;
    beyondUsefulLife: number;
    pendingDisposal: number;
    unresolvedExceptions: number;
  };
}) {
  const cards = [
    ["Missing", attention.missing, `${APP_ROUTES.ASSETS}?attention=missing`],
    ["Unverified", attention.unverified, `${APP_ROUTES.ASSETS}?attention=unverified`],
    ["Damaged", attention.damaged, `${APP_ROUTES.ASSETS}?attention=damaged`],
    ["Warranty expired", attention.warrantyExpired, `${APP_ROUTES.ASSETS}?attention=warranty-expired`],
    ["Warranty soon", attention.warrantySoon, `${APP_ROUTES.ASSETS}?attention=warranty-soon`],
    ["High maintenance", attention.highMaintenance, `${APP_ROUTES.ASSETS}?attention=high-maintenance`],
    ["Under repair", attention.underRepair, `${APP_ROUTES.ASSETS}?attention=under-repair`],
    ["Beyond useful life", attention.beyondUsefulLife, `${APP_ROUTES.ASSETS}?attention=beyond-life`],
    ["Pending disposal", attention.pendingDisposal, `${APP_ROUTES.ASSETS}?attention=pending-disposal`],
    ["Unresolved exceptions", attention.unresolvedExceptions, APP_ROUTES.EXCEPTIONS],
  ] as const;

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <KpiCard title="Total Assets" value={totalAssets.toLocaleString()} hint="Across all branches" href={APP_ROUTES.ASSETS} />
        <KpiCard
          title="Warranty Expiring"
          value={warrantyExpiringSoon.toLocaleString()}
          hint="Within next 90 days"
          href={`${APP_ROUTES.ASSETS}?attention=warranty-soon`}
        />
        <KpiCard
          title="Replacement Due"
          value={replacementDueQuarter.toLocaleString()}
          hint="Current quarter"
          href={`${APP_ROUTES.REPLACEMENT}?q=APPROACHING`}
        />
        <KpiCard
          title="Estimated Budget"
          value={`GHS ${estimatedBudgetGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hint="Forecast this year"
          href={`${APP_ROUTES.REPORTS}?q=OVERDUE`}
        />
        <KpiCard
          title="Quarter Snapshot"
          value={(quarterSnapshotDue ?? 0).toLocaleString()}
          hint={`GHS ${(quarterSnapshotCost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          href={`${APP_ROUTES.REPORTS}?state=APPROACHING`}
        />
        <KpiCard
          title="Open Exceptions"
          value={openExceptions.toLocaleString()}
          hint="Awaiting a decision"
          href={APP_ROUTES.EXCEPTIONS}
        />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-navy-950">Assets requiring attention</h2>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map(([title, value, href]) => (
            <KpiCard key={title} title={title} value={value.toLocaleString()} hint="Open the matching list" href={href} />
          ))}
        </div>
      </section>
    </div>
  );
}
