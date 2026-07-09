import { NextResponse } from "next/server";
import { API_ROUTES, ERROR_MESSAGES, RATE_LIMIT } from "@/constants";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRequiredSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { replayOfflineOperations } from "@/lib/offline-handlers";

export async function POST(request: Request) {
  const session = await getRequiredSession();
  assertRateLimit(`${API_ROUTES.OFFLINE_SYNC}:${session.userId}`, RATE_LIMIT.SENSITIVE_MAX);

  const body = (await request.json()) as {
    operations?: Array<{ type: string; payload: Record<string, unknown> }>;
  };

  if (!body.operations?.length) {
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 });
  }
  if (!session.organizationId) {
    return NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 });
  }

  const results = await replayOfflineOperations(body.operations, {
    organizationId: session.organizationId,
    userId: session.userId,
  });
  const synced = results.filter((item) => item.ok).length;
  const failed = results.length - synced;

  await writeAuditLog({
    actorUserId: session.userId,
    organizationId: session.organizationId,
    branchId: session.branchId,
    action: "offline.sync",
    entityType: "OfflineQueue",
    metadata: { count: body.operations.length, synced, failed },
  });

  return NextResponse.json({
    synced,
    failed,
    results,
    syncedAt: new Date().toISOString(),
  });
}
