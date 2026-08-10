import React from "react";
import { Sparkles, ArrowRight, Cloud, ShieldCheck, Zap, Lock, Star, CheckCircle2, QrCode, Quote, FileImage } from "lucide-react";
import { User } from "firebase/auth";

interface HomeCtaSectionProps {
  theme?: "light" | "dark";
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onSelectTab: (tab: any) => void;
}

export function HomeCtaSection({
  theme = "light",
  user,
  isLoggingIn,
  onLogin,
  onSelectTab,
}: HomeCtaSectionProps) {
  return (
    <section 
      aria-labelledby="cta-heading"
      className={`border rounded-3xl p-6 sm:p-10 md:p-12 transition-colors duration-300 relative overflow-hidden select-none ${
        theme === "dark"
          ? "bg-slate-950 border-slate-800 text-white shadow-xl"
          : "bg-slate-900 text-white border-slate-800 shadow-xl"
      }`}
    >
      {/* Decorative ambient blue background flares */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Rating & Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold font-mono">
          <div className="flex items-center text-amber-300">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            ))}
          </div>
          <span>4.9/5 Rating · Over 25,000+ Creators & Printers</span>
        </div>

        {/* Main Heading */}
        <h2 
          id="cta-heading"
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight"
        >
          Ready to Elevate Your Digital Asset Workflow?
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-indigo-100 max-w-2xl mx-auto leading-relaxed">
          Start building typographic quotes, compressing web image bundles losslessly, generating Reed-Solomon QR matrices, and inspecting print bleed integrity in seconds. No login required to start!
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => onSelectTab("quote")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-xl transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Quote className="w-4 h-4 text-white" />
            <span>Launch Workspace Free</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={user ? () => onSelectTab("drive") : onLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Cloud className="w-4 h-4 text-sky-300" />
            <span>{user ? "View Google Drive Sync" : "Connect Google Drive"}</span>
          </button>
        </div>

        {/* Micro Feature Assurance Badges */}
        <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10.5px] font-bold text-indigo-100">
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>100% Client-Side GPU</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Zero Cloud File Logs</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>Bleed Integrity Check</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-pink-300 shrink-0" />
            <span>Instant PWA Install</span>
          </div>
        </div>
      </div>
    </section>
  );
}
