import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BRAND, RESIDENTIAL_SERVICES, COMMERCIAL_SERVICES } from "@/features/landscape-site/content/site";
import headerLogoHorizontal from "@/features/landscape-site/assets/header-logo-horizontal.svg";
import footerLogoHorizontal from "@/features/landscape-site/assets/footer-logo-horizontal.svg";
import digitalAlchemyLogo from "@/features/landscape-site/assets/da-logo.svg";
import { Phone, Menu, X, ArrowRight, MapPin, Mail, ChevronDown, Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BotanicalAccent } from "./nature/BotanicalAccent";
import { useBranding } from "@/components/shared/branding-provider";
import type { CmsMenu, MenuItem } from "@shared/schema";

type PublicMenuMap = Partial<Record<string, CmsMenu>>;

function menuItem(id: string, label: string, url: string, children: MenuItem[] = []): MenuItem {
  return { id, label, url, openInNewTab: false, children };
}

const FALLBACK_RESIDENTIAL_ITEMS = [
  ...RESIDENTIAL_SERVICES.map((service) => menuItem(service.slug, service.name, `/${service.slug}`)),
  menuItem("gallery", "View Gallery", "/gallery"),
];

const FALLBACK_COMMERCIAL_ITEMS = [
  menuItem("commercial", "Commercial Hub", "/commercial"),
  ...COMMERCIAL_SERVICES.map((service) => menuItem(service.slug, service.name, `/${service.slug}`)),
  menuItem("commercial-portfolio", "View Portfolio", "/commercial-portfolio"),
];

const FALLBACK_FOOTER_COMMERCIAL_ITEMS = FALLBACK_COMMERCIAL_ITEMS.filter((item) => item.id !== "commercial-portfolio");

const FALLBACK_FOOTER_LINKS = [
  menuItem("about", "About Us", "/about"),
  menuItem("service-areas", "Service Areas", "/service-areas"),
  menuItem("blog", "Blog", "/blog"),
];

const FALLBACK_MAIN_NAVIGATION = [
  menuItem("home", "Home", "/"),
  menuItem("residential", "Residential", "/residential-landscaping", FALLBACK_RESIDENTIAL_ITEMS),
  menuItem("commercial", "Commercial", "/commercial", FALLBACK_COMMERCIAL_ITEMS),
  menuItem("gallery", "Gallery", "/gallery"),
  menuItem("service-areas", "Service Areas", "/service-areas"),
  menuItem("about", "About", "/about"),
  menuItem("blog", "Blog", "/blog"),
];

function menuItems(menu: CmsMenu | undefined, fallback: MenuItem[] = []): MenuItem[] {
  if (!Array.isArray(menu?.items) || menu.items.length === 0) return fallback;
  return (menu.items as MenuItem[]).map((item) => ({ ...item, children: item.children ?? [] }));
}

