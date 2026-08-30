import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation, Modality, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { generateSitemapXml } from "./sitemap.xml.ts";

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

function getActiveApiKey(req: express.Request): string {
  const customKey = req.headers["x-gemini-api-key"] || req.body?.customApiKey;
  const activeApiKey = typeof customKey === "string" && customKey.trim()
    ? customKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!activeApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the host environment or Secrets panel, and no custom API Key was provided.");
  }
  return activeApiKey;
}

function getAiClient(req: express.Request): GoogleGenAI {
  const activeApiKey = getActiveApiKey(req);
  return new GoogleGenAI({
    apiKey: activeApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const app = express();
const PORT = 3000;

// Trust reverse proxies (Google Cloud Run, Vercel, Nginx) so client IP detection is accurate
app.set("trust proxy", 1);

// Disable X-Powered-By header to prevent server framework fingerprinting
app.disable("x-powered-by");

// ==========================================
// 1. Security HTTP Headers Middleware
// ==========================================
app.use((req, res, next) => {
  // Prevent browsers from MIME-sniffing away from declared content-type
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Defense against legacy browser XSS
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Strict Referrer-Policy to prevent leaking URLs or tokens in outbound links
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Prevent Internet Explorer from executing downloads in site context
  res.setHeader("X-Download-Options", "noopen");
  // Restrict sensitive browser APIs not required by the app
  res.setHeader("Permissions-Policy", "payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()");
  
  // Allow framing in authorized preview environments (AI Studio, Cloud Run, Vercel) while preventing arbitrary clickjacking
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio https://*.vercel.app;"
  );

  // Prevent intermediate proxy caching of sensitive API requests
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
});

// Helper to extract reliable client IP behind proxies
function getClientIp(req: express.Request | http.IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return (req as any).socket?.remoteAddress || "127.0.0.1";
}

// ==========================================
// 2. In-Memory Sliding-Window Rate Limiter
// ==========================================
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  name: string;
}

class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private message: string;
  private name: string;

  constructor(config: RateLimitConfig) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.message = config.message || "Security rate limit exceeded. Please wait a moment before trying again.";
    this.name = config.name;

    // Prune stale records every 3 minutes to keep memory footprint minimal
    setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamps] of this.requests.entries()) {
        const valid = timestamps.filter(t => now - t < this.windowMs);
        if (valid.length === 0) {
          this.requests.delete(ip);
        } else {
          this.requests.set(ip, valid);
        }
      }
    }, 3 * 60 * 1000).unref();
  }

  public check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const timestamps = (this.requests.get(ip) || []).filter(t => now - t < this.windowMs);

    if (timestamps.length >= this.maxRequests) {
      const earliest = timestamps[0];
      const resetTime = Math.ceil((earliest + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetTime: Math.max(1, resetTime) };
    }

    timestamps.push(now);
    this.requests.set(ip, timestamps);
    const resetTime = Math.ceil((timestamps[0] + this.windowMs - now) / 1000);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      resetTime: Math.max(1, resetTime),
    };
  }

  public middleware() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = getClientIp(req);
      const { allowed, remaining, resetTime } = this.check(ip);

      res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", resetTime.toString());

      if (!allowed) {
        console.warn(`[Security Alert] Rate limit reached on ${this.name} for IP: ${ip}`);
        res.setHeader("Retry-After", resetTime.toString());
        return res.status(429).json({
          error: "Too Many Requests",
          message: this.message,
          retryAfterSeconds: resetTime,
        });
      }

      next();
    };
  }
}

// Global API Limiter: 150 requests per 10 minutes per IP
const globalApiLimiter = new InMemoryRateLimiter({
  name: "Global API",
  windowMs: 10 * 60 * 1000,
  maxRequests: 150,
  message: "Too many requests to Toolkit Pro API. Please slow down and try again in a few minutes.",
});

// Resource-Heavy AI Limiter: 20 requests per 5 minutes per IP (video/image generation)
const aiHeavyLimiter = new InMemoryRateLimiter({
  name: "AI Heavy Generation",
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
  message: "AI generation request limit reached. Please wait a few minutes before submitting another visual render.",
});

// Conversational & Prompt Limiter: 45 requests per 5 minutes per IP
const aiLightLimiter = new InMemoryRateLimiter({
  name: "AI Conversational",
  windowMs: 5 * 60 * 1000,
  maxRequests: 45,
  message: "AI assistance request frequency limit reached. Please wait a moment before sending more messages.",
});

// Link shortener limiter: 25 requests per 5 minutes per IP
const urlShortenerLimiter = new InMemoryRateLimiter({
  name: "URL Shortener",
  windowMs: 5 * 60 * 1000,
  maxRequests: 25,
  message: "Link shortener rate limit reached. Please wait a moment before shortening another link.",
});

// ==========================================
// 3. Input Sanitization & Anti-Prototype Pollution
// ==========================================
function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 8 || !obj || typeof obj !== "object") return obj;

  // Protect against prototype pollution
  if (Object.prototype.hasOwnProperty.call(obj, "__proto__")) delete obj.__proto__;
  if (Object.prototype.hasOwnProperty.call(obj, "constructor")) delete obj.constructor;
  if (Object.prototype.hasOwnProperty.call(obj, "prototype")) delete obj.prototype;

  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      delete obj[key];
      continue;
    }

    if (typeof obj[key] === "string") {
      // Strip null bytes and dangerous control characters
      obj[key] = obj[key].replace(/\0/g, "");
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key], depth + 1);
    }
  }
  return obj;
}

function inputSanitizationMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }
  next();
}

// ==========================================
// 4. API Cross-Origin & CSRF Guard
// ==========================================
function apiOriginGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "DELETE") {
    return next();
  }

  const origin = req.headers.origin as string | undefined;
  if (!origin) {
    return next();
  }

  try {
    const originUrl = new URL(origin);
    const host = req.headers.host;
    const originHost = originUrl.host;

    if (host && (originHost === host || originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")) {
      return next();
    }

    const allowedDomainPatterns = [
      /\.run\.app$/,
      /\.vercel\.app$/,
      /\.google\.com$/,
      /\.aistudio\.google$/,
      /^localhost(:\d+)?$/,
      /^127\.0\.0\.1(:\d+)?$/
    ];

    const isAllowed = allowedDomainPatterns.some(pattern => pattern.test(originUrl.hostname));
    if (isAllowed) {
      return next();
    }

    console.warn(`[Security Alert] Blocked unauthorized cross-origin request from: ${origin} to ${req.path}`);
    return res.status(403).json({
      error: "Forbidden",
      message: "Cross-origin API calls from unauthorized domains are blocked for security."
    });
  } catch (err) {
    return res.status(400).json({ error: "Invalid Origin header syntax." });
  }
}

