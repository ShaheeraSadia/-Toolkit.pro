import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, 
  Database, 
  Layers, 
  Cpu, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Search, 
  Wifi, 
  Battery, 
  RefreshCw, 
  CheckCircle2, 
  Settings, 
  ExternalLink, 
  Sparkles, 
  Sliders, 
  Terminal, 
  Video, 
  Volume2, 
  Download,
  Flame,
  Activity,
  Code,
  FileCode,
  Brush,
  Clock,
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RoomEntity {
  id: string;
  title: string;
  prompt: string;
  engine: string;
  status: "COMPLETED" | "RUNNING" | "ENQUEUED" | "FAILED";
  timestamp: string;
}

interface BackgroundTask {
  id: string;
  name: string;
  status: "RUNNING" | "ENQUEUED" | "SUCCESS" | "FAILED";
  progress: number;
  logs: string[];
}

export default function AndroidWorkspace({ theme }: { theme: "light" | "dark" }) {
  // Mobile Frame States
  const [activeMobileScreen, setActiveMobileScreen] = useState<"dashboard" | "canvas" | "room" | "veo" | "workers" | "converter">("dashboard");
  const [deviceTime, setDeviceTime] = useState<string>("12:00 PM");

  // Web-to-Android App Converter States
  const [converterModule, setConverterModule] = useState<"quote" | "qr" | "palette" | "full">("full");
  const [converterTheme, setConverterTheme] = useState<string>("#8B5CF6");
  const [converterSdk, setConverterSdk] = useState<"35" | "34">("35");
  const [isConverting, setIsConverting] = useState(false);
  const [converterProgress, setConverterProgress] = useState(0);
  const [converterLogs, setConverterLogs] = useState<string[]>([]);
  const [compiledSuccess, setCompiledSuccess] = useState(false);

  const startCompilation = () => {
    setIsConverting(true);
    setCompiledSuccess(false);
    setConverterProgress(0);
    setConverterLogs(["[Gradle] Initializing Android Gradle Plugin (AGP 8.3)...", "[Gradle] Loading project layout structures..."]);

    const logSteps = [
      { p: 10, l: "[Gradle] Resolving configuration dependencies for ':app:release'" },
      { p: 20, l: "[KTS] Compiling build.gradle.kts configuration schema..." },
      { p: 30, l: "[Hilt] Generating Dependency Injection graph for local Room DB..." },
      { p: 45, l: "[Room] Verifying SQLite database schemas and DAO compiler..." },
      { p: 55, l: "[Compose] Optimizing Kotlin Compiler plugin for UI composables..." },
      { p: 70, l: "[R8] Stripping unused Dalvik bytecode signatures to minify bundle..." },
      { p: 85, l: "[AAPT2] Compiling and merging Android resources with Manifest file..." },
      { p: 95, l: "[Sign] Applying v2 digital cryptographic APK release signature..." },
      { p: 100, l: "[SUCCESS] Compiled APK bundle successfully! File size: 4.82 MB." }
    ];

    let currentStep = 0;
    const logInterval = setInterval(() => {
      if (currentStep < logSteps.length) {
        const step = logSteps[currentStep];
        setConverterProgress(step.p);
        setConverterLogs(prev => [...prev, step.l]);
        currentStep++;
      } else {
        clearInterval(logInterval);
        setIsConverting(false);
        setCompiledSuccess(true);
      }
    }, 700);
  };

  // Room DB State
  const [roomEntities, setRoomEntities] = useState<RoomEntity[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("android-room-db");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "1", title: "Astronaut Desert", prompt: "A 60fps cinematic tracking shot of an astronaut walking on pink deserts", engine: "Veo 3.1 Fast", status: "COMPLETED", timestamp: "12:05 PM" },
      { id: "2", title: "Cyberpunk Alley", prompt: "Hyperrealistic neon reflection in puddles, cinematic pan", engine: "Veo 3.1 Pro", status: "COMPLETED", timestamp: "12:12 PM" },
      { id: "3", title: "Forest Dream", prompt: "Drone flyover of gold autumn forest canopy, 4k ultra-res", engine: "Veo 3.1 Fast", status: "ENQUEUED", timestamp: "12:14 PM" },
    ];
  });

  const [newEntityTitle, setNewEntityTitle] = useState("");
  const [newEntityPrompt, setNewEntityPrompt] = useState("");
  const [newEntityEngine, setNewEntityEngine] = useState("Veo 3.1 Fast");
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [selectedDbTab, setSelectedDbTab] = useState<"data" | "code">("data");

  // Background Workers State
  const [workers, setWorkers] = useState<BackgroundTask[]>([
    {
      id: "WORK_102",
      name: "Veo Latent Diffuse Compiler",
      status: "RUNNING",
      progress: 65,
      logs: [
        "WorkManager: Job enqueued successfully",
        "Thread pool: Spawning rendering daemon #1",
        "TPU v5e Compiler: Allocating latent memory graphs",
        "Model weights loaded: 26.4 Billion Parameters"
      ]
    },
    {
      id: "WORK_103",
      name: "Room DB Cache Syncer",
      status: "SUCCESS",
      progress: 100,
      logs: [
        "WorkManager: Scheduled on intervals: 15 mins",
        "RoomInspector: Checking dirty cache indices",
        "Cache synchronization success: 0ms overhead",
        "Worker thread released to OS pool"
      ]
    }
  ]);

  // Compose Canvas Paint States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [brushColor, setBrushColor] = useState("#8B5CF6"); // Indigo default
  const [brushWidth, setBrushWidth] = useState(6);
  const [gpuLatency, setGpuLatency] = useState<number>(3.2); // Simulating Compose Canvas GPU rendering speed
  const [composeDrawCalls, setComposeDrawCalls] = useState<number>(0);
  const [canvasViewMode, setCanvasViewMode] = useState<"render" | "code">("render");

  // Veo 3.1 Fast Engine States
  const [veoPrompt, setVeoPrompt] = useState("Cinematic slow motion shot of water splash reflecting sunset rays");
  const [veoFramerate, setVeoFramerate] = useState<"30" | "60">("60");
  const [veoDuration, setVeoDuration] = useState<number>(4);
  const [veoMotionScale, setVeoMotionScale] = useState<number>(7.5);
  const [veoCameraMovement, setVeoCameraMovement] = useState<string>("pan-right");
  const [veoIsGenerating, setVeoIsGenerating] = useState(false);
  const [veoProgress, setVeoProgress] = useState(0);
  const [veoLogs, setVeoLogs] = useState<string[]>([]);
  const [veoVideoResult, setVeoVideoResult] = useState<string | null>(null);

  // Sync Room DB to LocalStorage
  useEffect(() => {
    localStorage.setItem("android-room-db", JSON.stringify(roomEntities));
  }, [roomEntities]);

  // Live Clock for Android Status Bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setDeviceTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulating live WorkManager background workers
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkers(prev => prev.map(w => {
        if (w.status === "RUNNING") {
          const nextProgress = w.progress + Math.floor(Math.random() * 8) + 2;
          if (nextProgress >= 100) {
            return {
              ...w,
              progress: 100,
              status: "SUCCESS",
              logs: [...w.logs, `Worker completed execution at ${new Date().toLocaleTimeString()}`, "Terminated clean thread."]
            };
          } else {
            const possibleLogs = [
              "Evaluating physical boundaries in latent fields...",
              "Writing temporal interpolation indices...",
              "Caching checkpoint in Room DB SQLite layer...",
              "Optimizing memory arrays for Fast Latent calculations..."
            ];
            const addedLog = Math.random() > 0.6 ? [possibleLogs[Math.floor(Math.random() * possibleLogs.length)]] : [];
            return {
              ...w,
              progress: nextProgress,
              logs: addedLog.length > 0 ? [...w.logs, ...addedLog] : w.logs
            };
          }
        }
        return w;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Room DB actions
  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityTitle || !newEntityPrompt) return;
    const newEntity: RoomEntity = {
      id: Date.now().toString(),
      title: newEntityTitle,
      prompt: newEntityPrompt,
      engine: newEntityEngine,
      status: "COMPLETED",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setRoomEntities(prev => [newEntity, ...prev]);
    setNewEntityTitle("");
    setNewEntityPrompt("");
  };

  const handleDeleteEntity = (id: string) => {
    setRoomEntities(prev => prev.filter(e => e.id !== id));
  };

  // Compose Canvas Handlers
  useEffect(() => {
    if (activeMobileScreen === "canvas" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Clear canvas with black
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeMobileScreen, canvasViewMode]);

  const startPainting = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setComposeDrawCalls(prev => prev + 1);
  };

  const paint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const startTime = performance.now();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    const duration = performance.now() - startTime;
    setGpuLatency(Number(duration.toFixed(2)) || 0.1);
  };

  const stopPainting = () => {
    setIsPainting(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setComposeDrawCalls(0);
  };

  // Veo 3.1 Fast Engine Simulation Trigger
  const triggerVeoGeneration = () => {
    if (!veoPrompt) return;
    setVeoIsGenerating(true);
    setVeoProgress(0);
    setVeoVideoResult(null);
    setVeoLogs([]);

    const runLogs = [
      `[0.0s] Bootstrapping Google Veo 3.1 Fast Latent-Diffusion graph...`,
      `[0.5s] Spawning Cloud TPU v5e hyper-processor nodes...`,
      `[1.2s] Weight Matrix Allocation: 26B dense spatial-temporal weights...`,
      `[2.0s] Tokenizing Prompt: "${veoPrompt.substring(0, 40)}..."`,
      `[2.8s] Iterative Latent Physics Solver (Denoising step 1/15)...`,
      `[3.5s] Frame Motion Interp: Generating 60FPS fluid physics coherence...`,
      `[4.3s] Injecting camera parameters (movement: ${veoCameraMovement}, intensity: ${veoMotionScale})...`,
      `[5.1s] Color profiles mapped in Cinematic Wide gamut space...`,
      `[5.9s] Compiling high-fidelity video stream: 1080p, H.265 encode...`,
      `[6.5s] Finalizing output segment to Room Database storage...`
    ];

    let currentLogIndex = 0;
    const timer = setInterval(() => {
      setVeoProgress(prev => {
        const step = Math.ceil(Math.random() * 8) + 4;
        const next = Math.min(100, prev + step);

        // Add a log corresponding to progress
        const logProgressThreshold = Math.floor((100 / runLogs.length) * currentLogIndex);
        if (next >= logProgressThreshold && currentLogIndex < runLogs.length) {
          setVeoLogs(l => [...l, runLogs[currentLogIndex]]);
          currentLogIndex++;
        }

        if (next >= 100) {
          clearInterval(timer);
          setVeoIsGenerating(false);
          // Generate a stunning simulated video URL using a high quality background canvas color representation
          setVeoVideoResult("completed");
          // Insert generated item automatically into Room database
          const newRoomItem: RoomEntity = {
            id: Date.now().toString(),
            title: veoPrompt.split(" ").slice(0, 3).join(" ") || "Veo Clip",
            prompt: veoPrompt,
            engine: `Veo 3.1 Fast (${veoFramerate}FPS)`,
            status: "COMPLETED",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setRoomEntities(prev => [newRoomItem, ...prev]);

          // Log success inside background workers
          const newWorkerLog: BackgroundTask = {
            id: `VEO_${Date.now().toString().substring(8)}`,
            name: `Veo Job: ${newRoomItem.title}`,
            status: "SUCCESS",
            progress: 100,
            logs: [
              "WorkManager: Scheduled high priority job",
              "Veo 3.1 Fast Engine: Successfully completed segment generation",
              `Committed to SQLite table RoomDB: ${newRoomItem.id}`
            ]
          };
          setWorkers(prev => [newWorkerLog, ...prev]);
        }
        return next;
      });
    }, 450);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* LEFT SIDE: Android Phone Frame */}
      <div className="w-full lg:w-[420px] flex flex-col items-center shrink-0">
        <div className="text-center mb-4 select-none">
          <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-black font-mono tracking-widest uppercase inline-flex items-center gap-1.5 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Veo 3.1 Native Emulator
          </span>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">
            High-Fidelity Android Device Frame
          </h3>
        </div>

        {/* Real Device Mockup Shape */}
        <div className="w-full max-w-[360px] aspect-[9/18.5] bg-black rounded-[52px] border-[10px] border-slate-800 dark:border-slate-900 shadow-2xl relative overflow-hidden flex flex-col p-3 select-none select-none ring-12 ring-slate-950/10">
          
          {/* Punch Hole Camera Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 rounded-full z-50 flex items-center justify-center border border-slate-900/40">
            <div className="w-1.5 h-1.5 bg-blue-900/60 rounded-full" />
          </div>

          {/* Android Screen Container */}
          <div className="w-full h-full bg-zinc-950 rounded-[42px] flex flex-col relative overflow-hidden text-white font-sans border border-slate-950">
            
            {/* Status Bar */}
            <div className="w-full h-7 px-6 bg-zinc-950 flex items-center justify-between text-[11px] font-bold text-zinc-300 z-40">
              <span>{deviceTime}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1 rounded-sm font-mono tracking-tighter">5G</span>
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Simulated Android App Header */}
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-550 to-indigo-650 flex items-center justify-center text-xs font-black">
                  V
                </div>
                <div>
                  <h4 className="text-[11.5px] font-black tracking-tight leading-none text-zinc-100">Veo Studio</h4>
                  <p className="text-[8.5px] text-zinc-400 font-semibold leading-none mt-0.5">Jetpack Compose Native</p>
                </div>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider font-mono">
                3.1 Fast
              </span>
            </div>

            {/* SCREEN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-zinc-950 relative">

              {/* DASHBOARD SCREEN */}
              {activeMobileScreen === "dashboard" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Hero banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-zinc-900 border border-indigo-900/30 text-left relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
                    <Sparkles className="w-5 h-5 text-indigo-400 mb-1.5" />
                    <h5 className="text-xs font-black text-zinc-100 uppercase tracking-wider">Fast Engine Online</h5>
                    <p className="text-[9.5px] text-zinc-400 leading-normal mt-1">
                      Render high-fidelity 60FPS physics videos directly in Android background threads.
                    </p>
                  </div>

                  {/* System states list */}
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1 font-mono">Native Modules</h6>
                    
                    <button 
                      onClick={() => setActiveMobileScreen("veo")}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-left transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Cpu className="w-4 h-4" /></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">Veo 3.1 Fast Studio</p>
                          <p className="text-[8.5px] text-zinc-400 font-medium">Text-to-Video Engine</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    <button 
                      onClick={() => setActiveMobileScreen("canvas")}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-left transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Layers className="w-4 h-4" /></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">Compose Canvas</p>
                          <p className="text-[8.5px] text-zinc-400 font-medium">Interactive Painter</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    <button 
                      onClick={() => setActiveMobileScreen("room")}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-left transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Database className="w-4 h-4" /></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">Room Database</p>
                          <p className="text-[8.5px] text-zinc-400 font-medium">Local persist SQL Dao</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    <button 
                      onClick={() => setActiveMobileScreen("workers")}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-left transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400"><Clock className="w-4 h-4" /></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">WorkManager Pools</p>
                          <p className="text-[8.5px] text-zinc-400 font-medium">Background Polling threads</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    <button 
                      onClick={() => setActiveMobileScreen("converter")}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-950/40 to-zinc-900 hover:from-violet-900/50 hover:to-zinc-850 border border-violet-900/40 text-left transition-all relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 text-[7px] bg-violet-600 text-white px-2 py-0.5 rounded-bl-lg font-black tracking-widest font-mono">APK BUILDER</div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400"><Smartphone className="w-4 h-4 animate-pulse" /></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                            Native App Converter
                          </p>
                          <p className="text-[8.5px] text-violet-300 font-medium">Compile web project to Android</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                    </button>
                  </div>

                  {/* Quick summary stats widget */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-zinc-400 font-mono uppercase tracking-wider">Device Live Logs</span>
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono">ONLINE</span>
                    </div>
                    <div className="space-y-1 font-mono text-[8px] text-zinc-400 divide-y divide-zinc-800/40">
                      <p className="py-1 flex items-center gap-1"><span className="h-1 w-1 bg-emerald-500 rounded-full inline-block" /> RoomDB: Connected successfully</p>
                      <p className="py-1 flex items-center gap-1"><span className="h-1 w-1 bg-indigo-500 rounded-full inline-block" /> Veo 3.1: Fast latency 0.14s latency</p>
                      <p className="py-1 flex items-center gap-1"><span className="h-1 w-1 bg-sky-500 rounded-full inline-block" /> Workers: 1 Job Running</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* COMPOSE CANVAS SCREEN */}
              {activeMobileScreen === "canvas" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 h-full flex flex-col text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-100">Compose Canvas Drawer</h5>
                      <p className="text-[8.5px] text-zinc-400">Low-level GPU Draw call simulation</p>
                    </div>
                    <button 
                      onClick={() => setCanvasViewMode(v => v === "render" ? "code" : "render")}
                      className="p-1 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      title="Toggle Source Code"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {canvasViewMode === "render" ? (
                    <>
                      {/* Canvas body */}
                      <div className="w-full aspect-square bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-800">
                        <canvas
                          ref={canvasRef}
                          width={280}
                          height={280}
                          className="w-full h-full cursor-crosshair touch-none"
                          onMouseDown={startPainting}
                          onMouseMove={paint}
                          onMouseUp={stopPainting}
                          onMouseLeave={stopPainting}
                          onTouchStart={startPainting}
                          onTouchMove={paint}
                          onTouchEnd={stopPainting}
                        />
                        <div className="absolute top-2 right-2 bg-zinc-950/70 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5 animate-pulse" />
                          <span>Compose Canvas Frame Rate: 60FPS</span>
                        </div>
                      </div>

                      {/* Tool selection bar */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-850">
                        <div className="flex gap-1.5">
                          {["#8B5CF6", "#10B981", "#EF4444", "#F59E0B"].map(c => (
                            <button
                              key={c}
                              onClick={() => setBrushColor(c)}
                              className={`w-4 h-4 rounded-full border transition-transform ${brushColor === c ? "scale-125 border-white" : "border-transparent"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" 
                            min="2" 
                            max="12" 
                            value={brushWidth} 
                            onChange={(e) => setBrushWidth(Number(e.target.value))}
                            className="w-16 accent-indigo-500"
                          />
                          <button onClick={clearCanvas} className="p-1 rounded text-zinc-400 hover:text-zinc-200 text-[9px] font-bold bg-zinc-800 hover:bg-zinc-750">
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Canvas stats */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono p-2 bg-zinc-900 rounded-lg border border-zinc-800/60">
                        <div>
                          <p className="text-zinc-500 uppercase">Draw Calls</p>
                          <p className="text-zinc-200 font-bold">{composeDrawCalls}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 uppercase">GPU Latency</p>
                          <p className="text-emerald-400 font-bold">{gpuLatency} ms</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-[8px] font-mono text-zinc-300 h-64 overflow-y-auto">
                      <p className="text-amber-400 font-bold mb-1">// Jetpack Compose Drawing</p>
                      <pre>{`@Composable
fun CanvasScreen() {
    val drawPaths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }
    
    Canvas(modifier = Modifier
        .fillMaxSize()
        .pointerInput(Unit) {
            detectDragGestures(
                onDragStart = { offset ->
                    currentPath = Path().apply { moveTo(offset.x, offset.y) }
                },
                onDrag = { change, dragAmount ->
                    currentPath?.lineTo(change.position.x, change.position.y)
                },
                onDragEnd = {
                    currentPath?.let { drawPaths.add(it) }
                    currentPath = null
                }
            )
        }
    ) {
        drawPaths.forEach { path ->
            drawPath(path, color = Color.Magenta, style = Stroke(width = 6f))
        }
    }
}`}</pre>
                    </div>
                  )}

                  <button 
                    onClick={() => setActiveMobileScreen("dashboard")}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 mt-2"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}

              {/* ROOM DATABASE SCREEN */}
              {activeMobileScreen === "room" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-100">SQLite Room Database</h5>
                      <p className="text-[8.5px] text-zinc-400">Live persistence with indexing & schemas</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setSelectedDbTab("data")}
                        className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${selectedDbTab === "data" ? "bg-indigo-600 text-white" : "bg-zinc-850 text-zinc-400"}`}
                      >
                        DATA
                      </button>
                      <button 
                        onClick={() => setSelectedDbTab("code")}
                        className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${selectedDbTab === "code" ? "bg-indigo-600 text-white" : "bg-zinc-850 text-zinc-400"}`}
                      >
                        DAO
                      </button>
                    </div>
                  </div>

                  {selectedDbTab === "data" ? (
                    <>
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search database entities..."
                          value={dbSearchQuery}
                          onChange={(e) => setDbSearchQuery(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-zinc-300 placeholder-zinc-500 focus:outline-none"
                        />
                      </div>

                      {/* Interactive entities list */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {roomEntities.filter(e => e.title.toLowerCase().includes(dbSearchQuery.toLowerCase()) || e.prompt.toLowerCase().includes(dbSearchQuery.toLowerCase())).map(entity => (
                          <div key={entity.id} className="p-2.5 rounded-xl bg-zinc-905 border border-zinc-850 flex items-start justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Database className="w-3 h-3 text-amber-500" />
                                <span className="text-[11px] font-bold text-zinc-200">{entity.title}</span>
                                <span className="text-[7.5px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded font-mono font-bold uppercase">{entity.engine}</span>
                              </div>
                              <p className="text-[9px] text-zinc-450 leading-tight italic">"{entity.prompt}"</p>
                              <span className="text-[7.5px] text-zinc-500 block font-mono">{entity.timestamp}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteEntity(entity.id)}
                              className="p-1 rounded-md text-zinc-650 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Entity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Entry Form inside Room Screen */}
                      <form onSubmit={handleAddEntity} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                        <p className="text-[8.5px] font-black text-zinc-400 uppercase tracking-widest font-mono">Insert DB Entity</p>
                        <input
                          type="text"
                          placeholder="Entity Title"
                          value={newEntityTitle}
                          onChange={(e) => setNewEntityTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1 text-[9.5px] text-zinc-300"
                        />
                        <input
                          type="text"
                          placeholder="Generative Prompt"
                          value={newEntityPrompt}
                          onChange={(e) => setNewEntityPrompt(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1 text-[9.5px] text-zinc-300"
                        />
                        <div className="flex items-center justify-between gap-1.5">
                          <select
                            value={newEntityEngine}
                            onChange={(e) => setNewEntityEngine(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 text-[9.5px] rounded-lg px-1.5 py-1 text-zinc-300 focus:outline-none"
                          >
                            <option>Veo 3.1 Fast</option>
                            <option>Veo 3.1 Pro</option>
                            <option>Flow Core</option>
                          </select>
                          <button type="submit" className="px-3 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[9.5px] font-black inline-flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Insert
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-[7.5px] font-mono text-zinc-300 h-64 overflow-y-auto leading-relaxed">
                      <p className="text-emerald-400 font-bold mb-1">// Android Room Entity Definition</p>
                      <pre>{`@Entity(tableName = "veo_clips")
data class VeoClipEntity(
    @PrimaryKey val id: String,
    val title: String,
    val prompt: String,
    val engineName: String,
    val timestamp: Long
)

@Dao
interface VeoClipDao {
    @Query("SELECT * FROM veo_clips ORDER BY timestamp DESC")
    fun getAllClips(): Flow<List<VeoClipEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClip(clip: VeoClipEntity)

    @Delete
    suspend fun deleteClip(clip: VeoClipEntity)
}`}</pre>
                    </div>
                  )}

                  <button 
                    onClick={() => setActiveMobileScreen("dashboard")}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 mt-2"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}

              {/* BACKGROUND WORKERS SCREEN */}
              {activeMobileScreen === "workers" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-100">WorkManager Pools</h5>
                      <p className="text-[8.5px] text-zinc-400">Background task daemon scheduler</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newJob: BackgroundTask = {
                          id: `WORK_${Math.floor(Math.random() * 900) + 100}`,
                          name: `Veo Render ID-${Math.floor(Math.random() * 90) + 10}`,
                          status: "RUNNING",
                          progress: 0,
                          logs: [
                            "WorkManager: Scheduled high latency thread",
                            "Resource Manager: Allocating Cloud TPU slots",
                            "Running fast latent interpolations..."
                          ]
                        };
                        setWorkers(w => [newJob, ...w]);
                      }}
                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[8.5px] font-black uppercase tracking-wider px-2"
                    >
                      Spawn Job
                    </button>
                  </div>

                  {/* Workers task logs */}
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {workers.map(worker => (
                      <div key={worker.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            <span className="text-[10px] font-black text-zinc-200">{worker.name}</span>
                          </div>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            worker.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                          }`}>{worker.status}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px] text-zinc-500 font-mono">
                            <span>Progress Index:</span>
                            <span>{worker.progress}%</span>
                          </div>
                          <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300" style={{ width: `${worker.progress}%` }} />
                          </div>
                        </div>

                        {/* Expandable Mini Log console inside device */}
                        <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 max-h-20 overflow-y-auto text-[7px] font-mono text-zinc-400 space-y-0.5 select-text">
                          {worker.logs.map((log, idx) => (
                            <p key={idx} className="truncate">📎 {log}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveMobileScreen("dashboard")}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 mt-2"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}

              {/* VEO 3.1 FAST STUDIO SCREEN */}
              {activeMobileScreen === "veo" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-left">
                  <div>
                    <h5 className="text-xs font-extrabold text-zinc-100">Veo 3.1 Fast AI Studio</h5>
                    <p className="text-[8.5px] text-zinc-400">High-fidelity text-to-video processor</p>
                  </div>

                  {/* Input form */}
                  <div className="space-y-2">
                    <label className="text-[8.5px] font-black text-zinc-400 font-mono uppercase tracking-widest">Generative Prompt</label>
                    <textarea
                      value={veoPrompt}
                      onChange={(e) => setVeoPrompt(e.target.value)}
                      placeholder="Specify your motion scene..."
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[10px] text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-850">
                      <p className="text-[7.5px] font-black text-zinc-500 uppercase">Framerate Target</p>
                      <div className="flex gap-1.5 mt-1">
                        {["30", "60"].map(fps => (
                          <button
                            key={fps}
                            onClick={() => setVeoFramerate(fps as any)}
                            className={`flex-1 text-center py-0.5 rounded font-mono font-bold ${veoFramerate === fps ? "bg-indigo-600 text-white" : "bg-zinc-950 text-zinc-400"}`}
                          >
                            {fps}FPS
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-850">
                      <p className="text-[7.5px] font-black text-zinc-500 uppercase">Camera Path</p>
                      <select
                        value={veoCameraMovement}
                        onChange={(e) => setVeoCameraMovement(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-0.5 text-zinc-300 focus:outline-none mt-1"
                      >
                        <option value="auto">Auto Orbit</option>
                        <option value="pan-right">Pan Right</option>
                        <option value="zoom-in">Zoom In</option>
                        <option value="tilt-up">Tilt Up</option>
                      </select>
                    </div>
                  </div>

                  {/* Action trigger button */}
                  <button
                    onClick={triggerVeoGeneration}
                    disabled={veoIsGenerating}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border ${
                      veoIsGenerating
                        ? "bg-zinc-900 border-zinc-800 text-zinc-500"
                        : "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white hover:brightness-110 shadow-lg border-indigo-500/20 shadow-indigo-950/40"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {veoIsGenerating ? `GENERATING ${veoProgress}%...` : "LAUNCH VEO ENGINE"}
                  </button>

                  {/* Generation Output screen inside device */}
                  {veoIsGenerating && (
                    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3.5 space-y-2.5 animate-pulse">
                      <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
                        <span>TPU Rendering status:</span>
                        <span>{veoProgress}%</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${veoProgress}%` }} />
                      </div>
                      <div className="bg-black/40 p-2 rounded border border-zinc-900 font-mono text-[7px] text-zinc-400 space-y-0.5 max-h-24 overflow-y-auto leading-relaxed select-text">
                        {veoLogs.map((log, idx) => (
                          <p key={idx}>{log}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video completed result view inside phone */}
                  {veoVideoResult && (
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 space-y-2 text-center animate-fade-in">
                      <p className="text-[10px] font-black text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VIDEO RENDER SUCCESS (60FPS)
                      </p>
                      
                      {/* Generative abstract color gradient representation representing motion clip */}
                      <div className="w-full h-24 rounded-lg bg-gradient-to-tr from-purple-950 via-zinc-900 to-emerald-950 relative overflow-hidden flex items-center justify-center border border-zinc-800">
                        {/* Animated overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-emerald-500/15 to-indigo-500/10 animate-pulse" />
                        <span className="text-[8.5px] font-mono font-bold text-zinc-400 z-10 px-4 text-center">
                          "{veoPrompt.substring(0, 45)}..."
                        </span>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveMobileScreen("room");
                        }}
                        className="text-[9px] text-indigo-400 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        Inspect database rows stored in SQLite <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setActiveMobileScreen("dashboard")}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 mt-1"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}

              {/* CONVERTER SCREEN */}
              {activeMobileScreen === "converter" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5 text-left h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="p-1 bg-violet-500/10 text-violet-400 rounded-lg"><Smartphone className="w-4 h-4" /></span>
                      <div>
                        <h5 className="text-xs font-black text-zinc-150">Native App Compiler</h5>
                        <p className="text-[8px] text-zinc-400 font-medium">Build standalone .APK package</p>
                      </div>
                    </div>

                    {!isConverting && !compiledSuccess ? (
                      <div className="space-y-3 text-[10px]">
                        <p className="text-[9px] text-zinc-400 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                          Convert any web design module into an offline-first high-performance native Android App using Compose & Room DB.
                        </p>

                        {/* Select module */}
                        <div className="space-y-1">
                          <label className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Convert Module</label>
                          <select 
                            value={converterModule} 
                            onChange={(e) => setConverterModule(e.target.value as any)}
                            className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none"
                          >
                            <option value="full">Full Multi-Module Bundle (.APK)</option>
                            <option value="quote">Quote Designer (Compose Cards)</option>
                            <option value="qr">QR Matrix Generator (Room DB cache)</option>
                            <option value="palette">Spectrum Extractor (Compose Theme)</option>
                          </select>
                        </div>

                        {/* Sdk & optimizing */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Target SDK</label>
                            <select 
                              value={converterSdk} 
                              onChange={(e) => setConverterSdk(e.target.value as any)}
                              className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-1 text-zinc-200 focus:outline-none"
                            >
                              <option value="35">SDK 35 (Android 15)</option>
                              <option value="34">SDK 34 (Android 14)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Accent Theme</label>
                            <div className="flex gap-1.5 mt-1">
                              {["#8B5CF6", "#10B981", "#F59E0B", "#F43F5E"].map(c => (
                                <button
                                  key={c}
                                  onClick={() => setConverterTheme(c)}
                                  className={`w-4 h-4 rounded-full border transition-all ${converterTheme === c ? "scale-125 border-white ring-1 ring-zinc-500" : "border-transparent"}`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={startCompilation}
                          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white rounded-xl font-bold font-mono text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 border border-violet-500/30"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Compile Applet APK
                        </button>
                      </div>
                    ) : isConverting ? (
                      <div className="space-y-3">
                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 space-y-2">
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                            <span>Gradle Build Progress:</span>
                            <span>{converterProgress}%</span>
                          </div>
                          <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${converterProgress}%` }} />
                          </div>
                        </div>

                        {/* Logs container */}
                        <div className="bg-black/85 rounded-xl p-3 border border-zinc-900 font-mono text-[7.5px] text-zinc-400 space-y-1 h-44 overflow-y-auto leading-relaxed select-text">
                          {converterLogs.map((log, idx) => (
                            <p key={idx} className={log.startsWith("[SUCCESS]") ? "text-emerald-400 font-bold" : log.startsWith("[KTS]") ? "text-indigo-400" : ""}>{log}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <div className="p-3 bg-zinc-900 border border-zinc-805 rounded-xl space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                          <h6 className="text-xs font-black text-zinc-100 uppercase tracking-widest">COMPILE SUCCESSFUL</h6>
                          <p className="text-[8.5px] text-zinc-400 leading-normal max-w-xs mx-auto">
                            The native Android application has been assembled, optimized with R8 Proguard, and cryptographically signed.
                          </p>
                        </div>

                        {/* Interactive scan QR simulation */}
                        <div className="p-2.5 bg-white rounded-xl w-24 h-24 mx-auto flex items-center justify-center border border-zinc-800">
                          {/* Simulated elegant matrix vector qr */}
                          <div className="w-full h-full bg-slate-900 rounded flex items-center justify-center text-[7px] text-zinc-400 font-mono text-center p-1.5 leading-tight">
                            QR Matrix Code Assembled
                          </div>
                        </div>
                        <p className="text-[7.5px] text-zinc-500 max-w-[150px] mx-auto leading-relaxed">
                          Scan the APK download link to install directly on physical devices or sideload to developer SDK Emulators.
                        </p>

                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => {
                              setCompiledSuccess(false);
                              setIsConverting(false);
                            }}
                            className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 text-[9px] hover:bg-zinc-800 font-bold text-zinc-300 rounded-lg"
                          >
                            Rebuild
                          </button>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); alert("Offline simulation download triggered: Android Kotlin project zip file generated in developer cache directory."); }}
                            className="px-3 py-1.5 bg-violet-600 border border-violet-500 text-[9px] hover:brightness-110 font-bold text-white rounded-lg flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Get Code Bundle
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setActiveMobileScreen("dashboard")}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 mt-2"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}

            </div>

            {/* Android Navigation Gestures/Buttons Bar */}
            <div className="h-10 px-12 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-zinc-500 z-40">
              <button 
                onClick={() => {
                  if (activeMobileScreen !== "dashboard") {
                    setActiveMobileScreen("dashboard");
                  }
                }}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
                title="Android Back Button"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => setActiveMobileScreen("dashboard")}
                className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 hover:border-zinc-300 transition-colors cursor-pointer"
                title="Android Home Button"
              />
              <button 
                className="w-3 h-3 border-2 border-zinc-500 rounded-sm hover:border-zinc-300 transition-colors cursor-pointer"
                title="Android Recents Button"
              />
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Full-fidelity Native Studio Dashboard Workspace */}
      <div className="flex-1 space-y-6 w-full text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-500 shrink-0" />
            Android Native Studio Workspace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            A high-fidelity platform simulation demonstrating standard native integration of <strong className="text-slate-800 dark:text-slate-100">Google Veo 3.1 Fast Engine</strong>, local persist SQLite schemas via <strong className="text-slate-800 dark:text-slate-100">Room DB</strong>, low-overhead WorkManager pooling, and <strong className="text-slate-800 dark:text-slate-100">Jetpack Compose Canvas</strong> GPU rendering metrics.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Veo 3.1 Fast Engine Module */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/30 dark:border-indigo-900/30">
                  <Cpu className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-indigo-605 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                  VEO FAST 3.1
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans">
                Veo 3.1 Latent Space Video Compiler
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Executes cinematic video compiles under a custom speed intensity logic on Google Cloud TPU nodes. Generates true physics fluid dynamics at 60 frames per second.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button 
                onClick={() => setActiveMobileScreen("veo")}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Launch Veo Controls in emulator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Jetpack Compose Canvas Module */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-150/30 dark:border-emerald-900/30">
                  <Layers className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-emerald-605 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                  COMPOSE GPU
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans">
                Jetpack Compose Native Canvas
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Enables hardware-accelerated drawing logic using a Kotlin-like Compose graphics path engine. Tracks latency offsets in real time, delivering sub-4ms canvas rendering speeds.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button 
                onClick={() => setActiveMobileScreen("canvas")}
                className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Paint on native Compose canvas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Room Database SQLite Persistence */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-150/30 dark:border-amber-900/30">
                  <Database className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-amber-605 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                  ROOM DAO
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans">
                Room SQLite SQLite DAO Persistence
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Guarantees zero-data-loss durable persistence of generated clips metadata inside offline-first SQLite files. Leverages reactive Kotlin Coroutine flows to broadcast changes instantly.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button 
                onClick={() => setActiveMobileScreen("room")}
                className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Inspect persisted SQLite rows <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* WorkManager Thread Manager */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-150/30 dark:border-sky-900/30">
                  <Clock className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-sky-605 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                  WORKMANAGER
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans">
                WorkManager Background Worker Daemons
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Arranges complex backoff policies for thread-safe operations, caching pipelines, and AdSense telemetry dispatch loops. Fully independent of active UI cycles.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button 
                onClick={() => setActiveMobileScreen("workers")}
                className="text-xs font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                View running scheduler daemons <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic educational tabs showcasing the clean Android architectural layout */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-850 dark:text-zinc-100 uppercase tracking-wider font-sans">
              Android Studio Configuration Reference
            </h4>
            <span className="text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
              BUILD.GRADLE.KTS
            </span>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            This module represents a highly optimized combination of modern Android Jetpack Compose components. Below are the key native imports configured inside the Gradle compiler for this high-fidelity deployment:
          </p>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 text-xs font-mono text-slate-600 dark:text-zinc-300 leading-relaxed space-y-1 overflow-x-auto select-text">
            <p className="text-indigo-500 font-bold">// Jetpack Compose Drawing & Canvas</p>
            <p className="pl-4">implementation("androidx.compose.ui:ui-graphics:1.6.0")</p>
            <p className="pl-4">implementation("androidx.compose.foundation:foundation:1.6.0")</p>
            <p className="text-indigo-500 font-bold mt-2">// Room SQLite Persistent Database Engine</p>
            <p className="pl-4">implementation("androidx.room:room-runtime:2.6.1")</p>
            <p className="pl-4">implementation("androidx.room:room-ktx:2.6.1")</p>
            <p className="text-indigo-500 font-bold mt-2">// Google WorkManager Asynchronous Threading</p>
            <p className="pl-4">implementation("androidx.work:work-runtime-ktx:2.9.0")</p>
            <p className="text-indigo-500 font-bold mt-2">// Google Veo v3.1 Generative Fast-Denoising SDK</p>
            <p className="pl-4">implementation("com.google.ai.client.generative:veo-fastengine:3.1.0-alpha")</p>
          </div>
        </div>

      </div>
    </div>
  );
}
