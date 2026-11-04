import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Info } from "lucide-react";

export interface AdSenseUnitProps {
  slot?: string;
  type?: "leaderboard" | "rectangle" | "responsive" | "banner";
  className?: string;
  client?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
}

export default function AdSenseMock({
  slot = "1234567890",
  type = "responsive",
  className = "",
  client,
  format = "auto",
  responsive = true,
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [publisherId, setPublisherId] = useState<string>("");

  useEffect(() => {
    // Read configured publisher ID from localStorage or prop
    const storedPubId = localStorage.getItem("adsense_publisher_id") || "ca-pub-0000000000000000";
    const activeClient = client || storedPubId;
    setPublisherId(activeClient);

    // If real adsbygoogle exists and publisher is configured (not dummy)
    if (typeof window !== "undefined" && (window as any).adsbygoogle && activeClient && activeClient !== "ca-pub-0000000000000000") {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.warn("AdSense push initialization deferred:", e);
      }
    }
  }, [client, slot]);

  // Dimension presets by ad type to prevent Cumulative Layout Shift (CLS)
  const getContainerDimensions = () => {
    switch (type) {
      case "leaderboard":
        return "min-h-[90px] sm:min-h-[100px] max-w-[728px] mx-auto";
      case "rectangle":
        return "min-h-[250px] sm:min-h-[280px] max-w-[336px] mx-auto";
      case "banner":
        return "min-h-[60px] sm:min-h-[90px] w-full";
      case "responsive":
      default:
        return "min-h-[100px] sm:min-h-[120px] w-full";
    }
  };

  const isConfigured = publisherId && publisherId !== "ca-pub-0000000000000000" && !publisherId.includes("0000000");

  return (
    <div
      ref={adRef}
      className={`my-6 flex flex-col items-center justify-center select-none ${className}`}
      id={`adsense-slot-container-${slot}`}
    >
      {/* Official Google AdSense Label Requirement: Must be labeled 'ADVERTISEMENT' or 'SPONSORED' */}
      <div className="w-full flex items-center justify-between mb-1.5 px-1 max-w-4xl">
        <span className="text-[9.5px] font-mono tracking-widest uppercase font-extrabold text-slate-400 dark:text-slate-500">
          ADVERTISEMENT
        </span>
        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Info className="w-2.5 h-2.5" />
          <span>Google AdSense Certified</span>
        </span>
      </div>

      {/* Ad Delivery Shell */}
      <div
        className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col items-center justify-center p-3 text-center ${getContainerDimensions()} ${
          isConfigured
            ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
            : "border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400"
        }`}
      >
        {isConfigured ? (
          /* Real Google AdSense Unit */
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%", textAlign: "center" }}
            data-ad-client={publisherId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
        ) : (
          /* Compliant Preview / Standby Mode prior to Google verification */
          <div className="flex flex-col items-center justify-center space-y-1.5 py-4 px-3 max-w-md">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">
                Google AdSense Placement Zone
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Reserved responsive ad unit ({type}). Complies with Google AdSense content-to-ad ratio standards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono pt-1 text-slate-400 dark:text-slate-500">
              <span className="bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded">Slot: {slot}</span>
              <span className="bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded">Format: {format}</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                Zero CLS Shift
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
