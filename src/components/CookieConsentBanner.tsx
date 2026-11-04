import React, { useState, useEffect } from "react";
import { ShieldCheck, Cookie, Settings, Check, X, ExternalLink, Info, Lock } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  advertising: boolean; // Google AdSense & Third-party ad cookies
  timestamp: string;
}

const STORAGE_KEY = "toolkit_adsense_cookie_consent";

export function getStoredCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveCookieConsent(prefs: CookiePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("toolkit_cookie_consent_change", { detail: prefs }));
  } catch (e) {
    console.error("Failed to persist cookie consent", e);
  }
}

interface CookieConsentBannerProps {
  theme?: "light" | "dark";
  onOpenPrivacyPolicy?: () => void;
}

export default function CookieConsentBanner({ theme = "light", onOpenPrivacyPolicy }: CookieConsentBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    advertising: true,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    const stored = getStoredCookieConsent();
    if (!stored) {
      // Delay display slightly for smooth page load UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setPreferences(stored);
    }

    // Expose programmatic opener on window for Footer & Legal hub
    (window as any).openCookieConsentSettings = () => {
      setShowPreferencesModal(true);
    };

    return () => {
      delete (window as any).openCookieConsentSettings;
    };
  }, []);

  const handleAcceptAll = () => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    };
    saveCookieConsent(updated);
    setPreferences(updated);
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  const handleRejectOptional = () => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString(),
    };
    saveCookieConsent(updated);
    setPreferences(updated);
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    const updated: CookiePreferences = {
      ...preferences,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
    };
    saveCookieConsent(updated);
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* Main Bottom Cookie Notice Banner */}
      {isOpen && !showPreferencesModal && (
        <aside
          role="region"
          aria-label="Cookie and Privacy Consent Banner"
          className={`fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 transition-all duration-300 animate-fade-in border-t shadow-2xl backdrop-blur-md pb-safe ${
            theme === "dark"
              ? "bg-slate-950/95 border-slate-800 text-slate-100"
              : "bg-white/95 border-slate-200 text-slate-900"
          }`}
        >
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Explanatory Message */}
            <div className="flex items-start gap-3 flex-1 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span>Cookie Consent & Advertising Policy</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    GDPR & AdSense Compliant
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  We and our partners (including Google AdSense) use cookies and similar technologies to ensure core functionality, analyze site usage, and serve personalized or non-personalized advertisements based on your browsing interests. You can customize your preferences or withdraw consent at any time.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPrivacyPolicy) {
                        onOpenPrivacyPolicy();
                      } else {
                        const evt = new CustomEvent("toolkit_navigate_tab", { detail: { tab: "legal", sub: "privacy" } });
                        window.dispatchEvent(evt);
                      }
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Read Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>Google Ad Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
                    : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <button
                type="button"
                onClick={handleRejectOptional}
                className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === "dark"
                    ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
                    : "border-slate-250 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Essential Only</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-101 active:scale-98"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept All Cookies</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Modal (GDPR / Google Consent Management Platform Style) */}
      {showPreferencesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div
            className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-5 ${
              theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3.5 border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cookie-preferences-title" className="text-sm sm:text-base font-extrabold">
                    Cookie & Advertising Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Control how Toolkit Pro and our advertising partners use your data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-3.5 text-xs">
              {/* Category 1: Essential Cookies */}
              <div className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Strictly Necessary Cookies</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Always Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Required for essential web application operation, security validation, active UI theme preferences (dark/light), high-contrast mode, and in-browser tool parameters. Cannot be disabled.
                </p>
              </div>

              {/* Category 2: Analytics Cookies */}
              <div className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>Analytics & Performance Cookies</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Allows us to count visits and traffic sources via Google Analytics 4 (G-FLHZNQ6KWT) so we can measure and improve app performance. All IP data is processed with privacy-conscious pseudonymization.
                </p>
              </div>

              {/* Category 3: Google AdSense & Personalized Advertising */}
              <div className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Cookie className="w-4 h-4 text-amber-500" />
                    <span>Google AdSense & Targeted Advertising</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enables Google AdSense and certified ad partners to serve relevant advertisements based on your visits to our site and other internet locations. When disabled, you will still see ads, but they will be contextual rather than personalized.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10.5px]">
                  <a
                    href="https://policies.google.com/technologies/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>How Google uses cookies in advertising</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRejectOptional}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300"
                    : "border-slate-200 bg-slate-100 hover:bg-slate-150 text-slate-700"
                }`}
              >
                Reject Non-Essential
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-blue-500/40 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60"
                      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  Save Choices
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
