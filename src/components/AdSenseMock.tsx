import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, Info } from "lucide-react";

interface AdSenseMockProps {
  slot: string;
  type: "leaderboard" | "rectangle" | "responsive";
  className?: string;
}

export default function AdSenseMock({ slot, type, className = "" }: AdSenseMockProps) {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Satisfy strict programmatic Google AdSense client execution
    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.log("Programmatic AdSense block pushed locally or bypassed due to sandbox:", e);
    }

    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const getDimensions = () => {
    switch (type) {
      case "leaderboard":
        return "w-full min-h-[90px] max-h-[100px] sm:h-[90px]";
      case "rectangle":
        return "w-full max-w-[336px] min-h-[280px]";
      case "responsive":
      default:
        return "w-full h-auto min-h-[120px] max-h-[250px]";
    }
  };

  return (
    <div
      className={`relative mx-auto bg-slate-50/80 border border-slate-200/60 rounded-xl overflow-hidden shadow-inner transition-all duration-500 flex flex-col justify-between p-3 select-none ${getDimensions()} ${className}`}
      id={`adsense-slot-${slot}`}
    >
      {/* Real programmatic Google AdSense DOM registration box required for compliance crawls */}
      <div className="absolute inset-0 z-0 opacity-100 overflow-hidden" style={{ pointerEvents: "auto" }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client="ca-pub-9923838483828383"
          data-ad-slot={slot}
          data-ad-format={type === "leaderboard" ? "horizontal" : type === "rectangle" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      </div>

      {/* Structured backup elements inside a relative overlay layer */}
      <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
        {/* Header Info */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 tracking-wider">
          <span className="bg-slate-200/55 text-slate-550 px-1.5 py-0.5 rounded uppercase pointer-events-auto">
            Advertisement
          </span>
          <span className="flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer pointer-events-auto">
            <Info className="w-2.5 h-2.5" /> AdChoices
          </span>
        </div>

        {adLoaded ? (
          <div className="flex-1 flex flex-col items-center justify-center py-2 animate-fade-in">
            {/* Simulated Premium Ad content */}
            {type === "leaderboard" && (
              <div className="flex flex-col sm:flex-row items-center justify-between w-full px-4 sm:px-6 gap-2 pointer-events-auto">
                <div className="text-left">
                  <span className="inline-block px-1.5 py-0.5 text-[8px] bg-indigo-50 text-indigo-600 font-bold rounded uppercase mb-0.5">
                    Sponsored Code
                  </span>
                  <h5 className="text-xs font-bold text-indigo-950 leading-none">
                    Workspace Cloud Backup API v2.6
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    Automate full-lifecycle server exports cleanly with zero infrastructure.
                  </p>
                </div>
                <a
                  href="#adsense-learn-more"
                  className="bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                >
                  Learn More
                </a>
              </div>
            )}

            {type === "rectangle" && (
              <div className="flex flex-col items-center text-center p-2 space-y-3 pointer-events-auto">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow">
                  GP
                </div>
                <div>
                  <span className="inline-block px-1.5 py-0.5 text-[8px] bg-emerald-50 text-emerald-700 font-bold rounded uppercase mb-1">
                    Active Partner
                  </span>
                  <h5 className="text-xs font-extrabold text-slate-900">
                    Secure PDF Compressor Pro
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[240px] mt-1">
                    Downsize catalogs and legal documents with ultra-secure AES encryption layers.
                  </p>
                </div>
                <button className="bg-slate-950 text-white text-[10px] font-bold px-4 py-2 rounded-lg w-full hover:bg-slate-900 transition-shadow">
                  Get Started Free
                </button>
              </div>
            )}

            {type === "responsive" && (
              <div className="flex items-center justify-between w-full px-4 gap-4 pointer-events-auto">
                <div className="text-left">
                  <span className="inline-block px-1.5 py-0.5 text-[8px] bg-indigo-50 text-indigo-605 font-bold rounded uppercase mb-1">
                    AdSense Network Spot
                  </span>
                  <h5 className="text-xs font-extrabold text-slate-800">
                    Premium Vector Graphics API
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Download 1,200+ microicons, custom avatars, and CSS wave pattern styles.
                  </p>
                </div>
                <button className="bg-slate-900 text-white text-[10px] font-semibold px-3.5 py-1.5 rounded-lg select-none shrink-0">
                  Explore
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Squeaky clean loading simulator */
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-ping" />
              <span>Configuring AdSense Unit (Slot #{slot})...</span>
            </div>
          </div>
        )}

        {/* Footer code identifier required for programmatic compliance */}
        <div className="text-[8px] text-slate-450 text-right opacity-60 font-mono select-none pointer-events-auto">
          google_ad_client = "ca-pub-toolkit-pro"; slot_id = "{slot}"
        </div>
      </div>
    </div>
  );
}
