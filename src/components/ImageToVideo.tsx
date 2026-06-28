import React, { useState, useEffect, useRef, useCallback } from "react";
import { User } from "firebase/auth";
import { uploadFileToDrive } from "../lib/drive";
import { triggerFileDownload } from "../lib/download";
import { motion, AnimatePresence } from "motion/react";
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
  Sliders,
  Scissors
} from "lucide-react";

interface ImageSlide {
  id: string;
  url: string;
  name: string;
  duration: number; // in seconds
  text: string;
  textAnimation: "typewriter" | "fade" | "pop" | "slide-up" | "none";
  filter: "normal" | "noir" | "vintage" | "cinematic-warm" | "cyberpunk" | "vhs" | "retro";
  scaleStart: number;
  scaleEnd: number;
  // AI Prompt generator fields
  promptDuration?: number; // 2-5 seconds
  cameraMovement?: string;
  subjectDescription?: string;
  style?: string;
  transitionEffect?: string;
  lightingType?: string;
  motionSpeed?: number; // motion speed / factor
}

interface ImageToVideoProps {
  user: User | null;
  accessToken: string | null;
  onRefreshDrive: () => void;
  onLogin: () => Promise<void>;
}

// 4 high-fidelity synthesized soundtracks using Web Audio API
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

  constructor() {}

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
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

  public start(
    track: string,
    volume: number = 0.3,
    fadeIn: boolean = false,
    fadeOut: boolean = false,
    totalDuration: number = 10
  ) {
    if (track === "none") {
      this.stop();
      return;
    }
    
    this.track = track;
    this.volume = volume;
    this.fadeIn = fadeIn;
    this.fadeOut = fadeOut;
    this.totalDuration = totalDuration;

    if (this.isPlaying) {
      this.stop();
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      
      this.gainNode = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (this.fadeIn) {
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + 1.5);
      } else {
        this.gainNode.gain.setValueAtTime(this.volume, now);
      }

      if (this.fadeOut && this.totalDuration > 1.5) {
        const fadeStartTime = now + this.totalDuration - 1.5;
        this.gainNode.gain.setValueAtTime(this.volume, fadeStartTime);
        this.gainNode.gain.linearRampToValueAtTime(0.0001, now + this.totalDuration);
      }

      // Create AnalyserNode for audio visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isPlaying = true;
      this.beatCount = 0;

      if (track === "retro-lofi") {
        this.bpm = 85;
      } else if (track === "upbeat-chimes") {
        this.bpm = 115;
      } else if (track === "ambient-deep") {
        this.bpm = 60;
      } else if (track === "cyberpunk") {
        this.bpm = 125;
      } else if (track === "dream-pop") {
        this.bpm = 100;
      } else if (track === "retro-arcade") {
        this.bpm = 130;
      } else if (track === "tech-house") {
        this.bpm = 124;
      } else if (track === "cinema-epic") {
        this.bpm = 75;
      }

      const beatInterval = 60000 / this.bpm / 2; // Eighth notes
      const scheduleNextBeats = () => {
        if (!this.isPlaying) return;
        this.playBeat();
        this.beatCount++;
        this.timer = setTimeout(scheduleNextBeats, beatInterval);
      };

      scheduleNextBeats();
    } catch (e) {
      console.warn("Failed to initialize synth soundtrack:", e);
    }
  }

  public getDestination(): MediaStreamAudioDestinationNode | null {
    if (!this.ctx) return null;
    try {
      const dest = this.ctx.createMediaStreamDestination();
      if (this.gainNode) {
        this.gainNode.connect(dest);
      }
      return dest;
    } catch (e) {
      console.error("Failed to create media stream audio destination", e);
      return null;
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Stop all active scheduled sounds
    this.scheduledOscillators.forEach(({ osc, stopTime }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.scheduledOscillators = [];

    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.gainNode = null;
    this.analyser = null;
  }

  private playBeat() {
    if (!this.ctx || !this.gainNode) return;
    const time = this.ctx.currentTime;

    const step = this.beatCount % 16;

    if (this.track === "retro-lofi") {
      // Warm chords (every 4 beats / 8 steps)
      if (step === 0 || step === 8) {
        // Cmaj7 (step 0), Am7 (step 8)
        const chord = step === 0 ? [130.81, 164.81, 196.00, 246.94] : [110.00, 130.81, 164.81, 196.00];
        chord.forEach((freq) => {
          this.playSynthNote(freq, 1.8, 0.04, "triangle", 0.05);
        });
      }

      // Soft rim shot drum beat (steps 4, 12)
      if (step === 4 || step === 12) {
        this.playNoisePerc(0.12, 0.02, 0.01);
      }

      // Soft kick (step 0, 8, 10, 14)
      if (step === 0 || step === 8 || step === 10 || step === 14) {
        this.playDrumKick(85, 0.15, 0.06);
      }

      // Lofi high-end chimes
      if (step === 2 || step === 6 || step === 10 || step === 13) {
        const melodies = [329.63, 392.00, 440.00, 523.25];
        const freq = melodies[Math.floor(Math.sin(step) * 2 + 2)];
        this.playSynthNote(freq, 0.3, 0.02, "sine", 0.08);
      }
    } 
    else if (this.track === "upbeat-chimes") {
      // 4/4 Kick drum
      if (step % 4 === 0) {
        this.playDrumKick(100, 0.12, 0.08);
      }

      // Snare/Chirp on 4 and 12
      if (step === 4 || step === 12) {
        this.playNoisePerc(0.08, 0.05, 0.04);
      }

      // Upbeat Arpeggiator (pentatonic major scale C4 - D4 - E4 - G4 - A4 - C5)
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      // Play a lively melody
      const melodyPattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 2, 5, 4, 1, 3, 2];
      const freq = scale[melodyPattern[step] % scale.length];
      
      // Play eighth notes
      this.playSynthNote(freq, 0.22, 0.04, "sine", 0.02);
      
      // Added high harmony on step % 3 === 0
      if (step % 3 === 0) {
        const harmonyFreq = scale[(melodyPattern[step] + 2) % scale.length] * 2;
        this.playSynthNote(harmonyFreq, 0.15, 0.015, "sine", 0.01);
      }
    } 
    else if (this.track === "ambient-deep") {
      // Long beautiful ocean drone swept oscillator
      if (step === 0) {
        // E2 chord sweeps
        const chord = [82.41, 123.47, 164.81, 220.00];
        chord.forEach((freq) => {
          this.playSynthNote(freq, 4.0, 0.05, "sine", 0.5);
        });
      }

      // Soft water bubbles sound randomly
      if (Math.random() > 0.6) {
        const freq = 600 + Math.random() * 800;
        this.playBubble(freq, 0.2, 0.01);
      }

      // Slow deep ambient sub heartbeat on 0 and 8
      if (step === 0 || step === 8) {
        this.playDrumKick(55, 0.4, 0.07);
      }
    } 
    else if (this.track === "cyberpunk") {
      // Heavy filter-swept synth bassline
      const bassNotes = [55.00, 55.00, 65.41, 65.41, 73.42, 73.42, 82.41, 82.41]; // A1, C2, D2, E2 notes
      const freq = bassNotes[Math.floor(step / 2) % bassNotes.length];
      
      // Pulsating bass beats
      this.playSynthNote(freq, 0.2, 0.12, "sawtooth", 0.02);
      this.playSynthNote(freq * 2, 0.2, 0.04, "triangle", 0.02); // Harmonized octane

      // Industrial kick
      if (step % 4 === 0) {
        this.playDrumKick(120, 0.16, 0.12);
      }

      // Metallic high-frequency sizzle snare on 4 and 12
      if (step === 4 || step === 12) {
        this.playNoisePerc(0.18, 0.12, 0.01);
        this.playSynthNote(880, 0.1, 0.03, "square", 0.01);
      }

      // Retro lead lasers
      if (step === 3 || step === 7 || step === 11 || step === 15) {
        const laserFreq = step === 15 ? 440 : 587.33;
        this.playLaser(laserFreq, 0.15, 0.03);
      }
    }
    else if (this.track === "dream-pop") {
      // Soft pads on 0 and 8
      if (step === 0 || step === 8) {
        const chord = step === 0 ? [174.61, 220.00, 261.63, 329.63] : [196.00, 246.94, 293.66, 329.63]; // Fmaj7, G6
        chord.forEach((freq) => {
          this.playSynthNote(freq, 2.5, 0.06, "triangle", 0.4);
        });
      }
      // Bubbling echoing melody
      if (step % 2 === 1) {
        const melodies = [392.00, 440.00, 493.88, 587.33, 659.25];
        const freq = melodies[(step * 3) % melodies.length];
        this.playSynthNote(freq, 0.4, 0.03, "sine", 0.08);
      }
      // Warm kick
      if (step === 0 || step === 8 || step === 12) {
        this.playDrumKick(90, 0.18, 0.08);
      }
    }
    else if (this.track === "retro-arcade") {
      // Bouncing square bass
      const bassFreqs = [110.00, 110.00, 82.41, 82.41, 87.31, 87.31, 98.00, 98.00]; // A2, E2, F2, G2
      const bass = bassFreqs[Math.floor(step / 2) % bassFreqs.length];
      this.playSynthNote(bass, 0.15, 0.07, "square", 0.01);

      // Fast arcade melody
      if (step % 2 === 0) {
        const melodies = [523.25, 587.33, 659.25, 783.99, 880.00];
        const freq = melodies[(step + 4) % melodies.length];
        this.playSynthNote(freq, 0.12, 0.04, "square", 0.005);
      }
      // 8-bit noise drum
      if (step % 4 === 0) {
        this.playNoisePerc(0.06, 0.08, 0.1);
      }
    }
    else if (this.track === "tech-house") {
      // Four on the floor kick
      if (step % 4 === 0) {
        this.playDrumKick(130, 0.12, 0.15);
      }
      // Offbeat highhat white noise
      if (step % 4 === 2) {
        this.playNoisePerc(0.04, 0.12, 0.9);
      }
      // Sawtooth chord stab with quick decay
      if (step === 3 || step === 7 || step === 11 || step === 15) {
        const chord = [146.83, 174.61, 220.00, 293.66]; // Dm7
        chord.forEach((freq) => {
          this.playSynthNote(freq, 0.15, 0.05, "sawtooth", 0.01);
        });
      }
    }
    else if (this.track === "cinema-epic") {
      // Slow dark brass stabs
      if (step === 0 || step === 8) {
        const chord = [73.42, 110.00, 146.83]; // D2, A2, D3
        chord.forEach((freq) => {
          this.playSynthNote(freq, 3.5, 0.14, "sawtooth", 0.5);
          this.playSynthNote(freq * 1.5, 3.5, 0.09, "triangle", 0.5);
        });
        // Giant sub heartbeat
        this.playDrumKick(45, 0.6, 0.3);
      }
      // Ethereal high strings swell
      if (step === 4 || step === 12) {
        const highChord = [440.00, 554.37, 659.25]; // A4 major
        highChord.forEach((freq) => {
          this.playSynthNote(freq, 2.0, 0.04, "sine", 0.8);
        });
      }
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
    g.connect(this.gainNode);

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
    g.connect(this.gainNode);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);

    this.scheduledOscillators.push({ osc, stopTime: this.ctx.currentTime + duration });
  }

  private playNoisePerc(duration: number, volume: number, bandFreq: number = 0.01) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000 + bandFreq * 4000;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.gainNode);

    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + duration);
  }

  private playBubble(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 2.2, this.ctx.currentTime + duration);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.gainNode);

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
    g.connect(this.gainNode);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);

    this.scheduledOscillators.push({ osc, stopTime: this.ctx.currentTime + duration });
  }
}

