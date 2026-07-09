import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentOpenButton({
  fileUrl,
  fileName,
  className,
}: {
  fileUrl: string;
  fileName: string;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={`cursor-pointer border-purple-200 hover:bg-purple-50 ${className ?? ""}`}
    >
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${fileName}`}>
        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
        Open
      </a>
    </Button>
  );
}
