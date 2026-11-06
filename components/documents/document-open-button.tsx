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
      className={`cursor-pointer border-navy-200 hover:bg-navy-50 ${className ?? ""}`}
    >
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open artifact ${fileName}`}>
        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
        Artifact
      </a>
    </Button>
  );
}
