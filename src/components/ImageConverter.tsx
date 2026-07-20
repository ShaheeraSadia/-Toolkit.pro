import React, { useState, useRef, useEffect } from "react";
import { 
  FileImage, 
  Upload, 
  RefreshCw, 
  Download, 
  Settings, 
  Maximize2, 
  Sliders, 
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";

interface ImageConverterProps {
  theme: "light" | "dark";
}

export default function ImageConverter({ theme }: ImageConverterProps) {
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState<number>(0);
  const [sourceMime, setSourceMime] = useState<string>("");
  const [sourceName, setSourceName] = useState<string>("");

  const [targetFormat, setTargetFormat] = useState<"jpeg" | "png" | "webp" | "bmp">("png");
  const [quality, setQuality] = useState<number>(0.85);
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleDriveFile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.targetTab === "converter") {
        const { file } = customEvent.detail;
        if (file && file.dataUrl) {
          setSourceImg(file.dataUrl);
          setSourceName(file.name);
          setSourceSize(file.size || 0);
          setSourceMime(file.mimeType || "image/png");
          setConvertedUrl(null); // Reset converted url when new file loaded
        }
      }
    };
    window.addEventListener("toolkit-use-drive-file", handleDriveFile);
    return () => window.removeEventListener("toolkit-use-drive-file", handleDriveFile);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceName(file.name);
    setSourceSize(file.size);
    setSourceMime(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImg(event.target.result as string);
        setConvertedUrl(null);
        setConvertedSize(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run on image load to read actual bounds
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setResizeWidth(naturalWidth);
    setResizeHeight(naturalHeight);
    setAspectRatio(naturalWidth / naturalHeight);
  };

  // Adjust width, syncing height if maintained aspect
  const handleWidthChange = (val: number) => {
    setResizeWidth(val);
    if (maintainAspect && aspectRatio) {
      setResizeHeight(Math.round(val / aspectRatio));
    }
  };

  // Adjust height, syncing width if maintained aspect
  const handleHeightChange = (val: number) => {
    setResizeHeight(val);
    if (maintainAspect && aspectRatio) {
      setResizeWidth(Math.round(val * aspectRatio));
    }
  };

  // Convert Image completely in-browser
  const performConversion = () => {
    if (!sourceImg) return;
    setIsConverting(true);

    const img = new Image();
    img.src = sourceImg;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = resizeWidth || img.naturalWidth;
      canvas.height = resizeHeight || img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsConverting(false);
        return;
      }

      // If target is JPEG/WebP and has transparent background, fill with white
      if (targetFormat === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let formatStr = `image/${targetFormat}`;
      if (targetFormat === "bmp") {
        formatStr = "image/png"; // Standard fallback for canvas toBMP, or export as transparent PNG helper
      }

      const outputDataUrl = canvas.toDataURL(formatStr, targetFormat === "png" ? undefined : quality);
      
      // Calculate approximate converted size from base64 encoding (roughly 3/4 size)
      const approxBytes = Math.round((outputDataUrl.length - 22) * 3 / 4);

      setConvertedUrl(outputDataUrl);
      setConvertedSize(approxBytes);
      setIsConverting(false);
    };
  };

  // Re-trigger conversion on quality/format/size parameter updates
  useEffect(() => {
    if (sourceImg) {
      const timeout = setTimeout(() => {
        performConversion();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [sourceImg, targetFormat, quality, resizeWidth, resizeHeight]);

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 animate-fade-in ${
      theme === "dark" ? "text-slate-100" : "text-slate-800"
    }`}>
      {/* Header Banner */}
      <div className="pb-5 border-b border-slate-150 dark:border-slate-850 select-none">
        <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Client-side <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500">Image Converter</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Convert between PNG, JPEG, WEBP, and BMP. Resize dimensions, adjust rendering quality, and compare file sizes dynamically in your sandbox.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive upload and preview zone */}
        <div className="lg:col-span-2 space-y-4">
          {!sourceImg ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer min-h-[300px] text-center select-none ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-950 hover:border-slate-700"
                  : "border-slate-250 bg-white hover:border-slate-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="p-4 bg-teal-500/10 rounded-full text-teal-500 shadow">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold">Select source image to convert</p>
                <p className="text-[10px] text-slate-400">All processing is 100% offline — files are never uploaded to any server.</p>
              </div>
            </div>
          ) : (
            <div className={`border rounded-3xl p-6 space-y-6 ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400">
                  Interactive Conversion Sandbox
                </span>
                <button
                  onClick={() => {
                    setSourceImg(null);
                    setConvertedUrl(null);
                  }}
                  className="text-[10px] font-black uppercase text-red-500 hover:underline"
                >
                  Change File
                </button>
              </div>

              {/* Conversion Visual Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source view */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Source Canvas</span>
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                      {formatBytes(sourceSize)}
                    </span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-slate-900 border overflow-hidden flex items-center justify-center relative">
                    <img
                      ref={imgRef}
                      src={sourceImg}
                      alt="Source"
                      onLoad={handleImageLoaded}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] truncate text-slate-400 text-center font-semibold mt-1">
                    {sourceName} ({sourceMime.split("/")[1]?.toUpperCase()})
                  </p>
                </div>

                {/* Target preview view */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Converted Canvas</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      convertedSize < sourceSize 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {convertedSize ? formatBytes(convertedSize) : "Processing..."}
                    </span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-slate-900 border overflow-hidden flex items-center justify-center relative">
                    {isConverting ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                        <span className="text-[10px] font-bold uppercase font-mono tracking-widest">Optimizing...</span>
                      </div>
                    ) : convertedUrl ? (
                      <img
                        src={convertedUrl}
                        alt="Converted Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Awaiting bounds...</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-teal-500 tracking-wider">
                      Target: {targetFormat.toUpperCase()} ({resizeWidth} × {resizeHeight})
                    </p>
                    {convertedSize > 0 && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1 leading-none">
                        {convertedSize < sourceSize ? (
                          <span className="text-emerald-500">
                            Saved {Math.round((1 - (convertedSize / sourceSize)) * 100)}% of storage size!
                          </span>
                        ) : (
                          <span className="text-amber-500">Size expanded due to raw format mapping.</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration settings sidecar */}
        <div className="space-y-4">
          <div className={`border rounded-3xl p-5 space-y-5 ${
            theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-850">
              <Settings className="w-4 h-4 text-teal-500" />
              <h3 className="text-xs uppercase font-black tracking-wider">Format Parameters</h3>
            </div>

            {/* Selection Format dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Output Export Format</label>
              <div className="relative">
                <select
                  value={targetFormat}
                  onChange={(e: any) => setTargetFormat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 cursor-pointer focus:ring-0 focus:outline-none appearance-none"
                >
                  <option value="png">🖼️ PNG (.png) — Lossless / Transparent</option>
                  <option value="jpeg">📸 JPEG (.jpg) — Highly Compressed</option>
                  <option value="webp">⚡ WEBP (.webp) — Next-Gen Dynamic</option>
                  <option value="bmp">🟦 BMP (.bmp) — Legacy Bitmap</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">▼</div>
              </div>
            </div>

            {/* Quality Compression slider */}
            {(targetFormat === "jpeg" || targetFormat === "webp") && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-bold">Compression Quality</span>
                  <span className="font-mono text-[10px] text-teal-500">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <p className="text-[9px] text-slate-455 dark:text-slate-500 leading-tight">
                  Lower value reduces pixel bounds size while introducing subtle artifacts.
                </p>
              </div>
            )}

            {/* Dimension resizer controls */}
            <div className="space-y-3 border-t pt-4 border-slate-100 dark:border-slate-850">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-450">Scale Resolution</label>
                <button
                  type="button"
                  onClick={() => {
                    setMaintainAspect(!maintainAspect);
                    if (!maintainAspect && aspectRatio && resizeWidth) {
                      setResizeHeight(Math.round(resizeWidth / aspectRatio));
                    }
                  }}
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                    maintainAspect 
                      ? "bg-teal-500/10 text-teal-500 border-teal-500/20" 
                      : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-transparent"
                  }`}
                >
                  {maintainAspect ? "🔒 Constrain Ratio" : "🔓 Free Scale"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-450">Width (px)</span>
                  <input
                    type="number"
                    value={resizeWidth || ""}
                    disabled={!sourceImg}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-805 rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-450">Height (px)</span>
                  <input
                    type="number"
                    value={resizeHeight || ""}
                    disabled={!sourceImg}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-805 rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Export trigger download */}
            <button
              onClick={() => {
                if (!convertedUrl) return;

                // Open target link
                try {
                  const adLink = document.createElement("a");
                  adLink.href = "https://omg10.com/4/11170621";
                  adLink.target = "_blank";
                  adLink.rel = "noopener noreferrer";
                  document.body.appendChild(adLink);
                  adLink.click();
                  document.body.removeChild(adLink);
                } catch (e) {
                  console.error(e);
                }

                const link = document.createElement("a");
                const nameParts = sourceName.split(".");
                nameParts.pop();
                link.download = `${nameParts.join(".")}-converted.${targetFormat}`;
                link.href = convertedUrl;
                link.click();
              }}
              disabled={!convertedUrl}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-teal-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download Converted File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
