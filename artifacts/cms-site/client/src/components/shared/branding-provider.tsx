import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DEFAULT_BRANDING_SETTINGS,
  fontFamilyForBrandingOption,
  hexToHslToken,
  type BrandingSettings,
} from "@/lib/branding";

const BrandingContext = createContext<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);

const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  inter: "Inter:opsz,wght@14..32,100..900",
  roboto: "Roboto:wght@300;400;500;700;900",
  "open-sans": "Open+Sans:wght@300;400;500;600;700;800",
  lato: "Lato:wght@300;400;700;900",
  manrope: "Manrope:wght@200..800",
  montserrat: "Montserrat:wght@300;400;500;600;700;800",
  poppins: "Poppins:wght@300;400;500;600;700;800",
  "source-sans-3": "Source+Sans+3:wght@300;400;500;600;700;800",
  "nunito-sans": "Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000",
  "work-sans": "Work+Sans:wght@300;400;500;600;700;800",
  raleway: "Raleway:wght@300;400;500;600;700;800",
  merriweather: "Merriweather:wght@300;400;700;900",
  "playfair-display": "Playfair+Display:wght@400;500;600;700;800",
  lora: "Lora:ital,wght@0,400..700;1,400..700",
  "libre-baskerville": "Libre+Baskerville:wght@400;700",
  "cormorant-garamond": "Cormorant+Garamond:wght@300;400;500;600;700",
  "eb-garamond": "EB+Garamond:ital,wght@0,400..800;1,400..800",
  "crimson-text": "Crimson+Text:wght@400;600;700",
  "pt-serif": "PT+Serif:wght@400;700",
  bitter: "Bitter:wght@300..900",
  "source-serif-4": "Source+Serif+4:opsz,wght@8..60,300..900",
};

