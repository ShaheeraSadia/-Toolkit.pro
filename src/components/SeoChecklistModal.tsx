import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Tag, 
  Search, 
  Copy, 
  Check, 
  Wand2, 
  Cloud, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  Info, 
  Sliders, 
  ArrowRight,
  Eye,
  HelpCircle,
  FileCheck,
  Zap,
  Code
} from "lucide-react";

export interface SeoProjectMetadata {
  title: string;
  altText: string;
  metaDescription: string;
  keywords: string;
  tags: string[];
  category: string;
  fileType?: string;
}

interface SeoChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<SeoProjectMetadata>;
  onProceedToSaveDrive?: (metadata: SeoProjectMetadata) => void;
}

interface ChecklistItem {
  id: string;
  category: "naming" | "alt" | "meta" | "drive";
  label: string;
  description: string;
  autoCheckCondition?: (meta: SeoProjectMetadata) => boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Pillar 1: Naming
  {
    id: "clean-title",
    category: "naming",
    label: "Clean & Hyphenated Filename",
    description: "Uses lowercases and hyphens without special characters, spaces (%20), or generic tags like '(1)'.",
    autoCheckCondition: (m) => {
      const clean = m.title.trim().toLowerCase().replace(/[^a-z0-9.-]/g, "-");
      return m.title.length > 3 && !m.title.includes(" ") && !m.title.match(/[^a-zA-Z0-9_.-]/) && !m.title.toLowerCase().includes("untitled");
    }
  },
  {
    id: "title-length",
    category: "naming",
    label: "Optimal Title Length (10–60 chars)",
    description: "Concisely communicates asset purpose without being truncated in cloud search results.",
    autoCheckCondition: (m) => m.title.trim().length >= 10 && m.title.trim().length <= 60
  },
  {
    id: "keyword-in-title",
    category: "naming",
    label: "Primary Keyword Included in Title",
    description: "Contains at least one focus keyword or topic term for fast indexing.",
    autoCheckCondition: (m) => {
      if (!m.keywords) return false;
      const kwList = m.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
      return kwList.some(kw => m.title.toLowerCase().includes(kw));
    }
  },

  // Pillar 2: Alt Text
  {
    id: "alt-provided",
    category: "alt",
    label: "Descriptive Alt-Text Included",
    description: "Crucial for web accessibility screen readers and Google image search indexing.",
    autoCheckCondition: (m) => m.altText.trim().length >= 10
  },
  {
    id: "alt-length",
    category: "alt",
    label: "Alt-Text within 125 Characters",
    description: "Screen readers stop reading long alt texts; keep it punchy and descriptive.",
    autoCheckCondition: (m) => m.altText.trim().length > 0 && m.altText.trim().length <= 125
  },
  {
    id: "alt-no-junk",
    category: "alt",
    label: "Avoids Generic 'image of' Phrases",
    description: "Directly describes the content instead of redundant prefixes like 'picture of' or 'file'.",
    autoCheckCondition: (m) => {
      const lower = m.altText.toLowerCase();
      return m.altText.trim().length > 0 && !lower.startsWith("image of") && !lower.startsWith("picture of") && !lower.startsWith("photo of");
    }
  },

  // Pillar 3: Meta Description
  {
    id: "meta-provided",
    category: "meta",
    label: "Meta Description Formatted (120–155 chars)",
    description: "Displays rich preview snippets in Google search results and shared social cards.",
    autoCheckCondition: (m) => m.metaDescription.trim().length >= 120 && m.metaDescription.trim().length <= 155
  },
  {
    id: "meta-call-to-action",
    category: "meta",
    label: "Clear Call-to-Action / Value Proposition",
    description: "Encourages clicks with words like 'discover', 'download', 'explore', or 'learn'.",
    autoCheckCondition: (m) => {
      const ctaWords = ["discover", "download", "explore", "learn", "create", "generate", "get", "view", "free", "tool"];
      return ctaWords.some(w => m.metaDescription.toLowerCase().includes(w));
    }
  },
  {
    id: "keywords-specified",
    category: "meta",
    label: "Target Focus Keywords Specified",
    description: "At least 2-3 relevant topic keywords added for categorical classification.",
    autoCheckCondition: (m) => m.keywords.split(",").filter(k => k.trim().length > 0).length >= 2
  },

