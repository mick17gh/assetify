"use client";

import { runPeriodDepreciationAction } from "@/app/(dashboard)/settings/actions";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PeriodDepreciationRunCard({
  recentRuns,
}: {
  recentRuns: Array<{
    id: string;
    period: string;
    runAt: string;
    lineCount: number;
    notes: string | null;
  }>;
}) {
  return (
    <Card className="mb-6 border-navy-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-navy-950">Period depreciation close</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PendingForm action={runPeriodDepreciationAction} successMessage="Depreciation run posted." className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SetupTextField name="periodStart" label="Period start" type="date" required />
            <SetupTextField name="periodEnd" label="Period end" type="date" required />
          </div>
          <SetupTextField name="notes" label="Notes" />
          <p className="text-xs text-navy-900/60">
            Posts a period run and stores schedule lines. Export GL journal lines from Reports → Period Depreciation &amp;
            GL Export for the same dates.
          </p>
          <SubmitButton
            idleLabel="Post period run"
            pendingLabel="Posting..."
            className="cursor-pointer bg-navy-900 hover:bg-navy-950"
          />
        </PendingForm>
        <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-3">
          <p className="mb-2 text-sm font-medium text-navy-950">Recent runs</p>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-navy-900/65">No posted runs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-navy-900/80">
              {recentRuns.map((run) => (
                <li key={run.id} className="rounded-md border border-navy-100 bg-white p-2">
                  <p className="font-medium text-navy-950">{run.period}</p>
                  <p className="text-xs text-navy-900/60">
                    {run.runAt} · {run.lineCount} assets
                    {run.notes ? ` · ${run.notes}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
