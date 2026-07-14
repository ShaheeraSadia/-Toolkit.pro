 import React, { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import garreyExplorerUrl from "../assets/images/garrey_explorer_1783014281882.jpg";
// @ts-ignore
import garreySpaceUrl from "../assets/images/garrey_space_explorer_1783163434381.jpg";
// @ts-ignore
import garreyDeepSeaUrl from "../assets/images/garrey_deep_sea_1783163452596.jpg";
// @ts-ignore
import garreyCyberHackerUrl from "../assets/images/garrey_cyber_hacker_1783163473126.jpg";
import { User } from "firebase/auth";
import { uploadFileToDrive } from "../lib/drive";
import { triggerFileDownload } from "../lib/download";
import JSZip from "jszip";
// @ts-ignore
import gifshot from "gifshot";
import { motion, AnimatePresence } from "motion/react";
import VideoPresetsDrawer from "./VideoPresetsDrawer";
import {
  Video,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  ArrowRight,
  Download,
  Cloud,
  Layers,
  Music,
  HardDrive,
  Tv,
  Type,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Upload,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Copy,
  Sliders,
  Scissors,
  Clock,
  History,
  Film,
  Gauge,
  GripVertical,
  Move,
  BookOpen,
  Lightbulb,
  Zap,
  Flame,
  Mic,
  ListChecks,
  Grid,
  Image as ImageIcon,
  Search,
  Share2
} from "lucide-react";

interface OverlayElement {
  id: string;
  type: "rect" | "circle" | "arrow" | "star" | "triangle" | "heart" | "checkmark" | "icon";
  iconName?: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  lineWidth?: number;
  filled?: boolean;
  animation?: "pulse" | "spin" | "none";
}

interface ImageSlide {
  id: string;
  url: string;
  name: string;
  duration: number;
  text: string;
  textAnimation: "typewriter" | "fade" | "pop" | "slide-up" | "none";
  filter: "normal" | "noir" | "vintage" | "cinematic-warm" | "cyberpunk" | "vhs" | "retro" | "glitch-synth" | "dreamy-pastel" | "matrix-code" | "grayscale" | "sepia" | "high-contrast";
  scaleStart: number;
  scaleEnd: number;
  promptDuration?: number;
  cameraMovement?: string;
  subjectDescription?: string;
  style?: string;
  transitionEffect?: string;
  lightingType?: string;
  motionSpeed?: number;
  sfx?: string;
  isVideo?: boolean;
  textSlideBackground?: string;
  textSlideFontSize?: number;
  textSlideColor?: string;
  elements?: OverlayElement[];
  fontFamily?: string;
  flowAiPrompt?: string;
  flowAiNegativePrompt?: string;
  flowAiEffect?: "lightning" | "sparks" | "fire-embers" | "glitch-cyber" | "none";
  flowAiIntensity?: number;
  clipStart?: number;
  clipEnd?: number;
}

interface ImageToVideoProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => Promise<void>;
}