function MenuLink({ item, className, onClick }: { item: MenuItem; className?: string; onClick?: () => void }) {
  if (item.openInNewTab || /^https?:\/\//i.test(item.url)) {
    return (
      <a href={item.url} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab ? "noopener noreferrer" : undefined} className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return <Link href={item.url} className={className} onClick={onClick}>{item.label}</Link>;
}

function FooterMenuColumn({ title, items, className }: { title: string; items: MenuItem[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <h4 className="font-extrabold text-xl mb-6 text-white">{title}</h4>
      <ul className="space-y-4 text-sm font-medium text-background/70">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center gap-3 group text-base">
              <ArrowRight className="h-4 w-4 text-primary opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              <MenuLink
                item={item}
                className={`hover:text-primary transition-colors ${item.id === "commercial" ? "text-white font-bold" : ""} ${item.id === "gallery" ? "text-primary font-bold hover:text-primary/80" : ""}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<string | null>(null);
  const [location] = useLocation();
  const { frontendLogoUrl, footerLogoUrl, companyName } = useBranding();
  const headerLogo = frontendLogoUrl || headerLogoHorizontal;
  const footerLogo = footerLogoUrl || footerLogoHorizontal;
  const logoAlt = companyName || BRAND.name;
  const { data: publicMenus } = useQuery<PublicMenuMap>({
    queryKey: ["/api/cms/menus"],
    staleTime: 60_000,
  });
  const mainNavigation = menuItems(publicMenus?.main_navigation, FALLBACK_MAIN_NAVIGATION);
  const footerResidential = menuItems(publicMenus?.footer_platform, FALLBACK_RESIDENTIAL_ITEMS);
  const footerCommercial = menuItems(publicMenus?.footer_secondary, FALLBACK_FOOTER_COMMERCIAL_ITEMS);
  const footerLinks = menuItems(publicMenus?.footer_legal, FALLBACK_FOOTER_LINKS);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(null);
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="landscape-site min-h-screen flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2.5 px-4 hidden md:block text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-foreground/70" />
              Serving {BRAND.region}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-foreground/70" />
              <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">{BRAND.email}</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-primary-foreground/90"><Leaf className="h-4 w-4" /> {BRAND.founded}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm py-3 border-border/50" : "bg-background py-5 border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center group z-50">
            <img src={headerLogo} alt={logoAlt} width={471} height={126} fetchPriority="high" decoding="async" className="h-[3.75rem] md:h-12 w-auto group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-sm text-foreground/80">
            {mainNavigation.map((item) => {
              if (item.children.length === 0) {
                return <MenuLink key={item.id} item={item} className="hover:text-primary transition-colors" />;
              }

              const menuId = `desktop-menu-${item.id.replace(/[^a-z0-9_-]/gi, "-")}`;
              return (
                <div
                  key={item.id}
                  className="relative group"
                  onMouseEnter={() => setDesktopMenuOpen(item.id)}
                  onMouseLeave={() => setDesktopMenuOpen(null)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setDesktopMenuOpen(null);
                  }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-primary transition-colors py-2"
                    aria-haspopup="true"
                    aria-expanded={desktopMenuOpen === item.id}
                    aria-controls={menuId}
                    onClick={() => setDesktopMenuOpen(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setDesktopMenuOpen(null);
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setDesktopMenuOpen(item.id);
                      }
                    }}
                  >
                    {item.label} <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                  <div id={menuId} className={`absolute top-full left-0 w-72 bg-background border border-border/60 shadow-xl rounded-xl transition-all duration-200 overflow-hidden ${desktopMenuOpen === item.id ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"}`}>
                    <div className="p-3 flex flex-col gap-1">
                      {item.children.map((child) => (
                        <div key={child.id} className="group/link flex items-center rounded-lg hover:bg-muted/50">
                          <MenuLink item={child} className={`flex-1 p-3 text-sm transition-colors ${child.id === "commercial" ? "font-extrabold" : ""}`} />
                          <ArrowRight className="mr-3 h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-2 font-extrabold text-foreground hover:text-primary transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              {BRAND.phoneDisplay}
            </a>
            <Button asChild className="font-extrabold tracking-wide rounded-full px-6 h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
              <Link href="/get-a-quote">
                GET A QUOTE
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            type="button"
            className="lg:hidden p-2 text-foreground z-50 relative bg-muted/50 rounded-full"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen ? <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Site navigation" className="fixed inset-0 bg-background z-40 pt-28 px-6 overflow-y-auto">
          <div className="flex flex-col gap-6 font-extrabold text-2xl pb-20">
            {mainNavigation.map((item) => {
              if (item.children.length === 0) {
                return (
                  <MenuLink
                    key={item.id}
                    item={item}
                    className="hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                );
              }

              return (
                <div key={item.id} className="contents">
                  <div className="h-px bg-border/50 my-2" />
                  <span className="text-primary text-sm tracking-widest uppercase">{item.label}</span>
                  <div className="flex flex-col gap-5 text-xl text-foreground/80 font-bold ml-4">
                    {item.children.map((child) => (
                      <MenuLink key={child.id} item={child} className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)} />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="mt-8 flex flex-col gap-4">
              <a href={`tel:${BRAND.phoneTel}`} className="flex items-center justify-center gap-3 font-extrabold text-foreground bg-muted p-5 rounded-2xl">
                <Phone className="h-6 w-6 text-primary" />
                {BRAND.phoneDisplay}
              </a>
              <Button asChild size="lg" className="w-full text-lg h-16 rounded-2xl shadow-xl shadow-primary/20">
                <Link href="/get-a-quote">GET A QUOTE</Link>
              </Button>
            </div>
          </div>
        </div> : null}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full flex flex-col relative z-10" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background pt-24 pb-12 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-2 bottom-8 h-64 w-auto text-primary/10" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            <div className="lg:col-span-4 space-y-8">
              <img src={footerLogo} alt={logoAlt} width={486} height={135} loading="lazy" decoding="async" className="h-16 w-auto max-w-full" />
              <p className="text-background/70 text-base leading-relaxed font-medium max-w-sm">
                {BRAND.tagline} {BRAND.subTagline}.<br/>
                We are proud to serve {BRAND.county} and the {BRAND.region} with premium landscaping and lawn care services.
              </p>
              <div className="space-y-4 font-bold text-sm">
                <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Phone className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.phoneDisplay}</span>
                </a>
                <a href={`mailto:${BRAND.email}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Mail className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.email}</span>
                </a>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background"><MapPin className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.city}, {BRAND.state}</span>
                </div>
              </div>
            </div>

            <FooterMenuColumn title="Residential" items={footerResidential} className="lg:col-span-3 lg:col-start-6" />
            <div className="lg:col-span-4 lg:col-start-9">
              <FooterMenuColumn title="Commercial" items={footerCommercial} className="" />
              
              <div className="mt-10">
                <Button asChild variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white hover:text-foreground h-12 rounded-full font-bold tracking-wide">
                  <Link href="/get-a-quote">
                    REQUEST A QUOTE
                  </Link>
                </Button>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-background/50">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <span className="flex items-center gap-2"><Leaf className="h-3 w-3" /> {BRAND.founded}</span>
              {footerLinks.map((item) => (
                <MenuLink key={item.id} item={item} className="hover:text-white transition-colors" />
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center md:justify-end">
            <a
              href="https://godigitalalchemy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-background/40 hover:text-background/70 transition-colors"
            >
              <span className="text-xs font-medium tracking-wide">Site by</span>
              <img src={digitalAlchemyLogo} alt="Digital Alchemy" width={124} height={22} loading="lazy" decoding="async" className="h-4 w-auto" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
