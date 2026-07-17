"use client";

import { createAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_URGENCY } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function AssetRequestForm({
  categories,
  departments,
}: {
  categories: ReferenceOption[];
  departments: ReferenceOption[];
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Submit Asset Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createAssetRequestAction} className="grid gap-3 md:grid-cols-2">
          <ReferenceSelect name="categoryId" label="Asset type" options={categories} required />
          <ReferenceSelect name="departmentId" label="Department" options={departments} />
          <EnumSelect
            name="urgency"
            label="Urgency"
            labelKey="assetRequestUrgency"
            values={ASSET_REQUEST_URGENCY}
            defaultValue={ASSET_REQUEST_URGENCY.MEDIUM}
            required
          />
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" required placeholder="Why do you need this asset?" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Additional details (optional)" />
          </div>
          <div className="md:col-span-2">
            <SubmitButton idleLabel="Submit request" pendingLabel="Submitting..." className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
