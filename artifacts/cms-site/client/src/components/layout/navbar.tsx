import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { useBranding } from "@/components/shared/branding-provider";
import { Button } from "@/components/ui/button";
import type { CmsMenu, MenuItem } from "@shared/schema";

type MenuMap = Partial<Record<string, CmsMenu>>;

function menuItems(menu: CmsMenu | undefined): MenuItem[] {
  return Array.isArray(menu?.items) ? (menu.items as MenuItem[]).map((item) => ({ ...item, children: item.children ?? [] })) : [];
}

function NavLink({ item, onClick, className }: { item: MenuItem; onClick?: () => void; className?: string }) {
  if (item.url.startsWith("http") || item.openInNewTab) {
    return (
      <a href={item.url} target={item.openInNewTab ? "_blank" : undefined} rel="noreferrer" onClick={onClick} className={className}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.url} onClick={onClick} className={className}>
      {item.label}
    </Link>
  );
}

export function Navbar() {
  const { companyName, frontendLogoUrl } = useBranding();
  const label = companyName || "Website";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useQuery<MenuMap>({
    queryKey: ["/api/cms/menus"],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const items = menuItems(data?.main_navigation);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur" data-testid="navbar">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-3" data-testid="link-brand">
          {frontendLogoUrl ? (
            <img src={frontendLogoUrl} alt={label} width={471} height={126} className="h-[2.86rem] w-auto" />
          ) : (
            <span className="text-base font-semibold tracking-normal text-foreground sm:text-lg">{label}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <div className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                <NavLink item={item} />
                {item.children.length > 0 ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              </div>
              {item.children.length > 0 ? (
                <div className="invisible absolute left-0 top-full min-w-64 translate-y-2 rounded-md border bg-background p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) => (
                    <div key={child.id} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                      <NavLink item={child} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="tel:+17049755867">
              <Phone className="mr-2 h-4 w-4" />
              (704) 975-5867
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href="/get-a-quote/">Request an Estimate</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overflow-x-hidden overscroll-contain border-t bg-background px-4 py-4 lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 overflow-x-hidden" aria-label="Mobile navigation">
            {items.map((item) => (
              <div key={item.id} className="min-w-0 space-y-1">
                <div className="min-w-0 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  <NavLink item={item} onClick={() => setMobileOpen(false)} className="block min-w-0 max-w-full break-words" />
                </div>
                {item.children.map((child) => (
                  <div key={child.id} className="min-w-0 rounded-md px-6 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <NavLink item={child} onClick={() => setMobileOpen(false)} className="block min-w-0 max-w-full break-words" />
                  </div>
                ))}
              </div>
            ))}
            <div className="grid min-w-0 gap-2 pt-3">
              <Button variant="outline" className="w-full min-w-0" asChild>
                <a href="tel:+17049755867" onClick={() => setMobileOpen(false)}>
                  <Phone className="mr-2 h-4 w-4" />
                  (704) 975-5867
                </a>
              </Button>
              <Button className="w-full min-w-0" asChild>
                <Link href="/get-a-quote/" onClick={() => setMobileOpen(false)}>
                  Request an Estimate
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
