"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";

export function SetupCreateModal({
  title,
  triggerLabel,
  action,
  children,
}: {
  title: string;
  triggerLabel: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={action}
          onSuccess={() => setOpen(false)}
          successMessage="Saved."
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-3 pb-2">{children}</DialogBody>
          <DialogFooter>
            <SubmitButton idleLabel="Save" pendingLabel="Saving..." className="w-full cursor-pointer sm:w-auto" />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}

export function SetupTextField({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  placeholder,
  minLength,
  maxLength,
  pattern,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        className="min-w-0"
      />
    </div>
  );
}
