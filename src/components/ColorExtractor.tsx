import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { User } from "firebase/auth";
import { PaletteColor } from "../types";
import { uploadFileToDrive, getOrCreateFolder } from "../lib/drive";
import { Cloud, Download, Copy, Pipette, UploadCloud, Check, Sparkles, AlertCircle, Code, Sun, ArrowUpDown, Share2, Eye, CheckCircle2, Sliders } from "lucide-react";

interface ColorExtractorProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => void;
}

// Helper functions for WCAG 2.0 contrast ratio calculations
const getRelativeLuminance = (hex: string): number => {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  let rHex = cleanHex.substring(0, 2);
  let gHex = cleanHex.substring(2, 4);
  let bHex = cleanHex.substring(4, 6);
  if (cleanHex.length === 3) {
    rHex = cleanHex.substring(0, 1) + cleanHex.substring(0, 1);
    gHex = cleanHex.substring(1, 2) + cleanHex.substring(1, 2);
    bHex = cleanHex.substring(2, 3) + cleanHex.substring(2, 3);
  }
  const rgb = [
    parseInt(rHex || "0", 16) / 255,
    parseInt(gHex || "0", 16) / 255,
    parseInt(bHex || "0", 16) / 255,
  ];

  const a = rgb.map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastRatio = (color1: string, color2: string): number => {
  if (!color1 || !color2) return 1;
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex);
};

const hexToRgb = (hex: string): string => {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  let rHex = cleanHex.substring(0, 2);
  let gHex = cleanHex.substring(2, 4);
  let bHex = cleanHex.substring(4, 6);
  if (cleanHex.length === 3) {
    rHex = cleanHex.substring(0, 1) + cleanHex.substring(0, 1);
    gHex = cleanHex.substring(1, 2) + cleanHex.substring(1, 2);
    bHex = cleanHex.substring(2, 3) + cleanHex.substring(2, 3);
  }
  const r = parseInt(rHex || "0", 16);
  const g = parseInt(gHex || "0", 16);
  const b = parseInt(bHex || "0", 16);
  return `rgb(${r}, ${g}, ${b})`;
};

