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

// API route to suggest creative, thematic names for color palettes using Gemini API
app.post("/api/palette/suggest-names", async (req, res) => {
  try {
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured in the host environment or Secrets panel." 
      });
    }

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

    const { colors } = req.body;
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ error: "A non-empty colors array is required." });
    }

    const hexCodes = colors.map((c: any) => typeof c === "string" ? c : c.hex);

    const systemInstruction = `You are a professional designer, branding strategist, and color theory expert.
Your goal is to suggest 5 creative, thematic, and evocative names for a color palette consisting of the provided colors.

RULES:
1. Provide a COMPACT JSON response.
2. Do not include markdown code block syntax (like \`\`\`json) or any preamble or explanation. ONLY return a single valid JSON object.
3. The response must follow this EXACT structure:
{
  "names": [
    { "name": string, "theme": string, "description": string }
  ]
}
Each item in the array must have:
- "name": A highly creative and polished theme name (e.g., 'Sunset Glow', 'Ocean Depths', 'Earthy Sage', 'Vintage Cyber'). Max 28 characters.
- "theme": The overall style vibe/aesthetic (e.g., 'Nature & Sunset', 'Minimalist Tech', 'Cozy Retro', 'Cyberpunk Neon'). Max 25 characters.
- "description": A short explanation of why the colors evoke this specific name and concept. Max 80 characters.

4. Make the names feel human-crafted, premium, and unique. Avoid generic or overly simple labels.`;

    const userPrompt = `Suggest 5 evocative designer names for a color palette containing these hex codes: ${hexCodes.join(", ")}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const resText = response?.text?.trim() || "{}";
    const parsedData = JSON.parse(resText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini palette renaming error:", error);
    return res.status(500).json({ 
      error: error.message || "Palette naming suggestion failed due to a server-side error." 
    });
  }
});

// API route to suggest highly cinematic and detailed expansions for AI video prompt subjects using Gemini API
app.post("/api/video/enhance-prompt", async (req, res) => {
  try {
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured in the host environment or Secrets panel." 
      });
    }

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

    const { subject, style, camera } = req.body;
    if (!subject) {
      return res.status(400).json({ error: "A non-empty subject description is required to enhance." });
    }

    const systemInstruction = `You are an expert AI video prompt designer and world-class cinematographer.
Your goal is to take a simple user subject description, visual style, and camera movement, and expand the subject description into a highly detailed, evocative, and visually descriptive prompt segment (max 80 characters).

RULES:
1. Keep the output extremely concise, vivid, and cinematic. Do not exceed 80 characters.
2. Focus strictly on describing the motion, details, light, and action of the subject itself.
3. Return a clean, simple, unquoted text response. Do NOT include introductory text, conversational preambles, explanations, or quotes.`;

    const userPrompt = `Enhance this subject description: "${subject}".
The visual style is: "${style || "Cinematic"}".
The camera motion is: "${camera || "Slow Zoom"}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const enhancedText = response?.text?.trim() || subject;
    return res.json({ enhancedSubject: enhancedText });
  } catch (error: any) {
    console.error("Gemini prompt enhancement error:", error);
    return res.status(500).json({ 
      error: error.message || "Prompt enhancement failed due to a server-side error." 
    });
  }
});

// API route to generate cinematic attributes, captions, and Unsplash search tags based on user prompt
app.post("/api/video/generate-scene", async (req, res) => {
  try {
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured in the host environment or Secrets panel." 
      });
    }

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

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A non-empty prompt is required to generate a scene." });
    }

    const systemInstruction = `You are an expert AI filmmaker, video director, and storyboard artist.
Your goal is to parse a creative prompt into structured cinematic properties to generate a stunning custom scene.

Return a compact JSON object. Do not include markdown code block syntax (like \`\`\`json) or any explanation. Only return a single valid JSON object.

The response must follow this EXACT structure:
{
  "keywords": string,      // 2-3 precise comma-separated English search keywords for Unsplash matching the scenery described in the prompt (e.g. 'cyberpunk, neon, futuristic city' or 'autumn, forest, river').
  "caption": string,       // A beautiful, highly descriptive cinematic caption/subtitle text for this slide. Max 45 characters.
  "filter": string,        // Must be exactly one of: 'normal', 'noir', 'vintage', 'cinematic-warm', 'cyberpunk', 'vhs', 'retro'.
  "style": string,         // Must be exactly one of: 'Minimalist', 'Bold', 'Dark', 'Cinematic', 'Realistic', 'Dreamy'.
  "camera": string         // Must be exactly one of: 'Slow Zoom', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Orbit'.
}

Ensure all parameters are perfectly aligned with the mood, colors, and action specified in the prompt.`;

    const userPrompt = `Parse and generate cinematic parameters for this user scene prompt: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const resText = response?.text?.trim() || "{}";
    const parsedData = JSON.parse(resText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini scene generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Scene generation failed due to a server-side error." 
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

// Setup function for Vite or static middleware
async function setupViteOrStatic() {
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Initialize server setup and listen conditionally
setupViteOrStatic().then(() => {
  // Only start listening if NOT running in Vercel's serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server runs on port ${PORT}`);
    });
  }
}).catch((err) => {
  console.error("Failed to setup static/Vite middleware:", err);
});

export default app;
