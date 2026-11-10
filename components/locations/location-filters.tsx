"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AssetLookupPicker } from "@/components/shared/entity-lookups";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import type { PickerOption } from "@/lib/lookups/types";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { clearPaginationParams } from "@/lib/pagination/page";

type BranchOption = ReferenceOption & { branchId?: string };
type RoomOption = ReferenceOption & { branchId: string };
type ShelfOption = ReferenceOption & { roomId: string };

export function LocationFilters({
  assetSeed,
  branches,
  departments,
  rooms,
  shelves,
}: {
  assetSeed: PickerOption[];
  branches: ReferenceOption[];
  departments: BranchOption[];
  rooms: RoomOption[];
  shelves: ShelfOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const asset = params.get("asset") ?? "";
  const branch = params.get("branch") ?? "";
  const department = params.get("department") ?? "";
  const room = params.get("room") ?? "";
  const shelf = params.get("shelf") ?? "";

  const roomBranchById = new Map(rooms.map((item) => [item.id, item.branchId]));
  const departmentOptions = departments.filter((item) => !branch || item.branchId === branch);
  const roomOptions = rooms.filter((item) => !branch || item.branchId === branch);
  const shelfOptions = shelves.filter((item) => {
    if (room && item.roomId !== room) return false;
    if (branch && roomBranchById.get(item.roomId) !== branch) return false;
    return true;
  });

  function updateQuery(mutate: (next: URLSearchParams) => void) {
    const target = getQueryNavigationTarget(params, (next) => {
      clearPaginationParams(next);
      mutate(next);
    });
    if (!target) return;
    router.replace(target);
  }

  function setParam(next: URLSearchParams, key: string, value: string) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }

  const fieldClass = "h-9 min-w-0 w-auto flex-1";

  return (
    <>
      <AssetLookupPicker
        value={asset}
        seed={assetSeed}
        allowNone
        noneLabel="All assets"
        placeholder="All assets"
        className={fieldClass}
        onValueChange={(value) => {
          updateQuery((next) => setParam(next, "asset", value));
        }}
      />
      <InlineCombobox
        value={branch}
        options={branches}
        allowNone
        placeholder="All branches"
        className={fieldClass}
        onValueChange={(value) => {
          updateQuery((next) => {
            setParam(next, "branch", value);
            if (department && departments.find((item) => item.id === department)?.branchId !== value && value) {
              next.delete("department");
            }
            const selectedRoom = rooms.find((item) => item.id === room);
            if (room && value && selectedRoom?.branchId !== value) {
              next.delete("room");
              next.delete("shelf");
            }
            const selectedShelf = shelves.find((item) => item.id === shelf);
            if (shelf && value && selectedShelf && roomBranchById.get(selectedShelf.roomId) !== value) {
              next.delete("shelf");
            }
          });
        }}
      />
      <InlineCombobox
        value={department}
        options={departmentOptions}
        allowNone
        placeholder="All departments"
        className={fieldClass}
        onValueChange={(value) => {
          updateQuery((next) => setParam(next, "department", value));
        }}
      />
      <InlineCombobox
        value={room}
        options={roomOptions}
        allowNone
        placeholder="All rooms"
        className={fieldClass}
        onValueChange={(value) => {
          updateQuery((next) => {
            setParam(next, "room", value);
            const selectedShelf = shelves.find((item) => item.id === shelf);
            if (shelf && value && selectedShelf?.roomId !== value) next.delete("shelf");
          });
        }}
      />
      <InlineCombobox
        value={shelf}
        options={shelfOptions}
        allowNone
        placeholder="All shelves"
        className={fieldClass}
        onValueChange={(value) => {
          updateQuery((next) => setParam(next, "shelf", value));
        }}
      />
    </>
  );
}
