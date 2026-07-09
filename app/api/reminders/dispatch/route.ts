import { NextResponse } from "next/server";
import { API_ROUTES, RATE_LIMIT } from "@/constants";
import { assertRateLimit } from "@/lib/rate-limit";
import { dispatchDueWarrantyReminders } from "@/lib/reminders";

export async function POST() {
  assertRateLimit(API_ROUTES.REMINDERS_DISPATCH, RATE_LIMIT.SENSITIVE_MAX);
  await dispatchDueWarrantyReminders();
  return NextResponse.json({ ok: true, dispatchedAt: new Date().toISOString() });
}