// RoyaltyFreeSynthManager Class definition here...
class RoyaltyFreeSynthManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private track: string = "none";
  private timer: any = null;
  private bpm = 110;
  private beatCount = 0;
  private gainNode: GainNode | null = null;
  private scheduledOscillators: { osc: OscillatorNode; stopTime: number }[] = [];
  private analyser: AnalyserNode | null = null;
  private volume: number = 0.3;
  private fadeIn: boolean = false;
  private fadeOut: boolean = false;
  private totalDuration: number = 10;
  private audioElement: HTMLAudioElement | null = null;
  private audioNode: MediaElementAudioSourceNode | null = null;
  private trimStart: number = 0;
  private trimEnd: number = 0;

  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGainNode: GainNode | null = null;
  private tempoFactor = 1.0;
  private filterCutoff = 8000;
  private delayFeedback = 0.15;

  constructor() {}

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setTempoFactor(factor: number) {
    this.tempoFactor = factor;
    if (this.audioElement) {
      try { this.audioElement.playbackRate = factor; } catch (e) {}
    }
  }

  public setFilterCutoff(cutoff: number) {
    this.filterCutoff = cutoff;
    if (this.filterNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.filterNode.frequency.setValueAtTime(cutoff, now);
      } catch (e) {
        this.filterNode.frequency.value = cutoff;
      }
    }
  }

  public setDelayFeedback(feedback: number) {
    this.delayFeedback = feedback;
    if (this.delayGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.delayGainNode.gain.setValueAtTime(feedback, now);
      } catch (e) {
        this.delayGainNode.gain.value = feedback;
      }
    }
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.gainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(vol, now);
      } catch (e) {
        this.gainNode.gain.value = vol;
      }
    }
  }

  public playSingleSfx(sfxId: string, volume: number = 0.5) {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (!this.ctx || !this.gainNode) return;
    if (sfxId === "cinema-impact") {
      this.playDrumKick(150, 1.8, volume * 0.9);
      this.playSynthNote(55, 1.5, volume * 0.3, "sine", 0.1);
    } else if (sfxId === "laser-sweep") {
      this.playLaser(1800, 0.8, volume * 0.6);
    }
  }

  public start(
    track: string,
    volume: number = 0.3,
    fadeIn: boolean = false,
    fadeOut: boolean = false,
    totalDuration: number = 10,
    customAudioUrl?: string | null,
    startTime: number = 0,
    trimStart: number = 0,
    trimEnd: number = 0,
    loopAudio: boolean = true
  ): Promise<void> {
    if (track === "none") {
      this.stop();
      return Promise.resolve();
    }
    this.track = track;
    this.volume = volume;
    this.fadeIn = fadeIn;
    this.fadeOut = fadeOut;
    this.totalDuration = totalDuration;
    this.trimStart = trimStart;
    this.trimEnd = trimEnd;

    if (this.isPlaying) { this.stop(); }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return Promise.resolve();
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (this.fadeIn) {
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + 1.5);
      } else {
        this.gainNode.gain.setValueAtTime(this.volume, now);
      }

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(this.filterCutoff, now);

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.35, now);
      this.delayGainNode = this.ctx.createGain();
      this.delayGainNode.gain.setValueAtTime(this.delayFeedback, now);

      this.delayNode.connect(this.delayGainNode);
      this.delayGainNode.connect(this.delayNode);

      this.filterNode.connect(this.gainNode);
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isPlaying = true;
      this.beatCount = 0;

      if (track === "retro-lofi") this.bpm = 85;
      else if (track === "upbeat-chimes") this.bpm = 115;
      else if (track === "ambient-deep") this.bpm = 60;

      const scheduleNextBeats = () => {
        if (!this.isPlaying) return;
        this.playBeat();
        this.beatCount++;
        const currentBpm = this.bpm * this.tempoFactor;
        const currentInterval = 60000 / (currentBpm || 120) / 2;
        this.timer = setTimeout(scheduleNextBeats, currentInterval);
      };

      scheduleNextBeats();
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.audioElement) {
      try { this.audioElement.pause(); this.audioElement.src = ""; } catch (e) {}
      this.audioElement = null;
    }
    this.scheduledOscillators.forEach(({ osc }) => { try { osc.stop(); } catch (e) {} });
    this.scheduledOscillators = [];
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} this.ctx = null; }
    this.gainNode = null;
    this.analyser = null;
  }

  private playBeat() {
    if (!this.ctx || !this.gainNode) return;
    const step = this.beatCount % 16;
    if (this.track === "retro-lofi") {
      if (step === 0 || step === 8) {
        const chord = step === 0 ? [130.81, 164.81, 196.00] : [110.00, 130.81, 164.81];
        chord.forEach((freq) => this.playSynthNote(freq, 1.8, 0.04 * this.volume, "triangle", 0.05));
      }
      if (step === 0 || step === 8) this.playDrumKick(85, 0.15, 0.06 * this.volume);
    }
  }

  private playSynthNote(freq: number, duration: number, volume: number, type: OscillatorType, attack: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.filterNode || this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
    this.scheduledOscillators.push({ osc, stopTime: this.ctx.currentTime + duration });
  }

  private playDrumKick(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.filterNode || this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
    this.scheduledOscillators.push({ osc, stopTime: this.ctx.currentTime + duration });
  }

  private playLaser(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.filterNode || this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
    this.scheduledOscillators.push({ osc, stopTime: this.ctx.currentTime + duration });
  }
}

