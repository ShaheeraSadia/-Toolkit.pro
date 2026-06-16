import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import QRCode from "qrcode";
import { uploadFileToDrive } from "../lib/drive";
import { Cloud, Download, QrCode, Settings, Palette, CheckCircle2, Image, X, Upload, History, Trash2, Printer } from "lucide-react";

interface SavedQr {
  id: string;
  text: string;
  dataUrl: string;
  timestamp: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  logoDataUrl?: string | null;
  useLogo?: boolean;
}

interface QrGeneratorProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => void;
}

export default function QrGenerator({
  user,
  accessToken,
  onRefreshDrive,
  onLogin,
}: QrGeneratorProps) {
  const [text, setText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_text") || "https://app-tool.vercel.app/";
    }
    return "https://app-tool.vercel.app/";
  });
  const [foregroundColor, setForegroundColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_fg_color") || "#0f172a";
    }
    return "#0f172a";
  }); // Dark slate
  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit_pro_qr_bg_color") || "#ffffff";
    }
    return "#ffffff";
  }); // White
  const [size, setSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_size");
      return persisted ? parseInt(persisted) : 300;
    }
    return 300;
  });
  const [margin, setMargin] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_margin");
      return persisted ? parseInt(persisted) : 2;
    }
    return 2;
  });
  const [previewScale, setPreviewScale] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("toolkit_pro_qr_preview_scale");
      return persisted ? parseInt(persisted) : 100;
    }
    return 100;
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("");
  const [useLogo, setUseLogo] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_qr_text", text);
      localStorage.setItem("toolkit_pro_qr_fg_color", foregroundColor);
      localStorage.setItem("toolkit_pro_qr_bg_color", backgroundColor);
      localStorage.setItem("toolkit_pro_qr_size", size.toString());
      localStorage.setItem("toolkit_pro_qr_margin", margin.toString());
      localStorage.setItem("toolkit_pro_qr_preview_scale", previewScale.toString());
    }
  }, [text, foregroundColor, backgroundColor, size, margin, previewScale]);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [savedQrs, setSavedQrs] = useState<SavedQr[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolkit_pro_saved_qrs");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide alert
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Generate QR code base64 every time parameters change
  useEffect(() => {
    generateQr();
  }, [text, foregroundColor, backgroundColor, size, margin, logoDataUrl, useLogo]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setLogoDataUrl(event.target.result);
        setUseLogo(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoDataUrl(null);
    setLogoName("");
  };

  const generateQr = async () => {
    if (!text.trim()) {
      setQrCodeDataUrl(null);
      return;
    }

    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    setIsGenerating(true);

    qrTimeoutRef.current = setTimeout(async () => {
      try {
        // Create offscreen canvas to generate the complete QR
        const canvas = document.createElement("canvas");
        await QRCode.toCanvas(canvas, text, {
          width: size,
          margin: margin,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
          errorCorrectionLevel: "H", // H is high error correction level, perfect for logo overlays!
        });

        // If useLogo and logoDataUrl is available, overlay centered logo
        if (useLogo && logoDataUrl) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const img = new Image();
            img.src = logoDataUrl;
            await new Promise<void>((resolve) => {
              img.onload = () => {
                // Logo size is approximately 22% of QR size
                const logoSize = Math.max(24, Math.floor(size * 0.22));
                const x = (size - logoSize) / 2;
                const y = (size - logoSize) / 2;

                // Clear background behind logo with a bit of quiet spacing margin
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);

                // Draw image centered
                ctx.drawImage(img, x, y, logoSize, logoSize);
                resolve();
              };
              img.onerror = () => {
                console.error("Failed to load logo image");
                resolve();
              };
            });
          }
        }

        const dataUrl = canvas.toDataURL("image/png");
        setQrCodeDataUrl(dataUrl);

        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "file",
            title: "Generated QR Code",
            detail: `Created QR tracking module for "${text.length > 25 ? text.substring(0, 25) + "..." : text}"`,
            icon: "QrCode",
            tab: "qr"
          }
        }));
      } catch (err) {
        console.error("QR Code Generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 550);
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement("a");
    const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";
    const downloadName = `toolkit_pro_qr_${safeText}.png`;
    link.download = downloadName;
    link.href = qrCodeDataUrl;
    link.click();

    window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
      detail: {
        type: "file",
        title: "Downloaded QR Code",
        detail: `Exported ${downloadName} locally`,
        icon: "Download",
        tab: "qr"
      }
    }));
  };

  const handleSaveToDrive = async () => {
    if (!user || !accessToken || !qrCodeDataUrl) {
      onLogin();
      return;
    }

    const confirmSave = window.confirm(
      "Save this customized QR Code image to your Google Drive?"
    );
    if (!confirmSave) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const safeText = text.replace(/[^a-z0-9]/gi, "_").substring(0, 25).toLowerCase() || "code";
      const filename = `QR_Code_${safeText || "vector"}.png`;

      await uploadFileToDrive(accessToken, filename, "image/png", qrCodeDataUrl);
      setSaveStatus({
        success: true,
        msg: `Successfully uploaded "${filename}" to Google Drive!`,
      });
      onRefreshDrive();

      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "file",
          title: "Saved QR to Drive",
          detail: `Uploaded "${filename}" successfully`,
          icon: "Cloud",
          tab: "qr"
        }
      }));
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        success: false,
        msg: err.message || "Failed to save QR Code to Google Drive.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!qrCodeDataUrl) return;

    const newSaved: SavedQr = {
      id: Date.now().toString(),
      text: text,
      dataUrl: qrCodeDataUrl,
      timestamp: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }) + " " + new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      size: size,
      foregroundColor: foregroundColor,
      backgroundColor: backgroundColor,
      logoDataUrl: logoDataUrl,
      useLogo: useLogo,
    };

    const updated = [newSaved, ...savedQrs];
    setSavedQrs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_saved_qrs", JSON.stringify(updated));
    }
    
    setSaveStatus({
      success: true,
      msg: "Custom QR Code successfully added to your offline local gallery!",
    });
  };

  const handleLoadSaved = (item: SavedQr) => {
    setText(item.text);
    setForegroundColor(item.foregroundColor);
    setBackgroundColor(item.backgroundColor);
    setSize(item.size);
    if (item.logoDataUrl) {
      setLogoDataUrl(item.logoDataUrl);
      setLogoName("Loaded Logo");
    } else {
      setLogoDataUrl(null);
      setLogoName("");
    }
    if (item.useLogo !== undefined) {
      setUseLogo(item.useLogo);
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedQrs.filter((item) => item.id !== id);
    setSavedQrs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolkit_pro_saved_qrs", JSON.stringify(updated));
    }
  };

  const handleDownloadSaved = (item: SavedQr, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    const safeText = item.text.replace(/[^a-z0-9]/gi, "_").substring(0, 20).toLowerCase() || "qr";
    link.download = `toolkit_pro_qr_${safeText}.png`;
    link.href = item.dataUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      {/* Parameters Controls Row: 5 Cols */}
      <div className="lg:col-span-12 xl:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1 col-span-1 border-0">
            <Settings className="w-4 h-4 text-indigo-500" /> Vector Settings
          </h3>
          <p className="text-xs text-slate-500">
            Specify links, content, and colors to generate beautiful vector tracking modules instantly.
          </p>
        </div>

        {/* Input Target url */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Text or URL</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. https://google.com/"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
        </div>

        {/* Design options */}
        <div className="space-y-4 pt-3 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Styling Presets
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Foreground Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-full text-center text-xs border border-slate-200 rounded px-1.5 py-1 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Background Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full text-center text-xs border border-slate-200 rounded px-1.5 py-1 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Layout Size (px)</label>
                <input
                  type="range"
                  min="150"
                  max="400"
                  step="25"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-650 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">{size}x{size} px</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Quiet Zone Padding</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full accent-indigo-650 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">{margin} blocks</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-slate-500">Preview Scale</label>
                <button
                  type="button"
                  onClick={() => setPreviewScale(100)}
                  className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer bg-transparent border-0"
                  title="Reset preview scale to 100%"
                >
                  Reset (100%)
                </button>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={previewScale}
                onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                className="w-full accent-indigo-650 cursor-pointer"
              />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block text-right mt-0.5">{previewScale}% visual zoom</span>
            </div>
          </div>

          {/* Logo Overlay Customizer */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-500" /> Center Logo Overlay
              </label>
              {logoDataUrl && (
                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={useLogo} 
                      onChange={(e) => setUseLogo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-1.5 text-[10px] font-medium text-slate-500">
                      {useLogo ? "Active" : "Disabled"}
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            {!logoDataUrl ? (
              <div className="relative border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="qr-logo-upload"
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors mb-1.5" />
                  <p className="text-[11px] font-medium text-slate-600">
                    Upload Custom Center Logo Image
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    PNG, JPG or SVG (Max 1MB). Rendered centered.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                    <img 
                      src={logoDataUrl} 
                      alt="Logo Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={logoName}>
                      {logoName}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Size: ~{Math.round(logoDataUrl.length / 1.33 / 1024)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                  title="Remove logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen Preview: 7 Cols */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-between space-y-4">
        {saveStatus && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center ${
              saveStatus.success
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            <Cloud className={`w-5 h-5 mr-2.5 ${saveStatus.success ? "text-emerald-500" : "text-rose-500"}`} />
            {saveStatus.msg}
          </div>
        )}

        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-3.5 sm:p-6 min-h-[280px] sm:min-h-[350px]">
          {/* Visual scale control bar directly contextualized to the preview card */}
          {qrCodeDataUrl && !isGenerating && (
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4 gap-3 select-none">
              <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-500 animate-pulse" /> Vector Canvas Stage
              </span>
              <div className="flex items-center gap-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1 shrink-0">
                  Preview Scale:
                </span>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="5"
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                  className="w-20 sm:w-28 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
                <span className="text-[10.5px] font-extrabold text-indigo-650 dark:text-indigo-400 font-mono w-9 text-right shrink-0">
                  {previewScale}%
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center">
            {isGenerating ? (
              <div className="space-y-4 flex flex-col items-center animate-pulse">
                <div className="p-4 bg-white shadow-xl rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden w-48 h-48 relative">
                  <div className="grid grid-cols-2 gap-2 w-full h-full p-2 opacity-25">
                    <div className="border-4 border-slate-800 rounded w-12 h-12" />
                    <div className="border-4 border-slate-800 rounded w-12 h-12 justify-self-end" />
                    <div className="border-4 border-slate-800 rounded w-12 h-12 mt-auto" />
                    <div className="bg-slate-800 rounded w-12 h-12 justify-self-end mt-auto flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="h-4 bg-slate-300 rounded w-32 mt-2" />
                <div className="h-3 bg-slate-200 rounded-full w-48 mt-1" />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="space-y-4 flex flex-col items-center select-all">
                <div 
                  id="qr-code-preview-card" 
                  className="print-ready-qr-card bg-white shadow-xl rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden transition-all duration-250 select-none"
                  style={{
                    padding: `${Math.round(16 * (previewScale / 100))}px`,
                    width: `${Math.round((Math.min(260, size) + 32) * (previewScale / 100))}px`,
                    height: `${Math.round((Math.min(260, size) + 32) * (previewScale / 100))}px`,
                  }}
                >
                  <img
                    src={qrCodeDataUrl}
                    alt="Custom QR Code"
                    style={{ width: "100%", height: "100%" }}
                    className="max-w-full"
                  />
                </div>
                <div className="text-center font-sans">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300 break-all px-4 max-w-sm">
                    {text}
                  </p>
                  <div className="inline-flex items-center text-[10px] text-emerald-600 font-semibold gap-1 mt-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Code Vectorized Successfully
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <QrCode className="w-12 h-12 text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-700">QR Stage is waiting</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Draft an URL links on the left side to compile high-resolution instant scan module.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync execution row */}
        {qrCodeDataUrl && (
          <div className="flex flex-col md:flex-row gap-3 pt-3">
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-download-qr"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Download Local PNG
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-indigo-200 hover:bg-indigo-50 rounded-xl bg-indigo-50/20 text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-print-qr"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Print QR Code
            </button>

            <button
              onClick={handleSaveToHistory}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-indigo-200 hover:bg-indigo-50 rounded-xl bg-indigo-50/40 text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer border-0"
              id="btn-save-qr-history"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Save to History
            </button>

            {user ? (
              <button
                onClick={handleSaveToDrive}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50 border-0"
                id="btn-save-qr-drive"
              >
                <Cloud className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" />
                {isSaving ? "Saving to Drive..." : "Sync to GDrive"}
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-250 font-semibold text-xs transition-all border-0"
                title="Authenticate Drive upload via your Google Workspace account"
                id="btn-prompt-login-qr"
              >
                <Cloud className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Sign in for GDrive
              </button>
            )}
          </div>
        )}

        {/* Saved QR Codes Offline History Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-2xs space-y-3 mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-500" /> Saved QR History ({savedQrs.length})
            </h4>
            {savedQrs.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your local QR code history?")) {
                    setSavedQrs([]);
                    localStorage.removeItem("toolkit_pro_saved_qrs");
                  }
                }}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer bg-transparent border-0"
              >
                Clear All
              </button>
            )}
          </div>

          {savedQrs.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-xs text-slate-400 italic">No saved QR codes in your local storage yet.</p>
              <p className="text-[10px] text-slate-300 mt-1">Design a QR Code and click "Save to History" to persist it offline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
              {savedQrs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadSaved(item)}
                  className="p-2.5 rounded-xl border border-slate-150 bg-slate-50/40 hover:bg-indigo-50/10 hover:border-indigo-200 transition-all cursor-pointer relative group flex items-start gap-2.5"
                  title="Click anywhere on this card to load its layout settings"
                >
                  {/* Thumbnail snippet */}
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative select-none">
                    <img src={item.dataUrl} alt="History thumb" className="w-8.5 h-8.5 object-contain" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <p className="text-xs font-bold text-slate-700 truncate block leading-tight">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-400 font-mono">
                        {item.timestamp}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: item.foregroundColor }}
                        title={`FG: ${item.foregroundColor}`}
                      />
                    </div>
                  </div>

                  {/* Immediate operations options */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={(e) => handleDownloadSaved(item, e)}
                      className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-700 transition-all cursor-pointer shadow-3xs"
                      title="Quick Download PNG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSaved(item.id, e)}
                      className="p-1 rounded bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-3xs"
                      title="Delete from History"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
