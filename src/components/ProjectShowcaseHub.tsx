import React from "react";
import { Folder, Image as ImageIcon, ArrowUpRight, Plus, Sparkles, Layers, FileImage, QrCode, Quote } from "lucide-react";

interface ProjectShowcaseHubProps {
  theme?: "light" | "dark";
  onSelectTab: (tab: string) => void;
}

export function ProjectShowcaseHub({ theme = "light", onSelectTab }: ProjectShowcaseHubProps) {
  const projects = [
    {
      id: "p1",
      title: "Instagram Social Kit",
      subtitle: "Instagram Brand Kit",
      author: "Saddiq Studio",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      tab: "quote"
    },
    {
      id: "p2",
      title: "Instagram Brand Kit",
      subtitle: "Instagram Brand Kit",
      author: "Saddiq Studio",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      tab: "quote"
    }
  ];

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
        <div className="flex items-center justify-between">
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
              Dynamic Live Previews & Shortcuts
            </h3>
          </div>

          <button
            onClick={() => onSelectTab("sitemap")}
            className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Recent Projects Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => (
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
                </div>

                <div className="space-y-0.5">
                  <span className="text-[8.5px] font-mono font-bold text-indigo-500 uppercase tracking-wider block">
                    {proj.subtitle}
                  </span>
                  <h4 className="text-xs font-black tracking-tight group-hover:text-indigo-500 transition-colors">
                    {proj.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {proj.author}
                  </p>
                </div>
              </div>
            ))}
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
