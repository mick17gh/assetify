import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function KpiCard({ title, value, hint, href }: { title: string; value: string; hint: string; href?: string }) {
  const content = (
    <Card className="h-full min-w-0 border-navy-200 bg-white/90 shadow-sm">
      <CardHeader className="px-4 pb-2 sm:px-6">
        <CardTitle className="text-sm font-medium text-navy-900/70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <p className="break-words text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs text-pretty text-navy-900/70">{hint}</p>
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block min-w-0 transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
