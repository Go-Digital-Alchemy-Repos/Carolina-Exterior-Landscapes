import express, { type Express, type Response } from "express";
import fs from "fs";
import path from "path";
import { isLandscapePublicRoute } from "./public-landscape-routes";
import { isRetiredPublicPath } from "./retired-public-routes";
import { getPrerenderedPublicFilePath } from "./services/public-prerender.service";
import { getSiteCodeSnippets, injectSiteCodeSnippets } from "./services/code-snippets.service";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  let cachedIndexTemplate: string | null = null;

  async function getIndexTemplate() {
    if (cachedIndexTemplate) return cachedIndexTemplate;
    cachedIndexTemplate = await fs.promises.readFile(indexPath, "utf-8");
    return cachedIndexTemplate;
  }

  function isClientOnlyRoute(pathname: string) {
    return (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/setup") ||
      pathname.startsWith("/preview") ||
      pathname.startsWith("/forms/")
    );
  }

  function shouldInjectCodeSnippets(pathname: string) {
    return !isClientOnlyRoute(pathname) && !pathname.startsWith("/api") && !pathname.startsWith("/uploads");
  }

  async function renderHtml(pathname: string, html: string) {
    if (!shouldInjectCodeSnippets(pathname)) return html;
    return injectSiteCodeSnippets(html, await getSiteCodeSnippets());
  }

  async function renderIndexTemplate(pathname: string) {
    return renderHtml(pathname, await getIndexTemplate());
  }

  async function sendPrerenderedPublicHtml(pathname: string, res: Response) {
    const htmlPath = getPrerenderedPublicFilePath(distPath, pathname);
    if (!htmlPath || !fs.existsSync(htmlPath)) return false;
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(await renderHtml(pathname, await fs.promises.readFile(htmlPath, "utf-8")));
    return true;
  }

  function looksLikeAssetRequest(pathname: string) {
    return /\.[a-z0-9]{2,8}$/i.test(pathname);
  }

  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }

      if (/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|avif|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));

  app.use("/{*path}", async (req, res) => {
    const parsed = new URL(req.originalUrl || req.url || "/", "http://localhost");
    const pathname = parsed.pathname || "/";
    if (req.method === "GET" && !pathname.startsWith("/api") && !pathname.startsWith("/uploads") && isRetiredPublicPath(pathname)) {
      res.status(410).type("text").set("Cache-Control", "no-cache").send("Gone");
      return;
    }

    if (!isLandscapePublicRoute(pathname) && await sendPrerenderedPublicHtml(pathname, res)) {
      return;
    }

    if (
      req.method === "GET" &&
      !isClientOnlyRoute(pathname) &&
      !isLandscapePublicRoute(pathname) &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/uploads")
    ) {
      if (looksLikeAssetRequest(pathname)) {
        res.status(404).type("text").set("Cache-Control", "no-cache").send("Not found");
        return;
      }

      const template = await renderIndexTemplate(pathname);
      res.status(404).setHeader("Cache-Control", "no-cache");
      res.type("html").send(template);
      return;
    }

    const template = await renderIndexTemplate(pathname);
    res.setHeader(
      "Cache-Control",
      req.path.startsWith("/admin") || req.path.startsWith("/auth")
        ? "private, no-store, max-age=0"
        : "no-cache",
    );
    res.type("html").send(template);
  });
}
