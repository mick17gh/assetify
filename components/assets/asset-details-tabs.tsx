"use client";

import { DocumentOpenButton } from "@/components/documents/document-open-button";
import { AssetTimeline, type TimelineItem } from "@/components/assets/asset-timeline";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import { FileText, MapPin, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

type MaintenanceItem = {
  id: string;
  serviceDate: string;
  description: string;
  cost: string;
  vendorName: string;
  status: string;
  documents: Array<{ id: string; fileName: string; fileUrl: string }>;
};

type FileItem = {
  id: string;
  fileName: string;
  type: string;
  fileUrl: string;
  createdAt: string;
};

type OverviewData = {
  status: string;
  condition: string;
  serialNumber: string;
  manufacturer: string;
  modelName: string;
  existingAssetNumber: string;
  assignmentType: string;
  expectedReturn: string;
  acknowledgement: string;
  category: string;
  branch: string;
  department: string;
  room: string;
  shelf: string;
  custodian: string;
  vendor: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiry: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceUrl: string;
  capitalizedDate: string;
  ownershipType: string;
  lessorName: string;
  leaseWindow: string;
  leaseMonthlyCost: string;
  maintenanceCount: number;
  documentCount: number;
  latestMaintenance: { date: string; description: string } | null;
  latestHistory: { date: string; from: string; to: string } | null;
  currentValue: string;
  accumulatedDepreciation: string;
  recommendedSalePrice: string;
};

export function AssetDetailsTabs({
  overview,
  maintenance,
  maintenanceSummary,
  timeline,
  files,
  disposalRecord,
  disposalPipeline,
  canUploadDocuments = false,
}: {
  overview: OverviewData;
  maintenance: MaintenanceItem[];
  maintenanceSummary: { totalCost: number; purchaseCost: number; isHighCost: boolean };
  timeline: TimelineItem[];
  files: FileItem[];
  disposalRecord: { method: string; disposalDate: string; reason: string; salePrice: string | null } | null;
  disposalPipeline: {
    recommendationState: string | null;
    approvalStatus: string | null;
    recommendedAction: string | null;
    reason: string | null;
    replacementState: string | null;
    recommendedReplaceDate: string | null;
  };
  canUploadDocuments?: boolean;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4 h-auto rounded-lg bg-navy-50">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="history">Timeline</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <OverviewField label="Status" value={overview.status} />
              <OverviewField label="Condition" value={overview.condition} />
              <OverviewField label="Serial" value={overview.serialNumber} />
              <OverviewField label="Manufacturer" value={overview.manufacturer} />
              <OverviewField label="Model" value={overview.modelName} />
              <OverviewField label="Existing number" value={overview.existingAssetNumber} />
              <OverviewField label="Category" value={overview.category} />
              <OverviewField label="Branch" value={overview.branch} />
              <OverviewField label="Department" value={overview.department} />
              <OverviewField label="Room" value={overview.room} />
              <OverviewField label="Shelf" value={overview.shelf} />
              <OverviewField label="Vendor" value={overview.vendor} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-950">
                  <MapPin className="h-4 w-4 text-navy-700" />
                  Location & custody
                </p>
                <div className="space-y-2 text-sm text-navy-900/75">
                  <p>
                    <span className="font-medium text-navy-950">Location:</span> {overview.room} / {overview.shelf}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-navy-700" />
                    <span>
                      <span className="font-medium text-navy-950">Custodian:</span> {overview.custodian}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Assignment:</span> {overview.assignmentType}
                    {overview.expectedReturn !== "N/A" ? ` · return ${overview.expectedReturn}` : ""}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Acknowledgement:</span> {overview.acknowledgement}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Ownership:</span> {overview.ownershipType}
                  </p>
                  {overview.lessorName !== "N/A" ? (
                    <p>
                      <span className="font-medium text-navy-950">Lessor:</span> {overview.lessorName}
                      {overview.leaseWindow !== "N/A" ? ` · ${overview.leaseWindow}` : ""}
                      {overview.leaseMonthlyCost !== "N/A" ? ` · GHS ${overview.leaseMonthlyCost}/mo` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-4">
                <p className="mb-2 text-sm font-semibold text-navy-950">Procurement & valuation</p>
                <div className="space-y-2 text-sm text-navy-900/75">
                  <p>
                    <span className="font-medium text-navy-950">Purchase date:</span> {overview.purchaseDate}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Capitalized:</span> {overview.capitalizedDate}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">PO / Invoice:</span> {overview.poNumber} / {overview.invoiceNumber}
                  </p>
                  {overview.invoiceUrl !== "N/A" ? (
                    <p>
                      <span className="font-medium text-navy-950">Invoice link:</span>{" "}
                      <a href={overview.invoiceUrl} target="_blank" rel="noreferrer" className="underline">
                        Open
                      </a>
                    </p>
                  ) : null}
                  <p>
                    <span className="font-medium text-navy-950">Purchase cost:</span> {overview.purchaseCost}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Warranty expiry:</span> {overview.warrantyExpiry}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Current value:</span> GHS {overview.currentValue}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Depreciation:</span> GHS {overview.accumulatedDepreciation}
                  </p>
                  <p>
                    <span className="font-medium text-navy-950">Recommended sale:</span> GHS {overview.recommendedSalePrice}
                  </p>
                </div>
              </div>
            </div>

            {!disposalRecord && (disposalPipeline.recommendationState || disposalPipeline.replacementState) ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4 text-sm">
                <p className="mb-2 font-semibold text-amber-950">Disposal / replacement pipeline</p>
                <div className="space-y-1 text-amber-950/80">
                  {disposalPipeline.recommendationState ? (
                    <p>
                      Disposal recommendation: {disposalPipeline.recommendationState}
                      {disposalPipeline.approvalStatus ? ` · ${disposalPipeline.approvalStatus}` : ""}
                    </p>
                  ) : null}
                  {disposalPipeline.recommendedAction ? <p>Action: {disposalPipeline.recommendedAction}</p> : null}
                  {disposalPipeline.reason ? <p>Reason: {disposalPipeline.reason}</p> : null}
                  {disposalPipeline.replacementState ? (
                    <p>
                      Replacement: {disposalPipeline.replacementState}
                      {disposalPipeline.recommendedReplaceDate
                        ? ` · target ${disposalPipeline.recommendedReplaceDate}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {disposalRecord ? (
              <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-4 text-sm">
                <p className="mb-2 font-semibold text-rose-900">Disposal record</p>
                <p>
                  {disposalRecord.method} on {disposalRecord.disposalDate}
                </p>
                <p className="text-rose-900/80">{disposalRecord.reason}</p>
                {disposalRecord.salePrice ? <p>Sale price: GHS {disposalRecord.salePrice}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <OverviewStat label="Maintenance records" value={String(overview.maintenanceCount)} />
              <OverviewStat label="Attached files" value={String(overview.documentCount)} />
              <OverviewStat label="Timeline events" value={String(timeline.length)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-navy-100 bg-white p-3 text-sm">
                <p className="mb-1 font-medium text-navy-950">Latest maintenance</p>
                {overview.latestMaintenance ? (
                  <p className="text-navy-900/75">
                    {overview.latestMaintenance.date} — {overview.latestMaintenance.description}
                  </p>
                ) : (
                  <p className="text-navy-900/60">No maintenance logged yet.</p>
                )}
              </div>
              <div className="rounded-lg border border-navy-100 bg-white p-3 text-sm">
                <p className="mb-1 font-medium text-navy-950">Latest timeline event</p>
                {overview.latestHistory ? (
                  <p className="text-navy-900/75">
                    {overview.latestHistory.date}: {overview.latestHistory.to}
                  </p>
                ) : (
                  <p className="text-navy-900/60">No lifecycle history yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="maintenance">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="pt-6">
            <MaintenanceTimeline
              items={maintenance}
              totalCost={maintenanceSummary.totalCost}
              purchaseCost={maintenanceSummary.purchaseCost}
              isHighCost={maintenanceSummary.isHighCost}
              canUpload={canUploadDocuments}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="pt-6">
            <AssetTimeline items={timeline} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="files">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {files.length === 0 ? (
              <p className="text-sm text-navy-900/70">No files attached yet.</p>
            ) : (
              files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 bg-white p-3 text-sm"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium text-navy-950">
                      <FileText className="h-4 w-4 text-navy-700" />
                      <span>{item.fileName}</span>
                    </p>
                    <p className="text-navy-900/70">
                      {item.type} • {item.createdAt}
                    </p>
                  </div>
                  <DocumentOpenButton fileUrl={item.fileUrl} fileName={item.fileName} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3 text-sm">
      <p className="text-xs text-navy-900/60">{label}</p>
      <p className="font-medium text-navy-950">{value}</p>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-gradient-to-br from-navy-50 to-white p-3 text-center">
      <p className="text-xl font-semibold text-navy-900">{value}</p>
      <p className="text-xs text-navy-900/70">{label}</p>
    </div>
  );
}
