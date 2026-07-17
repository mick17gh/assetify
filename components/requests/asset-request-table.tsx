"use client";

import Link from "next/link";
import { reviewAssetRequestAction, fulfillAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_STATUS } from "@/constants";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RequestRow = {
  id: string;
  reason: string;
  urgency: string;
  status: string;
  notes: string | null;
  reviewComment: string | null;
  createdAt: string;
  requesterName: string;
  categoryName: string;
  departmentName: string;
  branchName: string;
  fulfilledAssetId: string | null;
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  FULFILLED: "bg-blue-100 text-blue-800",
};

export function AssetRequestTable({
  requests,
  canApprove,
  canFulfill,
  showRequester,
}: {
  requests: RequestRow[];
  canApprove: boolean;
  canFulfill: boolean;
  showRequester: boolean;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Asset Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showRequester ? <TableHead>Requester</TableHead> : null}
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((row) => (
              <TableRow key={row.id}>
                {showRequester ? <TableCell>{row.requesterName}</TableCell> : null}
                <TableCell>{row.categoryName}</TableCell>
                <TableCell>{row.departmentName}</TableCell>
                <TableCell>{row.urgency}</TableCell>
                <TableCell>
                  <Badge className={statusColor[row.status] ?? ""}>{row.status}</Badge>
                </TableCell>
                <TableCell>{row.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-2">
                    <p className="max-w-xs text-left text-xs text-purple-900/70">{row.reason}</p>
                    {row.reviewComment ? (
                      <p className="max-w-xs text-left text-xs text-purple-900/60">Comment: {row.reviewComment}</p>
                    ) : null}
                    {canApprove && row.status === ASSET_REQUEST_STATUS.PENDING ? (
                      <div className="flex gap-2">
                        <form action={reviewAssetRequestAction} className="flex items-end gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <SetupTextField name="reviewComment" label="" placeholder="Comment (optional)" />
                          <SubmitButton idleLabel="Approve" pendingLabel="Approving..." className="cursor-pointer" />
                        </form>
                        <form action={reviewAssetRequestAction} className="flex items-end gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="decision" value="REJECTED" />
                          <SetupTextField name="reviewComment" label="" placeholder="Rejection reason" />
                          <SubmitButton idleLabel="Reject" pendingLabel="Rejecting..." className="cursor-pointer bg-red-600 hover:bg-red-700" />
                        </form>
                      </div>
                    ) : null}
                    {row.fulfilledAssetId ? (
                      <Button variant="link" asChild className="h-auto p-0">
                        <Link href={`/assets/${row.fulfilledAssetId}`}>View pending asset</Link>
                      </Button>
                    ) : null}
                    {canFulfill && row.status === ASSET_REQUEST_STATUS.APPROVED ? (
                      <form action={fulfillAssetRequestAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <SubmitButton idleLabel="Mark fulfilled" pendingLabel="Fulfilling..." className="cursor-pointer" />
                      </form>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
