import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { motion } from "motion/react";
import { 
  LogOut, 
  Cloud, 
  LayoutGrid, 
  Menu, 
  X, 
  HelpCircle, 
  BookOpen, 
  ShieldCheck, 
  Quote, 
  FileImage, 
  QrCode, 
  Pipette, 
  Video,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  History,
  Download,
  Laptop,
  Smartphone,
  Search,
  Sparkles,
  ExternalLink,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  CloudRain,
  Radio,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  CloudLightning,
  Trees,
  Flame,
  Home,
  Contrast,
  Eraser,
  FileText,
  RefreshCw,
  Key,
  Bot,
  Mic,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";

import { ActiveTab } from "../types";
import { ambientSynth, AmbientSoundType } from "../lib/ambientSynth";
import { AmbientVisualizer } from "./AmbientVisualizer";
import { LanguageSelector } from "./LanguageSelector";
// @ts-ignore
import brandLogo from "../assets/images/toolkit_pro_logo_1781887052514.jpg";


interface NavbarProps {
  user: User | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  driveCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  tooltipsEnabled?: boolean;
  onToggleTooltips?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  onOpenSeoModal?: () => void;
  onOpenApiKeyModal?: () => void;
}

export default function Navbar({
  user,
  activeTab,
  onTabChange,
  onLogin,
  onLogout,
  isLoggingIn,
  driveCount,
  theme,
  onToggleTheme,
  highContrast,
  onToggleHighContrast,
  tooltipsEnabled = false,
  onToggleTooltips,
  onOpenCommandPalette,
  onToggleSidebar,
  onOpenSeoModal,
  onOpenApiKeyModal,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  
  // Ambient Soundscape state declarations
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ambient-autoplay") === "true";
    }
    return false;
  });
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<AmbientSoundType>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("ambient-autoplay") === "true") {
      return (localStorage.getItem("ambient-preferred-sound") as AmbientSoundType) || "rain";
    }
    return ambientSynth.getActiveSound();
  });
  const [ambientVolume, setAmbientVolume] = useState(() => {
    return ambientSynth.getVolume();
  });

  const handleSelectSound = (sound: AmbientSoundType) => {
    if (sound === "none") {
      ambientSynth.stop();
    } else {
      ambientSynth.play(sound);
      if (typeof window !== "undefined") {
        localStorage.setItem("ambient-preferred-sound", sound);
      }
    }
    setSelectedAmbientSound(sound);
  };

  const handleToggleAutoplay = () => {
    const nextVal = !autoPlayEnabled;
    setAutoPlayEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ambient-autoplay", String(nextVal));
      if (nextVal) {
        if (selectedAmbientSound === "none") {
          const pref = (localStorage.getItem("ambient-preferred-sound") as AmbientSoundType) || "rain";
          ambientSynth.play(pref);
          setSelectedAmbientSound(pref);
        } else {
          localStorage.setItem("ambient-preferred-sound", selectedAmbientSound);
        }
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    ambientSynth.setVolume(vol);
    setAmbientVolume(vol);
    if (typeof window !== "undefined") {
      localStorage.setItem("ambient-volume", String(vol));
    }
  };

  // Handle Autoplay on Startup
  useEffect(() => {
    if (typeof window !== "undefined" && autoPlayEnabled && selectedAmbientSound !== "none") {
      const startAutoplay = () => {
        ambientSynth.play(selectedAmbientSound);
        // Clean up listeners once played
        window.removeEventListener("click", startAutoplay);
        window.removeEventListener("keydown", startAutoplay);
        window.removeEventListener("pointerdown", startAutoplay);
      };

      try {
        ambientSynth.play(selectedAmbientSound);
      } catch (e) {
        console.log("Autoplay blocked by browser. Awaiting interaction.", e);
      }

      window.addEventListener("click", startAutoplay);
      window.addEventListener("keydown", startAutoplay);
      window.addEventListener("pointerdown", startAutoplay);

      return () => {
        window.removeEventListener("click", startAutoplay);
        window.removeEventListener("keydown", startAutoplay);
        window.removeEventListener("pointerdown", startAutoplay);
      };
    }
  }, []);
  const [installPrompt, setInstallPrompt] = useState<any>(
    typeof window !== "undefined" ? window.deferredInstallPrompt || null : null
  );
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIframe, setIsIframe] = useState(true);
  const [deviceType, setDeviceType] = useState<"desktop" | "ios" | "android">("desktop");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);

      const ua = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(ua)) {
        setDeviceType("ios");
      } else if (/Android/i.test(ua)) {
        setDeviceType("android");
      } else {
        setDeviceType("desktop");
      }

      const checkStandalone = () => {
        const isStandalone = 
          window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone);
      };
      checkStandalone();
      
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', checkStandalone);
        return () => mediaQuery.removeEventListener('change', checkStandalone);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleCustomReady = () => {
      if (typeof window !== "undefined" && window.deferredInstallPrompt) {
        setInstallPrompt(window.deferredInstallPrompt);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("installpromptready", handleCustomReady);

    // If already captured by the early main.tsx listener, use it immediately
    if (typeof window !== "undefined" && window.deferredInstallPrompt) {
      setInstallPrompt(window.deferredInstallPrompt);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("installpromptready", handleCustomReady);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#install") {
      setShowInstallModal(true);
      try {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const tabDetails: Record<ActiveTab, { label: string; icon: React.ComponentType<any>; color: string; desc: string }> = {
    home: { label: "Dashboard Home", icon: Home, color: "text-blue-600 dark:text-blue-400 bg-blue-55/60 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30", desc: "Overview, charts & recent statistics" },
    quote: { label: "Quote Designer", icon: Quote, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-55/60 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30", desc: "Aesthetic graphic visuals" },
    compress: { label: "Image Compressor", icon: FileImage, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-55/60 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30", desc: "Ultra-fast size reduction" },
    qr: { label: "QR Code Generator", icon: QrCode, color: "text-amber-600 dark:text-amber-400 bg-amber-55/60 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-900/30", desc: "Scan metrics with Reed-Solomon" },
    palette: { label: "Color Extractor", icon: Pipette, color: "text-pink-600 dark:text-pink-400 bg-pink-55/60 dark:bg-pink-955/40 border border-pink-100/50 dark:border-pink-900/30", desc: "Median Cut color analyzer" },
    video: { label: "Video Creator", icon: Video, color: "text-purple-600 dark:text-purple-400 bg-purple-55/60 dark:bg-purple-955/40 border border-purple-100/50 dark:border-purple-900/30", desc: "Interactive timeline editor" },
    drive: { label: "Cloud Workspace", icon: Cloud, color: "text-sky-600 dark:text-sky-400 bg-sky-55/60 dark:bg-sky-955/40 border border-sky-100/50 dark:border-sky-900/30", desc: "Browse files via Google Drive" },
    resources: { label: "Guides & Articles Hub", icon: BookOpen, color: "text-teal-600 dark:text-teal-400 bg-teal-55/60 dark:bg-teal-955/40 border border-teal-100/50 dark:border-teal-900/30", desc: "SEO publications & manuals" },
    legal: { label: "Legal & Support Center", icon: ShieldCheck, color: "text-slate-600 dark:text-slate-400 bg-slate-55/60 dark:bg-slate-955/40 border border-slate-100/50 dark:border-slate-800/30", desc: "AdSense policies & direct support" },
    android: { label: "Android App Studio", icon: Smartphone, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-55/60 dark:bg-emerald-955/40 border border-emerald-100/50 dark:border-emerald-900/30", desc: "Simulate Android app with Veo 3.1 & Room DB" },
    pdf: { label: "PDF Tools Suite", icon: FileText, color: "text-red-600 dark:text-red-400 bg-red-55/60 dark:bg-red-955/40 border border-red-100/50 dark:border-red-900/30", desc: "Compile raw files to PDF and design documents" },
    converter: { label: "Image Converter", icon: RefreshCw, color: "text-teal-600 dark:text-teal-400 bg-teal-55/60 dark:bg-teal-955/40 border border-teal-100/50 dark:border-teal-900/30", desc: "Format conversion and image scaling" },
    bgremover: { label: "Background Remover", icon: Eraser, color: "text-pink-600 dark:text-pink-400 bg-pink-55/60 dark:bg-pink-955/40 border border-pink-100/50 dark:border-pink-900/30", desc: "Isolate subject matte using color keying" },
    chatbot: { label: "AI Chatbot", icon: MessageSquare, color: "text-purple-600 dark:text-purple-400 bg-purple-55/60 dark:bg-purple-955/40 border border-purple-100/50 dark:border-purple-900/30", desc: "Multi-turn Gemini chat with custom system roles" },
    voice: { label: "Live Voice Studio", icon: Mic, color: "text-rose-600 dark:text-rose-400 bg-rose-55/60 dark:bg-rose-955/40 border border-rose-100/50 dark:border-rose-900/30", desc: "Real-time voice conversation via Live API" }
  };

  const [recentTabs, setRecentTabs] = useState<ActiveTab[]>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-recent-tools");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is ActiveTab => 
            ["home", "quote", "compress", "qr", "palette", "video", "drive", "resources", "legal", "android", "pdf", "converter", "bgremover", "chatbot", "voice"].includes(t)
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [activeTab];
  });

  useEffect(() => {
    setRecentTabs((prev) => {
      const updated = [activeTab, ...prev.filter((t) => t !== activeTab)];
      const sliced = updated.slice(0, 6);
      try {
        sessionStorage.setItem("toolkit-recent-tools", JSON.stringify(sliced));
      } catch (e) {
        console.error(e);
      }
      return sliced;
    });
  }, [activeTab]);

  const ALL_NAV_ITEMS: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<any>;
    badge?: string;
    badgeColor?: string;
    iconColor?: string;
  }[] = [
    { id: "home", label: "Dashboard Home", shortLabel: "Home", icon: Home, iconColor: "text-blue-500 dark:text-blue-400" },
    { id: "quote", label: "Quote Designer", shortLabel: "Quotes", icon: Quote, iconColor: "text-indigo-500 dark:text-indigo-400" },
    { id: "compress", label: "Image Compressor", shortLabel: "Compressor", icon: FileImage, iconColor: "text-emerald-500 dark:text-emerald-400" },
    { id: "qr", label: "QR Matrix Generator", shortLabel: "QR Matrix", icon: QrCode, iconColor: "text-amber-500 dark:text-amber-400" },
    { id: "palette", label: "Color Extractor", shortLabel: "Palette", icon: Pipette, iconColor: "text-pink-500 dark:text-pink-400" },
    { id: "video", label: "AI Video Creator", shortLabel: "Video", icon: Video, iconColor: "text-purple-500 dark:text-purple-400" },
    { id: "pdf", label: "PDF Tools Suite", shortLabel: "PDF Suite", icon: FileText, badge: "NEW", badgeColor: "bg-red-500 text-white", iconColor: "text-red-500 dark:text-red-400" },
    { id: "converter", label: "Image Converter", shortLabel: "Converter", icon: RefreshCw, badge: "NEW", badgeColor: "bg-teal-500 text-white", iconColor: "text-teal-500 dark:text-teal-400" },
    { id: "bgremover", label: "Background Remover", shortLabel: "BG Remover", icon: Eraser, badge: "NEW", badgeColor: "bg-pink-500 text-white", iconColor: "text-pink-500 dark:text-pink-400" },
    { id: "android", label: "Android App Studio", shortLabel: "Android Studio", icon: Smartphone, badge: "VEO", badgeColor: "bg-emerald-600 text-white", iconColor: "text-emerald-500 dark:text-emerald-400" },
    { id: "chatbot", label: "AI Chatbot Assistant", shortLabel: "AI Chatbot", icon: Bot, iconColor: "text-purple-500 dark:text-purple-400" },
    { id: "voice", label: "Live Voice Studio", shortLabel: "Voice Studio", icon: Mic, iconColor: "text-rose-500 dark:text-rose-400" },
    { id: "drive", label: "Google Drive Workspace", shortLabel: "Drive", icon: Cloud, iconColor: "text-sky-500 dark:text-sky-400" },
    { id: "resources", label: "Guides & SEO Articles", shortLabel: "Guides & SEO", icon: BookOpen, iconColor: "text-teal-500 dark:text-teal-400" },
    { id: "legal", label: "Compliance & Safety", shortLabel: "Compliance", icon: ShieldCheck, iconColor: "text-slate-500 dark:text-slate-400" },
  ];

  const navRibbonRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (!navRibbonRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRibbonRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!navRibbonRef.current) return;
    const activeEl = document.getElementById(`nav-btn-${activeTab}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    const timer = setTimeout(checkScrollability, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleNavScroll = (direction: "left" | "right") => {
    if (!navRibbonRef.current) return;
    const distance = 260;
    navRibbonRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
    setTimeout(checkScrollability, 300);
  };

  const tools = [
    { id: "quote", label: "Quote Designer", icon: Quote, desc: "Aesthetic graphic visuals" },
    { id: "compress", label: "Image Compressor", icon: FileImage, desc: "Ultra-fast size reduction" },
    { id: "qr", label: "QR Code Generator", icon: QrCode, desc: "Scan metrics with Reed-Solomon" },
    { id: "palette", label: "Color Extractor", icon: Pipette, desc: "Median Cut color analyzer" },
    { id: "video", label: "Video Creator", icon: Video, desc: "Interactive timeline editor" },
    { id: "pdf", label: "PDF Tools Suite", icon: FileText, desc: "Convert & build PDF documents" },
    { id: "converter", label: "Image Converter", icon: RefreshCw, desc: "WebP, PNG, JPEG conversion" },
    { id: "bgremover", label: "Background Remover", icon: Eraser, desc: "Instant transparent alpha matte" },
    { id: "android", label: "Android App Studio", icon: Smartphone, desc: "Veo 3.1 & simulated Android" },
    { id: "chatbot", label: "AI Chatbot", icon: MessageSquare, desc: "Multi-turn Gemini chat thread" },
    { id: "voice", label: "Live Voice Studio", icon: Mic, desc: "Real-time voice Live API" },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
    setShowToolsDropdown(false);
    setShowRecentDropdown(false);
    setShowMoreDropdown(false);

    // Smooth scroll down to main operational frame
    const element = document.getElementById(`tab-select-${tabId}`) || document.getElementById("compliance-center-root") || document.getElementById("resources-hub-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleTriggerSearch = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "k", code: "KeyK" }));
    }
  };

  const isToolActive = ["quote", "compress", "qr", "palette", "video", "pdf", "converter", "bgremover", "android"].includes(activeTab);

  return (
    <header className={`sticky top-0 z-50 select-none border-b transition-all duration-300 relative backdrop-blur-xl shadow-xs ${
      theme === "dark" 
        ? "bg-slate-900/95 border-slate-800 text-slate-100" 
        : "bg-white/95 border-slate-200/80 text-slate-800"
    }`}>
      {/* Top Brand Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 z-50 pointer-events-none" />

      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full">
          
          {/* Sidebar Toggle and Logo Brand Title */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 select-none animate-in fade-in slide-in-from-left-4 duration-300 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={`p-2 rounded-xl border cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white"
                    : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
                title="Toggle Sidebar Menu"
                aria-label="Toggle Navigation Sidebar"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
            )}

            <div 
              onClick={() => handleTabClick("home")}
              className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
            >
              <div className={`px-2 py-1.5 rounded-xl border shadow-xs flex items-center justify-center transition-all group-hover:scale-[1.03] duration-300 ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
              }`}>
                <img 
                  src={brandLogo} 
                  alt="Toolkit Pro Logo" 
                  className="h-7 sm:h-8 w-auto object-contain rounded-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className={`hidden xl:inline-flex items-center rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider font-mono border ${
                theme === "dark"
                  ? "bg-emerald-400/20 text-emerald-100 border-emerald-400/30"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                AdSense ID
              </span>
            </div>
          </div>

          {/* Center-Left: Global Command Palette Search Widget */}
          <button
            onClick={handleTriggerSearch}
            className={`flex items-center justify-between w-36 sm:w-44 md:w-48 lg:w-52 px-3 py-1.5 rounded-xl text-left border select-none transition-all hover:border-blue-500/50 cursor-pointer shrink-0 shadow-2xs ${
              theme === "dark"
                ? "border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 text-slate-200"
                : "border-slate-200 bg-slate-100/90 hover:bg-slate-100 text-slate-700"
            }`}
            title="Search Workspace & Utilities (Ctrl+K)"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Search className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              <span className="text-[11px] font-bold truncate">Search tools...</span>
            </div>
            <kbd className={`hidden xs:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-lg font-mono shrink-0 select-none border ${
              theme === "dark"
                ? "bg-slate-700/90 border-slate-600 text-slate-300"
                : "bg-white border-slate-200 text-slate-600"
            }`}>
              Ctrl+K
            </kbd>
          </button>

          {/* Center: Recents Quick History Dropdown & Quick Actions */}
          <div className="hidden lg:flex items-center gap-2 select-none shrink-0">
            {/* Quick Recents Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRecentDropdown(!showRecentDropdown);
                  setShowSettingsDropdown(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  showRecentDropdown
                    ? theme === "dark"
                      ? "bg-slate-800 text-white border-slate-700 shadow-sm font-extrabold"
                      : "bg-white text-slate-900 border-slate-300 shadow-xs font-extrabold"
                    : theme === "dark"
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800 bg-slate-900/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border-slate-200 bg-slate-100/60"
                }`}
                title="Recently used tools & activities"
              >
                <History className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="hidden xl:inline">Recents</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showRecentDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Interactive session checklist */}
              {showRecentDropdown && (
                <div 
                  onMouseLeave={() => setShowRecentDropdown(false)}
                  className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xl animate-fade-in z-50 text-left"
                >
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 flex items-center justify-between select-none font-mono">
                    <span>Active Session History</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase">
                      Trace
                    </span>
                  </div>

                  <div className="mt-1 space-y-0.5 max-h-80 overflow-y-auto font-sans">
                    {recentTabs.length > 0 ? (
                      recentTabs.map((tabId) => {
                        const details = tabDetails[tabId];
                        if (!details) return null;
                        const Icon = details.icon;
                        const isActive = activeTab === tabId;
                        return (
                          <button
                            key={tabId}
                            onClick={() => {
                              handleTabClick(tabId);
                              setShowRecentDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer ${
                              isActive ? "bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-850" : "border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${details.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight font-sans">
                                  {details.label}
                                </p>
                                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1 leading-none font-medium">
                                  {details.desc}
                                </p>
                              </div>
                            </div>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mr-1 animate-pulse" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-6 px-4 text-center text-slate-400 select-none">
                        <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-[10px] leading-relaxed">No recently visited tools logged yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 px-1 pb-1 mt-1.5 flex justify-end font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentTabs([activeTab]);
                        try {
                          sessionStorage.setItem("toolkit-recent-tools", JSON.stringify([activeTab]));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer select-none"
                    >
                      Clear Trace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick SEO Audit button */}
            {onOpenSeoModal && (
              <button
                onClick={onOpenSeoModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === "dark"
                    ? "text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800 bg-slate-900/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border-slate-200 bg-slate-100/60"
                }`}
                title="SEO & AdSense Meta Audit"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden xl:inline">SEO Audit</span>
              </button>
            )}

            {/* Quick AI API Keys button */}
            {onOpenApiKeyModal && (
              <button
                onClick={onOpenApiKeyModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === "dark"
                    ? "text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800 bg-slate-900/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border-slate-200 bg-slate-100/60"
                }`}
                title="Configure AI API Keys (Gemini, OpenAI, etc.)"
              >
                <Key className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="hidden xl:inline">API Keys</span>
              </button>
            )}
          </div>

          {/* Right Action panel */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 select-none animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Visual synchronizer active indicator */}
            <div 
              className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold border border-white/20 bg-white/10 text-white select-none leading-none"
              title={user ? "Cloud Sync Connected (Firebase Authentication Session Authorized)" : "Local Offline Sandbox Storage Mode"}
            >
              <div className="relative flex h-1.5 w-1.5 shrink-0">
                {user ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-200"></span>
                )}
              </div>
              <span className="uppercase tracking-wider">
                {user ? "Cloud Active" : "Local Sync"}
              </span>
            </div>

            {/* Direct PWA Install trigger shortcut */}
            {!isInstalled && (
              <button
                onClick={async () => {
                  const promptToUse = installPrompt || (typeof window !== "undefined" ? window.deferredInstallPrompt : null);
                  if (promptToUse) {
                    try {
                      await promptToUse.prompt();
                      const { outcome } = await promptToUse.userChoice;
                      console.log(`User response to installation: ${outcome}`);
                      setInstallPrompt(null);
                      if (typeof window !== "undefined") {
                        window.deferredInstallPrompt = null;
                      }
                    } catch (e) {
                      console.error("Installation error:", e);
                      setShowInstallModal(true);
                    }
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer select-none leading-none shadow-xs hover:scale-[1.02] active:scale-[0.98] border ${
                  theme === "dark"
                    ? "bg-slate-800 text-white hover:bg-slate-700 border-slate-700"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                }`}
                title="Install Toolkit Pro as a native standalone app"
              >
                <Download className={`w-3.5 h-3.5 shrink-0 ${(installPrompt || (typeof window !== "undefined" && window.deferredInstallPrompt)) ? "animate-bounce" : ""}`} />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            )}

            {/* Seamless Language Selector Dropdown Button */}
            <LanguageSelector theme={theme} variant="compact" />

            {/* Elegant Sun/Moon Dark Selector Switch */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer select-none ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title={theme === "dark" ? "Light Mode Active (Ctrl+Alt+T)" : "Dark Mode Active (Ctrl+Alt+T)"}
              id="btn-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>

            {/* Elegant High Contrast Accessibility Mode Toggler */}
            <button
              onClick={onToggleHighContrast}
              className={`p-2 rounded-xl border transition-all cursor-pointer select-none ${
                highContrast
                  ? "bg-amber-400 border-amber-300 text-black font-black shadow-md"
                  : theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title={highContrast ? "Disable High Contrast Accessibility Mode" : "Enable High Contrast Accessibility Mode"}
              id="btn-toggle-high-contrast"
            >
              <Contrast className="w-3.5 h-3.5" />
            </button>

            {/* Contextual Workspace Tooltips Mode Toggler */}
            <button
              onClick={onToggleTooltips}
              className={`p-2 rounded-xl border transition-all cursor-pointer select-none relative flex items-center gap-1.5 ${
                tooltipsEnabled
                  ? theme === "dark"
                    ? "bg-blue-950/60 border-blue-800 text-blue-300 font-bold shadow-md"
                    : "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-xs"
                  : theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title={tooltipsEnabled ? "Workspace Tooltips Active (Click to disable popovers on inputs & buttons)" : "Enable Contextual Tooltips (Shows popovers on workspace inputs & buttons)"}
              id="btn-toggle-tooltips"
            >
              <HelpCircle className={`w-3.5 h-3.5 ${tooltipsEnabled ? "animate-pulse text-blue-600 dark:text-blue-400" : ""}`} />
              <span className="hidden xl:inline text-xs font-bold leading-none">
                {tooltipsEnabled ? "Tooltips ON" : "Tooltips"}
              </span>
              {tooltipsEnabled && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>

            {/* Elegant Global Settings & Focus Soundscapes Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsDropdown(!showSettingsDropdown);
                  setShowToolsDropdown(false);
                  setShowRecentDropdown(false);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer select-none relative ${
                  showSettingsDropdown || selectedAmbientSound !== "none"
                    ? theme === "dark"
                      ? "bg-indigo-950/45 border-indigo-800 text-indigo-400"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                      : "bg-slate-100/50 border-slate-200/60 text-indigo-650 hover:text-indigo-805 hover:bg-slate-100"
                }`}
                title="Workspace Settings & Ambient Focus Audio"
                id="btn-global-settings"
              >
                <Settings className={`w-3.5 h-3.5 ${selectedAmbientSound !== "none" ? "animate-spin" : ""}`} style={{ animationDuration: "12s" }} />
                {selectedAmbientSound !== "none" && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>

              {showSettingsDropdown && (
                <div
                  className={`absolute right-0 mt-2.5 w-80 rounded-2xl border p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-100 shadow-slate-950/50"
                      : "bg-white border-slate-200 text-slate-800 shadow-slate-100/30"
                  }`}
                  onMouseLeave={() => setShowSettingsDropdown(false)}
                >
                  {/* Header Title */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-3 select-none">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-505 animate-spin-slow" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Settings & Ambience
                      </span>
                    </div>
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-extrabold uppercase font-mono">
                      v1.2.0
                    </span>
                  </div>

                  {/* Quick Info/Brief */}
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed mb-3 font-medium">
                    Activate browser-synthesized focus sounds or manage your private client-side AI API credentials.
                  </p>

                  {/* AI API Keys Quick Access */}
                  {onOpenApiKeyModal && (
                    <div className="mb-3.5 pb-3 border-b border-slate-100 dark:border-slate-850">
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          onOpenApiKeyModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-200/60 dark:border-purple-800/60 transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-purple-500 text-white font-bold">
                            <Key className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white font-sans">AI API Keys Settings</p>
                            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">Masked inputs & local storage safety</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                          Configure
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Sound Profiles Selection List */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-505 block mb-1 font-mono">
                      Select Audio Atmosphere
                    </span>
                    
                    {[
                      { id: "rain", name: "Cozy Rain", icon: CloudRain, desc: "Gentle drop crackles & pink wash" },
                      { id: "thunderstorm", name: "Thunderstorm", icon: CloudLightning, desc: "Distant rumbles & crisp storm drops" },
                      { id: "forest", name: "Deep Forest", icon: Trees, desc: "Breeze leaf rustles & organic birds" },
                      { id: "fireplace", name: "Fireplace", icon: Flame, desc: "Warm wood pops & glowing embers" },
                      { id: "cafe", name: "Café Chatter", icon: Coffee, desc: "Background hum & spoon clinks" },
                      { id: "ocean", name: "Deep Ocean", icon: Radio, desc: "Slower rumbles & tidal swells" },
                      { id: "white", name: "Calm Spectrum", icon: Sliders, desc: "Soft white noise focus bands" }
                    ].map((sound) => {
                      const Icon = sound.icon;
                      const isActive = selectedAmbientSound === sound.id;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => handleSelectSound(sound.id as AmbientSoundType)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isActive
                              ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 font-bold"
                              : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold leading-tight">{sound.name}</p>
                              <p className="text-[9.5px] text-slate-400 dark:text-slate-550 leading-none mt-1 font-medium">{sound.desc}</p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          )}
                        </button>
                      );
                    })}

                    {/* Mute button */}
                    {selectedAmbientSound !== "none" && (
                      <button
                        onClick={() => handleSelectSound("none")}
                        className="w-full mt-1.5 py-1.5 px-2 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-450 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                      >
                        <VolumeX className="w-3 h-3" />
                        <span>Mute Ambient Noise</span>
                      </button>
                    )}
                  </div>

                  {/* Master Volume Control Slider */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850 select-none">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        Ambient Master Volume
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-black">
                        {Math.round(ambientVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id="ambient-master-volume"
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Auto-Play on Startup */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] select-none">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-750 dark:text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-505 shrink-0" />
                        Auto-Play on Startup
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-505 font-medium leading-tight mt-0.5">
                        Start preferred sound on load
                      </span>
                    </div>
                    <button
                      id="toggle-ambient-autoplay"
                      onClick={handleToggleAutoplay}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPlayEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      role="switch"
                      aria-checked={autoPlayEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          autoPlayEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Contextual Workspace Tooltips */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] select-none">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-750 dark:text-slate-300 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-indigo-505 shrink-0" />
                        Contextual Tooltips
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-505 font-medium leading-tight mt-0.5">
                        Show popovers on workspace inputs & buttons
                      </span>
                    </div>
                    <button
                      id="toggle-workspace-tooltips"
                      onClick={onToggleTooltips}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tooltipsEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      role="switch"
                      aria-checked={tooltipsEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          tooltipsEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Real-time D3 frequency visualizer */}
                  <AmbientVisualizer />
                </div>
              )}
            </div>

            {/* Account Credentials / Session Authenticator */}
            {user ? (
              <div className="flex items-center space-x-2 animate-in fade-in duration-350 select-none">
                {/* Micro User Avatar Card */}
                <div className={`flex items-center space-x-2 border p-1 rounded-xl shadow-4xs ${
                  theme === "dark" ? "border-slate-800 bg-slate-900/40" : "border-slate-150 bg-slate-50/50"
                }`}>
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
                    alt={user.displayName || "Authorized User Profile metadata"}
                    className={`w-7 h-7 rounded-lg border object-cover shrink-0 ${
                      theme === "dark" ? "border-slate-705" : "border-slate-205"
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden xl:block text-left max-w-[100px] leading-tight select-all">
                    <p className={`text-[10px] font-extrabold truncate ${
                      theme === "dark" ? "text-slate-100" : "text-slate-800"
                    }`}>
                      {user.displayName}
                    </p>
                    <p className="text-[8px] text-slate-450 dark:text-slate-505 truncate font-medium tracking-wide">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Disconnect Google storage profile */}
                <button
                  onClick={onLogout}
                  className={`p-2 border rounded-xl transition-all select-none cursor-pointer ${
                    theme === "dark"
                      ? "border-slate-850 hover:border-rose-900/50 bg-slate-900 hover:bg-rose-950/25 text-slate-400 hover:text-rose-400"
                      : "border-slate-200 hover:border-rose-100 hover:bg-rose-50/80 text-slate-450 hover:text-rose-600"
                  }`}
                  title="Sign out of Firebase sessions"
                  id="navbar-signout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className={`inline-flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all hover:scale-101 cursor-pointer shadow-md disabled:opacity-50 select-none border shrink-0 ${
                  theme === "dark"
                    ? "bg-white hover:bg-slate-50 text-slate-950 border-slate-100/15"
                    : "bg-slate-950 hover:bg-slate-900 text-white border-slate-950"
                }`}
                id="navbar-signin"
                title="Connect Google Drive Workspace"
              >
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Authorize Drive</span>
                <span className="sm:hidden">Authorize</span>
              </button>
            )}

            {/* Mobile Burger Side Panel control */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer select-none border border-transparent hover:border-slate-150 dark:hover:border-slate-800/80 shrink-0 ${
                theme === "dark" ? "text-slate-300" : "text-slate-655"
              }`}
              title="Toggle mobile menu"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? (
                <X className="w-4.5 h-4.5" />
              ) : (
                <Menu className="w-4.5 h-4.5" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Universal All-Nav-Buttons Horizontal Ribbon */}
      <nav 
        aria-label="Primary Application Navigation"
        className={`w-full border-t relative flex items-center transition-colors select-none ${
          theme === "dark" 
            ? "border-slate-800/90 bg-slate-950/80" 
            : "border-slate-200/80 bg-slate-50/90"
        }`}
      >
        {/* Left Scroll Chevron Indicator & Button */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1 pr-4 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent pointer-events-none">
            <button
              onClick={() => handleNavScroll("left")}
              className="p-1 rounded-lg border shadow-sm transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              title="Scroll navigation left"
              aria-label="Scroll navigation left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Container with All 15 Buttons */}
        <div
          ref={navRibbonRef}
          onScroll={checkScrollability}
          className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1.5 px-2 sm:px-4 lg:px-6 scroll-smooth"
        >
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none border group ${
                  isActive
                    ? theme === "dark"
                      ? "bg-slate-800 border-slate-600 text-white shadow-sm ring-1 ring-white/10"
                      : "bg-white border-blue-200/90 text-blue-700 shadow-2xs ring-1 ring-blue-500/10"
                    : theme === "dark"
                      ? "border-transparent text-slate-300 hover:text-white hover:bg-slate-900/90"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/90"
                }`}
                title={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavRibbonPill"
                    className="absolute inset-0 rounded-xl pointer-events-none -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}

                <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? (item.iconColor || "text-blue-500") : "opacity-75 group-hover:opacity-100"
                }`} />

                <span className="whitespace-nowrap leading-none tracking-tight">
                  {item.shortLabel}
                </span>

                {/* Drive File Count Badge */}
                {item.id === "drive" && user && driveCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md text-[9px] font-mono font-black leading-none bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {driveCount}
                  </span>
                )}

                {/* Badge (NEW, VEO) */}
                {item.badge && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black uppercase leading-none shadow-3xs ${
                    item.badgeColor || "bg-indigo-600 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Chevron Indicator & Button */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-1 pl-4 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent pointer-events-none">
            <button
              onClick={() => handleNavScroll("right")}
              className="p-1 rounded-lg border shadow-sm transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              title="Scroll navigation right"
              aria-label="Scroll navigation right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Slide list */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t p-4.5 space-y-4 shadow-xl select-none animate-in slide-in-from-top duration-250 ${
          theme === "dark" ? "bg-slate-950/95 border-slate-850/80" : "bg-white/95 border-slate-150/80"
        }`}>
          <div className="flex items-center justify-between px-2.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-505">
              Tools & Workspace Panels
            </span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleTriggerSearch();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 text-[10px] font-black tracking-wide text-indigo-605 dark:text-indigo-400 font-mono"
            >
              <Search className="w-3 h-3" />
              <span>SEARCH</span>
            </button>
          </div>

          {/* Quick App Settings & API Keys Button inside Mobile Drawer */}
          {onOpenApiKeyModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenApiKeyModal();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/60 dark:border-purple-800/60 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white font-sans">App Settings & API Keys</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Configure Gemini, OpenAI, Anthropic & Local Settings</p>
                </div>
              </div>
              <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-black px-2 py-0.5 rounded-full uppercase border border-purple-200 dark:border-purple-800">
                Configure
              </span>
            </button>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none font-sans">
            {ALL_NAV_ITEMS.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-colors border select-none cursor-pointer ${
                    isSelected
                      ? theme === "dark"
                        ? "bg-white text-slate-950 border-white font-bold shadow-sm"
                        : "bg-slate-950 text-white border-slate-950 font-bold shadow-sm"
                      : theme === "dark"
                        ? "bg-slate-900 border-slate-805 text-slate-300 hover:bg-slate-850"
                        : "bg-slate-50 border-slate-200/40 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "" : t.iconColor || "text-blue-500"}`} />
                    <span className="text-xs font-bold leading-tight truncate">{t.shortLabel}</span>
                  </div>
                  {t.id === "drive" && user && driveCount > 0 && (
                    <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0 ml-1">
                      {driveCount}
                    </span>
                  )}
                  {t.badge && (
                    <span className={`text-[7.5px] font-mono font-black px-1.5 py-0.2 rounded-full uppercase leading-none shrink-0 ml-1 ${t.badgeColor || "bg-indigo-600 text-white"}`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {recentTabs.length > 1 && (
            <div className="space-y-1.5 border-t border-dashed border-slate-205 dark:border-slate-805 pt-3.5">
              <div className="flex items-center justify-between px-2.5">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-505 flex items-center gap-1.5 font-mono select-none">
                  <History className="w-3 h-3 text-indigo-405" />
                  <span>Session History Trace</span>
                </span>
                <button
                  onClick={() => {
                    setRecentTabs([activeTab]);
                    try {
                      sessionStorage.setItem("toolkit-recent-tools", JSON.stringify([activeTab]));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-[9px] font-bold text-rose-500 bg-transparent border-none cursor-pointer hover:underline"
                >
                  Clear Log
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 select-none font-sans">
                {recentTabs.map((tabId) => {
                  const details = tabDetails[tabId];
                  if (!details) return null;
                  const Icon = details.icon;
                  const isActive = activeTab === tabId;
                  return (
                    <button
                      key={tabId}
                      onClick={() => handleTabClick(tabId)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left border select-none cursor-pointer text-xs ${
                        isActive
                          ? theme === "dark"
                            ? "bg-slate-900 border-indigo-500/30 text-indigo-400 font-bold"
                            : "bg-indigo-50/50 border-indigo-100 text-indigo-750 font-bold"
                          : theme === "dark"
                            ? "bg-slate-900 border-slate-805 text-slate-300 hover:bg-slate-850"
                            : "bg-slate-50 border-slate-200/50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Icon className="w-3.5 h-3.5 opacity-80 shrink-0 text-slate-500" />
                        {details.label}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`border-t pt-3.5 space-y-2 ${theme === "dark" ? "border-slate-850" : "border-slate-200/50"}`}>
            {/* Mobile Language Selector */}
            <div className="pb-1">
              <LanguageSelector theme={theme} variant="full" />
            </div>

            {!isInstalled && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowInstallModal(true);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all select-none cursor-pointer hover:scale-[1.01] ${
                  theme === "dark"
                    ? "border-indigo-500/25 bg-indigo-950/20 text-indigo-400"
                    : "border-indigo-150 bg-indigo-50/50 text-indigo-750"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Install App Widget</span>
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            )}

            <button
              onClick={() => handleTabClick("resources")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors select-none cursor-pointer leading-none ${
                activeTab === "resources"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold"
                  : theme === "dark" ? "text-slate-300 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-450" /> Guides & Editorial Hub
              </span>
              <span className="bg-indigo-100 text-indigo-700 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none font-mono">NEW</span>
            </button>

            <button
              onClick={() => handleTabClick("legal")}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-colors select-none cursor-pointer leading-none ${
                activeTab === "legal"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold"
                  : theme === "dark" ? "text-slate-300 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-450" /> AdSense Compliance & Policies
            </button>

            <button
              onClick={() => handleTabClick("drive")}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-colors select-none cursor-pointer leading-none ${
                activeTab === "drive"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold"
                  : theme === "dark" ? "text-slate-300 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Cloud className="w-4 h-4 text-slate-450" /> Google Drive Explorer {driveCount > 0 && `(${driveCount})`}
            </button>

            <a
              href="https://toolkit-pro-chi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:brightness-105 hover:scale-101 text-center font-sans tracking-wide"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Unlock Professional Suite</span>
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-extrabold uppercase leading-none font-mono">PRO</span>
            </a>
          </div>
        </div>
      )}

      {/* Modern PWA Interactive Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl relative animate-in zoom-in-95 duration-230 ${
              theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-150 text-slate-800"
            }`}
          >
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-white" />
            </button>

            <div className="flex items-center gap-3.5 mb-4 text-left font-sans">
              <div className="w-10 h-10 rounded-xl bg-slate-955 relative overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                <span className="absolute inset-0 bg-gradient-to-tr from-indigo-650 to-emerald-500 opacity-20 animate-pulse" />
                <LayoutGrid className="w-5 h-5 text-emerald-400 relative z-10" />
              </div>
              <div className="text-left font-sans leading-none">
                <h3 className="text-sm font-black tracking-tight uppercase">Install Toolkit Pro</h3>
                <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider font-mono">Offline-Ready • Safe Sandbox</p>
              </div>
            </div>            {isIframe ? (
              <div className="mb-5 p-5 bg-gradient-to-br from-indigo-50/70 to-indigo-50/10 dark:from-indigo-950/30 dark:to-indigo-950/5 rounded-2xl border border-indigo-150/60 dark:border-indigo-900/30 text-left animate-fade-in">
                <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-650 dark:text-indigo-400 animate-spin-slow" />
                  Browser Security Restriction
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-medium">
                  Browsers do not allow app installation inside editor preview screens. Click the button below to open the app in a new tab to install it to your device instantly!
                </p>
                <a
                  href={`${window.location.origin}${window.location.pathname}#install`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-indigo-600/25 text-center decoration-none no-underline hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch & Install Instantly
                </a>
              </div>
            ) : (installPrompt || (typeof window !== "undefined" && window.deferredInstallPrompt)) ? (
              <div className="mb-5 p-5 bg-gradient-to-br from-emerald-50/70 to-emerald-50/10 dark:from-emerald-950/20 dark:to-emerald-950/5 rounded-2xl border border-emerald-150/60 dark:border-emerald-900/30 text-left animate-fade-in">
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-bounce" />
                  App Ready to Install!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-medium">
                  Your browser supports direct installation. Click below to add the app to your Home Screen or Desktop now!
                </p>
                <button
                  onClick={async () => {
                    const promptToUse = installPrompt || (typeof window !== "undefined" ? window.deferredInstallPrompt : null);
                    if (promptToUse) {
                      try {
                        await promptToUse.prompt();
                        const { outcome } = await promptToUse.userChoice;
                        console.log(`User response to installation: ${outcome}`);
                        setInstallPrompt(null);
                        if (typeof window !== "undefined") {
                          window.deferredInstallPrompt = null;
                        }
                        setShowInstallModal(false);
                      } catch (err) {
                        console.error("Install prompt trigger error:", err);
                      }
                    }
                  }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-650 to-teal-600 hover:from-emerald-550 hover:to-teal-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  Install Instantly on Device
                </button>
              </div>
            ) : (
              <div className="mb-5 p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 text-left animate-fade-in">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  Easy Home Screen Setup
                </p>
                <p className="text-[11.5px] text-slate-550 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                  Since direct browser-triggered PWA installations require user-initiated menus on this browser/platform (especially iOS Safari), please use the extremely simple, 5-second guide below to add it directly to your home screen!
                </p>
              </div>
            )}

            {/* Target-Specific Device Installation Guide */}
            {!isIframe && !installPrompt && (
              <div className="text-left select-none font-sans animate-fade-in">
                {deviceType === "ios" && (
                  <div className="rounded-xl p-4 bg-indigo-55/40 dark:bg-indigo-950/15 border border-indigo-150/50 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h4 className="text-[11.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        iOS Apple Safari (iPhone/iPad)
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 font-semibold leading-relaxed">
                      <li>
                        Tap the Safari browser <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Share button</span>{" "}
                        <span className="inline-block p-1 bg-white dark:bg-slate-800 rounded shadow-xs border border-slate-200/50 dark:border-slate-700/50">📤</span> at the bottom of your screen.
                      </li>
                      <li>
                        Scroll down the menu list and tap <span className="font-extrabold underline text-indigo-600 dark:text-indigo-400">"Add to Home Screen"</span>.
                      </li>
                      <li>
                        Tap <span className="font-extrabold text-indigo-600 dark:text-indigo-400">"Add"</span> in the upper-right corner to complete!
                      </li>
                    </ol>
                  </div>
                )}

                {deviceType === "android" && (
                  <div className="rounded-xl p-4 bg-indigo-55/40 dark:bg-indigo-950/15 border border-indigo-150/50 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h4 className="text-[11.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Android Chrome Browser
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 font-semibold leading-relaxed">
                      <li>
                        Tap the browser Menu button <span className="font-extrabold text-indigo-600 dark:text-indigo-400">📤 (3 vertical dots)</span> in the top-right corner.
                      </li>
                      <li>
                        Tap <span className="font-extrabold underline text-indigo-600 dark:text-indigo-400">"Install app"</span> or <span className="font-extrabold">"Add to Home screen"</span>.
                      </li>
                      <li>
                        Confirm by tapping <span className="font-extrabold text-indigo-600 dark:text-indigo-400">"Install"</span> to complete!
                      </li>
                    </ol>
                  </div>
                )}

                {deviceType === "desktop" && (
                  <div className="rounded-xl p-4 bg-indigo-55/40 dark:bg-indigo-950/15 border border-indigo-150/50 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Laptop className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h4 className="text-[11.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Desktop Chrome / Edge PC
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-1 font-semibold leading-relaxed">
                      <li>
                        Look at the <span className="font-extrabold text-indigo-600 dark:text-indigo-400">top-right corner of your browser's address bar</span> (next to the bookmark star ⭐️).
                      </li>
                      <li>
                        Click the tiny <span className="font-extrabold underline text-indigo-600 dark:text-indigo-400">App Available</span> or <span className="font-extrabold underline">Install App</span> icon.
                      </li>
                      <li>
                        Press <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Install</span> in the browser popup to finalize!
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/85 flex justify-end font-sans">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/85 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
