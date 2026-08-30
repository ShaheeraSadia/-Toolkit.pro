import { Request } from "express";

/**
 * Dynamically generates a site-wide XML sitemap based on the request host
 * to ensure 100% accuracy across previews, custom domains, and production.
 * Fully compliant with Google Search Console and Google AdSense crawler standards.
 */
export function generateSitemapXml(req?: any): string {
  const protocol = req?.headers?.["x-forwarded-proto"] || req?.protocol || "https";
  const host = req?.headers?.host || "toolkit-pro-chi.vercel.app";
  const baseUrl = `${protocol}://${host}`;

  const tabs = [
    { id: "", changefreq: "daily", priority: "1.00" }, // Home
    { id: "quote", changefreq: "weekly", priority: "0.90" },
    { id: "compress", changefreq: "weekly", priority: "0.90" },
    { id: "qr", changefreq: "weekly", priority: "0.90" },
    { id: "palette", changefreq: "weekly", priority: "0.90" },
    { id: "video", changefreq: "weekly", priority: "0.85" },
    { id: "bgremover", changefreq: "weekly", priority: "0.85" },
    { id: "pdf", changefreq: "weekly", priority: "0.85" },
    { id: "converter", changefreq: "weekly", priority: "0.85" },
    { id: "android", changefreq: "weekly", priority: "0.85" },
    { id: "chatbot", changefreq: "weekly", priority: "0.80" },
    { id: "voice", changefreq: "weekly", priority: "0.80" },
    { id: "drive", changefreq: "daily", priority: "0.75" },
    { id: "resources", changefreq: "daily", priority: "0.90" },
    { id: "legal", changefreq: "monthly", priority: "0.70" },
  ];

  const subTabs = [
    { sub: "privacy", priority: "0.65" },
    { sub: "terms", priority: "0.65" },
    { sub: "about", priority: "0.65" },
    { sub: "contact", priority: "0.65" },
    { sub: "adsense", priority: "0.65" },
  ];

  const articles = [
    { id: "qr-code-encoding", priority: "0.85", changefreq: "weekly" },
    { id: "compression-guide", priority: "0.85", changefreq: "weekly" },
    { id: "webp-vs-png-vs-jpg", priority: "0.85", changefreq: "weekly" },
    { id: "pinterest-seo", priority: "0.85", changefreq: "weekly" },
    { id: "color-palette-extraction", priority: "0.85", changefreq: "weekly" },
    { id: "workspace-workflow-optimization", priority: "0.80", changefreq: "monthly" },
    { id: "ux-color-psychology", priority: "0.80", changefreq: "monthly" },
    { id: "exif-image-metadata", priority: "0.80", changefreq: "monthly" },
    { id: "core-web-vitals-vitals", priority: "0.80", changefreq: "monthly" },
    { id: "svg-optimization-secrets", priority: "0.80", changefreq: "monthly" },
    { id: "web-typography-loading", priority: "0.80", changefreq: "monthly" },
    { id: "robots-txt-sitemaps", priority: "0.80", changefreq: "monthly" },
    { id: "structured-schema-seo", priority: "0.80", changefreq: "monthly" },
    { id: "ai-video-editing-workflows", priority: "0.80", changefreq: "monthly" },
    { id: "seo-tools-step-by-step-guide", priority: "0.80", changefreq: "monthly" },
  ];

  const currentDate = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Google AdSense & Search Engine Optimized XML Sitemap for Toolkit Pro Suite -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

  // 1. Root & Primary Tool Tabs
  tabs.forEach((tab) => {
    const loc = tab.id ? `${baseUrl}/?tab=${tab.id}` : `${baseUrl}/`;
    xml += `
  <url>
    <loc>${loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${tab.changefreq}</changefreq>
    <priority>${tab.priority}</priority>
  </url>`;
  });

  // 2. High-Value Educational Articles & Guides (AdSense Content Value)
  articles.forEach((article) => {
    xml += `
  <url>
    <loc>${baseUrl}/?tab=resources&amp;article=${article.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${article.changefreq}</changefreq>
    <priority>${article.priority}</priority>
  </url>`;
  });

  // 3. Legal & Google AdSense Publisher Compliance Pages
  subTabs.forEach((sub) => {
    xml += `
  <url>
    <loc>${baseUrl}/?tab=legal&amp;sub=${sub.sub}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${sub.priority}</priority>
  </url>`;
  });

  // 4. Custom Sitemap HTML View Diagnostic Route
  xml += `
  <url>
    <loc>${baseUrl}/?sitemap=true</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
</urlset>`;

  return xml;
}
