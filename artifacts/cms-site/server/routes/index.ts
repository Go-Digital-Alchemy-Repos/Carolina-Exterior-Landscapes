import type { Express, Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin/index";
import settingsRoutes from "./settings.routes";
import contactRoutes from "./contact.routes";
import docsRoutes from "./docs.routes";
import uploadRoutes from "./upload.routes";
import notificationsRoutes from "./notifications.routes";
import cmsPublicRoutes from "./cms-public.routes";
import r2PublicRoutes from "./r2-public.routes";
import setupRoutes from "./setup.routes";
import formsRoutes from "./forms.routes";
import crmRoutes from "./crm.routes";
import { buildRobotsTxtPayload } from "../services/robots-txt.service";
import { storage } from "../storage/index";
import { isLandscapePublicRoute } from "../public-landscape-routes";
import { isRetiredPublicPath } from "../retired-public-routes";
import { DEFAULT_BRANDING_VALUES } from "@shared/branding-defaults";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function registerApiRoutes(app: Express) {
  app.use("/r2", r2PublicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", settingsRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/forms", formsRoutes);
  app.use("/api/crm", crmRoutes);
  app.use("/api/admin/docs", docsRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/cms", cmsPublicRoutes);
  app.use("/api/setup", setupRoutes);

  app.get("/api/branding", async (_req, res) => {
    try {
      const branding = await storage.settings.getDecryptedCategory("branding");
      res.json({
        frontendLogoUrl: branding.frontend_logo_url || DEFAULT_BRANDING_VALUES.frontend_logo_url,
        footerLogoUrl: branding.footer_logo_url || DEFAULT_BRANDING_VALUES.footer_logo_url,
        faviconUrl: branding.favicon_url || DEFAULT_BRANDING_VALUES.favicon_url,
        companyName: branding.company_name || DEFAULT_BRANDING_VALUES.company_name,
        companyAddress: branding.company_address || DEFAULT_BRANDING_VALUES.company_address,
        companyPhoneNumbers: branding.company_phone_numbers || DEFAULT_BRANDING_VALUES.company_phone_numbers,
        companyEmail: branding.company_email || DEFAULT_BRANDING_VALUES.company_email,
        companyHours: branding.company_hours || DEFAULT_BRANDING_VALUES.company_hours,
        companyLicense: branding.company_license || DEFAULT_BRANDING_VALUES.company_license,
        companyLicensing: branding.company_licensing || DEFAULT_BRANDING_VALUES.company_licensing,
        companyCredentials: branding.company_credentials || DEFAULT_BRANDING_VALUES.company_credentials,
        companyGoogleBusinessUrl: branding.company_google_business_url || null,
        bodyFont: branding.frontend_body_font || null,
        headingFont: branding.frontend_heading_font || null,
        primaryColor: branding.brand_primary_color || DEFAULT_BRANDING_VALUES.brand_primary_color,
        secondaryColor: branding.brand_secondary_color || DEFAULT_BRANDING_VALUES.brand_secondary_color,
        tertiaryColor: branding.brand_tertiary_color || DEFAULT_BRANDING_VALUES.brand_tertiary_color,
        quaternaryColor: branding.brand_quaternary_color || DEFAULT_BRANDING_VALUES.brand_quaternary_color,
        h1Color: branding.text_h1_color || DEFAULT_BRANDING_VALUES.text_h1_color,
        h2Color: branding.text_h2_color || DEFAULT_BRANDING_VALUES.text_h2_color,
        h3ToH6Color: branding.text_h3_h6_color || DEFAULT_BRANDING_VALUES.text_h3_h6_color,
        bodyTextColor: branding.text_body_color || DEFAULT_BRANDING_VALUES.text_body_color,
        headingSubtextColor: branding.text_heading_subtext_color || branding.text_muted_color || DEFAULT_BRANDING_VALUES.text_heading_subtext_color,
        supportingCopyColor: branding.text_supporting_copy_color || branding.text_muted_color || DEFAULT_BRANDING_VALUES.text_supporting_copy_color,
        helperTextColor: branding.text_helper_text_color || branding.text_muted_color || DEFAULT_BRANDING_VALUES.text_helper_text_color,
        metaTextColor: branding.text_meta_color || DEFAULT_BRANDING_VALUES.text_meta_color,
        linkColor: branding.text_link_color || DEFAULT_BRANDING_VALUES.text_link_color,
        linkHoverColor: branding.text_link_hover_color || DEFAULT_BRANDING_VALUES.text_link_hover_color,
        inverseTextColor: branding.text_inverse_color || DEFAULT_BRANDING_VALUES.text_inverse_color,
        primaryTextColor: branding.text_primary_foreground_color || DEFAULT_BRANDING_VALUES.text_primary_foreground_color,
        secondaryTextColor: branding.text_secondary_foreground_color || DEFAULT_BRANDING_VALUES.text_secondary_foreground_color,
        tertiaryTextColor: branding.text_tertiary_foreground_color || DEFAULT_BRANDING_VALUES.text_tertiary_foreground_color,
      });
    } catch (err) {
      logger.app.warn("Failed to retrieve branding settings, returning defaults", {
        error: err instanceof Error ? err.message : String(err),
      });
      res.json({
        frontendLogoUrl: DEFAULT_BRANDING_VALUES.frontend_logo_url,
        footerLogoUrl: DEFAULT_BRANDING_VALUES.footer_logo_url,
        faviconUrl: DEFAULT_BRANDING_VALUES.favicon_url,
        companyName: DEFAULT_BRANDING_VALUES.company_name,
        companyAddress: DEFAULT_BRANDING_VALUES.company_address,
        companyPhoneNumbers: DEFAULT_BRANDING_VALUES.company_phone_numbers,
        companyEmail: DEFAULT_BRANDING_VALUES.company_email,
        companyHours: DEFAULT_BRANDING_VALUES.company_hours,
        companyLicense: DEFAULT_BRANDING_VALUES.company_license,
        companyLicensing: DEFAULT_BRANDING_VALUES.company_licensing,
        companyCredentials: DEFAULT_BRANDING_VALUES.company_credentials,
      });
    }
  });

  app.get("/api/runtime-integrations", async (_req, res) => {
    try {
      const analytics = await storage.settings.getDecryptedCategory("google_analytics");
      res.json({ ga4MeasurementId: analytics.ga4_measurement_id || null });
    } catch {
      res.json({ ga4MeasurementId: null });
    }
  });

  app.get("/api/seo/global", async (_req, res) => {
    const settings = await storage.seoSettings.get();
    res.json(settings ?? {});
  });

  app.get("/robots.txt", async (_req, res) => {
    try {
      const seoSettings = await storage.seoSettings.get();
      const { effectiveContent } = buildRobotsTxtPayload(seoSettings);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(effectiveContent);
    } catch {
      res.status(500).send("Error generating robots.txt");
    }
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const [seoSettings, pages] = await Promise.all([
        storage.seoSettings.get(),
        storage.cmsPages.getAllPages(),
      ]);

      const base = seoSettings?.siteUrl?.replace(/\/$/, "") || "";
      const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> = [
        { loc: base || "/", changefreq: "weekly", priority: "1.0" },
      ];

      for (const page of pages) {
        if (page.status !== "published" || page.noindex) continue;
        if (page.slug === "home" || isRetiredPublicPath(`/${page.slug}`)) continue;
        const canonicalPath = page.canonicalUrl?.startsWith("/")
          ? page.canonicalUrl
          : `/${page.slug}/`;
        urls.push({
          loc: `${base}${canonicalPath}`,
          lastmod: page.updatedAt ? new Date(page.updatedAt).toISOString().split("T")[0] : undefined,
          changefreq: "monthly",
          priority: "0.6",
        });
      }

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => {
          const parts = [`  <url>`, `    <loc>${escapeXml(url.loc)}</loc>`];
          if (url.lastmod) parts.push(`    <lastmod>${url.lastmod}</lastmod>`);
          if (url.changefreq) parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
          if (url.priority) parts.push(`    <priority>${url.priority}</priority>`);
          parts.push("  </url>");
          return parts.join("\n");
        }),
        "</urlset>",
      ].join("\n");

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch {
      res.status(500).send("Error generating sitemap");
    }
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/uploads") &&
      !isLandscapePublicRoute(req.path) &&
      isRetiredPublicPath(req.path)
    ) {
      return res.status(410).send("Gone");
    }
    next();
  });

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    try {
      const redirect = await storage.redirects.getActiveForPath(req.path);
      if (redirect) return res.redirect(redirect.statusCode, redirect.toPath);
    } catch (err) {
      logger.app.warn("Failed to look up redirect", {
        path: req.path,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    next();
  });

  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });
}
