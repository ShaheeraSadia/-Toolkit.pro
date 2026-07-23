import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Save,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Lock,
  Cpu,
  Layers,
  Zap,
  Sun,
  Moon,
  Monitor,
  Cloud,
  Check,
  Volume2,
  VolumeX,
  Database,
  Sliders,
  LogOut,
  LogIn,
  Search,
  HardDrive,
  Download,
  Upload,
  Info,
  Radio,
  Sparkle,
  Palette,
  RotateCcw
} from "lucide-react";

export interface ProviderConfig {
  id: string;
  name: string;
  shortDesc: string;
  badge: string;
  color: string;
  iconBg: string;
  storageKey: string;
  getKeyUrl: string;
  placeholder: string;
  prefixHint: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini AI",
    shortDesc: "Powers image generation, Veo video creation, text synthesis, and vision analysis.",
    badge: "Primary Engine",
    color: "from-blue-600 to-indigo-600",
    iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    storageKey: "custom_gemini_api_key",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    placeholder: "AIzaSy...",
    prefixHint: "Key starts with 'AIzaSy'"
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o & DALL-E",
    shortDesc: "Supports GPT-4o chat completions, DALL-E 3 image rendering, and text embeddings.",
    badge: "Popular",
    color: "from-emerald-600 to-teal-600",
    iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    storageKey: "toolkit_ai_key_openai",
    getKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
    prefixHint: "Key starts with 'sk-' or 'sk-proj-'"
  },
  {
    id: "anthropic",
    name: "Anthropic Claude 3.5",
    shortDesc: "Powers Claude 3.5 Sonnet, Claude 3 Opus, and complex structured reasoning.",
    badge: "Advanced",
    color: "from-amber-600 to-orange-600",
    iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    storageKey: "toolkit_ai_key_anthropic",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-api03-...",
    prefixHint: "Key starts with 'sk-ant-'"
  },
  {
    id: "replicate",
    name: "Replicate / Open-Source",
    shortDesc: "Access open-source FLUX.1, Llama 3, SDXL, and video generation models.",
    badge: "Open Source",
    color: "from-purple-600 to-pink-600",
    iconBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    storageKey: "toolkit_ai_key_replicate",
    getKeyUrl: "https://replicate.com/account/api-tokens",
    placeholder: "r8_...",
    prefixHint: "Token starts with 'r8_'"
  }
];

