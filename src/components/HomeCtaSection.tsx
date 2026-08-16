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
          : "bg-gradient-to-b from-blue-50/50 via-slate-50 to-white text-slate-900 border-slate-200 shadow-sm"
      }`}
    >
      {/* Decorative ambient blue background flares */}
      <div className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        theme === "dark" ? "bg-blue-600/15" : "bg-blue-200/40"
      }`} />
      <div className={`absolute -bottom-12 -left-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        theme === "dark" ? "bg-sky-500/15" : "bg-sky-200/30"
      }`} />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Rating & Trust Badge */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold font-mono border ${
          theme === "dark"
            ? "bg-white/10 backdrop-blur-md border-white/20 text-white"
            : "bg-white border-slate-200 text-slate-700 shadow-2xs"
        }`}>
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span>4.9/5 Rating · Over 25,000+ Creators & Printers</span>
        </div>

        {/* Main Heading */}
        <h2 
          id="cta-heading"
          className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          Ready to Elevate Your Digital Asset Workflow?
        </h2>

        {/* Subtitle */}
        <p className={`text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${
          theme === "dark" ? "text-indigo-100" : "text-slate-600 font-medium"
        }`}>
          Start building typographic quotes, compressing web image bundles losslessly, generating Reed-Solomon QR matrices, and inspecting print bleed integrity in seconds. No login required to start!
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => onSelectTab("quote")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Quote className="w-4 h-4 text-white" />
            <span>Launch Workspace Free</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={user ? () => onSelectTab("drive") : onLogin}
            disabled={isLoggingIn}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50 ${
              theme === "dark"
                ? "bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/25 text-white"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs"
            }`}
          >
            <Cloud className={`w-4 h-4 ${theme === "dark" ? "text-sky-300" : "text-blue-600"}`} />
            <span>{user ? "View Google Drive Sync" : "Connect Google Drive"}</span>
          </button>
        </div>

        {/* Micro Feature Assurance Badges */}
        <div className={`pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10.5px] font-bold ${
          theme === "dark" ? "border-white/15 text-indigo-100" : "border-slate-200 text-slate-600"
        }`}>
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>100% Client-Side GPU</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Zero Cloud File Logs</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Bleed Integrity Check</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            <span>Instant PWA Install</span>
          </div>
        </div>
      </div>
    </section>
  );
}
