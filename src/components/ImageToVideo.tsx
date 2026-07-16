import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  Upload,
  Sparkles,
  Download,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  History,
  Image as ImageIcon,
  Clock,
  HelpCircle,
  FolderMinus,
  Sliders,
  Sparkle
} from "lucide-react";

interface ImageToVideoProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive?: () => void;
  onLogin?: () => Promise<void>;
}

interface VideoCreation {
  id: string;
  userId?: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string; // Local Object URL (temporary) or streaming URL
  operationName?: string; // Saved to fetch/download again on demand
  createdAt: number;
  aspectRatio: string;
  resolution: string;
  duration?: number;
  videoStyle?: string;
}

const PRESET_PROMPTS = [
  "A majestic dragon soaring through dark thunderclouds, glowing orange lava breathing from its mouth, dynamic slow-motion camera orbit, atmospheric cinematic lighting.",
  "An ancient mystical library with floating books, swirling cosmic stardust through stained glass windows, slow camera pedestal pan showing floating runes.",
  "Extreme close up of a futuristic cyberpunk helmet reflecting neon Tokyo streetlights, rain droplets sliding down the visor, cinematic focus pull.",
  "A majestic golden retriever running through a vast field of yellow sunflowers under beautiful warm golden hour sunset, soft slow-motion, highly detailed fur.",
  "Surreal cosmic hourglass resting on white sand, galaxies swirling inside the glass bulbs, star particles falling slowly, slow zoom-out camera shot."
];

interface GalleryCardProps {
  key?: React.Key;
  item: VideoCreation;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onSelectToPreview: () => void;
  onReEdit: () => void;
  user: User | null;
  onUpdateCreation: (updated: VideoCreation) => void;
}