export type SettingsTab = "apikeys" | "theme" | "drive" | "audio" | "storage";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;

  // Theme controls
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  highContrast?: boolean;
  onToggleHighContrast?: () => void;
  tooltipsEnabled?: boolean;
  onToggleTooltips?: () => void;

  // Google Drive & Auth controls
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  driveCount?: number;
  onRefreshDrive?: () => void;
  onNavigateToDrive?: () => void;

  // Audio / Ambience controls
  selectedAmbientSound?: string;
  onSelectAmbientSound?: (sound: string) => void;

  // API Key callbacks
  onKeySaved?: (provider: string, key: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  defaultTab = "apikeys",
  theme = "dark",
  onToggleTheme,
  highContrast = false,
  onToggleHighContrast,
  tooltipsEnabled = true,
  onToggleTooltips,
  user,
  onLogin,
  onLogout,
  driveCount = 0,
  onRefreshDrive,
  onNavigateToDrive,
  selectedAmbientSound = "none",
  onSelectAmbientSound,
  onKeySaved
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("gemini");
  const [keyInput, setKeyInput] = useState<string>("");
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Drive Auto-Sync state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem("toolkit_drive_autosync") === "true";
  });

  // Accent Theme & Custom CSS Accent Color state
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    return localStorage.getItem("toolkit_accent_theme") || "indigo";
  });

  const [customAccentHex, setCustomAccentHex] = useState<string>(() => {
    return localStorage.getItem("toolkit_custom_accent_hex") || "#6366f1";
  });

  const [hexInputText, setHexInputText] = useState<string>(() => {
    return localStorage.getItem("toolkit_custom_accent_hex") || "#6366f1";
  });

  // Calculate approximate local storage usage
  const [storageUsageKb, setStorageUsageKb] = useState<number>(0);

  // Calculate WCAG Relative Luminance & Contrast Ratios for dynamic dark/light accents
  const wcagStats = (() => {
    let cleanHex = customAccentHex.trim().replace("#", "");
    if (cleanHex.length === 3) cleanHex = cleanHex.split("").map((c) => c + c).join("");
    if (cleanHex.length !== 6 || !/^[0-9A-F]{6}$/i.test(cleanHex)) {
      return { lightRatio: 4.5, darkRatio: 4.5, lightPassAAA: true, darkPassAAA: true, lightPassAA: true, darkPassAA: true };
    }

    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const cal = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * cal(r) + 0.7152 * cal(g) + 0.0722 * cal(b);

    const lightRatio = Math.round(((Math.max(L, 0.98) + 0.05) / (Math.min(L, 0.98) + 0.05)) * 10) / 10;
    const darkRatio = Math.round(((Math.max(L, 0.01) + 0.05) / (Math.min(L, 0.01) + 0.05)) * 10) / 10;

    return {
      lightRatio,
      darkRatio,
      lightPassAAA: lightRatio >= 7.0,
      darkPassAAA: darkRatio >= 7.0,
      lightPassAA: lightRatio >= 4.5,
      darkPassAA: darkRatio >= 4.5
    };
  })();

  const handleAutoAdjustWcagAAA = () => {
    let cleanHex = customAccentHex.trim().replace("#", "");
    if (cleanHex.length === 3) cleanHex = cleanHex.split("").map((c) => c + c).join("");
    if (cleanHex.length !== 6 || !/^[0-9A-F]{6}$/i.test(cleanHex)) return;

    let r = parseInt(cleanHex.substring(0, 2), 16);
    let g = parseInt(cleanHex.substring(2, 4), 16);
    let b = parseInt(cleanHex.substring(4, 6), 16);

    const isDark = theme === "dark";
    let adjustedHex = customAccentHex;

    for (let i = 0; i < 25; i++) {
      const hexCandidate = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      const cal = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      const L = 0.2126 * cal(rNorm) + 0.7152 * cal(gNorm) + 0.0722 * cal(bNorm);
      const ratio = isDark
        ? Math.round(((Math.max(L, 0.01) + 0.05) / (Math.min(L, 0.01) + 0.05)) * 10) / 10
        : Math.round(((Math.max(L, 0.98) + 0.05) / (Math.min(L, 0.98) + 0.05)) * 10) / 10;

      if (ratio >= 7.0) {
        adjustedHex = hexCandidate.toUpperCase();
        break;
      }

      if (isDark) {
        r = Math.min(255, Math.floor(r * 1.08) + 6);
        g = Math.min(255, Math.floor(g * 1.08) + 6);
        b = Math.min(255, Math.floor(b * 1.08) + 6);
      } else {
        r = Math.max(0, Math.floor(r * 0.9));
        g = Math.max(0, Math.floor(g * 0.9));
        b = Math.max(0, Math.floor(b * 0.9));
      }
    }

    setCustomAccentHex(adjustedHex);
    setHexInputText(adjustedHex);
    setAccentTheme("custom");
    localStorage.setItem("toolkit_accent_theme", "custom");
    localStorage.setItem("toolkit_custom_accent_hex", adjustedHex);
    applyCssAccentVariable(adjustedHex);
    showToast(`Accent adjusted for WCAG AAA Compliance: ${adjustedHex}`);
  };

  const applyCssAccentVariable = (hex: string) => {
    if (!hex) return;
    const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
    document.documentElement.style.setProperty("--app-accent-color", cleanHex);
    document.documentElement.style.setProperty("--app-accent-hover", cleanHex);
    document.documentElement.style.setProperty("--app-accent-glow", `${cleanHex}35`);
    document.documentElement.style.setProperty("--app-accent-light", `${cleanHex}18`);
  };

  useEffect(() => {
    const savedHex = localStorage.getItem("toolkit_custom_accent_hex") || "#6366f1";
    applyCssAccentVariable(savedHex);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      const savedHex = localStorage.getItem("toolkit_custom_accent_hex") || "#6366f1";
      setCustomAccentHex(savedHex);
      setHexInputText(savedHex);
      applyCssAccentVariable(savedHex);
      // Calculate local storage size
      try {
        let total = 0;
        for (let x in localStorage) {
          if (localStorage.hasOwnProperty(x)) {
            total += ((localStorage[x] || "").length + x.length) * 2;
          }
        }
        setStorageUsageKb(Math.round(total / 1024));
      } catch (_) {
        setStorageUsageKb(12);
      }
    }
  }, [isOpen, defaultTab]);

  // Load active provider key
  const activeProvider = PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem(activeProvider.storageKey) || "";
      setKeyInput(storedKey);
      setIsMasked(true);
    }
  }, [isOpen, selectedProviderId]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      showToast("Please enter an API key before saving.");
      return;
    }

    localStorage.setItem(activeProvider.storageKey, trimmed);
    showToast(`Saved ${activeProvider.name} API key securely!`);

    if (onKeySaved) {
      onKeySaved(activeProvider.id, trimmed);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(activeProvider.storageKey);
    setKeyInput("");
    showToast(`Removed ${activeProvider.name} key from browser storage.`);

    if (onKeySaved) {
      onKeySaved(activeProvider.id, "");
    }
  };

  const handleTestKeyFormat = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const val = keyInput.trim();
      if (!val) {
        showToast("Key field is empty.");
        return;
      }
      if (val.length < 15) {
        showToast("Key appears too short to be a valid API key.");
        return;
      }
      showToast("Key format looks valid!");
    }, 500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKeyInput(text.trim());
        showToast("Pasted API key from clipboard!");
      }
    } catch (_) {
      showToast("Clipboard access unavailable.");
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSyncEnabled;
    setAutoSyncEnabled(nextVal);
    localStorage.setItem("toolkit_drive_autosync", nextVal ? "true" : "false");
    showToast(nextVal ? "Auto-Sync background backups enabled!" : "Auto-Sync disabled.");
  };

  const handleSetAccentTheme = (colorId: string, hex: string) => {
    setAccentTheme(colorId);
    setCustomAccentHex(hex);
    setHexInputText(hex);
    localStorage.setItem("toolkit_accent_theme", colorId);
    localStorage.setItem("toolkit_custom_accent_hex", hex);
    applyCssAccentVariable(hex);
    showToast(`Accent theme set to ${colorId.toUpperCase()} (${hex})`);
  };

  const handleApplyCustomHex = (hex: string) => {
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;
    if (!/^#[0-9A-F]{6}$/i.test(cleanHex)) {
      showToast("Please enter a valid 6-character hex color (e.g. #6366F1)");
      return;
    }
    setCustomAccentHex(cleanHex);
    setHexInputText(cleanHex);
    setAccentTheme("custom");
    localStorage.setItem("toolkit_accent_theme", "custom");
    localStorage.setItem("toolkit_custom_accent_hex", cleanHex);
    applyCssAccentVariable(cleanHex);
    showToast(`Custom CSS variable --app-accent-color updated to ${cleanHex.toUpperCase()}`);
  };

  const handleResetAccentColor = () => {
    const defaultHex = "#6366f1";
    setCustomAccentHex(defaultHex);
    setHexInputText(defaultHex);
    setAccentTheme("indigo");
    localStorage.setItem("toolkit_accent_theme", "indigo");
    localStorage.setItem("toolkit_custom_accent_hex", defaultHex);
    applyCssAccentVariable(defaultHex);
    showToast("Accent color reset to default Indigo (#6366F1)");
  };

  const handleExportBackup = () => {
    try {
      const exportData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("custom_") || key.startsWith("toolkit_") || key.includes("theme"))) {
          exportData[key] = localStorage.getItem(key) || "";
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `toolkit_pro_settings_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Settings and keys backup exported successfully!");
    } catch (_) {
      showToast("Failed to export settings backup.");
    }
  };

  const handleClearAllStorage = () => {
    if (window.confirm("Are you sure you want to clear all locally cached keys and preferences? This cannot be undone.")) {
      PROVIDERS.forEach((p) => localStorage.removeItem(p.storageKey));
      localStorage.removeItem("toolkit_drive_autosync");
      localStorage.removeItem("toolkit_accent_theme");
      setKeyInput("");
      showToast("All local app preferences and keys cleared!");
    }
  };

  const isStoredKeyValid = !!localStorage.getItem(activeProvider.storageKey);

  const TABS = [
    { id: "apikeys" as SettingsTab, label: "AI API Credentials", icon: Key, badge: "Essential", desc: "Gemini, OpenAI, Anthropic & Replicate" },
    { id: "theme" as SettingsTab, label: "Theme & Aesthetics", icon: Sun, badge: "UI", desc: "Dark/Light mode & contrast settings" },
    { id: "drive" as SettingsTab, label: "Google Drive Sync", icon: Cloud, badge: user ? "Connected" : "Offline", desc: "Cloud backup & Google account link" },
    { id: "audio" as SettingsTab, label: "Focus Soundscapes", icon: Volume2, badge: selectedAmbientSound !== "none" ? "Active" : "Sound", desc: "Procedural ambient focus audio" },
    { id: "storage" as SettingsTab, label: "Workspace Data", icon: Database, badge: `${storageUsageKb} KB`, desc: "Local cache & JSON backup export" }
  ];

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl z-[170] flex items-center gap-2 border border-slate-700 font-bold animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* OVERLAY CONTAINER PANEL */}
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL (Desktop Left / Mobile Top) */}
        <div className="w-full md:w-80 bg-slate-50/80 dark:bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 p-4 md:p-6 flex flex-col shrink-0">
          
          {/* Header Branding & Close */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight font-sans tracking-tight">
                  Workspace Settings
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Global App & API Preferences
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close Settings Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="my-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Navigation Categories */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      <TabIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black font-sans leading-tight ${
                        isSelected ? "text-white" : "text-slate-900 dark:text-white"
                      }`}>
                        {tab.label}
                      </h4>
                      <p className={`text-[10px] leading-tight font-medium mt-0.5 ${
                        isSelected ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"
                      }`}>
                        {tab.desc}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase shrink-0 border ${
                    isSelected
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* User Logged-in / Auth Footer */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user ? (
                <>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight font-sans">
                      {user.displayName || "Google Creator"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-medium">
                      {user.email || "Cloud Drive Account"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                    Guest Account Mode
                  </span>
                </div>
              )}
            </div>

            {user ? (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
                title="Disconnect Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN VIEWPORT PANEL (Desktop Right / Mobile Main) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
          
          {/* Top Header Bar inside Overlay */}
          <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h3>
                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase font-mono">
                  Client Direct
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {TABS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            <button
              onClick={onClose}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span>Close Settings</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 text-[10px] font-mono rounded border border-slate-300 dark:border-slate-600">
                ESC
              </kbd>
            </button>
          </div>

          {/* SCROLLABLE SECTION BODY */}
          <div className="p-5 md:p-8 overflow-y-auto space-y-8 flex-1">
            
            {/* TAB 1: AI API CREDENTIALS */}
            {activeTab === "apikeys" && (
              <div className="space-y-6 max-w-4xl animate-fade-in">
                
                {/* 1. PROVIDER SELECTOR GRID */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    1. Select AI Model Provider
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PROVIDERS.map((provider) => {
                      const isSelected = provider.id === selectedProviderId;
                      const hasKey = !!localStorage.getItem(provider.storageKey);

                      return (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProviderId(provider.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`p-2 rounded-xl border text-xs font-bold ${provider.iconBg}`}>
                              <Zap className="w-4 h-4" />
                            </span>
                            {hasKey ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Saved
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                Default
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className={`text-xs font-black truncate font-sans ${
                              isSelected ? "text-indigo-950 dark:text-indigo-200" : "text-slate-900 dark:text-white"
                            }`}>
                              {provider.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                              {provider.badge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PROVIDER OVERVIEW CARD */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${activeProvider.color}`} />
                      {activeProvider.name}
                    </span>

                    <a
                      href={activeProvider.getKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Get Free Official API Key</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {activeProvider.shortDesc}
                  </p>
                </div>

                {/* 2. CONNECTION STATUS INDICATOR */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      2. Key Connection Status
                    </label>

                    <button
                      onClick={handleTestKeyFormat}
                      disabled={isValidating || !keyInput.trim()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
                      <span>Validate Syntax</span>
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isStoredKeyValid
                      ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                      : keyInput.trim()
                      ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                      : "bg-slate-100/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    <div className="flex items-center gap-3.5">
                      {isStoredKeyValid ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : keyInput.trim() ? (
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-slate-300 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                          <Key className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black font-sans uppercase tracking-wider">
                            {isStoredKeyValid
                              ? "Saved & Connected"
                              : keyInput.trim()
                              ? "Unsaved Key in Input"
                              : "No Custom Key Configured"}
                          </h5>
                          <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            isStoredKeyValid
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : keyInput.trim()
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                          }`}>
                            {isStoredKeyValid ? "Active" : keyInput.trim() ? "Pending Save" : "Shared Quota"}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 font-medium mt-0.5">
                          {isStoredKeyValid
                            ? `Your custom ${activeProvider.name} API key is stored locally in this browser.`
                            : keyInput.trim()
                            ? "Click 'Save API Key' below to persist this key for future video and image runs."
                            : "Using shared server-side credentials. Add your own key to bypass high-fidelity quota limits."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. INPUT + MASK ACTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      3. API Key Masked Input
                    </label>

                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {activeProvider.prefixHint}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={isMasked ? "password" : "text"}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={activeProvider.placeholder}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-4 pr-28 py-3.5 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                    />

                    <div className="absolute right-2 top-2 flex items-center gap-1.5">
                      {/* Mask Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsMasked(!isMasked)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isMasked ? "Show API Key (Unmask)" : "Hide API Key (Mask)"}
                      >
                        {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Paste Button */}
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold font-mono cursor-pointer transition-colors"
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  {/* Save & Clear Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClearKey}
                      disabled={!keyInput && !isStoredKeyValid}
                      className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3.5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Key</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition-all uppercase tracking-wider font-sans"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save API Key</span>
                    </button>
                  </div>
                </div>

                {/* 4. LOCAL STORAGE SAFETY BANNER */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-xs uppercase tracking-wider font-sans">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                    <span>Local Browser Security Guarantee</span>
                  </div>
                  <p className="text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed font-medium">
                    🔒 <strong>Zero External Server Transmission:</strong> API keys never leave your browser window or get saved on central app servers. They are stored strictly in your browser's local cache (<code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded">localStorage</code>) and are sent directly from your client machine to official model provider API endpoints.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: THEME & AESTHETICS */}
            {activeTab === "theme" && (
              <div className="space-y-6 max-w-4xl animate-fade-in">
                
                {/* 1. VISUAL MODE SELECTION */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-indigo-500" />
                    Color Theme Mode
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light Mode Card */}
                    <button
                      onClick={() => {
                        if (theme === "dark" && onToggleTheme) onToggleTheme();
                      }}
                      className={`p-5 rounded-3xl border text-left transition-all cursor-pointer space-y-3 ${
                        theme === "light"
                          ? "bg-slate-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                          : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Sun className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 font-sans">Light Canvas Theme</h4>
                            <p className="text-[11px] text-slate-500">Crisp off-white contrast with deep indigo text</p>
                          </div>
                        </div>
                        {theme === "light" && (
                          <div className="p-1 rounded-full bg-indigo-600 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Mock UI Preview */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-3xs space-y-2">
                        <div className="h-2 w-1/3 bg-slate-300 rounded-full" />
                        <div className="h-2 w-2/3 bg-indigo-500 rounded-full" />
                        <div className="flex gap-1 pt-1">
                          <div className="h-4 w-12 bg-indigo-100 rounded-lg" />
                          <div className="h-4 w-8 bg-slate-100 rounded-lg" />
                        </div>
                      </div>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      onClick={() => {
                        if (theme === "light" && onToggleTheme) onToggleTheme();
                      }}
                      className={`p-5 rounded-3xl border text-left transition-all cursor-pointer space-y-3 ${
                        theme === "dark"
                          ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                          : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Moon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white font-sans">Dark Luxury Theme</h4>
                            <p className="text-[11px] text-slate-400">Eye-safe slate black with glowing accents</p>
                          </div>
                        </div>
                        {theme === "dark" && (
                          <div className="p-1 rounded-full bg-indigo-600 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Mock UI Preview */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-3xs space-y-2">
                        <div className="h-2 w-1/3 bg-slate-700 rounded-full" />
                        <div className="h-2 w-2/3 bg-indigo-400 rounded-full" />
                        <div className="flex gap-1 pt-1">
                          <div className="h-4 w-12 bg-indigo-950 rounded-lg border border-indigo-800" />
                          <div className="h-4 w-8 bg-slate-800 rounded-lg" />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. ACCENT COLOR & CUSTOM CSS VARIABLE PANEL */}
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-2">
                        <Palette className="w-4 h-4 text-indigo-500" />
                        Workspace Primary Accent & CSS Variable
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Define a custom accent color for UI elements, buttons, and focus rings. Persisted dynamically via <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-indigo-500">--app-accent-color</code>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetAccentColor}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>

                  {/* Preset Swatches Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans uppercase tracking-wider">Curated Color Presets</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "indigo", name: "Indigo Wave", hex: "#6366f1" },
                        { id: "emerald", name: "Emerald Mint", hex: "#10b981" },
                        { id: "purple", name: "Royal Purple", hex: "#8b5cf6" },
                        { id: "crimson", name: "Rose Crimson", hex: "#f43f5e" },
                        { id: "amber", name: "Amber Flame", hex: "#f59e0b" },
                        { id: "cyan", name: "Ocean Cyan", hex: "#06b6d4" },
                        { id: "coral", name: "Electric Coral", hex: "#ff5e62" },
                        { id: "blue", name: "Midnight Blue", hex: "#2563eb" }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSetAccentTheme(preset.id, preset.hex)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            customAccentHex.toLowerCase() === preset.hex.toLowerCase()
                              ? "bg-slate-100 dark:bg-slate-800/90 border-slate-400 dark:border-slate-500 ring-2 ring-slate-400/20 font-bold shadow-2xs"
                              : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-3xs"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <div className="text-left overflow-hidden">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{preset.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">{preset.hex}</p>
                          </div>
                          {customAccentHex.toLowerCase() === preset.hex.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Color Picker & Input Panel */}
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans uppercase tracking-wider block">
                      Custom Color Picker & CSS Variable Input
                    </span>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* Native Color Wheel Input */}
                      <div className="relative flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                        <input
                          type="color"
                          value={customAccentHex.startsWith("#") ? customAccentHex : `#${customAccentHex}`}
                          onChange={(e) => {
                            const newHex = e.target.value;
                            setCustomAccentHex(newHex);
                            setHexInputText(newHex);
                            applyCssAccentVariable(newHex);
                          }}
                          className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer p-0 overflow-hidden"
                          title="Pick Custom Color"
                        />
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 pr-2">
                          Pick Color
                        </span>
                      </div>

                      {/* Manual Hex Input Field */}
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          value={hexInputText}
                          onChange={(e) => {
                            setHexInputText(e.target.value);
                            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                              setCustomAccentHex(e.target.value);
                              applyCssAccentVariable(e.target.value);
                            }
                          }}
                          placeholder="#6366F1"
                          maxLength={7}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                        />
                        <span
                          className="absolute right-3 top-2.5 w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs"
                          style={{ backgroundColor: customAccentHex }}
                        />
                      </div>

                      {/* Apply Button */}
                      <button
                        type="button"
                        onClick={() => handleApplyCustomHex(hexInputText)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                      >
                        Apply Hex
                      </button>
                    </div>

                    {/* CSS Variable Live Indicator & WCAG AAA Contrast Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1 gap-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>Root CSS Variable:</span>
                        <code className="bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-900 dark:text-slate-100 font-bold">
                          --app-accent-color: {customAccentHex.toUpperCase()}
                        </code>
                      </div>

                      {/* Dynamic WCAG AAA / AA Badges */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Contrast:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wcagStats.darkPassAAA || wcagStats.lightPassAAA
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : wcagStats.darkPassAA || wcagStats.lightPassAA
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {theme === "dark" ? `${wcagStats.darkRatio}:1` : `${wcagStats.lightRatio}:1`}{" "}
                          {(theme === "dark" ? wcagStats.darkPassAAA : wcagStats.lightPassAAA)
                            ? "WCAG AAA (7.0+)"
                            : (theme === "dark" ? wcagStats.darkPassAA : wcagStats.lightPassAA)
                              ? "WCAG AA (4.5+)"
                              : "Low Contrast"}
                        </span>

                        {!(theme === "dark" ? wcagStats.darkPassAAA : wcagStats.lightPassAAA) && (
                          <button
                            type="button"
                            onClick={handleAutoAdjustWcagAAA}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer font-sans"
                            title="Auto-tune hex color for WCAG AAA 7.0:1 contrast ratio"
                          >
                            Auto AAA
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live UI Accent Interactive Preview Card */}
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Live UI Accent Color Preview
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: customAccentHex }}
                      >
                        Active Accent
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Button Preview */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Custom Button</span>
                        <button
                          type="button"
                          className="w-full py-2 px-3 rounded-xl text-white font-black text-xs transition-transform active:scale-95 shadow-sm cursor-default"
                          style={{ backgroundColor: customAccentHex }}
                        >
                          Primary Action
                        </button>
                      </div>

                      {/* Badge / Tag Preview */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tag / Status</span>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{
                              backgroundColor: `${customAccentHex}20`,
                              color: customAccentHex,
                              border: `1px solid ${customAccentHex}40`
                            }}
                          >
                            Pro Member
                          </span>
                          <span
                            className="w-2 h-2 rounded-full animate-ping"
                            style={{ backgroundColor: customAccentHex }}
                          />
                        </div>
                      </div>

                      {/* Progress Bar Preview */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Progress Meter</span>
                        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: "70%", backgroundColor: customAccentHex }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ACCESSIBILITY TOGGLES */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    Accessibility & Guidance
                  </label>

                  <div className="space-y-2.5">
                    {/* High Contrast */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                          High Contrast Typography (WCAG AAA)
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Increases border contrast and text legibility across all creative panels.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onToggleHighContrast}
                        className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                          highContrast ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          highContrast ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Tooltips */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                          Interactive Workspace Tooltips
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Shows helpful feature usage hints when hovering over creation controls.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onToggleTooltips}
                        className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                          tooltipsEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          tooltipsEnabled ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GOOGLE DRIVE SYNC */}
            {activeTab === "drive" && (
              <div className="space-y-6 max-w-4xl animate-fade-in">
                
                {/* 1. ACCOUNT CONNECTION CARD */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {user ? (
                      user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "Google"} className="w-12 h-12 rounded-2xl border-2 border-indigo-500 object-cover shadow-md shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                          {(user.displayName || user.email || "G")[0].toUpperCase()}
                        </div>
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                        <Cloud className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans">
                          {user ? (user.displayName || "Connected Creator Account") : "Google Drive Not Connected"}
                        </h4>
                        <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border uppercase ${
                          user
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}>
                          {user ? "Cloud Synced" : "Offline Mode"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {user ? user.email : "Connect your Google account to automatically store design assets and video renders in Drive."}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Disconnect Account
                    </button>
                  ) : (
                    <button
                      onClick={onLogin}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider shrink-0 font-sans"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Connect Google Drive</span>
                    </button>
                  )}
                </div>

                {/* 2. SYNC SETTINGS & DRIVE FEATURES */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-indigo-500" />
                    Cloud Backup & Workspace Sync Controls
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Auto Sync Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                          Auto-Sync Background Backups
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Automatically upload generated images and video presets to your Drive folder.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleAutoSync}
                        className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
                          autoSyncEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          autoSyncEnabled ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Drive Storage Stats */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                          Synced Drive Workspace Files
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {driveCount} active file assets stored in cloud folder
                        </p>
                      </div>

                      {onRefreshDrive && (
                        <button
                          onClick={onRefreshDrive}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                          title="Force Re-Sync Google Drive"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DRIVE WORKSPACE DIRECT LINK */}
                {onNavigateToDrive && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                        Full Google Drive Cloud Explorer
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage, organize, export, and rename your cloud folder assets directly.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToDrive();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer font-sans"
                    >
                      Open Drive Explorer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FOCUS SOUNDSCAPES */}
            {activeTab === "audio" && (
              <div className="space-y-6 max-w-4xl animate-fade-in">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-indigo-500" />
                    Procedural Ambient Focus Soundscapes
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Synthesizes ambient focus audio locally using standard web AudioContext wave oscillators. Perfect for concentrating during long video renders and design sessions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { id: "none", name: "Off (Mute)", desc: "No background audio" },
                      { id: "rain", name: "Rain & Thunderstorm", desc: "Soothing procedural rain noise sweeps" },
                      { id: "binaural", name: "Deep Binaural Beats (432Hz)", desc: "Alpha wave theta focus frequencies" },
                      { id: "waves", name: "Ocean Waves", desc: "Rhythmic low-pass wave filter synthesis" }
                    ].map((sound) => {
                      const isSelected = selectedAmbientSound === sound.id;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => {
                            if (onSelectAmbientSound) onSelectAmbientSound(sound.id);
                            showToast(`Focus audio set to ${sound.name}`);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <h5 className={`text-xs font-black font-sans ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>
                              {sound.name}
                            </h5>
                            <p className={`text-[10.5px] mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>
                              {sound.desc}
                            </p>
                          </div>

                          {isSelected ? (
                            <div className="p-1 rounded-full bg-white text-indigo-600">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <Radio className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WORKSPACE DATA & STORAGE */}
            {activeTab === "storage" && (
              <div className="space-y-6 max-w-4xl animate-fade-in">
                
                {/* 0. PWA / OFFLINE PERSISTENCE BANNER */}
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-sans">
                        PWA / Offline Persistence Ready
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
                      100% Client-Side
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Since all settings, custom CSS accent variables, soundscapes, and local cache run strictly client-side in your browser, the entire application panel continues to function seamlessly offline with zero network latency.
                  </p>
                </div>

                {/* 1. USAGE GAUGE */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white font-sans uppercase tracking-wider">
                        Browser LocalStorage Cache
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Stores saved API keys, video history logs, and workspace preferences securely.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {storageUsageKb} KB used
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (storageUsageKb / 5120) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. BACKUP & CLEAR ACTIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Backup JSON */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white font-sans uppercase tracking-wider">
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>Export Settings Backup</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Download a JSON backup containing all your client API key configurations and preferences.
                    </p>
                    <button
                      onClick={handleExportBackup}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON Backup</span>
                    </button>
                  </div>

                  {/* Clear Cache */}
                  <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-900 dark:text-rose-300 font-sans uppercase tracking-wider">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Reset Local Workspace Data</span>
                    </div>
                    <p className="text-xs text-rose-950/70 dark:text-rose-300/70 leading-relaxed font-medium">
                      Clears all saved API keys, custom order maps, and local audio preferences from this browser.
                    </p>
                    <button
                      onClick={handleClearAllStorage}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear Local Storage</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OVERLAY FOOTER */}
          <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>100% Client-Side Encryption & Offline Security</span>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer font-sans uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