// Enable JSON and URL-encoded bodies with increased size limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(inputSanitizationMiddleware);
app.use("/api", globalApiLimiter.middleware());
app.use("/api", apiOriginGuard);

// Health check endpoint for uptime monitors and readiness probes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(), 
    security: "hardened",
    version: "1.0.0" 
  });
});

// Dynamic XML Sitemap Generator endpoint for search engines indexation
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml; charset=utf-8");
  res.header("Cache-Control", "public, max-age=3600");
  res.send(generateSitemapXml(req));
});

// Robots.txt endpoint for search engines & AdSense crawler
app.get("/robots.txt", (req, res) => {
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Cache-Control", "public, max-age=86400");
  const robotsPath = path.join(process.cwd(), "public", "robots.txt");
  if (fs.existsSync(robotsPath)) {
    return res.sendFile(robotsPath);
  }
  res.send(`User-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\nDisallow: /api/\n\nUser-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://toolkit-pro-chi.vercel.app/sitemap.xml\n`);
});

// Google AdSense Publisher Verification ads.txt endpoint
app.get("/ads.txt", (req, res) => {
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Cache-Control", "public, max-age=86400");
  const adsPath = path.join(process.cwd(), "public", "ads.txt");
  if (fs.existsSync(adsPath)) {
    return res.sendFile(adsPath);
  }
  res.send(`google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n`);
});

