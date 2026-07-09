"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetupCreateModal, SetupTextField } from "@/components/settings/setup-create-modal";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { PrintLocationTagButton } from "@/components/settings/print-location-tag-button";
import { ReferenceSelect } from "@/components/shared/reference-selects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReferenceOption } from "@/components/shared/reference-selects";
import {
  createDepartmentAction,
  createRoomAction,
  createShelfAction,
  deleteDepartmentAction,
  deleteRoomAction,
  deleteShelfAction,
  updateDepartmentAction,
  updateRoomAction,
  updateShelfAction,
} from "@/app/(dashboard)/settings/actions";

type DeptRow = { id: string; name: string; branch: { name: string }; branchId: string };
type RoomRow = { id: string; name: string; branch: { name: string }; branchId: string };
type ShelfRow = { id: string; name: string; room: { name: string }; roomId: string };

export function LocationsSetupTabs({
  departments,
  rooms,
  shelves,
  branches,
  roomsForSelect,
  qrEnabled = false,
}: {
  departments: DeptRow[];
  rooms: RoomRow[];
  shelves: ShelfRow[];
  branches: ReferenceOption[];
  roomsForSelect: ReferenceOption[];
  qrEnabled?: boolean;
}) {
  return (
    <Tabs defaultValue="departments" className="w-full">
      <TabsList className="mb-4 h-10 rounded-lg bg-purple-50">
        <TabsTrigger value="departments">Departments</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="shelves">Shelves</TabsTrigger>
      </TabsList>

      <TabsContent value="departments">
        <div className="mb-4 flex justify-end">
          <SetupCreateModal title="Create department" triggerLabel="Add Department" action={createDepartmentAction}>
            <ReferenceSelect name="branchId" label="Branch" options={branches} required />
            <SetupTextField name="name" label="Name" required />
          </SetupCreateModal>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.branch.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <SetupRowActions
                      recordId={row.id}
                      editTitle="Edit department"
                      updateAction={updateDepartmentAction}
                      deleteAction={deleteDepartmentAction}
                      editFields={
                        <>
                          <ReferenceSelect name="branchId" label="Branch" options={branches} defaultValue={row.branchId} required />
                          <SetupTextField name="name" label="Name" required defaultValue={row.name} />
                        </>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="rooms">
        <div className="mb-4 flex justify-end">
          <SetupCreateModal title="Create room" triggerLabel="Add Room" action={createRoomAction}>
            <ReferenceSelect name="branchId" label="Branch" options={branches} required />
            <SetupTextField name="name" label="Name" required />
          </SetupCreateModal>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.branch.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {qrEnabled ? <PrintLocationTagButton id={row.id} type="room" /> : null}
                    <SetupRowActions
                      recordId={row.id}
                      editTitle="Edit room"
                      updateAction={updateRoomAction}
                      deleteAction={deleteRoomAction}
                      editFields={
                        <>
                          <ReferenceSelect name="branchId" label="Branch" options={branches} defaultValue={row.branchId} required />
                          <SetupTextField name="name" label="Name" required defaultValue={row.name} />
                        </>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="shelves">
        <div className="mb-4 flex justify-end">
          <SetupCreateModal title="Create shelf" triggerLabel="Add Shelf" action={createShelfAction}>
            <ReferenceSelect name="roomId" label="Room" options={roomsForSelect} required />
            <SetupTextField name="name" label="Name" required />
          </SetupCreateModal>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shelves.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.room.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {qrEnabled ? <PrintLocationTagButton id={row.id} type="shelf" /> : null}
                    <SetupRowActions
                      recordId={row.id}
                      editTitle="Edit shelf"
                      updateAction={updateShelfAction}
                      deleteAction={deleteShelfAction}
                      editFields={
                        <>
                          <ReferenceSelect name="roomId" label="Room" options={roomsForSelect} defaultValue={row.roomId} required />
                          <SetupTextField name="name" label="Name" required defaultValue={row.name} />
                        </>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
