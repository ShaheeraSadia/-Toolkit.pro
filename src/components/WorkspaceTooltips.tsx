import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Info, Sparkles, MousePointerClick, Type, Sliders, CheckSquare, Layers } from "lucide-react";

interface WorkspaceTooltipsProps {
  enabled: boolean;
  theme: "light" | "dark";
}

interface ActiveTooltip {
  rect: DOMRect;
  title: string;
  description: string;
  category: string;
  iconType: "button" | "input" | "number" | "range" | "select" | "checkbox" | "text";
  targetElement: HTMLElement;
}

export function WorkspaceTooltips({ enabled, theme }: WorkspaceTooltipsProps) {
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActiveTooltip(null);
      return;
    }

    let activeEl: HTMLElement | null = null;

    const handleInspectElement = (target: HTMLElement | null) => {
      if (!target) {
        if (activeEl) {
          activeEl.classList.remove("ring-2", "ring-indigo-500", "ring-offset-1", "dark:ring-offset-slate-900");
          activeEl = null;
        }
        setActiveTooltip(null);
        return;
      }

      // Find closest interactive element
      const interactiveEl = target.closest(
        "input, textarea, select, button, [role='button'], a, [data-tooltip]"
      ) as HTMLElement | null;

      if (!interactiveEl) {
        if (activeEl) {
          activeEl.classList.remove("ring-2", "ring-indigo-500", "ring-offset-1", "dark:ring-offset-slate-900");
          activeEl = null;
        }
        setActiveTooltip(null);
        return;
      }

      // Remove ring from previous element if changed
      if (activeEl && activeEl !== interactiveEl) {
        activeEl.classList.remove("ring-2", "ring-indigo-500", "ring-offset-1", "dark:ring-offset-slate-900");
      }

      activeEl = interactiveEl;
      activeEl.classList.add("ring-2", "ring-indigo-500", "ring-offset-1", "dark:ring-offset-slate-900");

      const rect = interactiveEl.getBoundingClientRect();
      const tagName = interactiveEl.tagName.toLowerCase();
      const inputType = (interactiveEl as HTMLInputElement).type || "";

      // Extract title/label
      let title =
        interactiveEl.getAttribute("data-tooltip-title") ||
        interactiveEl.getAttribute("title") ||
        interactiveEl.getAttribute("aria-label") ||
        "";

      if (!title) {
        // Try finding associated label
        if (interactiveEl.id) {
          const labelEl = document.querySelector(`label[for='${interactiveEl.id}']`);
          if (labelEl) {
            title = labelEl.textContent?.trim() || "";
          }
        }
        // Try parent label
        if (!title) {
          const parentLabel = interactiveEl.closest("label");
          if (parentLabel) {
            title = parentLabel.textContent?.replace(interactiveEl.textContent || "", "").trim() || "";
          }
        }
      }

      if (!title) {
        if (tagName === "button" || interactiveEl.getAttribute("role") === "button") {
          title = interactiveEl.innerText?.trim() || interactiveEl.getAttribute("value") || "Interactive Action";
        } else if (tagName === "input") {
          title =
            (interactiveEl as HTMLInputElement).placeholder?.trim() ||
            (interactiveEl as HTMLInputElement).name?.trim() ||
            `${inputType.toUpperCase() || "Text"} Input Field`;
        } else if (tagName === "textarea") {
          title = (interactiveEl as HTMLTextAreaElement).placeholder?.trim() || "Multi-line Text Entry";
        } else if (tagName === "select") {
          title = "Dropdown Option Menu";
        } else {
          title = "Workspace Element";
        }
      }

      // Format clean title
      title = title.replace(/\s+/g, " ").trim();
      if (title.length > 40) {
        title = title.substring(0, 38) + "…";
      }

      // Extract description
      let description = interactiveEl.getAttribute("data-tooltip") || interactiveEl.getAttribute("data-tooltip-desc") || "";

      let category = "Workspace Tool";
      let iconType: ActiveTooltip["iconType"] = "button";

      if (tagName === "button" || interactiveEl.getAttribute("role") === "button") {
        category = "Action Trigger";
        iconType = "button";
        if (!description) {
          description = "Click button to execute command, change active tab, or update setting.";
        }
      } else if (tagName === "input") {
        category = "Data Input";
        if (inputType === "number") {
          iconType = "number";
          if (!description) description = "Numeric field: Type precise numbers, use keyboard arrows, or drag values.";
        } else if (inputType === "range") {
          iconType = "range";
          if (!description) description = "Slider control: Drag handle to fine-tune dimensions, scale, or opacity.";
        } else if (inputType === "checkbox" || inputType === "radio") {
          iconType = "checkbox";
          if (!description) description = "Toggle switch: Click to check or uncheck setting state.";
        } else {
          iconType = "input";
          if (!description) description = "Text input: Enter query keywords, labels, or configuration parameters.";
        }
      } else if (tagName === "textarea") {
        category = "Text Area";
        iconType = "text";
        if (!description) description = "Multi-line field: Paste or edit longer text strings, notes, or raw markup.";
      } else if (tagName === "select") {
        category = "Dropdown Selector";
        iconType = "select";
        if (!description) description = "Option menu: Click to reveal and choose from available workspace presets.";
      }

      setActiveTooltip({
        rect,
        title: title || "Interactive Element",
        description,
        category,
        iconType,
        targetElement: interactiveEl,
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      handleInspectElement(e.target as HTMLElement);
    };

    const handleFocusIn = (e: FocusEvent) => {
      handleInspectElement(e.target as HTMLElement);
    };

    const handleClear = (e: Event) => {
      // Small delay to allow mouse to move to new element
      setTimeout(() => {
        if (document.activeElement && ["input", "textarea", "select", "button"].includes(document.activeElement.tagName.toLowerCase())) {
          return;
        }
      }, 50);
    };

    const handleScrollOrResize = () => {
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        setActiveTooltip((prev) => (prev ? { ...prev, rect } : null));
      }
    };

    window.addEventListener("mouseover", handleMouseOver, true);
    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize, true);

    return () => {
      if (activeEl) {
        activeEl.classList.remove("ring-2", "ring-indigo-500", "ring-offset-1", "dark:ring-offset-slate-900");
      }
      window.removeEventListener("mouseover", handleMouseOver, true);
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize, true);
    };
  }, [enabled]);

  if (!enabled) return null;

  // Calculate coordinates for floating tooltip card
  let popoverTop = 0;
  let popoverLeft = 0;

  if (activeTooltip) {
    const { rect } = activeTooltip;
    const cardWidth = 260;
    const cardHeight = 90;
    const padding = 12;

    // Prefer displaying above element if space permits, otherwise below
    if (rect.top - cardHeight - padding > 0) {
      popoverTop = rect.top - cardHeight - padding + window.scrollY;
    } else {
      popoverTop = rect.bottom + padding + window.scrollY;
    }

    // Center horizontally relative to element
    popoverLeft = rect.left + rect.width / 2 - cardWidth / 2 + window.scrollX;

    // Clamp inside window boundaries
    popoverLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, popoverLeft));
  }

  const getIcon = (type: ActiveTooltip["iconType"]) => {
    switch (type) {
      case "button":
        return <MousePointerClick className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case "number":
      case "range":
        return <Sliders className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case "checkbox":
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case "select":
        return <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      default:
        return <Type className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <>
      {/* Floating Popover Tooltip for Active Hover/Focused Element */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            style={{
              position: "absolute",
              top: `${popoverTop}px`,
              left: `${popoverLeft}px`,
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className={`w-[260px] p-3 rounded-2xl border shadow-2xl backdrop-blur-md select-none ${
              theme === "dark"
                ? "bg-slate-950/90 border-indigo-500/40 text-slate-100 shadow-indigo-950/40"
                : "bg-white/95 border-indigo-200 text-slate-900 shadow-slate-300/50"
            }`}
            id="workspace-contextual-tooltip-popover"
          >
            {/* Header row with badge */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs truncate pr-1">
                {getIcon(activeTooltip.iconType)}
                <span className="truncate text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {activeTooltip.title}
                </span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 font-mono shrink-0">
                {activeTooltip.category}
              </span>
            </div>

            {/* Description content */}
            <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {activeTooltip.description}
            </p>

            {/* Subtle Footer */}
            <div className="mt-1.5 pt-1 border-t border-slate-100/60 dark:border-slate-800/40 flex items-center justify-between text-[8px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Contextual Tooltips Mode
              </span>
              <span className="font-mono">Hover/Focus</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating HUD Pill at bottom-right reminding user Tooltips are Active */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-auto select-none">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md text-xs font-bold ${
            theme === "dark"
              ? "bg-indigo-950/80 border-indigo-700/60 text-indigo-200"
              : "bg-indigo-50/90 border-indigo-200 text-indigo-900"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[11px]">Tooltips Active</span>
        </motion.div>
      </div>
    </>
  );
}
