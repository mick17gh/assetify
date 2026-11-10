import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { HealthMaturityRadar } from "@/components/settings/health-maturity-radar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HEALTH_CHECK_AREAS, MATURITY_LEVELS } from "@/constants/health-check";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { createHealthAssessmentAction } from "./actions";

export default async function HealthCheckSettingsPage() {
  const session = await getRequiredSession();
  const assessments = session.organizationId
    ? await db.healthAssessment.findMany({
        where: { organizationId: session.organizationId },
        include: { createdBy: { select: { name: true } }, recommendations: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];
  const latest = assessments[0];
  const latestScores = (latest?.scores as Record<string, number> | undefined) ?? {};

  return (
    <div>
      <PageHeader
        title="Management Health Check"
        description="Score asset-management maturity across 14 areas. Saved assessments feed the Maturity report and printable PDF."
        action={
          <SetupCreateModal
            title="Run maturity assessment"
            triggerLabel="New Assessment"
            action={createHealthAssessmentAction}
          >
            {HEALTH_CHECK_AREAS.map((area) => (
              <SetupTextField
                key={area.id}
                name={`score_${area.id}`}
                label={`${area.name} (1–5)`}
                type="number"
                required
                defaultValue="3"
              />
            ))}
            <div className="space-y-1">
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea id="strengths" name="strengths" className="min-w-0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weaknesses">Weaknesses</Label>
              <Textarea id="weaknesses" name="weaknesses" className="min-w-0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="actions">Priority actions</Label>
              <Textarea id="actions" name="actions" className="min-w-0" />
            </div>
            <SetupTextField name="recommendationTitle" label="First roadmap item (optional)" />
            <SetupTextField name="recommendationPriority" label="Roadmap priority" defaultValue="Medium" />
            <SetupTextField name="recommendationOwner" label="Roadmap owner" />
          </SetupCreateModal>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {MATURITY_LEVELS.map((level) => (
          <Card key={level.level} className="border-navy-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-navy-950">
                Level {level.level}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-navy-900/70">{level.label}</CardContent>
          </Card>
        ))}
      </div>

      {latest ? (
        <Card className="mb-5 border-navy-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base text-navy-950">Latest maturity radar</CardTitle>
              <p className="text-sm text-navy-900/65">
                v{latest.version} · Overall {Number(latest.overall).toFixed(2)} · Level {latest.maturityLevel}
              </p>
            </div>
            <Link
              href={`/api/health-check/${latest.id}/pdf`}
              className="text-sm font-medium text-navy-900 underline-offset-2 hover:underline"
            >
              Download PDF
            </Link>
          </CardHeader>
          <CardContent>
            <HealthMaturityRadar scores={latestScores} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-navy-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-navy-950">Assessment history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Assessor</TableHead>
                <TableHead>Roadmap items</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-navy-900/70">
                    No assessments yet. Run one to populate the Maturity report.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>v{row.version}</TableCell>
                    <TableCell>{row.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>{Number(row.overall).toFixed(2)}</TableCell>
                    <TableCell>{row.maturityLevel}</TableCell>
                    <TableCell>{row.createdBy.name}</TableCell>
                    <TableCell>{row.recommendations.length}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/api/health-check/${row.id}/pdf`}
                        className="text-sm font-medium text-navy-900 underline-offset-2 hover:underline"
                      >
                        PDF
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
