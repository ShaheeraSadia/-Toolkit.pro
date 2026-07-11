import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
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

// API route to generate images using the gemini-3.1-flash-lite-image model
app.post("/api/image/generate", async (req, res) => {
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

    const { prompt, aspectRatio = "1:1", style = "none" } = req.body;
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

    const { modelChoice } = req.body;
    const targetModel = modelChoice === "gemini-3.1-flash-image" ? "gemini-3.1-flash-image" : "gemini-3.1-flash-lite-image";

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
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
        }
      }
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

// API route to auto-generate beautiful subtitle captions based on a prompt or audio track details
app.post("/api/video/generate-subtitles", async (req, res) => {
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

// API route to initiate Veo AI video generation
app.post("/api/video/generate", async (req, res) => {
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

    const { prompt, modelChoice, aspectRatio, resolution, image, enhancePrompt, videoQuality = "balanced", videoRealismStyle = "documentary", loopVideo = false } = req.body;
    
    // Choose model based on user preference and selected quality mode
    let model = "veo-3.1-lite-generate-preview";
    if (modelChoice === "veo-core" || modelChoice === "gemini-pro" || modelChoice === "veo-3.1-generate-preview" || videoQuality === "high") {
      model = "veo-3.1-generate-preview";
    } else if (videoQuality === "performance") {
      model = "veo-3.1-lite-generate-preview";
    }

    let finalPrompt = prompt || "Cinematic masterpiece video, professional lighting, photorealistic";

    // Auto-enhance prompt if requested
    if (enhancePrompt && prompt) {
      try {
        let systemPromptDetail = "Write a short, highly-detailed cinematic visual prompt for a video generator like Veo based on this simple prompt: \"" + prompt + "\". Focus only on lighting, movement, textures, camera work, and rich environmental details. Under 60 words. Do not write introductory words or conversational text, just return the prompt itself.";
        
        if (videoQuality === "high") {
          systemPromptDetail = "Write an exceptionally rich, highly detailed cinematic masterpiece prompt for a video generator like Veo based on: \"" + prompt + "\". Include advanced photographic descriptors, volumetric lighting, hyper-realistic textures, intricate micro-movements, professional color grading, and maximum environmental depth. Under 80 words. No intro or conversational filler, just the prompt.";
        } else if (videoQuality === "performance") {
          systemPromptDetail = "Write a fast-rendering, clean visual scene prompt for a video generator like Veo based on: \"" + prompt + "\". Keep focus on clear subjects, bright clean lighting, and simple linear movements. Under 40 words. No intro, just the prompt.";
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

    // Append strong looping suffix to ensure the video generation engine produces matching start and end states
    if (loopVideo) {
      finalPrompt += ", seamless loop, perfectly looping, starting and ending frames match perfectly, infinite looping animation";
    }

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: resolution || "720p",
      aspectRatio: aspectRatio || "16:9",
      loop: loopVideo
    };

    const payload: any = {
      model,
      prompt: finalPrompt,
      config: videoConfig
    };

    // If starting image is provided (as base64 data URL or pure base64)
    if (image) {
      let imageBytes = image;
      let mimeType = "image/png";

      if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        imageBytes = parts[1];
      }

      payload.image = {
        imageBytes,
        mimeType
      };
    }

    console.log("Calling ai.models.generateVideos with model:", model);
    const operation = await ai.models.generateVideos(payload);

    return res.json({ 
      operationName: operation.name,
      enhancedPrompt: finalPrompt !== prompt ? finalPrompt : undefined
    });
  } catch (error: any) {
    console.error("Veo video generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Video generation failed due to a server-side error." 
    });
  }
});

// API route to poll the status of a Veo AI video generation
app.post("/api/video/status", async (req, res) => {
  try {
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured." 
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
    const activeApiKey = process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured." 
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
