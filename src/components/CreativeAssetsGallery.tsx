import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Download, 
  Share2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  FileImage, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  ArrowUpDown, 
  Filter, 
  Move,
  LayoutGrid,
  Info
} from "lucide-react";
import { DriveFile } from "../types";
import { renameDriveFile, deleteDriveFile, moveDriveFile } from "../lib/drive";

interface CreativeAssetsGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  files: DriveFile[];
  accessToken: string | null;
  onRefresh: () => void;
  onSelectTab: (tab: string) => void;
}

export default function CreativeAssetsGallery({
  isOpen,
  onClose,
  files,
  accessToken,
  onRefresh,
  onSelectTab,
}: CreativeAssetsGalleryProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "size" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "quote" | "compress" | "qr" | "palette" | "general">("all");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Share Modal State
  const [sharingFile, setSharingFile] = useState<DriveFile | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Rename Modal State
  const [renamingFile, setRenamingFile] = useState<DriveFile | null>(null);
  const [newNameInput, setNewNameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Use in Tool Spinner
  const [loadingToolTarget, setLoadingToolTarget] = useState<{ name: string; tab: string } | null>(null);

  // Filter image files
  const imageFiles = files.filter(f => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    const isImgMime = f.mimeType.startsWith("image/");
    const isImgExt = ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
    return isImgMime || isImgExt;
  });

  // Category classification helper
  const getFileCategory = (name: string): "quote" | "compress" | "qr" | "palette" | "general" => {
    const lower = name.toLowerCase();
    if (lower.includes("quote_designer") || lower.includes("quote-designer")) return "quote";
    if (lower.includes("compressed") || lower.includes("optimized") || lower.includes("compressor")) return "compress";
    if (lower.includes("qr_code") || lower.includes("qr-code") || lower.includes("qr_") || lower.includes("qrcode")) return "qr";
    if (lower.includes("palette") || lower.includes("color_extractor")) return "palette";
    return "general";
  };

  // Filter & Search Logic
  const filteredFiles = imageFiles.filter(file => {
    // Search filter
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    if (filterType === "all") return matchesSearch;
    const cat = getFileCategory(file.name);
    return matchesSearch && cat === filterType;
  });

  // Sort Logic
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    if (sortBy === "date") {
      valA = new Date(a.createdTime).getTime();
      valB = new Date(b.createdTime).getTime();
    } else if (sortBy === "size") {
      valA = parseInt(a.size || "0", 10);
      valB = parseInt(b.size || "0", 10);
    } else {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Listen to Escape / Arrow Keys for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else if (sharingFile !== null) {
          setSharingFile(null);
        } else if (renamingFile !== null) {
          setRenamingFile(null);
        } else {
          onClose();
        }
      }
      if (lightboxIndex !== null) {
        if (e.key === "ArrowLeft") {
          setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : sortedFiles.length - 1));
        }
        if (e.key === "ArrowRight") {
          setLightboxIndex(prev => (prev !== null && prev < sortedFiles.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, lightboxIndex, sortedFiles]);

  if (!isOpen) return null;

  // Formatting helpers
  const getHiResImage = (link?: string) => {
    if (!link) return "";
    return link.replace(/=s\d+(-c)?$/, "=s1000");
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "0 B";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return bytesStr;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Direct Browser Download
  const handleDownload = async (file: DriveFile) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download file from Drive");
      const blob = await response.blob();

      // Open target link
      try {
        const adLink = document.createElement("a");
        adLink.href = "https://omg10.com/4/11170621";
        adLink.target = "_blank";
        adLink.rel = "noopener noreferrer";
        document.body.appendChild(adLink);
        adLink.click();
        document.body.removeChild(adLink);
      } catch (e) {
        console.error(e);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Activity log dispatch
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "download",
          title: "Downloaded Creative Asset",
          detail: `Downloaded "${file.name}" to your local device`,
          icon: "Download",
        }
      }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to download file.");
    }
  };

  // Download Selected (Zip or batch download)
  const handleDownloadSelected = async () => {
    const selectedFiles = sortedFiles.filter(f => selectedIds.includes(f.id));
    if (selectedFiles.length === 0) return;
    
    const confirmDownload = window.confirm(`Download all ${selectedFiles.length} selected files?`);
    if (!confirmDownload) return;

    for (const f of selectedFiles) {
      await handleDownload(f);
      // Brief delay to prevent browser block
      await new Promise(r => setTimeout(r, 250));
    }
  };

  // Use in Tool core logic
  const handleUseInTool = async (file: DriveFile, targetTab: string, toolName: string) => {
    if (!accessToken) return;
    setLoadingToolTarget({ name: toolName, tab: targetTab });
    
    try {
      // 1. Download file content as blob & convert to base64 Data URL
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download asset data from Drive");
      
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 2. Switch tab
      onSelectTab(targetTab);
      
      // 3. Wait for component mounting and dispatch custom event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("toolkit-use-drive-file", {
          detail: {
            targetTab,
            file: {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType || blob.type,
              size: blob.size,
              dataUrl: dataUrl
            }
          }
        }));
        
        // Log activity
        window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
          detail: {
            type: "workflow",
            title: `Opened Asset in ${toolName}`,
            detail: `Transferred "${file.name}" to the workbench`,
            icon: "Sparkles",
          }
        }));

        setLoadingToolTarget(null);
        onClose(); // Close the gallery modal
      }, 350);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to load image into tool.");
      setLoadingToolTarget(null);
    }
  };

  // Delete Action
  const handleDelete = async (file: DriveFile) => {
    if (!accessToken) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${file.name}" from Google Drive? This action is irreversible.`);
    if (!confirmDelete) return;

    try {
      await deleteDriveFile(accessToken, file.id);
      
      // Update local states
      setSelectedIds(prev => prev.filter(id => id !== file.id));
      if (lightboxIndex !== null && sortedFiles[lightboxIndex]?.id === file.id) {
        setLightboxIndex(null);
      }
      
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "delete",
          title: "Permanently Deleted Asset",
          detail: `Deleted "${file.name}" from your Drive`,
          icon: "Trash2",
        }
      }));
      
      onRefresh(); // Trigger data refresh
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete file.");
    }
  };

  // Delete Selected
  const handleDeleteSelected = async () => {
    if (!accessToken || selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete all ${selectedIds.length} selected files?`);
    if (!confirmDelete) return;

    try {
      for (const id of selectedIds) {
        await deleteDriveFile(accessToken, id);
      }
      setSelectedIds([]);
      
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "delete",
          title: "Deleted Multiple Assets",
          detail: `Removed ${selectedIds.length} files from Drive`,
          icon: "Trash2",
        }
      }));
      
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete some files.");
    }
  };

  // Rename action
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !renamingFile || !newNameInput.trim()) return;
    
    setIsRenaming(true);
    try {
      await renameDriveFile(accessToken, renamingFile.id, newNameInput.trim());
      
      window.dispatchEvent(new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "edit",
          title: "Renamed File Asset",
          detail: `Renamed file to "${newNameInput.trim()}"`,
          icon: "Edit3",
        }
      }));

      setRenamingFile(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to rename file.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Trigger renaming panel setup
  const triggerRename = (file: DriveFile) => {
    setRenamingFile(file);
    setNewNameInput(file.name);
  };

  // Share action modal trigger
  const triggerShare = (file: DriveFile) => {
    setSharingFile(file);
    setCopiedLink(false);
  };

  const copyShareLink = async () => {
    if (!sharingFile?.webViewLink) return;
    try {
      await navigator.clipboard.writeText(sharingFile.webViewLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleNativeShare = async () => {
    if (!sharingFile) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: sharingFile.name,
          text: `Check out this creative asset: ${sharingFile.name}`,
          url: sharingFile.webViewLink
        });
      }
    } catch (err) {
      console.error("Native share failed", err);
    }
  };

  // Multi-select toggle helper
  const toggleSelect = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedFiles.map(f => f.id));
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* 1. Header Toolbar */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">Creative Assets Portfolio</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Google Drive Masonry Workspace</p>
          </div>
        </div>

        {/* Filters/Search block */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="pl-9 pr-8 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 focus:w-60 transition-all shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600">×</button>
            )}
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs">
            {[
              { id: "date", label: "Date" },
              { id: "size", label: "Size" },
              { id: "name", label: "Name" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSortBy(item.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  sortBy === item.id 
                    ? "bg-white dark:bg-slate-850 shadow-3xs text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button 
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="p-1 px-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Reverse direction"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar: Filter categories and batch operations */}
      <div className="bg-slate-100/50 dark:bg-slate-900/30 px-6 py-3 border-b border-slate-200/40 dark:border-slate-850/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "all", label: "All Assets" },
            { id: "quote", label: "Quote Cards" },
            { id: "compress", label: "Compresions" },
            { id: "qr", label: "QR Codes" },
            { id: "palette", label: "Palettes" },
            { id: "general", label: "Other Uploads" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all border ${
                filterType === cat.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={handleDownloadSelected}
                className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl px-3 py-1.5 font-bold text-[11px] transition-colors"
                title="Download selected"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Batch</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-955/35 rounded-xl px-3 py-1.5 font-bold text-[11px] transition-colors"
                title="Delete selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Batch</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                Clear
              </button>
            </div>
          ) : (
            <button
              onClick={toggleSelectAll}
              disabled={sortedFiles.length === 0}
              className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold disabled:opacity-40"
            >
              Select All ({sortedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Workspace Grid Scroll Container */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {sortedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full mb-4">
              <FileImage className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-sm">No Creative Assets Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {search 
                ? "No files matches your search text. Check spelling or try resetting filters."
                : filterType !== "all" 
                  ? `You haven't generated or uploaded any files in the "${filterType}" category yet.`
                  : "Sync Google Drive or upload custom design mockups inside the workspace to display them here."}
            </p>
          </div>
        ) : (
          /* Masonry CSS Columns */
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 [column-fill:_auto] max-w-[1600px] mx-auto pb-12">
            {sortedFiles.map((file, idx) => {
              const isSelected = selectedIds.includes(file.id);
              const cat = getFileCategory(file.name);
              
              return (
                <div
                  key={file.id}
                  onClick={() => setLightboxIndex(idx)}
                  className={`break-inside-avoid mb-6 rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col relative cursor-zoom-in ${
                    isSelected
                      ? "ring-2 ring-indigo-500 border-transparent bg-indigo-500/[0.01]"
                      : "border-slate-200/70 dark:border-slate-800/80"
                  }`}
                >
                  {/* Select Bubble */}
                  <div 
                    onClick={(e) => toggleSelect(file.id, e)}
                    className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border-transparent text-white scale-110 shadow-sm"
                        : "bg-black/25 hover:bg-black/40 border-white/60 text-transparent opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  {/* Thumbnail Category Tag */}
                  <span className={`absolute top-3 right-3 z-10 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md text-white ${
                    cat === "quote" ? "bg-amber-550/80" :
                    cat === "compress" ? "bg-emerald-600/80" :
                    cat === "qr" ? "bg-blue-600/80" :
                    cat === "palette" ? "bg-purple-600/80" :
                    "bg-slate-750/80"
                  }`}>
                    {cat === "quote" ? "Quote" :
                     cat === "compress" ? "Comp" :
                     cat === "qr" ? "QR" :
                     cat === "palette" ? "Palette" :
                     "Asset"}
                  </span>

                  {/* Asset Image */}
                  <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[100px]">
                    {file.thumbnailLink ? (
                      <img
                        src={getHiResImage(file.thumbnailLink)}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-auto object-cover max-h-[350px] transition-transform duration-500 group-hover:scale-103"
                      />
                    ) : (
                      <div className="py-12 flex flex-col items-center text-slate-400">
                        <FileImage className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">No Preview</span>
                      </div>
                    )}
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Metadata and Quick Actions Overlay */}
                  <div className="p-4 flex flex-col">
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1 break-all" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatDate(file.createdTime).split(",")[0]}</span>
                    </div>

                    {/* Quick action grid buttons */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Use in Tool Popover */}
                      <div className="relative group/tool col-span-2">
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Use in Tool...</span>
                        </button>
                        
                        {/* Dropdown Menu on Hover */}
                        <div className="absolute bottom-full left-0 right-0 z-30 mb-1 hidden group-hover/tool:block bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-slide-up">
                          {[
                            { name: "Quote Designer", tab: "quote" },
                            { name: "Image Compressor", tab: "compress" },
                            { name: "Color Extractor", tab: "palette" },
                            { name: "QR Generator", tab: "qr" },
                            { name: "Image to Video", tab: "video" },
                            { name: "Background Remover", tab: "bgremover" },
                            { name: "Image Converter", tab: "converter" },
                            { name: "PDF Suite", tab: "pdf" }
                          ].map(tool => (
                            <button
                              key={tool.tab}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseInTool(file, tool.tab, tool.name);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-between"
                            >
                              <span>{tool.name}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerShare(file);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                        title="Share file URL"
                      >
                        <Share2 className="w-3 h-3 text-indigo-500" />
                        <span>Share</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                        title="Download locally"
                      >
                        <Download className="w-3 h-3 text-emerald-500" />
                        <span>Download</span>
                      </button>

                      {/* Management elements */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerRename(file);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                        title="Rename"
                      >
                        <Edit3 className="w-3 h-3 text-amber-500" />
                        <span>Rename</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-[10px] transition-all cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LIGHTBOX DETAIL INSPECTOR */}
      {lightboxIndex !== null && sortedFiles[lightboxIndex] && (() => {
        const file = sortedFiles[lightboxIndex];
        const cat = getFileCategory(file.name);
        
        return (
          <div className="fixed inset-0 z-[120] bg-slate-950/98 flex flex-col justify-between animate-fade-in text-white select-none">
            {/* Topbar */}
            <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 bg-white/10 px-2 py-0.5 rounded">
                  {lightboxIndex + 1} / {sortedFiles.length}
                </span>
                <span className="font-bold text-xs truncate max-w-sm md:max-w-xl break-all">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                title="Exit Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left, Image, Right */}
            <div className="flex-1 flex items-center justify-between relative p-4">
              {/* Prev Button */}
              <button
                onClick={() => setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : sortedFiles.length - 1))}
                className="p-3 bg-black/45 hover:bg-black/75 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer absolute left-4 z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central high resolution preview */}
              <div className="flex-1 h-full flex items-center justify-center p-4">
                {file.thumbnailLink ? (
                  <img
                    src={getHiResImage(file.thumbnailLink)}
                    alt={file.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[70vh] md:max-h-[80vh] max-w-full object-contain rounded-lg drop-shadow-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <FileImage className="w-16 h-16 opacity-30 mb-2" />
                    <span>No Preview Available</span>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setLightboxIndex(prev => (prev !== null && prev < sortedFiles.length - 1 ? prev + 1 : 0))}
                className="p-3 bg-black/45 hover:bg-black/75 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer absolute right-4 z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Bottom Controls & Details */}
            <div className="p-6 bg-black/60 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    cat === "quote" ? "bg-amber-600" :
                    cat === "compress" ? "bg-emerald-600" :
                    cat === "qr" ? "bg-blue-600" :
                    cat === "palette" ? "bg-purple-600" :
                    "bg-slate-700"
                  }`}>
                    {cat.toUpperCase()} ASSET
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{formatBytes(file.size)}</span>
                </div>
                <p className="text-[11px] text-slate-450">Created on {formatDate(file.createdTime)}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Send to Tool dropdown inside Lightbox */}
                <div className="relative group/lightbox">
                  <button className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Use in Tool...</span>
                  </button>

                  <div className="absolute bottom-full right-0 z-30 mb-1.5 hidden group-hover/lightbox:block bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden w-44">
                    {[
                      { name: "Quote Designer", tab: "quote" },
                      { name: "Image Compressor", tab: "compress" },
                      { name: "Color Extractor", tab: "palette" },
                      { name: "QR Generator", tab: "qr" },
                      { name: "Image to Video", tab: "video" },
                      { name: "Background Remover", tab: "bgremover" },
                      { name: "Image Converter", tab: "converter" },
                      { name: "PDF Suite", tab: "pdf" }
                    ].map(tool => (
                      <button
                        key={tool.tab}
                        type="button"
                        onClick={() => handleUseInTool(file, tool.tab, tool.name)}
                        className="w-full text-left px-3.5 py-2 hover:bg-white/10 text-[10px] font-semibold text-slate-200 transition-colors flex items-center justify-between"
                      >
                        {tool.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => triggerShare(file)}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/5 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Share Asset</span>
                </button>

                <button
                  onClick={() => handleDownload(file)}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/5 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => triggerRename(file)}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/5 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={() => handleDelete(file)}
                  className="inline-flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/85 text-rose-200 text-xs font-bold px-4 py-2 rounded-xl border border-rose-900/50 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. SHARE DIALOG MODAL */}
      {sharingFile && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative animate-scale-up text-slate-800 dark:text-white">
            <button
              onClick={() => setSharingFile(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">Share Creative Asset</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Generate public cloud sharing node</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Asset URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharingFile.webViewLink || ""}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-[11px] font-mono select-all focus:outline-none focus:border-indigo-550 text-slate-650 dark:text-slate-300"
                  />
                  <button
                    onClick={copyShareLink}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-transparent"
                    title="Copy to clipboard"
                  >
                    {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedLink && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">✓ Copied link successfully to clipboard!</p>}
              </div>

              {/* Native mobile share if supported */}
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via Native Device Apps</span>
                </button>
              )}

              {/* Scan QR share code */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Scan to Share on Mobile</span>
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(sharingFile.webViewLink || "")}`}
                    alt="Asset Share QR Code"
                    className="w-36 h-36"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-2 text-center max-w-xs font-semibold">
                  Scan this automatically generated QR code with any smartphone camera to open the asset directly in Google Drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. RENAME ASSET DIALOG */}
      {renamingFile && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl relative animate-scale-up text-slate-800 dark:text-white"
          >
            <button
              type="button"
              onClick={() => setRenamingFile(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-955/20 rounded-2xl text-amber-600 dark:text-amber-400">
                <Edit3 className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">Rename Creative Asset</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify original Drive node title</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">New Filename</label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  placeholder="Enter custom file name..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newNameInput.trim() || newNameInput === renamingFile.name}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-40"
                >
                  {isRenaming ? "Renaming..." : "Save Name"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 7. USE IN TOOL SPINNER OVERLAY */}
      {loadingToolTarget && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-xs space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <div>
              <h4 className="font-extrabold text-sm">Routing Asset to Workspace</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{loadingToolTarget.name}</p>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              Downloading full-resolution image binary stream from Google Drive and loading it onto the active tool workbench. Please wait...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
