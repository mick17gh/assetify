import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintAssetTagButton } from "@/components/assets/print-asset-tag-button";

type AssetRow = {
  id: string;
  ain: string;
  name: string;
  serialNumber: string;
  status: string;
  branch: string;
  custodian: string;
};

export function AssetTable({
  assets,
  toolbar,
  pagination,
  qrEnabled = false,
}: {
  assets: AssetRow[];
  toolbar?: React.ReactNode;
  pagination?: React.ReactNode;
  qrEnabled?: boolean;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        {toolbar}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>AIN</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Custodian</TableHead>
              {qrEnabled ? <TableHead className="text-right">Tag</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <Link href={`/assets/${asset.id}`} className="font-medium text-[#6D28D9] hover:underline">
                    {asset.ain}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/assets/${asset.id}`} className="hover:underline">
                    {asset.name}
                  </Link>
                </TableCell>
                <TableCell>{asset.serialNumber}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{asset.status}</Badge>
                </TableCell>
                <TableCell>{asset.branch}</TableCell>
                <TableCell>{asset.custodian}</TableCell>
                {qrEnabled ? (
                  <TableCell className="text-right">
                    <PrintAssetTagButton assetId={asset.id} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination}
      </CardContent>
    </Card>
  );
}
