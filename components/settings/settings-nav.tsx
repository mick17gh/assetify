"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const links = [
  { href: APP_ROUTES.SETTINGS_ORGANIZATION, label: "Organization" },
  { href: APP_ROUTES.SETTINGS_BRANCHES, label: "Branches" },
  { href: APP_ROUTES.SETTINGS_CATEGORIES, label: "Categories" },
  { href: APP_ROUTES.SETTINGS_VENDORS, label: "Vendors" },
  { href: APP_ROUTES.SETTINGS_LOCATIONS, label: "Locations" },
  { href: APP_ROUTES.SETTINGS_FEATURES, label: "Features" },
  { href: APP_ROUTES.SETTINGS_POLICIES, label: "Policies" },
  { href: APP_ROUTES.SETTINGS_DEPRECIATION, label: "Depreciation" },
  { href: APP_ROUTES.SETTINGS_REMINDERS, label: "Reminders" },
  { href: APP_ROUTES.SETTINGS_AUDIT, label: "Audit" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-purple-100 pb-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch
          className={cn(
            "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "bg-purple-100 text-purple-900"
              : "text-purple-800/70 hover:bg-purple-50 hover:text-purple-900",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
