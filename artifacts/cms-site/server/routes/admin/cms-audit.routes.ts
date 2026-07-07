import { Router } from "express";
import { storage } from "../../storage/index";

const router = Router();

function pageIssues(page: any): string[] {
  const issues: string[] = [];
  if (!page.seoTitle) issues.push("missing_seo_title");
  if (!page.seoDescription) issues.push("missing_seo_description");
  if (!page.ogImageUrl) issues.push("missing_og_image");
  if (page.noindex) issues.push("noindex");
  if (page.status !== "published") issues.push("not_published");
  return issues;
}

router.get("/seo-audit", async (_req, res) => {
  try {
    const pages = await storage.cmsPages.getAllPages();
    res.json({
      pages: pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        noindex: page.noindex,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        ogImageUrl: page.ogImageUrl,
        canonicalUrl: page.canonicalUrl,
        updatedAt: page.updatedAt,
        issues: pageIssues(page),
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to run SEO audit" });
  }
});

export default router;