export default function ColorExtractor({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
}: ColorExtractorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_palette_imageurl");
    }
    return null;
  });
  const [fileName, setFileName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_palette_filename") || "";
    }
    return "";
  });
  const [palette, setPalette] = useState<PaletteColor[]>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_palette_colors");
      if (persisted) {
        try {
          return JSON.parse(persisted);
        } catch (e) {
          console.error("Failed to parse palette colors:", e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (imageUrl) {
        localStorage.setItem("toolkit_pro_palette_imageurl", imageUrl);
      } else {
        localStorage.removeItem("toolkit_pro_palette_imageurl");
      }
      localStorage.setItem("toolkit_pro_palette_filename", fileName);
      localStorage.setItem("toolkit_pro_palette_colors", JSON.stringify(palette));
    }
  }, [imageUrl, fileName, palette]);

  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<{ message: string; value: string; type: "HEX" | "RGB" } | null>(null);

  const [wcagTextColor, setWcagTextColor] = useState<string>("#0f172a");
  const [wcagBgColor, setWcagBgColor] = useState<string>("#ffffff");
  const [validatorMode, setValidatorMode] = useState<"multi" | "pair">("multi");
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontWeight, setFontWeight] = useState<"light" | "normal" | "bold">("normal");
  const [multiFilter, setMultiFilter] = useState<"all" | "aaa" | "aa" | "large">("all");
  const [customBgInput, setCustomBgInput] = useState<string>("#ffffff");
  const [customTxInput, setCustomTxInput] = useState<string>("#0f172a");

  useEffect(() => {
    setCustomBgInput(wcagBgColor);
  }, [wcagBgColor]);

  useEffect(() => {
    setCustomTxInput(wcagTextColor);
  }, [wcagTextColor]);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string; iconType?: "cloud" | "share" } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (paletteTimeoutRef.current) {
        clearTimeout(paletteTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide alerts
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    if (copiedHex) {
      const timer = setTimeout(() => setCopiedHex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedHex]);

  useEffect(() => {
    if (copiedJson) {
      const timer = setTimeout(() => setCopiedJson(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedJson]);

  useEffect(() => {
    if (copiedToast) {
      const timer = setTimeout(() => setCopiedToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [copiedToast]);

  useEffect(() => {
    if (palette.length >= 2) {
      const isTextInPalette = palette.some(c => c.hex === wcagTextColor);
      const isBgInPalette = palette.some(c => c.hex === wcagBgColor);
      
      if (!isTextInPalette || !isBgInPalette) {
        let bestText = palette[0].hex;
        let bestBg = palette[1].hex;
        let maxContrast = 0;
        
        for (let i = 0; i < palette.length; i++) {
          for (let j = 0; j < palette.length; j++) {
            if (i === j) continue;
            const contrast = getContrastRatio(palette[i].hex, palette[j].hex);
            if (contrast > maxContrast) {
              maxContrast = contrast;
              bestBg = palette[i].hex;
              bestText = palette[j].hex;
            }
          }
        }
        setWcagBgColor(bestBg);
        setWcagTextColor(bestText);
      }
    } else if (palette.length === 1) {
      setWcagBgColor(palette[0].hex);
      setWcagTextColor("#ffffff");
    }
  }, [palette]);

  // Extract palette when image loads
  const extractPalette = (imgSrc: string) => {
    if (paletteTimeoutRef.current) {
      clearTimeout(paletteTimeoutRef.current);
    }

    setIsProcessing(true);
    
    paletteTimeoutRef.current = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Resize very small to downsample and grab key clusters
        canvas.width = 12;
        canvas.height = 12;
        ctx.drawImage(img, 0, 0, 12, 12);

        const imgData = ctx.getImageData(0, 0, 12, 12).data;
        const rgbList: { r: number; g: number; b: number }[] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          // Only sample if pixel is mostly opaque
          if (a > 200) {
            rgbList.push({ r, g, b });
          }
        }

        // Convert RGBs to Hex
        const hexList = rgbList.map((rgb) => {
          const toHex = (c: number) => {
            const hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          };
          return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
        });

        // Filter out hex values that are extremely close to white/black or duplicate
        const uniqueHex: string[] = [];
        const threshold = 18; // Euclidean RGB spacing threshold

        const parseHex = (hex: string) => {
          const r = parseInt(hex.substring(1, 3), 16);
          const g = parseInt(hex.substring(3, 5), 16);
          const b = parseInt(hex.substring(5, 7), 16);
          return { r, g, b };
        };

        for (let i = 0; i < hexList.length; i++) {
          const currentHex = hexList[i];
          const currentRgb = parseHex(currentHex);

          // Skip absolute whites or pure blacks
          const luminance = 0.2126 * currentRgb.r + 0.7152 * currentRgb.g + 0.0722 * currentRgb.b;
          if (luminance > 248 || luminance < 8) continue;

          let isDistinct = true;
          for (let j = 0; j < uniqueHex.length; j++) {
            const uRgb = parseHex(uniqueHex[j]);
            // Calculate Euclidean distance in RGB color space
            const dist = Math.sqrt(
              Math.pow(currentRgb.r - uRgb.r, 2) +
                Math.pow(currentRgb.g - uRgb.g, 2) +
                Math.pow(currentRgb.b - uRgb.b, 2)
            );
            if (dist < threshold) {
              isDistinct = false;
              break;
            }
          }

          if (isDistinct) {
            uniqueHex.push(currentHex);
            if (uniqueHex.length >= 6) break; // Limit to sweet-spot 5-6 designer colors
          }
        }

        // Standard Fallback colors if none found
        if (uniqueHex.length === 0) {
          uniqueHex.push("#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444");
        }

        // Build model structures
        const paletteColors = uniqueHex.map((hex, index) => {
          const rgb = parseHex(hex);
          const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
          const contrastColor = yiq >= 128 ? "#090d16" : "#ffffff";
          return {
            hex,
            name: `Dominant Hue ${index + 1}`,
            contrastColor,
          };
        });

        setPalette(paletteColors);
        setIsProcessing(false);
      };
      img.src = imgSrc;
    }, 750);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid format! Pick standard JPEG, WebP, or PNG graphics.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const resultSrc = e.target.result as string;
        setImageUrl(resultSrc);
        setFileName(file.name);
        extractPalette(resultSrc);
        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "file",
            title: `Extracted palette: ${file.name}`,
            detail: `Analyzed photo color spectrum (${(file.size / 1024).toFixed(1)} KB)`,
            icon: "Pipette",
            tab: "palette"
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Eyedropper custom color picker: Click on standard image canvas to grab colors
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageUrl || !imageRef.current) return;

    const img = imageRef.current;
    
    // Draw raw image to helper canvas dynamically to capture coordinates pixel perfectly
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    // Get click coordinates relative to image render dimensions
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
    const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;

    // Add picked color to the palette (replacing last color or expanding)
    const yiq = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
    const contrastColor = yiq >= 128 ? "#000000" : "#ffffff";
    const pickedElement: PaletteColor = {
      hex,
      name: `Picked Hue`,
      contrastColor,
    };

    // Replace if we already have a picked hue, otherwise append
    setPalette((prev) => {
      const filtered = prev.filter((p) => p.name !== "Picked Hue");
      return [...filtered, pickedElement].slice(-6); // Limit to 6
    });
  };

  const copyToClipboard = (hexValue: string) => {
    navigator.clipboard.writeText(hexValue);
    setCopiedHex(hexValue);
    setCopiedToast({ message: "Copied HEX Value", value: hexValue, type: "HEX" });
  };

  const handleCopyValue = (val: string, type: "HEX" | "RGB") => {
    navigator.clipboard.writeText(val);
    setCopiedToast({ message: `Copied ${type} Value`, value: val, type });
    if (type === "HEX") {
      setCopiedHex(val);
    }
  };

  const getThemeJson = () => {
    const cssVariables: Record<string, string> = {};
    const semanticNames = [
      "primary",
      "secondary",
      "accent",
      "muted",
      "highlight",
      "neutral",
    ];
    palette.forEach((color, idx) => {
      const name = idx < semanticNames.length ? semanticNames[idx] : `color-${idx + 1}`;
      cssVariables[`--color-${name}`] = color.hex;
    });
    return JSON.stringify(cssVariables, null, 2);
  };

  const copyJsonToClipboard = () => {
    const jsonStr = getThemeJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
  };

  // Draw palette graphical card: Color block columns + spec labels
  const getPaletteCanvas = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 450;
      const ctx = canvas.getContext("2d");
      if (!ctx || palette.length === 0) {
        reject("Canvas unavailable or palette is empty");
        return;
      }

      // Background Fill
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 900, 450);

      // Card Header
      ctx.fillStyle = "#0f172a";
      ctx.font = 'bold 20px "Space Grotesk", sans-serif';
      ctx.fillText("TOOLKIT PRO  //  COLOR PALETTE SPEC", 40, 45);

      ctx.fillStyle = "#64748b";
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillText(`EXTRACTED FROM: ${fileName.toUpperCase() || "UPLOADED FILE"}`, 40, 70);

      // Draw Color Blocks side-by-side
      const blockWidth = 820 / palette.length;
      const blockHeight = 220;
      const startX = 40;
      const startY = 100;

      palette.forEach((color, i) => {
        const xNow = startX + i * blockWidth;
        // Shadow/Border around block
        ctx.fillStyle = color.hex;
        ctx.fillRect(xNow, startY, blockWidth - 10, blockHeight);

        // HEX text inside column bottom (vertical representation)
        ctx.fillStyle = color.contrastColor;
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.save();
        ctx.translate(xNow + blockWidth / 2 - 5, startY + blockHeight - 20);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "left";
        ctx.fillText(color.hex.toUpperCase(), 0, 0);
        ctx.restore();

        // Footer Color details text
        ctx.fillStyle = "#1e293b";
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(color.hex.toUpperCase(), xNow + (blockWidth - 10) / 2, startY + blockHeight + 30);

        // Render complementary RGB codes
        const rVal = parseInt(color.hex.substring(1, 3), 16);
        const gVal = parseInt(color.hex.substring(3, 5), 16);
        const bVal = parseInt(color.hex.substring(5, 7), 16);
        ctx.fillStyle = "#475569";
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText(`RGB(${rVal}, ${gVal}, ${bVal})`, xNow + (blockWidth - 10) / 2, startY + blockHeight + 46);
        
        ctx.fillStyle = "#64748b";
        ctx.font = 'semibold 9px "Inter", sans-serif';
        ctx.fillText(`HUE ${i + 1}`, xNow + (blockWidth - 10) / 2, startY + blockHeight + 62);
      });

      // App credit line
      ctx.fillStyle = "#cbd5e1";
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText("toolkitpro.drive.local", 860, 415);

      resolve(canvas.toDataURL("image/png"));
    });
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await getPaletteCanvas();
      const link = document.createElement("a");
      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "design";
      const downloadName = `toolkit_pro_palette_${cleanName}.png`;
      link.download = downloadName;
      link.href = dataUrl;
      link.click();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Downloaded Palette PNG",
          detail: `Saved ${downloadName} to local device`,
          icon: "Download",
          tab: "palette"
        }
      }));

      // Support Monetag Direct Link Integration
      try {
        window.open("https://omg10.com/4/11125963", "_blank", "noopener,noreferrer");
      } catch (e) {
        console.warn("Direct link popup blocked by browser policies", e);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to render palette image.");
    }
  };

  const handleSaveToDrive = async () => {
    if (!user || !accessToken) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      "Save this color palette specification sheet as a PNG to Google Drive?"
    );
    if (!confirmSave) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const dataUrl = await getPaletteCanvas();
      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "palette";
      const filename = `Color_Palette_${cleanName}.png`;

      await uploadFileToDrive(accessToken, filename, "image/png", dataUrl);
      setSaveStatus({
        success: true,
        msg: `Successfully uploaded "${filename}" to Google Drive!`,
      });
      onRefreshDrive();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: `Saved Palette: ${filename}`,
          detail: "Uploaded color palette sheet to Google Drive",
          icon: "Cloud",
          tab: "palette"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        success: false,
        msg: err.message || "Failed to save palette schema sheet to Google Drive.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSortByLuminance = () => {
    if (palette.length === 0) return;
    const sorted = [...palette].sort((a, b) => {
      const lumA = getRelativeLuminance(a.hex);
      const lumB = getRelativeLuminance(b.hex);
      return lumA - lumB; // Darkest to lightest
    });
    setPalette(sorted);
  };

  const handleSaveAllToDrive = async () => {
    if (!user || !accessToken) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      "Save the full palette package (Theme JSON variables + spec sheet PNG) to Google Drive under 'ToolkitPro/Palettes' folder?"
    );
    if (!confirmSave) return;

    setIsSavingAll(true);
    setSaveStatus(null);
    try {
      // 1. Resolve folder hierarchy 'ToolkitPro/Palettes'
      const appFolderName = "ToolkitPro";
      const appFolderId = await getOrCreateFolder(accessToken, appFolderName);
      
      const palettesFolderName = "Palettes";
      const palettesFolderId = await getOrCreateFolder(accessToken, palettesFolderName, appFolderId);

      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "palette";
      const dateStr = new Date().toISOString().slice(0, 10);
      const uniqueSuffix = `${cleanName}_${dateStr}`;

      // 2. Generate PNG Data URL
      const pngDataUrl = await getPaletteCanvas();
      const pngFilename = `Color_Palette_${uniqueSuffix}.png`;

      // 3. Generate JSON Data URL
      const themeJsonContent = {
        name: `Color_Palette_${cleanName}`,
        createdAt: new Date().toISOString(),
        colors: palette,
        cssVariables: JSON.parse(getThemeJson())
      };
      
      const jsonStr = JSON.stringify(themeJsonContent, null, 2);
      // Robust base64 encoding that handles potential special characters
      const base64Json = btoa(unescape(encodeURIComponent(jsonStr)));
      const jsonDataUrl = `data:application/json;base64,${base64Json}`;
      const jsonFilename = `Color_Palette_${uniqueSuffix}.json`;

      // 4. Sequentially upload both assets into the target folder
      await uploadFileToDrive(accessToken, jsonFilename, "application/json", jsonDataUrl, palettesFolderId);
      await uploadFileToDrive(accessToken, pngFilename, "image/png", pngDataUrl, palettesFolderId);

      setSaveStatus({
        success: true,
        msg: `Successfully saved theme JSON and Spec PNG in Google Drive under "ToolkitPro/Palettes"!`,
      });
      onRefreshDrive();
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        success: false,
        msg: err.message || "Failed to save complete palette package to Google Drive.",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSharePalette = async () => {
    if (palette.length === 0) return;

    const paletteName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Custom Palette";
    const colorsText = palette.map((color, idx) => `🎨 Color ${idx + 1}: ${color.hex.toUpperCase()}`).join("\n");
    const jsonVarsText = getThemeJson();
    
    const textMessage = `🎨 ToolkitPro Palette: "${paletteName}"\n\nExtracted Colors:\n${colorsText}\n\nCSS Theme Variables:\n${jsonVarsText}\n\nCreated with ToolkitPro. Check out your design colors!`;

    // Attempt sharing via Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ToolkitPro - ${paletteName}`,
          text: textMessage,
          url: window.location.href,
        });
        setSaveStatus({
          success: true,
          msg: "Palette shared successfully!",
          iconType: "share",
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Native Web Share failed:", err);
          // Fallback to Clipboard Copy
          try {
            await navigator.clipboard.writeText(textMessage);
            setSaveStatus({
              success: true,
              msg: "Native share was restricted or canceled. Palette copied to clipboard instead!",
              iconType: "share",
            });
          } catch (clipErr) {
            console.error("Clipboard fallback failed:", clipErr);
            setSaveStatus({
              success: false,
              msg: "Share failed and clipboard access is restricted.",
              iconType: "share",
            });
          }
        }
      }
    } else {
      // Direct Clipboard Fallback
      try {
        await navigator.clipboard.writeText(textMessage);
        setSaveStatus({
          success: true,
          msg: "Web Share API not supported on this browser. Formatted palette copied to clipboard!",
          iconType: "share",
        });
      } catch (clipErr) {
        console.error("Clipboard copy failed:", clipErr);
        setSaveStatus({
          success: false,
          msg: "Web Share not supported and clipboard access is restricted.",
          iconType: "share",
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      {/* Upload sidebar: 5 Cols */}
      <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1 col-span-1 border-0">
            <Pipette className="w-4 h-4 text-emerald-500" /> Palette Core
          </h3>
          <p className="text-xs text-slate-500">
            Drop creator images to downsample coordinates or tap directly on the loaded canvas to sample custom design hues.
          </p>
        </div>

        {/* Upload Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
              : imageUrl
              ? "border-slate-300 bg-white hover:border-slate-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? "text-emerald-500" : "text-slate-400"}`} />
          {imageUrl ? (
            <div>
              <p className="text-xs font-semibold text-slate-800 break-all px-2">{fileName}</p>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                Color Palette Extracted
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-slate-700">Drag & Drop palette image</p>
              <p className="text-[10px] text-slate-400 mt-1">Samples dominant designer colors automatically</p>
            </div>
          )}
        </div>

        {/* Pipette hover tooltip helper */}
        {imageUrl && (
          <div className="p-3.5 bg-indigo-50 border border-indigo-100/50 rounded-xl flex items-start space-x-2.5 text-xs text-indigo-800">
            <AlertCircle className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
            <p className="leading-relaxed">
              <strong>Eye Dropper Active:</strong> Tap directly on any visual spot in the right-side preview image to inject a precise custom tone into your spectrum.
            </p>
          </div>
        )}

        {/* WCAG Accessibility Contrast Evaluator Section */}
        {palette.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs space-y-4">
            {/* Header: Title and Swap Colors */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> Accessible Contrast Tools
              </h4>
              {validatorMode === "pair" && (
                <button 
                  onClick={() => {
                    const temp = wcagTextColor;
                    setWcagTextColor(wcagBgColor);
                    setWcagBgColor(temp);
                  }}
                  className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border-0"
                  title="Swap Text and Background colors"
                >
                  <Code className="w-3 h-3 rotate-90" /> Swap Colors
                </button>
              )}
            </div>

            {/* Sub-header tabs to switch Validator Mode */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/40">
              <button
                onClick={() => setValidatorMode("multi")}
                className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer border-0 ${
                  validatorMode === "multi" 
                    ? "bg-white text-slate-900 shadow-xs font-black" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
                id="tab-validator-multi"
              >
                Multi-Swatch Validator
              </button>
              <button
                onClick={() => setValidatorMode("pair")}
                className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer border-0 ${
                  validatorMode === "pair" 
                    ? "bg-white text-slate-900 shadow-xs font-black" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
                id="tab-validator-pair"
              >
                Single Pair Evaluator
              </button>
            </div>

            {/* RENDER VIEW 1: MULTI-SWATCH VALIDATOR */}
            {validatorMode === "multi" && (
              <div className="space-y-4">
                {/* Background Selection Section with Direct input option */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Target Background
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="text"
                        value={customBgInput}
                        placeholder={wcagBgColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomBgInput(val);
                          const sanitized = val.startsWith("#") ? val : `#${val}`;
                          if (isValidHex(sanitized)) {
                            setWcagBgColor(sanitized);
                          }
                        }}
                        className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-center font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                        title="Type custom background hex color"
                      />
                      <input 
                        type="color" 
                        value={wcagBgColor || "#ffffff"} 
                        onChange={(e) => {
                          setWcagBgColor(e.target.value);
                          setCustomBgInput(e.target.value);
                        }} 
                        className="w-5 h-5 rounded border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                        title="Pick custom contrast background color"
                      />
                    </div>
                  </div>

                  {/* Quick Presets Row */}
                  <div className="flex flex-wrap items-center gap-1.5 py-0.5 border-t border-slate-150 pt-1.5 mt-1.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Presets:</span>
                    <button 
                      onClick={() => {
                        setWcagBgColor("#ffffff");
                        setCustomBgInput("#ffffff");
                      }} 
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer select-none font-medium text-xs shadow-2xs"
                    >
                      White
                    </button>
                    <button 
                      onClick={() => {
                        setWcagBgColor("#0f172a");
                        setCustomBgInput("#0f172a");
                      }} 
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800 cursor-pointer select-none font-medium text-xs shadow-2xs"
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => {
                        setWcagBgColor("#f1f5f9");
                        setCustomBgInput("#f1f5f9");
                      }} 
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer select-none font-medium text-xs shadow-2xs"
                    >
                      Silver
                    </button>

                    <div className="h-3 w-[1px] bg-slate-250 mx-0.5" />
                    
                    {/* Palette Swatches chips to set bg */}
                    {palette.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setWcagBgColor(color.hex);
                          setCustomBgInput(color.hex);
                        }}
                        className={`w-4 h-4 rounded-full border shadow-2xs transition-transform hover:scale-110 cursor-pointer border-0 ${
                          wcagBgColor === color.hex ? "ring-2 ring-indigo-550 scale-110" : "border-black/5"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={`Set swatch ${idx + 1} (${color.hex}) as background`}
                      />
                    ))}
                  </div>

                  {/* Multi-Filter Pill controls */}
                  <div className="flex flex-wrap items-center gap-1 mt-1 border-t border-slate-200/50 pt-2">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide mr-1 select-none">Filter Grade:</span>
                    {(["all", "aaa", "aa", "large"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setMultiFilter(level)}
                        className={`px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                          multiFilter === level 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-black"
                            : "bg-white text-slate-500 border-slate-200 hover:text-slate-705 hover:bg-slate-100"
                        }`}
                      >
                        {level === "all" ? "All" : level === "aaa" ? "AAA (7.0+)" : level === "aa" ? "AA (4.5+)" : "AA Lrg (3.0+)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swatches Validation Stack */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                    <span>Palette Swatch (Text)</span>
                    <span>Contrast / WCAG Status</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = palette.filter((swatch) => {
                        const contrast = getContrastRatio(swatch.hex, wcagBgColor || "#ffffff");
                        if (multiFilter === "aaa") return contrast >= 7.0;
                        if (multiFilter === "aa") return contrast >= 4.5;
                        if (multiFilter === "large") return contrast >= 3.0;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-400 text-[10px] space-y-1">
                            <p className="font-bold">No swatches match the criteria filter.</p>
                            <p>Try picking a different target background color.</p>
                          </div>
                        );
                      }

                      return filtered.map((swatch, idx) => {
                        const contrast = getContrastRatio(swatch.hex, wcagBgColor || "#ffffff");
                        
                        const passAANormal = contrast >= 4.5;
                        const passAALarge = contrast >= 3.0;

                        let contrastColorClass = "text-rose-600 bg-rose-50 border-rose-100";
                        if (contrast >= 7.0) {
                          contrastColorClass = "text-emerald-700 bg-emerald-50/50 border-emerald-100";
                        } else if (contrast >= 4.5) {
                          contrastColorClass = "text-indigo-700 bg-indigo-50/50 border-indigo-100";
                        } else if (contrast >= 3.0) {
                          contrastColorClass = "text-amber-700 bg-amber-50/50 border-amber-100";
                        }

                        return (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/70 transition-colors gap-2"
                          >
                            {/* Color block and descriptor */}
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-6 h-6 rounded-md border border-slate-200/50 shadow-2xs shrink-0 flex items-center justify-center font-bold text-[8px] select-none text-white font-mono"
                                style={{ backgroundColor: swatch.hex, color: getRelativeLuminance(swatch.hex) > 0.5 ? '#000000' : '#ffffff' }}
                              >
                                C{idx + 1}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-mono text-[10px] font-bold text-slate-800 leading-tight">
                                  {swatch.hex.toUpperCase()}
                                  </span>
                                <span className="text-[8px] text-slate-400 capitalize">
                                  {swatch.name || `Hue ${idx + 1}`}
                                </span>
                              </div>
                            </div>

                            {/* Live interactive rendering sample */}
                            <div 
                              className="flex-1 max-w-[85px] rounded-lg border border-slate-200/50 py-1 text-center font-bold text-[10px] truncate shrink-0 select-none font-sans"
                              style={{ backgroundColor: wcagBgColor || "#ffffff", color: swatch.hex }}
                              title={`Contrast preview of ${swatch.hex} text over ${wcagBgColor} backdrop`}
                            >
                              Sample Text
                            </div>

                            {/* Contrast ratio and badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Ratio badge */}
                              <div className={`px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono ${contrastColorClass} min-w-[42px] text-center`}>
                                {contrast.toFixed(1)}:1
                              </div>

                              {/* Short AA icon/badge */}
                              <div className="flex flex-col gap-0.5 text-[8px] font-extrabold select-none min-w-[36px]">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-slate-400 uppercase">AA</span>
                                  {passAANormal ? (
                                    <span className="text-emerald-600 bg-emerald-50 rounded px-0.5 border border-emerald-100 pb-0.5">PASS</span>
                                  ) : (
                                    <span className="text-rose-600 bg-rose-50 rounded px-0.5 border border-rose-100 pb-0.5">FAIL</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-slate-400 uppercase">LG</span>
                                  {passAALarge ? (
                                    <span className="text-emerald-500 bg-emerald-50 rounded px-0.5 border border-emerald-100 pb-0.5">PASS</span>
                                  ) : (
                                    <span className="text-rose-500 bg-rose-50 rounded px-0.5 border border-rose-100 pb-0.5">FAIL</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Report Generation Row */}
                <button
                  onClick={() => {
                    let reportStr = `🎨 COLOR PALETTE WCAG ACCESSIBILITY CONTRAST REPORT\n`;
                    reportStr += `User Selected Background: ${(wcagBgColor || "#ffffff").toUpperCase()}\n`;
                    reportStr += `Generated on: ${new Date().toISOString().split('T')[0]}\n\n`;
                    palette.forEach((swatch, idx) => {
                      const contrast = getContrastRatio(swatch.hex, wcagBgColor || "#ffffff");
                      const passAA = contrast >= 4.5 ? "PASS" : "FAIL";
                      const passAAA = contrast >= 7.0 ? "PASS" : "FAIL";
                      const passAALrg = contrast >= 3.0 ? "PASS" : "FAIL";
                      reportStr += `- Swatch ${idx + 1} (${swatch.hex.toUpperCase()}): Contrast ${contrast.toFixed(2)}:1\n`;
                      reportStr += `  • Standard AA: ${passAA} (need >= 4.5)\n`;
                      reportStr += `  • Standard AAA: ${passAAA} (need >= 7.0)\n`;
                      reportStr += `  • Large Text AA: ${passAALrg} (need >= 3.0)\n\n`;
                    });
                    navigator.clipboard.writeText(reportStr);
                    alert("Formatted WCAG Contrast Report successfully copied to clipboard!");
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer border-0 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Copy Contrast Report
                </button>
              </div>
            )}

            {/* RENDER VIEW 2: SINGLE PAIR EVALUATOR (CLASSIC) */}
            {validatorMode === "pair" && (
              <>
                {/* Palette Quick Choose Option */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Palette Selector Link</span>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2 flex-1 relative">
                      {palette.map((color, idx) => {
                        const isBg = color.hex === wcagBgColor;
                        const isText = color.hex === wcagTextColor;
                        return (
                          <div key={idx} className="group/swatch relative flex flex-col items-center">
                            <button
                              onClick={() => {
                                if (isBg) {
                                  setWcagTextColor(color.hex);
                                  setCustomTxInput(color.hex);
                                } else {
                                  setWcagBgColor(color.hex);
                                  setCustomBgInput(color.hex);
                                }
                              }}
                              className={`w-7 h-7 rounded-full border shadow-xs relative focus:outline-none hover:scale-110 transition-transform cursor-pointer border-0 ${
                                isBg ? "border-slate-800 scale-105" : isText ? "border-slate-800 scale-105" : "border-black/10"
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={`Click to set BG, or hover for options.`}
                            >
                              {isBg && (
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference drop-shadow-xs font-mono">
                                  BG
                                </span>
                              )}
                              {isText && (
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference drop-shadow-xs font-mono">
                                  TX
                                </span>
                              )}
                            </button>
                            
                            {/* Hover Quick Set Controls tooltips */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-705 rounded-md p-1 shadow-md hidden group-hover/swatch:flex gap-1 z-10 text-[9px] text-white">
                              <button 
                                onClick={() => {
                                  setWcagBgColor(color.hex);
                                  setCustomBgInput(color.hex);
                                }} 
                                className="px-1.5 py-0.5 hover:bg-slate-700 bg-transparent text-white border-0 rounded transition-colors font-medium cursor-pointer"
                              >
                                Set BG
                              </button>
                              <div className="w-[1px] bg-slate-705" />
                              <button 
                                onClick={() => {
                                  setWcagTextColor(color.hex);
                                  setCustomTxInput(color.hex);
                                }} 
                                className="px-1.5 py-0.5 hover:bg-slate-700 bg-transparent text-white border-0 rounded transition-colors font-medium cursor-pointer"
                              >
                                Set TX
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dropdowns & Custom Manual Inputs for single pair choice */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Background</label>
                    <div className="relative">
                      <select 
                        value={wcagBgColor}
                        onChange={(e) => {
                          setWcagBgColor(e.target.value);
                          setCustomBgInput(e.target.value);
                        }}
                        className="w-full bg-white border border-slate-205 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                      >
                        {palette.map((color, idx) => (
                          <option key={idx} value={color.hex}>{color.hex.toUpperCase()} (C{idx + 1})</option>
                        ))}
                        {!palette.some((c) => c.hex === wcagBgColor) && (
                          <option value={wcagBgColor}>{wcagBgColor.toUpperCase()} (Custom)</option>
                        )}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-black/10 shadow-xs" style={{ backgroundColor: wcagBgColor }} />
                    </div>
                    <input 
                      type="text"
                      value={customBgInput}
                      placeholder={wcagBgColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomBgInput(val);
                        const sanitized = val.startsWith("#") ? val : `#${val}`;
                        if (isValidHex(sanitized)) {
                          setWcagBgColor(sanitized);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-center font-mono font-bold uppercase focus:outline-none focus:border-indigo-505"
                      title="Background HEX"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Text Color</label>
                    <div className="relative">
                      <select 
                        value={wcagTextColor}
                        onChange={(e) => {
                          setWcagTextColor(e.target.value);
                          setCustomTxInput(e.target.value);
                        }}
                        className="w-full bg-white border border-slate-205 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                      >
                        {palette.map((color, idx) => (
                          <option key={idx} value={color.hex}>{color.hex.toUpperCase()} (C{idx + 1})</option>
                        ))}
                        {!palette.some((c) => c.hex === wcagTextColor) && (
                          <option value={wcagTextColor}>{wcagTextColor.toUpperCase()} (Custom)</option>
                        )}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-black/10 shadow-xs" style={{ backgroundColor: wcagTextColor }} />
                    </div>
                    <input 
                      type="text"
                      value={customTxInput}
                      placeholder={wcagTextColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTxInput(val);
                        const sanitized = val.startsWith("#") ? val : `#${val}`;
                        if (isValidHex(sanitized)) {
                          setWcagTextColor(sanitized);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-center font-mono font-bold uppercase focus:outline-none focus:border-indigo-505"
                      title="Text HEX"
                    />
                  </div>
                </div>

                {/* Playground Typography Controls */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-505 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-indigo-500" /> Typography Playground</span>
                    <span className="font-mono text-slate-600 font-bold">{fontSize}px</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="12" 
                    max="36" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer border-0 accent-indigo-600"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mr-1 select-none">Font Weight Modifier</span>
                    <div className="flex gap-1">
                      {(["light", "normal", "bold"] as const).map((wt) => (
                        <button
                          key={wt}
                          onClick={() => setFontWeight(wt)}
                          className={`px-2 py-0.5 text-[9px] rounded-md border text-center font-bold uppercase transition-all cursor-pointer border-0 leading-none ${
                            fontWeight === wt 
                              ? "bg-indigo-600 text-white shadow-2xs font-extrabold" 
                              : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {wt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Single Pair performance result */}
                {wcagBgColor && wcagTextColor && (() => {
                  const ratio = getContrastRatio(wcagBgColor, wcagTextColor);
                  
                  const isCurrentLarge = fontSize >= 24 || (fontSize >= 18.5 && fontWeight === "bold");
                  const requiredContrast = isCurrentLarge ? 3.0 : 4.5;
                  const requiredContrastAAA = isCurrentLarge ? 4.5 : 7.0;

                  const passAANormal = ratio >= requiredContrast;
                  const passAAANormal = ratio >= requiredContrastAAA;

                  const passAALarge = ratio >= 3.0;
                  const passAAALarge = ratio >= 4.5;

                  return (
                    <div className="space-y-3">
                      {/* Sample Preview Block */}
                      <div 
                        className="rounded-xl p-4 border border-slate-200/40 shadow-inner flex flex-col justify-center min-h-[105px] relative transition-colors duration-200 overflow-hidden text-left" 
                        style={{ backgroundColor: wcagBgColor, color: wcagTextColor }}
                      >
                        <div className="text-right absolute top-2 right-3 font-mono text-[8.5px] tracking-tight opacity-75 uppercase">
                          Live Typographic Grid
                        </div>
                        
                        <p 
                          className="font-sans leading-none tracking-tight mb-2 uppercase"
                          style={{ 
                            fontSize: `${fontSize}px`, 
                            fontWeight: fontWeight === "light" ? 350 : fontWeight === "normal" ? 500 : 800,
                            color: wcagTextColor 
                          }}
                        >
                          Headline Premium
                        </p>
                        <p 
                          className="font-sans text-xs leading-relaxed"
                          style={{ 
                            fontWeight: fontWeight === "bold" ? 500 : 300,
                            opacity: 0.85,
                            color: wcagTextColor 
                          }}
                        >
                          Accessible contrast ensures everyone can read and enjoy your spectrum. Customize sizes live!
                        </p>
                      </div>

                      {/* Ratio & Compliance Badges Grid */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-baseline justify-between select-none">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Calculated Contrast Ratio</span>
                          <div className="flex items-baseline gap-1 text-slate-800">
                            <span className="font-mono text-xl font-black">{ratio.toFixed(2)}</span>
                            <span className="text-xs font-bold text-slate-400 font-mono">: 1</span>
                          </div>
                        </div>

                        {/* Visual Progress/Gauge Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-455 uppercase tracking-wider font-extrabold select-none">
                            <span>Looming Contrast Gauge</span>
                            <span>{ratio >= 7.0 ? "AAA Level" : ratio >= 4.5 ? "AA Level" : ratio >= 3.0 ? "AA Large Only" : "Insufficient"}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-150 overflow-hidden flex relative border border-slate-200/40">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                ratio >= 7.0 
                                  ? "bg-gradient-to-r from-emerald-400 to-teal-500" 
                                  : ratio >= 4.5 
                                  ? "bg-gradient-to-r from-indigo-400 to-emerald-500" 
                                  : ratio >= 3.0 
                                  ? "bg-gradient-to-r from-orange-400 to-amber-500" 
                                  : "bg-gradient-to-r from-rose-500 to-rose-600"
                              }`}
                              style={{ width: `${Math.min((ratio / 10) * 100, 100)}%` }}
                            />
                            {/* Milestone Tick overlay lines at 30% (3.0), 45% (4.5), 70% (7.0) */}
                            <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white/50" title="AA Large text boundary (3.0:1)" />
                            <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-white/50" title="AA Normal text boundary (4.5:1)" />
                            <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-white/50" title="AAA Elite boundary (7.0:1)" />
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-slate-400 select-none pb-1">
                            <span>1:1</span>
                            <span className="text-orange-550 font-bold">3.0 (AA Lrg)</span>
                            <span className="text-indigo-550 font-bold">4.5 (AA)</span>
                            <span className="text-emerald-555 font-bold">7.0 (AAA)</span>
                            <span>10+</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {/* Normal Text Rows */}
                          <div className="flex flex-col gap-1 p-2 bg-white rounded-lg border border-slate-200/50">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Normal Text</span>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">WCAG AA (4.5)</span>
                              <span>
                                {ratio >= 4.5 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">Pass <Check className="w-3 h-3 text-emerald-500 animate-pulse" /></span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Fail</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">WCAG AAA (7.0)</span>
                              <span>
                                {ratio >= 7.0 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">Pass <Check className="w-3 h-3 text-emerald-500 animate-pulse" /></span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Fail</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Large Text Rows */}
                          <div className="flex flex-col gap-1 p-2 bg-white rounded-lg border border-slate-200/50">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Large Text (&gt;18pt)</span>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">WCAG AA (3.0)</span>
                              <span>
                                {ratio >= 3.0 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">Pass <Check className="w-3 h-3 text-emerald-500 animate-pulse" /></span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Fail</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">WCAG AAA (4.5)</span>
                              <span>
                                {ratio >= 4.5 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">Pass <Check className="w-3 h-3 text-emerald-500 animate-pulse" /></span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Fail</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Universal checker list */}
                        <div className="space-y-1.5 border-t border-slate-150 pt-2 text-left">
                          <span className="text-[8px] uppercase tracking-wide font-extrabold text-slate-400">Selected Font Setting Audit</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/50 select-none">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${passAANormal ? "text-emerald-500 text-emerald-500" : "text-slate-300"}`} />
                                <span className="font-semibold text-slate-600">AA Level</span>
                              </div>
                              <span className={`font-bold uppercase ${passAANormal ? "text-emerald-600" : "text-rose-500"}`}>
                                {passAANormal ? "Pass" : "Fail"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/50 select-none">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${passAAANormal ? "text-emerald-500 text-emerald-500" : "text-slate-300"}`} />
                                <span className="font-semibold text-slate-600">AAA Level</span>
                              </div>
                              <span className={`font-bold uppercase ${passAAANormal ? "text-emerald-600" : "text-rose-500"}`}>
                                {passAAANormal ? "Pass" : "Fail"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Advice text based on ratio */}
                        <div className="text-[10px] text-slate-500 italic leading-normal border-t border-slate-200/40 pt-2 flex items-start gap-1 select-none text-left">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {ratio >= 7.0 
                              ? "Flawless AAA rating. Perfect for any text or graphic elements!" 
                              : ratio >= 4.5 
                              ? "AA compliant. Safe for normal block copy paragraphs." 
                              : ratio >= 3.0 
                              ? "AA Large compliant. Highly suitable for large icons and headings." 
                              : "Insufficient contrast. Text might be hard to read."}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>

      {/* Interactive Display Area: 7 Cols */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        {saveStatus && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center ${
              saveStatus.success
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            {saveStatus.iconType === "share" ? (
              <Share2 className={`w-5 h-5 mr-2.5 ${saveStatus.success ? "text-emerald-500" : "text-rose-500"}`} />
            ) : (
              <Cloud className={`w-5 h-5 mr-2.5 ${saveStatus.success ? "text-emerald-500" : "text-rose-500"}`} />
            )}
            {saveStatus.msg}
          </div>
        )}

        {/* Main Canvas preview backdrop */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-3.5 sm:p-6 min-h-[280px] sm:min-h-[380px]">
          {isProcessing ? (
            <div className="flex-1 flex flex-col justify-between space-y-6 animate-pulse">
              {/* Shimmer Image Box */}
              <div className="flex-1 flex items-center justify-center min-h-[160px] max-h-[220px] rounded-xl border border-slate-200 bg-slate-200/60 relative overflow-hidden">
                <Pipette className="w-8 h-8 text-slate-300 animate-spin" />
              </div>

              {/* Shimmer Swatches Header and grid */}
              <div>
                <div className="h-9 bg-slate-200/60 rounded-xl w-2/3 mb-4 border border-slate-200/50" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="h-20 rounded-xl bg-slate-200/60 border border-slate-200/50"
                    />
                  ))}
                </div>
              </div>

              {/* Shimmer CSS Block */}
              <div className="space-y-2.5">
                <div className="h-4 bg-slate-200/60 rounded w-1/4" />
                <div className="h-32 bg-slate-200/40 border border-slate-200/30 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : imageUrl ? (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Loaded Image Display for eye dropping */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] max-h-[220px] overflow-hidden rounded-xl border bg-black/5 relative relative-group">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Source"
                  onClick={handleImageClick}
                  className="max-h-[220px] max-w-full object-contain cursor-crosshair hover:opacity-95 transition-opacity"
                  title="Click to drophue custom color"
                />
              </div>

              {/* Extracted Swatches row */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white/60 p-2.5 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Pipette className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Color Spec Swatches (Tap to copy hex)
                  </span>
                  <button
                    onClick={handleSortByLuminance}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/55 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
                    title="Sort color swatches by relative luminance (darkest to lightest)"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sort by Luminance</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-3.5">
                  {palette.map((color, idx) => {
                    const rgbText = hexToRgb(color.hex);
                    const isCopied = copiedHex === color.hex || (copiedToast && copiedToast.value === rgbText);
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ backgroundColor: color.hex }}
                        className="h-[105px] rounded-2xl relative overflow-hidden flex flex-col justify-between p-2.5 text-left border border-black/10 group shadow-md"
                      >
                        {/* Card top banner (Ordinal + Checkmark) */}
                        <div className="flex justify-between items-center w-full select-none">
                          <span 
                            style={{ color: color.contrastColor }} 
                            className="text-[9px] font-extrabold tracking-wider font-mono opacity-50"
                          >
                            C{idx + 1}
                          </span>
                          {isCopied && (
                            <Check 
                              style={{ color: color.contrastColor }} 
                              className="w-3.5 h-3.5 select-none animate-in zoom-in duration-200" 
                            />
                          )}
                        </div>

                        {/* Labels & Copy Actions */}
                        <div className="space-y-1.5 font-sans">
                          {/* Value Display */}
                          <span
                            style={{ color: color.contrastColor }}
                            className="text-[10px] uppercase font-bold tracking-tighter block leading-none select-all"
                            title={color.hex}
                          >
                            {color.hex}
                          </span>

                          {/* Quick copy buttons */}
                          <div className="flex gap-1 w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyValue(color.hex, "HEX");
                              }}
                              style={{ 
                                borderColor: `${color.contrastColor}25`,
                                color: color.contrastColor,
                                background: `${color.contrastColor}15`
                              }}
                              className="flex-1 py-0.5 rounded-lg text-[8.5px] font-black tracking-wider text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
                              title={`Copy HEX: ${color.hex}`}
                            >
                              HEX
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyValue(rgbText, "RGB");
                              }}
                              style={{ 
                                borderColor: `${color.contrastColor}25`,
                                color: color.contrastColor,
                                background: `${color.contrastColor}15`
                              }}
                              className="flex-1 py-0.5 rounded-lg text-[8.5px] font-black tracking-wider text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
                              title={`Copy RGB: ${rgbText}`}
                            >
                              RGB
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Theme JSON Variables Export Section */}
              <div className="border-t border-slate-200/60 pt-4 mt-1">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-450" />
                    Theme CSS Variables Block
                  </span>
                  <button
                    onClick={copyJsonToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-705 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-medium font-sans">Copied JSON!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span className="font-sans">Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-left font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto relative shadow-inner max-h-48 dark:bg-slate-950">
                  <pre className="select-all whitespace-pre-wrap">{getThemeJson()}</pre>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <Pipette className="w-12 h-12 text-slate-300 mb-2.5 animate-bounce" />
              <h4 className="text-sm font-semibold text-slate-700">Extractor empty</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Drag a colorful graphic image over to draft modular CSS hexadecimal codes and downsampled color grids instantly.
              </p>
            </div>
          )}
        </div>

        {/* Sync trigger row */}
        {palette.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3 pt-3 text-xs">
            <button
              onClick={handleDownload}
              className="md:w-1/4 inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
              id="btn-download-palette"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-400" />
              Download Spec Sheet
            </button>

            <button
              onClick={handleSharePalette}
              className="md:w-1/4 inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
              id="btn-share-palette"
            >
              <Share2 className="w-4 h-4 mr-1.5 text-emerald-500 hover:scale-105 transition-transform" />
              Share Palette
            </button>

            {user ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveToDrive}
                  disabled={isSaving || isSavingAll}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-semibold transition-all cursor-pointer disabled:opacity-50"
                  id="btn-save-palette-drive"
                >
                  <Cloud className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                  {isSaving ? "Saving PNG..." : "Save PNG to Drive"}
                </button>

                <button
                  onClick={handleSaveAllToDrive}
                  disabled={isSaving || isSavingAll}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  id="btn-save-all-palette-drive"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-100 animate-pulse" />
                  {isSavingAll ? "Saving Pack..." : "Save All (JSON + PNG)"}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold transition-all shadow-sm"
                title="Authenticate Drive upload via your Google Workspace account"
                id="btn-prompt-login-palette"
              >
                <Cloud className="w-4 h-4 mr-2 text-slate-600" />
                Sign in to Save Pack to Drive
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating copied Toast notification */}
      {copiedToast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-150 backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-250 select-none pointer-events-none font-sans"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-bold leading-tight">{copiedToast.message}</span>
            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-mono font-medium tracking-tight mt-0.5">{copiedToast.value}</span>
          </div>
        </motion.div>
      )}

    </div>
  );
}
