import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Quote, 
  FileImage, 
  QrCode, 
  Pipette, 
  Cloud, 
  BookOpen, 
  ShieldCheck, 
  Keyboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActiveTab } from "../types";

interface AppTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: "light" | "dark";
}

interface TourStep {
  title: string;
  targetTab?: ActiveTab;
  description: string;
  keyShortcuts?: string[];
  badge: string;
  icon: React.ComponentType<any>;
  tip?: string;
}

export default function AppTourOverlay({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange, 
  theme 
}: AppTourOverlayProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      title: "Welcome to Digital Creator Suite!",
      description: "This is a premium, client-side toolkit designed for digital creators, publishers, and developers. Built with high performance, strict local sandbox security, and offline support.",
      keyShortcuts: ["Alt + T (Theme Swapper)", "Ctrl + K (Seek Commands)"],
      badge: "Intro",
      icon: Sparkles,
      tip: "Everything runs locally in your browser. Rest easy knowing your files never leave your system without permission!"
    },
    {
      title: "Quote Designer Studio",
      targetTab: "quote",
      description: "Build beautiful branding, typography, and visual quotation cards. Customize gradients, frame styles, shadows, and watermarks, then export as high-fidelity PNG on-demand.",
      keyShortcuts: ["Alt + 1"],
      badge: "Module #1",
      icon: Quote,
      tip: "Click presets to apply designer frameworks instantly."
    },
    {
      title: "Lossless Image Compressor",
      targetTab: "compress",
      description: "Directly shrink payload weights of WebP, JPEG, and PNG files. Runs zero-upload browser compression loops instantly, maintaining absolute data privacy and boosting speed scores.",
      keyShortcuts: ["Alt + 2"],
      badge: "Module #2",
      icon: FileImage,
      tip: "You can drag-and-drop image files anywhere on the screen to open them here directly!"
    },
    {
      title: "Robust QR Code Vector Studio",
      targetTab: "qr",
      description: "Generate beautiful custom vector QR codes with logo overlays, color nodes, and custom eye shapes. Includes an industrial-grade A4 layout sheet printer grid to plan and cut real physical labels.",
      keyShortcuts: ["Alt + 3"],
      badge: "Module #3",
      icon: QrCode,
      tip: "Use the Print Sheet wizard to repeat or batch and align multiple barcodes perfectly."
    },
    {
      title: "Color Spectrum Extractor",
      targetTab: "palette",
      description: "Extract color palettes from images, compute WCAG contrast ratios, and check accessibility. Simulates color blindness (Protanopia, Deuteranopia) to ensure compliant UI designs.",
      keyShortcuts: ["Alt + 4"],
      badge: "Module #4",
      icon: Pipette,
      tip: "Hover over color swatches to copy Hex formats directly."
    },
    {
      title: "Cloud Workspace & Synchronizer",
      targetTab: "drive",
      description: "Authenticate to connect your secure workspace directory. Direct back-up channels let you synchronize compressed images, styled quotes, and QR vectors straight to Google Drive in real-time.",
      keyShortcuts: ["Ctrl + D", "Alt + T (Skin Swap)"],
      badge: "Module #5",
      icon: Cloud,
      tip: "Link your Google Workspace Account in the top menu to enable active back-ups!"
    },
    {
      title: "SEO Publications & Guides Hub",
      targetTab: "resources",
      description: "Access curated SEO guidelines, publisher tips, conversion manuals, and web-mastering articles to optimize Core Web Vitals and organic crawler search indexation.",
      keyShortcuts: ["Alt + 5"],
      badge: "Module #6",
      icon: BookOpen,
      tip: "Check out the PageSpeed checklists for swift optimizations."
    },
    {
      title: "Compliance & AdSense Center",
      targetTab: "legal",
      description: "Review legal terms, formal cookie disclosure rules, and privacy assurances. Explore our direct publisher AdSense compliance mock-review simulation dashboard.",
      keyShortcuts: ["Alt + 6"],
      badge: "Module #7",
      icon: ShieldCheck,
      tip: "Use the live feedback logs to ensure your web projects fulfill modern policy criteria."
    },
    {
      title: "Supercharged Keyboard Shortcuts",
      description: "Work like a professional! Navigate the sandbox blazingly fast using active triggers. Toggle the general command console search key anytime to search or switch tools.",
      keyShortcuts: ["Ctrl + K (Palette)", "Shift + ? (Cheat Sheet)", "Escape (Dismiss Modal)"],
      badge: "Pro Tips",
      icon: Keyboard,
      tip: "You can click the 'Shortcuts' launcher badge in the bottom-right corner to open the complete reference listing."
    }
  ];

  const currentStep = steps[currentStepIdx];

  // Auto switch the interface active tab to show the module being highlighted
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep.targetTab) {
      onTabChange(currentStep.targetTab);
    }
  }, [currentStepIdx, isOpen]);

  // Track the coordinates of the highlighted tab button to render the glowing indicator
  useEffect(() => {
    if (!isOpen) return;
    
    const updateHighlight = () => {
      if (!currentStep.targetTab) {
        setHighlightRect(null);
        return;
      }

      const tabId = `tab-select-${currentStep.targetTab}`;
      const element = document.getElementById(tabId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      } else {
        setHighlightRect(null);
      }
    };

    // Calculate immediately and also after active tab rendering delay
    updateHighlight();
    const timer = setTimeout(updateHighlight, 350);

    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight);
    };
  }, [currentStepIdx, isOpen, currentStep.targetTab, activeTab]);

  // Keyboard controls inside the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleFinish();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIdx]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem("toolkit_pro_tour_done", "true");
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const StepIcon = currentStep.icon;

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center p-4 select-none font-sans"
      id="app-tour-overlay-portal"
    >
      {/* 1. Highlight Box Overlay wrapper */}
      <AnimatePresence>
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "smooth", duration: 0.3 }}
            className="absolute rounded-xl pointer-events-none border-2 border-indigo-400 dark:border-amber-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-[101]"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
            }}
          >
            {/* Pulsing visual tag */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 dark:bg-amber-400 text-white dark:text-slate-950 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase whitespace-nowrap animate-pulse">
              Highlighted Tab
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main floating description card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-[105]"
        id="app-tour-info-card"
      >
        {/* Upper visual strip color header */}
        <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400" />

        {/* Modal Content inside */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header row details */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center justify-center px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-305 text-[10px] font-extrabold tracking-widest uppercase rounded-full border border-indigo-100/40 dark:border-indigo-900/30">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {currentStepIdx + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={handleSkip}
                className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-amber-400 transition-colors border-0 bg-transparent cursor-pointer"
              >
                Skip ✕
              </button>
            </div>
          </div>

          {/* Description Block */}
          <div className="flex gap-4.5 items-start text-left">
            <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150/40 dark:border-slate-800/50 shrink-0 text-indigo-600 dark:text-amber-400`}>
              <StepIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className={`text-lg font-black tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>
                {currentStep.title}
              </h3>
              <p className={`text-xs leading-relaxed font-semibold ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Shortcuts Box (if available) */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-800/55 rounded-2xl p-4.5 text-left space-y-3 shadow-3xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Interactive Keyboard Shortcuts
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentStep.keyShortcuts && currentStep.keyShortcuts.length > 0 ? (
                currentStep.keyShortcuts.map((sc, scIdx) => (
                  <kbd 
                    key={scIdx} 
                    className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 text-[10px] font-mono font-bold px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 shadow-3xs"
                  >
                    {sc}
                  </kbd>
                ))
              ) : (
                <span className="text-[10px] text-slate-400 italic">No shortcuts associated</span>
              )}
            </div>
          </div>

          {/* Helpful system advice tip */}
          {currentStep.tip && (
            <div className="flex items-start gap-2 text-left pl-3 border-l-2 border-amber-400 dark:border-amber-400">
              <span className="text-[10.5px] font-medium leading-relaxed italic text-slate-500 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-300 not-italic font-bold">Pro Tip: </strong>
                {currentStep.tip}
              </span>
            </div>
          )}

          {/* Navigation Controls in Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-0 bg-transparent ${
                currentStepIdx === 0 
                  ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" 
                  : "text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {/* Stepper Dots Indicator */}
            <div className="flex gap-1.5 select-none">
              {steps.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  onClick={() => setCurrentStepIdx(dotIdx)}
                  className={`h-1.5 rounded-full transition-all duration-350 cursor-pointer ${
                    dotIdx === currentStepIdx 
                      ? "w-5 bg-indigo-650 dark:bg-amber-400" 
                      : "w-1.5 bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-indigo-650/10 dark:shadow-amber-400/5 transition-all hover:scale-103 active:scale-97 cursor-pointer border-0"
            >
              {currentStepIdx === steps.length - 1 ? "Finish Tour" : "Next Module"}
              {currentStepIdx !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