function GalleryCard({
  item,
  isSelected,
  onToggleSelect,
  onSelectToPreview,
  onReEdit,
  user,
  onUpdateCreation
}: GalleryCardProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(
    item.videoUrl && item.videoUrl.startsWith("blob:") ? item.videoUrl : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardVideoRef = useRef<HTMLVideoElement | null>(null);

  // Automatically try to load if the URL is already present and valid
  useEffect(() => {
    if (item.videoUrl && item.videoUrl.startsWith("blob:")) {
      setVideoSrc(item.videoUrl);
    }
  }, [item.videoUrl]);

  const loadVideoSource = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoSrc) return;
    if (!item.operationName) {
      setError("No operation ID reference found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const downloadRes = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName: item.operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("Source expired or unavailable.");
      }

      const videoBlob = await downloadRes.blob();
      const objectUrl = URL.createObjectURL(videoBlob);
      setVideoSrc(objectUrl);
      
      // Save it back to parent
      onUpdateCreation({
        ...item,
        videoUrl: objectUrl
      });
    } catch (err: any) {
      console.warn("Failed to retrieve video bytes:", err);
      setError("Click to retry loading video");
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading on hover for an ultra-slick, zero-friction feel!
  const handleMouseEnter = () => {
    if (!videoSrc && !loading && !error) {
      loadVideoSource();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={onSelectToPreview}
      className={`group relative flex flex-col bg-slate-950 border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/[0.02] ${
        isSelected ? "border-indigo-500 bg-indigo-500/[0.01]" : "border-slate-800"
      }`}
    >
      {/* Selector checkbox */}
      <div
        onClick={onToggleSelect}
        className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
          isSelected
            ? "bg-indigo-600 border-indigo-500 text-white"
            : "bg-slate-900/80 border-slate-700 text-transparent hover:border-slate-500"
        }`}
      >
        <Check className="w-3.5 h-3.5" />
      </div>

      {/* Visual Thumbnail / Looping Video Frame */}
      <div className="relative aspect-video bg-slate-900 border-b border-slate-800 overflow-hidden flex items-center justify-center">
        {videoSrc ? (
          <video
            ref={cardVideoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          />
        ) : item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt="Thumbnail"
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Video className="w-8 h-8 text-slate-600 animate-pulse" />
        )}

        {/* Dynamic State Overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-center justify-center z-10">
          {!videoSrc && (
            <div className="flex flex-col items-center gap-2">
              {loading ? (
                <div className="p-3 rounded-full bg-indigo-600/80 text-white border border-indigo-500/50 shadow-xl animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : error ? (
                <button
                  onClick={loadVideoSource}
                  className="px-3 py-1.5 bg-rose-600/80 text-white text-[10px] font-semibold rounded-full border border-rose-500/40 shadow-xl transition-all hover:bg-rose-500"
                >
                  Load Error. Retry?
                </button>
              ) : (
                <button
                  onClick={loadVideoSource}
                  className="p-3 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-white border border-slate-700/50 transform scale-90 group-hover:scale-100 transition-all shadow-xl flex items-center justify-center"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
              )}
              {!loading && !error && (
                <span className="text-[10px] text-slate-400 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800/80 backdrop-blur-sm">
                  Hover to preview
                </span>
              )}
            </div>
          )}

          {videoSrc && (
            <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono py-0.5 px-2 rounded-full backdrop-blur-sm uppercase tracking-wider flex items-center gap-1 z-25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live loop
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 py-1 px-2 rounded-md bg-slate-950/90 border border-slate-800 font-mono text-[9px] text-slate-400 z-10">
          {item.aspectRatio} • {item.resolution}
        </div>
      </div>

      {/* Info details */}
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {item.prompt}
        </p>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReEdit();
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-indigo-600/20 hover:text-indigo-300 rounded text-slate-400 border border-slate-800/80 transition-all"
            >
              Re-edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageToVideo({ user, accessToken, onRefreshDrive, onLogin }: ImageToVideoProps) {
  // General Creator States
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null); // Base64 data URL
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [loopVideo, setLoopVideo] = useState(false);
  const [videoStyle, setVideoStyle] = useState("Cinematic");

  // Status/Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Output/Preview States
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentOperationName, setCurrentOperationName] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Gallery/History States
  const [creations, setCreations] = useState<VideoCreation[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedCreations, setSelectedCreations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRatio, setFilterRatio] = useState("all");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean error messaging utility
  const cleanErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred during generation.";
    const rawMessage = typeof error === "string" ? error : error.message || JSON.stringify(error);
    if (rawMessage.includes("GEMINI_API_KEY")) {
      return "The Gemini API Key is missing. Please configure it in your Secrets or Settings menu.";
    }
    if (rawMessage.includes("rate limit") || rawMessage.includes("429")) {
      return "Rate limit exceeded. Please wait a moment before trying again.";
    }
    return rawMessage;
  };

  // Sync History from Firestore or LocalStorage
  useEffect(() => {
    if (user) {
      // Setup real-time sync with Firebase Firestore for this user
      const q = query(
        collection(db, "video_creations"),
        where("userId", "==", user.uid)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: VideoCreation[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as VideoCreation);
          });
          // Sort creations newest first
          list.sort((a, b) => b.createdAt - a.createdAt);
          setCreations(list);
        },
        (err) => {
          console.error("Firestore sync error:", err);
        }
      );
      return () => unsubscribe();
    } else {
      // Fallback to LocalStorage for anonymous/local use
      const stored = localStorage.getItem("local_video_creations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as VideoCreation[];
          parsed.sort((a, b) => b.createdAt - a.createdAt);
          setCreations(parsed);
        } catch (e) {
          console.error("Failed to parse local history:", e);
        }
      }
    }
  }, [user]);

  // Save history helper (for localStorage fallback updates)
  const saveLocalHistory = (updated: VideoCreation[]) => {
    localStorage.setItem("local_video_creations", JSON.stringify(updated));
    setCreations([...updated].sort((a, b) => b.createdAt - a.createdAt));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processImageFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerSurprisePrompt = () => {
    const randomIndex = Math.floor(Math.random() * PRESET_PROMPTS.length);
    setPrompt(PRESET_PROMPTS[randomIndex]);
  };

  // Video generator API caller & status poller
  const handleGenerateVideo = async () => {
    if (!prompt.trim() && !image) {
      setErrorMsg("Please provide at least a seed image or write a scene prompt description.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationProgress(5);
    setGenerationStep("Analyzing inputs and building motion vectors...");

    try {
      // 1. Start generation on the backend
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: image, // Base64 data URL
          motion_bucket_id: 140, // Enhanced motion as requested
          modelChoice: "veo-3.1-lite-generate-preview", // Veo Lite for preview
          aspectRatio,
          videoQuality: "performance",
          resolution,
          videoStyle
        })
      });

      if (!response.ok) {
        let errMsg = `Failed to initiate video generation (HTTP ${response.status} ${response.statusText})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errMsg = errorData.error;
          }
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText && rawText.length < 200) {
              errMsg += `: ${rawText}`;
            }
          } catch (_) {}
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const operationName = data.operationName;
      setCurrentOperationName(operationName);

      setGenerationProgress(25);
      setGenerationStep("Spawning Google Veo neural network...");

      // 2. Poll video status until done
      let done = false;
      let pollCount = 0;
      const maxPolls = 75; // Up to 5 minutes
      let operationResult = null;

      while (!done && pollCount < maxPolls) {
        pollCount++;
        // Delay 4 seconds before polling status
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const statusRes = await fetch("/api/video/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName })
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.error) {
            throw new Error(statusData.error.message || "Veo model execution error.");
          }
          done = statusData.done;
          if (done) {
            operationResult = statusData.response;
            break;
          } else {
            const calculatedProgress = Math.min(92, 25 + Math.round((pollCount / maxPolls) * 65));
            setGenerationProgress(calculatedProgress);
            setGenerationStep(`Rendering high-motion frames... ${pollCount * 4}s elapsed (${calculatedProgress}% finished)`);
          }
        } else {
          console.warn("Polling status failed, retrying in next iteration...");
        }
      }

      if (!done || !operationResult) {
        throw new Error("Generation timed out. The model is taking too long to reply. Please try again.");
      }

      setGenerationProgress(92);
      setGenerationStep("Video generated! Recompiling & streaming binary payload...");

      // 3. Download the final generated video file from the server
      const downloadRes = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("Failed to retrieve generated video stream from the server.");
      }

      const videoBlob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      setCurrentVideoUrl(videoUrl);
      setGenerationProgress(100);
      setGenerationStep("Video ready!");

      // 4. Save video to user's history
      const newCreation: VideoCreation = {
        id: `creation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user?.uid || undefined,
        prompt: prompt.trim() || "Generated high motion scene",
        imageUrl: image || undefined,
        videoUrl: videoUrl, // Current session Object URL
        operationName: operationName,
        createdAt: Date.now(),
        aspectRatio,
        resolution,
        videoStyle
      };

      if (user) {
        // Save to Firestore
        await setDoc(doc(db, "video_creations", newCreation.id), newCreation);
      } else {
        // Save to LocalStorage
        const updatedLocal = [newCreation, ...creations];
        saveLocalHistory(updatedLocal);
      }

      // Auto play video when completed
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((e) => console.log("Auto-play blocked:", e));
          setVideoPlaying(true);
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-download and play historical creation
  const handleReplayCreation = async (item: VideoCreation) => {
    setErrorMsg(null);
    setCurrentVideoUrl(null);
    setCurrentOperationName(item.operationName || null);

    // If we already have a functional object URL, try playing it
    if (item.videoUrl && item.videoUrl.startsWith("blob:")) {
      setCurrentVideoUrl(item.videoUrl);
      setShowGallery(false);
      return;
    }

    if (!item.operationName) {
      setErrorMsg("This history item does not have a reference operation to fetch. Please generate a new video.");
      setShowGallery(false);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(40);
    setGenerationStep("Fetching video stream from servers...");

    try {
      const downloadRes = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName: item.operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("Unable to fetch video source. The cache might have expired. Please try generating again.");
      }

      const videoBlob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setCurrentVideoUrl(videoUrl);

      // Update the URL in memory
      const updatedList = creations.map((c) => {
        if (c.id === item.id) {
          return { ...c, videoUrl };
        }
        return c;
      });

      if (user) {
        await setDoc(doc(db, "video_creations", item.id), { ...item, videoUrl });
      } else {
        saveLocalHistory(updatedList);
      }

      setShowGallery(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          setVideoPlaying(true);
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download video file directly to user device
  const handleDownloadVideo = () => {
    if (!currentVideoUrl) return;
    const a = document.createElement("a");
    a.href = currentVideoUrl;
    a.download = `Veo_Video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Gallery multi-selection & deletion functions
  const toggleSelectCreation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCreations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleCreations = getFilteredCreations();
    const visibleIds = visibleCreations.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedCreations.includes(id));

    if (allSelected) {
      setSelectedCreations((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCreations((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCreations.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedCreations.length} selected video creations?`)) {
      return;
    }

    try {
      if (user) {
        // Delete from Firestore
        for (const id of selectedCreations) {
          await deleteDoc(doc(db, "video_creations", id));
        }
      } else {
        // Delete from LocalStorage
        const remaining = creations.filter((c) => !selectedCreations.includes(c.id));
        saveLocalHistory(remaining);
      }
      setSelectedCreations([]);
    } catch (err) {
      console.error("Deletion failed:", err);
      setErrorMsg("Failed to delete selected creations from your history library.");
    }
  };

  // Search & filter creations
  const getFilteredCreations = () => {
    return creations.filter((c) => {
      const matchesSearch = c.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterRatio === "all" || c.aspectRatio === filterRatio;
      return matchesSearch && matchesFilter;
    });
  };

  // Video controls
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setVideoPlaying(!videoPlaying);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoMuted;
    setVideoMuted(!videoMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleReEdit = (item: VideoCreation) => {
    setPrompt(item.prompt);
    if (item.imageUrl) {
      setImage(item.imageUrl);
    } else {
      setImage(null);
    }
    setAspectRatio(item.aspectRatio);
    setResolution(item.resolution);
    if (item.videoStyle) {
      setVideoStyle(item.videoStyle);
    }
    setShowGallery(false);
  };

  return (
    <div id="image-to-video-container" className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      
      {/* SIDEBAR: Configuration Panel & Utilities */}
      <aside id="video-creator-sidebar" className="w-full lg:w-80 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight text-white">Veo Studio</h2>
            <p className="text-xs text-slate-400">Google Veo Engine v3.1</p>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Aspect Ratio Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Aspect Ratio
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAspectRatio("16:9")}
              className={`py-2 px-3 text-sm rounded-lg border transition-all flex flex-col items-center gap-1 ${
                aspectRatio === "16:9"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="w-6 h-3.5 border border-current rounded-sm block opacity-70"></span>
              16:9 Landscape
            </button>
            <button
              onClick={() => setAspectRatio("9:16")}
              className={`py-2 px-3 text-sm rounded-lg border transition-all flex flex-col items-center gap-1 ${
                aspectRatio === "9:16"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="w-3.5 h-6 border border-current rounded-sm block opacity-70"></span>
              9:16 Portrait
            </button>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">Resolution</label>
          <div className="grid grid-cols-2 gap-2">
            {["720p", "1080p"].map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`py-2 px-3 text-xs font-mono rounded-lg border transition-all ${
                  resolution === res
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {res === "720p" ? "720p (Fast)" : "1080p (HQ)"}
              </button>
            ))}
          </div>
        </div>

        {/* Video Style Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-indigo-400" />
            Video Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["Cinematic", "Cartoon", "Realistic", "Sketch"].map((style) => (
              <button
                key={style}
                onClick={() => setVideoStyle(style)}
                className={`py-2 px-3 text-xs rounded-lg border transition-all font-medium ${
                  videoStyle === style
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Motion Level Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-300">
            <span>Motion Bucket ID</span>
            <span className="text-indigo-400 font-mono text-xs">140 (Standard Peak)</span>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Using Google's optimal motion vector coordinates for ultra-realistic kinetic physics and dramatic cinematic camera movements.
          </p>
        </div>

        {/* Loop setting */}
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all select-none">
          <input
            type="checkbox"
            checked={loopVideo}
            onChange={(e) => setLoopVideo(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-950 rounded focus:ring-indigo-500"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-300">Infinite Loop Video</span>
            <span className="text-xs text-slate-500">Perfectly aligns start and end frames</span>
          </div>
        </label>

        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => setShowGallery(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all text-sm font-medium"
          >
            <History className="w-4 h-4 text-indigo-400" />
            Studio Video Library ({creations.length})
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER: Actual Video Creator Interface */}
      <main id="video-creator-main-area" className="flex-1 p-6 lg:p-10 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Video Creator
              <span className="text-xs font-mono font-normal bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 py-1 px-2.5 rounded-full">
                Real Veo Motion
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Transform static images into highly active, movie-grade animated clips with Google Veo.
            </p>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Generation Issue: </span>
              {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Forms (Upload & Prompt) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Image Upload Box */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300 flex justify-between items-center">
                <span>Seed Image (Starting Frame)</span>
                <span className="text-xs text-slate-500">Optional but recommended</span>
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer min-h-[220px] bg-slate-950 select-none ${
                  image
                    ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                    : isDragging
                    ? "border-indigo-500 bg-indigo-500/[0.02] scale-[1.01]"
                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                {image ? (
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-800">
                      <img
                        src={image}
                        alt="Seed Preview"
                        className="w-full h-full object-contain bg-slate-900"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-5 right-5 p-2 rounded-full bg-slate-950/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all shadow-lg"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-900 rounded-full text-slate-400 border border-slate-800">
                      <Upload className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-200">Drag & Drop Seed Image here</p>
                      <p className="text-xs text-slate-500 mt-1">or click to browse your computer</p>
                    </div>
                    <div className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800/60 font-mono">
                      PNG, JPG, WEBP • Max 15MB
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300">Cinematic Motion Prompt</label>
                <button
                  type="button"
                  onClick={triggerSurprisePrompt}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Surprise Me
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the desired camera panning, lighting, and subject motion in detail (e.g., A slow zoom into the glowing eyes of a wolf in a dark, snowy pine forest...)"
                  className="w-full min-h-[140px] bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                  maxLength={500}
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                  {prompt.length}/500
                </span>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating || (!prompt.trim() && !image)}
              className="w-full relative group overflow-hidden py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-55 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-xl hover:shadow-indigo-500/10 flex items-center justify-center gap-2"
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="generating-spinner"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating Video...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="generate-normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkle className="w-5 h-5 text-yellow-300" />
                    <span>Generate Motion Video</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Subtle shining border light decoration */}
              <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none group-hover:border-white/20 transition-all"></div>
            </button>
          </div>

          {/* RIGHT COLUMN: Video Preview / Display Screen */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <label className="text-sm font-semibold text-slate-300">Studio Master Preview</label>
            
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-center items-center shadow-2xl">
              
              {/* Case 1: Active Generation State with detailed progress logger */}
              {isGenerating ? (
                <div className="p-8 flex flex-col items-center justify-center gap-5 w-full max-w-md text-center">
                  <div className="relative flex items-center justify-center">
                    {/* Ring Loader */}
                    <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute w-20 h-20 border-4 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
                    <Video className="absolute w-7 h-7 text-indigo-400" />
                  </div>

                  <div className="flex flex-col gap-1 w-full mt-2">
                    <h3 className="font-bold text-slate-200 tracking-tight text-base">Creating Cinematic Magic</h3>
                    <p className="text-xs text-indigo-400 font-mono tracking-tight animate-pulse min-h-[32px] px-4">
                      {generationStep}
                    </p>
                  </div>

                  {/* Horizontal visual indicator bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 p-[1px]">
                    <motion.div
                      className="bg-indigo-500 h-full rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  </div>
                  
                  <span className="text-[10px] text-slate-500 font-mono">
                    Elapsed time is relative to model load. Do not close this tab.
                  </span>
                </div>
              ) : currentVideoUrl ? (
                /* Case 2: Render interactive custom visual video frame */
                <div className="relative w-full h-full flex items-center justify-center bg-black group/video">
                  <video
                    ref={videoRef}
                    src={currentVideoUrl}
                    loop={loopVideo}
                    muted={videoMuted}
                    onClick={handleTogglePlay}
                    className="w-full h-full object-contain cursor-pointer"
                  />

                  {/* HTML Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 group-hover/video:opacity-100 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleTogglePlay}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                      >
                        {videoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      <button
                        onClick={handleToggleMute}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                      >
                        {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-black/60 text-slate-300 py-1 px-2.5 rounded-full border border-slate-800">
                        {aspectRatio} • MP4
                      </span>
                      <button
                        onClick={handleFullscreen}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 3: Empty state placeholder */
                <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
                  <div className="p-5 bg-slate-900 rounded-full border border-slate-800/80 text-slate-500">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">No Video Generated Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Provide a seed image or write a motion prompt on the left, then click generate to compile your masterpiece.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* DOWNLOAD BUTTON: Active only when video generated */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Veo Lite processes in ~30s
              </span>
              
              <button
                disabled={!currentVideoUrl}
                onClick={handleDownloadVideo}
                className={`py-3 px-6 rounded-2xl font-semibold flex items-center gap-2 transition-all ${
                  currentVideoUrl
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 cursor-pointer scale-100 hover:scale-[1.02]"
                    : "bg-slate-800 text-slate-500 border border-slate-800/50 cursor-not-allowed opacity-50"
                }`}
              >
                <Download className="w-4 h-4" />
                Download to Device
              </button>
            </div>
          </div>

        </div>

        {/* INLINE RECENT CREATIONS GALLERY - AUTOPLAY & LOOP */}
        {creations.length > 0 && (
          <section id="workspace-creations-gallery" className="mt-8 flex flex-col gap-6 border-t border-slate-800 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Live Motion Gallery
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hover to auto-preload or click to review custom looping motion results directly inside your workspace.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 bg-slate-950 border border-slate-800/80 py-1.5 px-3 rounded-full font-mono">
                  {creations.length} {creations.length === 1 ? "Video" : "Videos"}
                </span>
                {selectedCreations.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedCreations.length})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creations.slice(0, 6).map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  isSelected={selectedCreations.includes(item.id)}
                  onToggleSelect={(e) => toggleSelectCreation(item.id, e)}
                  onSelectToPreview={() => handleReplayCreation(item)}
                  onReEdit={() => handleReEdit(item)}
                  user={user}
                  onUpdateCreation={(updatedItem) => {
                    const newList = creations.map(c => c.id === updatedItem.id ? updatedItem : c);
                    if (!user) {
                      saveLocalHistory(newList);
                    } else {
                      setCreations(newList);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FULL-SCREEN STUDIO VIDEO LIBRARY & GALLERY MODAL */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            id="video-gallery-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 overflow-y-auto flex justify-center items-start"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 lg:p-8 my-8 flex flex-col gap-6"
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h2 className="font-bold text-xl text-white">Studio Video Library & Gallery</h2>
                    <p className="text-xs text-slate-400">Manage and browse previous generations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGallery(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters & Control bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search creations..."
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-200 placeholder-slate-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={filterRatio}
                      onChange={(e) => setFilterRatio(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 border-0 focus:ring-0 focus:outline-none"
                    >
                      <option value="all">All Formats</option>
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                    </select>
                  </div>

                  {selectedCreations.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected ({selectedCreations.length})
                    </button>
                  )}

                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all"
                  >
                    {getFilteredCreations().every((c) => selectedCreations.includes(c.id))
                      ? "Deselect All"
                      : "Select All Visible"}
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              {getFilteredCreations().length === 0 ? (
                <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950">
                  <FolderMinus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-300">No creations found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery || filterRatio !== "all"
                      ? "Adjust your search parameters or filter options to locate items."
                      : "Your library is currently empty. Go ahead and generate your first video!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredCreations().map((item) => {
                    const isSelected = selectedCreations.includes(item.id);
                    return (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        isSelected={isSelected}
                        onToggleSelect={(e) => toggleSelectCreation(item.id, e)}
                        onSelectToPreview={() => handleReplayCreation(item)}
                        onReEdit={() => handleReEdit(item)}
                        user={user}
                        onUpdateCreation={(updatedItem) => {
                          const newList = creations.map(c => c.id === updatedItem.id ? updatedItem : c);
                          if (!user) {
                            saveLocalHistory(newList);
                          } else {
                            setCreations(newList);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
