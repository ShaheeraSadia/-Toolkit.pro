import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Folder, 
  Save, 
  Trash2, 
  Loader2, 
  Download, 
  X, 
  Cloud, 
  FileJson, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Clock,
  HardDrive
} from "lucide-react";
import { getOrCreateFolder, uploadFileToDrive, deleteDriveFile, downloadDriveFile } from "../lib/drive";

interface VideoPresetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  accessToken: string | null;
  onLogin: () => void;
  currentTimeline: any[];
  onLoadTimeline: (timeline: any[]) => void;
  currentFps: number;
  onLoadFps: (fps: number) => void;
  currentSettings: {
    videoQuality: "balanced" | "high" | "performance";
    videoRealismStyle: "documentary" | "imax" | "analog_film" | "standard";
    loopVideo: boolean;
    autoEnhanceVideoPrompt: boolean;
    vignetteOverlay: boolean;
    filmGrainOverlay: boolean;
    atmosphericOverlay: "none" | "particles" | "snow" | "rain" | "light-leaks";
    superResolution: boolean;
  };
  onLoadSettings: (settings: any) => void;
}

export default function VideoPresetsDrawer({
  isOpen,
  onClose,
  user,
  accessToken,
  onLogin,
  currentTimeline,
  onLoadTimeline,
  currentFps,
  onLoadFps,
  currentSettings,
  onLoadSettings
}: VideoPresetsDrawerProps) {
  const [presets, setPresets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [presetName, setPresetName] = useState<string>("");
  const [presetDesc, setPresetDesc] = useState<string>("");
  const [presetsFolderId, setPresetsFolderId] = useState<string>("");
  
  // States for confirm deletions & loads
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loadConfirmId, setLoadConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchPresets();
    }
  }, [isOpen, accessToken]);

  const fetchPresets = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setError("");
      
      // Get or create dedicated folder for video presets
      const folderId = await getOrCreateFolder(accessToken, "AI Video Creator Presets");
      setPresetsFolderId(folderId);

      const q = `'${folderId}' in parents and trashed = false`;
      const fields = "files(id, name, mimeType, createdTime, size, description)";
      const url = `https://www.googleapis.com/drive/v3/files?orderBy=createdTime desc&fields=${encodeURIComponent(fields)}&q=${encodeURIComponent(q)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load presets: ${response.statusText}`);
      }

      const data = await response.json();
      setPresets(data.files || []);
    } catch (err: any) {
      setError(err.message || "Failed to load presets from Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please sign in with Google to save presets.");
      return;
    }
    if (!presetName.trim()) {
      setError("Please enter a preset name.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      // Ensure we have folder ID
      let folderId = presetsFolderId;
      if (!folderId) {
        folderId = await getOrCreateFolder(accessToken, "AI Video Creator Presets");
        setPresetsFolderId(folderId);
      }

      // Structure our video preset document
      const presetData = {
        version: "1.0",
        type: "video-preset",
        name: presetName.trim(),
        description: presetDesc.trim() || "No description provided.",
        createdTime: new Date().toISOString(),
        timeline: currentTimeline,
        videoFps: currentFps,
        settings: currentSettings
      };

      // Convert JSON structure to a file data URL
      const jsonString = JSON.stringify(presetData, null, 2);
      const base64DataUrl = "data:application/json;base64," + btoa(unescape(encodeURIComponent(jsonString)));
      
      const safeFilename = `${presetName.trim().replace(/[^a-zA-Z0-9 _-]/g, "")}.json`;

      await uploadFileToDrive(
        accessToken,
        safeFilename,
        "application/json",
        base64DataUrl,
        folderId,
        presetDesc.trim() || "AI Video Creator Saved Workspace Preset"
      );

      setPresetName("");
      setPresetDesc("");
      setSuccessMessage("Preset successfully saved to Google Drive!");
      
      // Auto dismiss success
      setTimeout(() => setSuccessMessage(""), 4000);
      
      // Refresh the list
      await fetchPresets();
    } catch (err: any) {
      setError(err.message || "Failed to save preset to Google Drive.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPreset = async (fileId: string) => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await downloadDriveFile(accessToken, fileId);
      
      if (!data || data.type !== "video-preset") {
        throw new Error("Invalid preset file format. This file does not appear to be an AI Video Creator preset.");
      }

      // Apply to workspace
      if (data.timeline && Array.isArray(data.timeline)) {
        onLoadTimeline(data.timeline);
      }
      if (typeof data.videoFps === "number") {
        onLoadFps(data.videoFps);
      }
      if (data.settings) {
        onLoadSettings(data.settings);
      }

      setSuccessMessage(`Preset "${data.name || 'Workspace'}" successfully loaded!`);
      setLoadConfirmId(null);
      onClose(); // Close drawer upon successful load

      // Auto dismiss success
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to download and load preset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreset = async (fileId: string) => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      await deleteDriveFile(accessToken, fileId);
      setSuccessMessage("Preset deleted successfully.");
      setDeleteConfirmId(null);
      
      // Refresh the list
      await fetchPresets();
    } catch (err: any) {
      setError(err.message || "Failed to delete preset from Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return "Unknown";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-[100] cursor-pointer"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[101] overflow-hidden flex flex-col text-slate-800 dark:text-slate-100"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <HardDrive className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Drive Video Presets
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Cloud Storage Synchronization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Main Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              
              {/* Info Messages */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl border border-rose-200/40 dark:border-rose-900/20 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="font-bold">{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-250 dark:border-emerald-900/20 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 animate-bounce" />
                  <span className="font-bold">{successMessage}</span>
                </div>
              )}

              {/* Check Authentication status */}
              {!accessToken ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Connect Google Drive
                    </h4>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed px-2">
                      Authorize access to save your timelines, frame rates, and export settings securely directly inside Google Drive.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogin();
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    🔑 Sync Google Account
                  </button>
                </div>
              ) : (
                <>
                  {/* Save Preset Section */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Save Current Workspace</span>
                      </h4>
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                        {currentTimeline.length} Clip{currentTimeline.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <form onSubmit={handleSavePreset} className="space-y-2.5">
                      <div className="space-y-1 text-left">
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                          Preset Name:
                        </label>
                        <input
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="e.g., Epic Cinematic Loop"
                          className="w-full px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                          Description (Optional):
                        </label>
                        <textarea
                          rows={2}
                          value={presetDesc}
                          onChange={(e) => setPresetDesc(e.target.value)}
                          placeholder="What makes this template special?"
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving || !presetName.trim()}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-150 disabled:to-slate-150 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/15"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to Drive...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Backup Workspace to Drive</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Saved Presets Cloud List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Saved Drive Templates ({presets.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={fetchPresets}
                        disabled={isLoading}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer transition-colors"
                        title="Reload from Drive"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
                      </button>
                    </div>

                    {isLoading && presets.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Querying Cloud Files...</span>
                      </div>
                    ) : presets.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-6 bg-slate-50/40 dark:bg-slate-900/20">
                        <FileJson className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          No Presets Found
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-1 max-w-xs mx-auto">
                          Create a custom name above to save your animation timelines, frames rates and video quality settings directly in Google Drive.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {presets.map((preset) => {
                          const isDeleteConfirm = deleteConfirmId === preset.id;
                          const isLoadConfirm = loadConfirmId === preset.id;

                          return (
                            <div 
                              key={preset.id}
                              className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 hover:border-indigo-100 dark:hover:border-indigo-950 rounded-xl transition-all space-y-2 group text-left shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <h5 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1" title={preset.name}>
                                    <span className="text-indigo-500 shrink-0">🎬</span>
                                    <span className="truncate">{preset.name.replace(/\.json$/, "")}</span>
                                  </h5>
                                  {preset.description && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-2 pr-1 font-medium">
                                      {preset.description}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[8.5px] font-bold font-mono text-slate-400 dark:text-slate-500 shrink-0 bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                  {formatSize(preset.size)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-50 dark:border-slate-900 pt-2 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(preset.createdTime)}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Delete flow */}
                                  {isDeleteConfirm ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePreset(preset.id)}
                                        className="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[8.5px] font-extrabold cursor-pointer transition-colors"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded text-[8.5px] font-extrabold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : isLoadConfirm ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleLoadPreset(preset.id)}
                                        className="px-1.5 py-0.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[8.5px] font-extrabold cursor-pointer transition-colors"
                                      >
                                        Yes, Load
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setLoadConfirmId(null)}
                                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded text-[8.5px] font-extrabold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setLoadConfirmId(preset.id)}
                                        className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded text-[9px] font-extrabold cursor-pointer transition-colors"
                                      >
                                        <Download className="w-2.5 h-2.5" />
                                        <span>Load</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmId(preset.id)}
                                        className="p-1 text-slate-350 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded cursor-pointer transition-colors"
                                        title="Delete Preset"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Informative Help Guide */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-850/80 text-left space-y-1.5">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>What saves inside a Preset?</span>
                </h5>
                <ul className="text-[9.5px] text-slate-400 dark:text-slate-500 space-y-1 list-disc pl-4 leading-relaxed font-semibold">
                  <li>Full animation timeline sequences & all configured slides.</li>
                  <li>Subject descriptions, camera moves, and custom effects.</li>
                  <li>Video export frame rates (FPS).</li>
                  <li>Visual engine settings: Quality style presets, Realism models, overlays, and more.</li>
                </ul>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
