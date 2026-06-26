import React, { useState, useEffect, useRef, useCallback } from "react";
import { User } from "firebase/auth";
import QRCode from "qrcode";
import { uploadFileToDrive } from "../lib/drive";
import { Cloud, Download, QrCode, Settings, Palette, CheckCircle2, Image, X, Upload, History, Trash2, Printer, Share2, RefreshCw, AlertTriangle, Sparkles, Globe, Mail, Car, MapPin, Gauge, Key, Copy, Check, Layers, Type, Shapes, Camera, Grid, Crop, Scissors, Link, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useDrag } from "@use-gesture/react";
// @ts-ignore
import jsQR from "jsqr";
import JSZip from "jszip";

// Play a subtle, high-quality audio beep feedback cue
const playSuccessBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    // 950 Hz provides a very clean, high-end subtle feedback chime/beep
    oscillator.frequency.setValueAtTime(950, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.01); // Subtle, low volume
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12); // Short decay (120ms)

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    console.warn("Web Audio chime play blocked or failed:", e);
  }
};

// Color accessibility helper functions for relative luminance
const getRelativeLuminance = (hex: string): number => {
  try {
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
  } catch (e) {
    return 1;
  }
};

const getContrastRatio = (color1: string, color2: string): number => {
  if (!color1 || !color2) return 21;
  // Make sure it's valid hex form of 3 or 6 chars (optionally with hash)
  const hexPattern = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;
  if (!hexPattern.test(color1) || !hexPattern.test(color2)) {
    return 10; // Fallback to safe contrast
  }
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex);
};

interface ShapePreset {
  id: string;
  name: string;
  description: string;
  patternStyle: "squares" | "dots" | "rounded" | "rounded-dots" | "diamonds";
  eyeStyle: "squares" | "circle" | "rounded";
  logoShape: "square" | "circle" | "rounded";
}

const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: "modern-round",
    name: "Modern Round",
    description: "Sleek round-dot pattern style with smooth, organic circular corners.",
    patternStyle: "rounded-dots",
    eyeStyle: "rounded",
    logoShape: "rounded",
  },
  {
    id: "classic-blocky",
    name: "Classic Blocky",
    description: "Classic sharp-edged modular block motif for maximum legibility and scan reliability.",
    patternStyle: "squares",
    eyeStyle: "squares",
    logoShape: "square",
  },
  {
    id: "pixel-dots",
    name: "Pixel Art Dots",
    description: "Retro micro-pixel circles with beautiful outer circle locator guides.",
    patternStyle: "dots",
    eyeStyle: "circle",
    logoShape: "circle",
  },
  {
    id: "cyber-diamond",
    name: "Cyber Diamond",
    description: "Futuristic sharp angular diamond nodes tailored for a high-tech visual appearance.",
    patternStyle: "diamonds",
    eyeStyle: "squares",
    logoShape: "square",
  },
  {
    id: "organic-blend",
    name: "Organic Hybrid Blend",
    description: "Smooth organic node nodes paired with circular concentric ring alignments.",
    patternStyle: "rounded",
    eyeStyle: "circle",
    logoShape: "circle",
  },
];

interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  patternStyle: "squares" | "dots" | "rounded" | "rounded-dots" | "diamonds";
  eyeStyle: "squares" | "circle" | "rounded";
  foregroundColor: string; // Color 1
  enableGradient: boolean;
  gradientColor2?: string;
  gradientType?: "linear" | "radial";
  gradientDirection?: "diagonal" | "horizontal" | "vertical";
  badgeGradient: string; // Tailwind class description
}

const MATRIX_STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    description: "Vibrant orange-pink gradient on organic round nodes.",
    patternStyle: "rounded-dots",
    eyeStyle: "rounded",
    foregroundColor: "#f97316",
    enableGradient: true,
    gradientColor2: "#ec4899",
    gradientType: "linear",
    gradientDirection: "diagonal",
    badgeGradient: "bg-gradient-to-br from-orange-500 to-pink-500"
  },
  {
    id: "midnight-cyber",
    name: "Midnight Cyber",
    description: "Futuristic neon cyan-indigo gradient on precision squares.",
    patternStyle: "squares",
    eyeStyle: "squares",
    foregroundColor: "#06b6d4",
    enableGradient: true,
    gradientColor2: "#6366f1",
    gradientType: "linear",
    gradientDirection: "diagonal",
    badgeGradient: "bg-gradient-to-br from-cyan-400 to-indigo-500"
  },
  {
    id: "emerald-mint",
    name: "Forest Eco",
    description: "Lush green emerald gradient on smooth, modern rounded blocks.",
    patternStyle: "rounded",
    eyeStyle: "circle",
    foregroundColor: "#10b981",
    enableGradient: true,
    gradientColor2: "#0f766e",
    gradientType: "linear",
    gradientDirection: "vertical",
    badgeGradient: "bg-gradient-to-b from-emerald-400 to-teal-700"
  },
  {
    id: "ocean-radial",
    name: "Oceanic Vortex",
    description: "Immersive radial water-themed gradient on beautiful circular dots.",
    patternStyle: "dots",
    eyeStyle: "circle",
    foregroundColor: "#0284c7",
    enableGradient: true,
    gradientColor2: "#1e1b4b",
    gradientType: "radial",
    badgeGradient: "bg-[radial-gradient(circle,rgba(2,132,199,1)_0%,rgba(30,27,75,1)_100%)]"
  },
  {
    id: "royal-gold",
    name: "Imperial Gold",
    description: "Diagonal metallic golden gradient on high-tech diamond matrix.",
    patternStyle: "diamonds",
    eyeStyle: "rounded",
    foregroundColor: "#d97706",
    enableGradient: true,
    gradientColor2: "#78350f",
    gradientType: "linear",
    gradientDirection: "diagonal",
    badgeGradient: "bg-gradient-to-br from-amber-500 to-amber-900"
  },
  {
    id: "classic-monochrome",
    name: "Classic Slate",
    description: "The timeless, high-contrast crisp matte solid black configuration.",
    patternStyle: "squares",
    eyeStyle: "squares",
    foregroundColor: "#0f172a",
    enableGradient: false,
    badgeGradient: "bg-slate-900 dark:bg-slate-350"
  }
];

interface SavedQr {
  id: string;
  text: string;
  dataUrl: string;
  timestamp: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  logoDataUrl?: string | null;
  useLogo?: boolean;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  highDpi?: boolean;
  frameStyle?: "none" | "scan-me" | "visit-website" | "join-us" | "feedback" | "custom-frame";
  frameCustomText?: string;
  margin?: number;
  logoScale?: number;
  logoShape?: "square" | "circle" | "rounded";
  logoPadding?: number;
  enableTextOverlay?: boolean;
  overlayText?: string;
  overlayPosition?: "above" | "below";
  overlayFontFamily?: string;
  overlayFontSize?: number;
  overlayFontWeight?: "normal" | "bold" | "black";
  overlayColor?: string;
  patternStyle?: "squares" | "dots" | "rounded" | "rounded-dots" | "diamonds";
  eyeStyle?: "squares" | "circle" | "rounded";
  enableGradient?: boolean;
  gradientType?: "linear" | "radial";
  gradientColor2?: string;
  gradientDirection?: "diagonal" | "horizontal" | "vertical";
}

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
};

const drawFinderPattern = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  eyeStyle: "squares" | "circle" | "rounded",
  fgColor: string | CanvasGradient,
  bgColor: string
) => {
  const cellSize = w / 7;

  // Clear area
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, w);

  ctx.fillStyle = fgColor;
  if (eyeStyle === "circle") {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + w / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + w / 2, (5 * cellSize) / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + w / 2, (3 * cellSize) / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (eyeStyle === "rounded") {
    drawRoundedRect(ctx, x, y, w, w, cellSize * 2);

    ctx.fillStyle = bgColor;
    drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, cellSize * 1.5);

    ctx.fillStyle = fgColor;
    drawRoundedRect(ctx, x + cellSize * 2, y + cellSize * 2, 3 * cellSize, 3 * cellSize, cellSize);
  } else {
    // squares
    ctx.fillRect(x, y, w, w);

    ctx.fillStyle = bgColor;
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);

    ctx.fillStyle = fgColor;
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, 3 * cellSize, 3 * cellSize);
  }
};

const renderQrCodeToCanvas = async (
  qrCanvas: HTMLCanvasElement,
  text: string,
  actualWidth: number,
  patternStyle: "squares" | "dots" | "rounded" | "rounded-dots" | "diamonds",
  eyeStyle: "squares" | "circle" | "rounded",
  marginVal: number | undefined,
  fgColor: string,
  bgColor: string,
  ecLevel: "L" | "M" | "Q" | "H",
  enableGradient?: boolean,
  gradientType?: "linear" | "radial",
  gradientColor2?: string,
  gradientDirection?: "diagonal" | "horizontal" | "vertical"
): Promise<void> => {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecLevel });
  const numModules = qr.modules.size;
  const qrMargin = marginVal !== undefined ? marginVal : 4;
  const totalModules = numModules + qrMargin * 2;
  const cellSize = actualWidth / totalModules;

  qrCanvas.width = actualWidth;
  qrCanvas.height = actualWidth;

  const ctx = qrCanvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, actualWidth, actualWidth);

  // Setup fill style - check if gradient should be applied
  let cellFillStyle: string | CanvasGradient = fgColor;
  if (enableGradient && gradientColor2) {
    if (gradientType === "radial") {
      const cx = actualWidth / 2;
      const cy = actualWidth / 2;
      const rInner = 0;
      const rOuter = actualWidth * 0.72;
      const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
      grad.addColorStop(0, fgColor);
      grad.addColorStop(1, gradientColor2);
      cellFillStyle = grad;
    } else {
      // linear gradient directions
      let x0 = 0, y0 = 0, x1 = actualWidth, y1 = actualWidth;
      if (gradientDirection === "horizontal") {
        x0 = 0; y0 = 0;
        x1 = actualWidth; y1 = 0;
      } else if (gradientDirection === "vertical") {
        x0 = 0; y0 = 0;
        x1 = 0; y1 = actualWidth;
      }
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, fgColor);
      grad.addColorStop(1, gradientColor2);
      cellFillStyle = grad;
    }
  }

  const isFinderPattern = (row: number, col: number): boolean => {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= numModules - 7) return true;
    if (row >= numModules - 7 && col < 7) return true;
    return false;
  };

  // Draw data modules
  for (let row = 0; row < numModules; row++) {
    for (let col = 0; col < numModules; col++) {
      if (isFinderPattern(row, col)) {
        continue;
      }

      const isDark = qr.modules.get(row, col);
      if (isDark) {
        const x = (col + qrMargin) * cellSize;
        const y = (row + qrMargin) * cellSize;

        ctx.fillStyle = cellFillStyle;

        if (patternStyle === "dots") {
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const radius = (cellSize / 2) * 0.82;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (patternStyle === "rounded-dots") {
          const r = cellSize * 0.44;
          drawRoundedRect(ctx, x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, r);
        } else if (patternStyle === "rounded") {
          const r = cellSize * 0.28;
          drawRoundedRect(ctx, x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, r);
        } else if (patternStyle === "diamonds") {
          ctx.beginPath();
          ctx.moveTo(x + cellSize / 2, y + 0.5);
          ctx.lineTo(x + cellSize - 0.5, y + cellSize / 2);
          ctx.lineTo(x + cellSize / 2, y + cellSize - 0.5);
          ctx.lineTo(x + 0.5, y + cellSize / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
        }
      }
    }
  }

  // Draw finder patterns
  const finderSizePx = 7 * cellSize;
  drawFinderPattern(ctx, qrMargin * cellSize, qrMargin * cellSize, finderSizePx, eyeStyle, cellFillStyle, bgColor);
  drawFinderPattern(ctx, (qrMargin + numModules - 7) * cellSize, qrMargin * cellSize, finderSizePx, eyeStyle, cellFillStyle, bgColor);
  drawFinderPattern(ctx, qrMargin * cellSize, (qrMargin + numModules - 7) * cellSize, finderSizePx, eyeStyle, cellFillStyle, bgColor);
};

const LOGO_PRESETS = [
  {
    name: "Web Link",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    icon: Globe
  },
  {
    name: "Email Address",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    icon: Mail
  },
  {
    name: "Auto Service / Car",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23b91c1c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
    icon: Car
  },
  {
    name: "Location",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2316a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    icon: MapPin
  },
  {
    name: "Performance",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ea580c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 7.54 16.59"/><path d="M12 2a10 10 0 0 0-7.54 16.59"/><path d="M8 12h8"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m18 12-1 1"/><path d="m6 12 1 1"/></svg>`,
    icon: Gauge
  },
  {
    name: "Access Credentials",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ca8a04" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3M17 6l3 3"/></svg>`,
    icon: Key
  }
];

interface SwipeableHistoryItemProps {
  key?: string;
  item: SavedQr;
  onLoad: (item: SavedQr) => void;
  onDelete: (id: string, e: any) => void;
  onDownload: (item: SavedQr, e: any) => void;
}

function SwipeableHistoryItem({ item, onLoad, onDelete, onDownload }: SwipeableHistoryItemProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // use-gesture hook to bind drag gestures
  const bind = useDrag(({ active, movement: [mx], tap }) => {
    if (tap) {
      onLoad(item);
      return;
    }

    const allowedMx = mx > 0 ? 0 : mx;
    setIsDragging(active);

    if (active) {
      const targetX = allowedMx < -185 ? -185 + (allowedMx + 185) * 0.15 : allowedMx;
      setDragX(targetX);
    } else {
      if (allowedMx < -135) {
        setDragX(-450);
        setTimeout(() => {
          onDelete(item.id, { stopPropagation: () => {} } as any);
        }, 220);
      } else if (allowedMx < -50) {
        setDragX(-80);
      } else {
        setDragX(0);
      }
    }
  }, {
    axis: "x",
    filterTaps: true,
    pointer: { touch: true }
  });

  return (
    <div 
      className="relative overflow-hidden rounded-xl border border-slate-150 h-[64px]"
      style={{ touchAction: "pan-y" }}
    >
      {/* Background slide reveal red action segment */}
      <div 
        className="absolute inset-0 bg-rose-600 flex items-center justify-end px-4.5 select-none text-white transition-opacity duration-150 animate-in fade-in"
        style={{ opacity: dragX < -8 ? 1 : 0 }}
      >
        <button
          type="button"
          onClick={(e) => onDelete(item.id, e)}
          className="flex flex-col items-center gap-0.5 justify-center h-full text-white bg-transparent border-0 cursor-pointer pointer-events-auto"
          title="Instant Delete"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-wider">Delete</span>
        </button>
      </div>

      {/* Foreground actual clickable config slide card */}
      <div
        {...(bind() as any)}
        className="absolute inset-0 p-2.5 bg-slate-50 border-0 hover:bg-slate-100/60 flex items-start gap-2.5 cursor-pointer select-none active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          touchAction: "pan-y"
        }}
      >
        {/* Thumbnail snippet */}
        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative select-none">
          <img src={item.dataUrl} alt="History thumb" className="w-8.5 h-8.5 object-contain" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
          <p className="text-[11.5px] font-semibold text-slate-705 truncate block leading-tight">
            {item.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-slate-400 font-mono">
              {item.timestamp}
            </span>
            <span
              className="w-2 h-2 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: item.foregroundColor }}
              title={`FG: ${item.foregroundColor}`}
            />
          </div>
        </div>

        {/* Quick actions if not dragged */}
        {dragX >= -10 && (
          <div className="flex items-center gap-1 shrink-0 self-center z-10 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item, e);
              }}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-700 transition-all cursor-pointer shadow-3xs"
              title="Quick Download PNG"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id, e);
              }}
              className="p-1 rounded bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-3xs"
              title="Delete from Recent History"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface QrGeneratorProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => void;
}

