import Link from "next/link";
import { FileText } from "lucide-react";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentOpenButton } from "@/components/documents/document-open-button";
import { DocumentRepository, DocumentRowActions } from "@/components/documents/document-repository";
import { PageHeader } from "@/components/shared/page-header";
import { DOCUMENT_TYPE, ENUM_LABELS } from "@/constants";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { getReferenceDataForSession } from "@/lib/reference-data";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const typeFilter = getOptionalQuery(params, "type");
  const assetFilter = getOptionalQuery(params, "asset");
  const branchFilter = getOptionalQuery(params, "branch");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);

  const validType =
    typeFilter && Object.values(DOCUMENT_TYPE).includes(typeFilter as (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE])
      ? (typeFilter as Prisma.AssetDocumentWhereInput["documentType"])
      : undefined;

  const matchingTypes = q
    ? Object.values(DOCUMENT_TYPE).filter((type) => {
        const label = ENUM_LABELS.documentType[type] ?? type;
        const needle = q.toLowerCase();
        return type.toLowerCase().includes(needle) || label.toLowerCase().includes(needle);
      })
    : [];

  const where: Prisma.AssetDocumentWhereInput = {
    asset: {
      ...assetScope,
      ...(branchFilter ? { branchId: branchFilter } : {}),
      ...(assetFilter ? { id: assetFilter } : {}),
    },
    ...(validType ? { documentType: validType } : {}),
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { fileName: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
            { asset: { ain: { contains: q, mode: "insensitive" } } },
            ...(matchingTypes.length
              ? [{ documentType: { in: matchingTypes as Prisma.EnumDocumentTypeFilter["in"] } }]
              : []),
          ],
        }
      : {}),
  };

  const [docs, totalCount, assets, refs, totalDocuments] = await Promise.all([
    db.assetDocument.findMany({
      where,
      include: { asset: { include: { branch: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.assetDocument.count({ where }),
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 300,
    }),
    getReferenceDataForSession(session),
    db.assetDocument.count({ where: { asset: assetScope } }),
  ]);
  const assetOptions = assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }));

  return (
    <div>
      <PageHeader
        title="Document Repository"
        description="Manage warranties and all asset-linked files with role-based access."
        action={
          <DocumentRepository assets={assetOptions} totalDocuments={totalDocuments} />
        }
      />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar
            searchPlaceholder="Search name, type, or asset"
            filters={<DocumentFilters branches={refs.branches} assets={assetOptions} />}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Artifact</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-purple-700" />
                      <span>{doc.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{ENUM_LABELS.documentType[doc.documentType] ?? doc.documentType}</TableCell>
                  <TableCell>
                    <Link href={`/assets/${doc.assetId}`} prefetch className="font-medium text-[#6D28D9] hover:underline">
                      {doc.asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{doc.asset.branch.name}</TableCell>
                  <TableCell className="text-right">
                    <DocumentOpenButton fileUrl={doc.fileUrl} fileName={doc.displayName} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DocumentRowActions
                      documentId={doc.id}
                      documentType={doc.documentType}
                      displayName={doc.displayName}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
