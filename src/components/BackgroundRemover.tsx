import React, { useState, useRef, useEffect } from "react";
import { 
  Eraser, 
  Upload, 
  Download, 
  Pipette, 
  Sliders, 
  Check, 
  RefreshCw,
  Sparkles,
  Info
} from "lucide-react";

interface BackgroundRemoverProps {
  theme: "light" | "dark";
}

export default function BackgroundRemover({ theme }: BackgroundRemoverProps) {
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // Chroma key parameters
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 }); // Default white
  const [colorHex, setColorHex] = useState<string>("#ffffff");
  const [tolerance, setTolerance] = useState<number>(30); // 0 to 100
  const [feather, setFeather] = useState<number>(10); // 0 to 50
  const [isPipetteActive, setIsPipetteActive] = useState<boolean>(false);

  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleDriveFile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.targetTab === "bgremover") {
        const { file } = customEvent.detail;
        if (file && file.dataUrl) {
          setSourceImg(file.dataUrl);
          setSourceName(file.name);
          setOutputUrl(null); // Reset output when new image loaded
        }
      }
    };
    window.addEventListener("toolkit-use-drive-file", handleDriveFile);
    return () => window.removeEventListener("toolkit-use-drive-file", handleDriveFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImg(event.target.result as string);
        setOutputUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const handlePresetSelect = (preset: "white" | "black" | "green") => {
    const hex = preset === "white" ? "#ffffff" : preset === "black" ? "#000000" : "#00ff00";
    setColorHex(hex);
    setKeyColor(hexToRgb(hex));
  };

  // Main background removal algorithm using canvas pixel manipulation
  const removeBackground = () => {
    if (!sourceImg) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = sourceImg;
    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const targetR = keyColor.r;
      const targetG = keyColor.g;
      const targetB = keyColor.b;
      const tolSquared = tolerance * tolerance * 3; // normalized distance

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in RGB color space
        const diffR = r - targetR;
        const diffG = g - targetG;
        const diffB = b - targetB;
        const distSquared = (diffR * diffR) + (diffG * diffG) + (diffB * diffB);

        if (distSquared <= tolSquared) {
          // Inside tolerance range: calculate alpha feather edge
          if (feather > 0) {
            const distance = Math.sqrt(distSquared);
            const maxDistance = Math.sqrt(tolSquared);
            const featherStart = maxDistance - feather;
            if (distance > featherStart) {
              // feather transition zone
              const ratio = (distance - featherStart) / feather;
              data[i + 3] = Math.min(255, Math.round(ratio * 255));
            } else {
              // total transparent
              data[i + 3] = 0;
            }
          } else {
            data[i + 3] = 0; // complete cut
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setOutputUrl(canvas.toDataURL("image/png"));
      setIsProcessing(false);
    };
  };

  // Canvas eye-dropper click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPipetteActive || !sourceImg) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
      setKeyColor(rgb);
      
      const componentToHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      const hex = "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
      setColorHex(hex);
      setIsPipetteActive(false);
    } catch (err) {
      console.error("Could not pick color:", err);
    }
  };

  // Render preview canvas for the picker reference
  useEffect(() => {
    if (sourceImg) {
      const img = new Image();
      img.src = sourceImg;
      img.onload = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [sourceImg]);

  // Re-run background removal when tolerances, feathering, or key colors change
  useEffect(() => {
    if (sourceImg) {
      const delayDebounce = setTimeout(() => {
        removeBackground();
      }, 350);
      return () => clearTimeout(delayDebounce);
    }
  }, [sourceImg, keyColor, tolerance, feather]);

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 animate-fade-in ${
      theme === "dark" ? "text-slate-100" : "text-slate-800"
    }`}>
      {/* Header Banner */}
      <div className="pb-5 border-b border-slate-150 dark:border-slate-850 select-none">
        <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Dynamic <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-red-500">Background Remover</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chroma key backgrounds out of any picture. Click anywhere on your image canvas with the eyedropper, fine-tune matching sensitivity, and download transparent PNG assets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Canvas Container */}
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
              <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 shadow">
                <Eraser className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold">Upload picture to remove background</p>
                <p className="text-[10px] text-slate-400">Perfect for isolating logo marks, portraits, and product layout cards.</p>
              </div>
            </div>
          ) : (
            <div className={`border rounded-3xl p-6 space-y-6 ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400">
                  {isPipetteActive ? "🎯 Click on color to key-out" : "Matte Sandbox Viewer"}
                </span>
                <button
                  onClick={() => {
                    setSourceImg(null);
                    setOutputUrl(null);
                  }}
                  className="text-[10px] font-black uppercase text-red-500 hover:underline"
                >
                  Change File
                </button>
              </div>

              {/* Side-by-side or stacked view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Click target input canvas */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">
                    Source Picker {isPipetteActive && "🎯 (Eyedropper Active)"}
                  </span>
                  <div className="aspect-square rounded-2xl bg-slate-900 border overflow-hidden flex items-center justify-center relative select-none">
                    <canvas
                      ref={previewCanvasRef}
                      onClick={handleCanvasClick}
                      className={`max-h-full max-w-full object-contain ${
                        isPipetteActive ? "cursor-crosshair ring-4 ring-rose-500 animate-pulse" : ""
                      }`}
                    />
                  </div>
                  <p className="text-[9px] text-center text-slate-405 leading-none">
                    {isPipetteActive 
                      ? "Move cursor over source frame and click to select exact hue." 
                      : "Click Eyedropper button on right to select a custom background color."
                    }
                  </p>
                </div>

                {/* Alpha checkerboard preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">Isolated Output (PNG alpha)</span>
                  <div 
                    className="aspect-square rounded-2xl border overflow-hidden flex items-center justify-center relative bg-slate-950"
                    style={{
                      backgroundImage: "radial-gradient(#475569 1px, transparent 1px), radial-gradient(#475569 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 10px 10px"
                    }}
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400 bg-slate-950/80 p-6 rounded-2xl">
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                        <span className="text-[10px] font-bold uppercase font-mono tracking-widest">Isolating matte...</span>
                      </div>
                    ) : outputUrl ? (
                      <img
                        src={outputUrl}
                        alt="Isolated Matte"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Initializing pixels...</span>
                    )}
                  </div>
                  <p className="text-[10px] truncate text-center text-slate-400 font-semibold">
                    {sourceName} — transparent bounds
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configurations Sidecar Panel */}
        <div className="space-y-4">
          <div className={`border rounded-3xl p-5 space-y-5 ${
            theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-850">
              <Sliders className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs uppercase font-black tracking-wider">Matte Parameters</h3>
            </div>

            {/* Selection Picker */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400">Target Background Color</label>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPipetteActive(!isPipetteActive)}
                  disabled={!sourceImg}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all disabled:opacity-50 ${
                    isPipetteActive 
                      ? "bg-rose-500 text-white border-rose-500" 
                      : theme === "dark"
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Activate canvas eye-dropper"
                >
                  <Pipette className="w-4 h-4" />
                  <span>{isPipetteActive ? "Picking..." : "Use Eyedropper"}</span>
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <div 
                    className="w-7 h-7 rounded-lg border shadow-xs" 
                    style={{ backgroundColor: colorHex }} 
                  />
                  <span className="text-xs font-mono font-bold uppercase">{colorHex}</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Backdrop Presets</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handlePresetSelect("white")}
                    disabled={!sourceImg}
                    className="py-1 px-2 rounded-lg border text-[10px] font-bold bg-white text-slate-900 border-slate-300 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    White Box
                  </button>
                  <button
                    onClick={() => handlePresetSelect("black")}
                    disabled={!sourceImg}
                    className="py-1 px-2 rounded-lg border text-[10px] font-bold bg-slate-950 text-white border-slate-800 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Black box
                  </button>
                  <button
                    onClick={() => handlePresetSelect("green")}
                    disabled={!sourceImg}
                    className="py-1 px-2 rounded-lg border text-[10px] font-bold bg-green-500 text-white border-green-400 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Chroma Grn
                  </button>
                </div>
              </div>
            </div>

            {/* Similarity tolerance slider */}
            <div className="space-y-1.5 border-t pt-4 border-slate-100 dark:border-slate-850">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold">Match Sensitivity</span>
                <span className="font-mono text-[10px] text-rose-500">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="2"
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[9px] text-slate-455 dark:text-slate-500 leading-tight">
                Controls how closely matching other colors must be to the selected target key.
              </p>
            </div>

            {/* Edge feathering softness slider */}
            <div className="space-y-1.5 border-t pt-4 border-slate-100 dark:border-slate-850">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold">Matte Edge Softness</span>
                <span className="font-mono text-[10px] text-rose-500">{feather} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={feather}
                onChange={(e) => setFeather(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[9px] text-slate-455 dark:text-slate-500 leading-tight">
                Smooths outline contours to reduce jagged pixel artifacts.
              </p>
            </div>

            {/* Download Isolated Asset */}
            <button
              onClick={() => {
                if (!outputUrl) return;
                const link = document.createElement("a");
                const nameParts = sourceName.split(".");
                nameParts.pop();
                link.download = `${nameParts.join(".")}-isolated.png`;
                link.href = outputUrl;
                link.click();
              }}
              disabled={!outputUrl}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-pink-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download Transparent PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
