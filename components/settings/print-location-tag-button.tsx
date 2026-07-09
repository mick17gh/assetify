import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintLocationTagButton({ id, type }: { id: string; type: "branch" | "room" | "shelf" }) {
  return (
    <Button variant="outline" size="sm" asChild className="h-8 cursor-pointer border-purple-200">
      <Link href={`/api/locations/tag?type=${type}&id=${id}`} target="_blank" rel="noreferrer">
        <QrCode className="mr-1 h-3.5 w-3.5" />
        Print QR
      </Link>
    </Button>
  );
}
