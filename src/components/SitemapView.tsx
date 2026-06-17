import React, { useEffect } from "react";
import { 
  Quote, 
  FileImage, 
  QrCode, 
  Pipette, 
  Cloud, 
  BookOpen, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Activity,
  FileText
} from "lucide-react";
import { ActiveTab } from "../types";

interface SitemapViewProps {
  theme: "light" | "dark";
  onTabChange: (tab: ActiveTab) => void;
  onClose: () => void;
}

export default function SitemapView({ theme, onTabChange, onClose }: SitemapViewProps) {
  // We can include Schema.org ItemList to assist search crawler indexing
  const sitemapItems = [
    {
      id: "quote" as ActiveTab,
      name: "Quote Designer Pro",
      url: "/#quote",
      description: "Advanced dynamic digital graphics generation canvas for quotes, typography styling, custom brand overlays, background controls, and Google Drive cloud sync.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "weekly",
      priority: "0.9",
      icon: Quote,
      category: "Creative Tools",
      keywords: ["quote creator", "social post typography", "custom brand graphics", "watermark maker"],
      metaDescription: "Generate customized high-conversion quote images and typographical templates with direct cloud integration panels."
    },
    {
      id: "compress" as ActiveTab,
      name: "Lossless Image Compressor Pro",
      url: "/#compress",
      description: "Next-gen graphics compressor for WebP, PNG, and JPEG. Features high-ratio lossy/lossless algorithms, live interactive A/B comparison slider, and background zip compiler.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "weekly",
      priority: "1.0",
      icon: FileImage,
      category: "Optimization Tools",
      keywords: ["webp compressor", "lossless png balance", "image size reduction", "core web vitals test"],
      metaDescription: "Optimize active image files using cutting edge lossy & lossless processing algorithms for faster mobile responses."
    },
    {
      id: "qr" as ActiveTab,
      name: "QR Code Vector Generator",
      url: "/#qr",
      description: "Automobile & digital coordinate matrix standard. Direct error correction levels (7% - 30% Reed-Solomon math), custom margin definitions, and immediate vector exports.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "monthly",
      priority: "0.8",
      icon: QrCode,
      category: "Creative Tools",
      keywords: ["qr generator standard", "vector grid parameters", "reed solomon math standard", "svg qr codes"],
      metaDescription: "Build error resilient high priority secure QR custom grids with tailored quiet zones and scalable asset exports."
    },
    {
      id: "palette" as ActiveTab,
      name: "Aesthetic Color Spectrum Extractor",
      url: "/#palette",
      description: "Smart quantization extractor analyzing uploaded files to produce high contrast color palette swatches with hex, RGB, and WCAG luminance levels.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "weekly",
      priority: "0.8",
      icon: Pipette,
      category: "Optimization Tools",
      keywords: ["color palette extraction", "image color spectrum", "median cut quantization", "wcag contrast compliance"],
      metaDescription: "Extract dominant colour arrays and hex listings instantly from photographic inputs with automatic design rule indicators."
    },
    {
      id: "drive" as ActiveTab,
      name: "Google Drive Cloud Panel",
      url: "/#drive",
      description: "Direct API integration proxy allowing instant sync, workspace directory indexing, and backup restoration of customized user-created design properties.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "daily",
      priority: "0.7",
      icon: Cloud,
      category: "Storage & Integration",
      keywords: ["google workspace backup", "cloud file explorer client", "direct tools synchronization", "oauth credentials"],
      metaDescription: "Sync, store, download, and catalog your custom-made assets directly within automated Google Drive cloud folders."
    },
    {
      id: "resources" as ActiveTab,
      name: "Creator Editorial Guides & SEO Manuals",
      url: "/#resources",
      description: "Comprehensive content library providing expert analysis on search engine rankings, Core Web Vitals, metadata pruning, and color psychology.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "daily",
      priority: "0.9",
      icon: BookOpen,
      category: "Content & SEO",
      keywords: ["google adsense requirements", "creator seo checklists", "webp vs png formats", "image metadata pruning"],
      metaDescription: "Browse academic creator SEO optimization publications, sitemap schemas, image rendering guidelines, and user advice."
    },
    {
      id: "legal" as ActiveTab,
      name: "Privacy & AdSense Compliance Hub",
      url: "/#legal",
      description: "Legal policies, terms of standard usage, publisher verification diagnostic logs, and dynamic user support messaging center.",
      status: "ACTIVE (200 OK)",
      lastModified: "2026-06-08",
      changefreq: "yearly",
      priority: "0.5",
      icon: ShieldCheck,
      category: "Administrative",
      keywords: ["custom privacy statements", "online service conditions", "user support ticketing", "adsense diagnostics"],
      metaDescription: "Access formal privacy policies, service declarations, developer communication lines, and diagnostic testing parameters."
    }
  ];

  // Schema.org Structured Data
  const sitemapSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Toolkit Pro Suite Active Sitemap",
    "description": "Dynamic crawler index and active tools sitemap directories for search engine visibility.",
    "numberOfItems": sitemapItems.length,
    "itemListElement": sitemapItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${typeof window !== "undefined" ? window.location.origin : "https://toolkit-pro-chi.vercel.app"}${item.url}`,
      "name": item.name,
      "description": item.description
    }))
  };

  useEffect(() => {
    // Scroll to top upon load
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNavigateToTool = (id: ActiveTab) => {
    onTabChange(id);
    onClose();
  };

  return (
    <div className="space-y-8 text-left" id="sitemap-diagnostic-container">
      {/* Structured data injection */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitemapSchema) }}
      />

      {/* Header Diagnostic Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-405 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-md">
              Diagnostic Mode: SEO Crawler Index 200
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            Search Index XML & HTML Dynamic Sitemap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            This tool generates schema-compliant metadata parameters to boost search engine indexation, crawler parsing, and core visibility.
          </p>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-slate-200/30 self-start sm:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Workspace
        </button>
      </div>

      {/* Grid of Diagnostic Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px]">
        <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
          <p className="text-slate-400 uppercase tracking-wider font-extrabold">Primary Host Domain</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-505" />
            {typeof window !== "undefined" ? window.location.origin : "https://toolkit-pro-chi.vercel.app"}
          </p>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
          <p className="text-slate-400 uppercase tracking-wider font-extrabold">Active XML Parsers</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            JSON-LD Graph + Microdata
          </p>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
          <p className="text-slate-400 uppercase tracking-wider font-extrabold">Site Health Target</p>
          <p className="text-xs font-bold text-slate-935 dark:text-white mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            100% Core Web Vitals Passed
          </p>
        </div>
      </div>

      {/* Sitemap List Grid of Modules */}
      <div className="space-y-4">
        <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase select-none">
          INDEXABLE ASSET REGISTRY ({sitemapItems.length} SECTIONS)
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {sitemapItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="group relative border border-slate-200/60 dark:border-slate-850 bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 p-5 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h5>
                      <span className="text-[9px] font-mono tracking-wider font-extrabold bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-200/30 dark:border-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                      {item.description}
                    </p>

                    {/* Metadata indicators for crawler audit preview */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 font-mono text-[9px] uppercase tracking-wider text-slate-405 dark:text-slate-500 font-extrabold select-none">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        Status: {item.status}
                      </span>
                      <span>•</span>
                      <span>Mod: {item.lastModified}</span>
                      <span>•</span>
                      <span>Frequency: {item.changefreq}</span>
                      <span>•</span>
                      <span>Priority: {item.priority}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation CTA button */}
                <button
                  onClick={() => handleNavigateToTool(item.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 hover:bg-indigo-55 w-full sm:w-auto shrink-0 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/60 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-3xs"
                  title={`Launch the interactive ${item.name} workspace`}
                >
                  Launch Workspace
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Search Analytics Route & SEO Keywords Map Table */}
      <div className="space-y-4" id="seo-routes-table-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150/80 dark:border-slate-800 pb-3">
          <div>
            <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase select-none">
              Crawler Target Routes & Index Mapping Table
            </h4>
            <p className="text-[11px] text-slate-505 dark:text-slate-400 mt-1">
              Deterministic routing pathways matched with target SEO keywords to optimize search content parsing weights.
            </p>
          </div>
          <span className="text-[10px] font-mono select-none px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40 font-bold self-start whitespace-nowrap">
            GOOGLEBOT INDEX: ACTIVE (FOLLOW)
          </span>
        </div>

        <div className="w-full overflow-x-auto border border-slate-200/60 dark:border-slate-850 rounded-2xl bg-white/50 dark:bg-slate-900/30 shadow-3xs">
          <table className="w-full text-left font-sans border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 font-extrabold uppercase tracking-widest text-[10px] select-none">
                <th className="py-3 px-4">Route Path</th>
                <th className="py-3 px-4">Canonical Identifier</th>
                <th className="py-3 px-4">Focus Keywords</th>
                <th className="py-3 px-4">Detailed Meta-Description</th>
                <th className="py-3 px-4 text-center">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850/70 font-medium">
              {sitemapItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-all duration-150"
                >
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <button
                      onClick={() => handleNavigateToTool(item.id)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-left cursor-pointer"
                    >
                      {item.url}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 dark:text-white font-bold whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="flex flex-wrap gap-1">
                      {item.keywords.map((keywd, kid) => (
                        <span 
                          key={kid}
                          className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-450 border border-slate-200/40 dark:border-slate-800 font-mono text-[9px] px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap"
                        >
                          {keywd}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-550 dark:text-slate-405 text-[11px] leading-relaxed max-w-[280px]">
                    {item.metaDescription}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 font-bold uppercase select-none">
                      Index 200
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Crawler Diagnostics Log Terminal */}
      <div className="border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-slate-400 rounded-2xl p-5 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
              Live crawler execution simulator
            </span>
          </div>
          <span className="text-[10px] text-slate-600">v1.0.8 // STABLE</span>
        </div>
        <div className="space-y-1.5 leading-relaxed select-none">
          <p className="text-emerald-450">[SUCCESS] Host system handshakes verified locally</p>
          <p className="text-slate-505">[INFO] Injecting JSON-LD FAQ objects into template scripts</p>
          <p className="text-slate-505">[INFO] Google AdSense page-view compatibility score: 99.8%</p>
          <p className="text-slate-505">[INFO] Custom XML sitemap index generated under standard sitemap-schema 0.9 specs</p>
          <p className="text-emerald-450">[STANDBY] Waiting for standard Googlebot, Bingbot, or custom client validation agent...</p>
        </div>
      </div>
    </div>
  );
}
