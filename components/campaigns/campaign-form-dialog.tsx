"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus } from "lucide-react";
import { createCampaignAction, updateCampaignAction } from "@/app/(dashboard)/campaigns/actions";
import { OptionalReferenceSelect, MultiReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CampaignFormDialog({
  branches,
  regions,
  departments,
  categories,
  campaign,
}: {
  branches: ReferenceOption[];
  regions: ReferenceOption[];
  departments: ReferenceOption[];
  categories: ReferenceOption[];
  campaign?: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    branchIds: string[];
    departmentIds: string[];
    categoryIds: string[];
  };
}) {
  const [open, setOpen] = useState(false);
  const [regionId, setRegionId] = useState("");
  const editing = Boolean(campaign);
  const visibleBranches = useMemo(
    () => (regionId ? branches.filter((branch) => branch.regionId === regionId) : branches),
    [branches, regionId],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="outline" className="cursor-pointer border-navy-200">
            <PencilLine className="mr-2 h-4 w-4" />
            Edit draft
          </Button>
        ) : (
          <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
            <Plus className="mr-2 h-4 w-4" />
            New campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit campaign" : "New campaign"}</DialogTitle>
          <DialogDescription>Empty scope fields include every branch, department, and category.</DialogDescription>
        </DialogHeader>
        <PendingForm
          action={editing ? updateCampaignAction : createCampaignAction}
          successMessage={editing ? "Campaign updated." : false}
          onSuccess={() => setOpen(false)}
          className="grid min-w-0 gap-3 sm:grid-cols-2"
        >
          {campaign ? <input type="hidden" name="campaignId" value={campaign.id} /> : null}
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required minLength={2} defaultValue={campaign?.name} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={campaign?.description} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">Start</Label>
            <Input id="startDate" name="startDate" type="date" required defaultValue={campaign?.startDate} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">End</Label>
            <Input id="endDate" name="endDate" type="date" required defaultValue={campaign?.endDate} />
          </div>
          <div className="sm:col-span-2">
            <OptionalReferenceSelect
              name="regionFilter"
              label="Filter branches by region"
              options={regions}
              value={regionId || "NONE"}
              onValueChange={(value) => setRegionId(value === "NONE" ? "" : value)}
            />
          </div>
          <div className="sm:col-span-2">
            <MultiReferenceSelect name="branchIds" label="Branches" options={visibleBranches} defaultValue={campaign?.branchIds} emptyLabel="All branches" />
          </div>
          <div className="sm:col-span-2">
            <MultiReferenceSelect
              name="departmentIds"
              label="Departments"
              options={departments}
              defaultValue={campaign?.departmentIds}
              emptyLabel="All departments"
            />
          </div>
          <div className="sm:col-span-2">
            <MultiReferenceSelect
              name="categoryIds"
              label="Categories"
              options={categories}
              defaultValue={campaign?.categoryIds}
              emptyLabel="All categories"
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton
              idleLabel={editing ? "Save draft" : "Create draft"}
              pendingLabel="Saving..."
              className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950"
            />
          </div>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