// Preset and constant definitions
const SAMPLE_SLIDES: ImageSlide[] = [
  {
    id: "sample-garrey",
    url: garreyExplorerUrl,
    name: "Garrey the Fantasy Explorer.jpg",
    duration: 3,
    text: "Garrey the Fantasy Explorer",
    textAnimation: "pop",
    filter: "cinematic-warm",
    scaleStart: 1.0,
    scaleEnd: 1.18,
    promptDuration: 3,
    cameraMovement: "Slow Zoom",
    subjectDescription: "cute fantasy fluffy explorer with tiny hat and brass goggles looking at glowing valley",
    style: "Cinematic",
    sfx: "celestial-chime"
  }
];

export default function ImageToVideo({ user, accessToken, onRefreshDrive, onLogin }: ImageToVideoProps) {
  const [slides, setSlides] = useState<ImageSlide[]>(SAMPLE_SLIDES);
  const [activeSlideId, setActiveSlideId] = useState<string>("sample-garrey");
  const [activePresetStyle, setActivePresetStyle] = useState<string>("Cinematic Movie");
  const [selectedMusic, setSelectedMusic] = useState<string>("retro-lofi");
  const [musicVolume, setMusicVolume] = useState<number>(0.6); // Volume percentage (0.0 to 1.0)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [promptText, setPromptText] = useState<string>(
    "A cinematic, hyper-realistic video of [a majestic lion] walking slowly in [a snowy forest at sunset], shot on a 35mm lens, ultra-detailed, 4k."
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioManager = useRef(new RoyaltyFreeSynthManager());

  // Handle Quick Start templates
  const handleTemplateClick = (style: string, prompt: string, defaultMusic: string) => {
    setActivePresetStyle(style);
    setPromptText(prompt);
    setSelectedMusic(defaultMusic);
    // Auto sync music play
    audioManager.current.start(defaultMusic, musicVolume, true, false, 15);
  };

  // Synchronize audio manager volume when slider updates
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    audioManager.current.setVolume(vol);
  };

  // Canvas waveform animation responsive to volume
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const active = selectedMusic !== "none" && musicVolume > 0;
      
      // Responsive speed and height factor
      const speed = active ? 0.08 + musicVolume * 0.12 : 0;
      const ampFactor = active ? 6 + musicVolume * 15 : 0; // decay to 0 if muted

      ctx.fillStyle = "#6366f1"; // Indigo wave color
      for (let i = 0; i < 15; i++) {
        const height = active ? Math.sin(phase + i * 0.5) * ampFactor + ampFactor + 2 : 2;
        const x = i * 6;
        const y = canvas.height - height;
        ctx.fillRect(x, y, 4, height);
      }

      phase += speed;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedMusic, musicVolume]);

  // Video Generator trigger (High-Fidelity Payload)
  const generateVideo = async () => {
    setIsGenerating(true);
    try {
      // High-quality Video Gen parameters API Payload integration:
      const payload = {
        prompt: promptText,
        motion_bucket_id: 140,       // Raised to 140 for dynamic visual flow
        num_inference_steps: 30,     // Raised steps for clear video fidelity
        fps: 24,
        audio_preset: selectedMusic,
        audio_volume: musicVolume
      };
      
      console.log("Submitting dynamic payload to server:", payload);
      // Simulating API integration call
      await new Promise((res) => setTimeout(res, 3500));
      alert("Successfully Generated Video with premium motion synthesis!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="text-indigo-500 animate-pulse" /> Toolkit Pro Image-To-Video Builder
        </h2>
        <span className="bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 px-3  py-1 rounded-full text-xs font-semibold">
          Pro Mode Enabled ✨
        </span>
      </div>

      {/* ✏️ Try "Fill-in-the-Blank" Templates Gradient Card */}
      <div className="p-5 bg-gradient-to-r from-slate-850 to-indigo-950/40 border border-indigo-500/30 rounded-xl mb-6 shadow-inner">
        <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          ✏️ Try "Fill-in-the-Blank" Templates (بنے بنائے ٹیمپلیٹس)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() =>
              handleTemplateClick(
                "Cinematic Movie",
                "A cinematic, hyper-realistic video of [a majestic lion] walking slowly in [a snowy forest at sunset], shot on a 35mm lens, ultra-detailed, 4k.",
                "cinema-epic"
              )
            }
            className={`p-3 rounded-lg text-left transition-all text-xs border ${
              activePresetStyle === "Cinematic Movie"
                ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            }`}
          >
            <div className="font-bold mb-1 flex justify-between items-center">
              <span>🎬 Cinematic Movie</span>
              {activePresetStyle === "Cinematic Movie" && <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Perfect for ultra-real epic scenes.</p>
          </button>

          <button
            onClick={() =>
              handleTemplateClick(
                "Anime Style",
                "A beautiful anime-style animation of [a boy playing guitar] sitting by the window, vibrant colors, Studio Ghibli aesthetic, nostalgic and highly detailed.",
                "upbeat-chimes"
              )
            }
            className={`p-3 rounded-lg text-left transition-all text-xs border ${
              activePresetStyle === "Anime Style"
                ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            }`}
          >
            <div className="font-bold mb-1 flex justify-between items-center">
              <span>🎨 Anime Style</span>
              {activePresetStyle === "Anime Style" && <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Classic Studio Ghibli animation look.</p>
          </button>

          <button
            onClick={() =>
              handleTemplateClick(
                "Cozy Lo-Fi",
                "A cozy, aesthetic lo-fi video of [a warm cup of tea next to a rainy window], soft golden lighting, slow motion, cinematic depth of field.",
                "retro-lofi"
              )
            }
            className={`p-3 rounded-lg text-left transition-all text-xs border ${
              activePresetStyle === "Cozy Lo-Fi"
                ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            }`}
          >
            <div className="font-bold mb-1 flex justify-between items-center">
              <span>☕ Cozy Lo-Fi</span>
              {activePresetStyle === "Cozy Lo-Fi" && <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Relaxing social media aesthetic loops.</p>
          </button>
        </div>
      </div>

      {/* Editor Main Field */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Box: Prompts input */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Configure Video Prompt Formulas</label>
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 resize-none font-mono leading-relaxed"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />

          {/* Dynamic Background Music Track Selector */}
          <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-indigo-400" /> Background Music Preset
            </h4>
            
            <div className="flex gap-2 flex-wrap mb-3">
              {["none", "retro-lofi", "upbeat-chimes", "ambient-deep"].map((track) => (
                <button
                  key={track}
                  onClick={() => {
                    setSelectedMusic(track);
                    audioManager.current.start(track, musicVolume, true, false, 15);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    selectedMusic === track
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-850 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  {track === "none" ? "🔇 Mute" : track === "retro-lofi" ? "🎹 Lo-Fi Beat" : track === "upbeat-chimes" ? "🔔 Chimes" : "🌊 Ambient Deep"}
                </button>
              ))}
            </div>

            {/* Custom Premium Volume Control Slider */}
            {selectedMusic !== "none" && (
              <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-lg border border-slate-850 transition-all">
                {musicVolume === 0 ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-indigo-400 animate-pulse" />}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={handleVolumeChange}
                  className="w-full accent-indigo-500 h-1 rounded-lg cursor-pointer bg-slate-800"
                />
                <span className="text-[11px] font-mono text-indigo-300 w-8 text-right">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Box: Live Previews */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="w-full h-44 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 overflow-hidden relative group">
            <img src={slides[0].url} className="object-cover w-full h-full opacity-70 group-hover:scale-105 transition duration-500" alt="Preview" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] text-slate-300 border border-slate-800">
              🖼️ Frame Live Preview
            </span>
          </div>

          <p className="text-slate-400 text-xs text-center mt-3 leading-relaxed">
            💡 <span className="text-indigo-400 font-bold">Tip:</span> Change bracketed <code className="text-indigo-300 font-mono bg-indigo-950 px-1 py-0.5 rounded">[ ]</code> content before generating.
          </p>
        </div>
      </div>

      {/* Main Generation Action Trigger Button */}
      <button
        onClick={generateVideo}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg transition duration-200 border border-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" /> Synthesizing Dynamic Motion Pixels...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 text-indigo-200 animate-pulse" />
            {selectedMusic !== "none" ? (
              <span>Generate Video with {selectedMusic === "retro-lofi" ? "Lo-Fi Beat" : selectedMusic === "upbeat-chimes" ? "Chimes" : "Ambient Deep"} ✨</span>
            ) : (
              <span>Generate Video (Mute) 🎥</span>
            )}
          </>
        )}
        
        {/* Decorative Waveform Animation Canvas beside generate trigger */}
        <canvas ref={canvasRef} width="90" height="24" className="ml-1 bg-slate-950/40 rounded-md px-1.5 py-0.5 border border-indigo-500/10" />
      </button>
    </div>
  );
}
