"use client";

import { useRouter } from "next/navigation";
import { transitionExceptionAction, uploadExceptionEvidenceAction } from "@/app/(dashboard)/exceptions/actions";
import { UserLookupSelect } from "@/components/shared/entity-lookups";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PickerOption } from "@/lib/lookups/types";
import { EXCEPTION_STATUS } from "@/constants";

export type ExceptionDetailData = {
  id: string;
  typeLabel: string;
  status: string;
  statusLabel: string;
  description: string;
  resolution: string | null;
  assetLabel: string | null;
  assigneeId: string | null;
  events: { id: string; label: string; actor: string; note: string | null; at: string }[];
  evidence: { id: string; fileName: string; fileUrl: string }[];
};

export function ExceptionDetailSheet({
  exception,
  userSeed,
  canWrite,
  closeHref,
}: {
  exception: ExceptionDetailData;
  userSeed: PickerOption[];
  canWrite: boolean;
  closeHref: string;
}) {
  const router = useRouter();
  const status = exception.status;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) router.push(closeHref); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{exception.typeLabel}</DialogTitle>
          <DialogDescription>
            {exception.statusLabel}
            {exception.assetLabel ? ` · ${exception.assetLabel}` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5 pb-2">
          <p className="text-sm text-navy-900">{exception.description}</p>
          {exception.resolution ? <p className="text-sm text-navy-900/80">Resolution: {exception.resolution}</p> : null}

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-navy-900">Timeline</h3>
            <ol className="space-y-2">
              {exception.events.map((event) => (
                <li key={event.id} className="rounded-md border border-navy-100 px-3 py-2 text-sm">
                  <p className="font-medium text-navy-900">{event.label}</p>
                  <p className="text-xs text-navy-900/60">
                    {event.actor} · {event.at}
                  </p>
                  {event.note ? <p className="mt-1 text-navy-900/80">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-navy-900">Evidence</h3>
            {exception.evidence.length === 0 ? <p className="text-sm text-navy-900/60">No files yet.</p> : null}
            <ul className="space-y-1 text-sm">
              {exception.evidence.map((file) => (
                <li key={file.id}>
                  <a href={file.fileUrl} className="text-navy-800 underline" target="_blank" rel="noreferrer">
                    {file.fileName}
                  </a>
                </li>
              ))}
            </ul>
            {canWrite ? (
              <PendingForm action={uploadExceptionEvidenceAction} successMessage="Evidence uploaded." className="space-y-2">
                <input type="hidden" name="exceptionId" value={exception.id} />
                <Label htmlFor="file">Upload file</Label>
                <Input id="file" name="file" type="file" required />
                <SubmitButton idleLabel="Upload" pendingLabel="Uploading..." className="h-10 w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:h-9 sm:w-auto" />
              </PendingForm>
            ) : null}
          </section>

          {canWrite ? (
            <section className="space-y-3">
              {status === EXCEPTION_STATUS.IDENTIFIED ? (
                <PendingForm action={transitionExceptionAction} successMessage="Exception assigned." className="space-y-2">
                  <input type="hidden" name="exceptionId" value={exception.id} />
                  <input type="hidden" name="toStatus" value={EXCEPTION_STATUS.ASSIGNED} />
                  <UserLookupSelect
                    name="assignedToId"
                    label="Assignee"
                    seed={userSeed}
                    defaultValue={exception.assigneeId ?? ""}
                    required
                  />
                  <SubmitButton idleLabel="Assign" pendingLabel="Saving..." className="h-10 w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:h-9 sm:w-auto" />
                </PendingForm>
              ) : null}
              {status === EXCEPTION_STATUS.IDENTIFIED || status === EXCEPTION_STATUS.ASSIGNED ? (
                <SimpleTransition exceptionId={exception.id} toStatus={EXCEPTION_STATUS.INVESTIGATING} label="Start investigation" />
              ) : null}
              {status === EXCEPTION_STATUS.INVESTIGATING ? (
                <PendingForm action={transitionExceptionAction} successMessage="Exception resolved." className="space-y-2">
                  <input type="hidden" name="exceptionId" value={exception.id} />
                  <input type="hidden" name="toStatus" value={EXCEPTION_STATUS.RESOLVED} />
                  <Label htmlFor="note">Resolution note</Label>
                  <Textarea id="note" name="note" required />
                  <SubmitButton idleLabel="Resolve" pendingLabel="Saving..." className="h-10 w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:h-9 sm:w-auto" />
                </PendingForm>
              ) : null}
              {status === EXCEPTION_STATUS.RESOLVED ? (
                <SimpleTransition exceptionId={exception.id} toStatus={EXCEPTION_STATUS.APPROVED} label="Approve" />
              ) : null}
              {status === EXCEPTION_STATUS.IDENTIFIED || status === EXCEPTION_STATUS.ASSIGNED || status === EXCEPTION_STATUS.INVESTIGATING ? (
                <SimpleTransition exceptionId={exception.id} toStatus={EXCEPTION_STATUS.REJECTED} label="Reject" />
              ) : null}
            </section>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer border-navy-200"
            onClick={() => router.push(closeHref)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimpleTransition({ exceptionId, toStatus, label }: { exceptionId: string; toStatus: string; label: string }) {
  return (
    <PendingForm action={transitionExceptionAction} successMessage="Exception updated.">
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <Button type="submit" variant="outline" className="h-10 w-full cursor-pointer border-navy-200 sm:h-9 sm:w-auto">
        {label}
      </Button>
    </PendingForm>
  );
}
