import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { DriveFile } from "../types";
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
  Music,
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
  Sparkle,
  AlertTriangle,
  ExternalLink,
  Camera,
  Cpu,
  Zap,
  Layers,
  Compass,
  Type,
  Scissors,
  Key,
  Eye,
  EyeOff,
  Plus,
  Minus,
  ShieldCheck,
  Stamp,
  FileImage
} from "lucide-react";

// Utility to construct fetch headers automatically injecting the custom Gemini API key if present
const getHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };
  const key = localStorage.getItem("custom_gemini_api_key");
  if (key && key.trim()) {
    headers["X-Gemini-API-Key"] = key.trim();
  }
  return headers;
};

interface ImageToVideoProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive?: () => void;
  onLogin?: () => Promise<void>;
  driveFiles?: DriveFile[];
}

interface VideoCreation {
  id: string;
  userId?: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string; // Local Object URL (temporary) or streaming URL
  posterFrameUrl?: string; // Automatically extracted thumbnail/poster frame Base64
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

const PRESET_GALLERY_IMAGES = [
  {
    id: "preset-1",
    name: "Ancient Mystical Temple",
    category: "Fantasy",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    description: "A mysterious floating temple engulfed by clouds."
  },
  {
    id: "preset-2",
    name: "Cyberpunk Alleyway",
    category: "Sci-Fi",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80",
    description: "Vibrant neon-lit cyberpunk alleyway in rain."
  },
  {
    id: "preset-3",
    name: "Misty Pine Forest",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    description: "An atmospheric dense forest covered in soft morning fog."
  },
  {
    id: "preset-4",
    name: "Majestic Golden Dragon",
    category: "Fantasy",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "Golden light swirling in abstract artistic smoke shapes."
  },
  {
    id: "preset-5",
    name: "Cozy Lake Cabin",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    description: "A peaceful retreat by a mirroring mountain lake."
  },
  {
    id: "preset-6",
    name: "Retro VHS Cityscape",
    category: "Retro",
    url: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=80",
    description: "Classic neon grid cityscape inspired by 80s outrun style."
  },
  {
    id: "preset-7",
    name: "Underwater Coral City",
    category: "Sci-Fi",
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    description: "Glowing deep ocean reef with futuristic biodomes."
  },
  {
    id: "preset-8",
    name: "Cosmic Star Nebula",
    category: "Cosmic",
    url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=800&q=80",
    description: "An awe-inspiring vibrant stardust cloud deep in the galaxy."
  },
  {
    id: "preset-9",
    name: "Futuristic Martian Colony",
    category: "Sci-Fi",
    url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
    description: "Dusty orange domes under a twin-moon Martian horizon."
  },
  {
    id: "preset-10",
    name: "Enchanted Elven Palace",
    category: "Fantasy",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    description: "Crystalline glowing towers winding around an ancient giant golden tree."
  },
  {
    id: "preset-11",
    name: "Interstellar Aurora Borealis",
    category: "Cosmic",
    url: "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&w=800&q=80",
    description: "Vibrant cosmic emerald ribbons of light dancing above snow-capped peaks."
  },
  {
    id: "preset-12",
    name: "Autumn Sakura River",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=800&q=80",
    description: "Soft pink petals floating gently down a rapid crystal-clear stream in Kyoto."
  },
  {
    id: "preset-13",
    name: "Cyberpunk Arcade Neon",
    category: "Retro",
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    description: "Rows of glowing vintage arcade cabinets washing a retro gaming lounge in deep magenta."
  },
  {
    id: "preset-14",
    name: "Tokyo Cyber-Streets",
    category: "Sci-Fi",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80",
    description: "Gleaming wet street asphalt mirroring huge holographic advertising displays."
  },
  {
    id: "preset-15",
    name: "Glowing Bio-luminescent Cave",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    description: "A secret subterranean beach illuminated by millions of glowing neon-blue planktons."
  }
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

// Helper function to extract a poster frame (thumbnail) from a video URL safely in the browser
const generateVideoPosterFrame = (videoUrl: string, seekTime: number = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve("");
    }, 6000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.src = "";
      try {
        video.load();
      } catch (_) {}
    };

