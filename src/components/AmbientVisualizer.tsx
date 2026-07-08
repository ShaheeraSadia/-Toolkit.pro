import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ambientSynth } from "../lib/ambientSynth";
import { 
  BarChart2, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Volume2, 
  CircleDot,
  Radio,
  Sliders
} from "lucide-react";

type VisualizerMode = "bars" | "wave" | "radial";

export const AmbientVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>("bars");
  const [isOverlayExpanded, setIsOverlayExpanded] = useState(false);
  
  // Real-time metrics states
  const [dbLevel, setDbLevel] = useState(-60);
  const [peakFreq, setPeakFreq] = useState(0);
  const [bandActivity, setBandActivity] = useState({ low: 0, mid: 0, high: 0 });

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 260;
    const height = isOverlayExpanded ? 120 : 64;
    const barCount = 32;
    const padding = 2;
    const barWidth = (width / barCount) - padding;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Clear any existing contents to prevent duplicates
    svg.selectAll("*").remove();

    // Create a beautiful linear gradient for visualizer fills
    const defs = svg.append("defs");
    
    const barGrad = defs.append("linearGradient")
      .attr("id", "equalizer-grad")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    barGrad.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4f46e5"); // Indigo 600

    barGrad.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#6366f1"); // Indigo 500

    barGrad.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#a5b4fc"); // Indigo 300

    // Wave/Oscilloscope gradient
    const waveGrad = defs.append("linearGradient")
      .attr("id", "wave-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    waveGrad.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ec4899"); // Pink 500

    waveGrad.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#6366f1"); // Indigo 500

    waveGrad.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#14b8a6"); // Teal 500

    // Setup initial visualizer structures based on mode
    const g = svg.append("g");

    let bars: d3.Selection<SVGRectElement, number, d3.BaseType, unknown>;
    let path: d3.Selection<SVGPathElement, unknown, null, undefined>;
    let circles: d3.Selection<SVGCircleElement, number, d3.BaseType, unknown>;

    if (mode === "bars") {
      bars = g.selectAll("rect")
        .data(d3.range(barCount))
        .enter()
        .append("rect")
        .attr("x", (d) => d * (barWidth + padding))
        .attr("width", barWidth)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", "url(#equalizer-grad)")
        .attr("height", 4)
        .attr("y", height - 4);
    } else if (mode === "wave") {
      path = g.append("path")
        .attr("fill", "none")
        .attr("stroke", "url(#wave-grad)")
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round");
    } else if (mode === "radial") {
      // Center of radial display
      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.32;

      circles = g.selectAll("circle")
        .data(d3.range(16))
        .enter()
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("fill", "none")
        .attr("stroke", "url(#wave-grad)")
        .attr("stroke-width", 1.5)
        .attr("opacity", (d) => 0.15 + (d / 16) * 0.4)
        .attr("r", (d) => baseRadius + d * 2);
    }

    let animationFrameId: number;
    let metricsUpdateCounter = 0;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      const analyser = ambientSynth.getAnalyser();
      const isPlaying = ambientSynth.isSoundPlaying() && ambientSynth.getActiveSound() !== "none";

      const frequencyData = new Uint8Array(barCount);
      const waveData = new Uint8Array(barCount);

      if (isPlaying && analyser) {
        const fullFreq = new Uint8Array(analyser.frequencyBinCount);
        const fullTime = new Uint8Array(analyser.frequencyBinCount);
        
        analyser.getByteFrequencyData(fullFreq);
        analyser.getByteTimeDomainData(fullTime);

        // Map full frequency to requested display band bar counts
        const step = Math.max(1, Math.floor(fullFreq.length / barCount));
        for (let i = 0; i < barCount; i++) {
          frequencyData[i] = fullFreq[i * step] || 0;
          waveData[i] = fullTime[i * step] || 128;
        }

        // Periodic DSP Metrics Calculations (Throttled to save CPU cycles)
        metricsUpdateCounter++;
        if (metricsUpdateCounter % 12 === 0) {
          // 1. Calculate RMS Level (Decibels)
          let sumSquares = 0;
          for (let i = 0; i < fullTime.length; i++) {
            const normalized = (fullTime[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / fullTime.length);
          const rawDb = 20 * Math.log10(Math.max(1e-4, rms));
          // Apply a gentle threshold & dampening for human readable focus meter
          const smoothedDb = Math.max(-65, Math.min(0, rawDb + 10));
          setDbLevel(Math.round(smoothedDb));

          // 2. Identify Peak Frequency & Active Bands
          let maxVal = 0;
          let peakIdx = 0;
          let lowSum = 0, midSum = 0, highSum = 0;

          const numBins = fullFreq.length;
          for (let i = 0; i < numBins; i++) {
            const val = fullFreq[i];
            if (val > maxVal) {
              maxVal = val;
              peakIdx = i;
            }

            // Group into classical bands
            if (i < numBins * 0.15) {
              lowSum += val;
            } else if (i < numBins * 0.6) {
              midSum += val;
            } else {
              highSum += val;
            }
          }

          // Estimate frequency in Hertz
          const sampleRate = 44100; // standard fallback
          const hz = Math.round((peakIdx * sampleRate) / (numBins * 2));
          setPeakFreq(hz > 20000 ? 0 : hz);

          // Update active spectrum meters
          setBandActivity({
            low: Math.round((lowSum / (numBins * 0.15)) / 255 * 100),
            mid: Math.round((midSum / (numBins * 0.45)) / 255 * 100),
            high: Math.round((highSum / (numBins * 0.40)) / 255 * 100)
          });
        }
      } else {
        // IDLE STATE WAVEGENERATOR (Simulating an elegant flowing lofi waveform)
        const time = Date.now() * 0.003;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(i * 0.25 + time) * 12 + Math.cos(i * 0.12 - time * 0.6) * 6;
          frequencyData[i] = Math.max(4, wave + 24);
          waveData[i] = 128 + Math.sin(i * 0.2 + time) * 20;
        }

        // Smoothly fade metrics to baseline in idle state
        if (metricsUpdateCounter % 15 === 0) {
          setDbLevel((prev) => Math.max(-60, prev - 2));
          setPeakFreq((prev) => Math.max(0, Math.floor(prev * 0.8)));
          setBandActivity((prev) => ({
            low: Math.max(0, Math.floor(prev.low * 0.85)),
            mid: Math.max(0, Math.floor(prev.mid * 0.85)),
            high: Math.max(0, Math.floor(prev.high * 0.85))
          }));
        }
        metricsUpdateCounter++;
      }

      // Perform Render Operations per Frame
      if (mode === "bars" && bars) {
        bars.data(frequencyData)
          .attr("height", (d) => {
            const val = isPlaying ? (d / 255) * (height - 6) + 6 : d;
            return Math.max(4, Math.min(height, val));
          })
          .attr("y", (d) => {
            const val = isPlaying ? (d / 255) * (height - 6) + 6 : d;
            return height - Math.max(4, Math.min(height, val));
          })
          .attr("opacity", isPlaying ? 0.95 : 0.35);
      } else if (mode === "wave" && path) {
        const lineGenerator = d3.line<number>()
          .x((_, i) => (width / (barCount - 1)) * i)
          .y((d) => {
            const norm = (d - 128) / 128; // -1 to 1
            const amp = isPlaying ? (height * 0.45) : (height * 0.2);
            return (height / 2) + norm * amp;
          })
          .curve(d3.curveBasis);

        path.datum(Array.from(waveData))
          .attr("d", lineGenerator)
          .attr("opacity", isPlaying ? 0.95 : 0.4);
      } else if (mode === "radial" && circles) {
        // Pulse radial circles based on low frequency levels
        const bassStrength = isPlaying ? (frequencyData[1] || 0) / 255 : 0.15;
        const scaleFactor = 1 + bassStrength * 0.22;
        const baseRadius = Math.min(width, height) * 0.32;

        circles.attr("r", function (d) {
          return (baseRadius + d * 1.8) * scaleFactor;
        })
        .attr("stroke-width", isPlaying ? 1.5 + bassStrength * 1.5 : 1.2)
        .attr("opacity", function(d) {
          return (0.15 + (d / 16) * 0.4) * (isPlaying ? 1.1 : 0.8);
        });
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isOverlayExpanded]);

  const activeSound = ambientSynth.getActiveSound();
  const isPlaying = ambientSynth.isSoundPlaying() && activeSound !== "none";

  return (
    <div className={`relative flex flex-col p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl select-none mt-3.5 transition-all duration-300 ${isOverlayExpanded ? "shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/20 ring-1 ring-indigo-500/15" : "shadow-inner"}`}>
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full mb-2.5 px-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-505 dark:text-indigo-400 font-mono flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${isPlaying ? "" : "hidden"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? "bg-indigo-500" : "bg-slate-400 dark:bg-slate-600"}`}></span>
          </span>
          Sound Wave Equalizer
        </span>
        
        <div className="flex items-center gap-1.5">
          {/* Visualizer Mode Select Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-850/80 p-0.5 rounded-lg">
            <button
              onClick={() => setMode("bars")}
              className={`p-1 rounded-md transition-all ${mode === "bars" ? "bg-white dark:bg-slate-800 text-indigo-550 shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Classic Bar Equalizer"
            >
              <BarChart2 className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setMode("wave")}
              className={`p-1 rounded-md transition-all ${mode === "wave" ? "bg-white dark:bg-slate-800 text-indigo-550 shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Oscilloscope Waveform"
            >
              <Activity className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setMode("radial")}
              className={`p-1 rounded-md transition-all ${mode === "radial" ? "bg-white dark:bg-slate-800 text-indigo-550 shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Breathing Focus Ring"
            >
              <CircleDot className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Maximize HUD Overlay Trigger Button */}
          <button
            onClick={() => setIsOverlayExpanded(!isOverlayExpanded)}
            className={`p-1 rounded-lg transition-colors border ${isOverlayExpanded ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-900/40 text-indigo-500" : "bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400"}`}
            title={isOverlayExpanded ? "Collapse Equalizer Panel" : "Launch Equalizer HUD Overlay"}
          >
            {isOverlayExpanded ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex justify-center items-center w-full bg-slate-100/30 dark:bg-slate-950/40 rounded-xl p-1.5 border border-slate-100/50 dark:border-slate-850/40">
        <svg
          ref={svgRef}
          className="w-full max-w-[260px] overflow-visible transition-all duration-300"
          id="ambient-d3-frequency-visualizer"
        />
      </div>

      {/* Expanded HUD Overlay / Panel Metrics */}
      {isOverlayExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-150/65 dark:border-slate-850/80 space-y-3.5 animate-in slide-in-from-top-2.5 duration-300">
          
          {/* Main calculated audio KPIs */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/20 rounded-xl">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block leading-none mb-1">
                Acoustic Level (dB)
              </span>
              <span className="text-xs font-black font-mono text-indigo-550 dark:text-indigo-400 flex items-center gap-1 leading-none">
                <Radio className="w-3 h-3 text-indigo-400 shrink-0" />
                {isPlaying ? `${dbLevel} dB` : "-- dB"}
              </span>
            </div>

            <div className="p-2 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/20 rounded-xl">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block leading-none mb-1">
                Dominant Pitch (Hz)
              </span>
              <span className="text-xs font-black font-mono text-pink-500 dark:text-pink-400 flex items-center gap-1 leading-none">
                <Zap className="w-3 h-3 text-pink-400 shrink-0" />
                {isPlaying && peakFreq > 0 ? `${peakFreq} Hz` : "-- Hz"}
              </span>
            </div>
          </div>

          {/* Real-time Frequency Spectrum Bands Activity Meters */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block font-mono">
              Live Spectrum Density Density
            </span>

            {/* Lows / Bass */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[9px] font-bold text-slate-550 dark:text-slate-400 leading-none">
                <span>Lows (Deep Rumbles / Fire)</span>
                <span className="font-mono">{bandActivity.low}%</span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-100 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(isPlaying ? 5 : 0, bandActivity.low))}%` }}
                />
              </div>
            </div>

            {/* Mids / Vocals */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[9px] font-bold text-slate-550 dark:text-slate-400 leading-none">
                <span>Mids (Crowd Chatter / Rain Waves)</span>
                <span className="font-mono">{bandActivity.mid}%</span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 transition-all duration-100 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(isPlaying ? 5 : 0, bandActivity.mid))}%` }}
                />
              </div>
            </div>

            {/* Highs / Air */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[9px] font-bold text-slate-550 dark:text-slate-400 leading-none">
                <span>Highs (Leaf Rustle / Bird Chirps / Pops)</span>
                <span className="font-mono">{bandActivity.high}%</span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-100 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(isPlaying ? 5 : 0, bandActivity.high))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