// API route to generate SEO optimized templates via the Gemini API
app.post("/api/seo/generate", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
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
app.post("/api/palette/suggest-names", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
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
app.post("/api/video/enhance-prompt", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
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

// API route to enhance an image prompt using Gemini AI
app.post("/api/image/enhance-prompt", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
    const { prompt, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A non-empty prompt is required to enhance." });
    }

    const systemInstruction = `You are an expert AI prompt engineer specialized in Google Imagen image generation models.
Your goal is to take a simple, short, or raw user description, and transform it into a highly detailed, descriptive, and vivid image generation prompt.

RULES:
1. Focus strictly on visual elements, subjects, textures, lighting, atmosphere, colors, and composition.
2. Avoid generic buzzwords like "photorealistic", "hyperrealistic", "masterpiece", "8k". Instead, use concrete artistic descriptions (e.g., "volumetric raytraced lighting", "subtle rim light highlighting edge contours", "textured matte oil paint on canvas").
3. Keep the output relatively concise but rich (max 250 characters).
4. Return ONLY the enhanced prompt. No preambles, explanations, quotes, or introduction. Just the raw prompt itself.`;

    const styleText = style && style !== "none" ? `The desired artistic style/aesthetic is: ${style}.` : "";
    const userPrompt = `Enhance this image description: "${prompt}". ${styleText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    const enhancedPrompt = response?.text?.trim() || prompt;
    return res.json({ enhancedPrompt });
  } catch (error: any) {
    console.error("Gemini image prompt enhancement error:", error);
    return res.status(500).json({ 
      error: error.message || "Prompt enhancement failed due to a server-side error." 
    });
  }
});

// API route to generate images using the gemini-3.1-flash-lite-image model
app.post("/api/image/generate", aiHeavyLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
    const { prompt, aspectRatio = "1:1", style = "none", modelChoice = "gemini-3.1-flash-lite-image", imageSize = "1K", enableSearch = false } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A prompt description is required to generate an image." });
    }

    // Prepend or append style description to enhance image aesthetic quality
    let fullPrompt = prompt;
    const stylePhrases: Record<string, string> = {
      cinematic: "cinematic masterpiece, dramatic lighting, highly detailed 8k, volumetric atmosphere, film grain",
      anime: "gorgeous anime key art style, vibrant hand-drawn, cozy lighting, beautiful detailed aesthetics",
      oil_painting: "textured oil painting brushstrokes, classical fine art canvas, rich moody impasto technique, warm lighting",
      sketch: "highly detailed graphite pencil sketch, fine paper texture, clean hand-drawn monochrome shading",
      render_3d: "hyperrealistic octane 3D render, raytraced ambient occlusion, unreal engine 5 fidelity, neon glow, detailed materials",
      retro_vhs: "retro 1980s vhs camcorder look, vintage analog noise, nostalgic warm neon chromatic glow, tape scanlines",
      cyberpunk_neon: "futuristic cyberpunk neon cityscape, highly detailed octane render, volumetric lighting, rich vivid colors, blade runner style",
      fantasy_dream: "dreamy surrealist landscape, levitating islands, sparkling cosmic particles, hyper-detailed magical fantasy art, bioluminescent plants",
      studio_ghibli: "gorgeous hand-drawn anime background, Studio Ghibli vibes, soft pastoral lighting, lush green meadows, nostalgic clouds",
      film_noir: "classic 1940s film noir, dark moody shadows, high-contrast black and white, volumetric rain mist, smoke haze, dramatic silhouette lighting",
      nature_8k: "photorealistic national geographic photography, high dynamic range, breathtaking outdoor scenic view, extreme details, morning mist, 8k resolution"
    };

    if (style !== "none" && stylePhrases[style]) {
      fullPrompt = `${prompt}, in style of ${stylePhrases[style]}`;
    }

    const targetModel = modelChoice === "gemini-3.1-flash-image" ? "gemini-3.1-flash-image" : "gemini-3.1-flash-lite-image";

    // Setup configuration
    const imageConfig: any = {
      aspectRatio: aspectRatio,
    };

    const tools: any[] = [];

    if (targetModel === "gemini-3.1-flash-image") {
      imageConfig.imageSize = imageSize; // "512px" | "1K" | "2K" | "4K"
      
      if (enableSearch) {
        tools.push({
          googleSearch: {
            searchTypes: {
              webSearch: {},
              imageSearch: {},
            }
          }
        });
      }
    }

    const config: any = {
      imageConfig
    };

    if (tools.length > 0) {
      config.tools = tools;
    }

    // Call selected image generation model
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
      config
    });

    let imageUrl = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "No image data was generated by the model." });
    }

    return res.json({ imageUrl, fullPrompt });
  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Image generation failed due to a server-side error." 
    });
  }
});

// Helper function to search and fetch custom relevant photo matching the user prompt
async function fetchPromptRelevantImageBase64(searchQuery: string, width: number, height: number): Promise<string | null> {
  try {
    const cleanQuery = searchQuery.replace(/[^\w\s]/gi, ' ').trim() || "cinematic wallpaper";
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(3500)
    });
    const html = await tokenRes.text();
    const match = html.match(/vqd=([\d-]+)/);
    if (!match) return null;
    
    const vqd = match[1];
    const imgRes = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(cleanQuery)}&vqd=${vqd}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(3500)
    });
    if (!imgRes.ok) return null;
    const data = await imgRes.json();
    const results = data.results || [];
    
    for (const r of results.slice(0, 8)) {
      if (!r.image || typeof r.image !== "string") continue;
      try {
        const fetchImg = await fetch(r.image, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          signal: AbortSignal.timeout(4000)
        });
        if (fetchImg.ok) {
          const contentType = fetchImg.headers.get("content-type") || "image/jpeg";
          const buf = await fetchImg.arrayBuffer();
          if (contentType.toLowerCase().includes("image") && buf.byteLength > 2000) {
            const cleanType = contentType.split(";")[0].trim() || "image/jpeg";
            const base64Data = Buffer.from(buf).toString("base64");
            return `data:${cleanType};base64,${base64Data}`;
          }
        }
      } catch {
        // continue to next search result
      }
    }
  } catch (err) {
    console.warn("[Free Image Gen] DDG image search error:", err);
  }
  return null;
}

// Helper function to create an SVG vector canvas image data URL as an unbreakably reliable fallback
function createVisualCanvasSvgDataUrl(promptText: string, width: number, height: number): string {
  const safeTitle = (promptText || "AI Master Seed Frame").trim().slice(0, 50);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="40%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#311042"/>
      </linearGradient>
      <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)*0.45}" fill="url(#glowGrad)"/>
    
    <rect x="${width*0.06}" y="${height*0.06}" width="${width*0.88}" height="${height*0.88}" rx="20" fill="url(#glassGrad)" stroke="#a5b4fc" stroke-opacity="0.3" stroke-width="2"/>
    <circle cx="${width*0.5}" cy="${height*0.42}" r="${Math.min(width, height)*0.16}" fill="#4f46e5" fill-opacity="0.25" stroke="#818cf8" stroke-width="2"/>
    
    <g transform="translate(${width/2 - 16}, ${height*0.42 - 16}) scale(1.3)">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <text x="${width*0.5}" y="${height*0.72}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(15, Math.round(width*0.026))}" font-weight="700" fill="#f8fafc" text-anchor="middle">${safeTitle}</text>
    <text x="${width*0.5}" y="${height*0.79}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(11, Math.round(width*0.018))}" font-weight="600" fill="#a5b4fc" text-anchor="middle">✨ Master Visual Seed Frame</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// API route to generate free images with multi-tier failovers (Gemini -> Pollinations -> Vector Canvas)
app.post("/api/image/generate-free", aiHeavyLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1", style = "none", modelChoice = "flux" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A prompt is required for free image generation." });
    }

    const stylePhrases: Record<string, string> = {
      cinematic: "cinematic masterpiece, dramatic lighting, highly detailed 8k, volumetric atmosphere, film grain",
      anime: "gorgeous anime key art style, vibrant hand-drawn, cozy lighting, beautiful detailed aesthetics",
      oil_painting: "textured oil painting brushstrokes, classical fine art canvas, rich moody impasto technique, warm lighting",
      sketch: "highly detailed graphite pencil sketch, fine paper texture, clean hand-drawn monochrome shading",
      render_3d: "hyperrealistic octane 3D render, raytraced ambient occlusion, unreal engine 5 fidelity, neon glow, detailed materials",
      retro_vhs: "retro 1980s vhs camcorder look, vintage analog noise, nostalgic warm neon chromatic glow, tape scanlines",
      cyberpunk_neon: "futuristic cyberpunk neon cityscape, highly detailed octane render, volumetric lighting, rich vivid colors, blade runner style",
      fantasy_dream: "dreamy surrealist landscape, levitating islands, sparkling cosmic particles, hyper-detailed magical fantasy art, bioluminescent plants",
      studio_ghibli: "gorgeous hand-drawn anime background, Studio Ghibli vibes, soft pastoral lighting, lush green meadows, nostalgic clouds",
      film_noir: "classic 1940s film noir, dark moody shadows, high-contrast black and white, volumetric rain mist, smoke haze, dramatic silhouette lighting",
      nature_8k: "photorealistic national geographic photography, high dynamic range, breathtaking outdoor scenic view, extreme details, morning mist, 8k resolution"
    };

    let fullPrompt = prompt.trim();
    if (style !== "none" && stylePhrases[style]) {
      fullPrompt = `${prompt.trim()}, in style of ${stylePhrases[style]}`;
    }

    let width = 1024;
    let height = 1024;
    if (aspectRatio === "16:9") {
      width = 1024;
      height = 576;
    } else if (aspectRatio === "9:16") {
      width = 576;
      height = 1024;
    } else if (aspectRatio === "3:4") {
      width = 768;
      height = 1024;
    } else if (aspectRatio === "4:3") {
      width = 1024;
      height = 768;
    }

    // Tier 1: Gemini Imagen via GoogleGenAI SDK if API key is present
    try {
      const ai = getAiClient(req);
      if (ai) {
        console.log("[Free Image Gen] Attempting Gemini Image generation...");
        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: { parts: [{ text: fullPrompt }] },
          config: { imageConfig: { aspectRatio } }
        }).catch(() => null);

        if (geminiRes?.candidates?.[0]?.content?.parts) {
          for (const part of geminiRes.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
              return res.json({ imageUrl: dataUrl, fullPrompt, source: "gemini" });
            }
          }
        }
      }
    } catch (geminiErr: any) {
      console.log("[Free Image Gen] Gemini attempt finished, proceeding to direct image stream...");
    }

    // Tier 2: Pollinations AI image generation with full buffer conversion
    const seed = Date.now();
    const primaryUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    console.log(`[Free Image Gen] Fetching image from Pollinations: ${primaryUrl}`);

    let imgRes: Response | null = null;
    try {
      imgRes = await fetch(primaryUrl, { signal: AbortSignal.timeout(3000) });
      if (!imgRes.ok) imgRes = null;
    } catch (err: any) {
      console.warn(`[Free Image Gen] Pollinations fetch timed out or failed: ${err.message || err}`);
      imgRes = null;
    }

    if (imgRes && imgRes.ok) {
      const contentType = imgRes.headers.get("content-type") || "";
      const arrayBuffer = await imgRes.arrayBuffer();
      if (contentType.toLowerCase().includes("image") && arrayBuffer.byteLength > 1000) {
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const cleanType = contentType.split(";")[0].trim() || "image/jpeg";
        const dataUrl = `data:${cleanType};base64,${base64Data}`;
        return res.json({ imageUrl: dataUrl, fullPrompt, source: "pollinations" });
      }
    }

    // Tier 3: Search real prompt-relevant image matching the user prompt
    console.log(`[Free Image Gen] Pollinations unavailable. Searching custom image matching prompt: "${prompt}"`);
    const searchedImageDataUrl = await fetchPromptRelevantImageBase64(prompt, width, height);
    if (searchedImageDataUrl) {
      console.log(`[Free Image Gen] Successfully retrieved custom image matching prompt: "${prompt}"`);
      return res.json({ imageUrl: searchedImageDataUrl, fullPrompt, source: "prompt_search" });
    }

    // Tier 4: Topic-matched high quality stock photo fallback
    const lowerPrompt = prompt.toLowerCase();
    let stockPhotoId = "1519692933481-e162a57d6721"; // rainy day default
    if (lowerPrompt.includes("rain") || lowerPrompt.includes("storm") || lowerPrompt.includes("water")) {
      stockPhotoId = "1519692933481-e162a57d6721"; // rain
    } else if (lowerPrompt.includes("dragon") || lowerPrompt.includes("fire") || lowerPrompt.includes("monster")) {
      stockPhotoId = "1579783900882-c0d3dad7b119"; // fantasy art
    } else if (lowerPrompt.includes("car") || lowerPrompt.includes("vehicle") || lowerPrompt.includes("speed")) {
      stockPhotoId = "1503376780353-7e6692767b70"; // sports car
    } else if (lowerPrompt.includes("cyberpunk") || lowerPrompt.includes("neon") || lowerPrompt.includes("city")) {
      stockPhotoId = "1514565131-fce0801e5785"; // neon city
    } else if (lowerPrompt.includes("cat") || lowerPrompt.includes("dog") || lowerPrompt.includes("pet") || lowerPrompt.includes("animal")) {
      stockPhotoId = "1514888286974-6c03e2ca1dba"; // cat
    } else if (lowerPrompt.includes("space") || lowerPrompt.includes("galaxy") || lowerPrompt.includes("star") || lowerPrompt.includes("hourglass")) {
      stockPhotoId = "1451187580459-43490279c0fa"; // galaxy
    } else if (lowerPrompt.includes("nature") || lowerPrompt.includes("forest") || lowerPrompt.includes("mountain")) {
      stockPhotoId = "1470071459604-3b5ec3a7fe05"; // nature mountain
    }

    try {
      const unsplashUrl = `https://images.unsplash.com/photo-${stockPhotoId}?w=${width}&h=${height}&fit=crop&q=80`;
      const unsplashRes = await fetch(unsplashUrl, { signal: AbortSignal.timeout(2000) });
      if (unsplashRes.ok) {
        const ab = await unsplashRes.arrayBuffer();
        if (ab.byteLength > 1000) {
          const b64 = Buffer.from(ab).toString("base64");
          return res.json({ imageUrl: `data:image/jpeg;base64,${b64}`, fullPrompt, source: "unsplash_topic_stock" });
        }
      }
    } catch {
      // ignore
    }

    // Tier 5: Direct Pollinations URL fallback (rendered directly by client img tag)
    console.log("[Free Image Gen] Returning direct live image URL fallback.");
    return res.json({ imageUrl: primaryUrl, fullPrompt, source: "direct_pollinations" });
  } catch (err: any) {
    const promptText = req.body?.prompt || "a rainy day";
    const vectorSvgUrl = createVisualCanvasSvgDataUrl(promptText, 1024, 576);
    return res.json({ imageUrl: vectorSvgUrl, fullPrompt: promptText, source: "fallback_vector" });
  }
});

