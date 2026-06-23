import React, { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { motion } from "motion/react";
import { QuoteConfig, BgStyleType } from "../types";
import { uploadFileToDrive } from "../lib/drive";
import { Download, Cloud, Sparkles, Image as ImageIcon, Type, AlignLeft, AlignCenter, AlignRight, Check, Printer, Share2, Smartphone, LayoutGrid, Monitor, Upload, FileJson } from "lucide-react";

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

interface QuotePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  aspectRatio: "1:1" | "9:16" | "3:1";
  fontSize: number;
  fontFamily: "Space Grotesk" | "Playfair Display" | "Inter" | "JetBrains Mono";
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

export default function QuoteDesigner({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
}: QuoteDesignerProps) {
  const [config, setConfig] = useState<QuoteConfig>(() => {
    if (typeof window !== "undefined") {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (bgImage) {
        localStorage.setItem("toolkit_pro_quote_bg_image", bgImage);
      } else {
        localStorage.removeItem("toolkit_pro_quote_bg_image");
      }
    }
  }, [bgImage]);

  const [motionEnabled, setMotionEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_quote_motion_enabled") !== "false";
    }
    return true;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [downloadDpi, setDownloadDpi] = useState<number>(300); // Customizable export DPI
  const [previewZoom, setPreviewZoom] = useState<number>(1.0); // Dynamic inspection zoom level
  const previewRef = useRef<HTMLDivElement>(null);
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
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      const cleanAuthor = (config.author || "quote").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.href = url;
      a.download = `quote_design_${cleanAuthor || "layout"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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

        // Wrap text
        const maxTextWidth = baseWidth - config.padding * 3;
        ctx.font = `italic 500 ${config.fontSize * 1.5}px "${config.fontFamily}", Georgia, serif`;
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
        
        // Calculate start Y to center block vertically
        let startY = baseHeight / 2 - totalTextHeight / 2;

        // Draw multiple lines of quote text
        lines.forEach((lineText, index) => {
          ctx.fillText(lineText, x, startY + index * textLineHeight);
        });

        // Draw Author
        if (config.author) {
          ctx.font = `600 ${config.fontSize * 0.9}px "${config.fontFamily}", sans-serif`;
          ctx.fillStyle = config.fontColor === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
          const authorY = startY + (lines.length * textLineHeight) + 40;
          ctx.fillText(`— ${config.author}`, x, authorY);
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
          drawTextAndResolve();
        };
        img.onerror = () => {
          // Fallback to solid standard color if image load fails
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, baseWidth, baseHeight);
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
        drawTextAndResolve();
      } else {
        // Solid color
        ctx.fillStyle = config.bgValue;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        drawTextAndResolve();
      }
    });
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await getCanvasDataUrl();
      const link = document.createElement("a");
      const cleanAuthor = config.author.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "quote";
      const filename = `toolkit_pro_quote_${cleanAuthor}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      {/* Editor Controls Sidebar: 5 Cols */}
      <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col space-y-5 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Social Media Presets Panel */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <LayoutGrid className="w-4 h-4 text-indigo-500" /> Formatting Presets
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
                      ? "bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/30"
                      : "bg-white hover:bg-slate-100/50 border-slate-200 hover:border-slate-350"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 transition-all ${
                    isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}>
                    {preset.aspectRatio === "9:16" ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : preset.aspectRatio === "3:1" ? (
                      <Monitor className="w-3.5 h-3.5" />
                    ) : (
                      <LayoutGrid className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11.5px] font-bold text-slate-900 group-hover:text-indigo-950 truncate">
                        {preset.name}
                      </span>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-indigo-100 text-indigo-750"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {preset.description}
                    </p>
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

        <div className="h-px bg-slate-200/60" />

        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> Card Details
          </h3>
          <p className="text-xs text-slate-500">
            Write your quote, set author details, and choose alignment.
          </p>
        </div>

        {/* Text Input Row */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">Quote Text</label>
              <button
                type="button"
                onClick={generateRandomQuote}
                disabled={isGeneratingQuote}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none disabled:opacity-50"
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
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-inner focus:outline-none focus:border-slate-800 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Author</label>
            <input
              type="text"
              value={config.author}
              onChange={(e) => setConfig((prev) => ({ ...prev, author: e.target.value }))}
              placeholder="e.g. Ralph Waldo Emerson"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 transition-colors"
            />
          </div>
        </div>

        {/* Typography & Alignment Controls */}
        <div className="space-y-4 pt-3 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Typography & Style
          </h4>
          
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Font Family</label>
              <select
                value={config.fontFamily}
                onChange={(e) => setConfig((prev) => ({ ...prev, fontFamily: e.target.value as any }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="Playfair Display">Playfair Display</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Inter">Inter (Sans)</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Font Color</label>
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
                  className="w-full text-center text-xs border border-slate-200 rounded px-1.5 py-1 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Font Size (px)</label>
              <input
                type="range"
                min="16"
                max="48"
                value={config.fontSize}
                onChange={(e) => setConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full accent-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block text-right mt-0.5">{config.fontSize}px</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Alignment</label>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "left" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${
                    config.textAlign === "left" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "center" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${
                    config.textAlign === "center" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textAlign: "right" }))}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${
                    config.textAlign === "right" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Background Nature Designer Row */}
        <div className="space-y-4 pt-3 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Canvas Background
          </h4>

          {/* Selector Type Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50 text-xs">
            <button
              onClick={() => setConfig(p => ({ ...p, bgStyle: "gradient", bgValue: PRESET_GRADIENTS[0].value }))}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-medium ${
                config.bgStyle === "gradient" ? "bg-white shadow-sm text-slate-950" : "text-slate-500"
              }`}
            >
              Nature Gradients
            </button>
            <button
              onClick={() => setConfig(p => ({ ...p, bgStyle: "color", bgValue: "#2563eb" }))}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-medium ${
                config.bgStyle === "color" ? "bg-white shadow-sm text-slate-950" : "text-slate-500"
              }`}
            >
              Solid Color
            </button>
            <button
              onClick={() => setConfig(p => ({ ...p, bgStyle: "image" }))}
              className={`flex-1 text-center py-1.5 rounded-md transition-all font-medium flex items-center justify-center gap-1 ${
                config.bgStyle === "image" ? "bg-white shadow-sm text-slate-950" : "text-slate-500"
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
          {config.bgStyle === "gradient" && (
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
                    onClick={() => setConfig(p => ({ ...p, bgValue: preset.value }))}
                    className={`flex-shrink-0 w-28 h-18 rounded-xl relative overflow-hidden transition-all duration-300 shadow-3xs border text-left flex flex-col justify-end p-2 cursor-pointer snap-start ${
                      config.bgValue === preset.value
                        ? "border-slate-900 dark:border-white ring-2 ring-slate-900/50 dark:ring-white/50 scale-[1.02]"
                        : "border-slate-200/60 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:scale-[1.01]"
                    }`}
                    style={{ background: preset.value }}
                    title={preset.name}
                  >
                    <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-opacity ${
                        config.bgValue === preset.value ? "bg-black/40 backdrop-blur-3xs text-white opacity-100" : "opacity-0"
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

          {config.bgStyle === "color" && (
            <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
              <input
                type="color"
                value={config.bgValue}
                onChange={(e) => setConfig(p => ({ ...p, bgValue: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase">{config.bgValue}</p>
                <p className="text-[10px] text-slate-400">Apply a solid color background</p>
              </div>
            </div>
          )}

          {config.bgStyle === "image" && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 select-none ${
                  isDragging
                    ? "border-amber-500 bg-amber-50/50 shadow-md shadow-amber-500/10 scale-[1.01]"
                    : "border-slate-200 hover:border-amber-400 hover:bg-slate-50/50 bg-white"
                }`}
                id="quote-image-drop-zone"
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-2.5 rounded-full ${isDragging ? "bg-amber-100 text-amber-600 scale-110" : "bg-slate-100 text-slate-500"} transition-all duration-300`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    {isDragging ? (
                      <p className="text-xs font-bold text-amber-600 animate-pulse">Drop to apply photo!</p>
                    ) : bgImage ? (
                      <p className="text-xs font-semibold text-slate-750">Drag & drop or Click to change photo</p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-750">Drag & Drop photo here, or Click to browse</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      PNG, JPEG, dynamic aspect scale center crop
                    </p>
                  </div>
                </div>
              </div>

              {bgImage && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs animate-fade-in">
                  <div className="flex items-center space-x-2.5">
                    <img src={bgImage} alt="User bg" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                    <div>
                      <p className="text-xs font-semibold text-slate-705">Active Photo</p>
                      <p className="text-[10px] text-slate-400">Aspect-fit center overlay</p>
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
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-all border-0 bg-transparent font-sans cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contrast Overlay Slider for Photo / Vivid gradients */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Contrast Banner Dark Overlay</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.overlayOpacity * 100}
                onChange={(e) => setConfig(p => ({ ...p, overlayOpacity: parseInt(e.target.value) / 100 }))}
                className="w-full accent-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {Math.round(config.overlayOpacity * 100)}% Opacity
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Card Border Padding</label>
              <input
                type="range"
                min="20"
                max="80"
                value={config.padding}
                onChange={(e) => setConfig(p => ({ ...p, padding: parseInt(e.target.value) }))}
                className="w-full accent-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block text-right">{config.padding}px</span>
            </div>
          </div>

          {/* Smooth Motion Controls Toggle Switch */}
          <div className="pt-3.5 border-t border-slate-200">
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
        </div>
      </div>

      {/* Preview and Execution Side: 7 Cols */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
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

          <div className="flex-1 w-full flex items-center justify-center overflow-auto p-2 sm:p-4 min-h-[300px] sm:min-h-[400px] custom-scroll scrollbar-none">
            <div
              ref={previewRef}
              style={{
                padding: `${config.padding}px`,
                transform: `scale(${previewZoom})`,
                transformOrigin: "center center",
              }}
              id="quote-card-preview"
              className={`print-ready-quote-card w-full rounded-2xl shadow-xl flex flex-col justify-between items-stretch relative overflow-hidden transition-all duration-300 ${
                config.aspectRatio === "9:16"
                  ? "aspect-[9/16] max-w-[310px]"
                  : config.aspectRatio === "3:1"
                  ? "aspect-[3/1] max-w-[550px]"
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

            {/* Contrast Overlay layer in CSS representation */}
            <div
              style={{
                backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity})`,
                backdropFilter: `blur(${config.overlayBlur}px)`,
              }}
              className="absolute inset-0 z-5 pointer-events-none transition-all"
            />

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
                <>
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
                        fontStyle: "italic",
                      }}
                      className="font-medium tracking-wide break-words"
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
                        fontStyle: "italic",
                      }}
                      className="font-medium tracking-wide break-words"
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
                          fontFamily: config.fontFamily,
                          fontSize: `${config.fontSize * 0.85}px`,
                          color: config.fontColor,
                          textAlign: config.textAlign,
                        }}
                        className="font-semibold mt-5 tracking-tight border-t border-white/10 pt-2"
                      >
                        — {config.author}
                      </motion.p>
                    ) : (
                      <p
                        style={{
                          fontFamily: config.fontFamily,
                          fontSize: `${config.fontSize * 0.85}px`,
                          color: config.fontColor,
                          textAlign: config.textAlign,
                        }}
                        className="font-semibold opacity-80 mt-5 tracking-tight border-t border-white/10 pt-2"
                      >
                        — {config.author}
                      </p>
                    )
                  )}
                </>
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
            onClick={handleShare}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center px-4 py-3 border border-indigo-200 hover:bg-indigo-50/50 rounded-xl bg-white text-indigo-700 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            id="btn-share-quote"
            title="Open native device sharing sheets to publish this design"
          >
            <Share2 className="w-4 h-4 mr-2 text-indigo-500" />
            Share Design
          </button>

          <button
            onClick={() => window.print()}
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
    </div>
  );
}
