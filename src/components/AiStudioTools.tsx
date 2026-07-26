import React from "react";
import { Sparkles, Wand2, Layers, Crop, Image, ArrowRight, Shield, Zap, Database, ExternalLink } from "lucide-react";

interface AiStudioToolsProps {
  theme?: "light" | "dark";
  onSelectTab: (tab: string) => void;
}

export function AiStudioTools({ theme = "light", onSelectTab }: AiStudioToolsProps) {
  return (
    <section 
      aria-labelledby="ai-studio-tools-heading"
      className="space-y-4 select-none"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>AI Studio Tools</span>
          </div>
          <h3 
            id="ai-studio-tools-heading"
            className={`text-lg sm:text-xl font-black tracking-tight ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Automated Creation Suite
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            These smart web utilities scale your image and asset processing in real time.
          </p>
        </div>

        <button
          onClick={() => onSelectTab("bg-remover")}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Explore All AI Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: AI Background Remover */}
        <div
          onClick={() => onSelectTab("bg-remover")}
          className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-102 cursor-pointer flex flex-col justify-between space-y-3 group ${
            theme === "dark"
              ? "bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 text-slate-100"
              : "bg-white border-slate-200/80 hover:border-indigo-200 shadow-2xs text-slate-800"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Wand2 className="w-4 h-4" />
              </div>
              <span className="text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">
                Neural AI
              </span>
            </div>
            <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors">
              AI Background Remover
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-2">
              Remove image backgrounds automatically with client-side WebAssembly precision.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">
            <span>Read more</span> <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 2: Smart Crop */}
        <div
          onClick={() => onSelectTab("converter")}
          className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-102 cursor-pointer flex flex-col justify-between space-y-3 group ${
            theme === "dark"
              ? "bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 text-slate-100"
              : "bg-white border-slate-200/80 hover:border-indigo-200 shadow-2xs text-slate-800"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <Crop className="w-4 h-4" />
              </div>
              <span className="text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-500">
                Smart Framing
              </span>
            </div>
            <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors">
              Smart Crop & Resize
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-2">
              Smart face and object detection preserves focal points across social dimensions.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">
            <span>Read more</span> <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 3: Style Transfer */}
        <div
          onClick={() => onSelectTab("color")}
          className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-102 cursor-pointer flex flex-col justify-between space-y-3 group ${
            theme === "dark"
              ? "bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 text-slate-100"
              : "bg-white border-slate-200/80 hover:border-indigo-200 shadow-2xs text-slate-800"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                Vector Styles
              </span>
            </div>
            <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors">
              Style Transfer & Color
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-2">
              Extract WCAG-compliant palettes and transfer aesthetic color gradients.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">
            <span>Read more</span> <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Featured Large Holographic Asset Manager Banner */}
      <div 
        onClick={() => onSelectTab("assets")}
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.01] relative overflow-hidden ${
          theme === "dark"
            ? "bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-900 border-indigo-500/40 shadow-xl"
            : "bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white border-indigo-500/30 shadow-lg"
        }`}
      >
        <div className="space-y-2.5 max-w-md text-left z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono font-black uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Asset Vault</span>
          </span>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Holographic Asset Manager
          </h3>

          <p className="text-xs text-indigo-100 leading-relaxed">
            Centralized asset storage, 3D preview cards, and automatic cloud backups for all your exported graphics, QR codes, and color swatches.
          </p>

          <div className="pt-1 inline-flex items-center gap-2 text-xs font-bold text-amber-300">
            <span>Open Asset Vault</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Glowing Asset Preview Graphic */}
        <div className="relative shrink-0 w-full md:w-64 h-36 rounded-2xl overflow-hidden border border-indigo-400/30 shadow-2xl group z-10">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
            alt="Holographic Asset Vault Preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-3">
            <div className="flex items-center justify-between w-full text-white text-[10px] font-bold font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>124 Vault Assets</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/40 border border-indigo-400/50">
                Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
