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
  ExternalLink,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Play,
  Volume2,
  Info,
  RefreshCw
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

interface CustomShortcut {
  id: string; // unique mapping ID
  actionId: string; // standard ID from select dropdown
  actionLabel: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  key: string;
}

const PLANNER_ACTIONS = [
  { id: "action-palette", label: "Toggle Command Palette", desc: "Activates the lightning-fast launcher bar to navigate pages." },
  { id: "action-drive", label: "Toggle Drive Cloud Browser", desc: "Instantly display the Cloud Drive folders and files." },
  { id: "action-tour", label: "Restart Onboarding Tour Overlay", desc: "Re-triggers the premium interactive tour instructions guide." },
  { id: "action-audio", label: "Trigger Aesthetic Media Pulse", desc: "Switches current music synthesizer sound looping state." },
  { id: "action-theme", label: "Contrast Theme Skin toggler", desc: "Switches current theme palette structure contrast." },
  { id: "action-seo", label: "JSON-LD Sitemap Validator", desc: "Launch bulk meta-scraping search engine layout." },
  { id: "action-reset", label: "Reset Local Web Workspace", desc: "Clears active dynamic developer playground parameters." },
  { id: "action-backup", label: "Export Full Workspace Package", desc: "Generates independent standalone zip backup configuration." }
];

