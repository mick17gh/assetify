import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsageManualContent } from "@/components/docs/usage-manual-content";
import { APP_ROUTES, SHOW_USAGE_MANUAL } from "@/constants";

export default function UsageManualPage() {
  if (!SHOW_USAGE_MANUAL) notFound();

  return (
    <div className="min-h-screen bg-[#FAF5FF] p-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/assetifylogo.png"
            alt="Assetify Asset Management System"
            width={280}
            height={84}
            priority
            className="h-auto w-[min(280px,85vw)] object-contain"
          />
          <Link
            href={APP_ROUTES.SIGN_IN}
            className="text-sm text-purple-700 underline underline-offset-2 hover:text-purple-900"
          >
            Back to sign in
          </Link>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <header className="mb-8 border-b border-purple-100 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#6D28D9]">Assetify Usage Manual</h1>
            <p className="mt-2 text-sm text-purple-900/70">
              A guide to using Assetify for asset tracking, locations, maintenance, and reporting.
            </p>
          </header>
          <UsageManualContent />
        </div>
      </div>
    </div>
  );
}
