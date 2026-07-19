import React, { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { QuoteConfig, BgStyleType } from "../types";
import { uploadFileToDrive } from "../lib/drive";
import { triggerFileDownload } from "../lib/download";
import { Download, Cloud, Sparkles, Image as ImageIcon, Type, AlignLeft, AlignCenter, AlignRight, Check, Printer, Share2, Smartphone, LayoutGrid, Monitor, Upload, FileJson, Scissors, ExternalLink, X, Bold, Italic, FileText, Shield, Move, MousePointer, FolderArchive, Trash2, Plus, Link } from "lucide-react";

interface SavedVariant {
  id: string;
  timestamp: string;
  config: QuoteConfig;
  bgImage: string | null;
  typographyOffsetPageY: number;
  typographyOffsetPageX?: number;
  pdfWatermarkX: number;
  pdfWatermarkY: number;
  pdfWatermarkEnabled: boolean;
  pdfWatermarkText: string;
  pdfWatermarkColor: string;
  pdfWatermarkOpacity: number;
  pdfWatermarkAngle: number;
  pdfWatermarkFontSize: number;
}

interface QuoteDesignerProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => void;
}

const PRESET_GRADIENTS = [
  { name: "Sunset Woods", value: "linear-gradient(135deg, #f97316 0%, #a855f7 100%)", colors: ["#f97316", "#a855f7"] },
  { name: "Forest Canopy", value: "linear-gradient(135deg, #064e3b 0%, #111827 100%)", colors: ["#064e3b", "#111827"] },
  { name: "Ocean Breeze", value: "linear-gradient(135deg, #06b6d4 0%, #1d4ed8 100%)", colors: ["#06b6d4", "#1d4ed8"] },
  { name: "Aesthetic Mist", value: "linear-gradient(135deg, #475569 0%, #cbd5e1 100%)", colors: ["#475569", "#cbd5e1"] },
  { name: "Deep Violet", value: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", colors: ["#1e1b4b", "#4c1d95"] },
  { name: "Pacific Sunrise", value: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)", colors: ["#ff7e5f", "#feb47b"] },
  { name: "Alpine Spruce", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", colors: ["#11998e", "#38ef7d"] },
  { name: "Desert Sage", value: "linear-gradient(135deg, #9a8470 0%, #e2d4c9 100%)", colors: ["#9a8470", "#e2d4c9"] },
  { name: "Northern Lights", value: "linear-gradient(135deg, #0575e6 0%, #00f260 100%)", colors: ["#0575e6", "#00f260"] },
  { name: "Volcanic Ash", value: "linear-gradient(135deg, #141e30 0%, #243b55 100%)", colors: ["#141e30", "#243b55"] },
  { name: "Canyon Dawn", value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)", colors: ["#f12711", "#f5af19"] },
  { name: "Sakura Blossom", value: "linear-gradient(135deg, #fda4af 0%, #f43f5e 60%, #9f1239 100%)", colors: ["#fda4af", "#f43f5e"] },
  { name: "Arctic Crags", value: "linear-gradient(135deg, #2980b9 0%, #2b5876 50%, #4e4376 100%)", colors: ["#2980b9", "#2b5876"] }
];

const PRESET_SOLID_COLORS = [
  { name: "Minimal Charcoal", value: "#1e293b" },
  { name: "Warm Terracotta", value: "#c2410c" },
  { name: "Sage Garden", value: "#2d6a4f" },
  { name: "Creamy Soft", value: "#fafaf9" },
  { name: "Lavender Bliss", value: "#d8b4fe" },
  { name: "Ochre Gold", value: "#b45309" },
  { name: "Ocean Deep", value: "#0f172a" },
  { name: "Electric Indigo", value: "#4f46e5" },
  { name: "Rosewater Pink", value: "#fbcfe8" },
  { name: "Soft Mint", value: "#a7f3d0" },
  { name: "Desert Sand", value: "#f5e6d3" },
  { name: "Vintage Wine", value: "#5c0620" }
];

const PRESET_NOISE_PATTERNS = [
  { name: "Slate Grit", bgStyle: "color" as const, bgValue: "#1e293b", noiseOpacity: 0.15, description: "Textured industrial slate" },
  { name: "Warm Sandstone", bgStyle: "color" as const, bgValue: "#f5e6d3", noiseOpacity: 0.12, description: "Organic cream-sand grain" },
  { name: "Coarse Espresso", bgStyle: "color" as const, bgValue: "#271b15", noiseOpacity: 0.18, description: "Deeply roasted coffee tone" },
  { name: "Iridescent Nebula", bgStyle: "gradient" as const, bgValue: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", noiseOpacity: 0.14, description: "Celestial dust on deep violet" },
  { name: "Aesthetic Frost", bgStyle: "gradient" as const, bgValue: "linear-gradient(135deg, #475569 0%, #cbd5e1 100%)", noiseOpacity: 0.16, description: "Chilled concrete frozen grain" },
  { name: "Emerald Moss", bgStyle: "color" as const, bgValue: "#064e3b", noiseOpacity: 0.15, description: "Deep earthy forest ground" },
  { name: "Rose Quartz", bgStyle: "gradient" as const, bgValue: "linear-gradient(135deg, #fbcfe8 0%, #fda4af 100%)", noiseOpacity: 0.10, description: "Soft mineral on pastel pink" },
  { name: "Sunset Ash", bgStyle: "gradient" as const, bgValue: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)", noiseOpacity: 0.15, description: "Grainy vintage solar dust" }
];

const applyNoiseOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, opacity?: number) => {
  if (!opacity || opacity <= 0) return;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 128;
  tempCanvas.height = 128;
  const tempCtx = tempCanvas.getContext("2d");
  if (tempCtx) {
    const imgData = tempCtx.createImageData(128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = Math.floor(Math.random() * 255 * opacity * 0.45);
    }
    tempCtx.putImageData(imgData, 0, 0);
    const pattern = ctx.createPattern(tempCanvas, "repeat");
    if (pattern) {
      ctx.save();
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
};

interface QuotePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  aspectRatio: "1:1" | "9:16" | "3:1" | "16:9" | "4:5" | "7:4" | "4:7";
  fontSize: number;
  fontFamily: string;
  authorFontFamily?: string;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  padding: number;
  bgStyle?: "gradient" | "color" | "image";
  bgValue?: string;
  overlayOpacity?: number;
}

const SOCIAL_PRESETS: QuotePreset[] = [
  {
    id: "insta_story",
    name: "Instagram Story",
    badge: "9:16 Story",
    description: "Vertical tall format optimized for modern stories and reels",
    aspectRatio: "9:16",
    fontSize: 22,
    fontFamily: "Playfair Display",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 55,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #f97316 0%, #a855f7 100%)",
    overlayOpacity: 0.15
  },
  {
    id: "twitter_banner",
    name: "Twitter Banner",
    badge: "3:1 Header",
    description: "Ultra-wide header banner layout for cover imagery",
    aspectRatio: "3:1",
    fontSize: 18,
    fontFamily: "Space Grotesk",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 30,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #0575e6 0%, #00f260 100%)",
    overlayOpacity: 0.25
  },
  {
    id: "square_post",
    name: "Square Post",
    badge: "1:1 Classic",
    description: "Standard balanced format ideal for feeds and cards",
    aspectRatio: "1:1",
    fontSize: 28,
    fontFamily: "Playfair Display",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 40,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #fda4af 0%, #f43f5e 60%, #9f1239 100%)",
    overlayOpacity: 0.2
  },
  {
    id: "social_landscape",
    name: "Social Landscape",
    badge: "16:9 Wide",
    description: "Widescreen format standard for YouTube, Facebook, and Twitter posts",
    aspectRatio: "16:9",
    fontSize: 22,
    fontFamily: "Inter",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 45,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    overlayOpacity: 0.2
  },
  {
    id: "social_feed_portrait",
    name: "Instagram Portrait",
    badge: "4:5 Portrait",
    description: "Optimized vertical layout for Instagram and Facebook feed posts",
    aspectRatio: "4:5",
    fontSize: 24,
    fontFamily: "Space Grotesk",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 50,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    overlayOpacity: 0.15
  },
  {
    id: "business_card_landscape",
    name: "Business Card (Landscape)",
    badge: "3.5×2 Card",
    description: "Standard US landscape business card layout with elegant print layout",
    aspectRatio: "7:4",
    fontSize: 16,
    fontFamily: "Playfair Display",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 30,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    overlayOpacity: 0.25
  },
  {
    id: "business_card_portrait",
    name: "Business Card (Portrait)",
    badge: "2×3.5 Card",
    description: "Standard US vertical business card layout with refined editorial look",
    aspectRatio: "4:7",
    fontSize: 16,
    fontFamily: "Inter",
    fontColor: "#ffffff",
    textAlign: "center",
    padding: 35,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)",
    overlayOpacity: 0.2
  },
  {
    id: "minimal_serif",
    name: "Aesthetic Story",
    badge: "9:16 Editorial",
    description: "Left-aligned elegant typography with soft mist shades",
    aspectRatio: "9:16",
    fontSize: 24,
    fontFamily: "Playfair Display",
    fontColor: "#ffffff",
    textAlign: "left",
    padding: 60,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #475569 0%, #cbd5e1 100%)",
    overlayOpacity: 0.3
  },
  {
    id: "hacker_neon",
    name: "Terminal Banner",
    badge: "3:1 Tech",
    description: "Tech green layout styled in responsive monospaced fonts",
    aspectRatio: "3:1",
    fontSize: 16,
    fontFamily: "JetBrains Mono",
    fontColor: "#10b981",
    textAlign: "left",
    padding: 35,
    bgStyle: "gradient",
    bgValue: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    overlayOpacity: 0.1
  }
];

interface LayoutTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  fontFamily: string;
  authorFontFamily: string;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  padding: number;
  isBold: boolean;
  isItalic: boolean;
  overlayOpacity?: number;
  overlayBlur?: number;
  noiseOpacity?: number;
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    badge: "Spacious",
    description: "Elegant lightweight serif with spacious padding and small, subtle centered text.",
    fontFamily: "Playfair Display",
    authorFontFamily: "Inter",
    fontSize: 20,
    textAlign: "center",
    padding: 65,
    isBold: false,
    isItalic: true,
    overlayOpacity: 0.1,
    overlayBlur: 0,
    noiseOpacity: 0.05
  },
  {
    id: "bold_typography",
    name: "Bold Typography",
    badge: "Bold Display",
    description: "Compact, heavy geometric display fonts with tight spacing and left alignment.",
    fontFamily: "Bebas Neue",
    authorFontFamily: "Space Grotesk",
    fontSize: 42,
    textAlign: "left",
    padding: 30,
    isBold: true,
    isItalic: false,
    overlayOpacity: 0.25,
    overlayBlur: 0,
    noiseOpacity: 0
  },
  {
    id: "vintage",
    name: "Vintage",
    badge: "Earthy Warmth",
    description: "A gorgeous classic editorial serif with medium italic sizing and centered alignment.",
    fontFamily: "Cinzel",
    authorFontFamily: "Montserrat",
    fontSize: 26,
    textAlign: "center",
    padding: 45,
    isBold: false,
    isItalic: true,
    overlayOpacity: 0.2,
    overlayBlur: 0,
    noiseOpacity: 0.15
  },
  {
    id: "modern_tech",
    name: "Modern Tech",
    badge: "Sleek Mono",
    description: "Sleek grotesque and monospaced font combination, featuring sharp left-aligned styling.",
    fontFamily: "Space Grotesk",
    authorFontFamily: "JetBrains Mono",
    fontSize: 24,
    textAlign: "left",
    padding: 40,
    isBold: true,
    isItalic: false,
    overlayOpacity: 0.15,
    overlayBlur: 0,
    noiseOpacity: 0.08
  },
  {
    id: "artistic_playful",
    name: "Artistic Playful",
    badge: "Script",
    description: "Charming bold script letters with relaxed spacing and friendly accents.",
    fontFamily: "Lobster",
    authorFontFamily: "Outfit",
    fontSize: 32,
    textAlign: "center",
    padding: 50,
    isBold: false,
    isItalic: false,
    overlayOpacity: 0.12,
    overlayBlur: 0,
    noiseOpacity: 0.05
  },
  {
    id: "editorial_classic",
    name: "Classic Book",
    badge: "Symmetry",
    description: "Standard literary pairing of classical serif and sans fonts with generous margins.",
    fontFamily: "Playfair Display",
    authorFontFamily: "Montserrat",
    fontSize: 28,
    textAlign: "center",
    padding: 55,
    isBold: false,
    isItalic: false,
    overlayOpacity: 0.15,
    overlayBlur: 0,
    noiseOpacity: 0.1
  }
];

export interface PremadeTypographyTemplate {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  fontFamily: string;
  authorFontFamily: string;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  padding: number;
  isBold: boolean;
  isItalic: boolean;
  fontColor: string;
  overlayOpacity?: number;
  overlayBlur?: number;
  noiseOpacity?: number;
  typographyOffsetPageX?: number;
  typographyOffsetPageY?: number;
}

export const PREMADE_TYPOGRAPHY_TEMPLATES: PremadeTypographyTemplate[] = [
  {
    id: "modern_minimalist",
    name: "Modern Minimalist",
    category: "Minimalist",
    badge: "Sleek & Clean",
    description: "Centered, low-key, clean modern sans-serif typography with generous spacing and high contrast.",
    fontFamily: "Inter",
    authorFontFamily: "Space Grotesk",
    fontSize: 22,
    textAlign: "center",
    padding: 65,
    isBold: false,
    isItalic: false,
    fontColor: "#ffffff",
    overlayOpacity: 0.12,
    overlayBlur: 0,
    noiseOpacity: 0.03,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: 0
  },
  {
    id: "bold_editorial",
    name: "Bold Editorial",
    category: "Display",
    badge: "Editorial Cover",
    description: "Heavy, large-impact display serif header with high drama, left alignment, and tighter line padding.",
    fontFamily: "Cinzel",
    authorFontFamily: "Montserrat",
    fontSize: 32,
    textAlign: "left",
    padding: 35,
    isBold: true,
    isItalic: false,
    fontColor: "#ffffff",
    overlayOpacity: 0.25,
    overlayBlur: 0,
    noiseOpacity: 0.05,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: 0
  },
  {
    id: "vintage_serif",
    name: "Vintage Serif",
    category: "Classic",
    badge: "Timeless Lit",
    description: "Classic, highly elegant, bookish italic serif with a warm tinted overlay and comfortable centering.",
    fontFamily: "Playfair Display",
    authorFontFamily: "Montserrat",
    fontSize: 26,
    textAlign: "center",
    padding: 55,
    isBold: false,
    isItalic: true,
    fontColor: "#fef3c7", // light warm amber
    overlayOpacity: 0.18,
    overlayBlur: 0,
    noiseOpacity: 0.1,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: 0
  },
  {
    id: "brutalist_mono",
    name: "Brutalist Mono",
    category: "Technical",
    badge: "Cyber Deck",
    description: "Monospaced high-contrast cybernetic coding layout featuring left-aligned neon green values.",
    fontFamily: "JetBrains Mono",
    authorFontFamily: "JetBrains Mono",
    fontSize: 18,
    textAlign: "left",
    padding: 40,
    isBold: true,
    isItalic: false,
    fontColor: "#10b981", // emerald neon green
    overlayOpacity: 0.2,
    overlayBlur: 0,
    noiseOpacity: 0.15,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: 0
  },
  {
    id: "cinematic_monument",
    name: "Cinematic Monument",
    category: "Dramatic",
    badge: "Widescreen Drama",
    description: "Spacious uppercase geometric display layout optimized for clean, architectural proportions.",
    fontFamily: "Space Grotesk",
    authorFontFamily: "Inter",
    fontSize: 24,
    textAlign: "center",
    padding: 60,
    isBold: true,
    isItalic: false,
    fontColor: "#ffffff",
    overlayOpacity: 0.3,
    overlayBlur: 0,
    noiseOpacity: 0.08,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: -20
  },
  {
    id: "romantic_cursive",
    name: "Romantic Cursive",
    category: "Artistic",
    badge: "Fluid Poetry",
    description: "Soft flowing cursive script lettering with relaxed layout and warm, organic aesthetic.",
    fontFamily: "Lobster",
    authorFontFamily: "Outfit",
    fontSize: 30,
    textAlign: "center",
    padding: 45,
    isBold: false,
    isItalic: false,
    fontColor: "#ffe4e6", // rose-100
    overlayOpacity: 0.15,
    overlayBlur: 0,
    noiseOpacity: 0.05,
    typographyOffsetPageX: 0,
    typographyOffsetPageY: 10
  }
];

