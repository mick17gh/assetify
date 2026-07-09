import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APP_ROUTES } from "@/constants";

const PROTECTED_PREFIXES = [
  APP_ROUTES.DASHBOARD,
  APP_ROUTES.ASSETS,
  APP_ROUTES.DOCUMENTS,
  APP_ROUTES.LOCATIONS,
  APP_ROUTES.MAINTENANCE,
  APP_ROUTES.REPLACEMENT,
  APP_ROUTES.REPORTS,
  APP_ROUTES.BRANCHES,
  APP_ROUTES.USERS,
  APP_ROUTES.SETTINGS,
  APP_ROUTES.SETTINGS_ORGANIZATION,
  APP_ROUTES.SETTINGS_BRANCHES,
  APP_ROUTES.SETTINGS_CATEGORIES,
  APP_ROUTES.SETTINGS_VENDORS,
  APP_ROUTES.SETTINGS_LOCATIONS,
  APP_ROUTES.SETTINGS_POLICIES,
  APP_ROUTES.SETTINGS_REMINDERS,
  APP_ROUTES.SETTINGS_AUDIT,
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie =
    request.cookies.has("better-auth.session_token") || request.cookies.has("__Secure-better-auth.session_token");

  if (hasSessionCookie) return NextResponse.next();

  const signInUrl = new URL(APP_ROUTES.SIGN_IN, request.url);
  signInUrl.searchParams.set("redirectTo", `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