const SAMPLE_SLIDES: ImageSlide[] = [
  {
    id: "sample-1",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    name: "Golden Coast Beach.jpg",
    duration: 3,
    text: "Sunrise Golden Coast",
    textAnimation: "typewriter",
    filter: "cinematic-warm",
    scaleStart: 1.0,
    scaleEnd: 1.15,
    promptDuration: 3,
    cameraMovement: "Slow Zoom",
    subjectDescription: "gentle waves crashing on the shore",
    style: "Cinematic"
  },
  {
    id: "sample-2",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
    name: "Alpine Pines.jpg",
    duration: 3,
    text: "Breathe in Alpine Freshness",
    textAnimation: "fade",
    filter: "vintage",
    scaleStart: 1.2,
    scaleEnd: 1.05,
    promptDuration: 4,
    cameraMovement: "Pan Left",
    subjectDescription: "mist floating through the trees",
    style: "Dreamy"
  },
  {
    id: "sample-3",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop",
    name: "Emerald Lake.jpg",
    duration: 3,
    text: "Reflections on Emerald Lake",
    textAnimation: "pop",
    filter: "retro",
    scaleStart: 1.05,
    scaleEnd: 1.2,
    promptDuration: 3,
    cameraMovement: "Slow Zoom",
    subjectDescription: "ripples on the crystal water",
    style: "Realistic"
  },
  {
    id: "sample-4",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop",
    name: "Forest Path.jpg",
    duration: 3,
    text: "The Scenic Forest Trail",
    textAnimation: "slide-up",
    filter: "normal",
    scaleStart: 1.15,
    scaleEnd: 1.0,
    promptDuration: 5,
    cameraMovement: "Pan Right",
    subjectDescription: "sunbeams filtering through the autumn leaves",
    style: "Cinematic"
  }
];

interface SoundtrackItem {
  id: string;
  name: string;
  bpm: number;
  emoji: string;
  genre: string;
  desc: string;
}

const SOUNDTRACK_LIBRARY: SoundtrackItem[] = [
  { id: "retro-lofi", name: "Soft Retro Lofi", bpm: 85, emoji: "🎧", genre: "Lofi Hip-Hop", desc: "Warm relaxing chord sweeps with soft rim shots and ambient vinyl crackle beats." },
  { id: "upbeat-chimes", name: "Upbeat Major Chimes", bpm: 115, emoji: "🔔", genre: "Ambient Pop", desc: "Bright major scale pentatonic arpeggios with positive chiptune percussion layers." },
  { id: "dream-pop", name: "Dream Pop Synthwave", bpm: 100, emoji: "✨", genre: "Dreamwave", desc: "Ethereal floating analog synth pads with sweet bubbling echo melodies." },
  { id: "ambient-deep", name: "Deep Blue Ambient", bpm: 60, emoji: "🌊", genre: "Ambient Drone", desc: "Immersion drone waves with underwater bubble pops and sub heartbeat kicks." },
  { id: "cyberpunk", name: "Cyberpunk Industrial", bpm: 125, emoji: "🎸", genre: "Synth Bass", desc: "Pulsating heavy sawtooth bass, high-frequency metallic sizzles, and retro lasers." },
  { id: "tech-house", name: "Ibiza Tech House", bpm: 124, emoji: "🕺", genre: "Electronic", desc: "Four-on-the-floor pumping kick drums with offbeat high-hats and tech stab chords." },
  { id: "cinema-epic", name: "Cinematic Epic", bpm: 75, emoji: "🎻", genre: "Orchestral", desc: "Dramatic slow-brass chords, giant sub heartbeat impact drums, and high strings." },
  { id: "none", name: "Silent Video File", bpm: 0, emoji: "🔇", genre: "Mute", desc: "Deactivate all live synthesis. Export your final video clip with no sound track." }
];