function googleFontsUrl(fontValues: Array<string | null | undefined>) {
  const families = Array.from(
    new Set(
      fontValues
        .map((value) => (value ? GOOGLE_FONT_FAMILIES[value] : null))
        .filter(Boolean) as string[],
    ),
  );

  if (!families.length) return "";
  const params = families.map((family) => `family=${family}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function syncGoogleFontStylesheet(fontValues: Array<string | null | undefined>) {
  const href = googleFontsUrl(fontValues);
  const id = "active-brand-google-fonts";
  let link = document.head.querySelector<HTMLLinkElement>(`#${id}`);

  if (!href) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (link.href !== href) {
    link.href = href;
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data } = useQuery<BrandingSettings>({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const response = await fetch("/api/branding");
      if (!response.ok) {
        return DEFAULT_BRANDING_SETTINGS;
      }
      const payload = await response.json();
      return {
        frontendLogoUrl: payload?.frontendLogoUrl ?? null,
        footerLogoUrl: payload?.footerLogoUrl ?? null,
        faviconUrl: payload?.faviconUrl ?? null,
        companyName: payload?.companyName ?? null,
        companyAddress: payload?.companyAddress ?? null,
        companyPhoneNumbers: payload?.companyPhoneNumbers ?? null,
        companyGoogleBusinessUrl: payload?.companyGoogleBusinessUrl ?? null,
        bodyFont: payload?.bodyFont ?? null,
        headingFont: payload?.headingFont ?? null,
        primaryColor: payload?.primaryColor ?? null,
        secondaryColor: payload?.secondaryColor ?? null,
        tertiaryColor: payload?.tertiaryColor ?? null,
        quaternaryColor: payload?.quaternaryColor ?? "#406A87",
        h1Color: payload?.h1Color ?? null,
        h2Color: payload?.h2Color ?? null,
        h3ToH6Color: payload?.h3ToH6Color ?? null,
        bodyTextColor: payload?.bodyTextColor ?? null,
        headingSubtextColor: payload?.headingSubtextColor ?? null,
        supportingCopyColor: payload?.supportingCopyColor ?? null,
        helperTextColor: payload?.helperTextColor ?? null,
        metaTextColor: payload?.metaTextColor ?? null,
        linkColor: payload?.linkColor ?? null,
        linkHoverColor: payload?.linkHoverColor ?? null,
        inverseTextColor: payload?.inverseTextColor ?? null,
        primaryTextColor: payload?.primaryTextColor ?? null,
        secondaryTextColor: payload?.secondaryTextColor ?? null,
        tertiaryTextColor: payload?.tertiaryTextColor ?? null,
      } satisfies BrandingSettings;
    },
    staleTime: 60_000,
  });

  const branding = useMemo(
    () => data ?? DEFAULT_BRANDING_SETTINGS,
    [data]
  );
  const pathname = location.split(/[?#]/)[0] || "/";
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      syncGoogleFontStylesheet(["inter"]);
      return;
    }

    syncGoogleFontStylesheet([
      branding.bodyFont || "nunito-sans",
      branding.headingFont || "eb-garamond",
    ]);
  }, [branding.bodyFont, branding.headingFont, isAdminRoute]);

  useEffect(() => {
    const root = document.documentElement;
    const bodyFontFamily = fontFamilyForBrandingOption(branding.bodyFont);
    const headingFontFamily = fontFamilyForBrandingOption(branding.headingFont);
    const primaryColor = hexToHslToken(branding.primaryColor);
    const secondaryColor = hexToHslToken(branding.secondaryColor);
    const tertiaryColor = hexToHslToken(branding.tertiaryColor);
    const quaternaryColor = hexToHslToken(branding.quaternaryColor);
    const h1Color = hexToHslToken(branding.h1Color);
    const h2Color = hexToHslToken(branding.h2Color);
    const h3ToH6Color = hexToHslToken(branding.h3ToH6Color);
    const bodyTextColor = hexToHslToken(branding.bodyTextColor);
    const headingSubtextColor = hexToHslToken(branding.headingSubtextColor);
    const supportingCopyColor = hexToHslToken(branding.supportingCopyColor);
    const helperTextColor = hexToHslToken(branding.helperTextColor);
    const metaTextColor = hexToHslToken(branding.metaTextColor);
    const linkColor = hexToHslToken(branding.linkColor);
    const linkHoverColor = hexToHslToken(branding.linkHoverColor);
    const inverseTextColor = hexToHslToken(branding.inverseTextColor);
    const primaryTextColor = hexToHslToken(branding.primaryTextColor);
    const secondaryTextColor = hexToHslToken(branding.secondaryTextColor);
    const tertiaryTextColor = hexToHslToken(branding.tertiaryTextColor);
    const frame = window.requestAnimationFrame(() => {
      if (isAdminRoute) {
        root.style.removeProperty("--font-sans");
        root.style.removeProperty("--font-serif");
        root.style.removeProperty("--public-brand-primary");
        root.style.removeProperty("--public-brand-secondary");
        root.style.removeProperty("--public-brand-tertiary");
        root.style.removeProperty("--public-brand-quaternary");
        root.style.removeProperty("--primary");
        root.style.removeProperty("--secondary");
        root.style.removeProperty("--accent");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--quaternary");
        root.style.removeProperty("--foreground");
        root.style.removeProperty("--card-foreground");
        root.style.removeProperty("--popover-foreground");
        root.style.removeProperty("--muted-foreground");
        root.style.removeProperty("--public-text-h1");
        root.style.removeProperty("--public-text-h2");
        root.style.removeProperty("--public-text-h3");
        root.style.removeProperty("--public-text-body");
        root.style.removeProperty("--public-text-heading-subtext");
        root.style.removeProperty("--public-text-supporting-copy");
        root.style.removeProperty("--public-text-helper");
        root.style.removeProperty("--public-text-meta");
        root.style.removeProperty("--public-text-link");
        root.style.removeProperty("--public-text-link-hover");
        root.style.removeProperty("--public-text-inverse");
        root.style.removeProperty("--public-primary-foreground");
        root.style.removeProperty("--public-secondary-foreground");
        root.style.removeProperty("--public-tertiary-foreground");
        root.style.removeProperty("--primary-foreground");
        root.style.removeProperty("--secondary-foreground");
        root.style.removeProperty("--accent-foreground");
        return;
      }

      if (bodyFontFamily) {
        root.style.setProperty("--font-sans", bodyFontFamily);
      } else {
        root.style.removeProperty("--font-sans");
      }

      if (headingFontFamily) {
        root.style.setProperty("--font-serif", headingFontFamily);
      } else {
        root.style.removeProperty("--font-serif");
      }

      if (primaryColor) {
        root.style.setProperty("--public-brand-primary", primaryColor);
        root.style.setProperty("--primary", primaryColor);
      } else {
        root.style.removeProperty("--public-brand-primary");
        root.style.removeProperty("--primary");
      }

      if (secondaryColor) {
        root.style.setProperty("--public-brand-secondary", secondaryColor);
        root.style.setProperty("--secondary", secondaryColor);
      } else {
        root.style.removeProperty("--public-brand-secondary");
        root.style.removeProperty("--secondary");
      }

      if (tertiaryColor) {
        root.style.setProperty("--public-brand-tertiary", tertiaryColor);
        root.style.setProperty("--accent", tertiaryColor);
        root.style.setProperty("--ring", tertiaryColor);
      } else {
        root.style.removeProperty("--public-brand-tertiary");
        root.style.removeProperty("--accent");
        root.style.removeProperty("--ring");
      }

      if (quaternaryColor) {
        root.style.setProperty("--public-brand-quaternary", quaternaryColor);
        root.style.setProperty("--quaternary", quaternaryColor);
      } else {
        root.style.removeProperty("--public-brand-quaternary");
        root.style.removeProperty("--quaternary");
      }

      if (bodyTextColor) {
        root.style.setProperty("--foreground", bodyTextColor);
        root.style.setProperty("--card-foreground", bodyTextColor);
        root.style.setProperty("--popover-foreground", bodyTextColor);
        root.style.setProperty("--public-text-body", bodyTextColor);
      } else {
        root.style.removeProperty("--foreground");
        root.style.removeProperty("--card-foreground");
        root.style.removeProperty("--popover-foreground");
        root.style.removeProperty("--public-text-body");
      }

      if (headingSubtextColor) {
        root.style.setProperty("--public-text-heading-subtext", headingSubtextColor);
      } else {
        root.style.removeProperty("--public-text-heading-subtext");
      }

      if (supportingCopyColor) {
        root.style.setProperty("--public-text-supporting-copy", supportingCopyColor);
      } else {
        root.style.removeProperty("--public-text-supporting-copy");
      }

      if (helperTextColor) {
        root.style.setProperty("--muted-foreground", helperTextColor);
        root.style.setProperty("--public-text-helper", helperTextColor);
      } else {
        root.style.removeProperty("--muted-foreground");
        root.style.removeProperty("--public-text-helper");
      }

      if (h1Color) {
        root.style.setProperty("--public-text-h1", h1Color);
      } else {
        root.style.removeProperty("--public-text-h1");
      }

      if (h2Color) {
        root.style.setProperty("--public-text-h2", h2Color);
      } else {
        root.style.removeProperty("--public-text-h2");
      }

      if (h3ToH6Color) {
        root.style.setProperty("--public-text-h3", h3ToH6Color);
      } else {
        root.style.removeProperty("--public-text-h3");
      }

      if (metaTextColor) {
        root.style.setProperty("--public-text-meta", metaTextColor);
      } else {
        root.style.removeProperty("--public-text-meta");
      }

      if (linkColor) {
        root.style.setProperty("--public-text-link", linkColor);
      } else {
        root.style.removeProperty("--public-text-link");
      }

      if (linkHoverColor) {
        root.style.setProperty("--public-text-link-hover", linkHoverColor);
      } else {
        root.style.removeProperty("--public-text-link-hover");
      }

      if (inverseTextColor) {
        root.style.setProperty("--public-text-inverse", inverseTextColor);
      } else {
        root.style.removeProperty("--public-text-inverse");
      }

      if (primaryTextColor) {
        root.style.setProperty("--public-primary-foreground", primaryTextColor);
        root.style.setProperty("--primary-foreground", primaryTextColor);
      } else {
        root.style.removeProperty("--public-primary-foreground");
        root.style.removeProperty("--primary-foreground");
      }

      if (secondaryTextColor) {
        root.style.setProperty("--public-secondary-foreground", secondaryTextColor);
        root.style.setProperty("--secondary-foreground", secondaryTextColor);
      } else {
        root.style.removeProperty("--public-secondary-foreground");
        root.style.removeProperty("--secondary-foreground");
      }

      if (tertiaryTextColor) {
        root.style.setProperty("--public-tertiary-foreground", tertiaryTextColor);
        root.style.setProperty("--accent-foreground", tertiaryTextColor);
      } else {
        root.style.removeProperty("--public-tertiary-foreground");
        root.style.removeProperty("--accent-foreground");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    branding.companyAddress,
    branding.companyGoogleBusinessUrl,
    branding.companyName,
    branding.companyPhoneNumbers,
    branding.footerLogoUrl,
    branding.bodyFont,
    branding.headingFont,
    branding.primaryColor,
    branding.secondaryColor,
    branding.tertiaryColor,
    branding.quaternaryColor,
    branding.h1Color,
    branding.h2Color,
    branding.h3ToH6Color,
    branding.bodyTextColor,
    branding.headingSubtextColor,
    branding.supportingCopyColor,
    branding.helperTextColor,
    branding.metaTextColor,
    branding.linkColor,
    branding.linkHoverColor,
    branding.inverseTextColor,
    branding.primaryTextColor,
    branding.secondaryTextColor,
    branding.tertiaryTextColor,
    isAdminRoute,
  ]);

  useEffect(() => {
    const faviconHref = branding.faviconUrl || "/images/symbol.svg";
    const faviconPath = faviconHref.split("?")[0] ?? faviconHref;
    let faviconEl = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!faviconEl) {
      faviconEl = document.createElement("link");
      faviconEl.setAttribute("rel", "icon");
      document.head.appendChild(faviconEl);
    }

    faviconEl.setAttribute("href", faviconHref);
    if (faviconPath.endsWith(".svg")) {
      faviconEl.setAttribute("type", "image/svg+xml");
    } else if (faviconPath.endsWith(".ico")) {
      faviconEl.setAttribute("type", "image/x-icon");
    } else {
      faviconEl.setAttribute("type", "image/png");
    }
  }, [branding.faviconUrl]);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