// API route to proxy and securely download any image URL or Base64 data URI
app.all("/api/image/download", async (req, res) => {
  try {
    const url = req.method === "POST" ? req.body?.url : req.query?.url;
    const requestedFilename = req.method === "POST" ? req.body?.filename : req.query?.filename;
    const filename = requestedFilename && typeof requestedFilename === "string" 
      ? requestedFilename 
      : `toolkit-pro-${Date.now()}.png`;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url parameter is required." });
    }

    if (url.startsWith("data:")) {
      const parts = url.split(";base64,");
      const mimeType = parts[0].replace("data:", "");
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    } else {
      console.log(`[Toolkit Pro server] Downloading and proxying remote image URL: ${url}`);
      const imgRes = await fetch(url);
      if (!imgRes.ok) {
        return res.status(imgRes.status).json({ error: `Failed to fetch image: ${imgRes.statusText}` });
      }
      const contentType = imgRes.headers.get("content-type") || "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const arrayBuffer = await imgRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (err: any) {
    console.error("Image proxy download failed:", err);
    return res.status(500).json({ error: err.message || "Failed to download image." });
  }
});

// API route to generate cinematic attributes, captions, and Unsplash search tags based on user prompt
app.post("/api/video/generate-scene", aiHeavyLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
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

// API route to auto-generate beautiful subtitle captions based on a prompt or audio track details
app.post("/api/video/generate-subtitles", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const ai = getAiClient(req);
    const { mode, prompt, audioName, audioGenre, audioDescription, numSlides, slideContexts } = req.body;
    const slidesCount = numSlides || 1;
    const slidesInfo = slideContexts && Array.isArray(slideContexts) ? slideContexts : [];

    const systemInstruction = `You are an elite cinematic subtitle designer, creative copywriter, and audio transcriber.
Your goal is to generate exactly ${slidesCount} sequential subtitle captions (one for each frame/slide of our video) that are beautiful, engaging, and highly descriptive.

RULES:
1. Provide a COMPACT JSON response.
2. Do not include markdown code block syntax (like \`\`\`json) or any preamble or explanation. ONLY return a single valid JSON object.
3. The response must follow this EXACT structure:
{
  "subtitles": [
    string // Exactly ${slidesCount} subtitle strings. Each subtitle must be extremely punchy, creative, and strictly under 45 characters.
  ]
}
4. Each subtitle must align sequentially with the provided slide context list, creating a beautiful narrative flow.
5. Keep the vocabulary cinematic, poetic, and highly eye-catching.`;

    let userPrompt = "";
    if (mode === "audio") {
      userPrompt = `Please transcribe or auto-generate a beautiful voiceover subtitle track matching this audio track context:
- Track Name: "${audioName || "Custom Track"}"
- Genre: "${audioGenre || "Ambient"}"
- Description: "${audioDescription || "Atmospheric background score"}"
- Total frames to caption: ${slidesCount}
- Sequential Frame Visuals/Themes to match: ${JSON.stringify(slidesInfo)}`;
    } else {
      userPrompt = `Please generate beautiful, sequential video subtitle overlays based on this video prompt/theme:
- Video Theme: "${prompt || "A cinematic journey"}"
- Total frames to caption: ${slidesCount}
- Sequential Frame Visuals/Themes to match: ${JSON.stringify(slidesInfo)}`;
    }

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
    
    // Safety check to ensure we got an array of the right size
    if (!parsedData.subtitles || !Array.isArray(parsedData.subtitles)) {
      parsedData.subtitles = Array(slidesCount).fill("").map((_, i) => `Frame #${i + 1} Overlay`);
    } else if (parsedData.subtitles.length < slidesCount) {
      while (parsedData.subtitles.length < slidesCount) {
        parsedData.subtitles.push(`Frame #${parsedData.subtitles.length + 1}`);
      }
    } else if (parsedData.subtitles.length > slidesCount) {
      parsedData.subtitles = parsedData.subtitles.slice(0, slidesCount);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini subtitle generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Subtitle generation failed due to a server-side error." 
    });
  }
});

