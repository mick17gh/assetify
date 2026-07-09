import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/shared/submit-button";

export function ReplacementOverview({
  healthy,
  approaching,
  overdue,
  recomputeAction,
}: {
  healthy: number;
  approaching: number;
  overdue: number;
  recomputeAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Replacement and Disposal Engine</CardTitle>
        <form action={recomputeAction}>
          <SubmitButton idleLabel="Recompute Now" pendingLabel="Recomputing..." className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]" />
        </form>
      </CardHeader>
      <CardContent className="text-sm text-purple-900/70">
        <p className="mb-3">
          Calculates end-of-life, replacement due windows, disposal eligibility, and budget impact by quarter and
          year.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-emerald-50 p-3">
            <p className="text-xl font-semibold text-emerald-700">{healthy}</p>
            <p className="text-xs text-emerald-700/80">Healthy</p>
          </div>
          <div className="rounded-md bg-amber-50 p-3">
            <p className="text-xl font-semibold text-amber-700">{approaching}</p>
            <p className="text-xs text-amber-700/80">Approaching</p>
          </div>
          <div className="rounded-md bg-rose-50 p-3">
            <p className="text-xl font-semibold text-rose-700">{overdue}</p>
            <p className="text-xs text-rose-700/80">Overdue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