export default function QrGenerator({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
}: QrGeneratorProps) {
  const [text, setText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_text") || "https://app-tool.vercel.app/";
    }
    return "https://app-tool.vercel.app/";
  });
  const [foregroundColor, setForegroundColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_fg_color") || "#0f172a";
    }
    return "#0f172a";
  }); // Dark slate
  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_bg_color") || "#ffffff";
    }
    return "#ffffff";
  }); // White
  const [size, setSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_size");
      return persisted ? parseInt(persisted) : 300;
    }
    return 300;
  });
  const [margin, setMargin] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_margin");
      return persisted ? parseInt(persisted) : 2;
    }
    return 2;
  });
  const [previewScale, setPreviewScale] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_preview_scale");
      return persisted ? parseInt(persisted) : 100;
    }
    return 100;
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isScanningLaserActive, setIsScanningLaserActive] = useState<boolean>(false);

  useEffect(() => {
    if (qrCodeDataUrl) {
      setIsScanningLaserActive(true);
      const timer = setTimeout(() => {
        setIsScanningLaserActive(false);
      }, 1200); // 1.2s scanning effect for delightful real-time preview feedback
      return () => clearTimeout(timer);
    }
  }, [qrCodeDataUrl]);

  const [liveScannable, setLiveScannable] = useState<boolean | null>(null);
  const [liveScanTimeMs, setLiveScanTimeMs] = useState<number>(0);
  const [showLiveScanHUD, setShowLiveScanHUD] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_show_live_hud");
      return persisted !== "false";
    }
    return true;
  });

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("");
  const [useLogo, setUseLogo] = useState<boolean>(true);
  const [logoDragActive, setLogoDragActive] = useState<boolean>(false);
  const [logoScale, setLogoScale] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_logo_scale");
      return persisted ? parseInt(persisted) : 20;
    }
    return 20;
  });
  const [logoShape, setLogoShape] = useState<"square" | "circle" | "rounded">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_logo_shape") as any) || "circle";
    }
    return "circle";
  });
  const [logoPadding, setLogoPadding] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_logo_padding");
      return persisted ? parseInt(persisted) : 4;
    }
    return 4;
  });

   const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_ecc");
      return (persisted as "L" | "M" | "Q" | "H") || "H";
    }
    return "H";
  });

  const [highDpi, setHighDpi] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_high_dpi") === "true";
    }
    return false;
  });

  const [frameStyle, setFrameStyle] = useState<"none" | "scan-me" | "visit-website" | "website" | "contact" | "join-us" | "feedback" | "custom-frame">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_frame_style") as any) || "none";
    }
    return "none";
  });

  const [frameBorderShape, setFrameBorderShape] = useState<"square" | "rounded" | "brackets" | "double-line">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_frame_border_shape") as any) || "square";
    }
    return "square";
  });

  const [downloadFormat, setDownloadFormat] = useState<"png" | "svg" | "jpeg">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_download_format") as "png" | "svg" | "jpeg") || "png";
    }
    return "png";
  });

  const [frameCustomText, setFrameCustomText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_frame_custom_text") || "REGISTER";
    }
    return "REGISTER";
  });

  // Text Overlay States
  const [enableTextOverlay, setEnableTextOverlay] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_enable_text_overlay") === "true";
    }
    return false;
  });

  const [overlayText, setOverlayText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_overlay_text") || "✨ SCAN ME NOW ✨";
    }
    return "✨ SCAN ME NOW ✨";
  });

  const [overlayPosition, setOverlayPosition] = useState<"above" | "below">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_overlay_position") as "above" | "below") || "below";
    }
    return "below";
  });

  const [overlayFontFamily, setOverlayFontFamily] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_overlay_font_family") || "Space Grotesk";
    }
    return "Space Grotesk";
  });

  const [overlayFontSize, setOverlayFontSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_pro_qr_overlay_font_size");
      return saved ? parseInt(saved) : 18;
    }
    return 18;
  });

  const [overlayFontWeight, setOverlayFontWeight] = useState<"normal" | "bold" | "black">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_overlay_font_weight") as any) || "bold";
    }
    return "bold";
  });

  const [overlayColor, setOverlayColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_overlay_color") || "";
    }
    return "";
  });

  const [patternStyle, setPatternStyle] = useState<"squares" | "dots" | "rounded" | "rounded-dots" | "diamonds">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_pattern_style") as any) || "squares";
    }
    return "squares";
  });

  const [eyeStyle, setEyeStyle] = useState<"squares" | "circle" | "rounded">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_eye_style") as any) || "squares";
    }
    return "squares";
  });

  const [enableScanLine, setEnableScanLine] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_enable_scan_line");
      return persisted !== "false";
    }
    return true;
  });

  const [enableGradient, setEnableGradient] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_enable_gradient") === "true";
    }
    return false;
  });

  const [gradientType, setGradientType] = useState<"linear" | "radial">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_gradient_type") as any) || "linear";
    }
    return "linear";
  });

  const [gradientColor2, setGradientColor2] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_gradient_color2") || "#ec4899";
    }
    return "#ec4899";
  });

  const [gradientDirection, setGradientDirection] = useState<"diagonal" | "horizontal" | "vertical">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_pro_qr_gradient_direction") as any) || "diagonal";
    }
    return "diagonal";
  });

  const [autoOptimizeDensity, setAutoOptimizeDensity] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_auto_optimize");
      return persisted !== "false";
    }
    return true;
  });

  // Dynamic automatic module density guard & pixel size scaler based on input character length
  useEffect(() => {
    if (autoOptimizeDensity && text.trim()) {
      const len = text.length;
      
      // Determine optimal Error Correction Level to prevent grid clutter
      // More text characters require fewer RS redundant blocks to maintain readable physical module sizes
      let ecc: "L" | "M" | "Q" | "H" = "H";
      if (len >= 170) {
        ecc = "L"; // <7% coverage - minimizes module density for massive URLs
      } else if (len >= 100) {
        ecc = "M"; // ~15% balance - standard digital readable delivery
      } else if (len >= 45) {
        ecc = "Q"; // ~25% reliability - medium density and tough
      } else {
        ecc = "H"; // ~30% - dense grid safe for logo overlays since character count is small
      }

      // Determine optimal canvas physical layout pixel dimensions to budget enough pixels/module
      let optimalSize = 250;
      if (len >= 150) {
        optimalSize = 400; // Peak budget
      } else if (len >= 90) {
        optimalSize = 350;
      } else if (len >= 35) {
        optimalSize = 300;
      } else {
        optimalSize = 250;
      }

      setErrorCorrectionLevel(ecc);
      setSize(optimalSize);
    }
  }, [text, autoOptimizeDensity]);

  const activePresetId = SHAPE_PRESETS.find(
    (p) =>
      p.patternStyle === patternStyle &&
      p.eyeStyle === eyeStyle &&
      p.logoShape === logoShape
  )?.id || "custom";

  const handleApplyStyleTemplate = (template: StyleTemplate) => {
    setPatternStyle(template.patternStyle);
    setEyeStyle(template.eyeStyle);
    setForegroundColor(template.foregroundColor);
    setEnableGradient(template.enableGradient);
    if (template.gradientColor2) {
      setGradientColor2(template.gradientColor2);
    }
    if (template.gradientType) {
      setGradientType(template.gradientType);
    }
    if (template.gradientDirection) {
      setGradientDirection(template.gradientDirection);
    }

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "design",
        title: `Style Preset Applied: ${template.name}`,
        detail: `Applied custom matrix style and color combinations`,
        icon: "Sparkles",
        tab: "qr",
      }
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    if (presetId === "custom") return;
    const preset = SHAPE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPatternStyle(preset.patternStyle);
      setEyeStyle(preset.eyeStyle);
      setLogoShape(preset.logoShape);
      
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "design",
          title: `Preset Applied: ${preset.name}`,
          detail: `Configured modules as ${preset.patternStyle} and eyes as ${preset.eyeStyle}`,
          icon: "Sparkles",
          tab: "qr",
        }
      }));
    }
  };

  const handleRandomizeStyle = () => {
    const currentIndex = SHAPE_PRESETS.findIndex((p) => p.id === activePresetId);
    let nextIndex = 0;
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % SHAPE_PRESETS.length;
    } else {
      nextIndex = Math.floor(Math.random() * SHAPE_PRESETS.length);
    }
    const nextPreset = SHAPE_PRESETS[nextIndex];
    handleApplyPreset(nextPreset.id);

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "design",
        title: "Randomized Style Layout",
        detail: `Explored new visual style: ${nextPreset.name}`,
        icon: "RefreshCw",
        tab: "qr",
      }
    }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_qr_text", text);
      localStorage.setItem("toolkit_pro_qr_fg_color", foregroundColor);
      localStorage.setItem("toolkit_pro_qr_bg_color", backgroundColor);
      localStorage.setItem("toolkit_pro_qr_size", size.toString());
      localStorage.setItem("toolkit_pro_qr_margin", margin.toString());
      localStorage.setItem("toolkit_pro_qr_preview_scale", previewScale.toString());
      localStorage.setItem("toolkit_pro_qr_ecc", errorCorrectionLevel);
      localStorage.setItem("toolkit_pro_qr_logo_scale", logoScale.toString());
      localStorage.setItem("toolkit_pro_qr_logo_shape", logoShape);
      localStorage.setItem("toolkit_pro_qr_logo_padding", logoPadding.toString());
      localStorage.setItem("toolkit_pro_qr_high_dpi", highDpi ? "true" : "false");
      localStorage.setItem("toolkit_pro_qr_frame_style", frameStyle);
      localStorage.setItem("toolkit_pro_qr_frame_border_shape", frameBorderShape);
      localStorage.setItem("toolkit_pro_qr_frame_custom_text", frameCustomText);
      localStorage.setItem("toolkit_pro_qr_enable_text_overlay", enableTextOverlay ? "true" : "false");
      localStorage.setItem("toolkit_pro_qr_overlay_text", overlayText);
      localStorage.setItem("toolkit_pro_qr_overlay_position", overlayPosition);
      localStorage.setItem("toolkit_pro_qr_overlay_font_family", overlayFontFamily);
      localStorage.setItem("toolkit_pro_qr_overlay_font_size", overlayFontSize.toString());
      localStorage.setItem("toolkit_pro_qr_overlay_font_weight", overlayFontWeight);
      localStorage.setItem("toolkit_pro_qr_overlay_color", overlayColor);
      localStorage.setItem("toolkit_pro_qr_pattern_style", patternStyle);
      localStorage.setItem("toolkit_pro_qr_eye_style", eyeStyle);
      localStorage.setItem("toolkit_pro_qr_enable_scan_line", enableScanLine ? "true" : "false");
      localStorage.setItem("toolkit_pro_qr_auto_optimize", autoOptimizeDensity ? "true" : "false");
      localStorage.setItem("toolkit_pro_qr_download_format", downloadFormat);
      localStorage.setItem("toolkit_pro_qr_enable_gradient", enableGradient ? "true" : "false");
      localStorage.setItem("toolkit_pro_qr_gradient_type", gradientType);
      localStorage.setItem("toolkit_pro_qr_gradient_color2", gradientColor2);
      localStorage.setItem("toolkit_pro_qr_gradient_direction", gradientDirection);
    }
  }, [text, foregroundColor, backgroundColor, size, margin, previewScale, errorCorrectionLevel, logoScale, logoShape, logoPadding, highDpi, frameStyle, frameBorderShape, frameCustomText, enableTextOverlay, overlayText, overlayPosition, overlayFontFamily, overlayFontSize, overlayFontWeight, overlayColor, patternStyle, eyeStyle, enableScanLine, autoOptimizeDensity, downloadFormat, enableGradient, gradientType, gradientColor2, gradientDirection]);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // High-performance URL shorten integration states
  const [isShortening, setIsShortening] = useState<boolean>(false);
  const [shortenError, setShortenError] = useState<string | null>(null);
  const [shortenSuccess, setShortenSuccess] = useState<boolean>(false);
  const [lastShortenedUrl, setLastShortenedUrl] = useState<string>("");
  const [preShortenedUrl, setPreShortenedUrl] = useState<string>("");

  const handleShortenTextUrl = async (urlToShorten?: string) => {
    const target = urlToShorten || text;
    if (!target || !target.trim()) {
      setShortenError("Please enter a valid URL to shorten.");
      return;
    }

    // Basic URL format validation to avoid spamming the backend
    if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?/i.test(target.trim())) {
      setShortenError("Input does not appear to be a standard website or link URL.");
      return;
    }

    setIsShortening(true);
    setShortenError(null);
    setShortenSuccess(false);
    setPreShortenedUrl(target);

    try {
      const response = await fetch("/api/url/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: target }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Server gateway failed to shorten this URL.");
      }

      const data = await response.json();
      if (data && data.shortUrl) {
        setText(data.shortUrl);
        setLastShortenedUrl(data.shortUrl);
        setShortenSuccess(true);
        setTimeout(() => setShortenSuccess(false), 3500); // clear visual success status later
        
        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "share",
            title: `URL Shortened: ${data.provider}`,
            detail: `Shortened to: ${data.shortUrl}`,
            icon: "Link",
            tab: "qr",
          }
        }));
      } else {
        throw new Error("No short URL returned from server.");
      }
    } catch (err: any) {
      console.error("Failed to shorten URL:", err);
      setShortenError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsShortening(false);
    }
  };

  const getScannabilityScore = () => {
    let score = 100;
    const len = text.length;

    // 1. Density/Length penalty
    if (len > 250) {
      score -= 30;
    } else if (len > 120) {
      score -= 20;
    } else if (len > 60) {
      score -= 10;
    } else if (len > 30) {
      score -= 5;
    }

    // 2. ECC Base Penalty/Contribution
    if (errorCorrectionLevel === "L") {
      score -= 15;
    } else if (errorCorrectionLevel === "M") {
      score -= 5;
    } else if (errorCorrectionLevel === "H") {
      score += 5;
    }

    // 3. Central block coverage risk (Logo overlay or text overlays)
    const hasOverlay = (useLogo && logoDataUrl) || (enableTextOverlay && overlayText.trim());
    if (hasOverlay) {
      if (errorCorrectionLevel === "L") {
        score -= 55; // severe warning! L recovers almost nothing
      } else if (errorCorrectionLevel === "M") {
        score -= 25; // warning! M might scan poorly
      } else if (errorCorrectionLevel === "Q") {
        score -= 10; // slightly safer
      } else if (errorCorrectionLevel === "H") {
        // H recovers 30%, no score penalty
      }
    }

    const finalScore = Math.max(10, Math.min(100, score));

    let status: "excellent" | "good" | "warning" | "critical" = "excellent";
    let message = "";
    let stars = 5;

    if (finalScore <= 40) {
      status = "critical";
      stars = 1;
      if (hasOverlay && errorCorrectionLevel === "L") {
        message = "High risk of scan failure! A center overlay (logo/text) is active with Error Correction set to Level L (recovers ~7%). This QR code will be completely unreadable. Change back to Level H immediately.";
      } else {
        message = `High density warning! Input text is extremely long (${len} chars) but error correction is set to Level L. The grid blocks are too dense for mobile camera lenses to read. Shorten text or increase error correction.`;
      }
    } else if (finalScore <= 70) {
      status = "warning";
      stars = 3;
      if (hasOverlay && errorCorrectionLevel === "M") {
        message = "Logo/text overlay detected with standard Level M recovery. This might scan slower or fail under bad lighting/specular reflections. Level Q or H is highly recommended.";
      } else {
        message = `Moderate density warning. Input text is moderately long (${len} chars). Raising error correction to Level M or Q is highly recommended to protect physical prints.`;
      }
    } else if (finalScore <= 88) {
      status = "good";
      stars = 4;
      message = "Healthy scannability bounds. Extremely reliable for regular website URLs and clean digital screen scans.";
    } else {
      status = "excellent";
      stars = 5;
      message = "Pristine scan parameters! Perfect balance of light grid density and strong error correction for resilient printed materials.";
    }

    return { score: finalScore, status, message, stars };
  };

  // QR Test Scan state variables
  const [scanTestResult, setScanTestResult] = useState<{
    success: boolean;
    decodedText?: string;
    timeMs?: number;
    errorCorrection?: string;
    contrastRatio?: string;
  } | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);
  const [showScanSimulator, setShowScanSimulator] = useState<boolean>(false);

  // Simulated Camera Scanner Test-Lab states
  const [testLabActive, setTestLabActive] = useState<boolean>(false);
  const [simulatedBlur, setSimulatedBlur] = useState<number>(0);
  const [simulatedBrightness, setSimulatedBrightness] = useState<number>(100);
  const [simulatedContrast, setSimulatedContrast] = useState<number>(100);
  const [simulatedTilt, setSimulatedTilt] = useState<boolean>(false);
  const [isLensDirty, setIsLensDirty] = useState<boolean>(false);
  const [isSimScanChecking, setIsSimScanChecking] = useState<boolean>(false);
  const [simScanResult, setSimScanResult] = useState<{
    success: boolean;
    decodedText?: string;
    message?: string;
  } | null>(null);

  // Print layout studio config states
  const [showPrintLayoutModal, setShowPrintLayoutModal] = useState<boolean>(false);
  const [printSourceMode, setPrintSourceMode] = useState<"single" | "multi" | "collaboration">("single");
  const [singlePrintCopies, setSinglePrintCopies] = useState<number>(12);
  const [printQrSizeMm, setPrintQrSizeMm] = useState<number>(50); // width of code in mm
  const [printGapSizeMm, setPrintGapSizeMm] = useState<number>(10); // gap between QRs in mm
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [cropMarkPaddingMm, setCropMarkPaddingMm] = useState<number>(3); // crop mark offset of QR in mm
  const [printLabelStyle, setPrintLabelStyle] = useState<"none" | "content" | "index">("none");
  const [selectedMultiQrIds, setSelectedMultiQrIds] = useState<string[]>([]);

  // Automatically check active QR when entering print layout studio
  useEffect(() => {
    if (showPrintLayoutModal && selectedMultiQrIds.length === 0) {
      setSelectedMultiQrIds(["__active__"]);
    }
  }, [showPrintLayoutModal, selectedMultiQrIds]);

  const runSimulatedScanCheck = useCallback((
    blurVal: number,
    brightVal: number,
    contrastVal: number,
    tiltVal: boolean,
    dirtyVal: boolean
  ) => {
    if (!qrCodeDataUrl) return;
    setIsSimScanChecking(true);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = qrCodeDataUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 250;
        canvas.height = 250;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsSimScanChecking(false);
          return;
        }

        // Draw background color
        ctx.fillStyle = backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        let filterStr = "";
        if (blurVal > 0) filterStr += `blur(${blurVal}px) `;
        if (brightVal < 100) filterStr += `brightness(${brightVal / 100}) `;
        if (contrastVal !== 100) filterStr += `contrast(${contrastVal / 105}) `;
        
        if (filterStr) {
          ctx.filter = filterStr.trim();
        }

        // Apply tilt transform on canvas
        if (tiltVal) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.transform(0.88, 0.08, -0.06, 0.85, 0, 0);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (tiltVal) {
          ctx.restore();
        }

        ctx.filter = "none";

        // Draw reflective glare / dirt
        if (dirtyVal) {
          const glareGrad = ctx.createRadialGradient(
            canvas.width * 0.35, canvas.height * 0.35, 5,
            canvas.width * 0.35, canvas.height * 0.35, 75
          );
          glareGrad.addColorStop(0, "rgba(255, 255, 255, 0.93)");
          glareGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
          glareGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = glareGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Speckles
          ctx.fillStyle = "rgba(120, 120, 120, 0.12)";
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(50 + i * 36, 65 + (i % 2) * 50, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setSimScanResult({
            success: true,
            decodedText: code.data,
            message: "Perfect! Even under these simulated visual challenges, standard smartphone camera sensors can easily resolve the module data."
          });
        } else {
          let reasonMsg = "Scan failure: the camera lens simulator failed to resolve the elements. ";
          if (blurVal >= 2.0) {
            reasonMsg += "The simulated out-of-focus blur has merged the modules together. ";
          }
          if (brightVal <= 45) {
            reasonMsg += "Ambient low-light reduces the light/dark background contrast to unreadable levels. ";
          }
          if (tiltVal) {
            reasonMsg += "Perspective skew makes finder cells look warped for standard orientation alignment. ";
          }
          if (dirtyVal) {
            reasonMsg += "Ambient specular light glare completely blocks top-left alignment keys. ";
          }
          if (errorCorrectionLevel === "L" || errorCorrectionLevel === "M") {
            reasonMsg += "Upgrade error correction to High (H) or Quartile (Q) for greater physical damage tolerance!";
          } else {
            reasonMsg += "Try choosing a larger pixel size, greater margin, or increasing foreground vs background color contrast.";
          }
          setSimScanResult({
            success: false,
            message: reasonMsg
          });
        }
      } catch (err) {
        console.error("Diagnostic canvas simulation run failed:", err);
        setSimScanResult({
          success: false,
          message: "Internal image buffer parsing error. Please adjust variables."
        });
      } finally {
        setIsSimScanChecking(false);
      }
    };
    img.onerror = () => {
      setIsSimScanChecking(false);
    };
  }, [qrCodeDataUrl, backgroundColor, errorCorrectionLevel]);

  // Hook up automatic reactive simulation recalculation
  useEffect(() => {
    if (qrCodeDataUrl && testLabActive) {
      const timer = setTimeout(() => {
        runSimulatedScanCheck(simulatedBlur, simulatedBrightness, simulatedContrast, simulatedTilt, isLensDirty);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [qrCodeDataUrl, testLabActive, simulatedBlur, simulatedBrightness, simulatedContrast, simulatedTilt, isLensDirty, runSimulatedScanCheck]);

  // Real-time background scan decoder check hook with 150ms debounce
  useEffect(() => {
    if (!qrCodeDataUrl) {
      setLiveScannable(null);
      return;
    }

    const timer = setTimeout(() => {
      const startTime = performance.now();
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = qrCodeDataUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setLiveScannable(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          const duration = Math.max(1, Math.round(performance.now() - startTime));
          
          setLiveScannable(!!code);
          setLiveScanTimeMs(duration);
        } catch (e) {
          console.error("Live scanner check error:", e);
          setLiveScannable(false);
        }
      };
      img.onerror = () => {
        setLiveScannable(false);
      };
    }, 150);

    return () => clearTimeout(timer);
  }, [qrCodeDataUrl]);

  // Persist HUD visibility changes
  useEffect(() => {
    localStorage.setItem("toolkit_pro_qr_show_live_hud", showLiveScanHUD ? "true" : "false");
  }, [showLiveScanHUD]);

  const runLocalScanTest = () => {
    if (!qrCodeDataUrl) return;
    setIsSimulatingScan(true);
    setScanTestResult(null);
    setShowScanSimulator(true);

    const startTime = performance.now();

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = qrCodeDataUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setScanTestResult({
            success: false,
            timeMs: Math.round(performance.now() - startTime),
            contrastRatio: "Unknown",
          });
          setIsSimulatingScan(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Decode raw pixels in real-time
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const contrastVal = getContrastRatio(foregroundColor, backgroundColor).toFixed(1);

        if (code) {
          setScanTestResult({
            success: true,
            decodedText: code.data,
            timeMs: duration,
            errorCorrection: errorCorrectionLevel,
            contrastRatio: contrastVal,
          });
        } else {
          setScanTestResult({
            success: false,
            timeMs: duration,
            contrastRatio: contrastVal,
          });
        }
      } catch (err) {
        console.error("Diagnostic scanner error:", err);
        setScanTestResult({
          success: false,
          timeMs: Math.round(performance.now() - startTime),
          contrastRatio: "Unknown",
        });
      }
      setIsSimulatingScan(false);
    };

    img.onerror = () => {
      setScanTestResult({
        success: false,
        timeMs: Math.round(performance.now() - startTime),
        contrastRatio: "Unknown",
      });
      setIsSimulatingScan(false);
    };
  };
  
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedBase64, setCopiedBase64] = useState<boolean>(false);
  const [copiedPng, setCopiedPng] = useState<boolean>(false);
  const [copyFormat, setCopyFormat] = useState<"base64" | "objectUrl" | "image">(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_copy_format");
      return (persisted as "base64" | "objectUrl" | "image") || "base64";
    }
    return "base64";
  });

  const [savedQrs, setSavedQrs] = useState<SavedQr[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_saved_qrs");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [scanHistory, setScanHistory] = useState<SavedQr[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_qr_scan_history");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [activeHistoryTab, setActiveHistoryTab] = useState<"saved" | "scan_history">("scan_history");

  // Batch Mode states
  const [inputMode, setInputMode] = useState<"single" | "batch">("single");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [urlColumn, setUrlColumn] = useState<string>("");
  const [nameColumn, setNameColumn] = useState<string>("");
  const [namingStrategy, setNamingStrategy] = useState<"index" | "url" | "column">("index");
  const [batchGenerationProgress, setBatchGenerationProgress] = useState<{
    total: number;
    current: number;
    active: boolean;
    status: string;
  }>({ total: 0, current: 0, active: false, status: "" });
  const [importError, setImportError] = useState<string | null>(null);

  // Zoom control state for A4 preview on screen
  const [previewZoom, setPreviewZoom] = useState<number>(65);

  // Memoized lists of all custom designed codes
  const printableList = React.useMemo(() => {
    const list: { id: string; text: string; dataUrl: string; source: string; timestamp?: string }[] = [];
    if (qrCodeDataUrl) {
      list.push({
        id: "__active__",
        text: text,
        dataUrl: qrCodeDataUrl,
        source: "Active Design"
      });
    }
    savedQrs.forEach((item) => {
      if (!list.some(x => x.id === item.id)) {
        list.push({
          id: item.id,
          text: item.text,
          dataUrl: item.dataUrl,
          source: "Saved Gallery",
          timestamp: item.timestamp
        });
      }
    });
    scanHistory.forEach((item) => {
      if (!list.some(x => x.id === item.id)) {
        list.push({
          id: item.id,
          text: item.text,
          dataUrl: item.dataUrl,
          source: "Auto-Scan History",
          timestamp: item.timestamp
        });
      }
    });
    return list;
  }, [qrCodeDataUrl, text, savedQrs, scanHistory]);

  // Selected items with specific replication multiplier
  const activePrintItems = React.useMemo(() => {
    if (printSourceMode === "single") {
      if (!qrCodeDataUrl) return [];
      return Array.from({ length: singlePrintCopies }).map((_, i) => ({
        id: `__active_repeat_${i}`,
        text: text,
        dataUrl: qrCodeDataUrl,
        index: i + 1
      }));
    } else {
      return printableList
        .filter(x => selectedMultiQrIds.includes(x.id))
        .map((x, i) => ({
          ...x,
          index: i + 1
        }));
    }
  }, [printSourceMode, qrCodeDataUrl, text, singlePrintCopies, printableList, selectedMultiQrIds]);

  // Physical page boundaries calculations for standard A4
  const containerWidthMm = 210;
  const containerHeightMm = 297;
  const paddingMm = 15; // 15mm page safety margin
  const drawWidthMm = containerWidthMm - (paddingMm * 2); // 180mm
  const drawHeightMm = containerHeightMm - (paddingMm * 2); // 267mm

  const cols = Math.max(1, Math.floor((drawWidthMm + printGapSizeMm) / (printQrSizeMm + printGapSizeMm)));
  const rows = Math.max(1, Math.floor((drawHeightMm + printGapSizeMm) / (printQrSizeMm + printGapSizeMm)));
  const perPageCount = cols * rows;

  const pages = React.useMemo(() => {
    const pagesList: typeof activePrintItems[] = [];
    for (let i = 0; i < activePrintItems.length; i += perPageCount) {
      pagesList.push(activePrintItems.slice(i, i + perPageCount));
    }
    return pagesList;
  }, [activePrintItems, perPageCount]);

  // Helper to parse CSV line respecting quotes
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"(.*)"$/, "$1"));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"(.*)"$/, "$1"));
    return result;
  };

  const handleCsvUpload = (file: File) => {
    setImportError(null);
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const textVal = e.target?.result as string;
      if (!textVal) {
        setImportError("File is empty or could not be read.");
        return;
      }

      const lines = textVal.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length === 0) {
        setImportError("The CSV file is empty.");
        return;
      }

      const parsedHeaders = parseCsvLine(lines[0]);
      if (parsedHeaders.length === 0 || !parsedHeaders[0]) {
        setImportError("No column headers found in the first line.");
        return;
      }

      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const rowObj: Record<string, string> = {};
        parsedHeaders.forEach((header, index) => {
          rowObj[header] = cols[index] || "";
        });
        rows.push(rowObj);
      }

      if (rows.length === 0) {
        setImportError("No data rows found in the CSV.");
        return;
      }

      setCsvHeaders(parsedHeaders);
      setCsvRows(rows);

      // Auto-detect URL column
      const urlCol = parsedHeaders.find(h => 
        h.toLowerCase().includes("url") || 
        h.toLowerCase().includes("link") || 
        h.toLowerCase().includes("href") || 
        h.toLowerCase().includes("target")
      ) || parsedHeaders[0];

      setUrlColumn(urlCol);

      // Auto-detect Name Column
      const labelCol = parsedHeaders.find(h => 
        h.toLowerCase().includes("label") || 
        h.toLowerCase().includes("name") || 
        h.toLowerCase().includes("title") || 
        h.toLowerCase().includes("id") ||
        h.toLowerCase().includes("filename")
      ) || "";
      
      setNameColumn(labelCol);
      if (labelCol) {
        setNamingStrategy("column");
      } else {
        setNamingStrategy("index");
      }
    };

    reader.onerror = () => {
      setImportError("Failed to read the file.");
    };

    reader.readAsText(file);
  };

  const generateSingleQrBlob = async (targetText: string): Promise<Blob> => {
    const actualWidth = highDpi ? size * 4 : size;

    // Create the base offscreen QR canvas
    const qrCanvas = document.createElement("canvas");
    await renderQrCodeToCanvas(
      qrCanvas,
      targetText,
      actualWidth,
      patternStyle,
      eyeStyle,
      margin,
      foregroundColor,
      backgroundColor,
      errorCorrectionLevel || "M",
      enableGradient,
      gradientType,
      gradientColor2,
      gradientDirection
    );

    // If useLogo and logoDataUrl is available, overlay centered logo
    if (useLogo && logoDataUrl) {
      const ctx = qrCanvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const logoSize = Math.max(24, Math.floor(actualWidth * (logoScale / 100)));
            const x = (actualWidth - logoSize) / 2;
            const y = (actualWidth - logoSize) / 2;

            ctx.fillStyle = backgroundColor;
            if (logoShape === "circle") {
              ctx.beginPath();
              ctx.arc(actualWidth / 2, actualWidth / 2, logoSize / 2 + logoPadding, 0, Math.PI * 2);
              ctx.fill();
            } else if (logoShape === "rounded") {
              const r = 5;
              ctx.beginPath();
              const lx = x - logoPadding;
              const ly = y - logoPadding;
              const lw = logoSize + (logoPadding * 2);
              const lh = logoSize + (logoPadding * 2);
              ctx.moveTo(lx + r, ly);
              ctx.lineTo(lx + lw - r, ly);
              ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + r);
              ctx.lineTo(lx + lw, ly + lh - r);
              ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - r, ly + lh);
              ctx.lineTo(lx + r, ly + lh);
              ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - r);
              ctx.lineTo(lx, ly + r);
              ctx.quadraticCurveTo(lx, ly, lx + r, ly);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillRect(x - logoPadding, y - logoPadding, logoSize + (logoPadding * 2), logoSize + (logoPadding * 2));
            }

            ctx.save();
            if (logoShape === "circle") {
              ctx.beginPath();
              ctx.arc(actualWidth / 2, actualWidth / 2, logoSize / 2, 0, Math.PI * 2);
              ctx.clip();
            } else if (logoShape === "rounded") {
              const r = 4;
              ctx.beginPath();
              ctx.moveTo(x + r, y);
              ctx.lineTo(x + logoSize - r, y);
              ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + r);
              ctx.lineTo(x + logoSize, y + logoSize - r);
              ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - r, y + logoSize);
              ctx.lineTo(x + r, y + logoSize);
              ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - r);
              ctx.lineTo(x, y + r);
              ctx.quadraticCurveTo(x, y, x + r, y);
              ctx.closePath();
              ctx.clip();
            }
            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
        });
      }
    }

    // Composite the QR code onto a bigger canvas if frame style is selected
    let finalCanvas = qrCanvas;
    if (frameStyle !== "none") {
      const borderPadding = Math.max(12, Math.floor(actualWidth * 0.05));
      const labelHeight = Math.max(36, Math.floor(actualWidth * 0.16));
      const totalWidth = actualWidth + (borderPadding * 2);
      const totalHeight = actualWidth + (borderPadding * 2) + labelHeight;

      const composerCanvas = document.createElement("canvas");
      composerCanvas.width = totalWidth;
      composerCanvas.height = totalHeight;
      const compCtx = composerCanvas.getContext("2d");

      if (compCtx) {
        compCtx.fillStyle = backgroundColor;
        compCtx.fillRect(0, 0, totalWidth, totalHeight);

        let labelText = "SCAN ME";
        if (frameStyle === "scan-me") labelText = "SCAN ME";
        else if (frameStyle === "visit-website") labelText = "VISIT WEBSITE";
        else if (frameStyle === "website") labelText = "WEBSITE";
        else if (frameStyle === "contact") labelText = "CONTACT";
        else if (frameStyle === "join-us") labelText = "JOIN US";
        else if (frameStyle === "feedback") labelText = "GIVE FEEDBACK";
        else if (frameStyle === "custom-frame") labelText = frameCustomText.trim().toUpperCase() || "SCAN ME";

        let qrOffsetX = borderPadding;
        let qrOffsetY = borderPadding;
        let bannerY = totalHeight - labelHeight;
        let textY = totalHeight - (labelHeight / 2);

        if (frameStyle === "join-us") {
          qrOffsetY = borderPadding + labelHeight;
          bannerY = 0;
          textY = labelHeight / 2;
        }

        compCtx.drawImage(qrCanvas, qrOffsetX, qrOffsetY);

        const borderW = Math.max(3, Math.floor(actualWidth * 0.016));
        compCtx.strokeStyle = foregroundColor;
        compCtx.lineWidth = borderW;

        if (frameBorderShape === "rounded") {
          const r = Math.max(10, Math.floor(totalWidth * 0.05));
          
          // Draw border rounded outline
          compCtx.beginPath();
          compCtx.moveTo(borderW / 2 + r, borderW / 2);
          compCtx.lineTo(totalWidth - borderW / 2 - r, borderW / 2);
          compCtx.quadraticCurveTo(totalWidth - borderW / 2, borderW / 2, totalWidth - borderW / 2, borderW / 2 + r);
          compCtx.lineTo(totalWidth - borderW / 2, totalHeight - borderW / 2 - r);
          compCtx.quadraticCurveTo(totalWidth - borderW / 2, totalHeight - borderW / 2, totalWidth - borderW / 2 - r, totalHeight - borderW / 2);
          compCtx.lineTo(borderW / 2 + r, totalHeight - borderW / 2);
          compCtx.quadraticCurveTo(borderW / 2, totalHeight - borderW / 2, borderW / 2, totalHeight - borderW / 2 - r);
          compCtx.lineTo(borderW / 2, borderW / 2 + r);
          compCtx.quadraticCurveTo(borderW / 2, borderW / 2, borderW / 2 + r, borderW / 2);
          compCtx.closePath();
          compCtx.stroke();

          // Clip to fill the block banner nicely with rounded bottom or top corners
          compCtx.save();
          compCtx.beginPath();
          compCtx.moveTo(borderW / 2 + r, borderW / 2);
          compCtx.lineTo(totalWidth - borderW / 2 - r, borderW / 2);
          compCtx.quadraticCurveTo(totalWidth - borderW / 2, borderW / 2, totalWidth - borderW / 2, borderW / 2 + r);
          compCtx.lineTo(totalWidth - borderW / 2, totalHeight - borderW / 2 - r);
          compCtx.quadraticCurveTo(totalWidth - borderW / 2, totalHeight - borderW / 2, totalWidth - borderW / 2 - r, totalHeight - borderW / 2);
          compCtx.lineTo(borderW / 2 + r, totalHeight - borderW / 2);
          compCtx.quadraticCurveTo(borderW / 2, totalHeight - borderW / 2, borderW / 2, totalHeight - borderW / 2 - r);
          compCtx.lineTo(borderW / 2, borderW / 2 + r);
          compCtx.quadraticCurveTo(borderW / 2, borderW / 2, borderW / 2 + r, borderW / 2);
          compCtx.closePath();
          compCtx.clip();
          compCtx.fillStyle = foregroundColor;
          compCtx.fillRect(0, bannerY, totalWidth, labelHeight);
          compCtx.restore();

        } else if (frameBorderShape === "brackets") {
          const len = Math.max(15, Math.floor(totalWidth * 0.15));
          const offset = borderW / 2;
          
          compCtx.beginPath();
          // Top-left
          compCtx.moveTo(offset, offset + len);
          compCtx.lineTo(offset, offset);
          compCtx.lineTo(offset + len, offset);
          
          // Top-right
          compCtx.moveTo(totalWidth - offset - len, offset);
          compCtx.lineTo(totalWidth - offset, offset);
          compCtx.lineTo(totalWidth - offset, offset + len);
          
          // Bottom-left
          compCtx.moveTo(offset, totalHeight - offset - len);
          compCtx.lineTo(offset, totalHeight - offset);
          compCtx.lineTo(offset + len, totalHeight - offset);
          
          // Bottom-right
          compCtx.moveTo(totalWidth - offset - len, totalHeight - offset);
          compCtx.lineTo(totalWidth - offset, totalHeight - offset);
          compCtx.lineTo(totalWidth - offset, totalHeight - offset - len);
          compCtx.stroke();

          compCtx.fillStyle = foregroundColor;
          compCtx.fillRect(borderW, bannerY, totalWidth - borderW * 2, labelHeight - borderW);

        } else if (frameBorderShape === "double-line") {
          const gap = Math.max(3, Math.floor(borderW * 0.6));
          compCtx.strokeRect(borderW / 2, borderW / 2, totalWidth - borderW, totalHeight - borderW);
          compCtx.lineWidth = borderW / 2;
          compCtx.strokeRect(borderW + gap, borderW + gap, totalWidth - (borderW + gap) * 2, totalHeight - (borderW + gap) * 2);
          
          compCtx.fillStyle = foregroundColor;
          compCtx.fillRect(borderW + gap * 2, bannerY + gap * 0.5, totalWidth - (borderW + gap * 2) * 2, labelHeight - gap * 1.5);

        } else {
          // "square" (standard style)
          compCtx.fillStyle = foregroundColor;
          compCtx.fillRect(0, bannerY, totalWidth, labelHeight);
          compCtx.strokeRect(borderW / 2, borderW / 2, totalWidth - borderW, totalHeight - borderW);
        }

        const fontSize = Math.max(13, Math.floor(labelHeight * 0.44));
        compCtx.font = `900 ${fontSize}px "Inter", "Space Grotesk", sans-serif`;
        compCtx.textAlign = "center";
        compCtx.textBaseline = "middle";
        compCtx.fillStyle = backgroundColor;
        compCtx.fillText(labelText, totalWidth / 2, textY);
      }
      finalCanvas = composerCanvas;
    }

    if (enableTextOverlay && overlayText.trim()) {
      const baseCanvas = finalCanvas;
      const overlayHeight = Math.max(30, Math.floor(overlayFontSize * 1.8));
      const totalWidth = baseCanvas.width;
      const totalHeight = baseCanvas.height + overlayHeight;

      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = totalWidth;
      overlayCanvas.height = totalHeight;
      const overlayCtx = overlayCanvas.getContext("2d");

      if (overlayCtx) {
        overlayCtx.fillStyle = backgroundColor;
        overlayCtx.fillRect(0, 0, totalWidth, totalHeight);

        let baseOffsetY = 0;
        let textY = 0;

        if (overlayPosition === "above") {
          baseOffsetY = overlayHeight;
          textY = overlayHeight / 2;
        } else {
          baseOffsetY = 0;
          textY = baseCanvas.height + (overlayHeight / 2);
        }

        overlayCtx.drawImage(baseCanvas, 0, baseOffsetY);

        overlayCtx.fillStyle = overlayColor || foregroundColor;
        overlayCtx.textAlign = "center";
        overlayCtx.textBaseline = "middle";

        let weightStr = "500";
        if (overlayFontWeight === "bold") weightStr = "700";
        else if (overlayFontWeight === "black") weightStr = "900";

        overlayCtx.font = `${weightStr} ${overlayFontSize}px "${overlayFontFamily}", "Inter", "Space Grotesk", sans-serif`;
        overlayCtx.fillText(overlayText, totalWidth / 2, textY);
      }
      finalCanvas = overlayCanvas;
    }

    return new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate Blob from Canvas"));
        }
      }, "image/png");
    });
  };

  const generateAndDownloadBatchZip = async () => {
    if (csvRows.length === 0 || !urlColumn) {
      alert("Please upload a CSV file with valid columns first.");
      return;
    }

    setBatchGenerationProgress({
      total: csvRows.length,
      current: 0,
      active: true,
      status: "Initializing ZIP worker...",
    });

    const zip = new JSZip();

    try {
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        const rawUrl = row[urlColumn];
        if (!rawUrl || !rawUrl.trim()) {
          setBatchGenerationProgress(prev => ({
            ...prev,
            current: i + 1,
            status: `Skipped empty row ${i + 1}`,
          }));
          continue;
        }

        const cleanUrl = rawUrl.trim();

        setBatchGenerationProgress(prev => ({
          ...prev,
          current: i,
          status: `Rendering QR: ${cleanUrl.length > 25 ? cleanUrl.substring(0, 25) + "..." : cleanUrl}`,
        }));

        const blob = await generateSingleQrBlob(cleanUrl);

        let fileName = `qr_code_${String(i + 1).padStart(3, "0")}`;
        if (namingStrategy === "column" && nameColumn && row[nameColumn]) {
          fileName = row[nameColumn].replace(/[^a-zA-Z0-9_\-]/g, "_");
        } else if (namingStrategy === "url") {
          fileName = cleanUrl
            .trim()
            .replace(/^https?:\/\//, "")
            .replace(/[^a-zA-Z0-9_\-]/g, "_");
        }

        zip.file(`${fileName || `qr_${i + 1}`}.png`, blob);

        setBatchGenerationProgress(prev => ({
          ...prev,
          current: i + 1,
        }));
      }

      setBatchGenerationProgress(prev => ({
        ...prev,
        status: "Compiling ZIP file...",
      }));

      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `qr_batch_archive_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setBatchGenerationProgress(prev => ({
        ...prev,
        status: "Done! ZIP downloaded successfully.",
      }));

      setTimeout(() => {
        setBatchGenerationProgress(prev => ({ ...prev, active: false }));
      }, 5000);

    } catch (err: any) {
      console.error("Batch error:", err);
      alert(`Error generating batch ZIP: ${err?.message || "Verify your CSV integrity and retry."}`);
      setBatchGenerationProgress(prev => ({ ...prev, active: false }));
    }
  };

  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide alert
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Generate QR code base64 every time parameters change
  useEffect(() => {
    generateQr();
  }, [text, foregroundColor, backgroundColor, size, margin, logoDataUrl, useLogo, errorCorrectionLevel, logoScale, logoShape, logoPadding, highDpi, frameStyle, frameBorderShape, frameCustomText, enableTextOverlay, overlayText, overlayPosition, overlayFontFamily, overlayFontSize, overlayFontWeight, overlayColor]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setLogoDataUrl(event.target.result);
        setUseLogo(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoDataUrl(null);
    setLogoName("");
  };

  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setLogoDataUrl(event.target.result);
          setUseLogo(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQr = async () => {
    if (!text.trim()) {
      setQrCodeDataUrl(null);
      return;
    }

    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    setIsGenerating(true);

    qrTimeoutRef.current = setTimeout(async () => {
      try {
        const actualWidth = highDpi ? size * 4 : size;

        // Create the base offscreen QR canvas
        const qrCanvas = document.createElement("canvas");
        await renderQrCodeToCanvas(
          qrCanvas,
          text,
          actualWidth,
          patternStyle,
          eyeStyle,
          margin,
          foregroundColor,
          backgroundColor,
          errorCorrectionLevel || "M",
          enableGradient,
          gradientType,
          gradientColor2,
          gradientDirection
        );

        // If useLogo and logoDataUrl is available, overlay centered logo
        if (useLogo && logoDataUrl) {
          const ctx = qrCanvas.getContext("2d");
          if (ctx) {
            const img = new Image();
            img.src = logoDataUrl;
            await new Promise<void>((resolve) => {
              img.onload = () => {
                // Logo size is approximately custom % of QR size
                const logoSize = Math.max(24, Math.floor(actualWidth * (logoScale / 100)));
                const x = (actualWidth - logoSize) / 2;
                const y = (actualWidth - logoSize) / 2;

                // Clear background behind logo with a bit of quiet spacing margin
                ctx.fillStyle = backgroundColor;
                if (logoShape === "circle") {
                  ctx.beginPath();
                  ctx.arc(actualWidth / 2, actualWidth / 2, logoSize / 2 + logoPadding, 0, Math.PI * 2);
                  ctx.fill();
                } else if (logoShape === "rounded") {
                  // Round rect container
                  const r = 5;
                  ctx.beginPath();
                  const lx = x - logoPadding;
                  const ly = y - logoPadding;
                  const lw = logoSize + (logoPadding * 2);
                  const lh = logoSize + (logoPadding * 2);
                  ctx.moveTo(lx + r, ly);
                  ctx.lineTo(lx + lw - r, ly);
                  ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + r);
                  ctx.lineTo(lx + lw, ly + lh - r);
                  ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - r, ly + lh);
                  ctx.lineTo(lx + r, ly + lh);
                  ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - r);
                  ctx.lineTo(lx, ly + r);
                  ctx.quadraticCurveTo(lx, ly, lx + r, ly);
                  ctx.closePath();
                  ctx.fill();
                } else {
                  ctx.fillRect(x - logoPadding, y - logoPadding, logoSize + (logoPadding * 2), logoSize + (logoPadding * 2));
                }

                // Draw image centered while respecting shape clipping
                ctx.save();
                if (logoShape === "circle") {
                  ctx.beginPath();
                  ctx.arc(actualWidth / 2, actualWidth / 2, logoSize / 2, 0, Math.PI * 2);
                  ctx.clip();
                } else if (logoShape === "rounded") {
                  const r = 4;
                  ctx.beginPath();
                  ctx.moveTo(x + r, y);
                  ctx.lineTo(x + logoSize - r, y);
                  ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + r);
                  ctx.lineTo(x + logoSize, y + logoSize - r);
                  ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - r, y + logoSize);
                  ctx.lineTo(x + r, y + logoSize);
                  ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - r);
                  ctx.lineTo(x, y + r);
                  ctx.quadraticCurveTo(x, y, x + r, y);
                  ctx.closePath();
                  ctx.clip();
                }

                // Prevent distortion by cropping rectangular images to a centered square (aspect ratio aware)
                const imgW = img.width || 1;
                const imgH = img.height || 1;
                if (imgW === imgH) {
                  ctx.drawImage(img, x, y, logoSize, logoSize);
                } else if (imgW > imgH) {
                  const sWidth = imgH;
                  const sHeight = imgH;
                  const sx = (imgW - imgH) / 2;
                  const sy = 0;
                  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, logoSize, logoSize);
                } else {
                  const sWidth = imgW;
                  const sHeight = imgW;
                  const sx = 0;
                  const sy = (imgH - imgW) / 2;
                  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, logoSize, logoSize);
                }
                ctx.restore();
                resolve();
              };
              img.onerror = () => {
                console.error("Failed to load logo image");
                resolve();
              };
            });
          }
        }

        // Composite the QR code onto a bigger canvas if frame style is selected
        let finalCanvas = qrCanvas;
        if (frameStyle !== "none") {
          const borderPadding = Math.max(12, Math.floor(actualWidth * 0.05));
          const labelHeight = Math.max(36, Math.floor(actualWidth * 0.16));
          const totalWidth = actualWidth + (borderPadding * 2);
          const totalHeight = actualWidth + (borderPadding * 2) + labelHeight;

          const composerCanvas = document.createElement("canvas");
          composerCanvas.width = totalWidth;
          composerCanvas.height = totalHeight;
          const compCtx = composerCanvas.getContext("2d");

          if (compCtx) {
            // Fill background
            compCtx.fillStyle = backgroundColor;
            compCtx.fillRect(0, 0, totalWidth, totalHeight);

            // Fetch template label text
            let labelText = "SCAN ME";
            if (frameStyle === "scan-me") labelText = "SCAN ME";
            else if (frameStyle === "visit-website") labelText = "VISIT WEBSITE";
            else if (frameStyle === "website") labelText = "WEBSITE";
            else if (frameStyle === "contact") labelText = "CONTACT";
            else if (frameStyle === "join-us") labelText = "JOIN US";
            else if (frameStyle === "feedback") labelText = "GIVE FEEDBACK";
            else if (frameStyle === "custom-frame") labelText = frameCustomText.trim().toUpperCase() || "SCAN ME";

            let qrOffsetX = borderPadding;
            let qrOffsetY = borderPadding;
            let bannerY = totalHeight - labelHeight;
            let textY = totalHeight - (labelHeight / 2);

            if (frameStyle === "join-us") {
              qrOffsetY = borderPadding + labelHeight;
              bannerY = 0;
              textY = labelHeight / 2;
            }

            // Draw QR code canvas onto composite
            compCtx.drawImage(qrCanvas, qrOffsetX, qrOffsetY);

            const borderW = Math.max(3, Math.floor(actualWidth * 0.016));
            compCtx.strokeStyle = foregroundColor;
            compCtx.lineWidth = borderW;

            if (frameBorderShape === "rounded") {
              const r = Math.max(10, Math.floor(totalWidth * 0.05));
              
              // Draw border rounded outline
              compCtx.beginPath();
              compCtx.moveTo(borderW / 2 + r, borderW / 2);
              compCtx.lineTo(totalWidth - borderW / 2 - r, borderW / 2);
              compCtx.quadraticCurveTo(totalWidth - borderW / 2, borderW / 2, totalWidth - borderW / 2, borderW / 2 + r);
              compCtx.lineTo(totalWidth - borderW / 2, totalHeight - borderW / 2 - r);
              compCtx.quadraticCurveTo(totalWidth - borderW / 2, totalHeight - borderW / 2, totalWidth - borderW / 2 - r, totalHeight - borderW / 2);
              compCtx.lineTo(borderW / 2 + r, totalHeight - borderW / 2);
              compCtx.quadraticCurveTo(borderW / 2, totalHeight - borderW / 2, borderW / 2, totalHeight - borderW / 2 - r);
              compCtx.lineTo(borderW / 2, borderW / 2 + r);
              compCtx.quadraticCurveTo(borderW / 2, borderW / 2, borderW / 2 + r, borderW / 2);
              compCtx.closePath();
              compCtx.stroke();

              // Clip to fill the block banner nicely with rounded bottom or top corners
              compCtx.save();
              compCtx.beginPath();
              compCtx.moveTo(borderW / 2 + r, borderW / 2);
              compCtx.lineTo(totalWidth - borderW / 2 - r, borderW / 2);
              compCtx.quadraticCurveTo(totalWidth - borderW / 2, borderW / 2, totalWidth - borderW / 2, borderW / 2 + r);
              compCtx.lineTo(totalWidth - borderW / 2, totalHeight - borderW / 2 - r);
              compCtx.quadraticCurveTo(totalWidth - borderW / 2, totalHeight - borderW / 2, totalWidth - borderW / 2 - r, totalHeight - borderW / 2);
              compCtx.lineTo(borderW / 2 + r, totalHeight - borderW / 2);
              compCtx.quadraticCurveTo(borderW / 2, totalHeight - borderW / 2, borderW / 2, totalHeight - borderW / 2 - r);
              compCtx.lineTo(borderW / 2, borderW / 2 + r);
              compCtx.quadraticCurveTo(borderW / 2, borderW / 2, borderW / 2 + r, borderW / 2);
              compCtx.closePath();
              compCtx.clip();
              compCtx.fillStyle = foregroundColor;
              compCtx.fillRect(0, bannerY, totalWidth, labelHeight);
              compCtx.restore();

            } else if (frameBorderShape === "brackets") {
              const len = Math.max(15, Math.floor(totalWidth * 0.15));
              const offset = borderW / 2;
              
              compCtx.beginPath();
              // Top-left
              compCtx.moveTo(offset, offset + len);
              compCtx.lineTo(offset, offset);
              compCtx.lineTo(offset + len, offset);
              
              // Top-right
              compCtx.moveTo(totalWidth - offset - len, offset);
              compCtx.lineTo(totalWidth - offset, offset);
              compCtx.lineTo(totalWidth - offset, offset + len);
              
              // Bottom-left
              compCtx.moveTo(offset, totalHeight - offset - len);
              compCtx.lineTo(offset, totalHeight - offset);
              compCtx.lineTo(offset + len, totalHeight - offset);
              
              // Bottom-right
              compCtx.moveTo(totalWidth - offset - len, totalHeight - offset);
              compCtx.lineTo(totalWidth - offset, totalHeight - offset);
              compCtx.lineTo(totalWidth - offset, totalHeight - offset - len);
              compCtx.stroke();

              compCtx.fillStyle = foregroundColor;
              compCtx.fillRect(borderW, bannerY, totalWidth - borderW * 2, labelHeight - borderW);

            } else if (frameBorderShape === "double-line") {
              const gap = Math.max(3, Math.floor(borderW * 0.6));
              compCtx.strokeRect(borderW / 2, borderW / 2, totalWidth - borderW, totalHeight - borderW);
              compCtx.lineWidth = borderW / 2;
              compCtx.strokeRect(borderW + gap, borderW + gap, totalWidth - (borderW + gap) * 2, totalHeight - (borderW + gap) * 2);
              
              compCtx.fillStyle = foregroundColor;
              compCtx.fillRect(borderW + gap * 2, bannerY + gap * 0.5, totalWidth - (borderW + gap * 2) * 2, labelHeight - gap * 1.5);

            } else {
              // "square" (standard style)
              compCtx.fillStyle = foregroundColor;
              compCtx.fillRect(0, bannerY, totalWidth, labelHeight);
              compCtx.strokeRect(borderW / 2, borderW / 2, totalWidth - borderW, totalHeight - borderW);
            }

            // Print centered label text
            const fontSize = Math.max(13, Math.floor(labelHeight * 0.44));
            // Ensure sans-serif fallbacks are fully robust
            compCtx.font = `900 ${fontSize}px "Inter", "Space Grotesk", sans-serif`;
            compCtx.textAlign = "center";
            compCtx.textBaseline = "middle";
            compCtx.fillStyle = backgroundColor;
            compCtx.fillText(labelText, totalWidth / 2, textY);
          }
          finalCanvas = composerCanvas;
        }

        if (enableTextOverlay && overlayText.trim()) {
          const baseCanvas = finalCanvas;
          const overlayHeight = Math.max(30, Math.floor(overlayFontSize * 1.8));
          const totalWidth = baseCanvas.width;
          const totalHeight = baseCanvas.height + overlayHeight;

          const overlayCanvas = document.createElement("canvas");
          overlayCanvas.width = totalWidth;
          overlayCanvas.height = totalHeight;
          const overlayCtx = overlayCanvas.getContext("2d");

          if (overlayCtx) {
            overlayCtx.fillStyle = backgroundColor;
            overlayCtx.fillRect(0, 0, totalWidth, totalHeight);

            let baseOffsetY = 0;
            let textY = 0;

            if (overlayPosition === "above") {
              baseOffsetY = overlayHeight;
              textY = overlayHeight / 2;
            } else {
              baseOffsetY = 0;
              textY = baseCanvas.height + (overlayHeight / 2);
            }

            overlayCtx.drawImage(baseCanvas, 0, baseOffsetY);

            overlayCtx.fillStyle = overlayColor || foregroundColor;
            overlayCtx.textAlign = "center";
            overlayCtx.textBaseline = "middle";

            let weightStr = "500";
            if (overlayFontWeight === "bold") weightStr = "700";
            else if (overlayFontWeight === "black") weightStr = "900";

            overlayCtx.font = `${weightStr} ${overlayFontSize}px "${overlayFontFamily}", "Inter", "Space Grotesk", sans-serif`;
            overlayCtx.fillText(overlayText, totalWidth / 2, textY);
          }
          finalCanvas = overlayCanvas;
        }

        const dataUrl = finalCanvas.toDataURL("image/png");
        setQrCodeDataUrl(dataUrl);

        // Automatically save to scanHistory (limit last 10 elements)
        if (text.trim()) {
          setScanHistory((prev) => {
            if (prev.length > 0 && prev[0].text === text.trim()) {
              return prev;
            }
            const filtered = prev.filter((item) => item.text !== text.trim());
            const newItem: SavedQr = {
              id: Date.now().toString(),
              text: text.trim(),
              dataUrl: dataUrl,
              timestamp: new Date().toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              }),
              size: size,
              foregroundColor: foregroundColor,
              backgroundColor: backgroundColor,
              logoDataUrl: logoDataUrl,
              useLogo: useLogo,
              errorCorrectionLevel: errorCorrectionLevel,
              highDpi: highDpi,
              frameStyle: frameStyle,
              frameCustomText: frameCustomText,
              margin: margin,
              logoScale: logoScale,
              logoShape: logoShape,
              logoPadding: logoPadding,
              enableTextOverlay: enableTextOverlay,
              overlayText: overlayText,
              overlayPosition: overlayPosition,
              overlayFontFamily: overlayFontFamily,
              overlayFontSize: overlayFontSize,
              overlayFontWeight: overlayFontWeight,
              overlayColor: overlayColor,
              patternStyle: patternStyle,
              eyeStyle: eyeStyle,
            };
            const updated = [newItem, ...filtered].slice(0, 10);
            if (typeof window !== "undefined") {
              localStorage.setItem("toolkit_pro_qr_scan_history", JSON.stringify(updated));
            }
            return updated;
          });
        }

        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "file",
            title: "Generated QR Code",
            detail: `Created QR tracking module for "${text.length > 25 ? text.substring(0, 25) + "..." : text}"`,
            icon: "QrCode",
            tab: "qr"
          }
        }));

        // Audio feedback cue
        playSuccessBeep();
      } catch (err) {
        console.error("QR Code Generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 550);
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    if (downloadFormat === "svg") {
      handleDownloadSvg();
      return;
    }

    const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";

    if (downloadFormat === "jpeg") {
      const img = new Image();
      img.src = qrCodeDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = backgroundColor || "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          try {
            const jpegUrl = canvas.toDataURL("image/jpeg", 0.95);
            const link = document.createElement("a");
            const downloadName = `toolkit_pro_qr_${safeText}.jpg`;
            link.download = downloadName;
            link.href = jpegUrl;
            link.click();

            window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
              detail: {
                type: "file",
                title: "Downloaded QR Code (JPEG)",
                detail: `Exported ${downloadName} locally`,
                icon: "Download",
                tab: "qr"
              }
            }));
          } catch (e) {
            console.error("Failed to generate JPEG stream:", e);
          }
        }
      };
      return;
    }

    // Default target: PNG
    const link = document.createElement("a");
    const downloadName = `toolkit_pro_qr_${safeText}.png`;
    link.download = downloadName;
    link.href = qrCodeDataUrl;
    link.click();

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "file",
        title: "Downloaded QR Code (PNG)",
        detail: `Exported ${downloadName} locally`,
        icon: "Download",
        tab: "qr"
      }
    }));
  };

  const handleDownloadSvg = async () => {
    try {
      let svgString = await QRCode.toString(text, {
        type: "svg",
        margin: margin,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      });

      // Embed logo centered inside the vector content if present
      if (useLogo && logoDataUrl) {
        // Find default or standard grid scale size for SVG insertion
        // Since we don't scale the SVG viewBox manually, node-qrcode's SVG scale 
        // typically corresponds directly to the matrix size. We find the matrix length!
        // Let's parse or extract the viewBox dimension from the SVG string
        const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
        let viewBoxSize = 100; // fallback
        if (viewBoxMatch && viewBoxMatch[1]) {
          const parts = viewBoxMatch[1].split(/\s+/);
          if (parts.length === 4) {
            viewBoxSize = parseFloat(parts[2]) || 100;
          }
        }

        const logoSize = Math.max(10, Math.floor(viewBoxSize * (logoScale / 100)));
        const x = (viewBoxSize - logoSize) / 2;
        const y = (viewBoxSize - logoSize) / 2;

        const svgPadding = (logoPadding / 4) * 0.6;
        let backgroundShape = "";
        if (logoShape === "circle") {
          backgroundShape = `<circle cx="${viewBoxSize/2}" cy="${viewBoxSize/2}" r="${logoSize/2 + svgPadding + 0.2}" fill="${backgroundColor}" />`;
        } else if (logoShape === "rounded") {
          backgroundShape = `<rect x="${x - svgPadding}" y="${y - svgPadding}" width="${logoSize + (svgPadding * 2)}" height="${logoSize + (svgPadding * 2)}" rx="1.5" ry="1.5" fill="${backgroundColor}" />`;
        } else {
          backgroundShape = `<rect x="${x - svgPadding}" y="${y - svgPadding}" width="${logoSize + (svgPadding * 2)}" height="${logoSize + (svgPadding * 2)}" fill="${backgroundColor}" />`;
        }

        // Draw the image element with vector clip paths for circle / rounded shapes
        let logoImage = "";
        if (logoShape === "circle") {
          logoImage = `
            <clipPath id="circle-clip-${viewBoxSize}">
              <circle cx="${viewBoxSize / 2}" cy="${viewBoxSize / 2}" r="${logoSize / 2}" />
            </clipPath>
            <image href="${logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" clip-path="url(#circle-clip-${viewBoxSize})" />
          `;
        } else if (logoShape === "rounded") {
          logoImage = `
            <clipPath id="round-clip-${viewBoxSize}">
              <rect x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" rx="1" ry="1" />
            </clipPath>
            <image href="${logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" clip-path="url(#round-clip-${viewBoxSize})" />
          `;
        } else {
          logoImage = `<image href="${logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" />`;
        }

        const insertIndex = svgString.lastIndexOf("</svg>");
        if (insertIndex !== -1) {
          svgString = svgString.substring(0, insertIndex) + backgroundShape + logoImage + svgString.substring(insertIndex);
        }
      }

      // Download the SVG
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";
      const downloadName = `toolkit_pro_qr_${safeText}.svg`;
      link.download = downloadName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Downloaded Vector QR (SVG)",
          detail: `Exported high-quality printable ${downloadName}`,
          icon: "Download",
          tab: "qr",
        }
      }));
    } catch (err) {
      console.error("Vector SVG generation failed:", err);
      alert("SVG generation failed. Please try a different theme.");
    }
  };

  const handleShare = async () => {
    if (!qrCodeDataUrl) return;
    try {
      const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";
      const filename = `toolkit_pro_qr_${safeText}.png`;

      // Convert QR base64 code to File object for native Web Share API
      const resBlob = await fetch(qrCodeDataUrl);
      const blob = await resBlob.blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Toolkit Pro - Custom QR Code",
            text: `Scan or use this custom QR Code for: "${text}" designed using Toolkit Pro`,
          });
        } else {
          await navigator.share({
            title: "Toolkit Pro - Custom QR Code",
            text: `QR Code content: "${text}"`,
            url: window.location.href,
          });
        }
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          setSaveStatus({
            success: true,
            msg: "Web Sharing is limited on this browser configuration. The QR code content text has been saved to your Clipboard instead!",
          });
        } else {
          setSaveStatus({
            success: false,
            msg: "Sharing is not supported on this browser or platform.",
          });
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error sharing QR code:", err);
        setSaveStatus({
          success: false,
          msg: "Could not share QR image: " + (err.message || String(err)),
        });
      }
    }
  };

  const handleCopyClipboard = async () => {
    if (!qrCodeDataUrl) return;
    try {
      if (copyFormat === "base64") {
        await navigator.clipboard.writeText(qrCodeDataUrl);
        setCopied(true);
        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "file",
            title: "Copied QR Base64 Data URI",
            detail: "Copied complete base64 image data string",
            icon: "Copy",
            tab: "qr",
          }
        }));
      } else if (copyFormat === "objectUrl") {
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();
        const objUrl = URL.createObjectURL(blob);
        await navigator.clipboard.writeText(objUrl);
        setCopied(true);
        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "file",
            title: "Copied QR Object URL",
            detail: "Copied local Blob URL reference pointer",
            icon: "Copy",
            tab: "qr",
          }
        }));
      } else {
        // Copy PNG Image representation directly
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setCopied(true);
          window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
            detail: {
              type: "file",
              title: "Copied QR Image directly",
              detail: "Ready for pasting inside design tools (Figma, Canva, etc.)",
              icon: "Copy",
              tab: "qr",
            }
          }));
        } catch (imageErr) {
          console.warn("Direct image copy failed, falling back to Base64 URI", imageErr);
          await navigator.clipboard.writeText(qrCodeDataUrl);
          setCopied(true);
        }
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const changeCopyFormat = (format: "base64" | "objectUrl" | "image") => {
    setCopyFormat(format);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_qr_copy_format", format);
    }
  };

  const handleCopyBase64Direct = async () => {
    if (!qrCodeDataUrl) return;
    try {
      await navigator.clipboard.writeText(qrCodeDataUrl);
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Copied QR Base64 Data URI",
          detail: "Copied complete base64 image data string",
          icon: "Copy",
          tab: "qr",
        }
      }));
    } catch (err) {
      console.error("Base64 copy failed:", err);
    }
  };

  const handleCopyPngDirect = async () => {
    if (!qrCodeDataUrl) return;
    try {
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Copied QR Image directly",
          detail: "Ready for pasting inside design tools (Figma, Canva, etc.)",
          icon: "Copy",
          tab: "qr",
        }
      }));
    } catch (err) {
      console.warn("Direct image copy failed, falling back to Base64 URI", err);
      // Fallback
      await navigator.clipboard.writeText(qrCodeDataUrl);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
    }
  };

  const handleSaveToDrive = async () => {
    if (!user || !accessToken || !qrCodeDataUrl) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      "Save this customized QR Code image to your Google Drive?"
    );
    if (!confirmSave) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 25).toLowerCase() || "code";
      const filename = `QR_Code_${safeText || "vector"}.png`;

      await uploadFileToDrive(accessToken, filename, "image/png", qrCodeDataUrl);
      setSaveStatus({
        success: true,
        msg: `Successfully uploaded "${filename}" to Google Drive!`,
      });
      onRefreshDrive();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Saved QR to Drive",
          detail: `Uploaded "${filename}" successfully`,
          icon: "Cloud",
          tab: "qr"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        success: false,
        msg: err.message || "Failed to save QR Code to Google Drive.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!qrCodeDataUrl) return;

    const newSaved: SavedQr = {
      id: Date.now().toString(),
      text: text,
      dataUrl: qrCodeDataUrl,
      timestamp: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }) + " " + new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      size: size,
      foregroundColor: foregroundColor,
      backgroundColor: backgroundColor,
      logoDataUrl: logoDataUrl,
      useLogo: useLogo,
      errorCorrectionLevel: errorCorrectionLevel,
      highDpi: highDpi,
      frameStyle: frameStyle,
      frameCustomText: frameCustomText,
      margin: margin,
      logoScale: logoScale,
      logoShape: logoShape,
      logoPadding: logoPadding,
      enableTextOverlay: enableTextOverlay,
      overlayText: overlayText,
      overlayPosition: overlayPosition,
      overlayFontFamily: overlayFontFamily,
      overlayFontSize: overlayFontSize,
      overlayFontWeight: overlayFontWeight,
      overlayColor: overlayColor,
      patternStyle: patternStyle,
      eyeStyle: eyeStyle,
      enableGradient: enableGradient,
      gradientType: gradientType,
      gradientColor2: gradientColor2,
      gradientDirection: gradientDirection,
    };

    const updated = [newSaved, ...savedQrs];
    setSavedQrs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_saved_qrs", JSON.stringify(updated));
    }
    
    setSaveStatus({
      success: true,
      msg: "Custom QR Code successfully added to your offline local gallery!",
    });
  };

  const handleExportCSV = (data: SavedQr[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = [
      "ID",
      "Text or URL",
      "Timestamp",
      "Size",
      "Foreground Color",
      "Background Color",
      "Use Logo",
      "Error Correction Level",
      "High DPI",
      "Frame Style",
      "Custom Frame Text",
      "Margin",
      "Logo Scale",
      "Logo Shape",
      "Text Overlay Enabled",
      "Overlay Text",
      "Overlay Position",
      "Overlay Font Family",
      "Overlay Font Size",
      "Overlay Font Weight",
      "Overlay Color",
      "Pattern Style",
      "Eye Style"
    ];
    
    const rows = data.map(item => [
      item.id,
      item.text,
      item.timestamp,
      item.size,
      item.foregroundColor,
      item.backgroundColor,
      item.useLogo ? "true" : "false",
      item.errorCorrectionLevel || "M",
      item.highDpi ? "true" : "false",
      item.frameStyle || "none",
      item.frameCustomText || "",
      item.margin !== undefined ? item.margin : 10,
      item.logoScale !== undefined ? item.logoScale : "",
      item.logoShape || "square",
      item.enableTextOverlay ? "true" : "false",
      item.overlayText || "",
      item.overlayPosition || "below",
      item.overlayFontFamily || "Inter",
      item.overlayFontSize !== undefined ? item.overlayFontSize : "",
      item.overlayFontWeight || "bold",
      item.overlayColor || "#000000",
      item.patternStyle || "squares",
      item.eyeStyle || "squares"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(value => {
          const valStr = String(value ?? "");
          if (/[,\"\n\r]/.test(valStr)) {
            return `"${valStr.replace(/"/g, '""')}"`;
          }
          return valStr;
        }).join(",")
      )
    ].join("\n");
    
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export history as CSV", err);
    }
  };

  const handleLoadSaved = (item: SavedQr) => {
    setText(item.text);
    setForegroundColor(item.foregroundColor);
    setBackgroundColor(item.backgroundColor);
    setSize(item.size);
    if (item.highDpi !== undefined) {
      setHighDpi(item.highDpi);
    }
    if (item.logoDataUrl) {
      setLogoDataUrl(item.logoDataUrl);
      setLogoName("Loaded Logo");
    } else {
      setLogoDataUrl(null);
      setLogoName("");
    }
    if (item.useLogo !== undefined) {
      setUseLogo(item.useLogo);
    }
    if (item.errorCorrectionLevel) {
      setErrorCorrectionLevel(item.errorCorrectionLevel);
    }
    if (item.frameStyle) {
      setFrameStyle(item.frameStyle);
    } else {
      setFrameStyle("none");
    }
    if (item.frameCustomText) {
      setFrameCustomText(item.frameCustomText);
    }
    if (item.margin !== undefined) {
      setMargin(item.margin);
    }
    if (item.logoScale !== undefined) {
      setLogoScale(item.logoScale);
    }
    if (item.logoShape !== undefined) {
      setLogoShape(item.logoShape);
    }
    if (item.logoPadding !== undefined) {
      setLogoPadding(item.logoPadding);
    }
    if (item.enableTextOverlay !== undefined) {
      setEnableTextOverlay(item.enableTextOverlay);
    }
    if (item.overlayText !== undefined) {
      setOverlayText(item.overlayText);
    }
    if (item.overlayPosition !== undefined) {
      setOverlayPosition(item.overlayPosition);
    }
    if (item.overlayFontFamily !== undefined) {
      setOverlayFontFamily(item.overlayFontFamily);
    }
    if (item.overlayFontSize !== undefined) {
      setOverlayFontSize(item.overlayFontSize);
    }
    if (item.overlayFontWeight !== undefined) {
      setOverlayFontWeight(item.overlayFontWeight);
    }
    if (item.overlayColor !== undefined) {
      setOverlayColor(item.overlayColor);
    }
    if (item.patternStyle !== undefined) {
      setPatternStyle(item.patternStyle);
    }
    if (item.eyeStyle !== undefined) {
      setEyeStyle(item.eyeStyle);
    }
    if (item.enableGradient !== undefined) {
      setEnableGradient(item.enableGradient);
    }
    if (item.gradientType !== undefined) {
      setGradientType(item.gradientType);
    }
    if (item.gradientColor2 !== undefined) {
      setGradientColor2(item.gradientColor2);
    }
    if (item.gradientDirection !== undefined) {
      setGradientDirection(item.gradientDirection);
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedQrs.filter((item) => item.id !== id);
    setSavedQrs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_saved_qrs", JSON.stringify(updated));
    }
  };

  const handleDeleteScanHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = scanHistory.filter((item) => item.id !== id);
    setScanHistory(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_qr_scan_history", JSON.stringify(updated));
    }
  };

  const handleDownloadSaved = (item: SavedQr, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    const safeText = item.text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";
    link.download = `toolkit_pro_qr_${safeText}.png`;
    link.href = item.dataUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      {/* Parameters Controls Row: 5 Cols */}
      <div className="lg:col-span-12 xl:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1 col-span-1 border-0">
            <Settings className="w-4 h-4 text-indigo-500" /> Vector Settings
          </h3>
          <p className="text-xs text-slate-500">
            Specify links, content, and colors to generate beautiful vector tracking modules instantly.
          </p>
        </div>

        {/* Toggle Single / Batch Mode options */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInputMode("single")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
              inputMode === "single"
                ? "bg-white text-slate-800 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-500" />
            Single QR Code
          </button>
          <button
            type="button"
            onClick={() => setInputMode("batch")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
              inputMode === "batch"
                ? "bg-white text-slate-800 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-650 animate-pulse" />
            Batch Mode (CSV)
          </button>
        </div>

        {/* Dynamic Input Mode Forms */}
        {inputMode === "single" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Text or URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. https://google.com/"
                  className="w-full text-sm pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 transition-colors col-span-1"
                />
                {/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})/i.test(text) && text.length > 25 && (
                  <div className="absolute right-2 top-1.5">
                    <button
                      type="button"
                      onClick={() => handleShortenTextUrl()}
                      disabled={isShortening}
                      title="Micro Shorten Link tool"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/45 dark:hover:bg-indigo-950/80 transition-all border-0 cursor-pointer disabled:opacity-50"
                    >
                      {isShortening ? (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      ) : shortenSuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic URL scan & live check and optimization alerts */}
            {/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})/i.test(text) && (
              <div className="bg-slate-100/65 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-3 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    <Link className="w-3 h-3 text-indigo-500 animate-pulse" /> Link scannability analysis
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400">
                    Length: <span className="font-bold text-slate-700 dark:text-slate-300">{text.length} chars</span>
                  </span>
                </div>

                {text.length > 25 ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-1 pb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                        This URL is long ({text.length} chars). It leads to thicker modules which can sometimes delay scanner detection on older phones or low-light conditions.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleShortenTextUrl()}
                        disabled={isShortening}
                        className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50 gap-1.5 shadow-3xs"
                      >
                        {isShortening ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Compressing and Shortening Link...
                          </>
                        ) : shortenSuccess ? (
                          <>
                            <Check className="w-3 h-3" />
                            Success! Shortened QR Link Active
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-[bounce_1.4s_infinite]" />
                            Shorten URL to Boost Scan Performance
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-650 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Link structure optimized for maximum readability
                    </span>
                    {preShortenedUrl && text !== preShortenedUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setText(preShortenedUrl);
                          setPreShortenedUrl("");
                        }}
                        className="text-[9.5px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        Undo Shorten
                      </button>
                    )}
                  </div>
                )}

                {shortenError && (
                  <div className="text-[10px] text-red-650 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 px-2.5 py-1.5 rounded-lg border border-red-200/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    {shortenError}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-3xs">
            <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">
              📥 Multi-Link Batch Compiler
            </span>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleCsvUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById("batch-csv-uploader")?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 p-5 rounded-xl text-center cursor-pointer transition-all space-y-1.5 relative group col-span-1"
            >
              <input
                id="batch-csv-uploader"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCsvUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-550 mx-auto transition-colors" />
              <div>
                <span className="block text-[11px] font-bold text-slate-700">
                  {csvFile ? csvFile.name : "Select or Drop CSV Data"}
                </span>
                <span className="block text-[9.5px] text-slate-400 font-medium select-none">
                  Upload file listing columns of link endpoints
                </span>
              </div>
            </div>

            {importError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] leading-normal col-span-1">
                {importError}
              </div>
            )}

            {csvRows.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Parsed Rows:</span>
                    <span className="font-bold text-slate-700 bg-slate-200 px-1.5 rounded">{csvRows.length} found</span>
                  </div>

                  {/* Field Mapping */}
                  <div className="space-y-2 text-left">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Target Link Column</label>
                      <select
                        value={urlColumn}
                        onChange={(e) => setUrlColumn(e.target.value)}
                        className="w-full text-[10.5px] font-medium p-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-650"
                      >
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filename Strategy</label>
                      <select
                        value={namingStrategy}
                        onChange={(e) => setNamingStrategy(e.target.value as any)}
                        className="w-full text-[10.5px] font-medium p-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-650"
                      >
                        <option value="index">Index Suffix (e.g. qr_001.png)</option>
                        <option value="url">Domain Path Identifier (e.g. qr_google_com.png)</option>
                        {csvHeaders.length > 0 && <option value="column">Specific CSV Column Content</option>}
                      </select>
                    </div>

                    {namingStrategy === "column" && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Label / Name Column</label>
                        <select
                          value={nameColumn}
                          onChange={(e) => setNameColumn(e.target.value)}
                          className="w-full text-[10.5px] font-medium p-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-650"
                        >
                          <option value="">-- Choose Name Header --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Action button */}
                <button
                  type="button"
                  onClick={generateAndDownloadBatchZip}
                  disabled={batchGenerationProgress.active}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 border-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Generate Batch & Download ZIP
                </button>
              </div>
            )}

            {batchGenerationProgress.active && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                  <span className="truncate max-w-[150px]">{batchGenerationProgress.status}</span>
                  <span className="shrink-0 font-mono">{batchGenerationProgress.current} / {batchGenerationProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 transition-all duration-300"
                    style={{ width: `${(batchGenerationProgress.current / batchGenerationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Design options */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="w-4 h-4 text-indigo-500 animate-pulse" /> Color Customization
            </h4>
            <button
              type="button"
              onClick={() => {
                const temp = foregroundColor;
                setForegroundColor(backgroundColor);
                setBackgroundColor(temp);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg shadow-3xs cursor-pointer transition-all hover:scale-102"
              title="Invert foreground and background colors"
            >
              <RefreshCw className="w-3 h-3 text-indigo-500" /> Swap Colors
            </button>
          </div>

          {/* Contrast Alert/Score Card */}
          {(() => {
            const ratio = getContrastRatio(foregroundColor, backgroundColor);
            const passAAA = ratio >= 4.5;
            const passAA = ratio >= 3.0;

            let alertBg = "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400";
            let alertText = "❌ Low Scan Contrast. This might make the QR Code difficult or impossible to scan on some devices. Increase contrast!";
            let alertLabel = "Critical Contrast Warning";

            if (ratio >= 4.5) {
              alertBg = "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400";
              alertText = "🟢 High Contrast. Excellent scan reliability on all smartphone sensors and distance scales.";
              alertLabel = "Excellent Scanner Sync";
            } else if (ratio >= 3.0) {
              alertBg = "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-955/15 dark:border-amber-900/40 dark:text-amber-400";
              alertText = "⚠️ Moderate Contrast. Fully readable but might feel slightly sluggish in low-light environments.";
              alertLabel = "Fair Scan Contrast";
            }

            return (
              <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${alertBg}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {alertLabel}
                  </span>
                  <span className="font-mono bg-white/55 dark:bg-black/35 px-1.5 py-0.5 rounded text-[10px]">
                    {ratio.toFixed(2)}:1 Ratio
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90">{alertText}</p>
              </div>
            );
          })()}

          {/* Standard Controls Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Foreground */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Foreground (Dark)</label>
              </div>
              <div className="flex items-center space-x-1.5 bg-white border border-slate-205 rounded-xl p-1 shadow-2xs">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-150 shrink-0">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                  />
                </div>
                <input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("#") || val.length <= 7) {
                      setForegroundColor(val);
                    }
                  }}
                  placeholder="#000000"
                  className="w-full text-center text-xs font-mono font-bold text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 py-1 uppercase"
                />
              </div>

              {/* Quick single swatches */}
              <div className="flex flex-wrap gap-1.5 pt-0.5 justify-between">
                {["#000000", "#0f172a", "#1e1b4b", "#311054", "#7f1d1d", "#064e3b", "#0369a1"].map((color) => {
                  const active = foregroundColor.toLowerCase() === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForegroundColor(color)}
                      className={`w-4.5 h-4.5 rounded-md border transition-all cursor-pointer shadow-3xs ${
                        active ? "ring-2 ring-indigo-500 scale-110 border-white z-10" : "border-black/5 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Background */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Background (Light)</label>
              </div>
              <div className="flex items-center space-x-1.5 bg-white border border-slate-205 rounded-xl p-1 shadow-2xs">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-150 shrink-0">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                  />
                </div>
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("#") || val.length <= 7) {
                      setBackgroundColor(val);
                    }
                  }}
                  placeholder="#FFFFFF"
                  className="w-full text-center text-xs font-mono font-bold text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 py-1 uppercase"
                />
              </div>

              {/* Quick single swatches */}
              <div className="flex flex-wrap gap-1.5 pt-0.5 justify-between">
                {["#ffffff", "#fafaf9", "#fdf6e2", "#ecfdf5", "#f0f9ff", "#fdf4ff", "#e2e8f0"].map((color) => {
                  const active = backgroundColor.toLowerCase() === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={`w-4.5 h-4.5 rounded-md border transition-all cursor-pointer shadow-3xs ${
                        active ? "ring-2 ring-indigo-500 scale-110 border-white z-10" : "border-black/5 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dual Preset Color Pairing Row */}
          <div className="space-y-2 pt-1 pb-1">
            <span className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider block">Coordinated Designer Themes</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Classic Noir", fg: "#000000", bg: "#ffffff" },
                { name: "Ink & Cream", fg: "#1e1b4b", bg: "#fafaf9" },
                { name: "Plum Custard", fg: "#311054", bg: "#fdf6e2" },
                { name: "Forest Mint", fg: "#064e3b", bg: "#ecfdf5" },
                { name: "Ocean Breeze", fg: "#0369a1", bg: "#f0f9ff" },
                { name: "Slate Minimal", fg: "#0f172a", bg: "#f1f5f9" },
              ].map((preset, idx) => {
                const isActive = foregroundColor.toLowerCase() === preset.fg && backgroundColor.toLowerCase() === preset.bg;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setForegroundColor(preset.fg);
                      setBackgroundColor(preset.bg);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all border cursor-pointer select-none ${
                      isActive 
                        ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-500/10 shadow-3xs dark:bg-indigo-950/20" 
                        : "bg-white hover:bg-slate-50 border-slate-150 hover:border-slate-200 dark:bg-slate-900/10 dark:hover:bg-slate-800/10 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-center -space-x-1.5 mb-1 select-none">
                      <span 
                        className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-3xs z-10 shrink-0" 
                        style={{ backgroundColor: preset.fg }} 
                      />
                      <span 
                        className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-3xs shrink-0" 
                        style={{ backgroundColor: preset.bg }} 
                      />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-350 leading-tight block">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matrix Style templates & Gradient Selector */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 dark:text-slate-300">
              <Palette className="w-4 h-4 text-indigo-550" /> Matrix Style & Gradient Templates
            </h5>

            {/* Template Selection Grid */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-widest">
                Choose Preset Style Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MATRIX_STYLE_TEMPLATES.map((tpl) => {
                  const isActive = 
                    patternStyle === tpl.patternStyle &&
                    eyeStyle === tpl.eyeStyle &&
                    foregroundColor.toLowerCase() === tpl.foregroundColor.toLowerCase() &&
                    enableGradient === tpl.enableGradient &&
                    (!tpl.enableGradient || (gradientColor2.toLowerCase() === tpl.gradientColor2?.toLowerCase() && gradientType === tpl.gradientType));

                  return (
                    <button
                      type="button"
                      key={tpl.id}
                      onClick={() => handleApplyStyleTemplate(tpl)}
                      className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500/20 dark:bg-indigo-950/20 dark:border-indigo-500/80"
                          : "bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        {/* Interactive gradient indicator bubble */}
                        <div className={`w-5 h-5 rounded-full shadow-3xs shrink-0 ${tpl.badgeGradient}`} />
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate flex-1 leading-tight">
                          {tpl.name}
                        </span>
                        {isActive && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                      <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Gradient Customization */}
            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-550" /> Custom Color Gradients
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableGradient}
                    onChange={(e) => setEnableGradient(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 dark:bg-slate-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {enableGradient && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Two Color Pickers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">First Color (Start)</label>
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-1">
                        <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-150 shrink-0">
                          <input
                            type="color"
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                          />
                        </div>
                        <input
                          type="text"
                          value={foregroundColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith("#") || val.length <= 7) {
                              setForegroundColor(val);
                            }
                          }}
                          placeholder="#4F46E5"
                          className="w-full text-center text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-transparent border-0 focus:outline-none focus:ring-0 p-0.5 uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Second Color (End)</label>
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-1">
                        <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-150 shrink-0">
                          <input
                            type="color"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                          />
                        </div>
                        <input
                          type="text"
                          value={gradientColor2}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith("#") || val.length <= 7) {
                              setGradientColor2(val);
                            }
                          }}
                          placeholder="#EC4899"
                          className="w-full text-center text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-transparent border-0 focus:outline-none focus:ring-0 p-0.5 uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gradient Style Type Segmented Controls */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gradient Type</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      {(["linear", "radial"] as const).map((type) => {
                        const active = gradientType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setGradientType(type)}
                            className={`py-1 text-[9px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                              active
                                ? "bg-white text-slate-800 shadow-3xs dark:bg-slate-800 dark:text-white"
                                : "text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gradient direction (visible if linear) */}
                  {gradientType === "linear" && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flow Direction</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                        {(["diagonal", "horizontal", "vertical"] as const).map((dir) => {
                          const active = gradientDirection === dir;
                          return (
                            <button
                              key={dir}
                              type="button"
                              onClick={() => setGradientDirection(dir)}
                              className={`py-1 text-[9px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                                active
                                  ? "bg-white text-slate-800 shadow-3xs dark:bg-slate-800 dark:text-white"
                                  : "text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                              }`}
                            >
                              {dir}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aesthetic Shape Customization */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 dark:text-slate-300">
              <Shapes className="w-4 h-4 text-indigo-550" /> Aesthetic Pattern Styling
            </h5>

            {/* Visual Presets Selection Panel */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-550 shrink-0" /> Style Presets Panel
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeStyle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 border border-indigo-100/60 dark:border-indigo-900/50 rounded-lg cursor-pointer transition-all select-none shadow-3xs"
                  title="Cycle sequentially through Classical, Modern, Pixel Art, and other visual presets"
                  id="qr-randomize-style-btn"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-500 hover:rotate-180 transition-transform duration-300" />
                  Randomize Style
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {SHAPE_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`group relative text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? "bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500/30 dark:bg-indigo-950/20 dark:border-indigo-500/80"
                          : "bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      {/* Micro visual indicator block */}
                      <div className={`p-2 rounded-xl shrink-0 border transition-colors flex items-center justify-center ${
                        isActive 
                          ? "bg-indigo-600 text-white border-indigo-650" 
                          : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                      }`}>
                        {preset.patternStyle === "rounded-dots" && (
                          <div className="grid grid-cols-2 gap-1 w-5 h-5 items-center justify-items-center">
                            <span className="w-2 h-2 rounded-full bg-current" />
                            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                            <span className="w-2 h-2 rounded-full bg-current" />
                          </div>
                        )}
                        {preset.patternStyle === "squares" && (
                          <div className="grid grid-cols-2 gap-1 w-5 h-5 items-center justify-items-center">
                            <span className="w-2 h-2 rounded-2xs bg-current" />
                            <span className="w-2 h-2 rounded-2xs bg-current opacity-60" />
                            <span className="w-2 h-2 rounded-2xs bg-current opacity-60" />
                            <span className="w-2 h-2 rounded-2xs bg-current" />
                          </div>
                        )}
                        {preset.patternStyle === "dots" && (
                          <div className="grid grid-cols-3 gap-0.5 w-5 h-5 items-center justify-items-center animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                          </div>
                        )}
                        {preset.patternStyle === "diamonds" && (
                          <div className="relative w-5 h-5 flex items-center justify-center">
                            <span className="absolute w-2.5 h-2.5 rotate-45 bg-current shrink-0" />
                          </div>
                        )}
                        {preset.patternStyle === "rounded" && (
                          <div className="grid grid-cols-2 gap-1 w-5 h-5 items-center justify-items-center">
                            <span className="w-2 h-2 rounded-sm bg-current" />
                            <span className="w-1.5 h-1.5 rounded-xs bg-current opacity-50" />
                            <span className="w-1.5 h-1.5 rounded-xs bg-current opacity-50" />
                            <span className="w-2 h-2 rounded-sm bg-current" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-950 dark:group-hover:text-indigo-450 truncate">
                            {preset.name}
                          </span>
                          {isActive ? (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 roundedbg-indigo-100 text-indigo-750 dark:bg-indigo-900/40 dark:text-indigo-300 shrink-0 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" /> Active
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0 select-none">
                              Preset
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {activePresetId === "custom" && (
                  <div className="text-center p-2.5 rounded-xl border border-dashed border-amber-200 bg-amber-50/30 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1.5 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Custom Configuration (Modified Fine Parameters)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Data pattern selection */}
              <div className="space-y-1.5">
                <label htmlFor="pattern-style-selector" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Data Module Shape
                </label>
                <div id="pattern-style-selector" className="grid grid-cols-2 gap-1.5 bg-slate-100/60 p-1 rounded-xl dark:bg-slate-900/50">
                  {[
                    { key: "squares", label: "Square" },
                    { key: "dots", label: "Circular" },
                    { key: "rounded-dots", label: "Rounded-Dot" },
                    { key: "rounded", label: "Rounded" },
                    { key: "diamonds", label: "Diamonds" }
                  ].map((p) => {
                    const isSelected = patternStyle === p.key;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => setPatternStyle(p.key as any)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                          isSelected
                            ? "bg-white text-slate-900 shadow-3xs dark:bg-slate-800 dark:text-white"
                            : "text-slate-550 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eye shape selection */}
              <div className="space-y-1.5">
                <label htmlFor="eye-style-selector" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Finder Shape (Eyes)
                </label>
                <div id="eye-style-selector" className="grid grid-cols-3 gap-1 bg-slate-100/60 p-1 rounded-xl dark:bg-slate-900/50">
                  {[
                    { key: "squares", label: "Classic" },
                    { key: "circle", label: "Circle" },
                    { key: "rounded", label: "Round" }
                  ].map((eStyle) => {
                    const isSelected = eyeStyle === eStyle.key;
                    return (
                      <button
                        type="button"
                        key={eStyle.key}
                        onClick={() => setEyeStyle(eStyle.key as any)}
                        className={`py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                          isSelected
                            ? "bg-white text-slate-900 shadow-3xs dark:bg-slate-800 dark:text-white"
                            : "text-slate-550 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                        }`}
                      >
                        {eStyle.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Layout Size (px)</label>
                <input
                  type="range"
                  min="150"
                  max="400"
                  step="25"
                  value={size}
                  onChange={(e) => {
                    setSize(parseInt(e.target.value));
                    setAutoOptimizeDensity(false);
                  }}
                  className="w-full accent-indigo-650 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">{size}x{size} px</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/55 dark:border-slate-800/60 text-left">
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="qr-quiet-zone-margin-slider" className="block text-[11px] font-black uppercase text-slate-705 dark:text-slate-300 tracking-wider flex items-center gap-1">
                    📐 Quiet Zone (Margin)
                  </label>
                  <span className="text-[10px] font-bold text-indigo-750 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
                    {margin} {margin === 1 ? "block" : "blocks"}
                  </span>
                </div>
                
                <input
                  id="qr-quiet-zone-margin-slider"
                  type="range"
                  min="0"
                  max="12"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full accent-indigo-650 dark:accent-indigo-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none transition-all hover:bg-slate-300 dark:hover:bg-slate-800"
                  title="Control safe padding margin blocks around the QR code matrix"
                />

                <div className="mt-2.5 flex items-center justify-between text-[9px] font-extrabold select-none">
                  <button 
                    type="button" 
                    onClick={() => setMargin(0)} 
                    className="text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer p-0"
                  >
                    0 (None)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMargin(4)} 
                    className="text-indigo-600/80 hover:text-indigo-700 bg-transparent border-0 cursor-pointer p-0 underline decoration-dotted"
                  >
                    4 (Recommended Std)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMargin(8)} 
                    className="text-slate-500 hover:text-indigo-600 bg-transparent border-0 cursor-pointer p-0"
                  >
                    8 (Broad)
                  </button>
                </div>
                
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                  Adjust padding around the QR code before rendering. Safe padding prevents surrounding text or background artwork from blocking dynamic optical scanners.
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-slate-500">Preview Scale</label>
                <button
                  type="button"
                  onClick={() => setPreviewScale(100)}
                  className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer bg-transparent border-0"
                  title="Reset preview scale to 100%"
                >
                  Reset (100%)
                </button>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={previewScale}
                onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                className="w-full accent-indigo-650 cursor-pointer"
              />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block text-right mt-0.5">{previewScale}% visual zoom</span>
            </div>

            {/* DPI Resolution Toggle Switch */}
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200/50 dark:border-slate-800/60 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-705 dark:text-slate-300 tracking-wider flex items-center gap-1">
                    🖨️ Print Resolution (DPI)
                  </span>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-505 mt-0.5 leading-normal">
                    {highDpi 
                      ? "High DPI Mode (4x Resolution, Crisp Print/Publish)" 
                      : "Low DPI Mode (1x Resolution, Fast Preview/Screen)"}
                  </p>
                </div>
                <button
                  id="qr-dpi-toggle"
                  type="button"
                  onClick={() => setHighDpi(prev => !prev)}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    highDpi ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      highDpi ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex justify-between text-[9px] font-mono text-slate-400 dark:text-slate-505">
                <span>Output Canvas Dimensions:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {highDpi ? `${size * 4}x${size * 4} px (High Res)` : `${size}x${size} px (Low Res)`}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-150 dark:border-slate-900 space-y-2.5">
              {/* Intelligent Scanability Auto-Tuning Engine */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-950/20 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40 select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-550 dark:text-indigo-400 animate-pulse" /> Auto-Tune Density Guard
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoOptimizeDensity}
                      onChange={(e) => setAutoOptimizeDensity(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all"></div>
                  </label>
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal mb-2">
                  Dynamically scales pixel sizing and shifts Reed-Solomon level to secure peak mobile legibility based on <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">{text.length} characters</span> input length.
                </p>
                {autoOptimizeDensity && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9.5px] font-extrabold font-mono">
                    <span>⚡ Calibrated: {size}x{size}px • ECC Level {errorCorrectionLevel}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label id="qr-ecc-label" htmlFor="qr-ecc-dropdown" className="text-[11px] font-bold text-slate-705 uppercase tracking-wider dark:text-slate-350 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-550 shrink-0" /> Reed-Solomon Error Correction
                  </label>
                  <span className="text-[9.5px] font-mono font-bold text-indigo-550 bg-indigo-50/50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                    Level {errorCorrectionLevel} Density
                  </span>
                </div>

                {/* Quick-select segment buttons for instant choice */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                  {([
                    { key: "L", label: "L - 7%", tooltip: "Lowest density, best for long text / links" },
                    { key: "M", label: "M - 15%", tooltip: "Standard balance, default standard use" },
                    { key: "Q", label: "Q - 25%", tooltip: "High reliability, tolerates partial damage" },
                    { key: "H", label: "H - 30%", tooltip: "Highest recovery, recommended for logo overlays" }
                  ] as const).map((lvl) => {
                    const isSelected = errorCorrectionLevel === lvl.key;
                    return (
                      <button
                        type="button"
                        key={lvl.key}
                        onClick={() => {
                          setErrorCorrectionLevel(lvl.key);
                          setAutoOptimizeDensity(false);
                        }}
                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border-0 flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-white text-slate-900 shadow-3xs dark:bg-slate-800 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700"
                            : "text-slate-550 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                        }`}
                        title={lvl.tooltip}
                      >
                        <span className="text-xs font-black">{lvl.key}</span>
                        <span className="text-[8px] opacity-75 font-normal">{lvl.key === "L" ? "~7%" : lvl.key === "M" ? "~15%" : lvl.key === "Q" ? "~25%" : "~30%"}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Descriptive dropdown select control */}
                <div className="relative">
                  <select
                    id="qr-ecc-dropdown"
                    value={errorCorrectionLevel}
                    aria-labelledby="qr-ecc-label"
                    onChange={(e) => {
                      setErrorCorrectionLevel(e.target.value as "L" | "M" | "Q" | "H");
                      setAutoOptimizeDensity(false);
                    }}
                    className="w-full text-xs pl-3.5 pr-8 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-600 font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-3xs hover:border-slate-350 dark:hover:border-slate-705 transition-colors"
                  >
                    <option value="L">Level L (~7% Data Recovery - Lowest Density & Maximum Sizing)</option>
                    <option value="M">Level M (~15% Data Recovery - Standard Optimal Balance)</option>
                    <option value="Q">Level Q (~25% Data Recovery - Enhanced Environmental Tolerance)</option>
                    <option value="H">Level H (~30% Data Recovery - Maximum Protection & Ideal for Logos)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Information Display Card & Scannability Score */}
              {(() => {
                const scannability = getScannabilityScore();
                
                // Set color theme depending on status
                let borderStyle = "border-slate-150 dark:border-slate-800/60";
                let bgStyle = "bg-slate-50 dark:bg-slate-900/40";
                let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                let progressColor = "bg-indigo-650";
                
                if (scannability.status === "critical") {
                  borderStyle = "border-red-200 dark:border-red-955/50 ring-1 ring-red-500/10";
                  bgStyle = "bg-red-50/30 dark:bg-red-955/15";
                  badgeColor = "bg-red-500 text-white animate-pulse";
                  progressColor = "bg-red-600";
                } else if (scannability.status === "warning") {
                  borderStyle = "border-amber-300/80 dark:border-amber-955/50";
                  bgStyle = "bg-amber-50/20 dark:bg-amber-955/10";
                  badgeColor = "bg-amber-450 text-slate-950 font-black";
                  progressColor = "bg-amber-500";
                } else if (scannability.status === "good") {
                  borderStyle = "border-emerald-200/70 dark:border-emerald-955/40";
                  bgStyle = "bg-emerald-50/10 dark:bg-emerald-955/5";
                  badgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-400";
                  progressColor = "bg-emerald-500";
                } else {
                  borderStyle = "border-teal-200/60 dark:border-teal-955/40";
                  bgStyle = "bg-teal-50/10 dark:bg-teal-955/5";
                  badgeColor = "bg-teal-500 text-white";
                  progressColor = "bg-teal-550";
                }

                return (
                  <div className={`p-4 rounded-xl border transition-all select-none space-y-3.5 ${borderStyle} ${bgStyle}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        🛡️ Scannability Score
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeColor}`}>
                        {scannability.status}
                      </span>
                    </div>

                    {/* Progress bar and numeric score row */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-slate-850 dark:text-slate-150">
                        <div className="flex items-center gap-1 text-[11px] select-none text-amber-500">
                          <span>{"★".repeat(scannability.stars)}</span>
                          <span className="text-slate-300 dark:text-slate-700">{"★".repeat(5 - scannability.stars)}</span>
                        </div>
                        <span className="font-mono text-xs">{scannability.score} <span className="text-[10px] text-slate-450 font-normal">/ 100</span></span>
                      </div>
                      <div className="w-full bg-slate-200/65 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ease-out rounded-full ${progressColor}`}
                          style={{ width: `${scannability.score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-150/55 dark:border-slate-800/40">
                      <span className="text-sm shrink-0" aria-hidden="true">
                        {scannability.status === "excellent" && "✨"}
                        {scannability.status === "good" && "✅"}
                        {scannability.status === "warning" && "⚠️"}
                        {scannability.status === "critical" && "🚨"}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-705 dark:text-slate-350">
                          {errorCorrectionLevel === "L" && "ECC Level L — Low Recovery Capacity"}
                          {errorCorrectionLevel === "M" && "ECC Level M — Standard Balanced Grid"}
                          {errorCorrectionLevel === "Q" && "ECC Level Q — Broad Environmental Tolerance"}
                          {errorCorrectionLevel === "H" && "ECC Level H — Maximum Damage Tolerance"}
                        </p>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-405 leading-relaxed">
                          {scannability.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Logo Overlay Customizer */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-550" /> QR Code Center Overlay
              </label>
              {logoDataUrl && (
                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={useLogo} 
                      onChange={(e) => setUseLogo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-1.5 text-[10px] font-medium text-slate-500">
                      {useLogo ? "Active" : "Disabled"}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* If no custom logo has been uploaded, offer drag & drop and preset vector buttons */}
            {!logoDataUrl ? (
              <div className="space-y-3">
                <div 
                  onDragEnter={handleLogoDrag}
                  onDragOver={handleLogoDrag}
                  onDragLeave={handleLogoDrag}
                  onDrop={handleLogoDrop}
                  className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer group ${
                    logoDragActive 
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99] shadow-inner" 
                      : "border-slate-300 hover:border-indigo-550 dark:border-slate-700 dark:hover:bg-slate-900/30"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    id="qr-logo-upload"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <Upload className={`w-6 h-6 transition-all duration-300 mb-2 ${
                      logoDragActive 
                        ? "text-emerald-500 scale-110 animate-bounce" 
                        : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500"
                    }`} />
                    <p className={`text-xs font-bold transition-colors ${
                      logoDragActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {logoDragActive ? "Drop your brand logo here!" : "Upload Custom Center Logo Image"}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-450 mt-1">
                      Drag & drop your file or click to browse
                    </p>
                    <p className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                      PNG, JPG, or SVG. Autocropped to a perfect square without distorting ratio.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Or Choose a Preset Icon Template
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LOGO_PRESETS.map((preset) => {
                      const IconComponent = preset.icon;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setLogoDataUrl(preset.dataUrl);
                            setLogoName(preset.name);
                            setUseLogo(true);
                          }}
                          className="flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-semibold bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg transition-all cursor-pointer text-center"
                        >
                          <IconComponent className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Active Logo Header bar */}
                <div className="flex items-center justify-between bg-slate-50/60 border border-slate-200 p-2 rounded-xl">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                      <img 
                        src={logoDataUrl} 
                        alt="Logo Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate" title={logoName}>
                        {logoName}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {logoDataUrl.startsWith("data:image/svg+xml") ? "Vector Preset" : `Size: ~${Math.round(logoDataUrl.length / 1.33 / 1024)} KB`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer shrink-0"
                    title="Remove logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Adjust shape container */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Backdrop Mask Container
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "rounded", label: "Rounded Rect" },
                      { key: "circle", label: "Circular" },
                      { key: "square", label: "Sharp Square" }
                    ].map((shape) => {
                      const isActive = logoShape === shape.key;
                      return (
                        <button
                          key={shape.key}
                          type="button"
                          onClick={() => setLogoShape(shape.key as any)}
                          className={`py-1.5 px-2 text-[10.5px] font-bold border rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? "bg-slate-900 border-slate-900 text-white shadow-3xs"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          {shape.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Relative overlay scaling size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Relative Logo Scaling</span>
                    <span className="font-mono text-indigo-600">{logoScale}% of QR size</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="30"
                      value={logoScale}
                      onChange={(e) => setLogoScale(parseInt(e.target.value))}
                      className="flex-grow accent-indigo-650 cursor-pointer h-1 bg-slate-100 rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-slate-450 shrink-0 select-none">
                      (10 – 30%)
                    </span>
                  </div>
                </div>

                {/* Logo padding customizer (Quiet zone spacer) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Logo Mask Padding (Quiet Zone)</span>
                    <span className="font-mono text-indigo-600">{logoPadding} px</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={logoPadding}
                      onChange={(e) => setLogoPadding(parseInt(e.target.value))}
                      className="flex-grow accent-indigo-650 cursor-pointer h-1 bg-slate-100 rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-slate-450 shrink-0 select-none">
                      (0 – 12px)
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-snug">
                    Specifies an empty padding zone surrounding the center logo container to block out nearby modules, ensuring optimal scan compatibility.
                  </p>
                </div>

                {logoScale > 22 && (
                    <div className="flex items-start gap-1 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-800 leading-normal select-none">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-650 shrink-0 mt-0.5" />
                      <div>
                        <strong>Scan Alert:</strong> Set error level to <strong>Level H</strong> (under settings above) for optimal readability with larger overlays.
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Frame Templates & Labels Configuration Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-505" /> Frame Style Customizer
            </h4>
            <span className="text-[10px] bg-indigo-50 text-indigo-605 font-bold px-2 py-0.5 rounded-full select-none">
              CTA Wrappers
            </span>
          </div>

          <p className="text-[10.5px] text-slate-500 leading-normal">
            Enhance user engagement by selecting custom-drawn border shapes and action-oriented label frames to wrap beautifully around your QR code.
          </p>

          {/* Border Shape Contour Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              1. Choose Border Shape
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "square", label: "Square", icon: "▢" },
                { id: "rounded", label: "Rounded", icon: "⌢" },
                { id: "brackets", label: "Brackets", icon: "⎾⎿" },
                { id: "double-line", label: "Double-Line", icon: "⧉" }
              ].map((shp) => {
                const isActive = frameBorderShape === shp.id;
                const isDisabled = frameStyle === "none";
                return (
                  <button
                    type="button"
                    key={shp.id}
                    disabled={isDisabled}
                    onClick={() => setFrameBorderShape(shp.id as any)}
                    className={`px-1 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[10px] font-bold h-13 ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50/50 text-slate-400"
                        : isActive
                        ? "border-indigo-600 bg-indigo-50/10 text-indigo-950 font-black shadow-3xs"
                        : "border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-650"
                    }`}
                  >
                    <span className="text-sm leading-none font-mono">{shp.icon}</span>
                    <span className="truncate max-w-full">{shp.label}</span>
                  </button>
                );
              })}
            </div>
            {frameStyle === "none" && (
              <p className="text-[9px] text-amber-600 italic">
                Enable a label frame template below to unlock custom border shapes.
              </p>
            )}
          </div>

          {/* Label Frame Selector Loop */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              2. Select Action Label Frame
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "none", label: "No Frame", desc: "Raw QR code contours" },
                { id: "scan-me", label: "Scan Me", desc: "Universal high-conversion banner" },
                { id: "website", label: "Website", desc: "Displays centered WEBSITE text" },
                { id: "contact", label: "Contact", desc: "Displays centered CONTACT text" },
                { id: "visit-website", label: "Visit Website", desc: "Short centered CTA banner" },
                { id: "join-us", label: "Join Us", desc: "Top header label banner layout" },
                { id: "feedback", label: "Feedback", desc: "Bottom GIVER FEEDBACK CTA" },
                { id: "custom-frame", label: "Custom Text", desc: "Type your own action string" }
              ].map((tmpl) => {
                const isActive = frameStyle === tmpl.id;
                return (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => setFrameStyle(tmpl.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer flex flex-col justify-between group relative h-16 ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-500 text-indigo-950"
                        : "border-slate-150 bg-slate-50/30 text-slate-700"
                    }`}
                  >
                    <span className="text-[11.5px] font-black block group-hover:text-indigo-600 leading-tight">
                      {tmpl.label}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1 truncate max-w-full">
                      {tmpl.desc}
                    </span>
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom label writer if custom template option is selected */}
          {frameStyle === "custom-frame" && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label 
                htmlFor="frame-custom-text-input" 
                className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Custom Banner Label Text
              </label>
              <div className="relative">
                <input
                  id="frame-custom-text-input"
                  type="text"
                  maxLength={18}
                  placeholder="e.g., CONTACT US"
                  value={frameCustomText}
                  onChange={(e) => setFrameCustomText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none transition-all pr-12 font-bold uppercase"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400">
                  {frameCustomText.length}/18
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 italic">
                Will be automatically capitalized and centered for pristine vector alignment.
              </p>
            </div>
          )}
        </div>

        {/* Text Label Overlay Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Type className="w-4 h-4 text-indigo-505" /> Text Label Overlay
            </h4>
            <div className="flex items-center space-x-2">
              <label htmlFor="text-overlay-toggle" className="inline-flex items-center cursor-pointer select-none">
                <input 
                  id="text-overlay-toggle"
                  type="checkbox" 
                  checked={enableTextOverlay} 
                  onChange={(e) => setEnableTextOverlay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-8 h-4.5 bg-slate-250 checked:bg-indigo-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-650"></div>
                <span className="ms-2 text-[10.5px] font-bold text-slate-600">
                  {enableTextOverlay ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>

          <p className="text-[10.5px] text-slate-500 leading-normal">
            Place a custom text caption either above or below the QR Code frame with professional typography controls.
          </p>

          {enableTextOverlay && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Overlay Text Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Overlay Text Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. ✨ SCAN TO VIEW MENU ✨"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-hidden transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              {/* Overlay Position */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Overlay Position Placement
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100/70 p-1 rounded-xl">
                  {(["above", "below"] as const).map((pos) => {
                    const isSelected = overlayPosition === pos;
                    return (
                      <button
                        type="button"
                        key={pos}
                        onClick={() => setOverlayPosition(pos)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 capitalize ${
                          isSelected
                            ? "bg-white text-slate-900 shadow-3xs"
                            : "text-slate-550 hover:text-slate-700"
                        }`}
                      >
                        {pos} Frame
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid 2 Column Controls: Font Family & Font Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Font Family Pairing
                  </label>
                  <select
                    value={overlayFontFamily}
                    onChange={(e) => setOverlayFontFamily(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-650 font-medium text-slate-700 cursor-pointer shadow-3xs"
                  >
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="Inter">Inter (Classic Sans)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Mono Code)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Outfit">Outfit (Modern Display)</option>
                    <option value="Georgia">Georgia (Editorial Serif)</option>
                    <option value="Comic Sans MS">Comic Sans (Casual)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Font Weight Thickness
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-105/10 p-1 rounded-xl">
                    {(["normal", "bold", "black"] as const).map((wt) => {
                      const isSelected = overlayFontWeight === wt;
                      return (
                        <button
                          type="button"
                          key={wt}
                          onClick={() => setOverlayFontWeight(wt)}
                          className={`py-1 text-[9.5px] font-bold rounded-md transition-all cursor-pointer border-0 capitalize ${
                            isSelected
                              ? "bg-white text-slate-900 shadow-3xs"
                              : "text-slate-550 hover:text-slate-700"
                          }`}
                        >
                          {wt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slider for Font Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Overlay Label Font Size
                  </label>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-605 px-1.5 py-0.5 rounded">
                    {overlayFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={overlayFontSize}
                  onChange={(e) => setOverlayFontSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-650 h-1 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Font Color Customizer */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Text Overlay Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOverlayColor("")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      overlayColor === ""
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                    }`}
                  >
                    Match Foreground (Auto)
                  </button>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg bg-slate-50/50 p-1.5 flex-1 shadow-3xs">
                    <input
                      type="color"
                      value={overlayColor || foregroundColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={overlayColor || foregroundColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("#") || val.length === 0) {
                          setOverlayColor(val);
                        }
                      }}
                      className="bg-transparent text-xs font-mono font-bold w-16 text-slate-705 outline-hidden border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen Preview: 7 Cols */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-between space-y-4">
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

        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-3.5 sm:p-6 min-h-[280px] sm:min-h-[350px]">
          {/* Visual scale control bar directly contextualized to the preview card */}
          {qrCodeDataUrl && !isGenerating && (
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4 gap-3 select-none">
              <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-500 animate-pulse" /> Vector Canvas Stage
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Active Scan Indicator Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={enableScanLine}
                    onChange={(e) => setEnableScanLine(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-7.5 h-4.5 bg-slate-200 dark:bg-slate-850 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:start-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600"></div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-300">
                    Scan Effect
                  </span>
                </label>

                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1 shrink-0">
                    Scale:
                  </span>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    step="5"
                    value={previewScale}
                    onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                    className="w-16 sm:w-24 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                  <span className="text-[10.5px] font-extrabold text-indigo-650 dark:text-indigo-400 font-mono w-9 text-right shrink-0">
                    {previewScale}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center">
            {isGenerating ? (
              <div className="space-y-4 flex flex-col items-center animate-pulse">
                <div className="p-4 bg-white shadow-xl rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden w-48 h-48 relative">
                  <div className="grid grid-cols-2 gap-2 w-full h-full p-2 opacity-25">
                    <div className="border-4 border-slate-800 rounded w-12 h-12" />
                    <div className="border-4 border-slate-800 rounded w-12 h-12 justify-self-end" />
                    <div className="border-4 border-slate-800 rounded w-12 h-12 mt-auto" />
                    <div className="bg-slate-800 rounded w-12 h-12 justify-self-end mt-auto flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="h-4 bg-slate-300 rounded w-32 mt-2" />
                <div className="h-3 bg-slate-200 rounded-full w-48 mt-1" />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="space-y-4 flex flex-col items-center select-all w-full">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-2xl">
                  <div className="relative shrink-0">
                    <motion.div 
                      key={qrCodeDataUrl}
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      id="qr-code-preview-card" 
                      className="relative print-ready-qr-card bg-white shadow-xl rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden transition-all duration-250 select-none"
                      style={{
                        padding: `${Math.round(16 * (previewScale / 100))}px`,
                        width: `${Math.round((Math.min(260, size) + 32) * (previewScale / 100))}px`,
                        height: `${Math.round((Math.min(260, size) + 32) * (previewScale / 100))}px`,
                      }}
                    >
                      <img
                        src={qrCodeDataUrl}
                        alt="Custom QR Code"
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          filter: testLabActive 
                            ? `blur(${simulatedBlur}px) brightness(${simulatedBrightness}%) contrast(${simulatedContrast}%)` 
                            : undefined,
                          transform: testLabActive && simulatedTilt 
                            ? "perspective(420px) rotateX(14deg) rotateY(-11deg) scale(0.9)" 
                            : undefined,
                          transition: "filter 0.15s ease-out, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                        }}
                        className="max-w-full"
                      />
                      {testLabActive && isLensDirty && (
                        <div 
                          className="absolute inset-0 pointer-events-none z-15 select-none transition-all duration-200"
                          style={{
                            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 30%, transparent 65%)"
                          }}
                        />
                      )}
                      
                      {testLabActive && (
                        <div className="absolute inset-0 pointer-events-none z-20 border border-indigo-500/10 rounded-2xl flex flex-col justify-between p-2">
                          {/* Symmetrical camera corner brackets */}
                          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-500/60" />
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-500/60" />
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-500/60" />
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-500/60" />

                          {/* Target focal reticle in the center */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                            <div className={`w-6 h-6 border rounded-full ${simScanResult?.success ? 'border-emerald-500/40 animate-ping' : 'border-rose-500/40 animate-pulse'} duration-1000`} />
                            <div className={`absolute w-1.5 h-1.5 rounded-full ${simScanResult?.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>

                          {/* Live camera sensor feeds */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/85 border border-slate-700/65 rounded px-1.5 py-0.5 text-[7px] font-mono font-bold text-slate-300 tracking-wide flex items-center gap-1">
                            <span className={`w-1 h-1 rounded-full ${isSimScanChecking ? 'bg-amber-450 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                            [SENSOR FEED 250px]
                          </div>

                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-slate-800/80 rounded-md px-2 py-0.5 text-[8px] font-black tracking-widest text-center shadow-md animate-pulse">
                            {simScanResult?.success ? (
                              <span className="text-emerald-400 font-mono">SCANNABLE</span>
                            ) : (
                              <span className="text-rose-400 font-mono font-bold">UNREADABLE</span>
                            )}
                          </div>
                        </div>
                      )}
                      {enableScanLine && (
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] opacity-85 pointer-events-none print:hidden z-10 animate-active-qr-scan"
                        />
                      )}
                      
                      {isScanningLaserActive && (
                        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 backdrop-blur-[0.5px] pointer-events-none z-20 flex flex-col items-center justify-between overflow-hidden print:hidden">
                          {/* Corner custom brackets */}
                          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-tl" />
                          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-tr" />
                          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-bl" />
                          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-br" />
                          
                          {/* Neon glow effect container trailing */}
                          <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ top: ["4%", "96%", "4%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              ease: "easeInOut"
                            }}
                            className="absolute left-2.5 right-2.5 h-16 bg-gradient-to-b from-indigo-500/0 via-indigo-500/15 to-indigo-500/0 -translate-y-1/2 pointer-events-none"
                          />

                          {/* Dual highly realistic scanning laser sweep beams */}
                          <motion.div
                            initial={{ top: "4%" }}
                            animate={{ top: ["4%", "96%", "4%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              ease: "easeInOut"
                            }}
                            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_#6366f1,0_0_4px_#ffffff] z-25 pointer-events-none"
                          />

                          {/* Dynamic Calibration status HUD text */}
                          <div className="absolute bottom-3 left-1/2 -combine-translate-x-1/2 -translate-x-1/2 bg-indigo-950/90 border border-indigo-500/45 text-[8.5px] font-extrabold uppercase tracking-widest text-indigo-300 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md animate-pulse">
                            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>Calibrating...</span>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Scanning Simulation overlay */}
                    {showScanSimulator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/90 text-white rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-md select-none border border-slate-800 z-50 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => setShowScanSimulator(false)}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white transition-all bg-transparent border-0 cursor-pointer"
                        title="Close Overlay"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {isSimulatingScan ? (
                        <div className="flex flex-col items-center justify-center space-y-3 w-full h-full relative overflow-hidden">
                          {/* Pulsing Scan Line anim */}
                          <motion.div
                            animate={{ y: ["-100%", "100%", "-100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] opacity-75"
                          />
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                          <div className="text-center">
                            <p className="text-xs font-black tracking-widest text-slate-300 uppercase">Camera Verification</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Analyzing matrix compliance...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-3.5 w-full h-full p-2">
                          {scanTestResult?.success ? (
                            <>
                              <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-emerald-400 tracking-wider">PASSED DIAGNOSTICS</h4>
                                <p className="text-[9.5px] text-slate-400 mt-1 leading-normal max-w-[200px] mx-auto">
                                  Readable by standard iOS, Android and industrial grade QR scanners.
                                </p>
                              </div>

                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl w-full text-left space-y-1 font-mono text-[9px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Decoded data:</span>
                                  <span className="text-slate-300 truncate max-w-[135px]" title={scanTestResult.decodedText}>
                                    {scanTestResult.decodedText}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Read Time:</span>
                                  <span className="text-emerald-400 font-bold">{scanTestResult.timeMs}ms</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">ECC Level:</span>
                                  <span className="text-indigo-400">{scanTestResult.errorCorrection}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Contrast Ratio:</span>
                                  <span className={`font-bold ${parseFloat(scanTestResult.contrastRatio || "0") >= 4.5 ? "text-emerald-400" : "text-amber-400"}`}>
                                    {scanTestResult.contrastRatio}:1
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-rose-400" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-rose-400 tracking-wider">FAILED DIAGNOSTICS</h4>
                                <p className="text-[9.5px] text-slate-400 mt-1 leading-normal max-w-[200px] mx-auto">
                                  QR code is blocked or has insufficient color contrast. Try adjusting margins, increasing contrast, or decreasing logo size.
                                </p>
                              </div>

                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl w-full text-left space-y-1 font-mono text-[9px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Read Status:</span>
                                  <span className="text-rose-400 font-bold">Unreadable</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Contrast Ratio:</span>
                                  <span className="text-amber-400">{scanTestResult?.contrastRatio}:1</span>
                                </div>
                              </div>
                            </>
                          )}

                          <button
                            onClick={runLocalScanTest}
                            type="button"
                            className="mt-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-[10px] font-bold rounded-lg border-0 cursor-pointer shadow-3xs flex items-center gap-1 mx-auto"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-Scan
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Real-Time 'Test Scan' overlay / diagnostic HUD component */}
                  <div className="mt-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs w-full max-w-[280px] mx-auto select-none transition-all">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                          Test Scan HUD
                        </span>
                      </div>
                      {/* Live status dot */}
                      <div className="flex items-center gap-1">
                        <span className={`relative flex h-2 w-2`}>
                          {liveScannable === true && (
                            <>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </>
                          )}
                          {liveScannable === false && (
                            <>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </>
                          )}
                          {liveScannable === null && (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 animate-pulse"></span>
                          )}
                        </span>
                        <span className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {liveScannable === true ? "Ready" : liveScannable === false ? "Issues" : "Reading"}
                        </span>
                      </div>
                    </div>

                    {/* Scannability Rating & Score Display */}
                    {(() => {
                      const scannability = getScannabilityScore();
                      let scoreColor = "text-emerald-500 dark:text-emerald-400";
                      let scoreBg = "bg-emerald-500";
                      if (scannability.score <= 40) {
                        scoreColor = "text-rose-500 dark:text-rose-400";
                        scoreBg = "bg-rose-500";
                      } else if (scannability.score <= 70) {
                        scoreColor = "text-amber-500 dark:text-amber-400";
                        scoreBg = "bg-amber-500";
                      } else if (scannability.score <= 88) {
                        scoreColor = "text-indigo-550 dark:text-indigo-400";
                        scoreBg = "bg-indigo-650";
                      }

                      return (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                              Readability Score
                            </span>
                            <span className={`text-xs font-black ${scoreColor} font-mono`}>
                              {scannability.score} / 100
                            </span>
                          </div>

                          {/* Custom visual horizontal progress meter */}
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreBg} rounded-full transition-all duration-300`}
                              style={{ width: `${scannability.score}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-slate-500 capitalize font-bold">
                              Rating: {scannability.status}
                            </span>
                            <span className="text-slate-400 flex items-center gap-0.5">
                              {"★".repeat(scannability.stars)}
                              {"☆".repeat(5 - scannability.stars)}
                            </span>
                          </div>

                          {/* Real-Time Decode Verifier Banner */}
                          <div className="border border-slate-205 dark:border-slate-800 rounded-xl p-2 bg-white dark:bg-slate-950 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] font-semibold text-slate-400 uppercase">
                                Compliance Decode Check
                              </span>
                              {liveScannable === true ? (
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md leading-none flex items-center gap-0.5 select-none">
                                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Passed
                                </span>
                              ) : liveScannable === false ? (
                                <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md leading-none flex items-center gap-0.5 select-none">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Failed
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-450 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md leading-none flex items-center gap-0.5 select-none">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin shrink-0" /> Decoding
                                </span>
                              )}
                            </div>

                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                              {liveScannable === true
                                ? "The matrix can be resolved instantly by standard camera lens configurations and decoders."
                                : liveScannable === false
                                ? "The binary patterns are blocked or lack required contrast. Readers may fail to focus."
                                : "Running automated pixel matrix calculations on generated canvas stream..."}
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 dark:border-slate-905 pt-1.5 text-[8.5px] font-mono select-text">
                              <div className="flex flex-col">
                                <span className="text-slate-400">Read Cost:</span>
                                <span className="text-indigo-650 dark:text-indigo-400 font-bold">
                                  {liveScanTimeMs ? `${liveScanTimeMs} ms` : "Calculating..."}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-400">ECC Level:</span>
                                <span className="text-slate-700 dark:text-slate-350 font-bold">
                                  {errorCorrectionLevel} (~{errorCorrectionLevel === "L" ? "7%" : errorCorrectionLevel === "M" ? "15%" : errorCorrectionLevel === "Q" ? "25%" : "30%"})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actionable insight advice banner */}
                          {scannability.score < 88 && (
                            <div className="p-2 border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl text-[9px] text-amber-800 dark:text-amber-300 leading-snug">
                              {useLogo && errorCorrectionLevel !== "H" ? (
                                <span>
                                  💡 <strong>ECC Recommendation:</strong> Switch the Error Correction to <strong>Level H</strong> to repair missing blocks underneath the active {logoName || "custom logo"} element.
                                </span>
                              ) : (
                                <span>
                                  💡 <strong>Optimization Tip:</strong> {scannability.message}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Copy to Clipboard Quick Action Card */}
                <div className="flex flex-col gap-3.5 bg-white dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-64 shrink-0 transition-all">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Copy className="w-4 h-4 text-indigo-550" /> Copy to Clipboard
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Quick-copy QR data or raw images directly into professional design packages like Figma, Photoshop, or Canva.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Copy PNG Button */}
                    <button
                      onClick={handleCopyPngDirect}
                      type="button"
                      className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-3xs ${
                        copiedPng
                          ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 animate-pulse"
                          : "bg-indigo-650 border-indigo-650 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:border-indigo-600 dark:hover:bg-indigo-500"
                      }`}
                      title="Copy raw PNG file data into your computer system clipboard"
                    >
                      {copiedPng ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 animate-bounce" />
                          PNG Image Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy PNG Image
                        </>
                      )}
                    </button>

                    {/* Copy Base64 Button */}
                    <button
                      onClick={handleCopyBase64Direct}
                      type="button"
                      className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        copiedBase64
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                          : "bg-slate-50 border-slate-250 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
                      }`}
                      title="Copy direct base64 image data-URI string representation"
                    >
                      {copiedBase64 ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Base64 URI Copied!
                        </>
                      ) : (
                        <>
                          <Type className="w-3.5 h-3.5 mr-1.5 text-slate-450 dark:text-slate-550" />
                          Copy Base64 URI String
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[9px] text-slate-400 dark:text-slate-500 italic text-center select-none leading-tight border-t border-slate-100 dark:border-slate-900 pt-2">
                    💡 Tip: Direct image copying is optimized for instant designer pasting.
                  </div>
                </div>
              </div>

              <div className="text-center font-sans">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-300 break-all px-4 max-w-sm">
                  {text}
                </p>
                <div className="flex items-center gap-1.5 justify-center mt-1 flex-wrap">
                  <div className="inline-flex items-center text-[10px] text-emerald-600 font-bold gap-1 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full select-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Code Vectorized OK
                  </div>

                  <button
                    type="button"
                    onClick={runLocalScanTest}
                    className="inline-flex items-center text-[10px] text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100 font-bold gap-1 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors border-0"
                    title="Simul-scan check compatibility with standard camera decoders"
                  >
                    <Sparkles className="w-3" /> Diagnostic Scan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !testLabActive;
                      setTestLabActive(nextState);
                      if (nextState) {
                        setSimulatedBlur(1.5);
                        setSimulatedBrightness(75);
                        setSimulatedContrast(100);
                        setSimulatedTilt(true);
                        setIsLensDirty(true);
                      } else {
                        setSimulatedBlur(0);
                        setSimulatedBrightness(100);
                        setSimulatedContrast(100);
                        setSimulatedTilt(false);
                        setIsLensDirty(false);
                      }
                    }}
                    className={`inline-flex items-center text-[10px] font-bold gap-1 px-2.5 py-0.5 rounded-full cursor-pointer transition-all border-0 ${
                      testLabActive 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-350"
                    }`}
                    title="Toggle real-time lens challenges, blur and low-light stress test lab"
                  >
                    <Camera className="w-3 h-3" /> {testLabActive ? "Close Test Lab" : "Virtual Scanner Lab"}
                  </button>
                </div>
              </div>

              {/* Simulated Camera Scanner Control panel */}
              {testLabActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl text-left select-none space-y-4 mt-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Virtual Camera Scanner Lab
                        </h4>
                        <p className="text-[9.5px] text-slate-450 dark:text-slate-500 font-medium">
                          Stress test QR capabilities using real-time browser camera filter models.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTestLabActive(false);
                        setSimulatedBlur(0);
                        setSimulatedBrightness(100);
                        setSimulatedContrast(100);
                        setSimulatedTilt(false);
                        setIsLensDirty(false);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors border-0 cursor-pointer"
                      title="Close Simulator Control Panel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Controls Area */}
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <span className="block text-[8.5px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest leading-none">
                          Quick Environment Presets
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: "Perfect Spot", blur: 0, bright: 100, contrast: 100, tilt: false, dirty: false },
                            { label: "Dirty Lens", blur: 1.6, bright: 85, contrast: 100, tilt: false, dirty: true },
                            { label: "Low Light", blur: 0, bright: 32, contrast: 85, tilt: false, dirty: false },
                            { label: "Office Glare", blur: 0.5, bright: 100, contrast: 105, tilt: true, dirty: true },
                            { label: "Severe Angle", blur: 0.4, bright: 95, contrast: 100, tilt: true, dirty: false },
                          ].map((preset) => {
                            const isActive = 
                              simulatedBlur === preset.blur &&
                              simulatedBrightness === preset.bright &&
                              simulatedContrast === preset.contrast &&
                              simulatedTilt === preset.tilt &&
                              isLensDirty === preset.dirty;

                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setSimulatedBlur(preset.blur);
                                  setSimulatedBrightness(preset.bright);
                                  setSimulatedContrast(preset.contrast);
                                  setSimulatedTilt(preset.tilt);
                                  setIsLensDirty(preset.dirty);
                                }}
                                className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="space-y-3 pt-2.5 border-t border-slate-150 dark:border-slate-800/40">
                        {/* Blur */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300">
                            <span>Camera Lens Defocus (Blur)</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{simulatedBlur.toFixed(1)}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="3.5"
                            step="0.1"
                            value={simulatedBlur}
                            onChange={(e) => setSimulatedBlur(parseFloat(e.target.value))}
                            className="w-full accent-indigo-650 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Brightness / lighting */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300">
                            <span>Ambient Exposure (Brightness)</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{simulatedBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            step="2"
                            value={simulatedBrightness}
                            onChange={(e) => setSimulatedBrightness(parseInt(e.target.value))}
                            className="w-full accent-indigo-650 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Contrast slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300">
                            <span>Luminance Contrast</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{simulatedContrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="5"
                            value={simulatedContrast}
                            onChange={(e) => setSimulatedContrast(parseInt(e.target.value))}
                            className="w-full accent-indigo-650 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-2 pt-1.5">
                          <label className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-850">
                            <input
                              type="checkbox"
                              checked={simulatedTilt}
                              onChange={(e) => setSimulatedTilt(e.target.checked)}
                              className="accent-indigo-650 cursor-pointer w-3.5 h-3.5 rounded"
                            />
                            <div className="text-left font-sans">
                              <span className="block text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">3D Angle Tilt</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500">Skew matrix 14°</span>
                            </div>
                          </label>

                          <label className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-850">
                            <input
                              type="checkbox"
                              checked={isLensDirty}
                              onChange={(e) => setIsLensDirty(e.target.checked)}
                              className="accent-indigo-650 cursor-pointer w-3.5 h-3.5 rounded"
                            />
                            <div className="text-left font-sans">
                              <span className="block text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight font-black">Sunlight Glare</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500">Specular hotspot</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic Report Area */}
                    <div className="flex flex-col justify-between bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 p-3.5 rounded-xl">
                      <div className="space-y-3">
                        <span className="block text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">
                          Sensory Diagnostics Report
                        </span>

                        {isSimScanChecking ? (
                          <div className="flex flex-col items-center justify-center py-7 space-y-2 select-none">
                            <RefreshCw className="w-4 h-4 text-indigo-550 dark:text-indigo-400 animate-spin" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono animate-pulse">
                              ANALYZING FEED COMPLIANCE...
                            </span>
                          </div>
                        ) : simScanResult ? (
                          <div className="space-y-2.5 text-left">
                            <div 
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9.5px] font-black uppercase tracking-wider select-none ${
                                simScanResult.success
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${simScanResult.success ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-bounce'}`} />
                              {simScanResult.success ? "FEED SCANNABLE" : "SIGNAL BLOCKED"}
                            </div>

                            <p className="text-[10px] text-slate-555 dark:text-slate-350 leading-relaxed font-semibold">
                              {simScanResult.message}
                            </p>

                            {simScanResult.success && simScanResult.decodedText && (
                              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-2 rounded-lg text-left select-none">
                                <span className="block text-[8px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1">
                                  Decoded Output
                                </span>
                                <p className="text-[9.5px] font-mono break-all text-slate-700 dark:text-slate-300 font-extrabold leading-normal select-text">
                                  {simScanResult.decodedText}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-400">
                            Adjust filters to begin simulation checking.
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-900 pt-2.5 mt-3 flex items-center justify-between text-[8px] font-black text-slate-400 dark:text-slate-550 uppercase select-none tracking-widest leading-none">
                        <span>🔬 JS-QR ENGINE RAW FEED</span>
                        <span>ECC: {errorCorrectionLevel}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
              <div className="flex flex-col items-center text-center">
                <QrCode className="w-12 h-12 text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-700">QR Stage is waiting</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Draft an URL links on the left side to compile high-resolution instant scan module.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Clipboard Copy Widget wrapper card */}
        {qrCodeDataUrl && (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-2xl text-left space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  📋 Copy to Clipboard
                </span>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                  Export directly to layout and design packages (Figma, Photoshop, etc.).
                </p>
              </div>
            </div>

            {/* Segmented active selection tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/50 dark:bg-slate-800/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => changeCopyFormat("base64")}
                className={`px-1.5 py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  copyFormat === "base64"
                    ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-3xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Base64 Data URI
              </button>
              <button
                type="button"
                onClick={() => changeCopyFormat("objectUrl")}
                className={`px-1.5 py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  copyFormat === "objectUrl"
                    ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-3xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Object URL
              </button>
              <button
                type="button"
                onClick={() => changeCopyFormat("image")}
                className={`px-1.5 py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  copyFormat === "image"
                    ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-3xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
                title="Copies raw binary PNG files directly to copy-paste buffers"
              >
                PNG Image
              </button>
            </div>

            {/* Actual Copy Action Trigger Button */}
            <button
              onClick={handleCopyClipboard}
              id="qr-copy-clipboard-btn"
              type="button"
              className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 shadow-3xs ${
                copied
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 animate-bounce" />
                  Copied to Clipboard! 🎉
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  {copyFormat === "base64" && "Copy Base64 Data URI String"}
                  {copyFormat === "objectUrl" && "Copy Object URL-pointer"}
                  {copyFormat === "image" && "Copy PNG Image to Clip-Buffer"}
                </>
              )}
            </button>
          </div>
        )}

        {/* Download Export Format Select Dropdown */}
        {qrCodeDataUrl && (
          <div className="w-full flex items-center justify-between bg-slate-100/60 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 mt-3">
            <span className="text-[10.5px] font-bold text-slate-705 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Settings className="w-3.5 h-3.5 text-indigo-500" /> Export Format
            </span>
            <div className="relative">
              <select
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value as any)}
                className="text-xs pl-3 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-600 font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer shadow-3xs hover:border-slate-300 dark:hover:border-slate-705 transition-colors"
                id="select-download-format"
              >
                <option value="png">PNG (Raster Image)</option>
                <option value="jpeg">JPEG (High Quality)</option>
                <option value="svg">SVG (Vector Graphics)</option>
              </select>
            </div>
          </div>
        )}

        {/* Sync execution row */}
        {qrCodeDataUrl && (
          <div className="flex flex-col sm:flex-row gap-2 pt-3 flex-wrap">
            <button
              onClick={handleDownload}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-download-qr"
              title={`Download your customized QR code as a ${downloadFormat.toUpperCase()} file`}
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-200" />
              Download {downloadFormat.toUpperCase()}
            </button>

            <button
              onClick={handleShare}
              className="flex-1 min-w-[125px] inline-flex items-center justify-center px-3 py-2.5 border border-indigo-200 hover:bg-indigo-50/50 rounded-xl bg-white text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-share-qr"
              title="Open native device sharing sheets to publish this QR code"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-indigo-550" />
              Share Design
            </button>

            <button
              onClick={() => setShowPrintLayoutModal(true)}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-print-qr"
              title="Open physical print layout planner, support A4 page grid & crop marks"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500 animate-pulse" />
              Print Layout
            </button>

            <button
              onClick={handleSaveToHistory}
              className="flex-1 min-w-[130px] inline-flex items-center justify-center px-3 py-2.5 border border-indigo-200 hover:bg-indigo-50 rounded-xl bg-indigo-50/40 text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-save-qr-history"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Save History
            </button>

            {user ? (
              <button
                onClick={handleSaveToDrive}
                disabled={isSaving}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50 border-0"
                id="btn-save-qr-drive"
              >
                <Cloud className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                {isSaving ? "Saving..." : "Save Cloud"}
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-250 font-semibold text-xs transition-all border-0 cursor-pointer"
                title="Authenticate Drive upload via your Google Workspace account"
                id="btn-prompt-login-qr"
              >
                <Cloud className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Save Cloud
              </button>
            )}
          </div>
        )}

        {/* QR Codes Offline History & Scan Table Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-2xs space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
            {/* Elegant Segmented Tabs */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/40 shrink-0 self-start">
              <button
                type="button"
                onClick={() => setActiveHistoryTab("scan_history")}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                  activeHistoryTab === "scan_history"
                    ? "bg-white text-slate-800 shadow-3xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                Auto-Scan History ({scanHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveHistoryTab("saved")}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                  activeHistoryTab === "saved"
                    ? "bg-white text-slate-800 shadow-3xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                Saved Gallery ({savedQrs.length})
              </button>
            </div>

            {/* Export and Clear buttons in a compact row */}
            <div className="flex items-center gap-2.5">
              {activeHistoryTab === "scan_history" ? (
                scanHistory.length > 0 && (
                  <>
                    <button
                      onClick={() => handleExportCSV(scanHistory, "qr_scan_history.csv")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <span className="text-slate-200 dark:text-slate-800 text-[10px]" aria-hidden="true">|</span>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear your local auto-saved scan/generation history?")) {
                          setScanHistory([]);
                          localStorage.removeItem("toolkit_pro_qr_scan_history");
                        }
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer bg-transparent border-0"
                    >
                      Clear Auto-History
                    </button>
                  </>
                )
              ) : (
                savedQrs.length > 0 && (
                  <>
                    <button
                      onClick={() => handleExportCSV(savedQrs, "qr_saved_gallery.csv")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <span className="text-slate-200 dark:text-slate-800 text-[10px]" aria-hidden="true">|</span>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear your saved local QR favorites gallery?")) {
                          setSavedQrs([]);
                          localStorage.removeItem("toolkit_pro_saved_qrs");
                        }
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer bg-transparent border-0"
                    >
                      Clear Saved Gallery
                    </button>
                  </>
                )
              )}
            </div>
          </div>

          {/* Render Active Tab content */}
          {activeHistoryTab === "scan_history" ? (
            scanHistory.length === 0 ? (
              <div className="text-center py-7 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <History className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic">No recent generated QR codes in your local storage yet.</p>
                <p className="text-[10px] text-slate-350 mt-1 max-w-xs mx-auto">
                  Type any URL/string in the target field above. It compiles dynamically and auto-saves the last 10.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {scanHistory.map((item) => (
                  <SwipeableHistoryItem
                    key={item.id}
                    item={item}
                    onLoad={handleLoadSaved}
                    onDelete={handleDeleteScanHistory}
                    onDownload={handleDownloadSaved}
                  />
                ))}
              </div>
            )
          ) : (
            savedQrs.length === 0 ? (
              <div className="text-center py-7 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <QrCode className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic">No saved favoritized QR codes in your gallery.</p>
                <p className="text-[10px] text-slate-350 mt-1 max-w-xs mx-auto">
                  Design a special customized QR Code and click "Save History" above to pin it permanently offline.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {savedQrs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadSaved(item)}
                    className="p-2.5 rounded-xl border border-slate-150 bg-slate-50/40 hover:bg-slate-100/55 hover:border-indigo-200 transition-all cursor-pointer relative group flex items-start gap-2.5"
                    title="Click anywhere to reload this favorited design"
                  >
                    {/* Thumbnail snippet */}
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative select-none">
                      <img src={item.dataUrl} alt="Gallery thumb" className="w-8.5 h-8.5 object-contain" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <p className="text-[11.5px] font-semibold text-slate-700 truncate block leading-tight">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-mono">
                          {item.timestamp}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: item.foregroundColor }}
                          title={`FG: ${item.foregroundColor}`}
                        />
                      </div>
                    </div>

                    {/* Immediate operations options */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        onClick={(e) => handleDownloadSaved(item, e)}
                        className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-700 transition-all cursor-pointer shadow-3xs"
                        title="Quick Download PNG"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        className="p-1 rounded bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-3xs"
                        title="Delete from Saved Gallery"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* State-of-the-art A4 Print Layout Planner and Grid Studio */}
      {showPrintLayoutModal && (
        <div
          id="a4-print-staging-modal"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 md:p-6 select-none print:p-0 no-print-bg animate-fade-in"
        >
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 w-full max-w-7xl rounded-none md:rounded-3xl shadow-2xl flex flex-col h-full max-h-screen md:max-h-[92vh] overflow-hidden print:border-0 print:bg-white print:rounded-none select-none">
            {/* Modal Panel Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-650 dark:text-indigo-400">
                  <Printer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    A4 Physical Print Grid Studio
                  </h3>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold">
                    Plan, repeat, and split customized QR grids onto A4 papers for perfect physical cut mark guidelines.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border-0"
                >
                  <Printer className="w-4 h-4" />
                  Print Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintLayoutModal(false)}
                  className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
                >
                  Close Studio
                </button>
              </div>
            </div>

            {/* Core Workspace Grid layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Left Column Settings Sidebar */}
              <div className="w-full lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 overflow-y-auto p-6 space-y-6 print:hidden">
                {/* 1. Print Source mode selection */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    1. Print Source Selection
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPrintSourceMode("single")}
                      className={`py-2 text-[10.5px] font-bold uppercase tracking-wider rounded-lg border-0 transition-all cursor-pointer ${
                        printSourceMode === "single"
                          ? "bg-white dark:bg-slate-950 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                          : "text-slate-500 hover:text-slate-755 dark:text-slate-450 dark:hover:text-slate-300"
                      }`}
                    >
                      Repeat Active ({singlePrintCopies})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSourceMode("multi")}
                      className={`py-2 text-[10.5px] font-bold uppercase tracking-wider rounded-lg border-0 transition-all cursor-pointer ${
                        printSourceMode === "multi"
                          ? "bg-white dark:bg-slate-950 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                          : "text-slate-500 hover:text-slate-755 dark:text-slate-450 dark:hover:text-slate-300"
                      }`}
                    >
                      Multi-Selection
                    </button>
                  </div>
                </div>

                {/* Conditional Source Panels */}
                {printSourceMode === "single" ? (
                  /* Single active replica count slider */
                  <div className="space-y-2 pb-4 border-b border-slate-150 dark:border-slate-850">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-750 dark:text-slate-300">
                        Copies on Sheet
                      </span>
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                        {singlePrintCopies} Items
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      step="1"
                      value={singlePrintCopies}
                      onChange={(e) => setSinglePrintCopies(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      Automatically repeats your active custom designed QR code across the sheet grid for batch sticker/flyer creation.
                    </p>
                  </div>
                ) : (
                  /* Custom list selection with checkboxes */
                  <div className="space-y-3 pb-4 border-b border-slate-150 dark:border-slate-850">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-755 dark:text-slate-300">
                        Select Codes to Lay Out
                      </span>
                      <div className="flex gap-2.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => setSelectedMultiQrIds(printableList.map(x => x.id))}
                          className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer uppercase tracking-wider"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300 dark:text-slate-800">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedMultiQrIds(["__active__"])}
                          className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer uppercase tracking-wider"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200/60 dark:border-slate-800/80 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 p-1 bg-slate-50/50 dark:bg-slate-900/10">
                      {printableList.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-slate-400 italic font-medium">
                          No customized QR Codes compiled. Designing is required!
                        </div>
                      ) : (
                        printableList.map((item) => {
                          const isChecked = selectedMultiQrIds.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer select-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-850 ${
                                isChecked ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedMultiQrIds(prev => prev.filter(x => x !== item.id));
                                  } else {
                                    setSelectedMultiQrIds(prev => [...prev, item.id]);
                                  }
                                }}
                                className="accent-indigo-600 rounded cursor-pointer w-3.5 h-3.5 shrink-0"
                              />
                              <img
                                src={item.dataUrl}
                                alt="Thumb"
                                className="w-7 h-7 object-contain rounded bg-white border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1 text-left">
                                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate leading-tight">
                                  {item.text}
                                </span>
                                <span className="block text-[8px] text-slate-400 dark:text-slate-505 leading-none mt-0.5 font-mono">
                                  {item.source} {item.timestamp ? `(${item.timestamp})` : ""}
                                </span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Grid styling metrics */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    2. Physical Dimensions (A4)
                  </span>

                  {/* QR Size Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-750 dark:text-slate-300">
                      <span>Printed QR Width</span>
                      <span className="font-mono text-indigo-650 dark:text-indigo-400 font-extrabold text-xs">
                        {printQrSizeMm}mm (~{(printQrSizeMm * 0.03937).toFixed(1)} in)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="110"
                      step="5"
                      value={printQrSizeMm}
                      onChange={(e) => setPrintQrSizeMm(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-550 font-bold leading-none select-none">
                      <span>25mm (Small)</span>
                      <span>55mm (Standard)</span>
                      <span>110mm (Posters)</span>
                    </div>
                  </div>

                  {/* Item Gaps / Padding */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-750 dark:text-slate-300">
                      <span>Grid Spacer Gap</span>
                      <span className="font-mono text-indigo-650 dark:text-indigo-400 font-extrabold text-xs">
                        {printGapSizeMm}mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      step="1"
                      value={printGapSizeMm}
                      onChange={(e) => setPrintGapSizeMm(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-550 font-bold leading-none select-none">
                      <span>3mm (Tight)</span>
                      <span>10mm (Normal)</span>
                      <span>30mm (Wide)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Crop guides & text labels */}
                <div className="space-y-4 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                  <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    3. Trim Marks & Description
                  </span>

                  {/* Crop marks toggle */}
                  <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 p-2.5 border border-slate-150 dark:border-slate-850 rounded-xl select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-lg shrink-0">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="text-left font-sans">
                        <span className="block text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                          Trim Corner Crosshairs
                        </span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight block">
                          Prints hair alignment cut guidelines
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showCropMarks}
                      onChange={(e) => setShowCropMarks(e.target.checked)}
                      className="accent-indigo-600 cursor-pointer w-4 h-4 rounded"
                    />
                  </div>

                  {showCropMarks && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-indigo-200 dark:border-indigo-850 ml-1">
                      <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-700 dark:text-slate-300 font-sans">
                        <span>Offset Margin Pullout</span>
                        <span className="font-mono text-indigo-650 dark:text-indigo-400 font-extrabold">
                          {cropMarkPaddingMm}mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={cropMarkPaddingMm}
                        onChange={(e) => setCropMarkPaddingMm(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Print Subtitle Selection */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-350">
                      Subtitle Tags
                    </label>
                    <select
                      value={printLabelStyle}
                      onChange={(e) => setPrintLabelStyle(e.target.value as "none" | "content" | "index")}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="none">Empty (Pure QR Codes only)</option>
                      <option value="content">Detailed Content Value / URL</option>
                      <option value="index">Index Ordering Counters (#1, #2...)</option>
                    </select>
                  </div>
                </div>

                {/* Grid diagnostics overview */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl select-none text-left space-y-2">
                  <span className="block text-[8px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">
                    Printer Workspace Statistics
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-650 dark:text-slate-350 font-sans text-[10.5px]">
                    <div>
                      <span className="block text-[8px] lowercase font-semibold text-slate-400 leading-none">Columns x Rows</span>
                      <span className="text-[11.5px] font-bold font-mono">{cols} x {rows} grid</span>
                    </div>
                    <div>
                      <span className="block text-[8px] lowercase font-semibold text-slate-400 leading-none">Page capacity</span>
                      <span className="text-[11.5px] font-bold font-mono text-emerald-600 dark:text-emerald-450">{perPageCount} items</span>
                    </div>
                    <div>
                      <span className="block text-[8px] lowercase font-semibold text-slate-400 leading-none">Total codes selected</span>
                      <span className="text-[11.5px] font-bold font-mono font-black">{activePrintItems.length} items</span>
                    </div>
                    <div>
                      <span className="block text-[8px] lowercase font-semibold text-slate-400 leading-none">A4 Paper Required</span>
                      <span className="text-[11.5px] font-bold font-mono font-black text-indigo-600 dark:text-indigo-400">{pages.length} Sheet(s)</span>
                    </div>
                  </div>

                  {pages.length > 1 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-amber-700 dark:text-amber-300 leading-normal font-semibold">
                        Layout exceeds 1 sheet. The studio will seamlessly paginate onto separate physical pages during print!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Physical A4 Staging board */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-250/60 dark:bg-slate-900/40 flex flex-col items-center justify-start relative select-none">
                {/* Float Zoom adjustments panel */}
                <div className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2 select-none shadow-sm print:hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(prev => Math.max(30, prev - 5))}
                    className="w-6 h-6 flex items-center justify-center font-black rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer transition-colors"
                    title="Zoom Out View"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-bold font-mono text-slate-650 dark:text-slate-350 min-w-[34px] text-center select-none">
                    {previewZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(prev => Math.min(100, prev + 5))}
                    className="w-6 h-6 flex items-center justify-center font-black rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer transition-colors"
                    title="Zoom In View"
                  >
                    +
                  </button>
                </div>

                {/* Staging page stream view (scaled on screen, true A4 in print) */}
                <div className="space-y-6 flex flex-col items-center py-4 w-full origin-top">
                  {pages.length === 0 ? (
                    <div className="text-center py-20 max-w-sm select-none">
                      <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-bounce" />
                      <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-350">
                        Print grid is empty
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal mt-1">
                        Please check at least one QR code template item from the left configuration sidebar to see the live A4 preview panel!
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="a4-print-viewport-scale flex flex-col items-center gap-8"
                      style={{ 
                        transform: `scale(${previewZoom / 100})`, 
                        transformOrigin: "top center",
                        height: pages.length > 0 ? `${(pages.length * 297 * (previewZoom / 100)) + ((pages.length - 1) * 32)}mm` : "auto"
                      }}
                    >
                      {pages.map((rowItems, pageIdx) => (
                        <div
                          key={pageIdx}
                          className="a4-print-page w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] bg-white text-slate-900 border border-slate-300/85 shadow-xl rounded-sm p-[15mm] flex flex-col justify-between relative select-none box-sizing:border-box"
                        >
                          {/* Inner page boundary grid container */}
                          <div 
                            className="w-full h-full flex flex-wrap content-start bg-white" 
                            style={{ 
                              display: "grid", 
                              gridTemplateColumns: `repeat(${cols}, ${printQrSizeMm}mm)`, 
                              gap: `${printGapSizeMm}mm`, 
                              justifyContent: "center",
                              alignContent: "start"
                            }}
                          >
                            {rowItems.map((item) => (
                              <div
                                key={item.id}
                                className="relative flex flex-col items-center justify-center bg-white"
                                style={{ 
                                  width: `${printQrSizeMm}mm`, 
                                  height: `${printQrSizeMm + (printLabelStyle !== "none" ? 14 : 0)}mm` 
                                }}
                              >
                                <img
                                  src={item.dataUrl}
                                  alt="Print Target QR"
                                  className="object-contain block bg-white shrink-0 outline-none"
                                  style={{ width: `${printQrSizeMm}mm`, height: `${printQrSizeMm}mm` }}
                                />

                                {/* Cut marks guidelines */}
                                {showCropMarks && (
                                  <div className="absolute inset-0 pointer-events-none select-none z-10">
                                    {/* Top Left cross */}
                                    <div className="absolute w-[6mm] h-[6mm]" style={{ top: `-${cropMarkPaddingMm}mm`, left: `-${cropMarkPaddingMm}mm` }}>
                                      <div className="absolute top-0 left-[3mm] w-[0.5px] h-[6mm] bg-neutral-450" />
                                      <div className="absolute top-[3mm] left-0 w-[6mm] h-[0.5px] bg-neutral-450" />
                                    </div>

                                    {/* Top Right cross */}
                                    <div className="absolute w-[6mm] h-[6mm]" style={{ top: `-${cropMarkPaddingMm}mm`, right: `-${cropMarkPaddingMm}mm` }}>
                                      <div className="absolute top-0 right-[3mm] w-[0.5px] h-[6mm] bg-neutral-450" />
                                      <div className="absolute top-[3mm] right-0 w-[6mm] h-[0.5px] bg-neutral-450" />
                                    </div>

                                    {/* Bottom Left cross */}
                                    <div className="absolute w-[6mm] h-[6mm]" style={{ bottom: `-${cropMarkPaddingMm}mm`, left: `-${cropMarkPaddingMm}mm` }}>
                                      <div className="absolute bottom-0 left-[3mm] w-[0.5px] h-[6mm] bg-neutral-450" />
                                      <div className="absolute bottom-[3mm] left-0 w-[6mm] h-[0.5px] bg-neutral-450" />
                                    </div>

                                    {/* Bottom Right cross */}
                                    <div className="absolute w-[6mm] h-[6mm]" style={{ bottom: `-${cropMarkPaddingMm}mm`, right: `-${cropMarkPaddingMm}mm` }}>
                                      <div className="absolute bottom-0 right-[3mm] w-[0.5px] h-[6mm] bg-neutral-450" />
                                      <div className="absolute bottom-[3mm] right-0 w-[6mm] h-[0.5px] bg-neutral-450" />
                                    </div>
                                  </div>
                                )}

                                {/* Optional label below */}
                                {printLabelStyle === "content" && (
                                  <p 
                                    className="text-center font-bold text-slate-700 tracking-tight font-mono select-none overflow-hidden text-ellipsis whitespace-nowrap leading-none mt-1.5" 
                                    style={{ fontSize: "7pt", width: `${printQrSizeMm}mm` }}
                                    title={item.text}
                                  >
                                    {item.text}
                                  </p>
                                )}
                                {printLabelStyle === "index" && (
                                  <p 
                                    className="text-center font-black text-indigo-650 leading-none mt-1.5" 
                                    style={{ fontSize: "8pt" }}
                                  >
                                    #{item.index}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Footer Page numbers stamp */}
                          <div className="absolute bottom-[5mm] left-0 right-0 text-center text-[7pt] text-slate-400 font-mono tracking-widest leading-none select-none flex items-center justify-between px-[15mm]">
                            <span>📄 A4 PRINT SHEET PLANNER</span>
                            <span>PAGE {pageIdx + 1} OF {pages.length}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
