import React, { useEffect, useRef, useState } from "react";
import { BarChart, Activity, Zap } from "lucide-react";

interface RGBHistogramProps {
  imageUrl: string | null | undefined;
  id?: string;
  label?: string;
  height?: number;
}

export const RGBHistogram: React.FC<RGBHistogramProps> = ({
  imageUrl,
  id = "rgb-histogram",
  label = "RGB Spectrum Analysis",
  height = 90
}) => {
  const [histogramData, setHistogramData] = useState<{
    r: number[];
    g: number[];
    b: number[];
    max: number;
    avgR: number;
    avgG: number;
    avgB: number;
  } | null>(null);
  const [activeChannel, setActiveChannel] = useState<"rgb" | "red" | "green" | "blue" | "luminance">("rgb");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setHistogramData(null);
      return;
    }

    setIsLoading(true);
    let isActive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      if (!isActive) return;

      // Extract pixel data using a compact canvas size for rapid 1ms computing
      const sampleWidth = 150;
      const sampleHeight = 150;
      const canvas = document.createElement("canvas");
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        setIsLoading(false);
        return;
      }

      try {
        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imgData.data;

        const rHist = new Array(256).fill(0);
        const gHist = new Array(256).fill(0);
        const bHist = new Array(256).fill(0);

        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let countedPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 10) { // Exclude transparent pixels
            rHist[r]++;
            gHist[g]++;
            bHist[b]++;
            sumR += r;
            sumG += g;
            sumB += b;
            countedPixels++;
          }
        }

        // Apply a gentle average filter to smooth the curves beautifully
        const smooth = (arr: number[]) => {
          const result = [...arr];
          for (let i = 1; i < arr.length - 1; i++) {
            result[i] = (arr[i - 1] + arr[i] * 2 + arr[i + 1]) / 4;
          }
          return result;
        };

        const rSmooth = smooth(rHist);
        const gSmooth = smooth(gHist);
        const bSmooth = smooth(bHist);

        const maxVal = Math.max(...rSmooth, ...gSmooth, ...bSmooth, 1);

        setHistogramData({
          r: rSmooth,
          g: gSmooth,
          b: bSmooth,
          max: maxVal,
          avgR: countedPixels > 0 ? Math.round(sumR / countedPixels) : 0,
          avgG: countedPixels > 0 ? Math.round(sumG / countedPixels) : 0,
          avgB: countedPixels > 0 ? Math.round(sumB / countedPixels) : 0,
        });
      } catch (err) {
        console.warn("Could not compute real-time histogram due to tainted canvas or loaded layout limits", err);
      } finally {
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      if (isActive) {
        setHistogramData(null);
        setIsLoading(false);
      }
    };

    img.src = imageUrl;

    return () => {
      isActive = false;
    };
  }, [imageUrl]);

  // Handle high quality drawing on canvas ref
  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    const { r, g, b, max } = histogramData;
    const maxScaled = max * 1.05; // 5% headroom

    // Calculate luminance array if needed
    const lum = new Array(256).fill(0);
    if (activeChannel === "luminance") {
      for (let i = 0; i < 256; i++) {
        lum[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
      }
    }

    // Grid draw
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    // Vertical grid dashes
    for (let s = 1; s < 4; s++) {
      const gx = (s / 4) * width;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    // Horizontal grid dashes
    for (let s = 1; s < 3; s++) {
      const gy = (s / 3) * height;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    const drawCurve = (colorData: number[], strokeStyle: string, fillStyle?: string) => {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const y = height - (colorData[i] / maxScaled) * height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      if (fillStyle) {
        const fillPath = new Path2D();
        fillPath.moveTo(0, height);
        for (let i = 0; i < 256; i++) {
          const x = (i / 255) * width;
          const y = height - (colorData[i] / maxScaled) * height;
          fillPath.lineTo(x, y);
        }
        fillPath.lineTo(width, height);
        fillPath.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill(fillPath);
      }

      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Render corresponding channel spectrums
    if (activeChannel === "rgb") {
      // Draw Red area + outline first
      drawCurve(r, "rgba(239, 68, 68, 0.8)", "rgba(239, 68, 68, 0.1)");
      // Draw Green area + outline
      drawCurve(g, "rgba(34, 197, 94, 0.8)", "rgba(34, 197, 94, 0.1)");
      // Draw Blue area + outline
      drawCurve(b, "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.1)");
    } else if (activeChannel === "red") {
      drawCurve(r, "rgb(239, 68, 68)", "rgba(239, 68, 68, 0.2)");
    } else if (activeChannel === "green") {
      drawCurve(g, "rgb(34, 197, 94)", "rgba(34, 197, 94, 0.2)");
    } else if (activeChannel === "blue") {
      drawCurve(b, "rgb(59, 130, 246)", "rgba(59, 130, 246, 0.2)");
    } else if (activeChannel === "luminance") {
      drawCurve(lum, "rgb(250, 204, 21)", "rgba(250, 204, 21, 0.15)"); // yellow-400
    }
  }, [histogramData, activeChannel]);

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-24 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-3 text-center">
        <BarChart className="w-5 h-5 text-slate-350 dark:text-slate-600 mb-1 animate-pulse" />
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Histogram offline</span>
      </div>
    );
  }

  return (
    <div 
      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col font-sans relative overflow-hidden shadow-2xs color-histogram-chart"
      id={id}
    >
      {/* Header and Controls Row */}
      <div className="flex items-center justify-between mb-2 shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
            {label}
          </span>
          {isLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
          )}
        </div>

        {/* Channels Picker Toggles */}
        <div className="flex items-center bg-slate-200/60 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-300/20 dark:border-slate-850">
          {[
            { id: "rgb", label: "RGB" },
            { id: "red", label: "R", title: "Red Channel" },
            { id: "green", label: "G", title: "Green Channel" },
            { id: "blue", label: "B", title: "Blue Channel" },
            { id: "luminance", label: "L", title: "Luminance Spectrum" }
          ].map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setActiveChannel(ch.id as any)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase transition-all cursor-pointer ${
                activeChannel === ch.id
                  ? "bg-white dark:bg-slate-800 text-slate-855 dark:text-slate-250 shadow-3xs font-black scale-102"
                  : "text-slate-450 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
              title={ch.title || "Combine Full Spectrum channels"}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Chart Area */}
      <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          width={380}
          height={height}
          className="w-full h-full block"
        />

        {isLoading && !histogramData && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-3xs">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-505 animate-bounce" /> Analyzing pixels...
            </span>
          </div>
        )}

        {!isLoading && !histogramData && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">No profile data</span>
          </div>
        )}
      </div>

      {/* Channel averages bottom statistics footer */}
      {histogramData && (
        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 mt-2 pt-1.5 font-mono text-[8.5px] font-semibold text-slate-505 dark:text-slate-500 select-none">
          <span className="flex items-center gap-1 text-[8px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>R: <strong className="font-bold text-slate-700 dark:text-slate-300">{histogramData.avgR}</strong></span>
          </span>
          <span className="flex items-center gap-1 text-[8px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>G: <strong className="font-bold text-slate-700 dark:text-slate-300">{histogramData.avgG}</strong></span>
          </span>
          <span className="flex items-center gap-1 text-[8px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>B: <strong className="font-bold text-slate-700 dark:text-slate-300">{histogramData.avgB}</strong></span>
          </span>
          <span className="text-[7.5px] uppercase tracking-wider text-slate-400 dark:text-slate-600 font-bold">
            256 Discrete Tone Levels
          </span>
        </div>
      )}
    </div>
  );
};
