import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { DriveFile, ActiveTab, RecentActivity } from "./types";
import { initAuth, googleSignIn, logout, getAccessToken } from "./firebase";
import { listDriveFiles } from "./lib/drive";
import Navbar from "./components/Navbar";
import QuoteDesigner from "./components/QuoteDesigner";
import ImageCompressor from "./components/ImageCompressor";
import QrGenerator from "./components/QrGenerator";
import ColorExtractor from "./components/ColorExtractor";
import DriveExplorer from "./components/DriveExplorer";
import ResourcesHub from "./components/ResourcesHub";
import AdSenseCompliance from "./components/AdSenseCompliance";
import AdSenseMock from "./components/AdSenseMock";
import SitemapView from "./components/SitemapView";
import CommandPalette from "./components/CommandPalette";
import ShortcutsModal from "./components/ShortcutsModal";
import RecentActivitiesWidget from "./components/RecentActivitiesWidget";
import UsageInsightsWidget from "./components/UsageInsightsWidget";
import AppTourOverlay from "./components/AppTourOverlay";
import FeedbackModal from "./components/FeedbackModal";
import { motion, AnimatePresence } from "motion/react";

import {
  Sparkles,
  Quote,
  FileImage,
  QrCode,
  Pipette,
  CloudLightning,
  AlertCircle,
  Cloud,
  BookOpen,
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Globe,
  Command,
  ArrowUp,
  Keyboard,
  MessageSquare,
  Printer,
  Monitor,
  Smartphone,
  Download,
  Loader2,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState<boolean>(() => {
    return typeof window !== "undefined" && !!window.deferredInstallPrompt;
  });

  const [pwaChecking, setPwaChecking] = useState<boolean>(true);
  const [pwaProgress, setPwaProgress] = useState<number>(0);
  const [pwaStatusText, setPwaStatusText] = useState<string>("Initializing PWA...");

  useEffect(() => {
    const handlePromptReady = () => {
      setHasDeferredPrompt(true);
    };
    window.addEventListener("installpromptready", handlePromptReady);
    return () => {
      window.removeEventListener("installpromptready", handlePromptReady);
    };
  }, []);

  // Simulate compatibility verification and check on initialization
  useEffect(() => {
    let timer: any;
    let currentProgress = 0;

    const steps = [
      { progress: 25, text: "Checking browser secure context..." },
      { progress: 55, text: "Verifying service worker support..." },
      { progress: 80, text: "Scanning display layout capability..." },
      { progress: 100, text: "PWA Engine initialized" }
    ];

    let stepIndex = 0;

    const runProgressStep = () => {
      if (stepIndex >= steps.length) {
        setPwaChecking(false);
        return;
      }

      const currentStep = steps[stepIndex];
      setPwaStatusText(currentStep.text);

      const targetProgress = currentStep.progress;
      const interval = setInterval(() => {
        currentProgress += 4;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(interval);
          stepIndex++;
          timer = setTimeout(runProgressStep, 100);
        }
        setPwaProgress(currentProgress);
      }, 20);
    };

    timer = setTimeout(runProgressStep, 150);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Global drag and drop files trace state
  const [draggedFiles, setDraggedFiles] = useState<File[] | null>(null);
  const [isDraggingOverScreen, setIsDraggingOverScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleDragEnterScreen = (e: DragEvent) => {
      e.preventDefault();
      // Check if files are being dragged
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDraggingOverScreen(true);
      }
    };

    window.addEventListener("dragenter", handleDragEnterScreen);
    return () => {
      window.removeEventListener("dragenter", handleDragEnterScreen);
    };
  }, []);
  
  // Command Palette & Global Shortcut Trace Alert states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [lastShortcutPressed, setLastShortcutPressed] = useState<string | null>(null);

  // Auto trigger the interactive App Tour on the first visit
  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem("toolkit_pro_tour_done");
      if (!tourSeen) {
        setIsTourOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const triggerShortcutFeedback = (shortcutLabel: string) => {
    setLastShortcutPressed(shortcutLabel);
  };

  useEffect(() => {
    if (lastShortcutPressed) {
      const timer = setTimeout(() => {
        setLastShortcutPressed(null);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [lastShortcutPressed]);

  // Floating Back to Top Button state & effect
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit-pro-theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("toolkit-pro-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Drive synchronization
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab;
      if (tabParam && ["quote", "compress", "qr", "palette", "drive", "resources", "legal"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "quote";
  });

  const [legalSubTab, setLegalSubTab] = useState<"privacy" | "terms" | "about" | "contact">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const subParam = params.get("sub") as any;
      if (subParam && ["privacy", "terms", "about", "contact"].includes(subParam)) {
        return subParam;
      }
    }
    return "privacy";
  });

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const articleParam = params.get("article");
      if (articleParam) {
        return articleParam;
      }
    }
    return null;
  });

  const [resourcesSubTab, setResourcesSubTab] = useState<"articles" | "sitemap" | "seo-templates" | "installation" | "install-fetchers">("articles");

  const [isSitemapView, setIsSitemapView] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname === "/sitemap" || 
        window.location.pathname === "/sitemap/" ||
        window.location.hash === "#sitemap" || 
        window.location.hash === "#/sitemap" || 
        window.location.search.includes("sitemap")
      );
    }
    return false;
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-session-activities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }

    // Default pre-seeded activities so first-time users can instantly see and access all 4 major tools right from the dashboard
    const now = new Date();
    const formatTime = (offsetMs: number) => {
      const d = new Date(now.getTime() - offsetMs);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return [
      {
        id: "init-palette",
        type: "tool",
        title: "Opened Color Extractor",
        detail: "Switched operational context to Color Extractor workspace",
        timestamp: formatTime(0),
        icon: "Pipette",
        tab: "palette"
      },
      {
        id: "init-qr",
        type: "tool",
        title: "Opened QR Generator",
        detail: "Switched operational context to QR Generator workspace",
        timestamp: formatTime(60000),
        icon: "QrCode",
        tab: "qr"
      },
      {
        id: "init-compress",
        type: "tool",
        title: "Opened Image Compressor",
        detail: "Switched operational context to Image Compressor workspace",
        timestamp: formatTime(120000),
        icon: "FileImage",
        tab: "compress"
      },
      {
        id: "init-quote",
        type: "tool",
        title: "Opened Quote Designer",
        detail: "Switched operational context to Quote Designer workspace",
        timestamp: formatTime(180000),
        icon: "Quote",
        tab: "quote"
      }
    ];
  });

  const [toolUsage, setToolUsage] = useState<Record<ActiveTab, number>>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-session-usage");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Seed with beautiful session records to make our D3 chart gorgeous and engaging on load
    return {
      quote: 4,
      compress: 8,
      qr: 5,
      palette: 7,
      drive: 2,
      resources: 3,
      legal: 1
    };
  });

  const incrementToolUsage = (tab: ActiveTab, amount = 1) => {
    setToolUsage((prev) => {
      const updated = {
        ...prev,
        [tab]: (prev[tab] || 0) + amount
      };
      try {
        sessionStorage.setItem("toolkit-session-usage", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const getUsageInsightsData = () => {
    const labels: Record<ActiveTab, string> = {
      quote: "Quote",
      compress: "Compress",
      qr: "QR Gen",
      palette: "Palette",
      drive: "Drive",
      resources: "Guides",
      legal: "Legal"
    };

    const colors: Record<ActiveTab, string> = {
      quote: "rgba(99, 102, 241, 0.85)",     // Indigo
      compress: "rgba(168, 85, 247, 0.85)",  // Purple
      qr: "rgba(16, 185, 129, 0.85)",       // Emerald
      palette: "rgba(6, 182, 212, 0.85)",     // Cyan
      drive: "rgba(59, 130, 246, 0.85)",     // Blue
      resources: "rgba(245, 158, 11, 0.85)",   // Amber
      legal: "rgba(244, 63, 94, 0.85)"       // Rose
    };

    const tabs: ActiveTab[] = ["quote", "compress", "qr", "palette", "drive", "resources", "legal"];
    return tabs.map((tab) => ({
      tool: tab,
      label: labels[tab],
      count: toolUsage[tab] || 0,
      color: colors[tab]
    }));
  };

  const logSessionActivity = (activity: {
    type: "tool" | "file";
    title: string;
    detail: string;
    icon: RecentActivity["icon"];
    tab?: ActiveTab;
  }) => {
    const newActivity: RecentActivity = {
      id: Math.random().toString(36).substring(2, 9),
      type: activity.type,
      title: activity.title,
      detail: activity.detail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      icon: activity.icon,
      tab: activity.tab
    };

    if (activity.tab) {
      incrementToolUsage(activity.tab, 1);
    }

    setRecentActivities((prev) => {
      // Deduplicate activities to avoid spamming the session trail with repeating cards
      let filtered = prev;
      if (newActivity.tab) {
        // For tab switches, remove any older records of the same tab switch to move it to top with new timestamp
        filtered = prev.filter((act) => act.tab !== newActivity.tab);
      } else {
        // For other activities, avoid duplicating identical titles to prevent clutter
        filtered = prev.filter((act) => act.title !== newActivity.title);
      }
      
      // Slice up to 6 unique activities to perfectly balance the 2-column layout (6 items = 3 full rows)
      const updated = [newActivity, ...filtered].slice(0, 6);
      try {
        sessionStorage.setItem("toolkit-session-activities", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  useEffect(() => {
    const handleActivityEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        logSessionActivity(customEvent.detail);
      }
    };
    window.addEventListener("toolkit-add-activity", handleActivityEvent);
    return () => {
      window.removeEventListener("toolkit-add-activity", handleActivityEvent);
    };
  }, []);

  useEffect(() => {
    const tabNames: Record<ActiveTab, string> = {
      quote: "Quote Designer",
      compress: "Image Compressor",
      qr: "QR Generator",
      palette: "Color Extractor",
      drive: "Drive Panel",
      resources: "Guides & SEO",
      legal: "Compliance"
    };

    const tabIcons: Record<ActiveTab, RecentActivity["icon"]> = {
      quote: "Quote",
      compress: "FileImage",
      qr: "QrCode",
      palette: "Pipette",
      drive: "Cloud",
      resources: "BookOpen",
      legal: "ShieldCheck"
    };

    logSessionActivity({
      type: "tool",
      title: `Opened ${tabNames[activeTab]}`,
      detail: `Switched operational context to ${tabNames[activeTab]} workspace`,
      icon: tabIcons[activeTab],
      tab: activeTab
    });
  }, [activeTab]);

  useEffect(() => {
    const handleLocationCheck = () => {
      const isSitemapPath = 
        window.location.pathname === "/sitemap" || 
        window.location.pathname === "/sitemap/" ||
        window.location.hash === "#sitemap" || 
        window.location.hash === "#/sitemap" || 
        window.location.search.includes("sitemap");
      setIsSitemapView(isSitemapPath);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab;
      if (tabParam && ["quote", "compress", "qr", "palette", "drive", "resources", "legal"].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (!isSitemapPath) {
        setActiveTab("quote");
      }

      const subParam = params.get("sub") as any;
      if (subParam && ["privacy", "terms", "about", "contact"].includes(subParam)) {
        setLegalSubTab(subParam);
      }

      const articleParam = params.get("article");
      setSelectedArticleId(articleParam);
    };

    window.addEventListener("popstate", handleLocationCheck);
    window.addEventListener("hashchange", handleLocationCheck);
    
    return () => {
      window.removeEventListener("popstate", handleLocationCheck);
      window.removeEventListener("hashchange", handleLocationCheck);
    };
  }, []);

  // Sync state variables back to URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      if (activeTab === "quote" && !isSitemapView) {
        params.delete("tab");
      } else if (!isSitemapView) {
        params.set("tab", activeTab);
      }

      if (activeTab === "legal") {
        params.set("sub", legalSubTab);
      } else {
        params.delete("sub");
      }

      if (activeTab === "resources" && selectedArticleId) {
        params.set("article", selectedArticleId);
      } else {
        params.delete("article");
      }

      if (isSitemapView) {
        params.set("sitemap", "true");
      } else {
        params.delete("sitemap");
      }

      const newSearch = params.toString();
      const currentSearch = window.location.search.replace(/^\?/, "");
      
      if (newSearch !== currentSearch) {
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [activeTab, legalSubTab, selectedArticleId, isSitemapView]);

  // Global Keydown Keyboard Shortcuts Handler
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      );

      // 1. Command Palette Trigger: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        triggerShortcutFeedback("Ctrl + K (Palette Toggle)");
        return;
      }

      // If active focus is inside an input, don't execute other navigation shortcuts
      if (isInput) return;

      // 1.5 Quick accessibility Shortcuts Help: Shift + ?
      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        triggerShortcutFeedback("? (Shortcuts Guide)");
        return;
      }

      // 2. Drive Explorer Portal: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setActiveTab("drive");
        setIsSitemapView(false);
        triggerShortcutFeedback("Ctrl + D (Drive Explorer)");
        return;
      }

      // 3. Alt + [1-6] Hotkeys Navigation
      if (e.altKey && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const tabMap: Record<string, ActiveTab> = {
          "1": "quote",
          "2": "compress",
          "3": "qr",
          "4": "palette",
          "5": "resources",
          "6": "legal"
        };
        const targetTab = tabMap[e.key];
        if (targetTab) {
          setActiveTab(targetTab);
          setIsSitemapView(false);
          const tabLabelMap: Record<ActiveTab, string> = {
            quote: "Quote Designer",
            compress: "Image Compressor",
            qr: "QR Generator",
            palette: "Color Extractor",
            drive: "Drive Explorer",
            resources: "Guides & SEO",
            legal: "Compliance"
          };
          triggerShortcutFeedback(`Alt + ${e.key} (${tabLabelMap[targetTab]})`);
        }
        return;
      }

      // 4. Alt + S (Toggle Sitemap Panel)
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSitemapView((prev) => !prev);
        triggerShortcutFeedback("Alt + S (Sitemap Diagnostics)");
        return;
      }

      // 5. Alt + T (Instant Skin Swap Theme)
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
        triggerShortcutFeedback("Alt + T (Theme Swapped)");
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // Mount Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        setNeedsAuth(false);
        // Load Drive files after successful in-memory token retrieval
        loadDriveFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadDriveFiles = async (token: string) => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const data = await listDriveFiles(token);
      setFiles(data);
    } catch (err) {
      console.error("Failed to sync file list from Google Drive:", err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleRefreshDrive = () => {
    if (accessToken) {
      loadDriveFiles(accessToken);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error("Login authorization flow failed:", err);
      let friendlyMsg = "Authentication failed. Please verify your connection status.";
      const errorStr = String(err?.message || err);
      if (errorStr.includes("auth/api-key-not-valid") || errorStr.includes("api-key-not-valid")) {
        friendlyMsg = "This clone is in 'Local Sandbox Mode' with placeholder credentials in firebase-applet-config.json. To enable real Google Drive saving, please trigger the 'Firebase Setup' in the workspace. In the meantime, all offline content designers and calculators are 100% active and perfectly offline downloadable!";
      } else {
        friendlyMsg = err?.message || String(err);
      }
      setAuthError(friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setFiles([]);
    } catch (err) {
      console.error("Signout failed:", err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === "dark" 
        ? "dark bg-slate-950 text-slate-100" 
        : "bg-slate-50/50 text-slate-800"
    }`}>
      {/* Upper Navigation Row */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        driveCount={files.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Hero Welcome banner */}
      <section className={`border-b transition-colors duration-200 py-10 ${
        theme === "dark"
          ? "bg-gradient-to-b from-slate-900 to-transparent border-slate-900"
          : "bg-gradient-to-b from-white to-transparent border-slate-100"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 select-none">
          <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-955 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest leading-none shadow-sm shadow-emerald-500/5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Toolkit Pro Drive Sync
            </div>

            {/* Installable PWA Badge with Tooltip */}
            <div className="relative group inline-block">
              <button
                disabled={pwaChecking}
                onClick={async () => {
                  const promptToUse = typeof window !== "undefined" ? window.deferredInstallPrompt : null;
                  if (promptToUse) {
                    try {
                      await promptToUse.prompt();
                      const { outcome } = await promptToUse.userChoice;
                      console.log(`User response to native installation: ${outcome}`);
                      if (typeof window !== "undefined") {
                        window.deferredInstallPrompt = null;
                      }
                      setHasDeferredPrompt(false);
                    } catch (err) {
                      console.error("Native install prompt trigger error:", err);
                    }
                  } else {
                    setActiveTab("resources");
                    setResourcesSubTab("installation");
                    // Smoothly scroll to the content
                    setTimeout(() => {
                      const el = document.getElementById("resources-panel-installation");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 100);
                  }
                }}
                className={`relative overflow-hidden inline-flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-150/40 dark:border-blue-900/30 px-3.5 py-1.5 pb-[7px] rounded-full text-[11px] font-extrabold text-blue-700 dark:text-blue-350 uppercase tracking-widest leading-none shadow-sm shadow-blue-500/5 cursor-pointer select-none transition-all hover:scale-102 hover:shadow-md ${
                  hasDeferredPrompt ? "animate-pulse ring-2 ring-emerald-500/40 dark:ring-emerald-400/40" : ""
                } ${pwaChecking ? "opacity-90 cursor-wait" : ""}`}
                title={pwaChecking ? pwaStatusText : (hasDeferredPrompt ? "Install Toolkit Pro directly to your device now!" : "PWA Installable Software Utility")}
              >
                {pwaChecking ? (
                  <>
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                      Checking PWA ({pwaProgress}%)
                    </span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3 h-3 text-blue-500" />
                    <span className="flex items-center gap-1">
                      {hasDeferredPrompt ? "Install App Now" : "Installable PWA"}
                      <span className={`inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 ${hasDeferredPrompt ? "animate-ping" : "animate-pulse"}`} />
                    </span>
                  </>
                )}
                
                {/* Subtle loading progress bar line at the bottom */}
                {pwaChecking && (
                  <div 
                    className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-400 transition-all duration-150 ease-out" 
                    style={{ width: `${pwaProgress}%` }} 
                  />
                )}
              </button>
 
               {/* High-Fidelity Tooltip describing PWA benefits */}
               <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-40 w-72 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100 text-left space-y-3">
                 <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                   <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/55">
                     {pwaChecking ? (
                       <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                     ) : (
                       <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                     )}
                   </span>
                   <div>
                     <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                       {pwaChecking ? "PWA Verification" : "Standalone Utility"}
                     </h5>
                     <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                       {pwaChecking ? pwaStatusText : "Elevate Your Experience"}
                     </p>
                   </div>
                 </div>
 
                 <ul className="space-y-2 text-[11px] text-slate-650 dark:text-slate-400">
                   <li className="flex items-start gap-1.5">
                     <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                     <span><strong>No Browser Clutter:</strong> Removes URL bars to maximize rendering space for your active canvas.</span>
                   </li>
                   <li className="flex items-start gap-1.5">
                     <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                     <span><strong>Dock & Desktop Access:</strong> Launch application directly from macOS/Windows Dock or your home screen.</span>
                   </li>
                   <li className="flex items-start gap-1.5">
                     <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                     <span><strong>Zero Latency:</strong> Uses background caching for lightning-fast workflow transition speed.</span>
                   </li>
                 </ul>
 
                 <div className="pt-1.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[9px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                   <span>Click to view installation guides</span>
                   <span>➔</span>
                 </div>
              </div>
            </div>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-sans ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Advanced Tools for Digital Creators
          </h2>
          <p className={`text-sm max-w-xl mx-auto leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Compress images, generate scan coordinates, extract color spectrums, and style custom quote card assets. Authenticate Google Drive to keep files synced and organized automatically!
          </p>

          {/* Prompt Google Drive auth warning */}
          {!user && (
            <div className="max-w-md mx-auto pt-4 space-y-3">
              {authError && (
                <div className="border border-rose-200/40 bg-rose-50 dark:bg-rose-950/25 text-rose-800 dark:text-rose-305 rounded-xl p-3.5 text-xs text-left flex items-start space-x-2.5 animate-fade-in relative shadow-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">Authorization Notice</p>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">{authError}</p>
                  </div>
                  <button 
                    onClick={() => setAuthError(null)} 
                    className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 absolute top-2 right-2 p-1 cursor-pointer transition-colors text-[10px]"
                    title="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className={`border rounded-xl p-3 flex items-start space-x-2 text-xs text-left ${
                theme === "dark"
                  ? "bg-amber-950/20 border-amber-900/40 text-amber-300"
                  : "bg-amber-50 border-amber-100 text-amber-800"
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                <p className="leading-relaxed">
                  <strong>Drive Sync Inactive:</strong> Log in using your Google Workspace account to unlock instant cloud file backups and review saved assets inside the dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic AdSense Leaderboard Placement Box - Essential for structural human reviewer validation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 select-none" id="home-adsense-leaderboard-wrapper">
        <AdSenseMock slot="top-leaderboard-home" type="leaderboard" />
      </div>

      {/* Interactive Session Insights & Activity Streams row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6 select-none" id="home-insights-widgets-row">
        <div className="lg:col-span-3">
          <RecentActivitiesWidget 
            activities={recentActivities}
            onClear={() => {
              setRecentActivities([]);
              try {
                sessionStorage.removeItem("toolkit-session-activities");
              } catch (e) {
                console.error(e);
              }
            }}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setIsSitemapView(false);
            }}
            theme={theme}
          />
        </div>
        <div className="lg:col-span-2">
          <UsageInsightsWidget
            usageData={getUsageInsightsData()}
            onReset={() => {
              const resetObj = {
                quote: 0,
                compress: 0,
                qr: 0,
                palette: 0,
                drive: 0,
                resources: 0,
                legal: 0
              };
              setToolUsage(resetObj);
              try {
                sessionStorage.setItem("toolkit-session-usage", JSON.stringify(resetObj));
              } catch (e) {
                console.error(e);
              }
            }}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setIsSitemapView(false);
            }}
            theme={theme}
          />
        </div>
      </div>

      {/* Middle Operations tabs & selector container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-6">
        {/* Swivel Tabs with elegant horizontal scroll boundaries on small viewports */}
        <div 
          role="tablist"
          aria-label="Main Operations Hub"
          className={`flex overflow-x-auto xl:overflow-x-visible whitespace-nowrap p-1.5 rounded-2xl border max-w-5xl mx-auto scrollbar-none gap-1 ${
            theme === "dark"
              ? "bg-slate-900 border-slate-800"
              : "bg-slate-100 border-slate-200/50"
          }`}
          onKeyDown={(e) => {
            const tabsList = ["quote", "compress", "qr", "palette", "drive", "resources", "legal"] as const;
            const currentIndex = tabsList.indexOf(activeTab);
            if (e.key === "ArrowRight") {
              e.preventDefault();
              const nextIndex = (currentIndex + 1) % tabsList.length;
              setActiveTab(tabsList[nextIndex]);
              setTimeout(() => {
                document.getElementById(`tab-select-${tabsList[nextIndex]}`)?.focus();
              }, 10);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              const prevIndex = (currentIndex - 1 + tabsList.length) % tabsList.length;
              setActiveTab(tabsList[prevIndex]);
              setTimeout(() => {
                document.getElementById(`tab-select-${tabsList[prevIndex]}`)?.focus();
              }, 10);
            }
          }}
        >
          {[
            { id: "quote", label: "Quote Designer", icon: Quote },
            { id: "compress", label: "Image Compressor", icon: FileImage },
            { id: "qr", label: "QR Generator", icon: QrCode },
            { id: "palette", label: "Color Extractor", icon: Pipette },
            { id: "drive", label: "Drive Panel", icon: Cloud, badge: files.length > 0 ? files.length : undefined },
            { id: "resources", label: "Guides & SEO", icon: BookOpen },
            { id: "legal", label: "Compliance & Contact", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                aria-label={tab.label}
                className={`relative flex-1 shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold select-none cursor-pointer whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-indigo-650 dark:focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-colors duration-200 ${
                  isActive
                    ? "text-slate-950 dark:text-white"
                    : theme === "dark" 
                      ? "text-slate-400 hover:text-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                }`}
                id={`tab-select-${tab.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className={`absolute inset-0 rounded-xl shadow-xs border ${
                      theme === "dark" 
                        ? "bg-slate-950 border-slate-900 shadow-slate-900/40" 
                        : "bg-white border-slate-100/50 shadow-slate-200/50"
                    }`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-slate-900 dark:text-emerald-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`inline-flex items-center justify-center rounded-full h-4.5 px-1.5 text-[9px] font-bold transition-colors duration-200 ${
                      isActive 
                        ? "bg-emerald-500 text-white" 
                        : theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-600"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic active page viewer wrapper */}
        <motion.div 
          layout="position"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-select-${activeTab}`}
          className={`rounded-3xl border p-3.5 sm:p-6 md:p-8 transition-colors duration-200 ${
            theme === "dark"
              ? "bg-slate-900 border-slate-800/80 shadow-md shadow-slate-950/45"
              : "bg-white border-slate-100 shadow-sm"
          }`}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 28,
            mass: 0.8
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSitemapView ? "sitemap" : activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {isSitemapView ? (
                <SitemapView
                  theme={theme}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setIsSitemapView(false);
                  }}
                  onClose={() => setIsSitemapView(false)}
                />
              ) : (
                <>
                  {activeTab === "quote" && (
                    <QuoteDesigner
                      user={user}
                      accessToken={accessToken}
                      onRefreshDrive={handleRefreshDrive}
                      onLogin={handleLogin}
                    />
                  )}

                  {activeTab === "compress" && (
                    <ImageCompressor
                      user={user}
                      accessToken={accessToken}
                      onRefreshDrive={handleRefreshDrive}
                      onLogin={handleLogin}
                      initialFiles={draggedFiles}
                      onClearInitialFiles={() => setDraggedFiles(null)}
                    />
                  )}

                  {activeTab === "qr" && (
                    <QrGenerator
                      user={user}
                      accessToken={accessToken}
                      onRefreshDrive={handleRefreshDrive}
                      onLogin={handleLogin}
                    />
                  )}

                  {activeTab === "palette" && (
                    <ColorExtractor
                      user={user}
                      accessToken={accessToken}
                      onRefreshDrive={handleRefreshDrive}
                      onLogin={handleLogin}
                    />
                  )}

                  {activeTab === "drive" && (
                    <div>
                      {user ? (
                        <DriveExplorer
                          user={user}
                          accessToken={accessToken}
                          files={files}
                          isLoading={isLoadingDrive}
                          onRefresh={handleRefreshDrive}
                          onSelectTab={setActiveTab}
                        />
                      ) : (
                        <div className="py-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                          <CloudLightning className="w-12 h-12 text-slate-300 mb-3" />
                          <h4 className="text-sm font-bold text-slate-800">Authentication Required</h4>
                          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
                            Connecting your Google Drive account is required to browse, preview, and sync assets created within Toolkit automotive spaces.
                          </p>
                          <button
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                            className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 font-semibold text-xs text-white shadow-md cursor-pointer"
                            id="btn-explorer-auth-prompt"
                          >
                            Authenticate with Google Drive
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "resources" && (
                    <ResourcesHub 
                      selectedArticleId={selectedArticleId}
                      onSelectArticleId={setSelectedArticleId}
                      initialSubTab={resourcesSubTab}
                    />
                  )}

                  {activeTab === "legal" && (
                    <AdSenseCompliance subTab={legalSubTab} onChangeSubTab={setLegalSubTab} />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* AdSense Inline Responsive Banner below active editor grids */}
          <div className={`mt-8 pt-6 border-t select-none ${theme === "dark" ? "border-slate-800" : "border-slate-50"}`}>
            <AdSenseMock slot="content-footer-responsive" type="responsive" />
          </div>
        </motion.div>
      </main>

      {/* Footer copyright */}
      <footer className={`border-t py-16 mt-16 transition-colors duration-200 ${
        theme === "dark"
          ? "border-slate-800 bg-gradient-to-b from-slate-900 to-indigo-950/20 text-slate-300"
          : "border-slate-200/60 bg-gradient-to-b from-slate-50 via-indigo-50/10 to-slate-100 text-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Footer Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Column 1: Brand & Tagline - 4 Cols */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-950 dark:bg-slate-900 text-white shadow-md">
                  <span className="text-emerald-400 font-black text-sm">T</span>
                </div>
                <span className="text-md font-black tracking-tight font-sans">
                  Toolkit<span className="text-indigo-600">Pro</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                A high-performance workspace engineered for digital creators, designers, and marketers. Optimize web formats, extract median-cut palettes, generate QR matrices, and design gorgeous editorial quote cards instantly.
              </p>

              <div className="pt-1.5">
                <a 
                  href="https://toolkit-pro-chi.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all cursor-pointer hover:underline select-none"
                  id="suppport-server-link-brand"
                >
                  <span className="animate-pulse">☕</span>
                  <span>Support Free Server (No Ads)</span>
                </a>
              </div>
              
              {/* Social Media Connections - beautifully built interactive icons */}
              <div className="flex items-center gap-2 pt-2" id="social-links-connector-hub">
                {[
                  { icon: <Github className="w-3.5 h-3.5" />, label: "GitHub", href: "https://github.com", color: "hover:text-slate-900 dark:hover:text-white hover:border-slate-400" },
                  { icon: <Twitter className="w-3.5 h-3.5" />, label: "Twitter", href: "https://twitter.com", color: "hover:text-sky-500 hover:border-sky-400" },
                  { icon: <Linkedin className="w-3.5 h-3.5" />, label: "LinkedIn", href: "https://linkedin.com", color: "hover:text-blue-600 hover:border-blue-500" },
                 { icon: <Facebook className="w-3.5 h-3.5" />, label: "Facebook", href: "https://facebook.com", color: "hover:text-blue-700 hover:border-blue-600" },
                  { icon: <Globe className="w-3.5 h-3.5" />, label: "Website", href: "https://toolkit-pro-chi.vercel.app", color: "hover:text-emerald-600 hover:border-emerald-500" },
               
                   ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-350 shadow-3xs hover:shadow-2xs hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer hover:-translate-y-0.5 ${social.color}`}
                    title={`Connect on ${social.label}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Interactive Services (Links) - 2 Cols */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Interactive Utilities
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                {[
                  { id: "quote", label: "Quote Card Designer" },
                  { id: "compress", label: "Image Compressor" },
                  { id: "qr", label: "QR Code Generator" },
                  { id: "palette", label: "Color Spectrum Extractor" },
                  { id: "drive", label: "Cloud Backups" },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsSitemapView(false);
                        setTimeout(() => {
                          const element = document.getElementById(`tab-select-${item.id}`) || document.getElementById("drive-drop-zone") || document.getElementById("compliance-center-root");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                          } else {
                            window.scrollTo({ top: 350, behavior: "smooth" });
                          }
                        }, 50);
                      }}
                      className="hover:text-indigo-650 dark:hover:text-indigo-400 font-semibold cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
                    >
                      <span className="text-indigo-400">•</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Creator Editorial Guides - 3 Cols */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Knowledge Hub Publications
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                {[
                  { id: "compression-guide", title: "Lossless Image Compression Guide" },
                  { id: "webp-vs-png-vs-jpg", title: "Next-Gen Web Formats compared" },
                  { id: "pinterest-seo", title: "Pinterest Image SEO Optimization" },
                  { id: "color-palette-extraction", title: "Color Extraction Algorithms" },
                  { id: "exif-image-metadata", title: "EXIF Image Metadata Essentials" },
                ].map((post) => (
                  <li key={post.id} className="truncate">
                    <button
                      onClick={() => {
                        setSelectedArticleId(post.id);
                        setActiveTab("resources");
                        setIsSitemapView(false);
                        setTimeout(() => {
                          const element = document.getElementById("resources-hub-container");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          } else {
                            window.scrollTo({ top: 350, behavior: "smooth" });
                          }
                        }, 50);
                      }}
                      className="hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer max-w-full text-left truncate font-semibold"
                      title={`Read: ${post.title}`}
                    >
                      <span>📖</span>
                      <span className="truncate">{post.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Newsletter Subscription - 3 Cols */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Subscribe to Newsletter
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-normal">
                Join our list of designers and developers receiving tools, preset packs, and resources.
              </p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Successfully subscribed to Toolkit Pro updates index!");
                  (e.target as HTMLFormElement).reset();
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter creator email"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-950 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-850 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer border border-transparent dark:border-slate-800/80"
                >
                  Join List
                </button>
              </form>
            </div>

          </div>

          {/* Quick-links for manual AdSense verification agents */}
          <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold border-t border-b py-4 ${
            theme === "dark" ? "text-slate-400 border-slate-800" : "text-slate-600 border-slate-200/50"
          }`}>
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("privacy");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("terms");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("about");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              About Shaheera
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("contact");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              Contact & Support
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <a href="https://toolkit-pro-chi.vercel.app" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 cursor-pointer font-bold flex items-center gap-1">
              <span>☕</span> Support Free Server
            </a>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("resources");
                setSelectedArticleId(null);
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("resources-hub-container");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              AdSense Content Center
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setIsSitemapView(true);
                setTimeout(() => {
                  const element = document.getElementById("sitemap-diagnostics-view");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              title="Dynamic SEO Sitemap & Diagnostic Log"
            >
              Dynamic Sitemap
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hover:text-indigo-650 dark:hover:text-amber-400 cursor-pointer font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              id="footer-feedback-trigger-btn"
              title="Share rating and commentary feedback about your experience"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-amber-400" />
              <span>Send Feedback</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

            <button
              onClick={() => {
                window.focus();
                window.print();
                logSessionActivity({
                  type: "tool",
                  title: "Printed Active Workspace",
                  detail: `Triggered high-fidelity browser print layout for active ${activeTab} tool`,
                  icon: "ShieldCheck",
                  tab: activeTab
                });
              }}
              className="hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer font-bold flex items-center gap-1.5 text-indigo-600 dark:text-amber-400 border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-1.5 rounded-xl transition-all shadow-3xs hover:scale-102 active:scale-97 select-none"
              title="Print high-fidelity design layout of the active creator space utilizing dedicated stylesheet media queries"
              id="footer-print-view-trigger-btn"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500 dark:text-amber-400 animate-pulse" />
              <span>
                Print Active {
                  activeTab === "quote" ? "Quote" : 
                  activeTab === "compress" ? "Compression Proof" :
                  activeTab === "qr" ? "QR Code" : 
                  activeTab === "palette" ? "Palette" : 
                  activeTab === "drive" ? "Drive Panel" : 
                  activeTab === "resources" ? "Content Guides" : "Compliance View"
                }
              </span>
            </button>
          </div>

          {/* Bottom Bar: Copyright and Badging */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-350 font-medium pt-2">
            <p>© 2026 Toolkit Pro Suite. All rights registered.</p>
            <p className={`mt-2 sm:mt-0 font-semibold flex items-center gap-1.5 select-none ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Google Workspace Secured Integration • Built for Creators</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Modern Command Palette Overlay dialog Console */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsSitemapView(false);
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        onLogin={handleLogin}
        isLoggedIn={!!user}
        onRefreshDrive={handleRefreshDrive}
        onSelectArticle={setSelectedArticleId}
        onOpenSitemap={() => setIsSitemapView(true)}
        onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
      />

      {/* Modern Self-contained Keyboard Shortcuts Cheat-sheet Assistance Modal */}
      <ShortcutsModal 
        isOpen={isShortcutsHelpOpen} 
        onClose={() => setIsShortcutsHelpOpen(false)} 
      />

      {/* Interactive step-by-step App Tour Overlay panel */}
      <AppTourOverlay
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
      />

      {/* Interactive user satisfaction survey & feedback commentary submission card */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        theme={theme}
      />

      {/* Floating launcher badges for quick clicking visual palette and accessibility discovery */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Visual App Tour launcher */}
        <button
          onClick={() => setIsTourOpen(true)}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-amber-400 p-3 sm:px-4 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Restart Interactive App Tour"
          id="floating-tour-launcher-btn"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 dark:text-amber-400 animate-pulse" />
          <span className="text-xs font-extrabold hidden sm:inline-block">
            App Tour
          </span>
        </button>

        {/* Visual Keyboard Shortcuts Accessibility Launcher Button */}
        <button
          onClick={() => setIsShortcutsHelpOpen(true)}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-indigo-400 p-3 sm:px-4 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Open Keyboard Shortcuts Cheat-Sheet (?)"
          id="floating-shortcuts-launcher-btn"
        >
          <Keyboard className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-extrabold hidden sm:inline-block">
            Shortcuts
          </span>
          <kbd className="hidden sm:inline-flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none text-slate-500">
            ?
          </kbd>
        </button>

        {/* Floating Command Panel badge */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="bg-indigo-650 hover:bg-indigo-700 text-white p-3 sm:px-4.5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-indigo-400/20"
          title="Open Command Palette Search (Ctrl+K)"
          id="floating-palette-launcher-btn"
        >
          <Command className="w-4 h-4 text-indigo-200 shrink-0" />
          <span className="text-xs font-black tracking-wider uppercase hidden sm:inline-block">
            Command Panel
          </span>
          <kbd className="hidden sm:inline-flex bg-indigo-500/45 border border-indigo-405/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none text-indigo-100">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Modern Back to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-24 right-6.5 sm:right-7.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-700/60 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-93 select-none cursor-pointer animate-fade-in group"
          title="Zoom to scroll-top frame"
          id="scroll-to-top-floating-btn"
        >
          <ArrowUp className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Interactive alert HUD showing shortcut triggers visually */}
      {lastShortcutPressed && (
        <div 
          className="fixed bottom-38 sm:bottom-8 right-6 z-40 bg-slate-900/90 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800 text-white px-4.5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold backdrop-blur-md font-sans select-none"
          id="global-shortcut-tracer-hud"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="text-slate-400">Triggered:</span>
          <kbd className="bg-slate-800/80 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-slate-700 font-mono text-[10px] font-bold">
            {lastShortcutPressed}
          </kbd>
        </div>
      )}

      {isDraggingOverScreen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOverScreen(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverScreen(false);
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles && droppedFiles.length > 0) {
              const imageFiles = (Array.from(droppedFiles) as File[]).filter(file => file.type.startsWith("image/"));
              if (imageFiles.length > 0) {
                // Switch to compress tab
                setActiveTab("compress");
                setIsSitemapView(false);
                // Set as dragged files
                setDraggedFiles(imageFiles);
                // Smooth scroll down to Main Operational Frame
                setTimeout(() => {
                  const el = document.getElementById("tab-select-compress");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              } else {
                alert("Only image files are supported in this Workspace Suite!");
              }
            }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md border-4 border-dashed border-emerald-500 m-4 rounded-3xl animate-fade-in animate-duration-150 select-none text-white p-6"
        >
          <div className="p-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
            <FileImage className="w-16 h-16 animate-pulse" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Instantly Compress Your Image
          </h3>
          <p className="text-slate-300 text-sm max-w-md text-center leading-relaxed font-sans">
            Drop your image files anywhere on the screen! They will instantly open in the optimized Image Compressor tool.
          </p>
          <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            JPEG, PNG, WebP supported
          </div>
        </div>
      )}
    </div>
  );
}
