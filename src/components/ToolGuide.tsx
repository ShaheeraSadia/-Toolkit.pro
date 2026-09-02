import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  CheckCircle2,
  Info
} from "lucide-react";

interface ToolGuideProps {
  activeTab: string;
  theme: "light" | "dark";
}

interface GuideContent {
  titleEn: string;
  descEn: string;
  stepsEn: string[];
  proTipEn: string;
}

const guidesData: Record<string, GuideContent> = {
  quote: {
    titleEn: "Quote Designer",
    descEn: "Create, customize, and render high-contrast elegant typographic quote cards. Perfect for social media, merchandise designs, or physical prints.",
    stepsEn: [
      "Select a beautifully curated typographic design preset or start from scratch.",
      "Input your favorite quote, customize author name, and adjust spacing parameters.",
      "Choose rich backdrop filters, radial gradients, or subtle Gaussian blur levels.",
      "Export directly to high-resolution PNG/PDF format or sync cleanly with Google Drive."
    ],
    proTipEn: "Pair high-serif display headings with geometric sans-serif subtexts for the ultimate premium typographic look."
  },
  compress: {
    titleEn: "Image Compressor",
    descEn: "High-performance browser-side image optimization. Compress JPEG, PNG, and WebP files without quality loss, using real-time projected savings indicators.",
    stepsEn: [
      "Drag and drop or select one or multiple images to add to the optimization queue.",
      "Adjust the quality slider to find your perfect balance of visual fidelity and file size reduction.",
      "Check the real-time Est. Batch Savings indicator to preview projected size on the fly.",
      "Download optimized individual files or download the entire compressed batch as a single ZIP archive."
    ],
    proTipEn: "Setting the compression quality around 75% to 85% typically yields massive file size savings (up to 80%) with zero visible quality loss."
  },
  qr: {
    titleEn: "QR Generator",
    descEn: "Encode scan coordinates, URLs, WiFi credentials, or custom texts into beautiful, fully branded high-resolution vector QR Codes.",
    stepsEn: [
      "Enter any web address (URL), text message, phone number, or network details.",
      "Customize dot scales, corner designs, and custom responsive eye alignments.",
      "Apply sophisticated slate-indigo gradients or match with your exact brand palette.",
      "Download high-fidelity PNG, JPG, or SVG vectors for print layouts."
    ],
    proTipEn: "Always keep a high contrast between foreground and background. Scanners have difficulty reading low-contrast or inverted color combinations."
  },
  palette: {
    titleEn: "Color Extractor",
    descEn: "Extract, analyze, and save professional color schemes directly from uploaded photography or brand assets using advanced color spectrum algorithms.",
    stepsEn: [
      "Upload or drop any image to initiate pixel-spectrum analysis.",
      "Select color extraction depth and choose between dominant or median tone algorithms.",
      "Click any extracted hex swatch to instantly copy it to your clipboard.",
      "Save the palette layout or export color data variables for CSS or Tailwind integration."
    ],
    proTipEn: "Use 'Median Extract' mode for soft, balanced natural tones, and 'Dominant' mode for punchy, high-impact marketing colors."
  },
  video: {
    titleEn: "Image to Video",
    descEn: "Turn static image assets into cinematic, looping MP4 or GIF animations. Add ambient visualizers, smooth panning, and responsive focus effects.",
    stepsEn: [
      "Select a source image from your uploaded assets or Google Drive folders.",
      "Choose a motion path (zoom in, pan left, circular orbit, or subtle tilt).",
      "Configure loop duration, framerates, and optional overlay elements.",
      "Render fully client-side and download your output smoothly."
    ],
    proTipEn: "Pair circular motion paths with a longer 6-second render for a highly realistic parallax cinematic feel."
  },
  drive: {
    titleEn: "Google Drive Hub",
    descEn: "A secure, centralized control panel to manage, search, and preview designs created across Toolkit's various professional workspaces.",
    stepsEn: [
      "Authenticate securely via Google OAuth directly within the standalone sandbox.",
      "Browse through auto-saved files, project configurations, and rendered media assets.",
      "Open or load any file directly into its corresponding tool editor in one click.",
      "Import assets from your primary cloud folders into current active sessions."
    ],
    proTipEn: "Files saved to the 'Toolkit_Pro' directory are automatically indexed and available for fast cross-tool retrieval."
  },
  resources: {
    titleEn: "Guides & SEO Center",
    descEn: "Browse through comprehensive, SEO-optimized tech articles, PWA installation guides, and professional deployment checklists.",
    stepsEn: [
      "Browse specialized articles covering performance design and web speed index practices.",
      "Follow step-by-step PWA manual setup and native installation checklists.",
      "Copy meta-tag layouts, sitemap schemas, or optimized robot structures.",
      "Use search filter indicators to quickly pin down compliance and utility topics."
    ],
    proTipEn: "Add this application as a PWA on your home screen to unlock background rendering capabilities and avoid browser context interruptions."
  },
  legal: {
    titleEn: "AdSense & Policy Compliance",
    descEn: "Verify layout configurations against Google AdSense guidelines. Access pre-validated legal disclosures, terms of service, and cookie consent banners.",
    stepsEn: [
      "Check interactive mock banners to learn optimal ad distance ratios.",
      "Review sitemaps, privacy policy disclosures, and user rights templates.",
      "Generate custom compliant GDPR cookie disclosure containers.",
      "Export structured HTML policy text modules directly into web codebases."
    ],
    proTipEn: "Always place advertising banners at least 150px away from main action controls to prevent accidental clicks and maintain top compliance."
  },
  android: {
    titleEn: "Android Studio Console",
    descEn: "View mobile asset guidelines, native Gradle configuration profiles, and dynamic XML/Compose material blocks.",
    stepsEn: [
      "Access dynamic configurations and Gradle property declarations.",
      "View high-performance Android design token scales.",
      "Copy Jetpack Compose material structures or classic XML layouts.",
      "Analyze safe scaling multipliers for ultra-dense screen layouts."
    ],
    proTipEn: "Utilize declarative dynamic padding multipliers when scaling interface items between custom mobile screens."
  },
  pdf: {
    titleEn: "PDF Standalone Suite",
    descEn: "High-performance client-side PDF workspace. Merge separate documents, extract pages, convert image bundles to PDF, or compress document size.",
    stepsEn: [
      "Upload or drag your documents/images into the secure browser pipeline.",
      "Re-order pages, select scaling options, or configure compression parameters.",
      "Trigger direct local compilation with no data sent to external servers.",
      "Download your beautifully structured high-fidelity PDF output."
    ],
    proTipEn: "Optimize and compress your source images beforehand using our 'Image Compressor' to ensure the final compiled PDF stays incredibly compact."
  },
  converter: {
    titleEn: "Batch Image Converter",
    descEn: "Instant local image conversion across modern web formats including WebP, AVIF, PNG, and JPEG. Built for lightning-fast asset pipeline workflows.",
    stepsEn: [
      "Drop or browse a batch of images in any common image format.",
      "Select your target web optimization output format (WebP or AVIF recommended).",
      "Configure target dimension multipliers or keep original sizes.",
      "Click Convert to trigger direct browser-level conversion and download."
    ],
    proTipEn: "Convert your older JPEG/PNG assets to WebP or AVIF to instantly boost your website page speed index and SEO rankings."
  },
  bgremover: {
    titleEn: "AI Background Remover",
    descEn: "Seamless browser-level image isolation. Isolate portrait foreground subject fields from backgrounds cleanly using client-side AI processing.",
    stepsEn: [
      "Select any portrait, product photo, or high-contrast foreground subject image.",
      "Allow the local AI engine to isolate and segment background pixel fields.",
      "Preview alpha mask layers or toggle clean transparent/solid backdrops.",
      "Export high-quality alpha-transparent PNG file assets."
    ],
    proTipEn: "Upload images with clear visual separation between the main foreground subject and background for the cleanest edge isolation."
  }
};