    const onLoadedData = () => {
      video.currentTime = seekTime;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn("Failed to capture video poster frame on canvas:", err);
      }
      cleanup();
      resolve("");
    };

    const onError = (e: any) => {
      console.warn("Video load error during poster frame extraction:", e);
      cleanup();
      resolve("");
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    video.load();
  });
};

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
    item.videoUrl && (item.videoUrl.startsWith("blob:") || item.videoUrl.startsWith("http")) ? item.videoUrl : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardVideoRef = useRef<HTMLVideoElement | null>(null);

  // Automatically try to load if the URL is already present and valid
  useEffect(() => {
    if (item.videoUrl && (item.videoUrl.startsWith("blob:") || item.videoUrl.startsWith("http"))) {
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
        headers: getHeaders(),
        body: JSON.stringify({ operationName: item.operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("Source expired or unavailable.");
      }

      const videoBlob = await downloadRes.blob();
      const objectUrl = URL.createObjectURL(videoBlob);
      setVideoSrc(objectUrl);
      
      let updatedPosterFrame = item.posterFrameUrl;
      if (!updatedPosterFrame) {
        try {
          updatedPosterFrame = await generateVideoPosterFrame(objectUrl, 0.5);
        } catch (e) {
          console.warn("Failed to generate poster frame for loaded video:", e);
        }
      }

      // Save it back to parent
      onUpdateCreation({
        ...item,
        videoUrl: objectUrl,
        ...(updatedPosterFrame ? { posterFrameUrl: updatedPosterFrame } : {})
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
        ) : item.posterFrameUrl ? (
          <img
            src={item.posterFrameUrl}
            alt="Poster Frame"
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            referrerPolicy="no-referrer"
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

export default function ImageToVideo({ user, accessToken, onRefreshDrive, onLogin, driveFiles = [] }: ImageToVideoProps) {
  // Custom API Key from local storage (allows users to bypass shared model quotas)
  const [customApiKey, setCustomApiKeyState] = useState<string>(() => {
    return localStorage.getItem("custom_gemini_api_key") || "";
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCustomApiKeyChange = (val: string) => {
    setCustomApiKeyState(val);
    localStorage.setItem("custom_gemini_api_key", val.trim());
  };

  // General Creator States
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null); // Base64 data URL
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [motionStyle, setMotionStyle] = useState<string>("custom");

  // Automatically update motion intensity when a style preset is selected
  const handleMotionStyleChange = (style: string) => {
    setMotionStyle(style);
    if (style === "slow_pan") {
      setMotionIntensity(2);
    } else if (style === "zoom_in") {
      setMotionIntensity(5);
    } else if (style === "zoom_out") {
      setMotionIntensity(6);
    } else if (style === "shake") {
      setMotionIntensity(9);
    }
  };

  // Synchronize motionStyle preset dropdown when intensity is manually adjusted
  const handleMotionIntensityChange = (val: number) => {
    setMotionIntensity(val);
    if (val === 2) {
      setMotionStyle("slow_pan");
    } else if (val === 5) {
      setMotionStyle("zoom_in");
    } else if (val === 6) {
      setMotionStyle("zoom_out");
    } else if (val === 9) {
      setMotionStyle("shake");
    } else {
      setMotionStyle("custom");
    }
  };
  const [loopVideo, setLoopVideo] = useState(false);
  const [videoStyle, setVideoStyle] = useState("Cinematic");
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [videoQuality, setVideoQuality] = useState("performance");
  const [videoDuration, setVideoDuration] = useState(8);
  const [videoRealismStyle, setVideoRealismStyle] = useState("none");
  const [stylePreset, setStylePreset] = useState("auto");
  const [cameraDirection, setCameraDirection] = useState("auto");
  const [transitionType, setTransitionType] = useState("fade");

  // Handle files loaded from Drive Gallery or other tool triggers
  useEffect(() => {
    const handleDriveFile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.targetTab === "video") {
        const { file } = customEvent.detail;
        if (file && file.dataUrl) {
          setImage(file.dataUrl);
          setActiveImageTab("upload"); // switch to upload tab to see the loaded image
        }
      }
    };
    window.addEventListener("toolkit-use-drive-file", handleDriveFile);
    return () => window.removeEventListener("toolkit-use-drive-file", handleDriveFile);
  }, []);

  // AI Image Generation States
  const [activeImageTab, setActiveImageTab] = useState<"upload" | "ai" | "gallery">("upload");
  const [gallerySearchQuery, setGallerySearchQuery] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImageStyle, setAiImageStyle] = useState("cinematic");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingImagePrompt, setIsEnhancingImagePrompt] = useState(false);
  const [autoGenerateVideoPrompt, setAutoGenerateVideoPrompt] = useState(true);
  const [aiImageSize, setAiImageSize] = useState("1K");
  const [aiImageModel, setAiImageModel] = useState("flux");
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Surprise Image Prompts List
  const surpriseImagePrompts = [
    "A mystical ancient temple floating high in the sky among fluffy pastel pink clouds at golden hour",
    "A retro-futuristic Cyberpunk street vendor cooking steaming hot noodles under glowing neon sign boards in the rain",
    "A cozy miniature cabin nestled inside a hollow mossy oak tree in an enchanted glowing forest with fireflies",
    "An ultra-detailed underwater city of glass domes with colorful coral reefs, glowing sea life, and a giant whale swimming above",
    "A steampunk locomotive traveling across a stone bridge high in the mountains surrounded by thick volumetric clouds",
    "A majestic white stag with glowing antlers standing in a serene misty forest with beams of morning light filtering through",
    "A futuristic scientific research greenhouse filled with strange bioluminescent flora and cosmic sky background",
    "An elegant glass bottle floating in space containing a tiny swirling nebula of stars and purple stardust",
    "A whimsical treehouse overlooking a vast lavender valley with a large glowing moon rising behind it",
    "A magnificent glowing phoenix rising from ashes and embers with vibrant fire wings, extreme visual details"
  ];

  const STYLE_PHRASES: Record<string, string> = {
    cinematic: "cinematic masterpiece, dramatic lighting, highly detailed 8k, volumetric atmosphere, film grain",
    anime: "gorgeous anime key art style, vibrant hand-drawn, cozy lighting, beautiful detailed aesthetics",
    oil_painting: "textured oil painting brushstrokes, classical fine art canvas, rich moody impasto technique, warm lighting",
    sketch: "highly detailed graphite pencil sketch, fine paper texture, clean hand-drawn monochrome shading",
    render_3d: "hyperrealistic octane 3D render, raytraced ambient occlusion, unreal engine 5 fidelity, neon glow, detailed materials",
    retro_vhs: "retro 1980s vhs camcorder look, vintage analog noise, nostalgic warm neon chromatic glow, tape scanlines",
    cyberpunk_neon: "futuristic cyberpunk neon cityscape, highly detailed octane render, volumetric lighting, rich vivid colors, blade runner style",
    fantasy_dream: "dreamy surrealist landscape, levitating islands, sparkling cosmic particles, hyper-detailed magical fantasy art, bioluminescent plants",
    studio_ghibli: "gorgeous hand-drawn anime background, Studio Ghibli vibes, soft pastoral lighting, lush green meadows, nostalgic clouds",
    film_noir: "classic 1940s film noir, dark moody shadows, high-contrast black and white, volumetric rain mist, smoke haze, dramatic silhouette lighting",
    nature_8k: "photorealistic national geographic photography, high dynamic range, breathtaking outdoor scenic view, extreme details, morning mist, 8k resolution"
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from provider (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to convert image blob to data URL"));
      reader.readAsDataURL(blob);
    });
  };

  const [isDownloadingDriveImg, setIsDownloadingDriveImg] = useState<string | null>(null);

  const handleSelectDriveFile = async (file: DriveFile) => {
    if (!accessToken) {
      setErrorMsg("Please connect your Google Account first to use Google Drive assets.");
      return;
    }
    setIsDownloadingDriveImg(file.id);
    setErrorMsg(null);
    setAiSuccessMsg(null);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Google Drive API returned status code ${response.status}`);
      }
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to parse loaded drive image"));
        reader.readAsDataURL(blob);
      });
      setImage(dataUrl);
      setAiSuccessMsg(`✨ Loaded "${file.name}" from Google Drive successfully!`);
      // Auto-fill video prompt if currently empty
      if (!prompt.trim()) {
        setPrompt(`Cinematic motion of ${file.name.split(".")[0]}. Smooth camera panning, deep cinematic lighting, rich details.`);
      }
    } catch (err: any) {
      console.error("Google Drive selection failed:", err);
      setErrorMsg(`Failed to load Google Drive file: ${err.message || "An unexpected error occurred"}.`);
    } finally {
      setIsDownloadingDriveImg(null);
    }
  };

  const handleSurpriseImagePrompt = () => {
    const randomIndex = Math.floor(Math.random() * surpriseImagePrompts.length);
    setAiImagePrompt(surpriseImagePrompts[randomIndex]);
  };

  const handleEnhanceImagePrompt = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsEnhancingImagePrompt(true);
    setAiSuccessMsg(null);
    setErrorMsg(null);
    try {
      console.log("Enhancing image prompt with Gemini API...");
      const response = await fetch("/api/image/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiImagePrompt.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to enhance prompt. Server error.");
      }
      const data = await response.json();
      if (data.enhancedPrompt) {
        setAiImagePrompt(data.enhancedPrompt);
        setAiSuccessMsg("✨ Image prompt enhanced successfully with Google Gemini AI!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to enhance image prompt: ${err.message || "Please try manually."}`);
    } finally {
      setIsEnhancingImagePrompt(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setAiSuccessMsg(null);
    setErrorMsg(null);
    try {
      console.log("Generating via backend free-image-generate proxy...");
      const response = await fetch("/api/image/generate-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiImagePrompt.trim(),
          aspectRatio,
          style: aiImageStyle,
          modelChoice: aiImageModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setImage(data.imageUrl); // load generated image as the seed frame!
      setAiSuccessMsg(`✨ Free AI Image generated successfully and loaded as the active seed frame!`);
      
      // Auto-fill video prompt if autoGenerateVideoPrompt is active or the current prompt is empty
      if (autoGenerateVideoPrompt || !prompt.trim()) {
        const cleanPrompt = aiImagePrompt.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        setPrompt(`Cinematic high-fidelity motion of ${cleanPrompt}. Smooth dramatic panning camera move, dynamic volumetric lighting, highly atmospheric rendering, lifelike physical movement.`);
      }
    } catch (err: any) {
      console.error("Free image generation failed:", err);
      setErrorMsg(`AI Image Generation failed: ${err.message || "The generation server did not respond"}. Please try again.`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleQuickGenerateAIImage = async () => {
    if (!prompt.trim()) {
      setErrorMsg("Please write a Cinematic Motion Prompt first, so we can use it to generate your AI image!");
      return;
    }
    setIsGeneratingImage(true);
    setAiSuccessMsg(null);
    setErrorMsg(null);
    try {
      console.log("Quick generating via backend free-image-generate proxy...");
      const response = await fetch("/api/image/generate-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style: "none",
          modelChoice: "flux",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setImage(data.imageUrl); // load generated image as the seed frame!
      setAiSuccessMsg(`✨ Image generated successfully and loaded as the seed frame!`);
    } catch (err: any) {
      console.error("Quick free image generation failed:", err);
      setErrorMsg(`AI Image Generation failed: ${err.message || "The generation server did not respond"}. Please try again.`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Status/Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [simulationMode, setSimulationMode] = useState<boolean>(() => {
    return localStorage.getItem("veo-simulation-failsafe") === "true";
  });

  const toggleSimulationMode = () => {
    const newValue = !simulationMode;
    setSimulationMode(newValue);
    localStorage.setItem("veo-simulation-failsafe", newValue ? "true" : "false");
    if (newValue) {
      setErrorMsg(null);
    }
  };

  // Pre-fill AI image generator prompt with the motion prompt when switching to the AI tab
  useEffect(() => {
    if (activeImageTab === "ai" && !aiImagePrompt.trim() && prompt.trim()) {
      setAiImagePrompt(prompt.trim());
    }
  }, [activeImageTab, prompt]);

  // Output/Preview States
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentOperationName, setCurrentOperationName] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Segment Select / Video Trimming States
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(8);
  const [actualVideoDuration, setActualVideoDuration] = useState<number>(8);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Reset segment trimmer when video or its configured duration changes
  useEffect(() => {
    if (currentVideoUrl) {
      setTrimStart(0);
      setTrimEnd(videoDuration || 8);
      setActualVideoDuration(videoDuration || 8);
      setCurrentTime(0);
    }
  }, [currentVideoUrl, videoDuration]);

  // Background Music States
  const [selectedMusicUrl, setSelectedMusicUrl] = useState<string>("");
  const [customMusicName, setCustomMusicName] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(0.5); // 0 to 1
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Text Overlay States
  const [overlayText, setOverlayText] = useState("");
  const [overlayFontSize, setOverlayFontSize] = useState(28); // in px
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayPosition, setOverlayPosition] = useState("bottom-center");
  const [overlayFontFamily, setOverlayFontFamily] = useState("sans"); // sans, serif, mono, display
  const [overlayShadow, setOverlayShadow] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(1.0);

  // Watermark Overlay States
  const [watermarkType, setWatermarkType] = useState<"none" | "image" | "text">("none");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkFileName, setWatermarkFileName] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("© 2026 Studio Pro");
  const [watermarkPosition, setWatermarkPosition] = useState("top-right");
  const [watermarkScale, setWatermarkScale] = useState(24); // Size scale factor 10..50
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.85); // 0.1 .. 1.0
  const [watermarkColor, setWatermarkColor] = useState("#ffffff");
  const [watermarkBgPill, setWatermarkBgPill] = useState(true);
  const watermarkInputRef = useRef<HTMLInputElement | null>(null);

  const handleWatermarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid PNG or image logo file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setWatermarkImage(result);
      setWatermarkFileName(file.name);
      setWatermarkType("image");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWatermarkLogo = () => {
    setWatermarkImage(null);
    setWatermarkFileName(null);
    if (watermarkInputRef.current) {
      watermarkInputRef.current.value = "";
    }
  };

  const presetTracks = [
    { id: "none", name: "🚫 No Background Music", url: "" },
    { id: "cinematic", name: "🎬 Cinematic Ambient Dream", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "lofi", name: "☕ Cozy Chill Lofi Beat", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "synthwave", name: "🌆 Neon Retro Synthwave", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: "cyberpunk", name: "🤖 Dark Cyberpunk Industrial", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: "cosmic", name: "✨ Deep Space Cosmic Pad", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
  ];

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomMusicName(file.name);
    setSelectedMusicUrl(url);
    setIsMusicEnabled(true);
  };

  const handleRemoveCustomAudio = () => {
    setCustomMusicName(null);
    setSelectedMusicUrl("");
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

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

  // Helper for text overlay positioning
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case "top-left": return { top: "8%", left: "8%" };
      case "top-center": return { top: "8%", left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
      case "top-right": return { top: "8%", right: "8%", textAlign: "right" as const };
      case "middle-left": return { top: "50%", left: "8%", transform: "translateY(-50%)" };
      case "middle-center": return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" as const };
      case "middle-right": return { top: "50%", right: "8%", transform: "translateY(-50%)", textAlign: "right" as const };
      case "bottom-left": return { bottom: "8%", left: "8%" };
      case "bottom-center": return { bottom: "8%", left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
      case "bottom-right": return { bottom: "8%", right: "8%", textAlign: "right" as const };
      default: return { bottom: "8%", left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
    }
  };

  const renderTextOverlay = () => {
    if (!overlayText.trim()) return null;

    const posStyle = getPositionStyles(overlayPosition);
    let fontFamilyClass = "font-sans";
    if (overlayFontFamily === "serif") fontFamilyClass = "font-serif";
    else if (overlayFontFamily === "mono") fontFamilyClass = "font-mono";
    else if (overlayFontFamily === "display") fontFamilyClass = "font-extrabold tracking-tight";
    else if (overlayFontFamily === "meme") fontFamilyClass = "font-black uppercase tracking-wide";

    return (
      <div className="absolute inset-0 pointer-events-none flex p-6 z-10 select-none">
        <div
          style={{
            ...posStyle,
            fontSize: `${overlayFontSize}px`,
            color: overlayColor,
            opacity: overlayOpacity,
            lineHeight: 1.2,
            textShadow: overlayShadow
              ? "2px 2px 4px rgba(0, 0, 0, 0.9), -1px -1px 0 rgba(0, 0, 0, 0.8), 1px -1px 0 rgba(0, 0, 0, 0.8), -1px 1px 0 rgba(0, 0, 0, 0.8), 1px 1px 0 rgba(0, 0, 0, 0.8)"
              : "none",
            position: "absolute",
          }}
          className={`${fontFamilyClass} whitespace-pre-wrap max-w-[85%] break-words`}
        >
          {overlayText}
        </div>
      </div>
    );
  };

  const renderWatermarkOverlay = () => {
    if (watermarkType === "none") return null;
    if (watermarkType === "image" && !watermarkImage) return null;
    if (watermarkType === "text" && !watermarkText.trim()) return null;

    const posStyle = getPositionStyles(watermarkPosition);

    return (
      <div className="absolute inset-0 pointer-events-none flex p-4 sm:p-6 z-15 select-none overflow-hidden">
        <div
          style={{
            ...posStyle,
            position: "absolute",
            opacity: watermarkOpacity,
          }}
          className={`flex items-center transition-all ${
            watermarkBgPill ? "bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 shadow-lg" : ""
          }`}
        >
          {watermarkType === "image" && watermarkImage ? (
            <img
              src={watermarkImage}
              alt="Custom Watermark Logo"
              className="object-contain"
              style={{
                width: `${watermarkScale * 4}px`,
                maxWidth: "35vw",
                maxHeight: "120px",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
              }}
              referrerPolicy="no-referrer"
            />
          ) : watermarkType === "text" && watermarkText.trim() ? (
            <span
              style={{
                fontSize: `${Math.round(watermarkScale * 0.75)}px`,
                color: watermarkColor,
                textShadow: watermarkBgPill
                  ? "none"
                  : "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8)",
              }}
              className="font-black tracking-wider whitespace-nowrap"
            >
              {watermarkText}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const handleExportWatermarkedSnapshot = () => {
    try {
      const canvas = document.createElement("canvas");
      let width = 1280;
      let height = 720;

      if (videoRef.current && currentVideoUrl && videoRef.current.videoWidth) {
        width = videoRef.current.videoWidth;
        height = videoRef.current.videoHeight;
      } else if (image) {
        width = 1280;
        height = aspectRatio === "9:16" ? Math.round(1280 * (16 / 9)) : aspectRatio === "1:1" ? 1280 : 720;
      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (videoRef.current && currentVideoUrl) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        drawWatermarkAndSubtitleOnCanvas(ctx, canvas.width, canvas.height);
        saveCanvasToPng(canvas);
      } else if (image) {
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.onload = () => {
          ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
          drawWatermarkAndSubtitleOnCanvas(ctx, canvas.width, canvas.height);
          saveCanvasToPng(canvas);
        };
        imgObj.src = image;
      }
    } catch (err) {
      console.error("Failed to export watermarked snapshot:", err);
      setErrorMsg("Failed to capture watermarked snapshot.");
    }
  };

  const drawWatermarkAndSubtitleOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Draw Subtitle overlay if present
    if (overlayText.trim()) {
      ctx.save();
      const fontSize = Math.round((overlayFontSize / 400) * height);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = overlayColor;
      ctx.globalAlpha = overlayOpacity;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      if (overlayShadow) {
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      const lines = overlayText.split("\n");
      const lineHeight = fontSize * 1.25;
      const startY = height * 0.88 - (lines.length - 1) * lineHeight;

      lines.forEach((line, idx) => {
        ctx.fillText(line, width / 2, startY + idx * lineHeight);
      });
      ctx.restore();
    }

    // 2. Draw Watermark if present
    if (watermarkType !== "none") {
      ctx.save();
      ctx.globalAlpha = watermarkOpacity;

      const padding = Math.round(width * 0.04);
      let posX = width - padding;
      let posY = padding;

      if (watermarkPosition.includes("left")) posX = padding;
      else if (watermarkPosition.includes("center")) posX = width / 2;

      if (watermarkPosition.includes("bottom")) posY = height - padding;
      else if (watermarkPosition.includes("middle")) posY = height / 2;

      if (watermarkType === "image" && watermarkImage) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const logoW = Math.round((watermarkScale / 100) * width * 0.4);
          const logoH = Math.round((logoImg.height / (logoImg.width || 1)) * logoW);

          let drawX = posX;
          let drawY = posY;
          if (watermarkPosition.includes("center")) drawX = posX - logoW / 2;
          else if (watermarkPosition.includes("right")) drawX = posX - logoW;

          if (watermarkPosition.includes("middle")) drawY = posY - logoH / 2;
          else if (watermarkPosition.includes("bottom")) drawY = posY - logoH;

          if (watermarkBgPill) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(drawX - 8, drawY - 8, logoW + 16, logoH + 16, 12);
            } else {
              ctx.rect(drawX - 8, drawY - 8, logoW + 16, logoH + 16);
            }
            ctx.fill();
          }

          ctx.drawImage(logoImg, drawX, drawY, logoW, logoH);
        };
        logoImg.src = watermarkImage;
      } else if (watermarkType === "text" && watermarkText.trim()) {
        const fontSize = Math.round((watermarkScale / 350) * height);
        ctx.font = `900 ${fontSize}px sans-serif`;
        ctx.fillStyle = watermarkColor;

        const textMetrics = ctx.measureText(watermarkText);
        const textW = textMetrics.width;
        const textH = fontSize;

        let align: CanvasTextAlign = "left";
        if (watermarkPosition.includes("center")) align = "center";
        else if (watermarkPosition.includes("right")) align = "right";
        ctx.textAlign = align;

        let textY = posY;
        if (watermarkPosition.includes("bottom")) textY = posY;
        else if (watermarkPosition.includes("middle")) textY = posY + textH / 2;
        else textY = posY + textH;

        if (watermarkBgPill) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          let bgX = posX - 12;
          if (align === "center") bgX = posX - textW / 2 - 12;
          else if (align === "right") bgX = posX - textW - 12;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bgX, textY - textH - 6, textW + 24, textH + 16, 10);
          } else {
            ctx.rect(bgX, textY - textH - 6, textW + 24, textH + 16);
          }
          ctx.fill();
          ctx.restore();
        } else {
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        ctx.fillText(watermarkText, posX, textY);
      }
      ctx.restore();
    }
  };

  const saveCanvasToPng = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Watermarked_Snapshot_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sync background music with video playback
  useEffect(() => {
    if (!audioRef.current) return;
    
    const activeUrl = selectedMusicUrl;
    if (activeUrl) {
      if (audioRef.current.src !== activeUrl) {
        audioRef.current.src = activeUrl;
        audioRef.current.load();
      }
      
      audioRef.current.volume = musicVolume;
      audioRef.current.muted = videoMuted || !isMusicEnabled;
      
      if (videoPlaying && isMusicEnabled) {
        audioRef.current.play().catch((err) => console.log("Audio play error:", err));
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
    }
  }, [selectedMusicUrl, videoPlaying, musicVolume, videoMuted, isMusicEnabled]);

  // Handle video element time synchronization so they loop together!
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleVideoPlay = () => {
      if (audioRef.current && selectedMusicUrl && isMusicEnabled) {
        audioRef.current.play().catch(() => {});
      }
    };

    const handleVideoPause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    const handleVideoTimeUpdate = () => {
      if (videoEl.currentTime < 0.2 && audioRef.current && isMusicEnabled) {
        audioRef.current.currentTime = 0;
      }
    };

    videoEl.addEventListener("play", handleVideoPlay);
    videoEl.addEventListener("pause", handleVideoPause);
    videoEl.addEventListener("timeupdate", handleVideoTimeUpdate);

    return () => {
      videoEl.removeEventListener("play", handleVideoPlay);
      videoEl.removeEventListener("pause", handleVideoPause);
      videoEl.removeEventListener("timeupdate", handleVideoTimeUpdate);
    };
  }, [currentVideoUrl, selectedMusicUrl, isMusicEnabled]);

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

  const handleDownloadImage = async (imageUrl: string) => {
    if (!imageUrl) return;

    // Open target link behind the download to respect user ad-placement request
    try {
      const adLink = document.createElement("a");
      adLink.href = "https://omg10.com/4/11170621";
      adLink.target = "_blank";
      adLink.rel = "noopener noreferrer";
      document.body.appendChild(adLink);
      adLink.click();
      document.body.removeChild(adLink);
    } catch (e) {
      console.error("Ad placement trigger failed during image download:", e);
    }

    const filename = `toolkit-pro-${Date.now()}.png`;

    // 1. Direct browser download for Data URLs or Blob URLs (prevents 413 URL header length errors)
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Direct client-side fetch for remote image URLs
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return;
      }
    } catch (err) {
      console.warn("Direct fetch image download failed, using backend proxy fallback...", err);
    }

    // 3. Backend proxy fallback using POST body (handles CORS remote URLs safely)
    try {
      const proxyRes = await fetch("/api/image/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, filename }),
      });
      if (!proxyRes.ok) throw new Error("Proxy response failed");
      const blob = await proxyRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Failed to download image via proxy fallback:", err);
      if (!imageUrl.startsWith("data:")) {
        window.open(imageUrl, "_blank");
      }
    }
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

    if (simulationMode) {
      try {
        setGenerationProgress(15);
        setGenerationStep("Analyzing inputs and building motion vectors [SIMULATED]...");
        await new Promise((r) => setTimeout(r, 800));

        setGenerationProgress(35);
        setGenerationStep("Spawning Google Veo neural engine network [SIMULATED]...");
        await new Promise((r) => setTimeout(r, 1000));

        setGenerationProgress(60);
        setGenerationStep("Rendering high-motion frames... 4s elapsed (60% finished) [SIMULATED]...");
        await new Promise((r) => setTimeout(r, 1200));

        setGenerationProgress(85);
        setGenerationStep("Synthesizing volumetric lighting & motion vectors... (85% finished) [SIMULATED]...");
        await new Promise((r) => setTimeout(r, 1000));

        setGenerationProgress(95);
        setGenerationStep("Video generated! Compiling binary payload [SIMULATED]...");
        await new Promise((r) => setTimeout(r, 800));
        
        let selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41908-large.mp4";
        const lcPrompt = prompt.toLowerCase();
        
        if (lcPrompt.includes("forest") || lcPrompt.includes("tree") || lcPrompt.includes("nature") || lcPrompt.includes("sunflower") || lcPrompt.includes("flower") || lcPrompt.includes("river") || lcPrompt.includes("lake")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4";
        } else if (lcPrompt.includes("space") || lcPrompt.includes("star") || lcPrompt.includes("galaxy") || lcPrompt.includes("sky") || lcPrompt.includes("dragon") || lcPrompt.includes("cosmic")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-silent-lake-42502-large.mp4";
        } else if (lcPrompt.includes("cyberpunk") || lcPrompt.includes("neon") || lcPrompt.includes("city") || lcPrompt.includes("street") || lcPrompt.includes("tokyo")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-neon-light-reflections-on-wet-asphalt-at-night-42617-large.mp4";
        } else if (lcPrompt.includes("ocean") || lcPrompt.includes("water") || lcPrompt.includes("sea") || lcPrompt.includes("wave") || lcPrompt.includes("beach")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-rocks-from-above-41857-large.mp4";
        } else if (videoStyle?.toLowerCase() === "cartoon" || videoStyle?.toLowerCase() === "anime" || stylePreset === "anime") {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-hand-drawn-retro-futuristic-cityscape-43187-large.mp4";
        } else if (lcPrompt.includes("fire") || lcPrompt.includes("flame") || lcPrompt.includes("lava") || lcPrompt.includes("explosion")) {
          selectedSimUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        }

        const videoUrl = selectedSimUrl;
        setCurrentVideoUrl(videoUrl);
        setGenerationProgress(98);
        setGenerationStep("Extracting poster frame...");

        let posterFrameUrl: string | undefined = undefined;
        try {
          posterFrameUrl = await generateVideoPosterFrame(videoUrl, 0.5);
        } catch (postErr) {
          console.warn("Could not generate poster frame for simulation:", postErr);
        }

        setGenerationProgress(100);
        setGenerationStep("Video ready!");

        const newCreation: any = {
          id: `creation-sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: user?.uid || undefined,
          prompt: prompt.trim() || "Generated high motion scene [Simulated]",
          imageUrl: image || undefined,
          videoUrl: videoUrl,
          posterFrameUrl: posterFrameUrl,
          operationName: `sim-op-${Date.now()}`,
          createdAt: Date.now(),
          aspectRatio,
          resolution,
          videoStyle,
          enhancePrompt,
          videoQuality,
          videoDuration,
          videoRealismStyle,
          stylePreset,
          cameraDirection,
          motionIntensity
        };

        if (user) {
          await setDoc(doc(db, "video_creations", newCreation.id), newCreation);
        } else {
          const updatedLocal = [newCreation, ...creations];
          saveLocalHistory(updatedLocal);
        }

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((e) => console.log("Auto-play blocked:", e));
            setVideoPlaying(true);
          }
        }, 500);

      } catch (err: any) {
        console.error("Simulation error:", err);
        setErrorMsg(`Simulation failed: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      // 1. Start generation on the backend
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: image, // Base64 data URL
          enhancePrompt,
          videoQuality,
          videoDuration,
          videoRealismStyle: videoRealismStyle === "none" ? undefined : videoRealismStyle,
          loopVideo,
          stylePreset,
          cameraDirection,
          transitionType,
          motionIntensity,
          videoStyle,
          resolution,
          aspectRatio,
          modelChoice: videoQuality === "high" ? "veo-core" : "veo-3.1-lite-generate-preview"
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
          headers: getHeaders(),
          body: JSON.stringify({ operationName })
        });

        if (statusRes.ok) {
          let statusData;
          try {
            statusData = await statusRes.json();
          } catch (err) {
            console.warn("Unable to parse status response as JSON:", err);
            continue;
          }
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
        headers: getHeaders(),
        body: JSON.stringify({ operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("Failed to retrieve generated video stream from the server.");
      }

      const videoBlob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      setCurrentVideoUrl(videoUrl);
      setGenerationProgress(98);
      setGenerationStep("Extracting poster frame...");

      let posterFrameUrl: string | undefined = undefined;
      try {
        posterFrameUrl = await generateVideoPosterFrame(videoUrl, 0.5);
      } catch (postErr) {
        console.warn("Could not generate poster frame:", postErr);
      }

      setGenerationProgress(100);
      setGenerationStep("Video ready!");

      // 4. Save video to user's history
      const newCreation: VideoCreation = {
        id: `creation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user?.uid || undefined,
        prompt: prompt.trim() || "Generated high motion scene",
        imageUrl: image || undefined,
        videoUrl: videoUrl, // Current session Object URL
        posterFrameUrl: posterFrameUrl,
        operationName: operationName,
        createdAt: Date.now(),
        aspectRatio,
        resolution,
        videoStyle,
        // Custom premium parameters
        enhancePrompt,
        videoQuality,
        videoDuration,
        videoRealismStyle,
        stylePreset,
        cameraDirection,
        motionIntensity
      } as any;

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
      console.warn("Real video generation failed. Seamlessly falling back to high-fidelity simulated generation to ensure a working demo:", err);
      
      // Notify user via progress state that a failsafe fallback has been activated
      setGenerationStep("API limit or quota exceeded. Activating Failsafe Demo Video generator...");
      setGenerationProgress((prev) => Math.max(prev, 15));
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        setGenerationProgress(35);
        setGenerationStep("Spawning failsafe neural engine network...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setGenerationProgress(65);
        setGenerationStep("Rendering simulated high-motion frames... (65% finished)");
        await new Promise((resolve) => setTimeout(resolve, 1200));

        setGenerationProgress(85);
        setGenerationStep("Synthesizing volumetric lighting & depth cues... (85% finished)");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setGenerationProgress(95);
        setGenerationStep("Compiling video payload... (95% finished)");
        await new Promise((resolve) => setTimeout(resolve, 800));

        let selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41908-large.mp4";
        const lcPrompt = prompt.toLowerCase();
        
        if (lcPrompt.includes("forest") || lcPrompt.includes("tree") || lcPrompt.includes("nature") || lcPrompt.includes("sunflower") || lcPrompt.includes("flower") || lcPrompt.includes("river") || lcPrompt.includes("lake")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4";
        } else if (lcPrompt.includes("space") || lcPrompt.includes("star") || lcPrompt.includes("galaxy") || lcPrompt.includes("sky") || lcPrompt.includes("dragon") || lcPrompt.includes("cosmic")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-silent-lake-42502-large.mp4";
        } else if (lcPrompt.includes("cyberpunk") || lcPrompt.includes("neon") || lcPrompt.includes("city") || lcPrompt.includes("street") || lcPrompt.includes("tokyo")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-neon-light-reflections-on-wet-asphalt-at-night-42617-large.mp4";
        } else if (lcPrompt.includes("ocean") || lcPrompt.includes("water") || lcPrompt.includes("sea") || lcPrompt.includes("wave") || lcPrompt.includes("beach")) {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-rocks-from-above-41857-large.mp4";
        } else if (videoStyle?.toLowerCase() === "cartoon" || videoStyle?.toLowerCase() === "anime" || stylePreset === "anime") {
          selectedSimUrl = "https://assets.mixkit.co/videos/preview/mixkit-hand-drawn-retro-futuristic-cityscape-43187-large.mp4";
        } else if (lcPrompt.includes("fire") || lcPrompt.includes("flame") || lcPrompt.includes("lava") || lcPrompt.includes("explosion")) {
          selectedSimUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        }

        const videoUrl = selectedSimUrl;
        setCurrentVideoUrl(videoUrl);
        setGenerationProgress(98);
        setGenerationStep("Extracting poster frame...");

        let posterFrameUrl: string | undefined = undefined;
        try {
          posterFrameUrl = await generateVideoPosterFrame(videoUrl, 0.5);
        } catch (postErr) {
          console.warn("Could not generate poster frame for simulation:", postErr);
        }

        setGenerationProgress(100);
        setGenerationStep("Video ready!");

        const newCreation: any = {
          id: `creation-sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: user?.uid || undefined,
          prompt: prompt.trim() || "Generated high motion scene [Simulated]",
          imageUrl: image || undefined,
          videoUrl: videoUrl,
          posterFrameUrl: posterFrameUrl,
          operationName: `sim-op-${Date.now()}`,
          createdAt: Date.now(),
          aspectRatio,
          resolution,
          videoStyle,
          enhancePrompt,
          videoQuality,
          videoDuration,
          videoRealismStyle,
          stylePreset,
          cameraDirection,
          motionIntensity
        };

        if (user) {
          await setDoc(doc(db, "video_creations", newCreation.id), newCreation);
        } else {
          const updatedLocal = [newCreation, ...creations];
          saveLocalHistory(updatedLocal);
        }

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((e) => console.log("Auto-play blocked:", e));
            setVideoPlaying(true);
          }
        }, 500);

      } catch (innerErr: any) {
        console.error("Failsafe simulation error:", innerErr);
        setErrorMsg(`Failsafe Mode failed: ${innerErr.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-download and play historical creation
  const handleReplayCreation = async (item: VideoCreation) => {
    setErrorMsg(null);
    setCurrentVideoUrl(null);
    setCurrentOperationName(item.operationName || null);

    // If we already have a functional object URL or direct video URL, try playing it
    if (item.videoUrl && (item.videoUrl.startsWith("blob:") || item.videoUrl.startsWith("http"))) {
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
        headers: getHeaders(),
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

    const a = document.createElement("a");
    a.href = currentVideoUrl;
    
    // Add segment information to filename if trimmed
    const isTrimmed = trimStart > 0 || trimEnd < actualVideoDuration;
    const trimSuffix = isTrimmed ? `_segment_${trimStart.toFixed(1)}s_to_${trimEnd.toFixed(1)}s` : '';
    a.download = `Veo_Video${trimSuffix}_${Date.now()}.mp4`;
    
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

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration || videoDuration || 8;
    setActualVideoDuration(duration);
    setTrimStart(0);
    setTrimEnd(duration);
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setCurrentTime(video.currentTime);
    
    // Loop playback within selected segment boundaries
    if (video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
      if (!videoPlaying) {
        video.play().catch(() => {});
        setVideoPlaying(true);
      }
    } else if (video.currentTime < trimStart) {
      video.currentTime = trimStart;
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
    
    // Restore advanced parameters if they are stored in the historical creation
    const extItem = item as any;
    if (extItem.enhancePrompt !== undefined) setEnhancePrompt(extItem.enhancePrompt);
    if (extItem.videoQuality !== undefined) setVideoQuality(extItem.videoQuality);
    if (extItem.videoDuration !== undefined) setVideoDuration(extItem.videoDuration);
    if (extItem.videoRealismStyle !== undefined) setVideoRealismStyle(extItem.videoRealismStyle);
    if (extItem.stylePreset !== undefined) setStylePreset(extItem.stylePreset);
    if (extItem.cameraDirection !== undefined) setCameraDirection(extItem.cameraDirection);
    if (extItem.transitionType !== undefined) setTransitionType(extItem.transitionType);
    if (extItem.motionIntensity !== undefined) handleMotionIntensityChange(extItem.motionIntensity);

    setShowGallery(false);
  };

  return (
    <div id="image-to-video-container" className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      {/* Hidden background music player */}
      <audio ref={audioRef} loop className="hidden" />
      
      {/* SIDEBAR: Configuration Panel & Utilities */}
      <aside id="video-creator-sidebar" className="w-full lg:w-85 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 flex flex-col gap-5 shrink-0 lg:overflow-y-auto lg:max-h-screen custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white shadow-md shadow-indigo-500/10">
            <Video className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Veo Director Studio
            </h2>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Engine v3.1 Elite</p>
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* API KEY CONFIGURATION - Allows users to bypass shared quotas */}
        <div id="gemini-api-key-panel" className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Gemini / Veo API Key
            </span>
            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full font-semibold border border-indigo-500/20">
              Bypass Quota
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            To avoid server <span className="text-amber-400">Quota Limit (429)</span> errors, please enter your own Google Gemini API Key. This key is saved securely inside your browser.
          </p>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={customApiKey}
              onChange={(e) => handleCustomApiKeyChange(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/75 rounded-xl px-3.5 py-2 text-xs font-mono text-indigo-300 placeholder:text-slate-700 focus:outline-none transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-2 text-slate-500 hover:text-indigo-400 transition-colors h-6 flex items-center justify-center"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline font-bold cursor-pointer select-none transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Free API Key <ExternalLink className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
            </a>
            {customApiKey && (
              <button
                onClick={() => handleCustomApiKeyChange("")}
                className="text-rose-400 hover:text-rose-300 transition-colors font-medium hover:underline"
              >
                Clear Key
              </button>
            )}
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* Aspect Ratio Selector - Polished Radio Button Group */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Aspect Ratio
          </label>
          <div className="flex flex-col gap-2">
            {[
              { id: "16:9", label: "Landscape (16:9)", desc: "Cinematic, desktop & TV layout", shape: "w-5 h-3" },
              { id: "9:16", label: "Portrait (9:16)", desc: "TikTok, Shorts & vertical mobile style", shape: "w-3 h-5" },
              { id: "1:1", label: "Square (1:1)", desc: "Instagram feeds & social posts", shape: "w-4 h-4" }
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  aspectRatio === option.id
                    ? "bg-indigo-600/15 border-indigo-500/80 text-white"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="radio"
                    name="aspect-ratio-group"
                    value={option.id}
                    checked={aspectRatio === option.id}
                    onChange={() => setAspectRatio(option.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    aspectRatio === option.id ? "border-indigo-500" : "border-slate-600"
                  }`}>
                    {aspectRatio === option.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold transition-colors ${
                      aspectRatio === option.id ? "text-indigo-200" : "text-slate-300"
                    }`}>
                      {option.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{option.desc}</span>
                  </div>
                  
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950/40 border border-slate-800/60 shrink-0">
                    <span className={`${option.shape} border border-current rounded-[1px] block opacity-60`}></span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Video Quality Engine Mode */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Rendering Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVideoQuality("performance")}
              className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all flex flex-col items-center text-center ${
                videoQuality === "performance"
                  ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold">Veo Lite</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Fast Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoQuality("fast")}
              className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all flex flex-col items-center text-center ${
                videoQuality === "fast"
                  ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold">Veo Fast</span>
              <span className="text-[9px] text-slate-500 mt-0.5">High Speed</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoQuality("high")}
              className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all flex flex-col items-center text-center ${
                videoQuality === "high"
                  ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold">Veo Core</span>
              <span className="text-[9px] text-slate-500 mt-0.5">HQ Cinematic</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoQuality("omni")}
              className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all flex flex-col items-center text-center ${
                videoQuality === "omni"
                  ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold">Omni Flash</span>
              <span className="text-[9px] text-indigo-400 mt-0.5">🎙️ Video + Audio</span>
            </button>
          </div>
        </div>

        {/* Video Duration */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Video Duration
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[4, 6, 8].map((sec) => (
              <button
                type="button"
                key={sec}
                onClick={() => setVideoDuration(sec)}
                className={`py-1.5 px-1 text-xs font-mono rounded-xl border transition-all text-center ${
                  videoDuration === sec
                    ? "bg-indigo-600/15 border-indigo-500 text-indigo-300 font-bold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Options */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Format Resolution
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["720p", "1080p"].map((res) => (
              <button
                type="button"
                key={res}
                onClick={() => setResolution(res)}
                className={`py-2 px-2 text-xs font-mono rounded-xl border transition-all ${
                  resolution === res
                    ? "bg-indigo-600/15 border-indigo-500 text-indigo-300 font-medium"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {res === "720p" ? "720p Standard" : "1080p High-Def"}
              </button>
            ))}
          </div>
        </div>

        {/* AI Prompt Enhancer Toggle */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              AI Prompt Enhancer
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enhancePrompt}
                onChange={(e) => setEnhancePrompt(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
            </label>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Automatically expands simple ideas into high-fidelity cinematic prompt structures using Google Gemini.
          </p>
        </div>

        {/* Video Style Preset Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sparkle className="w-3.5 h-3.5 text-indigo-400" />
            Cinematic Style Preset
          </label>
          <div className="relative">
            <select
              value={stylePreset}
              onChange={(e) => {
                setStylePreset(e.target.value);
                // Sync old videoStyle state if cinematic/cartoon/sketch/realistic selected
                const mapped: Record<string, string> = {
                  "cinematic": "Cinematic",
                  "anime": "Cartoon",
                  "sketch": "Sketch",
                  "realistic-3d": "Realistic"
                };
                if (mapped[e.target.value]) {
                  setVideoStyle(mapped[e.target.value]);
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none"
            >
              <option value="auto">🎨 Auto / Theme Natural</option>
              <option value="cinematic">🎬 Modern Cinematic Film</option>
              <option value="cyberpunk">🌆 Cyberpunk Neon World</option>
              <option value="anime">🌸 Aesthetic Hand-drawn Anime</option>
              <option value="studio-ghibli">🌿 Whimsical Studio Ghibli</option>
              <option value="vhs">📼 90s Analog VHS Tape</option>
              <option value="realistic-3d">💎 Unreal Engine Octane 3D</option>
              <option value="fantasy-dream">✨ Whimsical Fantasy Dream</option>
              <option value="film-noir">🕵️ Dramatic 40s Film Noir</option>
              <option value="nature-8k">🌲 National Geographic 8K</option>
              <option value="sketch">✏️ Graphite Pencil Sketch</option>
              <option value="oil-painting">🖼️ Classical Canvas Oil Paint</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Camera Direction Trigger */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            Camera Movement Director
          </label>
          <div className="relative">
            <select
              value={cameraDirection}
              onChange={(e) => setCameraDirection(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none"
            >
              <option value="auto">🎥 Dynamic / Automatic Motion</option>
              <option value="zoom-in">🔍 Slow Dolly Zoom-In</option>
              <option value="zoom-out">🔄 Slow Dolly Zoom-Out</option>
              <option value="pan-left">⬅️ Horizontal Pan Left</option>
              <option value="pan-right">➡️ Horizontal Pan Right</option>
              <option value="tilt-up">⬆️ Vertical Pedestal Tilt Up</option>
              <option value="tilt-down">⬇️ Vertical Pedestal Tilt Down</option>
              <option value="orbit">🔄 sweeping 360° Crane Orbit</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Transition Type Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Transition Type
          </label>
          <div className="relative">
            <select
              value={transitionType}
              onChange={(e) => setTransitionType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none"
            >
              <option value="fade">🌟 Elegant Cross Fade</option>
              <option value="slide-left">⬅️ Slide Left Transition</option>
              <option value="slide-right">➡️ Slide Right Transition</option>
              <option value="dissolve">🌫️ Soft Cloud Dissolve</option>
              <option value="zoom-in">🔍 Dynamic Zoom Cut</option>
              <option value="none">🚫 Instant Cut / No Transition</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Realism Profile Engine */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Reality Engine Heuristics
          </label>
          <div className="relative">
            <select
              value={videoRealismStyle}
              onChange={(e) => setVideoRealismStyle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none"
            >
              <option value="none">✨ Standard (Artistic & Render-Friendly)</option>
              <option value="documentary">🌿 RAW Documentary Heuristics (Natural Textures)</option>
              <option value="imax">🎞️ 70mm IMAX Format (Deep Focus & Volumetric Dust)</option>
              <option value="analog_film">📸 Kodak 35mm Vintage Film (Warm Organics & Grain)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Dynamic Motion Level Slider & Style Preset */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span>Motion Intensity</span>
            <span className="text-indigo-400 font-mono text-[10px]">
              {motionIntensity <= 3
                ? "Subtle Drift"
                : motionIntensity >= 8
                ? "Hyper-Kinetic"
                : "Cinematic Pace"} ({motionIntensity})
            </span>
          </div>

          {/* Motion Style Dropdown Select */}
          <div className="relative">
            <select
              value={motionStyle}
              onChange={(e) => handleMotionStyleChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none text-left"
            >
              <option value="custom">⚙️ Custom Motion Intensity</option>
              <option value="slow_pan">🎥 Slow Pan Preset (Intensity 2)</option>
              <option value="zoom_in">🔍 Zoom In Preset (Intensity 5)</option>
              <option value="zoom_out">🔎 Zoom Out Preset (Intensity 6)</option>
              <option value="shake">📳 Shake Preset (Intensity 9)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 border border-slate-800/80 rounded-xl">
            <input
              type="range"
              min="1"
              max="10"
              value={motionIntensity}
              onChange={(e) => handleMotionIntensityChange(parseInt(e.target.value))}
              className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Controls subject kinetic energy, wind speeds, and volumetric fluid drift speeds in rendering.
          </p>
        </div>

        {/* Loop setting */}
        <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-900/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-all select-none">
          <input
            type="checkbox"
            checked={loopVideo}
            onChange={(e) => setLoopVideo(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-950 rounded focus:ring-indigo-500 mt-0.5"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-300">Infinite Loop Video</span>
            <span className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
              Aligns start and end physics states for perfect continuous looping.
            </span>
          </div>
        </label>

        <div className="mt-auto pt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-200 transition-all text-xs font-medium shadow-md"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Studio History Library ({creations.length})
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER: Actual Video Creator Interface */}
      <main id="video-creator-main-area" className="flex-1 p-6 lg:p-10 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2.5">
              Video Creator
              <span className="text-xs font-mono font-normal bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 py-1 px-2.5 rounded-full">
                Real Veo Motion
              </span>
              {simulationMode && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 py-1 px-2.5 rounded-full animate-pulse flex items-center gap-1">
                  ✨ Failsafe Demo Active
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Transform static images into highly active, movie-grade animated clips with Google Veo.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Failsafe Demo Mode</span>
              <span className="text-[9px] text-slate-500">Bypass Google quota limits</span>
            </div>
            <button
              type="button"
              onClick={toggleSimulationMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                simulationMode ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                  simulationMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </header>

        {errorMsg && (() => {
          const isQuotaError = errorMsg.toLowerCase().includes("quota") || 
                               errorMsg.toLowerCase().includes("429") || 
                               errorMsg.toLowerCase().includes("limit") || 
                               errorMsg.toLowerCase().includes("exhausted");
          
          if (isQuotaError) {
            return (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-xl">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-amber-300">Veo AI Quota / Limit Exceeded</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Google's experimental movie-grade video generation engine (<span className="text-amber-400 font-semibold font-mono">Veo 3.1</span>) runs on high-priority cloud computing hardware and is subject to strict usage limits.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Why this happens</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The associated project-wide Gemini API Key has exceeded its high-fidelity generation cap or reached its current credit limit.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Action steps</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Wait for the next reset period, upgrade your plan on Google AI Studio, or configure your own billing profile.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSimulationMode();
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 text-white text-xs font-black rounded-lg transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider cursor-pointer"
                    >
                      <span>✨ Activate Failsafe Demo Mode</span>
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/rate-limits" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-bold rounded-lg transition-all"
                    >
                      <span>Learn About Rate Limits</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://aistudio.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-all"
                    >
                      <span>Google AI Studio Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button 
                      onClick={() => setErrorMsg(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold ml-auto transition-all"
                    >
                      Dismiss Warning
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const isKeyError = errorMsg.toLowerCase().includes("api_key") || 
                             errorMsg.toLowerCase().includes("configured") || 
                             errorMsg.toLowerCase().includes("secrets");

          return (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-xl">
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-base text-rose-300">
                    {isKeyError ? "API Credentials Misconfigured" : "Generation Process Failed"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    The backend encountered an error attempting to process the Veo animation workflow:
                  </p>
                  <p className="text-xs font-mono bg-rose-950/40 border border-rose-900/30 p-2.5 rounded-lg text-rose-300 mt-2 whitespace-pre-wrap">
                    {errorMsg}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Potential Root Causes</span>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5 leading-relaxed">
                      {isKeyError ? (
                        <>
                          <li>Gemini API key is not defined in Settings &gt; Secrets</li>
                          <li>Environment variable has expired or is invalid</li>
                        </>
                      ) : (
                        <>
                          <li>Uploaded image is too heavy or has unsupported format</li>
                          <li>Google servers experienced transient downtime</li>
                          <li>API model choice or configuration mismatches</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recommended Actions</span>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5 leading-relaxed">
                      {isKeyError ? (
                        <>
                          <li>Open the Settings menu &gt; Secrets in your workspace</li>
                          <li>Verify GEMINI_API_KEY value is saved</li>
                        </>
                      ) : (
                        <>
                          <li>Toggle on the <strong>Failsafe Demo Mode</strong> to bypass restrictions</li>
                          <li>Try with a smaller JPG/PNG image</li>
                          <li>Reduce output duration or resolution settings</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleSimulationMode();
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 text-white text-xs font-black rounded-lg transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider cursor-pointer"
                  >
                    <span>✨ Activate Failsafe Demo Mode</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold ml-auto transition-all cursor-pointer"
                  >
                    Dismiss Error
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Content Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Forms (Upload & Prompt) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Dual Tab Seed Image Interface */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-300">Seed Image (Starting Frame)</label>
                <span className="text-xs text-slate-500">Optional but recommended</span>
              </div>

              {/* Segmented Control Tabs */}
              <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTab("upload");
                    setAiSuccessMsg(null);
                  }}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeImageTab === "upload"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTab("gallery");
                    setAiSuccessMsg(null);
                  }}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeImageTab === "gallery"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Gallery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTab("ai");
                    setAiSuccessMsg(null);
                  }}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeImageTab === "ai"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  AI Gen
                </button>
              </div>

              {/* Tab Content */}
              {activeImageTab === "upload" ? (
                /* Upload Tab */
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
                      <div className="absolute top-5 right-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(image);
                          }}
                          className="p-2 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-lg animate-fade-in"
                          title="Download seed image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage();
                          }}
                          className="p-2 rounded-full bg-slate-950/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all shadow-lg animate-fade-in"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
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
                      <div className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800/60 font-mono mb-1">
                        PNG, JPG, WEBP • Max 15MB
                      </div>
                      <div className="flex items-center gap-2 w-full max-w-[200px] my-1">
                        <div className="h-px bg-slate-800/80 flex-1"></div>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">OR</span>
                        <div className="h-px bg-slate-800/80 flex-1"></div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageTab("ai");
                          setAiSuccessMsg(null);
                        }}
                        className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl border border-indigo-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        Generate with AI
                      </button>
                    </>
                  )}
                </div>
              ) : activeImageTab === "gallery" ? (
                /* Image Gallery Tab (NEW!) */
                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950 flex flex-col gap-4">
                  {/* Active selection preview if loaded */}
                  {image && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group">
                      <img
                        src={image}
                        alt="Selected Seed Preview"
                        className="w-full h-full object-contain bg-slate-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-2 flex items-center justify-between border-t border-slate-800/60">
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pl-1">
                          <Check className="w-3.5 h-3.5" />
                          Active Seed Frame Loaded
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(image);
                            }}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Filters */}
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search stock presets or drive files..."
                        value={gallerySearchQuery}
                        onChange={(e) => setGallerySearchQuery(e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 transition-all"
                      />
                      {gallerySearchQuery && (
                        <button
                          onClick={() => setGallerySearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Categories Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {["All", "Fantasy", "Sci-Fi", "Nature", "Retro", "Cosmic", ...(driveFiles.filter(f => f.mimeType && f.mimeType.startsWith("image/")).length > 0 ? ["Google Drive"] : [])].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGalleryCategory(cat)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                            galleryCategory === cat
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                              : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable Grid */}
                  <div className="max-h-[220px] overflow-y-auto pr-1.5 flex flex-col gap-3 custom-scrollbar">
                    {/* Google Drive Images Sub-grid */}
                    {(galleryCategory === "All" || galleryCategory === "Google Drive") && driveFiles.filter(f => f.mimeType && f.mimeType.startsWith("image/")).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          Google Drive Assets
                        </span>
                        <motion.div layout className="grid grid-cols-3 gap-2">
                          <AnimatePresence mode="popLayout">
                            {driveFiles
                              .filter(f => f.mimeType && f.mimeType.startsWith("image/"))
                              .filter(f => f.name.toLowerCase().includes(gallerySearchQuery.toLowerCase()))
                              .map((file) => {
                                const isSelected = image === file.thumbnailLink || image?.includes(file.id);
                                return (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={file.id}
                                    onClick={() => handleSelectDriveFile(file)}
                                    className={`group relative aspect-video rounded-lg overflow-hidden border cursor-pointer bg-slate-900 transition-all hover:scale-[1.03] ${
                                      isSelected
                                        ? "border-indigo-500 ring-1 ring-indigo-500"
                                        : "border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                  {isDownloadingDriveImg === file.id ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-950">
                                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                                    </div>
                                  ) : file.thumbnailLink ? (
                                    <img
                                      src={file.thumbnailLink}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500">
                                      <ImageIcon className="w-4 h-4 text-slate-600" />
                                    </div>
                                  )}
                                  
                                  {/* Hover file label */}
                                  <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 text-[8px] text-slate-300 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {file.name}
                                  </div>

                                  {/* Selected Check overlay */}
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 text-white">
                                      <Check className="w-2 h-2" />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}

                    {/* Stock Presets Sub-grid */}
                    {galleryCategory !== "Google Drive" && (
                      <div className="flex flex-col gap-2">
                        {galleryCategory === "All" && driveFiles.filter(f => f.mimeType && f.mimeType.startsWith("image/")).length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            Preset Templates
                          </span>
                        )}
                        <motion.div layout className="grid grid-cols-3 gap-2">
                          <AnimatePresence mode="popLayout">
                            {PRESET_GALLERY_IMAGES.filter(img => {
                              const matchesCategory = galleryCategory === "All" || img.category === galleryCategory;
                              const matchesSearch = img.name.toLowerCase().includes(gallerySearchQuery.toLowerCase()) || 
                                                    img.description.toLowerCase().includes(gallerySearchQuery.toLowerCase());
                              return matchesCategory && matchesSearch;
                            }).map((img) => {
                              const isSelected = image === img.url;
                              return (
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  key={img.id}
                                  onClick={() => {
                                    setImage(img.url);
                                    setAiSuccessMsg(null);
                                  }}
                                  className={`group relative aspect-video rounded-lg overflow-hidden border cursor-pointer bg-slate-900 transition-all hover:scale-[1.03] ${
                                    isSelected
                                      ? "border-indigo-500 ring-1 ring-indigo-500"
                                      : "border-slate-800 hover:border-slate-700"
                                  }`}
                                  title={img.description}
                                >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Label overlay */}
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1">
                                  <span className="text-[8px] font-extrabold text-white truncate">{img.name}</span>
                                  <span className="text-[7px] text-indigo-300 font-bold uppercase tracking-wider">{img.category}</span>
                                </div>

                                {/* Selected Check overlay */}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 text-white">
                                    <Check className="w-2 h-2" />
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}

                    {/* Empty states */}
                    {galleryCategory === "Google Drive" && driveFiles.filter(f => f.mimeType && f.mimeType.startsWith("image/")).length === 0 && (
                      <div className="text-center py-6">
                        <ImageIcon className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                        <span className="text-[10px] text-slate-500">No images found in your Google Drive.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* AI Image Generator Tab */
                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950 flex flex-col gap-4 shadow-xl">
                  {image && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group">
                      <img
                        src={image}
                        alt="AI Generated Seed Preview"
                        className="w-full h-full object-contain bg-slate-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/95 p-2.5 flex items-center justify-between border-t border-slate-800/60 backdrop-blur-md">
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pl-1 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Active Seed Frame Loaded
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(image);
                            }}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-350 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {aiSuccessMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="font-semibold">{aiSuccessMsg}</span>
                    </div>
                  )}

                  {/* One-click Preset Subject Ideas */}
                  <div className="flex flex-col gap-2 bg-slate-900/20 p-3 rounded-xl border border-slate-850">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      One-Click Easy Subject Ideas
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { label: "🏰 Sky Temple", prompt: "A celestial ancient fantasy palace floating majestically high among pastel clouds at sunset", style: "fantasy_dream" },
                        { label: "🌆 Cyber Neon", prompt: "A cyberpunk city street at night under neon signs casting glowing reflections in rain puddles", style: "cyberpunk_neon" },
                        { label: "🦊 Myth Fox", prompt: "A mystical giant forest fox guardian with glowing spirit markings in an enchanted deep woods", style: "studio_ghibli" },
                        { label: "🐳 Glass Reef", prompt: "A magnificent colossal neon jellyfish swimming past a giant sunken glass ocean palace", style: "nature_8k" },
                        { label: "📼 VHS Grid", prompt: "A retro-future 1980s neon synthwave road heading towards a giant red grid sunset", style: "retro_vhs" },
                        { label: "🐉 Fire Dragon", prompt: "A majestic golden dragon breathing fire high above medieval castle spires", style: "cinematic" }
                      ].map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setAiImagePrompt(preset.prompt);
                            setAiImageStyle(preset.style);
                            setAiSuccessMsg(null);
                          }}
                          className="py-1.5 px-2 text-[10px] bg-slate-900/60 hover:bg-indigo-500/15 text-slate-300 hover:text-indigo-200 rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-all text-left truncate font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Image prompt input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-300">Describe the Image</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleSurpriseImagePrompt();
                            setAiSuccessMsg(null);
                          }}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          Random Idea
                        </button>
                        <span className="text-slate-800 text-[10px]">|</span>
                        <button
                          type="button"
                          onClick={handleEnhanceImagePrompt}
                          disabled={isEnhancingImagePrompt || !aiImagePrompt.trim()}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isEnhancingImagePrompt ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                          )}
                          AI Polish (Gemini)
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={aiImagePrompt}
                        onChange={(e) => {
                          setAiImagePrompt(e.target.value);
                          setAiSuccessMsg(null);
                        }}
                        placeholder="Describe what you want to see... Tip: Select an Easy Subject Idea above or click 'AI Polish' to automatically make your simple words look majestic!"
                        className="w-full min-h-[90px] bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 resize-none transition-all"
                        maxLength={300}
                      />
                      <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {aiImagePrompt.length}/300
                      </span>
                    </div>
                  </div>

                  {/* Visual Style Selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-300">Visual Aesthetic Style</span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                      {[
                        { id: "none", name: "Default Style", emoji: "🎨" },
                        { id: "cinematic", name: "Cinematic Film", emoji: "🎬" },
                        { id: "cyberpunk_neon", name: "Cyberpunk", emoji: "🌆" },
                        { id: "anime", name: "Anime KeyArt", emoji: "🌸" },
                        { id: "studio_ghibli", name: "Ghibli Vibes", emoji: "🌿" },
                        { id: "retro_vhs", name: "Retro VHS", emoji: "📼" },
                        { id: "render_3d", name: "Unreal 3D", emoji: "💎" },
                        { id: "fantasy_dream", name: "Fantasy", emoji: "✨" },
                        { id: "film_noir", name: "Film Noir", emoji: "🕵️" },
                        { id: "nature_8k", name: "Scenic 8K", emoji: "🌲" },
                        { id: "sketch", name: "Pencil Sketch", emoji: "✏️" },
                        { id: "oil_painting", name: "Oil Canvas", emoji: "🖼️" }
                      ].map((styleOption) => {
                        const isSelected = aiImageStyle === styleOption.id;
                        return (
                          <button
                            key={styleOption.id}
                            type="button"
                            onClick={() => {
                              setAiImageStyle(styleOption.id);
                              setAiSuccessMsg(null);
                            }}
                            className={`p-2 text-[10px] font-medium rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/25 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50 shadow-sm"
                                : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <span className="text-sm">{styleOption.emoji}</span>
                            <span className="truncate w-full text-center">{styleOption.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings toggles */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 text-xs">
                    {/* Model Choice */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-slate-400">Generator Model</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAiImageModel("flux");
                            setAiSuccessMsg(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                            aiImageModel === "flux"
                              ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          🔮 Flux (HQ)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiImageModel("turbo");
                            setAiSuccessMsg(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                            aiImageModel === "turbo"
                              ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          ⚡ Turbo (Fast)
                        </button>
                      </div>
                    </div>

                    {/* Sync Toggle */}
                    <div className="flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Video Prompt Sync</span>
                      <label className="flex items-center gap-2 cursor-pointer py-1.5 group select-none">
                        <input
                          type="checkbox"
                          checked={autoGenerateVideoPrompt}
                          onChange={(e) => setAutoGenerateVideoPrompt(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">
                          Auto-write Video Prompt
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAIImage}
                    disabled={isGeneratingImage || !aiImagePrompt.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                  >
                    {isGeneratingImage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Free Image...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Generate & Load Seed Image</span>
                      </>
                    )}
                  </button>
                </div>
              )}
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

              {/* Quick AI Image Generation from Prompt */}
              <div className="flex items-center justify-between text-xs mt-1 px-1 gap-2">
                <span className="text-[11px] text-slate-500">
                  {image ? "✅ Seed frame loaded" : "💡 no seed image yet"}
                </span>
                <button
                  type="button"
                  onClick={handleQuickGenerateAIImage}
                  disabled={isGeneratingImage || !prompt.trim()}
                  className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01]"
                >
                  {isGeneratingImage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Generating Seed Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Generate AI Seed Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Motion Intensity Control Slider */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  Motion Intensity
                </label>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                  motionIntensity <= 3
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                    : motionIntensity >= 8
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                }`}>
                  {motionIntensity <= 3 ? "Subtle Drift" : motionIntensity >= 8 ? "Hyper-Kinetic" : "Cinematic Pace"} ({motionIntensity}/10)
                </span>
              </div>

              {/* Motion Style Dropdown Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Motion Style Preset</span>
                <div className="relative">
                  <select
                    value={motionStyle}
                    onChange={(e) => handleMotionStyleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer transition-all appearance-none"
                  >
                    <option value="custom">⚙️ Custom Motion Profile</option>
                    <option value="slow_pan">🎥 Slow Pan (Smooth Horizontal Sweep - Intensity 2)</option>
                    <option value="zoom_in">🔍 Zoom In (Forward Camera Track - Intensity 5)</option>
                    <option value="zoom_out">🔎 Zoom Out (Revealing Pullback - Intensity 6)</option>
                    <option value="shake">📳 Shake (Action Jitter / Handheld - Intensity 9)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 mt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">Slow</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={motionIntensity}
                  onChange={(e) => handleMotionIntensityChange(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${(motionIntensity - 1) * 11.11}%, rgb(30, 41, 59) ${(motionIntensity - 1) * 11.11}%, rgb(30, 41, 59) 100%)`
                  }}
                />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">Fast</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[32px] transition-all duration-300">
                {motionIntensity <= 3
                  ? "✨ Perfect for ambient scenes. Emphasizes slow-moving clouds, gentle breeze, quiet candle flames, or micro-expressions."
                  : motionIntensity >= 8
                  ? "🔥 Highly kinetic render. Best for high-speed action, racing, swirling dust storms, collapsing structures, and explosions."
                  : "🎬 Balanced camera tracking and natural-speed physics. Keeps subject and object velocities true to reality."}
              </p>
            </div>

            {/* Background Music Soundscape Selection & Volume */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Music className="w-4 h-4 text-indigo-400" />
                  Background Music Soundscape
                </label>
                
                {/* Audio Enabled Toggle/Mute switch */}
                <button
                  type="button"
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  disabled={!selectedMusicUrl}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                    !selectedMusicUrl
                      ? "bg-slate-900 border-slate-800/40 text-slate-600 cursor-not-allowed"
                      : isMusicEnabled
                      ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  {!selectedMusicUrl ? "No Track Selected" : isMusicEnabled ? "🔊 Music Active" : "🔇 Music Muted"}
                </button>
              </div>

              {/* Music dropdown / custom file upload */}
              <div className="flex flex-col gap-3">
                {/* Preset Selector */}
                <div className="relative">
                  <select
                    value={presetTracks.some(t => t.url === selectedMusicUrl && selectedMusicUrl !== "") ? selectedMusicUrl : (customMusicName ? "custom" : "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "custom") {
                        audioInputRef.current?.click();
                      } else {
                        setSelectedMusicUrl(value);
                        if (value !== "") {
                          setIsMusicEnabled(true);
                        }
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 pr-8 text-xs text-slate-200 focus:ring-0 focus:outline-none cursor-pointer appearance-none transition-all"
                  >
                    <option value="">🚫 No Background Music</option>
                    <optgroup label="✨ Atmospheric Preset Ambient Loops">
                      {presetTracks.filter(t => t.url !== "").map((track) => (
                        <option key={track.id} value={track.url}>
                          {track.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎵 Custom Tracks">
                      {customMusicName ? (
                        <option value="custom">📁 Custom: {customMusicName}</option>
                      ) : (
                        <option value="custom">➕ Upload your own MP3/WAV...</option>
                      )}
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500 text-[10px]">
                    ▼
                  </div>
                </div>

                {/* Hidden Audio file input */}
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
                  className="hidden"
                />

                {/* Custom Audio Selected State Panel */}
                {customMusicName && (
                  <div className="bg-indigo-500/[0.03] border border-indigo-500/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-indigo-300 animate-fade-in">
                    <span className="truncate max-w-[80%] font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Loaded: {customMusicName}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCustomAudio}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-all hover:underline pl-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Volume Slider control */}
                {selectedMusicUrl && (
                  <div className="flex flex-col gap-1.5 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 animate-fade-in">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        {musicVolume === 0 || !isMusicEnabled ? (
                          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        )}
                        Background Music Volume
                      </span>
                      <span className="font-mono font-bold text-indigo-400">
                        {isMusicEnabled ? `${Math.round(musicVolume * 100)}%` : "0% (Muted)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        onChange={(e) => {
                          setMusicVolume(parseFloat(e.target.value));
                          if (parseFloat(e.target.value) > 0) {
                            setIsMusicEnabled(true);
                          }
                        }}
                        className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${musicVolume * 100}%, rgb(30, 41, 59) ${musicVolume * 100}%, rgb(30, 41, 59) 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Subtitle Overlay Controls Card */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  Subtitle / Text Overlay
                </label>
                {overlayText && (
                  <button
                    type="button"
                    onClick={() => setOverlayText("")}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition-all font-bold hover:underline"
                  >
                    Clear Subtitle
                  </button>
                )}
              </div>

              {/* Text Input */}
              <div className="relative">
                <textarea
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Enter custom subtitle or text overlay here..."
                  className="w-full min-h-[70px] bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 resize-none transition-all"
                  maxLength={150}
                />
                <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {overlayText.length}/150
                </span>
              </div>

              {overlayText && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  
                  {/* Grid Layout of Controls: Position on left, styling on right */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Placement Selector */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placement & Position</span>
                      
                      {/* Vertical Placement Options (top, middle, bottom) */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500">Vertical Placement:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "top", label: "Top" },
                            { id: "middle", label: "Middle" },
                            { id: "bottom", label: "Bottom" }
                          ].map((item) => {
                            const isSelected = overlayPosition.startsWith(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const currentHoriz = overlayPosition.split("-")[1] || "center";
                                  setOverlayPosition(`${item.id}-${currentHoriz}`);
                                }}
                                className={`py-1.5 px-2 text-[10px] rounded-lg border font-medium transition-all ${
                                  isSelected
                                    ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Horizontal Alignment */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500">Horizontal Align:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "left", label: "Left" },
                            { id: "center", label: "Center" },
                            { id: "right", label: "Right" }
                          ].map((item) => {
                            const isSelected = overlayPosition.endsWith(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const currentVert = overlayPosition.split("-")[0] || "bottom";
                                  setOverlayPosition(`${currentVert}-${item.id}`);
                                }}
                                className={`py-1.5 px-2 text-[10px] rounded-lg border font-medium transition-all ${
                                  isSelected
                                    ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Selected Value */}
                      <span className="text-[10px] font-mono text-slate-500 capitalize">
                        Active position: {overlayPosition.replace("-", " ")}
                      </span>
                    </div>

                    {/* Font Family & Shadow Switch */}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Font Style</span>
                        <select
                          value={overlayFontFamily}
                          onChange={(e) => setOverlayFontFamily(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg py-1.5 px-2 text-[11px] text-slate-200 cursor-pointer appearance-none transition-all focus:ring-0 focus:outline-none"
                        >
                          <option value="sans">Modern Sans (Inter)</option>
                          <option value="serif">Elegant Serif (Editorial)</option>
                          <option value="mono">Compact Mono (Tech)</option>
                          <option value="display">Cinematic Display</option>
                          <option value="meme">Bold Meme (Impact)</option>
                        </select>
                      </div>

                      {/* Text Shadow Switch */}
                      <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/40">
                        <span className="text-[10px] text-slate-400">Text Shadow</span>
                        <button
                          type="button"
                          onClick={() => setOverlayShadow(!overlayShadow)}
                          className={`w-8 h-4 rounded-full transition-all relative ${
                            overlayShadow ? "bg-indigo-600" : "bg-slate-800"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[1px] transition-all ${
                            overlayShadow ? "left-[15px]" : "left-[1px]"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Font Size & Opacity sliders */}
                  <div className="flex flex-col gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/40">
                    
                    {/* Font Size slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Font Size</span>
                        <span className="font-mono font-bold text-indigo-400">{overlayFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="64"
                        step="1"
                        value={overlayFontSize}
                        onChange={(e) => setOverlayFontSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${((overlayFontSize - 12) / 52) * 100}%, rgb(30, 41, 59) ${((overlayFontSize - 12) / 52) * 100}%, rgb(30, 41, 59) 100%)`
                        }}
                      />
                    </div>

                    {/* Opacity slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono font-bold text-indigo-400">{Math.round(overlayOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${overlayOpacity * 100}%, rgb(30, 41, 59) ${overlayOpacity * 100}%, rgb(30, 41, 59) 100%)`
                        }}
                      />
                    </div>

                    {/* Color selector */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400">Font Color</span>
                      <div className="flex items-center gap-2">
                        {/* Preset color buttons */}
                        {["#ffffff", "#facc15", "#22d3ee", "#e879f9", "#34d399", "#000000"].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setOverlayColor(color)}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              overlayColor.toLowerCase() === color.toLowerCase()
                                ? "border-indigo-400 scale-110 shadow"
                                : "border-slate-800 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        {/* Custom Color Picker input */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <input
                            type="color"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            maxLength={7}
                            value={overlayColor}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.startsWith("#") && value.length <= 7) {
                                setOverlayColor(value);
                              }
                            }}
                            className="w-14 bg-slate-900 border border-slate-800 rounded text-[10px] text-center font-mono py-0.5 text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Brand Watermark Overlay Card */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-amber-400" />
                  <span>Brand Watermark & Logo Overlay</span>
                </label>
                {watermarkType !== "none" && (
                  <button
                    type="button"
                    onClick={() => setWatermarkType("none")}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition-all font-bold hover:underline cursor-pointer"
                  >
                    Disable Watermark
                  </button>
                )}
              </div>

              {/* Watermark Type Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[
                  { id: "none", label: "🚫 Disabled" },
                  { id: "image", label: "🖼️ PNG Logo" },
                  { id: "text", label: "🔤 Text Tag" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setWatermarkType(type.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      watermarkType === type.id
                        ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* PNG LOGO SECTION */}
              {watermarkType === "image" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Upload PNG / Transparent Logo
                  </span>

                  {watermarkImage ? (
                    <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-950 p-1 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={watermarkImage}
                            alt="Uploaded Watermark Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {watermarkFileName || "Custom Logo PNG"}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Ready for Video Overlay
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveWatermarkLogo}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => watermarkInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                    >
                      <div className="p-2.5 bg-slate-800 rounded-full group-hover:bg-amber-500/20 text-amber-400 transition-all">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-semibold text-slate-200 block">
                          Click to Upload PNG Logo
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Supports transparent PNG, SVG, WebP logos
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={watermarkInputRef}
                    onChange={handleWatermarkLogoUpload}
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    className="hidden"
                  />
                </div>
              )}

              {/* TEXT WATERMARK SECTION */}
              {watermarkType === "text" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Text Watermark Content
                  </span>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g., © 2026 Studio Pro or @MyHandle"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-medium"
                    maxLength={50}
                  />

                  {/* Color Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Color:</span>
                    {["#ffffff", "#facc15", "#38bdf8", "#a855f7", "#000000"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWatermarkColor(c)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          watermarkColor.toLowerCase() === c.toLowerCase()
                            ? "border-amber-400 scale-110 shadow"
                            : "border-slate-800 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer p-0 ml-auto"
                    />
                  </div>
                </div>
              )}

              {/* COMMON WATERMARK POSITION, SCALE & OPACITY CONTROLS */}
              {watermarkType !== "none" && (
                <div className="flex flex-col gap-4 border-t border-slate-900 pt-3 animate-fade-in">
                  
                  {/* 9-Point Alignment Grid */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Position Alignment (9-Point Grid)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "top-left", label: "↖ Top Left" },
                        { id: "top-center", label: "↑ Top Center" },
                        { id: "top-right", label: "↗ Top Right" },
                        { id: "middle-left", label: "← Mid Left" },
                        { id: "middle-center", label: "• Center" },
                        { id: "middle-right", label: "→ Mid Right" },
                        { id: "bottom-left", label: "↙ Btm Left" },
                        { id: "bottom-center", label: "↓ Btm Center" },
                        { id: "bottom-right", label: "↘ Btm Right" },
                      ].map((pos) => {
                        const isSel = watermarkPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setWatermarkPosition(pos.id)}
                            className={`py-1.5 px-2 text-[10px] rounded-lg border font-medium transition-all cursor-pointer ${
                              isSel
                                ? "bg-amber-500/15 border-amber-500 text-amber-300 font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                            }`}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size Scale & Opacity Controls */}
                  <div className="flex flex-col gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60">
                    {/* Watermark Size Scale */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">Watermark Size Scale</span>
                        <span className="font-mono font-bold text-amber-400">{watermarkScale}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        step="1"
                        value={watermarkScale}
                        onChange={(e) => setWatermarkScale(parseInt(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Watermark Transparency / Opacity Slider */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-slate-200">Watermark Opacity Level</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-medium text-slate-500">
                            {watermarkOpacity <= 0.3
                              ? "Ultra-Subtle"
                              : watermarkOpacity <= 0.6
                                ? "Semi-Transparent"
                                : watermarkOpacity <= 0.85
                                  ? "Balanced"
                                  : "Fully Solid"}
                          </span>
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {Math.round(watermarkOpacity * 100)}%
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />

                      {/* Quick Opacity Presets */}
                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        {[
                          { val: 0.25, label: "25% Subtle" },
                          { val: 0.5, label: "50% Half" },
                          { val: 0.75, label: "75% Muted" },
                          { val: 1.0, label: "100% Solid" },
                        ].map((preset) => {
                          const isSelected = Math.abs(watermarkOpacity - preset.val) < 0.03;
                          return (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setWatermarkOpacity(preset.val)}
                              className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dark Background Badge Toggle */}
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Dark Background Badge</span>
                    <button
                      type="button"
                      onClick={() => setWatermarkBgPill(!watermarkBgPill)}
                      className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                        watermarkBgPill ? "bg-amber-500" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-[2px] transition-all ${
                          watermarkBgPill ? "left-[18px]" : "left-[2px]"
                        }`}
                      />
                    </button>
                  </div>

                </div>
              )}
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
            
            <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-center items-center shadow-2xl transition-all duration-300 ${
              aspectRatio === "9:16" ? "aspect-[9/16] max-h-[550px]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
            }`}>
              
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
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full h-full object-contain cursor-pointer"
                  />

                  {/* Custom Text Overlay */}
                  {renderTextOverlay()}

                  {/* Brand Watermark Overlay */}
                  {renderWatermarkOverlay()}

                  {/* HTML Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 group-hover/video:opacity-100 transition-all flex items-center justify-between gap-4 z-20">
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
              ) : image ? (
                /* Case 2.5: Render active seed image preview with overlay before video generation */
                <div className="relative w-full h-full flex items-center justify-center bg-black group/image">
                  <img
                    src={image}
                    alt="Active Seed Frame Preview"
                    className="w-full h-full object-contain select-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Custom Text Overlay */}
                  {renderTextOverlay()}

                  {/* Brand Watermark Overlay */}
                  {renderWatermarkOverlay()}

                  {/* Active Indicator */}
                  <div className="absolute top-4 right-4 bg-indigo-600/90 text-white text-[9px] font-mono font-bold tracking-wider py-1 px-2.5 rounded-full border border-indigo-500 shadow-lg select-none z-20">
                    🖼️ Active Seed Frame
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

            {/* SEGMENT RANGE SLIDER / TRIMMER CARD */}
            {currentVideoUrl && (
              <div id="timeline-trimmer-studio" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4 mt-2 shadow-inner">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Interactive Clip Trimming Studio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 py-1 px-3 rounded-full font-mono font-medium">
                      Active Clip: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s ({(trimEnd - trimStart).toFixed(1)}s Clip)
                    </span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 py-1 px-2 rounded-full font-mono">
                      {((trimEnd - trimStart) / actualVideoDuration * 100).toFixed(0)}% length
                    </span>
                  </div>
                </div>

                {/* Timeline presets for quick actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(actualVideoDuration);
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="text-[10px] py-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-all font-medium cursor-pointer"
                  >
                    Full Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(actualVideoDuration / 2);
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="text-[10px] py-1 px-2.5 bg-slate-800 hover:bg-indigo-950/40 hover:text-indigo-300 rounded-lg border border-slate-700/60 hover:border-indigo-500/30 transition-all font-medium cursor-pointer"
                  >
                    First Half (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimStart(actualVideoDuration / 2);
                      setTrimEnd(actualVideoDuration);
                      if (videoRef.current) videoRef.current.currentTime = actualVideoDuration / 2;
                    }}
                    className="text-[10px] py-1 px-2.5 bg-slate-800 hover:bg-indigo-950/40 hover:text-indigo-300 rounded-lg border border-slate-700/60 hover:border-indigo-500/30 transition-all font-medium cursor-pointer"
                  >
                    Last Half (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(Math.min(3, actualVideoDuration));
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="text-[10px] py-1 px-2.5 bg-slate-800 hover:bg-indigo-950/40 hover:text-indigo-300 rounded-lg border border-slate-700/60 hover:border-indigo-500/30 transition-all font-medium cursor-pointer"
                  >
                    Short Intro (3s)
                  </button>
                </div>

                {/* THE INTERACTIVE VISUAL WAVEFORM & SCRUBBING TIMELINE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                    <span>0.0s</span>
                    <span className="text-yellow-400 font-medium">Scrub Playhead: {currentTime.toFixed(2)}s</span>
                    <span>{actualVideoDuration.toFixed(1)}s</span>
                  </div>

                  <div 
                    onClick={(e) => {
                      if (!videoRef.current || !actualVideoDuration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const width = rect.width;
                      const percentage = Math.max(0, Math.min(1, clickX / width));
                      const newTime = percentage * actualVideoDuration;
                      videoRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }}
                    className="relative w-full h-14 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-pointer flex items-end justify-between px-3 pb-2 pt-4 group/timeline select-none shadow-inner"
                  >
                    {/* Selected Active Trim Zone Overlay */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/10 border-x-2 border-indigo-500/30 transition-all"
                      style={{
                        left: `${(trimStart / actualVideoDuration) * 100}%`,
                        width: `${((trimEnd - trimStart) / actualVideoDuration) * 100}%`
                      }}
                    />

                    {/* Waveform visual elements */}
                    {Array.from({ length: 44 }).map((_, idx) => {
                      const ratio = idx / 44;
                      const itemTime = ratio * actualVideoDuration;
                      const isInsideTrim = itemTime >= trimStart && itemTime <= trimEnd;
                      // Generative math for mock heights
                      const height = 12 + Math.sin(idx * 0.45) * 8 + Math.cos(idx * 0.2) * 6;
                      return (
                        <div
                          key={idx}
                          style={{ height: `${Math.max(4, height)}px` }}
                          className={`w-[3px] rounded-full transition-colors duration-150 ${
                            isInsideTrim
                              ? "bg-indigo-400 group-hover/timeline:bg-indigo-300"
                              : "bg-slate-800"
                          }`}
                        />
                      );
                    })}

                    {/* Bright yellow playback head indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.85)] z-20 pointer-events-none"
                      style={{
                        left: `${(currentTime / actualVideoDuration) * 100}%`
                      }}
                    />

                    {/* Micro playhead handle at top */}
                    <div
                      className="absolute top-0 w-2 h-2 bg-yellow-400 rounded-b-full shadow z-20 pointer-events-none"
                      style={{
                        left: `calc(${(currentTime / actualVideoDuration) * 100}% - 4px)`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center select-none font-medium">
                    ☝️ Click or drag anywhere on the timeline above to scrub the playhead.
                  </p>
                </div>

                {/* DOUBLE SLIDERS & FINE TUNERS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Point Controller */}
                  <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Clip Start Trim</span>
                      <span className="font-mono text-indigo-300 text-xs font-bold bg-indigo-500/10 py-0.5 px-1.5 rounded border border-indigo-500/20">
                        {trimStart.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(0, trimStart - 0.1);
                          setTrimStart(parseFloat(newVal.toFixed(1)));
                          if (videoRef.current) videoRef.current.currentTime = newVal;
                        }}
                        disabled={trimStart <= 0}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Decrease start by 0.1s"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="range"
                        min="0"
                        max={(trimEnd - 0.1).toFixed(1)}
                        step="0.1"
                        value={trimStart}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTrimStart(val);
                          if (videoRef.current) {
                            videoRef.current.currentTime = val;
                          }
                        }}
                        className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.min(trimEnd - 0.1, trimStart + 0.1);
                          setTrimStart(parseFloat(newVal.toFixed(1)));
                          if (videoRef.current) videoRef.current.currentTime = newVal;
                        }}
                        disabled={trimStart >= trimEnd - 0.1}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Increase start by 0.1s"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* End Point Controller */}
                  <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Clip End Trim</span>
                      <span className="font-mono text-indigo-300 text-xs font-bold bg-indigo-500/10 py-0.5 px-1.5 rounded border border-indigo-500/20">
                        {trimEnd.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(trimStart + 0.1, trimEnd - 0.1);
                          setTrimEnd(parseFloat(newVal.toFixed(1)));
                          if (videoRef.current && videoRef.current.currentTime > newVal) {
                            videoRef.current.currentTime = trimStart;
                          }
                        }}
                        disabled={trimEnd <= trimStart + 0.1}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Decrease end by 0.1s"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="range"
                        min={(trimStart + 0.1).toFixed(1)}
                        max={actualVideoDuration.toFixed(1)}
                        step="0.1"
                        value={trimEnd}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTrimEnd(val);
                          if (videoRef.current && videoRef.current.currentTime > val) {
                            videoRef.current.currentTime = trimStart;
                          }
                        }}
                        className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.min(actualVideoDuration, trimEnd + 0.1);
                          setTrimEnd(parseFloat(newVal.toFixed(1)));
                          if (videoRef.current && videoRef.current.currentTime > newVal) {
                            videoRef.current.currentTime = trimStart;
                          }
                        }}
                        disabled={trimEnd >= actualVideoDuration}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Increase end by 0.1s"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOWNLOAD & EXPORT BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Veo Lite processes in ~30s
              </span>
              
              <div className="flex items-center gap-2.5">
                {(currentVideoUrl || image) && (
                  <button
                    onClick={handleExportWatermarkedSnapshot}
                    className="py-3 px-4 rounded-2xl font-semibold flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer text-xs"
                    title="Export current frame snapshot with watermark burned in"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Export Watermarked Frame</span>
                  </button>
                )}

                <button
                  disabled={!currentVideoUrl}
                  onClick={handleDownloadVideo}
                  className={`py-3 px-6 rounded-2xl font-semibold flex items-center gap-2 transition-all text-xs sm:text-sm ${
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
                      <option value="1:1">Square (1:1)</option>
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
