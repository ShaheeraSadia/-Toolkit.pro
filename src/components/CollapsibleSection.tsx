import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Sliders } from "lucide-react";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  icon: Icon = Sliders,
  badge,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  action,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:border-blue-500/30 ${className}`}
    >
      <div
        onClick={handleToggle}
        className="w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h4>
              {badge && (
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-150 dark:border-slate-800/80"
          >
            <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