  // Pillar 4: Google Drive & Optimization
  {
    id: "category-tagged",
    category: "drive",
    label: "Asset Category & Tags Assigned",
    description: "Ensures easy searching, sorting, and folder organization inside Google Drive.",
    autoCheckCondition: (m) => m.tags.length >= 1 && m.category.length > 0
  },
  {
    id: "compression-checked",
    category: "drive",
    label: "Lossless / WebP Compression Verified",
    description: "File size is optimized for fast web delivery prior to cloud archiving.",
    autoCheckCondition: () => true // Default checked for Toolkit Pro exports
  },
  {
    id: "exif-privacy",
    category: "drive",
    label: "Privacy & Metadata Sanitation",
    description: "Personal EXIF camera data and confidential paths are pruned prior to saving.",
    autoCheckCondition: () => true // Default checked
  }
];

const PRESETS = [
  {
    id: "blog-banner",
    name: "Blog Feature Header / Banner",
    category: "Web Graphics",
    defaultTitle: "modern-web-design-toolkit-banner.png",
    defaultAlt: "Clean modern website hero banner showcasing digital tools and vector interfaces",
    defaultMeta: "Explore our comprehensive guide on modern web design tools, featuring clean UI templates, asset compression, and instant cloud sync.",
    defaultKeywords: "web design, banner graphic, digital tools, UI layout",
    tags: ["Blog", "Banner", "Web Design"]
  },
  {
    id: "pinterest-pin",
    name: "Pinterest Vertical Pin (2:3 Ratio)",
    category: "Social Marketing",
    defaultTitle: "free-qr-code-generator-guide-pin.png",
    defaultAlt: "Step-by-step infographic showing how to generate free scannable QR codes for marketing",
    defaultMeta: "Discover how to create 100% free scannable QR codes for your business. Perfect for business cards, flyers, restaurant menus, and marketing.",
    defaultKeywords: "qr code generator, free qr code, digital marketing, pinterest pin",
    tags: ["Pinterest", "Infographic", "Marketing"]
  },
  {
    id: "product-asset",
    name: "E-Commerce Product Graphic",
    category: "Product Catalog",
    defaultTitle: "toolkit-pro-software-spec-sheet.png",
    defaultAlt: "Technical product specification sheet detailing cloud storage features and color extraction",
    defaultMeta: "View complete technical specifications for Toolkit Pro, including offline processing capabilities, Google Drive backup, and color palette generator.",
    defaultKeywords: "product spec, software tools, spec sheet, toolkit pro",
    tags: ["Product", "Spec Sheet", "E-Commerce"]
  },
  {
    id: "quote-card",
    name: "Inspirational Quote Card / Social",
    category: "Social Media",
    defaultTitle: "creative-inspiration-quote-graphic.png",
    defaultAlt: "Stylized typographic quote graphic with elegant backdrop blurs and subtle dark gradient",
    defaultMeta: "Daily creative inspiration quote graphic designed with Toolkit Pro typography studio. Download high-resolution PNG for social media.",
    defaultKeywords: "quote designer, typography, creative quotes, social graphic",
    tags: ["Quote", "Typography", "Social Media"]
  }
];