interface FontPairing {
  id: string;
  name: string;
  description: string;
  quoteFont: string;
  authorFont: string;
  category: "Serif" | "Sans" | "Display" | "Mono" | "Modern" | "Artistic";
}

const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "classic_editorial",
    name: "Classic Editorial",
    description: "Elegant serif with a clean, low-key modern sans-serif subtitle.",
    quoteFont: "Playfair Display",
    authorFont: "Inter",
    category: "Serif",
  },
  {
    id: "modern_tech",
    name: "Modern Tech",
    description: "Sleek and highly legible modern tech-inspired geometry.",
    quoteFont: "Space Grotesk",
    authorFont: "JetBrains Mono",
    category: "Mono",
  },
  {
    id: "bold_geometric",
    name: "Bold Geometric",
    description: "Striking heavy grotesque display font paired with high legibility.",
    quoteFont: "Montserrat",
    authorFont: "Inter",
    category: "Sans",
  },
  {
    id: "cinematic_serif",
    name: "Cinematic Roman",
    description: "Classical proportioned roman serif with a spacious modern subtitle.",
    quoteFont: "Cinzel",
    authorFont: "Montserrat",
    category: "Serif",
  },
  {
    id: "high_impact",
    name: "High Impact",
    description: "Condensed, high-energy statement caps paired with clean geometric labels.",
    quoteFont: "Bebas Neue",
    authorFont: "Inter",
    category: "Display",
  },
  {
    id: "futuristic_clean",
    name: "Futuristic Clean",
    description: "A friendly, ultra-modern geometric typeface with tech monospace accents.",
    quoteFont: "Outfit",
    authorFont: "JetBrains Mono",
    category: "Modern",
  },
  {
    id: "playful_retro",
    name: "Playful Retro",
    description: "Charming bold vintage script with a structured digital foundation.",
    quoteFont: "Lobster",
    authorFont: "Outfit",
    category: "Artistic",
  },
  {
    id: "friendly_chubby",
    name: "Friendly Display",
    description: "Chubby display lettering anchored with a sleek geometric subtext.",
    quoteFont: "Lilita One",
    authorFont: "Outfit",
    category: "Artistic",
  }
];