// Helper to parse and format raw Google GenAI SDK error messages elegantly
function formatGoogleGenAIError(error: any): string {
  if (!error) return "Video generation failed due to a server-side error.";
  let message = error.message || "";
  
  if (typeof message === "string" && message.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        message = parsed.error.message;
      }
    } catch (e) {
      // ignore parsing failures
    }
  }
  
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota") || message.includes("429")) {
    return "You have exceeded your Gemini / Veo API quota. Please check your plan and billing details in Google AI Studio, or try again later.";
  }
  
  return message || error.toString();
}

// API route to initiate Veo AI video generation
app.post("/api/video/generate", aiHeavyLimiter.middleware(), async (req, res) => {
  try {
    const activeApiKey = getActiveApiKey(req);
    const ai = getAiClient(req);

    const maskedKey = activeApiKey.length > 8 
      ? `${activeApiKey.slice(0, 6)}...${activeApiKey.slice(-4)}` 
      : "***REDACTED***";
    console.log(`[Veo server] GEMINI_API_KEY retrieved successfully (Length: ${activeApiKey.length}, Masked: ${maskedKey})`);

    const { 
      prompt, 
      modelChoice, 
      aspectRatio, 
      resolution, 
      image, 
      enhancePrompt, 
      videoQuality = "balanced", 
      videoRealismStyle = "documentary", 
      loopVideo = false,
      stylePreset = "auto",
      cameraDirection = "auto",
      motionIntensity = 5,
      motion_bucket_id,
      steps,
      audio_sync,
      videoStyle = "Cinematic",
      videoDuration = 8
    } = req.body;

    if (motion_bucket_id !== undefined || steps !== undefined || audio_sync !== undefined) {
      console.log(`[Veo generation overrides] motion_bucket_id: ${motion_bucket_id}, steps: ${steps}, audio_sync: ${audio_sync}`);
    }
    
    // Choose model based on user preference and selected quality mode
    let model = "veo-3.1-lite-generate-preview";
    if (modelChoice === "omni-flash" || videoQuality === "omni") {
      model = "omni-flash";
    } else if (modelChoice === "veo-core" || modelChoice === "veo-3.1-generate-preview" || videoQuality === "high") {
      model = "veo-3.1-generate-preview";
    } else if (modelChoice === "veo-3.1-fast-generate-preview" || videoQuality === "fast") {
      model = "veo-3.1-fast-generate-preview";
    } else if (videoQuality === "performance") {
      model = "veo-3.1-lite-generate-preview";
    }

    let finalPrompt = prompt || "Cinematic masterpiece video, professional lighting, photorealistic";

    // Build style preset instructions based on videoStyle
    let customStyleDetails = "";
    if (videoStyle) {
      const lowerStyle = videoStyle.toLowerCase();
      if (lowerStyle === "cinematic") {
        customStyleDetails = "strictly cinematic photorealism, professional cinema color grading, anamorphic depth, 8k resolution, theatrical ambient lighting";
      } else if (lowerStyle === "cartoon" || lowerStyle === "anime") {
        customStyleDetails = "gorgeous hand-drawn cartoon anime aesthetic, high-fidelity modern illustration, cell-shaded, cinematic anime keyframe";
      } else if (lowerStyle === "realistic" || lowerStyle === "realistic-3d") {
        customStyleDetails = "hyper-detailed 3D octane render style, raytraced ambient occlusion, Unreal Engine 5 realism, pristine raytraced reflections, realistic lifelike textures";
      } else if (lowerStyle === "sketch") {
        customStyleDetails = "intricate hand-drawn monochrome pencil sketch on fine textured paper, detailed graphite shading, clean artistic pencil line art";
      }
    }

    // Auto-enhance prompt if requested
    if (enhancePrompt && prompt) {
      try {
        let systemPromptDetail = "Write a short, highly-detailed cinematic visual prompt for a video generator like Veo based on this simple prompt: \"" + prompt + "\". Focus only on lighting, movement, textures, camera work, and rich environmental details. Under 60 words. Do not write introductory words or conversational text, just return the prompt itself.";
        
        if (videoQuality === "high") {
          systemPromptDetail = "Write an exceptionally rich, highly detailed cinematic masterpiece prompt for a video generator like Veo based on: \"" + prompt + "\". Include advanced photographic descriptors, volumetric lighting, hyper-realistic textures, intricate micro-movements, professional color grading, and maximum environmental depth. Under 80 words. No intro or conversational filler, just the prompt.";
        } else if (videoQuality === "performance") {
          systemPromptDetail = "Write a fast-rendering, clean visual scene prompt for a video generator like Veo based on: \"" + prompt + "\". Keep focus on clear subjects, bright clean lighting, and simple linear movements. Under 40 words. No intro, just the prompt.";
        }

        // Apply videoStyle custom style details
        if (customStyleDetails) {
          systemPromptDetail += `\n\nSTYLE INSTRUCTION: Ensure the visual aesthetics strictly adhere to: ${customStyleDetails}. Ensure everything matches this stylistic look.`;
        }

        // Apply style preset instructions if active
        if (stylePreset && stylePreset !== "auto") {
          let styleDetails = "";
          if (stylePreset === "cinematic") styleDetails = "strictly cinematic photorealism, professional cinema color grading, anamorphic depth, 8k resolution, theatrical ambient lighting";
          else if (stylePreset === "cyberpunk") styleDetails = "neon cyberpunk aesthetic, glowing retro futuristic city, rain-slicked wet pavement, volumetric neon light scattering, synthwave vibes";
          else if (stylePreset === "anime") styleDetails = "gorgeous hand-drawn anime aesthetic, high-fidelity modern illustration, cell-shaded, cinematic anime keyframe";
          else if (stylePreset === "studio-ghibli") styleDetails = "whimsical hand-painted Studio Ghibli style, lush watercolor landscapes, soft warm nostalgia, detailed whimsical hand-drawn background";
          else if (stylePreset === "vhs") styleDetails = "nostalgic retro VHS analog tape look, subtle color aberrations, warm vintage glow, authentic video tracking textures";
          else if (stylePreset === "realistic-3d") styleDetails = "hyper-detailed 3D octane render style, raytraced ambient occlusion, Unreal Engine 5 realism, pristine raytraced reflections";
          else if (stylePreset === "fantasy-dream") styleDetails = "surreal fantasy dreamscape, glowing ethereal particles, magical whimsical lighting, soft cinematic volumetric fog";
          else if (stylePreset === "film-noir") styleDetails = "classic 1940s film noir, dramatic high-contrast chiaroscuro shadows, moody atmosphere, cinematic black and white realism";
          else if (stylePreset === "nature-8k") styleDetails = "breathtaking 8k nature photography, ultra-detailed textures, crisp organic details, majestic National Geographic natural lighting";
          else if (stylePreset === "sketch") styleDetails = "intricate hand-drawn monochrome pencil sketch on fine textured paper, detailed graphite shading, clean artistic pencil line art";
          else if (stylePreset === "oil-painting") styleDetails = "classical fine art textured oil painting on canvas, heavy impasto brushstrokes, rich classical paint textures, moody fine art lighting";
          
          if (styleDetails) {
            systemPromptDetail += `\n\nSTYLE INSTRUCTION: Ensure the visual aesthetics strictly adhere to: ${styleDetails}. Ensure everything matches this stylistic look.`;
          }
        }

        // Apply camera direction instructions if active
        if (cameraDirection && cameraDirection !== "auto") {
          let cameraDetails = "";
          if (cameraDirection === "zoom-in") cameraDetails = "smooth continuous slow dolly zoom-in towards the subject, magnifying focal points and creating deep focal immersion";
          else if (cameraDirection === "zoom-out") cameraDetails = "smooth slow dolly zoom-out revealing the expansive ambient background scenery, widening the focal field";
          else if (cameraDirection === "pan-left") cameraDetails = "smooth horizontal tracking camera pan sliding from right to left across the scene";
          else if (cameraDirection === "pan-right") cameraDetails = "smooth horizontal tracking camera pan sliding from left to right across the scene";
          else if (cameraDirection === "tilt-up") cameraDetails = "dramatic vertical camera pedestal ascent tilting slowly up towards the sky/horizon";
          else if (cameraDirection === "tilt-down") cameraDetails = "dramatic vertical camera pedestal descent tilting slowly down focusing on the central subject";
          else if (cameraDirection === "orbit") cameraDetails = "sweeping circular 360-degree rotational camera orbit crane shot circling the main focal point";
          
          if (cameraDetails) {
            systemPromptDetail += `\n\nCAMERA MOTION INSTRUCTION: Explicitly write the visual action and camera work to perform a ${cameraDetails}. Make this movement prominent and clear in the scene's motion descriptors.`;
          }
        }

        // Apply motion intensity instructions
        if (motionIntensity !== undefined) {
          if (motionIntensity <= 3) {
            systemPromptDetail += "\n\nMOTION LEVEL INSTRUCTION: The physical motion of subjects, fluids, and particles in the scene must be extremely slow, subtle, and gently drifting. Avoid fast changes or sudden actions.";
          } else if (motionIntensity >= 8) {
            systemPromptDetail += "\n\nMOTION LEVEL INSTRUCTION: The scene must feature highly dynamic, hyper-active, fast-paced physical action. Subjects, wind, particles, and environments should undergo energetic, swift, and highly kinetic movements.";
          } else {
            systemPromptDetail += "\n\nMOTION LEVEL INSTRUCTION: Keep the scene physical actions and subject motion balanced, steady, and at a standard cinematic pacing.";
          }
        }

        // Apply advanced "Reality Engine" heuristics to remove "AI look"
        if (videoRealismStyle === "documentary") {
          systemPromptDetail += " IMPORTANT: The final output must describe a RAW, authentic, high-fidelity real-life documentary scene. Explicitly include natural, non-perfect, non-glossy real-world textures (like skin pores, dirt, natural fabric fibers, concrete grain, natural grass). Use words like: 'National Geographic photo, award-winning journalism footage, raw natural sunlight, handheld camera motion, organic physical motion'. Avoid and exclude any words depicting CGI, 3D render, glossy plastic, perfectly smooth skin, vector art, or neon digital glow.";
        } else if (videoRealismStyle === "imax") {
          systemPromptDetail += " IMPORTANT: The final output must describe a majestic, hyper-realistic cinematic masterpiece with the texture of real 70mm IMAX film. Explicitly incorporate terms like: 'shot on 70mm IMAX camera, anamorphic lens flare, deep depth of field, realistic light scattering, atmospheric volumetric dust particles, photorealistic materials, dramatic real-world shadows'. Exclude any saturated video game aesthetics, vector-drawn lines, synthetic airbrushing, or generic AI smoothness.";
        } else if (videoRealismStyle === "analog_film") {
          systemPromptDetail += " IMPORTANT: The final output must replicate authentic nostalgic 35mm film stock, such as Kodak Portra. Explicitly specify: 'raw 35mm film photography, natural organic film grain, subtle vintage warm color grading, realistic lens imperfections, soft focus falloff, atmospheric volumetric light, candid capture'. Avoid anything suggesting a modern digital sensor, cartoon, render, flat vector, or artificial CGI smoothing.";
        }

        // Apply seamless looping constraint if requested
        if (loopVideo) {
          systemPromptDetail += " IMPORTANT: Structure the visual action, camera movement, and subject activity as a seamless, infinite loop. The final frame of the video MUST perfectly align and blend with the starting frame in composition, light direction, subject position, and velocity, allowing for endless repeat playback without any visual jump cuts or sudden transitions.";
        }

        const enhancementRes = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: systemPromptDetail,
        });
        if (enhancementRes.text) {
          finalPrompt = enhancementRes.text.trim();
          console.log("Veo prompt enhanced with " + videoQuality + " (" + videoRealismStyle + ", loop=" + loopVideo + ") mode to:", finalPrompt);
        }
      } catch (err) {
        console.warn("Prompt enhancement failed, using original:", err);
      }
    }

    // If prompt was not auto-enhanced, append custom style descriptors directly
    if ((!enhancePrompt || finalPrompt === prompt) && customStyleDetails && prompt) {
      finalPrompt += `, styled in ${customStyleDetails}`;
    }

    // Append strong looping suffix to ensure the video generation engine produces matching start and end states
    if (loopVideo) {
      finalPrompt += ", seamless loop, perfectly looping, starting and ending frames match perfectly, infinite looping animation";
    }

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: resolution || "720p",
      aspectRatio: aspectRatio || "16:9",
      durationSeconds: Number(videoDuration) || 8
    };

    const payload: any = {
      model,
      prompt: finalPrompt,
      config: videoConfig
    };

    // If starting image is provided (as base64 data URL, pure base64, or direct HTTP/HTTPS URL)
    if (image) {
      let imageBytes = image;
      let mimeType = "image/png";

      if (image.startsWith("http://") || image.startsWith("https://")) {
        try {
          console.log(`[Veo server] Fetching image from remote URL: ${image}`);
          const imgResponse = await fetch(image);
          if (!imgResponse.ok) {
            throw new Error(`Failed to fetch remote image (HTTP ${imgResponse.status})`);
          }
          const arrayBuffer = await imgResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          imageBytes = buffer.toString("base64");
          
          // Try to get contentType from response headers
          const contentType = imgResponse.headers.get("content-type");
          if (contentType) {
            mimeType = contentType;
          }
        } catch (fetchErr: any) {
          console.error("[Veo server] Remote image fetch failed:", fetchErr);
          return res.status(400).json({ error: `Failed to fetch remote seed image: ${fetchErr.message}` });
        }
      } else if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        imageBytes = parts[1];
      }

      payload.image = {
        imageBytes,
        mimeType
      };

      // Set inputImage inside config for strict new-model schema alignment
      videoConfig.inputImage = {
        imageBytes,
        mimeType
      };
    }

    // Prepare a safe, clean copy of the payload for console debugging
    const debugPayload = {
      model: payload.model,
      prompt: payload.prompt,
      config: {
        ...payload.config,
        ...(payload.config?.inputImage ? {
          inputImage: {
            mimeType: payload.config.inputImage.mimeType,
            imageBytes: `[BASE64_TRUNCATED, LENGTH: ${payload.config.inputImage.imageBytes?.length || 0}]`
          }
        } : {})
      },
      ...(payload.image ? {
        image: {
          mimeType: payload.image.mimeType,
          imageBytes: `[BASE64_TRUNCATED, LENGTH: ${payload.image.imageBytes?.length || 0}]`
        }
      } : {})
    };

    console.log("[Veo server] Executing ai.models.generateVideos with the following sanitized payload:");
    console.log(JSON.stringify(debugPayload, null, 2));

    let operation;
    try {
      operation = await ai.models.generateVideos(payload);
      console.log("[Veo server] API call succeeded! Received Operation Name:", operation?.name);
    } catch (apiError: any) {
      console.error("[Veo server] Error returned directly from GoogleGenAI API call:", apiError);
      throw apiError; // bubble up to general catch block
    }

    return res.json({ 
      operationName: operation.name,
      enhancedPrompt: finalPrompt !== prompt ? finalPrompt : undefined
    });
  } catch (error: any) {
    console.error("[Veo server] Veo video generation error occurred:", error);
    const cleanMsg = formatGoogleGenAIError(error);
    console.log("[Veo server] Formatted user-facing error message:", cleanMsg);
    return res.status(500).json({ 
      error: cleanMsg 
    });
  }
});

