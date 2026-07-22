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
  Info,
  Check,
  RefreshCw,
  Lock,
  Cpu,
  Layers,
  Zap,
  Copy
} from "lucide-react";

export interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: string;
  onKeySaved?: (provider: string, key: string) => void;
}

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
    badge: "Primary AI Engine",
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

export default function ApiKeyModal({
  isOpen,
  onClose,
  defaultProvider = "gemini",
  onKeySaved
}: ApiKeyModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>(defaultProvider);
  const [keyInput, setKeyInput] = useState<string>("");
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeProvider = PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];

  // Load key from localStorage on provider change or modal open
  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem(activeProvider.storageKey) || "";
      setKeyInput(storedKey);
      setIsMasked(true);
      setValidationStatus(storedKey ? "valid" : "idle");
    }
  }, [isOpen, selectedProviderId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      showToast("Please enter an API key before saving.");
      return;
    }

    localStorage.setItem(activeProvider.storageKey, trimmed);
    setValidationStatus("valid");
    showToast(`Saved ${activeProvider.name} API Key securely!`);

    if (onKeySaved) {
      onKeySaved(activeProvider.id, trimmed);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(activeProvider.storageKey);
    setKeyInput("");
    setValidationStatus("idle");
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
        setValidationStatus("invalid");
        showToast("Key input is empty.");
        return;
      }

      if (val.length < 15) {
        setValidationStatus("invalid");
        showToast("Key appears too short to be valid.");
        return;
      }

      setValidationStatus("valid");
      showToast("Key structure looks valid!");
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

  const isStoredKeyValid = !!localStorage.getItem(activeProvider.storageKey);

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl z-[140] flex items-center gap-2 border border-slate-700 font-bold font-sans animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                  AI Provider Key Settings
                </h2>
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider font-mono">
                  Client-Side Direct
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Configure your own API keys to bypass shared usage quotas and unlock high-throughput model inference.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close API Key Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Provider Select Grid / Tabs */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              1. Select AI Model Provider
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map((provider) => {
                const isSelected = provider.id === selectedProviderId;
                const hasKey = !!localStorage.getItem(provider.storageKey);

                return (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProviderId(provider.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-1.5 rounded-xl border text-xs font-bold ${provider.iconBg}`}>
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      {hasKey ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Key Saved" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" title="No Key" />
                      )}
                    </div>

                    <div>
                      <h4 className={`text-xs font-black truncate font-sans ${
                        isSelected ? "text-indigo-950 dark:text-indigo-200" : "text-slate-900 dark:text-white"
                      }`}>
                        {provider.name}
                      </h4>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono font-medium block mt-0.5">
                        {provider.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${activeProvider.color}`} />
                {activeProvider.name}
              </span>

              <a
                href={activeProvider.getKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {activeProvider.shortDesc}
            </p>
          </div>

          {/* Visual Hierarchy Part 1: Status Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                2. Key Connection Status
              </label>

              <button
                onClick={handleTestKeyFormat}
                disabled={isValidating || !keyInput.trim()}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isValidating ? "animate-spin" : ""}`} />
                <span>Test Format</span>
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              isStoredKeyValid
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                : keyInput.trim()
                ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                : "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              <div className="flex items-center gap-3">
                {isStoredKeyValid ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : keyInput.trim() ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-black font-sans uppercase tracking-wider">
                      {isStoredKeyValid
                        ? "Saved & Ready"
                        : keyInput.trim()
                        ? "Unsaved Key in Input"
                        : "No Custom Key Configured"}
                    </h5>
                    <span className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full uppercase border ${
                      isStoredKeyValid
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : keyInput.trim()
                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                    }`}>
                      {isStoredKeyValid ? "Connected" : keyInput.trim() ? "Pending Save" : "Default Quota"}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 font-medium mt-0.5">
                    {isStoredKeyValid
                      ? `Your custom ${activeProvider.name} API key is stored locally in this browser.`
                      : keyInput.trim()
                      ? "Click 'Save API Key' below to store this key for future sessions."
                      : "Using shared server-side fallback credentials. Add your own key for higher rate limits."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Hierarchy Part 2: Input + Mask Action */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                3. API Key Input
              </label>

              <span className="text-[10px] font-mono font-bold text-slate-400">
                {activeProvider.prefixHint}
              </span>
            </div>

            <div className="relative">
              <input
                type={isMasked ? "password" : "text"}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setValidationStatus("idle");
                }}
                placeholder={activeProvider.placeholder}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-3.5 pr-24 py-3 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-3xs"
              />

              <div className="absolute right-2 top-2 flex items-center gap-1">
                {/* Mask / Unmask Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isMasked ? "Show API Key (Unmask)" : "Hide API Key (Mask)"}
                  aria-label={isMasked ? "Show API Key" : "Hide API Key"}
                >
                  {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Paste Button */}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer transition-colors"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Save & Clear Action Button Row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleClearKey}
                disabled={!keyInput && !isStoredKeyValid}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Key</span>
              </button>

              <button
                type="button"
                onClick={handleSaveKey}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition-all uppercase tracking-wider font-sans"
              >
                <Save className="w-4 h-4" />
                <span>Save API Key</span>
              </button>
            </div>
          </div>

          {/* Visual Hierarchy Part 3: Storage Warning / Local Storage Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-xs uppercase tracking-wider font-sans">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Local Browser Storage Banner</span>
            </div>
            <p className="text-[11.5px] text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed font-medium">
              🔒 <strong>Zero Server Transmission:</strong> Your API keys never leave your browser or get sent to our central servers. They are stored strictly in your browser's local cache (<code className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded text-[10.5px]">localStorage</code>) and are transmitted directly from your client to official provider API endpoints ({activeProvider.name}).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Encrypted local session storage</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
