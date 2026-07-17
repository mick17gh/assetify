"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadMaintenanceDocumentAction } from "@/app/(dashboard)/maintenance/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MaintenanceDocumentUpload({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer border-purple-200 px-2 text-xs"
        >
          <Upload className="mr-1 h-3 w-3" />
          Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload maintenance document</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={uploadMaintenanceDocumentAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
          className="space-y-3"
        >
          <input type="hidden" name="recordId" value={recordId} />
          <div className="space-y-1">
            <Label htmlFor={`document-${recordId}`}>Invoice / report</Label>
            <Input id={`document-${recordId}`} name="document" type="file" required />
          </div>
          <SubmitButton idleLabel="Upload" pendingLabel="Uploading..." className="w-full cursor-pointer" />
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