export default function ToolGuide({ activeTab, theme }: ToolGuideProps) {
  const guide = guidesData[activeTab];
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`toolkit-guide-expanded-${activeTab}`);
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`toolkit-guide-expanded-${activeTab}`, String(isExpanded));
    }
  }, [isExpanded, activeTab]);

  if (!guide) return null;

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden border transition-all duration-300 ${
        theme === "dark" 
          ? "bg-slate-900/60 border-indigo-900/40 shadow-xl shadow-indigo-950/10" 
          : "bg-white border-indigo-100/80 shadow-md shadow-indigo-100/20"
      }`}
      id={`guide-container-${activeTab}`}
    >
      {/* Radiant Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
      
      {/* Header Panel */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-5 md:px-6 cursor-pointer select-none transition-colors duration-150 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                {guide.titleEn} Guide
                <span className="hidden sm:inline-block h-3 w-px bg-slate-300 dark:bg-slate-700" />
                <span className="text-[13px] text-slate-600 dark:text-slate-300 font-semibold lowercase font-mono">how it works</span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl line-clamp-1 font-medium">
              {guide.descEn}
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 transition-all shadow-3xs cursor-pointer"
          aria-label={isExpanded ? "Collapse guide" : "Expand guide"}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Body Panel */}
      {isExpanded && (
        <div className="px-5 md:px-6 pb-6 pt-1 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
          
          {/* Main Overview */}
          <div className="pb-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Overview
              </span>
              <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans max-w-3xl font-normal">
                {guide.descEn}
              </p>
            </div>
          </div>

          {/* Core Interactive Step Guide */}
          <div className="py-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Operational Step-by-Step
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {guide.stepsEn.map((step, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-start text-left shadow-2xs">
                  <span className="inline-flex items-center justify-center w-7 h-7 mb-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 border border-indigo-300 dark:border-indigo-600 text-xs font-black text-indigo-700 dark:text-indigo-200 font-mono shadow-xs">
                    0{idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips Panel */}
          <div className={`mt-1 p-4 rounded-2xl border ${
            theme === "dark" 
              ? "bg-indigo-950/40 border-indigo-800/80 text-indigo-100" 
              : "bg-indigo-50/70 border-indigo-200 text-indigo-950"
          }`}>
            <div className="flex items-start gap-3 text-left">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Pro Tip</p>
                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed mt-1 font-medium">
                  {guide.proTipEn}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
