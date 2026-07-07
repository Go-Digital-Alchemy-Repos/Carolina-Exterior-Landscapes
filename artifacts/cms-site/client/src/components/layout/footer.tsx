import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useBranding } from "@/components/shared/branding-provider";
import type { CmsMenu, MenuItem } from "@shared/schema";

type MenuMap = Partial<Record<string, CmsMenu>>;

function menuItems(menu: CmsMenu | undefined): MenuItem[] {
  return Array.isArray(menu?.items) ? (menu.items as MenuItem[]).map((item) => ({ ...item, children: item.children ?? [] })) : [];
}

function FooterLinks({ heading, items }: { heading: string; items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            {item.url.startsWith("http") || item.openInNewTab ? (
              <a href={item.url} target={item.openInNewTab ? "_blank" : undefined} rel="noreferrer" className="hover:text-primary">
                {item.label}
              </a>
            ) : (
              <Link href={item.url} className="hover:text-primary">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { companyName, companyAddress, companyPhoneNumbers, companyGoogleBusinessUrl, footerLogoUrl } = useBranding();
  const label = companyName || "Website";
  const googleBusinessUrl = companyGoogleBusinessUrl?.trim() || "";
  const { data } = useQuery<MenuMap>({
    queryKey: ["/api/cms/menus"],
    staleTime: 5 * 60 * 1000,
  });
  const services = menuItems(data?.footer_platform);
  const areas = menuItems(data?.footer_resources);
  const company = menuItems(data?.footer_company);
  const legal = menuItems(data?.footer_legal);

  return (
    <footer className="border-t bg-muted/30" data-testid="footer">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center text-base font-semibold text-foreground">
            {footerLogoUrl ? (
              <img src={footerLogoUrl} alt={label} className="h-12 w-auto max-w-full" />
            ) : (
              label
            )}
          </Link>
          <p className="mt-3 max-w-sm">
            Lawn care, landscaping, hardscape, mulching, and drainage services for Monroe, Union County, and the greater Charlotte region.
          </p>
          <div className="mt-4 space-y-1">
            {companyAddress ? (
              <p>
                {googleBusinessUrl ? (
                  <a href={googleBusinessUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {companyAddress}
                  </a>
                ) : (
                  companyAddress
                )}
              </p>
            ) : null}
            {googleBusinessUrl ? (
              <p>
                <a href={googleBusinessUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                  Google Business Profile
                </a>
              </p>
            ) : null}
            <p>
              <a href="tel:+17049755867" className="hover:text-primary">
                {companyPhoneNumbers || "(704) 975-5867"}
              </a>
              {" | "}
              <a href="mailto:info@carolinaexteriorlandscapes.com" className="hover:text-primary">
                info@carolinaexteriorlandscapes.com
              </a>
            </p>
            <p>Locally owned, licensed, and insured</p>
            <p>Serving Monroe, Union County, and the Greater Charlotte Area</p>
            <p>Monday - Friday 8:00 AM - 5:00 PM</p>
          </div>
        </div>
        <FooterLinks heading="Services" items={services} />
        <FooterLinks heading="Service Areas" items={areas} />
        <FooterLinks heading="Company" items={company} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} {label}. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            {legal.map((item) => (
              <Link key={item.id} href={item.url} className="hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
