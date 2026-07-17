import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { 
  FileText, 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Sparkles, 
  Eye, 
  BookOpen, 
  Check, 
  RefreshCw, 
  Layers, 
  Layout, 
  FileImage,
  Type,
  AlignLeft,
  Settings
} from "lucide-react";

interface PDFToolsProps {
  theme: "light" | "dark";
}

interface ImageItem {
  id: string;
  name: string;
  url: string;
  size: number;
}

export default function PDFTools({ theme }: PDFToolsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"imgToPdf" | "textToPdf">("imgToPdf");
  
  // Images to PDF State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "executive">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [pdfMargin, setPdfMargin] = useState<number>(10); // in mm
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingProgress, setCompilingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text Document to PDF State
  const [docTitle, setDocTitle] = useState("Premium Document");
  const [docSubtitle, setDocSubtitle] = useState("Created using Toolkit Pro PDF Suite");
  const [docBody, setDocBody] = useState(
    "This is a professional document designed directly in your browser.\n\nYou can customize the typography, margins, alignments, and branding variables right from the editor sidebar, and compile it instantly to an offline-ready vector PDF."
  );
  const [accentColor, setAccentColor] = useState("#6366f1"); // Indigo
  const [showFooterPageNum, setShowFooterPageNum] = useState(true);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Format byte size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ("files" in e.target && e.target.files) {
      files = Array.from(e.target.files);
    } else if ("dataTransfer" in e && e.dataTransfer.files) {
      files = Array.from(e.dataTransfer.files);
    }

    const validImages = files.filter(file => file.type.startsWith("image/"));
    
    validImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              url: event.target!.result as string,
              size: file.size
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === images.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  // Compile PDF from Images
  const compileImagesToPdf = async () => {
    if (images.length === 0) return;
    setIsCompiling(true);
    setCompilingProgress(10);

    try {
      // Initialize jsPDF
      // standard sizes in mm
      // a4: 210 x 297, letter: 215.9 x 279.4
      const doc = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: pageSize
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - (pdfMargin * 2);
      const usableHeight = pageHeight - (pdfMargin * 2);

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          doc.addPage(pageSize, orientation);
        }
        
        setCompilingProgress(Math.round(10 + ((i / images.length) * 80)));

        const img = images[i];

        // Create a temporary HTMLImageElement to read aspects
        await new Promise<void>((resolve) => {
          const tempImg = new Image();
          tempImg.src = img.url;
          tempImg.onload = () => {
            const imgWidth = tempImg.width;
            const imgHeight = tempImg.height;
            const imgRatio = imgWidth / imgHeight;
            const pageRatio = usableWidth / usableHeight;

            let finalWidth = usableWidth;
            let finalHeight = usableHeight;
            let xOffset = pdfMargin;
            let yOffset = pdfMargin;

            if (imgRatio > pageRatio) {
              // fit horizontally
              finalWidth = usableWidth;
              finalHeight = usableWidth / imgRatio;
              yOffset = pdfMargin + ((usableHeight - finalHeight) / 2);
            } else {
              // fit vertically
              finalHeight = usableHeight;
              finalWidth = usableHeight * imgRatio;
              xOffset = pdfMargin + ((usableWidth - finalWidth) / 2);
            }

            // Detect image format
            let format = "JPEG";
            if (img.name.endsWith(".png") || img.url.startsWith("data:image/png")) {
              format = "PNG";
            } else if (img.name.endsWith(".webp") || img.url.startsWith("data:image/webp")) {
              format = "WEBP";
            }

            try {
              doc.addImage(img.url, format, xOffset, yOffset, finalWidth, finalHeight);
            } catch (err) {
              // Fallback if jspdf complains about exact WebP format encoding
              doc.addImage(img.url, "JPEG", xOffset, yOffset, finalWidth, finalHeight);
            }
            resolve();
          };
          tempImg.onerror = () => {
            resolve(); // skip on error
          };
        });
      }

      setCompilingProgress(95);
      doc.save("compiled-assets-toolkit.pdf");
      setCompilingProgress(100);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setTimeout(() => {
        setIsCompiling(false);
        setCompilingProgress(0);
      }, 1000);
    }
  };

  // Compile Rich Text Document to PDF
  const compileTextToPdf = () => {
    setIsCompiling(true);
    setCompilingProgress(20);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const usableWidth = pageWidth - (margin * 2);

      setCompilingProgress(40);

      // Draw Top Accent bar
      doc.setFillColor(accentColor);
      doc.rect(0, 0, pageWidth, 5, "F");

      // Set Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59); // deep slate
      doc.text(docTitle, margin, 25);

      // Draw horizontal separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 29, pageWidth - margin, 29);

      // Set Subtitle
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(docSubtitle, margin, 35);

      setCompilingProgress(60);

      // Document Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const splitBody = doc.splitTextToSize(docBody, usableWidth);
      doc.text(splitBody, margin, 48);

      setCompilingProgress(80);

      // Optional Footer page number
      if (showFooterPageNum) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("Page 1 of 1", pageWidth / 2, pageHeight - 12, { align: "center" });
        doc.text("Generated by Toolkit Pro Suite", margin, pageHeight - 12);
      }

      setCompilingProgress(95);
      doc.save(`${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
    } catch (err) {
      console.error("Text PDF compilation failed:", err);
    } finally {
      setCompilingProgress(100);
      setTimeout(() => {
        setIsCompiling(false);
        setCompilingProgress(0);
      }, 800);
    }
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 animate-fade-in ${
      theme === "dark" ? "text-slate-100" : "text-slate-800"
    }`}>
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-150 dark:border-slate-850 gap-4 select-none">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Premium <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">PDF Tools Suite</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reorder asset items, manage margins, orient frames, and generate beautifully formatted PDFs completely client-side.
          </p>
        </div>
        
        {/* Toggle between Sub Utilities */}
        <div className={`flex p-1 rounded-xl border shrink-0 ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            onClick={() => setActiveSubTab("imgToPdf")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "imgToPdf"
                ? theme === "dark" ? "bg-slate-950 text-white shadow" : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Images to PDF</span>
          </button>
          <button
            onClick={() => setActiveSubTab("textToPdf")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "textToPdf"
                ? theme === "dark" ? "bg-slate-950 text-white shadow" : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doc to PDF</span>
          </button>
        </div>
      </div>

      {/* Sub Utility: Images to PDF */}
      {activeSubTab === "imgToPdf" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main compilation viewport */}
          <div className="lg:col-span-2 space-y-4">
            {/* Drag and Drop Container */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageUpload(e); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer min-h-[220px] select-none text-center ${
                isDragging
                  ? "border-amber-500 bg-amber-500/[0.03]"
                  : theme === "dark"
                    ? "border-slate-800 bg-slate-950 hover:border-slate-700"
                    : "border-slate-250 bg-white hover:border-slate-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 shadow">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold">Drag & Drop images or click to select</p>
                <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, and WebP assets up to 15MB</p>
              </div>
            </div>

            {/* List of uploaded asset pages */}
            {images.length > 0 && (
              <div className={`border rounded-3xl p-5 space-y-4 ${
                theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] uppercase font-mono font-black text-slate-400">
                    Compiled Pages ({images.length})
                  </span>
                  <button
                    onClick={() => setImages([])}
                    className="text-[10px] font-black uppercase text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                        theme === "dark"
                          ? "bg-slate-900 border-slate-800/60 hover:bg-slate-850/50"
                          : "bg-slate-50 border-slate-200/60 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-[10px] font-black font-mono text-slate-400 shrink-0 bg-slate-200 dark:bg-slate-800 w-6 h-6 rounded-lg flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 rounded-lg border overflow-hidden shrink-0 bg-slate-900">
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={img.name}>
                            {img.name}
                          </p>
                          <p className="text-[9px] text-slate-405 dark:text-slate-500 font-medium font-mono leading-none mt-1">
                            {formatBytes(img.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveImage(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveImage(index, "down")}
                          disabled={index === images.length - 1}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compilation settings panel */}
          <div className="space-y-4">
            <div className={`border rounded-3xl p-5 space-y-4 ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-850">
                <Settings className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs uppercase font-black tracking-wider">PDF Dimensions</h3>
              </div>

              {/* Page Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Page Standard Size</label>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e: any) => setPageSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 cursor-pointer focus:ring-0 focus:outline-none appearance-none"
                  >
                    <option value="a4">📄 ISO A4 (210 x 297 mm)</option>
                    <option value="letter">📝 ANSI Letter (215.9 x 279.4 mm)</option>
                    <option value="executive">👔 Executive (184.1 x 266.7 mm)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">▼</div>
                </div>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Orientation Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation("portrait")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      orientation === "portrait"
                        ? "bg-amber-500 text-white border-amber-500"
                        : theme === "dark"
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Portrait (Vertical)
                  </button>
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      orientation === "landscape"
                        ? "bg-amber-500 text-white border-amber-500"
                        : theme === "dark"
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Landscape (Horiz.)
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-bold">Page Padding Margins</span>
                  <span className="font-mono text-[10px] text-amber-500">{pdfMargin} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={pdfMargin}
                  onChange={(e) => setPdfMargin(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[9px] text-slate-405 leading-none">
                  Defines distance between image canvas edge and paper layout edge.
                </p>
              </div>

              {/* Compilation Action button */}
              <button
                onClick={compileImagesToPdf}
                disabled={images.length === 0 || isCompiling}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-red-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompiling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling ({compilingProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Compile PDF File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Utility: Text Document to PDF Creator */}
      {activeSubTab === "textToPdf" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Document editor viewport */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`border rounded-3xl p-6 space-y-4 ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}>
              {/* Fake top bar */}
              <div className="flex items-center gap-2 border-b pb-3.5 border-slate-100 dark:border-slate-850">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[9.5px] font-mono font-black text-slate-400 tracking-wider uppercase ml-2.5">
                  Vector Preview Sandbox
                </span>
              </div>

              {/* Text document canvas frame representation */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-inner space-y-4 font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden">
                <div style={{ backgroundColor: accentColor }} className="absolute top-0 inset-x-0 h-1.5" />
                
                {/* Visual Frame contents */}
                <div className="space-y-2 select-all">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    {docTitle || "Untitled Title Document"}
                  </h2>
                  <p className="text-xs text-slate-450 italic leading-none border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    {docSubtitle || "Optional Document Subtitle"}
                  </p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed text-slate-650 dark:text-slate-300 pt-1.5">
                    {docBody || "Start typing your professional text documentation..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Controls Sidebar */}
          <div className="space-y-4">
            <div className={`border rounded-3xl p-5 space-y-4 ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-850">
                <Type className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs uppercase font-black tracking-wider">Document Designer</h3>
              </div>

              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="e.g., Monthly Progress Statement"
                />
              </div>

              {/* Document Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Sub-heading / Metadata</label>
                <input
                  type="text"
                  value={docSubtitle}
                  onChange={(e) => setDocSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="e.g., Prepared for Client Account Sync"
                />
              </div>

              {/* Document Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Document Body Content</label>
                <textarea
                  value={docBody}
                  onChange={(e) => setDocBody(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all resize-none"
                  placeholder="Write your primary vector document paragraphs..."
                />
              </div>

              {/* Brand Accent Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Top Trim Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent outline-none"
                  />
                  <span className="text-[11px] font-mono font-bold uppercase">{accentColor}</span>
                </div>
              </div>

              {/* Show Page Numbers */}
              <div className="flex items-center justify-between text-xs py-1.5 select-none border-t border-slate-100 dark:border-slate-850">
                <span className="font-bold text-slate-405">Include Footer Stamp</span>
                <button
                  onClick={() => setShowFooterPageNum(!showFooterPageNum)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showFooterPageNum ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      showFooterPageNum ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Generate PDF Button */}
              <button
                onClick={compileTextToPdf}
                disabled={isCompiling}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-red-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompiling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Compile Doc PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
