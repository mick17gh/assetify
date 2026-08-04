"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { createAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_URGENCY } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { FormValueInput } from "@/components/shared/form-value-input";
import { ReferenceSelect, OptionalReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AssetOption = { id: string; name: string; categoryId: string };

export function AssetRequestForm({
  categories,
  departments,
  assets,
  custodians,
}: {
  categories: ReferenceOption[];
  departments: ReferenceOption[];
  assets: AssetOption[];
  custodians: ReferenceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetNameOpen, setAssetNameOpen] = useState(false);

  const assetsInCategory = useMemo(() => {
    const names = new Set<string>();
    const options: string[] = [];
    for (const asset of assets) {
      if (asset.categoryId !== categoryId || names.has(asset.name)) continue;
      names.add(asset.name);
      options.push(asset.name);
    }
    return options;
  }, [assets, categoryId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Asset Request</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={createAssetRequestAction}
          onSuccess={() => {
            setOpen(false);
            setCategoryId("");
            setAssetName("");
          }}
          successMessage="Asset request submitted."
          className="grid min-w-0 gap-3 sm:grid-cols-2"
        >
          <div className="min-w-0 sm:col-span-2">
            <ReferenceSelect
              name="categoryId"
              label="Asset type"
              options={categories}
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setAssetName("");
              }}
              required
            />
          </div>
          <div className="relative min-w-0 space-y-1 sm:col-span-2">
            <Label htmlFor="requestedAssetName">Asset name</Label>
            <FormValueInput name="requestedAssetName" value={assetName} required />
            <Popover
              open={assetNameOpen}
              onOpenChange={(next) => {
                if (!categoryId) return;
                setAssetNameOpen(next);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  id="requestedAssetName"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={assetNameOpen}
                  disabled={!categoryId}
                  className="h-9 w-full min-w-0 cursor-pointer justify-between border-purple-200 bg-white font-normal disabled:cursor-not-allowed"
                >
                  <span className="truncate text-left">
                    {assetName || (categoryId ? "Select asset name" : "Select asset type first")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search asset name..." />
                  <CommandList>
                    <CommandEmpty>
                      {assetsInCategory.length === 0 ? "No assets in this category" : "No matching asset name"}
                    </CommandEmpty>
                    <CommandGroup>
                      {assetsInCategory.map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={() => {
                            setAssetName(name);
                            setAssetNameOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", assetName === name ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <OptionalReferenceSelect name="custodianId" label="Custodian" options={custodians} />
          </div>
          <ReferenceSelect name="departmentId" label="Department" options={departments} />
          <EnumSelect
            name="urgency"
            label="Urgency"
            labelKey="assetRequestUrgency"
            values={ASSET_REQUEST_URGENCY}
            defaultValue={ASSET_REQUEST_URGENCY.MEDIUM}
            required
          />
          <div className="min-w-0 space-y-1 sm:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              name="reason"
              required
              minLength={3}
              maxLength={1000}
              placeholder="Why do you need this asset?"
            />
          </div>
          <div className="min-w-0 space-y-1 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" maxLength={2000} placeholder="Additional details (optional)" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton
              idleLabel="Submit request"
              pendingLabel="Submitting..."
              className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
            />
          </div>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
