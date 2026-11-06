import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintAssetTagButton({ assetId }: { assetId: string }) {
  return (
    <Button variant="outline" asChild className="cursor-pointer border-navy-200">
      <Link href={`/api/assets/tag?assetId=${assetId}`} target="_blank" rel="noreferrer">
        <Printer className="mr-2 h-4 w-4" />
        Print tag
      </Link>
    </Button>
  );
}
