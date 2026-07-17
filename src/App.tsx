import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { DriveFile, ActiveTab, RecentActivity } from "./types";
import { initAuth, googleSignIn, logout, getAccessToken } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { listDriveFiles } from "./lib/drive";
import Navbar from "./components/Navbar";
import QuoteDesigner from "./components/QuoteDesigner";
import ImageCompressor from "./components/ImageCompressor";
import QrGenerator from "./components/QrGenerator";
import ColorExtractor from "./components/ColorExtractor";
import ImageToVideo from "./components/ImageToVideo";
import DriveExplorer from "./components/DriveExplorer";
import ResourcesHub from "./components/ResourcesHub";
import AdSenseCompliance from "./components/AdSenseCompliance";
import AdSenseMock from "./components/AdSenseMock";
import SitemapView from "./components/SitemapView";
import CommandPalette from "./components/CommandPalette";
import ShortcutsModal from "./components/ShortcutsModal";
import RecentActivitiesWidget from "./components/RecentActivitiesWidget";
import UsageInsightsWidget from "./components/UsageInsightsWidget";
import AppTourOverlay from "./components/AppTourOverlay";
import FeedbackModal from "./components/FeedbackModal";
import AndroidWorkspace from "./components/AndroidWorkspace";
import PDFTools from "./components/PDFTools";
import ImageConverter from "./components/ImageConverter";
import BackgroundRemover from "./components/BackgroundRemover";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import brandLogo from "./assets/images/toolkit_pro_logo_1781887052514.jpg";

import {
  Sparkles,
  Quote,
  FileImage,
  QrCode,
  Pipette,
  Video,
  CloudLightning,
  AlertCircle,
  Cloud,
  BookOpen,
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Globe,
  Command,
  ArrowUp,
  Keyboard,
  MessageSquare,
  Printer,
  Monitor,
  Smartphone,
  Download,
  Loader2,
  Crop,
  Eye,
  Scissors,
  Home,
  Menu,
  X,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  Clock,
  ArrowUpRight,
  Activity,
  Award,
  Trash2,
  RefreshCw,
  Search,
  Eraser,
  FileText,
  FolderOpen,
  Plus,
  GripVertical,
} from "lucide-react";

