import React, { useState, useEffect } from "react";
import { X, Star, MessageSquare, Send, CheckCircle2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

interface SubmittedFeedback {
  id: string;
  rating: number;
  commentary: string;
  timestamp: string;
}

export default function FeedbackModal({ isOpen, onClose, theme }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentary, setCommentary] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [pastFeedbacks, setPastFeedbacks] = useState<SubmittedFeedback[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load any previously completed feedbacks from offline storage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem("toolkit_pro_user_feedback");
      if (stored) {
        setPastFeedbacks(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  const handleRatingSelect = (val: number) => {
    setRating(val);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating star to evaluate your experience.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Simulate high-fidelity backend logging loop
    setTimeout(() => {
      const newFeedback: SubmittedFeedback = {
        id: Math.random().toString(36).substring(2, 9),
        rating,
        commentary: commentary.trim(),
        timestamp: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      try {
        const updatedList = [newFeedback, ...pastFeedbacks];
        localStorage.setItem("toolkit_pro_user_feedback", JSON.stringify(updatedList));
        setPastFeedbacks(updatedList);
      } catch (err) {
        console.error(err);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      // Reset form controls
      setRating(0);
      setCommentary("");
    }, 1000);
  };

  const handleClose = () => {
    setSubmitSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4 select-none font-sans"
      id="feedback-dialog-portal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative"
        id="feedback-card-container"
      >
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-indigo-500 to-amber-400" />

        {/* Modal Close Button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-100 transition-colors border-0 bg-transparent cursor-pointer"
          title="Dismiss Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {!submitSuccess ? (
              <motion.div
                key="feedback-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Header */}
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2 text-indigo-650 dark:text-amber-400">
                    <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-amber-450" />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      Share Your Thoughts
                    </span>
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                    Send Toolkit Pro Feedback
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 leading-normal font-semibold">
                    We're committed to building high-fidelity client utilities. Your input helps optimize performance and guide feature design.
                  </p>
                </div>

                {/* Form starts */}
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  {/* Interactive Star Picker */}
                  <div className="space-y-2">
                    <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Overall Experience Rating
                    </label>
                    <div className="flex items-center gap-2.5">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isActive = starVal <= (hoverRating || rating);
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => handleRatingSelect(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="bg-transparent border-0 p-1 cursor-pointer transition-transform hover:scale-115 active:scale-95 focus:outline-none"
                            title={`Rate ${starVal} Star(s)`}
                          >
                            <Star 
                              className={`w-8 h-8 transition-colors duration-205 ${
                                isActive 
                                  ? "fill-amber-450 text-amber-450 dark:fill-amber-400 dark:text-amber-400" 
                                  : "text-slate-200 dark:text-slate-800"
                              }`}
                            />
                          </button>
                        );
                      })}
                      {rating > 0 && (
                        <span className="ml-2 font-mono text-xs font-black text-amber-500 dark:text-amber-405">
                          {rating} / 5 Rating
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commentary Box */}
                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Comments or Suggestions
                    </label>
                    <textarea
                      rows={4}
                      value={commentary}
                      onChange={(e) => setCommentary(e.target.value)}
                      placeholder="What do you enjoy about Toolkit Pro? Is there something we can polish or introduce next?"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-indigo-500/30 transition-all leading-relaxed"
                    />
                  </div>

                  {/* Errors */}
                  {errorMessage && (
                    <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">
                      ⚠ {errorMessage}
                    </p>
                  )}

                  {/* Action row button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4.5 py-2.5 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-650 dark:text-slate-350 rounded-xl transition-all cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border-0 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Commentary</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Success screen state */
              <motion.div
                key="feedback-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-6 text-center space-y-4"
              >
                <div className="mx-auto w-12 h-12 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-lg font-black tracking-tight ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-slate-450 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    We've securely registered your rating on this device. Your recommendations are incredibly helpful in guiding open-source sandbox developments.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-350 rounded-xl transition-all border-0 cursor-pointer"
                  >
                    Close Dialog
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past reviews log sidebar (inside modal as collapse/history expander) */}
          {pastFeedbacks.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-left space-y-2.5">
              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Your Feedback Logs ({pastFeedbacks.length})
              </span>
              <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
                {pastFeedbacks.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-150/40 dark:border-slate-850 outline-none text-[10.5px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${
                              i < item.rating 
                                ? "fill-amber-450 text-amber-450" 
                                : "text-slate-205 dark:text-slate-800"
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-[8.5px] text-slate-400 font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                    {item.commentary && (
                      <p className="text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                        "{item.commentary}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
