"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  FileText,
  MapPin,
  Wrench,
  RefreshCw,
  BarChart3,
  Users,
  Contact,
  Settings,
} from "lucide-react";
import { OfflineSyncIndicator } from "@/components/shared/offline-sync-indicator";
import { LogoutButton } from "@/components/shared/logout-button";
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

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((link) => hasPermission(role, link.permission));

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-purple-200/70 bg-white/80 backdrop-blur">
        <SidebarHeader className="border-b border-purple-200/70">
          <div className="flex items-center justify-between px-2">
            <span className="text-lg font-semibold tracking-tight text-[#6D28D9]">Assetify</span>
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
                        className="cursor-pointer rounded-lg data-[active=true]:bg-purple-100 data-[active=true]:text-purple-900"
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
        <SidebarFooter className="gap-3 border-t border-purple-200/70 bg-white/70 p-3">
          <OfflineSyncIndicator />
          <LogoutButton />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="text-[#3B1E63]">
        <main className="mx-auto w-full max-w-7xl px-5 py-7">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
