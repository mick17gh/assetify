import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function KpiCard({ title, value, hint, href }: { title: string; value: string; hint: string; href?: string }) {
  const content = (
    <Card className="border-purple-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-purple-900/70">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-[#6D28D9]">{value}</p>
        <p className="mt-1 text-xs text-purple-900/70">{hint}</p>
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
