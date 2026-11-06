"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  MapPin,
  Wrench,
  RefreshCw,
  BarChart3,
  Users,
  Contact,
  Settings,
  BookOpen,
} from "lucide-react";
import { OfflineSyncIndicator } from "@/components/shared/offline-sync-indicator";
import { LogoutButton } from "@/components/shared/logout-button";
import { APP_ROUTES } from "@/constants";
import { NAV_LINKS } from "@/lib/route-permissions";
import { hasPermission, type Role } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const iconMap = {
  Dashboard: LayoutDashboard,
  Assets: Boxes,
  Campaigns: ClipboardCheck,
  Exceptions: AlertTriangle,
  Requests: ClipboardList,
  Documents: FileText,
  Locations: MapPin,
  Maintenance: Wrench,
  Replacement: RefreshCw,
  Reports: BarChart3,
  Staff: Contact,
  Users: Users,
  Settings: Settings,
} as const;

export function AppShell({
  children,
  role,
  showUsageManual = false,
}: {
  children: React.ReactNode;
  role: Role;
  showUsageManual?: boolean;
}) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((link) => hasPermission(role, link.permission));

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-navy-200/70 bg-white/80 backdrop-blur">
        <SidebarHeader className="border-b border-navy-200/70 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <span className="text-lg font-semibold tracking-tight text-navy-900 group-data-[collapsible=icon]:hidden">
              VortAsset
            </span>
            <SidebarTrigger className="cursor-pointer" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((link) => {
                  const Icon = iconMap[link.label as keyof typeof iconMap] ?? Boxes;
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(link.href)}
                        tooltip={link.label}
                        className="cursor-pointer rounded-lg data-[active=true]:bg-navy-100 data-[active=true]:text-navy-900"
                      >
                        <Link href={link.href} prefetch>
                          <Icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-2 overflow-hidden border-t border-navy-200/70 bg-white/70 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-2">
          {showUsageManual ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(APP_ROUTES.USAGE_MANUAL)}
                  tooltip="Usage manual"
                  className="cursor-pointer rounded-lg data-[active=true]:bg-navy-100 data-[active=true]:text-navy-900"
                >
                  <Link href={APP_ROUTES.USAGE_MANUAL}>
                    <BookOpen className="h-4 w-4" />
                    <span>Usage manual</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : null}
          <OfflineSyncIndicator />
          <LogoutButton />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-x-clip text-navy-900">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-navy-200/70 bg-white/85 px-3 backdrop-blur md:hidden">
          <SidebarTrigger className="size-10 cursor-pointer" />
          <span className="text-base font-semibold tracking-tight text-navy-900">VortAsset</span>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-5 sm:py-7">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
