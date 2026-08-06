import React, { useState } from "react";
import { Folder, ArrowUpRight, Plus, Sparkles, FileImage, QrCode, ArrowUpDown, ChevronDown, Search, X } from "lucide-react";

interface ProjectShowcaseHubProps {
  theme?: "light" | "dark";
  onSelectTab: (tab: string) => void;
}

interface ShowcaseProject {
  id: string;
  title: string;
  subtitle: string;
  toolType: string;
  author: string;
  img: string;
  tab: string;
  timestamp: number;
  dateStr: string;
}

function HighlightedText({ text, query, theme }: { text: string; query: string; theme?: "light" | "dark" }) {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className={`px-0.5 py-0.2 rounded font-black ${
              theme === "dark"
                ? "bg-amber-400/30 text-amber-300 border border-amber-400/40"
                : "bg-amber-200 text-indigo-950"
            }`}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function ProjectShowcaseHub({ theme = "light", onSelectTab }: ProjectShowcaseHubProps) {
  const [sortBy, setSortBy] = useState<"recent" | "toolType" | "alphabetical">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const initialProjects: ShowcaseProject[] = [
    {
      id: "p1",
      title: "Instagram Social Kit",
      subtitle: "Quote Designer Pro",
      toolType: "Quote Designer",
      author: "Saddiq Studio",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      tab: "quote",
      timestamp: 1774000000000,
      dateStr: "2 hours ago"
    },
    {
      id: "p2",
      title: "Brand Asset Compression Bundle",
      subtitle: "Lossless Compressor",
      toolType: "Image Compressor",
      author: "Apex Graphics",
      img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
      tab: "compress",
      timestamp: 1773900000000,
      dateStr: "Yesterday"
    },
    {
      id: "p3",
      title: "Aura Campaign Vector QR Matrix",
      subtitle: "Vector QR Matrix",
      toolType: "QR Generator",
      author: "Sofia Chen",
      img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      tab: "qr",
      timestamp: 1773800000000,
      dateStr: "3 days ago"
    },
    {
      id: "p4",
      title: "Zurich Studio WCAG Palette",
      subtitle: "Palette Extractor",
      toolType: "Color Swatches",
      author: "Elena Rostova",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      tab: "palette",
      timestamp: 1773700000000,
      dateStr: "5 days ago"
    }
  ];

  const filteredProjects = initialProjects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.toolType.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "recent") {
      return b.timestamp - a.timestamp;
    }
    if (sortBy === "toolType") {
      return a.toolType.localeCompare(b.toolType);
    }
    if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const shortcuts = [
    {
      id: "s1",
      title: "Compress Image",
      desc: "Lossless WebP compression",
      icon: FileImage,
      tab: "compress"
    },
    {
      id: "s2",
      title: "QR Vector Matrix",
      desc: "Reed-Solomon scanning",
      icon: QrCode,
      tab: "qr"
    }
  ];

  return (
    <section 
      aria-labelledby="project-showcase-heading"
      className={`border rounded-3xl p-5 sm:p-6 transition-colors duration-300 select-none ${
        theme === "dark"
          ? "bg-slate-900/60 border-slate-800"
          : "bg-white border-slate-200/80 shadow-xs"
      }`}
    >
      <div className="space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-black uppercase tracking-wider mb-1">
              <Folder className="w-3 h-3 text-indigo-500" />
              <span>Project Showcase Hub</span>
            </div>
            <h3 
              id="project-showcase-heading"
              className={`text-base sm:text-lg font-black tracking-tight ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Dynamic Live Previews & Workspaces
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input Box */}
            <div className="relative inline-flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className={`pl-8 pr-7 py-1.5 rounded-xl text-xs font-bold border transition-all placeholder:text-slate-400 focus:outline-none ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 shadow-2xs"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown Filter */}
            <div className="relative inline-flex items-center">
              <label htmlFor="project-sort-select" className="sr-only">
                Sort Projects
              </label>
              <div className="absolute left-2.5 pointer-events-none text-indigo-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
              <select
                id="project-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`pl-8 pr-7 py-1.5 rounded-xl text-xs font-extrabold appearance-none cursor-pointer border transition-all ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500/40 focus:border-indigo-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-200 focus:border-indigo-500 shadow-2xs"
                }`}
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="toolType">Sort: Tool Type</option>
                <option value="alphabetical">Sort: Alphabetical</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400" />
            </div>

            <button
              onClick={() => onSelectTab("sitemap")}
              className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all cursor-pointer shrink-0"
              title="Create New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Recent Projects Cards */}
          <div className="lg:col-span-8">
            {sortedProjects.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                theme === "dark"
                  ? "bg-slate-950/50 border-slate-800 text-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <p className="text-xs font-bold">No projects found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-extrabold text-indigo-500 hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => onSelectTab(proj.tab)}
                    className={`p-3 rounded-2xl border transition-all duration-300 hover:scale-102 cursor-pointer flex flex-col justify-between space-y-3 group ${
                      theme === "dark"
                        ? "bg-slate-950/70 border-slate-800 hover:border-indigo-500/40 text-slate-100"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-indigo-200 shadow-2xs text-slate-800"
                    }`}
                  >
                    <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200/40 dark:border-slate-800">
                      <img
                        src={proj.img}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 p-1 rounded-lg bg-slate-950/80 text-white backdrop-blur-md text-[9px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Live
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-200 backdrop-blur-md text-[8.5px] font-mono font-bold">
                        <HighlightedText text={proj.toolType} query={searchQuery} theme={theme} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
                          <HighlightedText text={proj.subtitle} query={searchQuery} theme={theme} />
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {proj.dateStr}
                        </span>
                      </div>
                      <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors line-clamp-1">
                        <HighlightedText text={proj.title} query={searchQuery} theme={theme} />
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        <HighlightedText text={proj.author} query={searchQuery} theme={theme} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool Shortcuts */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Tool Shortcuts
            </span>

            <div className="space-y-2">
              {shortcuts.map((sc) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={sc.id}
                    onClick={() => onSelectTab(sc.tab)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-200 hover:scale-102 cursor-pointer group ${
                      theme === "dark"
                        ? "bg-slate-950/70 border-slate-800 hover:border-indigo-500/40 text-slate-100"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-indigo-200 shadow-2xs text-slate-800"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors truncate">
                        {sc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {sc.desc}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

