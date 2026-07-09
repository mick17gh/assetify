"use client";

import { useState } from "react";
import { uploadDocumentFromRepositoryAction, updateDocumentTypeAction, deleteDocumentFromRepositoryAction } from "@/app/(dashboard)/documents/actions";
import { SetupRowActions } from "@/components/settings/setup-row-actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceOption, ReferenceSelect } from "@/components/shared/reference-selects";
import { SetupCreateModal } from "@/components/settings/setup-create-modal";
import { DOCUMENT_TYPE } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentRepository({
  assets,
  totalDocuments,
}: {
  assets: ReferenceOption[];
  totalDocuments: number;
}) {
  return (
    <SetupCreateModal
      title="Upload asset document"
      triggerLabel="Upload Document"
      action={uploadDocumentFromRepositoryAction}
    >
      <ReferenceSelect name="assetId" label="Asset" options={assets} required />
      <EnumSelect
        name="documentType"
        label="Document type"
        labelKey="documentType"
        values={DOCUMENT_TYPE}
        defaultValue={DOCUMENT_TYPE.OTHER}
        required
      />
      <div className="space-y-1">
        <Label htmlFor="document">Document</Label>
        <Input id="document" name="document" type="file" required />
      </div>
      <Card className="border-purple-100 bg-purple-50/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-purple-950">Repository summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-purple-900/70">
          {totalDocuments.toLocaleString()} document{totalDocuments === 1 ? "" : "s"} currently stored.
        </CardContent>
      </Card>
    </SetupCreateModal>
  );
}

export function DocumentRowActions({
  documentId,
  documentType,
}: {
  documentId: string;
  documentType: string;
}) {
  const [value, setValue] = useState(documentType);

  return (
    <SetupRowActions
      recordId={documentId}
      editTitle="Update document type"
      updateAction={updateDocumentTypeAction}
      deleteAction={deleteDocumentFromRepositoryAction}
      editFields={
        <EnumSelect
          name="documentType"
          label="Document type"
          labelKey="documentType"
          values={DOCUMENT_TYPE}
          value={value}
          onValueChange={setValue}
          required
        />
      }
    />
  );
}