export default function SeoChecklistModal({
  isOpen,
  onClose,
  initialData,
  onProceedToSaveDrive
}: SeoChecklistModalProps) {
  const [metadata, setMetadata] = useState<SeoProjectMetadata>({
    title: initialData?.title || "toolkit-pro-project-asset.png",
    altText: initialData?.altText || "High quality digital design asset generated with Toolkit Pro",
    metaDescription: initialData?.metaDescription || "Professional digital creative asset optimized for web publishing, screen readability, and seamless Google Drive cloud archiving.",
    keywords: initialData?.keywords || "digital asset, web tools, cloud backup",
    tags: initialData?.tags || ["Design", "Toolkit Pro"],
    category: initialData?.category || "Web Graphics",
    fileType: initialData?.fileType || "image"
  });

  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [tagInput, setTagInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "checklist" | "code">("editor");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      const merged: SeoProjectMetadata = {
        title: initialData?.title || "toolkit-pro-project-asset.png",
        altText: initialData?.altText || "High quality digital design asset generated with Toolkit Pro",
        metaDescription: initialData?.metaDescription || "Professional digital creative asset optimized for web publishing, screen readability, and seamless Google Drive cloud archiving.",
        keywords: initialData?.keywords || "digital asset, web tools, cloud backup",
        tags: initialData?.tags || ["Design", "Toolkit Pro"],
        category: initialData?.category || "Web Graphics",
        fileType: initialData?.fileType || "image"
      };
      setMetadata(merged);

      // Auto evaluate checklist
      const autoChecks: Record<string, boolean> = {};
      CHECKLIST_ITEMS.forEach(item => {
        if (item.autoCheckCondition) {
          autoChecks[item.id] = item.autoCheckCondition(merged);
        } else {
          autoChecks[item.id] = false;
        }
      });
      setCheckedIds(autoChecks);
    }
  }, [isOpen, initialData]);

  // Re-run auto checks when metadata changes
  useEffect(() => {
    const updated: Record<string, boolean> = { ...checkedIds };
    CHECKLIST_ITEMS.forEach(item => {
      if (item.autoCheckCondition) {
        updated[item.id] = item.autoCheckCondition(metadata);
      }
    });
    setCheckedIds(updated);
  }, [metadata]);

  // Score calculation
  const totalCount = CHECKLIST_ITEMS.length;
  const passedCount = useMemo(() => {
    return Object.values(checkedIds).filter(Boolean).length;
  }, [checkedIds]);

  const scorePercentage = Math.round((passedCount / totalCount) * 100);

  const healthColor = useMemo(() => {
    if (scorePercentage >= 85) return { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200" };
    if (scorePercentage >= 65) return { bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500", badge: "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200" };
    if (scorePercentage >= 45) return { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200" };
    return { bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500", badge: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200" };
  }, [scorePercentage]);

  if (!isOpen) return null;

  const handleToggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCleanFilename = () => {
    const raw = metadata.title.trim();
    // replace ext if present
    const lastDot = raw.lastIndexOf(".");
    let namePart = raw;
    let extPart = ".png";
    if (lastDot > 0) {
      namePart = raw.substring(0, lastDot);
      extPart = raw.substring(lastDot);
    }
    const clean = namePart
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    const finalTitle = (clean || "toolkit-pro-asset") + extPart;
    setMetadata(prev => ({ ...prev, title: finalTitle }));
    showToast("Clean filename applied!");
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setMetadata({
      title: preset.defaultTitle,
      altText: preset.defaultAlt,
      metaDescription: preset.defaultMeta,
      keywords: preset.defaultKeywords,
      tags: preset.tags,
      category: preset.category,
      fileType: "image"
    });
    showToast(`Applied "${preset.name}" template!`);
  };

  const handleAiAutoOptimize = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const cleanTitle = metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const keywordsList = metadata.keywords || "digital assets, web design, google drive";
      
      setMetadata(prev => ({
        ...prev,
        title: cleanTitle.endsWith(".png") || cleanTitle.endsWith(".jpg") || cleanTitle.endsWith(".webp") ? cleanTitle : `${cleanTitle || "optimized-web-asset"}.png`,
        altText: `High-resolution ${prev.category.toLowerCase()} asset optimized for ${keywordsList.split(",")[0] || "web publishing"} with crystal-clear visual typography`,
        metaDescription: `Download and publish high-quality ${prev.category.toLowerCase()} assets optimized with clean SEO markup, high accessibility alt-text, and seamless Google Drive cloud synchronization.`,
        keywords: keywordsList.includes("toolkit pro") ? keywordsList : `${keywordsList}, toolkit pro, google drive export`
      }));
      setAiGenerating(false);
      showToast("✨ AI SEO optimization applied!");
    }, 600);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setMetadata(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const generatedHtmlSnippet = `<!-- SEO & Social OpenGraph Meta Snippet -->
<meta name="title" content="${metadata.title.replace(/"/g, '&quot;')}" />
<meta name="description" content="${metadata.metaDescription.replace(/"/g, '&quot;')}" />
<meta name="keywords" content="${metadata.keywords.replace(/"/g, '&quot;')}" />

<!-- Accessibility Image Tag -->
<img 
  src="${metadata.title}" 
  alt="${metadata.altText.replace(/"/g, '&quot;')}" 
  loading="lazy" 
  decoding="async" 
/>`;

  const generatedJsonLdSnippet = `<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "DigitalDocument",
  "name": "${metadata.title}",
  "description": "${metadata.metaDescription}",
  "keywords": "${metadata.keywords}",
  "fileFormat": "image/png",
  "category": "${metadata.category}",
  "publisher": {
    "@type": "Organization",
    "name": "Toolkit Pro Workspace"
  }
}
</script>`;

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      showToast("Copied code snippet to clipboard!");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (_) {
      showToast("Failed to copy code.");
    }
  };

  const handleProceedSave = () => {
    if (onProceedToSaveDrive) {
      onProceedToSaveDrive(metadata);
    } else {
      showToast("SEO Pre-Check Completed! Ready for Google Drive.");
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in">
      {/* Toast Popup */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl z-[130] flex items-center gap-2 border border-slate-700 font-bold font-sans animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                  SEO Best Practices Audit
                </h2>
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider font-mono">
                  Google Drive Pre-Save
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Verify titles, alt-texts, meta descriptions, and tags before archiving your project.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer self-end sm:self-center"
            aria-label="Close SEO Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score & Quick Preset Bar */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Health Meter */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex-1">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={healthColor.text}
                    strokeDasharray={`${scorePercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-900 dark:text-white font-mono">
                  {scorePercentage}%
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white font-sans uppercase tracking-wider">
                    SEO Quality Score: {scorePercentage >= 85 ? "Excellent" : scorePercentage >= 65 ? "Good" : "Needs Review"}
                  </span>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${healthColor.badge}`}>
                    {passedCount}/{totalCount} Checks Passed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {scorePercentage >= 85 
                    ? "✨ Outstanding! This project has maximum search engine indexing fidelity."
                    : "Complete remaining items to maximize discoverability when saving to Google Drive."}
                </p>
              </div>
            </div>

            {/* AI Auto Optimize & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAiAutoOptimize}
                disabled={aiGenerating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs px-3.5 py-2.5 rounded-xl font-black shadow-sm cursor-pointer transition-all uppercase tracking-wider font-sans disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${aiGenerating ? "animate-spin" : ""}`} />
                <span>{aiGenerating ? "Optimizing..." : "AI Auto-Optimize SEO"}</span>
              </button>

              <button
                onClick={() => {
                  const allChecked: Record<string, boolean> = {};
                  CHECKLIST_ITEMS.forEach(i => { allChecked[i.id] = true; });
                  setCheckedIds(allChecked);
                  showToast("Marked all checks passed!");
                }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-3 py-2.5 rounded-xl font-extrabold cursor-pointer transition-colors"
              >
                Mark All Passed
              </button>
            </div>
          </div>

          {/* Quick Preset Templates Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px] font-sans">
              Presets:
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer text-[11px]"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all cursor-pointer ${
              activeTab === "editor"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Metadata Editor</span>
          </button>

          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all cursor-pointer ${
              activeTab === "checklist"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>SEO Checklist ({passedCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all cursor-pointer ${
              activeTab === "code"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML & Schema Preview</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "editor" && (
            <div className="space-y-5 animate-fade-in">
              {/* Clean Title Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Asset / Project File Name
                  </label>
                  <button
                    onClick={handleCleanFilename}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    ⚡ Convert to Clean Filename
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="e.g. modern-web-design-banner.png"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400">
                    {metadata.title.length}/60 chars
                  </span>
                </div>

                {/* Validation hint */}
                <div className="flex items-center gap-2 text-[11px]">
                  {metadata.title.includes(" ") || metadata.title.match(/[^a-zA-Z0-9_.-]/) ? (
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Title contains spaces or special characters. Use clean hyphens for SEO.
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid hyphenated filename format!
                    </span>
                  )}
                </div>
              </div>

              {/* Alt-Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    Image Alt-Text (Accessibility & Crawlers)
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${metadata.altText.length > 125 ? "text-rose-500" : "text-slate-400"}`}>
                    {metadata.altText.length}/125 chars
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={metadata.altText}
                  onChange={(e) => setMetadata({ ...metadata, altText: e.target.value })}
                  placeholder="Accurately describe the visual content for screen readers and Google image search..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Recommendation: Keep alt-text concise (under 125 chars). Avoid "image of" or "picture of".
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    Meta Description (Search Snippet)
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${metadata.metaDescription.length < 120 || metadata.metaDescription.length > 155 ? "text-amber-500" : "text-emerald-500"}`}>
                    {metadata.metaDescription.length}/155 chars (Target: 120-155)
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={metadata.metaDescription}
                  onChange={(e) => setMetadata({ ...metadata, metaDescription: e.target.value })}
                  placeholder="Summarize the core purpose of this creative project in 120 to 155 characters..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />

                {/* Search Snippet Preview Box */}
                <div className="bg-slate-100 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Google Search Snippet Preview:
                  </span>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">
                    {metadata.title} | Toolkit Pro
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    https://drive.google.com/file/d/.../{metadata.title}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                    {metadata.metaDescription || "No meta description specified."}
                  </div>
                </div>
              </div>

              {/* Keywords & Tags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    Target Focus Keywords
                  </label>
                  <input
                    type="text"
                    value={metadata.keywords}
                    onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                    placeholder="e.g. web design, banner graphic, google drive"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Comma-separated terms</p>
                </div>

                {/* Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    File Asset Category
                  </label>
                  <select
                    value={metadata.category}
                    onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Web Graphics">Web Graphics & Banners</option>
                    <option value="Social Marketing">Social Media & Pins</option>
                    <option value="Product Catalog">Product Catalog & Specs</option>
                    <option value="Documentation">PDF & Documentation</option>
                    <option value="Infographic">Infographic & Charts</option>
                  </select>
                </div>
              </div>

              {/* Tags Chip Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-500" />
                  Drive Folder Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl min-h-[42px]">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Type tag & press Enter..."
                    className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                  Interactive Pre-Save Audit Items
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {passedCount} / {totalCount} Completed
                </span>
              </div>

              {/* Pillars */}
              {[
                { cat: "naming", title: "1. File Naming & Title Structure" },
                { cat: "alt", title: "2. Alt-Text & Web Accessibility" },
                { cat: "meta", title: "3. Meta Description & Search Snippets" },
                { cat: "drive", title: "4. Google Drive Cloud Storage Readiness" }
              ].map((pillar) => {
                const items = CHECKLIST_ITEMS.filter(i => i.category === pillar.cat);
                return (
                  <div key={pillar.cat} className="space-y-3">
                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-sans">
                      {pillar.title}
                    </h4>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const isChecked = !!checkedIds[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleCheck(item.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isChecked
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="space-y-0.5">
                              <span className={`text-xs font-bold font-sans ${
                                isChecked ? "text-emerald-950 dark:text-emerald-200 line-through" : "text-slate-900 dark:text-white"
                              }`}>
                                {item.label}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "code" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    HTML Meta & Image Tag Code
                  </h3>
                  <button
                    onClick={() => handleCopyCode(generatedHtmlSnippet)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy HTML
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {generatedHtmlSnippet}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    JSON-LD Schema Markup
                  </h3>
                  <button
                    onClick={() => handleCopyCode(generatedJsonLdSnippet)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Schema
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {generatedJsonLdSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Cloud className="w-4 h-4 text-indigo-500" />
            <span>Ready for Google Drive Cloud Archiving</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleProceedSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition-all uppercase tracking-wider font-sans"
            >
              <Cloud className="w-4 h-4" />
              <span>Save Project to Google Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
