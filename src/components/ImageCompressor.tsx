import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { User } from "firebase/auth";
import { CompressionResult } from "../types";
import { uploadFileToDrive, downloadDriveFile, updateDriveFile } from "../lib/drive";
import { 
  Cloud, 
  CloudOff,
  Download, 
  FileImage, 
  Image as ImageIcon, 
  Sparkles, 
  UploadCloud, 
  SlidersHorizontal, 
  ArrowRight, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Check, 
  RefreshCw,
  Plus,
  Archive,
  FileArchive,
  History,
  X,
  Minimize2,
  Maximize2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Camera,
  Info,
  MapPin,
  Calendar,
  Cpu,
  GripVertical,
  Share2,
  Layers,
  Undo,
  Smartphone,
  ExternalLink
} from "lucide-react";
import ExifReader from "exifreader";
import { RGBHistogram } from "./RGBHistogram";
import { motion, AnimatePresence } from "motion/react";

interface ImageCompressorProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => void;
  initialFiles?: File[] | null;
  onClearInitialFiles?: () => void;
}

const generateLowResThumbnail = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 120; // Lightweight max bounds
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Deeply compress to optimized target jpeg quality
        resolve(canvas.toDataURL("image/jpeg", 0.45));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
};

const copyExif = (originalBuffer: ArrayBuffer, compressedBase64: string): string => {
  const origBytes = new Uint8Array(originalBuffer);
  let app1Offset = -1;
  let app1Length = 0;
  
  if (origBytes[0] === 0xFF && origBytes[1] === 0xD8) {
    let idx = 2;
    while (idx < origBytes.length - 1) {
      if (origBytes[idx] === 0xFF) {
        const marker = origBytes[idx + 1];
        if (marker === 0xE1) {
          app1Offset = idx;
          app1Length = (origBytes[idx + 2] << 8) + origBytes[idx + 3] + 2;
          break;
        } else if (marker === 0xD9 || marker === 0xDA) {
          break;
        } else {
          const segmentLength = (origBytes[idx + 2] << 8) + origBytes[idx + 3];
          idx += segmentLength + 2;
        }
      } else {
        idx++;
      }
    }
  }

  if (app1Offset === -1 || app1Length <= 0) {
    return compressedBase64;
  }

  const app1Segment = origBytes.subarray(app1Offset, app1Offset + app1Length);

  const compBinary = atob(compressedBase64);
  const compBytes = new Uint8Array(compBinary.length);
  for (let i = 0; i < compBinary.length; i++) {
    compBytes[i] = compBinary.charCodeAt(i);
  }

  if (compBytes[0] === 0xFF && compBytes[1] === 0xD8) {
    const resultBytes = new Uint8Array(compBytes.length + app1Length);
    resultBytes.set(compBytes.subarray(0, 2), 0);
    resultBytes.set(app1Segment, 2);
    resultBytes.set(compBytes.subarray(2), 2 + app1Length);

    let binaryStr = "";
    const chunkSize = 8192;
    for (let i = 0; i < resultBytes.length; i += chunkSize) {
      binaryStr += String.fromCharCode.apply(null, Array.from(resultBytes.subarray(i, i + chunkSize)));
    }
    return btoa(binaryStr);
  }

  return compressedBase64;
};

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  originalUrl: string;
  thumbnailUrl?: string;
  quality: number;
  compressedResult: CompressionResult | null;
  isCompressing: boolean;
  isSaving: boolean;
  saveStatus: { success?: boolean; msg?: string } | null;
  aspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  rotation?: number;
  filter?: "none" | "grayscale" | "sepia" | "invert" | "blur";
}

export interface CompressionSession {
  id: string;
  timestamp: string;
  filesCount: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  savingsPercentage: number;
  files: {
    id: string;
    name: string;
    size: number;
    type: string;
    originalUrl: string;
    quality: number;
    compressedResult: CompressionResult | null;
  }[];
}

const CompressingProgressBar = ({ isCompressing }: { isCompressing: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isCompressing) {
      setProgress(0);
      return;
    }

    setProgress(8);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) {
          return 94;
        }
        const increment = Math.floor(Math.random() * 12) + 6;
        return Math.min(prev + increment, 94);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isCompressing]);

  if (!isCompressing) return null;

  return (
    <div className="w-full mt-2" id="compressing-progress-indicator">
      <div className="flex items-center justify-between text-[9px] font-mono text-indigo-600 dark:text-indigo-400 mb-0.5">
        <span className="font-bold tracking-tight animate-pulse">Compressing layout...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800/20">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export interface CompressionPreset {
  name: string;
  isCustom?: boolean;
  quality: number;
  targetFormat: "original" | "image/webp" | "image/png" | "image/jpeg";
  isSmartResizeEnabled: boolean;
  smartResizeMaxWidth: number;
  smartResizeMaxHeight: number;
  aspectRatio: "original" | "1:1" | "16:9" | "9:16" | "4:3" | "2:3" | "custom";
}

export const DEFAULT_PRESETS: CompressionPreset[] = [
  {
    name: "Web Optimized",
    quality: 0.8,
    targetFormat: "image/webp",
    isSmartResizeEnabled: true,
    smartResizeMaxWidth: 1920,
    smartResizeMaxHeight: 1080,
    aspectRatio: "original",
  },
  {
    name: "High-Res JPEG",
    quality: 0.9,
    targetFormat: "image/jpeg",
    isSmartResizeEnabled: false,
    smartResizeMaxWidth: 3840,
    smartResizeMaxHeight: 2160,
    aspectRatio: "original",
  },
  {
    name: "Web Banner HD",
    quality: 0.85,
    targetFormat: "image/webp",
    isSmartResizeEnabled: true,
    smartResizeMaxWidth: 1280,
    smartResizeMaxHeight: 720,
    aspectRatio: "16:9",
  },
  {
    name: "Social Square (JPG)",
    quality: 0.8,
    targetFormat: "image/jpeg",
    isSmartResizeEnabled: true,
    smartResizeMaxWidth: 1080,
    smartResizeMaxHeight: 1080,
    aspectRatio: "1:1",
  },
  {
    name: "Tiny Thumbnail",
    quality: 0.55,
    targetFormat: "image/webp",
    isSmartResizeEnabled: true,
    smartResizeMaxWidth: 180,
    smartResizeMaxHeight: 180,
    aspectRatio: "1:1",
  },
];

