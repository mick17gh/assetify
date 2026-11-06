import Link from "next/link";
import { notFound } from "next/navigation";
import { UsageManualContent } from "@/components/docs/usage-manual-content";
import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { APP_ROUTES, SHOW_USAGE_MANUAL } from "@/constants";

export default function UsageManualPage() {
  if (!SHOW_USAGE_MANUAL) notFound();

  return (
    <div className="min-h-screen bg-navy-50 p-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-4">
          <BrandWordmark />
          <Link
            href={APP_ROUTES.SIGN_IN}
            className="text-sm text-navy-700 underline underline-offset-2 hover:text-navy-900"
          >
            Back to sign in
          </Link>
        </div>

        <div className="rounded-xl border border-navy-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <header className="mb-8 border-b border-navy-100 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">VortAsset Usage Manual</h1>
            <p className="mt-2 text-sm text-navy-900/70">
              A guide to using VortAsset for asset tracking, locations, maintenance, and reporting.
            </p>
          </header>
          <UsageManualContent />
        </div>
      </div>
    </div>
  );
}
