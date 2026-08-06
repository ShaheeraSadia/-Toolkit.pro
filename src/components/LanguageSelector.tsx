import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { useLanguage, LanguageCode, SUPPORTED_LANGUAGES } from "../context/LanguageContext";

interface LanguageSelectorProps {
  theme?: "light" | "dark";
  variant?: "compact" | "full" | "minimal";
  className?: string;
}

export function LanguageSelector({
  theme = "light",
  variant = "compact",
  className = ""
}: LanguageSelectorProps) {
  const { language, setLanguage, currentLangInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      {variant === "minimal" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
            isOpen
              ? "bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-400/30"
              : theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80"
                : "bg-slate-100/50 border-slate-200/60 text-slate-700 hover:text-slate-950 hover:bg-slate-100"
          }`}
          title={`${t("language", "Language")}: ${currentLangInfo.nativeName}`}
          id="btn-language-selector-minimal"
        >
          <span className="text-sm leading-none">{currentLangInfo.flag}</span>
          <span className="text-[11px] font-bold uppercase font-mono">{currentLangInfo.code}</span>
        </button>
      ) : variant === "compact" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
            isOpen
              ? "bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-400/30"
              : theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800/80"
                : "bg-slate-100/80 border-slate-200 text-slate-800 hover:text-slate-950 hover:bg-slate-150 shadow-2xs"
          }`}
          title={`${t("language", "Language")}: ${currentLangInfo.nativeName}`}
          id="btn-language-selector-compact"
        >
          <Globe className={`w-3.5 h-3.5 ${isOpen ? "animate-spin text-white" : "text-indigo-500"}`} />
          <span className="text-sm leading-none">{currentLangInfo.flag}</span>
          <span className="hidden sm:inline font-mono uppercase text-[11px]">{currentLangInfo.code}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      ) : (
        /* Full Variant for Mobile Menu or Settings Modal */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-850"
              : "bg-slate-100/80 border-slate-200 text-slate-800 hover:bg-slate-150"
          }`}
          id="btn-language-selector-full"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-base leading-none">{currentLangInfo.flag}</span>
            <div className="text-left">
              <div className="font-extrabold text-xs">{currentLangInfo.nativeName}</div>
              <div className="text-[10px] text-slate-400 font-medium">{currentLangInfo.name}</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Language Selector Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            theme === "dark"
              ? "bg-slate-950 border-slate-800 text-slate-100 shadow-slate-950/80"
              : "bg-white border-slate-200 text-slate-900 shadow-xl"
          }`}
        >
          {/* Popover Header */}
          <div className={`p-3 border-b flex items-center justify-between ${
            theme === "dark" ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-500">
              <Globe className="w-3.5 h-3.5" />
              <span>{t("select_language", "Select Language")}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {SUPPORTED_LANGUAGES.length} Languages
            </span>
          </div>

          {/* Quick Filter Input */}
          <div className="p-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                    : "bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                        : theme === "dark"
                          ? "hover:bg-slate-900 text-slate-200 hover:text-white"
                          : "hover:bg-indigo-50 text-slate-800 hover:text-indigo-950"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none shrink-0">{lang.flag}</span>
                      <div className="text-left leading-tight">
                        <div className="font-bold">{lang.nativeName}</div>
                        <div className={`text-[10px] font-normal ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          {lang.name}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-white shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching language
              </div>
            )}
          </div>

          {/* Footer badge */}
          <div className={`p-2 text-center text-[10px] text-slate-400 border-t flex items-center justify-center gap-1 ${
            theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/50 border-slate-200"
          }`}>
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Seamless UI & AI Prompt Localization</span>
          </div>
        </div>
      )}
    </div>
  );
}
