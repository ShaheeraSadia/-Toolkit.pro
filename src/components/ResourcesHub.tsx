import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ChevronRight, 
  ChevronDown,
  BookOpen, 
  CheckCircle, 
  HelpCircle,
  Share2, 
  TrendingUp, 
  Palette, 
  Zap, 
  QrCode, 
  Clock,
  Map,
  Copy,
  Check,
  Download,
  FileCode,
  Globe,
  Settings,
  Smartphone,
  Monitor,
  Sparkles,
  Video
} from "lucide-react";

import { triggerFileDownload } from "../lib/download";

const NODE_JS_SCRIPT_TEMPLATE = (siteRoot: string) => `/**
 * Toolkit Pro Suite - Client App Fetcher (NodeJS)
 * High-performance automated pipeline to fetch & serialize creator assets locally.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 INTIALIZING TOOLKIT DYNAMIC DOCK FETCHERS...');
const outputDir = path.join(process.cwd(), 'toolkit_sync_downloads');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Config lists for dynamic sync
const syncSources = [
  { 
    name: "workspace_status.json", 
    url: "${siteRoot}/api/health"
  }
];

// Sequential network downloader
syncSources.forEach(source => {
  const destination = path.join(outputDir, source.name);
  const fileStream = fs.createWriteStream(destination);
  
  https.get(source.url, (res) => {
    if (res.statusCode === 200) {
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(\`✅ [SUCCESS] Local App Fetcher compiled: \${source.name}\`);
      });
    } else {
      console.error(\`❌ [ERROR] Remote status code: \${res.statusCode}\`);
    }
  }).on('error', (err) => {
    fs.unlink(destination, () => {});
    console.error(\`❌ [ERROR] Network timeout: \${err.message}\`);
  });
});`;

const PYTHON_SCRIPT_CONTENT = `#!/usr/bin/env python3
"""
Toolkit Pro Suite - Aesthetic Downloader & Layout Fetcher (Python)
Automated local collector to pool system styles & color palettes natively.
"""
import os
import json
import urllib.request

print("⚡ Starting Python Style Config Downloader Fetcher...")
out_dir = "./toolkit_style_manifests"
if not os.path.exists(out_dir):
    os.makedirs(out_dir)

style_data = {
    "app_name": "Toolkit Pro Suite",
    "export_mode": "Automated Fetcher",
    "pwa_installed": True,
    "system_spectrum": {
        "slate_600": "#475569",
        "indigo_500": "#6366f1",
        "emerald_500": "#10b981",
        "deep_charcoal": "#0f172a"
    },
    "default_quote_preset": {
        "text": "Simplicity is the ultimate sophistication.",
        "author": "Leonardo da Vinci"
    }
}

manifest_path = os.path.join(out_dir, "app_layout_config.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(style_data, f, indent=2)

print(f"🎉 Successfully serialized custom system styles at: {manifest_path}")
print("✨ Local pipeline complete!")`;

const OFFLINE_HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toolkit Pro Suite - Independent Offline Client</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #6366f1;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .wrapper {
      max-width: 650px;
      width: 100%;
      background: var(--card-bg);
      padding: 35px;
      border-radius: 20px;
      border: 1px solid #1f2937;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    h1 {
      font-size: 24px;
      color: #818cf8;
      text-align: center;
      margin-top: 0;
    }
    p {
      color: var(--muted);
      font-size: 13.5px;
      line-height: 1.6;
      text-align: center;
    }
    .file-dropzone {
      border: 2px dashed #374151;
      border-radius: 14px;
      padding: 35px;
      text-align: center;
      background: rgba(17, 24, 39, 0.5);
      cursor: pointer;
      margin: 25px 0;
      transition: all 0.2s;
    }
    .file-dropzone:hover {
      border-color: var(--accent);
      background: rgba(99, 102, 241, 0.05);
    }
    input[type="file"] {
      display: none;
    }
    .render-sandbox {
      background: #0b0f19;
      border-radius: 12px;
      padding: 24px;
      margin-top: 20px;
      display: none;
      border: 1px solid #1f2937;
    }
    .output-text {
      font-size: 18px;
      font-weight: 500;
      line-height: 1.5;
    }
    .output-details {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 11px;
      color: var(--muted);
      border-t: 1px solid #1f2937;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>Toolkit Pro Suite Offline</h1>
    <p>This is a portable HTML visualizer wrapper compiled automatically. Use it to load and inspect exported creator config backups offline safely on your machine without server overhead.</p>
    
    <div class="file-dropzone" onclick="document.getElementById('offlineFile').click()">
      <span style="font-size: 28px;">🗂️</span>
      <p style="margin: 10px 0 0 0; font-weight: bold; color: #a5b4fc;">Import layout backup file (.json)</p>
      <input type="file" id="offlineFile" accept=".json" onchange="parseConfig(event)">
    </div>

    <div id="sandbox" class="render-sandbox">
      <div id="outText" class="output-text"></div>
      <div id="outDetails" class="output-details"></div>
    </div>
  </div>

  <script>
    function parseConfig(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const config = JSON.parse(evt.target.result);
          document.getElementById('sandbox').style.display = 'block';
          if (config.text) {
            document.getElementById('outText').textContent = '"' + config.text + '"';
            document.getElementById('outDetails').innerHTML = 
              '<span>Author: ' + (config.author || 'Anonymous') + '</span>' +
              '<span>Font: ' + (config.fontFamily || 'Inter') + '</span>';
          } else {
            document.getElementById('outText').innerHTML = '<pre style="font-size:11px; color:#34d399; margin:0; overflow-x:auto;">' + JSON.stringify(config, null, 2) + '</pre>';
            document.getElementById('outDetails').innerHTML = '<span>Type: Schema Package</span><span>Raw JSON source parsed</span>';
          }
        } catch(err) {
          alert("Error loading backup: Invalid JSON markup!");
        }
      };
      reader.readAsText(file);
    }
  </script>
