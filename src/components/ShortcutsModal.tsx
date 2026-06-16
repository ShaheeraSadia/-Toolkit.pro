import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Keyboard, 
  Search, 
  HelpCircle,
  Command,
  Monitor,
  Heart,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Global Shell" | "Workspace Modules" | "Visual & Diagnostics";
  purpose: string;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [search, setSearch] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter shortcuts
  const shortcuts: ShortcutItem[] = [
    {
      keys: ["Ctrl", "K"],
      description: "Toggle Command Palette",
      category: "Global Shell",
      purpose: "Activates the lightning-fast launcher bar to navigate pages or fire triggers."
    },
    {
      keys: ["Alt", "T"],
      description: "Cycle Visual Theme Skin",
      category: "Visual & Diagnostics",
      purpose: "Instantaneously toggles between light and dark WCAG 2.1 AAA contrast styles."
    },
    {
      keys: ["Alt", "S"],
      description: "Toggle Sitemap Panel",
      category: "Visual & Diagnostics",
      purpose: "Summons the real-time search engine optimization (SEO) log and JSON-LD schema builder."
    },
    {
      keys: ["Shift", "?"],
      description: "Cheat-sheet Assistance Guide",
      category: "Global Shell",
      purpose: "Shows or focus-masks this interactive keyboard shortcuts modal directory."
    },
    {
      keys: ["Escape"],
      description: "Exit Active Viewframes",
      category: "Global Shell",
      purpose: "Instantly closes the active command console, cheat-sheet, or select flyout overlays."
    },
    {
      keys: ["Ctrl", "D"],
      description: "Access Drive Cloud Backups",
      category: "Workspace Modules",
      purpose: "Switches current workspace dashboard over to your cloud Google Drive interface portal."
    },
    {
      keys: ["Alt", "1"],
      description: "Quote Designer Studio",
      category: "Workspace Modules",
      purpose: "Navigate straight to Quote Designer to build branding imagery frames."
    },
    {
      keys: ["Alt", "2"],
      description: "Lossless Image Compressor",
      category: "Workspace Modules",
      purpose: "Launch the image optimizer to squeeze payload weights of WebP/PNG/JPG files."
    },
    {
      keys: ["Alt", "3"],
      description: "QR Code Vector Engine",
      category: "Workspace Modules",
      purpose: "Instantly start custom QR-code rendering with built-in error resiliency adjustments."
    },
    {
      keys: ["Alt", "4"],
      description: "Aesthetic Color Extractor",
      category: "Workspace Modules",
      purpose: "Extract dominant color structures and contrast values from uploaded pictures."
    },
    {
      keys: ["Alt", "5"],
      description: "AdSense Content Center",
      category: "Workspace Modules",
      purpose: "Browse publisher-focused guidance regarding Core Web Vitals and image optimization rules."
    },
    {
      keys: ["Alt", "6"],
      description: "Legal Terms & Warranties Desk",
      category: "Workspace Modules",
      purpose: "View cookie schemas, formal privacy guarantees, and support details."
    }
  ];

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredShortcuts = shortcuts.filter(item =>
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.purpose.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.keys.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      id="shortcuts-cheat-sheet-backdrop"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        id="shortcuts-cheat-sheet-modal"
      >
        {/* Header section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-xl border border-indigo-100/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-150">
                Shortcuts Cheat-Sheet
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Turbocharge your digital editor suite layout efficiency
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            aria-label="Close shortcuts modal"
            id="close-shortcuts-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter banner */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/30 flex items-center gap-2.5 bg-white dark:bg-slate-900">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text"
            placeholder="Search shortcut command, keys, or targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold bg-transparent outline-none border-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200 py-1"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content list body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll scrollbar-none">
          {filteredShortcuts.length > 0 ? (
            // Group shortcuts visually by category
            Array.from(new Set(filteredShortcuts.map(item => item.category))).map(cat => {
              const catItems = filteredShortcuts.filter(item => item.category === cat);
              return (
                <div key={cat} className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                    {cat}
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-150/40 dark:border-slate-800/60 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                    {catItems.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors"
                      >
                        <div className="space-y-0.5 max-w-xs sm:max-w-sm">
                          <p className="text-xs font-bold text-slate-805 dark:text-slate-200">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                            {item.purpose}
                          </p>
                        </div>
                        
                        {/* Kbd trigger row representation */}
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          {item.keys.map((key, kIdx) => (
                            <React.Fragment key={kIdx}>
                              {kIdx > 0 && <span className="text-[10px] font-bold text-slate-350 dark:text-slate-605">+</span>}
                              <kbd className="inline-flex items-center justify-center font-mono text-[10px] font-black tracking-wide text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.2 py-0.8 rounded shadow-3xs leading-none">
                                {key === "Ctrl" && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="text-[9px] text-slate-400">Ctrl</span>
                                  </span>
                                )}
                                {key === "Alt" && <span className="text-[9px] text-slate-400">Alt</span>}
                                {key !== "Ctrl" && key !== "Alt" && key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <HelpCircle className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold">No registered shortcut parameters match your query.</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                Try searching for simple keys like "Alt", "Ctrl", "Sitemap" or "Quote".
              </p>
            </div>
          )}
        </div>

        {/* Footer info logging bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <span>Press</span>
            <kbd className="bg-white dark:bg-slate-900 border dark:border-slate-800 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold font-black">?</kbd>
            <span>anywhere to toggle assistance</span>
          </div>
          <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold flex items-center gap-1 select-none">
            ⚡ PRODUCTIVITY BOOST
          </span>
        </div>
      </div>
    </div>
  );
}
