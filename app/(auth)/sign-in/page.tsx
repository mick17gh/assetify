import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { APP_ROUTES, SHOW_USAGE_MANUAL } from "@/constants";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SearchParams } from "@/lib/filters/query";

export default async function SignInPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect(APP_ROUTES.DASHBOARD);
  }
  const params = await searchParams;
  const redirectToValue = params.redirectTo;
  const redirectTo = typeof redirectToValue === "string" ? redirectToValue : APP_ROUTES.DASHBOARD;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF5FF] p-4">
      <SignInForm redirectTo={redirectTo} showUsageManual={SHOW_USAGE_MANUAL} />
    </div>
  );
}
