import { Request } from "express";

/**
 * Dynamically generates a site-wide XML sitemap based on the request host
 * to ensure accuracy across previews, custom domains, and production.
 */
export function generateSitemapXml(req: Request): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers.host || "toolkitpro.app";
  const baseUrl = `${protocol}://${host}`;

  const tabs = [
    { id: "quote", changefreq: "weekly", priority: "1.0" },
    { id: "compress", changefreq: "weekly", priority: "0.9" },
    { id: "qr", changefreq: "monthly", priority: "0.8" },
    { id: "palette", changefreq: "weekly", priority: "0.8" },
    { id: "drive", changefreq: "daily", priority: "0.7" },
    { id: "resources", changefreq: "daily", priority: "0.9" },
    { id: "legal", changefreq: "yearly", priority: "0.5" },
  ];

  const subTabs = [
    { sub: "privacy", priority: "0.5" },
    { sub: "terms", priority: "0.5" },
    { sub: "about", priority: "0.6" },
    { sub: "contact", priority: "0.6" },
  ];

  const articles = [
    "compression-guide",
    "webp-vs-png-vs-jpg",
    "qr-code-encoding",
    "pinterest-seo",
    "color-palette-extraction",
    "workspace-workflow-optimization",
    "ux-color-psychology",
    "exif-image-metadata",
    "core-web-vitals-vitals",
    "svg-optimization-secrets",
    "web-typography-loading",
    "robots-txt-sitemaps",
    "structured-schema-seo",
  ];

  const currentDate = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 1. Root and Tab Pages
  tabs.forEach((tab) => {
    if (tab.id === "quote") {
      xml += `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${tab.changefreq}</changefreq>
    <priority>${tab.priority}</priority>
  </url>`;
    } else {
      xml += `
  <url>
    <loc>${baseUrl}/?tab=${tab.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${tab.changefreq}</changefreq>
    <priority>${tab.priority}</priority>
  </url>`;
    }
  });

  // 2. Specific articles under the resources tab
  articles.forEach((article) => {
    xml += `
  <url>
    <loc>${baseUrl}/?tab=resources&amp;article=${article}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // 3. Legal guidelines sub-tabs
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
    <priority>0.4</priority>
  </url>
</urlset>`;

  return xml;
}