export default function ImageToVideo({
  user,
  accessToken,
  onRefreshDrive,
  onLogin
}: ImageToVideoProps) {
  const [slides, setSlides] = useState<ImageSlide[]>(() => {
    try {
      const saved = localStorage.getItem("toolkit-pro-img2vid-slides");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return SAMPLE_SLIDES;
  });

  const [soundtrack, setSoundtrack] = useState<string>("retro-lofi");
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.3);
  const [audioFadeIn, setAudioFadeIn] = useState<boolean>(true);
  const [audioFadeOut, setAudioFadeOut] = useState<boolean>(true);
  const [transitionStyle, setTransitionStyle] = useState<"fade" | "slide-left" | "slide-right" | "zoom" | "flash" | "none">("fade");
  const [transitionDuration, setTransitionDuration] = useState<number>(0.6);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedSlideId, setSelectedSlideId] = useState<string>(slides[0]?.id || "");

  // Export states
  const [exportFileName, setExportFileName] = useState<string>("CapCut_Styled_Video");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [saveToDriveAfterExport, setSaveToDriveAfterExport] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; sub: string; success: boolean } | null>(null);
  
  // AI Prompt Builder states
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Final video rendering preview states
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [showFinalOutput, setShowFinalOutput] = useState<boolean>(false);

  // HTML canvas & Audio management refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackIntervalRef = useRef<any>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const synthManagerRef = useRef<RoyaltyFreeSynthManager>(new RoyaltyFreeSynthManager());
  const canvasWidth = 800; // base rendering height matches aspect ratios
  const totalDuration = slides.reduce((acc, curr) => acc + curr.duration, 0);
  
  // Save slides to localStorage
  useEffect(() => {
    localStorage.setItem("toolkit-pro-img2vid-slides", JSON.stringify(slides));
    if (slides.length > 0 && !slides.some(s => s.id === selectedSlideId)) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides]);

  // Audio mute & mix sync
  useEffect(() => {
    if (isPlaying && !isMuted) {
      synthManagerRef.current.start(soundtrack, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
    } else {
      synthManagerRef.current.stop();
    }
  }, [isPlaying, soundtrack, isMuted, audioFadeIn, audioFadeOut, totalDuration]);

  // Dynamic live volume adjustments during playback
  useEffect(() => {
    synthManagerRef.current.setVolume(audioVolume);
  }, [audioVolume]);

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      synthManagerRef.current.stop();
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Cache/preload images
  const preloadSlideImages = useCallback(() => {
    slides.forEach((slide) => {
      if (!imageCacheRef.current[slide.id]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.src = slide.url;
        img.onload = () => {
          imageCacheRef.current[slide.id] = img;
        };
      }
    });
  }, [slides]);

  useEffect(() => {
    preloadSlideImages();
  }, [preloadSlideImages]);

  // Handle play/pause toggle
  const togglePlay = () => {
    if (slides.length === 0) return;
    if (previewingTrack) {
      synthManagerRef.current.stop();
      setPreviewingTrack(null);
    }
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      synthManagerRef.current.stop();
    } else {
      setIsPlaying(true);
      const stepMs = 50; // 20 frames per second preview
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          let next = prev + stepMs / 1000;
          if (next >= totalDuration) {
            next = 0; // loop back to start
          }
          return next;
        });
      }, stepMs);
      playbackIntervalRef.current = interval;
      
      if (!isMuted) {
        synthManagerRef.current.start(soundtrack, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPreviewingTrack(null);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    setCurrentTime(0);
    synthManagerRef.current.stop();
  };

  // Pre-seed sample list
  const loadDefaultSampleSlides = () => {
    setSlides(SAMPLE_SLIDES);
    setCurrentTime(0);
    triggerBeepChime();
  };

  const triggerBeepChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  // File picker handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesUploaded = e.target.files;
    if (!filesUploaded) return;

    const newSlides: ImageSlide[] = [];
    (Array.from(filesUploaded) as File[]).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const urlStr = event.target.result as string;
          const slide: ImageSlide = {
            id: `uploaded-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            url: urlStr,
            name: file.name,
            duration: 3,
            text: file.name.replace(/\.[^/.]+$/, "").substring(0, 24),
            textAnimation: "typewriter",
            filter: "normal",
            scaleStart: 1.0,
            scaleEnd: 1.15,
            promptDuration: 3,
            cameraMovement: "Slow Zoom",
            subjectDescription: "",
            style: "Cinematic"
          };
          setSlides((prev) => [...prev, slide]);
        }
      };
      reader.readAsDataURL(file);
    });
    triggerBeepChime();
  };

  // Delete slide
  const deleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
    triggerBeepChime();
  };

  // Update slide property
  const updateSlideProp = (id: string, prop: keyof ImageSlide, value: any) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [prop]: value } : s))
    );
  };

  const handleEnhanceSubject = async (slideId: string, currentSubject: string, style: string, camera: string) => {
    if (!currentSubject.trim()) {
      setToastMessage({
        text: "Please type a simple subject first",
        sub: "We need some keywords to enhance your description!",
        success: false
      });
      return;
    }
    
    setIsEnhancingPrompt(true);
    try {
      const response = await fetch("/api/video/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: currentSubject, style, camera })
      });
      
      if (!response.ok) {
        throw new Error("Failed to enhance prompt from server side");
      }
      
      const data = await response.json();
      if (data && data.enhancedSubject) {
        updateSlideProp(slideId, "subjectDescription", data.enhancedSubject);
        setToastMessage({
          text: "✨ Description Enhanced!",
          sub: "Gemini expanded your subject with professional details.",
          success: true
        });
        triggerBeepChime();
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        text: "Enhancement failed",
        sub: err.message || "Something went wrong. Please try again.",
        success: false
      });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Reordering helpers
  const moveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSlides(updated);
    triggerBeepChime();
  };

  // Render logic on HTML Canvas
  const drawVideoFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    if (slides.length === 0) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Upload or Preload images to create video!", width / 2, height / 2);
      return;
    }

    // Determine current slide and next slide based on playback time
    let cumulativeTime = 0;
    let currentSlideIndex = 0;
    
    for (let i = 0; i < slides.length; i++) {
      if (time >= cumulativeTime && time < cumulativeTime + slides[i].duration) {
        currentSlideIndex = i;
        break;
      }
      cumulativeTime += slides[i].duration;
    }

    const slide = slides[currentSlideIndex];
    const slideLocalTime = time - cumulativeTime;
    const slideProgress = slideLocalTime / slide.duration;

    // Check if we are inside a transition boundary
    // Transition happens in the first `transitionDuration` seconds of Slide N
    const isTransitioning = currentSlideIndex > 0 && slideLocalTime < transitionDuration && transitionStyle !== "none";
    
    const drawSlideWithTransformAndFilter = (
      targetSlide: ImageSlide,
      localProgress: number,
      alpha: number,
      offsetProgress: number = 0 // for horizontal sliding offset
    ) => {
      const img = imageCacheRef.current[targetSlide.id];
      if (!img) {
        // Fallback placeholder while preloading
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Loading slide...", width / 2, height / 2);
        return;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Apply Filter Presets
      if (targetSlide.filter === "noir") {
        ctx.filter = "grayscale(100%) contrast(120%)";
      } else if (targetSlide.filter === "vintage") {
        ctx.filter = "sepia(50%) contrast(90%) brightness(105%)";
      } else if (targetSlide.filter === "cinematic-warm") {
        ctx.filter = "sepia(20%) saturate(135%) hue-rotate(-10deg) contrast(110%)";
      } else if (targetSlide.filter === "cyberpunk") {
        ctx.filter = "hue-rotate(185deg) saturate(180%) contrast(125%)";
      } else if (targetSlide.filter === "vhs") {
        ctx.filter = "contrast(112%) saturate(125%) hue-rotate(5deg) brightness(98%)";
      } else if (targetSlide.filter === "retro") {
        ctx.filter = "sepia(42%) saturate(108%) contrast(95%)";
      } else {
        ctx.filter = "none";
      }

      // Slide Transitions Positioning
      let slideX = 0;
      let slideY = 0;
      if (isTransitioning) {
        if (transitionStyle === "slide-left") {
          // Slide in from right (offsetProgress is progress, 0 means previous slide, 1 means current slide)
          // current slide slides from width to 0, previous slides from 0 to -width
          if (targetSlide.id === slide.id) {
            slideX = width * (1 - offsetProgress);
          } else {
            slideX = -width * offsetProgress;
          }
        } else if (transitionStyle === "slide-right") {
          if (targetSlide.id === slide.id) {
            slideX = -width * (1 - offsetProgress);
          } else {
            slideX = width * offsetProgress;
          }
        }
      }

      // Ken Burns dynamic Pan & Zoom
      const currentScale = targetSlide.scaleStart + (targetSlide.scaleEnd - targetSlide.scaleStart) * localProgress;
      
      // Clear bounds inside aspect-ratio letterboxing
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Draw Image cropped to fill / fit the aspect ratio with dynamic scale
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      
      let renderWidth = width;
      let renderHeight = height;

      if (imgRatio > canvasRatio) {
        renderWidth = height * imgRatio;
      } else {
        renderHeight = width / imgRatio;
      }

      const drawX = (width - renderWidth) / 2 + slideX;
      const drawY = (height - renderHeight) / 2 + slideY;

      // Transform with scale centered in canvas
      ctx.translate(width / 2 + slideX, height / 2 + slideY);
      ctx.scale(currentScale, currentScale);
      
      ctx.drawImage(
        img,
        -renderWidth / 2,
        -renderHeight / 2,
        renderWidth,
        renderHeight
      );

      ctx.restore();

      // Custom glitch line overlay for VHS
      if (targetSlide.filter === "vhs") {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 255, 0.12)";
        ctx.lineWidth = 2;
        const scanlineY = (time * 150) % height;
        ctx.beginPath();
        ctx.moveTo(0, scanlineY);
        ctx.lineTo(width, scanlineY);
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.moveTo(0, (scanlineY + 50) % height);
        ctx.lineTo(width, (scanlineY + 50) % height);
        ctx.stroke();
        ctx.restore();
      }
    };

    // Execute drawing layers
    if (isTransitioning) {
      const prevSlide = slides[currentSlideIndex - 1];
      const transProgress = slideLocalTime / transitionDuration;

      if (transitionStyle === "fade") {
        // Double rendering blend
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
      } 
      else if (transitionStyle === "slide-left" || transitionStyle === "slide-right") {
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0, transProgress);
        drawSlideWithTransformAndFilter(slide, slideProgress, 1.0, transProgress);
      } 
      else if (transitionStyle === "zoom") {
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        // Overlay growing current slide zoom in
        const zoomFactor = 0.6 + transProgress * 0.4;
        ctx.scale(zoomFactor, zoomFactor);
        ctx.translate(-width / 2, -height / 2);
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
        ctx.restore();
      } 
      else if (transitionStyle === "flash") {
        // Blend to white first half, blend from white second half
        if (transProgress < 0.5) {
          const partProgress = transProgress * 2;
          drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0);
          ctx.fillStyle = `rgba(255, 255, 255, ${partProgress * 0.85})`;
          ctx.fillRect(0, 0, width, height);
        } else {
          const partProgress = (transProgress - 0.5) * 2;
          drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
          ctx.fillStyle = `rgba(255, 255, 255, ${(1 - partProgress) * 0.85})`;
          ctx.fillRect(0, 0, width, height);
        }
      }
    } else {
      // Standard static slide display
      drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
    }

    // DRAW OVERLAY CAPTIONS / SUBTITLE TEXT with selected animation
    if (slide.text.trim()) {
      ctx.save();

      // Configure font based on aspect ratio sizing
      const textRatioScale = width / 800;
      const fontSize = Math.round(28 * textRatioScale);
      ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      let textToShow = slide.text;
      let textAlpha = 1.0;
      let offsetY = 0;
      let textScale = 1.0;

      // Handle custom text entry animation loops
      if (slide.textAnimation === "typewriter") {
        const charCount = Math.floor(slide.text.length * Math.min(1, slideProgress * 2));
        textToShow = slide.text.substring(0, charCount);
      } else if (slide.textAnimation === "fade") {
        if (slideProgress < 0.2) {
          textAlpha = slideProgress / 0.2;
        } else if (slideProgress > 0.8) {
          textAlpha = (1 - slideProgress) / 0.2;
        }
      } else if (slide.textAnimation === "pop") {
        if (slideProgress < 0.15) {
          textScale = 0.7 + (slideProgress / 0.15) * 0.3;
        }
      } else if (slide.textAnimation === "slide-up") {
        if (slideProgress < 0.25) {
          const anim = 1 - (slideProgress / 0.25);
          offsetY = 25 * anim;
          textAlpha = slideProgress / 0.25;
        }
      }

      ctx.globalAlpha = textAlpha;

      const paddingX = 22;
      const paddingY = 10;
      const textMetrics = ctx.measureText(textToShow);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      const rectWidth = textWidth + paddingX * 2;
      const rectHeight = textHeight + paddingY * 2;
      const rectX = (width - rectWidth) / 2;
      const rectY = height - rectHeight - Math.round(45 * textRatioScale) + offsetY;

      // Draw stylized backdrop pill (accessibility friendly)
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      // Rounded corner pill
      const radius = 12;
      ctx.roundRect(rectX, rectY, rectWidth, rectHeight, radius);
      ctx.fill();

      // Double styled border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render actual Caption Text
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Draw scaling text
      if (textScale !== 1.0) {
        ctx.translate(width / 2, rectY + rectHeight / 2);
        ctx.scale(textScale, textScale);
        ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
      } else {
        ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
      }

      ctx.restore();
    }

    // Watermark overlay
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.round(11 * (width/800))}px sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText("ToolkitPro CapCut Studio", width - 15, 25);
    ctx.restore();
  }, [slides, transitionStyle, transitionDuration]);

  // Hook rendering logic to active timeline time changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust canvas layout size based on ratios
    let height = 450;
    if (aspectRatio === "9:16") {
      height = Math.round(canvasWidth * (16 / 9)); // 800 x 1422
    } else if (aspectRatio === "1:1") {
      height = canvasWidth; // 800 x 800
    }

    canvas.width = canvasWidth;
    canvas.height = height;

    drawVideoFrame(ctx, canvasWidth, height, currentTime);
  }, [currentTime, aspectRatio, slides, transitionStyle, transitionDuration, drawVideoFrame]);

  // Canvas MediaRecorder video render engine
  const handleCreateVideo = async () => {
    if (slides.length === 0) return;
    
    // Reset previous export states
    setExportedVideoUrl(null);
    setExportedVideoBlob(null);
    setShowFinalOutput(false);

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("Initializing audio tracks and pre-rendering visuals...");

    // Stop active music playbacks
    synthManagerRef.current.stop();
    setIsPlaying(false);

    try {
      const renderCanvas = document.createElement("canvas");
      let height = 450;
      if (aspectRatio === "9:16") {
        height = Math.round(canvasWidth * (16 / 9));
      } else if (aspectRatio === "1:1") {
        height = canvasWidth;
      }
      renderCanvas.width = canvasWidth;
      renderCanvas.height = height;
      const renderCtx = renderCanvas.getContext("2d");
      if (!renderCtx) throw new Error("Could not initialize 2D render context");

      // Set up offscreen audio synthesis to record sound synced with frame capture
      const renderSynthManager = new RoyaltyFreeSynthManager();
      let renderAudioStream: MediaStream | null = null;
      
      // Connect synthesis directly to our render stream destination node
      // We will manually trigger synth beats or start synth normally
      if (soundtrack !== "none" && !isMuted) {
        renderSynthManager.start(soundtrack);
        // Re-route its audio destination output to our stream recorder
        const renderDest = renderSynthManager.getDestination();
        if (renderDest) {
          renderAudioStream = renderDest.stream;
        }
      }

      const canvasStream = renderCanvas.captureStream(30); // 30 FPS high fidelity video capture
      const combinedTracks = [...canvasStream.getVideoTracks()];

      if (soundtrack !== "none" && !isMuted && renderAudioStream) {
        combinedTracks.push(...renderAudioStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(combinedTracks);
      
      // Determine support options
      let options = { mimeType: "video/webm;codecs=vp8,opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm" };
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const fps = 30;
      const totalFrames = Math.round(totalDuration * fps);
      let currentFrame = 0;

      mediaRecorder.start();

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          setExportProgress(90);
          setExportStatus("Assembling raw multimedia files...");
          setTimeout(() => {
            mediaRecorder.stop();
          }, 400);
          return;
        }

        const renderTime = currentFrame / fps;
        drawVideoFrame(renderCtx, canvasWidth, height, renderTime);
        
        currentFrame++;
        const percent = Math.round((currentFrame / totalFrames) * 80); // Up to 80%
        setExportProgress(percent);
        setExportStatus(`Compiling frame ${currentFrame} of ${totalFrames} (${Math.round((currentFrame/totalFrames)*100)}%)...`);
        
        requestAnimationFrame(renderNextFrame);
      };

      // Trigger asynchronous recursive rendering loop
      requestAnimationFrame(renderNextFrame);

      mediaRecorder.onstop = async () => {
        setExportStatus("Exporting video track blob...");
        renderSynthManager.stop();

        const videoBlob = new Blob(chunks, { type: "video/webm" });
        const videoNameWithExtension = `${exportFileName.replace(/\s+/g, "_")}.webm`;
        triggerFileDownload(videoBlob, videoNameWithExtension);

        // Generate URL for local preview of compiled WebM
        const videoUrl = URL.createObjectURL(videoBlob);
        setExportedVideoUrl(videoUrl);
        setExportedVideoBlob(videoBlob);
        setShowFinalOutput(true);

        setExportProgress(100);
        setIsExporting(false);

        // Google Drive sync option
        if (saveToDriveAfterExport && accessToken) {
          setExportProgress(95);
          setExportStatus("Uploading generated WebM to Google Drive storage...");
          try {
            // Convert video blob to dataUrl
            const fileReader = new FileReader();
            fileReader.readAsDataURL(videoBlob);
            fileReader.onloadend = async () => {
              try {
                const base64DataUrl = fileReader.result as string;
                await uploadFileToDrive(
                  accessToken,
                  videoNameWithExtension,
                  "video/webm",
                  base64DataUrl
                );
                
                onRefreshDrive();
                setToastMessage({
                  text: "Export & Sync Completed!",
                  sub: `Generated video successfully downloaded and backed up to Google Drive as ${videoNameWithExtension}`,
                  success: true
                });
              } catch (err) {
                console.error(err);
                setToastMessage({
                  text: "Video Downloaded Offline Only",
                  sub: `Completed video download but Google Drive sync failed: ${err instanceof Error ? err.message : String(err)}`,
                  success: false
                });
              }
            };
          } catch (e) {
            console.error(e);
          }
        } else {
          setToastMessage({
            text: "Video Exported Successfully!",
            sub: `Downloaded ${videoNameWithExtension} directly to your device. Standard CapCut WebM format.`,
            success: true
          });
        }

        // Dispatch a global activities widget trace
        window.dispatchEvent(
          new CustomEvent("toolkit-add-activity", {
            detail: {
              type: "file",
              title: "Exported CapCut Video",
              detail: `Generated '${videoNameWithExtension}' containing ${slides.length} styled image tracks`,
              icon: "Video",
              tab: "video"
            }
          })
        );
      };

    } catch (e: any) {
      console.error(e);
      setExportStatus("Export failed!");
      setIsExporting(false);
      setToastMessage({
        text: "Media Export Failed",
        sub: e?.message || "Verify your browser is fully compliant with canvas recording formats.",
        success: false
      });
    }
  };

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  return (
    <div className="font-sans space-y-6" id="capcut-studio-root">
      
      {/* Toast Alert messages popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-2xl border shadow-xl flex items-start gap-3 select-none ${
              toastMessage.success
                ? "bg-emerald-50 dark:bg-emerald-955 border-emerald-200/50 text-emerald-900 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-955 border-rose-200/50 text-rose-900 dark:text-rose-300"
            }`}
          >
            <div className="p-1.5 rounded-full bg-white/40 dark:bg-black/20 shrink-0">
              {toastMessage.success ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h5 className="text-xs font-black uppercase tracking-wider">{toastMessage.text}</h5>
              <p className="text-[11px] leading-relaxed opacity-90">{toastMessage.sub}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[10px] font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Studio layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Video Canvas Viewer & Interactive Timeline Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span>Image to Video Creator</span>
              </h3>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-extrabold">
                Interactive CapCut-Style Timeline
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadDefaultSampleSlides}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-350 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/30 rounded-lg cursor-pointer transition-all hover:bg-indigo-100"
                title="Preload gorgeous landscape slides instantly to demo animations"
              >
                <Sparkles className="w-3 h-3 text-amber-500 animate-bounce" />
                <span>Preload Samples</span>
              </button>
            </div>
          </div>

          {/* Interactive Player Canvas Viewport */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-900 shadow-xl flex items-center justify-center min-h-[300px] xs:min-h-[380px] sm:min-h-[440px] group">
            
            {/* Real drawing Canvas */}
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[500px] shadow-2xl transition-all duration-300 ${
                aspectRatio === "9:16" ? "h-[450px] aspect-[9/16]" : aspectRatio === "1:1" ? "h-[360px] aspect-square" : "w-full aspect-[16/9]"
              } ${isExporting || showFinalOutput ? "hidden" : "block"}`}
            />

            {/* Simulated Live Loading / Processing Animation */}
            {isExporting && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-5 text-center select-none z-10 overflow-y-auto">
                <div className="w-full max-w-md space-y-4">
                  
                  {/* Glowing spinner visual */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 dark:border-indigo-400/5" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute w-14 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                      animate={{ y: [-24, 24, -24] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <Video className="w-6 h-6 text-indigo-400 animate-pulse relative z-10" />
                  </div>

                  {/* Rendering Details */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Compiling Master Video...</span>
                    </h3>
                    <p className="text-base font-black text-slate-100 font-mono tracking-tight">
                      {exportProgress}% Complete
                    </p>
                    <p className="text-[10.5px] text-slate-400 leading-normal italic px-4">
                      {exportStatus}
                    </p>
                  </div>

                  {/* Live Parameter Summary HUD */}
                  <div className="bg-slate-900/80 border border-slate-850 rounded-2xl p-3 text-left space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                        Selected Blueprint Parameters
                      </span>
                      <span className="text-[8px] bg-indigo-950/80 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest leading-none">
                        Active Build
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10.5px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block uppercase text-[8px] font-black tracking-wider leading-none mb-0.5">Aspect Ratio:</span>
                        <span className="font-bold truncate block">
                          {aspectRatio === "9:16" ? "📱 Portrait (9:16)" : aspectRatio === "1:1" ? "⏹️ Square (1:1)" : "📺 Landscape (16:9)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[8px] font-black tracking-wider leading-none mb-0.5">Duration:</span>
                        <span className="font-bold block truncate">⏱️ {totalDuration.toFixed(1)}s ({slides.length} slides)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[8px] font-black tracking-wider leading-none mb-0.5">Soundtrack:</span>
                        <span className="font-bold block truncate capitalize">🎵 {soundtrack === "none" ? "Silent" : soundtrack}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[8px] font-black tracking-wider leading-none mb-0.5">Transition:</span>
                        <span className="font-bold block truncate capitalize">🎬 {transitionStyle} ({transitionDuration}s)</span>
                      </div>
                    </div>

                    {/* Show selected slide AI prompter config */}
                    {slides.find(s => s.id === selectedSlideId) && (
                      <div className="pt-2 border-t border-slate-800/40 space-y-1">
                        <span className="text-slate-500 block uppercase text-[8px] font-black tracking-wider leading-none">
                          Current Focus Subject:
                        </span>
                        <p className="bg-slate-950/60 text-[10px] text-slate-300 italic p-1.5 rounded-lg border border-slate-800/50 leading-relaxed truncate">
                          "{slides.find(s => s.id === selectedSlideId)?.subjectDescription || "gentle waves crashing on the shore"}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progressive loading tracks */}
                  <div className="w-full space-y-1">
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Final Video Output Placeholder / Interactive Player */}
            {showFinalOutput && exportedVideoUrl && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-5 text-center z-10 overflow-y-auto">
                <div className="w-full max-w-md space-y-3.5">
                  
                  {/* Congratulations and actions bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                    <div className="text-left">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block leading-none">
                        Render Finished
                      </span>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Master Video Exported</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFinalOutput(false);
                        setExportedVideoUrl(null);
                        setExportedVideoBlob(null);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer select-none"
                    >
                      Back to Editor
                    </button>
                  </div>

                  {/* Main HTML5 Video Viewport Player */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-850 bg-slate-900 shadow-2xl flex items-center justify-center mx-auto"
                    style={{
                      maxHeight: "220px",
                      aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "1:1" ? "1/1" : "16/9"
                    }}
                  >
                    <video
                      src={exportedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Metadata and Stats Card */}
                  <div className="bg-slate-900/80 border border-slate-850 rounded-2xl p-2.5 text-left space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-800/40 pb-1.5">
                      <span className="text-slate-500 uppercase font-black tracking-wider text-[8px]">File details</span>
                      <span className="font-mono text-indigo-400 font-bold truncate max-w-[180px]">
                        {exportFileName}.webm
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/30">
                        <span className="text-slate-500 block uppercase text-[8px] font-black mb-0.5">File size</span>
                        <span className="font-bold font-mono text-slate-200">
                          {exportedVideoBlob ? (exportedVideoBlob.size / (1024 * 1024)).toFixed(2) : "0.00"} MB
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/30">
                        <span className="text-slate-500 block uppercase text-[8px] font-black mb-0.5">Duration</span>
                        <span className="font-bold font-mono text-slate-200">{totalDuration.toFixed(1)}s</span>
                      </div>
                      <div className="bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/30">
                        <span className="text-slate-500 block uppercase text-[8px] font-black mb-0.5">Container</span>
                        <span className="font-bold uppercase text-emerald-400">WEBM</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (exportedVideoBlob) {
                          const videoNameWithExtension = `${exportFileName.replace(/\s+/g, "_")}.webm`;
                          triggerFileDownload(exportedVideoBlob, videoNameWithExtension);
                          setToastMessage({
                            text: "📥 Downloading Video!",
                            sub: "Your high-fidelity masterwork file download has resumed.",
                            success: true
                          });
                        }
                      }}
                      className="py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 select-none shadow-md shadow-emerald-500/15"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFinalOutput(false);
                        setExportedVideoUrl(null);
                        setExportedVideoBlob(null);
                        setToastMessage({
                          text: "🔄 Editor Unlocked",
                          sub: "Ready to fine-tune overlays or camera motions.",
                          success: true
                        });
                      }}
                      className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 select-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-Edit Video</span>
                    </button>
                  </div>

                  {saveToDriveAfterExport && accessToken && (
                    <p className="text-[9px] text-emerald-400 font-bold flex items-center justify-center gap-1 leading-none bg-emerald-950/20 py-1.5 rounded-lg border border-emerald-900/30 select-none">
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Synced to Google Drive Storage!</span>
                    </p>
                  )}

                </div>
              </div>
            )}

            {/* Play/Pause state HUD Overlay */}
            {!isExporting && !showFinalOutput && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <motion.button
                  type="button"
                  className="w-16 h-16 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-650 dark:text-indigo-400 shadow-2xl flex items-center justify-center pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current shrink-0" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1 shrink-0" />
                  )}
                </motion.button>
              </div>
            )}

            {/* Simulated Live Audio Spectrum bar visuals inside viewport (retro chimes / cyberpunk lead bars) */}
            {!isExporting && !showFinalOutput && isPlaying && soundtrack !== "none" && !isMuted && (
              <div className="absolute bottom-3 left-4 flex items-end gap-0.5 h-6 opacity-80 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-emerald-500 to-indigo-400 rounded-full"
                    animate={{ height: [4, 16, 8, 22, 6, 12, 4][i % 7] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.4 + i * 0.1,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Scrubbable video progress timeline bar */}
          <div className="space-y-1.5 select-none">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span className="text-indigo-500">{currentTime.toFixed(2)}s</span>
              <span>{totalDuration.toFixed(1)}s Total</span>
            </div>
            
            <input
              type="range"
              min={0}
              max={totalDuration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => {
                setCurrentTime(parseFloat(e.target.value));
                if (isPlaying) {
                  // temporary pause to allow clean manual seeking
                  togglePlay();
                }
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-indigo-600 dark:accent-indigo-500 outline-none"
            />
          </div>

          {/* Timeline control row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className={`p-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isPlaying
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                title={isPlaying ? "Pause timeline preview" : "Play timeline preview"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-350 shrink-0"
                title="Rewind playhead to start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isMuted
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-450 border border-rose-200/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350"
                }`}
                title={isMuted ? "Unmute royalty-free loop synthesizers" : "Mute background soundtrack loops"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                Transitions:
              </span>
              <select
                value={transitionStyle}
                onChange={(e) => setTransitionStyle(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl shadow-3xs cursor-pointer outline-none"
              >
                <option value="fade">🎬 Cross Dissolve (Fade)</option>
                <option value="slide-left">⚡ Slide Left</option>
                <option value="slide-right">⚡ Slide Right</option>
                <option value="zoom">🔍 Scaling Zoom</option>
                <option value="flash">✨ Flash Transition</option>
                <option value="none">❌ Cut (No Transition)</option>
              </select>
            </div>
          </div>

          {/* Slides Storyboard (Drag-reorder simulation & selection list) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Storyboard Timeline ({slides.length} slides)</span>
              </h4>
              <p className="text-[10px] text-slate-400 italic">Select slides to configure filters & captions</p>
            </div>

            <div className="flex overflow-x-auto pb-2 scrollbar-thin gap-3.5" id="storyboard-slides-container">
              
              {/* File upload trigger box */}
              <label className="flex-none w-28 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 cursor-pointer flex flex-col items-center justify-center text-center p-2.5 transition-all text-slate-450 hover:text-indigo-600 bg-slate-50 dark:bg-slate-900/10">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 leading-none">Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Individual slides storyboard list */}
              {slides.map((slide, index) => {
                const isSelected = selectedSlideId === slide.id;
                return (
                  <div
                    key={slide.id}
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      // Jump playhead to start of selected slide
                      let jumpTime = 0;
                      for (let i = 0; i < index; i++) {
                        jumpTime += slides[i].duration;
                      }
                      setCurrentTime(jumpTime);
                    }}
                    className={`flex-none w-28 h-20 rounded-2xl relative overflow-hidden group cursor-pointer border shadow-sm transition-all flex flex-col justify-between p-1.5 select-none ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/30"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {/* Background image */}
                    <img
                      src={slide.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent z-10" />

                    {/* Top action row */}
                    <div className="relative z-20 flex justify-between w-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSlide(index, "up");
                          }}
                          className="p-1 rounded bg-slate-900/80 hover:bg-slate-900 text-white disabled:opacity-40 cursor-pointer"
                          title="Move Left"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={index === slides.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSlide(index, "down");
                          }}
                          className="p-1 rounded bg-slate-900/80 hover:bg-slate-900 text-white disabled:opacity-40 cursor-pointer"
                          title="Move Right"
                        >
                          ▶
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.id);
                        }}
                        className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Bottom Info labels */}
                    <div className="relative z-20 flex justify-between items-end w-full">
                      <span className="text-[10px] font-black text-white bg-slate-950/60 px-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-black text-white bg-indigo-650/80 px-1.5 py-0.5 rounded-lg leading-none">
                        {slide.duration}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Slide Options & Studio Presets Config */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Slide Settings */}
          {selectedSlide ? (
            <div className="space-y-6">
              <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
              <div className="border-b border-slate-150 dark:border-slate-800/80 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Configure Active Slide Settings</span>
                </h4>
                <p className="text-xs font-bold text-slate-650 dark:text-slate-350 truncate mt-1">
                  Adjusting: {selectedSlide.name}
                </p>
              </div>

              {/* Duration slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Slide Playtime:
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {selectedSlide.duration} seconds
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={selectedSlide.duration}
                  onChange={(e) => updateSlideProp(selectedSlide.id, "duration", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Subtitle / Caption overlays */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Overlay Caption Text:</span>
                  </label>
                  <span className="text-[10px] text-slate-405 font-mono">{selectedSlide.text.length}/24 chars</span>
                </div>
                <input
                  type="text"
                  maxLength={24}
                  value={selectedSlide.text}
                  onChange={(e) => updateSlideProp(selectedSlide.id, "text", e.target.value)}
                  placeholder="Type overlay subtitles..."
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Text Animation entry effects */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Text Entrance:
                  </label>
                  <select
                    value={selectedSlide.textAnimation}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "textAnimation", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="typewriter">⌨️ Typewriter</option>
                    <option value="fade">🎬 Classic Fade</option>
                    <option value="pop">💥 Pop scale</option>
                    <option value="slide-up">⬆️ Slide Up</option>
                    <option value="none">❌ None</option>
                  </select>
                </div>

                {/* Filter effects presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Artistic Filter:
                  </label>
                  <select
                    value={selectedSlide.filter}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "filter", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="normal">🎨 Original (Normal)</option>
                    <option value="noir">⚫ Noir (Greyscale)</option>
                    <option value="vintage">🪵 Vintage Sepia</option>
                    <option value="cinematic-warm">☀️ Warm Cinematic</option>
                    <option value="cyberpunk">👾 Cyberpunk Hue</option>
                    <option value="vhs">📼 VHS Glitch</option>
                    <option value="retro">🎞️ Retro Film</option>
                  </select>
                </div>
              </div>

              {/* Ken Burns motion controls */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-3.5 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Pan & Zoom (Ken Burns Effect)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">Start Scale: {selectedSlide.scaleStart.toFixed(2)}x</span>
                    <input
                      type="range"
                      min={1.0}
                      max={1.4}
                      step={0.05}
                      value={selectedSlide.scaleStart}
                      onChange={(e) => updateSlideProp(selectedSlide.id, "scaleStart", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">End Scale: {selectedSlide.scaleEnd.toFixed(2)}x</span>
                    <input
                      type="range"
                      min={1.0}
                      max={1.4}
                      step={0.05}
                      value={selectedSlide.scaleEnd}
                      onChange={(e) => updateSlideProp(selectedSlide.id, "scaleEnd", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Section: AI Video Prompt Builder */}
            <div className="border border-indigo-150 dark:border-indigo-950/60 p-5 rounded-3xl bg-indigo-50/15 dark:bg-indigo-950/10 space-y-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="border-b border-indigo-100 dark:border-indigo-950/40 pb-3 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>CapCut-Style AI Prompt Builder</span>
                </h4>
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full leading-none">
                  Prompt Master
                </span>
              </div>

              {/* URDU TEMPLATE PRESETS */}
              <div className="space-y-1.5 bg-indigo-500/5 dark:bg-indigo-400/5 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/30">
                <span className="text-[10.5px] font-black text-indigo-700 dark:text-indigo-300 block">
                  کچھ بہترین "CapCut-Style" پرامپٹس (Quick Presets):
                </span>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateSlideProp(selectedSlide.id, "style", "Cinematic");
                      updateSlideProp(selectedSlide.id, "cameraMovement", "Cinematic drone shot moving forward");
                      updateSlideProp(selectedSlide.id, "subjectDescription", "futuristic city at sunset, highly detailed, photorealistic, 4k");
                      updateSlideProp(selectedSlide.id, "lightingType", "Golden Hour");
                      updateSlideProp(selectedSlide.id, "transitionEffect", "Zoom");
                      updateSlideProp(selectedSlide.id, "promptDuration", 4);
                      updateSlideProp(selectedSlide.id, "motionSpeed", 1.2);
                      setAspectRatio("16:9");
                      setToastMessage({
                        text: "🎬 Cinematic Preset Loaded",
                        sub: "Drone forward over futuristic city preset loaded.",
                        success: true
                      });
                      triggerBeepChime();
                    }}
                    className="text-left w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-indigo-400 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-start gap-1.5 cursor-pointer"
                  >
                    <span className="text-indigo-500 font-extrabold">1.</span>
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">سینیمیٹک موومنٹ (Cinematic Style)</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal italic line-clamp-1">
                        "Cinematic drone shot moving forward over a futuristic city at sunset..."
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSlideProp(selectedSlide.id, "style", "Bold");
                      updateSlideProp(selectedSlide.id, "cameraMovement", "Fast-paced dynamic transition, close-up shot");
                      updateSlideProp(selectedSlide.id, "subjectDescription", "product being styled, vibrant colors, sharp focus, 60fps, high energy");
                      updateSlideProp(selectedSlide.id, "lightingType", "Neon Cyberpunk");
                      updateSlideProp(selectedSlide.id, "transitionEffect", "Slide");
                      updateSlideProp(selectedSlide.id, "promptDuration", 3);
                      updateSlideProp(selectedSlide.id, "motionSpeed", 1.8);
                      setAspectRatio("9:16");
                      setToastMessage({
                        text: "📱 TikTok/Shorts Preset Loaded",
                        sub: "Fast-paced dynamic social media template loaded.",
                        success: true
                      });
                      triggerBeepChime();
                    }}
                    className="text-left w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-indigo-400 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-start gap-1.5 cursor-pointer"
                  >
                    <span className="text-indigo-500 font-extrabold">2.</span>
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">متحرک سوشل میڈیا سٹائل (TikTok/Shorts Style)</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal italic line-clamp-1">
                        "Fast-paced dynamic transition, close-up shot of a product being styled..."
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSlideProp(selectedSlide.id, "style", "Creative");
                      updateSlideProp(selectedSlide.id, "cameraMovement", "Surreal motion graphics, smooth 3D animation");
                      updateSlideProp(selectedSlide.id, "subjectDescription", "particles flowing around a central subject, stylized color palette");
                      updateSlideProp(selectedSlide.id, "lightingType", "Soft Studio");
                      updateSlideProp(selectedSlide.id, "transitionEffect", "Cross-dissolve");
                      updateSlideProp(selectedSlide.id, "promptDuration", 5);
                      updateSlideProp(selectedSlide.id, "motionSpeed", 0.8);
                      setAspectRatio("1:1");
                      setToastMessage({
                        text: "✨ Creative/Surreal Preset Loaded",
                        sub: "Artistic motion graphics floating particle preset loaded.",
                        success: true
                      });
                      triggerBeepChime();
                    }}
                    className="text-left w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-indigo-400 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-start gap-1.5 cursor-pointer"
                  >
                    <span className="text-indigo-500 font-extrabold">3.</span>
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">آرٹسٹک اور تخلیقی (Creative Style)</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal italic line-clamp-1">
                        "Surreal motion graphics, particles flowing around a central subject..."
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. ASPECT RATIO SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  1. Target Platform Aspect Ratio:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "9:16" as const, label: "📱 9:16 Vertical", sub: "TikTok/Shorts" },
                    { id: "1:1" as const, label: "⏹️ 1:1 Square", sub: "Instagram Post" },
                    { id: "16:9" as const, label: "📺 16:9 Wide", sub: "Cinematic" }
                  ].map((item) => {
                    const isActive = aspectRatio === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAspectRatio(item.id);
                          triggerBeepChime();
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                          isActive
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="text-[10.5px] font-black leading-none">{item.label}</span>
                        <span className={`text-[8.5px] mt-1 ${isActive ? "text-indigo-200" : "text-slate-450"}`}>
                          {item.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. MOTION SPEED CONTROL */}
              <div className="space-y-1.5 bg-slate-500/5 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    2. Dynamic Motion Speed:
                  </label>
                  <span className="text-[10.5px] font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {(selectedSlide.motionSpeed ?? 1.0).toFixed(1)}x Speed
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={selectedSlide.motionSpeed ?? 1.0}
                  onChange={(e) => updateSlideProp(selectedSlide.id, "motionSpeed", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  <span>Slow motion</span>
                  <span>Normal</span>
                  <span>Fast action</span>
                </div>
              </div>

              {/* 3. VIDEO DURATION & TRANSITION EFFECT */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    3. Video Duration:
                  </label>
                  <select
                    value={selectedSlide.promptDuration ?? 3}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "promptDuration", parseInt(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  >
                    <option value={2}>⏱️ 2 Seconds</option>
                    <option value={3}>⏱️ 3 Seconds</option>
                    <option value={4}>⏱️ 4 Seconds</option>
                    <option value={5}>⏱️ 5 Seconds</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    4. Transition Effect:
                  </label>
                  <select
                    value={selectedSlide.transitionEffect ?? "Fade"}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "transitionEffect", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Fade">🎬 Fade Dissolve</option>
                    <option value="Slide">🎬 Slide Motion</option>
                    <option value="Cross-dissolve">🎬 Cross-Dissolve</option>
                    <option value="Wipe">🎬 Wipe Clean</option>
                    <option value="Zoom">🎬 Camera Zoom Transition</option>
                  </select>
                </div>
              </div>

              {/* 4. LIGHTING TYPE & CAMERA MOVEMENT */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    5. Camera Movement:
                  </label>
                  <select
                    value={selectedSlide.cameraMovement ?? "Slow Zoom"}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "cameraMovement", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Slow Zoom">🔍 Slow Zoom</option>
                    <option value="Pan Left">◀️ Pan Left</option>
                    <option value="Pan Right">▶️ Pan Right</option>
                    <option value="Static">🔒 Static Framing</option>
                    <option value="Cinematic drone shot moving forward">🛸 Drone Forward Shot</option>
                    <option value="Fast-paced dynamic transition, close-up shot">💥 Fast Dynamic Close-Up</option>
                    <option value="Surreal motion graphics, smooth 3D animation">✨ Surreal 3D Motion</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    6. Lighting Type:
                  </label>
                  <select
                    value={selectedSlide.lightingType ?? "Golden Hour"}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "lightingType", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Golden Hour">☀️ Golden Hour</option>
                    <option value="Neon Cyberpunk">👾 Neon Cyberpunk</option>
                    <option value="Soft Studio">💡 Soft Studio</option>
                    <option value="Dramatic Chiaroscuro">🌑 Dramatic Chiaroscuro</option>
                    <option value="Natural Light">🌿 Natural Light</option>
                  </select>
                </div>
              </div>

              {/* 5. FOCUS SUBJECT INPUT */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  7. Focus Subject & Magic Enhance:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedSlide.subjectDescription ?? ""}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "subjectDescription", e.target.value)}
                    placeholder='Describe main focus, e.g. "flowing water", "waving hand"...'
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    disabled={isEnhancingPrompt || !(selectedSlide.subjectDescription || "").trim()}
                    onClick={() => handleEnhanceSubject(
                      selectedSlide.id,
                      selectedSlide.subjectDescription ?? "",
                      selectedSlide.style ?? "Cinematic",
                      selectedSlide.cameraMovement ?? "Slow Zoom"
                    )}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-900 dark:disabled:to-slate-900 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none shadow-md shadow-indigo-500/10 shrink-0 border border-indigo-500/20 disabled:border-transparent"
                  >
                    {isEnhancingPrompt ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    )}
                    <span>Magic Enhance</span>
                  </button>
                </div>
              </div>

              {/* 6. STYLE PRESET SELECTION */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  8. CapCut Style Preset:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Minimalist", "Bold", "Dark", "Cinematic", "Realistic", "Dreamy"].map((st) => {
                    const isActive = (selectedSlide.style ?? "Cinematic") === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateSlideProp(selectedSlide.id, "style", st)}
                        className={`py-1.5 rounded-xl border text-[10.5px] font-black transition-all cursor-pointer select-none leading-none ${
                          isActive
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        {st === "Minimalist" && "🤍 "}
                        {st === "Bold" && "🔥 "}
                        {st === "Dark" && "🌌 "}
                        {st === "Cinematic" && "🎬 "}
                        {st === "Realistic" && "📸 "}
                        {st === "Dreamy" && "✨ "}
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE OUTPUT BOX WITH USER'S TEMPLATE */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">
                    Generated Video Prompt (Copy to Luma/Sora/Runway):
                  </label>
                  <span className="text-[9px] font-bold text-indigo-500 font-mono">
                    Template Output ({(selectedSlide.motionSpeed ?? 1.0).toFixed(1)}x Speed)
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={`Generate a high-quality video based on the provided input image. Apply a ${selectedSlide.style || "Cinematic"} visual aesthetic. Implement ${selectedSlide.cameraMovement || "Slow Zoom"} camera movement. The video should have a ${selectedSlide.promptDuration ?? 3} second duration, with ${selectedSlide.transitionEffect || "Fade"} between frames. Ensure the lighting is ${selectedSlide.lightingType || "Golden Hour"} and the final output is optimized for ${
                      aspectRatio === "9:16" ? "vertical 9:16 aspect ratio (TikTok/Shorts)" : aspectRatio === "1:1" ? "square 1:1 aspect ratio (Instagram)" : "cinematic 16:9 widescreen aspect ratio"
                    }.`}
                    rows={5}
                    className="w-full p-3 pb-12 text-[11px] font-mono bg-slate-100/50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-850 text-slate-600 dark:text-slate-300 rounded-2xl resize-none focus:outline-none focus:ring-0 leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const finalPrompt = `Generate a high-quality video based on the provided input image. Apply a ${selectedSlide.style || "Cinematic"} visual aesthetic. Implement ${selectedSlide.cameraMovement || "Slow Zoom"} camera movement. The video should have a ${selectedSlide.promptDuration ?? 3} second duration, with ${selectedSlide.transitionEffect || "Fade"} between frames. Ensure the lighting is ${selectedSlide.lightingType || "Golden Hour"} and the final output is optimized for ${
                        aspectRatio === "9:16" ? "vertical 9:16 aspect ratio (TikTok/Shorts)" : aspectRatio === "1:1" ? "square 1:1 aspect ratio (Instagram)" : "cinematic 16:9 widescreen aspect ratio"
                      }.`;
                      navigator.clipboard.writeText(finalPrompt);
                      setCopySuccess(true);
                      setToastMessage({
                        text: "📋 Copied Prompt!",
                        sub: "Ready to use in Luma Dream Machine, Sora, or Runway.",
                        success: true
                      });
                      triggerBeepChime();
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className="absolute right-2.5 bottom-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95 select-none"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 hidden" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-250 dark:border-slate-850 rounded-3xl flex flex-col items-center justify-center">
              <Info className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">No active slide selected</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-xs">
                Upload images or Preload template landscape slides from the storyboard timeline to edit settings!
              </p>
            </div>
          )}

          {/* Section: Soundtrack & General Studio Presets */}
          <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
            
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <Music className="w-4 h-4 text-emerald-500" />
              <span>Studio Soundtrack & Ratios</span>
            </h4>

            {/* Background Audio Selector & Music Library */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Background Music Library:</span>
                </label>
                {previewingTrack && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 animate-pulse">
                    🔊 Auditioning Live
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {SOUNDTRACK_LIBRARY.map((track) => {
                  const isSelected = soundtrack === track.id;
                  const isPreviewing = previewingTrack === track.id;

                  return (
                    <div
                      key={track.id}
                      className={`relative p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-500 shadow-sm"
                          : "bg-white dark:bg-slate-950 border-slate-200 hover:border-slate-350 dark:border-slate-850 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => {
                            setSoundtrack(track.id);
                            triggerBeepChime();
                            if (isPlaying) {
                              synthManagerRef.current.stop();
                              if (!isMuted && track.id !== "none") {
                                setTimeout(() => synthManagerRef.current.start(track.id, audioVolume, audioFadeIn, audioFadeOut, totalDuration), 100);
                              }
                            }
                          }}
                          className="flex-1 cursor-pointer select-none text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{track.emoji}</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {track.name}
                              {isSelected && (
                                <span className="text-[9px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md leading-none">
                                  Selected
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                            {track.desc}
                          </p>
                        </div>

                        {track.id !== "none" && (
                          <button
                            type="button"
                            onClick={() => {
                              // If playing video, stop it first
                              if (isPlaying) {
                                setIsPlaying(false);
                                if (playbackIntervalRef.current) {
                                  clearInterval(playbackIntervalRef.current);
                                }
                              }

                              if (isPreviewing) {
                                synthManagerRef.current.stop();
                                setPreviewingTrack(null);
                              } else {
                                synthManagerRef.current.stop();
                                synthManagerRef.current.start(track.id, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
                                setPreviewingTrack(track.id);
                              }
                              triggerBeepChime();
                            }}
                            className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isPreviewing
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                : "bg-slate-100 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800"
                            }`}
                            title={isPreviewing ? "Stop Preview" : "Listen Preview Loop"}
                          >
                            {isPreviewing ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold text-slate-450">
                        <span className="bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                          Genre: {track.genre}
                        </span>
                        {track.bpm > 0 ? (
                          <span className="font-mono text-[9.5px]">
                            ⚡ {track.bpm} BPM Live Synth
                          </span>
                        ) : (
                          <span className="font-mono text-[9.5px]">
                            🔇 Silent Output
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio Mixing & Faders Controls */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-3xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-900">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Audio Mixing & Faders
                </h5>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {audioVolume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    Soundtrack Volume
                  </span>
                  <span className="font-mono text-[10.5px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                    {Math.round(audioVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAudioVolume(val);
                    if (val > 0 && isMuted) {
                      setIsMuted(false);
                    }
                  }}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Fade Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Fade In */}
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={audioFadeIn}
                    onChange={(e) => {
                      setAudioFadeIn(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                      Fade In
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Warm 1.5s start swell
                    </span>
                  </div>
                </label>

                {/* Fade Out */}
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={audioFadeOut}
                    onChange={(e) => {
                      setAudioFadeOut(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                      Fade Out
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Smooth exit decay
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Video Aspect Ratio selector layout options */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Video Aspect Ratio:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "16:9", label: "YouTube", desc: "Horizontal", ratio: "16:9" },
                  { id: "9:16", label: "TikTok", desc: "Vertical", ratio: "9:16" },
                  { id: "1:1", label: "Instagram", desc: "Square", ratio: "1:1" }
                ].map((item) => {
                  const isActive = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAspectRatio(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-1 ${
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10"
                          : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-350"
                      }`}
                    >
                      <span className="text-[11px] font-black leading-none">{item.ratio}</span>
                      <span className="text-[9px] font-bold opacity-80 leading-none mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Section: Export Video Creator Output Settings */}
          <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
            
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Compile & Export Studio Video</span>
            </h4>

            {/* Custom file name */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Export File Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none"
                  placeholder="Output file name..."
                />
                <span className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 rounded-xl font-mono leading-none flex items-center justify-center select-none">
                  .webm
                </span>
              </div>
            </div>

            {/* Save to drive checkbox */}
            {user && (
              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/30 dark:bg-emerald-950/5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToDriveAfterExport}
                  onChange={(e) => setSaveToDriveAfterExport(e.target.checked)}
                  className="w-4 h-4 text-indigo-650 bg-white border border-slate-300 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                />
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Upload to Google Drive Automatically</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Check to compile and sync directly into your remote Toolkit Pro Drive folder storage.
                  </p>
                </div>
              </label>
            )}

            {/* Render video actions block */}
            <div className="space-y-3">
              {isExporting ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 font-mono animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                      <span>{exportStatus}</span>
                    </span>
                    <span className="font-mono">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={slides.length === 0}
                  onClick={handleCreateVideo}
                  className="w-full py-3 bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 select-none transition-all active:scale-99"
                >
                  <Video className="w-4 h-4 fill-current" />
                  <span>Create CapCut Video</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
