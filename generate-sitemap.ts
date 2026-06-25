import { writeFileSync } from "fs";
import { join } from "path";
import { generateSitemapXml } from "./sitemap.xml";

try {
  console.log("Generating static sitemap.xml...");
  const xml = generateSitemapXml();
  const publicPath = join(process.cwd(), "public", "sitemap.xml");
  writeFileSync(publicPath, xml, "utf8");
  console.log(`Successfully wrote sitemap to ${publicPath}`);
} catch (err) {
  console.error("Failed to generate static sitemap during build:", err);
  process.exit(1);
}
