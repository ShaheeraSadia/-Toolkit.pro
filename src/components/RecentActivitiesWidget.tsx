import React from "react";
import { 
  Clock, 
  Trash2, 
  Quote, 
  FileImage, 
  QrCode, 
  Pipette, 
  Cloud, 
  BookOpen, 
  ShieldCheck, 
  Activity, 
  Download, 
  Sparkles,
  ChevronRight,
  Video,
  Smartphone,
  FileText,
  RefreshCw,
  Eraser
} from "lucide-react";
import { RecentActivity, ActiveTab } from "../types";

interface RecentActivitiesWidgetProps {
  activities: RecentActivity[];
  onClear: () => void;
  onTabChange: (tab: ActiveTab) => void;
  theme: "light" | "dark";
}

const iconMap: Record<RecentActivity["icon"], React.ComponentType<any>> = {
  Quote,
  FileImage,
  QrCode,
  Pipette,
  Cloud,
  BookOpen,
  ShieldCheck,
  Activity,
  Download,
  Sparkles,
  Video,
  Smartphone,
  FileText,
  RefreshCw,
  Eraser
};

const tabLabelMap: Record<ActiveTab, string> = {
  home: "Dashboard Home",
  quote: "Quote Designer",
  compress: "Image Compressor",
  qr: "QR Generator",
  palette: "Color Extractor",
  video: "Video Creator",
  drive: "Drive Explorer",
  resources: "Guides & SEO",
  legal: "Compliance",
  android: "Android App Studio",
  pdf: "PDF Tools Suite",
  converter: "Image Converter",
  bgremover: "Background Remover"
};

export default function RecentActivitiesWidget({
  activities,
  onClear,
  onTabChange,
  theme
}: RecentActivitiesWidgetProps) {
  if (activities.length === 0) return null;

  return (
    <div 
      className="w-full h-full select-none animate-in fade-in slide-in-from-top-4 duration-300"
      id="dashboard-recent-activities-widget"
    >
      <div 
        className={`rounded-2xl border p-4 sm:p-5 h-full transition-all duration-200 flex flex-col justify-between ${
          theme === "dark"
            ? "bg-slate-900/60 border-slate-800/80 shadow-md shadow-slate-950/20"
            : "bg-white border-slate-200/50 shadow-xs"
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Dashboard Session Trail
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Real-time operation state tracking log of active workspaces
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 transition-all cursor-pointer"
              title="Clear all session operations log"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-450" />
              <span className="hidden sm:inline">Reset logs</span>
            </button>
          </div>

          {/* List of activities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
            {activities.map((activity) => {
              const IconComponent = iconMap[activity.icon] || Activity;
              const isFileActivity = activity.type === "file";
              
              return (
                <div
                  key={activity.id}
                  onClick={() => {
                    if (activity.tab) {
                      onTabChange(activity.tab);
                      const el = document.getElementById(`tab-select-${activity.tab}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all duration-300 ${
                    activity.tab ? "cursor-pointer hover:scale-[1.01]" : ""
                  } ${
                    theme === "dark"
                      ? "border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-indigo-500/40"
                      : "border-slate-100 bg-slate-50/40 hover:bg-white hover:border-indigo-500/30 hover:shadow-2xs"
                  }`}
                  title={activity.tab ? `Switch to ${tabLabelMap[activity.tab]} workspace` : undefined}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      {/* Activity Pill Info Type badge */}
                      <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isFileActivity 
                          ? theme === "dark" ? "bg-emerald-950/45 text-emerald-400" : "bg-emerald-50 text-emerald-800"
                          : theme === "dark" ? "bg-indigo-950/45 text-indigo-400" : "bg-indigo-50 text-indigo-800"
                      }`}>
                        {isFileActivity ? "File Processed" : "Tool Visited"}
                      </span>
                      
                      {/* Timestamp with Clock */}
                      <div className="flex items-center text-[9px] font-mono text-slate-400 dark:text-slate-600 gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isFileActivity 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-indigo-500/10 text-indigo-500"
                      }`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {activity.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium leading-none">
                          {activity.detail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activity.tab && (
                    <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100/40 dark:border-slate-800/30 mt-2">
                      <span className="truncate">Open {tabLabelMap[activity.tab]}</span>
                      <ChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