// API route alias for direct compatibility with custom payloads (motion_bucket_id, steps, audio_sync)
app.post("/api/generate-video", aiHeavyLimiter.middleware(), async (req, res) => {
  try {
    const activeApiKey = getActiveApiKey(req);
    const ai = getAiClient(req);

    const maskedKey = activeApiKey.length > 8 
      ? `${activeApiKey.slice(0, 6)}...${activeApiKey.slice(-4)}` 
      : "***REDACTED***";
    console.log(`[Veo server direct] GEMINI_API_KEY retrieved successfully (Length: ${activeApiKey.length}, Masked: ${maskedKey})`);

    const { 
      prompt, 
      image_url,
      image,
      negative_prompt,
      motion_bucket_id = 140,
      steps = 30,
      fps = 24,
      audio_sync = true,
      modelChoice = "veo-3.1-lite-generate-preview",
      aspectRatio = "16:9"
    } = req.body;

    let model = "veo-3.1-lite-generate-preview";
    if (modelChoice === "veo-core" || modelChoice === "veo-3.1-generate-preview") {
      model = "veo-3.1-generate-preview";
    }

    let finalPrompt = prompt || "Cinematic masterpiece video, professional lighting, photorealistic";
    if (negative_prompt) {
      finalPrompt += `, negative: ${negative_prompt}`;
    }

    // Map motion_bucket_id (0-255) to prompt-based motion instructions
    const motionInt = Math.min(10, Math.max(1, Math.round((motion_bucket_id || 140) / 25)));
    if (motionInt >= 8) {
      finalPrompt += ", highly dynamic cinematic motion, hyperactive physics, fast pacing";
    } else if (motionInt <= 3) {
      finalPrompt += ", extremely subtle cinematic motion, gentle slow motion, serene movement";
    } else {
      finalPrompt += ", natural steady cinematic movement, balanced pacing";
    }

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: aspectRatio
    };

    const payload: any = {
      model,
      prompt: finalPrompt,
      config: videoConfig
    };

    const sourceImage = image || image_url;
    if (sourceImage) {
      let imageBytes = sourceImage;
      let mimeType = "image/png";

      if (typeof sourceImage === "string" && sourceImage.startsWith("http")) {
        try {
          const fetchRes = await fetch(sourceImage);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageBytes = buffer.toString("base64");
            mimeType = fetchRes.headers.get("content-type") || "image/png";
          }
        } catch (e) {
          console.warn("Failed to fetch image_url on server:", e);
        }
      } else if (typeof sourceImage === "string" && sourceImage.includes(";base64,")) {
        const parts = sourceImage.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        imageBytes = parts[1];
      }

      payload.image = {
        imageBytes,
        mimeType
      };
    }

    // Prepare a safe, clean copy of the payload for console debugging
    const debugPayload = {
      model: payload.model,
      prompt: payload.prompt,
      config: payload.config,
      ...(payload.image ? {
        image: {
          mimeType: payload.image.mimeType,
          imageBytes: `[BASE64_TRUNCATED, LENGTH: ${payload.image.imageBytes?.length || 0}]`
        }
      } : {})
    };

    console.log("[Veo server direct] Executing ai.models.generateVideos with the following sanitized payload:");
    console.log(JSON.stringify(debugPayload, null, 2));

    let operation;
    try {
      operation = await ai.models.generateVideos(payload);
      console.log("[Veo server direct] API call succeeded! Received Operation Name:", operation?.name);
    } catch (apiError: any) {
      console.error("[Veo server direct] Error returned directly from GoogleGenAI API call:", apiError);
      throw apiError; // bubble up to general catch block
    }

    return res.json({ 
      operationName: operation.name,
      enhancedPrompt: finalPrompt,
      status: "Initializing Motion Vector...",
      motion_bucket_id,
      steps,
      audio_sync,
      fps
    });
  } catch (error: any) {
    console.error("[Veo server direct] Direct generate-video error:", error);
    const cleanMsg = formatGoogleGenAIError(error);
    console.log("[Veo server direct] Formatted user-facing error message:", cleanMsg);
    return res.status(500).json({ 
      error: cleanMsg 
    });
  }
});

