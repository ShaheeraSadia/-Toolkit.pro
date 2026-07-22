import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Quote, 
  FileImage, 
  QrCode, 
  Pipette, 
  Cloud, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Moon, 
  Monitor, 
  Command,
  ArrowRight,
  Eye,
  Settings,
  Keyboard,
  Key
} from "lucide-react";
import { ActiveTab } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
  onLogin: () => void;
  isLoggedIn: boolean;
  onRefreshDrive: () => void;
  onSelectArticle: (articleId: string) => void;
  onOpenSitemap: () => void;
  onOpenShortcuts: () => void;
  onOpenSeoModal?: () => void;
  onOpenApiKeyModal?: () => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Utilities" | "Guides & Editorial" | "System Actions" | "Diagnostics";
  icon: React.ComponentType<any>;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onToggleTheme,
  theme,
  onLogin,
  isLoggedIn,
  onRefreshDrive,
  onSelectArticle,
  onOpenSitemap,
  onOpenShortcuts,
  onOpenSeoModal,
  onOpenApiKeyModal
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape to close, arrow keys for navigation, enter to trigger
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, search, selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

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

  if (!isOpen) return null;

  // Build the list of actions
  const items: PaletteItem[] = [
    // Utilities
    {
      id: "utility-quote",
      title: "Quote Designer Studio",
      subtitle: "Customize quote backgrounds, typography styling, and brand watermark frames.",
      category: "Utilities",
      icon: Quote,
      action: () => { onTabChange("quote"); onClose(); },
      shortcut: "Alt+1"
    },
    {
      id: "utility-compress",
      title: "Lossless Image Compressor",
      subtitle: "Optimize WebP, PNG, & JPEG size payload with real-time comparison sliders.",
      category: "Utilities",
      icon: FileImage,
      action: () => { onTabChange("compress"); onClose(); },
      shortcut: "Alt+2"
    },
    {
      id: "utility-qr",
      title: "QR Code Vector Engine",
      subtitle: "Generate high precision QR grids equipped with customized quiet zones and damage correction.",
      category: "Utilities",
      icon: QrCode,
      action: () => { onTabChange("qr"); onClose(); },
      shortcut: "Alt+3"
    },
    {
      id: "utility-palette",
      title: "Aesthetic Color Extractor",
      subtitle: "Extract dominant colour palettes and WCAG-compliant swatch values from uploaded pictures.",
      category: "Utilities",
      icon: Pipette,
      action: () => { onTabChange("palette"); onClose(); },
      shortcut: "Alt+4"
    },
    {
      id: "utility-drive",
      title: "Google Drive Cloud Backups",
      subtitle: isLoggedIn ? "Browse files synchronized inside your secure Drive workspace storage folder." : "Authorize your workspace connection to store assets automatically in the cloud.",
      category: "Utilities",
      icon: Cloud,
      action: () => { onTabChange("drive"); onClose(); },
      shortcut: "Ctrl+D"
    },
    {
      id: "utility-seo",
      title: "SEO Best Practices Checklist",
      subtitle: "Interactive pre-save audit tool ensuring alt-text, meta descriptions, and clean titles prior to Google Drive export.",
      category: "Utilities",
      icon: Sparkles,
      action: () => { if (onOpenSeoModal) onOpenSeoModal(); onClose(); },
      shortcut: "Alt+S"
    },
    {
      id: "utility-api-keys",
      title: "AI Provider API Keys Settings",
      subtitle: "Configure custom Gemini, OpenAI, Anthropic, or Replicate API keys with status badges, masked input fields, and local storage safety.",
      category: "Utilities",
      icon: Key,
      action: () => { if (onOpenApiKeyModal) onOpenApiKeyModal(); onClose(); },
      shortcut: "Alt+K"
    },
    
    // System Actions
    {
      id: "sys-theme",
      title: `Toggle Visual Theme (Switch to ${theme === "light" ? "Dark Mode" : "Light Mode"})`,
      subtitle: `Current skin state is ${theme.toUpperCase()}. Highly-tuned WCAG contrast parameters.`,
      category: "System Actions",
      icon: theme === "light" ? Moon : Sun,
      action: () => { onToggleTheme(); },
      shortcut: "Alt+T"
    },
    {
      id: "sys-auth",
      title: isLoggedIn ? "Disconnect Google Account" : "Access Drive Connect Portal",
      subtitle: isLoggedIn ? "Log out of Google Auth session and clear current file caches securely." : "Unlock high-yield sync buffers under Google OAuth privacy directives.",
      category: "System Actions",
      icon: Sparkles,
      action: () => { 
        if (isLoggedIn) {
          // Switch to app state signout if applicable or prompt
          onTabChange("drive");
        } else {
          onLogin();
        }
        onClose(); 
      },
    },
    {
      id: "sys-sync",
      title: "Query & Pull Drive Updates",
      subtitle: "Trigger manually a high-speed list fetch from target persistent cloud folders.",
      category: "System Actions",
      icon: Settings,
      action: () => { onRefreshDrive(); onClose(); },
    },

    // Diagnostics / Sitemap
    {
      id: "diag-sitemap",
      title: "Dynamic SEO Sitemap & Crawler Log",
      subtitle: "Review indexable asset listings and JSON-LD schema objects for search indexation metrics.",
      category: "Diagnostics",
      icon: Eye,
      action: () => { onOpenSitemap(); onClose(); },
      shortcut: "Alt+S"
    },
    {
      id: "diag-shortcuts",
      title: "Keyboard Shortcuts Onboarding Help",
      subtitle: "Review quick access hotkeys (Ctrl+K, Alt+1-6, etc.) to navigate easily.",
      category: "Diagnostics",
      icon: Keyboard,
      action: () => { onOpenShortcuts(); onClose(); },
      shortcut: "Shift+?"
    },

    // Resources & Guides
    {
      id: "guide-home",
      title: "AdSense Content Guides Library",
      subtitle: "Browse educational materials regarding Core Web Vitals, metadata pruner, & color sciences.",
      category: "Guides & Editorial",
      icon: BookOpen,
      action: () => { onTabChange("resources"); onClose(); },
      shortcut: "Alt+5"
    },
    {
      id: "guide-webp",
      title: "Guide: WebP vs PNG vs JPG Assets",
      subtitle: "Deep-dive comparing file savings, alpha transparency channels, and page painting metrics.",
      category: "Guides & Editorial",
      icon: BookOpen,
      action: () => { onSelectArticle("webp-vs-png-vs-jpg"); onTabChange("resources"); onClose(); }
    },
    {
      id: "guide-vitals",
      title: "Guide: Mitigating Layout Shifts (CLS)",
      subtitle: "Practical tips to design aspect-ratio frames that maintain zero shift indexes.",
      category: "Guides & Editorial",
      icon: BookOpen,
      action: () => { onSelectArticle("core-web-vitals-vitals"); onTabChange("resources"); onClose(); }
    },
    {
      id: "guide-exif",
      title: "Guide: Privacy & EXIF Metadata",
      subtitle: "Learn how deleting geographical and camera hardware trails speeds up page load speed.",
      category: "Guides & Editorial",
      icon: BookOpen,
      action: () => { onSelectArticle("exif-image-metadata"); onTabChange("resources"); onClose(); }
    },
    {
      id: "guide-palette-doc",
      title: "Guide: Median Cut Quantization Math",
      subtitle: "Understanding pixel group clustering algorithms used to formulate dynamic color wheels.",
      category: "Guides & Editorial",
      icon: BookOpen,
      action: () => { onSelectArticle("color-palette-extraction"); onTabChange("resources"); onClose(); }
    },
    {
      id: "guide-compliance",
      title: "Legal Terms & Contact Support",
      subtitle: "Query formal privacy statements, publisher warranties, and support desks.",
      category: "Guides & Editorial",
      icon: ShieldCheck,
      action: () => { onTabChange("legal"); onClose(); },
      shortcut: "Alt+6"
    }
  ];

  // Filtering items by search string query
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered items by category for visual display
  const categories: Record<string, PaletteItem[]> = {};
  filteredItems.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  // Calculate items lookup sequence
  const sequentialItems: PaletteItem[] = [];
  const categoryKeys = ["Utilities", "System Actions", "Diagnostics", "Guides & Editorial"];
  categoryKeys.forEach(cat => {
    if (categories[cat]) {
      sequentialItems.push(...categories[cat]);
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4 z-50 animate-fade-in" id="global-command-palette-backdrop">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        id="command-palette-modal"
      >
        {/* Search header container */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 select-none">
          <Search className="w-5 h-5 text-indigo-505 dark:text-indigo-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Type 'Design', 'WebP', 'Theme' or search shortcuts... (esc to close)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full outline-none bg-transparent border-none text-slate-850 dark:text-slate-100 text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 py-1"
          />
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/80 uppercase font-black tracking-widest shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Results layout */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {filteredItems.length > 0 ? (
            categoryKeys.map((catKey) => {
              const catItems = categories[catKey];
              if (!catItems || catItems.length === 0) return null;

              return (
                <div key={catKey} className="space-y-1">
                  <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                    {catKey}
                  </div>
                  <div className="space-y-0.5">
                    {catItems.map((item) => {
                      // Find index of this item in active filtered sequential array
                      const itemFlatIndex = filteredItems.findIndex(f => f.id === item.id);
                      const isSelected = itemFlatIndex === selectedIndex;
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(itemFlatIndex)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            isSelected 
                              ? "bg-slate-100/85 dark:bg-slate-850/80 border-slate-150/40 dark:border-slate-800/40" 
                              : "bg-transparent border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              isSelected 
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" 
                                : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200/20 dark:border-slate-800"
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className={`text-xs font-bold leading-tight ${
                                isSelected ? "text-indigo-700 dark:text-indigo-455" : "text-slate-900 dark:text-slate-100"
                              }`}>
                                {item.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-lg">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Trigger indicators (shortcuts / click indicator) */}
                          <div className="flex items-center gap-2 font-mono shrink-0 select-none">
                            {item.shortcut ? (
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 px-1.5 py-0.5 rounded leading-none">
                                {item.shortcut}
                              </span>
                            ) : null}
                            <ArrowRight className={`w-3.5 h-3.5 text-slate-350 dark:text-slate-500 transition-transform ${
                              isSelected ? "translate-x-0.5 opacity-100" : "opacity-0"
                            }`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 select-none">
              <Command className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
              <p className="text-xs font-bold">No assets, guides, or system actions matched your entry.</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
                Check spelling parameters or search for standard titles like "palette", "compression", "privacy", "theme", or "Drive".
              </p>
            </div>
          )}
        </div>

        {/* Console footer prompt logs */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 select-none font-mono">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <kbd className="bg-white dark:bg-slate-900 px-1 py-0.2 rounded border dark:border-slate-800">▲</kbd>
              <kbd className="bg-white dark:bg-slate-900 px-1 py-0.2 rounded border dark:border-slate-800">▼</kbd>
              <span>to select</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="bg-white dark:bg-slate-900 px-3.5 py-0.2 rounded border dark:border-slate-800">enter</kbd>
              <span>to launch</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border dark:border-slate-800">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <span className="hidden sm:inline bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 px-2 py-0.5 rounded font-black tracking-wider text-[9px]">
            HOTKEY ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