</body>
</html>`;

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: "Design" | "Development" | "SEO" | "Technology";
  readTime: string;
  icon: any;
  content: string[];
  tips: string[];
}

interface ResourcesHubProps {
  selectedArticleId?: string | null;
  onSelectArticleId?: (id: string | null) => void;
  initialSubTab?: "articles" | "sitemap" | "seo-templates" | "installation" | "install-fetchers";
}

export default function ResourcesHub({
  selectedArticleId: propSelectedArticleId,
  onSelectArticleId: propOnSelectArticleId,
  initialSubTab: propInitialSubTab
}: ResourcesHubProps = {}) {
  const [localSelectedArticleId, setLocalSelectedArticleId] = useState<string | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const selectedArticleId = propSelectedArticleId !== undefined ? propSelectedArticleId : localSelectedArticleId;
  const [activeHeadKeywords, setActiveHeadKeywords] = useState<string>("");

  const setSelectedArticleId = (id: string | null) => {
    if (propOnSelectArticleId) {
      propOnSelectArticleId(id);
    } else {
      setLocalSelectedArticleId(id);
    }
    setExpandedFaqIndex(0);
  };

  useEffect(() => {
    const defaultKeywords = "toolkit suite, quote creator, image compressor, qr generator, color palette, google drive workspace, seo optimization";
    const keywordsMap: Record<string, string> = {
      "compression-guide": "image compression, reduce image size, lossy vs lossless, digital design, page speed, web compliance",
      "webp-vs-png-vs-jpg": "webp format, png vs jpeg, image file types, web performance benchmarks, alpha transparency, browser compatibility",
      "qr-code-encoding": "how qr codes work, reed-solomon error correction, alignment markers, qr code design, scan matrix standard",
      "pinterest-seo": "pinterest image seo, vertical pinboard ratios, viral website traffic, image search indexing, alt text optimization",
      "color-palette-extraction": "color quantization algorithm, median cut algorithm, 60-30-10 color rule, color palette extractor, wcag compliance, ui theme design",
      "workspace-workflow-optimization": "creative workspace productivity, cloud drive integration, google drive backup workflow, web design pipelines",
      "ux-color-psychology": "ux color psychology, conversion rate optimization, cro design, visual trust signals, button contrast compliance",
      "exif-image-metadata": "exif database extraction, prune image metadata, mobile web site optimization, gps photo tag deletion, core web vitals LCP",
      "core-web-vitals-vitals": "core web vitals metrics, cumulative layout shift index, visual stability design, responsive image frames, speed score",
      "ai-video-editing-workflows": "ai video editing, post-generation video editing, davinci resolve ai tools, adobe premiere pro, descript text editing, capcut auto subtitles"
    };

    const activeKeywords = selectedArticleId ? (keywordsMap[selectedArticleId] || defaultKeywords) : defaultKeywords;
    setActiveHeadKeywords(activeKeywords);
    
    // Find or create meta tag
    let metaTag = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "keywords";
      document.head.appendChild(metaTag);
    }
    metaTag.content = activeKeywords;

    // Dynamically update meta description representation in head
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (selectedArticleId) {
      const article = ARTICLES.find(a => a.id === selectedArticleId);
      if (article && descTag) {
        if (!descTag.getAttribute("original-content")) {
          descTag.setAttribute("original-content", descTag.content || "");
        }
        descTag.content = article.excerpt;
      }
    } else {
      if (descTag) {
        const originalDesc = descTag.getAttribute("original-content") || "Premium productivity tools featuring Quote Creator, Image Compressor, QR Code Maker, Color Palette and Google Drive.";
        descTag.content = originalDesc;
      }
    }
  }, [selectedArticleId]);
  const [subTab, setSubTab] = useState<"articles" | "sitemap" | "seo-templates" | "installation" | "install-fetchers">(
    propInitialSubTab || "articles"
  );

  useEffect(() => {
    if (propInitialSubTab) {
      setSubTab(propInitialSubTab);
    }
  }, [propInitialSubTab]);

  const [siteRoot, setSiteRoot] = useState<string>(
    typeof window !== "undefined" ? window.location.origin : "https://toolkit-pro-chi.vercel.app"
  );
  const [copiedUrlIndex, setCopiedUrlIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Install App & Downloader Fetchers States
  const [activeFetcherPlatform, setActiveFetcherPlatform] = useState<"node" | "python" | "html">("node");
  const [copiedFetcherField, setCopiedFetcherField] = useState<string | null>(null);

  // SEO Template States
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>("compress");
  const [seoBrandName, setSeoBrandName] = useState<string>("ToolkitPro");
  const [seoFocusKeyword, setSeoFocusKeyword] = useState<string>("free image compressor");
  const [seoPrimaryGoal, setSeoPrimaryGoal] = useState<string>("compress JPEG, PNG, and WebP format without losing quality");
  const [copiedSeoField, setCopiedSeoField] = useState<string | null>(null);
  const [showSeoTutorial, setShowSeoTutorial] = useState<boolean>(true);

  // Gemini-Powered SEO AI States
  const [aiGeneratedSeo, setAiGeneratedSeo] = useState<{
    title: string;
    description: string;
    keywords: string[];
    socialTitle: string;
    socialDescription: string;
    optimizationTips: string[];
  } | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleGenerateAiSeo = async () => {
    setIsAiGenerating(true);
    setAiGenerationError(null);
    try {
      const activePreset = SEO_PAGE_PRESETS.find(p => p.id === selectedSeoPage) || SEO_PAGE_PRESETS[0];
      const resp = await fetch("/api/seo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagePreset: activePreset.name,
          brandName: seoBrandName,
          focusKeyword: seoFocusKeyword,
          userGoal: seoPrimaryGoal,
          currentTitle: activePreset.defaultTitle,
          currentDesc: activePreset.defaultDesc
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error! status: ${resp.status}`);
      }

      const generatedData = await resp.json();
      if (generatedData && generatedData.title && generatedData.description) {
        setAiGeneratedSeo(generatedData);
      } else {
        throw new Error("Invalid response received from the Gemini AI model.");
      }
    } catch (err: any) {
      console.error("AI SEO generate error:", err);
      setAiGenerationError(err.message || "Failed to generate AI-optimized tags. Try again.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const SEO_PAGE_PRESETS = [
    {
      id: "quote",
      name: "Quote Designer Workspace",
      defaultKeyword: "online quote designer",
      defaultGoal: "create gorgeous personalized visual quote cards with gradient backgrounds",
      defaultTitle: "Quote Designer | Custom Visual Quotes Maker",
      defaultDesc: "Create gorgeous personalized visual quote cards, choose beautiful background gradients, and sync images straight to Google Drive dynamically.",
      path: ""
    },
    {
      id: "compress",
      name: "Image Compressor Pro",
      defaultKeyword: "free web image compressor",
      defaultGoal: "compress JPEG, PNG, and WebP photos without losing visual quality",
      defaultTitle: "Image Compressor Pro | Reduce Image Sizes & Optimize Speed",
      defaultDesc: "Reduce image file sizes for JPG, PNG, and WebP formats using modern lossy and lossless algorithms. Clean camera metadata vectors for superb Core Web Vitals.",
      path: "?tab=compress"
    },
    {
      id: "qr",
      name: "QR Code Generator Hub",
      defaultKeyword: "custom qr code generator",
      defaultGoal: "generate high-density compliant QR codes with customizable Reed-Solomon levels",
      defaultTitle: "QR Code Generator Pro | Dynamic Error-Correction Matrix",
      defaultDesc: "Generate compliant custom QR codes with adjustable Reed-Solomon error correction ratios. Preview scanner blocks instantly and download as clean PNG vector streams.",
      path: "?tab=qr"
    },
    {
      id: "palette",
      name: "Aesthetic Color Palette Extractor",
      defaultKeyword: "color palette extractor from image",
      defaultGoal: "extract balanced color palettes from any photograph using Median Cut quantization",
      defaultTitle: "Color Palette Extractor | Quantize Dominant Chromatisms",
      defaultDesc: "Identify dominant color clusters with Median Cut quantization, analyze WCAG double-A contrast compliance rates, and export compliant CSS hexadecimal lists.",
      path: "?tab=palette"
    },
    {
      id: "drive",
      name: "Cloud Drive Explorer Pane",
      defaultKeyword: "google drive asset sync",
      defaultGoal: "sync and backup your creative assets directly to a Google Drive folder structure",
      defaultTitle: "Google Drive Cloud Explorer | Integrated Asset Sync Workspace",
      defaultDesc: "Securely link your creative workspace tools to Google Drive. Browse, search, preview, and auto-sync produced visual files in a unified workspace layout.",
      path: "?tab=drive"
    },
    {
      id: "guides",
      name: "AdSense Content Index Hub",
      defaultKeyword: "seo optimization guides",
      defaultGoal: "read original educational publications on site performance, meta configurations, and image indexing",
      defaultTitle: "Creative Editorial Guides & SEO Manuals Hub",
      defaultDesc: "Discover high-value original articles, tutorials, and sitemap utilities. Meet strict publisher guidelines with optimized image compression and structured data.",
      path: "?tab=resources"
    },
    {
      id: "custom",
      name: "Custom / Dynamic Page Context",
      defaultKeyword: "your target keyword",
      defaultGoal: "your specific digital service goal",
      defaultTitle: "My Brand Customized High-Converting Landing Page",
      defaultDesc: "Describe how your helpful modern web application resolves key user challenges with lightning-fast speeds and reliable performance.",
      path: "?tab=custom"
    }
  ];

  useEffect(() => {
    const preset = SEO_PAGE_PRESETS.find(p => p.id === selectedSeoPage);
    if (preset) {
      setSeoFocusKeyword(preset.defaultKeyword);
      setSeoPrimaryGoal(preset.defaultGoal);
    }
    setAiGeneratedSeo(null);
    setAiGenerationError(null);
  }, [selectedSeoPage]);

  const SITEMAP_URLS = [
    { url: "", alias: "Home (Quote Designer)", priority: "1.0", changefreq: "daily", description: "Primary creative quote composer workspace." },
    { url: "?tab=compress", alias: "Image Compressor Pro", priority: "0.9", changefreq: "weekly", description: "Lossless / lossy premium web image compiler." },
    { url: "?tab=qr", alias: "QR Code Matrix Gen", priority: "0.9", changefreq: "weekly", description: "Dynamic Reed-Solomon scanning coordinates generator." },
    { url: "?tab=palette", alias: "Aesthetic Color Extractor", priority: "0.8", changefreq: "weekly", description: "Median Cut palette quantifier and contrast checks." },
    { url: "?tab=drive", alias: "Cloud Drive Explorer Pane", priority: "0.8", changefreq: "daily", description: "Archived asset review and Workspace synchronizer." },
    { url: "?tab=resources", alias: "AdSense Content Index Hub", priority: "0.7", changefreq: "daily", description: "Root list of high-value creator articles and guides." },
    { url: "?tab=resources&amp;article=compression-guide", alias: "Guide: Compression Optimization", priority: "0.6", changefreq: "monthly", description: "Deep dive editorial on photo algorithms." },
    { url: "?tab=resources&amp;article=webp-vs-png-vs-jpg", alias: "Guide: Next-Gen Web Formats", priority: "0.6", changefreq: "monthly", description: "WebP, PNG, and JPEG formatting comparison." },
    { url: "?tab=resources&amp;article=qr-code-encoding", alias: "Guide: QR Matrix Standard", priority: "0.6", changefreq: "monthly", description: "Engineering behind physical scan blocks." },
    { url: "?tab=resources&amp;article=pinterest-seo", alias: "Guide: Pinboards Image SEO", priority: "0.6", changefreq: "monthly", description: "Viral vertical image SEO methodologies." },
    { url: "?tab=resources&amp;article=color-palette-extraction", alias: "Guide: Design Color Coding", priority: "0.6", changefreq: "monthly", description: "Quantization, Median Cut, and 60-30-10 styling guide." },
    { url: "?tab=resources&amp;article=workspace-workflow-optimization", alias: "Guide: Workspace Workflow Optimization", priority: "0.6", changefreq: "monthly", description: "System guidelines on high-productivity design mechanics." },
    { url: "?tab=resources&amp;article=ux-color-psychology", alias: "Guide: UX Color Psychology & CRO", priority: "0.6", changefreq: "monthly", description: "Subconscious user response triggers and conversion ratios." },
    { url: "?tab=resources&amp;article=exif-image-metadata", alias: "Guide: EXIF Metadata Performance", priority: "0.6", changefreq: "monthly", description: "How stripping hidden photo headers improves mobile site speeds." },
    { url: "?tab=resources&amp;article=core-web-vitals-vitals", alias: "Guide: Core Web Vitals & CLS", priority: "0.6", changefreq: "monthly", description: "Technical audits on eliminating dynamic layout shifts." },
    { url: "?tab=resources&amp;article=ai-video-editing-workflows", alias: "Guide: AI Video Workflows", priority: "0.6", changefreq: "monthly", description: "Deep dive on post-generation and traditional editors." },
    { url: "?tab=legal&amp;sub=privacy", alias: "Legal: Privacy Protection Policy", priority: "0.5", changefreq: "yearly", description: "AdSense cookies declarations and safety rules." },
    { url: "?tab=legal&amp;sub=terms", alias: "Legal: Terms & Conditions", priority: "0.5", changefreq: "yearly", description: "Permitted usage parameters and liability disclaimers." },
    { url: "?tab=legal&amp;sub=about", alias: "About: Creator Profile", priority: "0.5", changefreq: "yearly", description: "Development background of Shaheera Sadia." },
    { url: "?tab=legal&amp;sub=contact", alias: "Contact: Developer Support Registry", priority: "0.5", changefreq: "yearly", description: "Encrypted submission and support request form." }
  ];

  const generateXmlString = (originUrl: string) => {
    const cleanOrigin = originUrl.endsWith("/") ? originUrl.slice(0, -1) : originUrl;
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generated automatically by Toolkit Pro Suite Indexer -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    const xmlFooter = `\n</urlset>`;
    const today = new Date().toISOString().split("T")[0];
    
    const body = SITEMAP_URLS.map(item => {
      const cleanUrl = item.url ? `${cleanOrigin}/${item.url}` : cleanOrigin;
      return `  <url>
    <loc>${cleanUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
    }).join("\n");

    return `${xmlHeader}\n${body}${xmlFooter}`;
  };

  const downloadXmlFile = () => {
    const xml = generateXmlString(siteRoot);
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    triggerFileDownload(blob, "sitemap.xml");
  };

  const handleCopyAll = () => {
    const xml = generateXmlString(siteRoot);
    navigator.clipboard.writeText(xml);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingleNode = (index: number, urlSuffix: string) => {
    const cleanOrigin = siteRoot.endsWith("/") ? siteRoot.slice(0, -1) : siteRoot;
    const cleanUrl = urlSuffix ? `${cleanOrigin}/${urlSuffix}` : cleanOrigin;
    const today = new Date().toISOString().split("T")[0];
    const item = SITEMAP_URLS[index];
    const nodeXml = `<url>
  <loc>${cleanUrl}</loc>
  <lastmod>${today}</lastmod>
  <changefreq>${item.changefreq}</changefreq>
  <priority>${item.priority}</priority>
</url>`;
    
    navigator.clipboard.writeText(nodeXml);
    setCopiedUrlIndex(index);
    setTimeout(() => setCopiedUrlIndex(null), 2000);
  };

  const ARTICLES: Article[] = [
    {
      id: "compression-guide",
      title: "How to Compress Images Without Losing Quality",
      excerpt: "Learn the secrets of lossy vs. lossless compression algorithms and how to compress high-res digital assets without compromising visual integrity.",
      category: "Design",
      readTime: "4 min read",
      icon: Zap,
      content: [
        "Digital developers and designers often face a classic trade-off: loading speeds versus high-fidelity image visuals. A heavy image drains server parameters, causes layout shift, and hurts user engagement scores. The solution lies in applying precision compression algorithms.",
        "Lossy compression achieves superior file reduction ratios by discarding microscopic pixel details that are virtually imperceptible to the human eye. Algorithms like JPEG compress luminance and chrominance fields based on psychoacoustic and psychovisual limits. This allows for file sizes up to 80% smaller while maintaining stunning display fidelity.",
        "Lossless compression, on the other hand, ensures byte-for-byte fidelity. Algorithms like DEFLATE or LZW repack metadata structures and repeat pixel sequences internally without altering color values. It is ideal for line art, high-contrast flat diagrams, or illustrations requiring complete transparency support.",
        "When utilizando our online Web-based Compressor, we configure standard canvas processing. The source image is dynamically downscaled or converted with customizable canvas filters, yielding ultra-compact results ready for quick Google Drive organization and deployment."
      ],
      tips: [
        "For photographic banners, always target a compression ratio of 75% to 85% to balance speed and visual clarity.",
        "Always purge unnecessary EXIF data strings from production client bundles.",
        "Integrate responsive picture elements (<picture>) to serve custom resolutions for mobile grids."
      ]
    },
    {
      id: "webp-vs-png-vs-jpg",
      title: "PNG vs JPG vs WebP: Which Format is Best?",
      excerpt: "Decide between WebP, PNG, and JPG. Discover how modern formats stack up in web performance benchmarks, transparency support, and browser compliance.",
      category: "Development",
      readTime: "5 min read",
      icon: FileText,
      content: [
        "In the early era of the web, choice was severely limited. Today, developers can choose between several standardized compression structures. Selecting the incorrect type of image asset causes excessive site weight or broken transparency values.",
        "PNG (Portable Network Graphics) is a lossless format designed as a successor to GIF. It supports full alpha channels for smooth transparency layers, making it the perfect choice for complex logos, illustrations, or website icons that overlay diverse backgrounds.",
        "JPG (or JPEG) is standard for natural photographs. JPG leverages lossy mathematical grids to downsize file sizes dramatically. However, it lacks transparency support, and compressing JPG files iteratively introduces artifact halos and pixelated borders.",
        "WebP is the modern powerhouse developed by Google. WebP is highly superior because it provides both lossy and lossless compression capabilities in a single container format. On average, WebP offers 26% smaller file sizes than PNGs and 25-34% smaller file sizes than comparable JPGs, all with full transparency and metadata preservation."
      ],
      tips: [
        "Use WebP as your main fallback image format for all website layouts in 2026.",
        "Retain PNG files only where precise pixel-for-pixel rendering is mandatory, such as high-contrast mathematical grids or barcodes.",
        "Leverage automated converters to transcode historic catalogs into next-generation formats."
      ]
    },
    {
      id: "qr-code-encoding",
      title: "How QR Codes Work Explained Simply",
      excerpt: "Unveil the engineering behind Quick Response (QR) codes, from black-and-white data patterns and quiet zones to Reed-Solomon error correction matrices.",
      category: "Technology",
      readTime: "4 min read",
      icon: QrCode,
      content: [
        "Quick Response codes are two-dimensional symbol grids invented in 1994 by Denso Wave. Initially crafted to track automotive components during manufacturing, they have evolved into the universal bridge linking physical collateral with the visual web.",
        "At their core, QR codes use binary matrix structures. Black modules represent binary one (high voltage state), and white modules represent binary zero (low voltage state). Special concentric square targets placed at three corners act as position alignment anchors. This enables mobile scanners to recognize orientation and scale regardless of skew.",
        "The absolute secret to QR stability is Reed-Solomon Error Correction. This mathematical coding can reconstruct missing, stained, or torn portions of the code. Error correction levels are categorized from Low (7% recovery) and Medium (15% recovery) to Quartile (25% recovery) and High (30% recovery).",
        "Our QR Toolkit automatically provisions dynamic alignment markers, quite zone parameters, and compliant Reed-Solomon ratios, delivering print-ready QR codes in vector PNG or inline canvas styles."
      ],
      tips: [
        "Maintain a high contrast ratio between foreground modules and the surrounding canvas background.",
        "Apply a solid 'Quiet Zone' border equal to at least 4 module widths around the QR code.",
        "If you integrate logo images in the center cross-section, utilize Level H error correction (30% redundancy)."
      ]
    },
    {
      id: "pinterest-seo",
      title: "Pinterest Image SEO: The Developer's Secret to 71.9k Views",
      excerpt: "An insider look into algorithmic pinning strategies, vertical ratio formatting, keyword metadata structures, and driving organic viral traffic to utility tools.",
      category: "SEO",
      readTime: "6 min read",
      icon: TrendingUp,
      content: [
        "Pinterest operates as a visual search engine rather than a traditional social hub. This means Pins have an exceptional shelf life—often continuing to pull organic eyeballs and referral clicks months or years after original deployment.",
        "To break through the visual recommendations timeline, Pinterest requires strict vertical layout ratios. The absolute optimal size is a 2:3 aspect ratio (e.g., 1000 x 1500 pixels). Horizontal images are actively penalized in user timelines because they do not fit the fluid vertical grid of the mobile application.",
        "Image SEO plays a dominant role. Pinterest uses complex machine learning visual extraction tools to determine the textual content of pins. It scans typography embedded directly inside the graphic, parses file title strings (e.g., how-to-compress-images.png), and indexes ALT strings in the layout markup.",
        "By utilizing custom Quote Designers to construct stylish vertical boards, and compressing them into ultra-fast loading PNGs or WebPs, you build exactly the type of assets that the Pinterest algorithm promotes to visual query boards."
      ],
      tips: [
        "Always insert clear, bold search phrases in the top half of your vertical pin layout using highly readable display fonts.",
        "Add keyword-rich descriptions and hashtags directly inside the pin metadata prior to scheduling.",
        "Include a tiny web domain signature identifier at the bottom portion of your graphics to verify content ownership."
      ]
    },
    {
      id: "color-palette-extraction",
      title: "How to Extract Color Palettes from Any Image for Web Design",
      excerpt: "Deep dive into color quantization, median cut clustering algorithms, color theory, and establishing visual brand consistency across digital interfaces.",
      category: "Design",
      readTime: "5 min read",
      icon: Palette,
      content: [
        "Many of the world's most cohesive web interfaces draw their primary design palettes directly from photographs or physical environments. A beautiful palette provides natural balance and immediately sets a specific psychological tone.",
        "To programmatically extract dominant colors from an image, we use Color Quantization. The primary mechanism is the Median Cut Algorithm. This system maps every pixel into a 3D color cube (Red, Green, Blue coordinates) and sequentially splits the dense clusters into smaller boxes. By taking the average color of each resulting box, we identify dominant groupings.",
        "Once dominants are extracted, establishing clean design combinations is straightforward: select one primary highlight color (60% coverage), a balanced supporting neutral tone (30% coverage), and a vibrant accent highlight color (10% coverage). This follows the visual 60-30-10 rule of modern styling.",
        "Our Color Extraction hub maps the source visual, invokes local CPU processing, and displays clean hex codes, contrast indicators, and copyable CSS arrays to accelerate your web workspace."
      ],
      tips: [
        "Extract color palettes from natural, real-world scenes to get well-balanced secondary neutral tones.",
        "Always check extracted palettes against Web Content Accessibility Guidelines (WCAG) to ensure proper contrast.",
        "Export your hex combinations straight to Tailwind CSS theme variables dynamically."
      ]
    },
    {
      id: "workspace-workflow-optimization",
      title: "Optimizing Your Creative Workspace Workflows in 2026",
      excerpt: "Maximize visual speeds and data organization. A detailed technical guide on mapping high-resolution graphic pipelines directly to secure, cloud-hosted files.",
      category: "Technology",
      readTime: "5 min read",
      icon: Settings,
      content: [
        "In modern visual media agencies and active content-creator pipelines, speed of execution determines project success. Digital creators frequently toggle between disparate local systems, leading to scattered workspace archives, stale assets, and broken workflows.",
        "The state-of-the-art solution is to anchor interactive browser-based design tools directly to secure backend APIs and cloud-hosted files like Google Drive. By automating file transfers directly using authenticated sessions, you bypass manual upload drags entirely.",
        "Furthermore, implementing high-contrast user interfaces with unified dark-mode toggles mitigates late-night visual fatigue and increases continuous tool interaction by over 45%. Designers are and should be in absolute control of both their work assets and their surrounding optical environments."
      ],
      tips: [
        "Link your primary utility tools with persistent storage providers to prevent data loss from browser cache clearances.",
        "Use custom dark layouts with standardized contrast standards (meeting WCAG double-A thresholds) to bolster focus during intense, continuous editing blocks.",
        "Establish hierarchical file nomenclature guidelines (e.g. YEAR-MONTH-CLIENT-PROJECT) directly on cloud sync nodes."
      ]
    },
    {
      id: "ux-color-psychology",
      title: "UX Color Psychology and Conversion Rate Optimization (CRO)",
      excerpt: "Unveil how chromatics influence user behavior, evoke subconscious trust signals, and how to optimize button contrast to amplify your site's CRO metrics.",
      category: "Design",
      readTime: "6 min read",
      icon: Palette,
      content: [
        "Color is not merely an aesthetic decoration; it is a rapid, subconscious communication channel that speaks directly to human emotion. In user experience (UX) and conversion rate optimization (CRO), selecting a cohesive brand palette can mean the difference between a high-bounce webpage and a high-converting channel.",
        "For instance, corporate institutions favor deep shades of Blue because of its psychological alignment with stability, security, and professional trust. On the reverse, Red triggers urgent physical impulses, accelerating heart rates and making it a powerful call-to-action color for limited-time flash sales. Green represents freshness, success, and safety, which is why financial institutions and health companies pivot heavily towards it.",
        "However, color contrast is the absolute king of conversion. To maximize readability and satisfy the strict accessibility requirements of Google's search algorithms, buttons and critical visual indicators must meet a contrast ratio of at least 4.5:1 against their backgrounds (conforming to WCAG AA parameters). Using digital palette extraction and contrast verification safeguards both design elegance and natural SEO authority."
      ],
      tips: [
        "Avoid using yellow or bright neon shades for critical body text as it causes immediate eye fatigue and degrades comprehension metrics.",
        "Use high-contrast accent colors for CTA submit triggers to stand out instantly from the surrounding neutral branding layers.",
        "Conduct thorough visual A/B tests to discover color combinations that naturally capture user interaction curves."
      ]
    },
    {
      id: "exif-image-metadata",
      title: "How Image Metadata (EXIF) Impacts Mobile Performance and SEO Rankings",
      excerpt: "Discover the hidden threat of EXIF tags inside photographic files and how striping metadata can dramatically decrease mobile load times and boost Core Web Vitals.",
      category: "SEO",
      readTime: "5 min read",
      icon: Zap,
      content: [
        "When you shoot a photograph using a modern DSLR camera or smartphone, the file captures more than just static color pixels. It compiles a robust metadata packet called Exchangeable Image File Format (EXIF). This record stores technical configurations including GPS coordinates, camera model, lens aperture, focal length, exposure, and even timestamp identifiers.",
        "While EXIF coordinates are useful for raw photographers, they represent dead weight when served over the web. A high-resolution image might contain up to dozens of kilobytes of text metadata alone. If a web designer hosts a gallery with 30 non-optimized images, the page size inflates by over 1 megabyte simply in invisible metadata!",
        "In modern web search engines, mobile page speed directly governs ranking metrics. Google's page crawler evaluates performance via Core Web Vitals (including Largest Contentful Paint). Stripping extra EXIF headers during the compression process shrinks layout weight, reduces bandwidth consumption for mobile user grids, and instantly strengthens the page speed score of the site."
      ],
      tips: [
        "Configure your export pipeline or image processing script to automatically strip EXIF profiles before deployment.",
        "When using our Compressor workspace, notice that redundant metadata is cleaned automatically, saving up to 15% extra image space.",
        "Retain copyright owner tags if mandatory, but prune bulky camera parameters and GPS location markers."
      ]
    },
    {
      id: "core-web-vitals-vitals",
      title: "Mastering Core Web Vitals and Eliminating Layout Shifts",
      excerpt: "A deep technical audit on minimizing Cumulative Layout Shift (CLS) and optimizing page paint timings to unlock high Google search rankings.",
      category: "Development",
      readTime: "6 min read",
      icon: FileText,
      content: [
        "Google's search algorithm values human-centered user experiences above all else. This evaluation is quantified via Core Web Vitals, a set of real-world metrics that measure load performance, visual stability, and page interactivity thresholds.",
        "One of the hardest metrics to optimize is Cumulative Layout Shift (CLS). CLS is the measure of unexpected movement of visible page elements during the rendering cycle. This occurs when dynamic assets (like images without defined width and height attributes in the markup, custom fonts, or delayed ads blocks) load asynchronously and push already-rendered content downwards.",
        "To eliminate layout shifts, web developers must declare exact CSS height and width aspects on all image elements. This allows browsers to reserve the correct screen canvas zone ahead of the asset download, ensuring visual layouts remain perfectly rock-solid. Combining correct canvas sizes with next-gen compression formats establishes highly fluid experiences that rank premium under Google algorithms."
      ],
      tips: [
        "Always define standard aspects or dimensions (width: auto, height: auto) to reserve design slots during loading states.",
        "Preload key custom fonts to prevent the sudden 'Flash of Unstyled Text' and subsequent layout expansion.",
        "Utilize CSS aspect-ratio properties on media cards to scale seamlessly across responsive desktop and mobile screens."
      ]
    },
    {
      id: "svg-optimization-secrets",
      title: "In-Depth Guide to SVG Optimization for Creative Developers",
      excerpt: "Demystify vector paths, viewport coordinates, and code cleaning strategies to deliver responsive, crisp graphics that load instantaneously.",
      category: "Development",
      readTime: "5 min read",
      icon: FileCode,
      content: [
        "Scalable Vector Graphics (SVG) are the cornerstone of responsive visual layouts. Unlike pixel grids that blur or pixelate under high zoom ratios, SVG shapes are represented as mathematical paths. This guarantees that whether rendered on a smartwatch screen or a 4K desktop canvas, every line remains perfectly crisp.",
        "However, vector coordinates generated by software like Adobe Illustrator or Figma are often packed with bloated metadata. They include design software signatures, nested transform groups (<g>), coordinate arrays with unnecessary numeric decimals (e.g., 20.3592815 instead of 20.36), and embedded thumbnail records. Redundant paths accumulate layout bytes and degrade DOM compilation speeds.",
        "By cleaning vector coordinates using standard tools or applying inline manual code structures, we can reduce SVGs sizes by up to 70%. Techniques like cleaning viewport views and merging paths, normalizing font shapes, and utilizing CSS variables for stroke and stroke-width attributes maximize both loading speeds and dynamic branding versatility across multiple theme modes."
      ],
      tips: [
        "Always set exact viewBox aspect profiles instead of hardcoding static width and height attributes in raw SVG markup.",
        "Consolidate multiple vector paths into a single path string descriptor using the 'd' attribute block.",
        "Serve recurring vector icons in a modular svg symbols <symbol> sheet to enable aggressive browser cache strategies."
      ]
    },
    {
      id: "web-typography-loading",
      title: "Modern Typography Loading Strategies to Elevate Reading Experience",
      excerpt: "Master CSS font-display, preloading protocols, and variable webfonts to secure solid cumulative layout shifts (CLS) and beautiful text scaling.",
      category: "Design",
      readTime: "4 min read",
      icon: BookOpen,
      content: [
        "Typography governs up to 95% of online information layouts. Selecting and pairing correct font combinations introduces direct brand personality and guides user visual hierarchy seamlessly. Despite its critical role, unoptimized font rendering strategies can choke critical web assets, causing blank texts or layout shifts.",
        "When a browser parses visual elements, it constructs a render tree. If the page references custom fonts that are not yet downloaded, the browser must decide whether to delay displaying text (Flash of Invisible Text - FOIT) or display a system fallback font first (Flash of Unstyled Text - FOUT). Both states trigger bad layout user feedback and elevate bounce metrics.",
        "The modern standard to tackle typography lags is CSS 'font-display: swap' combined with exact browser link preloads. This approach instructs the browser to immediately paint fallback text, switching dynamically to the custom font once loaded. Incorporating highly flexible Variable Fonts further reduces payload counts since several typeface weights and styles are wrapped into a single, compact file."
      ],
      tips: [
        "Incorporate `font-display: swap` in all your `@font-face` rules to guarantee immediate content readability.",
        "Preload your primary above-the-fold typeface file in the HTML `<head>` using `<link rel='preload'>` links.",
        "Utilize modern Variable Fonts to replace individual bold, regular, and medium font weight variants with one single request."
      ]
    },
    {
      id: "robots-txt-sitemaps",
      title: "Perfect robots.txt and Sitemap Strategy for Rapid Search Indexing",
      excerpt: "Learn how to structure crawling directives and map absolute canonical links to invite search engine bots and maximize crawl efficiency.",
      category: "SEO",
      readTime: "5 min read",
      icon: Globe,
      content: [
        "High-speed performance, clean layouts, and rich content are only useful if search engine robots can easily discover and index your pages. A proper crawling layout acts as a master map, routing automated crawlers across correct entry points and keeping them out of sensitive administrative folders.",
        "A robots.txt file is the initial document checked by web bots (like Googlebot or Bingbot) when they land on a website domain. By declaring straightforward User-agent and Disallow guidelines, you control your 'crawl budget'—ensuring crawlers spend time mapping high-value marketing pages and tools rather than redundant system files.",
        "The companion cornerstone is the XML Sitemap. Sitemaps outline every valid canonical URL on your site, complete with change frequencies and priorities. This structure allows search networks to index any newly deployed content dynamically without waiting for standard hyperlink propagation, accelerating visibility on search results lists."
      ],
      tips: [
        "Link your absolute dynamic XML Sitemap URL clearly at the bottom portion of your robots.txt file.",
        "Utilize canonical tags in each webpage header to avoid duplicate indexing penalties from search bots.",
        "Monitor search console crawl reports to correct 404 dead ends and resolve unneeded server stress points."
      ]
    },
    {
      id: "structured-schema-seo",
      title: "Implementing Schema Markup (JSON-LD) for Maximum SEO Snippets",
      excerpt: "A complete developer blueprint on structuring local tools, interactive cards, and blog posts with JSON-LD schemas to win Google's Rich Snippet visual elements.",
      category: "SEO",
      readTime: "4 min read",
      icon: Globe,
      content: [
        "Google's search result layouts are no longer just basic lists of uniform blue links. Today's search engine landing pages feature dynamic widgets, star rating badges, frequently asked questions (FAQ) panels, and visual image carousels known collectively as Rich Snippets.",
        "To qualify for these prominent screen layouts, your website must serve structured data schemas using JSON-LD (JavaScript Object Notation for Linked Data). Placed directly inside the HTML `<head>` tag, this machine-readable markup describes exactly what kinds of interactive tools, blog articles, or items are contained on the live viewport.",
        "By establishing specific schema objects like WebApplication (for image compressors and quote generators) alongside Article schemas (for creator blog guides), you provide Google's search algorithms with high-fidelity, structural context. This translates directly to increased click-through ratios (CTR), enhanced visual authority, and a sustained climb up search console position tiers."
      ],
      tips: [
        "Enclose your structured schemas in `<script type='application/ld+json'>` tags inside each webpage's head or footer template.",
        "Validate your JSON-LD payloads using Google's official Rich Results Test tool to guarantee perfect compilation prior to deployment.",
        "Dynamically insert custom tool ratings and user feedback values into the WebApplication schema to generate star ratings in the active SERP timeline."
      ]
    },
    {
      id: "ai-video-editing-workflows",
      title: "Mastering Post-Generation and Traditional AI Video Editors",
      excerpt: "An expert blueprint on adjusting lighting, adding objects, and leveraging DaVinci Resolve, Premiere, Descript, and CapCut for professional finishing of AI-generated clips.",
      category: "Technology",
      readTime: "5 min read",
      icon: Video,
      content: [
        "The era of pure text-to-video generation is rapidly transitioning into a sophisticated post-production pipeline. While initial neural models establish motion and characters, true creators build and refine their scenes dynamically in post-production.",
        "A standout advancement in modern generative models is text-guided post-generation editing. Rather than re-generating an entire sequence from scratch, creators can target specific clips to alter lighting setups, add or remove objects, completely restyle artistic scenes, or adjust camera path coordinates using clear natural language prompts.",
        "However, raw AI-generated clips rarely represent a final finished product. Integrating traditional editing suites with specialized machine learning models yields the most cohesive cinematic outcome. Editors like DaVinci Resolve lead the industry in deep color grading, utilizing custom AI tools like Magic Mask, automated voice isolation, and smart auto-editing assistants.",
        "Similarly, tools like Adobe Premiere Pro offer highly professional timelines with Auto Reframe, automatic scene edit detection, and transcripts-driven text-based editing. For talking-head and podcast content, Descript completely revolutionizes editing by letting creators edit video simply by modifying the written transcription. For quick browser-based captions and social video compilation, CapCut provides lightning-fast subtitling and simple layouts.",
        "Descript's powerhouse features represent the cutting edge of AI-assisted media workflows. In 2026, its voice cloning engines sound fully natural, enabling creators to correct mispronounced words or completely rewrite lines without returning to the microphone. Combined with studio-quality, one-click background noise removal and vocal enhancement, pristine audio is accessible instantly. Furthermore, eye contact adjustment fixes gaze direction, redirecting eyes towards the camera for talking-head formats. Together with beautiful auto-generated animated subtitles, global find-and-replace for filler words, and automated AI chapter/action-item detection, editing is faster and cleaner than ever."
      ],
      tips: [
        "Incorporate text-guided post-generation editing to refine lighting and camera paths without full clip re-generations.",
        "Leverage the free edition of DaVinci Resolve for heavy color grading and noise isolation tasks.",
        "Use Descript's transcript editor to trim audio speech blocks, automatically clone and fix mistalked words, correct eye-gaze tracking, and auto-detect chapters."
      ]
    },
    {
      id: "seo-tools-step-by-step-guide",
      title: "How to Use the SEO Generator & Sitemap Tools: A Step-by-Step Playbook",
      excerpt: "A comprehensive developer and creator guide explaining step-by-step how to utilize our built-in SEO tools to optimize metadata, crawl sitemaps, and rise to Google's position tiers.",
      category: "SEO",
      readTime: "7 min read",
      icon: Settings,
      content: [
        "Unlocking natural visual and text search authority begins with having the right tools. Our comprehensive Guides & SEO Hub features state-of-the-art utility tools designed specifically for digital content creators, designers, and developers. By combining the XML Sitemap Search Indexer with the SEO Title & Meta Tag Template Generator, you can map, optimize, and deploy complete crawler-friendly architectures in under five minutes.",
        "Step 1: Map Your Content with the XML Sitemap Search Indexer. Navigate to the 'XML Sitemap Search Indexer' sub-tab. Enter your canonical production domain name (e.g., https://your-brand-domain.com). The tool will dynamically re-evaluate and compile a complete XML schema containing critical creator paths, priority weights, update frequencies, and detailed editorial descriptions. Review the live index table to verify pathways, click 'Copy Sitemap XML', and paste the payload into a sitemap.xml file at the root of your public web host. Finally, submit this URL to Google Search Console (under indexing/sitemaps) to prompt instant, automated crawling.",
        "Step 2: Generate High-Fidelity Metadata with the SEO Meta Template Generator. Switch to the 'SEO Meta Template Generator' sub-tab. Under '1. Choose Layout Context', select your target webpage (e.g., Home Page, Video Maker, Image Compressor). Under '2. Customize Parameters', specify your customized Brand Identification, primary search Keywords, a compelling custom Page Description, and a parent Category. To elevate your copywriting, toggle the '🔮 Optimize with Gemini AI' button. This sends your parameters to a server-side Gemini model that polishes the titles and description lines into eye-catching, click-maximizing summaries that conform to Google's strict editorial character length boundaries.",
        "Step 3: Review and Deploy High-Ranking Header Markup. Examine the 'Live Google Search Snippet Mockup' panel. This shows exactly how your webpage will appear to real users on desktop and mobile SERPs. Monitor the Title and Description length progress indicators—green meters guarantee that search engines won't truncate your titles (best under 60 characters) or descriptions (best under 160 characters). Once you are satisfied, scroll to the generated code blocks. Click 'Copy HTML block' to copy the complete HTML meta headers (including title, description, keywords, and OpenGraph social tags), and paste them directly into the <head> tag of your HTML documents. Then, click 'Copy Schema JSON' to copy the structured JSON-LD WebApplication schema, and paste it into a <script type='application/ld+json'> tag to qualify for Google's rich visual snippets.",
        "Step 4: Continuous Optimization & Verification. Good SEO is not a static milestone; it is an active iteration process. Re-visit our Articles & Educational Guides regularly to master WebP compression, EXIF metadata pruning, variable webfont preloading, and Cumulative Layout Shift (CLS) reduction techniques. Use our companion Image-to-Video and Frame Extractor tools to generate viral vertical content (2:3 Pinterest SEO ratio) with sharp, super-resolution details that capture high organic CTR and referral engagement curves."
      ],
      tips: [
        "Use the '🔮 Optimize with Gemini AI' button to automatically weave high-intent search keywords into your titles and descriptions naturally.",
        "Submit your generated sitemap.xml to both Google Search Console and Bing Webmaster Tools to capture 99% of organic desktop and mobile search traffic.",
        "Test your finalized webpage on Google's Rich Results Test and PageSpeed Insights to verify structured schema compliance and Core Web Vitals rankings."
      ]
    }
  ];

  const getRelatedArticles = (currentArticle: Article): Article[] => {
    const others = ARTICLES.filter(a => a.id !== currentArticle.id);
    const sorted = [...others].sort((a, b) => {
      const aVal = a.category === currentArticle.category ? 2 : 1;
      const bVal = b.category === currentArticle.category ? 2 : 1;
      return bVal - aVal;
    });
    return sorted.slice(0, 3);
  };

  const getFaqs = () => {
    if (!selectedArticleId) {
      return [
        {
          q: "What is the Toolkit Pro Suite?",
          a: "Toolkit Pro Suite is an all-in-one visual optimization workspace for creative developers and digital content creators. It features a customizable Quote Designer, a lossless Image Compressor Pro, a QR Code Builder, an Aesthetic Color Palette Extractor, and Google Drive Cloud Integration."
        },
        {
          q: "How can I compress images without losing quality?",
          a: "You can compress images without losing quality by utilizing next-generation formats like WebP or applying optimization algorithms. Lossy compression degrades file sizes dramatically with virtually imperceptible pixel details changes, while lossless compression guarantees pixel-for-pixel fidelity."
        },
        {
          q: "Why does stripping EXIF metadata improve site performance?",
          a: "Stripping EXIF metadata removes unneeded details like GPS coordinates, camera models, and timestamps from image assets. Eliminating this text-based deadweight reduces the overall payload size, leading to faster paint speeds, lower visual shifts, and stronger Core Web Vitals."
        },
        {
          q: "What is the optimal visual ratio for Pinterest SEO?",
          a: "The ideal layout for Pinterest pins is a vertical 2:3 aspect ratio (such as 1000 x 1500 pixels). Traditional horizontal or landscape graphics are discouraged as they clash with the fluid vertical timelines of the Pinterest application."
        }
      ];
    }

    switch (selectedArticleId) {
      case "compression-guide":
        return [
          {
            q: "What is the difference between lossy and lossless image compression?",
            a: "Lossy compression reduces file sizes significantly by discarding imperceptible chrominance and luminance details. Lossless compression compresses pixel files byte-for-byte, maintaining exact colors and transparencies but yielding larger file sizes than lossy methods."
          },
          {
            q: "What compression ratio balances file size and visual fidelity?",
            a: "For typical website photographic layouts, a compression quality ratio of 75% to 85% is ideal for maximizing page speed performance while preventing human-visible compression artifacts."
          }
        ];
      case "webp-vs-png-vs-jpg":
        return [
          {
            q: "Is WebP superior to JPEG and PNG for web design?",
            a: "Yes, WebP is a superior next-generation format offering both lossy and lossless capabilities. It produces file sizes 26% smaller than PNG and 25-34% smaller than JPEG while retaining alpha transparency channels."
          },
          {
            q: "When should PNG be preferred over modern web formats?",
            a: "PNG format should be selected only when absolute pixel-for-pixel accuracy is vital, such as for barcode symbols, scientific vector graphics, or extreme high-contrast line art."
          }
        ];
      case "qr-code-encoding":
        return [
          {
            q: "How do QR Code readers compensate for physical damage?",
            a: "QR Code systems employ Reed-Solomon Error Correction math parameters which allow scanners to rebuild visual data up to 30% even if the material is stained, torn, or partially obstructed."
          },
          {
            q: "What margin should be maintained around active QR Codes?",
            a: "To avoid scanner misreads, you must enforce a solid border or 'Quiet Zone' spanning at least 4 module widths around the grid parameter."
          }
        ];
      case "pinterest-seo":
        return [
          {
            q: "How does the Pinterest search algorithm index image SEO?",
            a: "The Pinterest algorithm leverages sophisticated machine learning to parse text typography embedded directly inside the graphic layout, extract descriptive file names, and index HTML ALT text fields."
          },
          {
            q: "Why are vertical aspect ratios crucial for Pinterest traffic?",
            a: "Pinterest renders recommendations via a fluid vertical masonry layout. Vertical images (ideally 2:3 ratio) take up standard, spacious screen positions, leading to much higher engagement levels and CTR."
          }
        ];
      case "color-palette-extraction":
        return [
          {
            q: "What is the Median Cut Algorithm in color quantization?",
            a: "The Median Cut algorithm partitions an image's pixel colors into a three-dimensional RGB color cube, recursively splitting the dominant color sets into smaller responsive boxes."
          },
          {
            q: "What is the 60-30-10 color rule in professional UI designer layouts?",
            a: "The 60-30-10 rule suggests using 60% of a dominant neutral tone for primary backgrounds, 30% of a balanced secondary tone for structure elements, and 10% of a vibrant accent color for highlights and CTA triggers."
          }
        ];
      case "workspace-workflow-optimization":
        return [
          {
            q: "How does direct cloud synchronization protect creator assets?",
            a: "Direct cloud integration binds in-app tool pipelines directly to storage hosts (like Google Drive). This avoids manual download queues and guards against browser cache wipes."
          },
          {
            q: "Does dark mode interface design assist professional environments?",
            a: "Yes, high-contrast dark interfaces structured under WCAG guidelines mitigate visual strain, bolster continuous focus blocks, and lower creator fatigue during long design sessions."
          }
        ];
      case "ux-color-psychology":
        return [
          {
            q: "How do specific brand colors influence user trust and actions?",
            a: "Distinct colors set subconscious triggers: Blue evokes professional trust and stability, Red stimulates physical excitement and urgency for limited sales, while Green signifies security, money, and success."
          },
          {
            q: "What text contrast ratio satisfies WCAG accessibility principles?",
            a: "To meet standard WCAG AA guidelines, text elements must obtain a contrast ratio of at least 4.5:1 against the background to boost layout readability and search crawler indexation."
          }
        ];
      case "exif-image-metadata":
        return [
          {
            q: "What constitutes Exchangeable Image File Format (EXIF) details?",
            a: "EXIF refers to a standard metadata container appended to photographs. It records hardware variables such as GPS positions, smartphone camera specifications, lens details, and timestamps."
          },
          {
            q: "Why does removing photo metadata increase mobile site indexing?",
            a: "EXIF tags represent hidden text bloat that can inflate page metrics. Deleting metadata profiles reduces site loading weights, improves mobile painting speeds, and directly increases Core Web Vitals marks."
          }
        ];
      case "core-web-vitals-vitals":
        return [
          {
            q: "What is Cumulative Layout Shift (CLS) in Core Web Vitals?",
            a: "CLS is the measure of unexpected movement of visible layout elements on a screen. This occurs when slow images or dynamic banners load without designated height/width styling and force content downwards."
          },
          {
            q: "How do I fully eliminate sudden webpage shifts?",
            a: "Web developers can neutralize shifts by always specifying clear aspect-ratio parameters or styling strict width and height elements on visual cards ahead of full asset download."
          }
        ];
      case "ai-video-editing-workflows":
        return [
          {
            q: "What is post-generation editing in AI video?",
            a: "Post-generation editing allows creators to modify lighting, add or remove objects, restyle scenes, or adjust camera paths using text prompts after the video is generated, without re-rendering the entire sequence."
          },
          {
            q: "Which traditional video editor offers the best AI tools?",
            a: "DaVinci Resolve is highly recommended for its color grading and AI tools like Magic Mask and voice isolation. Adobe Premiere Pro offers Auto Reframe and text-based editing, while Descript is revolutionary for editing video via transcripts."
          }
        ];
      case "seo-tools-step-by-step-guide":
        return [
          {
            q: "How can I submit my generated sitemap to search networks?",
            a: "Copy the XML code generated by the XML Sitemap Search Indexer, save it as sitemap.xml in your webroot folder, and input the URL in Google Search Console's Sitemaps tab."
          },
          {
            q: "Why is structured JSON-LD data important?",
            a: "JSON-LD structured data provides machine-readable information about your application or articles, qualifying your site for Google Rich Snippets, rating stars, and higher visual CTR."
          },
          {
            q: "Does Gemini AI really help with keyword density?",
            a: "Yes. Our Gemini SEO integration automatically balances title and description characters while naturally weaving relevant target search keywords to maximize click-through ratios."
          }
        ];
      default:
        return [];
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Design":
        return "bg-pink-50 text-pink-650 border-pink-100";
      case "Development":
        return "bg-blue-50 text-blue-650 border-blue-100";
      case "SEO":
        return "bg-emerald-50 text-emerald-650 border-emerald-100";
      case "Technology":
        return "bg-purple-50 text-purple-650 border-purple-100";
      default:
        return "bg-slate-50 text-slate-650 border-slate-100";
    }
  };

  const faqs = getFaqs();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <div className="space-y-8" id="resources-hub-container">
      {/* Dynamic SEO JSON-LD FAQ Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            AdSense Compliance & Education Center
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-normal">
          High-value original articles, tutorials, and development handbooks regarding digital asset design, compression benchmarks, and SEO optimization. Add-value resources certified for Google Publisher networks.
        </p>
      </div>

      {/* Sub-navigation selector for Articles versus XML Sitemap dynamic utility */}
      <div 
        role="tablist"
        aria-label="Education Hub Sub-tabs"
        className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-px"
        onKeyDown={(e) => {
          const keys = ["articles", "sitemap", "seo-templates", "installation", "install-fetchers"] as const;
          const idx = keys.indexOf(subTab);
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const nxt = (idx + 1) % keys.length;
            setSubTab(keys[nxt]);
            setSelectedArticleId(null);
            setTimeout(() => {
              document.getElementById(`btn-subtab-${keys[nxt]}`)?.focus();
            }, 10);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prv = (idx - 1 + keys.length) % keys.length;
            setSubTab(keys[prv]);
            setSelectedArticleId(null);
            setTimeout(() => {
              document.getElementById(`btn-subtab-${keys[prv]}`)?.focus();
            }, 10);
          }
        }}
      >
        <button
          onClick={() => {
            setSubTab("articles");
            setSelectedArticleId(null);
          }}
          role="tab"
          aria-selected={subTab === "articles"}
          aria-controls="resources-panel-articles"
          aria-label="Articles & Educational Guides"
          className={`px-4 py-2.5 text-xs font-bold transition-all relative cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
            subTab === "articles"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="btn-subtab-articles"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Articles & Educational Guides
        </button>
        <button
          onClick={() => {
            setSubTab("sitemap");
            setSelectedArticleId(null);
          }}
          role="tab"
          aria-selected={subTab === "sitemap"}
          aria-controls="resources-panel-sitemap"
          aria-label="XML Sitemap Search Indexer"
          className={`px-4 py-2.5 text-xs font-bold transition-all relative cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
            subTab === "sitemap"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="btn-subtab-sitemap"
        >
          <Map className="w-3.5 h-3.5" />
          XML Sitemap Search Indexer
        </button>
        <button
          onClick={() => {
            setSubTab("seo-templates");
            setSelectedArticleId(null);
          }}
          role="tab"
          aria-selected={subTab === "seo-templates"}
          aria-controls="resources-panel-seo"
          aria-label="SEO Meta Template Generator"
          className={`px-4 py-2.5 text-xs font-bold transition-all relative cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
            subTab === "seo-templates"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="btn-subtab-seo-templates"
        >
          <Settings className="w-3.5 h-3.5" />
          SEO Meta Template Generator
        </button>
        <button
          onClick={() => {
            setSubTab("installation");
            setSelectedArticleId(null);
          }}
          role="tab"
          aria-selected={subTab === "installation"}
          aria-controls="resources-panel-installation"
          aria-label="PWA Application Installation Guides"
          className={`px-4 py-2.5 text-xs font-bold transition-all relative cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
            subTab === "installation"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="btn-subtab-installation"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          PWA Installation
        </button>
        <button
          onClick={() => {
            setSubTab("install-fetchers");
            setSelectedArticleId(null);
          }}
          role="tab"
          aria-selected={subTab === "install-fetchers"}
          aria-controls="resources-panel-install-fetchers"
          aria-label="App Installer & Download Client Fetchers"
          className={`px-4 py-2.5 text-xs font-bold transition-all relative cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
            subTab === "install-fetchers"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="btn-subtab-install-fetchers"
        >
          <Download className="w-3.5 h-3.5 animate-bounce-slow" />
          App Installer & Fetchers
        </button>
      </div>

      {subTab === "sitemap" ? (
        <div 
          role="tabpanel" 
          id="resources-panel-sitemap" 
          aria-labelledby="btn-subtab-sitemap"
          className="space-y-6 animate-fade-in"
        >
          {/* Header info & domain form */}
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 animate-pulse">
                  <Globe className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                  Target Domain Configuration
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Specify your destination hosting URL. The sitemap paths and absolute location tags (`&lt;loc&gt;`) will auto-adapt instantly.
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-stretch md:self-auto">
                <button
                  onClick={downloadXmlFile}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
                  id="btn-download-sitemap-xml"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download sitemap.xml
                </button>
                <button
                  onClick={handleCopyAll}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  id="btn-copy-sitemap-xml"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied XML!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Copy Full XML
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Input for target origin */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 select-none">
                  Origin URL
                </span>
                <input
                  type="url"
                  value={siteRoot}
                  onChange={(e) => setSiteRoot(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="w-full pl-22 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl text-xs font-semibold bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                />
              </div>
              <button
                onClick={() => setSiteRoot(window.location.origin)}
                className="px-3.5 py-2.5 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer select-none"
              >
                Reset to Current
              </button>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Visual list of indexed routes */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest">
                  Indexed Paths ({SITEMAP_URLS.length} URLs)
                </h5>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-55/15 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                  Perfect for Crawlers
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl pr-1 divide-y divide-slate-50 dark:divide-slate-800/50 space-y-1 p-2 bg-slate-50/20 dark:bg-slate-900/10">
                {SITEMAP_URLS.map((item, index) => {
                  const cleanOrigin = siteRoot.endsWith("/") ? siteRoot.slice(0, -1) : siteRoot;
                  const fullUrl = item.url ? `${cleanOrigin}/${item.url}` : cleanOrigin;
                  return (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-slate-950 border border-slate-100/40 dark:border-slate-850 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-colors flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {item.alias}
                          </span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/30 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 px-1.5 py-0.2 rounded font-mono">
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate font-mono">
                          {fullUrl}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal">
                          {item.description}
                        </p>
                      </div>

                      {/* Copy specific XML node */}
                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        <button
                          onClick={() => handleCopySingleNode(index, item.url)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          title="Copy single URL node block to clipboard"
                        >
                          {copiedUrlIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Schema code viewer panel & setup guides */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1">
                  <FileCode className="w-4 h-4 text-indigo-505" />
                  Live XML Node Preview
                </h5>
                <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-normal">
                  Direct validation copy matching standard schemas defined by Sitemap.org.
                </p>
              </div>

              {/* XML Code Container */}
              <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-slate-305 select-text overflow-x-auto border border-slate-800 shadow-xl max-h-[350px] overflow-y-auto leading-normal scrollbar-none">
                <div className="text-indigo-400 font-semibold">&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;</div>
                <div className="text-slate-400">&lt;!-- Generated automatically by Toolkit Pro Suite Indexer --&gt;</div>
                <div className="text-amber-500">&lt;urlset xmlns=&quot;http://www.sitemaps.org/schemas/sitemap/0.9&quot;&gt;</div>
                {SITEMAP_URLS.map((item, idx) => {
                  const cleanOrigin = siteRoot.endsWith("/") ? siteRoot.slice(0, -1) : siteRoot;
                  const fullUrl = item.url ? `${cleanOrigin}/${item.url}` : cleanOrigin;
                  const today = new Date().toISOString().split("T")[0];
                  return (
                    <div key={idx} className="pl-3 py-1 border-l border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <span className="text-amber-400">&nbsp;&nbsp;&lt;url&gt;</span>
                      <div><span className="text-blue-400">&nbsp;&nbsp;&nbsp;&nbsp;&lt;loc&gt;</span><span className="text-slate-200">{fullUrl}</span><span className="text-blue-400">&lt;/loc&gt;</span></div>
                      <div><span className="text-blue-400">&nbsp;&nbsp;&nbsp;&nbsp;&lt;lastmod&gt;</span><span className="text-slate-300">{today}</span><span className="text-blue-400">&lt;/lastmod&gt;</span></div>
                      <div><span className="text-blue-400">&nbsp;&nbsp;&nbsp;&nbsp;&lt;changefreq&gt;</span><span className="text-emerald-400">{item.changefreq}</span><span className="text-blue-400">&lt;/changefreq&gt;</span></div>
                      <div><span className="text-blue-400">&nbsp;&nbsp;&nbsp;&nbsp;&lt;priority&gt;</span><span className="text-pink-400">{item.priority}</span><span className="text-blue-400">&lt;/priority&gt;</span></div>
                      <span className="text-amber-400">&nbsp;&nbsp;&lt;/url&gt;</span>
                    </div>
                  );
                })}
                <div className="text-amber-500">&lt;/urlset&gt;</div>
              </div>

              {/* Submit instructions banner */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3.5 space-y-2">
                <h6 className="text-[11px] font-bold text-amber-950 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                  AdSense submission handbook
                </h6>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  Submit the generated sitemap to **Google Search Console** to speed up page crawl times. This guarantees manual verification reviewers discover all educational guides and compliant disclaimers on your origin domain instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : subTab === "seo-templates" ? (
        (() => {
          const activePreset = SEO_PAGE_PRESETS.find(p => p.id === selectedSeoPage) || SEO_PAGE_PRESETS[0];

          // Title Formula (uses AI override if present)
          const finalTitle = aiGeneratedSeo 
            ? aiGeneratedSeo.title 
            : (selectedSeoPage === "custom" 
              ? `${seoBrandName} | ${seoFocusKeyword.charAt(0).toUpperCase() + seoFocusKeyword.slice(1)}`
              : `${activePreset.defaultTitle} - ${seoBrandName}`);

          // Description Formula (uses AI override if present)
          const finalDesc = aiGeneratedSeo 
            ? aiGeneratedSeo.description 
            : (selectedSeoPage === "custom"
              ? `Optimize with ${seoBrandName}. Effortlessly ${seoPrimaryGoal}. Prefilled with custom tags and fast response times.`
              : `Effortlessly ${seoPrimaryGoal} with ${seoBrandName}. ${activePreset.defaultDesc}`);

          // Complete HTML code block
          const pagePathSuffix = activePreset.path;
          const fullPageUrl = `${siteRoot}/${pagePathSuffix}`;

          const keywordsStr = aiGeneratedSeo 
            ? aiGeneratedSeo.keywords.join(", ") 
            : `${seoFocusKeyword}, web design, ${seoBrandName}, creator productivity`;

          const ogTitle = aiGeneratedSeo ? aiGeneratedSeo.socialTitle : finalTitle;
          const ogDesc = aiGeneratedSeo ? aiGeneratedSeo.socialDescription : finalDesc;

          const htmlMetaCode = `<!-- Primary SEO Meta Tags -->
<title>${finalTitle}</title>
<meta name="title" content="${finalTitle}" />
<meta name="description" content="${finalDesc}" />
<meta name="keywords" content="${keywordsStr}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${fullPageUrl}" />
<meta property="og:title" content="${ogTitle}" />
<meta property="og:description" content="${ogDesc}" />
<meta property="og:image" content="${siteRoot}/assets/og-cover.png" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${fullPageUrl}" />
<meta property="twitter:title" content="${ogTitle}" />
<meta property="twitter:description" content="${ogDesc}" />`;

          // JSON-LD schema
          const jsonLdCode = `{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "${finalTitle}",
  "description": "${finalDesc}",
  "url": "${fullPageUrl}",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "creator": {
    "@type": "Person",
    "name": "Shaheera Sadia"
  }
}`;

          const handleSeoCopy = (text: string, field: string) => {
            navigator.clipboard.writeText(text);
            setCopiedSeoField(field);
            setTimeout(() => setCopiedSeoField(null), 2000);
          };

          return (
            <div 
              role="tabpanel"
              id="resources-panel-seo"
              aria-labelledby="btn-subtab-seo-templates"
              className="space-y-6 animate-fade-in animate-duration-300"
            >
              {/* Header Description Info card */}
              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                  SEO Title & Meta Tag Template Generator
                </h4>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-normal max-w-4xl">
                  Construct high-ranking SEO tags and structured JSON-LD schemas instantly. Perfect for Google crawlers and compliant with strict **Google AdSense Editorial guidelines**. Having optimized title tags tells review robots that your utility offers solid functional value.
                </p>
              </div>

              {/* Step-by-Step User Guide (Interactive Accordion) */}
              <div className="bg-gradient-to-r from-indigo-55/30 to-sky-55/20 dark:from-indigo-950/15 dark:to-sky-950/5 border border-indigo-100/50 dark:border-indigo-900/20 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer select-none gap-3" onClick={() => setShowSeoTutorial(!showSeoTutorial)}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <HelpCircle className="w-4 h-4 animate-bounce-slow" />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Step-by-Step SEO & Sitemap Playbook
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Follow this detailed tutorial to learn how to use these tools to boost your web authority and rankings.
                      </p>
                    </div>
                  </div>
                  <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0">
                    {showSeoTutorial ? "Hide Setup Steps" : "Show Setup Steps"}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSeoTutorial ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {showSeoTutorial && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 animate-fade-in text-[11px] leading-relaxed">
                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5.5 h-5.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100/50 dark:border-indigo-900/40">01</span>
                        <h5 className="font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Map & Index sitemap</h5>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        First, go to the <strong className="text-indigo-600 dark:text-indigo-400">XML Sitemap Search Indexer</strong> sub-tab. Enter your canonical production domain name (e.g. <code>https://yourdomain.com</code>). Click <strong className="text-indigo-600 dark:text-indigo-400">"Generate & Fetch Sitemap"</strong> to inspect sitemap records.
                      </p>
                      <div className="text-[9.5px] bg-indigo-50/40 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-100/30 dark:border-indigo-900/20 text-indigo-650 dark:text-indigo-400 leading-normal">
                        <strong>Action Item:</strong> Click the "Copy Sitemap XML" button and paste it into a file named <code>sitemap.xml</code> on your site's root directory, then submit this URL to Google Search Console.
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-955 border border-slate-100 dark:border-slate-850/80 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5.5 h-5.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100/50 dark:border-indigo-900/40">02</span>
                        <h5 className="font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Select Template Page</h5>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Switch to the <strong className="text-indigo-600 dark:text-indigo-400">SEO Meta Template Generator</strong> sub-tab. Select your target viewport (e.g. <em>Home Page</em>, <em>Video Maker</em>, <em>Guides Hub</em>) under <strong className="text-slate-600 dark:text-slate-400">"1. Choose Layout Context"</strong>.
                      </p>
                      <div className="text-[9.5px] bg-sky-50/40 dark:bg-sky-955/25 p-2 rounded-lg border border-sky-100/30 dark:border-sky-900/20 text-sky-650 dark:text-sky-400 leading-normal">
                        <strong>Default Setup:</strong> Presets default to highly optimized titles matching Google publisher and strict <strong>Google AdSense Editorial policies</strong> out of the box.
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5.5 h-5.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100/50 dark:border-indigo-900/40">03</span>
                        <h5 className="font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">AI Copywriting Pass</h5>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Under <strong className="text-slate-600 dark:text-slate-400">"2. Customize Parameters"</strong>, customize your brand name, target search keywords, and descriptive context. Then, click <strong className="text-indigo-600 dark:text-indigo-400">"🔮 Optimize with Gemini AI"</strong>.
                      </p>
                      <div className="text-[9.5px] bg-purple-50/40 dark:bg-purple-955/20 p-2 rounded-lg border border-purple-100/30 dark:border-purple-900/20 text-purple-650 dark:text-purple-400 leading-normal">
                        <strong>AI Power:</strong> Gemini will analyze your input parameters and generate a compelling, click-maximizing copy fitting optimal metadata lengths.
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-955 border border-slate-100 dark:border-slate-850/80 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5.5 h-5.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100/50 dark:border-indigo-900/40">04</span>
                        <h5 className="font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Validate & Deploy</h5>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Check counts on the <strong className="text-slate-600 dark:text-slate-400">Live Google Search Snippet Mockup</strong> (green length indicators represent optimal length). Finally, copy the code and deploy it to your site's codebase!
                      </p>
                      <div className="text-[9.5px] bg-emerald-50/40 dark:bg-emerald-955/25 p-2 rounded-lg border border-emerald-100/30 dark:border-emerald-900/20 text-emerald-650 dark:text-emerald-400 leading-normal">
                        <strong>Instant Copy:</strong> Copy buttons let you duplicate code instantly. OpenGraph tags are included to ensure your social links look beautiful on Discord, X, and Facebook.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Hand: Controls & Preset Selection */}
                <div className="lg:col-span-4 space-y-4">
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                      1. Choose Layout Context
                    </h5>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 text-xs">
                      {SEO_PAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedSeoPage(preset.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            selectedSeoPage === preset.id
                              ? "bg-indigo-50/60 dark:bg-indigo-950/25 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold"
                              : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate text-[11.5px] font-semibold">{preset.name}</div>
                            <span className="text-[9px] text-slate-400 font-mono">/{preset.path.slice(0, 18)}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedSeoPage === preset.id ? "text-indigo-505 translate-x-0.5" : "text-slate-300 dark:text-slate-700"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced SEO tweaking fields */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-xs">
                    <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      2. Customize Parameters
                    </h5>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Brand Identification
                        </label>
                        <input
                          type="text"
                          value={seoBrandName}
                          onChange={(e) => setSeoBrandName(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. ToolkitPro"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Focus Keyphrase
                        </label>
                        <input
                          type="text"
                          value={seoFocusKeyword}
                          onChange={(e) => setSeoFocusKeyword(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. free qr generator"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Primary User Goal
                        </label>
                        <textarea
                          value={seoPrimaryGoal}
                          onChange={(e) => setSeoPrimaryGoal(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none font-medium leading-normal"
                          placeholder="Describe what users do..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Optimization control card */}
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        3. AI-Powered Optimizer
                      </h5>
                      {aiGeneratedSeo && (
                        <button
                          onClick={() => setAiGeneratedSeo(null)}
                          className="text-[9px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer select-none"
                        >
                          Reset Title
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                      Leverage Gemini 3.5 Flash to automatically rewrite click-optimized, semantic metatags matching strict search relevance benchmarks.
                    </p>

                    {aiGenerationError && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-450 bg-rose-50/40 dark:bg-rose-950/25 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40 leading-normal">
                        ⚠️ {aiGenerationError}
                      </div>
                    )}

                    <button
                      onClick={handleGenerateAiSeo}
                      disabled={isAiGenerating}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all select-none cursor-pointer text-white overflow-hidden ${
                        isAiGenerating
                          ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 active:scale-[0.98]"
                      }`}
                    >
                      {isAiGenerating ? (
                        <>
                          <div className="w-3 h-3 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                          <span>Brewing Meta Tags...</span>
                        </>
                      ) : (
                        <>
                          <span>🔮 Optimize with Gemini AI</span>
                        </>
                      )}
                    </button>

                    {aiGeneratedSeo && (
                      <div className="bg-emerald-500/10 dark:bg-emerald-400/5 text-emerald-600 dark:text-emerald-400 text-[10px] p-2 rounded-xl text-center font-bold border border-emerald-500/20 flex items-center justify-center gap-1 leading-none select-none">
                        <span>✨ Active Gemini SEO Optimization Applied</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Hand: Generated Google Snippet & Copy Codes Code-Block */}
                <div className="lg:col-span-8 space-y-5 flex flex-col justify-between">
                  {/* Google Snippet Live Mock Card */}
                  <div className="bg-white dark:bg-slate-955 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-900 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        Live Google Search Snippet Mockup
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                        Desktop Snippet Mock
                      </span>
                    </div>

                    {/* Google Snippet Core Design */}
                    <div className="space-y-1 select-none py-1 font-sans">
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-405 not-italic">
                        <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[8px] font-extrabold text-indigo-500 border border-slate-200/50 dark:border-slate-800">
                          T
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{siteRoot.replace(/^https?:\/\//, "")}</span>
                        <span className="text-slate-400 font-light">&gt; ?tab={activePreset.id}</span>
                      </div>
                      
                      {/* Dynamic Title */}
                      <h4 className="text-base sm:text-lg text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-tight font-medium truncate pr-4">
                        {finalTitle}
                      </h4>

                      {/* Dynamic Meta Description */}
                      <p className="text-[12.5px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed mt-0.5 line-clamp-2">
                        <span className="text-slate-400 dark:text-slate-500 text-[10.5px] font-semibold mr-1">
                          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} —
                        </span>
                        {finalDesc}
                      </p>
                    </div>

                    {/* Length Indicators and Progress meters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3.5 border-t border-slate-50 dark:border-slate-900">
                      {/* Title Indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-505">
                          <span>Title Length ({finalTitle.length} chars)</span>
                          <span className={finalTitle.length >= 45 && finalTitle.length <= 110 ? "text-emerald-500" : finalTitle.length > 110 ? "text-rose-500" : "text-amber-500"}>
                            {finalTitle.length >= 45 && finalTitle.length <= 110 ? "Optimal Length" : finalTitle.length > 110 ? "Too Long (>110)" : "Short (<45)"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden flex font-sans">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              finalTitle.length >= 45 && finalTitle.length <= 110 
                                ? "bg-emerald-500" 
                                : finalTitle.length > 110 ? "bg-rose-500" : "bg-amber-500"
                            }`} 
                            style={{ width: `${Math.min(100, (finalTitle.length / 120) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Description Indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-505">
                          <span>Description Length ({finalDesc.length} chars)</span>
                          <span className={finalDesc.length >= 115 && finalDesc.length <= 165 ? "text-emerald-500" : finalDesc.length > 165 ? "text-rose-500" : "text-amber-500"}>
                            {finalDesc.length >= 115 && finalDesc.length <= 165 ? "Optimal Length" : finalDesc.length > 165 ? "Too Long (>165)" : "Short (<115)"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden flex font-sans">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              finalDesc.length >= 115 && finalDesc.length <= 165 
                                ? "bg-emerald-500" 
                                : finalDesc.length > 165 ? "bg-rose-500" : "bg-amber-505"
                            }`} 
                            style={{ width: `${Math.min(100, (finalDesc.length / 190) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gemini AI Action Insights and Recommendations banner */}
                  {aiGeneratedSeo && aiGeneratedSeo.optimizationTips && (
                    <div className="bg-gradient-to-r from-emerald-50/50 via-indigo-50/20 to-purple-50/30 dark:from-emerald-950/10 dark:via-indigo-950/5 dark:to-purple-950/10 p-4 sm:p-5 rounded-2xl border border-emerald-100/40 dark:border-emerald-900/40 space-y-3.5 shadow-xs font-sans animate-fade-in">
                      <h5 className="text-[10.5px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 leading-none select-none">
                        <span className="text-sm">💡</span> Gemini AI Crawler Insights & Action Items
                      </h5>
                      <ul className="space-y-2">
                        {aiGeneratedSeo.optimizationTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start text-[11.5px] text-slate-700 dark:text-slate-300 gap-2 leading-relaxed">
                            <span className="text-emerald-500 font-extrabold select-none">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outputs Box */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-805 p-5 space-y-4 shadow-lg text-xs font-mono">
                    {/* Copied Popup Confirmation Banner */}
                    {copiedSeoField && (
                      <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 p-2.5 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold text-center flex items-center justify-center gap-1.5 animate-fade-in font-sans">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Copied customized **{copiedSeoField}** target template safely!</span>
                      </div>
                    )}

                    <div className="space-y-3 font-medium cursor-default">
                      {/* Title Only Output */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-500" /> Page Title Tag
                          </span>
                          <button
                            onClick={() => handleSeoCopy(finalTitle, "Page Title")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-md text-slate-300 select-none cursor-pointer border border-slate-750 flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" /> Copy String
                          </button>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-slate-101 text-[11.5px] leading-relaxed break-all font-sans">
                          {finalTitle}
                        </div>
                      </div>

                      {/* Description Only Output */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-sky-400" /> Meta Description Content
                          </span>
                          <button
                            onClick={() => handleSeoCopy(finalDesc, "Meta Description")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-md text-slate-300 select-none cursor-pointer border border-slate-750 flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" /> Copy String
                          </button>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-slate-101 text-[11.5px] leading-normal break-words font-sans">
                          {finalDesc}
                        </div>
                      </div>

                      {/* Complete HTML Tags Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                            <FileCode className="w-3 h-3 text-amber-500" /> Complete HTML & OpenGraph Header Tags
                          </span>
                          <button
                            onClick={() => handleSeoCopy(htmlMetaCode, "HTML SEO Headers")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-md text-slate-300 select-none cursor-pointer border border-slate-750 flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" /> Copy HTML block
                          </button>
                        </div>
                        <pre className="bg-slate-955 p-3 rounded-lg border border-slate-850 text-slate-305 text-[10px] leading-relaxed overflow-x-auto select-all max-h-[170px] scrollbar-none font-mono">
                          {htmlMetaCode}
                        </pre>
                      </div>

                      {/* JSON-LD WebApplication Schema Output */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-505 flex items-center gap-1 font-sans">
                            <FileCode className="w-3 h-3 text-indigo-400" /> WebApplication Schema Markup (JSON-LD)
                          </span>
                          <button
                            onClick={() => handleSeoCopy(jsonLdCode, "WebApplication JSON Schema")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-md text-slate-300 select-none cursor-pointer border border-slate-750 flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" /> Copy Schema JSON
                          </button>
                        </div>
                        <pre className="bg-slate-955 p-3 rounded-lg border border-slate-850 text-slate-305 text-[10px] leading-relaxed overflow-x-auto select-all max-h-[170px] scrollbar-none font-mono">
                          {jsonLdCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : subTab === "install-fetchers" ? (
        (() => {
          // Script utilities definitions for immediate clipboard copy and download fetchers
          const nodeJsScriptContent = `/**
 * Toolkit Pro Suite - Client App Fetcher (NodeJS)
 * High-performance automated pipeline to fetch & serialize creator assets locally.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 INTIALIZING TOOLKIT DYNAMIC DOCK FETCHERS...');
const outputDir = path.join(process.cwd(), 'toolkit_sync_downloads');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Config lists for dynamic sync
const syncSources = [
  { 
    name: "workspace_status.json", 
    url: "${siteRoot}/api/health"
  }
];

// Sequential network downloader
syncSources.forEach(source => {
  const destination = path.join(outputDir, source.name);
  const fileStream = fs.createWriteStream(destination);
  
  https.get(source.url, (res) => {
    if (res.statusCode === 200) {
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(\`✅ [SUCCESS] Local App Fetcher compiled: \${source.name}\`);
      });
    } else {
      console.error(\`❌ [ERROR] Remote status code: \${res.statusCode}\`);
    }
  }).on('error', (err) => {
    fs.unlink(destination, () => {});
    console.error(\`❌ [ERROR] Network timeout: \${err.message}\`);
  });
});`;

          const pythonScriptContent = `#!/usr/bin/env python3
"""
Toolkit Pro Suite - Aesthetic Downloader & Layout Fetcher (Python)
Automated local collector to pool system styles & color palettes natively.
"""
import os
import json
import urllib.request

print("⚡ Starting Python Style Config Downloader Fetcher...")
out_dir = "./toolkit_style_manifests"
if not os.path.exists(out_dir):
    os.makedirs(out_dir)

style_data = {
    "app_name": "Toolkit Pro Suite",
    "export_mode": "Automated Fetcher",
    "pwa_installed": True,
    "system_spectrum": {
        "slate_600": "#475569",
        "indigo_500": "#6366f1",
        "emerald_500": "#10b981",
        "deep_charcoal": "#0f172a"
    },
    "default_quote_preset": {
        "text": "Simplicity is the ultimate sophistication.",
        "author": "Leonardo da Vinci"
    }
}

manifest_path = os.path.join(out_dir, "app_layout_config.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(style_data, f, indent=2)

print(f"🎉 Successfully serialized custom system styles at: {manifest_path}")
print("✨ Local pipeline complete!")`;

          const offlineHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toolkit Pro Suite - Independent Offline Client</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #6366f1;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .wrapper {
      max-width: 650px;
      width: 100%;
      background: var(--card-bg);
      padding: 35px;
      border-radius: 20px;
      border: 1px solid #1f2937;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    h1 {
      font-size: 24px;
      color: #818cf8;
      text-align: center;
      margin-top: 0;
    }
    p {
      color: var(--muted);
      font-size: 13.5px;
      line-height: 1.6;
      text-align: center;
    }
    .file-dropzone {
      border: 2px dashed #374151;
      border-radius: 14px;
      padding: 35px;
      text-align: center;
      background: rgba(17, 24, 39, 0.5);
      cursor: pointer;
      margin: 25px 0;
      transition: all 0.2s;
    }
    .file-dropzone:hover {
      border-color: var(--accent);
      background: rgba(99, 102, 241, 0.05);
    }
    input[type="file"] {
      display: none;
    }
    .render-sandbox {
      background: #0b0f19;
      border-radius: 12px;
      padding: 24px;
      margin-top: 20px;
      display: none;
      border: 1px solid #1f2937;
    }
    .output-text {
      font-size: 18px;
      font-weight: 500;
      line-height: 1.5;
    }
    .output-details {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 11px;
      color: var(--muted);
      border-t: 1px solid #1f2937;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>Toolkit Pro Suite Offline</h1>
    <p>This is a portable HTML visualizer wrapper compiled automatically. Use it to load and inspect exported creator config backups offline safely on your machine without server overhead.</p>
    
    <div class="file-dropzone" onclick="document.getElementById('offlineFile').click()">
      <span style="font-size: 28px;">🗂️</span>
      <p style="margin: 10px 0 0 0; font-weight: bold; color: #a5b4fc;">Import layout backup file (.json)</p>
      <input type="file" id="offlineFile" accept=".json" onchange="parseConfig(event)">
    </div>

    <div id="sandbox" class="render-sandbox">
      <div id="outText" class="output-text"></div>
      <div id="outDetails" class="output-details"></div>
    </div>
  </div>

  <script>
    function parseConfig(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const config = JSON.parse(evt.target.result);
          document.getElementById('sandbox').style.display = 'block';
          if (config.text) {
            document.getElementById('outText').textContent = '"' + config.text + '"';
            document.getElementById('outDetails').innerHTML = 
              '<span>Author: ' + (config.author || 'Anonymous') + '</span>' +
              '<span>Font: ' + (config.fontFamily || 'Inter') + '</span>';
          } else {
            document.getElementById('outText').innerHTML = '<pre style="font-size:11px; color:#34d399; margin:0; overflow-x:auto;">' + JSON.stringify(config, null, 2) + '</pre>';
            document.getElementById('outDetails').innerHTML = '<span>Type: Schema Package</span><span>Raw JSON source parsed</span>';
          }
        } catch(err) {
          alert("Error loading backup: Invalid JSON markup!");
        }
      };
      reader.readAsText(file);
    }
  </script>
</body>
</html>`;

          // Download Action Handler
          const handleDownloadFetcher = (fileName: string, content: string, mimeType: string) => {
            const blob = new Blob([content], { type: mimeType });
            triggerFileDownload(blob, fileName);
          };

          // Clipboard Copy Action Handler
          const handleCopyFetcherCode = (text: string, platformLabel: string) => {
            navigator.clipboard.writeText(text);
            setCopiedFetcherField(platformLabel);
            setTimeout(() => setCopiedFetcherField(null), 2500);
          };

          const activeCode = 
            activeFetcherPlatform === "node" 
              ? nodeJsScriptContent 
              : activeFetcherPlatform === "python" 
                ? pythonScriptContent 
                : offlineHtmlContent;

          const activeFileName = 
            activeFetcherPlatform === "node" 
              ? "app_fetcher_bulk.js" 
              : activeFetcherPlatform === "python" 
                ? "app_fetcher_aesthetic.py" 
                : "toolkit_pwa_standalone_viewer.html";

          const activeMimeType = 
            activeFetcherPlatform === "node" || activeFetcherPlatform === "python" 
              ? "text/plain" 
              : "text/html";

          return (
            <div 
              role="tabpanel"
              id="resources-panel-install-fetchers"
              className="space-y-6 animate-fade-in"
            >
              {/* Header Title Card */}
              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                      <Download className="w-4 h-4 text-indigo-500 animate-bounce-slow" />
                      App Installer & Download Client Fetchers WORKSPACE
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-3xl">
                      Configure persistent standalone PWA installs on any device or fetch bulk creative assets programmatically using custom script scrapers and static offline visualizers.
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/45 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40 h-fit">
                    Sandbox Secured Client
                  </span>
                </div>
              </div>

              {/* Main Content Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT-HAND COLUMN: Native App Installer & Guides */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        1. Progressive App Installation
                      </h5>
                      <span className="text-[9px] font-mono text-emerald-500 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        SW Active
                      </span>
                    </div>

                    {/* Status overview cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-900/55 p-2 rounded-xl text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Sandbox Mode</div>
                        <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">Verified Web</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/55 p-2 rounded-xl text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Offline Cache</div>
                        <div className="text-[10px] font-semibold text-emerald-500 font-sans">Ready-98%</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/55 p-2 rounded-xl text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Sync Engine</div>
                        <div className="text-[10px] font-semibold text-indigo-505">Auto Client</div>
                      </div>
                    </div>

                    {/* Direct Install CTA */}
                    <div className="bg-gradient-to-br from-indigo-50/30 to-indigo-50/5 dark:from-indigo-950/10 dark:to-indigo-950/2 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-900/30 space-y-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-sans font-medium">
                        Run our creator suites outside browser address bars in a dedicated distraction-free standalone window with persistent caching, fast transitions, and immediate local loading.
                      </p>
                      
                      <button
                        onClick={() => {
                          // Try installing on Navbar or triggering browser guides
                          const navBtn = document.getElementById("btn-pwa-install-nav");
                          if (navBtn) {
                            navBtn.click();
                          } else {
                            alert("Click the dedicated Installation Monitor button at the top header navbar to trigger your browser's native overlay installer!");
                          }
                        }}
                        className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs shadow-md transition-all cursor-pointer font-sans"
                      >
                        🚀 Install Standalone Desktop Client
                      </button>
                    </div>

                    {/* Platform guides */}
                    <div className="space-y-4 pt-1">
                      {/* Desktop Guide */}
                      <div className="space-y-2">
                        <h6 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                          💻 How to Install on Desktop (Windows, macOS, Linux, ChromeOS)
                        </h6>
                        
                        {/* Chrome/Edge Desktop */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            <span>Using Google Chrome or Microsoft Edge</span>
                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">Fast & Preferred</span>
                          </div>
                          <p className="text-[10.5px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                            1. Open the app link in your browser: <a href="https://ais-dev-a46nakkyvhetoppmtctdod-190926376546.asia-southeast1.run.app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-extrabold">Development App Link</a> or <a href="https://ais-pre-a46nakkyvhetoppmtctdod-190926376546.asia-southeast1.run.app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-extrabold">Shared App Link</a>.<br/>
                            2. In the address bar (on the right-hand side), you will see an <strong className="text-slate-700 dark:text-slate-300 font-bold">"Install" icon</strong> (a small monitor with a down-pointing arrow, or a plus <strong>+</strong> icon depending on your browser version).<br/>
                            3. Click it, select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Install"</strong>, and the app will instantly launch in its own premium standalone window.<br/>
                            4. An app shortcut will also be added to your desktop/start menu.
                          </p>
                        </div>

                        {/* Safari on macOS */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            Using Safari on macOS
                          </div>
                          <p className="text-[10.5px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                            1. Open the app's link in Safari.<br/>
                            2. Click the <strong className="text-slate-700 dark:text-slate-300 font-bold">Share sheet button</strong> in the toolbar.<br/>
                            3. Scroll down and click <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add to Dock"</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Mobile Guide */}
                      <div className="space-y-2">
                        <h6 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                          📱 How to Install on Mobile (iOS / Android)
                        </h6>

                        {/* iOS Safari */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            On iPhone or iPad (Safari)
                          </div>
                          <p className="text-[10.5px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                            1. Navigate to the app address in Safari.<br/>
                            2. Tap the <strong className="text-slate-700 dark:text-slate-300 font-bold">Share icon</strong> (square with an up-pointing arrow) at the bottom toolbar.<br/>
                            3. Select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add to Home Screen"</strong> from the options grid.<br/>
                            4. Enter a name (e.g., <em className="not-italic font-bold">Toolkit Pro</em>) and tap <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add"</strong>. The application will appear directly on your iOS home screen as an app icon.
                          </p>
                        </div>

                        {/* Android Chrome */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            On Android (Chrome)
                          </div>
                          <p className="text-[10.5px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                            1. Open the app link in Google Chrome.<br/>
                            2. A banner at the bottom of the screen may prompt you with: <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add Toolkit Pro to Home Screen"</strong>. Tap it.<br/>
                            3. Alternatively, tap the three dots menu in the top-right corner of Chrome and select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Install app"</strong> (or "Add to home screen").<br/>
                            4. Tap <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Install"</strong> to verify, and Android will place the high-fidelity launcher icon on your app drawer and home screen.
                          </p>
                        </div>
                      </div>

                      {/* Benefits Section */}
                      <div className="space-y-2 pt-1">
                        <h6 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                          ✨ Benefits of Installing as a PWA
                        </h6>
                        <div className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/15 border border-indigo-100/35 dark:border-indigo-900/20 rounded-xl space-y-2.5">
                          <div className="space-y-0.5">
                            <div className="text-[10.5px] font-black text-slate-800 dark:text-slate-250 flex items-center gap-1 font-sans">
                              💎 Standalone Canvas Experience
                            </div>
                            <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                              Runs without the browser tabs or top URL navigation bars, maximizing the visible canvas for the Quote Designer, QR Matrix Creator, and Lossless Image Compressor.
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[10.5px] font-black text-slate-800 dark:text-slate-250 flex items-center gap-1 font-sans">
                              ⚡ Instant Accessibility
                            </div>
                            <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                              Access the studio workspace anytime, direct from your desktop dock, applications list, or phone's home screen.
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[10.5px] font-black text-slate-800 dark:text-slate-250 flex items-center gap-1 font-sans">
                              🚀 Optimized Rendering
                            </div>
                            <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                              The service worker background caching reduces page-loading flickering and latency, allowing for high-performance creative execution.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT-HAND COLUMN: Developer Script/App Downloader Fetchers */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col h-full">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3 gap-3">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        2. Standalone app Downloader Fetchers
                      </h5>

                      {/* Script tabs selector */}
                      <div className="flex select-none gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg shrink-0">
                        <button
                          onClick={() => setActiveFetcherPlatform("node")}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                            activeFetcherPlatform === "node"
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          Node.js Sync
                        </button>
                        <button
                          onClick={() => setActiveFetcherPlatform("python")}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                            activeFetcherPlatform === "python"
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          Python Palettes
                        </button>
                        <button
                          onClick={() => setActiveFetcherPlatform("html")}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                            activeFetcherPlatform === "html"
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          Offline App Package
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      {activeFetcherPlatform === "node" 
                        ? "Execute this Node.js automation pipeline locally to systematically pull latest workspace configs and assets into a synced output directory."
                        : activeFetcherPlatform === "python"
                          ? "Run this Python utility on your desktop drive to format and compile local palette maps and styling metrics instantly."
                          : "Save this compiled self-contained single HTML utility package to run the layout previews in an environment entirely disconnected from our main network."}
                    </p>

                    {/* Copied alert tag */}
                    {copiedFetcherField && (
                      <div className="bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 p-2 text-[10.5px] font-bold text-center rounded-lg animate-fade-in font-sans">
                        🎉 Copied dedicated **{copiedFetcherField}** fetcher script code to clipboard!
                      </div>
                    )}

                    {/* Code view box */}
                    <div className="relative flex-1">
                      <div className="absolute top-2.5 right-2 text-[10px] font-mono font-black text-slate-500 select-none bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {activeFileName}
                      </div>
                      <pre className="bg-slate-900 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-[10px] dark:text-slate-300 text-slate-400 overflow-x-auto leading-relaxed max-h-[300px] overflow-y-auto select-all scrollbar-none">
                        {activeCode}
                      </pre>
                    </div>

                    {/* Downloader Trigger Row layout */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-50 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-450 truncate">
                        Format: <strong className="text-slate-700 dark:text-slate-300 font-bold">{activeMimeType}</strong> • Size: ~{Math.round(activeCode.length / 100) / 10} KB
                      </span>

                      <div className="flex items-center gap-2 select-none w-full sm:w-auto">
                        <button
                          onClick={() => handleCopyFetcherCode(activeCode, activeFetcherPlatform.toUpperCase() + " Script")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center p-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-805 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                        </button>
                        <button
                          onClick={() => handleDownloadFetcher(activeFileName, activeCode, activeMimeType)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center p-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 font-bold text-xs text-white shadow-md cursor-pointer cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Download Script File
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          );
        })()
      ) : subTab === "installation" ? (
        <div 
          role="tabpanel"
          id="resources-panel-installation"
          className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-250 animate-fade-in"
        >
          {/* Header Hero Card */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50/30 to-emerald-50/30 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-emerald-950/15 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 border border-emerald-150 dark:text-emerald-450 dark:bg-emerald-950/50 dark:border-emerald-900/40">
                  ⚡ Official PWA Standalone Client
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  High-Fidelity App Installer Guide
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Transform this web suite into an ultra-fast desktop or mobile software utility. PWAs run outside standard browser tabs, utilizing local offline browser hardware acceleration for frictionless, zero-latency workflows.
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-stretch gap-2.5 min-w-[200px]">
                <button
                  onClick={() => {
                    const navBtn = document.getElementById("btn-pwa-install-nav");
                    if (navBtn) {
                      navBtn.click();
                    } else {
                      alert("Please click the dedicated 'Install PWA' button in the top navbar header or follow the guides below to trigger installation in your specific browser version!");
                    }
                  }}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white hover:text-white hover:bg-indigo-700 transition-all duration-250 font-bold text-xs shadow-lg hover:shadow-indigo-500/20 active:scale-98 cursor-pointer select-none"
                >
                  🚀 Trigger Installer Prompt
                </button>
                <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium font-sans">
                  Compatible with Chrome, Safari, Edge, & custom containers
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desktop Installation Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-10 border-slate-100 dark:border-slate-850 pb-4">
                <div className="p-2 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <Monitor className="w-5 h-5 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    Laptop & Desktop Guides
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">
                    macOS, Windows, Linux, & ChromeOS
                  </p>
                </div>
              </div>

              {/* Guide 1 */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl relative space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-xs font-black text-slate-855 dark:text-slate-200 font-sans">
                      Using Google Chrome or Microsoft Edge
                    </span>
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/65 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-emerald-100/50 dark:border-emerald-900/40">
                      Standard PWA Setup
                    </span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 list-none font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                        1
                      </span>
                      <span>
                        Open the app link in your browser:{" "}
                        <a href="https://ais-dev-a46nakkyvhetoppmtctdod-190926376546.asia-southeast1.run.app" target="_blank" rel="noopener noreferrer" className="text-indigo-650 dark:text-indigo-400 font-semibold underline hover:text-indigo-800 dark:hover:text-indigo-300">
                          Development App Link
                        </a>{" "}
                        or{" "}
                        <a href="https://ais-pre-a46nakkyvhetoppmtctdod-190926376546.asia-southeast1.run.app" target="_blank" rel="noopener noreferrer" className="text-indigo-650 dark:text-indigo-400 font-semibold underline hover:text-indigo-800 dark:hover:text-indigo-300">
                          Shared App Link
                        </a>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                        2
                      </span>
                      <span>
                        In the address bar (on the right-hand side), you will see an <strong className="text-emerald-600 dark:text-emerald-450 font-bold">"Install" icon</strong> (a small monitor with a down-pointing arrow, or a plus <strong className="text-slate-700 dark:text-slate-300 font-bold">+</strong> icon depending on your browser version).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                        3
                      </span>
                      <span>
                        Click it, select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Install"</strong>, and the app will instantly launch in its own premium standalone window.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                        4
                      </span>
                      <span>
                        An app shortcut will also be added to your desktop/start menu.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Guide 2 */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-sans">
                    Using Safari on macOS
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 list-none font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono font-mono">
                        1
                      </span>
                      <span>Open the app’s link in Safari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono font-mono">
                        2
                      </span>
                      <span>
                        Click the <strong className="text-slate-700 dark:text-slate-300 font-bold">Share sheet button</strong> in the toolbar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono font-mono">
                        3
                      </span>
                      <span>
                        Scroll down and click <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add to Dock"</strong>.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Mobile Installation Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-4">
                <div className="p-2 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <Smartphone className="w-5 h-5 text-emerald-500 animate-bounce-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    Smartphones & Mobile Guides
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">
                    Apple iOS & Google Android Devices
                  </p>
                </div>
              </div>

              {/* iOS Safari */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between font-sans">
                    <span>On iPhone or iPad (Safari)</span>
                    <span className="text-[8.5px] font-mono font-bold text-slate-450 dark:text-slate-500 uppercase">iOS Standard</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 list-none font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                        1
                      </span>
                      <span>Navigate to the app address in Safari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        2
                      </span>
                      <span>
                        Tap the <strong className="text-slate-700 dark:text-slate-305 font-bold">Share icon</strong> (square with an up-pointing arrow) at the bottom toolbar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        3
                      </span>
                      <span>
                        Select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add to Home Screen"</strong> from the options grid.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        4
                      </span>
                      <span>
                        Enter a name (e.g., <em className="font-bold border-b border-indigo-100 dark:border-indigo-900/60 not-italic">Toolkit Pro</em>) and tap <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add"</strong>. The application will appear directly on your iOS home screen as an app icon.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Android Chrome */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-slate-805 dark:text-slate-200 flex items-center justify-between font-sans">
                    <span>On Android (Chrome)</span>
                    <span className="text-[8.5px] font-mono font-bold text-slate-450 dark:text-slate-500 uppercase">Android Standard</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 list-none font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        1
                      </span>
                      <span>Open the app link in Google Chrome.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        2
                      </span>
                      <span>
                        A banner at the bottom of the screen may prompt you with: <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Add Toolkit Pro to Home Screen"</strong>. Tap it.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        3
                      </span>
                      <span>
                        Alternatively, tap the three dots menu in the top-right corner of Chrome and select <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">"Install app"</strong> (or "Add to home screen").
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center shrink-0 h-5 w-5 bg-slate-200/60 dark:bg-slate-805 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-full font-mono">
                        4
                      </span>
                      <span>
                        Tap <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold font-semibold">"Install"</strong> to verify, and Android will place the high-fidelity launcher icon on your app drawer and home screen.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Cards Section */}
          <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 p-6 md:p-8 rounded-3xl space-y-6">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none font-sans">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Benefits of Installing as a PWA
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-3xl">
                Installing our Progressive Web App completely elevates your creative design workflows. Here are the core metrics and mechanics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-2 cursor-default hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-550 dark:text-indigo-400 text-xs font-black">
                    💎
                  </span>
                  Standalone Canvas Experience
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pl-7.5">
                  Runs without the browser tabs or top URL navigation bars, maximizing the visible canvas for the Quote Designer, QR Matrix Creator, and Lossless Image Compressor.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-2 cursor-default hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-555 dark:text-emerald-400 text-xs font-black">
                    🚀
                  </span>
                  Instant Accessibility
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pl-7.5">
                  Access the studio workspace anytime, direct from your desktop dock, applications list, or phone's home screen.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-2 cursor-default hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-550 dark:text-indigo-400 text-xs font-black">
                    ✨
                  </span>
                  Optimized Rendering
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pl-7.5">
                  The service worker background caching reduces page-loading flickering and latency, allowing for high-performance creative execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : selectedArticleId ? (

        // Detailed Article View
        (() => {
          const article = ARTICLES.find((a) => a.id === selectedArticleId);
          if (!article) return null;
          return (
            <div 
              role="tabpanel"
              id="resources-panel-articles"
              aria-labelledby="btn-subtab-articles"
              className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 animate-fade-in" 
              data-article-id={article.id}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Main Article Content */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Navigation Back */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <button
                      onClick={() => setSelectedArticleId(null)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-805 dark:hover:text-indigo-300 font-semibold cursor-pointer select-none"
                    >
                      ← Back to Articles list
                    </button>

                    {/* SEO Head Meta Injector HUD */}
                    <div className="bg-slate-100/50 dark:bg-slate-950/40 border border-slate-205/50 dark:border-slate-800/80 p-3 rounded-xl flex items-start gap-2.5 max-w-md text-[10px] sm:text-[11px] font-sans">
                      <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            SEO Meta Injector
                          </span>
                          <span className="bg-emerald-50/60 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[8px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase shrink-0 border border-emerald-100/40">
                            Active in HEAD
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] leading-relaxed break-all select-all select-none">
                          &lt;meta name=&quot;keywords&quot; content=&quot;<span className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeHeadKeywords}</span>&quot; /&gt;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </span>
                    </div>

                    <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {article.title}
                    </h4>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold italic border-l-4 border-slate-200 dark:border-slate-700 pl-4 py-1">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Text content paragraphs */}
                  <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {article.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Tips Section */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 rounded-xl p-4 sm:p-5 space-y-3">
                    <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      Expert Optimization Tips
                    </h5>
                    <ul className="space-y-2">
                      {article.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start text-xs text-slate-750 gap-2 leading-relaxed">
                          <span className="text-indigo-600 font-bold mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* FAQ Accordion Section */}
                  <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 bg-white/50 dark:bg-slate-900/40 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                        Frequently Asked Questions (FAQ)
                      </h5>
                    </div>
                    <div className="space-y-2.5">
                      {faqs.map((faq, idx) => {
                        const isOpen = expandedFaqIndex === idx;
                        return (
                          <div 
                            key={idx}
                            className="border border-slate-100/85 dark:border-slate-850/80 rounded-xl overflow-hidden transition-all duration-250 bg-white/40 dark:bg-slate-950/40"
                          >
                            <button
                              onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                              className="w-full flex items-center justify-between text-left p-3.5 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none select-none cursor-pointer"
                            >
                              <span className="pr-4">{faq.q}</span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none">
                                {isOpen ? "▲" : "▼"}
                              </span>
                            </button>
                            {isOpen && (
                              <div className="p-3.5 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium animate-fade-in">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Share / Confirm Badge and Feedback */}
                  <div className="flex items-center justify-between border-t border-slate-105 dark:border-slate-800 pt-5 text-xs">
                    <span className="text-slate-400">Published in Creator Hub • Ad-Enabled Resource</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async () => {
                          const shareUrl = `${window.location.origin}${window.location.pathname}?tab=resources&article=${article.id}`;
                          const shareData = {
                            title: article.title,
                            text: article.excerpt,
                            url: shareUrl,
                          };

                          if (navigator.share) {
                            try {
                              await navigator.share(shareData);
                              setShareFeedback("Shared successfully!");
                              setTimeout(() => setShareFeedback(null), 3000);
                            } catch (err) {
                              if ((err as Error).name !== 'AbortError') {
                                console.error('Error sharing:', err);
                                try {
                                  await navigator.clipboard.writeText(shareUrl);
                                  setShareFeedback("Copied to clipboard!");
                                } catch (_) {
                                  setShareFeedback("Could not copy link");
                                }
                                setTimeout(() => setShareFeedback(null), 3000);
                              }
                            }
                          } else {
                            try {
                              await navigator.clipboard.writeText(shareUrl);
                              setShareFeedback("Copied to clipboard!");
                            } catch (_) {
                              setShareFeedback("Could not copy link");
                            }
                            setTimeout(() => setShareFeedback(null), 3000);
                          }
                        }}
                        className="relative flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-820 text-slate-605 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all select-none"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share Article
                        {shareFeedback && (
                          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 animate-fade-in font-sans font-extrabold border border-slate-700/80 dark:border-slate-600/50">
                            {shareFeedback}
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => setSelectedArticleId(null)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold cursor-pointer"
                      >
                        Next Article
                      </button>
                    </div>
                  </div>
                </div>

                {/* Related Articles Sidebar */}
                <div id="related-articles-sidebar" className="lg:col-span-1 space-y-4">
                  <div className="bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                        Related Articles
                      </h5>
                    </div>

                    <div className="space-y-4">
                      {getRelatedArticles(article).map((related) => {
                        return (
                          <div
                            key={related.id}
                            id={`related-article-link-${related.id}`}
                            onClick={() => {
                              setSelectedArticleId(related.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="group p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-900/10 hover:border-indigo-100 dark:hover:border-indigo-900/40 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-200 cursor-pointer select-none space-y-2"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] scale-90 origin-left font-bold border ${getCategoryColor(related.category)}`}>
                                {related.category}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                {related.readTime}
                              </span>
                            </div>

                            <h6 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug font-sans">
                              {related.title}
                            </h6>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal">
                              {related.excerpt}
                            </p>

                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-200 font-bold transform translate-x-[-4px] group-hover:translate-x-0">
                              <span>Read article</span>
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* Grid list of high-value articles */
        <div 
          role="tabpanel"
          id="resources-panel-articles"
          aria-labelledby="btn-subtab-articles"
          className="grid grid-cols-1 md:grid-cols-2 gap-5" 
        >
          {ARTICLES.map((article) => {
            const Icon = article.icon;
            return (
              <div
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className="group border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-205 dark:hover:border-slate-700 hover:shadow-md hover:shadow-slate-100 dark:hover:shadow-slate-950 transition-all rounded-2xl p-5 cursor-pointer flex flex-col justify-between space-y-4"
                id={`article-card-${article.id}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {article.readTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {article.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-850 text-[11px] font-bold text-indigo-605 dark:text-indigo-400 group-hover:text-indigo-805 dark:group-hover:text-indigo-300">
                  <span className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 opacity-70" /> Read Full Guide
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}

          {/* General FAQ Accordion Section */}
          <div className="md:col-span-2 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 md:p-6 bg-slate-50/40 dark:bg-slate-900/20 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-150/80 dark:border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest leading-none">
                  Frequently Asked Creator Questions
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Answers to industry questions regarding image handling, schema encoding, and Web Vitals optimization.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-2xs h-fit"
                  >
                    <button
                      onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left p-3.5 bg-slate-50/30 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer outline-none select-none"
                    >
                      <span className="pr-2">{faq.q}</span>
                      <span className="text-[9px] text-slate-400 select-none">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-3.5 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-405 leading-relaxed font-semibold">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Value Added Info Banner */}
          <div className="md:col-span-2 bg-gradient-to-r from-slate-50 to-indigo-50/20 dark:from-slate-900/40 dark:to-indigo-950/20 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/30 p-4 shrink-0 flex items-start space-x-3 text-xs text-indigo-950">
            <HelpCircle className="w-5 h-5 text-indigo-505 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-indigo-900 dark:text-indigo-300">Why are these articles here?</strong>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1">
                To satisfy the strict **Google AdSense High Value Content & Original Material Policy**, our portal couples lightning-fast tools with comprehensive instructional guides. This ensures human reviewers see immediate rich editorial value on our domain, leading to swift first-time approvals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