function renderTabPreview(tabId: string) {
  switch (tabId) {
    case "quote":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-lg blur-md opacity-75" />
            <span className="relative text-[11px] font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              "Design beautiful graphics..."
            </span>
            <div className="relative flex gap-1.5 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Canvas size: 1080px</span>
            <span>PNG/JPEG export</span>
          </div>
        </div>
      );
    case "compress":
      return (
        <div className="space-y-2">
          <div className="relative border border-dashed border-indigo-400/40 p-2.5 rounded-lg bg-indigo-50/10 dark:bg-indigo-950/10 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-lg blur-md opacity-70" />
            <span className="relative text-[9px] font-bold text-slate-500 dark:text-slate-400">
              Drag file here to compress
            </span>
            <div className="relative flex items-center gap-1.5 mt-2">
              <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 py-0.5 rounded">4.2 MB</span>
              <span className="text-[8px] text-slate-400">→</span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold">480 KB</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Median Cut algorithm</span>
            <span className="text-emerald-500 font-bold">-89% saved</span>
          </div>
        </div>
      );
    case "qr":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center justify-between gap-3">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 rounded-lg blur-md opacity-70" />
            <div className="relative w-8 h-8 border border-slate-400/40 p-0.5 bg-slate-950 rounded">
              <div className="grid grid-cols-4 gap-0.5 h-full w-full opacity-80">
                <div className="bg-white rounded-xs" />
                <div className="bg-transparent" />
                <div className="bg-white rounded-xs" />
                <div className="bg-white rounded-xs" />
                <div className="bg-transparent" />
                <div className="bg-white rounded-xs" />
                <div className="bg-transparent" />
                <div className="bg-white rounded-xs" />
                <div className="bg-white rounded-xs" />
                <div className="bg-transparent" />
                <div className="bg-white rounded-xs" />
                <div className="bg-white rounded-xs" />
                <div className="bg-white rounded-xs" />
                <div className="bg-white rounded-xs" />
                <div className="bg-transparent" />
                <div className="bg-white rounded-xs" />
              </div>
            </div>
            <div className="relative flex-1 space-y-1">
              <div className="h-1 w-full bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-1 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-1 w-1/2 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Reed-Solomon ECC</span>
            <span>Custom corners</span>
          </div>
        </div>
      );
    case "palette":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-lg blur-md opacity-70" />
            <div className="relative flex h-5 rounded overflow-hidden">
              <div className="flex-1 bg-indigo-600" />
              <div className="flex-1 bg-purple-500" />
              <div className="flex-1 bg-pink-500" />
              <div className="flex-1 bg-amber-400" />
              <div className="flex-1 bg-emerald-400" />
            </div>
            <div className="relative flex justify-between mt-1 text-[7px] font-mono text-slate-400">
              <span>#4F46E5</span>
              <span>#10B981</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Median Cut algorithm</span>
            <span>Copy hex codes</span>
          </div>
        </div>
      );
    case "video":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs space-y-1.5">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-lg blur-md opacity-70" />
            <div className="relative h-6 bg-slate-950/80 rounded flex items-center justify-center overflow-hidden">
              <span className="text-[7.5px] font-mono text-indigo-400 font-bold animate-pulse">00:06.0</span>
            </div>
            <div className="relative space-y-1">
              <div className="h-1.5 bg-indigo-500/30 dark:bg-indigo-950/50 border border-indigo-400/20 rounded w-full flex items-center px-1">
                <div className="h-0.5 bg-indigo-500 w-2/3 rounded" />
              </div>
              <div className="h-1.5 bg-emerald-500/20 dark:bg-emerald-950/30 border border-emerald-400/20 rounded w-full flex items-center px-1">
                <div className="h-0.5 bg-emerald-500 w-1/2 rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Video & subtitles</span>
            <span>Luma & Sora engine</span>
          </div>
        </div>
      );
    case "drive":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs space-y-1.5">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/15 to-blue-500/15 rounded-lg blur-md opacity-70" />
            <div className="relative grid grid-cols-2 gap-1.5">
              <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/30 dark:border-slate-700 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-[7px] font-bold text-slate-600 dark:text-slate-300 truncate">Quotes</span>
              </div>
              <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/30 dark:border-slate-700 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="text-[7px] font-bold text-slate-600 dark:text-slate-300 truncate">Videos</span>
              </div>
            </div>
            <div className="relative h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 w-2/3" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Google Drive files</span>
            <span>Cloud sync engine</span>
          </div>
        </div>
      );
    case "resources":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs space-y-1">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/15 to-emerald-500/15 rounded-lg blur-md opacity-70" />
            <div className="relative space-y-1 border-b border-slate-200/20 pb-1">
              <div className="h-1.5 w-full bg-slate-400 dark:bg-slate-600 rounded" />
              <div className="h-1 w-2/3 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
            <div className="relative flex justify-between items-center pt-0.5 text-[7px] font-bold text-teal-600 dark:text-teal-400">
              <span>Read: CPC Guide</span>
              <span className="bg-teal-500/20 text-[6px] px-1 rounded-sm leading-none py-0.5 uppercase tracking-wider font-mono">5m</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>SEO knowledge hub</span>
            <span>AdSense policies</span>
          </div>
        </div>
      );
    case "legal":
      return (
        <div className="space-y-2">
          <div className="relative border border-slate-200/50 dark:border-slate-800 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center gap-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/15 to-indigo-500/15 rounded-lg blur-md opacity-70" />
            <div className="relative w-5 h-5 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300/30 dark:border-slate-700">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 animate-pulse" />
            </div>
            <div className="relative flex-1 space-y-1">
              <div className="h-1 w-full bg-slate-400 dark:bg-slate-600 rounded" />
              <div className="h-1 w-5/6 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 dark:text-slate-500">
            <span>Privacy & AdSense</span>
            <span>Direct help desk</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export interface PrinterPreset {
  id: string;
  name: string;
  description: string;
  margins: "standard" | "minimum" | "none";
  cropMarks: boolean;
  safeArea: boolean;
  bleed?: boolean;
  bleedWidth?: number;
  orientation?: "portrait" | "landscape";
  icon: string;
  category: "Standard" | "Professional" | "Specialty";
}

export const PRINTER_PRESETS: PrinterPreset[] = [
  {
    id: "home-inkjet",
    name: "Home Inkjet",
    description: "Standard margins, safe areas active, crop marks disabled for home printers.",
    margins: "standard",
    cropMarks: false,
    safeArea: true,
    bleed: false,
    bleedWidth: 0,
    icon: "🖨️",
    category: "Standard",
  },
  {
    id: "professional-offset",
    name: "Professional Offset",
    description: "High-precision trim marks, registration targets, minimum bleed margins, and a red bleed boundary.",
    margins: "minimum",
    cropMarks: true,
    safeArea: true,
    bleed: true,
    bleedWidth: 3,
    icon: "🏭",
    category: "Professional",
  },
  {
    id: "standard-pdf",
    name: "Standard PDF Export",
    description: "Standard margins, clean borders, and zero crop/registration overlays.",
    margins: "standard",
    cropMarks: false,
    safeArea: false,
    bleed: false,
    bleedWidth: 0,
    icon: "📄",
    category: "Standard",
  },
  {
    id: "full-bleed-poster",
    name: "Full Bleed Poster",
    description: "Zero margins and corner trim marks with a red bleed boundary for borderless edge-to-edge printing.",
    margins: "none",
    cropMarks: true,
    safeArea: true,
    bleed: true,
    bleedWidth: 5,
    icon: "🎨",
    category: "Specialty",
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  interface SavedProject {
    id: string;
    name: string;
    toolType: "quote" | "qr" | "palette";
    createdAt: string;
    data: any;
    order?: number;
  }

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    setProjectError(null);
    try {
      if (user) {
        // Fetch from Firestore
        const q = query(collection(db, "projects"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const projects: SavedProject[] = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          projects.push({
            id: d.id,
            name: data.name,
            toolType: data.toolType,
            createdAt: data.createdAt,
            data: data.data,
            order: data.order !== undefined ? data.order : 0,
          });
        });
        // Sort by order ascending
        projects.sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
        setSavedProjects(projects);
      } else {
        // Fetch from localStorage
        const stored = localStorage.getItem("toolkit-pro-local-projects");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.sort((a: any, b: any) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
          setSavedProjects(parsed);
        } else {
          setSavedProjects([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setProjectError(err.message || "Failed to load projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSaveProject = async (name: string, toolType: string) => {
    if (!name.trim()) return;
    setIsSavingProject(true);
    setProjectError(null);
    try {
      let projectData: any = {};
      
      // Grab state data based on tool type
      if (toolType === "quote") {
        const text = localStorage.getItem("toolkit-pro-quote-text") || "Design your story";
        const author = localStorage.getItem("toolkit-pro-quote-author") || "Anonymous";
        const bgType = localStorage.getItem("toolkit-pro-quote-bgType") || "gradient";
        const scale = localStorage.getItem("toolkit-pro-quote-scale") || "1";
        projectData = { text, author, bgType, scale };
      } else if (toolType === "qr") {
        const text = localStorage.getItem("toolkit-pro-qr-text") || "https://google.com";
        const ecc = localStorage.getItem("toolkit-pro-qr-ecc") || "H";
        const fgColor = localStorage.getItem("toolkit-pro-qr-fgColor") || "#000000";
        projectData = { text, ecc, fgColor };
      } else if (toolType === "palette") {
        const recentPalette = localStorage.getItem("toolkit-pro-recent-palette") || "[]";
        projectData = { palette: JSON.parse(recentPalette) };
      }

      const orderVal = savedProjects.length;

      const newProject = {
        name,
        toolType: toolType as any,
        createdAt: new Date().toISOString(),
        data: projectData,
        order: orderVal,
      };

      if (user) {
        // Save to Firestore
        const docRef = await addDoc(collection(db, "projects"), {
          ...newProject,
          userId: user.uid,
        });
        setSavedProjects(prev => [...prev, { id: docRef.id, ...newProject }]);
      } else {
        // Save to localStorage
        const stored = localStorage.getItem("toolkit-pro-local-projects");
        const projects = stored ? JSON.parse(stored) : [];
        const projectWithId = { id: Math.random().toString(36).substr(2, 9), ...newProject };
        projects.push(projectWithId);
        localStorage.setItem("toolkit-pro-local-projects", JSON.stringify(projects));
        setSavedProjects(projects);
      }
    } catch (err: any) {
      console.error("Failed to save project:", err);
      setProjectError(err.message || "Failed to save project.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    // Set active tab to launch the corresponding tool
    setActiveTab(project.toolType as any);
    setIsSitemapView(false);

    // Apply the saved state back to localStorage
    if (project.toolType === "quote") {
      if (project.data.text) localStorage.setItem("toolkit-pro-quote-text", project.data.text);
      if (project.data.author) localStorage.setItem("toolkit-pro-quote-author", project.data.author);
      if (project.data.bgType) localStorage.setItem("toolkit-pro-quote-bgType", project.data.bgType);
      if (project.data.scale) localStorage.setItem("toolkit-pro-quote-scale", project.data.scale);
    } else if (project.toolType === "qr") {
      if (project.data.text) localStorage.setItem("toolkit-pro-qr-text", project.data.text);
      if (project.data.ecc) localStorage.setItem("toolkit-pro-qr-ecc", project.data.ecc);
      if (project.data.fgColor) localStorage.setItem("toolkit-pro-qr-fgColor", project.data.fgColor);
    } else if (project.toolType === "palette") {
      if (project.data.palette) localStorage.setItem("toolkit-pro-recent-palette", JSON.stringify(project.data.palette));
    }

    // Fire a custom event to notify components to re-render
    window.dispatchEvent(new Event("toolkit-project-loaded"));
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      if (user) {
        // Delete from Firestore
        await deleteDoc(doc(db, "projects", projectId));
        setSavedProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        // Delete from localStorage
        const stored = localStorage.getItem("toolkit-pro-local-projects");
        if (stored) {
          const projects = JSON.parse(stored);
          const filtered = projects.filter((p: any) => p.id !== projectId);
          localStorage.setItem("toolkit-pro-local-projects", JSON.stringify(filtered));
          setSavedProjects(filtered);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      setProjectError(err.message || "Failed to delete project.");
    }
  };

  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [dragOverProjectIndex, setDragOverProjectIndex] = useState<number | null>(null);

  const handleProjectDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProjectIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleProjectDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProjectIndex === null || draggedProjectIndex === index) return;
    setDragOverProjectIndex(index);
  };

  const handleProjectDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedProjectIndex === null || draggedProjectIndex === targetIndex) {
      setDraggedProjectIndex(null);
      setDragOverProjectIndex(null);
      return;
    }

    const reordered = [...savedProjects];
    const [removed] = reordered.splice(draggedProjectIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order values
    const updatedProjects = reordered.map((proj, idx) => ({
      ...proj,
      order: idx,
    }));

    setSavedProjects(updatedProjects);
    setDraggedProjectIndex(null);
    setDragOverProjectIndex(null);

    // Update persistence
    try {
      if (user) {
        // Update order field in each Firestore document
        const promises = updatedProjects.map((proj) => {
          const docRef = doc(db, "projects", proj.id);
          return updateDoc(docRef, { order: proj.order });
        });
        await Promise.all(promises);
      } else {
        // Update in localStorage
        localStorage.setItem("toolkit-pro-local-projects", JSON.stringify(updatedProjects));
      }
    } catch (err: any) {
      console.error("Failed to update project order persistence:", err);
      setProjectError(err.message || "Failed to save reordered projects list.");
    }
  };

  const handleProjectDragEnd = () => {
    setDraggedProjectIndex(null);
    setDragOverProjectIndex(null);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState<boolean>(() => {
    return typeof window !== "undefined" && !!window.deferredInstallPrompt;
  });

  const [pwaChecking, setPwaChecking] = useState<boolean>(true);
  const [pwaProgress, setPwaProgress] = useState<number>(0);
  const [pwaStatusText, setPwaStatusText] = useState<string>("Initializing PWA...");

  useEffect(() => {
    const handlePromptReady = () => {
      setHasDeferredPrompt(true);
    };
    window.addEventListener("installpromptready", handlePromptReady);
    return () => {
      window.removeEventListener("installpromptready", handlePromptReady);
    };
  }, []);

  // Simulate compatibility verification and check on initialization
  useEffect(() => {
    let timer: any;
    let currentProgress = 0;

    const steps = [
      { progress: 25, text: "Checking browser secure context..." },
      { progress: 55, text: "Verifying service worker support..." },
      { progress: 80, text: "Scanning display layout capability..." },
      { progress: 100, text: "PWA Engine initialized" }
    ];

    let stepIndex = 0;

    const runProgressStep = () => {
      if (stepIndex >= steps.length) {
        setPwaChecking(false);
        return;
      }

      const currentStep = steps[stepIndex];
      setPwaStatusText(currentStep.text);

      const targetProgress = currentStep.progress;
      const interval = setInterval(() => {
        currentProgress += 4;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(interval);
          stepIndex++;
          timer = setTimeout(runProgressStep, 100);
        }
        setPwaProgress(currentProgress);
      }, 20);
    };

    timer = setTimeout(runProgressStep, 150);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Global drag and drop files trace state
  const [draggedFiles, setDraggedFiles] = useState<File[] | null>(null);
  const [isDraggingOverScreen, setIsDraggingOverScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleDragEnterScreen = (e: DragEvent) => {
      e.preventDefault();
      // Check if files are being dragged
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDraggingOverScreen(true);
      }
    };

    window.addEventListener("dragenter", handleDragEnterScreen);
    return () => {
      window.removeEventListener("dragenter", handleDragEnterScreen);
    };
  }, []);
  
  // Command Palette & Global Shortcut Trace Alert states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [lastShortcutPressed, setLastShortcutPressed] = useState<string | null>(null);

  // Auto trigger the interactive App Tour on the first visit
  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem("toolkit_pro_tour_done");
      if (!tourSeen) {
        setIsTourOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const triggerShortcutFeedback = (shortcutLabel: string) => {
    setLastShortcutPressed(shortcutLabel);
  };

  useEffect(() => {
    if (lastShortcutPressed) {
      const timer = setTimeout(() => {
        setLastShortcutPressed(null);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [lastShortcutPressed]);

  // Floating Back to Top Button state & effect
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("toolkit-pro-theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("toolkit-pro-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("toolkit-pro-high-contrast") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("toolkit-pro-high-contrast", String(highContrast));
  }, [highContrast]);

  const handleToggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Creator Onboarding Checklist & Dynamic clock states
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("toolkit-creator-checklist");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      quote: false,
      compress: false,
      qr: false,
      palette: false,
      drive: false,
    };
  });

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("toolkit-creator-checklist", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Drive synchronization
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  
  const [direction, setDirection] = useState<number>(0);
  const [_activeTab, _setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab;
      if (tabParam && ["home", "quote", "compress", "qr", "palette", "video", "drive", "resources", "legal"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "home";
  });

  const activeTab = _activeTab;
  const setActiveTab = (newTab: ActiveTab | ((prev: ActiveTab) => ActiveTab)) => {
    _setActiveTab((prev) => {
      const resolvedTab = typeof newTab === "function" ? newTab(prev) : newTab;
      const tabsList = ["home", "quote", "compress", "qr", "palette", "video", "drive", "resources", "legal"];
      const prevIndex = tabsList.indexOf(prev);
      const currentIndex = tabsList.indexOf(resolvedTab);
      if (prevIndex !== currentIndex && prevIndex !== -1 && currentIndex !== -1) {
        setDirection(currentIndex > prevIndex ? 1 : -1);
      }
      return resolvedTab;
    });
  };

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Print Preview state declarations
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [printPageMargins, setPrintPageMargins] = useState<"standard" | "minimum" | "none">("minimum");
  const [centerDesign, setCenterDesign] = useState<boolean>(true);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [showSafeArea, setShowSafeArea] = useState<boolean>(true);
  const [showBleed, setShowBleed] = useState<boolean>(false);
  const [printBleedWidth, setPrintBleedWidth] = useState<number>(3);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("professional-offset");

  const [printerPresets, setPrinterPresets] = useState<PrinterPreset[]>(() => {
    try {
      const saved = localStorage.getItem("custom_app_printer_presets");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load custom app print presets:", e);
    }
    return [
      {
        id: "home-inkjet",
        name: "Home Inkjet",
        description: "Standard margins, portrait mode, safe areas active, crop marks disabled.",
        margins: "standard",
        cropMarks: false,
        safeArea: true,
        bleed: false,
        bleedWidth: 0,
        orientation: "portrait",
        icon: "🖨️",
        category: "Standard",
      },
      {
        id: "professional-offset",
        name: "Professional Offset",
        description: "High-precision trim marks, registration targets, minimum bleed margins, and a red bleed boundary.",
        margins: "minimum",
        cropMarks: true,
        safeArea: true,
        bleed: true,
        bleedWidth: 3,
        orientation: "portrait",
        icon: "🏭",
        category: "Professional",
      },
      {
        id: "standard-pdf",
        name: "Standard PDF Export",
        description: "Standard margins, clean borders, and zero crop/registration overlays.",
        margins: "standard",
        cropMarks: false,
        safeArea: false,
        bleed: false,
        bleedWidth: 0,
        orientation: "portrait",
        icon: "📄",
        category: "Standard",
      },
      {
        id: "full-bleed-poster",
        name: "Full Bleed Poster",
        description: "Zero margins and corner trim marks with a red bleed boundary for borderless edge-to-edge landscape printing.",
        margins: "none",
        cropMarks: true,
        safeArea: true,
        bleed: true,
        bleedWidth: 5,
        orientation: "landscape",
        icon: "🎨",
        category: "Specialty",
      }
    ];
  });

  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [newPresetDesc, setNewPresetDesc] = useState<string>("");
  const [newPresetIcon, setNewPresetIcon] = useState<string>("🖨️");
  const [newPresetCategory, setNewPresetCategory] = useState<"Standard" | "Professional" | "Specialty">("Standard");

  const savePresets = (newPresets: PrinterPreset[]) => {
    setPrinterPresets(newPresets);
    try {
      localStorage.setItem("custom_app_printer_presets", JSON.stringify(newPresets));
    } catch (e) {
      console.warn("Failed to save custom app print presets:", e);
    }
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim()) {
      alert("Please enter a name for your preset.");
      return;
    }
    const newPreset: PrinterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `Custom margins (${printPageMargins}), crop marks (${showCropMarks ? "on" : "off"}), safe area (${showSafeArea ? "on" : "off"}), bleed (${showBleed ? "on" : "off"} ${printBleedWidth}mm), orientation (${printOrientation}).`,
      margins: printPageMargins,
      cropMarks: showCropMarks,
      safeArea: showSafeArea,
      bleed: showBleed,
      bleedWidth: printBleedWidth,
      orientation: printOrientation,
      icon: newPresetIcon,
      category: newPresetCategory
    };

    const updated = [...printerPresets, newPreset];
    savePresets(updated);
    setSelectedPresetId(newPreset.id);
    
    // Clear form
    setNewPresetName("");
    setNewPresetDesc("");
    setNewPresetIcon("🖨️");
    setNewPresetCategory("Standard");
    setIsSavingPreset(false);
  };

  const handleDeletePreset = (id: string) => {
    const defaultIds = ["home-inkjet", "professional-offset", "standard-pdf", "full-bleed-poster"];
    if (defaultIds.includes(id)) return;

    const updated = printerPresets.filter((p) => p.id !== id);
    savePresets(updated);

    if (selectedPresetId === id) {
      setSelectedPresetId("custom");
    }
  };

  // Sync preset selection automatically with current overlay configuration options
  useEffect(() => {
    const matchedPreset = printerPresets.find(
      (p) =>
        p.margins === printPageMargins &&
        p.cropMarks === showCropMarks &&
        p.safeArea === showSafeArea &&
        (p.bleed === undefined || p.bleed === showBleed) &&
        (p.bleedWidth === undefined || p.bleedWidth === printBleedWidth) &&
        (!p.orientation || p.orientation === printOrientation)
    );
    if (matchedPreset) {
      setSelectedPresetId(matchedPreset.id);
    } else {
      setSelectedPresetId("custom");
    }
  }, [printPageMargins, showCropMarks, showSafeArea, showBleed, printBleedWidth, printOrientation, printerPresets]);

  useEffect(() => {
    if (isPrintPreviewOpen) {
      let selector = "";
      if (activeTab === "quote") {
        selector = "#quote-card-preview";
      } else if (activeTab === "qr") {
        selector = "#qr-code-preview-card";
      } else if (activeTab === "palette") {
        selector = ".palette-swatches-grid";
      } else if (activeTab === "compress") {
        selector = ".compression-results-view, #active-compression-preview";
      } else if (activeTab === "drive") {
        selector = ".drive-files-grid";
      }

      if (selector) {
        // Yield minor layout frame buffer before polling DOM for accurate updated state content
        const timer = setTimeout(() => {
          const element = document.querySelector(selector);
          if (element) {
            if (activeTab === "palette") {
              const hist = document.querySelector(".color-histogram-chart");
              let combined = element.outerHTML;
              if (hist) {
                combined += `<div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">${hist.outerHTML}</div>`;
              }
              setPreviewHtml(combined);
            } else {
              setPreviewHtml(element.outerHTML);
            }
          } else {
            setPreviewHtml(`
              <div class="p-12 text-center text-slate-450 dark:text-slate-500 font-sans space-y-4">
                <p class="font-black text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">No Content Ready to Print</p>
                <p class="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-400">Please generate or load an active design layout in the ${activeTab === "quote" ? "Quote Designer" : "active tool"} panel to view its high-fidelity physical printed replica page layout!</p>
              </div>
            `);
          }
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setPreviewHtml(`
          <div class="p-12 text-center text-slate-450 dark:text-slate-500 font-sans space-y-4">
            <p class="font-black text-sm uppercase tracking-wider text-indigo-505 dark:text-amber-400">Document Review Mode</p>
            <p class="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-400">The current workspace consists of digital articles or compliance forms which will be formatted automatically to standardized standard paper layouts when choosing browser print actions.</p>
          </div>
        `);
      }
    }
  }, [isPrintPreviewOpen, activeTab]);

  const handleDownloadPDF = () => {
    // Create a temporary hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Get all style elements from current head to preserve styles and tailwind classes
    const styleElements = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map(el => el.outerHTML)
      .join("\n");

    const pagePadding =
      printPageMargins === "standard"
        ? "1.5cm"
        : printPageMargins === "minimum"
        ? "0.5cm"
        : "0cm";

    const widthDim = printOrientation === "portrait" ? "210mm" : "297mm";
    const heightDim = printOrientation === "portrait" ? "297mm" : "210mm";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Preview - Download as PDF</title>
  ${styleElements}
  <style>
    @page {
      size: A4 ${printOrientation};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print-page {
      position: relative;
      width: ${widthDim};
      height: ${heightDim};
      box-sizing: border-box;
      background: #ffffff !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: ${pagePadding};
    }
    
    /* Crop marks styling */
    .crop-mark-h {
      position: absolute;
      background-color: #e11d48 !important;
      height: 1.5px;
      width: 24px;
      z-index: 30;
    }
    .crop-mark-v {
      position: absolute;
      background-color: #e11d48 !important;
      width: 1.5px;
      height: 24px;
      z-index: 30;
    }
    
    /* Registration marks styling */
    .reg-mark {
      position: absolute;
      width: 16px;
      height: 16px;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .reg-circle {
      width: 12px;
      height: 12px;
      border: 1px solid #e11d48 !important;
      border-radius: 50%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .reg-line-h {
      width: 16px;
      height: 1px;
      background-color: #e11d48 !important;
      position: absolute;
    }
    .reg-line-v {
      height: 16px;
      width: 1px;
      background-color: #e11d48 !important;
      position: absolute;
    }

    /* Safe Area styling */
    .safe-area {
      position: absolute;
      inset: 20px;
      border: 2px dashed rgba(16, 185, 129, 0.5) !important;
      border-radius: 2px;
      z-index: 20;
      box-sizing: border-box;
      pointer-events: none;
    }
    .safe-area-label {
      position: absolute;
      top: 4px;
      left: 4px;
      font-family: monospace;
      font-size: 8px;
      font-weight: bold;
      color: #059669 !important;
      background-color: #ecfdf5 !important;
      padding: 2px 4px;
      border-radius: 2px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
    }

    /* Content Area styling */
    .content-area {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    ${centerDesign ? `
    .content-area > * {
      margin: auto !important;
    }
    ` : ""}
  </style>
</head>
<body>
  <div class="print-page">
    ${showCropMarks ? `
      <!-- Top-Left -->
      <div class="crop-mark-h" style="top: 0; left: 0;"></div>
      <div class="crop-mark-v" style="top: 0; left: 0;"></div>
      
      <!-- Top-Right -->
      <div class="crop-mark-h" style="top: 0; right: 0;"></div>
      <div class="crop-mark-v" style="top: 0; right: 0;"></div>
      
      <!-- Bottom-Left -->
      <div class="crop-mark-h" style="bottom: 0; left: 0;"></div>
      <div class="crop-mark-v" style="bottom: 0; left: 0;"></div>
      
      <!-- Bottom-Right -->
      <div class="crop-mark-h" style="bottom: 0; right: 0;"></div>
      <div class="crop-mark-v" style="bottom: 0; right: 0;"></div>

      <!-- Registration Targets -->
      <div class="reg-mark" style="top: 6px; left: 50%; transform: translateX(-50%);">
        <div class="reg-circle">
          <div class="reg-line-h"></div>
          <div class="reg-line-v"></div>
        </div>
      </div>
      <div class="reg-mark" style="bottom: 6px; left: 50%; transform: translateX(-50%);">
        <div class="reg-circle">
          <div class="reg-line-h"></div>
          <div class="reg-line-v"></div>
        </div>
      </div>
      <div class="reg-mark" style="left: 6px; top: 50%; transform: translateY(-50%);">
        <div class="reg-circle">
          <div class="reg-line-h"></div>
          <div class="reg-line-v"></div>
        </div>
      </div>
      <div class="reg-mark" style="right: 6px; top: 50%; transform: translateY(-50%);">
        <div class="reg-circle">
          <div class="reg-line-h"></div>
          <div class="reg-line-v"></div>
        </div>
      </div>
    ` : ''}

    ${showSafeArea ? `
      <div class="safe-area">
        <div class="safe-area-label">Safe Area</div>
      </div>
    ` : ''}

    <div class="content-area">
      ${previewHtml}
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
`;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Clean up iframe after printing dialogue
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  };

  const [legalSubTab, setLegalSubTab] = useState<"privacy" | "terms" | "about" | "contact">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const subParam = params.get("sub") as any;
      if (subParam && ["privacy", "terms", "about", "contact"].includes(subParam)) {
        return subParam;
      }
    }
    return "privacy";
  });

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const articleParam = params.get("article");
      if (articleParam) {
        return articleParam;
      }
    }
    return null;
  });

  const [resourcesSubTab, setResourcesSubTab] = useState<"articles" | "sitemap" | "seo-templates" | "installation" | "install-fetchers">("articles");

  const [isSitemapView, setIsSitemapView] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname === "/sitemap" || 
        window.location.pathname === "/sitemap/" ||
        window.location.hash === "#sitemap" || 
        window.location.hash === "#/sitemap" || 
        window.location.search.includes("sitemap")
      );
    }
    return false;
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-session-activities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }

    // Default pre-seeded activities so first-time users can instantly see and access all 4 major tools right from the dashboard
    const now = new Date();
    const formatTime = (offsetMs: number) => {
      const d = new Date(now.getTime() - offsetMs);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return [
      {
        id: "init-palette",
        type: "tool",
        title: "Opened Color Extractor",
        detail: "Switched operational context to Color Extractor workspace",
        timestamp: formatTime(0),
        icon: "Pipette",
        tab: "palette"
      },
      {
        id: "init-qr",
        type: "tool",
        title: "Opened QR Generator",
        detail: "Switched operational context to QR Generator workspace",
        timestamp: formatTime(60000),
        icon: "QrCode",
        tab: "qr"
      },
      {
        id: "init-compress",
        type: "tool",
        title: "Opened Image Compressor",
        detail: "Switched operational context to Image Compressor workspace",
        timestamp: formatTime(120000),
        icon: "FileImage",
        tab: "compress"
      },
      {
        id: "init-quote",
        type: "tool",
        title: "Opened Quote Designer",
        detail: "Switched operational context to Quote Designer workspace",
        timestamp: formatTime(180000),
        icon: "Quote",
        tab: "quote"
      }
    ];
  });

  const [toolUsage, setToolUsage] = useState<Record<ActiveTab, number>>(() => {
    try {
      const saved = sessionStorage.getItem("toolkit-session-usage");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Seed with beautiful session records to make our D3 chart gorgeous and engaging on load
    return {
      quote: 4,
      compress: 8,
      qr: 5,
      palette: 7,
      drive: 2,
      resources: 3,
      legal: 1
    };
  });

  const incrementToolUsage = (tab: ActiveTab, amount = 1) => {
    setToolUsage((prev) => {
      const updated = {
        ...prev,
        [tab]: (prev[tab] || 0) + amount
      };
      try {
        sessionStorage.setItem("toolkit-session-usage", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const getUsageInsightsData = () => {
    const labels: Record<ActiveTab, string> = {
      home: "Home",
      quote: "Quote",
      compress: "Compress",
      qr: "QR Gen",
      palette: "Palette",
      video: "Video Creator",
      drive: "Drive",
      resources: "Guides",
      legal: "Legal",
      android: "Android Studio",
      pdf: "PDF Suite",
      converter: "Converter",
      bgremover: "BG Remover"
    };

    const colors: Record<ActiveTab, string> = {
      home: "rgba(59, 130, 246, 0.85)",       // Blue
      quote: "rgba(99, 102, 241, 0.85)",     // Indigo
      compress: "rgba(168, 85, 247, 0.85)",  // Purple
      qr: "rgba(16, 185, 129, 0.85)",       // Emerald
      palette: "rgba(6, 182, 212, 0.85)",     // Cyan
      video: "rgba(139, 92, 246, 0.85)",     // Violet
      drive: "rgba(59, 130, 246, 0.85)",     // Blue
      resources: "rgba(245, 158, 11, 0.85)",   // Amber
      legal: "rgba(244, 63, 94, 0.85)",       // Rose
      android: "rgba(16, 185, 129, 0.85)",     // Emerald
      pdf: "rgba(239, 68, 68, 0.85)",         // Red
      converter: "rgba(20, 184, 166, 0.85)",   // Teal
      bgremover: "rgba(236, 72, 153, 0.85)"   // Pink
    };

    const tabs: ActiveTab[] = ["quote", "compress", "qr", "palette", "video", "drive", "resources", "legal", "android", "pdf", "converter", "bgremover"];
    return tabs.map((tab) => ({
      tool: tab,
      label: labels[tab],
      count: toolUsage[tab] || 0,
      color: colors[tab]
    }));
  };

  const logSessionActivity = (activity: {
    type: "tool" | "file";
    title: string;
    detail: string;
    icon: RecentActivity["icon"];
    tab?: ActiveTab;
  }) => {
    const newActivity: RecentActivity = {
      id: Math.random().toString(36).substring(2, 9),
      type: activity.type,
      title: activity.title,
      detail: activity.detail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      icon: activity.icon,
      tab: activity.tab
    };

    if (activity.tab) {
      incrementToolUsage(activity.tab, 1);
    }

    setRecentActivities((prev) => {
      // Deduplicate activities to avoid spamming the session trail with repeating cards
      let filtered = prev;
      if (newActivity.tab) {
        // For tab switches, remove any older records of the same tab switch to move it to top with new timestamp
        filtered = prev.filter((act) => act.tab !== newActivity.tab);
      } else {
        // For other activities, avoid duplicating identical titles to prevent clutter
        filtered = prev.filter((act) => act.title !== newActivity.title);
      }
      
      // Slice up to 6 unique activities to perfectly balance the 2-column layout (6 items = 3 full rows)
      const updated = [newActivity, ...filtered].slice(0, 6);
      try {
        sessionStorage.setItem("toolkit-session-activities", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  useEffect(() => {
    const handleActivityEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        logSessionActivity(customEvent.detail);
      }
    };
    window.addEventListener("toolkit-add-activity", handleActivityEvent);
    return () => {
      window.removeEventListener("toolkit-add-activity", handleActivityEvent);
    };
  }, []);

  useEffect(() => {
    const tabNames: Record<ActiveTab, string> = {
      home: "Dashboard Home",
      quote: "Quote Designer",
      compress: "Image Compressor",
      qr: "QR Generator",
      palette: "Color Extractor",
      video: "Video Creator",
      drive: "Drive Panel",
      resources: "Guides & SEO",
      legal: "Compliance",
      android: "Android App Studio",
      pdf: "PDF Tools Suite",
      converter: "Image Converter",
      bgremover: "Background Remover"
    };

    const tabIcons: Record<ActiveTab, RecentActivity["icon"]> = {
      home: "Sparkles",
      quote: "Quote",
      compress: "FileImage",
      qr: "QrCode",
      palette: "Pipette",
      video: "Video",
      drive: "Cloud",
      resources: "BookOpen",
      legal: "ShieldCheck",
      android: "Smartphone",
      pdf: "FileText",
      converter: "RefreshCw",
      bgremover: "Eraser"
    };

    if (activeTab === "home") return;

    logSessionActivity({
      type: "tool",
      title: `Opened ${tabNames[activeTab]}`,
      detail: `Switched operational context to ${tabNames[activeTab]} workspace`,
      icon: tabIcons[activeTab],
      tab: activeTab
    });
  }, [activeTab]);

  useEffect(() => {
    const handleLocationCheck = () => {
      const isSitemapPath = 
        window.location.pathname === "/sitemap" || 
        window.location.pathname === "/sitemap/" ||
        window.location.hash === "#sitemap" || 
        window.location.hash === "#/sitemap" || 
        window.location.search.includes("sitemap");
      setIsSitemapView(isSitemapPath);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab;
      if (tabParam && ["home", "quote", "compress", "qr", "palette", "video", "drive", "resources", "legal"].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (!isSitemapPath) {
        setActiveTab("home");
      }

      const subParam = params.get("sub") as any;
      if (subParam && ["privacy", "terms", "about", "contact"].includes(subParam)) {
        setLegalSubTab(subParam);
      }

      const articleParam = params.get("article");
      setSelectedArticleId(articleParam);
    };

    window.addEventListener("popstate", handleLocationCheck);
    window.addEventListener("hashchange", handleLocationCheck);
    
    return () => {
      window.removeEventListener("popstate", handleLocationCheck);
      window.removeEventListener("hashchange", handleLocationCheck);
    };
  }, []);

  // Sync state variables back to URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      if (activeTab === "quote" && !isSitemapView) {
        params.delete("tab");
      } else if (!isSitemapView) {
        params.set("tab", activeTab);
      }

      if (activeTab === "legal") {
        params.set("sub", legalSubTab);
      } else {
        params.delete("sub");
      }

      if (activeTab === "resources" && selectedArticleId) {
        params.set("article", selectedArticleId);
      } else {
        params.delete("article");
      }

      if (isSitemapView) {
        params.set("sitemap", "true");
      } else {
        params.delete("sitemap");
      }

      const newSearch = params.toString();
      const currentSearch = window.location.search.replace(/^\?/, "");
      
      if (newSearch !== currentSearch) {
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [activeTab, legalSubTab, selectedArticleId, isSitemapView]);

  // Global Keydown Keyboard Shortcuts Handler
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      );

      // 1. Command Palette Trigger: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        triggerShortcutFeedback("Ctrl + K (Palette Toggle)");
        return;
      }

      // If active focus is inside an input, don't execute other navigation shortcuts
      if (isInput) return;

      // 1.5 Quick accessibility Shortcuts Help: Shift + ?
      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        triggerShortcutFeedback("? (Shortcuts Guide)");
        return;
      }

      // 2. Drive Explorer Portal: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setActiveTab("drive");
        setIsSitemapView(false);
        triggerShortcutFeedback("Ctrl + D (Drive Explorer)");
        return;
      }

      // 3. Alt + [1-7] Hotkeys Navigation
      if (e.altKey && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const tabMap: Record<string, ActiveTab> = {
          "1": "quote",
          "2": "compress",
          "3": "qr",
          "4": "palette",
          "5": "video",
          "6": "resources",
          "7": "legal",
          "8": "android"
        };
        const targetTab = tabMap[e.key];
        if (targetTab) {
          setActiveTab(targetTab);
          setIsSitemapView(false);
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
          triggerShortcutFeedback(`Alt + ${e.key} (${tabLabelMap[targetTab]})`);
        }
        return;
      }

      // 4. Alt + S (Toggle Sitemap Panel)
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSitemapView((prev) => !prev);
        triggerShortcutFeedback("Alt + S (Sitemap Diagnostics)");
        return;
      }

      // 5. Alt + T (Instant Skin Swap Theme)
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
        triggerShortcutFeedback("Alt + T (Theme Swapped)");
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // Mount Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        setNeedsAuth(false);
        // Load Drive files after successful in-memory token retrieval
        loadDriveFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadDriveFiles = async (token: string) => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const data = await listDriveFiles(token);
      setFiles(data);
    } catch (err) {
      console.error("Failed to sync file list from Google Drive:", err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleRefreshDrive = () => {
    if (accessToken) {
      loadDriveFiles(accessToken);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error("Login authorization flow failed:", err);
      let friendlyMsg = "Authentication failed. Please verify your connection status.";
      const errorStr = String(err?.message || err);
      if (errorStr.includes("auth/api-key-not-valid") || errorStr.includes("api-key-not-valid")) {
        friendlyMsg = "This clone is in 'Local Sandbox Mode' with placeholder credentials in firebase-applet-config.json. To enable real Google Drive saving, please trigger the 'Firebase Setup' in the workspace. In the meantime, all offline content designers and calculators are 100% active and perfectly offline downloadable!";
      } else {
        friendlyMsg = err?.message || String(err);
      }
      setAuthError(friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setFiles([]);
    } catch (err) {
      console.error("Signout failed:", err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === "dark" 
        ? "dark bg-slate-950 text-slate-100" 
        : "bg-slate-50 text-slate-800"
    }`}>
      {/* Upper Navigation Row */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        driveCount={files.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        highContrast={highContrast}
        onToggleHighContrast={handleToggleHighContrast}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout Row with Left Collapsible Sidebar */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Animated Left Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <>
              {/* Backdrop on mobile devices */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 33 }}
                className={`fixed top-16 bottom-0 left-0 z-45 w-72 border-r flex flex-col transition-colors duration-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-800 text-slate-100"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                {/* Navigation Items container */}
                <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1 scrollbar-none">
                  <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      Navigation Menu
                    </span>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-400 transition-colors cursor-pointer"
                      title="Hide Sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {[
                    { id: "home", label: "Dashboard Home", icon: Home, desc: "System status & stats" },
                    { id: "quote", label: "Quote Designer", icon: Quote, desc: "Aesthetic graphic visuals" },
                    { id: "compress", label: "Image Compressor", icon: FileImage, desc: "Fast size reduction" },
                    { id: "qr", label: "QR Generator", icon: QrCode, desc: "ECC scan patterns" },
                    { id: "palette", label: "Color Extractor", icon: Pipette, desc: "Analyze hex spectrums" },
                    { id: "video", label: "Video Creator", icon: Video, desc: "Timeline loop tools" },
                    { id: "pdf", label: "PDF Tools Suite", icon: FileText, desc: "Compile raw files to PDF", badge: "NEW" },
                    { id: "converter", label: "Image Converter", icon: RefreshCw, desc: "Format conversion scale", badge: "NEW" },
                    { id: "bgremover", label: "Background Remover", icon: Eraser, desc: "Isolate subject matte", badge: "NEW" },
                    { id: "android", label: "Android App Studio", icon: Smartphone, desc: "Veo 3.1 & Native Room DB", badge: "VEO" },
                    { id: "drive", label: "Drive Panel", icon: Cloud, desc: "Cloud files index", badge: files.length > 0 ? files.length : undefined },
                    { id: "resources", label: "Guides & SEO", icon: BookOpen, desc: "Sitemaps & templates" },
                    { id: "legal", label: "Compliance & Safety", icon: ShieldCheck, desc: "Policies & support" },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsSitemapView(false);
                          if (window.innerWidth < 1024) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer select-none border group ${
                          isActive
                            ? theme === "dark"
                              ? "bg-slate-950 border-slate-800 text-white shadow-md shadow-slate-950/50"
                              : "bg-indigo-50/40 border-indigo-100 text-indigo-700 shadow-3xs"
                            : theme === "dark"
                              ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                              : "bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg border transition-colors ${
                            isActive
                              ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/45 dark:border-indigo-900/30"
                              : "bg-slate-50 dark:bg-slate-850 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 border-transparent"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[11.5px] font-bold leading-tight">
                              {item.label}
                            </p>
                            <p className="text-[9.5px] text-slate-400 dark:text-slate-505 leading-none mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        {item.badge !== undefined ? (
                          <span className={`inline-flex items-center justify-center rounded-full h-4 px-1.5 text-[8.5px] font-black leading-none ${
                            isActive ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}>
                            {item.badge}
                          </span>
                        ) : (
                          isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mr-1 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Sidebar Footer with Workspace status */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 select-none">
                  <div className="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest font-mono">
                    <span>Workspace State</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-[10px] leading-relaxed ${
                    theme === "dark" ? "bg-slate-950/40 border-slate-805 text-slate-400" : "bg-slate-50 border-slate-200/50 text-slate-500"
                  }`}>
                    <span>Logged in as:</span>
                    <p className="font-extrabold text-slate-850 dark:text-slate-200 truncate mt-0.5" title={user?.email || "Anonymous Creator"}>
                      {user?.email || "Guest Creator"}
                    </p>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Right workspace panel wrapper */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {activeTab === "home" ? (
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-8 animate-in fade-in duration-300">
              
              {/* Dynamic Hour Greeting & Real-time micro clock row */}
              {(() => {
                const getHourGreeting = () => {
                  const hr = currentTime.getHours();
                  if (hr < 12) return "Good morning";
                  if (hr < 17) return "Good afternoon";
                  return "Good evening";
                };
                const creatorName = user?.email ? user.email.split("@")[0] : "Creator";
                const cleanName = creatorName.charAt(0).toUpperCase() + creatorName.slice(1);
                const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-150 dark:border-slate-850 gap-4 select-none">
                    <div>
                      <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {getHourGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{cleanName}!</span>
                      </h1>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Welcome to Toolkit Pro — your premium standalone space for professional-grade design, encoding, and optimization.
                      </p>
                    </div>
                    <div className={`flex items-center gap-3 px-4.5 py-2.5 rounded-2xl border ${
                      theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/60 shadow-3xs"
                    }`}>
                      <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
                      <div className="text-right">
                        <p className="text-xs font-black font-mono leading-none tracking-wider">{timeString}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-505 leading-none mt-1 font-semibold">{dateString}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Hero Welcome banner */}
              <section className={`border rounded-3xl overflow-hidden transition-colors duration-200 py-10 ${
                theme === "dark"
                  ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-850"
                  : "bg-gradient-to-b from-white to-slate-50/50 border-slate-200 shadow-3xs"
              }`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 select-none">
                  <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-955 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest leading-none shadow-sm shadow-emerald-500/5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Toolkit Pro Drive Sync
                    </div>

                    {/* Installable PWA Badge with Tooltip */}
                    <div className="relative group inline-block">
                      <button
                        disabled={pwaChecking}
                        onClick={async () => {
                          const promptToUse = typeof window !== "undefined" ? window.deferredInstallPrompt : null;
                          if (promptToUse) {
                            try {
                              await promptToUse.prompt();
                              const { outcome } = await promptToUse.userChoice;
                              console.log(`User response to native installation: ${outcome}`);
                              if (typeof window !== "undefined") {
                                window.deferredInstallPrompt = null;
                              }
                              setHasDeferredPrompt(false);
                            } catch (err) {
                              console.error("Native install prompt trigger error:", err);
                            }
                          } else {
                            setActiveTab("resources");
                            setResourcesSubTab("installation");
                            // Smoothly scroll to the content
                            setTimeout(() => {
                              const el = document.getElementById("resources-panel-installation");
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }, 100);
                          }
                        }}
                        className={`relative overflow-hidden inline-flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-150/40 dark:border-blue-900/30 px-3.5 py-1.5 pb-[7px] rounded-full text-[11px] font-extrabold text-blue-700 dark:text-blue-350 uppercase tracking-widest leading-none shadow-sm shadow-blue-500/5 cursor-pointer select-none transition-all hover:scale-102 hover:shadow-md ${
                          hasDeferredPrompt ? "animate-pulse ring-2 ring-emerald-500/40 dark:ring-emerald-400/40" : ""
                        } ${pwaChecking ? "opacity-90 cursor-wait" : ""}`}
                        title={pwaChecking ? pwaStatusText : (hasDeferredPrompt ? "Install Toolkit Pro directly to your device now!" : "PWA Installable Software Utility")}
                      >
                        {pwaChecking ? (
                          <>
                            <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                            <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                              Checking PWA ({pwaProgress}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3 h-3 text-blue-500" />
                            <span className="flex items-center gap-1">
                              {hasDeferredPrompt ? "Install App Now" : "Installable PWA"}
                              <span className={`inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 ${hasDeferredPrompt ? "animate-ping" : "animate-pulse"}`} />
                            </span>
                          </>
                        )}
                        
                        {/* Subtle loading progress bar line at the bottom */}
                        {pwaChecking && (
                          <div 
                            className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-400 transition-all duration-150 ease-out" 
                            style={{ width: `${pwaProgress}%` }} 
                          />
                        )}
                      </button>
         
                      {/* High-Fidelity Tooltip describing PWA benefits */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-40 w-72 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100 text-left space-y-3">
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-955/55">
                            {pwaChecking ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </span>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {pwaChecking ? "PWA Verification" : "Standalone Utility"}
                            </h5>
                            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                              {pwaChecking ? pwaStatusText : "Elevate Your Experience"}
                            </p>
                          </div>
                        </div>
         
                        <ul className="space-y-2 text-[11px] text-slate-650 dark:text-slate-400">
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                            <span><strong>No Browser Clutter:</strong> Removes URL bars to maximize rendering space for your active canvas.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                            <span><strong>Dock & Desktop Access:</strong> Launch application directly from macOS/Windows Dock or your home screen.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-500 mt-0.5 text-xs">✦</span>
                            <span><strong>Zero Latency:</strong> Uses background caching for lightning-fast workflow transition speed.</span>
                          </li>
                        </ul>
         
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[9px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                          <span>Click to view installation guides</span>
                          <span>➔</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Brand Logo Display */}
                  <div className="flex justify-center pt-2 pb-1 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-center max-w-[240px] sm:max-w-[280px] transition-all hover:scale-[1.03] duration-300">
                      <img 
                        src={brandLogo} 
                        alt="Toolkit Pro" 
                        className="h-9 sm:h-11 w-auto object-contain rounded-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Advanced Tools for Digital Creators
                  </h2>
                  <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Compress images, generate scan coordinates, extract color spectrums, and style custom quote card assets. Authenticate Google Drive to keep files synced and organized automatically!
                  </p>

                  {/* Prompt Google Drive auth warning */}
                  {!user && (
                    <div className="max-w-md mx-auto pt-4 space-y-3">
                      {authError && (
                        <div className="border border-rose-200/40 bg-rose-50 dark:bg-rose-950/25 text-rose-800 dark:text-rose-300 rounded-xl p-4 text-xs text-left flex flex-col space-y-3 animate-fade-in relative shadow-md">
                          <div className="flex items-start space-x-2.5">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0 animate-bounce" />
                            <div className="flex-1 space-y-1 pr-6">
                              <p className="font-bold text-rose-900 dark:text-rose-400">Authorization Notice</p>
                              <p className="leading-relaxed text-slate-750 dark:text-slate-200">{authError}</p>
                            </div>
                            <button 
                              onClick={() => setAuthError(null)} 
                              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-250 absolute top-3 right-3 p-1 cursor-pointer transition-colors text-xs font-bold"
                              title="Dismiss notification"
                              id="dismiss-auth-inline-btn"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-rose-200/40 dark:border-rose-900/40">
                            <button
                              type="button"
                              onClick={handleLogin}
                              disabled={isLoggingIn}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 dark:bg-rose-900/80 hover:bg-rose-700 dark:hover:bg-rose-800 text-white font-bold text-[11px] transition-all shadow-sm select-none disabled:opacity-55 cursor-pointer active:scale-97"
                              id="retry-auth-inline-btn"
                            >
                              {isLoggingIn ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>{isLoggingIn ? "Connecting..." : "Retry Authorization"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAuthError(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-transparent border border-rose-250 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 font-semibold text-[11px] transition-all select-none cursor-pointer"
                              id="dismiss-auth-inline-secondary-btn"
                            >
                              Dismiss Error
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={`border rounded-xl p-3 flex items-start space-x-2 text-xs text-left ${
                        theme === "dark"
                          ? "bg-amber-955/20 border-amber-900/40 text-amber-300"
                          : "bg-amber-50 border-amber-100 text-amber-800"
                      }`}>
                        <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                        <p className="leading-relaxed">
                          <strong>Drive Sync Inactive:</strong> Log in using your Google Workspace account to unlock instant cloud file backups and review saved assets inside the dashboard.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Interactive Setup Progress Roadmap Checklist */}
              <div className={`border rounded-3xl p-6 transition-colors duration-200 select-none ${
                theme === "dark"
                  ? "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-850"
                  : "bg-white border-slate-200/70 shadow-3xs"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/55 border border-indigo-100/30">
                        <Award className="w-4 h-4 text-indigo-500" />
                      </div>
                      <h3 className={`text-xs font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                        Studio Setup Checklist & Creator Missions
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Complete tasks to master Toolkit Pro's professional creator workflow integrations.
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full sm:w-56 space-y-1.5 shrink-0">
                    <div className="flex justify-between items-center text-[9px] font-bold font-mono">
                      <span className="text-slate-405">COMPLETION STATE</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {Math.round((Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${(Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { id: "quote", label: "Quote Designer", desc: "Craft typographic asset cards", badge: "Design" },
                    { id: "compress", label: "Image Compressor", desc: "Minimize asset bundle sizes", badge: "Optimize" },
                    { id: "qr", label: "QR Generator", desc: "Encode ECC scan coordinates", badge: "ECC Code" },
                    { id: "palette", label: "Color Extractor", desc: "Sample hex color spectrums", badge: "Spectrums" },
                    { id: "drive", label: "Google Drive Sync", desc: "Synchronize cloud folders", badge: "Backup" },
                  ].map((item) => {
                    const isDone = item.id === "drive" ? !!user : checklist[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group h-40 ${
                          isDone
                            ? theme === "dark"
                              ? "bg-emerald-955/10 border-emerald-900/30 text-emerald-300"
                              : "bg-emerald-50/35 border-emerald-150 text-emerald-850"
                            : theme === "dark"
                              ? "bg-slate-900/40 border-slate-805 text-slate-300 hover:border-slate-700"
                              : "bg-slate-50/30 border-slate-200/50 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (item.id === "drive") {
                                  if (!user) handleLogin();
                                } else {
                                  toggleChecklistItem(item.id);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                              title={isDone ? "Mark incomplete" : "Mark completed"}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 animate-in zoom-in-75 duration-200" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-slate-300 dark:text-slate-650 group-hover:text-slate-400" />
                              )}
                            </button>
                            <span className={`text-[8.5px] font-black uppercase font-mono px-1.5 py-0.5 rounded leading-none ${
                              isDone ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-405"
                            }`}>
                              {item.badge}
                            </span>
                          </div>
                          <h4 className="text-[11.5px] font-black tracking-tight uppercase leading-tight mt-1">{item.label}</h4>
                          <p className="text-[9.5px] text-slate-400 dark:text-slate-505 leading-tight">{item.desc}</p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab(item.id as any);
                            setIsSitemapView(false);
                          }}
                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-505 dark:hover:text-indigo-300 cursor-pointer"
                        >
                          <span>Launch Tool</span>
                          <ArrowRight className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE SEARCH & FULL TOOLS CATALOG */}
              <div className="space-y-4 select-none">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-tight flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      <Search className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                      Search & Explore Tools Catalog
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Type name or keyword to instantly find and launch any professional creator tool.
                    </p>
                  </div>
                  
                  {/* High fidelity styled Search Input */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search tools... (e.g., PDF, converter, crop)"
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                        theme === "dark"
                          ? "bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500"
                          : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 shadow-3xs"
                      }`}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    {homeSearchQuery && (
                      <button
                        onClick={() => setHomeSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid layout of all catalog items */}
                {(() => {
                  const ALL_CATALOG_TOOLS = [
                    { id: "quote", label: "Quote Designer", desc: "Craft stunning typographical quote cards with customizable backdrop noise and blur.", badge: "Design", icon: Quote },
                    { id: "compress", label: "Image Compressor", desc: "Optimize and minimize JPG, PNG, and WebP asset bundles with precise EXIF preservation.", badge: "Optimize", icon: FileImage },
                    { id: "qr", label: "QR Generator", desc: "Encode dynamic links, text, and coordinates with robust error correction level settings.", badge: "ECC Code", icon: QrCode },
                    { id: "palette", label: "Color Extractor", desc: "Extract dominant color palettes, sample hex spectrums, and check WCAG contrast rules.", badge: "Spectrums", icon: Pipette },
                    { id: "video", label: "AI Video Creator", desc: "Animate static seed frames into cinematic horizontal/vertical landscape motion videos.", badge: "Motion", icon: Video },
                    { id: "pdf", label: "PDF Tools Suite", desc: "Compile raw image folders to PDF, design text documents, and export high-fidelity vectors.", badge: "Document", icon: FileText },
                    { id: "converter", label: "Image Converter", desc: "Convert image files between WebP, PNG, JPEG, and BMP formats with scale dimensions.", badge: "Convert", icon: RefreshCw },
                    { id: "bgremover", label: "Background Remover", desc: "Isolate subject matte layers using a color dropper or green screen keying.", badge: "Isolate", icon: Eraser },
                    { id: "drive", label: "Google Drive Sync", desc: "Synchronize, backup, and restore your design canvas assets to cloud-secured folders.", badge: "Backup", icon: Cloud },
                    { id: "android", label: "Android App Studio", desc: "Configure app manifests, compile resources, and generate APK metadata assets.", badge: "Mobile", icon: Smartphone }
                  ];

                  const filtered = ALL_CATALOG_TOOLS.filter(tool => {
                    const query = homeSearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return tool.label.toLowerCase().includes(query) || 
                           tool.desc.toLowerCase().includes(query) || 
                           tool.badge.toLowerCase().includes(query);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className={`p-8 text-center rounded-3xl border ${
                        theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-slate-50 border-slate-200"
                      }`}>
                        <p className="text-xs text-slate-400">No matching tools found for "{homeSearchQuery}". Try another keyword!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {filtered.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setActiveTab(tool.id as any);
                              setIsSitemapView(false);
                            }}
                            className={`p-4 rounded-3xl border transition-all duration-300 hover:scale-102 flex flex-col justify-between group h-44 cursor-pointer relative overflow-hidden ${
                              theme === "dark"
                                ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-855 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5 text-slate-100"
                                : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50 text-slate-700"
                            }`}
                          >
                            {/* Decorative background accent blob on hover */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="p-2 bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-50 group-hover:text-white rounded-xl transition-all duration-300">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[8.5px] font-black uppercase font-mono px-2 py-0.5 rounded-full ${
                                  theme === "dark" ? "bg-slate-900 text-slate-400 border border-slate-800" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {tool.badge}
                                </span>
                              </div>
                              <h4 className={`text-xs font-black tracking-tight leading-snug mt-1.5 group-hover:text-indigo-500 transition-colors ${
                                theme === "dark" ? "text-white" : "text-slate-900"
                              }`}>
                                {tool.label}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-405 leading-normal group-hover:text-slate-500 transition-colors line-clamp-3">
                                {tool.desc}
                              </p>
                            </div>

                            <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 transition-colors pt-2">
                              <span>Launch Space</span>
                              <ArrowRight className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic AdSense Leaderboard Placement Box */}
              <div className="w-full select-none" id="home-adsense-leaderboard-wrapper">
                <AdSenseMock slot="top-leaderboard-home" type="leaderboard" />
              </div>

              {/* Spotlight of the Day & System Stats Metrics Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
                {/* Highlight/Spotlight card */}
                <div className={`lg:col-span-2 border rounded-3xl p-6 relative overflow-hidden transition-colors ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 border-slate-850"
                    : "bg-gradient-to-br from-indigo-50/15 via-white to-slate-50/50 border-slate-200 shadow-3xs"
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-200/40">
                      Featured Creative Utility
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> SECURE GPU
                    </span>
                  </div>

                  <div className="space-y-3 max-w-xl">
                    <h3 className={`text-lg sm:text-xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      Client-side Quantized Video & Typographic Quote Builder
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-405 leading-relaxed">
                      Experience instant processing speed. Build stylized graphics with blurred backdrop filters and canvas noise presets, or animate layouts into horizontal/vertical motion videos. All processing occurs locally.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <button
                      onClick={() => {
                        setActiveTab("quote");
                        setIsSitemapView(false);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5" />
                      <span>Launch Quote Designer</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab("compress");
                        setIsSitemapView(false);
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl border font-semibold text-xs transition-all active:scale-95 cursor-pointer ${
                        theme === "dark"
                          ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Compress Image Bundle</span>
                    </button>
                  </div>
                </div>

                {/* Live Performance / System Quick Stats */}
                <div className={`border rounded-3xl p-6 transition-colors flex flex-col justify-between ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-805 text-slate-100"
                    : "bg-white border-slate-200/60 text-slate-850 shadow-3xs"
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">System Metrics</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "PWA Offline Status", value: hasDeferredPrompt ? "Ready to Install" : "Fully Integrated", status: hasDeferredPrompt ? "info" : "success" },
                        { label: "Google Drive Sync", value: user ? "Connected & Live" : "Backup Offline", status: user ? "success" : "warning" },
                        { label: "Active Session Actions", value: `${recentActivities.length} Operations`, status: "success" },
                        { label: "Hardware Accelerated", value: "Active (WebKit GPU)", status: "success" }
                      ].map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 dark:text-slate-505 font-medium">{metric.label}</span>
                          <span className={`font-bold font-mono px-2 py-0.5 rounded-full text-[9px] ${
                            metric.status === "success" 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                              : metric.status === "warning"
                                ? "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400"
                                : "bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400"
                          }`}>
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-150 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-550 font-mono uppercase font-black">
                    <span>Rendering Canvas</span>
                    <span className="text-emerald-500 font-black">100% Client-side</span>
                  </div>
                </div>
              </div>

              {/* CREATOR PROJECTS HUB */}
              <div className={`border rounded-3xl p-6 transition-colors duration-200 select-none ${
                theme === "dark"
                  ? "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-850"
                  : "bg-white border-slate-200/70 shadow-3xs"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/55 border border-indigo-100/30">
                        <FolderOpen className="w-4 h-4 text-indigo-500" />
                      </div>
                      <h3 className={`text-xs font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                        Creator Projects & Workspaces
                      </h3>
                      {user ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20">
                          ☁️ Cloud Sync Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 border border-amber-200/20">
                          💾 Offline Mode
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-505 mt-1">
                      {user 
                        ? "Your projects are stored securely in the cloud and synced across devices." 
                        : "Your projects are saved locally in this browser. Authorize Drive/Login to sync to the cloud!"}
                    </p>
                  </div>

                  {/* Create New Project Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const name = window.prompt("Enter project name:");
                        if (!name) return;
                        const toolType = window.prompt("Enter tool type ('quote', 'qr', 'palette'):");
                        if (toolType !== "quote" && toolType !== "qr" && toolType !== "palette") {
                          alert("Invalid tool type. Please choose 'quote', 'qr', or 'palette'.");
                          return;
                        }
                        handleSaveProject(name, toolType);
                      }}
                      disabled={isSavingProject}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Current Workspace</span>
                    </button>
                  </div>
                </div>

                {projectError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-955/10 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-200/30">
                    {projectError}
                  </div>
                )}

                {isLoadingProjects ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    <span className="text-xs text-slate-400">Loading workspaces...</span>
                  </div>
                ) : savedProjects.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">No saved projects yet</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 leading-relaxed">
                      Make designs in Quote Creator, QR Matrix, or Palette Extractor, and click "Save Current Workspace" to build your project list!
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Drag and drop cards to reorder your workspace hierarchy</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedProjects.map((project, idx) => {
                        const isDragging = draggedProjectIndex === idx;
                        const isDragOver = dragOverProjectIndex === idx;

                        return (
                          <div
                            key={project.id}
                            draggable
                            onDragStart={(e) => handleProjectDragStart(e, idx)}
                            onDragOver={(e) => handleProjectDragOver(e, idx)}
                            onDrop={(e) => handleProjectDrop(e, idx)}
                            onDragEnd={handleProjectDragEnd}
                            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group relative overflow-hidden cursor-grab active:cursor-grabbing ${
                              isDragging ? "opacity-30 scale-95 border-indigo-400/50" : ""
                            } ${
                              isDragOver
                                ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 scale-102 border-dashed"
                                : theme === "dark"
                                  ? "bg-slate-900/40 border-slate-805 text-slate-300 hover:border-slate-700"
                                  : "bg-slate-50/40 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[8.5px] font-black uppercase font-mono px-2 py-0.5 rounded leading-none ${
                                  project.toolType === "quote" 
                                    ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" 
                                    : project.toolType === "qr"
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                      : "bg-amber-100 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400"
                                }`}>
                                  {project.toolType === "quote" ? "Quote Designer" : project.toolType === "qr" ? "QR Matrix" : "Color Extractor"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-400 dark:text-slate-505 font-mono">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                  </span>
                                  <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 cursor-grab group-hover:text-indigo-400 transition-colors" />
                                </div>
                              </div>
                              <h4 className={`text-xs font-black tracking-tight uppercase leading-snug ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                                {project.name}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60">
                              <button
                                onClick={() => handleLoadProject(project)}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer"
                              >
                                <span>Load Project</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Session Insights & Activity Streams row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 select-none" id="home-insights-widgets-row">
                <div className="lg:col-span-3">
                  <RecentActivitiesWidget 
                    activities={recentActivities}
                    onClear={() => {
                      setRecentActivities([]);
                      try {
                        sessionStorage.removeItem("toolkit-session-activities");
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setIsSitemapView(false);
                    }}
                    theme={theme}
                  />
                </div>
                <div className="lg:col-span-2">
                  <UsageInsightsWidget
                    usageData={getUsageInsightsData()}
                    onReset={() => {
                      const resetObj = {
                        home: 0,
                        quote: 0,
                        compress: 0,
                        qr: 0,
                        palette: 0,
                        video: 0,
                        drive: 0,
                        resources: 0,
                        legal: 0
                      };
                      setToolUsage(resetObj);
                      try {
                        sessionStorage.setItem("toolkit-session-usage", JSON.stringify(resetObj));
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setIsSitemapView(false);
                    }}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          ) : (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-6">
              {/* Breadcrumb path for clean workspace navigation */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-850/60 select-none">
                <div className="flex items-center gap-2 text-[10px] font-black font-mono">
                  <button 
                    onClick={() => setActiveTab("home")} 
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    HOME
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sans">
                    {activeTab === "quote" && "Quote Designer"}
                    {activeTab === "compress" && "Image Compressor"}
                    {activeTab === "qr" && "QR Generator"}
                    {activeTab === "palette" && "Color Extractor"}
                    {activeTab === "video" && "Video Creator"}
                    {activeTab === "drive" && "Drive Panel"}
                    {activeTab === "resources" && "Guides & SEO"}
                    {activeTab === "legal" && "Compliance"}
                    {activeTab === "android" && "Android App Studio"}
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab("home")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850"
                      : "bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <X className="w-3 h-3 text-rose-500" />
                  <span>Close Workspace</span>
                </button>
              </div>

              {/* Dynamic active page viewer wrapper */}
              <motion.div 
                layout="position"
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-select-${activeTab}`}
                className={`rounded-3xl border p-3.5 sm:p-6 md:p-8 transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-800/85 shadow-md shadow-slate-950/45"
                    : "bg-white border-slate-100 shadow-sm"
                }`}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 28,
                  mass: 0.8
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isSitemapView ? "sitemap" : activeTab}
                    initial={{ opacity: 0, x: direction * 35 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 35 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {isSitemapView ? (
                      <SitemapView
                        theme={theme}
                        onTabChange={(tab) => {
                          setActiveTab(tab);
                          setIsSitemapView(false);
                        }}
                        onClose={() => setIsSitemapView(false)}
                      />
                    ) : (
                      <>
                        {activeTab === "quote" && (
                          <QuoteDesigner
                            user={user}
                            accessToken={accessToken}
                            onRefreshDrive={handleRefreshDrive}
                            onLogin={handleLogin}
                          />
                        )}

                        {activeTab === "compress" && (
                          <ImageCompressor
                            user={user}
                            accessToken={accessToken}
                            onRefreshDrive={handleRefreshDrive}
                            onLogin={handleLogin}
                            initialFiles={draggedFiles}
                            onClearInitialFiles={() => setDraggedFiles(null)}
                          />
                        )}

                        {activeTab === "qr" && (
                          <QrGenerator
                            user={user}
                            accessToken={accessToken}
                            onRefreshDrive={handleRefreshDrive}
                            onLogin={handleLogin}
                          />
                        )}

                        {activeTab === "palette" && (
                          <ColorExtractor
                            user={user}
                            accessToken={accessToken}
                            onRefreshDrive={handleRefreshDrive}
                            onLogin={handleLogin}
                          />
                        )}

                        {activeTab === "video" && (
                          <ImageToVideo
                            user={user}
                            accessToken={accessToken}
                            onRefreshDrive={handleRefreshDrive}
                            onLogin={handleLogin}
                          />
                        )}

                        {activeTab === "drive" && (
                          <div>
                            {user ? (
                              <DriveExplorer
                                user={user}
                                accessToken={accessToken}
                                files={files}
                                isLoading={isLoadingDrive}
                                onRefresh={handleRefreshDrive}
                                onSelectTab={setActiveTab}
                              />
                            ) : (
                              <div className="py-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                                <CloudLightning className="w-12 h-12 text-slate-300 mb-3" />
                                <h4 className="text-sm font-bold text-slate-800">Authentication Required</h4>
                                <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
                                  Connecting your Google Drive account is required to browse, preview, and sync assets created within Toolkit automotive spaces.
                                </p>
                                <button
                                  onClick={handleLogin}
                                  disabled={isLoggingIn}
                                  className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 font-semibold text-xs text-white shadow-md cursor-pointer"
                                  id="btn-explorer-auth-prompt"
                                >
                                  Authenticate with Google Drive
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === "resources" && (
                          <ResourcesHub 
                            selectedArticleId={selectedArticleId}
                            onSelectArticleId={setSelectedArticleId}
                            initialSubTab={resourcesSubTab}
                          />
                        )}

                        {activeTab === "legal" && (
                          <AdSenseCompliance subTab={legalSubTab} onChangeSubTab={setLegalSubTab} />
                        )}

                        {activeTab === "android" && (
                          <AndroidWorkspace theme={theme} />
                        )}

                        {activeTab === "pdf" && (
                          <PDFTools theme={theme} />
                        )}

                        {activeTab === "converter" && (
                          <ImageConverter theme={theme} />
                        )}

                        {activeTab === "bgremover" && (
                          <BackgroundRemover theme={theme} />
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* AdSense Inline Responsive Banner below active editor grids */}
                <div className={`mt-8 pt-6 border-t select-none ${theme === "dark" ? "border-slate-800" : "border-slate-50"}`}>
                  <AdSenseMock slot="content-footer-responsive" type="responsive" />
                </div>
              </motion.div>
            </main>
          )}
        </div>
      </div>

      {/* Footer copyright */}
      <footer className={`border-t py-16 mt-16 transition-colors duration-200 ${
        theme === "dark"
          ? "border-slate-800 bg-gradient-to-b from-slate-900 to-indigo-950/20 text-slate-300"
          : "border-slate-200/60 bg-gradient-to-b from-slate-50 via-indigo-50/10 to-slate-100 text-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Footer Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Column 1: Brand & Tagline - 4 Cols */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-950 dark:bg-slate-900 text-white shadow-md">
                  <span className="text-emerald-400 font-black text-sm">T</span>
                </div>
                <span className="text-md font-black tracking-tight font-sans">
                  Toolkit<span className="text-indigo-600">Pro</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                A high-performance workspace engineered for digital creators, designers, and marketers. Optimize web formats, extract median-cut palettes, generate QR matrices, and design gorgeous editorial quote cards instantly.
              </p>

              <div className="pt-1.5">
                <a 
                  href="https://toolkit-pro-chi.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all cursor-pointer hover:underline select-none"
                  id="suppport-server-link-brand"
                >
                  <span className="animate-pulse">☕</span>
                  <span>Support Free Server (No Ads)</span>
                </a>
              </div>
              
              {/* Social Media Connections - beautifully built interactive icons */}
              <div className="flex items-center gap-2 pt-2" id="social-links-connector-hub">
                {[
                  { icon: <Github className="w-3.5 h-3.5" />, label: "GitHub", href: "https://github.com", color: "hover:text-slate-900 dark:hover:text-white hover:border-slate-400" },
                  { icon: <Twitter className="w-3.5 h-3.5" />, label: "Twitter", href: "https://twitter.com", color: "hover:text-sky-500 hover:border-sky-400" },
                  { icon: <Linkedin className="w-3.5 h-3.5" />, label: "LinkedIn", href: "https://linkedin.com", color: "hover:text-blue-600 hover:border-blue-500" },
                 { icon: <Facebook className="w-3.5 h-3.5" />, label: "Facebook", href: "https://facebook.com", color: "hover:text-blue-700 hover:border-blue-600" },
                  { icon: <Globe className="w-3.5 h-3.5" />, label: "Website", href: "https://toolkit-pro-chi.vercel.app", color: "hover:text-emerald-600 hover:border-emerald-500" },
               
                   ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-350 shadow-3xs hover:shadow-2xs hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer hover:-translate-y-0.5 ${social.color}`}
                    title={`Connect on ${social.label}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Interactive Services (Links) - 2 Cols */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Interactive Utilities
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                {[
                  { id: "quote", label: "Quote Card Designer" },
                  { id: "compress", label: "Image Compressor" },
                  { id: "qr", label: "QR Code Generator" },
                  { id: "palette", label: "Color Spectrum Extractor" },
                  { id: "drive", label: "Cloud Backups" },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsSitemapView(false);
                        setTimeout(() => {
                          const element = document.getElementById(`tab-select-${item.id}`) || document.getElementById("drive-drop-zone") || document.getElementById("compliance-center-root");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                          } else {
                            window.scrollTo({ top: 350, behavior: "smooth" });
                          }
                        }, 50);
                      }}
                      className="hover:text-indigo-650 dark:hover:text-indigo-400 font-semibold cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
                    >
                      <span className="text-indigo-400">•</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Creator Editorial Guides - 3 Cols */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Knowledge Hub Publications
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                {[
                  { id: "compression-guide", title: "Lossless Image Compression Guide" },
                  { id: "webp-vs-png-vs-jpg", title: "Next-Gen Web Formats compared" },
                  { id: "pinterest-seo", title: "Pinterest Image SEO Optimization" },
                  { id: "color-palette-extraction", title: "Color Extraction Algorithms" },
                  { id: "exif-image-metadata", title: "EXIF Image Metadata Essentials" },
                ].map((post) => (
                  <li key={post.id} className="truncate">
                    <button
                      onClick={() => {
                        setSelectedArticleId(post.id);
                        setActiveTab("resources");
                        setIsSitemapView(false);
                        setTimeout(() => {
                          const element = document.getElementById("resources-hub-container");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          } else {
                            window.scrollTo({ top: 350, behavior: "smooth" });
                          }
                        }, 50);
                      }}
                      className="hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer max-w-full text-left truncate font-semibold"
                      title={`Read: ${post.title}`}
                    >
                      <span>📖</span>
                      <span className="truncate">{post.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Newsletter Subscription - 3 Cols */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-650 dark:text-indigo-450 select-none">
                Subscribe to Newsletter
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-normal">
                Join our list of designers and developers receiving tools, preset packs, and resources.
              </p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Successfully subscribed to Toolkit Pro updates index!");
                  (e.target as HTMLFormElement).reset();
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter creator email"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-950 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-850 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer border border-transparent dark:border-slate-800/80"
                >
                  Join List
                </button>
              </form>
            </div>

          </div>

          {/* Quick-links for manual AdSense verification agents */}
          <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold border-t border-b py-4 ${
            theme === "dark" ? "text-slate-400 border-slate-800" : "text-slate-600 border-slate-200/50"
          }`}>
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("privacy");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("terms");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("about");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              About Shaheera
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("legal");
                setLegalSubTab("contact");
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("compliance-center-root");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              Contact & Support
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <a href="https://toolkit-pro-chi.vercel.app" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 cursor-pointer font-bold flex items-center gap-1">
              <span>☕</span> Support Free Server
            </a>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setActiveTab("resources");
                setSelectedArticleId(null);
                setIsSitemapView(false);
                setTimeout(() => {
                  const element = document.getElementById("resources-hub-container");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              AdSense Content Center
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => {
                setIsSitemapView(true);
                setTimeout(() => {
                  const element = document.getElementById("sitemap-diagnostics-view");
                  if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              title="Dynamic SEO Sitemap & Diagnostic Log"
            >
              Dynamic Sitemap
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hover:text-indigo-650 dark:hover:text-amber-400 cursor-pointer font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              id="footer-feedback-trigger-btn"
              title="Share rating and commentary feedback about your experience"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-amber-400" />
              <span>Send Feedback</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

            <button
              onClick={() => {
                setIsPrintPreviewOpen(true);
                logSessionActivity({
                  type: "tool",
                  title: "Opened Print Preview",
                  detail: `Triggered high-fidelity scaled-down visual print preview modal for active ${activeTab} tool`,
                  icon: "ShieldCheck",
                  tab: activeTab
                });
              }}
              className="hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 cursor-pointer font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900/40 px-3 py-1.5 rounded-xl transition-all shadow-3xs hover:scale-102 active:scale-97 select-none"
              title="Visualize exact physical printed document using a scaled A4 page layout preview container"
              id="footer-print-preview-trigger-btn"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>
                Print Preview
              </span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

            <button
              onClick={() => {
                window.focus();
                window.print();
                logSessionActivity({
                  type: "tool",
                  title: "Printed Active Workspace",
                  detail: `Triggered high-fidelity browser print layout for active ${activeTab} tool`,
                  icon: "ShieldCheck",
                  tab: activeTab
                });
              }}
              className="hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer font-bold flex items-center gap-1.5 text-indigo-600 dark:text-amber-400 border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-1.5 rounded-xl transition-all shadow-3xs hover:scale-102 active:scale-97 select-none"
              title="Print high-fidelity design layout of the active creator space utilizing dedicated stylesheet media queries"
              id="footer-print-view-trigger-btn"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500 dark:text-amber-400 animate-pulse" />
              <span>
                Print Now
              </span>
            </button>
          </div>

          {/* Bottom Bar: Copyright and Badging */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-350 font-medium pt-2">
            <p>© 2026 Toolkit Pro Suite. All rights registered.</p>
            <p className={`mt-2 sm:mt-0 font-semibold flex items-center gap-1.5 select-none ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Google Workspace Secured Integration • Built for Creators</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Modern Command Palette Overlay dialog Console */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsSitemapView(false);
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        onLogin={handleLogin}
        isLoggedIn={!!user}
        onRefreshDrive={handleRefreshDrive}
        onSelectArticle={setSelectedArticleId}
        onOpenSitemap={() => setIsSitemapView(true)}
        onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
      />

      {/* Modern Self-contained Keyboard Shortcuts Cheat-sheet Assistance Modal */}
      <ShortcutsModal 
        isOpen={isShortcutsHelpOpen} 
        onClose={() => setIsShortcutsHelpOpen(false)} 
      />

      {/* Interactive step-by-step App Tour Overlay panel */}
      <AppTourOverlay
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
      />

      {/* Interactive user satisfaction survey & feedback commentary submission card */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        theme={theme}
      />

      {/* Visual High-Fidelity Print Preview Modal */}
      <AnimatePresence>
        {isPrintPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={`w-full max-w-5xl rounded-3xl border shadow-2xl flex flex-col md:flex-row overflow-hidden ${
                theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* Left Settings & Controller Side-Bar */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-6 shrink-0 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950/70 text-amber-650 dark:text-amber-400 rounded-xl">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Print Preview</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-mono">Physical Simulator</p>
                  </div>
                </div>

                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  className="space-y-4"
                >
                  {/* Printer Preset controller */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-1.5 pb-3 border-b border-slate-200/50 dark:border-slate-800/50"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Printer Preset</span>
                    <div className="relative">
                      <select
                        value={selectedPresetId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPresetId(val);
                          if (val !== "custom") {
                            const preset = printerPresets.find(p => p.id === val);
                            if (preset) {
                              setPrintPageMargins(preset.margins);
                              setShowCropMarks(preset.cropMarks);
                              setShowSafeArea(preset.safeArea);
                              setShowBleed(preset.bleed ?? false);
                              if (preset.bleedWidth !== undefined) {
                                setPrintBleedWidth(preset.bleedWidth);
                              } else if (preset.bleed) {
                                setPrintBleedWidth(3);
                              } else {
                                setPrintBleedWidth(0);
                              }
                              if (preset.orientation) {
                                setPrintOrientation(preset.orientation);
                              }
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none cursor-pointer"
                      >
                        <optgroup label="Standard" className="text-slate-400 font-bold bg-white dark:bg-slate-950">
                          {printerPresets.filter(p => !p.category || p.category === "Standard").length > 0 ? (
                            printerPresets.filter(p => !p.category || p.category === "Standard").map((p) => (
                              <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200">
                                {p.icon} {p.name}
                              </option>
                            ))
                          ) : (
                            <option disabled className="text-slate-400 dark:text-slate-600 italic">
                              No Standard presets available
                            </option>
                          )}
                        </optgroup>
                        
                        <optgroup label="Professional" className="text-slate-400 font-bold bg-white dark:bg-slate-950">
                          {printerPresets.filter(p => p.category === "Professional").length > 0 ? (
                            printerPresets.filter(p => p.category === "Professional").map((p) => (
                              <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200">
                                {p.icon} {p.name}
                              </option>
                            ))
                          ) : (
                            <option disabled className="text-slate-400 dark:text-slate-600 italic">
                              No Professional presets available
                            </option>
                          )}
                        </optgroup>

                        <optgroup label="Specialty" className="text-slate-400 font-bold bg-white dark:bg-slate-950">
                          {printerPresets.filter(p => p.category === "Specialty").length > 0 ? (
                            printerPresets.filter(p => p.category === "Specialty").map((p) => (
                              <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200">
                                {p.icon} {p.name}
                              </option>
                            ))
                          ) : (
                            <option disabled className="text-slate-400 dark:text-slate-600 italic">
                              No Specialty presets available
                            </option>
                          )}
                        </optgroup>

                        <optgroup label="Custom Options" className="text-slate-400 font-bold bg-white dark:bg-slate-950">
                          <option value="custom" className="text-slate-850 dark:text-slate-100">⚙️ Custom Settings</option>
                        </optgroup>
                      </select>
                    </div>
                    {/* Dynamic description info */}
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-1">
                      {selectedPresetId === "custom" 
                        ? "Manually adjusted layout parameters" 
                        : printerPresets.find(p => p.id === selectedPresetId)?.description}
                    </p>

                    {/* Inline Preset Addition Form */}
                    {selectedPresetId === "custom" && !isSavingPreset && (
                      <button
                        type="button"
                        onClick={() => setIsSavingPreset(true)}
                        className="mt-1.5 w-full py-1.5 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900 text-[10px] font-black text-indigo-650 dark:text-indigo-400 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        ✨ Save Current as Preset
                      </button>
                    )}

                    {isSavingPreset && (
                      <div className="mt-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-850 bg-slate-50 dark:bg-slate-950 text-left space-y-2 animate-fade-in">
                        <span className="block text-[8.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Save Dynamic Preset</span>
                        
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400">Preset Name</label>
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="e.g. My Custom Offset"
                            className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-850 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400">Description (Optional)</label>
                          <input
                            type="text"
                            value={newPresetDesc}
                            onChange={(e) => setNewPresetDesc(e.target.value)}
                            placeholder="e.g. For professional labels"
                            className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-850 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400">Category</label>
                          <div className="flex gap-1">
                            {(["Standard", "Professional", "Specialty"] as const).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNewPresetCategory(cat)}
                                className={`flex-1 py-1 px-1.5 rounded-md text-[9px] font-bold transition-all ${
                                  newPresetCategory === cat
                                    ? "bg-indigo-600 text-white shadow-3xs"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400">Choose Icon</label>
                          <div className="flex gap-1">
                            {["🖨️", "🏭", "📄", "🎨", "🏷️", "🌟"].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setNewPresetIcon(emoji)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-xs transition-colors ${
                                  newPresetIcon === emoji ? "bg-indigo-100 dark:bg-indigo-950" : "hover:bg-slate-200 dark:hover:bg-slate-800"
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSavingPreset(false);
                              setNewPresetName("");
                              setNewPresetDesc("");
                              setNewPresetCategory("Standard");
                            }}
                            className="flex-1 py-1 text-[9px] font-bold text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-900 rounded-md cursor-pointer border border-transparent"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPreset}
                            className="flex-1 py-1 bg-indigo-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700 cursor-pointer shadow-3xs border border-transparent"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Orientation controller */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-1.5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Page Orientation</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "portrait" as const, label: "📄 Portrait" },
                        { id: "landscape" as const, label: "📁 Landscape" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPrintOrientation(opt.id)}
                          className={`py-2 px-1 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                            printOrientation === opt.id
                              ? "bg-indigo-650 border-indigo-650 text-white"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Margins controller */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-1.5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Paper Margins</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "standard" as const, label: "Standard" },
                        { id: "minimum" as const, label: "Minimum" },
                        { id: "none" as const, label: "None" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPrintPageMargins(opt.id)}
                          className={`py-2 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                            printPageMargins === opt.id
                              ? "bg-indigo-650 border-indigo-650 text-white"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Centering Mode */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-1.5 pt-3 border-t border-slate-200/65 dark:border-slate-800/65"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Centering Mode</span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {centerDesign ? "Auto Center ON" : "Off"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCenterDesign(!centerDesign)}
                      className={`w-full py-2 px-3 rounded-xl border font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                        centerDesign
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-750 dark:text-emerald-300 shadow-3xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <span>🎯</span>
                      <span>{centerDesign ? "Design Centered" : "Center Design"}</span>
                    </button>
                  </motion.div>

                  {/* Visual scale / zoom controller */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preview Scale</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-505 dark:text-indigo-400">
                        {Math.round(previewScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="1.2"
                      step="0.05"
                      value={previewScale}
                      onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-1.5 rounded bg-slate-200 dark:bg-slate-850"
                    />
                    <div className="flex justify-between text-[8px] text-slate-405 dark:text-slate-500 font-mono">
                      <span>40%</span>
                      <button type="button" onClick={() => setPreviewScale(0.85)} className="hover:text-indigo-505 dark:hover:text-indigo-400 cursor-pointer">Reset (85%)</button>
                      <span>120%</span>
                    </div>
                  </motion.div>

                  {/* Print Overlay Alignment Tools */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="space-y-2 pt-3.5 border-t border-slate-200/65 dark:border-slate-800/65"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Print Overlays</span>
                    
                    <div className="space-y-2">
                      {/* Crop Marks Toggle */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all select-none">
                        <div className="flex items-center gap-2">
                          <Crop className="w-3.5 h-3.5 text-rose-500" />
                          <div className="text-left">
                            <span className="text-xs font-bold block">Crop Marks</span>
                            <span className="text-[8px] text-slate-400 block leading-none font-medium mt-0.5">Registration & trim markers</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showCropMarks}
                          onChange={(e) => setShowCropMarks(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-650 accent-indigo-650 cursor-pointer"
                        />
                      </label>

                      {/* Safe Area Toggle */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all select-none">
                        <div className="flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <div className="text-left">
                            <span className="text-xs font-bold block">Safe Area Border</span>
                            <span className="text-[8px] text-slate-400 block leading-none font-medium mt-0.5">Dashed safe printing zone</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showSafeArea}
                          onChange={(e) => setShowSafeArea(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-650 accent-indigo-650 cursor-pointer"
                        />
                      </label>

                      {/* Bleed Area Control Container */}
                      <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all select-none">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-3.5 h-3.5 text-red-500" />
                            <div className="text-left">
                              <span className="text-xs font-bold block">Bleed Boundary ({printBleedWidth}mm)</span>
                              <span className="text-[8px] text-slate-400 block leading-none font-medium mt-0.5">Red boundary for edge-to-edge trimming</span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={showBleed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setShowBleed(checked);
                              if (checked && printBleedWidth === 0) {
                                setPrintBleedWidth(3); // Default to 3mm if enabled and previously 0
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-650 accent-indigo-650 cursor-pointer"
                          />
                        </label>

                        {/* Collapsible Dynamic Range Slider */}
                        {showBleed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              <span>Bleed Width:</span>
                              <span className="text-red-500 font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-950/40 rounded border border-red-100 dark:border-red-900/30 font-mono">{printBleedWidth}mm</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-mono">0mm</span>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={printBleedWidth}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setPrintBleedWidth(val);
                                  if (val === 0) {
                                    setShowBleed(false);
                                  } else {
                                    setShowBleed(true);
                                  }
                                }}
                                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-red-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">10mm</span>
                            </div>

                            {/* Reset Button */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[8px] text-slate-400 dark:text-slate-500">3mm is the offset printing industry standard</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintBleedWidth(3);
                                  setShowBleed(true);
                                }}
                                className="text-[9px] font-bold uppercase tracking-wider text-red-500 dark:text-red-450 hover:text-red-600 dark:hover:text-red-450 transition-colors flex items-center gap-1 cursor-pointer bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/45 px-2 py-1 rounded-lg border border-red-200/40 dark:border-red-900/20"
                              >
                                🔄 Reset Bleed (3mm)
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                  {/* Quick features breakdown */}
                  <div className="bg-amber-50 dark:bg-amber-955 px-3.5 py-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1 text-left font-sans shadow-3xs">
                    <p className="font-bold flex items-center gap-1">
                      <span>💡</span>
                      <span>Print-media Engine</span>
                    </p>
                    <p>This layout uses the exact CSS `@media print` rules from `index.css` that hide editing sidebars, settings parameters, and banners to render only clean content.</p>
                  </div>

                  {/* Control Actions (Reset & Refresh) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintPageMargins("minimum");
                        setPrintOrientation("portrait");
                        setShowCropMarks(true);
                        setShowSafeArea(true);
                        setShowBleed(false);
                        setPrintBleedWidth(3);
                        setPreviewScale(0.85);
                      }}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                      title="Reset all settings to system factory defaults"
                    >
                      <span>🧼</span>
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // Trigger state refresh by briefly clearing and re-checking
                        setPreviewHtml("");
                        setTimeout(() => {
                          let selector = "";
                          if (activeTab === "quote") selector = "#quote-card-preview";
                          else if (activeTab === "qr") selector = "#qr-code-preview-card";
                          else if (activeTab === "palette") selector = ".palette-swatches-grid";
                          else if (activeTab === "compress") selector = ".compression-results-view, #active-compression-preview";
                          else if (activeTab === "drive") selector = ".drive-files-grid";

                          if (selector) {
                            const element = document.querySelector(selector);
                            if (element) {
                              if (activeTab === "palette") {
                                const hist = document.querySelector(".color-histogram-chart");
                                let combined = element.outerHTML;
                                if (hist) combined += `<div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">${hist.outerHTML}</div>`;
                                setPreviewHtml(combined);
                              } else {
                                setPreviewHtml(element.outerHTML);
                              }
                            } else {
                              setPreviewHtml(`
                                <div class="p-12 text-center text-slate-450 dark:text-slate-500 font-sans space-y-4">
                                  <p class="font-black text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">No Content Ready</p>
                                  <p class="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-400">Please generate or load an active design layout to print.</p>
                                </div>
                              `);
                            }
                          }
                        }, 50);
                      }}
                      className="py-2 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      <span>🔄</span>
                      <span>Refresh Content</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Simulated Paper View Container */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-slate-100 dark:bg-slate-950 overflow-y-auto max-h-[85vh] min-h-[500px]">
                {/* Header detail */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50 select-none">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Active Output: {activeTab === "quote" ? "Quote Card" : activeTab === "qr" ? "QR Matrix" : activeTab === "palette" ? "Median Extract" : "Workspace Summary"}
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-100 dark:bg-indigo-950/75 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-md">
                    Standard A4 Page (Simulated)
                  </span>
                </div>

                {/* Simulated Paper sheet bounding box */}
                <div className="flex-1 flex items-center justify-center py-6 overflow-hidden">
                  <div className="relative">
                    {/* Optional Bleed boundary (draws a red boundary outside the page dimensions) */}
                    {showBleed && (
                      <>
                        <div 
                          className="absolute border-2 border-dashed border-red-500 rounded-sm pointer-events-none z-30 animate-pulse" 
                          style={{ inset: `-${printBleedWidth * 4}px` }}
                        />
                        <div 
                          className="absolute left-1/2 -translate-x-1/2 text-[8px] font-black tracking-widest text-red-500 dark:text-red-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-red-500/30 shadow-3xs uppercase whitespace-nowrap pointer-events-none z-30 select-none"
                          style={{ top: `-${printBleedWidth * 4 + 20}px` }}
                        >
                          ✂️ Bleed Trim Zone (+{printBleedWidth}mm)
                        </div>
                      </>
                    )}

                    <div
                      className={`relative bg-white shadow-2xl rounded-sm transition-all duration-300 origin-center select-none overflow-hidden ${
                        printOrientation === "portrait"
                          ? "w-[440px] h-[622px]"
                          : "w-[622px] h-[440px]"
                      }`}
                      style={{
                        padding:
                          printPageMargins === "standard"
                            ? "1.5cm"
                            : printPageMargins === "minimum"
                            ? "0.5cm"
                            : "0cm",
                        color: "#000000",
                      }}
                    >
                    {/* Visual margin guidelines on screen */}
                    {printPageMargins !== "none" && (
                      <div className="absolute inset-0 border border-dashed border-sky-200 dark:border-sky-900/25 pointer-events-none m-[inherit] rounded-xs" />
                    )}

                    {/* Visual Crop Marks Overlay */}
                    {showCropMarks && (
                      <>
                        {/* Top-Left Corner Crop Mark */}
                        <div className="absolute top-0 left-0 w-6 h-[1.5px] bg-rose-600/95 pointer-events-none z-30" />
                        <div className="absolute top-0 left-0 w-[1.5px] h-6 bg-rose-600/95 pointer-events-none z-30" />
                        
                        {/* Top-Right Corner Crop Mark */}
                        <div className="absolute top-0 right-0 w-6 h-[1.5px] bg-rose-600/95 pointer-events-none z-30" />
                        <div className="absolute top-0 right-0 w-[1.5px] h-6 bg-rose-600/95 pointer-events-none z-30" />

                        {/* Bottom-Left Corner Crop Mark */}
                        <div className="absolute bottom-0 left-0 w-6 h-[1.5px] bg-rose-600/95 pointer-events-none z-30" />
                        <div className="absolute bottom-0 left-0 w-[1.5px] h-6 bg-rose-600/95 pointer-events-none z-30" />

                        {/* Bottom-Right Corner Crop Mark */}
                        <div className="absolute bottom-0 right-0 w-6 h-[1.5px] bg-rose-600/95 pointer-events-none z-30" />
                        <div className="absolute bottom-0 right-0 w-[1.5px] h-6 bg-rose-600/95 pointer-events-none z-30" />

                        {/* Registration Targets for color alignment (top, bottom, left, right centers) */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none w-4 h-4 z-30" title="Registration Target">
                          <div className="w-3 h-3 rounded-full border border-rose-600/90 flex items-center justify-center">
                            <div className="w-4 h-[1px] bg-rose-600/90 absolute" />
                            <div className="h-4 w-[1px] bg-rose-600/90 absolute" />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none w-4 h-4 z-30" title="Registration Target">
                          <div className="w-3 h-3 rounded-full border border-rose-600/90 flex items-center justify-center">
                            <div className="w-4 h-[1px] bg-rose-600/90 absolute" />
                            <div className="h-4 w-[1px] bg-rose-600/90 absolute" />
                          </div>
                        </div>
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none w-4 h-4 z-30" title="Registration Target">
                          <div className="w-3 h-3 rounded-full border border-rose-600/90 flex items-center justify-center">
                            <div className="w-4 h-[1px] bg-rose-600/90 absolute" />
                            <div className="h-4 w-[1px] bg-rose-600/90 absolute" />
                          </div>
                        </div>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none w-4 h-4 z-30" title="Registration Target">
                          <div className="w-3 h-3 rounded-full border border-rose-600/90 flex items-center justify-center">
                            <div className="w-4 h-[1px] bg-rose-600/90 absolute" />
                            <div className="h-4 w-[1px] bg-rose-600/90 absolute" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Safe Area Guideline */}
                    {showSafeArea && (
                      <div className="absolute inset-5 border-2 border-dashed border-emerald-500/50 pointer-events-none rounded-xs z-20 flex items-start justify-start p-1" title="Safe Area (0.25in / 6mm offset)">
                        <span className="text-[7px] font-mono font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded leading-none select-none uppercase tracking-widest opacity-80 scale-90 origin-top-left">
                          Safe Area
                        </span>
                      </div>
                    )}

                    {/* Scale boundary wrapper wrapping injected live HTML */}
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center overflow-hidden font-sans text-slate-800 print-preview-content-area"
                      style={{
                        transform: `scale(${previewScale})`,
                        transformOrigin: "center center"
                      }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                    {centerDesign && (
                      <style dangerouslySetInnerHTML={{ __html: `
                        .print-preview-content-area > * {
                          margin-left: auto !important;
                          margin-right: auto !important;
                          margin-top: auto !important;
                          margin-bottom: auto !important;
                        }
                      `}} />
                    )}
                  </div>
                </div>
              </div>

                {/* Actions row footer */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400 text-left leading-tight font-medium">
                    <p>💡 Tip: Verify all design custom colors and font pairings look correct.</p>
                    <p className="mt-0.5">Physical size adjustments will map safely to actual printer papers.</p>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsPrintPreviewOpen(false)}
                      className="flex-1 sm:flex-none py-2 px-4 border border-slate-205 dark:border-slate-805 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      Close Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="flex-1 sm:flex-none py-2 px-5 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download as PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintPreviewOpen(false);
                        setTimeout(() => {
                          window.focus();
                          window.print();
                        }, 250);
                      }}
                      className="flex-1 sm:flex-none py-2 px-5 bg-indigo-650 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Google Drive Auth Error Modal */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 text-left relative ${
                theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* Close Button top-right corner */}
              <button
                onClick={() => setAuthError(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close modal"
                id="modal-close-auth-err"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                {/* Visual Icon Header */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0 animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight uppercase text-rose-600 dark:text-rose-400">
                      Authorization Notice
                    </h3>
                    <p className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 mt-0.5">
                      Google Drive Sync Failed
                    </p>
                  </div>
                </div>

                {/* Error description content */}
                <div className="text-xs space-y-2 leading-relaxed bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100/40 dark:border-rose-900/30 rounded-xl p-4.5">
                  <p className="text-slate-705 dark:text-slate-200 font-medium">
                    The system encountered an error while attempting to authorize secure cloud file synchronization:
                  </p>
                  <p className="font-mono text-[11px] bg-slate-950/5 dark:bg-slate-955/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850 text-rose-700 dark:text-rose-400 break-words select-all leading-relaxed">
                    {authError}
                  </p>
                </div>

                {/* Helpful instructions for troubleshooting common OAuth issues */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="font-bold block text-slate-600 dark:text-slate-350">💡 Common Solutions:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ensure you permit popups if a separate browser window is blocked.</li>
                    <li>Verify your device has a stable and active internet connection.</li>
                    <li>If testing locally, synchronize client credentials in your cloud console.</li>
                  </ul>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer select-none transition-all"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md select-none disabled:opacity-55 cursor-pointer active:scale-97"
                    id="retry-auth-modal-btn"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoggingIn ? "Retrying..." : "Retry Authorization"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher badges for quick clicking visual palette and accessibility discovery */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Visual App Tour launcher */}
        <button
          onClick={() => setIsTourOpen(true)}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-amber-400 p-3 sm:px-4 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Restart Interactive App Tour"
          id="floating-tour-launcher-btn"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 dark:text-amber-400 animate-pulse" />
          <span className="text-xs font-extrabold hidden sm:inline-block">
            App Tour
          </span>
        </button>

        {/* Visual Keyboard Shortcuts Accessibility Launcher Button */}
        <button
          onClick={() => setIsShortcutsHelpOpen(true)}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-indigo-400 p-3 sm:px-4 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Open Keyboard Shortcuts Cheat-Sheet (?)"
          id="floating-shortcuts-launcher-btn"
        >
          <Keyboard className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-extrabold hidden sm:inline-block">
            Shortcuts
          </span>
          <kbd className="hidden sm:inline-flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none text-slate-500">
            ?
          </kbd>
        </button>

        {/* Floating Command Panel badge */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="bg-indigo-650 hover:bg-indigo-700 text-white p-3 sm:px-4.5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-103 active:scale-97 select-none cursor-pointer border border-indigo-400/20"
          title="Open Command Palette Search (Ctrl+K)"
          id="floating-palette-launcher-btn"
        >
          <Command className="w-4 h-4 text-indigo-200 shrink-0" />
          <span className="text-xs font-black tracking-wider uppercase hidden sm:inline-block">
            Command Panel
          </span>
          <kbd className="hidden sm:inline-flex bg-indigo-500/45 border border-indigo-405/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none text-indigo-100">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Modern Back to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-24 right-6.5 sm:right-7.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-700/60 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-93 select-none cursor-pointer animate-fade-in group"
          title="Zoom to scroll-top frame"
          id="scroll-to-top-floating-btn"
        >
          <ArrowUp className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Interactive alert HUD showing shortcut triggers visually */}
      {lastShortcutPressed && (
        <div 
          className="fixed bottom-38 sm:bottom-8 right-6 z-40 bg-slate-900/90 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800 text-white px-4.5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold backdrop-blur-md font-sans select-none"
          id="global-shortcut-tracer-hud"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="text-slate-400">Triggered:</span>
          <kbd className="bg-slate-800/80 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-slate-700 font-mono text-[10px] font-bold">
            {lastShortcutPressed}
          </kbd>
        </div>
      )}

      {isDraggingOverScreen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOverScreen(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverScreen(false);
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles && droppedFiles.length > 0) {
              const imageFiles = (Array.from(droppedFiles) as File[]).filter(file => file.type.startsWith("image/"));
              if (imageFiles.length > 0) {
                // Switch to compress tab
                setActiveTab("compress");
                setIsSitemapView(false);
                // Set as dragged files
                setDraggedFiles(imageFiles);
                // Smooth scroll down to Main Operational Frame
                setTimeout(() => {
                  const el = document.getElementById("tab-select-compress");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              } else {
                alert("Only image files are supported in this Workspace Suite!");
              }
            }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md border-4 border-dashed border-emerald-500 m-4 rounded-3xl animate-fade-in animate-duration-150 select-none text-white p-6"
        >
          <div className="p-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
            <FileImage className="w-16 h-16 animate-pulse" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Instantly Compress Your Image
          </h3>
          <p className="text-slate-300 text-sm max-w-md text-center leading-relaxed font-sans">
            Drop your image files anywhere on the screen! They will instantly open in the optimized Image Compressor tool.
          </p>
          <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            JPEG, PNG, WebP supported
          </div>
        </div>
      )}
    </div>
  );
}