export default function QuoteDesigner({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
}: QuoteDesignerProps) {
  const [config, setConfig] = useState<QuoteConfig>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("quote_text")) {
        try {
          return {
            text: params.get("quote_text") || "",
            author: params.get("quote_author") || "",
            fontFamily: params.get("quote_font") || "Playfair Display",
            fontSize: parseInt(params.get("quote_size") || "28"),
            fontColor: params.get("quote_color") || "#ffffff",
            textAlign: (params.get("quote_align") as any) || "center",
            bgStyle: (params.get("quote_bg_style") as any) || "gradient",
            bgValue: params.get("quote_bg_val") || PRESET_GRADIENTS[0].value,
            overlayOpacity: parseFloat(params.get("quote_opacity") || "0.2"),
            overlayBlur: parseFloat(params.get("quote_blur") || "0"),
            padding: parseInt(params.get("quote_pad") || "40"),
            aspectRatio: (params.get("quote_aspect") as any) || "1:1",
            isBold: params.get("quote_bold") === "true",
            isItalic: params.get("quote_italic") === "true",
            noiseOpacity: parseFloat(params.get("quote_noise_op") || "0"),
            noisePreset: params.get("quote_noise_pre") || "none",
          };
        } catch (e) {
          console.error("Failed to parse quote config from URL params:", e);
        }
      }

      const persisted = localStorage.getItem("toolkit_pro_quote_config");
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          return {
            ...parsed,
            aspectRatio: parsed.aspectRatio || "1:1"
          };
        } catch (e) {
          console.error("Failed to parse quote config:", e);
        }
      }
    }
    return {
      text: "Only those who will risk going too far can possibly find out how far one can go.",
      author: "T.S. Eliot",
      fontFamily: "Playfair Display",
      fontSize: 28,
      fontColor: "#ffffff",
      textAlign: "center",
      bgStyle: "gradient",
      bgValue: PRESET_GRADIENTS[0].value,
      overlayOpacity: 0.2,
      overlayBlur: 0,
      padding: 40,
      aspectRatio: "1:1",
      isBold: false,
      isItalic: true,
      noiseOpacity: 0,
      noisePreset: "none",
    };
  });

  const [bgImage, setBgImage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_quote_bg_image");
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_quote_config", JSON.stringify(config));
    }
  }, [config]);

  // Handle files loaded from Drive Gallery or other tool triggers
  useEffect(() => {
    const handleDriveFile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.targetTab === "quote") {
        const { file } = customEvent.detail;
        if (file && file.dataUrl) {
          setBgImage(file.dataUrl);
          setConfig(prev => ({
            ...prev,
            bgStyle: "image",
            bgValue: file.dataUrl
          }));
        }
      }
    };
    window.addEventListener("toolkit-use-drive-file", handleDriveFile);
    return () => window.removeEventListener("toolkit-use-drive-file", handleDriveFile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (bgImage) {
        localStorage.setItem("toolkit_pro_quote_bg_image", bgImage);
      } else {
        localStorage.removeItem("toolkit_pro_quote_bg_image");
      }
    }
  }, [bgImage]);

  const [activeLibraryTab, setActiveLibraryTab] = useState<"gradients" | "solids" | "noise" | "photo">(() => {
    if (config.bgStyle === "image") return "photo";
    if (config.noiseOpacity !== undefined && config.noiseOpacity > 0) return "noise";
    if (config.bgStyle === "color") return "solids";
    return "gradients";
  });

  const [pdfWatermarkEnabled, setPdfWatermarkEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_pdf_watermark_enabled") === "true";
    }
    return false;
  });
  const [pdfWatermarkText, setPdfWatermarkText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_pdf_watermark_text") || "Toolkit Pro";
    }
    return "Toolkit Pro";
  });
  const [pdfWatermarkColor, setPdfWatermarkColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_pdf_watermark_color") || "#cccccc";
    }
    return "#cccccc";
  });
  const [pdfWatermarkOpacity, setPdfWatermarkOpacity] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_pdf_watermark_opacity");
      return stored ? parseFloat(stored) : 0.2;
    }
    return 0.2;
  });
  const [pdfWatermarkAngle, setPdfWatermarkAngle] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_pdf_watermark_angle");
      return stored ? parseInt(stored) : 30;
    }
    return 30;
  });
  const [pdfWatermarkFontSize, setPdfWatermarkFontSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_pdf_watermark_fontsize");
      return stored ? parseInt(stored) : 24;
    }
    return 24;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_pdf_watermark_enabled", pdfWatermarkEnabled ? "true" : "false");
      localStorage.setItem("toolkit_pro_pdf_watermark_text", pdfWatermarkText);
      localStorage.setItem("toolkit_pro_pdf_watermark_color", pdfWatermarkColor);
      localStorage.setItem("toolkit_pro_pdf_watermark_opacity", pdfWatermarkOpacity.toString());
      localStorage.setItem("toolkit_pro_pdf_watermark_angle", pdfWatermarkAngle.toString());
      localStorage.setItem("toolkit_pro_pdf_watermark_fontsize", pdfWatermarkFontSize.toString());
    }
  }, [pdfWatermarkEnabled, pdfWatermarkText, pdfWatermarkColor, pdfWatermarkOpacity, pdfWatermarkAngle, pdfWatermarkFontSize]);

  const [motionEnabled, setMotionEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_quote_motion_enabled") !== "false";
    }
    return true;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [downloadDpi, setDownloadDpi] = useState<number>(300); // Customizable export DPI
  const [previewZoom, setPreviewZoom] = useState<number>(1.0); // Dynamic inspection zoom level
  const [showBleed, setShowBleed] = useState<boolean>(false); // Visual print bleed boundary toggle
  const [snapToGrid, setSnapToGrid] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_quote_snap_to_grid") === "true";
    }
    return false;
  });
  const [showTemplatesSidebar, setShowTemplatesSidebar] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_show_templates_sidebar") !== "false";
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_show_templates_sidebar", showTemplatesSidebar ? "true" : "false");
    }
  }, [showTemplatesSidebar]);

  const [gridSize, setGridSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_quote_grid_size");
      return stored ? parseInt(stored) : 25;
    }
    return 25;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_quote_snap_to_grid", snapToGrid ? "true" : "false");
      localStorage.setItem("toolkit_pro_quote_grid_size", gridSize.toString());
    }
  }, [snapToGrid, gridSize]);

  // Handle notifying user about shared design template loading from URL params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("quote_text")) {
        setSaveStatus({
          success: true,
          msg: "Shared design template loaded successfully! Feel free to customize and re-share!"
        });
        // Clear URL parameters without reloading to keep address bar clean
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    }
  }, []);

  // Precision canvas panning states
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<"edit" | "pan">("edit");
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Direct canvas element dragging states
  const [isDraggingWatermark, setIsDraggingWatermark] = useState<boolean>(false);
  const [isDraggingTypography, setIsDraggingTypography] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; originalX: number; originalY: number }>({
    x: 0,
    y: 0,
    originalX: 0,
    originalY: 0,
  });

  // Watermark precision positioning coordinate states
  const [pdfWatermarkX, setPdfWatermarkX] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_pdf_watermark_x");
      return stored ? parseInt(stored) : 50;
    }
    return 50;
  });
  const [pdfWatermarkY, setPdfWatermarkY] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_pdf_watermark_y");
      return stored ? parseInt(stored) : 50;
    }
    return 50;
  });

  // Typography precision vertical position offset state (allows shifted layout alignments)
  const [typographyOffsetPageY, setTypographyOffsetPageY] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_typography_offset_y");
      return stored ? parseInt(stored) : 0;
    }
    return 0;
  });

  // Typography precision horizontal position offset state
  const [typographyOffsetPageX, setTypographyOffsetPageX] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_typography_offset_x");
      return stored ? parseInt(stored) : 0;
    }
    return 0;
  });

  // Quote area visual padding resize drag states
  const [activePaddingHandle, setActivePaddingHandle] = useState<"tl" | "tr" | "bl" | "br" | null>(null);
  const [paddingDragStart, setPaddingDragStart] = useState<{ clientX: number; clientY: number; originalPadding: number }>({
    clientX: 0,
    clientY: 0,
    originalPadding: 0,
  });

  // Sync typography positioning and watermark coordinates with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_pdf_watermark_x", pdfWatermarkX.toString());
      localStorage.setItem("toolkit_pro_pdf_watermark_y", pdfWatermarkY.toString());
      localStorage.setItem("toolkit_pro_typography_offset_y", typographyOffsetPageY.toString());
      localStorage.setItem("toolkit_pro_typography_offset_x", typographyOffsetPageX.toString());
    }
  }, [pdfWatermarkX, pdfWatermarkY, typographyOffsetPageY, typographyOffsetPageX]);

  // Saved Quote Session Variants state
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_quote_saved_variants");
      try {
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Failed to parse saved variants", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_quote_saved_variants", JSON.stringify(savedVariants));
    }
  }, [savedVariants]);

  const previewRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportConfigJson = () => {
    try {
      const exportData = {
        type: "QuoteCustomDesignLayout",
        version: "1.0",
        timestamp: new Date().toISOString(),
        config: config,
        bgImage: bgImage
      };
      
      const fileString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([fileString], { type: "application/json" });
      const cleanAuthor = (config.author || "quote").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      triggerFileDownload(blob, `quote_design_${cleanAuthor || "layout"}.json`);

      setSaveStatus({
        success: true,
        msg: "Layout configuration exported successfully as JSON!"
      });

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "share",
          title: "Design Exported",
          detail: `Exported JSON config for "${config.author || "Anonymous"}"`,
          icon: "Download",
          tab: "quote"
        }
      }));
    } catch (err: any) {
      console.error("Failed to export layout JSON:", err);
      setSaveStatus({
        success: false,
        msg: "JSON Export failed: " + (err.message || String(err))
      });
    }
  };

  const handleImportConfigJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const textStr = e.target?.result as string;
        const parsed = JSON.parse(textStr);
        
        if (parsed && parsed.config) {
          const loadedConfig = parsed.config;
          const mergedConfig: QuoteConfig = {
            text: loadedConfig.text || config.text,
            author: loadedConfig.author !== undefined ? loadedConfig.author : config.author,
            fontFamily: loadedConfig.fontFamily || config.fontFamily,
            authorFontFamily: loadedConfig.authorFontFamily !== undefined ? loadedConfig.authorFontFamily : (config.authorFontFamily || ""),
            fontSize: Number(loadedConfig.fontSize) || config.fontSize,
            fontColor: loadedConfig.fontColor || config.fontColor,
            textAlign: loadedConfig.textAlign || config.textAlign,
            bgStyle: loadedConfig.bgStyle || config.bgStyle,
            bgValue: loadedConfig.bgValue || config.bgValue,
            overlayOpacity: loadedConfig.overlayOpacity !== undefined ? Number(loadedConfig.overlayOpacity) : config.overlayOpacity,
            overlayBlur: loadedConfig.overlayBlur !== undefined ? Number(loadedConfig.overlayBlur) : config.overlayBlur,
            padding: loadedConfig.padding !== undefined ? Number(loadedConfig.padding) : config.padding,
            aspectRatio: loadedConfig.aspectRatio || config.aspectRatio || "1:1"
          };
          
          setConfig(mergedConfig);
          if (parsed.bgImage) {
            setBgImage(parsed.bgImage);
          } else {
            setBgImage(null);
          }
          
          setSaveStatus({
            success: true,
            msg: "Layout configuration re-imported successfully!"
          });
          
          window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
            detail: {
              type: "share",
              title: "Design Imported",
              detail: `Imported card layout for "${mergedConfig.author || "Anonymous"}"`,
              icon: "Sparkles",
              tab: "quote"
            }
          }));
        } else {
          throw new Error("Invalid design configuration format (missing configuration block).");
        }
      } catch (err: any) {
        console.error("JSON Import failed:", err);
        setSaveStatus({
          success: false,
          msg: "Import failed. Invalid or corrupt JSON config: " + (err.message || String(err))
        });
      }
    };
    reader.onerror = () => {
      setSaveStatus({
        success: false,
        msg: "Failed to read file."
      });
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, []);

  const generateRandomQuote = () => {
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }
    setIsGeneratingQuote(true);

    const curatedQuotes = [
      { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
      { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
      { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "Act as if what you do makes a difference. It does.", author: "William James" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
      { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" }
    ];

    quoteTimeoutRef.current = setTimeout(() => {
      const available = curatedQuotes.filter(q => q.text !== config.text);
      const selected = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)]
        : curatedQuotes[Math.floor(Math.random() * curatedQuotes.length)];

      setConfig((prev) => ({
        ...prev,
        text: selected.text,
        author: selected.author
      }));
      setIsGeneratingQuote(false);
    }, 800);
  };

  // Auto-hide alert
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const [isAutoFitting, setIsAutoFitting] = useState<boolean>(false);

  const handleAutoFitCanvas = () => {
    if (!bgImage) return;
    setIsAutoFitting(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const aspectParts = config.aspectRatio.split(":");
        const wRatio = parseFloat(aspectParts[0]) || 1;
        const hRatio = parseFloat(aspectParts[1]) || 1;
        const targetRatio = wRatio / hRatio;

        const imgWidth = img.width;
        const imgHeight = img.height;
        const imageRatio = imgWidth / imgHeight;

        let cropWidth = imgWidth;
        let cropHeight = imgHeight;
        let cropX = 0;
        let cropY = 0;

        if (imageRatio > targetRatio) {
          cropHeight = imgHeight;
          cropWidth = imgHeight * targetRatio;
          cropX = (imgWidth - cropWidth) / 2;
          cropY = 0;
        } else {
          cropWidth = imgWidth;
          cropHeight = imgWidth / targetRatio;
          cropX = 0;
          cropY = (imgHeight - cropHeight) / 2;
        }

        const MAX_SIDE = 1800;
        let canvasWidth = cropWidth;
        let canvasHeight = cropHeight;
        if (Math.max(canvasWidth, canvasHeight) > MAX_SIDE) {
          const scale = MAX_SIDE / Math.max(canvasWidth, canvasHeight);
          canvasWidth = Math.round(canvasWidth * scale);
          canvasHeight = Math.round(canvasHeight * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvasWidth,
            canvasHeight
          );
          
          const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
          setBgImage(croppedDataUrl);
          setConfig((prev) => ({
            ...prev,
            bgStyle: "image",
            bgValue: croppedDataUrl,
          }));
        }
      } catch (err) {
        console.error("Failed to crop background image:", err);
        alert("Could not crop background image due to canvas rendering or cross-origin restrictions.");
      } finally {
        setIsAutoFitting(false);
      }
    };

    img.onerror = () => {
      setIsAutoFitting(false);
      alert("Error loading the active background image.");
    };

    img.src = bgImage;
  };

  const handleImageFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select or drop a valid image file (JPEG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultStr = event.target.result as string;
        setBgImage(resultStr);
        setConfig((prev) => ({
          ...prev,
          bgStyle: "image",
          bgValue: resultStr,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFileProcess(file);
    }
  };

  const getCanvasDataUrl = (forcedDpi?: number): Promise<string> => {
    const dpi = forcedDpi || downloadDpi;
    const targetSize = Math.round(8 * dpi); // standard baseline represents an 8" x 8" press layout
    return new Promise((resolve, reject) => {
      let baseWidth = 800;
      let baseHeight = 800;
      if (config.aspectRatio === "9:16") {
        baseWidth = 450;
        baseHeight = 800;
      } else if (config.aspectRatio === "3:1") {
        baseWidth = 900;
        baseHeight = 300;
      } else if (config.aspectRatio === "16:9") {
        baseWidth = 800;
        baseHeight = 450;
      } else if (config.aspectRatio === "4:5") {
        baseWidth = 640;
        baseHeight = 800;
      } else if (config.aspectRatio === "7:4") {
        baseWidth = 700;
        baseHeight = 400;
      } else if (config.aspectRatio === "4:7") {
        baseWidth = 400;
        baseHeight = 700;
      }

      // scale so that max side meets expected targetSize
      const maxSide = Math.max(baseWidth, baseHeight);
      const targetWidth = Math.round((baseWidth / maxSide) * targetSize);
      const targetHeight = Math.round((baseHeight / maxSide) * targetSize);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Could not get canvas context");
        return;
      }

      const scale = targetWidth / baseWidth;
      ctx.scale(scale, scale);

      const drawTextAndResolve = () => {
        // Draw overlay if blur/color
        if (config.overlayOpacity > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${config.overlayOpacity})`;
          ctx.fillRect(0, 0, baseWidth, baseHeight);
        }

        // Draw overlay blur representation
        // (canvas doesn't filter perfectly instantly, but can apply image filter if supported)
        if (config.overlayBlur > 0) {
          ctx.filter = `blur(${config.overlayBlur}px)`;
          // Re-draw background slightly blurred
          ctx.filter = "none";
        }

        // Configure typography
        ctx.fillStyle = config.fontColor;
        ctx.textBaseline = "middle";

        // Map alignment
        ctx.textAlign = config.textAlign;
        let x = baseWidth / 2; // Center default
        if (config.textAlign === "left") x = config.padding * 1.5;
        if (config.textAlign === "right") x = baseWidth - config.padding * 1.5;
        x += typographyOffsetPageX;

        // Wrap text
        const maxTextWidth = baseWidth - config.padding * 3;
        const canvasFontStyle = config.isItalic !== undefined ? (config.isItalic ? "italic" : "normal") : (config.fontStyle || "italic");
        const canvasFontWeight = config.isBold ? "bold" : "500";
        ctx.font = `${canvasFontStyle} ${canvasFontWeight} ${config.fontSize * 1.5}px "${config.fontFamily}", Georgia, serif`;
        const words = config.text.split(" ");
        let line = "";
        const lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxTextWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        const textLineHeight = config.fontSize * 2.2;
        const totalTextHeight = lines.length * textLineHeight;
        
        // Calculate start Y to center block vertically, adjusted by precise typography offset
        let startY = (baseHeight / 2 - totalTextHeight / 2) + typographyOffsetPageY;

        // Draw multiple lines of quote text
        lines.forEach((lineText, index) => {
          ctx.fillText(lineText, x, startY + index * textLineHeight);
        });

        // Draw Author
        if (config.author) {
          ctx.font = `600 ${config.fontSize * 0.9}px "${config.authorFontFamily || config.fontFamily}", sans-serif`;
          ctx.fillStyle = config.fontColor === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
          const authorY = startY + (lines.length * textLineHeight) + 40;
          ctx.fillText(`— ${config.author}`, x, authorY);
        }

        // Draw Watermark if enabled and text exists
        if (pdfWatermarkEnabled && pdfWatermarkText) {
          ctx.save();
          let r = 204, g = 204, b = 204;
          if (/^#[0-9A-F]{6}$/i.test(pdfWatermarkColor)) {
            r = parseInt(pdfWatermarkColor.slice(1, 3), 16);
            g = parseInt(pdfWatermarkColor.slice(3, 5), 16);
            b = parseInt(pdfWatermarkColor.slice(5, 7), 16);
          }
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pdfWatermarkOpacity})`;
          ctx.font = `bold ${pdfWatermarkFontSize * 1.5}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          const wX = baseWidth * (pdfWatermarkX / 100);
          const wY = baseHeight * (pdfWatermarkY / 100);
          
          ctx.translate(wX, wY);
          ctx.rotate((pdfWatermarkAngle * Math.PI) / 180);
          ctx.fillText(pdfWatermarkText, 0, 0);
          ctx.restore();
        }

        resolve(canvas.toDataURL("image/png"));
      };

      // Draw background
      if (config.bgStyle === "image" && bgImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Calculate scale & center crop (aspect fill)
          const scale = Math.max(baseWidth / img.width, baseHeight / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const imgX = (baseWidth - w) / 2;
          const imgY = (baseHeight - h) / 2;
          
          ctx.drawImage(img, imgX, imgY, w, h);
          applyNoiseOnCanvas(ctx, baseWidth, baseHeight, config.noiseOpacity);
          drawTextAndResolve();
        };
        img.onerror = () => {
          // Fallback to solid standard color if image load fails
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, baseWidth, baseHeight);
          applyNoiseOnCanvas(ctx, baseWidth, baseHeight, config.noiseOpacity);
          drawTextAndResolve();
        };
        img.src = bgImage;
      } else if (config.bgStyle === "gradient") {
        // Parse gradient colors or use default linear
        const activePreset = PRESET_GRADIENTS.find(p => p.value === config.bgValue) || PRESET_GRADIENTS[0];
        const colors = activePreset.colors || ["#f97316", "#a855f7"];
        const grad = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        applyNoiseOnCanvas(ctx, baseWidth, baseHeight, config.noiseOpacity);
        drawTextAndResolve();
      } else {
        // Solid color
        ctx.fillStyle = config.bgValue;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        applyNoiseOnCanvas(ctx, baseWidth, baseHeight, config.noiseOpacity);
        drawTextAndResolve();
      }
    });
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await getCanvasDataUrl();
      const cleanAuthor = config.author.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "quote";
      const filename = `toolkit_pro_quote_${cleanAuthor}.png`;
      triggerFileDownload(dataUrl, filename);

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Created Quote Card",
          detail: `Downloaded graphics card styled for "${config.author || "Anonymous"}"`,
          icon: "Quote",
          tab: "quote"
        }
      }));
    } catch (err) {
      console.error(err);
      setSaveStatus({ success: false, msg: "Failed to render card for download." });
    }
  };

  const renderVariantToDataUrl = (variant: SavedVariant, forcedDpi?: number): Promise<string> => {
    const dpi = forcedDpi || downloadDpi;
    const targetSize = Math.round(8 * dpi);
    return new Promise((resolve, reject) => {
      let baseWidth = 800;
      let baseHeight = 800;
      if (variant.config.aspectRatio === "9:16") {
        baseWidth = 450;
        baseHeight = 800;
      } else if (variant.config.aspectRatio === "3:1") {
        baseWidth = 900;
        baseHeight = 300;
      } else if (variant.config.aspectRatio === "16:9") {
        baseWidth = 800;
        baseHeight = 450;
      } else if (variant.config.aspectRatio === "4:5") {
        baseWidth = 640;
        baseHeight = 800;
      } else if (variant.config.aspectRatio === "7:4") {
        baseWidth = 700;
        baseHeight = 400;
      } else if (variant.config.aspectRatio === "4:7") {
        baseWidth = 400;
        baseHeight = 700;
      }

      const maxSide = Math.max(baseWidth, baseHeight);
      const targetWidth = Math.round((baseWidth / maxSide) * targetSize);
      const targetHeight = Math.round((baseHeight / maxSide) * targetSize);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Could not get canvas context");
        return;
      }

      const scale = targetWidth / baseWidth;
      ctx.scale(scale, scale);

      const drawTextAndResolve = () => {
        if (variant.config.overlayOpacity > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${variant.config.overlayOpacity})`;
          ctx.fillRect(0, 0, baseWidth, baseHeight);
        }

        ctx.fillStyle = variant.config.fontColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = variant.config.textAlign;

        let x = baseWidth / 2;
        if (variant.config.textAlign === "left") x = variant.config.padding * 1.5;
        if (variant.config.textAlign === "right") x = baseWidth - variant.config.padding * 1.5;
        x += (variant.typographyOffsetPageX || 0);

        const maxTextWidth = baseWidth - variant.config.padding * 3;
        const canvasFontStyle = variant.config.isItalic !== undefined ? (variant.config.isItalic ? "italic" : "normal") : (variant.config.fontStyle || "italic");
        const canvasFontWeight = variant.config.isBold ? "bold" : "500";
        ctx.font = `${canvasFontStyle} ${canvasFontWeight} ${variant.config.fontSize * 1.5}px "${variant.config.fontFamily}", Georgia, serif`;

        const words = variant.config.text.split(" ");
        let line = "";
        const lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        const textLineHeight = variant.config.fontSize * 2.2;
        const totalTextHeight = lines.length * textLineHeight;
        const startY = (baseHeight / 2 - totalTextHeight / 2) + variant.typographyOffsetPageY;

        lines.forEach((lineText, index) => {
          ctx.fillText(lineText, x, startY + index * textLineHeight);
        });

        if (variant.config.author) {
          ctx.font = `600 ${variant.config.fontSize * 0.9}px "${variant.config.authorFontFamily || variant.config.fontFamily}", sans-serif`;
          ctx.fillStyle = variant.config.fontColor === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
          const authorY = startY + (lines.length * textLineHeight) + 40;
          ctx.fillText(`— ${variant.config.author}`, x, authorY);
        }

        if (variant.pdfWatermarkEnabled && variant.pdfWatermarkText) {
          ctx.save();
          let r = 204, g = 204, b = 204;
          if (/^#[0-9A-F]{6}$/i.test(variant.pdfWatermarkColor)) {
            r = parseInt(variant.pdfWatermarkColor.slice(1, 3), 16);
            g = parseInt(variant.pdfWatermarkColor.slice(3, 5), 16);
            b = parseInt(variant.pdfWatermarkColor.slice(5, 7), 16);
          }
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${variant.pdfWatermarkOpacity})`;
          ctx.font = `bold ${variant.pdfWatermarkFontSize * 1.5}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const wX = baseWidth * (variant.pdfWatermarkX / 100);
          const wY = baseHeight * (variant.pdfWatermarkY / 100);

          ctx.translate(wX, wY);
          ctx.rotate((variant.pdfWatermarkAngle * Math.PI) / 180);
          ctx.fillText(variant.pdfWatermarkText, 0, 0);
          ctx.restore();
        }

        resolve(canvas.toDataURL("image/png"));
      };

      if (variant.config.bgStyle === "image" && variant.bgImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const scale = Math.max(baseWidth / img.width, baseHeight / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const imgX = (baseWidth - w) / 2;
          const imgY = (baseHeight - h) / 2;
          ctx.drawImage(img, imgX, imgY, w, h);
          applyNoiseOnCanvas(ctx, baseWidth, baseHeight, variant.config.noiseOpacity);
          drawTextAndResolve();
        };
        img.onerror = () => {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, baseWidth, baseHeight);
          applyNoiseOnCanvas(ctx, baseWidth, baseHeight, variant.config.noiseOpacity);
          drawTextAndResolve();
        };
        img.src = variant.bgImage;
      } else if (variant.config.bgStyle === "gradient") {
        const activePreset = PRESET_GRADIENTS.find(p => p.value === variant.config.bgValue) || PRESET_GRADIENTS[0];
        const colors = activePreset.colors || ["#f97316", "#a855f7"];
        const grad = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        applyNoiseOnCanvas(ctx, baseWidth, baseHeight, variant.config.noiseOpacity);
        drawTextAndResolve();
      } else {
        ctx.fillStyle = variant.config.bgValue;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        applyNoiseOnCanvas(ctx, baseWidth, baseHeight, variant.config.noiseOpacity);
        drawTextAndResolve();
      }
    });
  };

  const handleSaveCurrentVariant = () => {
    const newVariant: SavedVariant = {
      id: "variant_" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      config: JSON.parse(JSON.stringify(config)),
      bgImage: bgImage,
      typographyOffsetPageY: typographyOffsetPageY,
      typographyOffsetPageX: typographyOffsetPageX,
      pdfWatermarkX: pdfWatermarkX,
      pdfWatermarkY: pdfWatermarkY,
      pdfWatermarkEnabled: pdfWatermarkEnabled,
      pdfWatermarkText: pdfWatermarkText,
      pdfWatermarkColor: pdfWatermarkColor,
      pdfWatermarkOpacity: pdfWatermarkOpacity,
      pdfWatermarkAngle: pdfWatermarkAngle,
      pdfWatermarkFontSize: pdfWatermarkFontSize,
    };
    setSavedVariants(prev => [...prev, newVariant]);
    setSaveStatus({
      success: true,
      msg: "Saved design snapshot to session variants list!"
    });
    
    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "bookmark",
        title: "Saved Quote Variant",
        detail: `Saved layout snapshot for "${config.author || "Anonymous"}"`,
        icon: "Plus",
        tab: "quote"
      }
    }));
  };

  const handleLoadVariant = (variant: SavedVariant) => {
    setConfig(JSON.parse(JSON.stringify(variant.config)));
    setBgImage(variant.bgImage);
    setTypographyOffsetPageY(variant.typographyOffsetPageY);
    setTypographyOffsetPageX(variant.typographyOffsetPageX || 0);
    setPdfWatermarkX(variant.pdfWatermarkX);
    setPdfWatermarkY(variant.pdfWatermarkY);
    setPdfWatermarkEnabled(variant.pdfWatermarkEnabled);
    setPdfWatermarkText(variant.pdfWatermarkText);
    setPdfWatermarkColor(variant.pdfWatermarkColor);
    setPdfWatermarkOpacity(variant.pdfWatermarkOpacity);
    setPdfWatermarkAngle(variant.pdfWatermarkAngle);
    setPdfWatermarkFontSize(variant.pdfWatermarkFontSize);

    setSaveStatus({
      success: true,
      msg: "Loaded variant design rules onto workspace!"
    });
  };

  const handleDeleteVariant = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedVariants(prev => prev.filter(v => v.id !== id));
    setSaveStatus({
      success: true,
      msg: "Deleted snapshot from session list."
    });
  };

  const handleDownloadSingleVariant = async (variant: SavedVariant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const dataUrl = await renderVariantToDataUrl(variant);
      const cleanAuthor = (variant.config.author || "quote").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `toolkit_pro_quote_${cleanAuthor}_variant.png`;
      triggerFileDownload(dataUrl, filename);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, msg: "Failed to render card variant: " + (err.message || String(err)) });
    }
  };

  const handleBatchExportZip = async () => {
    if (savedVariants.length === 0) {
      alert("No saved variants to export! Please save some configurations first.");
      return;
    }
    
    setIsSaving(true);
    setSaveStatus({ success: true, msg: "Compressing and generating ZIP archive..." });
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < savedVariants.length; i++) {
        const variant = savedVariants[i];
        const dataUrl = await renderVariantToDataUrl(variant);
        const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
        
        const cleanAuthor = (variant.config.author || "quote").replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const filename = `variant_${i + 1}_${cleanAuthor}_${variant.config.aspectRatio.replace(":", "x")}.png`;
        zip.file(filename, base64Data, { base64: true });
      }
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      triggerFileDownload(zipBlob, `quote_variants_${timestamp}.zip`);
      
      setSaveStatus({ success: true, msg: `Successfully exported ${savedVariants.length} variants in a single ZIP!` });

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Batch Exported ZIP",
          detail: `Exported ${savedVariants.length} customized quote variants in a single ZIP file`,
          icon: "FolderArchive",
          tab: "quote"
        }
      }));
    } catch (err: any) {
      console.error("Batch ZIP export failed:", err);
      setSaveStatus({ success: false, msg: "Failed to generate ZIP archive: " + (err.message || String(err)) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const dataUrl = await getCanvasDataUrl();
      const cleanAuthor = config.author.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "quote";
      const filename = `toolkit_pro_quote_${cleanAuthor}.pdf`;

      let pdfWidthInches = 8;
      let pdfHeightInches = 8;
      if (config.aspectRatio === "9:16") {
        pdfWidthInches = 4.5;
        pdfHeightInches = 8;
      } else if (config.aspectRatio === "3:1") {
        pdfWidthInches = 9;
        pdfHeightInches = 3;
      } else if (config.aspectRatio === "16:9") {
        pdfWidthInches = 8;
        pdfHeightInches = 4.5;
      } else if (config.aspectRatio === "4:5") {
        pdfWidthInches = 6.4;
        pdfHeightInches = 8;
      } else if (config.aspectRatio === "7:4") {
        pdfWidthInches = 3.5;
        pdfHeightInches = 2;
      } else if (config.aspectRatio === "4:7") {
        pdfWidthInches = 2;
        pdfHeightInches = 3.5;
      }

      const orientation = pdfWidthInches > pdfHeightInches ? "landscape" : "portrait";
      const doc = new jsPDF({
        orientation: orientation,
        unit: "in",
        format: [pdfWidthInches, pdfHeightInches],
        compress: true
      });

      doc.addImage(dataUrl, "PNG", 0, 0, pdfWidthInches, pdfHeightInches, undefined, "FAST");

      if (pdfWatermarkEnabled && pdfWatermarkText) {
        try {
          if (typeof (doc as any).saveGraphicsState === "function") {
            (doc as any).saveGraphicsState();
          }
          if (typeof (doc as any).GState === "function") {
            const gState = new (doc as any).GState({ opacity: pdfWatermarkOpacity });
            (doc as any).setGState(gState);
          }
        } catch (e) {
          console.warn("PDF GState opacity not supported, using fallback rendering:", e);
        }

        // Convert hex color to rgb
        let r = 128, g = 128, b = 128;
        if (/^#[0-9A-F]{6}$/i.test(pdfWatermarkColor)) {
          r = parseInt(pdfWatermarkColor.slice(1, 3), 16);
          g = parseInt(pdfWatermarkColor.slice(3, 5), 16);
          b = parseInt(pdfWatermarkColor.slice(5, 7), 16);
        }
        
        doc.setTextColor(r, g, b);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(pdfWatermarkFontSize);

        // Position of document page based on user coordinate settings
        const cx = pdfWidthInches * (pdfWatermarkX / 100);
        const cy = pdfHeightInches * (pdfWatermarkY / 100);

        doc.text(pdfWatermarkText, cx, cy, {
          align: "center",
          angle: pdfWatermarkAngle,
          baseline: "middle"
        });

        try {
          if (typeof (doc as any).restoreGraphicsState === "function") {
            (doc as any).restoreGraphicsState();
          }
        } catch (e) {}
      }

      doc.save(filename);

      setSaveStatus({ success: true, msg: "Successfully generated print-ready PDF!" });

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Created PDF Quote",
          detail: `Downloaded high-res print PDF styled for "${config.author || "Anonymous"}"`,
          icon: "FileText",
          tab: "quote"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, msg: err.message || "Failed to render card for PDF download." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!user || !accessToken) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      "Save this customized quote card as a PNG image to your Google Drive?"
    );
    if (!confirmSave) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const dataUrl = await getCanvasDataUrl();
      const cleanAuthor = config.author.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "quote";
      const filename = `Quote_Designer_${cleanAuthor || "creator"}.png`;

      await uploadFileToDrive(accessToken, filename, "image/png", dataUrl);
      setSaveStatus({ success: true, msg: `Successfully uploaded "${filename}" to Google Drive!` });
      onRefreshDrive();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Saved Quote to Drive",
          detail: `Uploaded quote graphics block "${filename}"`,
          icon: "Cloud",
          tab: "quote"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, msg: err.message || "Failed to save file to Google Drive." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      const params = new URLSearchParams();
      params.set("quote_text", config.text);
      params.set("quote_author", config.author);
      params.set("quote_font", config.fontFamily);
      params.set("quote_size", config.fontSize.toString());
      params.set("quote_color", config.fontColor);
      params.set("quote_align", config.textAlign);
      params.set("quote_bg_style", config.bgStyle || "gradient");
      params.set("quote_bg_val", config.bgValue || "");
      params.set("quote_opacity", config.overlayOpacity.toString());
      params.set("quote_blur", config.overlayBlur.toString());
      params.set("quote_pad", config.padding.toString());
      params.set("quote_aspect", config.aspectRatio);
      params.set("quote_bold", config.isBold ? "true" : "false");
      params.set("quote_italic", config.isItalic ? "true" : "false");
      params.set("quote_noise_op", (config.noiseOpacity || 0).toString());
      params.set("quote_noise_pre", config.noisePreset || "none");

      // Generate the full URL
      const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setSaveStatus({
          success: true,
          msg: "Shareable configuration link copied to clipboard! Share it with anyone to load this exact design layout.",
        });

        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "share",
            title: "Copied Quote Config Link",
            detail: `Generated custom design share link for quote by "${config.author || "Anonymous"}"`,
            icon: "Link",
            tab: "quote"
          }
        }));
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (err: any) {
      console.error("Error generating shareable URL link:", err);
      setSaveStatus({
        success: false,
        msg: "Failed to generate copyable URL link: " + (err.message || String(err)),
      });
    }
  };

  const handleShare = async () => {
    try {
      const dataUrl = await getCanvasDataUrl();
      const cleanAuthor = config.author.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "quote";
      const filename = `toolkit_pro_quote_${cleanAuthor}.png`;

      // Convert standard Data URL to a File object for the native sharing sheet
      const resBlob = await fetch(dataUrl);
      const blob = await resBlob.blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Toolkit Pro - Visual Quote Design",
            text: `Check out this quote card I designed with Toolkit Pro: "${config.text}" — ${config.author || "Anonymous"}`,
          });
        } else {
          await navigator.share({
            title: "Toolkit Pro - Visual Quote Design",
            text: `"${config.text}" — ${config.author || "Anonymous"}`,
            url: window.location.href,
          });
        }
      } else {
        // Safe clipboard capture fallback
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`"${config.text}" — ${config.author || "Anonymous"}`);
          setSaveStatus({
            success: true,
            msg: "Web Sharing is limited on this browser configuration. The quote text has been saved to your Clipboard instead!",
          });
        } else {
          setSaveStatus({
            success: false,
            msg: "Sharing is not supported on this browser or security context.",
          });
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error sharing quote:", err);
        setSaveStatus({
          success: false,
          msg: "Could not share: " + (err.message || String(err)),
        });
      }
    }
  };

  const applyPremadeTemplate = (tmpl: PremadeTypographyTemplate) => {
    setConfig((prev) => ({
      ...prev,
      fontFamily: tmpl.fontFamily,
      authorFontFamily: tmpl.authorFontFamily,
      fontSize: tmpl.fontSize,
      fontColor: tmpl.fontColor,
      textAlign: tmpl.textAlign,
      padding: tmpl.padding,
      isBold: tmpl.isBold,
      isItalic: tmpl.isItalic,
      ...(tmpl.overlayOpacity !== undefined ? { overlayOpacity: tmpl.overlayOpacity } : {}),
      ...(tmpl.overlayBlur !== undefined ? { overlayBlur: tmpl.overlayBlur } : {}),
      ...(tmpl.noiseOpacity !== undefined ? { noiseOpacity: tmpl.noiseOpacity } : {}),
    }));
    if (tmpl.typographyOffsetPageX !== undefined) {
      setTypographyOffsetPageX(tmpl.typographyOffsetPageX);
    }
    if (tmpl.typographyOffsetPageY !== undefined) {
      setTypographyOffsetPageY(tmpl.typographyOffsetPageY);
    }
    
    // Log user activity
    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "style",
        title: "Applied Layout Template",
        detail: `Applied pre-made typography layout style "${tmpl.name}"`,
        icon: "Sparkles",
        tab: "quote"
      }
    }));
  };

  const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && activeTool === "pan") {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (activePaddingHandle && activeTool === "edit") {
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect) {
        let padX = 0;
        let padY = 0;
        if (activePaddingHandle === "tl") {
          padX = (e.clientX - rect.left) / previewZoom;
          padY = (e.clientY - rect.top) / previewZoom;
        } else if (activePaddingHandle === "tr") {
          padX = (rect.right - e.clientX) / previewZoom;
          padY = (e.clientY - rect.top) / previewZoom;
        } else if (activePaddingHandle === "bl") {
          padX = (e.clientX - rect.left) / previewZoom;
          padY = (rect.bottom - e.clientY) / previewZoom;
        } else if (activePaddingHandle === "br") {
          padX = (rect.right - e.clientX) / previewZoom;
          padY = (rect.bottom - e.clientY) / previewZoom;
        }
        
        let newPadding = Math.round((padX + padY) / 2);
        
        if (snapToGrid) {
          newPadding = Math.round(newPadding / 5) * 5;
        }
        
        newPadding = Math.max(10, Math.min(120, newPadding));
        setConfig((p) => ({ ...p, padding: newPadding }));
      }
    } else if (isDraggingWatermark && activeTool === "edit") {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect) {
        // Adjust coordinate changes based on current inspector zoom scale
        const changePercentX = (deltaX / rect.width) * 100;
        const changePercentY = (deltaY / rect.height) * 100;
        
        let targetX = dragStart.originalX + changePercentX;
        let targetY = dragStart.originalY + changePercentY;
        
        if (snapToGrid) {
          // Snap watermark coordinates to nearest 5% increment
          const snapStep = 5;
          let snapX = Math.round(targetX / snapStep) * snapStep;
          let snapY = Math.round(targetY / snapStep) * snapStep;
          
          if (Math.abs(targetX - 50) < 4) snapX = 50;
          if (Math.abs(targetY - 50) < 4) snapY = 50;
          
          targetX = snapX;
          targetY = snapY;
        }
        
        setPdfWatermarkX(Math.min(100, Math.max(0, Math.round(targetX))));
        setPdfWatermarkY(Math.min(100, Math.max(0, Math.round(targetY))));
      }
    } else if (isDraggingTypography && activeTool === "edit") {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // Adjust offset according to active zoom scale
      const actualDeltaX = deltaX / previewZoom;
      const actualDeltaY = deltaY / previewZoom;
      const targetX = dragStart.originalX + actualDeltaX;
      const targetY = dragStart.originalY + actualDeltaY;
      let finalX = targetX;
      let finalY = targetY;
      
      if (snapToGrid) {
        const snapValueX = Math.round(targetX / gridSize) * gridSize;
        const snapValueY = Math.round(targetY / gridSize) * gridSize;
        // If close to center (0), snap exactly to 0
        if (Math.abs(targetX) < Math.max(10, gridSize / 2)) {
          finalX = 0;
        } else {
          finalX = snapValueX;
        }
        if (Math.abs(targetY) < Math.max(10, gridSize / 2)) {
          finalY = 0;
        } else {
          finalY = snapValueY;
        }
      }
      
      setTypographyOffsetPageX(Math.min(250, Math.max(-250, Math.round(finalX))));
      setTypographyOffsetPageY(Math.min(250, Math.max(-250, Math.round(finalY))));
    }
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
    setIsDraggingWatermark(false);
    setIsDraggingTypography(false);
    setActivePaddingHandle(null);
  };

  const handleViewportTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTool === "pan" && e.touches.length === 1) {
      setIsPanning(true);
      const touch = e.touches[0];
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleViewportTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && activeTool === "pan" && e.touches.length === 1) {
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    } else if (activePaddingHandle && activeTool === "edit" && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect) {
        let padX = 0;
        let padY = 0;
        if (activePaddingHandle === "tl") {
          padX = (touch.clientX - rect.left) / previewZoom;
          padY = (touch.clientY - rect.top) / previewZoom;
        } else if (activePaddingHandle === "tr") {
          padX = (rect.right - touch.clientX) / previewZoom;
          padY = (touch.clientY - rect.top) / previewZoom;
        } else if (activePaddingHandle === "bl") {
          padX = (touch.clientX - rect.left) / previewZoom;
          padY = (rect.bottom - touch.clientY) / previewZoom;
        } else if (activePaddingHandle === "br") {
          padX = (rect.right - touch.clientX) / previewZoom;
          padY = (rect.bottom - touch.clientY) / previewZoom;
        }
        
        let newPadding = Math.round((padX + padY) / 2);
        
        if (snapToGrid) {
          newPadding = Math.round(newPadding / 5) * 5;
        }
        
        newPadding = Math.max(10, Math.min(120, newPadding));
        setConfig((p) => ({ ...p, padding: newPadding }));
      }
    } else if (isDraggingWatermark && activeTool === "edit" && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect) {
        const changePercentX = (deltaX / rect.width) * 100;
        const changePercentY = (deltaY / rect.height) * 100;
        
        let targetX = dragStart.originalX + changePercentX;
        let targetY = dragStart.originalY + changePercentY;
        
        if (snapToGrid) {
          // Snap watermark coordinates to nearest 5% increment
          const snapStep = 5;
          let snapX = Math.round(targetX / snapStep) * snapStep;
          let snapY = Math.round(targetY / snapStep) * snapStep;
          
          if (Math.abs(targetX - 50) < 4) snapX = 50;
          if (Math.abs(targetY - 50) < 4) snapY = 50;
          
          targetX = snapX;
          targetY = snapY;
        }
        
        setPdfWatermarkX(Math.min(100, Math.max(0, Math.round(targetX))));
        setPdfWatermarkY(Math.min(100, Math.max(0, Math.round(targetY))));
      }
    } else if (isDraggingTypography && activeTool === "edit" && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      const actualDeltaX = deltaX / previewZoom;
      const actualDeltaY = deltaY / previewZoom;
      const targetX = dragStart.originalX + actualDeltaX;
      const targetY = dragStart.originalY + actualDeltaY;
      let finalX = targetX;
      let finalY = targetY;
      
      if (snapToGrid) {
        const snapValueX = Math.round(targetX / gridSize) * gridSize;
        const snapValueY = Math.round(targetY / gridSize) * gridSize;
        if (Math.abs(targetX) < Math.max(10, gridSize / 2)) {
          finalX = 0;
        } else {
          finalX = snapValueX;
        }
        if (Math.abs(targetY) < Math.max(10, gridSize / 2)) {
          finalY = 0;
        } else {
          finalY = snapValueY;
        }
      }
      
      setTypographyOffsetPageX(Math.min(250, Math.max(-250, Math.round(finalX))));
      setTypographyOffsetPageY(Math.min(250, Math.max(-250, Math.round(finalY))));
    }
  };

  const handleViewportWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom in/out based on wheel scroll direction, keeping bounds between 0.5x and 2.0x
    const scaleFactor = 1.05;
    let nextZoom = previewZoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(2.0, parseFloat((previewZoom * scaleFactor).toFixed(2)));
    } else {
      nextZoom = Math.max(0.5, parseFloat((previewZoom / scaleFactor).toFixed(2)));
    }
    setPreviewZoom(nextZoom);
  };

  // Convert linear-gradient to inline styles easily
  const getPreviewBgStyle = () => {
    if (config.bgStyle === "image" && bgImage) {
      return { backgroundImage: `url(${bgImage})` };
    }
    if (config.bgStyle === "gradient") {
      return { background: config.bgValue };
    }
    return { backgroundColor: config.bgValue };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Premade Typography Templates Sidebar */}
      {showTemplatesSidebar && (
        <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-5 border border-slate-150/40 dark:border-slate-800/80 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-650 dark:text-indigo-400" /> Layout Library
            </h3>
            <button
              type="button"
              onClick={() => setShowTemplatesSidebar(false)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-all cursor-pointer"
              title="Hide Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Apply curated visual style combinations, font alignments, colors, and margins with a single click.
          </p>

          <div className="flex flex-col gap-2.5">
            {PREMADE_TYPOGRAPHY_TEMPLATES.map((tmpl) => {
              const isActive = 
                config.fontFamily === tmpl.fontFamily &&
                config.textAlign === tmpl.textAlign &&
                config.padding === tmpl.padding &&
                config.fontSize === tmpl.fontSize &&
                config.fontColor === tmpl.fontColor &&
                !!config.isBold === !!tmpl.isBold &&
                !!config.isItalic === !!tmpl.isItalic;

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => applyPremadeTemplate(tmpl)}
                  className={`group text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/70 border-indigo-500 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[12px] font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-950 dark:group-hover:text-indigo-350 truncate">
                        {tmpl.name}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-indigo-100 text-indigo-750 dark:bg-indigo-950/60 dark:text-indigo-300"
                          : "bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400"
                      }`}>
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="w-full flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-850/60 text-[9px] text-slate-450 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[80px] font-bold">{tmpl.fontFamily}</span>
                    <span className="uppercase font-semibold">{tmpl.textAlign}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-850">
            <button
              type="button"
              onClick={() => {
                setTypographyOffsetPageX(0);
                setTypographyOffsetPageY(0);
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Reset Offsets to Center</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Controls Sidebar */}
      <div className={`${showTemplatesSidebar ? "lg:col-span-4" : "lg:col-span-5"} bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-150/40 dark:border-slate-800/80 flex flex-col space-y-5 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800`}>
        
        {/* Social Media Presets Panel */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <LayoutGrid className="w-4 h-4 text-indigo-500" /> Formatting Presets
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Instant size, typography, and canvas configurations for social formats.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {SOCIAL_PRESETS.map((preset) => {
              const isActive = config.aspectRatio === preset.aspectRatio && config.fontFamily === preset.fontFamily && config.fontSize === preset.fontSize;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      aspectRatio: preset.aspectRatio,
                      fontSize: preset.fontSize,
                      fontFamily: preset.fontFamily,
                      authorFontFamily: preset.authorFontFamily || "",
                      fontColor: preset.fontColor,
                      textAlign: preset.textAlign,
                      padding: preset.padding,
                      ...(preset.bgStyle ? { bgStyle: preset.bgStyle } : {}),
                      ...(preset.bgValue ? { bgValue: preset.bgValue } : {}),
                      ...(preset.overlayOpacity !== undefined ? { overlayOpacity: preset.overlayOpacity } : {})
                    }));
                  }}
                  className={`group relative text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500/30"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 transition-all ${
                    isActive ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800"
                  }`}>
                    {preset.aspectRatio === "9:16" || preset.aspectRatio === "4:5" || preset.aspectRatio === "4:7" ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : preset.aspectRatio === "3:1" || preset.aspectRatio === "16:9" || preset.aspectRatio === "7:4" ? (
                      <Monitor className="w-3.5 h-3.5" />
                    ) : (
                      <LayoutGrid className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-950 dark:group-hover:text-indigo-300 truncate">
                        {preset.name}
                      </span>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-indigo-100 dark:bg-indigo-950/55 text-indigo-750 dark:text-indigo-300"
                          : "bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400"
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-200/60" />

        {/* Aesthetic Layout Templates */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" /> Layout Templates
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Apply predefined font style, text alignment, and spacing (padding) configurations to your canvas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_TEMPLATES.map((tmpl) => {
              const isActive = 
                config.fontFamily === tmpl.fontFamily &&
                config.textAlign === tmpl.textAlign &&
                config.padding === tmpl.padding &&
                config.fontSize === tmpl.fontSize &&
                !!config.isBold === !!tmpl.isBold &&
                !!config.isItalic === !!tmpl.isItalic;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      fontFamily: tmpl.fontFamily,
                      authorFontFamily: tmpl.authorFontFamily,
                      fontSize: tmpl.fontSize,
                      textAlign: tmpl.textAlign,
                      padding: tmpl.padding,
                      isBold: tmpl.isBold,
                      isItalic: tmpl.isItalic,
                      ...(tmpl.overlayOpacity !== undefined ? { overlayOpacity: tmpl.overlayOpacity } : {}),
                      ...(tmpl.overlayBlur !== undefined ? { overlayBlur: tmpl.overlayBlur } : {}),
                      ...(tmpl.noiseOpacity !== undefined ? { noiseOpacity: tmpl.noiseOpacity } : {}),
                    }));
                  }}
                  className={`group relative text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer h-[100px] ${
                    isActive
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/30"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-950 dark:group-hover:text-amber-300 truncate">
                        {tmpl.name}
                      </span>
                      {isActive && (
                        <span className="flex h-2 w-2 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                  
                  <div className="w-full flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-850/60 text-[8.5px] text-slate-400 font-mono font-bold uppercase">
                    <span>{tmpl.badge}</span>
                    <span className="opacity-80">{tmpl.textAlign}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-200/60" />

        {/* JSON Import/Export Configuration Backups */}
        <div className="bg-white/80 dark:bg-slate-900 border border-indigo-100/60 dark:border-slate-800/80 rounded-xl p-4.5 space-y-3 shadow-3xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-950 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 leading-none">
              <FileJson className="w-4 h-4 text-indigo-500 shrink-0" /> Design Portability
            </h4>
            <span className="text-[9.5px] font-mono text-slate-400 uppercase font-bold">JSON BACKUP</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            Export your exact design style configuration as a <strong>JSON backup</strong> to re-import and edit later. Great for carrying work between browsers.
          </p>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportConfigJson}
              className="flex-1 inline-flex items-center justify-center py-2 px-3 border border-slate-200/85 hover:bg-slate-50 dark:border-slate-805 dark:hover:bg-slate-800/80 rounded-lg text-slate-750 dark:text-slate-350 text-[10.5px] font-bold transition-all cursor-pointer shadow-3xs hover:border-slate-350 shrink-0 bg-transparent"
              title="Download currently active color, background, typography and alignment rules as a JSON file"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Export Layout
            </button>

            <button
              type="button"
              onClick={() => jsonFileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center py-2 px-3 border border-indigo-150 hover:bg-indigo-50/50 dark:border-indigo-900/65 dark:hover:bg-indigo-950/40 rounded-lg text-indigo-755 dark:text-indigo-400 text-[10.5px] font-bold transition-all cursor-pointer shadow-3xs hover:border-indigo-300 bg-transparent"
              title="Verify and load a previously saved .json quote backup config onto the live designer"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Import Layout
            </button>
            <input
              type="file"
              ref={jsonFileInputRef}
              onChange={handleImportConfigJson}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>

        <div className="h-px bg-slate-200/60 dark:bg-slate-800/40" />

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> Card Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Write your quote, set author details, and choose alignment.
          </p>
        </div>

        {/* Text Input Row */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-755 dark:text-slate-300">Quote Text</label>
              <button
                type="button"
                onClick={generateRandomQuote}
                disabled={isGeneratingQuote}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-805 dark:text-amber-400 dark:bg-amber-955/20 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Get Inspired</span>
              </button>
            </div>
            <textarea
              value={config.text}
              onChange={(e) => setConfig((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Enter quote words..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-inner dark:shadow-slate-950/45 focus:outline-none focus:border-slate-850 dark:focus:border-slate-700 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-755 dark:text-slate-300 mb-1.5">Author</label>
            <input
              type="text"
              value={config.author}
              onChange={(e) => setConfig((prev) => ({ ...prev, author: e.target.value }))}
              placeholder="e.g. Ralph Waldo Emerson"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-850 dark:focus:border-slate-700 transition-colors"
            />
          </div>
        </div>

        {/* Typography & Alignment Controls */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 animate-pulse text-indigo-500" /> Typography & Style
          </h4>

          {/* Typography Library */}
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Typography Library</label>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase font-bold">8 Pairings</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {FONT_PAIRINGS.map((pairing) => {
                const isSelected = config.fontFamily === pairing.quoteFont && (config.authorFontFamily === pairing.authorFont || (!config.authorFontFamily && pairing.quoteFont === pairing.authorFont));
                return (
                  <button
                    key={pairing.id}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        fontFamily: pairing.quoteFont,
                        authorFontFamily: pairing.authorFont,
                      }));
                    }}
                    className={`group relative text-left p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer h-[105px] ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-500 ring-1 ring-indigo-500/30 shadow-xs"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800"
                    }`}
                  >
                    {/* Pairing Header */}
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{pairing.name}</span>
                        {isSelected && (
                          <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate">
                        {pairing.category} • {pairing.quoteFont} + {pairing.authorFont}
                      </p>
                    </div>

                    {/* Live Preview Box */}
                    <div className="w-full mt-1.5 py-1 px-1.5 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-center items-center h-[52px] group-hover:bg-slate-100/60 dark:group-hover:bg-slate-900 transition-colors">
                      <span 
                        style={{ fontFamily: pairing.quoteFont }} 
                        className="text-xs text-slate-850 dark:text-slate-150 font-bold truncate max-w-full text-center"
                      >
                        "Inspiring words"
                      </span>
                      <span 
                        style={{ fontFamily: pairing.authorFont }} 
                        className="text-[8px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-full text-center mt-1"
                      >
                        — Wise Thinker
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Quote Font</label>
              <select
                value={config.fontFamily}
                onChange={(e) => setConfig((prev) => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-800 dark:focus:border-slate-700"
              >
                <option value="Playfair Display" className="dark:bg-slate-950">Playfair Display</option>
                <option value="Space Grotesk" className="dark:bg-slate-950">Space Grotesk</option>
                <option value="Inter" className="dark:bg-slate-950">Inter (Sans)</option>
                <option value="JetBrains Mono" className="dark:bg-slate-950">JetBrains Mono</option>
                <option value="Cinzel" className="dark:bg-slate-950">Cinzel (Roman)</option>
                <option value="Montserrat" className="dark:bg-slate-950">Montserrat</option>
                <option value="Bebas Neue" className="dark:bg-slate-950">Bebas Neue</option>
                <option value="Outfit" className="dark:bg-slate-950">Outfit</option>
                <option value="Lilita One" className="dark:bg-slate-950">Lilita One</option>
                <option value="Lobster" className="dark:bg-slate-950">Lobster</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Author Font</label>
              <select
                value={config.authorFontFamily || config.fontFamily}
                onChange={(e) => setConfig((prev) => ({ ...prev, authorFontFamily: e.target.value }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-800 dark:focus:border-slate-700"
              >
                <option value="" className="dark:bg-slate-950">Same as Quote Font</option>
                <option value="Playfair Display" className="dark:bg-slate-950">Playfair Display</option>
                <option value="Space Grotesk" className="dark:bg-slate-950">Space Grotesk</option>
                <option value="Inter" className="dark:bg-slate-950">Inter (Sans)</option>
                <option value="JetBrains Mono" className="dark:bg-slate-950">JetBrains Mono</option>
                <option value="Cinzel" className="dark:bg-slate-950">Cinzel (Roman)</option>
                <option value="Montserrat" className="dark:bg-slate-950">Montserrat</option>
                <option value="Bebas Neue" className="dark:bg-slate-950">Bebas Neue</option>
                <option value="Outfit" className="dark:bg-slate-950">Outfit</option>
                <option value="Lilita One" className="dark:bg-slate-950">Lilita One</option>
                <option value="Lobster" className="dark:bg-slate-950">Lobster</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Font Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={config.fontColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, fontColor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={config.fontColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, fontColor: e.target.value }))}
                  className="w-full text-center text-xs border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 uppercase bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Alignment</label>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800/50">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "left" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all cursor-pointer ${
                    config.textAlign === "left" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "center" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all cursor-pointer ${
                    config.textAlign === "center" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-355"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "right" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all cursor-pointer ${
                    config.textAlign === "right" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-355"
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-455 dark:text-slate-400">Font Size</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{config.fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                value={config.fontSize}
                onChange={(e) => setConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full accent-slate-800 dark:accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Typography Vertical Position Offset with fine-tuning nudges */}
            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Vertical Typography Offset
                </label>
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(0)}
                  className="text-[9.5px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Center
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(prev => Math.max(-250, prev - 5))}
                  className="w-6 h-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Nudge Up (5px)"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-250"
                  max="250"
                  step="5"
                  value={typographyOffsetPageY}
                  onChange={(e) => setTypographyOffsetPageY(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(prev => Math.min(250, prev + 5))}
                  className="w-6 h-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Nudge Down (5px)"
                >
                  +
                </button>
                <span className="text-[10px] font-mono font-extrabold text-slate-550 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40 shrink-0">
                  {typographyOffsetPageY > 0 ? `+${typographyOffsetPageY}` : typographyOffsetPageY}px
                </span>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-550 mt-1 leading-normal">
                Click-and-drag text inside the preview or use nudges to alter safe vertical spacing.
              </p>
            </div>
          </div>
        </div>

        {/* Background Library Selector Row */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Background Library
          </h4>

          {/* Selector Type Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800/50 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("gradients");
                setConfig(p => ({ ...p, bgStyle: "gradient", bgValue: PRESET_GRADIENTS[0].value }));
              }}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold cursor-pointer ${
                activeLibraryTab === "gradients" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-950 dark:text-slate-100 font-bold" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Gradients
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("solids");
                setConfig(p => ({ ...p, bgStyle: "color", bgValue: PRESET_SOLID_COLORS[0].value }));
              }}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold cursor-pointer ${
                activeLibraryTab === "solids" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-950 dark:text-slate-100 font-bold" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Solids
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("noise");
                const firstNoise = PRESET_NOISE_PATTERNS[0];
                setConfig(p => ({
                  ...p,
                  bgStyle: firstNoise.bgStyle,
                  bgValue: firstNoise.bgValue,
                  noiseOpacity: firstNoise.noiseOpacity,
                  noisePreset: firstNoise.name
                }));
              }}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold cursor-pointer ${
                activeLibraryTab === "noise" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-950 dark:text-slate-100 font-bold" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Subtle Noise
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("photo");
                setConfig(p => ({ ...p, bgStyle: "image" }));
              }}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold cursor-pointer ${
                activeLibraryTab === "photo" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-950 dark:text-slate-100 font-bold" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Custom Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Style Details */}
          {activeLibraryTab === "gradients" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Curated Nature Patterns
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium select-none flex items-center gap-1 animate-pulse">
                  Swipe for more →
                </span>
              </div>
              <div
                className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent select-none snap-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {PRESET_GRADIENTS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setConfig(p => ({ ...p, bgStyle: "gradient", bgValue: preset.value }))}
                    className={`flex-shrink-0 w-28 h-18 rounded-xl relative overflow-hidden transition-all duration-300 shadow-3xs border text-left flex flex-col justify-end p-2 cursor-pointer snap-start ${
                      config.bgStyle === "gradient" && config.bgValue === preset.value
                        ? "border-slate-900 dark:border-white ring-2 ring-slate-900/50 dark:ring-white/50 scale-[1.02]"
                        : "border-slate-200/60 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:scale-[1.01]"
                    }`}
                    style={{ background: preset.value }}
                    title={preset.name}
                  >
                    <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-opacity ${
                        config.bgStyle === "gradient" && config.bgValue === preset.value ? "bg-black/40 backdrop-blur-3xs text-white opacity-100" : "opacity-0"
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] truncate w-full pr-1">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLibraryTab === "solids" && (
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Curated Palette
              </span>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_SOLID_COLORS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setConfig(p => ({ ...p, bgStyle: "color", bgValue: item.value }))}
                    className={`h-9 rounded-lg relative overflow-hidden transition-all duration-200 border cursor-pointer ${
                      config.bgStyle === "color" && config.bgValue === item.value
                        ? "border-slate-900 dark:border-white ring-2 ring-slate-900/30 dark:ring-white/30 scale-105"
                        : "border-slate-200 dark:border-slate-800 hover:scale-[1.02]"
                    }`}
                    style={{ backgroundColor: item.value }}
                    title={item.name}
                  >
                    {config.bgStyle === "color" && config.bgValue === item.value && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Advanced Color Input Picker */}
              <div className="flex items-center space-x-3 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850">
                <input
                  type="color"
                  value={config.bgStyle === "color" ? config.bgValue : "#3b82f6"}
                  onChange={(e) => setConfig(p => ({ ...p, bgStyle: "color", bgValue: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {config.bgStyle === "color" ? config.bgValue : "Custom HEX"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Apply a precise custom hex color</p>
                </div>
              </div>
            </div>
          )}

          {activeLibraryTab === "noise" && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Noise Textured Presets
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_NOISE_PATTERNS.map((item) => {
                  const isActive = config.bgValue === item.bgValue && config.noiseOpacity === item.noiseOpacity;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setConfig(p => ({
                        ...p,
                        bgStyle: item.bgStyle,
                        bgValue: item.bgValue,
                        noiseOpacity: item.noiseOpacity,
                        noisePreset: item.name
                      }))}
                      className={`flex flex-col justify-between p-2 rounded-xl text-left border relative overflow-hidden h-20 transition-all cursor-pointer ${
                        isActive
                          ? "border-slate-900 dark:border-white ring-2 ring-slate-900/30 dark:ring-white/30 scale-[1.01]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:scale-[1.01]"
                      }`}
                    >
                      {/* Simulated background + subtle SVG noise mockup in list item */}
                      <div
                        className="absolute inset-0 z-0 opacity-80"
                        style={{
                          background: item.bgValue,
                          backgroundImage: `${item.bgValue}, url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${item.noiseOpacity}'/%3E%3C/svg%3E")`,
                          backgroundBlendMode: "overlay"
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 z-10">
                        {isActive && (
                          <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="mt-auto z-10 w-full">
                        <p className="text-[10px] font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] truncate">
                          {item.name}
                        </p>
                        <p className="text-[8px] text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Adjustable Noise Grain Slider */}
              <div className="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Custom Grain Density</span>
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                    {Math.round((config.noiseOpacity || 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.01"
                  value={config.noiseOpacity || 0}
                  onChange={(e) => setConfig(p => ({ ...p, noiseOpacity: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <p className="text-[9px] text-slate-400 dark:text-slate-500">
                  Slide to adjust the retro grain opacity overlay over any active color/gradient.
                </p>
              </div>
            </div>
          )}

          {activeLibraryTab === "photo" && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-305 select-none ${
                  isDragging
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md shadow-amber-500/10 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-800 hover:border-amber-405 dark:hover:border-amber-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 bg-white dark:bg-slate-950"
                }`}
                id="quote-image-drop-zone"
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-2.5 rounded-full ${isDragging ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 scale-110" : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400"} transition-all duration-300`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    {isDragging ? (
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">Drop to apply photo!</p>
                    ) : bgImage ? (
                      <p className="text-xs font-semibold text-slate-755 dark:text-slate-300">Drag & drop or Click to change photo</p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-755 dark:text-slate-300">Drag & Drop photo here, or Click to browse</p>
                    )}
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                      PNG, JPEG, dynamic aspect scale center crop
                    </p>
                  </div>
                </div>
              </div>

              {bgImage && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-850 shadow-3xs">
                    <div className="flex items-center space-x-2.5">
                      <img src={bgImage} alt="User bg" className="w-10 h-10 object-cover rounded-lg border border-slate-205 dark:border-slate-800" />
                      <div>
                        <p className="text-xs font-semibold text-slate-705 dark:text-slate-200">Active Photo</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550">Aspect-fit center overlay</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBgImage(null);
                        setConfig((prev) => ({
                          ...prev,
                          bgStyle: "gradient",
                          bgValue: PRESET_GRADIENTS[0].value,
                        }));
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-750 hover:underline transition-all border-0 bg-transparent font-sans cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFitCanvas}
                    disabled={isAutoFitting}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-650 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-850 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Automatically crop the uploaded background image to match the chosen aspect ratio"
                  >
                    <Scissors className={`w-3.5 h-3.5 ${isAutoFitting ? "animate-spin" : ""}`} />
                    {isAutoFitting ? "Auto-Fitting Image..." : "Auto-Fit Canvas (Center Crop)"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contrast Overlay Slider for Photo / Vivid gradients */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Contrast Banner Dark Overlay</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.overlayOpacity * 100}
                onChange={(e) => setConfig(p => ({ ...p, overlayOpacity: parseInt(e.target.value) / 100 }))}
                className="w-full accent-slate-800 dark:accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-550 block text-right">
                {Math.round(config.overlayOpacity * 100)}% Opacity
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Card Border Padding</label>
              <input
                type="range"
                min="20"
                max="80"
                value={config.padding}
                onChange={(e) => setConfig(p => ({ ...p, padding: parseInt(e.target.value) }))}
                className="w-full accent-slate-800 dark:accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-550 block text-right">{config.padding}px</span>
            </div>
          </div>

          {/* Smooth Motion Controls Toggle Switch */}
          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/85">
            <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 text-left">
              <div>
                <span className="block text-[11px] font-black uppercase text-slate-705 dark:text-slate-300 tracking-wider flex items-center gap-1">
                  ✨ Animated Entrances
                </span>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                  Smooth fluid fading transitions for quote text and backdrop layout.
                </p>
              </div>
              <button
                id="quote-motion-toggle"
                type="button"
                onClick={() => {
                  setMotionEnabled(prev => {
                    const next = !prev;
                    localStorage.setItem("toolkit_pro_quote_motion_enabled", next ? "true" : "false");
                    return next;
                  });
                }}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  motionEnabled ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    motionEnabled ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom PDF Export Watermark Config */}
          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/85">
            <div className="bg-white/60 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-850 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-750 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    🔒 PDF Export Watermark
                  </span>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                    Apply a custom semi-transparent text copyright layer to your PDF downloads.
                  </p>
                </div>
                <button
                  id="pdf-watermark-toggle"
                  type="button"
                  onClick={() => setPdfWatermarkEnabled(prev => !prev)}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pdfWatermarkEnabled ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      pdfWatermarkEnabled ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {pdfWatermarkEnabled && (
                <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 transition-all duration-200">
                  {/* Watermark text */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={pdfWatermarkText}
                      onChange={(e) => setPdfWatermarkText(e.target.value)}
                      placeholder="e.g. DRAFT, CONFIDENTIAL, Your Name"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-450"
                    />
                  </div>

                  {/* Font Size & Angle sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                        Font Size ({pdfWatermarkFontSize}px)
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="64"
                        value={pdfWatermarkFontSize}
                        onChange={(e) => setPdfWatermarkFontSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                        Angle ({pdfWatermarkAngle}°)
                      </label>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={pdfWatermarkAngle}
                        onChange={(e) => setPdfWatermarkAngle(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Opacity slider & Color selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                        Opacity ({Math.round(pdfWatermarkOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={pdfWatermarkOpacity * 100}
                        onChange={(e) => setPdfWatermarkOpacity(parseFloat(e.target.value) / 100)}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                        Color Style
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={pdfWatermarkColor}
                          onChange={(e) => setPdfWatermarkColor(e.target.value)}
                          className="w-6 h-6 p-0 bg-transparent border-0 rounded cursor-pointer shrink-0"
                          title="Choose custom hex color"
                        />
                        <div className="flex gap-1">
                          {[
                            { value: "#cccccc", label: "Gray" },
                            { value: "#000000", label: "Black" },
                            { value: "#ffffff", label: "White" },
                            { value: "#b45309", label: "Amber" },
                          ].map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setPdfWatermarkColor(preset.value)}
                              className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                                pdfWatermarkColor === preset.value
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800/80 dark:text-indigo-400"
                                  : "bg-white border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High Precision Watermark Positioning (Sliders + Fine-Tuning Nudges) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                        Watermark Positioning (Drag or Use Sliders)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfWatermarkX(50);
                          setPdfWatermarkY(50);
                        }}
                        className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Reset Position
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center text-[9px] text-slate-450 dark:text-slate-400 font-medium mb-1">
                          <span>Horizontal (X: {pdfWatermarkX}%)</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPdfWatermarkX(prev => Math.max(0, prev - 2))}
                              className="w-4 h-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded flex items-center justify-center font-bold text-[8px] cursor-pointer text-slate-600 dark:text-slate-400"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => setPdfWatermarkX(prev => Math.min(100, prev + 2))}
                              className="w-4 h-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded flex items-center justify-center font-bold text-[8px] cursor-pointer text-slate-600 dark:text-slate-400"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pdfWatermarkX}
                          onChange={(e) => setPdfWatermarkX(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[9px] text-slate-450 dark:text-slate-400 font-medium mb-1">
                          <span>Vertical (Y: {pdfWatermarkY}%)</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPdfWatermarkY(prev => Math.max(0, prev - 2))}
                              className="w-4 h-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded flex items-center justify-center font-bold text-[8px] cursor-pointer text-slate-600 dark:text-slate-400"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => setPdfWatermarkY(prev => Math.min(100, prev + 2))}
                              className="w-4 h-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded flex items-center justify-center font-bold text-[8px] cursor-pointer text-slate-600 dark:text-slate-400"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pdfWatermarkY}
                          onChange={(e) => setPdfWatermarkY(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200/60 dark:bg-slate-800/40 my-4 shrink-0" />

        <div className="space-y-4 pt-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <FolderArchive className="w-4 h-4 text-indigo-500" /> Saved Session Variants
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save snapshots of current configurations to export as a single ZIP.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveCurrentVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs shrink-0 select-none"
              title="Save current layout as a variant to the active session list"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Variant</span>
            </button>
          </div>

          {savedVariants.length === 0 ? (
            <div className="text-center py-6 px-4 bg-white/40 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <FolderArchive className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No variants saved in this session yet.</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500/80 mt-1">Design a quote and click "Save Variant" to capture a snapshot!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Batch Actions row */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  {savedVariants.length} Saved {savedVariants.length === 1 ? 'Variant' : 'Variants'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all saved session variants?")) {
                        setSavedVariants([]);
                        setSaveStatus({ success: true, msg: "Cleared all session variants." });
                      }
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-750 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchExportZip}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-md shadow-3xs cursor-pointer transition-all disabled:opacity-55 animate-pulse"
                    title="Export all session variants as a single ZIP file containing high-res PNGs"
                  >
                    <FolderArchive className="w-3 h-3 text-emerald-100" />
                    <span>Download ZIP Archive</span>
                  </button>
                </div>
              </div>

              {/* Variants Grid/List */}
              <div className="grid grid-cols-1 gap-2.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {savedVariants.map((variant) => {
                  const hasImage = variant.config.bgStyle === "image" && variant.bgImage;
                  return (
                    <div
                      key={variant.id}
                      onClick={() => handleLoadVariant(variant)}
                      className="group flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-900/60 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5 rounded-xl cursor-pointer transition-all shadow-3xs"
                      title="Click to load this layout configuration onto the designer canvas"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Mini thumbnail or gradient block */}
                        <div
                          className="w-12 h-12 rounded-lg border border-slate-200/60 dark:border-slate-800 shrink-0 relative overflow-hidden flex items-center justify-center text-[6px] text-white/90 leading-none"
                          style={{
                            background: variant.config.bgStyle === "gradient" ? variant.config.bgValue : (variant.config.bgStyle === "color" ? variant.config.bgValue : "none"),
                          }}
                        >
                          {hasImage && (
                            <img src={variant.bgImage!} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/15 flex items-center justify-center p-1 text-[7px] font-black uppercase text-center drop-shadow-sm select-none text-white">
                            {variant.config.aspectRatio}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2">
                            "{variant.config.text}"
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[80px]">
                              — {variant.config.author || "Anonymous"}
                            </span>
                            <span className="text-[8.5px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 px-1 rounded truncate max-w-[80px]">
                              {variant.config.fontFamily}
                            </span>
                            <span className="text-[8.5px] font-mono text-slate-400 dark:text-slate-550">
                              {variant.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 p-0.5 rounded-lg border border-slate-150/40 dark:border-slate-800 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadSingleVariant(variant, e)}
                          className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-white dark:hover:bg-slate-950 transition-all cursor-pointer"
                          title="Download PNG for this variant"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteVariant(variant.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-white dark:hover:bg-slate-950 transition-all cursor-pointer"
                          title="Delete variant from session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview and Execution Side */}
      <div className={`${showTemplatesSidebar ? "lg:col-span-5" : "lg:col-span-7"} flex flex-col justify-between space-y-4`}>
        {/* Save Status Alert Box */}
        {saveStatus && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center ${
              saveStatus.success
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            <Cloud className={`w-5 h-5 mr-2.5 ${saveStatus.success ? "text-emerald-500" : "text-rose-500"}`} />
            {saveStatus.msg}
          </div>
        )}

        {/* The Designer Card Preview Stage */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-3 sm:p-5 min-h-[350px] sm:min-h-[450px] overflow-hidden">
          {/* Zoom Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/60 shadow-3xs mb-3.5 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                Canvas Zoom Inspector
              </span>
              <span className="font-mono text-[10.5px] font-extrabold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-350 px-2 py-0.5 rounded">
                {Math.round(previewZoom * 100)}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplatesSidebar(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  showTemplatesSidebar
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-455 border-slate-200 dark:border-slate-800"
                }`}
                title="Toggle the premium typography templates library sidebar"
                id="btn-toggle-templates-sidebar"
              >
                <Sparkles className={`w-3 h-3 ${showTemplatesSidebar ? "animate-pulse text-indigo-550" : ""}`} />
                <span>Layout Library: <strong className="font-black">{showTemplatesSidebar ? "ON" : "OFF"}</strong></span>
              </button>

              <button
                type="button"
                onClick={() => setShowBleed(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  showBleed
                    ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 shadow-3xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800"
                }`}
                title="Toggle visual 3mm (12px) print bleed boundary lines and out-of-bounds warning shading"
                id="btn-toggle-bleed-guard"
              >
                <Scissors className={`w-3 h-3 ${showBleed ? "animate-pulse text-rose-500" : ""}`} />
                <span>Bleed Guard: <strong className="font-black">{showBleed ? "ON" : "OFF"}</strong></span>
              </button>

              <button
                type="button"
                onClick={() => setSnapToGrid(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  snapToGrid
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-455 border-slate-200 dark:border-slate-800"
                }`}
                title="Toggle automatic snapping to align typography and watermark elements to a precision grid"
                id="btn-toggle-snap-to-grid"
              >
                <LayoutGrid className={`w-3 h-3 ${snapToGrid ? "animate-pulse text-indigo-550" : ""}`} />
                <span>Snap to Grid: <strong className="font-black">{snapToGrid ? "ON" : "OFF"}</strong></span>
              </button>

              {snapToGrid && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase">Grid:</span>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                    className="bg-transparent border-none text-[10px] font-black text-indigo-650 dark:text-indigo-400 focus:outline-none cursor-pointer py-0 px-1 pr-4"
                    title="Choose spacing grid step size in pixels"
                  >
                    <option value="10">10px</option>
                    <option value="20">20px</option>
                    <option value="25">25px</option>
                    <option value="50">50px</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewZoom(prev => Math.max(0.5, parseFloat((prev - 0.1).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-250/50 dark:border-slate-800/50 cursor-pointer active:scale-95 transition-all"
                title="Zoom Out"
              >
                -
              </button>
              
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                className="w-20 sm:w-32 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
              
              <button
                type="button"
                onClick={() => setPreviewZoom(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-250/50 dark:border-slate-800/50 cursor-pointer active:scale-95 transition-all"
                title="Zoom In"
              >
                +
              </button>
              
              {previewZoom !== 1.0 && (
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1.0)}
                  className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Workspace Precision Mode & Tool Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 shadow-3xs mb-3.5 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                Active Tool:
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("edit");
                    setIsPanning(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold rounded-md uppercase transition-all cursor-pointer ${
                    activeTool === "edit"
                      ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-650 dark:text-indigo-400 border border-slate-200/20"
                      : "text-slate-455 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                  }`}
                  title="Edit Mode: Drag elements and typography"
                >
                  <MousePointer className="w-3 h-3 text-indigo-500" />
                  <span>Interactive Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("pan");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold rounded-md uppercase transition-all cursor-pointer ${
                    activeTool === "pan"
                      ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-650 dark:text-indigo-400 border border-slate-200/20"
                      : "text-slate-455 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                  }`}
                  title="Pan Mode: Drag canvas to navigate detailed layouts"
                >
                  <Move className="w-3 h-3 text-amber-500" />
                  <span>Canvas Pan</span>
                </button>
              </div>
            </div>

            {/* User Links - 1 links (Luminous Link) & 2 links (Wonderful Link) */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                Nodes:
              </span>
              <a
                href="https://ai.studio/build?id=11170621"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-indigo-950/20 border border-slate-200/40 dark:border-slate-800/80 rounded-md text-[9.5px] font-extrabold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                title="Open Luminous Link 11170621"
              >
                <ExternalLink className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                <span>Luminous link</span>
              </a>
              <a
                href="https://ai.studio/build?id=11223979"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-indigo-950/20 border border-slate-200/40 dark:border-slate-800/80 rounded-md text-[9.5px] font-extrabold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                title="Open Wonderful Link 11223979"
              >
                <ExternalLink className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                <span>Wonderful link</span>
              </a>
            </div>

            {/* Reset Pan Option */}
            {(panOffset.x !== 0 || panOffset.y !== 0) && (
              <button
                type="button"
                onClick={() => setPanOffset({ x: 0, y: 0 })}
                className="text-[9.5px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                title="Reset canvas pan position"
              >
                Reset Pan Offset
              </button>
            )}
          </div>

          {/* Real-time Typography & Text Control Panel */}
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/60 shadow-3xs mb-3.5 shrink-0 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 select-none">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block">
                    Font Style:
                  </span>
                  <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800/50">
                    {(["normal", "italic", "oblique"] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setConfig((prev) => {
                          const isIt = style === "italic";
                          return {
                            ...prev,
                            fontStyle: style,
                            isItalic: isIt
                          };
                        })}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer select-none active:scale-95 ${
                          (config.fontStyle || "italic") === style
                            ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200/20"
                            : "text-slate-455 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bold & Italic Toggles */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block">
                    Format:
                  </span>
                  <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1.5 border border-slate-200/50 dark:border-slate-800/50 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, isBold: !prev.isBold }))}
                      className={`p-1.5 rounded-md transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                        config.isBold
                          ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-200/20"
                          : "text-slate-455 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                      }`}
                      title="Bold Text"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => {
                        const nextItalic = prev.isItalic !== undefined ? !prev.isItalic : false; // default is true for Eliot quote
                        return {
                          ...prev,
                          isItalic: nextItalic,
                          fontStyle: nextItalic ? "italic" : "normal"
                        };
                      })}
                      className={`p-1.5 rounded-md transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                        (config.isItalic !== undefined ? config.isItalic : true)
                          ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-200/20"
                          : "text-slate-455 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                      }`}
                      title="Italic Text"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                  <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block shrink-0">
                    Font Size ({config.fontSize}px):
                  </span>
                  <input
                    type="range"
                    min="12"
                    max="64"
                    value={config.fontSize}
                    onChange={(e) => setConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-slate-455 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/60">
                  ✏️ Live Preview Editor
                </span>
              </div>
            </div>

            {/* Vertical Position slider inside the top control panel */}
            <div className="flex flex-wrap items-center gap-4 justify-between border-t border-slate-100 dark:border-slate-900/60 pt-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block shrink-0">
                  Vertical Typography Shift ({typographyOffsetPageY}px):
                </span>
                <input
                  type="range"
                  min="-250"
                  max="250"
                  step="5"
                  value={typographyOffsetPageY}
                  onChange={(e) => setTypographyOffsetPageY(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(prev => Math.max(-250, prev - 5))}
                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded text-[10px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                  title="Nudge Up (5px)"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(prev => Math.min(250, prev + 5))}
                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-105 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded text-[10px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                  title="Nudge Down (5px)"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => setTypographyOffsetPageY(0)}
                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1.5"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Direct text editor input for instant typography check */}
            <div className="flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-900 pt-2.5">
              <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block shrink-0 select-none">
                Edit Text:
              </span>
              <input
                type="text"
                value={config.text}
                onChange={(e) => setConfig((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="Type dynamic quote text here to preview in real-time..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Viewport container supporting precise desktop/mobile panning and wheel zooming */}
          <div
            ref={viewportRef}
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onMouseLeave={handleViewportMouseUp}
            onTouchStart={handleViewportTouchStart}
            onTouchMove={handleViewportTouchMove}
            onTouchEnd={handleViewportMouseUp}
            onWheel={handleViewportWheel}
            className={`flex-1 w-full flex items-center justify-center overflow-hidden p-2 sm:p-4 min-h-[300px] sm:min-h-[400px] border border-dashed border-slate-350 dark:border-slate-800 rounded-2xl relative select-none bg-slate-50 dark:bg-slate-950/20 ${
              activeTool === "pan" ? "cursor-grab active:cursor-grabbing bg-slate-100/50 dark:bg-slate-900/10" : ""
            }`}
          >
            {/* Quick guide helper overlay */}
            <div className="absolute bottom-2 left-3 z-35 pointer-events-none text-[8.5px] font-bold tracking-wide text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40">
              {activeTool === "pan"
                ? "Pan Mode: Drag canvas to navigate • Use mouse wheel to zoom"
                : "Edit Mode: Drag text or watermark to position • Toggle Pan tool to shift canvas"}
            </div>

            <div
              ref={previewRef}
              style={{
                padding: `${config.padding}px`,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${previewZoom})`,
                transformOrigin: "center center",
              }}
              id="quote-card-preview"
              className={`print-ready-quote-card w-full rounded-2xl shadow-xl flex flex-col justify-between items-stretch relative overflow-hidden transition-shadow duration-300 ${
                config.aspectRatio === "9:16"
                  ? "aspect-[9/16] max-w-[310px]"
                  : config.aspectRatio === "3:1"
                  ? "aspect-[3/1] max-w-[550px]"
                  : config.aspectRatio === "16:9"
                  ? "aspect-[16/9] max-w-[550px]"
                  : config.aspectRatio === "4:5"
                  ? "aspect-[4/5] max-w-[380px]"
                  : config.aspectRatio === "7:4"
                  ? "aspect-[7/4] max-w-[500px]"
                  : config.aspectRatio === "4:7"
                  ? "aspect-[4/7] max-w-[300px]"
                  : "aspect-square max-w-[450px]"
              }`}
            >
            {/* Animated Background Layer */}
            {motionEnabled ? (
              <motion.div
                key={config.bgStyle + config.bgValue}
                initial={{ opacity: 0.3, scale: 1.15, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  ...getPreviewBgStyle(),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="absolute inset-0 z-0 pointer-events-none"
              />
            ) : (
              <div
                style={{
                  ...getPreviewBgStyle(),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="absolute inset-0 z-0 pointer-events-none"
              />
            )}

            {/* Subtle Noise Pattern Overlay */}
            {config.noiseOpacity !== undefined && config.noiseOpacity > 0 && (
              <div
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  opacity: config.noiseOpacity,
                }}
                className="absolute inset-0 z-[2] pointer-events-none mix-blend-overlay"
              />
            )}

            {/* Contrast Overlay layer in CSS representation */}
            <div
              style={{
                backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity})`,
                backdropFilter: `blur(${config.overlayBlur}px)`,
              }}
              className="absolute inset-0 z-5 pointer-events-none transition-all"
            />

            {/* Visual Print Bleed Overlay / Bleed Guard */}
            {showBleed && (
              <div className="absolute inset-0 z-20 pointer-events-none print:hidden select-none">
                {/* 12px outer Bleed Zone warning overlay (3mm equivalent) */}
                <div className="absolute inset-0 border-[12px] border-slate-950/45 dark:border-slate-950/65 transition-all" />
                
                {/* Trim line boundary (Dashed red/rose line at 12px from outer edges) */}
                <div className="absolute inset-[12px] border border-dashed border-rose-500 shadow-[0_0_0_1px_rgba(255,255,255,0.25)] transition-all" />

                {/* Corner Crop Marks (classic print registration guides) */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-rose-400 opacity-80" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-rose-400 opacity-80" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-rose-400 opacity-80" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-rose-400 opacity-80" />

                {/* Bleed Guide Label - Mono styled */}
                <div className="absolute top-4 left-4 bg-rose-600 dark:bg-rose-700 text-white font-mono text-[7.5px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-black shadow-xs flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>3mm Bleed Zone (Trims Off)</span>
                </div>

                <div className="absolute bottom-4 right-4 bg-slate-900/80 dark:bg-black/80 text-slate-100 dark:text-slate-200 font-mono text-[7.5px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold border border-white/10 select-none">
                  Safe Area
                </div>
              </div>
            )}

            {/* Snap to Grid visual overlay guidelines */}
            {snapToGrid && (
              <div className="absolute inset-0 z-10 pointer-events-none select-none overflow-hidden print:hidden">
                {/* Horizontal center guideline */}
                <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-indigo-400/40" />
                {/* Vertical center guideline */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-indigo-400/40" />

                {/* Draw faint grid lines every gridSize pixels */}
                <div 
                  className="absolute inset-0 opacity-40 dark:opacity-30" 
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(99, 102, 241, 0.12) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundPosition: "center center"
                  }}
                />

                {/* Snapped center vertical feedback indicator */}
                {typographyOffsetPageY === 0 && (
                  <div className="absolute bottom-4 left-4 bg-indigo-650 dark:bg-indigo-700 text-white font-mono text-[7.5px] uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm font-black flex items-center gap-1 select-none animate-bounce">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Typography perfectly centered (Y: 0)</span>
                  </div>
                )}
              </div>
            )}

            {/* Draggable/Interactive PDF Watermark Overlay Layer (rendered live on stage for wysiwyg precision edit) */}
            {pdfWatermarkEnabled && pdfWatermarkText && (
              <div
                style={{
                  top: `${pdfWatermarkY}%`,
                  left: `${pdfWatermarkX}%`,
                  transform: `translate(-50%, -50%) rotate(${pdfWatermarkAngle}deg)`,
                  color: pdfWatermarkColor,
                  opacity: pdfWatermarkOpacity,
                  fontSize: `${pdfWatermarkFontSize}px`,
                  fontFamily: "sans-serif",
                  fontWeight: "bold",
                }}
                onMouseDown={(e) => {
                  if (activeTool === "edit") {
                    e.stopPropagation();
                    setIsDraggingWatermark(true);
                    setDragStart({
                      x: e.clientX,
                      y: e.clientY,
                      originalX: pdfWatermarkX,
                      originalY: pdfWatermarkY,
                    });
                  }
                }}
                onTouchStart={(e) => {
                  if (activeTool === "edit" && e.touches.length === 1) {
                    e.stopPropagation();
                    setIsDraggingWatermark(true);
                    const touch = e.touches[0];
                    setDragStart({
                      x: touch.clientX,
                      y: touch.clientY,
                      originalX: pdfWatermarkX,
                      originalY: pdfWatermarkY,
                    });
                  }
                }}
                className={`absolute z-15 select-none text-center whitespace-nowrap leading-none transition-all ${
                  activeTool === "edit"
                    ? "cursor-move hover:outline hover:outline-dashed hover:outline-indigo-500 hover:outline-offset-4 bg-transparent"
                    : ""
                }`}
                title="Interactive Watermark Layer - Drag to reposition"
              >
                {pdfWatermarkText}
              </div>
            )}

            {/* Draggable Padding Resize handles overlay */}
            {activeTool === "edit" && (
              <div className="absolute inset-0 pointer-events-none select-none z-20 print:hidden">
                {/* Dashed boundary representing the quote padding area */}
                <div
                  className="absolute border border-dashed border-indigo-500/50 rounded-lg"
                  style={{
                    top: `${config.padding}px`,
                    bottom: `${config.padding}px`,
                    left: `${config.padding}px`,
                    right: `${config.padding}px`,
                  }}
                />

                {/* Corner Handles */}
                {/* Top Left */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setActivePaddingHandle("tl");
                    setPaddingDragStart({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      originalPadding: config.padding,
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      e.stopPropagation();
                      setActivePaddingHandle("tl");
                      const touch = e.touches[0];
                      setPaddingDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        originalPadding: config.padding,
                      });
                    }
                  }}
                  className="absolute pointer-events-auto w-5 h-5 rounded-full bg-indigo-650 dark:bg-indigo-550 border-2 border-white dark:border-slate-900 shadow-md cursor-nwse-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    top: `${config.padding}px`,
                    left: `${config.padding}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title="Drag to resize quote padding area"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>

                {/* Top Right */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setActivePaddingHandle("tr");
                    setPaddingDragStart({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      originalPadding: config.padding,
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      e.stopPropagation();
                      setActivePaddingHandle("tr");
                      const touch = e.touches[0];
                      setPaddingDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        originalPadding: config.padding,
                      });
                    }
                  }}
                  className="absolute pointer-events-auto w-5 h-5 rounded-full bg-indigo-650 dark:bg-indigo-550 border-2 border-white dark:border-slate-900 shadow-md cursor-nesw-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    top: `${config.padding}px`,
                    right: `${config.padding}px`,
                    transform: "translate(50%, -50%)",
                  }}
                  title="Drag to resize quote padding area"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>

                {/* Bottom Left */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setActivePaddingHandle("bl");
                    setPaddingDragStart({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      originalPadding: config.padding,
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      e.stopPropagation();
                      setActivePaddingHandle("bl");
                      const touch = e.touches[0];
                      setPaddingDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        originalPadding: config.padding,
                      });
                    }
                  }}
                  className="absolute pointer-events-auto w-5 h-5 rounded-full bg-indigo-650 dark:bg-indigo-550 border-2 border-white dark:border-slate-900 shadow-md cursor-nesw-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    bottom: `${config.padding}px`,
                    left: `${config.padding}px`,
                    transform: "translate(-50%, 50%)",
                  }}
                  title="Drag to resize quote padding area"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>

                {/* Bottom Right */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setActivePaddingHandle("br");
                    setPaddingDragStart({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      originalPadding: config.padding,
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      e.stopPropagation();
                      setActivePaddingHandle("br");
                      const touch = e.touches[0];
                      setPaddingDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        originalPadding: config.padding,
                      });
                    }
                  }}
                  className="absolute pointer-events-auto w-5 h-5 rounded-full bg-indigo-650 dark:bg-indigo-550 border-2 border-white dark:border-slate-900 shadow-md cursor-nwse-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    bottom: `${config.padding}px`,
                    right: `${config.padding}px`,
                    transform: "translate(50%, 50%)",
                  }}
                  title="Drag to resize quote padding area"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>
            )}

            {/* Inner Content Area */}
            <div className="flex flex-col h-full justify-center relative z-10 select-none">
              {isGeneratingQuote ? (
                <div className="space-y-4 animate-pulse">
                  <div className={`flex flex-col space-y-2.5 ${
                    config.textAlign === "center" ? "items-center" : config.textAlign === "right" ? "items-end" : "items-start"
                  }`}>
                    <div className="h-4 rounded-full w-5/6" style={{ backgroundColor: config.fontColor, opacity: 0.25 }} />
                    <div className="h-4 rounded-full w-full" style={{ backgroundColor: config.fontColor, opacity: 0.25 }} />
                    <div className="h-4 rounded-full w-4/6" style={{ backgroundColor: config.fontColor, opacity: 0.25 }} />
                  </div>
                  <div className={`flex mt-6 ${
                    config.textAlign === "center" ? "justify-center" : config.textAlign === "right" ? "justify-end" : "justify-start"
                  }`}>
                    <div className="h-3.5 rounded-full w-24" style={{ backgroundColor: config.fontColor, opacity: 0.2 }} />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    transform: `translate(${typographyOffsetPageX}px, ${typographyOffsetPageY}px)`,
                    transition: isDraggingTypography ? "none" : "transform 0.15s ease-out",
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === "edit") {
                      e.stopPropagation();
                      setIsDraggingTypography(true);
                      setDragStart({
                        x: e.clientX,
                        y: e.clientY,
                        originalX: typographyOffsetPageX,
                        originalY: typographyOffsetPageY,
                      });
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === "edit" && e.touches.length === 1) {
                      e.stopPropagation();
                      setIsDraggingTypography(true);
                      const touch = e.touches[0];
                      setDragStart({
                        x: touch.clientX,
                        y: touch.clientY,
                        originalX: typographyOffsetPageX,
                        originalY: typographyOffsetPageY,
                      });
                    }
                  }}
                  className={`relative p-3 rounded-xl transition-colors ${
                    activeTool === "edit"
                      ? "cursor-move hover:bg-white/5 hover:outline hover:outline-dashed hover:outline-indigo-550/40 hover:outline-offset-2"
                      : ""
                  }`}
                  title="Typography Group - Drag to reposition freely"
                >
                  {motionEnabled ? (
                    <motion.p
                      key={config.text}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                      style={{
                        fontFamily: config.fontFamily,
                        fontSize: `${config.fontSize}px`,
                        color: config.fontColor,
                        textAlign: config.textAlign,
                        lineHeight: "1.5",
                        fontStyle: config.isItalic !== undefined ? (config.isItalic ? "italic" : "normal") : (config.fontStyle || "italic"),
                        fontWeight: config.isBold ? "bold" : "500",
                      }}
                      className="tracking-wide break-words select-none"
                    >
                      "{config.text || "Click left column to draft quote..."}"
                    </motion.p>
                  ) : (
                    <p
                      style={{
                        fontFamily: config.fontFamily,
                        fontSize: `${config.fontSize}px`,
                        color: config.fontColor,
                        textAlign: config.textAlign,
                        lineHeight: "1.5",
                        fontStyle: config.isItalic !== undefined ? (config.isItalic ? "italic" : "normal") : (config.fontStyle || "italic"),
                        fontWeight: config.isBold ? "bold" : "500",
                      }}
                      className="tracking-wide break-words select-none"
                    >
                      "{config.text || "Click left column to draft quote..."}"
                    </p>
                  )}

                  {config.author && (
                    motionEnabled ? (
                      <motion.p
                        key={config.author + config.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 0.8, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
                        style={{
                          fontFamily: config.authorFontFamily || config.fontFamily,
                          fontSize: `${config.fontSize * 0.85}px`,
                          color: config.fontColor,
                          textAlign: config.textAlign,
                        }}
                        className="font-semibold mt-5 tracking-tight border-t border-white/10 pt-2 select-none"
                      >
                        — {config.author}
                      </motion.p>
                    ) : (
                      <p
                        style={{
                          fontFamily: config.authorFontFamily || config.fontFamily,
                          fontSize: `${config.fontSize * 0.85}px`,
                          color: config.fontColor,
                          textAlign: config.textAlign,
                        }}
                        className="font-semibold opacity-80 mt-5 tracking-tight border-t border-white/10 pt-2 select-none"
                      >
                        — {config.author}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* DPI Precision Settings Block */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 block">
                <Printer className="w-4 h-4 text-indigo-550" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider leading-none">
                  Print Density & Image Resolution
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium pb-0">
                  Set target DPI and output dimensions for high-quality press prints
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-350 px-2 py-1 rounded-lg select-none shrink-0">
              {downloadDpi} DPI
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: "Draft", dpi: 72 },
              { label: "Standard", dpi: 96 },
              { label: "Medium", dpi: 150 },
              { label: "High-Res", dpi: 300, recommended: true },
              { label: "Ultra-HD", dpi: 600 },
            ].map((preset) => {
              const isActive = downloadDpi === preset.dpi;
              return (
                <button
                  key={preset.dpi}
                  type="button"
                  onClick={() => setDownloadDpi(preset.dpi)}
                  className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs z-10 scale-102 font-bold"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 text-slate-700 dark:text-slate-300"
                  }`}
                  title={`${preset.label} (${preset.dpi} DPI, ${Math.round(8 * preset.dpi)} x ${Math.round(8 * preset.dpi)} px)`}
                >
                  {preset.recommended && !isActive && (
                    <span className="absolute -top-1 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                  <span className="text-[10px] tracking-tight leading-tight block font-semibold">
                    {preset.label}
                  </span>
                  <span className={`text-[9px] font-mono mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                    {preset.dpi} DPI
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-bold text-slate-500 gap-1.5">
              <span>Dynamic DPI Range: 72 – 600 DPI</span>
              <span className="font-mono text-slate-500">
                Resolution: <strong className="font-extrabold text-slate-800 dark:text-white">{Math.round(8 * downloadDpi)} × {Math.round(8 * downloadDpi)} px</strong> (~{((8 * downloadDpi * 8 * downloadDpi) / 1000000).toFixed(1)} MP)
              </span>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-slate-950/20 rounded-xl p-2 border border-slate-200/80 dark:border-slate-800/80 shadow-3xs">
              <input
                type="range"
                min="72"
                max="600"
                value={downloadDpi}
                onChange={(e) => setDownloadDpi(parseInt(e.target.value))}
                className="flex-grow accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="72"
                  max="600"
                  value={downloadDpi}
                  onChange={(e) => {
                    const val = Math.min(600, Math.max(72, parseInt(e.target.value) || 72));
                    setDownloadDpi(val);
                  }}
                  className="w-14 text-center text-xs font-mono font-bold border border-slate-200 dark:border-slate-850 rounded-lg py-1 bg-transparent text-slate-800 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 font-bold">DPI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 flex-wrap">
          <button
            onClick={handleDownload}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-download-quote"
          >
            <Download className="w-4 h-4 mr-2 text-slate-400" />
            Download PNG
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-download-quote-pdf"
            title="Download high-resolution print-ready PDF"
          >
            <FileText className="w-4 h-4 mr-2 text-indigo-500" />
            Download PDF
          </button>

          <button
            onClick={handleShare}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-indigo-200 hover:bg-indigo-50/50 rounded-xl bg-white text-indigo-700 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-share-quote"
            title="Open native device sharing sheets to publish this design"
          >
            <Share2 className="w-4 h-4 mr-2 text-indigo-500" />
            Share Design
          </button>

          <button
            onClick={handleCopyShareLink}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-amber-200 hover:bg-amber-50/50 rounded-xl bg-white text-amber-700 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-copy-share-link"
            title="Generate a sharable URL to replicate your custom design configuration"
          >
            <Link className="w-4 h-4 mr-2 text-amber-500" />
            Copy Share Link
          </button>

          <button
            onClick={() => {
              if (window.self !== window.top) {
                setShowPrintModal(true);
              } else {
                window.focus();
                window.print();
              }
            }}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50/50 rounded-xl bg-white text-slate-700 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-print-quote"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-505" />
            Print Card
          </button>

          {user ? (
            <button
              onClick={handleSaveToDrive}
              disabled={isSaving}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="btn-save-quote-drive"
            >
              <Cloud className="w-4 h-4 mr-2 text-emerald-400 animate-pulse" />
              {isSaving ? "Saving..." : "Save to Cloud Drive"}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-350 font-semibold text-sm transition-all cursor-pointer"
              title="Authenticate Drive upload via your Google Workspace account"
              id="btn-prompt-login-quote"
            >
              <Cloud className="w-4 h-4 mr-2 text-slate-600" />
              Save to Cloud Drive
            </button>
          )}
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">Print Instructions</h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">Sandbox Preview Workaround</p>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-5">
              Modern browsers block printer dialogs when applications are loaded within sandboxed preview frames (like the AI Studio interface). To print your card successfully:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 shrink-0 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-black rounded-full">1</span>
                <span>Click <strong>Open in Direct Tab</strong> below to launch the application full-screen.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 shrink-0 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-black rounded-full">2</span>
                <span>Click <strong>Print Card</strong> there, and your system print dialog will open instantly.</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  try { window.print(); } catch (e) { console.warn("Standard printing failed inside iframe:", e); }
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Try Printing Anyway
              </button>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 border-0"
              >
                <span>Open in Direct Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent border-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
