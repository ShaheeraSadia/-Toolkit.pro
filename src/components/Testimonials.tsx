import React, { useState } from "react";
import { Star, CheckCircle2, Quote, UserCheck, Sparkles, Building2, Layers } from "lucide-react";
import { motion } from "motion/react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  category: "design" | "print" | "dev" | "marketing";
  quote: string;
  highlight: string;
  verified: boolean;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Elena Rostova",
    role: "Lead Brand Designer",
    company: "Studio Vanguard, Zurich",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    category: "design",
    quote: "The Quote Creator and Palette Extractor have completely streamlined our social asset workflow. Being able to extract WCAG-compliant color palettes and preview glassmorphism typography in real time saves our studio hours every week.",
    highlight: "Saves our studio hours every single week",
    verified: true
  },
  {
    id: "t2",
    name: "Marcus Vance",
    role: "Master Print Production Director",
    company: "Apex Graphics & Print, Chicago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    category: "print",
    quote: "The Bleed Integrity inspector and CMYK soft-proofing tool are unmatched for a browser utility. It catches trim line cutoffs before files go to press, eliminating costly reprint errors.",
    highlight: "Catches trim line cutoffs before press runs",
    verified: true
  },
  {
    id: "t3",
    name: "Dr. Aris Thorne",
    role: "Senior Fullstack Architect",
    company: "DevCore Labs, San Francisco",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    category: "dev",
    quote: "As a privacy advocate, I love that Toolkit Pro runs 100% client-side in WebAssembly/JS. Zero files are uploaded to third-party servers unless we explicitly sync to Google Drive.",
    highlight: "100% client-side security & privacy",
    verified: true
  },
  {
    id: "t4",
    name: "Sofia Chen",
    role: "Growth & Content Lead",
    company: "Aura Creative Agency, Toronto",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    category: "marketing",
    quote: "The lossless WebP image compressor and QR matrix generator with custom branding logos are essential for our campaigns. Fast, slick, and completely free of annoying paywalls.",
    highlight: "Fast, slick, and zero paywalls",
    verified: true
  }
];

interface TestimonialsProps {
  theme?: "light" | "dark";
}

export function Testimonials({ theme = "light" }: TestimonialsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTestimonials = activeCategory === "all"
    ? TESTIMONIALS
    : TESTIMONIALS.filter((t) => t.category === activeCategory);

  return (
    <section 
      aria-labelledby="testimonials-heading"
      className={`border rounded-3xl p-5 sm:p-8 md:p-10 transition-colors duration-300 relative overflow-hidden select-none ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/20 border-slate-800"
          : "bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 border-slate-200/80 shadow-xs"
      }`}
    >
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Badges & Title */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-black uppercase font-mono tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Trust & Praise</span>
          </div>

          <h2 
            id="testimonials-heading"
            className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Loved by Designers, Developers & Printers
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            See how creators, marketing leads, and print operators streamline their daily graphic workflows with Toolkit Pro.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {[
              { id: "all", label: "All Reviews" },
              { id: "design", label: "Brand Designers" },
              { id: "print", label: "Print Production" },
              { id: "dev", label: "Developers" },
              { id: "marketing", label: "Marketing Leads" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : theme === "dark"
                    ? "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {filteredTestimonials.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:scale-[1.01] ${
                theme === "dark"
                  ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200"
                  : "bg-white border-slate-200/80 hover:border-indigo-200 text-slate-800 shadow-2xs"
              }`}
            >
              <div className="space-y-3">
                {/* Rating & Verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {item.verified && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified User
                    </span>
                  )}
                </div>

                {/* Highlight banner quote */}
                <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Quote className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span className="italic">"{item.highlight}"</span>
                </div>

                {/* Main Quote text */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  "{item.quote}"
                </p>
              </div>

              {/* User Metadata Footer */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <img
                  src={item.avatar}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-extrabold truncate ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}>
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {item.role} · <span className="font-semibold text-slate-500 dark:text-slate-400">{item.company}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verified Use Case Spotlights Row */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black tracking-tight flex items-center gap-2 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Verified Use Case Spotlights</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              Live Feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "spot-1",
                title: "Instagram Social Kit",
                category: "Instagram Brand Kit",
                user: "Saddiq Studio",
                img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
                badge: "Verified Template"
              },
              {
                id: "spot-2",
                title: "AI Background Remover",
                category: "Automated Studio",
                user: "Aura Media",
                img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                badge: "AI Processed"
              },
              {
                id: "spot-3",
                title: "Compress Network Assets",
                category: "Performance Press",
                user: "DevCore Labs",
                img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80",
                badge: "92% Compression"
              },
            ].map((spot) => (
              <div
                key={spot.id}
                className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-all duration-200 hover:scale-102 ${
                  theme === "dark"
                    ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200/80 hover:border-indigo-200 shadow-2xs"
                }`}
              >
                <img
                  src={spot.img}
                  alt={spot.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-indigo-500/20"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[8.5px] font-mono font-bold text-indigo-500 uppercase tracking-wider block">
                    {spot.category}
                  </span>
                  <h4 className={`text-xs font-extrabold truncate ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    {spot.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                    <span>{spot.user}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