// API route to poll the status of a Veo AI video generation
app.post("/api/video/status", async (req, res) => {
  try {
    const ai = getAiClient(req);
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required in the body." });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    
    return res.json({
      done: updated.done || false,
      error: updated.error || null,
      response: updated.response || null
    });
  } catch (error: any) {
    console.error("Veo video status check error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to retrieve video status." 
    });
  }
});

// API route to stream/download the generated Veo video binary
app.post("/api/video/download", async (req, res) => {
  try {
    const activeApiKey = getActiveApiKey(req);
    const ai = getAiClient(req);
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required." });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video URI not found or video is not ready yet." });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': activeApiKey },
    });
    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: "Failed to fetch video from upstream Google servers." });
    }

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("Veo video download error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to download generated video." 
    });
  }
});

// API route to shorten a URL utilizing high-availability failsafe providers (is.gd with tinyurl.com fallback)
app.post("/api/url/shorten", urlShortenerLimiter.middleware(), async (req, res) => {
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

    // SSRF Validation: Block internal/loopback/cloud-metadata addresses
    try {
      const parsedUrl = new URL(targetUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return res.status(400).json({ error: "Only standard HTTP and HTTPS URLs can be shortened." });
      }
      const hostLower = parsedUrl.hostname.toLowerCase();
      if (
        hostLower === "localhost" ||
        hostLower === "127.0.0.1" ||
        hostLower === "0.0.0.0" ||
        hostLower === "::1" ||
        hostLower === "169.254.169.254" ||
        hostLower.endsWith(".internal") ||
        hostLower.endsWith(".local")
      ) {
        return res.status(400).json({ error: "Prohibited URL: Internal network and cloud metadata addresses cannot be shortened." });
      }
    } catch (e) {
      return res.status(400).json({ error: "Invalid target URL syntax." });
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

// ==========================================
// Gemini Multi-Turn Chat API Endpoint
// ==========================================
app.post("/api/gemini/chat", aiLightLimiter.middleware(), async (req, res) => {
  try {
    const aiClient = getAiClient(req);
    const { history, message, modelChoice = "gemini-3.5-flash", systemRole = "general" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A valid non-empty message string is required." });
    }

    if (message.length > 25000) {
      return res.status(400).json({ error: "Message length exceeds the 25,000 character maximum permitted for safety." });
    }

    const roleInstructions: Record<string, string> = {
      general: "You are a helpful, versatile, and articulate AI Studio assistant for digital creators, designers, and developers. Provide clean, well-formatted, structured answers.",
      code_expert: "You are an expert senior software engineer and system architect. Write clean TypeScript, React, and Node.js code following strict design patterns, performance optimization, and robust error handling.",
      design_guru: "You are a world-class UI/UX designer and design system architect. Provide actionable advice on color harmony, layout rhythm, micro-interactions, typography, and visual hierarchy.",
      fast_helper: "You are a lightning-fast assistant. Give ultra-concise, direct, bulleted answers without unnecessary conversational fluff.",
      copywriter: "You are a master brand copywriter and storyteller. Craft engaging, high-converting titles, descriptions, and creative messaging."
    };

    const systemInstruction = roleInstructions[systemRole] || systemRole || roleInstructions.general;

    let targetModel = "gemini-3.5-flash";
    if (modelChoice === "gemini-3.1-pro-preview") {
      targetModel = "gemini-3.1-pro-preview";
    } else if (modelChoice === "gemini-3.1-flash-lite") {
      targetModel = "gemini-3.1-flash-lite";
    }

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.content || item.text) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.content || item.text || "" }]
          });
        }
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    const response = await aiClient.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response?.text || "No response generated from Gemini.";
    return res.json({ reply: replyText, modelUsed: targetModel });
  } catch (error: any) {
    console.error("Gemini Multi-Turn Chat Endpoint Error:", error);
    return res.status(500).json({ error: formatGoogleGenAIError(error) });
  }
});