const KEY_OPTIONS = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  ...Array.from({ length: 10 }, (_, i) => String(i)), // 0-9
  "ENTER", "SPACE", "ESCAPE", "TAB", "ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT", "BACKSPACE"
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "planner">("directory");
  const [search, setSearch] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Custom shortcuts mapping state
  const [customShortcuts, setCustomShortcuts] = useState<CustomShortcut[]>(() => {
    try {
      const saved = localStorage.getItem("toolkit_custom_shortcuts");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Local storage error loading planned shortcuts:", e);
    }
    // Pre-seed with one planned custom mapping for excellent UX
    return [
      {
        id: "plan-1",
        actionId: "action-tour",
        actionLabel: "Restart Onboarding Tour Overlay",
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        key: "T"
      }
    ];
  });

  // Hotkey custom planner editor state
  const [selectedActionId, setSelectedActionId] = useState("action-palette");
  const [plannerCtrl, setPlannerCtrl] = useState(true);
  const [plannerAlt, setPlannerAlt] = useState(false);
  const [plannerShift, setPlannerShift] = useState(false);
  const [plannerKey, setPlannerKey] = useState("K");

  // Keyboard listening recorder states
  const [isRecording, setIsRecording] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("toolkit_custom_shortcuts", JSON.stringify(customShortcuts));
    } catch (e) {
      console.error(e);
    }
  }, [customShortcuts]);

  // Keyboard recording capture effect
  useEffect(() => {
    if (!isRecording) return;
    
    const handleRecKeydown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modifierKeys = ["Control", "Alt", "Shift", "Meta"];
      if (modifierKeys.includes(e.key)) {
        return; // wait for final key triggering
      }

      setPlannerCtrl(e.ctrlKey || e.metaKey);
      setPlannerAlt(e.altKey);
      setPlannerShift(e.shiftKey);
      setPlannerKey(e.key.toUpperCase());
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleRecKeydown, true);
    return () => {
      window.removeEventListener("keydown", handleRecKeydown, true);
    };
  }, [isRecording]);

  // Default app shortcuts catalog
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
      purpose: "Summons the real-time search engine optimization (SEO) log and JSON-LD sitemap."
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
      keys: ["Alt", "D"],
      description: "ZIP Download All (Image Compressor)",
      category: "Workspace Modules",
      purpose: "Within the Image Compressor, instantly packages and downloads all compressed images as a ZIP archive."
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
        // Only close if not currently recording keys
        if (!isRecording) {
          onClose();
        }
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, isRecording]);

  if (!isOpen) return null;

  // Search filter matching
  const filteredShortcuts = shortcuts.filter(item =>
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.purpose.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.keys.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  // Helper to construct formatted key signature for comparison verification
  const getSignature = (ctrl: boolean, alt: boolean, shift: boolean, key: string) => {
    const parts = [];
    if (ctrl) parts.push("Ctrl");
    if (alt) parts.push("Alt");
    if (shift) parts.push("Shift");
    parts.push(key.toUpperCase().trim());
    return parts.join("+");
  };

  const currentPlannerKeyStr = getSignature(plannerCtrl, plannerAlt, plannerShift, plannerKey);

  // Default app conflicts catalog checking
  const systemDefaults = [
    { keyCombo: "Ctrl+T", d: "Standard Browser New Tab trigger action" },
    { keyCombo: "Ctrl+W", d: "Standard Browser Close Tab command trigger" },
    { keyCombo: "Ctrl+N", d: "Standard standalone browser window trigger" },
    { keyCombo: "Ctrl+P", d: "System standard printer dialog interceptor" },
    { keyCombo: "Ctrl+S", d: "Standard saving file/html webpage layout trigger" },
    { keyCombo: "Ctrl+R", d: "Browser Standard dynamic page refresh trigger" },
    { keyCombo: "Ctrl+F", d: "Standard Browser Search content overlay selector" },
    { keyCombo: "Escape", d: "Standard escape cancellation browser overlay" },
    { keyCombo: "F11", d: "OS window full-screen resolution modes" },
    { keyCombo: "F12", d: "Operating browser developer inspector tools" }
  ];

  const appDefaults = shortcuts.map(s => ({
    keyCombo: s.keys.join("+"),
    d: s.description
  }));

  // Resolve active conflict status metrics in real-time
  const appConflictMatch = appDefaults.find(def => def.keyCombo.toUpperCase() === currentPlannerKeyStr.toUpperCase());
  const systemConflictMatch = systemDefaults.find(sys => sys.keyCombo.toUpperCase() === currentPlannerKeyStr.toUpperCase());
  const customConflictMatch = customShortcuts.find(cust => {
    const signature = getSignature(cust.ctrlKey, cust.altKey, cust.shiftKey, cust.key);
    return signature.toUpperCase() === currentPlannerKeyStr.toUpperCase();
  });

  // Diagnostic warning categorization
  let conflictLevel: "clear" | "warning" | "danger" = "clear";
  let diagnosticMessage = "";

  if (appConflictMatch) {
    conflictLevel = "danger";
    diagnosticMessage = `🔴 CRITICAL APP OVERLAP: Already occupied by built-in system navigation rule "${appConflictMatch.d}". If deployed, this conflict will override standard navigation.`;
  } else if (customConflictMatch) {
    conflictLevel = "danger";
    diagnosticMessage = `🔴 USER DOUBLE BOOKING: This identical modifier-key combo is already registered by your planned custom shortcut "${customConflictMatch.actionLabel}".`;
  } else if (systemConflictMatch) {
    conflictLevel = "warning";
    diagnosticMessage = `⚠️ BROWSERS RESERVED INTERCEPT: "${systemConflictMatch.d}". Native client software will likely block custom scripts or capture keys first.`;
  } else {
    conflictLevel = "clear";
    diagnosticMessage = `🟢 COMPATIBLE & RESOLVED: Active slot combination! No overlapping visual layout or navigation mappings found.`;
  }

  // Handle addition of custom virtual assigned mapped keys
  const handleAddNewShortcut = () => {
    const action = PLANNER_ACTIONS.find(a => a.id === selectedActionId);
    if (!action) return;

    // Prune existing mapping for the exact same action to avoid multiple mappings per action!
    const newCustoms = customShortcuts.filter(c => c.actionId !== selectedActionId);
    
    const item: CustomShortcut = {
      id: `plan-${Date.now()}`,
      actionId: selectedActionId,
      actionLabel: action.label,
      ctrlKey: plannerCtrl,
      altKey: plannerAlt,
      shiftKey: plannerShift,
      key: plannerKey
    };

    setCustomShortcuts([...newCustoms, item]);
  };

  const handleRemoveCustom = (id: string) => {
    setCustomShortcuts(customShortcuts.filter(c => c.id !== id));
  };

  const handleResetShortcuts = () => {
    localStorage.removeItem("toolkit_custom_shortcuts");
    setCustomShortcuts([
      {
        id: "plan-1",
        actionId: "action-tour",
        actionLabel: "Restart Onboarding Tour Overlay",
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        key: "T"
      }
    ]);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      id="shortcuts-cheat-sheet-backdrop"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300"
        id="shortcuts-cheat-sheet-modal"
      >
        {/* Header section with real-time feedback status */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-xl border border-indigo-100/35">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Shortcuts Config Console
                <span className="text-[9px] font-bold py-0.5 px-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 inline-block">
                  v2.0 Beta
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Manage global keystrokes and run conflict diagnostic sweeps
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

        {/* Tab section chooser */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 px-5 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <button
            onClick={() => setActiveTab("directory")}
            className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer border-b-2 ${
              activeTab === "directory"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            📋 Browse Shortcuts Directory
          </button>
          <button
            onClick={() => setActiveTab("planner")}
            className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === "planner"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            Dynamic Shortcut Planner & Conflicts
          </button>
        </div>

        {/* Dynamic Inner body content frames */}
        {activeTab === "directory" ? (
          <>
            {/* Search filter banner */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2.5 bg-white dark:bg-slate-900 shrink-0">
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
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll scrollbar-none">
              {filteredShortcuts.length > 0 ? (
                Array.from(new Set(filteredShortcuts.map(item => item.category))).map(cat => {
                  const catItems = filteredShortcuts.filter(item => item.category === cat);
                  return (
                    <div key={cat} className="space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                        {cat}
                      </h4>
                      <div className="divide-y divide-slate-105 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                        {catItems.map((item, idx) => {
                          const signature = item.keys.join("+");
                          // Find if overridden by custom plan in real-time
                          const matchingOverriddenCustom = customShortcuts.find(cust => {
                            const custSig = getSignature(cust.ctrlKey, cust.altKey, cust.shiftKey, cust.key);
                            return custSig.toUpperCase() === signature.toUpperCase();
                          });

                          return (
                            <div 
                              key={idx}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors"
                            >
                              <div className="space-y-0.5 max-w-xs sm:max-w-md">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {item.description}
                                  </p>
                                  {matchingOverriddenCustom ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 animate-pulse">
                                      ⚠️ Custom Overridden
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-500/80 border border-slate-100 dark:border-slate-800">
                                      App Built-In
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                                  {item.purpose}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0 select-none">
                                {item.keys.map((key, kIdx) => (
                                  <React.Fragment key={kIdx}>
                                    {kIdx > 0 && <span className="text-[10px] font-bold text-slate-350 dark:text-slate-650">+</span>}
                                    <kbd className="inline-flex items-center justify-center font-mono text-[10px] font-black tracking-wide text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded shadow-2xs leading-none">
                                      {key === "Ctrl" && <span className="text-[9px] text-slate-400">Ctrl</span>}
                                      {key === "Alt" && <span className="text-[9px] text-slate-400">Alt</span>}
                                      {key !== "Ctrl" && key !== "Alt" && key}
                                    </kbd>
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <HelpCircle className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold">No registered shortcut parameters match your query.</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                    Try searching for simple keys like \"Alt\", \"Ctrl\", \"Sitemap\" or \"Quote\".
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scroll">
            
            {/* INSTRUCTOR CARD */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
                Aesthetic Hotkey Design Studio & Detector
              </h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
                Build virtual key maps for application actions. Run real-time sanity testing against standard system web defaults or pre-bundled menus to secure non-blocking execution pipelines.
              </p>
            </div>

            {/* REAL-TIME PLANNER COMPILER ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* COMPILER CONFIG LEFT CONTAINER */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                    Choose App Action Directive
                  </label>
                  <select
                    value={selectedActionId}
                    onChange={(e) => setSelectedActionId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {PLANNER_ACTIONS.map(action => (
                      <option key={action.id} value={action.id}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INTERACTIVE RECORDER AND SWITCHERS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                    Define Trigger Keystrokes
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRecording(true)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-4 px-3 rounded-lg text-xs font-bold transition-all relative select-none border  cursor-pointer ${
                        isRecording 
                          ? "bg-amber-500 border-amber-600 text-white font-extrabold animate-pulse shadow-md"
                          : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border-indigo-200/50 dark:border-indigo-900 text-indigo-750 dark:text-indigo-400 px-3.5"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white animate-ping mr-1" />
                          🎙️ Listening Combo... Press Keys!
                        </>
                      ) : (
                        <>
                          <Keyboard className="w-4 h-4 text-indigo-500 animate-bounce-slow" />
                          🎤 Press/Record Hotkey Combo
                        </>
                      )}
                    </button>
                    {isRecording && (
                      <button 
                        onClick={() => setIsRecording(false)}
                        className="py-4 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Manual Modifier Checkboxes */}
                  {!isRecording && (
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-2 select-none">
                        <button
                          onClick={() => setPlannerCtrl(!plannerCtrl)}
                          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                            plannerCtrl
                              ? "bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 text-white"
                              : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-550"
                          }`}
                        >
                          Ctrl / ⌘
                        </button>
                        <button
                          onClick={() => setPlannerAlt(!plannerAlt)}
                          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                            plannerAlt
                              ? "bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 text-white"
                              : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-550"
                          }`}
                        >
                          Alt / ⌥
                        </button>
                        <button
                          onClick={() => setPlannerShift(!plannerShift)}
                          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                            plannerShift
                              ? "bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 text-white"
                              : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-550"
                          }`}
                        >
                          Shift / ⇧
                        </button>

                        {/* Character choice Select */}
                        <select
                          value={plannerKey}
                          onChange={(e) => setPlannerKey(e.target.value)}
                          className="px-2.5 py-1.5 text-[10.5px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 underline-offset-2 outline-none"
                        >
                          {KEY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADD ACTION PANEL BUTTON */}
                <button
                  onClick={handleAddNewShortcut}
                  disabled={conflictLevel === "danger" || isRecording}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-4 flex items-center justify-center gap-1.5 select-none ${
                    conflictLevel === "danger" || isRecording
                      ? "bg-slate-100 dark:bg-slate-850 text-slate-401 cursor-not-allowed opacity-60"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98 cursor-pointer"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Save Planned Custom Mapping
                </button>
              </div>

              {/* REAL-TIME DIAGNOSTIC SWEEP RIGHT CONTAINER */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-855 rounded-xl p-4.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-slate-400" />
                      Dynamic Conflict Audit
                    </h5>
                    <span className="text-[9px] font-mono font-black text-indigo-501 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-100/30">
                      Real-time Check
                    </span>
                  </div>

                  {/* Formatted Key Viewer */}
                  <div className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shadow-3xs select-none">
                    <span className="text-[10.5px] font-semibold text-slate-500">Live Combo String:</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {plannerCtrl && <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">Ctrl</kbd>}
                      {plannerCtrl && (plannerAlt || plannerShift || plannerKey) && <span className="text-[10px] text-slate-350">+</span>}
                      {plannerAlt && <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">Alt</kbd>}
                      {plannerAlt && (plannerShift || plannerKey) && <span className="text-[10px] text-slate-350">+</span>}
                      {plannerShift && <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">Shift</kbd>}
                      {plannerShift && plannerKey && <span className="text-[10px] text-slate-350">+</span>}
                      {plannerKey && <kbd className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200/40 text-indigo-650 dark:text-indigo-400 font-black">{plannerKey}</kbd>}
                    </div>
                  </div>

                  {/* Diagnostic Alert Box */}
                  <div className={`p-3.5 rounded-lg border font-medium text-[10.5px] leading-relaxed transition-all ${
                    conflictLevel === "danger"
                      ? "bg-red-50/70 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/60 dark:text-red-400"
                      : conflictLevel === "warning"
                        ? "bg-amber-50/70 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400"
                        : "bg-emerald-50/70 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400"
                  }`}>
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        conflictLevel === "danger" 
                          ? "text-red-500 animate-bounce-slow" 
                          : conflictLevel === "warning" 
                            ? "text-amber-500" 
                            : "text-emerald-500"
                      }`} />
                      <span>{diagnosticMessage}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Interactive sandboxing allows you to secure custom mappings prior to deployment.</span>
                </div>
              </div>
            </div>

            {/* PLANNED USER-ASSIGNED SHORTCUTS REGISTER */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                  Planned Custom Shortcuts Mappings ({customShortcuts.length})
                </h4>
                {customShortcuts.length > 0 && (
                  <button 
                    onClick={handleResetShortcuts}
                    className="text-[9px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset Defaults
                  </button>
                )}
              </div>

              {customShortcuts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                  {customShortcuts.map((cust) => {
                    const mappedComboStr = getSignature(cust.ctrlKey, cust.altKey, cust.shiftKey, cust.key);
                    const matchingAction = PLANNER_ACTIONS.find(a => a.id === cust.actionId);
                    
                    // Real-time auditing status for existing planned custom combinations
                    const isOverridenByApp = appDefaults.some(def => def.keyCombo.toUpperCase() === mappedComboStr.toUpperCase());
                    const isOverridenBySystem = systemDefaults.some(sys => sys.keyCombo.toUpperCase() === mappedComboStr.toUpperCase());
                    
                    return (
                      <div 
                        key={cust.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-3xs"
                      >
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {cust.actionLabel}
                          </p>
                          <p className="text-[9px] text-slate-400 leading-normal max-w-[200px]">
                            {matchingAction?.desc || "Virtual custom mapped event action."}
                          </p>
                          
                          {/* Warnings feedback */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5 select-none">
                            <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-100/30">
                              {mappedComboStr}
                            </span>
                            {isOverridenByApp && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded border border-red-100/30">
                                🔴 Overlap App Default
                              </span>
                            )}
                            {isOverridenBySystem && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 bg-amber-50 dark:bg-amber-955/20 text-amber-503 text-amber-500 rounded border border-amber-100/30">
                                ⚠️ System Reserved
                              </span>
                            )}
                            {!isOverridenByApp && !isOverridenBySystem && (
                              <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded">
                                🟢 Validated App-Safe
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveCustom(cust.id)}
                          className="p-1 px-1.5 rounded-lg text-slate-350 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Purge custom planned key-mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 rounded-xl">
                  <span className="text-lg">🗺️</span>
                  <p className="text-[11px] font-bold mt-1">No custom keyboard key planner items registered.</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Define triggers in the control panel to evaluate conflicts.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer info logging bar with diagnostic stats */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[10px] font-semibold text-slate-450 dark:text-slate-500 transition-colors shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span>Scan Metrics:</span>
            <span className="text-slate-800 dark:text-slate-300 font-bold">{appDefaults.length} Native Mappings</span>
            <span className="text-slate-300 dark:text-slate-750">|</span>
            <span className="text-slate-800 dark:text-slate-300 font-bold">{customShortcuts.length} Planned overrides</span>
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
            ⚡ CONTEXTUAL CONFLICT RESOLVER
          </span>
        </div>
      </div>
    </div>
  );
}
