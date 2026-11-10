import { PageHeader } from "@/components/shared/page-header";
import { PendingAcknowledgements } from "@/components/acknowledgements/pending-acknowledgements";
import { ACKNOWLEDGEMENT_STATUS } from "@/constants";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";

export default async function AcknowledgementsPage() {
  const session = await getRequiredSession();
  const rows = await db.assignmentAcknowledgement.findMany({
    where: {
      userId: session.userId,
      status: ACKNOWLEDGEMENT_STATUS.PENDING,
      asset: { organizationId: session.organizationId ?? undefined },
    },
    include: {
      asset: { select: { id: true, ain: true, name: true, serialNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Custody acknowledgements"
        description="Accept deferred staff assignments so custody stays auditable."
      />
      <PendingAcknowledgements
        rows={rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toLocaleString(),
          asset: row.asset,
        }))}
      />
    </div>
  );
}
