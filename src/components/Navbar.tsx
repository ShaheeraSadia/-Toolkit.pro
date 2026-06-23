import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
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
  ChevronDown,
  Sun,
  Moon,
  History,
  Download,
  Laptop,
  Smartphone,
  Search,
  Sparkles
} from "lucide-react";
import { ActiveTab } from "../types";
// @ts-ignore
import logoUrl from "../assets/images/toolkit_pro_logo_1781887052514.jpg";

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
  onOpenCommandPalette?: () => void;
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
  onOpenCommandPalette,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const tabDetails: Record<ActiveTab, { label: string; icon: React.ComponentType<any>; color: string; desc: string }> = {
    quote: { label: "Quote Designer", icon: Quote, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-55/60 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30", desc: "Aesthetic graphic visuals" },
    compress: { label: "Image Compressor", icon: FileImage, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-55/60 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30", desc: "Ultra-fast size reduction" },
    qr: { label: "QR Code Generator", icon: QrCode, color: "text-amber-600 dark:text-amber-400 bg-amber-55/60 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-900/30", desc: "Scan metrics with Reed-Solomon" },
    palette: { label: "Color Extractor", icon: Pipette, color: "text-pink-600 dark:text-pink-400 bg-pink-55/60 dark:bg-pink-955/40 border border-pink-100/50 dark:border-pink-900/30", desc: "Median Cut color analyzer" },
    drive: { label: "Cloud Workspace", icon: Cloud, color: "text-sky-600 dark:text-sky-400 bg-sky-55/60 dark:bg-sky-955/40 border border-sky-100/50 dark:border-sky-900/30", desc: "Browse files via Google Drive" },
    resources: { label: "Guides & Articles Hub", icon: BookOpen, color: "text-teal-600 dark:text-teal-400 bg-teal-55/60 dark:bg-teal-955/40 border border-teal-100/50 dark:border-teal-900/30", desc: "SEO publications & manuals" },
    legal: { label: "Legal & Support Center", icon: ShieldCheck, color: "text-slate-600 dark:text-slate-400 bg-slate-55/60 dark:bg-slate-955/40 border border-slate-100/50 dark:border-slate-800/30", desc: "AdSense policies & direct support" }
  };

  const [recentTabs, setRecentTabs] = useState<ActiveTab[]>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-recent-tools");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is ActiveTab => 
            ["quote", "compress", "qr", "palette", "drive", "resources", "legal"].includes(t)
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
      const sliced = updated.slice(0, 5);
      try {
        sessionStorage.setItem("toolkit-recent-tools", JSON.stringify(sliced));
      } catch (e) {
        console.error(e);
      }
      return sliced;
    });
  }, [activeTab]);

  const tools = [
    { id: "quote", label: "Quote Designer", icon: Quote, desc: "Aesthetic graphic visuals" },
    { id: "compress", label: "Image Compressor", icon: FileImage, desc: "Ultra-fast size reduction" },
    { id: "qr", label: "QR Code Generator", icon: QrCode, desc: "Scan metrics with Reed-Solomon" },
    { id: "palette", label: "Color Extractor", icon: Pipette, desc: "Median Cut color analyzer" },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
    setShowToolsDropdown(false);
    setShowRecentDropdown(false);

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

  const isToolActive = ["quote", "compress", "qr", "palette"].includes(activeTab);

  return (
    <header className={`sticky top-0 z-50 select-none border-b transition-all duration-300 backdrop-blur-md ${
      theme === "dark"
        ? "border-slate-800/80 bg-slate-950/80 shadow-lg shadow-slate-950/20 text-slate-100"
        : "border-slate-150/70 bg-white/80 shadow-xs shadow-slate-100/10 text-slate-800"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-16 py-3 lg:py-0 flex items-center justify-between gap-5 flex-wrap lg:flex-nowrap">
          
          {/* Logo Brand Title */}
          <div 
            onClick={() => handleTabClick("quote")}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0 select-none animate-in fade-in slide-in-from-left-4 duration-300"
          >
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-md transform group-hover:scale-102 transition-all">
              <img src={logoUrl} className="w-full h-full object-cover" alt="Toolkit Pro Logo" referrerPolicy="no-referrer" />
            </div>
            <div className="text-left leading-none font-sans">
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-lg font-black tracking-tight tracking-wide uppercase">
                  Toolkit<span className="text-indigo-600 dark:text-indigo-400">Pro</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-405 border border-emerald-100 dark:border-emerald-900/40 uppercase tracking-wider">
                  AdSense ID
                </span>
              </div>
              <p className="hidden xs:block text-[9px] sm:text-[10px] text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider mt-1.5 font-mono">
                Ultimate Creator Hub
              </p>
            </div>
          </div>

          {/* Center-Left: Global Command Palette Search Widget */}
          <button
            onClick={handleTriggerSearch}
            className={`hidden md:flex items-center justify-between w-48 lg:w-56 px-3.5 py-1.5 rounded-xl text-left border select-none transition-all hover:scale-101 cursor-pointer shadow-3xs hover:shadow-2xs ${
              theme === "dark"
                ? "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                : "bg-slate-50 hover:bg-slate-100/90 border-slate-200/60 text-slate-450 hover:text-slate-600"
            }`}
            title="Search Workspace & Utilities (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-405 dark:text-slate-500" />
              <span className="text-[11px] font-bold">Search tools...</span>
            </div>
            <kbd className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-black rounded-lg font-mono shrink-0 select-none ${
              theme === "dark"
                ? "bg-slate-950 border border-slate-805 text-slate-500"
                : "bg-white border border-slate-205 text-slate-400"
            }`}>
              Ctrl+K
            </kbd>
          </button>

          {/* Center-Right: Segmented Tabs Capsule Control Nav */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/60 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-205/45 dark:border-slate-805/40 select-none animate-in fade-in zoom-in-95 duration-300">
            {/* Interactive utilities megamenu */}
            <div className="relative">
              <button
                onMouseEnter={() => {
                  setShowToolsDropdown(true);
                  setShowRecentDropdown(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isToolActive
                    ? theme === "dark"
                      ? "bg-slate-950 text-white font-extrabold shadow-sm"
                      : "bg-white text-indigo-700 font-extrabold shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-950/30"
                }`}
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Interactives</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${showToolsDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Mega hover subgrid */}
              {showToolsDropdown && (
                <div 
                  onMouseLeave={() => setShowToolsDropdown(false)}
                  className="absolute left-0 mt-2.5 w-72 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xl animate-fade-in z-50 duration-200"
                >
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 mb-1.5 flex items-center justify-between select-none">
                    <span>Power Suites</span>
                    <Sparkles className="w-3 h-3 text-indigo-505 animate-pulse" />
                  </div>
                  {tools.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTabClick(t.id as ActiveTab)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer ${
                          activeTab === t.id 
                            ? "bg-slate-50/90 dark:bg-slate-900 border border-slate-100/30 dark:border-slate-850/30 font-bold" 
                            : "border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${activeTab === t.id ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" : "bg-slate-150 text-slate-550 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{t.label}</p>
                          <p className="text-[10px] text-slate-405 dark:text-slate-550 mt-1 leading-none font-medium">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent utility trace view drop */}
            <div className="relative">
              <button
                onMouseEnter={() => {
                  setShowRecentDropdown(true);
                  setShowToolsDropdown(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showRecentDropdown
                    ? theme === "dark" ? "bg-slate-950 text-white shadow-sm" : "bg-white text-slate-805 shadow-sm"
                    : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-950/30"
                }`}
                onClick={() => setShowRecentDropdown(!showRecentDropdown)}
              >
                <History className="w-3.5 h-3.5 text-indigo-505 shrink-0" />
                <span>Recents</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${showRecentDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Interactive session checklist */}
              {showRecentDropdown && (
                <div 
                  onMouseLeave={() => setShowRecentDropdown(false)}
                  className="absolute left-0 mt-2.5 w-72 rounded-2xl bg-white dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xl animate-fade-in z-50 text-left"
                >
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 flex items-center justify-between select-none font-mono">
                    <span>Active Session logs</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase">
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
                                <p className="text-[9.5px] text-slate-405 dark:text-slate-505 mt-1 leading-none font-medium">
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

            {/* Guides & SEO hub */}
            <button
              onClick={() => handleTabClick("resources")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "resources"
                  ? theme === "dark" ? "bg-slate-950 text-white shadow-sm font-extrabold" : "bg-white text-slate-955 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-950/30"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-teal-550" />
              <span>Guides</span>
            </button>

            {/* AdSense Legal compliance & safety pages */}
            <button
              onClick={() => handleTabClick("legal")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "legal"
                  ? theme === "dark" ? "bg-slate-950 text-white shadow-sm font-extrabold" : "bg-white text-slate-955 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-950/30"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>Compliance</span>
            </button>

            {/* Google Drive connected index panel */}
            <button
              onClick={() => handleTabClick("drive")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "drive"
                  ? theme === "dark" ? "bg-slate-950 text-white shadow-sm font-extrabold" : "bg-white text-slate-955 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-950/30"
              }`}
            >
              <Cloud className="w-3.5 h-3.5 shrink-0 text-sky-500 animate-pulse" />
              <span>My Drive</span>
              {user && driveCount > 0 && (
                <span className="bg-emerald-55 border border-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 text-emerald-800 dark:text-emerald-350 px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold leading-none shrink-0 ml-0.5 shadow-2xs">
                  {driveCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action panel */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0 select-none animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Visual synchronizer active indicator */}
            <div 
              className={`hidden xs:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold border select-none leading-none ${
                theme === "dark" 
                  ? "border-slate-800/80 bg-slate-900/40 text-slate-400" 
                  : "border-slate-150 bg-slate-50/50 text-slate-500"
              }`}
              title={user ? "Cloud Sync Connected (Firebase Authentication Session Authorized)" : "Local Offline Sandbox Storage Mode"}
            >
              <div className="relative flex h-1.5 w-1.5 shrink-0">
                {user ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-350 dark:bg-slate-650"></span>
                )}
              </div>
              <span className="uppercase tracking-wider">
                {user ? "Cloud Active" : "Local Sync"}
              </span>
            </div>

            {/* Direct PWA Install trigger shortcut */}
            <button
              onClick={async () => {
                if (installPrompt) {
                  installPrompt.prompt();
                  const { outcome } = await installPrompt.userChoice;
                  console.log(`User response to installation: ${outcome}`);
                  setInstallPrompt(null);
                } else {
                  setShowInstallModal(true);
                }
              }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer select-none leading-none ${
                theme === "dark"
                  ? "border-slate-805 bg-slate-900/40 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850"
                  : "border-slate-200 bg-indigo-50/40 text-indigo-750 hover:text-indigo-900 hover:bg-indigo-50/80"
              }`}
              title="PWA App Installation configuration guide & Direct Shortcut installation"
            >
              <Download className={`w-3 h-3 shrink-0 ${installPrompt ? "animate-bounce" : ""}`} />
              <span>Install App</span>
            </button>

            {/* Elegant Sun/Moon Dark Selector Switch */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer select-none ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800/80"
                  : "bg-slate-100/50 border-slate-200/60 text-indigo-600 hover:text-indigo-805 hover:bg-slate-100"
              }`}
              title={theme === "dark" ? "Light Mode Active (Ctrl+Alt+T)" : "Dark Mode Active (Ctrl+Alt+T)"}
              id="btn-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

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
                className={`inline-flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl transition-all hover:scale-101 cursor-pointer shadow-md disabled:opacity-50 select-none border shrink-0 ${
                  theme === "dark"
                    ? "bg-white hover:bg-slate-50 text-slate-950 border-slate-100/15"
                    : "bg-slate-950 hover:bg-slate-900 text-white border-slate-950"
                }`}
                id="navbar-signin"
              >
                <span>Authorize Drive</span>
              </button>
            )}

            {/* Mobile Burger Side Panel control */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer select-none border border-transparent hover:border-slate-150 dark:hover:border-slate-800/80 ${
                theme === "dark" ? "text-slate-300" : "text-slate-655"
              }`}
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
          
          <div className="grid grid-cols-2 gap-2.5 select-none font-sans">
            {[
              { id: "quote", label: "Quote Cards", icon: Quote },
              { id: "compress", label: "Compressor", icon: FileImage },
              { id: "qr", label: "QR Matrix", icon: QrCode },
              { id: "palette", label: "Palette Ext", icon: Pipette },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id as ActiveTab)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left transition-colors border select-none cursor-pointer ${
                    isSelected
                      ? theme === "dark"
                        ? "bg-white text-slate-950 border-white font-bold shadow-sm"
                        : "bg-slate-950 text-white border-slate-950 font-bold shadow-sm"
                      : theme === "dark"
                        ? "bg-slate-900 border-slate-805 text-slate-300 hover:bg-slate-850"
                        : "bg-slate-50 border-slate-200/40 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold leading-none">{t.label}</span>
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

          <div className={`border-t pt-3.5 space-y-1.5 ${theme === "dark" ? "border-slate-850" : "border-slate-200/50"}`}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowInstallModal(true);
              }}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-colors select-none cursor-pointer ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-900/30 text-indigo-400"
                  : "border-indigo-100 bg-indigo-50/40 text-indigo-700"
              }`}
            >
              <Download className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>PWA App Settings Guide</span>
            </button>

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
              href="https://omg10.com/4/11125963"
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
            </div>

            {installPrompt ? (
              <div className="mb-5 p-4 bg-indigo-50 dark:bg-indigo-950/35 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-left font-sans">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-305">Your browser supports instant standalone deployment!</p>
                <button
                  onClick={async () => {
                    if (installPrompt) {
                      installPrompt.prompt();
                      const { outcome } = await installPrompt.userChoice;
                      console.log(`User response to installation: ${outcome}`);
                      setInstallPrompt(null);
                      setShowInstallModal(false);
                    }
                  }}
                  className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-2 px-4.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:brightness-105 transition-all cursor-pointer shadow-md shadow-indigo-200/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Direct Install App
                </button>
              </div>
            ) : (
              <div className="mb-5 p-3.5 bg-indigo-50/50 dark:bg-emerald-950/15 rounded-xl border border-indigo-100/30 dark:border-emerald-900/30 text-left">
                <p className="text-xs font-bold text-indigo-900 dark:text-emerald-400">⚡ PWA Standalone Engine</p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-405 leading-relaxed mt-1 font-semibold">
                  Secure direct widget launcher status by pinning Toolkit Pro to your phone dashboard or desktop panel. This unlocks standalone full-screen capabilities.
                </p>
              </div>
            )}

            {/* Device Installation Guides */}
            <div className="space-y-4 text-left max-h-[250px] overflow-y-auto pr-1 select-none font-sans">
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5 mb-2">
                  <Laptop className="w-3.5 h-3.5 text-indigo-505 shrink-0" /> Chrome / Edge (Desktop PC)
                </h4>
                <ol className="list-decimal list-inside text-[10.5px] text-slate-550 dark:text-slate-400 space-y-1.5 pl-1 font-semibold">
                  <li>Look in the top-right address bar.</li>
                  <li>Click the tiny <span className="font-extrabold underline text-indigo-600 dark:text-indigo-400">App Available</span> or <span className="font-extrabold underline">Install App</span> icon next to the bookmark star ⭐️.</li>
                  <li>Press <span className="font-extrabold">Install</span> to create standard system shortcuts.</li>
                </ol>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-455 flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-505 shrink-0" /> iOS Apple Safari (iPhone/iPad)
                </h4>
                <ol className="list-decimal list-inside text-[10.5px] text-slate-555 dark:text-slate-400 space-y-1.5 pl-1 font-semibold">
                  <li>Tap the Safari screen Share button 📤.</li>
                  <li>Scroll and select <span className="font-extrabold text-indigo-600 dark:text-indigo-400">"Add to Home Screen"</span> from list.</li>
                  <li>Tap <span className="font-extrabold">Add</span> in upper right to save standard launch parameters.</li>
                </ol>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-455 flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-555 shrink-0" /> Android Browser (Chrome)
                </h4>
                <ol className="list-decimal list-inside text-[10.5px] text-slate-555 dark:text-slate-400 space-y-1.5 pl-1 font-semibold">
                  <li>Tap browser Menu dots list <span className="font-extrabold text-slate-700 dark:text-slate-300">(3 vertical dots in Chrome)</span>.</li>
                  <li>Scroll down and tap <span className="font-extrabold text-indigo-600 dark:text-indigo-400">"Install app"</span> or <span className="font-extrabold">"Add to Home Screen"</span>.</li>
                </ol>
              </div>
            </div>

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

























 