// HTTP server wrapper for WebSocket integration
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/live" });

// Active Live WebSocket connection tracker to prevent socket exhaustion
const activeLiveConnectionsPerIp = new Map<string, number>();
const MAX_LIVE_CONNECTIONS_PER_IP = 4;

// Handle WebSocket connection for Gemini Live API real-time audio interaction
wss.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
  const clientIp = getClientIp(req);
  const currentActive = activeLiveConnectionsPerIp.get(clientIp) || 0;
  if (currentActive >= MAX_LIVE_CONNECTIONS_PER_IP) {
    console.warn(`[Security Alert] Max concurrent Live API WebSocket connections reached for IP: ${clientIp}`);
    clientWs.send(JSON.stringify({ error: "Too many simultaneous Live audio connections from this IP address." }));
    clientWs.close(1008, "Policy Violation: Rate limit exceeded");
    return;
  }
  activeLiveConnectionsPerIp.set(clientIp, currentActive + 1);

  const cleanupIpSocket = () => {
    const count = activeLiveConnectionsPerIp.get(clientIp) || 1;
    if (count <= 1) {
      activeLiveConnectionsPerIp.delete(clientIp);
    } else {
      activeLiveConnectionsPerIp.set(clientIp, count - 1);
    }
  };

  clientWs.on("close", cleanupIpSocket);

  console.log(`[Live API] Client connected to /live (IP: ${clientIp})`);
  let session: any = null;

  try {
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY environment variable is missing on server." }));
      clientWs.close();
      return;
    }

    const aiClient = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const reqUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const voiceName = reqUrl.searchParams.get("voice") || "Zephyr";
    const systemInstruction = reqUrl.searchParams.get("systemInstruction") || 
      "You are a helpful, conversational AI voice assistant for digital creators. Keep your answers concise, natural, and engaging.";

    session = await aiClient.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }

          const serverContent = message.serverContent as any;
          if (serverContent?.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              if (part.text && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ modelText: part.text }));
              }
            }
          }

          if (serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          console.log("[Live API] Session closed");
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ status: "closed" }));
          }
        },
        onerror: (err: any) => {
          console.error("[Live API] Session error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err.message || "Live API session error" }));
          }
        },
      },
    });

    clientWs.on("message", (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio && session) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (msg.text && session) {
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (e) {
        console.error("Error parsing WebSocket client message:", e);
      }
    });

    clientWs.on("close", () => {
      console.log("[Live API] Client WS disconnected");
      if (session) {
        try { session.close(); } catch (e) {}
      }
    });

    clientWs.on("error", (err) => {
      console.error("[Live API] Client WS error:", err);
      if (session) {
        try { session.close(); } catch (e) {}
      }
    });

  } catch (err: any) {
    console.error("[Live API] Connection error:", err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err.message || "Failed to initialize Live API session." }));
      clientWs.close();
    }
  }
});

// Centralized API 404 handler for unmatched /api routes
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: "Endpoint Not Found",
    message: `API endpoint ${req.method} ${req.path} does not exist.`
  });
});

// Centralized safe error handler for unhandled exceptions in routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Security Guard] Internal error caught:", err);
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : "Request Processing Failed",
    message: "A secure server processing error occurred. Please try again later."
  });
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
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server runs on port ${PORT}`);
    });
  }
}).catch((err) => {
  console.error("Failed to setup static/Vite middleware:", err);
});

export default app;
