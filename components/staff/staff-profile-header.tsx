import Link from "next/link";
import {
  Briefcase,
  Building2,
  ClipboardCheck,
  Hash,
  Mail,
  MapPin,
  Package,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "ok";
  href?: string;
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-200 bg-amber-50/80"
      : tone === "ok"
        ? "border-emerald-200 bg-emerald-50/70"
        : "border-navy-100 bg-white";

  const content = (
    <div className={cn("rounded-xl border p-3.5 transition-colors duration-200", toneClass, href && "hover:border-navy-300")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-navy-900/60">{label}</p>
        <Icon className="h-3.5 w-3.5 text-navy-700/70" />
      </div>
      <p className="text-2xl font-semibold tracking-tight text-navy-950">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch className="cursor-pointer">
        {content}
      </Link>
    );
  }
  return content;
}

export function StaffProfileHeader({
  name,
  email,
  roleLabel,
  isActive,
  branch,
  department,
  title,
  employeeCode,
  allocatedCount,
  pendingAckCount,
  movementCount,
}: {
  name: string;
  email: string;
  roleLabel: string;
  isActive: boolean;
  branch: string;
  department: string;
  title: string;
  employeeCode: string;
  allocatedCount: number;
  pendingAckCount: number;
  movementCount: number;
}) {
  return (
    <Card className="overflow-hidden border-navy-200 shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-navy-800 via-navy-600 to-sky-500" />
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-600 text-lg font-semibold tracking-wide text-white shadow-sm"
              aria-hidden
            >
              {initials(name)}
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
                  {name}
                </h2>
                <Badge
                  className={cn(
                    "hover:bg-inherit",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-navy-900/70">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-navy-900/65">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {branch}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {department !== "—" ? department : "No department"}
                </span>
                {title !== "—" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {title}
                  </span>
                ) : null}
                {employeeCode !== "—" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    {employeeCode}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Allocated assets" value={allocatedCount} icon={Package} tone="ok" />
          <Stat
            label="Pending acknowledgements"
            value={pendingAckCount}
            icon={ClipboardCheck}
            tone={pendingAckCount > 0 ? "warn" : "default"}
            href={pendingAckCount > 0 ? APP_ROUTES.ACKNOWLEDGEMENTS : undefined}
          />
          <Stat label="Recent movements" value={movementCount} icon={ArrowRightLeft} />
        </div>
      </CardContent>
    </Card>
  );
}
