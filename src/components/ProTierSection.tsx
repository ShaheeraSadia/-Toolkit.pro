import React, { useState } from "react";
import { Crown, Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star, Layers, RefreshCw, Wand2, Lock, Gift } from "lucide-react";

interface ProTierSectionProps {
  theme?: "light" | "dark";
  onOpenSettings?: () => void;
  onSelectTab?: (tab: string) => void;
}

export function ProTierSection({
  theme = "light",
  onOpenSettings,
  onSelectTab,
}: ProTierSectionProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  const handleRestore = () => {
    setIsRestoring(true);
    setTimeout(() => {
      setIsRestoring(false);
      setRestoredNotice(true);
      setTimeout(() => setRestoredNotice(false), 4000);
    }, 1000);
  };

  return (
    <section
      aria-labelledby="pro-tier-heading"
      className={`border rounded-3xl p-6 sm:p-10 transition-colors duration-300 relative overflow-hidden select-none ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 border-indigo-500/40 shadow-2xl shadow-indigo-950/50"
          : "bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white border-indigo-500/30 shadow-xl"
      }`}
    >
      {/* Decorative ambient lighting spheres */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 text-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black font-mono tracking-widest uppercase shadow-md backdrop-blur-md">
          <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Pro Tier Unlocked</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3">
          <h2
            id="pro-tier-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight"
          >
            Unlock <span className="bg-gradient-to-r from-amber-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">Toolkit Pro Ultra</span> — Your Advanced Suite Awaits
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-indigo-200 max-w-2xl mx-auto font-medium">
            Get Priority Support, Unlimited Render Queues, High-Speed WebAssembly Encoders & Holographic Asset Vaults.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:bg-indigo-50 transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isRestoring ? (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <Crown className="w-4 h-4 text-indigo-600" />
            )}
            <span>{isRestoring ? "Restoring License..." : "Restore Toolkit Pro"}</span>
          </button>

          <button
            onClick={() => {
              if (onSelectTab) onSelectTab("quote");
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600/60 hover:bg-indigo-600 backdrop-blur-md border border-indigo-400/40 text-white font-black text-xs sm:text-sm transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Start a Free Pro Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {restoredNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold inline-flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Toolkit Pro Ultra License Successfully Restored & Active!</span>
          </div>
        )}

        {/* Side-by-side Pro / Premium Glassmorphic Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 text-left">
          {/* Pro Card */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-indigo-400" />
                <span>Pro</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Essential Studio
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              {[
                "Pro features & lossless export",
                "Power-users encoding & WebAssembly GPU",
                "Hot fonts & custom typography pairings",
                "Customize sub-views & workspace themes",
                "Smart Crop & auto-aspect ratio filters",
                "Style Transfer vector background presets",
                "Unlimited session stats & local history logs"
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900/80 to-purple-950/80 border border-indigo-500/50 backdrop-blur-xl space-y-4 relative overflow-hidden transition-all duration-300 hover:border-indigo-400 shadow-xl shadow-indigo-950/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Premium Ultra</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse">
                Pro Features
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-indigo-100 font-medium">
              {[
                "All Pro features & lifetime updates included",
                "Pro feature high-frequency scanning matrix",
                "Premium vector library & 4K SVG rendering",
                "Premium unlimited batch processing tools",
                "Dedicated priority support hotline & SLA",
                "Holographic asset vault & Drive auto-sync",
                "Unlimited everything — zero throttling"
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="font-semibold">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
