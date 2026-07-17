"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, MoreHorizontal, X } from "lucide-react";
import { reviewAssetRequestAction, fulfillAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_STATUS } from "@/constants";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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

type ReviewDecision = "APPROVED" | "REJECTED";

function RequestRowActions({
  row,
  canApprove,
  canFulfill,
}: {
  row: RequestRow;
  canApprove: boolean;
  canFulfill: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [decision, setDecision] = useState<ReviewDecision>("APPROVED");

  const showApproveReject = canApprove && row.status === ASSET_REQUEST_STATUS.PENDING;
  const showFulfill = canFulfill && row.status === ASSET_REQUEST_STATUS.APPROVED;
  const hasActions = showApproveReject || showFulfill || Boolean(row.fulfilledAssetId);

  if (!hasActions) return null;

  const openReview = (next: ReviewDecision) => {
    setDecision(next);
    setReviewOpen(true);
  };

  return (
    <>
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === "APPROVED" ? "Approve request" : "Reject request"}</DialogTitle>
            <DialogDescription>
              {decision === "APPROVED"
                ? "Optionally add a comment for the requester. Approving creates a pending asset."
                : "Add a comment so the requester knows why this was rejected."}
            </DialogDescription>
          </DialogHeader>
          <PendingForm
            action={reviewAssetRequestAction}
            onSuccess={() => setReviewOpen(false)}
            successMessage={decision === "APPROVED" ? "Request approved." : "Request rejected."}
            className="space-y-3"
            key={decision}
          >
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="decision" value={decision} readOnly />
            <div className="space-y-1">
              <Label htmlFor={`reviewComment-${row.id}`}>Comment</Label>
              <Textarea
                id={`reviewComment-${row.id}`}
                name="reviewComment"
                rows={4}
                required={decision === "REJECTED"}
                placeholder={decision === "APPROVED" ? "Comment (optional)" : "Rejection reason"}
              />
            </div>
            <SubmitButton
              idleLabel={decision === "APPROVED" ? "Approve" : "Reject"}
              pendingLabel={decision === "APPROVED" ? "Approving..." : "Rejecting..."}
              className={
                decision === "APPROVED"
                  ? "w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
                  : "w-full cursor-pointer bg-red-600 hover:bg-red-700"
              }
            />
          </PendingForm>
        </DialogContent>
      </Dialog>

      <Dialog open={fulfillOpen} onOpenChange={setFulfillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark request fulfilled</DialogTitle>
            <DialogDescription>
              Confirm that the pending asset has been set up and assigned. Make sure AIN, serial, and purchase
              details are complete first.
            </DialogDescription>
          </DialogHeader>
          <PendingForm
            action={fulfillAssetRequestAction}
            onSuccess={() => setFulfillOpen(false)}
            successMessage="Request marked as fulfilled."
            className="space-y-3"
          >
            <input type="hidden" name="id" value={row.id} />
            <SubmitButton
              idleLabel="Mark fulfilled"
              pendingLabel="Fulfilling..."
              className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
            />
          </PendingForm>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer border-purple-200">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showApproveReject ? (
            <>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  openReview("APPROVED");
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-700 focus:text-red-700"
                onSelect={(event) => {
                  event.preventDefault();
                  openReview("REJECTED");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          ) : null}
          {row.fulfilledAssetId ? (
            <DropdownMenuItem asChild>
              <Link href={`/assets/${row.fulfilledAssetId}`}>View pending asset</Link>
            </DropdownMenuItem>
          ) : null}
          {showFulfill ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setFulfillOpen(true);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark fulfilled
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function AssetRequestTable({
  requests,
  canApprove,
  canFulfill,
  showRequester,
  toolbar,
  pagination,
}: {
  requests: RequestRow[];
  canApprove: boolean;
  canFulfill: boolean;
  showRequester: boolean;
  toolbar?: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        {toolbar}
        <Table>
          <TableHeader>
            <TableRow>
              {showRequester ? <TableHead>Requester</TableHead> : null}
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showRequester ? 8 : 7} className="py-8 text-center text-purple-900/60">
                  No asset requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((row) => (
                <TableRow key={row.id}>
                  {showRequester ? <TableCell>{row.requesterName}</TableCell> : null}
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>{row.departmentName}</TableCell>
                  <TableCell>{row.urgency}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate text-sm" title={row.reason}>
                      {row.reason}
                    </p>
                    {row.reviewComment ? (
                      <p className="mt-1 truncate text-xs text-purple-900/60" title={row.reviewComment}>
                        Comment: {row.reviewComment}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[row.status] ?? ""}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RequestRowActions row={row} canApprove={canApprove} canFulfill={canFulfill} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination}
      </CardContent>
    </Card>
  );
}
