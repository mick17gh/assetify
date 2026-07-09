import Link from "next/link";
import { FileText } from "lucide-react";
import { DocumentOpenButton } from "@/components/documents/document-open-button";
import { DocumentRepository, DocumentRowActions } from "@/components/documents/document-repository";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getAssetScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const assetScope = getAssetScopeWhere(session);
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);

  const where: Prisma.AssetDocumentWhereInput = {
    asset: assetScope,
    ...(q ? { fileName: { contains: q, mode: "insensitive" } } : {}),
  };

  const [docs, assets, totalDocuments] = await Promise.all([
    db.assetDocument.findMany({
      where,
      include: { asset: { include: { branch: true } } },
      orderBy: { createdAt: "desc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    }),
    db.asset.findMany({
      where: assetScope,
      orderBy: { name: "asc" },
      select: { id: true, name: true, ain: true },
      take: 300,
    }),
    db.assetDocument.count({ where: { asset: assetScope } }),
  ]);
  const nextCursor = getNextCursor(docs, limit);
  const pageItems = docs.slice(0, limit);

  return (
    <div>
      <PageHeader
        title="Document Repository"
        description="Manage warranties and all asset-linked files with role-based access."
        action={
          <DocumentRepository
            assets={assets.map((asset) => ({ id: asset.id, label: `${asset.name} (${asset.ain})` }))}
            totalDocuments={totalDocuments}
          />
        }
      />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search file name" defaultLimit={limit} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-700" />
                      <span>{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.documentType}</TableCell>
                  <TableCell>
                    <Link href={`/assets/${doc.assetId}`} className="font-medium text-[#6D28D9] hover:underline">
                      {doc.asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{doc.asset.branch.name}</TableCell>
                  <TableCell className="text-right">
                    <DocumentOpenButton fileUrl={doc.fileUrl} fileName={doc.fileName} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DocumentRowActions documentId={doc.id} documentType={doc.documentType} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />
        </CardContent>
      </Card>
    </div>
  );
}