export default function ImageCompressor({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
  initialFiles,
  onClearInitialFiles,
}: ImageCompressorProps) {
  // Batch Queue States
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 1-Click PWA Installation States
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(
    typeof window !== "undefined" ? window.deferredInstallPrompt || null : null
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true
      );

      const handlePromptReady = () => {
        if (window.deferredInstallPrompt) {
          setPwaInstallPrompt(window.deferredInstallPrompt);
        }
      };

      const handleBeforePrompt = (e: Event) => {
        e.preventDefault();
        setPwaInstallPrompt(e);
      };

      window.addEventListener("installpromptready", handlePromptReady);
      window.addEventListener("beforeinstallprompt", handleBeforePrompt);

      return () => {
        window.removeEventListener("installpromptready", handlePromptReady);
        window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
      };
    }
  }, []);

  // Undo history map (file id -> snapshotted states list)
  const [undoHistory, setUndoHistory] = useState<Record<string, Array<{
    quality: number;
    aspectRatio: string;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
    rotation: number;
    filter?: "none" | "grayscale" | "sepia" | "invert" | "blur";
  }>>>({});
  const [isGlobalDragging, setIsGlobalDragging] = useState<boolean>(false);
  const [isBatchCompressing, setIsBatchCompressing] = useState<boolean>(false);
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Quick Compress mode state
  const [isQuickCompressEnabled, setIsQuickCompressEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_quick_compress_enabled") === "true";
    }
    return false;
  });

  // Auto-Save Configuration States
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_auto_save_enabled") === "true";
    }
    return false;
  });
  const [isSaveToDriveOnCompress, setIsSaveToDriveOnCompress] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_save_to_drive_on_compress") === "true";
    }
    return false;
  });
  const [stripExifMetadata, setStripExifMetadata] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const storedStrip = localStorage.getItem("toolkit_image_strip_exif");
      if (storedStrip !== null) {
        return storedStrip === "true";
      }
      const storedKeep = localStorage.getItem("toolkit_image_keep_exif");
      if (storedKeep !== null) {
        return storedKeep !== "true";
      }
    }
    return true; // Strip EXIF metadata by default for privacy
  });
  const [isSmartResizeEnabled, setIsSmartResizeEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_smart_resize_enabled") === "true";
    }
    return false;
  });
  const [smartResizeMaxWidth, setSmartResizeMaxWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_smart_resize_max_width");
      return saved ? parseInt(saved, 10) : 1920;
    }
    return 1920;
  });
  const [smartResizeMaxHeight, setSmartResizeMaxHeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_smart_resize_max_height");
      return saved ? parseInt(saved, 10) : 1080;
    }
    return 1080;
  });

  // Watermark Feature States
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_watermark_enabled") === "true";
    }
    return false;
  });
  const [watermarkType, setWatermarkType] = useState<"text" | "logo">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_image_watermark_type") as "text" | "logo") || "text";
    }
    return "text";
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_watermark_text") || "CONFIDENTIAL";
    }
    return "CONFIDENTIAL";
  });
  const [watermarkColor, setWatermarkColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_watermark_color") || "#ffffff";
    }
    return "#ffffff";
  });
  const [watermarkSize, setWatermarkSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_watermark_size");
      return saved ? parseInt(saved, 10) : 5;
    }
    return 5;
  });
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_watermark_opacity");
      return saved ? parseFloat(saved) : 0.4;
    }
    return 0.4;
  });
  const [watermarkPosition, setWatermarkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "tiled">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_image_watermark_position") as any) || "bottom-right";
    }
    return "bottom-right";
  });
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_watermark_logo_url") || "";
    }
    return "";
  });

  // Social Sharing Comparison Generator States
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [compLayout, setCompLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [compDimensions, setCompDimensions] = useState<"landscape" | "square" | "original">("landscape");
  const [compFit, setCompFit] = useState<"contain" | "cover">("contain");
  const [compTheme, setCompTheme] = useState<"dark" | "light" | "indigo-glow">("dark");
  const [compTitle, setCompTitle] = useState<string>("");
  const [compLeftLabel, setCompLeftLabel] = useState<string>("");
  const [compRightLabel, setCompRightLabel] = useState<string>("");
  const [compShowBranding, setCompShowBranding] = useState<boolean>(true);
  const [compBrandingText, setCompBrandingText] = useState<string>("Compressed with ToolkitPro");
  const [isGeneratingComparison, setIsGeneratingComparison] = useState<boolean>(false);
  const comparisonCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [customPresets, setCustomPresets] = useState<CompressionPreset[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_custom_presets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [newPresetName, setNewPresetName] = useState("");
  const [presetFeedback, setPresetFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleApplyPreset = (preset: CompressionPreset) => {
    saveToUndoActiveItem();
    setQuality(preset.quality);
    if (selectedId) {
      setQueue(prev => prev.map(item => item.id === selectedId ? { ...item, quality: preset.quality } : item));
    }
    setTargetFormatSelection(preset.targetFormat);
    setIsSmartResizeEnabled(preset.isSmartResizeEnabled);
    setSmartResizeMaxWidth(preset.smartResizeMaxWidth);
    setSmartResizeMaxHeight(preset.smartResizeMaxHeight);
    setAspectRatio(preset.aspectRatio);
    localStorage.setItem("toolkit_image_smart_resize_enabled", String(preset.isSmartResizeEnabled));
    localStorage.setItem("toolkit_image_smart_resize_max_width", String(preset.smartResizeMaxWidth));
    localStorage.setItem("toolkit_image_smart_resize_max_height", String(preset.smartResizeMaxHeight));
    
    setPresetFeedback({ type: "success", text: `Preset "${preset.name}" applied successfully!` });
    setTimeout(() => setPresetFeedback(null), 3000);
  };

  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      setPresetFeedback({ type: "error", text: "Please enter a valid preset name." });
      return;
    }
    const isDuplicate = customPresets.some(p => p.name.toLowerCase() === trimmed.toLowerCase()) || 
                        DEFAULT_PRESETS.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setPresetFeedback({ type: "error", text: `A preset named "${trimmed}" already exists.` });
      return;
    }
    const newPreset: CompressionPreset = {
      name: trimmed,
      isCustom: true,
      quality,
      targetFormat: targetFormatSelection,
      isSmartResizeEnabled,
      smartResizeMaxWidth,
      smartResizeMaxHeight,
      aspectRatio,
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem("toolkit_image_custom_presets", JSON.stringify(updated));
    setNewPresetName("");
    setPresetFeedback({ type: "success", text: `Preset "${trimmed}" saved!` });
    setTimeout(() => setPresetFeedback(null), 3000);
  };

  const handleDeletePreset = (nameToDelete: string) => {
    const updated = customPresets.filter(p => p.name !== nameToDelete);
    setCustomPresets(updated);
    localStorage.setItem("toolkit_image_custom_presets", JSON.stringify(updated));
    setPresetFeedback({ type: "success", text: "Custom preset deleted." });
    setTimeout(() => setPresetFeedback(null), 3000);
  };

  const [autoSaveTarget, setAutoSaveTarget] = useState<"local" | "drive">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit_image_auto_save_target") as "local" | "drive") || "local";
    }
    return "local";
  });
  const [isAutoSaveDialogOpen, setIsAutoSaveDialogOpen] = useState<boolean>(false);
  const [autoSaveToast, setAutoSaveToast] = useState<{ isOpen: boolean; message: string; isError?: boolean; title?: string } | null>(null);

  // Image editing session draft states for Google Drive
  const [isAutoSaveDraftEnabled, setIsAutoSaveDraftEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_draft_auto_save") !== "false";
    }
    return true;
  });
  const [draftFileId, setDraftFileId] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState<boolean>(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);
  const [draftRestoreAvailable, setDraftRestoreAvailable] = useState<boolean>(false);
  const [restorableDraftData, setRestorableDraftData] = useState<any>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState<boolean>(false);

  // Auto-Clear Workspace Configuration
  const [autoClearOnNavigate, setAutoClearOnNavigate] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_image_auto_clear_on_navigate") === "true";
    }
    return false;
  });
  const [autoClearTimeout, setAutoClearTimeout] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("toolkit_image_auto_clear_timeout");
      return saved ? parseInt(saved, 10) : 0; // 0 means disabled
    }
    return 0;
  });

  const driveDraftRef = useRef<{ id: string | null; token: string | null }>({ id: null, token: null });

  useEffect(() => {
    driveDraftRef.current = { id: draftFileId, token: accessToken };
  }, [draftFileId, accessToken]);

  // Track idle time to auto-clear the session
  useEffect(() => {
    if (autoClearTimeout <= 0 || queue.length === 0) return;

    let timer: number;
    const resetTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        handleClearQueue();

        const shouldClear = localStorage.getItem("toolkit_image_auto_clear_on_navigate") === "true";
        if (shouldClear) {
          localStorage.removeItem("toolkit_recent_compression_sessions");
          setSessions([]);
          const { id, token } = driveDraftRef.current;
          if (id && token) {
            fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`
              }
            }).catch(err => console.error("Failed to delete draft on idle clear:", err));
          }
        }

        setAutoSaveToast({
          isOpen: true,
          message: "Workspace automatically cleared due to inactivity to secure session state."
        });
      }, autoClearTimeout * 60 * 1000);
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const onUserActivity = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, onUserActivity);
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, onUserActivity);
      });
    };
  }, [autoClearTimeout, queue.length]);

  // Cleanup on navigating away
  useEffect(() => {
    return () => {
      const shouldClear = localStorage.getItem("toolkit_image_auto_clear_on_navigate") === "true";
      if (shouldClear) {
        localStorage.removeItem("toolkit_recent_compression_sessions");
        const { id, token } = driveDraftRef.current;
        if (id && token) {
          fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }).catch(err => console.error("Failed to delete draft on unmount navigate away:", err));
        }
      }
    };
  }, []);

  const saveTimeoutRef = useRef<number | null>(null);

  // Drag and Drop reordering states and handlers for the image queue and batch summary
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [draggedSummaryIndex, setDraggedSummaryIndex] = useState<number | null>(null);
  const [dragOverSummaryIndex, setDragOverSummaryIndex] = useState<number | null>(null);

  const handleQueueDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch (_) {}
  };

  const handleQueueDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleQueueDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setQueue((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);
      
      saveBatchSession(updated);
      
      // Keep batch summary items sorted in the same order as the queue
      setBatchSummaryItems((prevSummary) => {
        if (prevSummary.length === 0) return prevSummary;
        const updatedIds = updated.map(item => item.id);
        return [...prevSummary].sort((a, b) => updatedIds.indexOf(a.id) - updatedIds.indexOf(b.id));
      });

      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleQueueDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSummaryDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedSummaryIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch (_) {}
  };

  const handleSummaryDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (dragOverSummaryIndex !== index) {
      setDragOverSummaryIndex(index);
    }
  };

  const handleSummaryDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedSummaryIndex === null || draggedSummaryIndex === targetIndex) {
      setDraggedSummaryIndex(null);
      setDragOverSummaryIndex(null);
      return;
    }

    setBatchSummaryItems((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedSummaryIndex, 1);
      updated.splice(targetIndex, 0, removed);
      
      // Sync the main workspace queue in the exact same order of IDs
      setQueue((prevQueue) => {
        const updatedIds = updated.map(item => item.id);
        const reordered = [...prevQueue].sort((a, b) => {
          const idxA = updatedIds.indexOf(a.id);
          const idxB = updatedIds.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        saveBatchSession(reordered);
        return reordered;
      });

      return updated;
    });

    setDraggedSummaryIndex(null);
    setDragOverSummaryIndex(null);
  };

  const handleSummaryDragEnd = () => {
    setDraggedSummaryIndex(null);
    setDragOverSummaryIndex(null);
  };

  // Load/Check for existing draft on mount or when credentials arrive
  useEffect(() => {
    if (!accessToken || !user) {
      setDraftRestoreAvailable(false);
      setRestorableDraftData(null);
      return;
    }

    const checkForExistingDraft = async () => {
      try {
        const q = "name = 'ToolkitPro_Image_Draft.json' and mimeType = 'application/json' and trashed = false";
        const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,modifiedTime)`;
        const listResp = await fetch(listUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (listResp.ok) {
          const listData = await listResp.json();
          if (listData.files && listData.files.length > 0) {
            const file = listData.files[0];
            setDraftFileId(file.id);

            // Fetch draft content
            const content = await downloadDriveFile(accessToken, file.id);
            if (content && content.items && content.items.length > 0) {
              setRestorableDraftData(content);
              setDraftRestoreAvailable(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check for existing image draft in Google Drive:", err);
      }
    };

    checkForExistingDraft();
  }, [accessToken, user]);

  // Debounced Auto-Save of editing coordinates & configs
  useEffect(() => {
    if (!accessToken || !user || !isAutoSaveDraftEnabled) return;
    if (queue.length === 0) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsDraftSaving(true);

        const serializedItems = queue.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          type: item.type,
          originalUrl: item.originalUrl,
          thumbnailUrl: item.thumbnailUrl,
          quality: item.quality,
          aspectRatio: item.aspectRatio,
          cropX: item.cropX,
          cropY: item.cropY,
          cropWidth: item.cropWidth,
          cropHeight: item.cropHeight,
          rotation: item.rotation,
          filter: item.filter || "none"
        }));

        const draftPayload = {
          lastUpdated: new Date().toISOString(),
          items: serializedItems
        };

        const jsonStr = JSON.stringify(draftPayload);
        const base64DataUrl = "data:application/json;base64," + btoa(unescape(encodeURIComponent(jsonStr)));

        let fileId = draftFileId;

        if (!fileId) {
          const q = "name = 'ToolkitPro_Image_Draft.json' and mimeType = 'application/json' and trashed = false";
          const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
          const listResp = await fetch(listUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (listResp.ok) {
            const listData = await listResp.json();
            if (listData.files && listData.files.length > 0) {
              fileId = listData.files[0].id;
              setDraftFileId(fileId);
            }
          }
        }

        if (fileId) {
          await updateDriveFile(accessToken, fileId, "application/json", base64DataUrl);
        } else {
          // Attempt to find or fallback create a folder, or upload to root
          let parentFolderId: string | undefined = undefined;
          try {
            const folderQ = "name = 'ToolkitPro' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
            const folderListUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQ)}&fields=files(id)`;
            const folderResp = await fetch(folderListUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (folderResp.ok) {
              const folderData = await folderResp.json();
              if (folderData.files && folderData.files.length > 0) {
                parentFolderId = folderData.files[0].id;
              }
            }
          } catch (fErr) {
            console.error("Error securing ToolkitPro folder:", fErr);
          }

          const newFile = await uploadFileToDrive(
            accessToken,
            "ToolkitPro_Image_Draft.json",
            "application/json",
            base64DataUrl,
            parentFolderId
          );
          setDraftFileId(newFile.id);
        }

        setLastDraftSavedAt(new Date());
      } catch (err) {
        console.error("Failed to auto-save draft:", err);
      } finally {
        setIsDraftSaving(false);
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [queue, isAutoSaveDraftEnabled, accessToken]);

  const handleRestoreDraft = async () => {
    if (!restorableDraftData || !restorableDraftData.items) return;
    setIsRestoringDraft(true);
    try {
      const restoredQueue: QueueItem[] = restorableDraftData.items.map((item: any) => {
        let reconstructedFile: File;
        try {
          if (item.originalUrl && item.originalUrl.startsWith("data:")) {
            const arr = item.originalUrl.split(",");
            const mime = arr[0].match(/:(.*?);/)?.[1] || item.type;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            reconstructedFile = new File([u8arr], item.name, { type: mime });
          } else {
            reconstructedFile = new File([], item.name, { type: item.type });
          }
        } catch (fileErr) {
          console.error("File reconstruction failed:", item.name, fileErr);
          reconstructedFile = new File([], item.name, { type: item.type });
        }

        return {
          id: item.id,
          file: reconstructedFile,
          name: item.name,
          size: item.size,
          type: item.type,
          originalUrl: item.originalUrl,
          thumbnailUrl: item.thumbnailUrl,
          quality: item.quality,
          aspectRatio: item.aspectRatio,
          cropX: item.cropX,
          cropY: item.cropY,
          cropWidth: item.cropWidth,
          cropHeight: item.cropHeight,
          rotation: item.rotation,
          filter: item.filter || "none",
          isCompressing: false,
          isSaving: false,
          saveStatus: null,
          compressedResult: null
        };
      });

      setQueue(restoredQueue);
      if (restoredQueue.length > 0) {
        setSelectedId(restoredQueue[0].id);
      }
      setDraftRestoreAvailable(false);
      setRestorableDraftData(null);

      setAutoSaveToast({
        isOpen: true,
        message: `Successfully loaded image editing session with ${restoredQueue.length} items.`
      });
    } catch (err) {
      console.error("Failed to restore session:", err);
      setAutoSaveToast({
        isOpen: true,
        message: "Failed to resume session draft.",
        isError: true
      });
    } finally {
      setIsRestoringDraft(false);
    }
  };
  
  // Cropping Zoom State
  const [cropZoom, setCropZoom] = useState<number>(1.0);

  // Format Conversion Dropdown State
  const [targetFormatSelection, setTargetFormatSelection] = useState<"original" | "image/webp" | "image/png" | "image/jpeg">("original");

  // Bulk Rename States
  const [renamePrefix, setRenamePrefix] = useState<string>("image");
  const [renameStartNum, setRenameStartNum] = useState<number>(1);
  const [renamePadLength, setRenamePadLength] = useState<number>(2); // e.g. 01, 02
  const [renameSuffix, setRenameSuffix] = useState<string>("_optimized");
  const [renameMode, setRenameMode] = useState<"sequential" | "affix">("affix");
  const [isRenamePanelOpen, setIsRenamePanelOpen] = useState<boolean>(false);

  // Auto-close toast notifications after 4.5 seconds
  useEffect(() => {
    if (autoSaveToast?.isOpen) {
      const t = setTimeout(() => {
        setAutoSaveToast(null);
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [autoSaveToast]);

  const handleToggleQuickCompress = () => {
    setIsQuickCompressEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("toolkit_quick_compress_enabled", next ? "true" : "false");
      return next;
    });
  };

  // Recent Sessions State
  const [sessions, setSessions] = useState<CompressionSession[]>([]);

  // Interrupted local queue backup state
  const [localBackupAvailable, setLocalBackupAvailable] = useState<boolean>(false);
  const [localBackupData, setLocalBackupData] = useState<any>(null);

  // Auto-save active queue state to local storage to recover interrupted sessions
  useEffect(() => {
    if (queue.length === 0) {
      localStorage.removeItem("toolkit_active_queue_interrupted_backup");
      return;
    }

    const backupTimeout = setTimeout(() => {
      try {
        const serializedItems = queue.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          type: item.type,
          // Limit base64 URLs to avoid hitting localStorage 5MB quota
          originalUrl: item.originalUrl && item.originalUrl.length < 300000 ? item.originalUrl : "",
          thumbnailUrl: item.thumbnailUrl && item.thumbnailUrl.length < 150000 ? item.thumbnailUrl : "",
          quality: item.quality,
          aspectRatio: item.aspectRatio,
          cropX: item.cropX,
          cropY: item.cropY,
          cropWidth: item.cropWidth,
          cropHeight: item.cropHeight,
          rotation: item.rotation,
          filter: item.filter || "none",
          compressedResult: item.compressedResult ? {
            fileName: item.compressedResult.fileName,
            originalSize: item.compressedResult.originalSize,
            compressedSize: item.compressedResult.compressedSize,
            savingPercentage: item.compressedResult.savingPercentage,
            mimeType: item.compressedResult.mimeType,
            dataUrl: item.compressedResult.dataUrl && item.compressedResult.dataUrl.length < 300000 ? item.compressedResult.dataUrl : ""
          } : null
        }));

        const payload = {
          timestamp: new Date().toISOString(),
          items: serializedItems
        };

        localStorage.setItem("toolkit_active_queue_interrupted_backup", JSON.stringify(payload));
      } catch (err) {
        console.warn("Failed to auto-save local active queue backup:", err);
      }
    }, 1500);

    return () => clearTimeout(backupTimeout);
  }, [queue]);

  const handleRestoreLocalBackup = () => {
    if (!localBackupData || !localBackupData.items) return;
    try {
      const restoredQueue: QueueItem[] = localBackupData.items.map((item: any) => {
        let reconstructedFile = new File([], item.name, { type: item.type });
        const fallbackUrl = item.originalUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80";

        return {
          id: item.id,
          file: reconstructedFile,
          name: item.name,
          size: item.size,
          type: item.type,
          originalUrl: item.originalUrl || fallbackUrl,
          thumbnailUrl: item.thumbnailUrl,
          quality: item.quality,
          aspectRatio: item.aspectRatio,
          cropX: item.cropX,
          cropY: item.cropY,
          cropWidth: item.cropWidth,
          cropHeight: item.cropHeight,
          rotation: item.rotation,
          filter: item.filter || "none",
          isCompressing: false,
          isSaving: false,
          saveStatus: null,
          compressedResult: item.compressedResult ? {
            ...item.compressedResult,
            dataUrl: item.compressedResult.dataUrl || fallbackUrl
          } : null
        };
      });

      setQueue(restoredQueue);
      if (restoredQueue.length > 0) {
        setSelectedId(restoredQueue[0].id);
      }
      setLocalBackupAvailable(false);
      setLocalBackupData(null);

      localStorage.removeItem("toolkit_active_queue_interrupted_backup");

      setAutoSaveToast({
        isOpen: true,
        message: `Successfully restored interrupted session with ${restoredQueue.length} files.`
      });
    } catch (err) {
      console.error("Failed to restore local interrupted session:", err);
    }
  };

  const handleDiscardLocalBackup = () => {
    localStorage.removeItem("toolkit_active_queue_interrupted_backup");
    setLocalBackupAvailable(false);
    setLocalBackupData(null);
  };

  // Batch compression summary modal states
  const [isBatchSummaryOpen, setIsBatchSummaryOpen] = useState<boolean>(false);
  const [batchSummaryItems, setBatchSummaryItems] = useState<QueueItem[]>([]);

  // LocalStorage integration on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("toolkit_recent_compression_sessions");
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse sessions:", e);
    }

    try {
      const backup = localStorage.getItem("toolkit_active_queue_interrupted_backup");
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && parsed.items && parsed.items.length > 0) {
          setLocalBackupAvailable(true);
          setLocalBackupData(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to check for local active queue backup:", err);
    }
  }, []);

  // Handle files passed from global screen drop
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      processMultipleFiles(initialFiles);
      if (onClearInitialFiles) {
        onClearInitialFiles();
      }
    }
  }, [initialFiles]);

  // Core compatibility states synced dynamically with selected queue item
  const [originalFile, setOriginalFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.75); // 10% to 100%
  const [aspectRatio, setAspectRatio] = useState<string>("original");
  const [customAspectW, setCustomAspectW] = useState<string>("4");
  const [customAspectH, setCustomAspectH] = useState<string>("3");
  const [imgFilter, setImgFilter] = useState<"none" | "grayscale" | "sepia" | "invert" | "blur">("none");
  
  // Drag-to-crop visual interaction states
  const [dragMode, setDragMode] = useState<"none" | "move" | "resize">("none");
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-Screen Image Preview & Comparison Modal States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"side-by-side" | "slider" | "ab-toggle">("side-by-side");
  const [dashboardView, setDashboardView] = useState<"side-by-side" | "slider" | "original" | "compressed" | "quick-toggle">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [showOriginalInAB, setShowOriginalInAB] = useState<boolean>(false);

  // EXIF Info Modal States
  const [isExifModalOpen, setIsExifModalOpen] = useState<boolean>(false);
  const [selectedExifId, setSelectedExifId] = useState<string | null>(null);
  const [exifDataMap, setExifDataMap] = useState<Record<string, any>>({});
  const [exifDimensionsMap, setExifDimensionsMap] = useState<Record<string, { width: number; height: number }>>({});
  const [loadingExifIds, setLoadingExifIds] = useState<string[]>([]);

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const inlineSliderContainerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = (clientX: number) => {
    const targetRef = isPreviewModalOpen ? sliderContainerRef : inlineSliderContainerRef;
    if (!targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, pct)));
  };

  // Window-level dragging event listeners for smooth comparison slider control
  useEffect(() => {
    if (!isDraggingSlider) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      handleSliderMove(e.clientX);
    };

    const handleWindowMouseUp = () => {
      setIsDraggingSlider(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchmove", handleWindowTouchMove, { passive: true });
    window.addEventListener("touchend", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowMouseUp);
    };
  }, [isDraggingSlider, isPreviewModalOpen]);

  const onSliderMouseDown = (e: React.MouseEvent) => {
    handleSliderMove(e.clientX);
    setIsDraggingSlider(true);
  };

  const onSliderTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
      setIsDraggingSlider(true);
    }
  };

  // Active item resolution
  const activeItem = queue.find(item => item.id === selectedId) || (queue.length > 0 ? queue[0] : null);

  // Snapshot the current configurations of the active item before any adjustments
  const saveToUndoActiveItem = () => {
    if (!activeItem) return;
    const currentState = {
      quality: activeItem.quality,
      aspectRatio: activeItem.aspectRatio || "original",
      cropX: activeItem.cropX !== undefined ? activeItem.cropX : 0,
      cropY: activeItem.cropY !== undefined ? activeItem.cropY : 0,
      cropWidth: activeItem.cropWidth !== undefined ? activeItem.cropWidth : 1,
      cropHeight: activeItem.cropHeight !== undefined ? activeItem.cropHeight : 1,
      rotation: activeItem.rotation || 0,
      filter: activeItem.filter || "none" as const,
    };

    setUndoHistory(prev => {
      const list = prev[activeItem.id] || [];
      // Prevent consecutive identical snapshot duplicates
      const last = list[list.length - 1];
      if (last &&
          last.quality === currentState.quality &&
          last.aspectRatio === currentState.aspectRatio &&
          last.cropX === currentState.cropX &&
          last.cropY === currentState.cropY &&
          last.cropWidth === currentState.cropWidth &&
          last.cropHeight === currentState.cropHeight &&
          last.rotation === currentState.rotation &&
          last.filter === currentState.filter) {
        return prev;
      }
      return {
        ...prev,
        [activeItem.id]: [...list.slice(-49), currentState]
      };
    });
  };

  const handleUndo = () => {
    if (!activeItem) return;
    const list = undoHistory[activeItem.id];
    if (!list || list.length === 0) return;

    const previousState = list[list.length - 1];
    const newHistoryList = list.slice(0, list.length - 1);

    setUndoHistory(prev => ({
      ...prev,
      [activeItem.id]: newHistoryList
    }));

    // Apply reverted state onto QueueItem
    setQueue(prevQueue => prevQueue.map(item => {
      if (item.id === activeItem.id) {
        return {
          ...item,
          quality: previousState.quality,
          aspectRatio: previousState.aspectRatio,
          cropX: previousState.cropX,
          cropY: previousState.cropY,
          cropWidth: previousState.cropWidth,
          cropHeight: previousState.cropHeight,
          rotation: previousState.rotation,
          filter: previousState.filter || "none",
          compressedResult: null, // Clear compression cache
        };
      }
      return item;
    }));

    // Synergize and synchronize local standard states for sliders to refresh real-time
    setQuality(previousState.quality);
    setAspectRatio(previousState.aspectRatio);
    setImgFilter(previousState.filter || "none");
  };

  // Sync active queue item back into compatibility states
  useEffect(() => {
    if (activeItem) {
      setOriginalFile({
        name: activeItem.name,
        size: activeItem.size,
        type: activeItem.type,
      });
      setOriginalUrl(activeItem.originalUrl);
      setQuality(activeItem.quality);
      setAspectRatio(activeItem.aspectRatio || "original");
      setCompressedResult(activeItem.compressedResult);
      setIsCompressing(activeItem.isCompressing);
      setIsSaving(activeItem.isSaving);
      setSaveStatus(activeItem.saveStatus);
      setImgFilter(activeItem.filter || "none");
    } else {
      setOriginalFile(null);
      setOriginalUrl(null);
      setQuality(0.75);
      setAspectRatio("original");
      setCompressedResult(null);
      setIsCompressing(false);
      setIsSaving(false);
      setSaveStatus(null);
      setImgFilter("none");
    }
  }, [activeItem, selectedId, queue]);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  const drawComparisonOnCanvas = async (canvas: HTMLCanvasElement): Promise<void> => {
    if (!activeItem || !activeItem.compressedResult) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1200;
    let height = 630;

    let origImg: HTMLImageElement;
    let compImg: HTMLImageElement;
    try {
      origImg = await loadImage(activeItem.originalUrl);
      compImg = await loadImage(activeItem.compressedResult.dataUrl);
    } catch (err) {
      console.error("Failed to load images for social comparison", err);
      return;
    }

    if (compDimensions === "square") {
      width = 1080;
      height = 1080;
    } else if (compDimensions === "original") {
      const maxDim = 2048; // Prevent crash on massive sizes
      let origW = origImg.width;
      let origH = origImg.height;
      if (origW > maxDim || origH > maxDim) {
        const ratio = origW / origH;
        if (origW > origH) {
          origW = maxDim;
          origH = Math.round(maxDim / ratio);
        } else {
          origH = maxDim;
          origW = Math.round(maxDim * ratio);
        }
      }
      if (compLayout === "horizontal") {
        width = origW * 2 + 20; // 20px gap/margins
        height = origH + 140; // 140px for header/footer
      } else {
        width = origW + 20;
        height = origH * 2 + 140; // 140px for header/footer
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Theme Colors
    let bgGradient: CanvasGradient | string;
    let textColor = "#f1f5f9";
    let textColorMuted = "#94a3b8";
    let cardBg = "#0f172a";
    let borderStroke = "#334155";
    let accentColor = "#6366f1";

    if (compTheme === "light") {
      bgGradient = "#f8fafc";
      textColor = "#0f172a";
      textColorMuted = "#64748b";
      cardBg = "#ffffff";
      borderStroke = "#e2e8f0";
      accentColor = "#4f46e5";
    } else if (compTheme === "indigo-glow") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(0.5, "#1e1b4b");
      grad.addColorStop(1, "#090d16");
      bgGradient = grad;
      textColor = "#ffffff";
      textColorMuted = "#a5b4fc";
      cardBg = "rgba(15, 23, 42, 0.6)";
      borderStroke = "rgba(99, 102, 241, 0.25)";
      accentColor = "#818cf8";
    } else {
      // Default Dark
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0b0f19");
      grad.addColorStop(1, "#1e293b");
      bgGradient = grad;
      textColor = "#f8fafc";
      textColorMuted = "#64748b";
      cardBg = "#020617";
      borderStroke = "#1e293b";
      accentColor = "#6366f1";
    }

    // Paint Background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Header Setup
    const headerText = compTitle || activeItem.name.substring(0, 30);
    const headerH = 80;
    ctx.fillStyle = textColor;
    ctx.font = `bold ${width > 800 ? "24px" : "18px"} sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(headerText, 30, 40);

    // Subtitle with stats
    const savedSpace = formatFileSize(activeItem.size - activeItem.compressedResult.compressedSize);
    ctx.fillStyle = accentColor;
    ctx.font = `bold ${width > 800 ? "13px" : "11px"} sans-serif`;
    ctx.fillText(`SAVED ${savedSpace} SPACE (${activeItem.compressedResult.savingPercentage}% COMPRESSION RATIO)`, 30, 62);

    // Draw Image Zones
    const footerH = 60;
    const padding = 20;
    const contentY = headerH;
    const contentH = height - headerH - footerH;

    const drawZoneImg = (img: HTMLImageElement, zX: number, zY: number, zW: number, zH: number, label: string) => {
      // Render Card Container
      ctx.fillStyle = cardBg;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(zX, zY, zW, zH, 12);
      } else {
        ctx.rect(zX, zY, zW, zH);
      }
      ctx.fill();
      ctx.strokeStyle = borderStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Clip Zone
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(zX + 2, zY + 2, zW - 4, zH - 4, 10);
      } else {
        ctx.rect(zX + 2, zY + 2, zW - 4, zH - 4);
      }
      ctx.clip();

      // Draw Image inside Box
      const imgRatio = img.width / img.height;
      const boxRatio = zW / zH;
      let dW = zW;
      let dH = zH;
      let dX = zX;
      let dY = zY;

      if (compFit === "contain") {
        if (imgRatio > boxRatio) {
          dW = zW - 12;
          dH = dW / imgRatio;
          dX = zX + 6;
          dY = zY + (zH - dH) / 2;
        } else {
          dH = zH - 12;
          dW = dH * imgRatio;
          dX = zX + (zW - dW) / 2;
          dY = zY + 6;
        }
        ctx.drawImage(img, dX, dY, dW, dH);
      } else {
        // Cover mode
        let sX = 0, sY = 0, sW = img.width, sH = img.height;
        if (imgRatio > boxRatio) {
          sW = img.height * boxRatio;
          sX = (img.width - sW) / 2;
        } else {
          sH = img.width / boxRatio;
          sY = (img.height - sH) / 2;
        }
        ctx.drawImage(img, sX, sY, sW, sH, zX, zY, zW, zH);
      }
      ctx.restore();

      // Draw Pill Corner Badge Label
      const textLabel = label;
      ctx.font = "bold 11px sans-serif";
      const textW = ctx.measureText(textLabel).width;
      const badgeW = textW + 24;
      const badgeH = 26;
      const bX = zX + 15;
      const bY = zY + 15;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bX, bY, badgeW, badgeH, 12);
      } else {
        ctx.rect(bX, bY, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textLabel, bX + badgeW / 2, bY + badgeH / 2);
    };

    if (compLayout === "horizontal") {
      const boxW = (width - padding * 3) / 2;
      const boxH = contentH - padding;
      
      // Left Box - Original
      const labelOriginal = compLeftLabel || `Original • ${formatFileSize(activeItem.size)}`;
      drawZoneImg(origImg, padding, contentY, boxW, boxH, labelOriginal);

      // Right Box - Optimized
      const labelOptimized = compRightLabel || `Optimized (-${activeItem.compressedResult.savingPercentage}%) • ${formatFileSize(activeItem.compressedResult.compressedSize)}`;
      drawZoneImg(compImg, padding * 2 + boxW, contentY, boxW, boxH, labelOptimized);
    } else {
      // Vertical Stacked
      const boxW = width - padding * 2;
      const boxH = (contentH - padding * 3) / 2;

      // Top Box - Original
      const labelOriginal = compLeftLabel || `Original • ${formatFileSize(activeItem.size)}`;
      drawZoneImg(origImg, padding, contentY, boxW, boxH, labelOriginal);

      // Bottom Box - Optimized
      const labelOptimized = compRightLabel || `Optimized (-${activeItem.compressedResult.savingPercentage}%) • ${formatFileSize(activeItem.compressedResult.compressedSize)}`;
      drawZoneImg(compImg, padding, contentY + boxH + padding, boxW, boxH, labelOptimized);
    }

    // Footer Content
    const footerY = height - footerH;
    ctx.strokeStyle = borderStroke;
    ctx.beginPath();
    ctx.moveTo(30, footerY);
    ctx.lineTo(width - 30, footerY);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw stats or brand
    ctx.fillStyle = textColorMuted;
    ctx.font = "bold 11px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    
    const formattedSaving = `Saving: -${activeItem.compressedResult.savingPercentage}% | Reduced ${formatFileSize(activeItem.size - activeItem.compressedResult.compressedSize)}`;
    ctx.fillText(formattedSaving, 30, footerY + footerH / 2);

    if (compShowBranding) {
      ctx.textAlign = "right";
      ctx.fillStyle = accentColor;
      ctx.fillText(compBrandingText, width - 30, footerY + footerH / 2);
    }
  };

  // Sync inputs for side-by-side comparison share modal
  useEffect(() => {
    if (isComparisonModalOpen && activeItem && activeItem.compressedResult) {
      setCompTitle(activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) + " Comparison");
      setCompLeftLabel(`Original File • ${formatFileSize(activeItem.size)}`);
      setCompRightLabel(`Optimized File • ${formatFileSize(activeItem.compressedResult.compressedSize)}`);
    }
  }, [isComparisonModalOpen, activeItem]);

  // Live Draw Preview Side-by-Side Canvas trigger
  useEffect(() => {
    if (isComparisonModalOpen && comparisonCanvasRef.current && activeItem && activeItem.compressedResult) {
      drawComparisonOnCanvas(comparisonCanvasRef.current).catch((err) => {
        console.error("Failed to render side-by-side export preview.", err);
      });
    }
  }, [
    isComparisonModalOpen,
    compLayout,
    compDimensions,
    compFit,
    compTheme,
    compTitle,
    compLeftLabel,
    compRightLabel,
    compShowBranding,
    compBrandingText,
    activeItem
  ]);

  const handleDownloadComparisonImage = () => {
    if (!comparisonCanvasRef.current || !activeItem) return;
    setIsGeneratingComparison(true);
    try {
      const dataUrl = comparisonCanvasRef.current.toDataURL("image/png");
      const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
      const downloadName = `${baseName}_side_by_side_comparison.png`;
      
      const link = document.createElement("a");
      link.download = downloadName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download comparison", err);
      alert("Failed to export comparison image. Please try again.");
    } finally {
      setIsGeneratingComparison(false);
    }
  };

  // Process and load multiple selected/dropped files
  const processMultipleFiles = (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList).filter(file => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      alert("Invalid selection! Please select or drop valid JPEG, PNG, or WebP images.");
      return;
    }

    const promisedItems = validFiles.map((file) => {
      return new Promise<QueueItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const rawDataUrl = e.target.result as string;
            // Generate lightning-fast optimized low-res thumbnail
            const thumbnail = await generateLowResThumbnail(rawDataUrl);
            const item: QueueItem = {
              id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
              file: file,
              name: file.name,
              size: file.size,
              type: file.type,
              originalUrl: rawDataUrl,
              thumbnailUrl: thumbnail,
              quality: 0.75, // default
              aspectRatio: "original",
              cropX: 0,
              cropY: 0,
              cropWidth: 1,
              cropHeight: 1,
              rotation: 0,
              compressedResult: null,
              isCompressing: false,
              isSaving: false,
              saveStatus: null
            };
            resolve(item);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promisedItems).then((newItems) => {
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: newItems.length === 1 ? `Staged image: ${newItems[0].name}` : `Staged ${newItems.length} images`,
          detail: newItems.length === 1 ? `Loaded for compression quality adjustments` : "Populated compressor queue batch",
          icon: "FileImage",
          tab: "compress"
        }
      }));

      if (isQuickCompressEnabled) {
        // Immediately compress in the background before adding to the queue!
        const itemsWithCompState = newItems.map(item => ({ ...item, isCompressing: true }));
        setQueue(prev => {
          const updated = [...prev, ...itemsWithCompState];
          if (!selectedId && itemsWithCompState.length > 0) {
            setSelectedId(itemsWithCompState[0].id);
          }
          return updated;
        });

        // Perform compression
        Promise.all(
          itemsWithCompState.map(item => compressSingleItem(item, item.quality))
        ).then((compressedItems) => {
          setQueue(prev => {
            const updated = prev.map(q => {
              const comp = compressedItems.find(c => c.id === q.id);
              const resultItem = comp ? comp : q;
              // Trigger Auto-Save if enabled
              if (isAutoSaveEnabled && resultItem.compressedResult) {
                triggerAutoSave(resultItem);
              }
              return resultItem;
            });
            saveBatchSession(updated);
            return updated;
          });

          // Upload to Google Drive if isSaveToDriveOnCompress is enabled
          if (isSaveToDriveOnCompress) {
            if (user && accessToken) {
              compressedItems.forEach((item) => {
                if (item.compressedResult) {
                  autoSaveSingleToDriveDirect(item);
                }
              });
            } else {
              setAutoSaveToast({
                isOpen: true,
                message: "Staged files compressed but cannot upload because you are not logged in to Google Drive.",
                isError: true
              });
            }
          }
        }).catch(err => {
          console.error("Batch auto compress failed:", err);
        });
      } else {
        // Standard preview step
        setQueue(prev => {
          const updated = [...prev, ...newItems];
          // Automatically select the first file from the batch if none was selected
          if (!selectedId && newItems.length > 0) {
            setSelectedId(newItems[0].id);
          }
          return updated;
        });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processMultipleFiles(files);
    }
  };

  // Drag and drop handlers (for the component-specific box)
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  // Global Drag and Drop over the whole workspace
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(true);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  // Visual filter sync for the currently selected item
  const handleFilterChange = (val: "none" | "grayscale" | "sepia" | "invert" | "blur") => {
    saveToUndoActiveItem();
    setImgFilter(val);
    if (selectedId) {
      setQueue(prev => prev.map(item => item.id === selectedId ? { ...item, filter: val, compressedResult: null } : item));
    }
  };

  // Quality sync for the currently selected item
  const handleQualityChange = (val: number) => {
    setQuality(val);
    if (selectedId) {
      setQueue(prev => prev.map(item => item.id === selectedId ? { ...item, quality: val } : item));
    }
  };

  // Aspect ratio sync for the currently selected item
  const handleAspectRatioChange = (val: string) => {
    saveToUndoActiveItem();
    setAspectRatio(val);
    if (selectedId && activeItem) {
      setQueue(prev => prev.map(item => {
        if (item.id === selectedId) {
          let cropX = 0;
          let cropY = 0;
          let cropWidth = 1;
          let cropHeight = 1;
          
          if (val !== "original" && val !== "custom") {
            let targetRatio = 1;
            if (val.includes(":")) {
              const parts = val.split(":");
              targetRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
              if (isNaN(targetRatio) || targetRatio <= 0) targetRatio = 1;
            } else {
              if (val === "1:1") targetRatio = 1;
              else if (val === "16:9") targetRatio = 16 / 9;
              else if (val === "9:16") targetRatio = 9 / 16;
              else if (val === "4:3") targetRatio = 4 / 3;
              else if (val === "2:3") targetRatio = 2 / 3;
            }

            // Fetch actual natural crop bounds
            const imgEl = document.getElementById("cropping-target-img") as HTMLImageElement;
            const naturalW = imgEl ? imgEl.naturalWidth : 1000;
            const naturalH = imgEl ? imgEl.naturalHeight : 1000;
            const imgRatio = naturalW / naturalH;
            
            if (imgRatio > targetRatio) {
              cropWidth = targetRatio / imgRatio;
              cropHeight = 1;
              cropX = (1 - cropWidth) / 2;
              cropY = 0;
            } else {
              cropWidth = 1;
              cropHeight = imgRatio / targetRatio;
              cropX = 0;
              cropY = (1 - cropHeight) / 2;
            }
          }
          
          return {
            ...item,
            aspectRatio: val,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            compressedResult: null, // Clear compression cache
          };
        }
        return item;
      }));
    }
  };

  const handleRotation = (degree: number) => {
    if (!selectedId) return;
    saveToUndoActiveItem();
    setQueue(prev => prev.map(item => {
      if (item.id === selectedId) {
        const currentRotation = item.rotation || 0;
        const newRotation = (currentRotation + degree + 360) % 360;
        return {
          ...item,
          rotation: newRotation,
          compressedResult: null, // clear compressed cache so it's re-rendered rotated
        };
      }
      return item;
    }));
  };

  // EXIF loading hook inside component
  useEffect(() => {
    if (!isExifModalOpen) return;

    // Set default selected EXIF item if none selected or the selected one isn't in queue anymore
    if (queue.length > 0) {
      if (!selectedExifId || !queue.some(q => q.id === selectedExifId)) {
        setSelectedExifId(queue[0].id);
      }
    }

    const loadExifAndDims = async () => {
      // Find files whose EXIF isn't yet cached and not actively loading
      const pendingItems = queue.filter(
        item => !exifDataMap[item.id] && !loadingExifIds.includes(item.id)
      );

      if (pendingItems.length === 0) return;

      const pendingIds = pendingItems.map(item => item.id);
      setLoadingExifIds(prev => [...prev, ...pendingIds]);

      for (const item of pendingItems) {
        try {
          // Measure image dimensions
          const dimensionsPromise = new Promise<{ width: number; height: number }>((resolveDim) => {
            const img = new Image();
            img.onload = () => {
              resolveDim({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
              resolveDim({ width: 0, height: 0 });
            };
            img.src = item.originalUrl;
          });

          // Extract EXIF via exifreader
          const exifPromise = (async () => {
            const supportExif = ["image/jpeg", "image/tiff", "image/webp", "image/png", "image/heic"];
            if (supportExif.includes(item.file.type.toLowerCase())) {
              try {
                const tags = await ExifReader.load(item.file);
                return tags;
              } catch (exifErr) {
                console.log("No Exif segment or parse error for", item.name, exifErr);
                return null;
              }
            }
            return null;
          })();

          const [dims, tags] = await Promise.all([dimensionsPromise, exifPromise]);

          setExifDimensionsMap(prev => ({
            ...prev,
            [item.id]: dims
          }));

          if (tags) {
            setExifDataMap(prev => ({
              ...prev,
              [item.id]: tags
            }));
          } else {
            // Placeholder so we don't try to load it again
            setExifDataMap(prev => ({
              ...prev,
              [item.id]: { "None": { description: "No EXIF found" } }
            }));
          }
        } catch (err) {
          console.error("Error loading EXIF metadata for file: " + item.name, err);
          // Set placeholders to avoid infinite re-loading loops
          setExifDimensionsMap(prev => ({ ...prev, [item.id]: { width: 0, height: 0 } }));
          setExifDataMap(prev => ({ ...prev, [item.id]: { "None": { description: "No EXIF found" } } }));
        }
      }

      setLoadingExifIds(prev => prev.filter(id => !pendingIds.includes(id)));
    };

    loadExifAndDims();
  }, [isExifModalOpen, queue]);

  const updateActiveItemCrop = (updates: {
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    aspectRatio?: "original" | "1:1" | "16:9" | "9:16" | "4:3" | "2:3" | "custom";
  }) => {
    if (!selectedId) return;
    setQueue(prev => prev.map(item => {
      if (item.id === selectedId) {
        const current = {
          cropX: item.cropX !== undefined ? item.cropX : 0,
          cropY: item.cropY !== undefined ? item.cropY : 0,
          cropWidth: item.cropWidth !== undefined ? item.cropWidth : 1,
          cropHeight: item.cropHeight !== undefined ? item.cropHeight : 1,
          aspectRatio: item.aspectRatio || "original",
        };
        
        const next = { ...current, ...updates };
        
        // Boundaries checks
        if (next.cropWidth < 0.05) next.cropWidth = 0.05;
        if (next.cropHeight < 0.05) next.cropHeight = 0.05;
        if (next.cropWidth > 1) next.cropWidth = 1;
        if (next.cropHeight > 1) next.cropHeight = 1;
        
        if (next.cropX < 0) next.cropX = 0;
        if (next.cropY < 0) next.cropY = 0;
        if (next.cropX + next.cropWidth > 1) {
          next.cropX = 1 - next.cropWidth;
        }
        if (next.cropY + next.cropHeight > 1) {
          next.cropY = 1 - next.cropHeight;
        }

        return {
          ...item,
          ...next,
          compressedResult: null, // clear compressed cache when visual cropping coordinates shift
        };
      }
      return item;
    }));
  };

  const handleOverlayMouseDown = (e: React.MouseEvent, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeItem) return;
    saveToUndoActiveItem();
    
    setDragMode(mode);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: activeItem.cropX !== undefined ? activeItem.cropX : 0,
      cropY: activeItem.cropY !== undefined ? activeItem.cropY : 0,
      cropWidth: activeItem.cropWidth !== undefined ? activeItem.cropWidth : 1,
      cropHeight: activeItem.cropHeight !== undefined ? activeItem.cropHeight : 1,
    };
  };

  const handleOverlayTouchStart = (e: React.TouchEvent, mode: "move" | "resize") => {
    if (!activeItem || !e.touches || !e.touches[0]) return;
    e.stopPropagation();
    saveToUndoActiveItem();
    
    setDragMode(mode);
    dragStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      cropX: activeItem.cropX !== undefined ? activeItem.cropX : 0,
      cropY: activeItem.cropY !== undefined ? activeItem.cropY : 0,
      cropWidth: activeItem.cropWidth !== undefined ? activeItem.cropWidth : 1,
      cropHeight: activeItem.cropHeight !== undefined ? activeItem.cropHeight : 1,
    };
  };

  // Drag interaction document listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragMode === "none" || !overlayRef.current || !activeItem) return;
      
      const rect = overlayRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const deltaX = (e.clientX - dragStart.current.x) / rect.width;
      const deltaY = (e.clientY - dragStart.current.y) / rect.height;
      
      const rRad = -((activeItem.rotation || 0) * Math.PI) / 180;
      const adjustedDeltaX = deltaX * Math.cos(rRad) - deltaY * Math.sin(rRad);
      const adjustedDeltaY = deltaX * Math.sin(rRad) + deltaY * Math.cos(rRad);
      
      if (dragMode === "move") {
        let nextX = dragStart.current.cropX + adjustedDeltaX;
        let cyberY = dragStart.current.cropY + adjustedDeltaY;
        
        if (nextX < 0) nextX = 0;
        if (cyberY < 0) cyberY = 0;
        if (nextX + dragStart.current.cropWidth > 1) {
          nextX = 1 - dragStart.current.cropWidth;
        }
        if (cyberY + dragStart.current.cropHeight > 1) {
          cyberY = 1 - dragStart.current.cropHeight;
        }
        
        updateActiveItemCrop({ cropX: nextX, cropY: cyberY });
      } else if (dragMode === "resize") {
        let nextW = dragStart.current.cropWidth + adjustedDeltaX;
        let nextH = dragStart.current.cropHeight + adjustedDeltaY;
        
        if (nextW < 0.05) nextW = 0.05;
        if (nextH < 0.05) nextH = 0.05;
        if (dragStart.current.cropX + nextW > 1) {
          nextW = 1 - dragStart.current.cropX;
        }
        if (dragStart.current.cropY + nextH > 1) {
          nextH = 1 - dragStart.current.cropY;
        }
        
        const targetRatioSetting = activeItem.aspectRatio || "original";
        if (targetRatioSetting !== "original" && targetRatioSetting !== "custom") {
          let ratio = 1;
          if (targetRatioSetting.includes(":")) {
            const parts = targetRatioSetting.split(":");
            ratio = parseFloat(parts[0]) / parseFloat(parts[1]);
            if (isNaN(ratio) || ratio <= 0) ratio = 1;
          } else {
            if (targetRatioSetting === "1:1") ratio = 1;
            else if (targetRatioSetting === "16:9") ratio = 16 / 9;
            else if (targetRatioSetting === "9:16") ratio = 9 / 16;
            else if (targetRatioSetting === "4:3") ratio = 4 / 3;
            else if (targetRatioSetting === "2:3") ratio = 2 / 3;
          }
          
          const img = document.getElementById("cropping-target-img") as HTMLImageElement;
          if (img) {
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const mapRatio = ratio / imgRatio;
            
            nextH = nextW / mapRatio;
            
            if (dragStart.current.cropY + nextH > 1) {
              nextH = 1 - dragStart.current.cropY;
              nextW = nextH * mapRatio;
            }
          }
        }
        
        updateActiveItemCrop({ cropWidth: nextW, cropHeight: nextH });
      }
    };
    
    const handleMouseUp = () => {
      setDragMode("none");
    };
    
    if (dragMode !== "none") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragMode, activeItem, selectedId]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (dragMode === "none" || !overlayRef.current || !activeItem || !e.touches || !e.touches[0]) return;
      
      const rect = overlayRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const deltaX = (e.touches[0].clientX - dragStart.current.x) / rect.width;
      const deltaY = (e.touches[0].clientY - dragStart.current.y) / rect.height;
      
      const rRad = -((activeItem.rotation || 0) * Math.PI) / 180;
      const adjustedDeltaX = deltaX * Math.cos(rRad) - deltaY * Math.sin(rRad);
      const adjustedDeltaY = deltaX * Math.sin(rRad) + deltaY * Math.cos(rRad);
      
      if (dragMode === "move") {
        let nextX = dragStart.current.cropX + adjustedDeltaX;
        let nextY = dragStart.current.cropY + adjustedDeltaY;
        
        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;
        if (nextX + dragStart.current.cropWidth > 1) {
          nextX = 1 - dragStart.current.cropWidth;
        }
        if (nextY + dragStart.current.cropHeight > 1) {
          nextY = 1 - dragStart.current.cropHeight;
        }
        
        updateActiveItemCrop({ cropX: nextX, cropY: nextY });
      } else if (dragMode === "resize") {
        let nextW = dragStart.current.cropWidth + adjustedDeltaX;
        let nextH = dragStart.current.cropHeight + adjustedDeltaY;
        
        if (nextW < 0.05) nextW = 0.05;
        if (nextH < 0.05) nextH = 0.05;
        if (dragStart.current.cropX + nextW > 1) {
          nextW = 1 - dragStart.current.cropX;
        }
        if (dragStart.current.cropY + nextH > 1) {
          nextH = 1 - dragStart.current.cropY;
        }
        
        const targetRatioSetting = activeItem.aspectRatio || "original";
        if (targetRatioSetting !== "original" && targetRatioSetting !== "custom") {
          let ratio = 1;
          if (targetRatioSetting.includes(":")) {
            const parts = targetRatioSetting.split(":");
            ratio = parseFloat(parts[0]) / parseFloat(parts[1]);
            if (isNaN(ratio) || ratio <= 0) ratio = 1;
          } else {
            if (targetRatioSetting === "1:1") ratio = 1;
            else if (targetRatioSetting === "16:9") ratio = 16 / 9;
            else if (targetRatioSetting === "9:16") ratio = 9 / 16;
            else if (targetRatioSetting === "4:3") ratio = 4 / 3;
            else if (targetRatioSetting === "2:3") ratio = 2 / 3;
          }
          
          const img = document.getElementById("cropping-target-img") as HTMLImageElement;
          if (img) {
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const mapRatio = ratio / imgRatio;
            
            nextH = nextW / mapRatio;
            
            if (dragStart.current.cropY + nextH > 1) {
              nextH = 1 - dragStart.current.cropY;
              nextW = nextH * mapRatio;
            }
          }
        }
        
        updateActiveItemCrop({ cropWidth: nextW, cropHeight: nextH });
      }
    };
    
    const handleTouchEnd = () => {
      setDragMode("none");
    };
    
    if (dragMode !== "none") {
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragMode, activeItem, selectedId]);

  // Core drawing and compressor function
  const compressSingleItem = (item: QueueItem, targetQuality: number): Promise<QueueItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        // Prioritize custom cropped dimensions if explicitly configured
        if (item.cropX !== undefined && item.cropY !== undefined && item.cropWidth !== undefined && item.cropHeight !== undefined) {
          sx = item.cropX * img.width;
          sy = item.cropY * img.height;
          sWidth = item.cropWidth * img.width;
          sHeight = item.cropHeight * img.height;
        } else {
          // Fall back to center aspect crop formulas
          const targetRatioSetting = item.aspectRatio || "original";
          if (targetRatioSetting !== "original" && targetRatioSetting !== "custom") {
            let targetRatio = 1;
            if (targetRatioSetting.includes(":")) {
              const parts = targetRatioSetting.split(":");
              targetRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
              if (isNaN(targetRatio) || targetRatio <= 0) targetRatio = 1;
            } else {
              if (targetRatioSetting === "1:1") targetRatio = 1;
              else if (targetRatioSetting === "16:9") targetRatio = 16 / 9;
              else if (targetRatioSetting === "9:16") targetRatio = 9 / 16;
              else if (targetRatioSetting === "4:3") targetRatio = 4 / 3;
              else if (targetRatioSetting === "2:3") targetRatio = 2 / 3;
            }

            const currentRatio = img.width / img.height;
            if (currentRatio > targetRatio) {
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
            } else {
              sHeight = img.width / targetRatio;
              sy = (img.height - sHeight) / 2;
            }
          }
        }

        const rotation = item.rotation || 0;
        const angleRad = (rotation * Math.PI) / 180;
        const is90or270 = (rotation % 180) !== 0;

        const canvasWidth = is90or270 ? sHeight : sWidth;
        const canvasHeight = is90or270 ? sWidth : sHeight;

        let scale = 1;
        if (isSmartResizeEnabled) {
          const maxW = smartResizeMaxWidth || 1920;
          const maxH = smartResizeMaxHeight || 1080;
          if (canvasWidth > maxW || canvasHeight > maxH) {
            scale = Math.min(maxW / canvasWidth, maxH / canvasHeight);
          }
        }

        const finalCanvasWidth = Math.round(canvasWidth * scale);
        const finalCanvasHeight = Math.round(canvasHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = finalCanvasWidth;
        canvas.height = finalCanvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            ...item,
            isCompressing: false,
            saveStatus: { success: false, msg: "Failed to initialize canvas Context." }
          });
          return;
        }

        if (scale !== 1) {
          ctx.scale(scale, scale);
        }
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(angleRad);
        
        // Apply visual filter before drawing if set!
        if (item.filter && item.filter !== "none") {
          if (item.filter === "grayscale") ctx.filter = "grayscale(100%)";
          else if (item.filter === "sepia") ctx.filter = "sepia(100%)";
          else if (item.filter === "invert") ctx.filter = "invert(100%)";
          else if (item.filter === "blur") ctx.filter = "blur(4px)";
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
        ctx.filter = "none"; // Reset filter context for watermarks or future actions
        
        // Draw Watermark if enabled
        if (isWatermarkEnabled) {
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform back to standard pixels
          ctx.globalAlpha = watermarkOpacity;
          
          if (watermarkType === "text" && watermarkText) {
            const fontSize = Math.max(12, Math.round(finalCanvasWidth * (watermarkSize / 100)));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = watermarkColor;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            
            const textHeight = fontSize;
            const paddingX = Math.max(10, finalCanvasWidth * 0.05);
            const paddingY = Math.max(10, finalCanvasHeight * 0.05);
            
            if (watermarkPosition === "top-left") {
              ctx.textAlign = "left";
              ctx.fillText(watermarkText, paddingX, paddingY + textHeight / 2);
            } else if (watermarkPosition === "top-right") {
              ctx.textAlign = "right";
              ctx.fillText(watermarkText, finalCanvasWidth - paddingX, paddingY + textHeight / 2);
            } else if (watermarkPosition === "bottom-left") {
              ctx.textAlign = "left";
              ctx.fillText(watermarkText, paddingX, finalCanvasHeight - paddingY - textHeight / 2);
            } else if (watermarkPosition === "bottom-right") {
              ctx.textAlign = "right";
              ctx.fillText(watermarkText, finalCanvasWidth - paddingX, finalCanvasHeight - paddingY - textHeight / 2);
            } else if (watermarkPosition === "center") {
              ctx.textAlign = "center";
              ctx.fillText(watermarkText, finalCanvasWidth / 2, finalCanvasHeight / 2);
            } else if (watermarkPosition === "tiled") {
              ctx.textAlign = "center";
              const stepX = Math.max(120, fontSize * 6);
              const stepY = Math.max(80, fontSize * 4);
              
              ctx.save();
              ctx.translate(finalCanvasWidth / 2, finalCanvasHeight / 2);
              ctx.rotate(-Math.PI / 6); // -30 degrees
              
              const limit = Math.max(finalCanvasWidth, finalCanvasHeight) * 2;
              for (let x = -limit; x < limit; x += stepX) {
                for (let y = -limit; y < limit; y += stepY) {
                  ctx.fillText(watermarkText, x, y);
                }
              }
              ctx.restore();
            }
          } else if (watermarkType === "logo" && watermarkLogoUrl) {
            await new Promise<void>((resolveLogo) => {
              const logoImg = new Image();
              logoImg.onload = () => {
                const pct = watermarkSize / 100;
                let targetW = finalCanvasWidth * pct;
                if (targetW < 16) targetW = 16;
                if (targetW > finalCanvasWidth) targetW = finalCanvasWidth * 0.8;
                
                const ratio = logoImg.width / logoImg.height;
                const targetH = targetW / ratio;
                
                const paddingX = Math.max(10, finalCanvasWidth * 0.05);
                const paddingY = Math.max(10, finalCanvasHeight * 0.05);
                
                let x = 0;
                let y = 0;
                
                if (watermarkPosition === "top-left") {
                  x = paddingX;
                  y = paddingY;
                } else if (watermarkPosition === "top-right") {
                  x = finalCanvasWidth - targetW - paddingX;
                  y = paddingY;
                } else if (watermarkPosition === "bottom-left") {
                  x = paddingX;
                  y = finalCanvasHeight - targetH - paddingY;
                } else if (watermarkPosition === "bottom-right") {
                  x = finalCanvasWidth - targetW - paddingX;
                  y = finalCanvasHeight - targetH - paddingY;
                } else if (watermarkPosition === "center") {
                  x = (finalCanvasWidth - targetW) / 2;
                  y = (finalCanvasHeight - targetH) / 2;
                } else if (watermarkPosition === "tiled") {
                  const stepX = Math.max(120, targetW * 3);
                  const stepY = Math.max(80, targetH * 3);
                  
                  ctx.save();
                  ctx.translate(finalCanvasWidth / 2, finalCanvasHeight / 2);
                  ctx.rotate(-Math.PI / 6);
                  
                  const limit = Math.max(finalCanvasWidth, finalCanvasHeight) * 2;
                  for (let offsetX = -limit; offsetX < limit; offsetX += stepX) {
                    for (let offsetY = -limit; offsetY < limit; offsetY += stepY) {
                      ctx.drawImage(logoImg, offsetX - targetW / 2, offsetY - targetH / 2, targetW, targetH);
                    }
                  }
                  ctx.restore();
                  resolveLogo();
                  return;
                }
                
                ctx.drawImage(logoImg, x, y, targetW, targetH);
                resolveLogo();
              };
              logoImg.onerror = () => {
                console.error("Watermark logo failed to load");
                resolveLogo();
              };
              logoImg.src = watermarkLogoUrl;
            });
          }
          ctx.globalAlpha = 1.0;
        }
        
        let targetMime = item.type;
        if (targetFormatSelection === "original") {
          if (item.type === "image/png") {
            targetMime = "image/jpeg"; // best compression ratio
          }
        } else {
          targetMime = targetFormatSelection;
        }

        const handleResult = (finalDataUrl: string, finalSize: number) => {
          const ext = getExtensionForMime(targetMime);
          const baseNameWOExt = item.name.replace(/\.[^/.]+$/, "");
          const finalSavingPct = Math.round(((item.size - finalSize) / item.size) * 100);
          
          const compressedResult: CompressionResult = {
            fileName: `${baseNameWOExt}_compressed${ext}`,
            mimeType: targetMime,
            originalSize: item.size,
            compressedSize: finalSize,
            savingPercentage: Math.max(0, finalSavingPct),
            dataUrl: finalDataUrl,
          };

          resolve({
            ...item,
            quality: targetQuality,
            compressedResult,
            isCompressing: false,
          });
        };

        const compressedDataUrl = canvas.toDataURL(targetMime, targetQuality);
        const base64Content = compressedDataUrl.substring(compressedDataUrl.indexOf(",") + 1);
        const compressedSize = Math.round((base64Content.length * 3) / 4);

        if (!stripExifMetadata && targetMime === "image/jpeg" && item.file) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const arrayBuffer = reader.result as ArrayBuffer;
              const modifiedBase64 = copyExif(arrayBuffer, base64Content);
              if (modifiedBase64 !== base64Content) {
                const newDataUrl = `data:image/jpeg;base64,${modifiedBase64}`;
                const newSize = Math.round((modifiedBase64.length * 3) / 4);
                handleResult(newDataUrl, newSize);
                return;
              }
            } catch (err) {
              console.error("EXIF copy error, falling back to clean compressed image:", err);
            }
            handleResult(compressedDataUrl, compressedSize);
          };
          reader.onerror = () => {
            handleResult(compressedDataUrl, compressedSize);
          };
          reader.readAsArrayBuffer(item.file);
        } else {
          handleResult(compressedDataUrl, compressedSize);
        }
      };

      img.onerror = () => {
        resolve({
          ...item,
          isCompressing: false,
          saveStatus: { success: false, msg: "Could not decode source image." }
        });
      };
      img.src = item.originalUrl;
    });
  };

  // Batch Session Persistence Engine
  const saveBatchSession = (items: QueueItem[]) => {
    const compressedList = items.filter(item => item.compressedResult);
    if (compressedList.length === 0) return;

    const totalOriginal = compressedList.reduce((sum, item) => sum + item.size, 0);
    const totalCompressed = compressedList.reduce((sum, item) => sum + (item.compressedResult?.compressedSize || 0), 0);
    const savingsBytes = Math.max(0, totalOriginal - totalCompressed);
    const savingsPct = totalOriginal > 0 ? Math.round((savingsBytes / totalOriginal) * 100) : 0;

    // Prune big base64 strings to stay safely under localStorage quotas
    const sessionFiles = items.map(el => ({
      id: el.id,
      name: el.name,
      size: el.size,
      type: el.type,
      originalUrl: el.originalUrl.length > 300000 ? "" : el.originalUrl,
      quality: el.quality,
      compressedResult: el.compressedResult ? {
        ...el.compressedResult,
        dataUrl: el.compressedResult.dataUrl.length > 300000 ? "" : el.compressedResult.dataUrl
      } : null,
      filter: el.filter,
    }));

    const newSession: CompressionSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      filesCount: items.length,
      totalOriginalSize: totalOriginal,
      totalCompressedSize: totalCompressed,
      savingsPercentage: savingsPct,
      files: sessionFiles
    };

    setSessions(prev => {
      // De-duplicate snapshots with same name structure
      const namesSig = items.map(f => f.name).sort().join(",");
      const filtered = prev.filter(s => {
        const signature = s.files.map(f => f.name).sort().join(",");
        return signature !== namesSig;
      });

      const updated = [newSession, ...filtered].slice(0, 10);

      try {
        localStorage.setItem("toolkit_recent_compression_sessions", JSON.stringify(updated));
      } catch (err) {
        console.warn("Storage quota exceeded. Maintaining latest batches in active RAM state.", err);
      }
      return updated;
    });
  };

  const handleLoadSession = (session: CompressionSession) => {
    const restoredQueue: QueueItem[] = session.files.map(f => {
      // If image base64 was pruned, fall back to a beautiful placeholder to prevent blank elements
      const fallbackUrl = f.originalUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80";
      const placeholderFile = new File([], f.name, { type: f.type });
      return {
        id: f.id,
        file: placeholderFile,
        name: f.name,
        size: f.size,
        type: f.type,
        originalUrl: fallbackUrl,
        quality: f.quality,
        compressedResult: f.compressedResult ? {
          ...f.compressedResult,
          dataUrl: f.compressedResult.dataUrl || fallbackUrl
        } : null,
        isCompressing: false,
        isSaving: false,
        saveStatus: null,
        filter: (f as any).filter || "none"
      };
    });

    setQueue(restoredQueue);
    if (restoredQueue.length > 0) {
      setSelectedId(restoredQueue[0].id);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem("toolkit_recent_compression_sessions", JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleDownloadSessionImages = async (session: CompressionSession, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const compressedFiles = session.files.filter(f => f.compressedResult && f.compressedResult.dataUrl);
    if (compressedFiles.length === 0) {
      alert("This historical job's image content is no longer in local storage cache (pruned for quota limits). Clean-reload the session parameters and click compress to re-generate.");
      return;
    }

    try {
      if (compressedFiles.length === 1) {
        const file = compressedFiles[0];
        const res = file.compressedResult!;
        const link = document.createElement("a");
        link.download = res.fileName;
        link.href = res.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const zip = new JSZip();
        compressedFiles.forEach(file => {
          const res = file.compressedResult!;
          const dataUrl = res.dataUrl;
          const base64Index = dataUrl.indexOf(";base64,");
          if (base64Index !== -1) {
            const base64Content = dataUrl.substring(base64Index + 8);
            zip.file(res.fileName, base64Content, { base64: true });
          }
        });
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const dlLink = document.createElement("a");
        dlLink.href = URL.createObjectURL(zipBlob);
        dlLink.download = `session_download_${Date.now()}.zip`;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
      }
    } catch (err: any) {
      console.error("Historical download failed", err);
      alert("Could not generate session download: " + (err.message || String(err)));
    }
  };

  // Trigger individual compressor
  const handleCompress = async () => {
    if (!activeItem) return;
    setQueue(prev => prev.map(item => item.id === activeItem.id ? { ...item, isCompressing: true } : item));
    const result = await compressSingleItem(activeItem, quality);
    setQueue(prev => {
      const updated = prev.map(item => item.id === activeItem.id ? result : item);
      saveBatchSession(updated);
      return updated;
    });

    // Trigger Auto-Save if enabled
    if (isAutoSaveEnabled && result.compressedResult) {
      triggerAutoSave(result);
    }

    // Automatically trigger Google Drive upload if 'Save to Drive' is enabled
    if (isSaveToDriveOnCompress && result.compressedResult) {
      if (user && accessToken) {
        autoSaveSingleToDriveDirect(result);
      } else {
        setAutoSaveToast({
          isOpen: true,
          message: `Cannot automatically upload "${result.name}" because you are not logged in to Google Drive.`,
          isError: true
        });
      }
    }

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "file",
        title: `Compressed: ${activeItem.name}`,
        detail: `Reduced from ${(activeItem.size / 1024).toFixed(1)} KB to ${(result.compressedResult?.compressedSize ? result.compressedResult.compressedSize / 1024 : 0).toFixed(1)} KB`,
        icon: "FileImage",
        tab: "compress"
      }
    }));
  };

  // Batch compress entire workspace queue
  const handleCompressAll = async () => {
    if (queue.length === 0) return;
    setIsBatchCompressing(true);
    setQueue(prev => prev.map(item => ({ ...item, isCompressing: true })));

    const compressedQueue = await Promise.all(
      queue.map(item => compressSingleItem(item, item.quality))
    );

    setQueue(compressedQueue);
    setIsBatchCompressing(false);
    saveBatchSession(compressedQueue);

    // Trigger Auto-Save if enabled
    if (isAutoSaveEnabled) {
      triggerBatchAutoSave(compressedQueue);
    }

    // Automatically trigger Google Drive upload for every compressed image created
    if (isSaveToDriveOnCompress) {
      if (user && accessToken) {
        compressedQueue.forEach((item) => {
          if (item.compressedResult) {
            autoSaveSingleToDriveDirect(item);
          }
        });
      } else {
        setAutoSaveToast({
          isOpen: true,
          message: "Could not upload batched files because you are not logged in to Google Drive.",
          isError: true
        });
      }
    }

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "file",
        title: "Compressed Batch Queue",
        detail: `Batch-compressed all ${queue.length} images in your workspace queue`,
        icon: "FileImage",
        tab: "compress"
      }
    }));

    // Trigger batch summary modal if multiple files were processed
    if (compressedQueue.length > 1) {
      setBatchSummaryItems(compressedQueue);
      setIsBatchSummaryOpen(true);
    }
  };

  // Trigger Auto-Save for single item
  const triggerAutoSave = (item: QueueItem) => {
    if (!item.compressedResult) return;
    
    if (autoSaveTarget === "local") {
      // Download locally
      const link = document.createElement("a");
      link.download = item.compressedResult.fileName;
      link.href = item.compressedResult.dataUrl;
      link.click();
      
      setAutoSaveToast({
        isOpen: true,
        message: `Auto-saved "${item.name}" locally to your machine!`
      });
    } else if (autoSaveTarget === "drive") {
      if (!user || !accessToken) {
        setAutoSaveToast({
          isOpen: true,
          message: `Auto-save to Google Drive is pending. Please sign in!`,
          isError: true
        });
        return;
      }
      
      autoSaveSingleToDriveDirect(item);
    }
  };

  const autoSaveSingleToDriveDirect = async (item: QueueItem) => {
    if (!item.compressedResult || !accessToken) return;
    
    try {
      await uploadFileToDrive(
        accessToken,
        item.compressedResult.fileName,
        item.compressedResult.mimeType,
        item.compressedResult.dataUrl
      );
      setQueue(prev => prev.map(q => q.id === item.id ? {
        ...q,
        saveStatus: { success: true, msg: "Auto-saved to GDrive" }
      } : q));
      onRefreshDrive();
      setAutoSaveToast({
        isOpen: true,
        message: `Auto-saved "${item.name}" directly to your Google Drive!`
      });
    } catch (err: any) {
      console.error(err);
      setAutoSaveToast({
        isOpen: true,
        message: `Auto-save to Google Drive failed: ${err.message || "Network Error"}`,
        isError: true
      });
    }
  };

  // Trigger Auto-Save for whole batch
  const triggerBatchAutoSave = async (items: QueueItem[]) => {
    const compressedList = items.filter(item => item.compressedResult);
    if (compressedList.length === 0) return;

    if (autoSaveTarget === "local") {
      try {
        const zip = new JSZip();
        compressedList.forEach((item) => {
          if (!item.compressedResult) return;
          const dataUrl = item.compressedResult.dataUrl;
          const base64Index = dataUrl.indexOf(";base64,");
          if (base64Index !== -1) {
            const base64Content = dataUrl.substring(base64Index + 8);
            zip.file(item.compressedResult.fileName, base64Content, { base64: true });
          }
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const dlLink = document.createElement("a");
        dlLink.href = URL.createObjectURL(zipBlob);
        dlLink.download = `toolkitpro_autosave_${Date.now()}.zip`;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        
        setAutoSaveToast({
          isOpen: true,
          message: `Auto-saved all ${compressedList.length} optimized assets in a ZIP archive!`
        });
      } catch (err: any) {
        console.error("Auto ZIP generation failed, falling back to sequential batch download", err);
        compressedList.forEach((item, index) => {
          setTimeout(() => {
            if (!item.compressedResult) return;
            const link = document.createElement("a");
            link.download = item.compressedResult.fileName;
            link.href = item.compressedResult.dataUrl;
            link.click();
          }, index * 200);
        });
        setAutoSaveToast({
          isOpen: true,
          message: `Auto-saved ${compressedList.length} assets locally!`
        });
      }
    } else if (autoSaveTarget === "drive") {
      if (!user || !accessToken) {
        setAutoSaveToast({
          isOpen: true,
          message: `Auto-save to Google Drive is pending. Please sign-in!`,
          isError: true
        });
        return;
      }

      setAutoSaveToast({
        isOpen: true,
        message: `Uploading batch of ${compressedList.length} items to GDrive...`
      });

      for (let i = 0; i < compressedList.length; i++) {
        const item = compressedList[i];
        if (!item.compressedResult) continue;

        try {
          await uploadFileToDrive(
            accessToken,
            item.compressedResult.fileName,
            item.compressedResult.mimeType,
            item.compressedResult.dataUrl
          );
          setQueue(prev => prev.map(q => q.id === item.id ? {
            ...q,
            saveStatus: { success: true, msg: "Auto-saved to GDrive" }
          } : q));
        } catch (err: any) {
          console.error(err);
        }
      }
      onRefreshDrive();
      setAutoSaveToast({
        isOpen: true,
        message: `Successfully batch uploaded ${compressedList.length} files to Google Drive!`
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getParsedExif = (itemId: string, itemFile: File) => {
    const tags = exifDataMap[itemId];
    const dims = exifDimensionsMap[itemId];

    if (!tags) return null;

    const getTagDesc = (key: string): string | undefined => {
      if (!tags[key]) return undefined;
      if (typeof tags[key] === "object") {
        return tags[key].description || String(tags[key].value);
      }
      return String(tags[key]);
    };

    // Extract GPS
    let gpsStr: string | undefined = undefined;
    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      const lat = tags['GPSLatitude'].description ?? tags['GPSLatitude'].value;
      const lon = tags['GPSLongitude'].description ?? tags['GPSLongitude'].value;
      const latRef = tags['GPSLatitudeRef']?.description || "";
      const lonRef = tags['GPSLongitudeRef']?.description || "";
      gpsStr = `${lat}°${latRef} , ${lon}°${lonRef}`;
    }

    // Exposure Speed display formatting (e.g. 0.008 => 1/125s)
    let expTime = getTagDesc('ExposureTime');
    if (expTime && !expTime.includes("/")) {
      const val = parseFloat(expTime);
      if (val > 0 && val < 1) {
        const denom = Math.round(1 / val);
        expTime = `1/${denom}s`;
      } else {
        expTime = `${val}s`;
      }
    }

    // Focal length display formatting (e.g. 35 => 35mm)
    let focalLen = getTagDesc('FocalLength');
    if (focalLen && !focalLen.toLowerCase().includes("mm")) {
      focalLen = `${focalLen}mm`;
    }

    return {
      make: getTagDesc('Make') || "Unknown Brand",
      model: getTagDesc('Model') || "Unknown Model",
      lens: getTagDesc('LensModel') || getTagDesc('Lens') || "Unknown / Built-in Lens",
      exposureTime: expTime || getTagDesc('ShutterSpeedValue') || "Auto Exposure",
      aperture: getTagDesc('FNumber') ? `f/${getTagDesc('FNumber')?.replace(/^f\//i, '')}` : getTagDesc('ApertureValue') || "Dynamic Aperture",
      iso: getTagDesc('ISOSpeedRatings') || getTagDesc('ISO') || getTagDesc('PhotographicSensitivity') || "Auto ISO",
      focalLength: focalLen || "Unknown Focal Length",
      dateTime: getTagDesc('DateTimeOriginal') || getTagDesc('DateTime') || "No capture timestamp",
      software: getTagDesc('Software') || "Camera firmware / Default",
      gps: gpsStr || "No GPS tracking",
      flash: getTagDesc('Flash') || "Ambient lighting",
      exposureProgram: getTagDesc('ExposureProgram') || "Standard program",
      whiteBalance: getTagDesc('WhiteBalance') || "Auto White Balance",
      pixelWidth: dims?.width || (tags['Image Width'] && tags['Image Width'].value) || (tags['PixelXDimension'] && tags['PixelXDimension'].value) || 0,
      pixelHeight: dims?.height || (tags['Image Height'] && tags['Image Height'].value) || (tags['PixelYDimension'] && tags['PixelYDimension'].value) || 0,
    };
  };

  // Individual handles
  const handleDownload = () => {
    if (!compressedResult) return;
    const link = document.createElement("a");
    link.download = compressedResult.fileName;
    link.href = compressedResult.dataUrl;
    link.click();

    // Trigger confirmation toast
    setAutoSaveToast({
      isOpen: true,
      title: "Download Completed",
      message: `Successfully downloaded "${compressedResult.fileName}" (1 file).`
    });

    // Support Monetag Direct Link Integration
    try {
      window.open("https://toolkit-pro-chi.vercel.app", "_blank", "noopener,noreferrer");
    } catch (e) {
      console.warn("Direct link popup blocked by browser policies", e);
    }
  };

  const handleSaveToDrive = async () => {
    if (!user || !accessToken || !compressedResult || !activeItem) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      `Save this compressed image (${formatFileSize(compressedResult.compressedSize)}) to your Google Drive?`
    );
    if (!confirmSave) return;

    setQueue(prev => prev.map(item => item.id === activeItem.id ? { ...item, isSaving: true, saveStatus: null } : item));

    try {
      await uploadFileToDrive(
        accessToken,
        compressedResult.fileName,
        compressedResult.mimeType,
        compressedResult.dataUrl
      );
      setQueue(prev => prev.map(item => item.id === activeItem.id ? {
        ...item,
        isSaving: false,
        saveStatus: {
          success: true,
          msg: `Successfully uploaded to Google Drive!`,
        }
      } : item));
      onRefreshDrive();

      // Trigger confirmation toast
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync",
        message: `Successfully uploaded "${compressedResult.fileName}" (1 file) to your Google Drive.`
      });
    } catch (err: any) {
      console.error(err);
      setQueue(prev => prev.map(item => item.id === activeItem.id ? {
        ...item,
        isSaving: false,
        saveStatus: {
          success: false,
          msg: err.message || "Failed to upload to Google Drive.",
        }
      } : item));

      // Trigger failure toast
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync Failed",
        message: err.message || "Failed to upload file to Google Drive.",
        isError: true
      });
    }
  };

  const handleSaveItemToDrive = async (item: QueueItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!user || !accessToken) {
      onLogin();
      return;
    }

    if (!item.compressedResult) return;

    setQueue(prev => prev.map(qItem => qItem.id === item.id ? { ...qItem, isSaving: true, saveStatus: null } : qItem));
    setBatchSummaryItems(prev => prev.map(qItem => qItem.id === item.id ? { ...qItem, isSaving: true, saveStatus: null } : qItem));

    try {
      await uploadFileToDrive(
        accessToken,
        item.compressedResult.fileName,
        item.compressedResult.mimeType,
        item.compressedResult.dataUrl
      );
      
      setQueue(prev => prev.map(qItem => qItem.id === item.id ? {
        ...qItem,
        isSaving: false,
        saveStatus: {
          success: true,
          msg: "Successfully uploaded to Google Drive!",
        }
      } : qItem));

      setBatchSummaryItems(prev => prev.map(qItem => qItem.id === item.id ? {
        ...qItem,
        isSaving: false,
        saveStatus: {
          success: true,
          msg: "Successfully uploaded to Google Drive!",
        }
      } : qItem));

      onRefreshDrive();

      // Trigger confirmation toast
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync",
        message: `Successfully uploaded "${item.compressedResult.fileName}" to your Google Drive.`
      });
    } catch (err: any) {
      console.error(err);
      setQueue(prev => prev.map(qItem => qItem.id === item.id ? {
        ...qItem,
        isSaving: false,
        saveStatus: {
          success: false,
          msg: err.message || "Failed to upload to Google Drive.",
        }
      } : qItem));

      setBatchSummaryItems(prev => prev.map(qItem => qItem.id === item.id ? {
        ...qItem,
        isSaving: false,
        saveStatus: {
          success: false,
          msg: err.message || "Failed to upload to Google Drive.",
        }
      } : qItem));

      // Trigger failure toast
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync Failed",
        message: err.message || "Failed to upload file to Google Drive.",
        isError: true
      });
    }
  };

  // Batch queue handlers
  const handleDownloadAllAsZip = async () => {
    const compressedItems = queue.filter(item => item.compressedResult);
    if (compressedItems.length === 0) {
      alert("No compressed images available! Please compress some images in the workspace first.");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      compressedItems.forEach((item) => {
        if (!item.compressedResult) return;
        const dataUrl = item.compressedResult.dataUrl;
        const base64Index = dataUrl.indexOf(";base64,");
        if (base64Index !== -1) {
          const base64Content = dataUrl.substring(base64Index + 8);
          zip.file(item.compressedResult.fileName, base64Content, { base64: true });
        }
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const dlLink = document.createElement("a");
      dlLink.href = URL.createObjectURL(zipBlob);
      dlLink.download = `toolkitpro_compressed_${Date.now()}.zip`;
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);

      // Trigger confirmation toast
      setAutoSaveToast({
        isOpen: true,
        title: "ZIP Download Completed",
        message: `Successfully packaged and downloaded ${compressedItems.length} compressed image(s) in a single ZIP archive.`
      });

      // Support Monetag Direct Link Integration
      try {
        window.open("https://toolkit-pro-chi.vercel.app", "_blank", "noopener,noreferrer");
      } catch (e) {
        console.warn("Direct link popup blocked by browser policies", e);
      }
    } catch (err: any) {
      console.error("ZIP creation failed:", err);
      alert("Could not compile ZIP file: " + (err.message || String(err)));
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadAll = () => {
    const compressedItems = queue.filter(item => item.compressedResult);
    if (compressedItems.length === 0) {
      alert("No compressed images available! Compress files before choosing download all.");
      return;
    }

    // Support parallel downloading
    compressedItems.forEach((item, index) => {
      setTimeout(() => {
        if (!item.compressedResult) return;
        const link = document.createElement("a");
        link.download = item.compressedResult.fileName;
        link.href = item.compressedResult.dataUrl;
        link.click();
      }, index * 200);
    });

    // Trigger confirmation toast
    setAutoSaveToast({
      isOpen: true,
      title: "Batch Download Triggered",
      message: `Initiated individual file downloads for all ${compressedItems.length} compressed image(s).`
    });

    // Support Monetag Direct Link Integration
    try {
      window.open("https://toolkit-pro-chi.vercel.app", "_blank", "noopener,noreferrer");
    } catch (e) {
      console.warn("Direct link popup blocked by browser policies", e);
    }
  };

  // Keyboard shortcut Alt + D to Download All as ZIP (Image Compressor Tab specific/triggered)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "d") {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "TEXTAREA" || 
          (activeEl as HTMLElement).isContentEditable
        );
        if (isInput) return;

        e.preventDefault();
        handleDownloadAllAsZip();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [queue, isZipping]);

  const handleSaveAllToDrive = async () => {
    if (!user || !accessToken) {
      onLogin();
      return;
    }

    const compressedItems = queue.filter(item => item.compressedResult);
    if (compressedItems.length === 0) {
      alert("No compressed images available! Compress files before saving to Drive.");
      return;
    }

    const confirmSave = window.confirm(
      `Save all ${compressedItems.length} compressed files to your Google Drive?`
    );
    if (!confirmSave) return;

    setIsBatchSaving(true);
    let successCount = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (!item.compressedResult) continue;

      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, isSaving: true, saveStatus: null } : q));

      try {
        await uploadFileToDrive(
          accessToken,
          item.compressedResult.fileName,
          item.compressedResult.mimeType,
          item.compressedResult.dataUrl
        );
        setQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          isSaving: false,
          saveStatus: { success: true, msg: "Saved to Google Drive" }
        } : q));
        successCount++;
      } catch (err: any) {
        console.error(err);
        setQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          isSaving: false,
          saveStatus: { success: false, msg: err.message || "Failed to save" }
        } : q));
      }
    }

    setIsBatchSaving(false);
    onRefreshDrive();

    if (successCount > 0) {
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync",
        message: `Successfully uploaded ${successCount} of ${compressedItems.length} compressed file(s) to your Google Drive.`
      });
    } else {
      setAutoSaveToast({
        isOpen: true,
        title: "Google Drive Sync Failed",
        message: "Failed to upload any compressed files to Google Drive.",
        isError: true
      });
    }
  };

  const handleRemoveFromQueue = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selection change
    setQueue(prev => {
      const filtered = prev.filter(item => item.id !== idToRemove);
      if (selectedId === idToRemove) {
        setSelectedId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
    setSelectedId(null);
  };

  const getExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  };

  const getExtensionForMime = (mime: string): string => {
    if (mime === "image/webp") return ".webp";
    if (mime === "image/png") return ".png";
    if (mime === "image/gif") return ".gif";
    return ".jpg";
  };

  const getBaseName = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length > 1) {
      parts.pop();
      return parts.join('.');
    }
    return filename;
  };

  const applyBulkRename = () => {
    setQueue((prev) => {
      const updated = prev.map((item, index) => {
        const ext = getExtension(item.name);
        const originalBase = getBaseName(item.name);
        let newName = item.name;

        if (renameMode === "sequential") {
          const num = renameStartNum + index;
          const numStr = String(num).padStart(renamePadLength, "0");
          newName = `${renamePrefix}_${numStr}${ext}`;
        } else {
          // Affix mode: append prefix and/or suffix to original base name
          newName = `${renamePrefix || ""}${originalBase}${renameSuffix || ""}${ext}`;
        }

        let updatedItem = {
          ...item,
          name: newName,
        };

        if (item.compressedResult) {
          const compExt = getExtensionForMime(item.compressedResult.mimeType || "image/jpeg");
          updatedItem.compressedResult = {
            ...item.compressedResult,
            fileName: newName.replace(/\.[^/.]+$/, "") + `_compressed${compExt}`,
          };
        }

        return updatedItem;
      });

      saveBatchSession(updated);
      return updated;
    });

    setIsRenamePanelOpen(false);
  };

  return (
    <div 
      onDragEnter={handleGlobalDragEnter}
      onDragOver={(e) => e.preventDefault()}
      className="relative grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 sm:gap-6 font-sans"
      id="compressor-workspace-root"
    >
      {/* Draft Restoration Banner */}
      {draftRestoreAvailable && (
        <div className="col-span-1 lg:col-span-2 xl:col-span-12 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-emerald-950/20 border border-violet-100 dark:border-indigo-950 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-550/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-650 dark:text-violet-400 shrink-0">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                Resume Image Editing Draft found
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                An active editing session (quality, crop settings & rotation) is saved on your Google Drive. Would you like to restore it?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setDraftRestoreAvailable(false);
                setRestorableDraftData(null);
              }}
              className="px-3.5 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350 bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
              id="btn-ignore-drive-session"
            >
              Discard Draft
            </button>
            <button
              type="button"
              onClick={handleRestoreDraft}
              disabled={isRestoringDraft}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider bg-violet-600 hover:bg-violet-500 disabled:bg-violet-420/50 text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              id="btn-restore-drive-session"
            >
              {isRestoringDraft ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resuming...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" /> Restore Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Local Interrupted Session Restoration Banner */}
      {localBackupAvailable && queue.length === 0 && (
        <div className="col-span-1 lg:col-span-2 xl:col-span-12 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-indigo-950/20 border border-emerald-100 dark:border-emerald-950 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-550/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400 shrink-0">
              <History className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Interrupted Session Recovered!
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                We detected an interrupted compression session with <strong className="font-bold text-emerald-600 dark:text-emerald-400">{localBackupData?.items?.length || 0} file(s)</strong>. Would you like to restore your files, configurations, and compressed results?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscardLocalBackup}
              className="px-3.5 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350 bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
              id="btn-discard-local-backup"
            >
              Discard Backup
            </button>
            <button
              type="button"
              onClick={handleRestoreLocalBackup}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              id="btn-restore-local-backup"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Restore Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Drag and Drop Overlay Backdrop */}
      {isGlobalDragging && (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsGlobalDragging(false)}
          onDrop={handleGlobalDrop}
          className="absolute inset-0 bg-emerald-900/60 dark:bg-emerald-955/80 backdrop-blur-sm border-4 border-dashed border-emerald-400 dark:border-emerald-500 rounded-2xl z-50 flex flex-col items-center justify-center text-white p-6 transition-all duration-200"
          id="global-drag-overlay"
        >
          <UploadCloud className="w-16 h-16 text-emerald-300 dark:text-emerald-400 animate-bounce mb-4" />
          <h3 className="text-xl font-bold tracking-tight">Drop your creative images anywhere!</h3>
          <p className="text-xs text-emerald-200 mt-2">
            Release to import multiple images directly into the active workspace queue.
          </p>
        </div>
      )}

      {/* Settings Column: 4 Cols */}
      <div className="lg:col-span-1 xl:col-span-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-emerald-500" /> Compression Pitch
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Increase slider to retain sharp visual fidelity or reduce to minimize file footprint. Supports batch file uploads.
          </p>
        </div>

        {/* Auto-Save & Quick Compress Control Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Quick Compress Toggle Control Switch */}
          <div 
            className="flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs select-none cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 group"
            onClick={handleToggleQuickCompress}
          >
            <div className="space-y-0.5 text-left mb-2">
              <label className="text-[10px] sm:text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1 cursor-pointer truncate">
                ⚡ Quick Comp
              </label>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug">
                Bypass previews, auto-compress on drops.
              </p>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isQuickCompressEnabled ? "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                {isQuickCompressEnabled ? "Active" : "Bypass"}
              </span>
              <button
                id="quick-compress-toggle"
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleQuickCompress(); }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer relative shrink-0 ${
                  isQuickCompressEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
                aria-label="Toggle Quick Compress"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                    isQuickCompressEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto-Save Configuration Trigger */}
          <div 
            className="flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs select-none cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 group"
            onClick={() => setIsAutoSaveDialogOpen(true)}
          >
            <div className="space-y-0.5 text-left mb-2">
              <label className="text-[10px] sm:text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1 cursor-pointer truncate">
                💾 Auto-Save
              </label>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug">
                {isAutoSaveEnabled 
                  ? `Saves to ${autoSaveTarget === "local" ? "Downloads" : "Drive"}`
                  : "Inactive • Configure auto-saves."}
              </p>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isAutoSaveEnabled ? "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                {isAutoSaveEnabled ? "ON" : "OFF"}
              </span>
              <button
                type="button"
                className="p-1 rounded bg-slate-50 dark:bg-slate-900 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 text-slate-500 group-hover:text-indigo-600 transition-all"
                title="Configure Auto-Save Rules"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Workspace Auto-Clear configuration button */}
          <div 
            className="flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs select-none cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-300 group"
            onClick={() => setIsAutoSaveDialogOpen(true)}
          >
            <div className="space-y-0.5 text-left mb-2">
              <label className="text-[10px] sm:text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1 cursor-pointer truncate">
                🧹 Auto-Clear
              </label>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug">
                {autoClearTimeout > 0 || autoClearOnNavigate
                  ? `Active • ${autoClearTimeout > 0 ? `${autoClearTimeout}m` : ""} ${autoClearOnNavigate ? "Away" : ""}`
                  : "Disabled • Keep workspace sessions."}
              </p>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${autoClearTimeout > 0 || autoClearOnNavigate ? "bg-rose-50 text-rose-650 dark:bg-rose-950/40 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                {autoClearTimeout > 0 || autoClearOnNavigate ? "ON" : "OFF"}
              </span>
              <button
                type="button"
                className="p-1 rounded bg-slate-50 dark:bg-slate-900 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 text-slate-500 group-hover:text-rose-600 transition-all"
                title="Configure Auto-Clear Rules"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`min-h-[220px] border-[3px] border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group select-none ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/25 scale-[1.01] shadow-xl shadow-emerald-500/10"
              : "border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50/45 dark:hover:bg-slate-900/40 hover:shadow-lg hover:shadow-indigo-500/5"
          }`}
          id="compressor-drop-zone"
        >
          {/* Subtle Modern Decorative Grid Accent */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] pointer-events-none opacity-20" />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Stacking multiple visual files mockup to represent multiple file upload */}
          <div className="relative mb-4 flex items-center justify-center h-14 w-20">
            {/* Third Stacked item representing batch */}
            <div className={`absolute w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 transform -rotate-12 translate-x-[-18px] transition-transform duration-300 group-hover:-rotate-18 group-hover:translate-x-[-24px] ${isDragging ? "animate-pulse" : ""}`}>
              <FileImage className="w-5 h-5 text-pink-500/60 absolute center-div inset-0 m-auto" />
            </div>
            
            {/* Second Stacked item representing batch */}
            <div className={`absolute w-11 h-11 rounded-lg bg-indigo-500/15 border border-indigo-550/25 transform rotate-12 translate-x-[18px] transition-transform duration-300 group-hover:rotate-18 group-hover:translate-x-[24px] ${isDragging ? "animate-pulse" : ""}`}>
              <FileImage className="w-5.5 h-5.5 text-indigo-505/60 absolute center-div inset-0 m-auto" />
            </div>

            {/* Top Core Upload Circle Card */}
            <div className={`absolute w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/30 ${isDragging ? "scale-115 rotate-6 animate-bounce" : ""}`}>
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-2 max-w-sm relative z-10">
            {isDragging ? (
              <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-405 animate-pulse tracking-wide">
                Drop files now to optimization queue!
              </h4>
            ) : (
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Drag & Drop <span className="underline decoration-indigo-500/60 decoration-2">Multiple Images</span> here
              </h4>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              or click to browse local files on your computer. Multiple selections are optimized concurrently.
            </p>

            {/* Quick multi-file pill tags */}
            <div className="flex flex-wrap items-center justify-center gap-1 pt-1.5">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/30">
                ⚡ Batch Upload
              </span>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-250/30">
                🔄 Live Resizing
              </span>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                PNG, JPG, WEBP, AVIF
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Compression Summary */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/80 space-y-3 shadow-sm font-sans text-left" id="compression-summary-realtime">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-505" /> Compression Summary
            </h4>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full">
              {queue.length} File{queue.length !== 1 ? 's' : ''}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-3 text-[11px] text-slate-400 dark:text-slate-500">
              No images in queue. Drop or load files to forecast mobile performance metrics and Core Web Vitals rankings.
            </div>
          ) : (() => {
            const totalOriginal = queue.reduce((sum, item) => sum + item.size, 0);
            const totalProjected = queue.reduce((sum, item) => {
              if (item.compressedResult) {
                return sum + item.compressedResult.compressedSize;
              }
              // Projected estimate formula
              return sum + Math.round(item.size * (0.12 + item.quality * 0.48));
            }, 0);
            const totalSavingsBytes = Math.max(0, totalOriginal - totalProjected);
            const savingsPercentage = totalOriginal > 0 ? Math.round((totalSavingsBytes / totalOriginal) * 100) : 0;

            const compressedItemsInQueue = queue.filter(item => item.compressedResult);
            const totalOriginalCompressedSpace = compressedItemsInQueue.reduce((sum, item) => sum + item.size, 0);
            const totalActualCompressedSpace = compressedItemsInQueue.reduce((sum, item) => sum + (item.compressedResult?.compressedSize || 0), 0);
            const actualDiskSpaceSaved = Math.max(0, totalOriginalCompressedSpace - totalActualCompressedSpace);
            const actualSavingPercentage = totalOriginalCompressedSpace > 0 ? Math.round((actualDiskSpaceSaved / totalOriginalCompressedSpace) * 100) : 0;

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 block">Original Weight</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatFileSize(totalOriginal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 block flex items-center gap-1">
                      Projected Weight <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                    </span>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {formatFileSize(totalProjected)}
                    </span>
                  </div>
                </div>

                {/* Progress bar and savings ratio */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-550 dark:text-slate-400">Estimated Bandwidth Savings:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      -{savingsPercentage}% ({formatFileSize(totalSavingsBytes)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-905 rounded-full h-2 overflow-hidden relative border border-slate-200/20">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${savingsPercentage}%` }}
                    />
                  </div>
                </div>

                {compressedItemsInQueue.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-500/20 rounded-2xl flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-emerald-500/5 [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,1),transparent)] pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        🚀 Actual Disk Saved
                      </span>
                      <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        -{actualSavingPercentage}% Saved
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left pt-0.5">
                      <div>
                        <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">
                          Optimized Size ({compressedItemsInQueue.length} files)
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-205 font-mono">
                          {formatFileSize(totalActualCompressedSpace)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-emerald-600 dark:text-emerald-450 block font-bold uppercase tracking-wider">
                          Total Storage Saved 🎉
                        </span>
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatFileSize(actualDiskSpaceSaved)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <p className="text-[9.5px] text-slate-450 dark:text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-900 pt-2">
                  AdSense Compliance: Photo pruning occurs within local browsers, discarding bulky EXIF camera headers prior to transmission to uphold stringent privacy mandates.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Queue Management Panel */}
        {queue.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex-1 flex flex-col justify-start">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <h4 className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  Workspace Queue ({queue.length})
                </h4>
                <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold tracking-tight">
                  ↕ Drag items to set sequence order for the final ZIP
                </span>
              </div>
              <div className="flex items-center space-x-2 font-sans select-none">
                {accessToken && isAutoSaveDraftEnabled && (
                  <div className="flex items-center gap-1.5 mr-2 px-2 py-0.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 text-[10px] select-none" title={isDraftSaving ? "Saving draft to Google Drive..." : lastDraftSavedAt ? `Draft auto-saved to Google Drive at ${lastDraftSavedAt.toLocaleTimeString()}` : "Draft auto-save active"}>
                    {isDraftSaving ? (
                      <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin shrink-0" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {isDraftSaving ? "Saving..." : "Draft Synced"}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsExifModalOpen(true)}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 hover:text-emerald-700 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer select-none"
                  title="View Exif & technical metadata for images in queue"
                  id="btn-open-exif-modal"
                >
                  Exif Info
                </button>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <button
                  type="button"
                  onClick={() => setIsRenamePanelOpen(!isRenamePanelOpen)}
                  className={`text-[10px] font-bold transition-all cursor-pointer select-none px-2 py-0.5 rounded ${
                    isRenamePanelOpen 
                      ? "bg-indigo-600 text-white shadow-2xs" 
                      : "text-indigo-605 hover:text-indigo-700 bg-indigo-550/10 dark:bg-indigo-950/40"
                  }`}
                >
                  Bulk Rename
                </button>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <button
                  onClick={handleClearQueue}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer select-none"
                >
                  Clear Queue
                </button>
              </div>
            </div>

            {isRenamePanelOpen && (
              <div 
                className="bg-slate-50 dark:bg-slate-900/45 p-3 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3 font-sans text-left animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/60 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> Batch Rename Config
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsRenamePanelOpen(false)}
                    className="text-[9.5px] font-bold text-slate-400 hover:text-slate-650 dark:hover:text-slate-205"
                  >
                    Close
                  </button>
                </div>

                {/* Renaming Mode Selector */}
                <div className="grid grid-cols-2 gap-1 bg-white/60 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => setRenameMode("affix")}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      renameMode === "affix"
                        ? "bg-slate-905 dark:bg-slate-800 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    Prefix & Suffix
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenameMode("sequential")}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      renameMode === "sequential"
                        ? "bg-slate-905 dark:bg-slate-800 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    Sequential #
                  </button>
                </div>

                {renameMode === "affix" ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Prefix Input */}
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase block">Prefix</label>
                      <input 
                        type="text"
                        value={renamePrefix}
                        onChange={(e) => setRenamePrefix(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-705 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                        placeholder="Prefix (e.g. img_)"
                      />
                    </div>
                    {/* Suffix Input */}
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase block">Suffix</label>
                      <input 
                        type="text"
                        value={renameSuffix}
                        onChange={(e) => setRenameSuffix(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-705 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                        placeholder="Suffix (e.g. _lowres)"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Prefix Base Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase block">Base Name</label>
                      <input 
                        type="text"
                        value={renamePrefix}
                        onChange={(e) => setRenamePrefix(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-705 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. photo"
                      />
                    </div>

                    {/* Starting Number */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase block">Start #</label>
                      <input 
                        type="number"
                        min="0"
                        value={renameStartNum}
                        onChange={(e) => setRenameStartNum(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-705 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Zero Padding */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase block">Padding</label>
                      <select
                        value={renamePadLength}
                        onChange={(e) => setRenamePadLength(parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="1">None (1, 2)</option>
                        <option value="2">2 digits (01, 02)</option>
                        <option value="3">3 digits (001)</option>
                        <option value="4">4 digits (0001)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Live Preview List of Renamings */}
                <div className="space-y-1 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-805/60 p-2 rounded-lg max-h-36 overflow-y-auto">
                  <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-850/60 select-none flex justify-between items-center">
                    <span>Live Output Preview:</span>
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 text-slate-500 rounded">
                      {renameMode === "affix" ? "Prefix+Original+Suffix" : "Template Series"}
                    </span>
                  </div>
                  {queue.slice(0, 5).map((item, index) => {
                    const ext = getExtension(item.name);
                    const originalBase = getBaseName(item.name);
                    let projectedName = "";

                    if (renameMode === "sequential") {
                      const num = renameStartNum + index;
                      const numStr = String(num).padStart(renamePadLength, "0");
                      projectedName = `${renamePrefix}_${numStr}${ext}`;
                    } else {
                      projectedName = `${renamePrefix || ""}${originalBase}${renameSuffix || ""}${ext}`;
                    }

                    return (
                      <div key={item.id} className="flex items-center justify-between py-1 border-b border-dashed border-slate-50 dark:border-slate-900/40 last:border-0 font-mono text-[10px]">
                        <span className="text-slate-400 dark:text-slate-550 truncate max-w-[110px]">{item.name}</span>
                        <span className="text-slate-305 dark:text-slate-700 mx-1">➔</span>
                        <span className="text-indigo-650 dark:text-indigo-400 font-bold truncate max-w-[130px]">{projectedName}</span>
                      </div>
                    );
                  })}
                  {queue.length > 5 && (
                    <div className="text-[9px] text-slate-405 dark:text-slate-550 pt-1 text-center italic select-none">
                      ...and {queue.length - 5} more files mapped sequentially
                    </div>
                  )}
                </div>

                {/* Rename actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyBulkRename}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1 select-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Batch Rename</span>
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable list of files in the queue */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-2" id="workspace-queue-list">
              {queue.map((item, index) => {
                const isSelected = item.id === selectedId;
                const hasResult = !!item.compressedResult;
                const isCurrentlyDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    draggable
                    onDragStart={(e) => handleQueueDragStart(e, index)}
                    onDragOver={(e) => handleQueueDragOver(e, index)}
                    onDragEnd={handleQueueDragEnd}
                    onDrop={(e) => handleQueueDrop(e, index)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                      isCurrentlyDragged
                        ? "opacity-40 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        : isDragOver
                        ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 scale-[1.01] shadow-md ring-2 ring-indigo-500/30"
                        : isSelected
                        ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500"
                        : "border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-200"
                    } cursor-grab active:cursor-grabbing`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {/* Grip handle */}
                      <div 
                        className="p-1 text-slate-350 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-450 cursor-grab shrink-0 flex items-center justify-center select-none"
                        title="Drag item to change order in batch"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Miniature thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-105 dark:bg-slate-900 flex-shrink-0 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/40 relative">
                        <img
                          src={item.thumbnailUrl || item.originalUrl}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {item.isCompressing && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatFileSize(item.size)}
                          </span>
                          {hasResult && item.compressedResult && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded">
                                -{item.compressedResult.savingPercentage}%
                              </span>
                              <span className="text-[8.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/35 dark:bg-emerald-950/25 px-1 py-0.2 rounded border border-emerald-500/10" title={`Reduced from ${formatFileSize(item.size)} to ${formatFileSize(item.compressedResult.compressedSize)}`}>
                                Saved {formatFileSize(item.size - item.compressedResult.compressedSize)}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Interactive dynamic progress feedback bar */}
                        <CompressingProgressBar isCompressing={item.isCompressing} />
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600 pr-1 select-none">
                        #{index + 1}
                      </span>
                      {hasResult && item.compressedResult && (
                        user ? (
                          <button
                            onClick={(e) => handleSaveItemToDrive(item, e)}
                            disabled={item.isSaving}
                            className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-500 dark:text-slate-500 transition-colors cursor-pointer shrink-0 disabled:opacity-30"
                            title={item.isSaving ? "Saving to Drive..." : item.saveStatus?.success ? "Saved to Drive! Click to upload again." : "Save this individual file to Google Drive"}
                          >
                            {item.isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                            ) : (
                              <Cloud className={`w-3.5 h-3.5 ${item.saveStatus?.success ? "text-emerald-500" : ""}`} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogin();
                            }}
                            className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-500 dark:text-slate-500 transition-colors cursor-pointer shrink-0"
                            title="Sign in to save this file to Google Drive"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                      {item.isCompressing ? (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin shrink-0" title="Active compression" />
                      ) : item.saveStatus?.success ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Saved to Drive" />
                      ) : null}
                      <button
                        onClick={(e) => handleRemoveFromQueue(item.id, e)}
                        disabled={item.isCompressing}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 dark:text-slate-500 transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={item.isCompressing ? "Cannot remove while compressing" : "Remove file from queue"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bulk ZIP promo banner appears when multiple files are processed */}
            {queue.filter(item => item.compressedResult).length >= 1 && (
              <div 
                className="p-4 bg-gradient-to-tr from-slate-900 via-indigo-955 to-slate-900 border-2 border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between text-left gap-4 shadow-xl shadow-indigo-500/10 my-2.5 relative overflow-hidden group"
                id="image-compressor-batch-zip-promo-banner"
              >
                {/* Visual design overlay elements */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-indigo-500/10 [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,1),transparent)] pointer-events-none transform skew-x-12 translate-x-10" />
                
                <div className="min-w-0 flex-1 relative z-10 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      ⚡ Quick ZIP Bundle
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-indigo-305 bg-indigo-950/85 px-2 py-0.5 rounded border border-indigo-500/30">
                      {queue.filter(item => item.compressedResult).length} File{queue.filter(item => item.compressedResult).length !== 1 ? "s" : ""} Optimized
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Download All as ZIP Archive
                  </h4>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    Instantly bundle all of your optimized images into a single ZIP archive for faster, convenient one-click downloads.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleDownloadAllAsZip}
                  disabled={isZipping}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-350 hover:to-teal-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all hover:scale-[1.03] active:scale-97 cursor-pointer select-none shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:translate-y-0"
                  title="Generate and download a single ZIP package containing All compressed images (Shortcut: Alt + D)"
                >
                  {isZipping ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Packaging...</span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-4 h-4 shrink-0" />
                      <span>Download ZIP</span>
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-950/10 text-[9px] font-mono text-slate-900 border border-slate-950/20 uppercase tracking-normal leading-none font-bold">
                        Alt+D
                      </kbd>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Batch actions bar in settings panel */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-sans">
              <button
                onClick={handleCompressAll}
                disabled={isBatchCompressing || queue.length === 0}
                className="col-span-2 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-500/20"
                id="btn-compress-all-queue"
              >
                {isBatchCompressing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Compressing Batch...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    Compress All ({queue.length})
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAllAsZip}
                disabled={isZipping || queue.filter(item => item.compressedResult).length === 0}
                className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-400 dark:hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 border border-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                id="btn-download-all-zip"
                title="Download all processed images compiled inside a single ZIP package (Shortcut: Alt + D)"
              >
                {isZipping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    Packaging ZIP Archive...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4 text-indigo-305 shrink-0" />
                    <span>Download All as ZIP (.zip)</span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-800/60 dark:bg-slate-900/60 text-[9px] font-mono text-indigo-200 border border-indigo-700/50 dark:border-slate-800/50 uppercase tracking-normal leading-none ml-1.5 font-bold">
                      Alt+D
                    </kbd>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAll}
                disabled={queue.filter(item => item.compressedResult).length === 0}
                className="py-1.5 rounded-lg border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-305 bg-white dark:bg-slate-950 font-semibold text-[10px] text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-40 cursor-pointer"
                id="btn-download-all-queue"
                title="Download all items individually via consecutive browser popups"
              >
                Download Files (Indiv.)
              </button>

              <button
                onClick={handleSaveAllToDrive}
                disabled={isBatchSaving || queue.filter(item => item.compressedResult).length === 0}
                className="py-1.5 rounded-lg border border-slate-205 dark:border-slate-800 text-slate-750 dark:text-slate-300 bg-white dark:bg-slate-950 font-semibold text-[10px] text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                id="btn-save-all-drive-queue"
              >
                <Cloud className="w-3 h-3 text-emerald-500" />
                {isBatchSaving ? "Saving..." : "Save All to Drive"}
              </button>
            </div>
          </div>
        )}

        {activeItem && (
          <div className="space-y-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Quick Adjustment Toolbar with Undo button */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-2.5 rounded-2xl shadow-3xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <RotateCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-wider">Adjustment Console</span>
              </div>
              
              <button
                type="button"
                id="btn-undo-adjustment"
                disabled={!undoHistory[activeItem.id] || undoHistory[activeItem.id].length === 0}
                onClick={handleUndo}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer select-none ${
                  undoHistory[activeItem.id] && undoHistory[activeItem.id].length > 0
                    ? "bg-indigo-55 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-900 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100/80 hover:text-indigo-700 hover:border-indigo-300 active:scale-98 shadow-2xs"
                    : "bg-slate-100/50 dark:bg-slate-900/20 border-slate-200/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                }`}
                title={undoHistory[activeItem.id] && undoHistory[activeItem.id].length > 0 ? `Revert last adjustment (Recorded updates: ${undoHistory[activeItem.id].length})` : "No adjustments to undo"}
              >
                <Undo className="w-3.5 h-3.5 shrink-0" />
                <span>Undo</span>
                {undoHistory[activeItem.id] && undoHistory[activeItem.id].length > 0 && (
                  <span className="bg-indigo-600 dark:bg-indigo-550 text-white rounded-full text-[8.5px] leading-none shrink-0 w-3.5 h-3.5 flex items-center justify-center font-extrabold shadow-sm">
                    {undoHistory[activeItem.id].length}
                  </span>
                )}
              </button>
            </div>

            {/* Aspect Ratio Crop Selection */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-705 dark:text-slate-300 mb-2 font-semibold select-none">
                <span>Aspect Ratio Crop</span>
                <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-55 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  {aspectRatio === "original" ? "Original Ratio" : aspectRatio === "custom" ? "Custom Freeform" : `Cropped ${aspectRatio}`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "original", label: "Original" },
                  { id: "1:1", label: "1:1 Square" },
                  { id: "16:9", label: "16:9 Wide" },
                  { id: "9:16", label: "9:16 Port." },
                  { id: "4:3", label: "4:3 Standard" },
                  { id: "2:3", label: "2:3 Photo" },
                  { id: "custom", label: "Custom Free" }
                ].map((item) => {
                  const isActive = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAspectRatioChange(item.id as any)}
                      className={`py-1.5 px-0.5 text-[10px] font-bold rounded-xl border transition-all truncate select-none cursor-pointer text-center ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white dark:bg-emerald-500 dark:border-emerald-500 dark:text-slate-950 font-extrabold shadow-sm"
                          : "bg-white border-slate-205 text-slate-650 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-805 dark:text-slate-400 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Crop Fine-Tuning Sliders */}
              <div className="mt-4 p-3 bg-white dark:bg-slate-950 border border-slate-201 dark:border-slate-800/60 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-705 dark:text-slate-300">
                  <span>Fine-Tune Crop Settings</span>
                  <button
                    type="button"
                    onClick={() => {
                      saveToUndoActiveItem();
                      updateActiveItemCrop({
                        cropX: 0,
                        cropY: 0,
                        cropWidth: 1,
                        cropHeight: 1,
                        aspectRatio: "original"
                      });
                      setAspectRatio("original");
                    }}
                    className="text-[10px] text-indigo-500 hover:underline hover:text-indigo-600 font-bold"
                  >
                    Reset Crop Area
                  </button>
                </div>

                {/* X and Y Offset */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Offset X (Left)</span>
                      <span>{Math.round((activeItem.cropX || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={1 - (activeItem.cropWidth || 1)}
                      step="0.01"
                      value={activeItem.cropX || 0}
                      onMouseDown={saveToUndoActiveItem}
                      onTouchStart={saveToUndoActiveItem}
                      onChange={(e) => updateActiveItemCrop({ cropX: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500 h-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Offset Y (Top)</span>
                      <span>{Math.round((activeItem.cropY || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={1 - (activeItem.cropHeight || 1)}
                      step="0.01"
                      value={activeItem.cropY || 0}
                      onMouseDown={saveToUndoActiveItem}
                      onTouchStart={saveToUndoActiveItem}
                      onChange={(e) => updateActiveItemCrop({ cropY: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500 h-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Width and Height scale (enabled only for Custom crop, otherwise locked) */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50 dark:border-slate-900/80">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Crop Width</span>
                      <span>{Math.round((activeItem.cropWidth || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.01"
                      disabled={aspectRatio !== "custom" && aspectRatio !== "original"}
                      value={activeItem.cropWidth || 1}
                      onMouseDown={saveToUndoActiveItem}
                      onTouchStart={saveToUndoActiveItem}
                      onChange={(e) => {
                        const nextW = parseFloat(e.target.value);
                        updateActiveItemCrop({ cropWidth: nextW });
                      }}
                      className="w-full accent-emerald-500 h-1 cursor-pointer disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Crop Height</span>
                      <span>{Math.round((activeItem.cropHeight || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.01"
                      disabled={aspectRatio !== "custom" && aspectRatio !== "original"}
                      value={activeItem.cropHeight || 1}
                      onMouseDown={saveToUndoActiveItem}
                      onTouchStart={saveToUndoActiveItem}
                      onChange={(e) => {
                        const nextH = parseFloat(e.target.value);
                        updateActiveItemCrop({ cropHeight: nextH });
                      }}
                      className="w-full accent-emerald-500 h-1 cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {aspectRatio === "original" || aspectRatio === "custom" ? (
                    <span>💡 <strong>Free Crop Mode:</strong> Adjust any sliders or drag the corners of the highlighting box to adjust the selection crop.</span>
                  ) : (
                    <span>🔒 <strong>Fixed Ratio:</strong> Aspect ratio `{aspectRatio}` is locked. Crop width/height sliders are automatically restricted. Drag the frame inside the preview container to pan.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Compression Presets Dashboard */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-[11.5px] font-black uppercase text-slate-755 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-505 animate-pulse" /> 
                    <span>Compression Presets</span>
                  </h4>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug">
                    Quickly configure settings with one click
                  </p>
                </div>
              </div>

              {/* Feedback messages if any */}
              {presetFeedback && (
                <div className={`p-2 rounded-lg text-[9px] font-bold ${
                  presetFeedback.type === "success" 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-405 border border-emerald-200/50" 
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-405 border border-rose-200/50"
                }`}>
                  {presetFeedback.text}
                </div>
              )}

              {/* Grid of Presets */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    Standard Presets
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_PRESETS.map((p) => {
                      const isActive = 
                        Math.abs(quality - p.quality) < 0.01 && 
                        targetFormatSelection === p.targetFormat && 
                        isSmartResizeEnabled === p.isSmartResizeEnabled &&
                        (!p.isSmartResizeEnabled || (smartResizeMaxWidth === p.smartResizeMaxWidth && smartResizeMaxHeight === p.smartResizeMaxHeight)) &&
                        aspectRatio === p.aspectRatio;

                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-250 flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                            isActive 
                              ? "bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-500/80 shadow-3xs" 
                              : "bg-slate-50 dark:bg-slate-900/45 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-extrabold text-[10px] text-slate-750 dark:text-slate-200 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 truncate">
                              {p.name}
                            </div>
                            <div className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {Math.round(p.quality * 100)}% • {p.targetFormat === "original" ? "Original" : p.targetFormat.split("/")[1].toUpperCase()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[8px] text-slate-40o dark:text-slate-500 font-bold">
                            <span className="truncate max-w-[80px]">
                              {p.isSmartResizeEnabled ? `Max ${p.smartResizeMaxWidth}px` : "Orig. Size"}
                            </span>
                            {isActive && (
                              <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {customPresets.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Custom User Presets
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {customPresets.map((p) => {
                        const isActive = 
                          Math.abs(quality - p.quality) < 0.01 && 
                          targetFormatSelection === p.targetFormat && 
                          isSmartResizeEnabled === p.isSmartResizeEnabled &&
                          (!p.isSmartResizeEnabled || (smartResizeMaxWidth === p.smartResizeMaxWidth && smartResizeMaxHeight === p.smartResizeMaxHeight)) &&
                          aspectRatio === p.aspectRatio;

                        return (
                          <div
                            key={p.name}
                            className={`p-2.5 rounded-xl border text-left transition-all duration-250 flex flex-col justify-between group/card relative ${
                              isActive 
                                ? "bg-emerald-50/20 dark:bg-emerald-950/15 border-emerald-500/80 shadow-3xs" 
                                : "bg-slate-50 dark:bg-slate-900/45 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(p)}
                              className="w-full text-left cursor-pointer"
                            >
                              <div className="font-extrabold text-[10px] text-slate-750 dark:text-slate-200 truncate pr-5">
                                {p.name}
                              </div>
                              <div className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {Math.round(p.quality * 100)}% • {p.targetFormat === "original" ? "Original" : p.targetFormat.split("/")[1].toUpperCase()}
                              </div>
                              <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                                {p.isSmartResizeEnabled ? `Max ${p.smartResizeMaxWidth}px` : "Orig. Size"}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(p.name)}
                              className="absolute top-1 right-1 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Save Current as New Custom Preset Input section */}
                <form 
                  onSubmit={handleSaveCurrentAsPreset}
                  className="pt-2 border-t border-slate-100 dark:border-slate-800/60"
                >
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider mb-1.5">
                    Save current setups as custom preset
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. My Portfolio"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      maxLength={24}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Target Convert-To Format Selection Dropdown */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs text-left">
              <label 
                id="label-format-conversion"
                className="text-[11px] font-black uppercase text-slate-755 dark:text-slate-300 tracking-wider flex items-center gap-1.5"
              >
                <span>🔄 Convert to format</span>
              </label>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug pb-1">
                Transform files to a different format on-the-fly during compression
              </p>
              <select
                id="select-target-format"
                value={targetFormatSelection}
                onChange={(e) => setTargetFormatSelection(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all"
              >
                <option value="original">Original Format (Auto-optimize)</option>
                <option value="image/webp">Convert to WebP (.webp)</option>
                <option value="image/png">Convert to PNG (.png)</option>
                <option value="image/jpeg">Convert to JPEG/JPG (.jpg)</option>
              </select>
              <div className="text-[10px] text-slate-405 dark:text-slate-500 leading-snug mt-1.5 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
                {targetFormatSelection === "original" && "💡 Preserves original attributes but converts standard large PNGs to JPEGs."}
                {targetFormatSelection === "image/webp" && "✨ Bulk converts all files to high performance modern WebP format!"}
                {targetFormatSelection === "image/png" && "🎨 Bulk converts all files to Lossless PNG format (high color accuracy)."}
                {targetFormatSelection === "image/jpeg" && "📷 Bulk converts all files to standard photography-optimized JPEG/JPG."}
              </div>
            </div>

            {/* Slider with Quality Score Gauge */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs text-left space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Quality Tuning
                  </label>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-snug">
                    Currently tuning: <span className="font-semibold text-slate-600 dark:text-slate-300">{activeItem.name}</span>
                  </p>
                </div>
                
                {/* Radial Indicator / Quality Score */}
                {(() => {
                  const qPercentage = Math.round(quality * 100);
                  const radius = 22;
                  const circumference = 2 * Math.PI * radius; // ~138.23
                  const strokeDashoffset = circumference * (1 - quality);
                  
                  // Classification for rating vs industry optimal sweet-spot (75% to 85%)
                  let badgeLabel = "";
                  let statusDesc = "";
                  let textColor = "";
                  let strokeColor = "";
                  let progressColor = "";

                  if (qPercentage >= 90) {
                    badgeLabel = "High Fidelity";
                    statusDesc = "Near-lossless details; minimal file savings";
                    textColor = "text-blue-500 dark:text-blue-400";
                    strokeColor = "stroke-slate-100 dark:stroke-slate-800";
                    progressColor = "stroke-blue-500 dark:stroke-blue-400";
                  } else if (qPercentage >= 75) {
                    badgeLabel = "Optimal Balance";
                    statusDesc = "Official sweet spot! Perfect visual balance";
                    textColor = "text-emerald-500 dark:text-emerald-400";
                    strokeColor = "stroke-slate-100 dark:stroke-slate-800";
                    progressColor = "stroke-emerald-500 dark:stroke-emerald-400";
                  } else if (qPercentage >= 50) {
                    badgeLabel = "Moderate Speed";
                    statusDesc = "Good compression; minor visual artifacts";
                    textColor = "text-amber-500 dark:text-amber-400";
                    strokeColor = "stroke-slate-100 dark:stroke-slate-800";
                    progressColor = "stroke-amber-500 dark:stroke-amber-400";
                  } else {
                    badgeLabel = "Aggressive Size";
                    statusDesc = "Maximum storage saved; visible block noise";
                    textColor = "text-rose-500 dark:text-rose-400";
                    strokeColor = "stroke-slate-100 dark:stroke-slate-800";
                    progressColor = "stroke-rose-500 dark:stroke-rose-400";
                  }

                  return (
                    <div className="flex items-center gap-3 shrink-0" title={`${badgeLabel}: ${statusDesc}`}>
                      {/* Radial Ring Gauge */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                          {/* Background shadow circle */}
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            className={`fill-none ${strokeColor}`}
                            strokeWidth="3.5"
                          />
                          {/* Active score progression ring */}
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            className={`fill-none ${progressColor} transition-all duration-300`}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-extrabold text-slate-800 dark:text-slate-100">
                          {qPercentage}
                        </span>
                      </div>

                      {/* Score description details */}
                      <div className="flex flex-col text-right">
                        <span className={`text-[9.5px] font-black uppercase tracking-wider ${textColor}`}>
                          {badgeLabel}
                        </span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">
                          Quality Factor
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Slider Input */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onMouseDown={saveToUndoActiveItem}
                  onTouchStart={saveToUndoActiveItem}
                  onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 accent-indigo-650 dark:accent-indigo-500 cursor-pointer transition-colors"
                />
                <div className="flex justify-between text-[8.5px] font-bold text-slate-400 dark:text-slate-550">
                  <span>Extreme Compression</span>
                  {/* Optimal Indicator Guide */}
                  <span className="text-emerald-500 dark:text-emerald-400 select-none">
                    🎯 Optimal Spot (80%)
                  </span>
                  <span>Maximum Fidelity</span>
                </div>
              </div>

              {/* Quality Standard Reference Guideline Context */}
              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-dashed border-slate-205 dark:border-slate-800">
                💡 <strong>Optimal Settings Guidance:</strong> JPEG, WebP, and standard image compressors reach maximum compression efficiency between <strong>75% - 85%</strong>. Values within this range reduce layout footprint by up to 80% while remaining perceptually raw.
              </p>
            </div>

            {/* Smart Resize Settings Block */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800/80 shadow-3xs text-left space-y-3.5">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="checkbox-smart-resize"
                  checked={isSmartResizeEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setIsSmartResizeEnabled(val);
                    localStorage.setItem("toolkit_image_smart_resize_enabled", String(val));
                  }}
                  className="w-4 h-4 rounded mt-0.5 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                />
                <div className="flex-1 text-left select-none">
                  <label 
                    htmlFor="checkbox-smart-resize" 
                    className="text-[11px] font-black uppercase text-slate-750 dark:text-slate-300 tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>📏 Smart Image Resizing</span>
                    {isSmartResizeEnabled && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-200/40">
                        Active
                      </span>
                    )}
                  </label>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight mt-1">
                    Set limits for width or height. Original aspect proportions are preserved.
                  </p>
                </div>
              </div>

              {isSmartResizeEnabled && (
                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 transition-all">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Max Width Input */}
                    <div className="space-y-1">
                      <label htmlFor="input-max-width" className="text-[9.5px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                        Max Width (px)
                      </label>
                      <input
                        id="input-max-width"
                        type="number"
                        min="10"
                        max="16000"
                        value={smartResizeMaxWidth || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setSmartResizeMaxWidth(val);
                          localStorage.setItem("toolkit_image_smart_resize_max_width", String(val));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-250 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Max Height Input */}
                    <div className="space-y-1">
                      <label htmlFor="input-max-height" className="text-[9.5px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                        Max Height (px)
                      </label>
                      <input
                        id="input-max-height"
                        type="number"
                        min="10"
                        max="16000"
                        value={smartResizeMaxHeight || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setSmartResizeMaxHeight(val);
                          localStorage.setItem("toolkit_image_smart_resize_max_height", String(val));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-250 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Preset Badges row */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                      Quick Proportion Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "4K UHD", w: 3840, h: 2160 },
                        { label: "Full HD", w: 1920, h: 1080 },
                        { label: "Web HD", w: 1280, h: 720 },
                        { label: "Social", w: 1080, h: 1080 },
                        { label: "Icon", w: 256, h: 256 }
                      ].map((preset) => {
                        const isChosen = smartResizeMaxWidth === preset.w && smartResizeMaxHeight === preset.h;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setSmartResizeMaxWidth(preset.w);
                              setSmartResizeMaxHeight(preset.h);
                              localStorage.setItem("toolkit_image_smart_resize_max_width", String(preset.w));
                              localStorage.setItem("toolkit_image_smart_resize_max_height", String(preset.h));
                            }}
                            className={`text-[8.5px] font-extrabold px-2 py-1 rounded transition-all cursor-pointer ${
                              isChosen
                                ? "bg-indigo-600 text-white shadow-3xs"
                                : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {preset.label} ({preset.w}px)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EXIF Metadata Control Switch */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/85 hover:border-indigo-305 dark:hover:border-indigo-900/40 transition-colors select-none">
              <input
                type="checkbox"
                id="checkbox-strip-exif"
                checked={stripExifMetadata}
                onChange={(e) => {
                  const val = e.target.checked;
                  setStripExifMetadata(val);
                  localStorage.setItem("toolkit_image_strip_exif", String(val));
                }}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <div className="flex flex-col text-left">
                <label 
                  htmlFor="checkbox-strip-exif" 
                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-none flex items-center gap-1.5"
                >
                  <span>Strip Metadata (EXIF)</span>
                  <span className="text-[8px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Privacy Guard</span>
                </label>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-1">
                  Remove sensitive camera model, GPS coordinates, lens specs, creation date, and device headers from compressed images
                </span>
              </div>
            </div>

            {/* Save to Drive Checkbox Option */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/85 hover:border-indigo-305 dark:hover:border-indigo-900/40 transition-colors select-none">
              <input
                type="checkbox"
                id="checkbox-save-to-drive"
                checked={isSaveToDriveOnCompress}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsSaveToDriveOnCompress(val);
                  localStorage.setItem("toolkit_image_save_to_drive_on_compress", String(val));
                  if (val && (!user || !accessToken)) {
                    setAutoSaveToast({
                      isOpen: true,
                      message: "Drive connection required! Please authenticate Google Drive using the button in the action bar.",
                      isError: true
                    });
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <div className="flex flex-col text-left">
                <label 
                  htmlFor="checkbox-save-to-drive" 
                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-none"
                >
                  Save to Drive
                </label>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-1">
                  Automatically upload every compressed image to GDrive
                </span>
              </div>
            </div>

            {/* Watermark Overlay Option */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/85 hover:border-indigo-305 dark:hover:border-indigo-900/40 transition-all flex flex-col gap-2">
              <div className="flex items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  id="checkbox-watermark-enabled"
                  checked={isWatermarkEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setIsWatermarkEnabled(val);
                    localStorage.setItem("toolkit_image_watermark_enabled", String(val));
                  }}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                />
                <div className="flex flex-col text-left flex-1 cursor-pointer" onClick={() => {
                  const val = !isWatermarkEnabled;
                  setIsWatermarkEnabled(val);
                  localStorage.setItem("toolkit_image_watermark_enabled", String(val));
                }}>
                  <label 
                    htmlFor="checkbox-watermark-enabled" 
                    className="text-[11px] font-black uppercase text-slate-750 dark:text-slate-300 tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>🏷️ Draw Watermark Overlay</span>
                    {isWatermarkEnabled && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-200/40">
                        Active
                      </span>
                    )}
                  </label>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-1">
                    Overlay customizable text or custom logo onto optimized images
                  </span>
                </div>
              </div>

              {isWatermarkEnabled && (
                <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 transition-all text-left">
                  {/* Type Selector: Text vs Logo */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide font-sans">
                      Watermark Source
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setWatermarkType("text");
                          localStorage.setItem("toolkit_image_watermark_type", "text");
                        }}
                        className={`py-1 px-2.5 rounded-lg text-[9.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          watermarkType === "text"
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 font-extrabold"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-405 dark:hover:bg-slate-750"
                        }`}
                      >
                        🔤 Custom Text
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWatermarkType("logo");
                          localStorage.setItem("toolkit_image_watermark_type", "logo");
                        }}
                        className={`py-1 px-2.5 rounded-lg text-[9.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          watermarkType === "logo"
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 font-extrabold"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450 dark:hover:bg-slate-755"
                        }`}
                      >
                        🖼️ Logo Graphic
                      </button>
                    </div>
                  </div>

                  {/* Watermark Type-Specific Controls */}
                  {watermarkType === "text" ? (
                    <div className="space-y-2.5">
                      {/* Watermark Text Input */}
                      <div className="space-y-1">
                        <label htmlFor="input-watermark-text" className="text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                          Watermark Phrase
                        </label>
                        <input
                          id="input-watermark-text"
                          type="text"
                          value={watermarkText}
                          onChange={(e) => {
                            setWatermarkText(e.target.value);
                            localStorage.setItem("toolkit_image_watermark_text", e.target.value);
                          }}
                          placeholder="e.g. © ToolkitPro"
                          className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Color Selector */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide flex justify-between items-center">
                          <span>Text Color</span>
                          <span className="font-mono text-2xs text-slate-400">{watermarkColor}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => {
                              setWatermarkColor(e.target.value);
                              localStorage.setItem("toolkit_image_watermark_color", e.target.value);
                            }}
                            className="w-8 h-8 rounded border border-slate-200 dark:border-slate-800 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                            title="Choose custom color"
                          />
                          <div className="flex flex-1 gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                            {[
                              { label: "White", value: "#ffffff" },
                              { label: "Black", value: "#000000" },
                              { label: "Red", value: "#ef4444" },
                              { label: "Yellow", value: "#f59e0b" },
                              { label: "Gray", value: "#94a3b8" },
                            ].map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => {
                                  setWatermarkColor(c.value);
                                  localStorage.setItem("toolkit_image_watermark_color", c.value);
                                }}
                                className={`text-[8.5px] font-semibold tracking-tight px-2 py-1 rounded-md border text-slate-800 dark:text-slate-200 transition-all shrink-0 cursor-pointer ${
                                  watermarkColor === c.value
                                    ? "bg-slate-200 border-slate-350 dark:bg-slate-800 dark:border-slate-700 font-bold scale-102"
                                    : "bg-slate-50 border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 hover:scale-[1.01]"
                                }`}
                              >
                                <span className="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle" style={{ backgroundColor: c.value }} />
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Logo Upload Section */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                          Watermark Logo File
                        </span>
                        
                        {watermarkLogoUrl ? (
                          <div className="flex items-center justify-between p-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <img 
                                src={watermarkLogoUrl} 
                                alt="Watermark Graphic Logo" 
                                className="w-8 h-8 rounded border border-slate-200 dark:border-slate-800 object-contain bg-slate-200 dark:bg-slate-950/60 p-0.5" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                  Active Logo
                                </p>
                                <span className="text-[8px] text-slate-400 block font-mono">
                                  Configured
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setWatermarkLogoUrl("");
                                localStorage.removeItem("toolkit_image_watermark_logo_url");
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete active watermark logo"
                            >
                              <span className="text-xs">✕</span>
                            </button>
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-center bg-slate-50/50 dark:bg-slate-900/30">
                            <label className="block cursor-pointer select-none">
                              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline">
                                📁 Select Logo Image
                              </span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (fileEvent) => {
                                      if (fileEvent.target?.result) {
                                        const base64Url = fileEvent.target.result as string;
                                        setWatermarkLogoUrl(base64Url);
                                        try {
                                          localStorage.setItem("toolkit_image_watermark_logo_url", base64Url);
                                        } catch (storageErr) {
                                          console.warn("Could not save full base64 watermark logo in LocalStorage (too large), will be active in memory", storageErr);
                                        }
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[8px] text-slate-405 block mt-1">
                              Supports transparent PNG or lightweight JPEG files
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Positioning Selector (Grid) */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                      Overlay Placement
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "top-left", title: "Top L" },
                        { id: "top-right", title: "Top R" },
                        { id: "center", title: "Center" },
                        { id: "bottom-left", title: "Scale L" },
                        { id: "bottom-right", title: "Scale R" },
                        { id: "tiled", title: "Tiled Grid" },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => {
                            setWatermarkPosition(pos.id as any);
                            localStorage.setItem("toolkit_image_watermark_position", pos.id);
                          }}
                          className={`py-1 text-[8.5px] font-bold rounded-md border text-center transition-all cursor-pointer ${
                            watermarkPosition === pos.id
                              ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 font-extrabold"
                              : "bg-slate-50 border-slate-205 text-slate-600 hover:bg-slate-100/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {pos.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Slider Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                      <span>Watermark Scale</span>
                      <span className="font-mono text-2xs text-slate-700 dark:text-slate-300 font-bold">{watermarkSize}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="1"
                        value={watermarkSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setWatermarkSize(val);
                          localStorage.setItem("toolkit_image_watermark_size", String(val));
                        }}
                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Opacity Slider Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide">
                      <span>Overlay Opacity</span>
                      <span className="font-mono text-2xs text-slate-700 dark:text-slate-300 font-bold">{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWatermarkOpacity(val);
                          localStorage.setItem("toolkit_image_watermark_opacity", String(val));
                        }}
                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-slate-950 dark:bg-indigo-600 text-white font-semibold text-xs hover:bg-slate-900 dark:hover:bg-indigo-500 transition-colors shadow shadow-slate-950/20 disabled:opacity-50 cursor-pointer text-center"
              id="btn-trigger-compression"
            >
              {isCompressing ? "Compressing, please wait..." : `Compress Active: ${activeItem.name}`}
            </button>
          </div>
        )}
      </div>

      {/* Comparisons and Stage Area: 5 Cols */}
      <div className="lg:col-span-1 xl:col-span-5 flex flex-col justify-between space-y-4">
        {/* 1-Click PWA App Installer Banner */}
        {!isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-650 via-indigo-700 to-violet-700 text-white shadow-md shadow-indigo-600/15 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-left"
            id="pwa-one-click-install-banner"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-indigo-200 animate-bounce" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-100">
                  Run Toolkit Pro Offline
                </h4>
                <p className="text-[10px] text-indigo-200 mt-0.5 leading-snug font-medium">
                  Install as a lightweight desktop/mobile app in 1-Click for instant offline utilities.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              {isIframe ? (
                <a
                  href={`${window.location.origin}${window.location.pathname}#install`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 font-extrabold text-[10.5px] uppercase tracking-wider shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] no-underline text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch & Install (1-Click)
                </a>
              ) : (pwaInstallPrompt || (typeof window !== "undefined" && window.deferredInstallPrompt)) ? (
                <button
                  onClick={async () => {
                    const promptToUse = pwaInstallPrompt || (typeof window !== "undefined" ? window.deferredInstallPrompt : null);
                    if (promptToUse) {
                      try {
                        await promptToUse.prompt();
                        const { outcome } = await promptToUse.userChoice;
                        console.log(`User response to installation: ${outcome}`);
                        setPwaInstallPrompt(null);
                        if (typeof window !== "undefined") {
                          window.deferredInstallPrompt = null;
                        }
                      } catch (err) {
                        console.error("Installation prompt execution failed:", err);
                      }
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[10.5px] uppercase tracking-wider shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install Now (1-Click)
                </button>
              ) : (
                <button
                  onClick={() => {
                    const navBtn = document.getElementById("btn-pwa-install-nav");
                    if (navBtn) {
                      navBtn.click();
                    } else {
                      alert("Please use the dedicated Install App button in your browser address bar or menu!");
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 font-extrabold text-[10.5px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  PWA Install Info
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Batch Savings Summary Card */}
        {(() => {
          const compressedItems = queue.filter(item => item.compressedResult);
          if (compressedItems.length === 0) return null;

          const totalOriginal = compressedItems.reduce((sum, item) => sum + item.size, 0);
          const totalCompressed = compressedItems.reduce((sum, item) => sum + (item.compressedResult?.compressedSize || 0), 0);
          const totalSavedBytes = Math.max(0, totalOriginal - totalCompressed);
          const savingPercentage = totalOriginal > 0 ? Math.round((totalSavedBytes / totalOriginal) * 100) : 0;

          return (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-purple-500/10 dark:from-emerald-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 border border-emerald-500/20 dark:border-emerald-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-left"
              id="batch-savings-summary-card"
            >
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/25 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1">
                    Batch Optimization Saved
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Successfully shrunk {compressedItems.length} of {queue.length} queue images!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">Before</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{formatFileSize(totalOriginal)}</span>
                </div>
                
                <div className="text-left md:text-right">
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">After</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">{formatFileSize(totalCompressed)}</span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-center shrink-0">
                  <span className="text-[9px] font-black uppercase block tracking-wider leading-none">Net Savings</span>
                  <span className="text-sm font-black font-mono leading-tight block mt-1">
                    -{savingPercentage}% ({formatFileSize(totalSavedBytes)})
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {saveStatus && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center ${
              saveStatus.success
                ? "bg-emerald-55 border-emerald-100 dark:bg-emerald-950/15 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400"
                : "bg-rose-50 border-rose-100 dark:bg-rose-950/15 dark:border-rose-900/40 text-rose-800 dark:text-rose-400"
            }`}
          >
            <Cloud className={`w-4 h-4 mr-2 shrink-0 ${saveStatus.success ? "text-emerald-500" : "text-rose-500"}`} />
            <span>{saveStatus.msg}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-3.5 sm:p-6 min-h-[280px] sm:min-h-[380px] rounded-2xl">
          {!activeItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <FileImage className="w-12 h-12 text-slate-305 dark:text-slate-700 mb-2.5 animate-bounce" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-305">Workspace Queue is Empty</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                Upload or drag multiple creator images into the workspace to initialize a compressed comparative layout.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">
              {compressedResult ? (
                /* Post-compression view */
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  {/* Sync Details Banner */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm" id="banner-compress-status">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            Compression Completed!
                          </p>
                          {/* Small Efficiency Saved Badge */}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-705 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 text-[9px] font-black uppercase tracking-wider select-none shadow-3xs" id="efficiency-saved-badge">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                            <span>Saved {formatFileSize(compressedResult.originalSize - compressedResult.compressedSize)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[180px] xs:max-w-[280px]">
                          Reduced from {formatFileSize(compressedResult.originalSize)} to {formatFileSize(compressedResult.compressedSize)}.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4 ml-13 sm:ml-0 shrink-0">
                      <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[10px] font-black cursor-pointer transition-all select-none shadow-xs text-left uppercase tracking-wider"
                        title="Open full-screen side-by-side quality slider"
                        id="btn-trigger-fs-comparisons"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Compare Fullscreen
                      </button>

                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Saving Ratio</p>
                        <p className="text-xs font-black text-emerald-605 dark:text-emerald-400 mt-1 leading-none text-right">
                          -{compressedResult.savingPercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comparisons Panel Grid with Global Dashboard Preview Mode Toggles */}
                  <div className="space-y-4 flex-1 flex flex-col justify-between" id="dashboard-comparisons-block">
                    {/* Perspective switches */}
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-2.5" id="dashboard-compare-view-controls">
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                        Preview Modes
                      </span>
                      <div className="bg-slate-200/50 dark:bg-slate-900 p-0.5 rounded-xl flex items-center space-x-0.5 border border-slate-300/30 dark:border-slate-800">
                        {[
                          { id: "side-by-side", label: "Side-by-Side", icon: ImageIcon },
                          { id: "slider", label: "Compare Slider", icon: SlidersHorizontal },
                          { id: "quick-toggle", label: "A/B Flip", icon: Eye },
                          { id: "original", label: "Original Only", icon: FileImage },
                          { id: "compressed", label: "Optimized Only", icon: Sparkles },
                        ].map((m) => {
                          const IconComp = m.icon;
                          const isActive = dashboardView === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setDashboardView(m.id as any)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                                isActive
                                  ? "bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm font-black"
                                  : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              }`}
                              title={`Switch layout to ${m.label}`}
                            >
                              <IconComp className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline-block">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* View Switch Router */}
                    {dashboardView === "side-by-side" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 items-center">
                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="space-y-2 flex flex-col items-center group/img cursor-pointer text-center select-none"
                          title="Click to view interactive full-screen comparison"
                        >
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Original Source (Click to Maximize)</p>
                          <div className="aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                            <img 
                              src={originalUrl || undefined} 
                              alt="Original" 
                              style={{
                                filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                        imgFilter === "sepia" ? "sepia(100%)" :
                                        imgFilter === "invert" ? "invert(100%)" :
                                        imgFilter === "blur" ? "blur(4px)" : "none"
                              }}
                              className="object-contain max-h-40 font-semibold group-hover/img:scale-105 transition-transform duration-300" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-4">
                              <Maximize2 className="w-6 h-6 text-white mb-2 animate-bounce" />
                              <span className="text-[10px] font-extrabold tracking-widest uppercase">Maximize Quality Review</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                            {formatFileSize(compressedResult.originalSize)}
                          </span>
                        </div>

                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="space-y-2 flex flex-col items-center group/img cursor-pointer text-center select-none"
                          title="Click to view interactive full-screen comparison"
                        >
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Optimized Model (Click to Maximize)
                          </p>
                          <div className="aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                            <img 
                              src={compressedResult.dataUrl} 
                              alt="CompressedResult" 
                              className="object-contain max-h-40 group-hover/img:scale-105 transition-transform duration-300" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-4">
                              <Maximize2 className="w-6 h-6 text-white mb-2 animate-bounce" />
                              <span className="text-[10px] font-extrabold tracking-widest uppercase">Maximize Quality Review</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatFileSize(compressedResult.compressedSize)}
                          </span>
                        </div>
                      </div>
                    )}

                    {dashboardView === "slider" && (
                      <div className="flex-1 flex flex-col items-center justify-center py-2 select-none">
                        <div 
                          ref={inlineSliderContainerRef}
                          onMouseDown={onSliderMouseDown}
                          onTouchStart={onSliderTouchStart}
                          className="relative aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-ew-resize group shadow-inner"
                          title="Drag the slider handle to compare before and after"
                          id="inline-compare-slider-container"
                        >
                          {/* Optimized image as background */}
                          <img 
                            src={compressedResult.dataUrl} 
                            alt="Optimized inline element"
                            style={{ transform: `rotate(${activeItem?.rotation || 0}deg)` }}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-150"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Original image as absolute clip layer overlay */}
                          <img 
                            src={originalUrl || undefined} 
                            alt="Original inline element"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-150"
                            style={{ 
                              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                              transform: `rotate(${activeItem?.rotation || 0}deg)`,
                              filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                      imgFilter === "sepia" ? "sepia(105%)" :
                                      imgFilter === "invert" ? "invert(100%)" :
                                      imgFilter === "blur" ? "blur(4px)" : "none"
                            }}
                            referrerPolicy="no-referrer"
                          />

                          {/* Slider bar splitter line element */}
                          <div 
                            className="absolute inset-y-0 w-1 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] flex items-center justify-center cursor-ew-resize z-10"
                            style={{ left: `${sliderPosition}%` }}
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-200 text-white flex items-center justify-center font-bold text-xs select-none shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-150 transform -translate-x-1/2">
                              ↔
                            </div>
                          </div>

                          {/* Overlay Badge Labels */}
                          <span className="absolute left-3 top-3 text-[8.5px] font-black uppercase text-white bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded shadow z-10 pointer-events-none">
                            Original
                          </span>
                          <span className="absolute right-3 top-3 text-[8.5px] font-black uppercase text-emerald-400 bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded shadow z-10 pointer-events-none">
                            Optimized
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full mt-3 font-mono text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-900 pt-2.5">
                          <span>Original: <strong className="text-slate-755 dark:text-slate-300 font-bold">{formatFileSize(compressedResult.originalSize)}</strong></span>
                          <span>Optimized: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatFileSize(compressedResult.compressedSize)}</strong></span>
                        </div>
                      </div>
                    )}

                    {dashboardView === "quick-toggle" && (
                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        <div 
                          onClick={() => setShowOriginalInAB(!showOriginalInAB)}
                          className="relative aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner"
                          title="Click to toggle in-place comparison"
                        >
                          <img 
                            src={showOriginalInAB ? (originalUrl || undefined) : compressedResult.dataUrl} 
                            alt="A/B Quick Switch in Dashboard" 
                            style={showOriginalInAB ? {
                              filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                      imgFilter === "sepia" ? "sepia(100%)" :
                                      imgFilter === "invert" ? "invert(100%)" :
                                      imgFilter === "blur" ? "blur(4px)" : "none"
                            } : undefined}
                            className="object-contain max-h-40 group-hover:scale-102 transition-transform duration-150" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-slate-950/85 border border-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider text-white">
                            {showOriginalInAB ? "Viewing: Original" : `Viewing: Optimized (-${compressedResult.savingPercentage}%)`}
                          </div>
                          <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white select-none pointer-events-none">
                            <RefreshCw className="w-5 h-5 text-emerald-400 mb-1 animate-spin" style={{ animationDuration: '4s' }} />
                            <span className="text-[9px] font-black uppercase tracking-wider">Click anywhere to toggle comparison</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full mt-3 font-mono text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-900 pt-2.5">
                          <span>Original: <strong className="text-slate-755 dark:text-slate-300 font-bold">{formatFileSize(compressedResult.originalSize)}</strong></span>
                          <span>Optimized: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatFileSize(compressedResult.compressedSize)}</strong></span>
                        </div>
                      </div>
                    )}

                    {dashboardView === "original" && (
                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="relative aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner"
                        >
                          <img 
                            src={originalUrl || undefined} 
                            alt="Original Perspective View" 
                            style={{
                              filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                      imgFilter === "sepia" ? "sepia(100%)" :
                                      imgFilter === "invert" ? "invert(100%)" :
                                      imgFilter === "blur" ? "blur(4px)" : "none"
                            }}
                            className="object-contain max-h-40 group-hover:scale-102 transition-transform duration-150" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-slate-950/85 border border-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider text-white">
                            Original Source (100%)
                          </div>
                          <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white">
                            <Maximize2 className="w-5 h-5 text-white mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Click to Open Fullscreen compare</span>
                          </div>
                        </div>
                        <div className="w-full mt-3 font-mono text-[11px] text-slate-505 border-t border-slate-100 dark:border-slate-900 pt-2.5 text-center">
                          Original Size: <strong className="text-slate-705 dark:text-slate-300 font-bold">{formatFileSize(compressedResult.originalSize)}</strong>
                        </div>
                      </div>
                    )}

                    {dashboardView === "compressed" && (
                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="relative aspect-video w-full rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner"
                        >
                          <img 
                            src={compressedResult.dataUrl} 
                            alt="Optimized Perspective View" 
                            className="object-contain max-h-40 group-hover:scale-102 transition-transform duration-150" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-slate-950 border border-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            Optimized View (-{compressedResult.savingPercentage}%)
                          </div>
                          <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white">
                            <Maximize2 className="w-5 h-5 text-white mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Click to Open Fullscreen compare</span>
                          </div>
                        </div>
                        <div className="w-full mt-3 font-mono text-[11px] text-slate-505 border-t border-slate-100 dark:border-slate-900 pt-2.5 text-center">
                          Optimized Size: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatFileSize(compressedResult.compressedSize)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Pre-compression view */
                <div className="flex-1 flex flex-col justify-between items-center w-full animate-fade-in py-3" id="pre-compression-state">
                  <div className="w-full text-left mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="truncate max-w-[210px]" title={activeItem.name}>Image Cropping Studio: {activeItem.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal shrink-0">({formatFileSize(activeItem.size)})</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Drag the highlighting box to position. Drag the green dot to resize. Or fine-tune with sliders.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRotation(-90)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        title="Rotate 90° Counter-Clockwise"
                        id="btn-rotate-ccw"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-500" />
                        <span>Rotate 90° CCW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRotation(90)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        title="Rotate 90° Clockwise"
                        id="btn-rotate-cw"
                      >
                        <RotateCw className="w-3 h-3 text-indigo-500" />
                        <span>Rotate 90° CW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          saveToUndoActiveItem();
                          updateActiveItemCrop({
                            cropX: 0,
                            cropY: 0,
                            cropWidth: 1,
                            cropHeight: 1,
                            aspectRatio: "original"
                          });
                          setAspectRatio("original");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        title="Instantly revert to original image dimensions"
                        id="btn-reset-crop"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-500" />
                        Reset Crop
                      </button>
                    </div>
                  </div>

                  <div className="relative max-w-full max-h-[300px] sm:max-h-[350px] overflow-auto select-none border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-2.5 shadow-inner pb-12">
                    <div 
                      className="relative inline-block max-w-full max-h-full"
                      style={{
                        transform: `scale(${cropZoom}) rotate(${activeItem.rotation || 0}deg)`,
                        transformOrigin: "center center",
                        transition: "transform 0.12s ease-out, transform 0.2s ease-out",
                      }}
                    >
                      <img 
                        id="cropping-target-img"
                        src={originalUrl || activeItem.thumbnailUrl || undefined} 
                        alt="Cropping dynamic source" 
                        style={{
                          filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                  imgFilter === "sepia" ? "sepia(100%)" :
                                  imgFilter === "invert" ? "invert(100%)" :
                                  imgFilter === "blur" ? "blur(4px)" : "none"
                        }}
                        className="max-h-[280px] sm:max-h-[320px] max-w-full block select-none pointer-events-none rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      {/* Active Absolute Drag Overlay */}
                      <div 
                        ref={overlayRef}
                        className="absolute inset-0 cursor-crosshair overflow-hidden rounded-xl bg-black/35"
                      >
                        {/* Highlights highlight rectangle */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${(activeItem.cropX !== undefined ? activeItem.cropX : 0) * 100}%`,
                            top: `${(activeItem.cropY !== undefined ? activeItem.cropY : 0) * 100}%`,
                            width: `${(activeItem.cropWidth !== undefined ? activeItem.cropWidth : 1) * 100}%`,
                            height: `${(activeItem.cropHeight !== undefined ? activeItem.cropHeight : 1) * 100}%`,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)', // beautiful overlay shadow dim
                          }}
                          className="border border-dashed border-white/90 outline outline-1 outline-emerald-400/80 shadow-[inset_0_0_12px_rgba(255,255,255,0.3)] transition-shadow duration-150 relative cursor-move flex items-center justify-center group/cropbox"
                          onMouseDown={(e) => handleOverlayMouseDown(e, "move")}
                          onTouchStart={(e) => handleOverlayTouchStart(e, "move")}
                        >
                          {/* 3x3 Grid rules lines */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                            <div className="border-r border-b border-dashed border-white/50"></div>
                            <div className="border-r border-b border-dashed border-white/50"></div>
                            <div className="border-b border-dashed border-white/50"></div>
                            <div className="border-r border-b border-dashed border-white/50"></div>
                            <div className="border-r border-b border-dashed border-white/50"></div>
                            <div className="border-b border-dashed border-white/50"></div>
                            <div className="border-r border-dashed border-white/50"></div>
                            <div className="border-r border-dashed border-white/50"></div>
                            <div></div>
                          </div>

                          {/* Float Badge */}
                          <div className="absolute top-2 left-2 bg-slate-950/75 select-none text-[8px] font-black text-white px-1.5 py-0.5 rounded tracking-wide leading-none uppercase max-w-[124px] truncate">
                            {aspectRatio === "original" ? "Free Crop" : aspectRatio === "custom" ? "Custom" : `locked: ${aspectRatio}`}
                          </div>

                          {/* Drag Target Pointer Center Indicator */}
                          <div className="w-1.5 h-1.5 rounded-full bg-white/60 pointer-events-none" />

                          {/* Resizing Handle - Bottom Right Corner */}
                          <div 
                            onMouseDown={(e) => handleOverlayMouseDown(e, "resize")}
                            onTouchStart={(e) => handleOverlayTouchStart(e, "resize")}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-white hover:scale-125 transition-transform cursor-se-resize flex items-center justify-center shadow-md select-none"
                            title="Drag corner to scale crop boundaries"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping absolute" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white relative" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Zoom and Precision Micro-controls overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center bg-slate-950/90 dark:bg-slate-905/92 backdrop-blur-md border border-slate-800 dark:border-slate-705 shadow-xl p-1 rounded-xl z-20 space-x-1 select-none animate-in fade-in duration-200">
                      <button
                        type="button"
                        onClick={() => setCropZoom(prev => Math.max(0.5, prev - 0.25))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer w-6 h-6 flex items-center justify-center shrink-0"
                        title="Zoom Out Precision (0.5x min)"
                        aria-label="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-white font-mono font-bold px-1.5 text-center min-w-[34px] select-none">
                        {Math.round(cropZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setCropZoom(prev => Math.min(3.0, prev + 0.25))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer w-6 h-6 flex items-center justify-center shrink-0"
                        title="Zoom In Precision (3.0x max)"
                        aria-label="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-800 select-none px-0.5">|</span>
                      <button
                        type="button"
                        onClick={() => setCropZoom(1.0)}
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-650 hover:bg-indigo-600 text-white transition-colors cursor-pointer h-6 flex items-center justify-center select-none"
                        title="Reset zoom scale of cropping target viewport"
                      >
                        1:1
                      </button>
                    </div>
                  </div>

                  {/* Real-time Visual Filters Selector */}
                  <div className="w-full mt-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5 selection:bg-indigo-500">
                        ✨ Image Visual Filters
                      </span>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded leading-none">
                        Active: {imgFilter === "none" ? "Raw Default" : imgFilter}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                       Apply a custom artistic palette directly to the image pixels before encoding.
                    </p>
                    
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {[
                        { id: "none", label: "None", filterStyle: "none" },
                        { id: "grayscale", label: "Grayscale", filterStyle: "grayscale(100%)" },
                        { id: "sepia", label: "Sepia", filterStyle: "sepia(100%)" },
                        { id: "invert", label: "Invert", filterStyle: "invert(100%)" },
                        { id: "blur", label: "Blur", filterStyle: "blur(2px)" },
                      ].map((item) => {
                        const isActive = imgFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleFilterChange(item.id as any)}
                            className={`flex flex-col items-center p-1.5 rounded-xl border transition-all duration-200 text-center relative overflow-hidden group cursor-pointer ${
                              isActive
                                ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-3xs"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 hover:bg-slate-100/50 dark:hover:bg-slate-900/60"
                            }`}
                          >
                            {/* Filter Preview micro viewport */}
                            <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-900 relative">
                              <img
                                src={originalUrl || activeItem.thumbnailUrl || undefined}
                                alt={item.label}
                                className="w-full h-full object-cover select-none pointer-events-none scale-110"
                                style={{ filter: item.filterStyle }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            <span className={`text-[9px] mt-1.5 font-bold ${isActive ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-600 dark:text-slate-400"}`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/20 text-indigo-705 dark:text-indigo-400 px-3.5 py-1.5 rounded-full text-[10px] font-semibold gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-[pulse_2s_infinite]" /> Interactive Crop Zone Active • Set compression sliders and click "Compress"
                  </div>
                </div>
              )}

              {/* Real-time RGB Spectrum Analysis Section */}
              <div className="mt-5 border-t border-slate-200/50 dark:border-slate-800/80 pt-4" id="histogram-analysis-section">
                {compressedResult ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RGBHistogram 
                      imageUrl={originalUrl || activeItem.originalUrl} 
                      id="original-rgb-histogram"
                      label="Original Color Spectrum (Pre-Compression)"
                    />
                    <RGBHistogram 
                      imageUrl={compressedResult.dataUrl} 
                      id="compressed-rgb-histogram"
                      label={`Optimized Color Spectrum (${compressedResult.savingPercentage}% Shrunk)`}
                    />
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto md:max-w-none">
                    <RGBHistogram 
                      imageUrl={originalUrl || activeItem.originalUrl} 
                      id="pre-compression-rgb-histogram"
                      label="Input Spectrum Distribution (Real-time Sample)"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compressed Action Row */}
        {compressedResult && activeItem && (
          <div className="space-y-4 pt-3 w-full font-sans">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-905/60 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                id="btn-download-compressed"
              >
                <Download className="w-4 h-4 mr-2 text-slate-400" />
                Download Current File
              </button>

              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-550 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-indigo-500/20"
                id="btn-social-comparison-export"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Export Comparison Image
              </button>

              {user ? (
                <button
                  onClick={handleSaveToDrive}
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-950 dark:bg-indigo-650 text-white hover:bg-slate-900 dark:hover:bg-indigo-500 font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  id="btn-save-compressed-drive"
                >
                  <Cloud className="w-4 h-4 mr-2 text-emerald-400 animate-pulse" />
                  {isSaving ? "Saving to Google Drive..." : "Save to Google Drive"}
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-205 dark:bg-slate-800 text-slate-850 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-xs transition-all pointer sm:w-auto cursor-pointer"
                  title="Authenticate Drive upload via your Google Workspace account"
                  id="btn-prompt-login-compress"
                >
                  <Cloud className="w-4 h-4 mr-2 text-slate-600" />
                  Sign in to Save to Drive
                </button>
              )}
            </div>

            {queue.filter(item => item.compressedResult).length > 0 && (
              <button
                onClick={handleDownloadAllAsZip}
                disabled={isZipping}
                className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border border-indigo-700"
                id="btn-download-all-zip-results"
              >
                {isZipping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Compiling All Compressed Images into ZIP Archive...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4 mr-2 text-indigo-200" />
                    Download All Processed Files as ZIP (.zip) — {queue.filter(item => item.compressedResult).length} item(s) ready
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Sessions Sidebar: 3 Cols */}
      <div className="lg:col-span-2 xl:col-span-3 bg-slate-50 dark:bg-slate-905/30 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col space-y-4 text-left" id="recent-sessions-sidebar">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-1 select-none">
            <History className="w-4 h-4 text-indigo-500 animate-[spin_10s_linear_infinite]" /> Recent Sessions & Recovery
          </h3>
          <p className="text-[11px] text-slate-505 dark:text-slate-400">
            Access, manage settings, restore previous interrupted batches, or direct download your last 10 compression jobs.
          </p>
        </div>

        {localBackupAvailable && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 p-3.5 rounded-xl flex flex-col space-y-2 select-none shadow-3xs border-dashed">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Interrupted Draft
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                {localBackupData?.timestamp ? new Date(localBackupData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              An active session with <strong className="font-bold text-slate-800 dark:text-slate-200">{localBackupData?.items?.length || 0} file(s)</strong> was interrupted. Restore it to retrieve files, quality, and configurations!
            </p>
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleDiscardLocalBackup}
                className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-450 text-[9px] font-bold cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleRestoreLocalBackup}
                className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Restore</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col space-y-3 overflow-y-auto max-h-[500px]" id="sessions-timeline-container">
          {sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-205 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-950/20 py-8">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-705 mb-2.5 animate-pulse" />
              <p className="text-xs font-bold text-slate-650 dark:text-slate-300">No Historical Batches</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-[170px] leading-normal">
                Batch compress files in your active queue to log auto snapshots.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const hasCachedResult = session.files.some(f => f.compressedResult && f.compressedResult.dataUrl);
                return (
                  <div 
                    key={session.id}
                    className="group bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/55 dark:border-slate-800/60 transition-all relative flex flex-col space-y-2 select-none shadow-sm hover:shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          -{session.savingsPercentage}%
                        </span>
                        <button 
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 rounded text-slate-300 hover:text-rose-550 dark:text-slate-600 dark:hover:text-rose-450 transition-colors cursor-pointer"
                          title="Purge session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-left font-sans">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={`Batch of ${session.filesCount} file(s)`}>
                        Batch of {session.filesCount} file{session.filesCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 truncate max-w-[180px]" title={session.files.map(f => f.name).join(", ")}>
                        {session.files.map(f => f.name).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-500 pb-1">
                      <span>Saved Weight:</span>
                      <span className="font-mono font-bold text-slate-705 dark:text-slate-300 scale-95 origin-right">
                        {formatFileSize(session.totalOriginalSize)} ➔ {formatFileSize(session.totalCompressedSize)}
                      </span>
                    </div>

                    {/* Compact layout action buttons for single-click restore / download */}
                    <div className="flex gap-1.5 pt-1.5 border-t border-slate-100/60 dark:border-slate-900/60">
                      <button
                        type="button"
                        onClick={() => handleLoadSession(session)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/50 text-[9px] font-black uppercase tracking-wide cursor-pointer select-none transition-all hover:scale-101 active:scale-99"
                        title="Reload session queue, restoring files and configs"
                      >
                        <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                        <span>Re-Apply</span>
                      </button>

                      {hasCachedResult ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadSessionImages(session, e)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-650 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/50 text-[9px] font-black uppercase tracking-wide cursor-pointer select-none transition-all hover:scale-101 active:scale-99"
                          title="Instant one-click ZIP download of optimized images"
                        >
                          <Download className="w-2.5 h-2.5 shrink-0" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 text-[9px] font-semibold uppercase tracking-wide cursor-not-allowed select-none opacity-50"
                          title="Image data cleared from storage cache for memory safety"
                        >
                          <CloudOff className="w-2.5 h-2.5 shrink-0" />
                          <span>Pruned</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom active transition highlighter hook */}
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-500 h-0.5 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Image Preview Modal */}
      {isPreviewModalOpen && compressedResult && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 text-white font-sans overflow-hidden outline-none"
          id="fullscreen-compare-modal"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsPreviewModalOpen(false);
          }}
          tabIndex={0}
        >
          {/* Top Control Bar */}
          <div className="w-full max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
            <div className="text-left">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/50 border border-indigo-900/60 px-2.5 py-1 rounded-md">
                Interactive Multi-Mode Quality Compare
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-xl mt-1 leading-tight">
                {activeItem?.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Original Size: <span className="font-mono text-slate-305 font-bold">{formatFileSize(compressedResult.originalSize)}</span> • 
                Compressed: <span className="font-mono text-emerald-405 font-bold">{formatFileSize(compressedResult.compressedSize)}</span> • 
                Savings ratio: <span className="text-emerald-400 font-black">-{compressedResult.savingPercentage}%</span>
              </p>
            </div>

            {/* Render Mode Selectors */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto select-none">
              <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center space-x-1">
                {[
                  { id: "side-by-side", label: "Side-by-Side" },
                  { id: "slider", label: "Interactive Slider" },
                  { id: "ab-toggle", label: "A/B Quick Switch" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPreviewMode(mode.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      previewMode === mode.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-405 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Download & Close actions */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
                title="Close modal (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core Interactive Comparison Area */}
          <div className="flex-1 w-full max-w-7xl flex items-center justify-center p-2 sm:p-4 min-h-0">
            {previewMode === "side-by-side" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full max-h-[70vh] items-center">
                {/* Original side */}
                <div className="flex flex-col h-full bg-slate-900/30 border border-slate-800 rounded-2xl p-4 min-h-0 overflow-hidden text-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800 self-center">
                    Original Source (100% Raw)
                  </span>
                  <div className="flex-1 flex items-center justify-center min-h-0 mt-4 overflow-hidden rounded-xl bg-black/40">
                    <img 
                      src={originalUrl || undefined} 
                      alt="Original full quality" 
                      style={{ 
                        transform: `rotate(${activeItem?.rotation || 0}deg)`,
                        filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                                imgFilter === "sepia" ? "sepia(100%)" :
                                imgFilter === "invert" ? "invert(100%)" :
                                imgFilter === "blur" ? "blur(4px)" : "none"
                      }}
                      className="max-h-[50vh] object-contain transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-black font-mono text-slate-400 mt-3 block">
                    {formatFileSize(compressedResult.originalSize)}
                  </span>
                </div>

                {/* Compressed side */}
                <div className="flex flex-col h-full bg-slate-900/30 border border-slate-800 rounded-2xl p-4 min-h-0 overflow-hidden text-center justify-between">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-900/40 self-center">
                    Optimized Quality Model (-{compressedResult.savingPercentage}%)
                  </span>
                  <div className="flex-1 flex items-center justify-center min-h-0 mt-4 overflow-hidden rounded-xl bg-black/40">
                    <img 
                      src={compressedResult.dataUrl} 
                      alt="Optimized full quality" 
                      className="max-h-[50vh] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-black font-mono text-emerald-405 mt-3 block">
                    {formatFileSize(compressedResult.compressedSize)}
                  </span>
                </div>
              </div>
            )}

            {previewMode === "slider" && (
              <div 
                ref={sliderContainerRef}
                onMouseDown={onSliderMouseDown}
                onTouchStart={onSliderTouchStart}
                className="relative w-full max-w-4xl aspect-[16/10] sm:aspect-video rounded-2xl border border-slate-800 bg-black/40 overflow-hidden select-none cursor-ew-resize max-h-[70vh]"
                id="preview-contrast-slider-container"
              >
                {/* Optimized image as background */}
                <img 
                  src={compressedResult.dataUrl} 
                  alt="Optimized side element"
                  style={{ transform: `rotate(${activeItem?.rotation || 0}deg)` }}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform"
                  referrerPolicy="no-referrer"
                />
                
                {/* Original image as absolute clip layer overlay */}
                <img 
                  src={originalUrl || undefined} 
                  alt="Original side element"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform"
                  style={{ 
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                    transform: `rotate(${activeItem?.rotation || 0}deg)`,
                    filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                            imgFilter === "sepia" ? "sepia(100%)" :
                            imgFilter === "invert" ? "invert(100%)" :
                            imgFilter === "blur" ? "blur(4px)" : "none"
                  }}
                  referrerPolicy="no-referrer"
                />

                {/* Slider bar splitter line element */}
                <div 
                  className="absolute inset-y-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] flex items-center justify-center cursor-ew-resize z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-200 text-white flex items-center justify-center font-bold text-sm select-none shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-150 transform -translate-x-1/2">
                    ↔
                  </div>
                </div>

                {/* Overlay Badge Labels */}
                <span className="absolute left-4 top-4 text-[9px] font-black uppercase text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow z-10">
                  Original
                </span>
                <span className="absolute right-4 top-4 text-[9px] font-black uppercase text-emerald-400 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow z-10">
                  Optimized
                </span>
              </div>
            )}

            {previewMode === "ab-toggle" && (
              <div 
                onClick={() => setShowOriginalInAB(!showOriginalInAB)}
                className="relative w-full max-w-3xl aspect-[16/10] sm:aspect-video rounded-3xl border border-slate-800 bg-black/40 overflow-hidden cursor-pointer select-none max-h-[70vh] flex flex-col items-center justify-center group"
                title="Click anywhere to toggle before/after in-place comparison"
              >
                <img 
                  src={showOriginalInAB ? (originalUrl || undefined) : compressedResult.dataUrl} 
                  alt="A/B toggle element"
                  style={showOriginalInAB ? { 
                    transform: `rotate(${activeItem?.rotation || 0}deg)`,
                    filter: imgFilter === "grayscale" ? "grayscale(100%)" :
                            imgFilter === "sepia" ? "sepia(100%)" :
                            imgFilter === "invert" ? "invert(100%)" :
                            imgFilter === "blur" ? "blur(4px)" : "none"
                  } : undefined}
                  className="max-w-full max-h-full object-contain transition-all duration-150"
                  referrerPolicy="no-referrer"
                />

                {/* Interactive Status Indicator Overlay */}
                <div className="absolute inset-x-0 bottom-6 flex items-center justify-center select-none pointer-events-none outline-none">
                  <div className="bg-slate-950/85 text-[11px] font-black uppercase rounded-2xl px-4 py-2 border border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-505 animate-pulse" />
                    Viewing: <span className={showOriginalInAB ? "text-indigo-400" : "text-emerald-400"}>
                      {showOriginalInAB ? `Original (${formatFileSize(compressedResult.originalSize)})` : `Optimized (${formatFileSize(compressedResult.compressedSize)})`}
                    </span>
                    <span className="text-slate-500 font-normal px-1">|</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">Click anywhere to flip</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom instructions row */}
          <div className="w-full text-center text-xs text-slate-550 select-none pb-2 border-t border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl shrink-0">
            <p>💡 Interactive compare modes allow validating precision artifact rendering prior to production distribution.</p>
            <button 
              onClick={() => setIsPreviewModalOpen(false)}
              className="text-indigo-400 hover:text-white font-extrabold cursor-pointer transition-colors"
            >
              Close Quality Viewer
            </button>
          </div>
        </div>
      )}

      {/* Social Sharing Comparison Image Builder Modal */}
      {isComparisonModalOpen && activeItem && activeItem.compressedResult && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans overflow-hidden outline-none"
          id="social-comparison-builder-modal"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsComparisonModalOpen(false);
          }}
          tabIndex={0}
        >
          <div className="bg-slate-900 border border-slate-850/90 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-full max-h-[92vh] sm:max-h-[85vh] md:max-h-[90vh]">
            {/* Left Column: Canvas Preview Zone */}
            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden h-[45%] lg:h-full select-none">
              <span className="absolute top-4 left-4 text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/60 border border-indigo-900/60 px-2.5 py-1 rounded-md z-10 z-index[20]">
                Live Share Frame Preview
              </span>
              
              <div className="w-full h-full flex items-center justify-center overflow-auto scrollbar-none">
                <canvas 
                  ref={comparisonCanvasRef} 
                  className="max-w-full h-auto shadow-2xl rounded-xl border border-slate-800/80 bg-[#090d16]" 
                  style={{ maxHeight: "100%" }}
                />
              </div>
              
              <span className="absolute bottom-4 right-4 text-[9px] font-bold text-slate-500 block font-mono">
                PNG Premium Render Canvas • Auto-scaled Preview
              </span>
            </div>

            {/* Right Column: Customization Controls Panel */}
            <div className="w-full lg:w-[350px] bg-slate-900/95 flex flex-col justify-between overflow-hidden h-[55%] lg:h-full">
              {/* Controls Header */}
              <div className="p-4 sm:p-5 border-b border-slate-850 bg-slate-900/50 shrink-0 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">
                  <Share2 className="w-3.5 h-3.5" /> Social Media Share Builder
                </div>
                <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
                  Export Comparison Card
                </h4>
                <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                  Generate a highly-polished canvas graphic displaying original and compressed variants. Perfect for social posts, galleries, or product showcases.
                </p>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left scrollbar-thin">
                {/* Visual Preset Layout */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-450" /> Layout Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "horizontal", title: "Horizontal Split", icon: "◫" },
                      { id: "vertical", title: "Vertical Stacked", icon: "⊟" }
                    ].map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() => setCompLayout(lay.id as any)}
                        className={`py-1.5 px-3 rounded-lg text-2xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          compLayout === lay.id
                            ? "bg-indigo-600 border-indigo-550 text-white font-extrabold"
                            : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-xs">{lay.icon}</span>
                        {lay.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions Preset */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    📐 Dimension Preset
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "landscape", title: "Landscape", desc: "16:9 • 1200x630" },
                      { id: "square", title: "Square", desc: "1:1 • 1080x1080" },
                      { id: "original", title: "Scale Fit", desc: "Source Bound" }
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setCompDimensions(sz.id as any)}
                        className={`p-1.5 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          compDimensions === sz.id
                            ? "bg-indigo-600 border-indigo-550 text-white font-black"
                            : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-[10px] font-black tracking-wide uppercase">{sz.title}</span>
                        <span className="text-[8px] opacity-75 font-mono">{sz.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Fit Strategy */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    🖼️ Image Fit Behavior
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "contain", title: "Contain Fit", desc: "Add padding wells" },
                      { id: "cover", title: "Cover Crop", desc: "Fill entire boxes" }
                    ].map((fit) => (
                      <button
                        key={fit.id}
                        type="button"
                        onClick={() => setCompFit(fit.id as any)}
                        className={`p-1.5 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer border transition-all ${
                          compFit === fit.id
                            ? "bg-indigo-600 border-indigo-550 text-white font-extrabold"
                            : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-2xs font-extrabold uppercase">{fit.title}</span>
                        <span className="text-[8px] opacity-75">{fit.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Canvas Theme */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    🎨 Graphic Backing Theme
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "dark", title: "Dark Space", code: "#0b0f19" },
                      { id: "light", title: "Minimal Light", code: "#f8fafc" },
                      { id: "indigo-glow", title: "Indigo Aura", code: "#1e1b4b" }
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setCompTheme(theme.id as any)}
                        className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          compTheme === theme.id
                            ? "bg-indigo-600 border-indigo-550 text-white font-black scale-102"
                            : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-inner" style={{ backgroundColor: theme.code }} />
                        <span className="text-[8.5px] font-bold uppercase whitespace-nowrap">{theme.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Fields Zone */}
                <div className="space-y-3 pt-2.5 border-t border-slate-800/60">
                  {/* Headline Title */}
                  <div className="space-y-1">
                    <label htmlFor="comp-input-title" className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                      Headline Header text
                    </label>
                    <input
                      id="comp-input-title"
                      type="text"
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      placeholder="e.g. Compression Results"
                      className="w-full bg-slate-800/50 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  {/* Left Pill Label overlay */}
                  <div className="space-y-1">
                    <label htmlFor="comp-input-left" className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                      Original Image Label badge
                    </label>
                    <input
                      id="comp-input-left"
                      type="text"
                      value={compLeftLabel}
                      onChange={(e) => setCompLeftLabel(e.target.value)}
                      placeholder="e.g. BEFORE"
                      className="w-full bg-slate-800/50 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  {/* Right Pill Label overlay */}
                  <div className="space-y-1">
                    <label htmlFor="comp-input-right" className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                      Optimized Image Label badge
                    </label>
                    <input
                      id="comp-input-right"
                      type="text"
                      value={compRightLabel}
                      onChange={(e) => setCompRightLabel(e.target.value)}
                      placeholder="e.g. OPTIMIZED (-80%)"
                      className="w-full bg-slate-800/50 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  {/* Branding custom settings */}
                  <div className="space-y-2.5 pt-1.5">
                    <div className="flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        id="checkbox-comp-branding-enabled"
                        checked={compShowBranding}
                        onChange={(e) => setCompShowBranding(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-505 focus:ring-indigo-505 accent-indigo-505 cursor-pointer"
                      />
                      <label 
                        htmlFor="checkbox-comp-branding-enabled" 
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-wide cursor-pointer"
                      >
                        Include Branding Badge
                      </label>
                    </div>

                    {compShowBranding && (
                      <div className="space-y-1 pl-6">
                        <label htmlFor="comp-input-brand-text" className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                          Badge watermark phrase
                        </label>
                        <input
                          id="comp-input-brand-text"
                          type="text"
                          value={compBrandingText}
                          onChange={(e) => setCompBrandingText(e.target.value)}
                          placeholder="e.g. Compressed with ToolkitPro"
                          className="w-full bg-slate-800/40 border border-slate-750/80 rounded-lg px-2.5 py-1.5 text-2xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="p-4 sm:p-5 border-t border-slate-850 bg-slate-900/80 space-y-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadComparisonImage}
                  disabled={isGeneratingComparison}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-550 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                  id="btn-social-comparison-download"
                >
                  {isGeneratingComparison ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating Comparison Image...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 text-indigo-150 animate-bounce" />
                      Generate & Save Share Frame
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsComparisonModalOpen(false)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 hover:text-white font-semibold text-2xs rounded-xl cursor-pointer transition-colors"
                >
                  Close Sharing Builder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Save Toast Feedback Banner */}
      {autoSaveToast && autoSaveToast.isOpen && (
        <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-3 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white px-4 py-3.5 rounded-2xl shadow-2xl max-w-sm animate-slide-up">
          <div className={`p-1.5 rounded-lg ${autoSaveToast.isError ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {autoSaveToast.isError ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">
              {autoSaveToast.title || (autoSaveToast.isError ? "System Alert" : "Auto-Save Engine Active")}
            </p>
            <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
              {autoSaveToast.message}
            </p>
          </div>
          <button 
            onClick={() => setAutoSaveToast(null)}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-Save Configuration Dialog Modal */}
      {isAutoSaveDialogOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full animate-scale-up relative">
            <button 
              onClick={() => setIsAutoSaveDialogOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900"
              aria-label="Close Auto-Save Dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-left">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Auto-Save Preferences
                </h3>
                <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5">
                  Streamline workspace productivity by saving optimized assets instantly
                </p>
              </div>
            </div>

            <div className="space-y-4 pb-1">
              {/* Toggle Enable State Switch */}
              <div 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isAutoSaveEnabled 
                    ? "border-emerald-250 bg-emerald-50/10 dark:bg-emerald-950/10" 
                    : "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10"
                }`}
                onClick={() => {
                  setIsAutoSaveEnabled(prev => {
                    const next = !prev;
                    localStorage.setItem("toolkit_image_auto_save_enabled", next ? "true" : "false");
                    return next;
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wide">
                      Enable Auto-Save
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 leading-snug">
                      Save compressed assets instantly with zero manual clicks
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer relative shrink-0 ${
                      isAutoSaveEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                        isAutoSaveEnabled ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Toggle Draft Auto-Save Switch */}
              <div 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isAutoSaveDraftEnabled 
                    ? "border-violet-250 bg-violet-50/10 dark:bg-violet-950/10" 
                    : "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10"
                }`}
                onClick={() => {
                  setIsAutoSaveDraftEnabled(prev => {
                    const next = !prev;
                    localStorage.setItem("toolkit_image_draft_auto_save", next ? "true" : "false");
                    return next;
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wide">
                      Auto-Save Edit Session Draft
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 leading-snug">
                      Secure cropping coordinates, crop heights, qualities, and rotation states automatically on Google Drive to resume work later
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer relative shrink-0 ${
                      isAutoSaveDraftEnabled ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                        isAutoSaveDraftEnabled ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Destination Mode Configuration */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
                  Save Destination Target
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                      autoSaveTarget === "local" 
                        ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" 
                        : "border-slate-105 dark:border-slate-900 bg-slate-50/30 hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                    onClick={() => {
                      setAutoSaveTarget("local");
                      localStorage.setItem("toolkit_image_auto_save_target", "local");
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Download className={`w-4 h-4 ${autoSaveTarget === "local" ? "text-indigo-500" : "text-slate-450"}`} />
                      {autoSaveTarget === "local" && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-850 dark:text-slate-200 block uppercase tracking-wide">
                      Local Drive
                    </span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug mt-1">
                      Automatically downloads files or packages them as ZIPs.
                    </p>
                  </div>

                  <div 
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                      autoSaveTarget === "drive" 
                        ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/10" 
                        : "border-slate-105 dark:border-slate-900 bg-slate-50/30 hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                    onClick={() => {
                      setAutoSaveTarget("drive");
                      localStorage.setItem("toolkit_image_auto_save_target", "drive");
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Cloud className={`w-4 h-4 ${autoSaveTarget === "drive" ? "text-blue-500" : "text-slate-450"}`} />
                      {autoSaveTarget === "drive" && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-850 dark:text-slate-200 block uppercase tracking-wide">
                      Google Drive
                    </span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug mt-1">
                      Saves straight to connected cloud storage in seconds.
                    </p>
                    {!user && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[7px] font-black uppercase px-1 rounded scale-90">
                        Login Req
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Workspace Auto-Clear and Session Safety Configuration */}
              <div className="space-y-3.5 text-left pt-3 border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-550">🧹</span>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
                    Workspace Auto-Clear & Security
                  </label>
                </div>

                {/* Auto-Clear Period Select Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-850 dark:text-slate-205">
                      Inactivity Clear Timer
                    </span>
                    <span className="text-[9px] font-bold text-indigo-550 dark:text-indigo-400 font-mono">
                      {autoClearTimeout === 0 ? "Disabled" : `${autoClearTimeout} Min`}
                    </span>
                  </div>
                  <select
                    value={autoClearTimeout}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAutoClearTimeout(val);
                      localStorage.setItem("toolkit_image_auto_clear_timeout", String(val));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="0">Never Clear (Keep Session)</option>
                    <option value="1">1 Minute</option>
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                    Wipes the active workspace image list automatically when not in use.
                  </p>
                </div>

                {/* Navigate Away Clear Toggle Switch */}
                <div 
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    autoClearOnNavigate 
                      ? "border-rose-250 bg-rose-50/10 dark:bg-rose-950/10" 
                      : "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10"
                  }`}
                  onClick={() => {
                    setAutoClearOnNavigate(prev => {
                      const next = !prev;
                      localStorage.setItem("toolkit_image_auto_clear_on_navigate", next ? "true" : "false");
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">
                        Wipe on Navigate Away
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                        Instantly wipe active cache, history list, and Google Drive drafts when leaving the tool
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer relative shrink-0 ${
                        autoClearOnNavigate ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                          autoClearOnNavigate ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicator Warning */}
              {isAutoSaveEnabled && autoSaveTarget === "drive" && (!user || !accessToken) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Drive Sign-in Required</span>
                  </div>
                  <p className="text-[9.5px] text-slate-600 dark:text-slate-400 leading-normal">
                    You have selected cloud storage, but you are not signed in. Click "Login to GDrive" on the action bar to connect your Google Workspace account first.
                  </p>
                </div>
              )}

              {/* Guidelines helper text */}
              <p className="text-[9.5px] text-slate-450 dark:text-slate-500 text-center leading-relaxed font-sans">
                * Note: Batch processes automatically package files in highly optimized ZIP archives to avoid annoying concurrent tab prompt downloads.
              </p>

              {/* Close Button Row */}
              <button
                type="button"
                onClick={() => setIsAutoSaveDialogOpen(false)}
                className="w-full mt-2 py-2 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Accept and Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIF Info Dialog Modal */}
      {isExifModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-scale-up relative font-sans">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Exif & Technical Metadata Inspector
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Examine rich metadata, camera specifications, and physical resolutions of your queued files
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExifModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                aria-label="Close Metadata Inspector"
                id="btn-close-exif-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            {queue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950">
                <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 mb-3 shadow-3xs">
                  <Camera className="w-6 h-6 stroke-1.5" />
                </div>
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Empty Processing Queue</h4>
                <p className="text-[10.5px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  There are currently no files loaded in the compressor. Load some images first to view their Exif specs!
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-50/20 dark:bg-slate-950/20">
                {/* Left Sidebar: File list */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-900 overflow-y-auto flex-shrink-0 p-3 space-y-1.5 flex flex-col">
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-505 block px-2 mb-1">
                    Queued Files ({queue.length})
                  </span>
                  <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                    {queue.map((item) => {
                      const isSelected = item.id === selectedExifId;
                      const hasExif = exifDataMap[item.id] && !exifDataMap[item.id]["None"];
                      const isLoading = loadingExifIds.includes(item.id);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedExifId(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-slate-900 dark:bg-indigo-650 text-white shadow-sm"
                              : "bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-850"
                          }`}
                        >
                          {/* Mini Thumbnail */}
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-955 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200/40 dark:border-slate-800 shadow-3xs">
                            <img 
                              src={item.thumbnailUrl || item.originalUrl} 
                              alt="Item thumbnail" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] font-bold truncate">
                              {item.name}
                            </p>
                            <div className={`text-[9.5px] mt-0.5 font-semibold flex items-center gap-1.5 ${isSelected ? "text-slate-300" : "text-slate-405 dark:text-slate-500"}`}>
                              <span>{formatFileSize(item.size)}</span>
                              <span>•</span>
                              {isLoading ? (
                                <span className="text-indigo-400 animate-pulse text-[9px]">Scanning...</span>
                              ) : hasExif ? (
                                <span className="text-emerald-500 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 px-1 py-0.2 rounded">Exif</span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase">Basic</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area: Metadata Detail view */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                  {(() => {
                    const selectedItem = queue.find(q => q.id === selectedExifId) || queue[0];
                    if (!selectedItem) return null;

                    const isLoading = loadingExifIds.includes(selectedItem.id);
                    const exif = getParsedExif(selectedItem.id, selectedItem.file);

                    return (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Top Summary card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                          {/* Preview container */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/50 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1 shadow-2xs relative">
                            <img 
                              src={selectedItem.originalUrl} 
                              alt="Preview target" 
                              className="max-w-full max-h-full object-contain rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="text-center sm:text-left flex-1 min-w-0">
                            <span className="text-[8.5px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-lg">
                              Format: {selectedItem.type.split("/")[1]?.toUpperCase() || "UNKNOWN"}
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-805 dark:text-slate-100 truncate mt-1.5 leading-tight">
                              {selectedItem.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">
                              File Size: <span className="font-mono font-bold text-slate-655 dark:text-slate-205">{formatFileSize(selectedItem.size)}</span>
                              {exif && (
                                <>
                                  <span className="mx-2">•</span>
                                  Resolution: <span className="font-mono font-bold text-slate-655 dark:text-slate-205">{exif.pixelWidth} × {exif.pixelHeight} px</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {isLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-350 mt-3 animate-pulse">
                              Extracting deep metadata blocks...
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Reading camera headers and file segments
                            </p>
                          </div>
                        ) : exif ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Panel 1: Camera Specifications */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850/60 pb-1.5 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                                Camera Hardware
                              </h5>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Brand Maker</span>
                                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{exif.make}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Device Model</span>
                                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{exif.model}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Integrated lens</span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate block mt-0.5" title={exif.lens}>{exif.lens}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Capturing Software</span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-355 truncate block mt-0.5" title={exif.software}>{exif.software}</span>
                                </div>
                              </div>
                            </div>

                            {/* Panel 2: Exposure and Lens Settings */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850/60 pb-1.5 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                                Exposure Parameters
                              </h5>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Exposure / Shutter</span>
                                  <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{exif.exposureTime}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Aperture Size</span>
                                  <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{exif.aperture}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">ISO Sensitivity</span>
                                  <span className="text-xs font-mono font-extrabold text-slate-850 dark:text-slate-250 block mt-0.5">
                                    {exif.iso && String(exif.iso) !== "Unknown" ? `ISO ${exif.iso}` : "Auto"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Focal Length</span>
                                  <span className="text-xs font-mono font-extrabold text-slate-850 dark:text-slate-250 block mt-0.5">{exif.focalLength}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Exposure Program</span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mt-0.5">{exif.exposureProgram}</span>
                                </div>
                              </div>
                            </div>

                            {/* Panel 3: Time & Location Map Metadata */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850/60 pb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                Chronology & Sensors
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Date & Time Captured</span>
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{exif.dateTime}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-rose-500" /> GPS Satellite Position
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-355 block mt-0.5 truncate" title={exif.gps}>
                                    {exif.gps}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Panel 4: Quality & Advanced details */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850/60 pb-1.5 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-500" />
                                Interactive Conditions
                              </h5>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Flash Mode</span>
                                  <span className="text-xs font-semibold text-slate-850 dark:text-slate-255 truncate block mt-0.5" title={exif.flash}>{exif.flash}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">White Balance</span>
                                  <span className="text-xs font-semibold text-slate-850 dark:text-slate-255 truncate block mt-0.5" title={exif.whiteBalance}>{exif.whiteBalance}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wide">Raw Mime Type</span>
                                  <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{selectedItem.type}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-slate-150 dark:border-slate-850">
                            <Info className="w-7 h-7 text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-350">
                              No metadata tags found in this file type
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Footer containing help text and closing action */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-450 dark:text-slate-505 flex items-center gap-1">
                💡 EXIF parsing is processed entirely server-safe on client-side sandboxes. No raw photos are transmitted.
              </span>
              <button
                type="button"
                onClick={() => setIsExifModalOpen(false)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Compression Summary Modal */}
      <AnimatePresence>
        {isBatchSummaryOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden font-sans relative focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsBatchSummaryOpen(false);
              }}
              tabIndex={0}
              ref={(el) => {
                if (el) el.focus();
              }}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Batch Compression Completed
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                      Analyze optimizations and download your compressed files with a single click.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBatchSummaryOpen(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                  aria-label="Close Summary Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Dashboard Cards for Metrics */}
                {(() => {
                  const totalOriginal = batchSummaryItems.reduce((acc, item) => acc + item.size, 0);
                  const totalCompressed = batchSummaryItems.reduce(
                    (acc, item) => acc + (item.compressedResult?.compressedSize ?? item.size),
                    0
                  );
                  const totalSavedSpace = totalOriginal - totalCompressed;
                  const savingsPercent = totalOriginal > 0 ? Math.round((totalSavedSpace / totalOriginal) * 100) : 0;

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 text-left">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                            Total Output Size
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono">
                              {formatFileSize(totalCompressed)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              down from {formatFileSize(totalOriginal)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-950/40 rounded-2xl p-4 text-left">
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                            Total Storage Saved
                          </span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                            {formatFileSize(totalSavedSpace)}
                          </span>
                        </div>

                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/40 rounded-2xl p-4 text-left">
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
                            Optimization Ratio
                          </span>
                          <span className="text-xl font-black text-indigo-650 dark:text-indigo-400 font-mono block">
                            -{savingsPercent}% Weight
                          </span>
                        </div>
                      </div>

                      {/* Table of Optimized Files */}
                      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse font-sans text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60 font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                              <th className="py-3 px-4">File Name</th>
                              <th className="py-3 px-4 text-right">Original</th>
                              <th className="py-3 px-4 text-right">Compressed</th>
                              <th className="py-3 px-4 text-center">Saving %</th>
                              <th className="py-3 px-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                            {batchSummaryItems.map((item, index) => {
                              const original = item.size;
                              const compressed = item.compressedResult?.compressedSize ?? item.size;
                              const percent = item.compressedResult?.savingPercentage ?? 0;
                              const hasResult = !!item.compressedResult;
                              const isCurrentlyDragged = draggedSummaryIndex === index;
                              const isDragOver = dragOverSummaryIndex === index;

                              return (
                                <tr
                                  key={item.id}
                                  draggable
                                  onDragStart={(e) => handleSummaryDragStart(e, index)}
                                  onDragOver={(e) => handleSummaryDragOver(e, index)}
                                  onDragEnd={handleSummaryDragEnd}
                                  onDrop={(e) => handleSummaryDrop(e, index)}
                                  className={`transition-all cursor-grab active:cursor-grabbing ${
                                    isCurrentlyDragged
                                      ? "opacity-30 bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300"
                                      : isDragOver
                                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-y border-indigo-500 scale-[1.005] shadow-sm"
                                      : "hover:bg-slate-50/55 dark:hover:bg-slate-900/20"
                                  }`}
                                >
                                  <td className="py-3 px-4 max-w-[240px] truncate font-bold text-slate-800 dark:text-slate-200">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="p-1 text-slate-350 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab shrink-0 flex items-center justify-center select-none"
                                        title="Drag item to change order in ZIP archive"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono select-none">
                                        #{index + 1}
                                      </span>
                                      <span title={item.name} className="truncate">{item.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                                    {formatFileSize(original)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-450 font-semibold">
                                    {hasResult ? formatFileSize(compressed) : "Failed"}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {hasResult ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-mono font-black text-emerald-650 dark:text-emerald-400">
                                        -{percent}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">0%</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {hasResult && item.compressedResult ? (
                                        <>
                                          <button
                                            onClick={() => {
                                              const link = document.createElement("a");
                                              link.download = item.compressedResult!.fileName;
                                              link.href = item.compressedResult!.dataUrl;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                            className="p-1 px-2.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-450 text-[10px] uppercase font-extrabold tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0"
                                            title="Download this single file"
                                          >
                                            <Download className="w-3 h-3" />
                                            <span>Get</span>
                                          </button>

                                          {user ? (
                                            <button
                                              onClick={(e) => handleSaveItemToDrive(item, e)}
                                              disabled={item.isSaving}
                                              className="p-1 px-2.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-900 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-450 text-slate-600 dark:text-slate-450 text-[10px] uppercase font-extrabold tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0 disabled:opacity-40"
                                              title={item.isSaving ? "Saving..." : item.saveStatus?.success ? "Saved to Drive! Click to upload again." : "Save this individual file to Google Drive"}
                                            >
                                              {item.isSaving ? (
                                                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin shrink-0" />
                                              ) : (
                                                <Cloud className={`w-3 h-3 shrink-0 ${item.saveStatus?.success ? "text-emerald-500" : ""}`} />
                                              )}
                                              <span>{item.saveStatus?.success ? "Saved" : "Drive"}</span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onLogin();
                                              }}
                                              className="p-1 px-2.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-450 text-[10px] uppercase font-extrabold tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0"
                                              title="Sign in to save this file to Google Drive"
                                            >
                                              <Cloud className="w-3 h-3 shrink-0" />
                                              <span>Drive</span>
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">N/A</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer Area */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBatchSummaryOpen(false)}
                  className="px-4 py-2 border border-slate-350 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer transition-colors"
                >
                  Close Summary
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleDownloadAllAsZip();
                  }}
                  disabled={isZipping || batchSummaryItems.filter((i) => i.compressedResult).length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm hover:shadow active:scale-98"
                >
                  {isZipping ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Creating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-3.5 h-3.5" />
                      <span>Download All as ZIP</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
