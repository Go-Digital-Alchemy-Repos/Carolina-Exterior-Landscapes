import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Palette,
  PanelRight,
  SearchIcon,
  Settings,
  SquarePen,
  Type,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import adminSymbol from "@/features/landscape-site/assets/symbol.svg";
import type { AdminPermission } from "@shared/types";
import type { User as AppUser } from "@shared/schema";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

function buildNavGroups(
  user: AppUser | null,
  hasAdminPermission: (permission: AdminPermission) => boolean,
): NavGroup[] {
  const groups: NavGroup[] = [];

  if (user?.role === "admin") {
    groups.push({
      items: [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard, iconColor: "text-teal-600" },
      ],
    });
  }

  if (hasAdminPermission("content")) {
    groups.push({
      label: "Content",
      items: [
        { title: "CMS Overview", href: "/admin/cms", icon: Globe, iconColor: "text-violet-600" },
        { title: "Pages", href: "/admin/cms/pages", icon: FileCode, iconColor: "text-violet-500" },
        { title: "Forms", href: "/admin/forms", icon: SquarePen, iconColor: "text-violet-500" },
        { title: "Media", href: "/admin/cms/media", icon: Image, iconColor: "text-violet-400" },
        { title: "Sections", href: "/admin/cms/sections", icon: Blocks, iconColor: "text-violet-400" },
        { title: "SEO", href: "/admin/cms/seo", icon: SearchIcon, iconColor: "text-violet-400" },
      ],
    });
  }

  if (hasAdminPermission("design")) {
    groups.push({
      label: "Design",
      items: [
        { title: "Branding", href: "/admin/design/branding", icon: Image, iconColor: "text-pink-500" },
        { title: "Color Palette", href: "/admin/design/colors", icon: Palette, iconColor: "text-rose-500" },
        { title: "Typography", href: "/admin/design/typography", icon: Type, iconColor: "text-sky-600" },
        { title: "Menus", href: "/admin/cms/menus", icon: MenuIcon, iconColor: "text-violet-500" },
        { title: "Sidebars & Widgets", href: "/admin/cms/sidebars", icon: PanelRight, iconColor: "text-emerald-500" },
      ],
    });
  }

  if (user?.role === "admin") {
    groups.push({
      label: "System",
      items: [
        { title: "Documentation", href: "/admin/docs", icon: FileText, iconColor: "text-indigo-600" },
        { title: "System Backups", href: "/admin/system/backups", icon: Database, iconColor: "text-cyan-600" },
        { title: "System Users", href: "/admin/users", icon: Users, iconColor: "text-blue-600" },
        { title: "Settings", href: "/admin/settings", icon: Settings, iconColor: "text-slate-500" },
      ],
    });
  }

  return groups;
}

export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logout, hasAdminPermission } = useAuth();
  const navGroups = buildNavGroups(user, hasAdminPermission);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-muted/20 md:flex">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r bg-background transition-all md:flex md:flex-col",
          collapsed ? "w-16" : "w-72",
        )}
        data-testid="admin-sidebar"
      >
        <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center gap-1 px-2" : "justify-between px-4")}>
          <div className="flex min-w-0 items-center gap-3">
            <img src={adminSymbol} alt="" aria-hidden="true" className={cn("shrink-0", collapsed ? "h-7 w-7" : "h-9 w-9")} />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="font-semibold leading-none">Admin</p>
                <p className="mt-1 text-xs text-muted-foreground">Website CMS</p>
              </div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            data-testid="button-collapse-sidebar"
            className={cn(collapsed && "h-7 w-7 shrink-0")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label ?? groupIndex}>
              {group.label && !collapsed ? (
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href || location.startsWith(`${item.href}/`);
                  const link = (
                    <Link href={item.href}>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
                        data-testid={`link-admin-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        <Icon className={cn("h-4 w-4", item.iconColor)} />
                        {!collapsed ? <span>{item.title}</span> : null}
                      </Button>
                    </Link>
                  );

                  return collapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={item.href}>{link}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <Separator />
        <div className="p-3">
          {!collapsed && user ? (
            <div className="mb-3 rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</p>
              <Badge variant="secondary" className="mt-2 capitalize">{user.role}</Badge>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
            onClick={() => logout.mutate()}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {!collapsed ? <span>Logout</span> : null}
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      </div>
    </TooltipProvider>
  );
}
