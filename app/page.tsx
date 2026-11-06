import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { APP_ROUTES, HIDE_LANDING_PAGE } from "@/constants";
import { auth } from "@/lib/auth";

export default async function Home() {
  if (HIDE_LANDING_PAGE) redirect(APP_ROUTES.DASHBOARD);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect(APP_ROUTES.DASHBOARD);

  return <LandingPage />;
}
