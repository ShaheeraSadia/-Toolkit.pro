import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { User } from "firebase/auth";
import { PaletteColor } from "../types";
import { uploadFileToDrive, getOrCreateFolder } from "../lib/drive";
import { triggerFileDownload } from "../lib/download";
import { Cloud, Download, Copy, Pipette, UploadCloud, Check, Sparkles, AlertCircle, Code, Sun, ArrowUpDown, Share2, Eye, CheckCircle2, Sliders, FileCode, FileJson, Search, X, History, RotateCcw, Layers, Palette } from "lucide-react";

interface SessionPalette {
  id: string;
  name: string;
  timestamp: number;
  fileName: string;
  imageUrl: string | null;
  palette: PaletteColor[];
}

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

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const simulateColorBlindness = (hex: string, type: string): string => {
  if (!hex || type === "normal") return hex;
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

  let rSim = r;
  let gSim = g;
  let bSim = b;

  if (type === "protanopia") {
    // Protanopia matrix (Red-blind)
    rSim = 0.56667 * r + 0.43333 * g + 0.0 * b;
    gSim = 0.55833 * r + 0.44167 * g + 0.0 * b;
    bSim = 0.0 * r + 0.24167 * g + 0.75833 * b;
  } else if (type === "deuteranopia") {
    // Deuteranopia matrix (Green-blind)
    rSim = 0.625 * r + 0.375 * g + 0.0 * b;
    gSim = 0.7 * r + 0.3 * g + 0.0 * b;
    bSim = 0.0 * r + 0.3 * g + 0.7 * b;
  } else if (type === "tritanopia") {
    // Tritanopia matrix (Blue-blind)
    rSim = 0.95 * r + 0.05 * g + 0.0 * b;
    gSim = 0.0 * r + 0.43333 * g + 0.56667 * b;
    bSim = 0.0 * r + 0.475 * g + 0.525 * b;
  } else if (type === "achromatopsia") {
    // Achromatopsia (Greyscale - standard luminance weights)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    rSim = gray;
    gSim = gray;
    bSim = gray;
  }

  // Clamp values to [0, 255]
  rSim = Math.max(0, Math.min(255, Math.round(rSim)));
  gSim = Math.max(0, Math.min(255, Math.round(gSim)));
  bSim = Math.max(0, Math.min(255, Math.round(bSim)));

  // Convert back to hex
  const toHex = (x: number) => {
    const hexVal = x.toString(16);
    return hexVal.length === 1 ? "0" + hexVal : hexVal;
  };

  return `#${toHex(rSim)}${toHex(gSim)}${toHex(bSim)}`.toUpperCase();
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
  const [validatorMode, setValidatorMode] = useState<"multi" | "pair" | "pairs-grid">("multi");
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontWeight, setFontWeight] = useState<"light" | "normal" | "bold">("normal");
  const [multiFilter, setMultiFilter] = useState<"all" | "aaa" | "aa" | "large">("all");
  const [customBgInput, setCustomBgInput] = useState<string>("#ffffff");
  const [customTxInput, setCustomTxInput] = useState<string>("#0f172a");
  const [paletteSortMode, setPaletteSortMode] = useState<"hue" | "saturation" | "brightness" | "luminance">("hue");
  const [colorBlindnessMode, setColorBlindnessMode] = useState<string>("normal");
  const [paletteSearchQuery, setPaletteSearchQuery] = useState<string>("");
  const [customPaletteName, setCustomPaletteName] = useState<string>("");
  const [isSavingPaletteObject, setIsSavingPaletteObject] = useState<boolean>(false);

  const [suggestedNames, setSuggestedNames] = useState<{ name: string; theme: string; description: string }[]>([]);
  const [isSuggestingNames, setIsSuggestingNames] = useState<boolean>(false);
  const [namingError, setNamingError] = useState<string | null>(null);

  const [selectedGradientBaseHex, setSelectedGradientBaseHex] = useState<string | null>(null);
  const [gradientAngle, setGradientAngle] = useState<string>("135deg");

  useEffect(() => {
    if (palette.length > 0) {
      if (!selectedGradientBaseHex || !palette.some(p => p.hex === selectedGradientBaseHex)) {
        setSelectedGradientBaseHex(palette[0].hex);
      }
    } else {
      setSelectedGradientBaseHex(null);
    }
    // Reset suggested names on palette changes so they don't stay stale
    setSuggestedNames([]);
    setNamingError(null);
    setCustomPaletteName("");
  }, [palette]);

  const [sessionHistory, setSessionHistory] = useState<SessionPalette[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_palette_history");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse history palettes:", e);
        }
      }
    }
    return [];
  });

  const addToHistory = (newPalette: PaletteColor[], name: string, imgDataUrl: string | null) => {
    if (!newPalette || newPalette.length === 0) return;
    setSessionHistory((prev) => {
      const list = [...prev];
      const signature = newPalette.map(p => p.hex).join(",");
      const existingIndex = list.findIndex(item => item.palette.map(p => p.hex).join(",") === signature);
      
      if (existingIndex !== -1) {
        // Move to front/top and update details
        const [existing] = list.splice(existingIndex, 1);
        existing.name = name;
        existing.fileName = name;
        existing.imageUrl = imgDataUrl;
        list.unshift(existing);
      } else {
        const newItem: SessionPalette = {
          id: Math.random().toString(36).substring(2, 9),
          name: name || "Custom Palette",
          fileName: name || "Custom Palette",
          timestamp: Date.now(),
          imageUrl: imgDataUrl,
          palette: newPalette
        };
        list.unshift(newItem);
      }
      const trimmed = list.slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("toolkit_pro_palette_history", JSON.stringify(trimmed));
      }
      return trimmed;
    });
  };

  useEffect(() => {
    if (fileName) {
      const clean = fileName.replace(/\.[^/.]+$/, "");
      setCustomPaletteName(clean || "Custom Palette");
    }
  }, [fileName]);

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
  const extractPalette = (imgSrc: string, customFileName?: string) => {
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

        // Resize canvas for high resolution sample density to preserve fine visual details
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        
        interface LocalQuantizedBucket {
          rSum: number;
          gSum: number;
          bSum: number;
          weight: number;
        }
        
        const bucketMap: Record<string, LocalQuantizedBucket> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip low-opacity pixels
          if (a < 180) continue;

          // Relative luminance calculation
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          // Skip absolute whites and pure blacks
          if (lum > 248 || lum < 10) continue;

          // Compute Saturation and Lightness
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const delta = maxVal - minVal;
          const sum = maxVal + minVal;
          const saturation = maxVal === 0 ? 0 : delta / maxVal;
          const lightness = sum / 510;

          // Base weight boosts saturated colors
          let chromaWeight = 1.0 + saturation * 5.0;

          // Calculate Hue for target boosts (pink blossoms / green foliage)
          let hue = 0;
          if (delta > 0) {
            if (maxVal === r) {
              hue = ((g - b) / delta) % 6;
            } else if (maxVal === g) {
              hue = (b - r) / delta + 2;
            } else {
              hue = (r - g) / delta + 4;
            }
            hue = Math.round(hue * 60);
            if (hue < 0) hue += 360;
          }

          // Force highlight beautiful, highly vibrant pinks, rich greens, and warm gold/oranges
          if (saturation > 0.15 && lightness > 0.15 && lightness < 0.85) {
            if (hue >= 310 && hue <= 358) {
              // High priority boost for pink blossoms (e.g., #FF9EAF, #E27387)
              chromaWeight *= 4.5;
            } else if (hue >= 75 && hue <= 165) {
              // High priority boost for foliage / tree green (e.g., #5E8A4F, #2D5337)
              chromaWeight *= 4.0;
            } else if (hue >= 15 && hue <= 60) {
              // Priority boost for golden hour / sun tones
              chromaWeight *= 2.5;
            }
          }

          // Grid size quantization (16x16x16 voxel buckets) to group very close shades
          const q = 16;
          const rQ = Math.floor(r / q) * q;
          const gQ = Math.floor(g / q) * q;
          const bQ = Math.floor(b / q) * q;
          const key = `${rQ}-${gQ}-${bQ}`;

          if (!bucketMap[key]) {
            bucketMap[key] = { rSum: 0, gSum: 0, bSum: 0, weight: 0 };
          }
          bucketMap[key].rSum += r * chromaWeight;
          bucketMap[key].gSum += g * chromaWeight;
          bucketMap[key].bSum += b * chromaWeight;
          bucketMap[key].weight += chromaWeight;
        }

        // Compute average colors for all quantized buckets
        const computedClusters = Object.keys(bucketMap).map(key => {
          const bucket = bucketMap[key];
          const avgR = Math.min(255, Math.max(0, Math.round(bucket.rSum / bucket.weight)));
          const avgG = Math.min(255, Math.max(0, Math.round(bucket.gSum / bucket.weight)));
          const avgB = Math.min(255, Math.max(0, Math.round(bucket.bSum / bucket.weight)));
          
          const toHex = (c: number) => {
            const h = c.toString(16);
            return h.length === 1 ? "0" + h : h;
          };
          
          return {
            hex: `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`,
            r: avgR,
            g: avgG,
            b: avgB,
            weight: bucket.weight
          };
        });

        // Sort clusters by weight descending
        computedClusters.sort((a, b) => b.weight - a.weight);

        // Filter and collect 6 highly distinct colors
        const selectedHex: string[] = [];
        const diversityThresholds = [38, 28, 18, 10]; // progressively relax distance to guarantee full palette count

        for (const distThresh of diversityThresholds) {
          for (const cl of computedClusters) {
            if (selectedHex.length >= 6) break;

            // Check distance of cl from all selectedHex items
            let isDiverse = true;
            for (const sel of selectedHex) {
              const parseHexLocal = (h: string) => {
                const clean = h.startsWith("#") ? h.slice(1) : h;
                return {
                  r: parseInt(clean.substring(0, 2), 16),
                  g: parseInt(clean.substring(2, 4), 16),
                  b: parseInt(clean.substring(4, 6), 16)
                };
              };
              const sRgb = parseHexLocal(sel);
              const d = Math.sqrt(
                Math.pow(cl.r - sRgb.r, 2) +
                Math.pow(cl.g - sRgb.g, 2) +
                Math.pow(cl.b - sRgb.b, 2)
              );
              if (d < distThresh) {
                isDiverse = false;
                break;
              }
            }

            if (isDiverse) {
              selectedHex.push(cl.hex);
            }
          }
          if (selectedHex.length >= 6) break;
        }

        // Standard Fallback colors if none found
        while (selectedHex.length < 6) {
          const fallbacks = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
          const f = fallbacks.find(c => !selectedHex.includes(c));
          if (f) selectedHex.push(f);
          else selectedHex.push("#6b7280"); // fallback gray
        }

        // Build model structures
        const paletteColors = selectedHex.map((hex, index) => {
          const parseHexLocal = (h: string) => {
            const clean = h.startsWith("#") ? h.slice(1) : h;
            return {
              r: parseInt(clean.substring(0, 2), 16),
              g: parseInt(clean.substring(2, 4), 16),
              b: parseInt(clean.substring(4, 6), 16)
            };
          };
          const rgb = parseHexLocal(hex);
          const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
          const contrastColor = yiq >= 128 ? "#090d16" : "#ffffff";
          return {
            hex,
            name: `Dominant Hue ${index + 1}`,
            contrastColor,
          };
        });

        const nameToUse = customFileName || fileName || "Extracted Palette";
        setPalette(paletteColors);
        setIsProcessing(false);
        addToHistory(paletteColors, nameToUse, imgSrc);
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
        extractPalette(resultSrc, file.name);
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
        window.open("https://toolkit-pro-chi.vercel.app", "_blank", "noopener,noreferrer");
      } catch (e) {
        console.warn("Direct link popup blocked by browser policies", e);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to render palette image.");
    }
  };

  const copyAllCSSVariables = async () => {
    try {
      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "palette";
      let cssContent = `/* Color Palette - ${cleanName} */\n`;
      cssContent += `:root {\n`;
      palette.forEach((color, idx) => {
        const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `swatch-${idx + 1}`;
        cssContent += `  --color-${key}: ${color.hex.toLowerCase()};\n`;
      });
      cssContent += `\n  /* Contrast Colors for accessibility or text matching */\n`;
      palette.forEach((color, idx) => {
        const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `swatch-${idx + 1}`;
        cssContent += `  --color-${key}-contrast: ${color.contrastColor.toLowerCase()};\n`;
      });
      cssContent += `}\n`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cssContent);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = cssContent;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedToast({
        message: "CSS Variables Copied",
        value: `All ${palette.length} extracted colors copied to clipboard!`,
        type: "HEX"
      });
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      try {
        const textarea = document.createElement("textarea");
        let cssContent = `:root {\n`;
        palette.forEach((color, idx) => {
          const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `swatch-${idx + 1}`;
          cssContent += `  --color-${key}: ${color.hex.toLowerCase()};\n`;
        });
        cssContent += `}\n`;
        textarea.value = cssContent;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedToast({
          message: "CSS Variables Copied",
          value: "Copied successfully as fallback!",
          type: "HEX"
        });
      } catch (innerErr) {
        console.error("Fallback copy also failed:", innerErr);
      }
    }
  };

  const handleDownloadCSS = () => {
    try {
      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "palette";
      const slugName = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      let cssContent = `/* Color Palette generated by Digital Creator Suite - ${cleanName} */\n`;
      cssContent += `:root {\n`;
      palette.forEach((color, idx) => {
        const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `swatch-${idx + 1}`;
        cssContent += `  --color-${key}: ${color.hex.toLowerCase()};\n`;
      });
      cssContent += `\n  /* Contrast Colors for accessibility or text matching */\n`;
      palette.forEach((color, idx) => {
        const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `swatch-${idx + 1}`;
        cssContent += `  --color-${key}-contrast: ${color.contrastColor.toLowerCase()};\n`;
      });
      cssContent += `}\n`;

      const blob = new Blob([cssContent], { type: "text/css;charset=utf-8;" });
      const downloadName = `toolkit_pro_palette_${slugName}.css`;
      triggerFileDownload(blob, downloadName);

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Exported Palette CSS",
          detail: `Saved CSS variables as ${downloadName}`,
          icon: "FileCode",
          tab: "palette"
        }
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to export CSS variables.");
    }
  };

  const handleDownloadJSON = () => {
    try {
      const cleanName = fileName.replace(/\.[^/.]+$/, "") || "palette";
      const slugName = cleanName.toLowerCase().replace(/[^a-z0-0]+/g, "-");
      
      const themeObject = {
        themeName: cleanName,
        createdAt: new Date().toISOString(),
        exportedBy: "Digital Creator Suite",
        colors: palette.reduce((acc, color, idx) => {
          const key = color.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") || `swatch_${idx + 1}`;
          acc[key] = {
            hex: color.hex.toLowerCase(),
            contrast: color.contrastColor.toLowerCase()
          };
          return acc;
        }, {} as Record<string, { hex: string; contrast: string }>),
        rawList: palette.map(color => ({
          name: color.name,
          hex: color.hex,
          contrast: color.contrastColor
        }))
      };

      const jsonString = JSON.stringify(themeObject, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const downloadName = `toolkit_pro_palette_${slugName}.json`;
      triggerFileDownload(blob, downloadName);

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Exported Palette JSON",
          detail: `Saved theme JSON as ${downloadName}`,
          icon: "FileJson",
          tab: "palette"
        }
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to export JSON theme.");
    }
  };

  // Generate a random high-quality color theme based on professional harmony formulas
  const handleGenerateRandomPalette = () => {
    // Helper to parse hex to sub-RGB structures (as in the unique extraction loop)
    const parseHexLocal = (hexStr: string) => {
      const r = parseInt(hexStr.substring(1, 3), 16);
      const g = parseInt(hexStr.substring(3, 5), 16);
      const b = parseInt(hexStr.substring(5, 7), 16);
      return { r, g, b };
    };

    // Helper to convert HSL to HEX
    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    // Pick a random palette generation strategy
    const strategies = ["analogous", "triadic", "complementary", "vibrant-mix", "pastel-cream", "retro"];
    const chosenStrategy = strategies[Math.floor(Math.random() * strategies.length)];

    // Seed base hue, saturation and lightness
    const baseHue = Math.floor(Math.random() * 360);
    const hexList: string[] = [];

    // Let's name the colors based on their role in the palette
    const names: string[] = [];

    if (chosenStrategy === "analogous") {
      // 5-6 colors close together in hue
      const s = 65 + Math.floor(Math.random() * 20); // 65-85%
      const l = 45 + Math.floor(Math.random() * 15); // 45-60%
      for (let i = 0; i < 6; i++) {
        const hue = (baseHue + i * 20) % 360;
        hexList.push(hslToHex(hue, s, l));
        names.push(`Analogous Tone ${i + 1}`);
      }
    } else if (chosenStrategy === "triadic") {
      // Base + surrounding analogous, + 2 triadic offsets
      const s = 70 + Math.floor(Math.random() * 15);
      const l = 40 + Math.floor(Math.random() * 20);
      hexList.push(hslToHex(baseHue, s, l), hslToHex((baseHue + 20) % 360, s - 10, l + 10));
      hexList.push(hslToHex((baseHue + 120) % 360, s, l), hslToHex((baseHue + 140) % 360, s - 15, l + 5));
      hexList.push(hslToHex((baseHue + 240) % 360, s, l), hslToHex((baseHue + 260) % 360, s - 10, l - 5));
      
      names.push("Primary Accent", "Subtle Primary", "Triadic Warm", "Subtle Triadic", "Triadic Cool", "Deep Highlight");
    } else if (chosenStrategy === "complementary") {
      // Base + analogous tints/shades, then complementary contrast values
      const s = 65 + Math.floor(Math.random() * 20); 
      const l = 41 + Math.floor(Math.random() * 15); 
      const compHue = (baseHue + 180) % 360;
      
      // Base tones
      hexList.push(hslToHex(baseHue, s, l - 15));
      hexList.push(hslToHex(baseHue, s - 10, l));
      hexList.push(hslToHex(baseHue, s + 10, l + 15));
      
      // Opposite/Complementary accent tones
      hexList.push(hslToHex(compHue, s, l - 10));
      hexList.push(hslToHex(compHue, s + 5, l));
      hexList.push(hslToHex(compHue, s - 15, l + 15));

      names.push("Dominant Dark", "Dominant Mid", "Dominant Light", "Contrast Complement", "Accent Complement", "Light Complement");
    } else if (chosenStrategy === "vibrant-mix") {
      // Balanced saturated mix across spectrum with dark/light anchor and pops
      hexList.push(hslToHex(baseHue, 85, 30)); // Deep vibrant anchor
      hexList.push(hslToHex((baseHue + 60) % 360, 80, 50)); // Pop 1
      hexList.push(hslToHex((baseHue + 150) % 360, 75, 45)); // Pop 2
      hexList.push(hslToHex((baseHue + 210) % 360, 90, 55)); // Pop 3
      hexList.push(hslToHex((baseHue + 280) % 360, 85, 60)); // Pop 4
      hexList.push(hslToHex((baseHue + 330) % 360, 70, 70)); // Bright pastel shade

      names.push("Deep Anchor", "Vibrant Amber", "Teal Shade", "Ocean Pop", "Royal Accent", "Pastel Punch");
    } else if (chosenStrategy === "pastel-cream") {
      // Highly aesthetic pastel tones
      const s = 35 + Math.floor(Math.random() * 20); // Soft saturation (35-55%)
      const l = 75 + Math.floor(Math.random() * 15); // High lightness (75-90%)
      for (let i = 0; i < 6; i++) {
        const hue = (baseHue + i * 60) % 360;
        hexList.push(hslToHex(hue, s, l));
        names.push(`Creamy Pastel ${i + 1}`);
      }
    } else {
      // Retro / Earthy palette elements: balanced desaturated tones
      const s = 40 + Math.floor(Math.random() * 20); // 40-60%
      hexList.push(hslToHex(baseHue, s, 35)); // Deep earth
      hexList.push(hslToHex((baseHue + 40) % 360, s - 10, 45)); // Warm clay
      hexList.push(hslToHex((baseHue + 80) % 360, s + 10, 55)); // Sand / Olive
      hexList.push(hslToHex((baseHue + 180) % 360, s - 5, 25)); // Charcoal forest
      hexList.push(hslToHex((baseHue + 220) % 360, s + 5, 50)); // Retro denim
      hexList.push(hslToHex((baseHue + 310) % 360, s + 15, 65)); // Dusty rose

      names.push("Earthen Base", "Terracotta Mid", "Serrated Olive", "Retro Obsidian", "Denim Accent", "Dusty Rose Glow");
    }

    // Build the structural models with exact same contrast calculation logic as used in imagery
    const randomPalette = hexList.slice(0, 6).map((hex, index) => {
      const rgb = parseHexLocal(hex);
      const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      const contrastColor = yiq >= 128 ? "#090d16" : "#ffffff";
      return {
        hex,
        name: names[index] || `Swatch Hue ${index + 1}`,
        contrastColor,
      };
    });

    // Save state & persist
    setPalette(randomPalette);
    
    // Set file name parameter to indicate it's generated
    const formattedStrategy = chosenStrategy.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase());
    const randomName = `Aesthetic ${formattedStrategy} Palette`;
    setFileName(randomName);
    
    // Clear image preview so user sees they've generated a fresh palette
    setImageUrl(null);

    addToHistory(randomPalette, randomName, null);

    // Register Activity Logs beautifully
    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "palette",
        title: "Generated Random Palette",
        detail: `Created a beautiful '${formattedStrategy}' designer color palette on demand`,
        icon: "Sparkles",
        tab: "palette"
      }
    }));
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

  const hexToHslLocal = (hexStr: string) => {
    const clean = hexStr.startsWith("#") ? hexStr.slice(1) : hexStr;
    let rHex = clean.substring(0, 2);
    let gHex = clean.substring(2, 4);
    let bHex = clean.substring(4, 6);
    if (clean.length === 3) {
      rHex = clean.substring(0, 1) + clean.substring(0, 1);
      gHex = clean.substring(1, 2) + clean.substring(1, 2);
      bHex = clean.substring(2, 3) + clean.substring(2, 3);
    }
    const r = parseInt(rHex || "0", 16) / 255;
    const g = parseInt(gHex || "0", 16) / 255;
    const b = parseInt(bHex || "0", 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const getGradientSuggestions = (baseHex: string) => {
    const { h, s, l } = hexToHslLocal(baseHex);

    return [
      {
        name: "Classical Complement",
        type: "Direct Opposites (180°)",
        desc: "High contrast pairing of exact opposites on the wheel.",
        from: baseHex,
        to: hslToHex((h + 180) % 360, s, l),
      },
      {
        name: "Warm Split Glow",
        type: "Split Complement (150°)",
        desc: "A rich, organic shift adding warmth and visual interest.",
        from: baseHex,
        to: hslToHex((h + 150) % 360, Math.min(s + 5, 100), Math.min(l + 5, 90)),
      },
      {
        name: "Cool Split Depth",
        type: "Split Complement (210°)",
        desc: "A tranquil oceanic gradient with cooler secondary undertones.",
        from: baseHex,
        to: hslToHex((h + 210) % 360, Math.max(s - 5, 20), Math.max(l - 5, 25)),
      },
      {
        name: "Triadic Harmony",
        type: "Triad Shift (120°)",
        desc: "Energetic and well-balanced three-way color vibration.",
        from: baseHex,
        to: hslToHex((h + 120) % 360, s, Math.min(l + 8, 85)),
      },
      {
        name: "Muted Mystic Night",
        type: "Triad Shift (240°)",
        desc: "Dusk-inspired atmospheric blend of saturated vs dark tones.",
        from: baseHex,
        to: hslToHex((h + 240) % 360, Math.max(s - 15, 15), Math.max(l - 12, 18)),
      },
      {
        name: "Analogous Breeze",
        type: "Analogous (30°)",
        desc: "An incredibly smooth, low-contrast neighbor transition.",
        from: baseHex,
        to: hslToHex((h + 30) % 360, s, l),
      },
    ];
  };

  const handleSuggestPaletteNames = async () => {
    if (palette.length === 0) return;
    setIsSuggestingNames(true);
    setNamingError(null);

    try {
      const response = await fetch("/api/palette/suggest-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ colors: palette }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status} Error`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.names)) {
        setSuggestedNames(data.names);
        // Pre-fill with the first suggestion if custom name isn't already set
        if (!customPaletteName) {
          setCustomPaletteName(data.names[0].name);
        }
      } else {
        throw new Error("Invalid response format received from Gemini.");
      }
    } catch (err: any) {
      console.error("Failed to suggest names:", err);
      setNamingError(err.message || "An unexpected error occurred while naming the palette.");
    } finally {
      setIsSuggestingNames(false);
    }
  };

  const handleSortPalette = (mode: "hue" | "saturation" | "brightness" | "luminance") => {
    setPaletteSortMode(mode);
    if (palette.length === 0) return;

    const sorted = [...palette].sort((a, b) => {
      if (mode === "luminance") {
        const lumA = getRelativeLuminance(a.hex);
        const lumB = getRelativeLuminance(b.hex);
        return lumA - lumB; // Darkest to lightest
      }
      
      const hslA = hexToHslLocal(a.hex);
      const hslB = hexToHslLocal(b.hex);

      if (mode === "hue") {
        return hslA.h - hslB.h; // Hue spectrum order
      } else if (mode === "saturation") {
        return hslB.s - hslA.s; // High saturation to desaturated
      } else {
        return hslB.l - hslA.l; // Brightest to darkest
      }
    });

    setPalette(sorted);

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "palette",
        title: `Sorted Palette`,
        detail: `Organized color swatches by ${mode.toUpperCase()} dynamically`,
        icon: "Sliders",
        tab: "palette"
      }
    }));
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

  const handleSavePaletteObjectToDrive = async () => {
    if (!user || !accessToken) {
      onLogin();
      return;
    }

    if (palette.length === 0) {
      alert("No swatches extracted to save yet!");
      return;
    }

    const trimmedName = customPaletteName.trim();
    if (!trimmedName) {
      alert("Please enter a valid custom name for your palette!");
      return;
    }

    setIsSavingPaletteObject(true);
    setSaveStatus(null);

    try {
      // 1. Resolve folder path (ToolkitPro/Palettes)
      const appFolderName = "ToolkitPro";
      const appFolderId = await getOrCreateFolder(accessToken, appFolderName);
      
      const palettesFolderName = "Palettes";
      const palettesFolderId = await getOrCreateFolder(accessToken, palettesFolderName, appFolderId);

      // 2. Build the comprehensive Palette Object
      const cleanJsonFilename = trimmedName.replace(/[\s/\\?%*|"<:;]+/g, "_");
      
      const paletteDetailsObj = {
        paletteName: trimmedName,
        createdAt: new Date().toISOString(),
        colorsCount: palette.length,
        sortMode: paletteSortMode,
        swatches: palette.map((color, index) => {
          const contrastWhite = getContrastRatio(color.hex, "#ffffff");
          const contrastBlack = getContrastRatio(color.hex, "#000000");
          return {
            index: index + 1,
            name: color.name,
            hex: color.hex,
            contrastWhiteText: parseFloat(contrastWhite.toFixed(2)),
            contrastBlackText: parseFloat(contrastBlack.toFixed(2)),
            wcagRatingWhiteText: contrastWhite >= 7.0 ? "AAA" : contrastWhite >= 4.5 ? "AA" : contrastWhite >= 3.0 ? "A" : "Fail",
            wcagRatingBlackText: contrastBlack >= 7.0 ? "AAA" : contrastBlack >= 4.5 ? "AA" : contrastBlack >= 3.0 ? "A" : "Fail",
            contrastColorPreference: color.contrastColor
          };
        }),
        cssThemeVariables: JSON.parse(getThemeJson())
      };

      const jsonStr = JSON.stringify(paletteDetailsObj, null, 2);
      const base64Json = btoa(unescape(encodeURIComponent(jsonStr)));
      const jsonDataUrl = `data:application/json;base64,${base64Json}`;
      const finalFilename = `${cleanJsonFilename}.palette.json`;

      // 3. Upload file to targets
      await uploadFileToDrive(accessToken, finalFilename, "application/json", jsonDataUrl, palettesFolderId);

      setSaveStatus({
        success: true,
        msg: `Successfully saved palette object as "${finalFilename}" under "ToolkitPro/Palettes" in Google Drive!`,
      });
      onRefreshDrive();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: `Saved Custom Palette: ${finalFilename}`,
          detail: `Saved structured palette object "${trimmedName}" directly to Google Drive`,
          icon: "Cloud",
          tab: "palette"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        success: false,
        msg: err.message || "Failed to upload palette object to Google Drive.",
      });
    } finally {
      setIsSavingPaletteObject(false);
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

        {/* Dynamic theme generation or manual upload actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-3xs cursor-pointer"
            id="btn-trigger-manual-picker"
            title="Browse your system files to upload an image from local storage"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Upload File
          </button>

          <button
            type="button"
            onClick={handleGenerateRandomPalette}
            className="inline-flex items-center justify-center px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-all shadow-3xs cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            id="btn-generate-random-palette"
            title="Create a fresh, aesthetically pleasing random color theme using design harmony formulas"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-500 animate-pulse" />
            Random Theme
          </button>
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
                Multi-Swatch
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
                Single Pair
              </button>
              <button
                onClick={() => setValidatorMode("pairs-grid")}
                className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer border-0 ${
                  validatorMode === "pairs-grid" 
                    ? "bg-white text-slate-900 shadow-xs font-black" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
                id="tab-validator-grid"
              >
                Pairs Matrix
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
                  onClick={async () => {
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

                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(reportStr);
                      } else {
                        const textarea = document.createElement("textarea");
                        textarea.value = reportStr;
                        textarea.style.position = "fixed";
                        textarea.style.opacity = "0";
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                      }
                      setCopiedToast({
                        message: "Contrast Report Copied",
                        value: "Formatted WCAG report successfully saved!",
                        type: "HEX"
                      });
                    } catch (err) {
                      console.error("Clipboard copy failed:", err);
                      // Try fallback textarea inside catch just in case
                      try {
                        const textarea = document.createElement("textarea");
                        textarea.value = reportStr;
                        textarea.style.position = "fixed";
                        textarea.style.opacity = "0";
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                        setCopiedToast({
                          message: "Contrast Report Copied",
                          value: "Formatted WCAG report successfully saved!",
                          type: "HEX"
                        });
                      } catch (innerErr) {
                        console.error("Fallback clipboard copy also failed:", innerErr);
                      }
                    }
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

            {/* RENDER VIEW 3: SWATCH PAIRS MATRIX & ACCESSIBILITY SCOREBOARD */}
            {validatorMode === "pairs-grid" && (
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                    Swatch Color Pairings Access Contrast Matrix
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Interactive score table. Rows represent <strong className="text-slate-600 dark:text-slate-350">Background (BG)</strong> and columns are <strong className="text-slate-600 dark:text-slate-350 font-bold">Text (TX)</strong>. Tap any passing coordinate to examine that pair inside the live Single Pair tab.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs">
                  <table className="w-full text-center border-collapse min-w-[340px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800">
                        <th className="p-2 text-[9px] font-black uppercase text-slate-400 select-none text-left font-mono">
                          BG \ TX
                        </th>
                        {palette.map((color, colIdx) => (
                          <th key={colIdx} className="p-2 text-[9px] font-extrabold font-mono text-slate-550 dark:text-slate-400">
                            <div className="flex flex-col items-center gap-0.5">
                              <span 
                                className="w-4 h-4 rounded-full border border-black/15 shadow-3xs" 
                                style={{ backgroundColor: color.hex }} 
                                title={color.hex}
                              />
                              <span>C{colIdx + 1}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {palette.map((rowColor, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-slate-150/60 dark:border-slate-800/60 hover:bg-slate-50/45 dark:hover:bg-slate-900/40">
                          {/* Row Header (Background) */}
                          <td className="p-2 text-[9px] font-extrabold font-mono text-slate-550 dark:text-slate-400 text-left bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-1.5 font-sans">
                              <span 
                                className="w-4 h-4 rounded-full border border-black/15 shadow-3xs shrink-0" 
                                style={{ backgroundColor: rowColor.hex }} 
                                title={rowColor.hex}
                              />
                              <span>C{rowIdx + 1}</span>
                            </div>
                          </td>

                          {/* Matrix Cells */}
                          {palette.map((colColor, colIdx) => {
                            if (rowIdx === colIdx) {
                              return (
                                <td key={colIdx} className="p-2 text-[9px] text-slate-350 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-950/40 select-none font-mono">
                                  —
                                </td>
                              );
                            }

                            const ratio = getContrastRatio(rowColor.hex, colColor.hex);
                            let bgClass = "bg-rose-50/45 hover:bg-rose-100/60 text-rose-700 dark:bg-rose-950/15";
                            let badgeLabel = "FAIL";
                            let badgeClass = "bg-rose-50 dark:bg-rose-950/30 border border-rose-150 dark:border-rose-900/60 text-rose-600 dark:text-rose-450";
                            if (ratio >= 7.0) {
                              bgClass = "bg-emerald-50/45 hover:bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950/15";
                              badgeLabel = "AAA";
                              badgeClass = "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-450 font-extrabold";
                            } else if (ratio >= 4.5) {
                              bgClass = "bg-indigo-50/45 hover:bg-indigo-100/60 text-indigo-800 dark:bg-indigo-950/15";
                              badgeLabel = "AA";
                              badgeClass = "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-405 font-extrabold";
                            } else if (ratio >= 3.0) {
                              bgClass = "bg-amber-50/45 hover:bg-amber-100/60 text-amber-800 dark:bg-amber-950/15";
                              badgeLabel = "AA-LG";
                              badgeClass = "bg-amber-50 dark:bg-amber-950/30 border border-amber-150 dark:border-amber-900/60 text-amber-650 dark:text-amber-450 font-extrabold";
                            }

                            return (
                              <td 
                                key={colIdx} 
                                onClick={() => {
                                  setWcagBgColor(rowColor.hex);
                                  setCustomBgInput(rowColor.hex);
                                  setWcagTextColor(colColor.hex);
                                  setCustomTxInput(colColor.hex);
                                  setValidatorMode("pair");
                                }}
                                className={`p-2 transition-colors cursor-pointer select-none text-center ${bgClass}`}
                                title={`Backdrop ${rowColor.hex} with text color ${colColor.hex}. Click to examine inside Single Pair tool.`}
                              >
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-mono text-[9px] font-black">{ratio.toFixed(1)}:1</span>
                                  <span className={`text-[7px] px-1 rounded uppercase tracking-wider scale-90 ${badgeClass}`}>
                                    {badgeLabel}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ranked Combination List */}
                <div className="space-y-2 pt-1 text-left">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                    All Extracted Pairs (Ranked by Color Contrast Score)
                  </span>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {(() => {
                      const list: { bg: PaletteColor; tx: PaletteColor; ratio: number }[] = [];
                      palette.forEach((pBg) => {
                        palette.forEach((pTx) => {
                          if (pBg.hex !== pTx.hex) {
                            list.push({ bg: pBg, tx: pTx, ratio: getContrastRatio(pBg.hex, pTx.hex) });
                          }
                        });
                      });

                      list.sort((a, b) => b.ratio - a.ratio);

                      if (list.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-400 text-[10px] dark:text-slate-500">
                            Extract or choose a color palette to construct combinations.
                          </div>
                        );
                      }

                      return list.map((item, idx) => {
                        const passAAA = item.ratio >= 7.0;
                        const passAA = item.ratio >= 4.5;
                        const passLg = item.ratio >= 3.0;

                        let scoreBadge = "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-955/10 dark:border-rose-900/40 dark:text-rose-400";
                        let levelText = "Fail (Low Contrast)";
                        if (passAAA) {
                          scoreBadge = "text-emerald-705 bg-emerald-50 border-emerald-100 dark:bg-emerald-955/10 dark:border-emerald-900/40 dark:text-emerald-400";
                          levelText = "AAA Compliant (Excellent)";
                        } else if (passAA) {
                          scoreBadge = "text-indigo-705 bg-indigo-50 border-indigo-100 dark:bg-indigo-955/10 dark:border-indigo-900/40 dark:text-indigo-400";
                          levelText = "AA Compliant (Good)";
                        } else if (passLg) {
                          scoreBadge = "text-amber-705 bg-amber-50 border-amber-100 dark:bg-amber-955/10 dark:border-amber-900/40 dark:text-amber-400";
                          levelText = "AA Large compliant (Headers)";
                        }

                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              setWcagBgColor(item.bg.hex);
                              setCustomBgInput(item.bg.hex);
                              setWcagTextColor(item.tx.hex);
                              setCustomTxInput(item.tx.hex);
                              setValidatorMode("pair");
                            }}
                            className="flex items-center justify-between p-2 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/55 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900/60 hover:border-slate-200 transition-all cursor-pointer text-left gap-2"
                            title="Click to load into the single pair editor"
                          >
                            <div className="flex items-center gap-2">
                              {/* Preview swatches pair visual */}
                              <div className="flex -space-x-1 shrink-0 select-none">
                                <span 
                                  className="w-5 h-5 rounded-full border border-white dark:border-slate-950 shadow-3xs z-1" 
                                  style={{ backgroundColor: item.bg.hex }}
                                />
                                <span 
                                  className="w-5 h-5 rounded-full border border-white dark:border-slate-950 shadow-3xs text-center flex items-center justify-center font-bold text-[8px]" 
                                  style={{ backgroundColor: item.tx.hex, color: getRelativeLuminance(item.tx.hex) > 0.5 ? "#000000" : "#ffffff" }}
                                >
                                  T
                                </span>
                              </div>
                              <div className="flex flex-col select-none">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[9px] font-semibold text-slate-700 dark:text-slate-300">{item.bg.hex.toUpperCase()}</span>
                                  <span className="text-[10px] text-slate-300 dark:text-slate-650">→</span>
                                  <span className="font-mono text-[9px] font-semibold text-slate-700 dark:text-slate-300">{item.tx.hex.toUpperCase()}</span>
                                </div>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium leading-none">BG Backdrop & Text Pair</span>
                              </div>
                            </div>

                            {/* Demo Text swatch */}
                            <div 
                              className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 tracking-tight select-none border border-black/5 dark:border-white/5 hidden xs:block font-sans"
                              style={{ backgroundColor: item.bg.hex, color: item.tx.hex }}
                            >
                              Aa Preview
                            </div>

                            <div className="flex items-center gap-2 text-right shrink-0">
                              <div className="flex flex-col select-none text-right">
                                <span className="font-mono text-[10px] font-bold text-slate-705 dark:text-slate-300 leading-tight">{item.ratio.toFixed(2)}:1</span>
                                <span className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{levelText}</span>
                              </div>
                              <div className={`px-1 rounded border text-[8px] font-black leading-none py-1 min-w-[32px] text-center ${scoreBadge}`}>
                                {passAAA ? "AAA" : passAA ? "AA" : passLg ? "AA-LG" : "FAIL"}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Local Session History */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-500" /> Recent Palettes
            </h4>
            {sessionHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your local palette history?")) {
                    setSessionHistory([]);
                    localStorage.removeItem("toolkit_pro_palette_history");
                  }
                }}
                className="text-[9px] font-semibold text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer border-0"
              >
                Clear All
              </button>
            )}
          </div>

          {sessionHistory.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center py-4">
              No recent palettes in this session. Extract some from an image to see them here!
            </p>
          ) : (
            <div className="space-y-2.5">
              {sessionHistory.map((item) => {
                const isSelected = fileName === item.fileName && palette.map(p => p.hex).join(",") === item.palette.map(p => p.hex).join(",");
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-100 focus-within:ring-1 focus-within:ring-emerald-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Image Preview or Sparkles Icon */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.fileName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                      
                      {/* Name and color swatches */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-[11px] font-bold text-slate-800 truncate" title={item.fileName}>
                          {item.fileName}
                        </div>
                        {/* 6 swatches row */}
                        <div className="flex gap-1">
                          {item.palette.map((color, cIdx) => (
                            <span
                              key={cIdx}
                              className="w-3.5 h-3.5 rounded-md border border-white dark:border-slate-900 shadow-4xs"
                              style={{ backgroundColor: color.hex }}
                              title={color.hex.toUpperCase()}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setPalette(item.palette);
                          setFileName(item.fileName);
                          setImageUrl(item.imageUrl);
                          window.dispatchEvent(
                            new CustomEvent("toolkit-add-activity", {
                              detail: {
                                type: "palette",
                                title: "Restored Historical Palette",
                                detail: `Loaded ${item.fileName} successfully back to workbench`,
                                icon: "RotateCcw",
                                tab: "palette"
                              }
                            })
                          );
                        }}
                        className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/30 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Load this palette and original image back into workspace"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-apply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item.palette, null, 2));
                          const dlAnchorElem = document.createElement("a");
                          const slugName = item.fileName.toLowerCase().replace(/[^a-z0-9]/g, "_") || "palette";
                          dlAnchorElem.setAttribute("href", dataStr);
                          dlAnchorElem.setAttribute("download", `toolkit_pro_palette_${slugName}.json`);
                          dlAnchorElem.click();

                          window.dispatchEvent(
                            new CustomEvent("toolkit-add-activity", {
                              detail: {
                                type: "file",
                                title: "Downloaded Historical JSON",
                                detail: `Saved toolkit_pro_palette_${slugName}.json`,
                                icon: "FileJson",
                                tab: "palette"
                              }
                            })
                          );
                        }}
                        className="p-1.5 rounded-lg text-slate-500 bg-white border border-slate-200 hover:text-indigo-650 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Direct JSON download of these colors"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
          ) : (imageUrl || palette.length > 0) ? (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Loaded Image Display for eye dropping */}
              {imageUrl && (
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
              )}

              {/* Extracted Swatches row */}
              <div>
                {(() => {
                  const filteredPalette = palette.filter((color) => {
                    if (!paletteSearchQuery) return true;
                    const query = paletteSearchQuery.toLowerCase().trim();
                    return (
                      color.hex.toLowerCase().includes(query) ||
                      color.name.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 bg-white/60 p-2.5 rounded-xl border border-slate-200/50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                            <Pipette className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Color Spec Swatches (Tap to copy hex)
                          </span>
                          {customPaletteName && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-[10px] font-black text-emerald-700 animate-in fade-in duration-200">
                              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                              {customPaletteName}
                            </span>
                          )}
                          <div className="relative flex-1 max-w-sm">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search hex, name..."
                              value={paletteSearchQuery}
                              onChange={(e) => setPaletteSearchQuery(e.target.value)}
                              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 pl-8 pr-7 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none transition-all shadow-3xs"
                              id="input-palette-search"
                            />
                            {paletteSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setPaletteSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                title="Clear search"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono whitespace-nowrap">Sort Palette:</span>
                            <select
                              value={paletteSortMode}
                              onChange={(e) => handleSortPalette(e.target.value as any)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/55 rounded-lg shadow-2xs transition-all cursor-pointer outline-none select-none appearance-none"
                              title="Sort color swatches dynamically by Hue, Saturation, Brightness, or Luminance"
                              id="select-palette-sort"
                            >
                              <option value="hue">🌈 Hue (Spectrum)</option>
                              <option value="saturation">🔥 Saturation (Intensity)</option>
                              <option value="brightness">☀️ Brightness (Lightness)</option>
                              <option value="luminance">👁️ Luminance (Contrast)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono whitespace-nowrap">Vision:</span>
                            <select
                              value={colorBlindnessMode}
                              onChange={(e) => setColorBlindnessMode(e.target.value)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg shadow-2xs transition-all cursor-pointer outline-none select-none appearance-none"
                              title="Simulate common types of color blindness / color vision deficiencies (CVD)"
                              id="select-color-blindness"
                            >
                              <option value="normal">👁️ Normal Vision</option>
                              <option value="protanopia">🔴 Protanopia (Red-Blind)</option>
                              <option value="deuteranopia">🟢 Deuteranopia (Green-Blind)</option>
                              <option value="tritanopia">🔵 Tritanopia (Blue-Blind)</option>
                              <option value="achromatopsia">⚫ Achromatopsia (Monochrome)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={copyAllCSSVariables}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/75 border border-emerald-200/55 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
                            title="Copy all extracted colors as CSS :root variables in one click"
                            id="btn-copy-all-css"
                          >
                            <Copy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Copy All CSS</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-3.5 palette-swatches-grid extracted-palette-view">
                        {filteredPalette.length > 0 ? (
                          filteredPalette.map((color, idx) => {
                            const simulatedColor = simulateColorBlindness(color.hex, colorBlindnessMode);
                            
                            // Determine dynamic contrast text color based on simulatedColor
                            const cleanHex = simulatedColor.startsWith("#") ? simulatedColor.slice(1) : simulatedColor;
                            let rHexSim = cleanHex.substring(0, 2);
                            let gHexSim = cleanHex.substring(2, 4);
                            let bHexSim = cleanHex.substring(4, 6);
                            if (cleanHex.length === 3) {
                              rHexSim = cleanHex.substring(0, 1) + cleanHex.substring(0, 1);
                              gHexSim = cleanHex.substring(1, 2) + cleanHex.substring(1, 2);
                              bHexSim = cleanHex.substring(2, 3) + cleanHex.substring(2, 3);
                            }
                            const rSimVal = parseInt(rHexSim || "0", 16);
                            const gSimVal = parseInt(gHexSim || "0", 16);
                            const bSimVal = parseInt(bHexSim || "0", 16);
                            const yiqSim = (rSimVal * 299 + gSimVal * 587 + bSimVal * 114) / 1000;
                            const dynamicContrastColor = yiqSim >= 128 ? "#090d16" : "#ffffff";

                            const rgbText = hexToRgb(color.hex);
                            const simRgbText = hexToRgb(simulatedColor);
                            const isCopied = copiedHex === color.hex || (copiedToast && (copiedToast.value === rgbText || copiedToast.value === simulatedColor));
                            const contrastWhite = getContrastRatio(simulatedColor, "#ffffff");
                            const contrastBlack = getContrastRatio(simulatedColor, "#000000");

                            return (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.04, y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                style={{ backgroundColor: simulatedColor }}
                                className="min-h-[185px] rounded-2xl relative overflow-hidden flex flex-col justify-between p-2.5 text-left border border-black/10 group shadow-md"
                              >
                                {/* Card top banner (Ordinal + Checkmark) */}
                                <div className="flex justify-between items-center w-full select-none">
                                  <span 
                                    style={{ color: dynamicContrastColor }} 
                                    className="text-[9px] font-extrabold tracking-wider font-mono opacity-60"
                                  >
                                    C{idx + 1}
                                  </span>
                                  {isCopied && (
                                    <Check 
                                      style={{ color: dynamicContrastColor }} 
                                      className="w-3.5 h-3.5 select-none animate-in zoom-in duration-200" 
                                    />
                                  )}
                                </div>

                                {/* Accessibility Contrast Ratios against Black & White (Simulated background) */}
                                <div className="space-y-1 my-1.5 select-none font-mono">
                                  {/* Contrast with White Text */}
                                  <div 
                                    style={{ 
                                      color: "#ffffff", 
                                      backgroundColor: "rgba(15, 23, 42, 0.75)",
                                      border: "1px solid rgba(255, 255, 255, 0.12)"
                                    }} 
                                    className="px-1.5 py-0.5 rounded-lg flex items-center justify-between text-[8.5px] font-bold"
                                    title={`Simulated contrast against White text: ${contrastWhite.toFixed(1)}:1`}
                                  >
                                    <span className="flex items-center gap-1 leading-none">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                                      <span>W {contrastWhite.toFixed(1)}:1</span>
                                    </span>
                                    <span className={contrastWhite >= 4.5 ? "text-emerald-400 font-extrabold leading-none" : contrastWhite >= 3.0 ? "text-amber-400 leading-none" : "text-rose-400 leading-none"}>
                                      {contrastWhite >= 7.0 ? "AAA" : contrastWhite >= 4.5 ? "AA" : contrastWhite >= 3.0 ? "A" : "Fail"}
                                    </span>
                                  </div>

                                  {/* Contrast with Black Text */}
                                  <div 
                                    style={{ 
                                      color: "#0f172a", 
                                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                                      border: "1px solid rgba(15, 23, 42, 0.08)"
                                    }} 
                                    className="px-1.5 py-0.5 rounded-lg flex items-center justify-between text-[8.5px] font-bold"
                                    title={`Simulated contrast against Black text: ${contrastBlack.toFixed(1)}:1`}
                                  >
                                    <span className="flex items-center gap-1 leading-none">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 block" />
                                      <span>B {contrastBlack.toFixed(1)}:1</span>
                                    </span>
                                    <span className={contrastBlack >= 4.5 ? "text-emerald-700 font-extrabold leading-none" : contrastBlack >= 3.0 ? "text-amber-700 leading-none" : "text-rose-600 leading-none"}>
                                      {contrastBlack >= 7.0 ? "AAA" : contrastBlack >= 4.5 ? "AA" : contrastBlack >= 3.0 ? "A" : "Fail"}
                                    </span>
                                  </div>
                                </div>

                                {/* Labels & Copy Actions */}
                                <div className="space-y-1.5 font-sans">
                                  {/* Value Display */}
                                  <div className="space-y-0.5 leading-none">
                                    <span
                                      style={{ color: dynamicContrastColor }}
                                      className="text-[10px] uppercase font-black tracking-tight block select-all font-mono"
                                      title={`Original Color Hex: ${color.hex}`}
                                    >
                                      {color.hex}
                                    </span>
                                    {colorBlindnessMode !== "normal" && (
                                      <div className="flex items-center justify-between mt-1 border-t pt-1" style={{ borderColor: `${dynamicContrastColor}20` }}>
                                        <span
                                          style={{ color: dynamicContrastColor, opacity: 0.85 }}
                                          className="text-[9px] uppercase font-bold tracking-tight block select-all font-mono"
                                          title={`Simulated Color Hex: ${simulatedColor}`}
                                        >
                                          {simulatedColor}
                                        </span>
                                        <span 
                                          style={{ color: dynamicContrastColor, opacity: 0.6 }}
                                          className="text-[7.5px] font-extrabold uppercase tracking-wide"
                                        >
                                          Simulated
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick copy buttons */}
                                  <div className="flex gap-1 w-full">
                                    {colorBlindnessMode === "normal" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyValue(color.hex, "HEX");
                                          }}
                                          style={{ 
                                            borderColor: `${dynamicContrastColor}25`,
                                            color: dynamicContrastColor,
                                            background: `${dynamicContrastColor}15`
                                          }}
                                          className="flex-1 py-0.5 rounded-lg text-[8px] font-black tracking-wider text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
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
                                            borderColor: `${dynamicContrastColor}25`,
                                            color: dynamicContrastColor,
                                            background: `${dynamicContrastColor}15`
                                          }}
                                          className="flex-1 py-0.5 rounded-lg text-[8px] font-black tracking-wider text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
                                          title={`Copy RGB: ${rgbText}`}
                                        >
                                          RGB
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyValue(color.hex, "HEX");
                                          }}
                                          style={{ 
                                            borderColor: `${dynamicContrastColor}25`,
                                            color: dynamicContrastColor,
                                            background: `${dynamicContrastColor}15`
                                          }}
                                          className="flex-1 py-0.5 rounded-lg text-[7.5px] font-black tracking-tighter text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
                                          title={`Copy Original HEX: ${color.hex}`}
                                        >
                                          ORIGINAL
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyValue(simulatedColor, "HEX");
                                          }}
                                          style={{ 
                                            borderColor: `${dynamicContrastColor}25`,
                                            color: dynamicContrastColor,
                                            background: `${dynamicContrastColor}15`
                                          }}
                                          className="flex-1 py-0.5 rounded-lg text-[7.5px] font-black tracking-tighter text-center border cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-0.5 select-none"
                                          title={`Copy Simulated HEX: ${simulatedColor}`}
                                        >
                                          SIMULATED
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 select-none">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                            <p className="text-xs font-bold text-slate-600">No matching swatches found</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Try searching for a different name or hex value.</p>
                            <button
                              type="button"
                              onClick={() => setPaletteSearchQuery("")}
                              className="mt-3 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-705 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Clear Search Filter
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Complementary Color Gradients Section */}
              <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 text-left">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      Complementary Gradients
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal font-sans">
                      Tap any swatch below to select a base color and view custom dual-tone harmonic gradients.
                    </p>
                  </div>
                  {/* Angle Controls */}
                  <div className="flex items-center gap-1.5 select-none self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">Angle:</span>
                    <div className="flex bg-slate-50 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                      {(["45deg", "90deg", "135deg", "180deg"] as const).map((angle) => (
                        <button
                          type="button"
                          key={angle}
                          onClick={() => setGradientAngle(angle)}
                          className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer border-0 ${
                            gradientAngle === angle
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-black"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                          }`}
                        >
                          {angle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Base Color Select Swatches list */}
                <div className="flex flex-wrap items-center gap-2 mb-5 bg-white/40 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono whitespace-nowrap">Base Swatch:</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    {palette.map((color, idx) => {
                      const isSelected = selectedGradientBaseHex === color.hex;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedGradientBaseHex(color.hex)}
                          style={{ backgroundColor: color.hex }}
                          className={`w-7 h-7 rounded-full border relative cursor-pointer transition-all hover:scale-110 active:scale-95 group shadow-2xs ${
                            isSelected 
                              ? "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-white" 
                              : "border-black/10 hover:border-black/30"
                          }`}
                          title={`Select ${color.name} (${color.hex})`}
                        >
                          {isSelected && (
                            <Check 
                              style={{ color: color.contrastColor }} 
                              className="w-3.5 h-3.5 absolute inset-0 m-auto animate-in zoom-in-50 duration-150" 
                            />
                          )}
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                            {color.name} ({color.hex})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedGradientBaseHex && (
                    <div className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      Selected: 
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 font-bold border border-slate-200/50 dark:border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: selectedGradientBaseHex }} />
                        {selectedGradientBaseHex.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Gradients Cards Grid */}
                {selectedGradientBaseHex && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {getGradientSuggestions(selectedGradientBaseHex).map((grad, gIdx) => {
                      const cssValue = `linear-gradient(${gradientAngle}, ${grad.from}, ${grad.to})`;
                      return (
                        <motion.div
                          key={gIdx}
                          whileHover={{ y: -3, scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className="relative rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-xs bg-white dark:bg-slate-950 flex flex-col h-[150px] text-left group"
                        >
                          {/* Gradient Display Stage */}
                          <div 
                            style={{ background: cssValue }} 
                            className="flex-1 p-3.5 relative flex flex-col justify-between"
                          >
                            {/* Visual soft dark overlay for readability */}
                            <div className="absolute inset-0 bg-black/15 pointer-events-none group-hover:bg-black/10 transition-colors duration-200" />

                            {/* Top row: Name & visual badge */}
                            <div className="flex justify-between items-start z-10">
                              <div className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] text-white">
                                <span className="text-xs font-extrabold tracking-tight block">
                                  {grad.name}
                                </span>
                                <span className="text-[8.5px] font-bold opacity-90 uppercase tracking-widest mt-0.5 block">
                                  {grad.type}
                                </span>
                              </div>
                            </div>

                            {/* Center descriptor tooltip */}
                            <div className="text-[9.5px] text-white/80 z-10 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] font-medium max-w-[90%] mt-1 italic">
                              {grad.desc}
                            </div>

                            {/* Bottom row: Swatches & Quick Actions */}
                            <div className="flex items-end justify-between z-10 w-full mt-auto">
                              {/* Pill representation */}
                              <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/10 text-white font-mono text-[8.5px] font-extrabold select-none">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: grad.from }} />
                                  <span>{grad.from.toUpperCase()}</span>
                                </div>
                                <span className="text-white/40">→</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: grad.to }} />
                                  <span>{grad.to.toUpperCase()}</span>
                                </div>
                              </div>

                              {/* Quick action triggers */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cssCode = `background: ${cssValue};`;
                                    navigator.clipboard.writeText(cssCode);
                                    setCopiedToast({ message: "Copied CSS Gradient", value: cssCode, type: "HEX" });
                                  }}
                                  className="p-1 px-1.5 rounded-md bg-black/45 hover:bg-black/60 text-white/90 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 text-[8.5px] font-black tracking-wider"
                                  title="Copy CSS gradient statement"
                                >
                                  <Code className="w-3 h-3 shrink-0" />
                                  <span>CSS</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const hexPair = `${grad.from}, ${grad.to}`;
                                    navigator.clipboard.writeText(hexPair);
                                    setCopiedToast({ message: "Copied Hex Color Pair", value: hexPair, type: "HEX" });
                                  }}
                                  className="p-1 px-1.5 rounded-md bg-black/45 hover:bg-black/60 text-white/90 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 text-[8.5px] font-black tracking-wider"
                                  title="Copy color hex code pair"
                                >
                                  <Copy className="w-3 h-3 shrink-0" />
                                  <span>HEX</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Creative Thematic Naming Suggestions Section */}
              <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 text-left">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      AI Creative Thematics (Gemini)
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal font-sans">
                      Analyze the hue distribution to auto-generate artistic designer names and aesthetic concepts.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSuggestPaletteNames}
                    disabled={isSuggestingNames || palette.length === 0}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSuggestingNames ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Naming Palette...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Suggest Thematic Names</span>
                      </>
                    )}
                  </button>
                </div>

                {namingError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900 rounded-xl text-xs font-semibold mb-4 text-left">
                    {namingError}
                  </div>
                )}

                {/* Suggestions Grid */}
                {suggestedNames.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 text-left">
                    {suggestedNames.map((item, idx) => {
                      const isSelected = customPaletteName === item.name;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setCustomPaletteName(item.name)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-full group ${
                            isSelected
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500 shadow-xs"
                              : "bg-white dark:bg-slate-950 border-slate-200/60 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                isSelected 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" 
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                              }`}>
                                {item.theme}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-sans line-clamp-3">
                              {item.description}
                            </p>
                          </div>
                          
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-900 w-full text-right">
                            <span className={`text-[9px] font-bold tracking-wider uppercase ${
                              isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                            }`}>
                              {isSelected ? "Selected" : "Use Name"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
          <div className="space-y-3 pt-3">
            {/* Primary Action Row: Downloads & Export */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
                id="btn-download-palette"
              >
                <Download className="w-4 h-4 mr-1.5 text-slate-400" />
                Download Spec Sheet
              </button>

              <button
                onClick={handleDownloadCSS}
                className="inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
                id="btn-download-palette-css"
                title="Download swatches as CSS variables (.css)"
              >
                <FileCode className="w-4 h-4 mr-1.5 text-indigo-500" />
                Download CSS (.css)
              </button>

              <button
                onClick={handleDownloadJSON}
                className="inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
                id="btn-download-palette-json"
                title="Download swatches as a JSON theme object (.json)"
              >
                <FileJson className="w-4 h-4 mr-1.5 text-amber-500" />
                Download JSON (.json)
              </button>

              <button
                onClick={handleSharePalette}
                className="inline-flex items-center justify-center px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 font-semibold shadow-sm transition-all cursor-pointer"
                id="btn-share-palette"
              >
                <Share2 className="w-4 h-4 mr-1.5 text-emerald-500 hover:scale-105 transition-transform" />
                Share Palette
              </button>
            </div>

            {/* Google Drive Authorization / Synchronization Row */}
            <div className="text-xs bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Google Drive Cloud Storage
                </span>
                {user && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full font-sans">
                    Connected: {user.email || "User"}
                  </span>
                )}
              </div>

              {user ? (
                <div className="space-y-4">
                  {/* Custom Palette Object Save Interface */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-emerald-500" />
                        Save Palette Object to Drive
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Saves a structured JSON file containing hex codes, names, current sorting metadata, and accessibility contrast rating results.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="input-custom-palette-name" className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">
                        Custom Palette Name
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            id="input-custom-palette-name"
                            value={customPaletteName}
                            onChange={(e) => setCustomPaletteName(e.target.value)}
                            placeholder="e.g. Dreamy Rose Garden"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          />
                        </div>
                        <button
                          onClick={handleSavePaletteObjectToDrive}
                          disabled={isSaving || isSavingAll || isSavingPaletteObject}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 inline-flex items-center justify-center text-xs shadow-3xs"
                          id="btn-save-as-palette-object"
                        >
                          {isSavingPaletteObject ? (
                            <>
                              <Sparkles className="w-3 h-3 mr-1.5 animate-spin" />
                              Saving Object...
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3 h-3 mr-1.5" />
                              Save Palette Object
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono italic">
                        Preview target path: ToolkitPro/Palettes/{customPaletteName.trim() ? customPaletteName.trim().replace(/[\s/\\?%*|"<:;]+/g, "_") : "palette"}.palette.json
                      </p>
                    </div>
                  </div>

                  {/* Other standard Google Drive Exports */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Alternative Backups
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={handleSaveToDrive}
                        disabled={isSaving || isSavingAll || isSavingPaletteObject}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 font-bold transition-all cursor-pointer disabled:opacity-50 text-xs shadow-3xs"
                        id="btn-save-palette-drive"
                      >
                        <Cloud className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {isSaving ? "Saving PNG..." : "Save PNG Spec Sheet"}
                      </button>

                      <button
                        onClick={handleSaveAllToDrive}
                        disabled={isSaving || isSavingAll || isSavingPaletteObject}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 font-bold transition-all cursor-pointer disabled:opacity-50 text-xs shadow-3xs"
                        id="btn-save-all-palette-drive"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                        {isSavingAll ? "Saving Pack..." : "Save Pack (JSON + PNG)"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-slate-800">Authorization Required</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Connect your Google Account to export specs, schemas, and palette objects.
                    </p>
                  </div>
                  <button
                    onClick={onLogin}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-bold transition-all shadow-3xs cursor-pointer text-xs"
                    title="Authenticate Drive upload via your Google Workspace account"
                    id="btn-prompt-login-palette"
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1.5 text-white animate-pulse" />
                    Sign in to Save
                  </button>
                </div>
              )}
            </div>
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
