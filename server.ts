import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateSitemapXml } from "./sitemap.xml";

dotenv.config();

// Initialize GoogleGenAI client (using the server-only GEMINI_API_KEY)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON bodies
  app.use(express.json());

  // Dynamic XML Sitemap Generator endpoint for search engines indexation
  app.get("/sitemap.xml", (req, res) => {
    res.header("Content-Type", "application/xml");
    res.send(generateSitemapXml(req));
  });

  // API route to generate SEO optimized templates via the Gemini API
  app.post("/api/seo/generate", async (req, res) => {
    try {
      const activeApiKey = process.env.GEMINI_API_KEY;
      if (!activeApiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured in the host environment or Secrets panel." 
        });
      }

      // Lazy load / re-assign if config changes
      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: activeApiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }

      const { pagePreset, brandName, focusKeyword, userGoal, currentTitle, currentDesc } = req.body;

      const systemInstruction = `You are an elite search-engine optimization (SEO) specialist, high-converting copywriter, and digital marketer.
Your goal is to write a highly compelling, beautifully structured title tag and meta description following Google Crawler guidelines and strict AdSense/publisher editorial rules.

RULES:
1. Provide a COMPACT JSON response.
2. Do not include markdown code block syntax (like \`\`\`json) or any preamble or explanation. ONLY return a single valid JSON object.
3. The response must follow this EXACT structure:
{
  "title": string, // Max 65 characters. Catchy, structured, professional, matching the focus keyword. Include the Brand Name organically if possible.
  "description": string, // Max 160 characters. Includes focus keyword naturally. Compelling visual hook that maximizes Click-Through Rates (CTR).
  "keywords": string[], // 4-6 related highly searchable keyword strings (comma-separated lists style, but packaged as a JSON array of strings).
  "socialTitle": string, // Social media-optimized open graph title.
  "socialDescription": string, // Social media-optimized open graph description.
  "optimizationTips": string[] // 3 precise actionable, bulleted optimization tips customized for this tool context (e.g. key landing page metrics, image tags, contrast checks, loading speeds).
}
4. Ensure character limits are strictly respected: Title: 45 to 65 chars; Description: 110 to 160 chars.
5. Highlight tangible utility, performance, cloud options, or specific user benefits over generic keyword stuffing.`;

      const userPrompt = `Please generate high-performing SEO meta tags for this webpage context:
- Target Context / Tool Name: ${pagePreset}
- Brand Identification Name: ${brandName}
- Focus SEO Keyphrase: ${focusKeyword}
- Primary User Goal: ${userGoal}
- Current Page Title (Alternative Baseline): ${currentTitle || "Not Specified"}
- Current Page Description (Alternative Baseline): ${currentDesc || "Not Specified"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const resText = response?.text?.trim() || "{}";
      // Safely parse JSON
      const parsedData = JSON.parse(resText);
      return res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini SEO generation error:", error);
      return res.status(500).json({ 
        error: error.message || "SEO generation failed due to a server-side error." 
      });
    }
  });

  // API route to shorten a URL utilizing high-availability failsafe providers (is.gd with tinyurl.com fallback)
  app.post("/api/url/shorten", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "A target URL is required to compile a shortened redirect link." });
      }

      // Quick syntax normalization
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      console.log(`Shortening URL: ${targetUrl}`);

      // Try is.gd first
      try {
        const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
          const data: any = await response.json();
          if (data && data.shorturl) {
            return res.json({ shortUrl: data.shorturl, provider: "is.gd" });
          }
        }
      } catch (isGdErr) {
        console.warn("is.gd shortener request failed, falling back to tinyurl.com:", isGdErr);
      }

      // Fallback to tinyurl.com
      try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
          const shortUrl = await response.text();
          if (shortUrl && shortUrl.startsWith("http")) {
            return res.json({ shortUrl: shortUrl.trim(), provider: "tinyurl.com" });
          }
        }
      } catch (tinyErr) {
        console.error("tinyurl fallback also failed:", tinyErr);
      }

      return res.status(502).json({ error: "All shortening gateways failed or timed out. Please check your URL value." });
    } catch (err: any) {
      console.error("Shortener route exception:", err);
      return res.status(500).json({ error: err.message || "An unexpected error occurred during link compilation." });
    }
  });

  // Vite middleware for development or fallback static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Standard SPA routing catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runs on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
