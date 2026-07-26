import React, { useState } from "react";
import { HelpCircle, ChevronDown, Search, Sparkles, Shield, Cpu, Cloud, FileCode, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "privacy" | "print" | "qr" | "drive" | "pwa";
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does 100% client-side execution protect my confidential assets?",
    answer: "Toolkit Pro processes images, quotes, QR codes, and color swatches directly inside your browser using WebAssembly and WebGPU HTML5 Canvas APIs. Your original graphic files never travel across external networks or third-party cloud servers unless you explicitly click 'Sync to Google Drive'.",
    category: "privacy",
    tag: "Security & Privacy"
  },
  {
    id: "faq-2",
    question: "What is the Bleed Integrity Verification function and how does it prevent print cutoffs?",
    answer: "The automated Bleed Integrity inspector measures element boundaries against specified bleed margins (e.g. 3mm or 5mm) and paper cut lines. It highlights critical hazards in real time where text or logos sit in the cutter 'danger zone' (±1.5mm blade drift), providing an instant one-click auto-fix button.",
    category: "print",
    tag: "Print & CMYK Preflight"
  },
  {
    id: "faq-3",
    question: "What is Reed-Solomon error correction for QR codes and why does it matter?",
    answer: "Reed-Solomon error correction embeds mathematical redundancy into QR matrix modules. High resilience (Level H, 30%) allows damaged, scratched, or custom-logo-overlaid QR codes to remain 100% scannable on standard smartphone camera apps.",
    category: "qr",
    tag: "Vector QR Matrix"
  },
  {
    id: "faq-4",
    question: "How does Google Drive auto-synchronization and workspace cloud backups work?",
    answer: "When connected via secure Google OAuth2 credentials, Toolkit Pro creates a dedicated 'Toolkit Pro Backups' folder in your personal Google Drive. Saved workspaces, JSON presets, and exported PNG/SVG files auto-sync safely without exposing your Google account password.",
    category: "drive",
    tag: "Cloud Drive Integration"
  },
  {
    id: "faq-5",
    question: "Can I install and use Toolkit Pro completely offline as a Progressive Web App (PWA)?",
    answer: "Yes! Toolkit Pro includes a Web App Manifest and offline Service Worker support. Click 'Install App' in your browser or navbar header to install Toolkit Pro on desktop or mobile devices for full offline functionality without an active internet connection.",
    category: "pwa",
    tag: "PWA & Offline"
  },
  {
    id: "faq-6",
    question: "Which image formats and compression algorithms are supported?",
    answer: "Toolkit Pro supports WebP, PNG, JPEG, SVG, GIF, and PDF asset formats. The Image Compressor uses multi-threaded browser canvas quantization to compress image sizes up to 80% while retaining crisp visual fidelity and optional EXIF metadata.",
    category: "privacy",
    tag: "Asset Compression"
  }
];

interface FaqSectionProps {
  theme?: "light" | "dark";
}

export function FaqSection({ theme = "light" }: FaqSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs = FAQS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section
      aria-labelledby="faq-heading"
      className={`border rounded-3xl p-5 sm:p-8 md:p-10 transition-colors duration-300 relative overflow-hidden select-none ${
        theme === "dark"
          ? "bg-slate-900/90 border-slate-800"
          : "bg-white border-slate-200/80 shadow-xs"
      }`}
    >
      <div className="space-y-6">
        {/* Header Title & Badges */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-black uppercase font-mono tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Knowledge Base & FAQs</span>
          </div>

          <h2
            id="faq-heading"
            className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Frequently Asked Questions
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            Everything you need to know about our privacy architecture, CMYK print preflight, vector QR generation, and PWA setup.
          </p>

          {/* Search bar & Category filters */}
          <div className="w-full max-w-md space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs (e.g., bleed, QR, privacy, drive)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-2xl outline-hidden border transition-all ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500/80"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/60"
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {[
                { id: "all", label: "All Questions" },
                { id: "privacy", label: "Privacy & Security" },
                { id: "print", label: "CMYK & Bleed" },
                { id: "qr", label: "QR Matrix" },
                { id: "drive", label: "Google Drive" },
                { id: "pwa", label: "Offline PWA" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-indigo-600 text-white"
                      : theme === "dark"
                      ? "bg-slate-955 text-slate-400 hover:text-white border border-slate-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-3 max-w-3xl mx-auto pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching questions found for "{searchQuery}". Try a different keyword.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? theme === "dark"
                        ? "bg-slate-950 border-indigo-500/50"
                        : "bg-indigo-50/30 border-indigo-200 shadow-2xs"
                      : theme === "dark"
                      ? "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      : "bg-slate-50/50 border-slate-200/80 hover:bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        {faq.tag}
                      </span>
                      <h3 className={`text-xs sm:text-sm font-extrabold tracking-tight min-w-0 ${
                        theme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}>
                        {faq.question}
                      </h3>
                    </div>

                    <div className={`p-1 rounded-lg shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-indigo-500/10 text-indigo-500" : "text-slate-400"
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
