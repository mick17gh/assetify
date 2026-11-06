import { notFound } from "next/navigation";
import { UsageManualContent } from "@/components/docs/usage-manual-content";
import { PageHeader } from "@/components/shared/page-header";
import { SHOW_USAGE_MANUAL } from "@/constants";

export default function UsageManualPage() {
  if (!SHOW_USAGE_MANUAL) notFound();

  return (
    <div>
      <PageHeader
        title="Usage manual"
        description="A guide to using VortAsset for asset tracking, verification, exceptions, and reporting."
      />
      <UsageManualContent />
    </div>
  );
}
