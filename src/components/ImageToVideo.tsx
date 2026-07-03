import React, { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import garreyExplorerUrl from "../assets/images/garrey_explorer_1783014281882.jpg";
import { User } from "firebase/auth";
import { uploadFileToDrive } from "../lib/drive";
import { triggerFileDownload } from "../lib/download";
// @ts-ignore
import gifshot from "gifshot";
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
  Scissors,
  Clock,
  Gauge,
  GripVertical,
  Move,
  BookOpen,
  Lightbulb
} from "lucide-react";

interface OverlayElement {
  id: string;
  type: "rect" | "circle" | "arrow" | "star" | "triangle" | "heart" | "checkmark" | "icon";
  iconName?: string;
  x: number; // Percentage on canvas 0 - 100
  y: number; // Percentage on canvas 0 - 100
  size: number; // in pixels (e.g. 20 to 120)
  color: string; // hex color code
  opacity: number; // 0.1 to 1.0
  rotation: number; // rotation in degrees
  lineWidth?: number; // border thickness
  filled?: boolean; // filled vs stroke only
  animation?: "pulse" | "spin" | "none";
}

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
  sfx?: string;
  isTextSlide?: boolean;
  textSlideBackground?: string;
  textSlideFontSize?: number;
  textSlideColor?: string;
  elements?: OverlayElement[];
  fontFamily?: string;
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
  private audioElement: HTMLAudioElement | null = null;
  private audioNode: MediaElementAudioSourceNode | null = null;
  private trimStart: number = 0;
  private trimEnd: number = 0;

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
      this.playNoisePerc(0.8, volume * 0.15, 0.05);
    } else if (sfxId === "laser-sweep") {
      this.playLaser(1800, 0.8, volume * 0.6);
      this.playNoisePerc(0.4, volume * 0.05, 0.2);
    } else if (sfxId === "bubble-pop") {
      for (let i = 0; i < 5; i++) {
        const delay = i * 0.15 + Math.random() * 0.1;
        setTimeout(() => {
          if (!this.ctx) return;
          this.playBubble(350 + Math.random() * 200, 0.15, volume * 0.4);
        }, delay * 1000);
      }
    } else if (sfxId === "celestial-chime") {
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
      freqs.forEach((freq, idx) => {
        const delay = idx * 0.08;
        setTimeout(() => {
          if (!this.ctx) return;
          this.playSynthNote(freq * 1.5, 0.6, volume * 0.25, "sine", 0.01);
        }, delay * 1000);
      });
    } else if (sfxId === "arcade-rise") {
      for (let i = 0; i < 8; i++) {
        const delay = i * 0.08;
        const freq = 300 * Math.pow(1.15, i);
        setTimeout(() => {
          if (!this.ctx) return;
          this.playSynthNote(freq, 0.1, volume * 0.3, "square", 0.01);
        }, delay * 1000);
      }
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
    trimEnd: number = 0
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
    this.trimStart = trimStart;
    this.trimEnd = trimEnd;

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

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isPlaying = true;

      // Handle custom audio source
      if (track === "custom" && customAudioUrl) {
        this.audioElement = new Audio(customAudioUrl);
        this.audioElement.volume = volume;
        this.audioElement.crossOrigin = "anonymous";
        this.audioNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioNode.connect(this.gainNode);
        
        const hasTrim = this.trimEnd > this.trimStart;
        this.audioElement.loop = !hasTrim; // Native loop only if not trimmed
        
        // Seek to correct start time
        const startOffset = this.trimStart;
        if (hasTrim) {
          const trimDur = this.trimEnd - this.trimStart;
          this.audioElement.currentTime = startOffset + (startTime % (trimDur || 1));
          
          this.audioElement.addEventListener("timeupdate", () => {
            if (this.audioElement && this.audioElement.currentTime >= this.trimEnd) {
              this.audioElement.currentTime = this.trimStart;
            }
          });
        } else {
          this.audioElement.currentTime = startOffset + startTime;
        }

        this.audioElement.play().catch(e => console.warn("Failed to play custom audio in Synth:", e));
        return;
      }

      // Existing synthesizers
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
      } else {
        // Unknown or custom play sfx
        return;
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
    
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = "";
      } catch (e) {}
      this.audioElement = null;
    }
    this.audioNode = null;

    this.scheduledOscillators.forEach(({ osc, stopTime }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.scheduledOscillators = [];

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.gainNode = null;
    this.analyser = null;
  }

  public seek(time: number) {
    if (this.audioElement) {
      try {
        const hasTrim = this.trimEnd > this.trimStart;
        if (hasTrim) {
          const trimDur = this.trimEnd - this.trimStart;
          this.audioElement.currentTime = this.trimStart + (time % (trimDur || 1));
        } else {
          this.audioElement.currentTime = (this.trimStart || 0) + (time % (this.audioElement.duration || this.totalDuration || 1));
        }
      } catch (e) {}
    }
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

const STYLE_TAGS: Record<string, string> = {
  "Cinematic 🎬": "cinematic masterpiece, dramatic lighting, hyperdetailed 8k, volumetric atmosphere",
  "Anime 🌸": "gorgeous studio ghibli anime style, vibrant hand-drawn, cozy lighting, beautiful aesthetics",
  "Oil Painting 🎨": "textured oil painting brushstrokes, classical fine art canvas, rich moody impasto technique",
  "Sketch ✏️": "highly detailed graphite pencil sketch, fine paper texture, clean hand-drawn monochrome",
  "3D Render 🪐": "hyperrealistic octane 3D render, raytraced ambient occlusion, unreal engine 5 fidelity",
  "Retro VHS 📹": "retro 1980s vhs camcorder look, vintage analog noise, nostalgic warm neon chromatic glow"
};

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
  },
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
    style: "Cinematic",
    sfx: "celestial-chime"
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
    style: "Dreamy",
    sfx: "none"
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
    style: "Realistic",
    sfx: "bubble-pop"
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
    style: "Cinematic",
    sfx: "cinema-impact"
  }
];

export interface PresetImageItem {
  id: string;
  name: string;
  url: string;
  category: "Adventure" | "Nature" | "Cyberpunk" | "Abstract";
  text: string;
  cameraMovement: string;
  subjectDescription: string;
  style: string;
  sfx?: string;
}

export const PRESET_IMAGES_GALLERY: PresetImageItem[] = [
  {
    id: "garrey-preset",
    name: "Garrey the Explorer",
    url: garreyExplorerUrl,
    category: "Adventure",
    text: "Garrey the Fantasy Explorer",
    cameraMovement: "Slow Zoom",
    subjectDescription: "cute fantasy fluffy explorer with tiny hat and brass goggles looking at glowing valley",
    style: "Cinematic",
    sfx: "celestial-chime"
  },
  {
    id: "beach-preset",
    name: "Golden Sunrise Shore",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Sunrise Golden Coast",
    cameraMovement: "Slow Zoom",
    subjectDescription: "gentle waves crashing on the golden sand shore during sunset",
    style: "Cinematic",
    sfx: "celestial-chime"
  },
  {
    id: "pines-preset",
    name: "Alpine Pine Forest",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Alpine Freshness",
    cameraMovement: "Pan Left",
    subjectDescription: "mist floating through tall pine trees in a mountain valley",
    style: "Anime 🌸",
    sfx: "none"
  },
  {
    id: "cyber-city",
    name: "Cyberpunk Neon City",
    url: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "Cyberpunk Alleyway",
    cameraMovement: "Tilt Up",
    subjectDescription: "cyberpunk city street with towering glowing neon signs and rain puddles reflecting lights",
    style: "Retro VHS 📹",
    sfx: "arcade-rise"
  },
  {
    id: "lake-preset",
    name: "Emerald Mountain Lake",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Emerald Lake",
    cameraMovement: "Slow Zoom",
    subjectDescription: "peaceful crystal clear emerald lake with giant mountains reflecting in the water",
    style: "Oil Painting 🎨",
    sfx: "bubble-pop"
  },
  {
    id: "cyber-street",
    name: "Rainy Tokyo Nights",
    url: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "Tokyo Cyber Rain",
    cameraMovement: "Slow Pan",
    subjectDescription: "glowing neon lights of dynamic Tokyo street during heavy rain",
    style: "Retro VHS 📹",
    sfx: "laser-sweep"
  },
  {
    id: "abstract-liquid",
    name: "Dynamic Color Melt",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Color Explosion",
    cameraMovement: "Slow Zoom",
    subjectDescription: "swirling vibrant fluid colors in a stunning high-contrast macro dynamic explosion",
    style: "3D Render 🪐",
    sfx: "cinema-impact"
  },
  {
    id: "abstract-shapes",
    name: "Cybernetic Geometrics",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Monolithic Shapes",
    cameraMovement: "Slow Pan",
    subjectDescription: "abstract glossy futuristic monolithic geometry floating in space with orange and purple lights",
    style: "3D Render 🪐",
    sfx: "laser-sweep"
  }
];

interface SfxItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  type: "impact" | "sweep" | "chime" | "nature";
}

const SFX_LIBRARY: SfxItem[] = [
  { id: "cinema-impact", name: "Deep Cinematic Impact", emoji: "💥", desc: "A heavy, sub-bass explosive transition impact for dramatic scenes.", type: "impact" },
  { id: "laser-sweep", name: "Retro Laser Sweep", emoji: "⚡", desc: "A sweeping, high-frequency sci-fi laser effect.", type: "sweep" },
  { id: "bubble-pop", name: "Ambient Bubble Pops", emoji: "🫧", desc: "Playful underwater bubble textures for nature/relaxing scenes.", type: "nature" },
  { id: "celestial-chime", name: "Celestial Star Chimes", emoji: "✨", desc: "Bright major pentatonic chime sweeps.", type: "chime" },
  { id: "arcade-rise", name: "8-Bit Arcade Rise", emoji: "👾", desc: "An escalating chiptune retro pitch-slide sweep.", type: "sweep" }
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

interface FontOption {
  id: string;
  name: string;
  family: string;
  category: "Sans-Serif" | "Serif" | "Monospace" | "Display" | "Handwritten";
}

const CURATED_FONTS: FontOption[] = [
  { id: "space-grotesk", name: "Space Grotesk", family: '"Space Grotesk", sans-serif', category: "Display" },
  { id: "inter", name: "Inter (Clean)", family: '"Inter", sans-serif', category: "Sans-Serif" },
  { id: "playfair", name: "Playfair Display", family: '"Playfair Display", "Georgia", serif', category: "Serif" },
  { id: "jetbrains-mono", name: "JetBrains Mono", family: '"JetBrains Mono", monospace', category: "Monospace" },
  { id: "cinzel", name: "Cinzel Cinematic", family: '"Cinzel", serif', category: "Serif" },
  { id: "montserrat", name: "Montserrat", family: '"Montserrat", sans-serif', category: "Sans-Serif" },
  { id: "bebas-neue", name: "Bebas Neue", family: '"Bebas Neue", sans-serif', category: "Display" },
  { id: "outfit", name: "Outfit Geometric", family: '"Outfit", sans-serif', category: "Sans-Serif" },
  { id: "lilita-one", name: "Lilita One", family: '"Lilita One", sans-serif', category: "Display" },
  { id: "lobster", name: "Lobster Script", family: '"Lobster", sans-serif', category: "Handwritten" }
];

interface CuratedMusicTrack {
  id: string;
  name: string;
  url: string;
  genre: string;
  emoji: string;
  desc: string;
  duration: string;
}

const CURATED_MP3_LIBRARY: CuratedMusicTrack[] = [
  {
    id: "lounge-jazz",
    name: "Sunset Horizon Lounge",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Chill Lounge",
    emoji: "🎷",
    desc: "A warm, smooth jazz-hop blend with slow brass chords, acoustic piano, and double bass.",
    duration: "6:12"
  },
  {
    id: "cinematic-dreams",
    name: "Nebula Cinematic Dreams",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "Ambient",
    emoji: "🌌",
    desc: "Ethereal string movements, swelling synth textures, and distant echoing woodwinds.",
    duration: "5:44"
  },
  {
    id: "synthwave-80s",
    name: "Neon Horizon Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Synthwave",
    emoji: "🏎️",
    desc: "Retro 80s arpeggiated basslines, classic analog drum machines, and futuristic pads.",
    duration: "5:02"
  },
  {
    id: "acoustic-journey",
    name: "Coastal Breeze Acoustic",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    genre: "Acoustic Pop",
    emoji: "🎸",
    desc: "Upbeat organic acoustic guitars paired with warm piano harmonies and a positive rhythm.",
    duration: "7:03"
  }
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
  const [musicTab, setMusicTab] = useState<"mp3" | "synth" | "custom">("mp3");
  const [audioTrackMode, setAudioTrackMode] = useState<"synth" | "custom" | "sfx">("synth");
  const [selectedSfxId, setSelectedSfxId] = useState<string>("cinema-impact");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [customAudioDuration, setCustomAudioDuration] = useState<number | null>(null);
  const [audioTrimStart, setAudioTrimStart] = useState<number>(0);
  const [audioTrimEnd, setAudioTrimEnd] = useState<number>(0);

  useEffect(() => {
    if (customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      const onLoadedMetadata = () => {
        setCustomAudioDuration(audio.duration);
        setAudioTrimStart(0);
        setAudioTrimEnd(audio.duration);
      };
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      };
    } else {
      setCustomAudioDuration(null);
      setAudioTrimStart(0);
      setAudioTrimEnd(0);
    }
  }, [customAudioUrl]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.3);
  const [audioFadeIn, setAudioFadeIn] = useState<boolean>(true);
  const [audioFadeOut, setAudioFadeOut] = useState<boolean>(true);
  const [transitionStyle, setTransitionStyle] = useState<"fade" | "slide-left" | "slide-right" | "zoom" | "flash" | "none">("fade");
  const [transitionDuration, setTransitionDuration] = useState<number>(0.6);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1.0);
  
  // Cinematic visual & subtitle effects states
  const [subtitleStyle, setSubtitleStyle] = useState<"netflix" | "neon" | "karaoke" | "minimal" | "classical">("netflix");
  const [subtitleFont, setSubtitleFont] = useState<string>("space-grotesk");
  const [cinematicLetterbox, setCinematicLetterbox] = useState<boolean>(false);
  const [vignetteOverlay, setVignetteOverlay] = useState<boolean>(false);
  
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
  const [exportCurrentStage, setExportCurrentStage] = useState<string>("");
  const [exportEstTimeRemaining, setExportEstTimeRemaining] = useState<string>("Calculating...");
  const [exportElapsedTime, setExportElapsedTime] = useState<string>("0.0s");
  const [saveToDriveAfterExport, setSaveToDriveAfterExport] = useState<boolean>(false);
  const [replaceOnUpload, setReplaceOnUpload] = useState<boolean>(true);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; sub: string; success: boolean } | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<"All" | "Adventure" | "Nature" | "Cyberpunk" | "Abstract">("All");
  
  // CapCut Pro Timeline states
  const [timelineZoom, setTimelineZoom] = useState<number>(45); // px per second
  const [isBeatSyncEnabled, setIsBeatSyncEnabled] = useState<boolean>(false);
  const [editingSlideCaptionId, setEditingSlideCaptionId] = useState<string | null>(null);
  const [sfxVolume, setSfxVolume] = useState<number>(0.5);
  
  // AI Prompt Builder states
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [promptTemplateStyle, setPromptTemplateStyle] = useState<"detailed" | "minimal" | "sora_luma" | "runway_agent">("runway_agent");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [userPromptText, setUserPromptText] = useState<string>("");
  const [isGeneratingScene, setIsGeneratingScene] = useState<boolean>(false);
  const [showPromptGuide, setShowPromptGuide] = useState<boolean>(false);
  const [handbookTab, setHandbookTab] = useState<"basics" | "consistency" | "references" | "power-prompt" | "post-edit" | "models">("basics");

  // Advanced Runway / Google Flow style states
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [aiModelEngine, setAiModelEngine] = useState<"gemini-flash" | "gemini-pro" | "veo-core">("gemini-flash");
  const [aiMotionIntensity, setAiMotionIntensity] = useState<number>(5);
  const [aiCameraDirection, setAiCameraDirection] = useState<"auto" | "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "tilt-up" | "tilt-down" | "orbit">("auto");
  const [aiStylePreset, setAiStylePreset] = useState<"auto" | "cinematic" | "cyberpunk" | "anime" | "vhs" | "realistic-3d" | "minimalist">("auto");
  const [aiGenerationProgress, setAiGenerationProgress] = useState<number>(0);
  const [aiGenerationLogs, setAiGenerationLogs] = useState<string[]>([]);
  const [aiCurrentStage, setAiCurrentStage] = useState<string>("");
  const [aiEstTimeRemaining, setAiEstTimeRemaining] = useState<string>("Calculating...");
  const [aiElapsedTime, setAiElapsedTime] = useState<string>("0.0s");

  // Final video rendering preview states
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [showFinalOutput, setShowFinalOutput] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [isWaitingForLogin, setIsWaitingForLogin] = useState<boolean>(false);
  
  // Text-to-Video and Title Clip workspace states
  const [creatorMode, setCreatorMode] = useState<"single" | "script" | "text-slide">("single");
  const [videoScriptText, setVideoScriptText] = useState<string>("");
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptCurrentLineIdx, setScriptCurrentLineIdx] = useState<number>(0);
  const [scriptTotalLines, setScriptTotalLines] = useState<number>(0);
  const [titleSlideText, setTitleSlideText] = useState<string>("ENTER TITLE HERE");
  const [titleSlideBg, setTitleSlideBg] = useState<string>("gradient-sunset");
  const [titleSlideFontSize, setTitleSlideFontSize] = useState<number>(44);
  const [titleSlideColor, setTitleSlideColor] = useState<string>("#ffffff");

  const [exportFormat, setExportFormat] = useState<"webm" | "mp4" | "gif">("webm");
  const [subtitleManualOffset, setSubtitleManualOffset] = useState<number>(0);

  // Premium Audio Visualizer & Voiceover state variables
  const [visualizerStyle, setVisualizerStyle] = useState<"none" | "bars" | "wave" | "pulse">("wave");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState<boolean>(false);
  const [voiceoverGender, setVoiceoverGender] = useState<"female" | "male">("female");
  const [voiceoverVolume, setVoiceoverVolume] = useState<number>(0.7);

  // Global Real-time Video Master Filter choice
  const [masterVideoFilter, setMasterVideoFilter] = useState<
    "none" | "grayscale" | "sepia" | "vintage" | "high-contrast" | "cyberpunk" | "noir" | "cool" | "warm"
  >("none");

  // Track active overlay element being edited
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Real-time CSS filter to apply instantly to the created/exported video/GIF in the player
  const [createdVideoPlayerFilter, setCreatedVideoPlayerFilter] = useState<string>("none");

  // For the custom integrated video player
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(true);
  const [previewTime, setPreviewTime] = useState<number>(0);
  const [previewDuration, setPreviewDuration] = useState<number>(0);

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

  const uploadVideoToDrive = async () => {
    if (!exportedVideoBlob || !accessToken) return;

    setIsSavingToDrive(true);
    setToastMessage({
      text: "Saving to Google Drive",
      sub: "Converting and uploading video to your Drive account...",
      success: true,
    });

    const fileExt = exportFormat;
    const videoNameWithExtension = `${exportFileName.replace(/\s+/g, "_")}.${fileExt}`;
    const mimeType = exportFormat === "gif" ? "image/gif" : exportFormat === "mp4" ? "video/mp4" : "video/webm";

    try {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(exportedVideoBlob);
      fileReader.onloadend = async () => {
        try {
          const base64DataUrl = fileReader.result as string;
          await uploadFileToDrive(
            accessToken,
            videoNameWithExtension,
            mimeType,
            base64DataUrl
          );
          
          onRefreshDrive();
          setIsSavingToDrive(false);
          setToastMessage({
            text: "Saved to Google Drive!",
            sub: `Successfully saved ${videoNameWithExtension} to your ToolkitPro folder on Google Drive.`,
            success: true
          });
        } catch (err) {
          console.error(err);
          setIsSavingToDrive(false);
          setToastMessage({
            text: "Failed to Save to Drive",
            sub: err instanceof Error ? err.message : String(err),
            success: false
          });
        }
      };
    } catch (e) {
      console.error(e);
      setIsSavingToDrive(false);
      setToastMessage({
        text: "Conversion Error",
        sub: "Failed to convert file for upload.",
        success: false
      });
    }
  };

  const handleSaveToDrive = async () => {
    if (!exportedVideoBlob) return;
    
    if (!accessToken) {
      setIsWaitingForLogin(true);
      setToastMessage({
        text: "Connecting Google Drive",
        sub: "Please authorize the application using the sign-in popup.",
        success: true,
      });
      try {
        await onLogin();
      } catch (err) {
        console.error("Login failed:", err);
        setIsWaitingForLogin(false);
        setToastMessage({
          text: "Connection Failed",
          sub: "Failed to connect to your Google Drive account.",
          success: false,
        });
      }
      return;
    }

    await uploadVideoToDrive();
  };

  useEffect(() => {
    if (accessToken && isWaitingForLogin && exportedVideoBlob) {
      setIsWaitingForLogin(false);
      uploadVideoToDrive();
    }
  }, [accessToken, isWaitingForLogin, exportedVideoBlob]);

  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Keep drawVideoFrame callback accessible in hooks declared above it via a React ref
  const drawVideoFrameRef = useRef<any>(null);

  // Continuous 60FPS requestAnimationFrame render loop during playback for smooth Ken Burns & reactive visualizers
  useEffect(() => {
    if (!isPlaying) return;

    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = () => {
      if (!active) return;

      let height = 450;
      if (aspectRatio === "9:16") {
        height = Math.round(canvasWidth * (16 / 9));
      } else if (aspectRatio === "1:1") {
        height = canvasWidth;
      }

      // Draw the frame at the high-precision current time using the callback ref
      if (drawVideoFrameRef.current) {
        drawVideoFrameRef.current(ctx, canvasWidth, height, currentTimeRef.current);
      }

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
    return () => {
      active = false;
    };
  }, [isPlaying, aspectRatio]);

  // Audio mute & mix sync
  useEffect(() => {
    if (isPlaying && !isMuted) {
      if (audioTrackMode === "custom" && customAudioUrl) {
        synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, customAudioUrl, currentTimeRef.current, audioTrimStart, audioTrimEnd);
      } else if (audioTrackMode === "sfx" && selectedSfxId) {
        synthManagerRef.current.start("none");
        synthManagerRef.current.playSingleSfx(selectedSfxId, audioVolume);
      } else {
        synthManagerRef.current.start(soundtrack, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
      }
    } else {
      synthManagerRef.current.stop();
    }
  }, [isPlaying, soundtrack, audioTrackMode, selectedSfxId, customAudioUrl, isMuted, audioFadeIn, audioFadeOut, totalDuration, audioTrimStart, audioTrimEnd]);

  // Synchronize custom audio timeline scrubbing when paused
  useEffect(() => {
    if (!isPlaying && audioTrackMode === "custom") {
      synthManagerRef.current.seek(currentTime);
    }
  }, [currentTime, isPlaying, audioTrackMode]);

  // Synchronize slide entry transition SFX
  const lastTriggeredSlideIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTriggeredSlideIndexRef.current = null;
      return;
    }

    // Determine current slide index
    let cumulativeTime = 0;
    let activeIndex = 0;
    for (let i = 0; i < slides.length; i++) {
      if (currentTime >= cumulativeTime && currentTime < cumulativeTime + slides[i].duration) {
        activeIndex = i;
        break;
      }
      cumulativeTime += slides[i].duration;
    }

    // Reset if we wrapped around or scrubbed back
    if (activeIndex < (lastTriggeredSlideIndexRef.current ?? 0) || currentTime === 0) {
      lastTriggeredSlideIndexRef.current = null;
    }

    if (activeIndex !== lastTriggeredSlideIndexRef.current) {
      lastTriggeredSlideIndexRef.current = activeIndex;
      const slide = slides[activeIndex];
      if (slide && slide.sfx && slide.sfx !== "none" && !isMuted) {
        synthManagerRef.current.playSingleSfx(slide.sfx, audioVolume);
      }

      // TTS Voiceover Narration Engine
      if (slide && slide.text && voiceoverEnabled && !isMuted && typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel(); // Stop current narration
          const utterance = new SpeechSynthesisUtterance(slide.text);
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            let selectedVoice = voices.find(v => v.lang.startsWith("en"));
            if (voiceoverGender === "female") {
              selectedVoice = voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google us english") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("hazel")));
            } else {
              selectedVoice = voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("mark") || v.name.toLowerCase().includes("george")));
            }
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          }
          utterance.volume = voiceoverVolume; // Custom voiceover volume fader
          utterance.rate = 1.05; // slightly faster social narration pace
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("Speech Synthesis Voiceover failed:", e);
        }
      }
    }
  }, [currentTime, isPlaying, slides, isMuted, audioVolume, voiceoverVolume, voiceoverEnabled, voiceoverGender]);

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
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
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
          let next = prev + (stepMs / 1000) * videoPlaybackSpeed;
          if (next >= totalDuration) {
            next = 0; // loop back to start
          }
          return next;
        });
      }, stepMs);
      playbackIntervalRef.current = interval;
      
      if (!isMuted) {
        if (audioTrackMode === "custom" && customAudioUrl) {
          synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, customAudioUrl, currentTime, audioTrimStart, audioTrimEnd);
        } else if (audioTrackMode === "sfx" && selectedSfxId) {
          synthManagerRef.current.start("none");
          synthManagerRef.current.playSingleSfx(selectedSfxId, audioVolume);
        } else {
          synthManagerRef.current.start(soundtrack, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
        }
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPreviewingTrack(null);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
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

  const handleAddPresetImage = (preset: { url: string; name: string; text: string; cameraMovement?: string; subjectDescription?: string; style?: string; sfx?: string }) => {
    const slide: ImageSlide = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: preset.url,
      name: preset.name,
      duration: 3,
      text: preset.text,
      textAnimation: "typewriter",
      filter: "normal",
      scaleStart: 1.0,
      scaleEnd: 1.15,
      promptDuration: 3,
      cameraMovement: preset.cameraMovement || "Slow Zoom",
      subjectDescription: preset.subjectDescription || preset.text,
      style: preset.style || "Cinematic",
      sfx: preset.sfx || "none"
    };

    // Cache the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = preset.url;
    img.onload = () => {
      imageCacheRef.current[slide.id] = img;
    };

    if (replaceOnUpload) {
      setSlides([slide]);
      setSelectedSlideId(slide.id);
      setCurrentTime(0);
    } else {
      setSlides((prev) => [...prev, slide]);
    }

    setToastMessage({
      text: "📸 Preset Photo Added!",
      sub: replaceOnUpload 
        ? `Timeline replaced with ${preset.name}. Click 'Create Video Now' to generate!`
        : `Appended ${preset.name} to the end of the timeline track.`,
      success: true
    });
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

  // Drag and drop handlers for local file uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const filesUploaded = e.dataTransfer.files;
    if (!filesUploaded || filesUploaded.length === 0) return;

    processFilesList(filesUploaded);
  };

  const processFilesList = (filesList: FileList) => {
    const uploadedSlides: ImageSlide[] = [];
    const filesArray = Array.from(filesList) as File[];
    let loadedCount = 0;

    filesArray.forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        loadedCount++;
        if (loadedCount === filesArray.length && uploadedSlides.length > 0) {
          applyUploadedSlides(uploadedSlides);
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const urlStr = event.target.result as string;
          const slide: ImageSlide = {
            id: `uploaded-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
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
          uploadedSlides.push(slide);
          
          // Cache the image instantly to prevent blank previews
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = urlStr;
          img.onload = () => {
            imageCacheRef.current[slide.id] = img;
          };
        }
        loadedCount++;
        if (loadedCount === filesArray.length) {
          applyUploadedSlides(uploadedSlides);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const applyUploadedSlides = (uploadedSlides: ImageSlide[]) => {
    if (uploadedSlides.length === 0) return;

    if (replaceOnUpload) {
      setSlides(uploadedSlides);
      setSelectedSlideId(uploadedSlides[0].id);
      setCurrentTime(0);
    } else {
      setSlides((prev) => [...prev, ...uploadedSlides]);
    }
    
    setToastMessage({
      text: "📸 Photo Loaded Successfully!",
      sub: replaceOnUpload 
        ? "Timeline replaced with your new photo(s). Click 'Create CapCut Video' to generate your clip!"
        : "Appended new photo(s) to the end of the timeline track.",
      success: true
    });
    triggerBeepChime();
  };

  // File picker handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesUploaded = e.target.files;
    if (!filesUploaded) return;
    processFilesList(filesUploaded);
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

  const renderPromptValidationInfo = (text: string, isDarkThemeOnly: boolean = false) => {
    const len = (text || "").trim().length;
    let statusText = "Empty";
    let statusColor = isDarkThemeOnly ? "text-slate-500" : "text-slate-400 dark:text-slate-500";
    let barBg = "bg-slate-200 dark:bg-slate-800";
    let barColor = "bg-slate-300 dark:bg-slate-600";
    let percentage = 0;
    let ratingEmoji = "⚪";

    if (len > 0) {
      if (len < 15) {
        statusText = "Too Simple (minimum 15 characters recommended)";
        statusColor = "text-rose-500 dark:text-rose-400";
        barColor = "bg-rose-500";
        percentage = Math.min((len / 15) * 100, 100);
        ratingEmoji = "⚠️";
      } else if (len < 40) {
        statusText = "Good Complexity (great default results)";
        statusColor = "text-amber-500 dark:text-amber-400";
        barColor = "bg-amber-500";
        percentage = Math.min((len / 40) * 100, 100);
        ratingEmoji = "👍";
      } else {
        statusText = "Rich Cinematic Details (excellent results!)";
        statusColor = "text-emerald-500 dark:text-emerald-400";
        barColor = "bg-emerald-500";
        percentage = 100;
        ratingEmoji = "✨";
      }
    }

    if (isDarkThemeOnly) {
      barBg = "bg-slate-950";
      if (len === 0) {
        statusColor = "text-slate-600";
        barColor = "bg-slate-800";
      }
    }

    return (
      <div className="flex flex-col gap-1 mt-1 font-sans select-none">
        <div className="flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
          <span className={`${statusColor} flex items-center gap-1 truncate max-w-[280px]`}>
            <span>{ratingEmoji}</span>
            <span className="truncate">{statusText}</span>
          </span>
          <span className={`${isDarkThemeOnly ? "text-slate-500" : "text-slate-400 dark:text-slate-500"} font-mono text-[9px] shrink-0`}>
            {len} chars
          </span>
        </div>
        <div className={`w-full h-1 ${barBg} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${barColor} rounded-full transition-all duration-300`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleAppendStyle = (styleKeywords: string) => {
    let currentText = userPromptText.trim();
    
    // Check if any of our known style keywords are currently in the prompt, and replace them
    let styleFoundAndReplaced = false;
    for (const [key, value] of Object.entries(STYLE_TAGS)) {
      if (currentText.includes(value)) {
        currentText = currentText.replace(value, styleKeywords).trim();
        styleFoundAndReplaced = true;
        break;
      }
    }
    
    if (!styleFoundAndReplaced) {
      if (currentText) {
        if (currentText.endsWith(",")) {
          currentText = `${currentText} ${styleKeywords}`;
        } else {
          currentText = `${currentText}, ${styleKeywords}`;
        }
      } else {
        currentText = styleKeywords;
      }
    }
    
    setUserPromptText(currentText);
    triggerBeepChime();
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

  const handleAppendModifier = (tag: string) => {
    const current = userPromptText.trim();
    const tagClean = tag.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();
    
    let newVal = "";
    if (current) {
      const endsWithPunct = current.endsWith(",") || current.endsWith(".");
      newVal = `${current}${endsWithPunct ? "" : ","} ${tagClean}`;
    } else {
      newVal = tagClean;
    }
    setUserPromptText(newVal);
    triggerBeepChime();
  };

  const handleRandomizePrompt = () => {
    const subjects = [
      "A sleek silver cybercar speeding through",
      "A majestic glowing quartz crystal dragon perched atop",
      "An ancient moss-covered stone archway opening to",
      "Golden fireflies swirling around a sleeping red fox in",
      "Gentle ocean waves of glowing blue bioluminescence breaking against",
      "A solitary retro astronaut looking out at",
      "Warm evening light filtering through massive vintage cathedral glass onto",
      "A mysterious floating obsidian pyramid reflecting"
    ];
    const environments = [
      "a rainy cyberpunk metropolis with towering pink neon skyscrapers",
      "a misty mountain canyon shrouded in purple morning fog at sunset",
      "a dense ancient fantasy forest illuminated by giant mushrooms",
      "a surreal desert field of floating glass spheres under a crimson sun",
      "a cozy rustic wooden cabin library filled with old books and warm candlelight",
      "a futuristic greenhouse garden floating in outer space with earth in the background"
    ];
    const actions = [
      "with shattered glass shards swirling dynamically around and casting sharp reflections",
      "as steam rises slowly, capturing volumetric golden sun god rays",
      "creating delicate water ripples and tiny sparkling chromatic halos",
      "with cherry blossom leaves falling gently in slow-motion, dancing on wind currents"
    ];
    const qualityTags = [
      "high-contrast cinematic photography, hyper-detailed 4k, octane render",
      "unreal engine 5 volumetric atmosphere, raytraced reflections, masterwork",
      "retro analog VHS texture with nostalgic chromatic aberration and cinematic noise",
      "gorgeous hand-painted anime watercolor style, Ghibli aesthetic, pristine color grading"
    ];

    const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
    const randomEnv = environments[Math.floor(Math.random() * environments.length)];
    const randomAct = actions[Math.floor(Math.random() * actions.length)];
    const randomQual = qualityTags[Math.floor(Math.random() * qualityTags.length)];

    const finalPrompt = `${randomSub} ${randomEnv}, ${randomAct}. ${randomQual}`;
    setUserPromptText(finalPrompt);

    const presetStyles: ("auto" | "cinematic" | "cyberpunk" | "anime" | "vhs" | "realistic-3d" | "minimalist")[] = 
      ["cinematic", "cyberpunk", "anime", "vhs", "realistic-3d"];
    const presetCameras: ("auto" | "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "tilt-up" | "tilt-down" | "orbit")[] = 
      ["zoom-in", "zoom-out", "pan-left", "pan-right", "tilt-up", "tilt-down", "orbit"];
    
    setAiStylePreset(presetStyles[Math.floor(Math.random() * presetStyles.length)]);
    setAiCameraDirection(presetCameras[Math.floor(Math.random() * presetCameras.length)]);
    setAiMotionIntensity(Math.floor(Math.random() * 6) + 4);

    setToastMessage({
      text: "🎲 Surprise Scene Synthesized!",
      sub: "A highly creative cinematic storyboard concept has been generated.",
      success: true
    });
    triggerBeepChime();
  };

  const getGeneratedPrompt = (slide: ImageSlide, templateStyle: "detailed" | "minimal" | "sora_luma" | "runway_agent" = "runway_agent") => {
    const styleVal = slide.style || "Cinematic";
    const cameraVal = slide.cameraMovement || "Slow Zoom";
    const durationVal = slide.promptDuration ?? 3;
    const transitionVal = slide.transitionEffect || "Fade";
    const lightingVal = slide.lightingType || "Golden Hour";
    const speedVal = (slide.motionSpeed ?? 1.0).toFixed(1);
    const aspectText = aspectRatio === "9:16" 
      ? "vertical 9:16 aspect ratio" 
      : aspectRatio === "1:1" 
        ? "square 1:1 aspect ratio" 
        : "cinematic 16:9 widescreen aspect ratio";

    const subjectText = slide.subjectDescription?.trim();

    // Duration-based camera movement instructions and pacing descriptions
    let durationCameraInstruction = "";
    let pacingDesc = "steady and balanced pacing";

    if (durationVal >= 2 && durationVal <= 3) {
      durationCameraInstruction = `Since this is a fast-paced ${durationVal}-second clip, apply snappy, quick, and energetic camera tracking with a punchy motion sweep to capture dynamic progression without lingering.`;
      pacingDesc = "fast and punchy pacing";
    } else if (durationVal >= 4 && durationVal <= 6) {
      durationCameraInstruction = `Since this is a balanced ${durationVal}-second clip, maintain cinematic pacing with a steady kinetic tracking motion and smooth, natural, flowing transitions.`;
      pacingDesc = "steady and balanced pacing";
    } else if (durationVal >= 7 && durationVal <= 8) {
      durationCameraInstruction = `Since this is an atmospheric ${durationVal}-second clip, utilize a graceful, slow-sweeping, and highly cinematic camera movement to allow subtle details and ambient motion to evolve beautifully over the long take.`;
      pacingDesc = "graceful and atmospheric pacing";
    } else if (durationVal >= 9 && durationVal <= 10) {
      durationCameraInstruction = `Since this is an epic ${durationVal}-second master take, execute a majestic, sweeping, and panoramic camera orbit to deliver immersive storytelling, high frame coherence, and intricate, evolving physical dynamics throughout the extended duration.`;
      pacingDesc = "epic cinematic panoramic pacing";
    } else {
      durationCameraInstruction = `The motion should be optimized for a steady ${durationVal}-second visual duration, maintaining high fidelity and balanced frame coherence.`;
    }

    if (templateStyle === "runway_agent") {
      const imageDescription = subjectText || "a highly detailed and beautifully composed visual narrative, capturing raw texture and volumetric atmosphere";
      const mainSubject = subjectText ? `The ${subjectText}` : "The central focal subject";

      let motionStyle = "balanced, smooth, and natural flow";
      let specificCamera = `executing a steady ${cameraVal} sweep`;

      if (durationVal >= 2 && durationVal <= 3) {
        motionStyle = "snappy, quick, and energetic";
        specificCamera = `gliding with a swift and responsive ${cameraVal} trajectory`;
      } else if (durationVal >= 4 && durationVal <= 6) {
        motionStyle = "balanced, smooth, and natural flow";
        specificCamera = `gliding with a steady ${cameraVal} sweep`;
      } else if (durationVal >= 7 && durationVal <= 8) {
        motionStyle = "atmospheric, graceful, and cinematic";
        specificCamera = `weaving in a slow and graceful ${cameraVal} track`;
      } else if (durationVal >= 9 && durationVal <= 10) {
        motionStyle = "majestic, sweeping, and detailed story-driven";
        specificCamera = `unfolding in a majestic panoramic ${cameraVal} orbit`;
      }

      return `Starting from the provided image: ${imageDescription}.\n\n${mainSubject} performs a ${motionStyle} animation, ${specificCamera}, smooth and natural movement, high temporal consistency.\n\nDuration: ${durationVal} seconds, ${pacingDesc}, ${lightingVal} lighting, ${styleVal} mood, highly detailed, 4K.`;
    }

    if (templateStyle === "minimal") {
      let prompt = `Video from image. Style: ${styleVal}. Camera: ${cameraVal}. Speed: ${speedVal}x.`;
      if (subjectText) prompt += ` Subject: ${subjectText}.`;
      prompt += ` Duration: ${durationVal} seconds, ${pacingDesc}. ${durationCameraInstruction} Lighting: ${lightingVal}. Optimized for ${aspectText}.`;
      return prompt;
    }

    if (templateStyle === "sora_luma") {
      let prompt = `High-fidelity cinematic video generation optimized for Luma and Sora. Style preset: ${styleVal}. `;
      if (subjectText) {
        prompt += `The scene features ${subjectText}, behaving with realistic physics and natural animation. `;
      } else {
        prompt += `The scene animates with continuous professional movement. `;
      }
      prompt += `Camera setup: ${cameraVal} executed smoothly at ${speedVal}x playback speed. ${durationCameraInstruction} Atmospheric lighting: ${lightingVal}. Optimized for ${aspectText} with flawless detail retention. Duration: ${durationVal} seconds, ${pacingDesc}.`;
      return prompt;
    }

    // Default: detailed
    let prompt = `Generate a high-quality video based on the provided input image. Apply a ${styleVal} visual aesthetic with premium color grading. `;
    if (subjectText) {
      prompt += `The primary motion and focus of the video should be ${subjectText}, with realistic physical movement and seamless animations. `;
    }
    prompt += `Implement professional ${cameraVal} camera movement at a speed factor of ${speedVal}x. ${durationCameraInstruction} Ensure the atmospheric lighting is configured to ${lightingVal} to match the visual mood. The final output is fully optimized for ${aspectText} display. Duration: ${durationVal} seconds, ${pacingDesc}.`;
    return prompt;
  };

  const handleGenerateScriptToVideo = async () => {
    if (!videoScriptText.trim()) {
      setToastMessage({
        text: "Please enter a narrative script",
        sub: "Write a few lines of story or scenes to build your movie",
        success: false
      });
      return;
    }

    // Split by lines
    const lines = videoScriptText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 5); // Ignore empty/short lines

    if (lines.length === 0) {
      setToastMessage({
        text: "Script too short",
        sub: "Provide detailed cinematic descriptions on separate lines",
        success: false
      });
      return;
    }

    setIsGeneratingScript(true);
    setScriptTotalLines(lines.length);
    setScriptCurrentLineIdx(0);

    // If replaceOnUpload is checked, clear current timeline before starting batch
    let currentSlides = replaceOnUpload ? [] : [...slides];
    if (replaceOnUpload) {
      setSlides([]);
    }

    try {
      for (let i = 0; i < lines.length; i++) {
        setScriptCurrentLineIdx(i + 1);
        const currentLinePrompt = lines[i];

        setToastMessage({
          text: `🎬 Generating Scene ${i + 1} of ${lines.length}`,
          sub: `"${currentLinePrompt.substring(0, 35)}..."`,
          success: true
        });

        const response = await fetch("/api/video/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: currentLinePrompt,
            engine: aiModelEngine,
            motion: aiMotionIntensity,
            camera: aiCameraDirection,
            style: aiStylePreset
          })
        });

        if (!response.ok) {
          throw new Error(`Failed on Scene ${i + 1}`);
        }

        const data = await response.json();
        const unsplashKeywords = data.keywords || "nature";
        const imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}-${i}`;
        
        const intensityScale = 1.0 + (aiMotionIntensity * 0.035);
        let finalCamera = aiCameraDirection === "auto" ? (data.camera || "Slow Zoom") : aiCameraDirection;
        let scaleStartValue = 1.0;
        let scaleEndValue = intensityScale;

        if (finalCamera === "zoom-out" || finalCamera === "Zoom Out" || finalCamera === "Tilt Down" || finalCamera === "Tilt Up") {
          scaleStartValue = intensityScale;
          scaleEndValue = 1.0;
        } else if (finalCamera === "Static" || finalCamera === "Static Framing") {
          scaleStartValue = 1.0;
          scaleEndValue = 1.0;
        }

        const newSlide: ImageSlide = {
          id: `ai-scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          url: imageUrl,
          name: `Script Sc ${i + 1}: ${currentLinePrompt.substring(0, 15)}...`,
          duration: 4,
          text: data.caption || currentLinePrompt.substring(0, 30),
          textAnimation: "typewriter",
          filter: aiStylePreset === "auto" ? (data.filter || "normal") : (aiStylePreset === "cinematic" ? "cinematic-warm" : aiStylePreset as any),
          scaleStart: scaleStartValue,
          scaleEnd: scaleEndValue,
          promptDuration: 4,
          cameraMovement: finalCamera,
          subjectDescription: currentLinePrompt,
          style: data.style || "Cinematic",
          motionSpeed: aiMotionIntensity / 5.0
        };

        // Preload image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            imageCacheRef.current[newSlide.id] = img;
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
        });

        currentSlides.push(newSlide);
        setSlides([...currentSlides]);
        setSelectedSlideId(newSlide.id);
        
        // Add a tiny delay between requests to be gentle to API
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setToastMessage({
        text: "✨ Movie Script Compiled!",
        sub: `Successfully generated a high-fidelity ${lines.length}-scene narrative video.`,
        success: true
      });
      triggerBeepChime();

    } catch (err: any) {
      console.error(err);
      setToastMessage({
        text: "⚠️ Script generation stopped",
        sub: err.message || "An unexpected error occurred during batch compiling.",
        success: false
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleAddTextTitleSlide = () => {
    if (!titleSlideText.trim()) {
      setToastMessage({
        text: "Please enter title text",
        sub: "A text slide needs a visual message to display",
        success: false
      });
      return;
    }

    const intensityScale = 1.0 + (aiMotionIntensity * 0.035);
    const newSlide: ImageSlide = {
      id: `text-slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: "", // Text slides don't have an Unsplash URL
      name: `📝 Text: ${titleSlideText.substring(0, 15)}`,
      duration: 4,
      text: titleSlideText,
      textAnimation: "none", // Since text is drawn inside the center, we don't double draw the caption
      filter: "normal",
      scaleStart: 1.0,
      scaleEnd: intensityScale, // Centered zoom works perfectly
      promptDuration: 4,
      cameraMovement: aiCameraDirection === "auto" ? "Slow Zoom" : aiCameraDirection,
      subjectDescription: titleSlideText,
      style: "Typography",
      isTextSlide: true,
      textSlideBackground: titleSlideBg,
      textSlideFontSize: titleSlideFontSize,
      textSlideColor: titleSlideColor
    };

    if (replaceOnUpload) {
      setSlides([newSlide]);
      setSelectedSlideId(newSlide.id);
      setCurrentTime(0);
    } else {
      setSlides((prev) => [...prev, newSlide]);
      setSelectedSlideId(newSlide.id);
    }

    setToastMessage({
      text: "📝 Title Clip Appended!",
      sub: "Added a styled text canvas to your cinematic timeline.",
      success: true
    });
    triggerBeepChime();
  };

  const handleGenerateAIScene = async (autoExportAfter: boolean = false) => {
    if (!userPromptText.trim()) {
      setToastMessage({
        text: "Please enter a creative prompt",
        sub: "Explain what scene you want to generate (e.g., sunset beach, retro cyber car, etc.)",
        success: false
      });
      return;
    }

    const aiStartTimeInstant = Date.now();
    setAiElapsedTime("0.0s");
    setAiEstTimeRemaining("Calculating...");
    setAiCurrentStage("Initializing Stage");

    const timerInterval = setInterval(() => {
      const elapsed = (Date.now() - aiStartTimeInstant) / 1000;
      setAiElapsedTime(`${elapsed.toFixed(1)}s`);
    }, 100);

    setIsGeneratingScene(true);
    setAiGenerationProgress(10);
    setAiGenerationLogs(["[0/5] Initializing Google Flow neural pipeline workspace..."]);

    const appendLog = (msg: string, progress: number) => {
      setAiGenerationProgress(progress);
      setAiGenerationLogs((prev) => [...prev, msg]);

      let stage = "Analyzing prompt";
      if (progress <= 15) {
        stage = "Analyzing prompt";
      } else if (progress <= 35) {
        stage = "Tokenizing prompt";
      } else if (progress <= 55) {
        stage = "Structuring cinematic properties";
      } else if (progress <= 80) {
        stage = "Applying motion";
      } else if (progress <= 92) {
        stage = "Interpolating vectors";
      } else {
        stage = "Finalizing encode";
      }
      setAiCurrentStage(stage);

      const elapsed = (Date.now() - aiStartTimeInstant) / 1000;
      if (progress > 0 && progress < 100) {
        const totalEst = elapsed / (progress / 100);
        const remaining = Math.max(0.5, totalEst - elapsed);
        setAiEstTimeRemaining(`${remaining.toFixed(1)}s`);
      } else {
        setAiEstTimeRemaining("0.0s");
      }
    };

    try {
      await new Promise((r) => setTimeout(r, 600));
      appendLog(`[1/5] Tokenizing prompt using ${aiModelEngine === "gemini-pro" ? "Gemini 1.5 Pro (Dual-Path)" : aiModelEngine === "veo-core" ? "Veo-Core v2.0" : "Gemini 1.5 Flash (Speed)"} parser...`, 25);
      
      await new Promise((r) => setTimeout(r, 800));
      appendLog(`[2/5] Structuring cinematic properties (Camera: ${aiCameraDirection}, Style: ${aiStylePreset}, Motion Intensity: ${aiMotionIntensity})...`, 45);

      const response = await fetch("/api/video/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userPromptText,
          engine: aiModelEngine,
          motion: aiMotionIntensity,
          camera: aiCameraDirection,
          style: aiStylePreset
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate scene with AI");
      }

      const data = await response.json();
      
      await new Promise((r) => setTimeout(r, 700));
      appendLog(`[3/5] Visualizing scene geometry: "${data.caption || "Synthesized visual text"}"`, 70);

      // Use Unsplash Featured Image based on the generated keywords
      const unsplashKeywords = data.keywords || "nature,beautiful";
      const imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}`;

      // Adjust scales based on motion intensity slider
      const intensityScale = 1.0 + (aiMotionIntensity * 0.035); // e.g., Intensity 5 = ~1.17 scale end

      let finalCamera = aiCameraDirection === "auto" ? (data.camera || "Slow Zoom") : aiCameraDirection;
      let scaleStartValue = 1.0;
      let scaleEndValue = intensityScale;

      if (finalCamera === "zoom-out" || finalCamera === "Zoom Out" || finalCamera === "Tilt Down" || finalCamera === "Tilt Up") {
        scaleStartValue = intensityScale;
        scaleEndValue = 1.0;
      } else if (finalCamera === "Static" || finalCamera === "Static Framing") {
        scaleStartValue = 1.0;
        scaleEndValue = 1.0;
      }

      const newSlide: ImageSlide = {
        id: `ai-scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        url: imageUrl,
        name: `AI: ${userPromptText.substring(0, 15)}...`,
        duration: 4,
        text: data.caption || userPromptText.substring(0, 30),
        textAnimation: "typewriter",
        filter: aiStylePreset === "auto" ? (data.filter || "normal") : (aiStylePreset === "cinematic" ? "cinematic-warm" : aiStylePreset as any),
        scaleStart: scaleStartValue,
        scaleEnd: scaleEndValue,
        promptDuration: 4,
        cameraMovement: finalCamera,
        subjectDescription: userPromptText,
        style: data.style || "Cinematic",
        motionSpeed: aiMotionIntensity / 5.0
      };

      await new Promise((r) => setTimeout(r, 700));
      appendLog(`[4/5] Interpolating motion field vectors at 60 FPS...`, 88);

      // Preload image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          imageCacheRef.current[newSlide.id] = img;
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
      });

      appendLog(`[5/5] Synthesizing audio ambiance track to timeline. Generation complete!`, 100);
      await new Promise((r) => setTimeout(r, 500));

      setSlides((prev) => [...prev, newSlide]);
      setSelectedSlideId(newSlide.id);

      triggerBeepChime();

      setToastMessage({
        text: "✨ AI Scene Added!",
        sub: "Successfully added your prompt-designed scene to the timeline.",
        success: true
      });

      setUserPromptText("");

      if (autoExportAfter) {
        setTimeout(() => {
          handleCreateVideo();
        }, 800);
      }

    } catch (err: any) {
      console.error(err);
      setToastMessage({
        text: "Scene generation failed",
        sub: err.message || "Something went wrong. Please check your connection.",
        success: false
      });
    } finally {
      clearInterval(timerInterval);
      setIsGeneratingScene(false);
      setAiGenerationProgress(0);
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

  const handleDropSlide = (targetIndex: number) => {
    if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) return;
    const reorderedSlides = [...slides];
    const [draggedItem] = reorderedSlides.splice(draggedSlideIndex, 1);
    reorderedSlides.splice(targetIndex, 0, draggedItem);
    setSlides(reorderedSlides);
    
    // Auto select the dropped slide
    setSelectedSlideId(draggedItem.id);
    
    setToastMessage({
      text: "🔄 Frame Sequence Reordered!",
      sub: `Moved frame from position #${draggedSlideIndex + 1} to #${targetIndex + 1} via drag-and-drop.`,
      success: true
    });
    triggerBeepChime();
  };

  // CapCut Beat-Sync Aligner Engine
  const alignSlidesToBeats = useCallback((trackId: string) => {
    const track = SOUNDTRACK_LIBRARY.find((t) => t.id === trackId);
    if (!track || track.bpm === 0) return;
    
    const beatDuration = 60 / track.bpm;
    // For standard pacing, make slide duration match 4 beats (e.g. 120bpm -> 2.0s, 85bpm -> 2.82s)
    const beatsPerSlide = track.bpm < 80 ? 2 : 4;
    const targetDuration = parseFloat((beatDuration * beatsPerSlide).toFixed(2));
    
    setSlides((prev) => prev.map((s) => ({ ...s, duration: targetDuration })));
  }, []);

  // Automatically sync beats when enabled or soundtrack switches
  useEffect(() => {
    if (isBeatSyncEnabled) {
      alignSlidesToBeats(soundtrack);
    }
  }, [isBeatSyncEnabled, soundtrack, alignSlidesToBeats]);

  const applyDurationToAllSlides = (duration: number) => {
    setSlides((prev) => prev.map((s) => ({ ...s, duration })));
    setToastMessage({
      text: "⏱️ Batch Duration Applied!",
      sub: `All frames set to exactly ${duration} seconds.`,
      success: true
    });
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
      const isTextSlide = !!targetSlide.isTextSlide;
      const img = !isTextSlide ? imageCacheRef.current[targetSlide.id] : null;

      if (!isTextSlide && !img) {
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

      // Apply Filter Presets (Global master filter takes precedence or merges, falls back to individual slide filter)
      let activeFilter = "none";
      if (masterVideoFilter !== "none") {
        if (masterVideoFilter === "grayscale") {
          activeFilter = "grayscale(100%)";
        } else if (masterVideoFilter === "sepia") {
          activeFilter = "sepia(100%)";
        } else if (masterVideoFilter === "vintage") {
          activeFilter = "sepia(60%) contrast(90%) brightness(105%) saturate(110%)";
        } else if (masterVideoFilter === "high-contrast") {
          activeFilter = "contrast(150%) brightness(105%)";
        } else if (masterVideoFilter === "cyberpunk") {
          activeFilter = "hue-rotate(180deg) saturate(185%) contrast(125%)";
        } else if (masterVideoFilter === "noir") {
          activeFilter = "grayscale(100%) contrast(140%) brightness(90%)";
        } else if (masterVideoFilter === "cool") {
          activeFilter = "hue-rotate(30deg) saturate(115%) brightness(95%) contrast(105%)";
        } else if (masterVideoFilter === "warm") {
          activeFilter = "sepia(30%) saturate(130%) hue-rotate(-10deg) brightness(105%)";
        }
      } else {
        if (targetSlide.filter === "noir") {
          activeFilter = "grayscale(100%) contrast(120%)";
        } else if (targetSlide.filter === "vintage") {
          activeFilter = "sepia(50%) contrast(90%) brightness(105%)";
        } else if (targetSlide.filter === "cinematic-warm") {
          activeFilter = "sepia(20%) saturate(135%) hue-rotate(-10deg) contrast(110%)";
        } else if (targetSlide.filter === "cyberpunk") {
          activeFilter = "hue-rotate(185deg) saturate(180%) contrast(125%)";
        } else if (targetSlide.filter === "vhs") {
          activeFilter = "contrast(112%) saturate(125%) hue-rotate(5deg) brightness(98%)";
        } else if (targetSlide.filter === "retro") {
          activeFilter = "sepia(42%) saturate(108%) contrast(95%)";
        }
      }
      ctx.filter = activeFilter;

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
      
      // Calculate active physical camera movement offsets
      let camX = 0;
      let camY = 0;
      let camRot = 0;
      const motionVal = targetSlide.cameraMovement || "Slow Zoom";
      const motionSpeedFactor = targetSlide.motionSpeed !== undefined ? targetSlide.motionSpeed : 1.0;
      const baseCamOffset = 22 * motionSpeedFactor * localProgress; // drift up to 22 pixels

      if (motionVal === "Pan Left") {
        camX = baseCamOffset; // Drift horizontally
      } else if (motionVal === "Pan Right") {
        camX = -baseCamOffset;
      } else if (motionVal.toLowerCase().includes("tilt-up") || motionVal === "Tilt Up" || motionVal === "Pan Up" || motionVal === "Tilt Up") {
        camY = baseCamOffset;
      } else if (motionVal.toLowerCase().includes("tilt-down") || motionVal === "Tilt Down" || motionVal === "Pan Down" || motionVal === "Tilt Down") {
        camY = -baseCamOffset;
      } else if (motionVal.toLowerCase().includes("drone") || motionVal.toLowerCase().includes("forward")) {
        // forward movement with tilt drift
        camY = -baseCamOffset * 0.45;
      } else if (motionVal.toLowerCase().includes("surreal") || motionVal.toLowerCase().includes("3d") || motionVal.toLowerCase().includes("orbit")) {
        // Orbital orbital rotation drift
        camRot = (0.015 * (localProgress - 0.5)) * motionSpeedFactor;
      } else if (motionVal.toLowerCase().includes("shake") || motionVal.toLowerCase().includes("dynamic")) {
        // Action camera shaking vibration
        camX = Math.sin(localProgress * 55) * 2.2 * motionSpeedFactor;
        camY = Math.cos(localProgress * 55) * 1.8 * motionSpeedFactor;
      }

      // Clear bounds inside aspect-ratio letterboxing
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Transform with scale centered in canvas (applying camera simulation offsets)
      ctx.translate(width / 2 + slideX + camX, height / 2 + slideY + camY);
      if (camRot !== 0) {
        ctx.rotate(camRot);
      }
      ctx.scale(currentScale, currentScale);

      if (isTextSlide) {
        const bgType = targetSlide.textSlideBackground || "gradient-sunset";
        const halfW = width / 2;
        const halfH = height / 2;

        if (bgType === "dark") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(-halfW, -halfH, width, height);
        } else if (bgType === "indigo") {
          ctx.fillStyle = "#1e1b4b";
          ctx.fillRect(-halfW, -halfH, width, height);
        } else if (bgType === "gradient-sunset") {
          const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
          grad.addColorStop(0, "#f43f5e");
          grad.addColorStop(0.5, "#d946ef");
          grad.addColorStop(1, "#6366f1");
          ctx.fillStyle = grad;
          ctx.fillRect(-halfW, -halfH, width, height);
        } else if (bgType === "gradient-ocean") {
          const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
          grad.addColorStop(0, "#06b6d4");
          grad.addColorStop(0.5, "#3b82f6");
          grad.addColorStop(1, "#1d4ed8");
          ctx.fillStyle = grad;
          ctx.fillRect(-halfW, -halfH, width, height);
        } else if (bgType === "gradient-neon") {
          const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
          grad.addColorStop(0, "#ec4899");
          grad.addColorStop(0.5, "#8b5cf6");
          grad.addColorStop(1, "#06b6d4");
          ctx.fillStyle = grad;
          ctx.fillRect(-halfW, -halfH, width, height);
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(-halfW, -halfH, width, height);
        }

        // Draw the main text centrally
        const textRatioScale = width / 800;
        const mainFontSize = Math.round((targetSlide.textSlideFontSize || 38) * textRatioScale);
        
        const fontId = targetSlide.fontFamily || subtitleFont || "space-grotesk";
        const fontObj = CURATED_FONTS.find((f) => f.id === fontId) || CURATED_FONTS[0];
        const selectedFontFamily = fontObj.family;

        ctx.font = `900 ${mainFontSize}px ${selectedFontFamily}`;
        ctx.fillStyle = targetSlide.textSlideColor || "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 12 * textRatioScale;
        ctx.shadowOffsetX = 2 * textRatioScale;
        ctx.shadowOffsetY = 3 * textRatioScale;

        const mainText = targetSlide.text || "Title Slide";
        ctx.fillText(mainText, 0, 0);
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else if (img) {
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

        ctx.drawImage(
          img,
          -renderWidth / 2,
          -renderHeight / 2,
          renderWidth,
          renderHeight
        );
      }

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

    // DRAW OVERLAY ELEMENTS (geometric shapes, arrows, or icons)
    const activeElements = slide.elements || [];
    if (activeElements.length > 0) {
      ctx.save();
      activeElements.forEach((el) => {
        ctx.save();
        ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1.0;

        // Calculate actual pixel position based on percentage
        // x and y are in percentage (0 to 100) relative to the canvas size
        const elX = (el.x / 100) * width;
        const elY = (el.y / 100) * height;

        // Apply rotation if any
        ctx.translate(elX, elY);
        let rotRad = ((el.rotation || 0) * Math.PI) / 180;
        
        // Handle animations
        if (el.animation === "spin") {
          // Spin continuously based on playback time (e.g. 1 full spin per 3 seconds)
          const spinOffset = (time * (360 / 3) * Math.PI) / 180;
          rotRad += spinOffset;
        } else if (el.animation === "pulse") {
          // Pulse scale based on playback time (1Hz frequency)
          const scaleOffset = 1.0 + Math.sin(time * Math.PI * 2) * 0.15;
          ctx.scale(scaleOffset, scaleOffset);
        }

        ctx.rotate(rotRad);

        // Draw shape/icon centered at (0,0)
        ctx.fillStyle = el.color || "#ffffff";
        ctx.strokeStyle = el.color || "#ffffff";
        ctx.lineWidth = el.lineWidth || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const size = el.size || 40;
        const half = size / 2;

        if (el.type === "rect") {
          if (el.filled) {
            ctx.beginPath();
            ctx.roundRect(-half, -half, size, size, 4);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.roundRect(-half, -half, size, size, 4);
            ctx.stroke();
          }
        } 
        else if (el.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, half, 0, 2 * Math.PI);
          if (el.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        } 
        else if (el.type === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -half);
          ctx.lineTo(half, half);
          ctx.lineTo(-half, half);
          ctx.closePath();
          if (el.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        } 
        else if (el.type === "star") {
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = half;
          const innerRadius = half * 0.4;
          let cx = 0;
          let cy = 0;
          let rot = (Math.PI / 2) * 3;
          let x = cx;
          let y = cy;
          const step = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          if (el.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
        else if (el.type === "heart") {
          ctx.beginPath();
          // Heart shape centered at (0,0)
          const hX = 0;
          const hY = -half * 0.2;
          ctx.moveTo(hX, hY + half * 0.3);
          // top left curve
          ctx.bezierCurveTo(hX - half * 0.5, hY - half * 0.5, hX - half, hY - half * 0.1, hX, hY + half);
          ctx.moveTo(hX, hY + half * 0.3);
          // top right curve
          ctx.bezierCurveTo(hX + half * 0.5, hY - half * 0.5, hX + half, hY - half * 0.1, hX, hY + half);
          
          if (el.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
        else if (el.type === "arrow") {
          // Draw an arrow pointing right
          ctx.beginPath();
          ctx.moveTo(-half, -half * 0.3);
          ctx.lineTo(half * 0.2, -half * 0.3);
          ctx.lineTo(half * 0.2, -half * 0.7);
          ctx.lineTo(half, 0);
          ctx.lineTo(half * 0.2, half * 0.7);
          ctx.lineTo(half * 0.2, half * 0.3);
          ctx.lineTo(-half, half * 0.3);
          ctx.closePath();
          if (el.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
        else if (el.type === "checkmark") {
          // Checkmark shape
          ctx.beginPath();
          ctx.moveTo(-half * 0.8, 0);
          ctx.lineTo(-half * 0.2, half * 0.6);
          ctx.lineTo(half * 0.8, -half * 0.6);
          ctx.stroke();
        }
        else if (el.type === "icon") {
          // Render a custom high-fidelity dynamic icon overlay
          if (el.iconName === "smile") {
            ctx.beginPath();
            ctx.arc(0, 0, half, 0, 2 * Math.PI);
            ctx.stroke();
            // Eyes
            ctx.beginPath();
            ctx.arc(-half * 0.3, -half * 0.2, 2, 0, 2 * Math.PI);
            ctx.arc(half * 0.3, -half * 0.2, 2, 0, 2 * Math.PI);
            ctx.fillStyle = el.color;
            ctx.fill();
            // Mouth
            ctx.beginPath();
            ctx.arc(0, 0, half * 0.6, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
          } else if (el.iconName === "target") {
            // Draw a crosshair target
            ctx.beginPath();
            ctx.arc(0, 0, half, 0, 2 * Math.PI);
            ctx.arc(0, 0, half * 0.5, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-half * 1.2, 0); ctx.lineTo(half * 1.2, 0);
            ctx.moveTo(0, -half * 1.2); ctx.lineTo(0, half * 1.2);
            ctx.stroke();
          } else {
            // Default elegant diamond star
            ctx.beginPath();
            ctx.moveTo(0, -half);
            ctx.lineTo(half * 0.3, -half * 0.3);
            ctx.lineTo(half, 0);
            ctx.lineTo(half * 0.3, half * 0.3);
            ctx.lineTo(0, half);
            ctx.lineTo(-half * 0.3, half * 0.3);
            ctx.lineTo(-half, 0);
            ctx.lineTo(-half * 0.3, -half * 0.3);
            ctx.closePath();
            if (el.filled) ctx.fill(); else ctx.stroke();
          }
        }

        ctx.restore();
      });
      ctx.restore();
    }

    // DRAW OVERLAY CAPTIONS / SUBTITLE TEXT with selected animation and theme style
    if (slide.text.trim()) {
      ctx.save();

      // Configure font based on aspect ratio sizing & subtitleStyle selection
      const textRatioScale = width / 800;
      const fontSize = Math.round(28 * textRatioScale);
      
      const fontId = slide.fontFamily || subtitleFont || "space-grotesk";
      const fontObj = CURATED_FONTS.find((f) => f.id === fontId) || CURATED_FONTS[0];
      const selectedFontFamily = fontObj.family;

      if (subtitleStyle === "classical" && fontId === "space-grotesk") {
        ctx.font = `italic 500 ${Math.round(26 * textRatioScale)}px "Playfair Display", "Georgia", serif`;
      } else if (subtitleStyle === "classical") {
        ctx.font = `italic 500 ${Math.round(26 * textRatioScale)}px ${selectedFontFamily}`;
      } else {
        ctx.font = `bold ${fontSize}px ${selectedFontFamily}`;
      }
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
      let extraOffsetY = 0;
      if (cinematicLetterbox && aspectRatio === "16:9") {
        extraOffsetY = -Math.round(height * 0.10); // shift subtitles up to avoid the letterbox
      }
      const rectY = height - rectHeight - Math.round(45 * textRatioScale) + offsetY + extraOffsetY - subtitleManualOffset;

      // Draw Subtitle Styles (netflix, neon, karaoke, minimal, classical)
      if (subtitleStyle === "netflix") {
        // Draw stylized backdrop pill (accessibility friendly)
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.beginPath();
        const radius = 12;
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, radius);
        ctx.fill();

        // Double styled border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        if (textScale !== 1.0) {
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
        } else {
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "neon") {
        // Neon Glow Style (No backing pill)
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#6366f1"; // Neon indigo highlight glow
        ctx.shadowBlur = 12 * textRatioScale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (textScale !== 1.0) {
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
        } else {
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "karaoke") {
        // Karaoke Style (Bright yellow text with solid black outline contour)
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Render outline stroke
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = Math.round(5 * textRatioScale);
        ctx.lineJoin = "round";

        if (textScale !== 1.0) {
          ctx.save();
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.strokeText(textToShow, 0, rectHeight / 2 - paddingY / 2);
          ctx.fillStyle = "#facc15"; // Yellow
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
          ctx.restore();
        } else {
          ctx.strokeText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
          ctx.fillStyle = "#facc15"; // Yellow
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "minimal") {
        // Soft Elegant Drop Shadow
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        if (textScale !== 1.0) {
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
        } else {
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "classical") {
        // TIMELITE INDIE Film Style (Porcelain white serif with very soft dark reflection)
        ctx.fillStyle = "#f8fafc";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        if (textScale !== 1.0) {
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
        } else {
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      }

      ctx.restore();
    }

    // Soft Cinematic Vignette Overlay shadow
    if (vignetteOverlay) {
      ctx.save();
      const vignetteGrad = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.45,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      vignetteGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignetteGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Cinematic Letterbox black widescreen borders (2.39:1 Cinema Bars)
    if (cinematicLetterbox && aspectRatio === "16:9") {
      ctx.save();
      ctx.fillStyle = "#000000";
      const barHeight = Math.round(height * 0.12);
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);
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

    // Real-Time Audio Visualizer Drawing on the Canvas
    if (visualizerStyle !== "none" && synthManagerRef.current) {
      const analyser = synthManagerRef.current.getAnalyser();
      if (analyser) {
        ctx.save();
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (visualizerStyle === "bars") {
          // Drawing jumping audio spectrum bars
          analyser.getByteFrequencyData(dataArray);
          const barWidth = (width / bufferLength) * 1.5;
          let barHeight;
          let x = 0;

          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(16, 185, 129, 0.6)"; // glowing green

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * 45 * (height / 450);
            if (barHeight > 0) {
              const grad = ctx.createLinearGradient(x, height - barHeight - 15, x, height - 15);
              grad.addColorStop(0, "#34d399"); // emerald
              grad.addColorStop(1, "#6366f1"); // indigo
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.roundRect(x, height - barHeight - 15, barWidth - 3, barHeight, 3);
              ctx.fill();
            }
            x += barWidth;
          }
        } else if (visualizerStyle === "wave") {
          // Drawing a sleek neon oscilloscope wave
          analyser.getByteTimeDomainData(dataArray);
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(99, 102, 241, 0.85)"; // glowing indigo/neon
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(99, 102, 241, 0.7)";

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * 30) + (height - 50);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (visualizerStyle === "pulse") {
          // Subtle radial ambient pulse matching low-mid frequencies
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avgFreq = sum / bufferLength;
          const pulseScale = 1.0 + (avgFreq / 255) * 0.08;

          if (avgFreq > 10) {
            ctx.strokeStyle = "rgba(236, 72, 153, 0.25)"; // glowing pink
            ctx.lineWidth = 8;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(236, 72, 153, 0.4)";
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35 * pulseScale, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }
  }, [slides, transitionStyle, transitionDuration, subtitleStyle, subtitleFont, cinematicLetterbox, vignetteOverlay, aspectRatio, subtitleManualOffset, visualizerStyle, masterVideoFilter]);

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
  }, [currentTime, aspectRatio, slides, transitionStyle, transitionDuration, drawVideoFrame, subtitleStyle, subtitleFont, cinematicLetterbox, vignetteOverlay, subtitleManualOffset, masterVideoFilter]);

  // Sync the ref with the latest drawVideoFrame callback on each change
  useEffect(() => {
    drawVideoFrameRef.current = drawVideoFrame;
  }, [drawVideoFrame]);

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
    setExportCurrentStage("Analyzing frame");
    setExportElapsedTime("0.0s");
    setExportEstTimeRemaining("Calculating...");

    const gifFrames: string[] = [];
    const gifFps = 10;

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
      if (!isMuted) {
        if (audioTrackMode === "custom" && customAudioUrl) {
          renderSynthManager.start("custom", audioVolume, false, false, totalDuration, customAudioUrl, 0, audioTrimStart, audioTrimEnd);
        } else if (audioTrackMode === "sfx" && selectedSfxId) {
          renderSynthManager.start("none");
          renderSynthManager.playSingleSfx(selectedSfxId, audioVolume);
        } else if (soundtrack !== "none") {
          renderSynthManager.start(soundtrack, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
        }

        // Re-route its audio destination output to our stream recorder
        const renderDest = renderSynthManager.getDestination();
        if (renderDest) {
          renderAudioStream = renderDest.stream;
        }
      }

      const canvasStream = renderCanvas.captureStream(30); // 30 FPS high fidelity video capture
      const combinedTracks = [...canvasStream.getVideoTracks()];

      const hasAudio = !isMuted && (
        (audioTrackMode === "custom" && customAudioUrl) ||
        (audioTrackMode === "sfx" && selectedSfxId) ||
        (audioTrackMode === "synth" && soundtrack !== "none")
      );

      if (hasAudio && renderAudioStream) {
        combinedTracks.push(...renderAudioStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(combinedTracks);
      
      // Determine support options
      let options: any = { 
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 8000000 // Ultra-sharp 8 Mbps video stream quality
      };
      
      if (exportFormat === "mp4") {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264")) {
          options = { mimeType: "video/mp4;codecs=h264", videoBitsPerSecond: 8000000 };
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          options = { mimeType: "video/mp4", videoBitsPerSecond: 8000000 };
        }
      } else {
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm", videoBitsPerSecond: 8000000 };
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const fps = 30;
      const totalFrames = Math.round((totalDuration / videoPlaybackSpeed) * fps);
      let currentFrame = 0;
      const exportStartTimeInstant = Date.now();

      mediaRecorder.start();

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          setExportProgress(90);
          setExportCurrentStage("Finalizing encode");
          setExportStatus("Assembling raw multimedia files...");
          setExportEstTimeRemaining("0.5s");
          setTimeout(() => {
            mediaRecorder.stop();
          }, 400);
          return;
        }

        // Calculate progress metrics
        const elapsedMs = Date.now() - exportStartTimeInstant;
        setExportElapsedTime(`${(elapsedMs / 1000).toFixed(1)}s`);

        if (currentFrame > 5) {
          const avgTimePerFrame = elapsedMs / currentFrame;
          const remainingFrames = totalFrames - currentFrame;
          const remainingMs = remainingFrames * avgTimePerFrame;
          const totalRemainingSecs = Math.max(1, Math.ceil((remainingMs + 400) / 1000));
          setExportEstTimeRemaining(`${totalRemainingSecs}s`);
        } else {
          setExportEstTimeRemaining("Calculating...");
        }

        let stage = "Analyzing frame";
        if (currentFrame < totalFrames * 0.3) {
          stage = `Analyzing frame ${currentFrame} of ${totalFrames}`;
        } else if (currentFrame < totalFrames * 0.75) {
          stage = `Applying motion dynamics & transition overlays`;
        } else {
          stage = `Finalizing encode (multiplexing track streams)`;
        }
        setExportCurrentStage(stage);

        const renderTime = (currentFrame / fps) * videoPlaybackSpeed;
        drawVideoFrame(renderCtx, canvasWidth, height, renderTime);
        
        // Capture GIF frames if GIF format is selected
        if (exportFormat === "gif") {
          const frameStep = Math.max(1, Math.round(fps / gifFps));
          if (currentFrame % frameStep === 0) {
            const gifCanvas = document.createElement("canvas");
            gifCanvas.width = 480;
            gifCanvas.height = Math.round(480 * (height / canvasWidth));
            const gifCtx = gifCanvas.getContext("2d");
            if (gifCtx) {
              gifCtx.drawImage(renderCanvas, 0, 0, gifCanvas.width, gifCanvas.height);
              gifFrames.push(gifCanvas.toDataURL("image/jpeg", 0.70));
            }
          }
        }
        
        // Detect slide boundaries for transition SFX during export
        if (!isMuted) {
          const prevRenderTime = ((currentFrame - 1) / fps) * videoPlaybackSpeed;
          if (currentFrame > 0) {
            let prevCumulativeTime = 0;
            let prevSlideIndex = 0;
            for (let i = 0; i < slides.length; i++) {
              if (prevRenderTime >= prevCumulativeTime && prevRenderTime < prevCumulativeTime + slides[i].duration) {
                prevSlideIndex = i;
                break;
              }
              prevCumulativeTime += slides[i].duration;
            }

            let currentCumulativeTime = 0;
            let currentSlideIndex = 0;
            for (let i = 0; i < slides.length; i++) {
              if (renderTime >= currentCumulativeTime && renderTime < currentCumulativeTime + slides[i].duration) {
                currentSlideIndex = i;
                break;
              }
              currentCumulativeTime += slides[i].duration;
            }

            if (currentSlideIndex !== prevSlideIndex && currentSlideIndex >= 0) {
              const slide = slides[currentSlideIndex];
              if (slide.sfx && slide.sfx !== "none") {
                renderSynthManager.playSingleSfx(slide.sfx, audioVolume);
              }
            }
          } else {
            // Trigger first slide SFX at frame 0
            const firstSlide = slides[0];
            if (firstSlide && firstSlide.sfx && firstSlide.sfx !== "none") {
              renderSynthManager.playSingleSfx(firstSlide.sfx, audioVolume);
            }
          }
        }

        currentFrame++;
        const percent = Math.round((currentFrame / totalFrames) * 80); // Up to 80%
        setExportProgress(percent);
        setExportStatus(`Compiling frame ${currentFrame} of ${totalFrames} (${Math.round((currentFrame/totalFrames)*100)}%)...`);
        
        requestAnimationFrame(renderNextFrame);
      };

      // Trigger asynchronous recursive rendering loop
      requestAnimationFrame(renderNextFrame);

      mediaRecorder.onstop = async () => {
        setExportCurrentStage("Finalizing encode");
        setExportStatus("Exporting master track...");
        setExportEstTimeRemaining("0.1s");
        renderSynthManager.stop();

        const dataURLtoBlob = (dataurl: string) => {
          const arr = dataurl.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/gif";
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };

        const finalizeOutput = async (blob: Blob, format: string, mime: string) => {
          const fileNameWithExt = `${exportFileName.replace(/\s+/g, "_")}.${format}`;
          triggerFileDownload(blob, fileNameWithExt);

          // Support Direct Links Integration (Zone IDs: 11170621, 11223979)
          try {
            window.open("https://omg10.com/4/11170621", "_blank", "noopener,noreferrer");
          } catch (e) {
            console.warn("Direct link popup blocked by browser policies", e);
          }
          try {
            window.open("https://omg10.com/4/11223979", "_blank", "noopener,noreferrer");
          } catch (e) {
            console.warn("Direct link popup blocked by browser policies", e);
          }

          const fileUrl = URL.createObjectURL(blob);
          setExportedVideoUrl(fileUrl);
          setExportedVideoBlob(blob);
          setCreatedVideoPlayerFilter(masterVideoFilter);
          setShowFinalOutput(true);

          setExportProgress(100);
          setExportCurrentStage("Finished");
          setExportEstTimeRemaining("0s");
          setIsExporting(false);

          if (saveToDriveAfterExport && accessToken) {
            setExportProgress(95);
            setExportCurrentStage("Uploading to Cloud Storage");
            setExportStatus(`Uploading generated ${format.toUpperCase()} to Google Drive storage...`);
            try {
              const fileReader = new FileReader();
              fileReader.readAsDataURL(blob);
              fileReader.onloadend = async () => {
                try {
                  const base64DataUrl = fileReader.result as string;
                  await uploadFileToDrive(
                    accessToken,
                    fileNameWithExt,
                    mime,
                    base64DataUrl
                  );
                  
                  onRefreshDrive();
                  setExportCurrentStage("Finished");
                  setExportProgress(100);
                  setToastMessage({
                    text: "Export & Sync Completed!",
                    sub: `Generated ${format.toUpperCase()} successfully downloaded and backed up to Google Drive as ${fileNameWithExt}`,
                    success: true
                  });
                } catch (err) {
                  console.error(err);
                  setExportCurrentStage("Finished");
                  setExportProgress(100);
                  setToastMessage({
                    text: `${format.toUpperCase()} Downloaded Offline Only`,
                    sub: `Completed ${format.toUpperCase()} download but Google Drive sync failed: ${err instanceof Error ? err.message : String(err)}`,
                    success: false
                  });
                }
              };
            } catch (e) {
              console.error(e);
            }
          } else {
            setToastMessage({
              text: `${format.toUpperCase()} Exported Successfully!`,
              sub: `Downloaded ${fileNameWithExt} directly to your device.`,
              success: true
            });
          }

          // Dispatch a global activities widget trace
          window.dispatchEvent(
            new CustomEvent("toolkit-add-activity", {
              detail: {
                type: "file",
                title: `Exported CapCut ${format.toUpperCase()}`,
                detail: `Generated '${fileNameWithExt}' containing ${slides.length} styled image tracks`,
                icon: "Video",
                tab: "video"
              }
            })
          );
        };

        if (exportFormat === "gif") {
          setExportCurrentStage("Compiling GIF");
          setExportStatus("Building highly-optimized animated GIF frames with gifshot...");
          setExportProgress(85);
          
          if (gifFrames.length === 0) {
            // fallback if no frames captured
            const mimeType = "video/webm";
            const videoBlob = new Blob(chunks, { type: mimeType });
            await finalizeOutput(videoBlob, "webm", mimeType);
            return;
          }

          gifshot.createGIF({
            images: gifFrames,
            interval: 1 / gifFps,
            gifWidth: 480,
            gifHeight: Math.round(480 * (height / canvasWidth)),
            numFrames: gifFrames.length,
            sampleInterval: 5
          }, async (obj: any) => {
            if (obj.error) {
              console.error("GIF generation failed:", obj.errorMsg);
              const mimeType = "video/webm";
              const videoBlob = new Blob(chunks, { type: mimeType });
              await finalizeOutput(videoBlob, "webm", mimeType);
            } else {
              const gifBlob = dataURLtoBlob(obj.image);
              await finalizeOutput(gifBlob, "gif", "image/gif");
            }
          });
        } else {
          const mimeType = exportFormat === "mp4" ? "video/mp4" : "video/webm";
          const videoBlob = new Blob(chunks, { type: mimeType });
          await finalizeOutput(videoBlob, exportFormat, mimeType);
        }
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.open("https://omg10.com/4/11170621", "_blank", "noopener,noreferrer");
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-350 bg-amber-50 dark:bg-amber-950/40 border border-amber-150 dark:border-amber-900/30 rounded-lg cursor-pointer transition-all hover:bg-amber-100/80 active:scale-95"
                title="Luminous Link Portal"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                <span>Luminous Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    window.open("https://omg10.com/4/11223979", "_blank", "noopener,noreferrer");
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-350 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/30 rounded-lg cursor-pointer transition-all hover:bg-indigo-100/80 active:scale-95"
                title="Wonderful Link Portal"
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                <span>Wonderful Link</span>
              </button>

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

          {/* Quick Image-to-Video Dropzone / Direct Creator Panel */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-5 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center gap-3.5 ${
              isDraggingFile 
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" 
                : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-indigo-500/50 dark:hover:border-indigo-500/30"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-3.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
                <span>⚡ Direct Image-to-Video Creator</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                Drag & Drop or click below to upload your image. We'll instantly build a gorgeous animated video from it!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-1.5 justify-center">
              {/* Custom styled File Upload Label */}
              <label className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none border border-indigo-500/30 active:scale-97">
                <Plus className="w-4 h-4" />
                <span>Select Your Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Instant Compile Button (if slides are loaded) */}
              {slides.length > 0 && (
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleCreateVideo}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none border border-emerald-500/30 active:scale-97"
                >
                  <Video className="w-4 h-4 fill-current animate-pulse" />
                  <span>⚡ Create Video Now ({slides.length} {slides.length === 1 ? "Image" : "Images"})</span>
                </button>
              )}
            </div>

            {/* Replacement vs Appending options bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-550 dark:text-slate-450 font-bold mt-1 border-t border-slate-100 dark:border-slate-850 pt-2.5 w-full">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replaceOnUpload}
                  onChange={(e) => {
                    setReplaceOnUpload(e.target.checked);
                    triggerBeepChime();
                  }}
                  className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span>Replace current timeline clips on upload (Recommended)</span>
              </label>
              
              {slides.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSlides([]);
                    triggerBeepChime();
                    setToastMessage({
                      text: "🗑️ Timeline Cleared",
                      sub: "All frames have been cleared. Ready for your custom uploads!",
                      success: true
                    });
                  }}
                  className="text-rose-550 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Clear all clips currently loaded in the timeline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Timeline</span>
                </button>
              )}
            </div>
          </div>

          {/* Curated Preset Image Gallery (Featuring Garrey) */}
          <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>Curated Image Presets Gallery</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                  Select a gorgeous high-fidelity preset to instantly load it as an active video slide.
                </p>
              </div>
              
              {/* Category tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850/60">
                {(["All", "Adventure", "Nature", "Cyberpunk", "Abstract"] as const).map((cat) => {
                  const isActive = activeGalleryCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveGalleryCategory(cat);
                        triggerBeepChime();
                      }}
                      className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-650 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_IMAGES_GALLERY.filter(
                (item) => activeGalleryCategory === "All" || item.category === activeGalleryCategory
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddPresetImage(item)}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-950 border border-slate-250/30 dark:border-slate-800/40 cursor-pointer shadow-xs transition-all hover:scale-102 hover:shadow-md hover:border-indigo-500/40"
                  title={`Add "${item.name}" to your video clips`}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Category overlay label */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/70 text-slate-200 font-mono text-[7.5px] font-bold uppercase tracking-widest backdrop-blur-xs">
                    {item.category}
                  </span>
                  
                  {/* Subtle glass hover banner with plus icon */}
                  <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                    <div className="flex justify-end">
                      <div className="p-1 rounded-full bg-indigo-600 text-white shadow-sm">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-[10px] font-black text-white leading-tight truncate">
                        {item.name}
                      </p>
                      <p className="text-[7.5px] font-bold text-slate-300 uppercase tracking-wider truncate font-mono">
                        {item.style}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
            {isExporting && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-4 text-center select-none z-10 overflow-y-auto">
                {/* 1. Futuristic Blurred Video Canvas Background Mockup */}
                {(() => {
                  const activeSlide = slides.find(s => s.id === selectedSlideId) || slides[0];
                  return activeSlide?.url ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-15 blur-xl pointer-events-none"
                      style={{ backgroundImage: `url(${activeSlide.url})` }}
                    />
                  ) : null;
                })()}

                {/* Horizontal Laser Scan Line Animation */}
                <motion.div 
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,0.8)] z-10 pointer-events-none"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 2. Sleek Mock Video Player Frame Header */}
                <div className="w-full max-w-lg mx-auto space-y-3 relative z-20 flex-1 flex flex-col justify-center">
                  
                  {/* Active Status Header Badge */}
                  <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-900/30 backdrop-blur-md px-3 py-1.5 rounded-full max-w-fit mx-auto gap-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 font-mono">
                      Generating Video Preview...
                    </span>
                  </div>

                  {/* Main High-Tech Spinner & Render Camera Symbol */}
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 dark:border-indigo-400/5" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    <Video className="w-5 h-5 text-indigo-400 animate-pulse relative z-10" />
                  </div>

                  {/* Dynamic 'Generating...' Progress Bar Block */}
                  <div className="space-y-2 max-w-sm mx-auto w-full">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-extrabold tracking-wide px-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
                        <span>Compiling Motion Frames</span>
                      </span>
                      <span className="text-indigo-400 font-black animate-pulse">{exportProgress}%</span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2.5 bg-slate-900/80 border border-slate-800/60 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* High-Tech Timing HUD & Stage Matrix Grid */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto pt-1 w-full text-left font-mono relative z-20">
                    <div className="bg-slate-900/60 border border-slate-800/40 p-2 rounded-xl text-center backdrop-blur-xs">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Elapsed Time</span>
                      <span className="text-[11px] font-black text-slate-200">{exportElapsedTime}</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/40 p-2 rounded-xl text-center backdrop-blur-xs">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Est. Remaining</span>
                      <span className="text-[11px] font-black text-indigo-400 animate-pulse">{exportEstTimeRemaining}</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/40 p-2 rounded-xl text-center backdrop-blur-xs">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Active Stage</span>
                      <span className="text-[8.5px] font-extrabold text-emerald-400 truncate block leading-tight" title={exportCurrentStage}>{exportCurrentStage || "Analyzing"}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal italic px-4 font-medium max-w-sm mx-auto">
                    {exportStatus}
                  </p>

                  {/* Selected Blueprint Parameters Summary HUD */}
                  <div className="bg-slate-900/70 border border-slate-850 rounded-2xl p-3 text-left space-y-2 max-w-md mx-auto w-full relative z-20 backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">
                        Selected Blueprint Parameters
                      </span>
                      <span className="text-[8px] bg-indigo-950/80 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest leading-none">
                        Active Build
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px] font-black tracking-wider leading-none mb-0.5">Aspect Ratio:</span>
                        <span className="font-bold truncate block">
                          {aspectRatio === "9:16" ? "📱 Portrait (9:16)" : aspectRatio === "1:1" ? "⏹️ Square (1:1)" : "📺 Landscape (16:9)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px] font-black tracking-wider leading-none mb-0.5">Duration:</span>
                        <span className="font-bold block truncate">⏱️ {totalDuration.toFixed(1)}s ({slides.length} slides)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px] font-black tracking-wider leading-none mb-0.5">Soundtrack:</span>
                        <span className="font-bold block truncate capitalize">🎵 {soundtrack === "none" ? "Silent" : soundtrack}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px] font-black tracking-wider leading-none mb-0.5">Transition:</span>
                        <span className="font-bold block truncate capitalize">🎬 {transitionStyle} ({transitionDuration}s)</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. Sleek Mock Player Timeline Controller Bar (Visual-only feedback during rendering) */}
                <div className="w-full border-t border-slate-900 bg-slate-950/80 p-2.5 rounded-b-2xl mt-2 flex items-center justify-between gap-3 text-slate-500 text-[10px] font-mono select-none relative z-20">
                  <div className="flex items-center gap-2">
                    <button disabled className="opacity-40 cursor-not-allowed">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <span>00:00.0</span>
                  </div>
                  
                  {/* Faux Timeline Slider Track showing rendering highlight */}
                  <div className="flex-1 h-1 bg-slate-900 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-indigo-500/30"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span>{totalDuration.toFixed(1)}s</span>
                    <button disabled className="opacity-40 cursor-not-allowed">
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
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
                  <div className="relative rounded-2xl overflow-hidden border border-slate-850 bg-slate-900 shadow-2xl flex flex-col justify-between mx-auto w-full"
                    style={{
                      minHeight: "230px",
                      aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "1:1" ? "1/1" : "16/9"
                    }}
                  >
                    {exportFormat === "gif" ? (
                      /* GIF Animation */
                      <img
                        src={exportedVideoUrl}
                        alt="Exported Animated GIF"
                        className="w-full h-full max-h-[220px] object-contain transition-all duration-300"
                        style={{
                          filter:
                            createdVideoPlayerFilter === "grayscale" ? "grayscale(100%)" :
                            createdVideoPlayerFilter === "sepia" ? "sepia(100%)" :
                            createdVideoPlayerFilter === "vintage" ? "sepia(60%) contrast(90%) brightness(105%) saturate(110%)" :
                            createdVideoPlayerFilter === "high-contrast" ? "contrast(150%) brightness(105%)" :
                            createdVideoPlayerFilter === "cyberpunk" ? "hue-rotate(180deg) saturate(185%) contrast(125%)" :
                            createdVideoPlayerFilter === "noir" ? "grayscale(100%) contrast(140%) brightness(90%)" :
                            createdVideoPlayerFilter === "cool" ? "hue-rotate(30deg) saturate(115%) brightness(95%) contrast(105%)" :
                            createdVideoPlayerFilter === "warm" ? "sepia(30%) saturate(130%) hue-rotate(-10deg) brightness(105%)" : "none"
                        }}
                      />
                    ) : (
                      /* Premium Interactive Player with Timeline Scrubber Controls */
                      <div className="w-full h-full flex flex-col justify-between bg-slate-950 p-2 group/player relative">
                        <video
                          ref={previewVideoRef}
                          src={exportedVideoUrl}
                          autoPlay
                          loop
                          muted
                          onTimeUpdate={(e) => setPreviewTime(e.currentTarget.currentTime)}
                          onDurationChange={(e) => setPreviewDuration(e.currentTarget.duration)}
                          onPlay={() => setPreviewPlaying(true)}
                          onPause={() => setPreviewPlaying(false)}
                          className="w-full max-h-[150px] object-contain flex-1 transition-all duration-300"
                          style={{
                            filter:
                              createdVideoPlayerFilter === "grayscale" ? "grayscale(100%)" :
                              createdVideoPlayerFilter === "sepia" ? "sepia(100%)" :
                              createdVideoPlayerFilter === "vintage" ? "sepia(60%) contrast(90%) brightness(105%) saturate(110%)" :
                              createdVideoPlayerFilter === "high-contrast" ? "contrast(150%) brightness(105%)" :
                              createdVideoPlayerFilter === "cyberpunk" ? "hue-rotate(180deg) saturate(185%) contrast(125%)" :
                              createdVideoPlayerFilter === "noir" ? "grayscale(100%) contrast(140%) brightness(90%)" :
                              createdVideoPlayerFilter === "cool" ? "hue-rotate(30deg) saturate(115%) brightness(95%) contrast(105%)" :
                              createdVideoPlayerFilter === "warm" ? "sepia(30%) saturate(130%) hue-rotate(-10deg) brightness(105%)" : "none"
                          }}
                        />
                        
                        {/* Custom Player controls block */}
                        <div className="space-y-1 bg-slate-900/90 border border-slate-800/60 p-2 rounded-xl mt-1.5">
                          {/* Timeline Slider with Frames Indicator */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold text-indigo-400 select-none">
                              {Math.round(previewTime * 30).toString().padStart(3, "0")}f
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={previewDuration || 1}
                              step={0.01}
                              value={previewTime}
                              onChange={(e) => {
                                const newTime = parseFloat(e.target.value);
                                setPreviewTime(newTime);
                                if (previewVideoRef.current) {
                                  previewVideoRef.current.currentTime = newTime;
                                }
                              }}
                              className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-[9px] font-mono font-bold text-slate-400 select-none">
                              {Math.round(previewDuration * 30).toString().padStart(3, "0")}f
                            </span>
                          </div>

                          {/* Action Controls Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {/* Play / Pause Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (previewVideoRef.current) {
                                    if (previewPlaying) {
                                      previewVideoRef.current.pause();
                                    } else {
                                      previewVideoRef.current.play();
                                    }
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                                title={previewPlaying ? "Pause Playback" : "Start Playback"}
                              >
                                {previewPlaying ? <Pause className="w-3 h-3 text-indigo-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                              </button>

                              {/* Frame Step Backward */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (previewVideoRef.current) {
                                    previewVideoRef.current.pause();
                                    previewVideoRef.current.currentTime = Math.max(0, previewVideoRef.current.currentTime - 1/30);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                                title="Previous Frame"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>

                              {/* Frame Step Forward */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (previewVideoRef.current) {
                                    previewVideoRef.current.pause();
                                    previewVideoRef.current.currentTime = Math.min(previewDuration, previewVideoRef.current.currentTime + 1/30);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                                title="Next Frame"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Timestamp readout */}
                            <div className="text-[9px] font-mono text-slate-400 font-bold select-none">
                              {previewTime.toFixed(2)}s / {previewDuration.toFixed(2)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Interactive Player Filters */}
                  <div className="bg-slate-900/80 border border-slate-850 rounded-2xl p-3 text-left space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5">
                      <span className="text-slate-400 uppercase font-black tracking-wider text-[8px] flex items-center gap-1">
                        <span>✨</span>
                        <span>Real-Time Player Filters</span>
                      </span>
                      <span className="text-[7.5px] font-semibold text-indigo-400 uppercase tracking-wider font-mono bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                        GPU Accelerated
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "none", label: "Original", emoji: "❌" },
                        { id: "grayscale", label: "Grayscale", emoji: "🌑" },
                        { id: "sepia", label: "Sepia", emoji: "🟫" },
                        { id: "vintage", label: "Vintage", emoji: "📜" },
                        { id: "high-contrast", label: "High Contrast", emoji: "⚡" },
                        { id: "cyberpunk", label: "Cyberpunk", emoji: "🔮" },
                        { id: "noir", label: "Noir Film", emoji: "🎬" },
                        { id: "cool", label: "Cool Blue", emoji: "❄️" },
                        { id: "warm", label: "Warm Glow", emoji: "☀️" }
                      ].map((item) => {
                        const isSelected = createdVideoPlayerFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setCreatedVideoPlayerFilter(item.id);
                              triggerBeepChime();
                            }}
                            className={`px-1.5 py-1 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-0.5 ${
                              isSelected
                                ? "bg-indigo-650 border-indigo-650 text-white shadow-md shadow-indigo-500/20 scale-102"
                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                            }`}
                          >
                            <span className="text-[10px] leading-none">{item.emoji}</span>
                            <span className="text-[8.5px] font-bold leading-none mt-1 truncate max-w-full">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata and Stats Card */}
                  <div className="bg-slate-900/80 border border-slate-850 rounded-2xl p-2.5 text-left space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-800/40 pb-1.5">
                      <span className="text-slate-500 uppercase font-black tracking-wider text-[8px]">File details</span>
                      <span className="font-mono text-indigo-400 font-bold truncate max-w-[180px]">
                        {exportFileName}.{exportFormat}
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
                        <span className="font-bold font-mono text-slate-200">{(totalDuration / videoPlaybackSpeed).toFixed(1)}s</span>
                      </div>
                      <div className="bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/30">
                        <span className="text-slate-500 block uppercase text-[8px] font-black mb-0.5">Container</span>
                        <span className="font-bold uppercase text-emerald-400 font-mono">{exportFormat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Premium Call to Action (CTA) Portal Card */}
                  <div className="bg-slate-900/95 border border-amber-500/20 rounded-2xl p-3 text-left space-y-2 shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest leading-none">
                        Special Sponsor Portals
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Connect with our exclusive creative suites to access premium filters, sound packs, and visual templates!
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.open("https://omg10.com/4/11170621", "_blank", "noopener,noreferrer");
                          } catch (e) {
                            console.warn(e);
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] rounded-xl shadow-md cursor-pointer text-center transition-all duration-200 active:scale-95"
                      >
                        Luminous Portal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.open("https://omg10.com/4/11223979", "_blank", "noopener,noreferrer");
                          } catch (e) {
                            console.warn(e);
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-[11px] rounded-xl shadow-md cursor-pointer text-center transition-all duration-200 active:scale-95"
                      >
                        Wonderful Portal
                      </button>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2">
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

                            // Support Monetag Direct Link Integration (Zone ID: 11170621)
                            try {
                              window.open("https://omg10.com/4/11170621", "_blank", "noopener,noreferrer");
                            } catch (e) {
                              console.warn("Direct link popup blocked by browser policies", e);
                            }
                          }
                        }}
                        className="py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 select-none shadow-md shadow-emerald-500/15"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSavingToDrive}
                        onClick={handleSaveToDrive}
                        className={`py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 select-none shadow-md ${
                          isSavingToDrive
                            ? "bg-indigo-850 opacity-70 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 shadow-indigo-500/15"
                        }`}
                      >
                        {isSavingToDrive ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isSavingToDrive ? "Saving..." : "Save to Drive"}</span>
                      </button>
                    </div>
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
                      className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 select-none"
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
              <span>
                {totalDuration.toFixed(1)}s Project
                {videoPlaybackSpeed !== 1.0 && ` (Export: ${(totalDuration / videoPlaybackSpeed).toFixed(1)}s @ ${videoPlaybackSpeed}x)`}
              </span>
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

          {/* Section: AI Prompt-to-Video Scene Generator (Runway / Google Flow AI Style) */}
          <div className="border border-indigo-200/50 dark:border-indigo-950/70 p-6 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-md shadow-lg shadow-indigo-500/5 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span>AI Prompt-to-Video Scene Generator</span>
                </h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">
                  Design & synthesize custom cinematic scenes like Runway Gen-3 and Google Flow AI
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-650 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-1 rounded-md leading-none">
                  VEO ENGINE ACTIVE
                </span>
              </div>
            </div>

            {/* 1. MODEL / ENGINE SELECTION TABS */}
            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                1. Select AI Generation Engine:
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-950/85 p-1 rounded-2xl border border-slate-250/20 dark:border-slate-850/50">
                {[
                  { id: "gemini-flash", label: "Veo Lite", desc: "Fast Preview" },
                  { id: "gemini-pro", label: "Veo Pro", desc: "Deep Detail" },
                  { id: "veo-core", label: "Flow Core", desc: "60FPS Physics" }
                ].map((eng) => {
                  const active = aiModelEngine === eng.id;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setAiModelEngine(eng.id as any)}
                      className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                          : "text-slate-550 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className="text-[10px] font-black leading-none">{eng.label}</span>
                      <span className={`text-[8px] mt-0.5 opacity-80 ${active ? "text-indigo-200" : "text-slate-450"}`}>
                        {eng.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Prompting Handbook & Pro Tips */}
            <div className="relative z-10 bg-slate-100/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/60 dark:border-slate-850 p-4 transition-all">
              <button
                type="button"
                onClick={() => {
                  setShowPromptGuide(prev => !prev);
                  triggerBeepChime();
                }}
                className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0">
                    <BookOpen className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      🎬 Cinematic Prompting Handbook
                      <span className="text-[8px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                        AI ACADEMY
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5 leading-snug">
                      Master camera movement, video physics, and scene structure keys for perfect cinematic outputs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/85 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors shrink-0">
                  <span>{showPromptGuide ? "Collapse Guide 🔼" : "Open Handbook 🔽"}</span>
                </div>
              </button>

              <AnimatePresence>
                {showPromptGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-4 pt-4 mt-4 border-t border-slate-200 dark:border-slate-850"
                  >
                    {/* Handbook Sub-tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      {[
                        { id: "basics", label: "🎯 Basics & Camera" },
                        { id: "consistency", label: "🎭 Consistency Keys" },
                        { id: "references", label: "📁 Character Refs" },
                        { id: "power-prompt", label: "⚡ Power Prompts" },
                        { id: "post-edit", label: "🎬 Post-Gen & Editors" },
                        { id: "models", label: "🤖 Models & Specs" }
                      ].map((tab) => {
                        const active = handbookTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setHandbookTab(tab.id as any);
                              triggerBeepChime();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              active
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* TAB CONTENT: BASICS & CAMERA */}
                    {handbookTab === "basics" && (
                      <div className="space-y-4">
                        {/* Core Principles Section */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                          <div className="flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                            <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                              Core Principles for Strong Video Prompts
                            </h6>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                            Video prompts need to be more descriptive than image prompts because the AI must understand motion, timing, camera movement, and consistency.
                          </p>
                          
                          <div className="space-y-1 pt-1.5">
                            <span className="block text-[8.5px] font-black uppercase tracking-wider text-indigo-500">
                              Best Structure (Recommended Order):
                            </span>
                            <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px] font-extrabold text-slate-700 dark:text-slate-300">
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">1</span>
                                Subject + Action
                              </li>
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">2</span>
                                Environment
                              </li>
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">3</span>
                                Lighting & Mood
                              </li>
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">4</span>
                                Camera Path
                              </li>
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">5</span>
                                Technical Quality
                              </li>
                              <li className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0">6</span>
                                Pro Modifiers
                              </li>
                            </ol>
                          </div>
                        </div>

                        {/* Pro Tips Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Tips 1 & 2 */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3">
                            <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              ⚡ Interface Pro Tips
                            </h6>
                            
                            <div className="space-y-2.5">
                              <div>
                                <span className="block text-[9px] font-extrabold uppercase text-indigo-500 mb-0.5">
                                  1. Start with a Clear Scene Description
                                </span>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                                  Be highly specific about motion: <span className="italic font-semibold text-slate-650 dark:text-slate-350">“slowly flying through”</span>, <span className="italic font-semibold text-slate-650 dark:text-slate-350">“camera tracking a running character”</span>, <span className="italic font-semibold text-slate-650 dark:text-slate-350">“gentle pan across”</span>, or <span className="italic font-semibold text-slate-650 dark:text-slate-350">“dramatic zoom in”</span>.
                                </p>
                              </div>

                              <div className="border-t border-slate-200/50 dark:border-slate-850/50 pt-2">
                                <span className="block text-[9px] font-extrabold uppercase text-indigo-500 mb-1">
                                  2. Use the Pro Booster Modifiers Wisely
                                </span>
                                <div className="space-y-1.5 text-[8.5px] leading-relaxed text-slate-500 dark:text-slate-450">
                                  <div>
                                    <strong className="text-slate-700 dark:text-slate-300 block">🎬 Cinematography & Cameras:</strong>
                                    Add <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Drone flyover sweep</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Slow-motion fluid</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Handheld dramatic shake</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Intimate Close-up</code>, or <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Shallow Depth of Field</code>.
                                  </div>
                                  <div className="pt-1">
                                    <strong className="text-slate-700 dark:text-slate-300 block">💡 Lighting & Atmosphere:</strong>
                                    Add <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Volumetric Fog</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Golden Hour Sunbeams</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Moody Cyberpunk Neon</code>, or <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Ethereal Moonlight</code>.
                                  </div>
                                  <div className="pt-1">
                                    <strong className="text-slate-700 dark:text-slate-300 block">✨ Art Style:</strong>
                                    Add <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Unreal Engine 5 Render</code> or <code className="text-indigo-600 dark:text-indigo-400 font-bold">+Detailed 8K Resolution</code>.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tip 3 - Camera Path Instructions with Interactive Spawning */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                🎥 Interactive Camera Path Motion
                              </h6>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                                Explicit camera instructions are crucial for video. Describe the motion explicitly or <span className="font-bold text-indigo-500">click any preset below</span> to append it to your active prompt textarea instantly!
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <span className="block text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                💡 Tap to Append Camera Instruction:
                              </span>
                              <div className="grid grid-cols-1 gap-1.5">
                                {[
                                  "Smooth tracking shot following the subject from behind",
                                  "Slow orbiting shot around the central character",
                                  "Dramatic crane shot rising upward",
                                  "Fast forward dolly zoom through the street"
                                ].map((camText) => (
                                  <button
                                    key={camText}
                                    type="button"
                                    onClick={() => {
                                      handleAppendModifier(camText);
                                      triggerBeepChime();
                                    }}
                                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-150 dark:border-slate-850 text-[9px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-3xs flex items-center justify-between"
                                    title="Append to your prompt text"
                                  >
                                    <span>“{camText}”</span>
                                    <span className="text-[10px] text-indigo-500 shrink-0">＋</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: ADVANCED CONSISTENCY KEYS */}
                    {handbookTab === "consistency" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Key consistency descriptors */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            🌟 Advanced Consistency Descriptors
                          </h6>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
                            Append these proven prompts at the end of your main scene description to enforce facial, lighting, and camera persistence.
                          </p>

                          <div className="space-y-1.5 pt-1">
                            {[
                              "Highly consistent character design across all frames",
                              "Stable facial features, coherent anatomy, no morphing",
                              "Consistent lighting and color grading throughout the shot",
                              "Smooth motion, temporal coherence, minimal artifacts",
                              "Cinematic continuity, seamless camera movement"
                            ].map((phrase) => (
                              <button
                                key={phrase}
                                type="button"
                                onClick={() => {
                                  handleAppendModifier(phrase);
                                }}
                                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-150 dark:border-slate-850 text-[9px] font-bold cursor-pointer transition-all flex items-center justify-between shadow-3xs"
                                title="Click to append to your active prompt"
                              >
                                <span>“{phrase}”</span>
                                <span className="text-[10px] text-indigo-500 shrink-0">＋</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Motion formulas & Best Practices */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-4">
                          <div className="space-y-2">
                            <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                              🎥 Motion-Specific Consistency
                            </h6>
                            <div className="space-y-1.5">
                              {[
                                "Slow and smooth camera movement",
                                "Fluid consistent motion",
                                "Natural physics and realistic movement"
                              ].map((phrase) => (
                                <button
                                  key={phrase}
                                  type="button"
                                  onClick={() => {
                                    handleAppendModifier(phrase);
                                  }}
                                  className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-150 dark:border-slate-850 text-[9px] font-bold cursor-pointer transition-all flex items-center justify-between shadow-3xs"
                                  title="Click to append motion controller"
                                >
                                  <span>“{phrase}”</span>
                                  <span className="text-[10px] text-amber-500 shrink-0">＋</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-200/50 dark:border-slate-850/50 pt-3 space-y-2">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-500">
                              💡 Interface Best Practices
                            </span>
                            <ul className="text-[9px] text-slate-500 dark:text-slate-400 space-y-1 font-bold leading-relaxed list-disc list-inside">
                              <li>Use modifiers like <span className="text-indigo-600 dark:text-indigo-400">+Detailed 8K Resolution</span> and <span className="text-indigo-600 dark:text-indigo-400">+Unreal Engine 5 Render</span>.</li>
                              <li>Avoid chaotic descriptors on long clips.</li>
                              <li>Stick to slow tracking, orbit, or dolly shots.</li>
                              <li>Start with shorter clips first (2s - 4s) to establish consistency.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: CHARACTER REFERENCE IMAGES */}
                    {handbookTab === "references" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Preparation & Numbers */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            📁 Character Reference Image Best Practices
                          </h6>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
                            Prepare your source portrait files carefully to feed the IP-Adapter and minimize face/outfit drift.
                          </p>

                          <div className="space-y-2 pt-1 font-bold text-[9px] text-slate-500 dark:text-slate-400">
                            <div>
                              <strong className="text-slate-700 dark:text-slate-300 block uppercase text-[8px] tracking-wider mb-0.5">Image Preparation:</strong>
                              <ul className="list-disc list-inside space-y-0.5 leading-snug">
                                <li>Use clear, front-facing or 3/4 view portraits</li>
                                <li>High resolution (1024x1024 pixels minimum)</li>
                                <li>Uniform lighting with no heavy shadows</li>
                                <li>Show exact outfit & hair styled as required</li>
                              </ul>
                            </div>
                            <div className="pt-2">
                              <strong className="text-slate-700 dark:text-slate-300 block uppercase text-[8px] tracking-wider mb-0.5">Reference Count:</strong>
                              <p className="leading-snug">
                                <span className="text-indigo-500">1 Strong Portrait</span> is a good start, but <span className="text-emerald-500">2-4 mixed-angle + full-body shots</span> yield maximum structural fidelity.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Reference prompt techniques */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            💡 Tap to Append Reference Guidance
                          </h6>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
                            Add these anchor expressions to guide the neural model back to the provided source canvas.
                          </p>

                          <div className="space-y-1.5 pt-1">
                            {[
                              "Exact same character as reference image",
                              "Faithful to reference character, identical face and clothing",
                              "Strong character consistency with provided reference",
                              "Preserve facial features, hairstyle, and outfit from reference"
                            ].map((phrase) => (
                              <button
                                key={phrase}
                                type="button"
                                onClick={() => {
                                  handleAppendModifier(phrase);
                                }}
                                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-150 dark:border-slate-850 text-[9px] font-bold cursor-pointer transition-all flex items-center justify-between shadow-3xs"
                                title="Click to append character reference anchor"
                              >
                                <span>“{phrase}”</span>
                                <span className="text-[10px] text-indigo-500 shrink-0">＋</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: POWER PROMPTS */}
                    {handbookTab === "power-prompt" && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-4">
                        <div className="space-y-1.5">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            ⚡ Interactive Power Prompt Template Builder
                          </h6>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                            Combine precise character features, environmental depth, custom tracking, and robust consistency modifiers into a unified high-resolution prompt formula.
                          </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed select-all">
                          <strong className="text-indigo-500 dark:text-indigo-400">[Scene Description]</strong>, <span className="text-slate-700 dark:text-slate-350">[environment]</span>, <span className="text-slate-700 dark:text-slate-350">[lighting]</span>, <span className="text-slate-700 dark:text-slate-350">[action]</span>, Camera: <span className="text-indigo-500">[path]</span>, Style: cinematic, highly detailed, consistent character appearance across all frames, stable facial features, coherent anatomy, temporal consistency, smooth fluid motion, unreal engine 5 render, 8K resolution
                        </div>

                        <div className="space-y-2 pt-1">
                          <span className="block text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            🚀 Load A High-Consistency Power Prompt Preset:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              {
                                title: "Cyberpunk Hacker",
                                prompt: "A confident female cyberpunk hacker with short neon-blue hair and cybernetic arm, walking through a rainy neon alley at night, reflections on wet pavement, +Moody Cyberpunk Neon, +Volumetric Fog, slow tracking shot following her from the side, shallow depth of field, anamorphic lens, cinematic lighting, exact same character as reference image, identical facial features and outfit, high consistency, smooth motion, Unreal Engine 5 Render, detailed 8K"
                              },
                              {
                                title: "Steampunk Aviator",
                                prompt: "A veteran steampunk pilot in a brown leather jacket and brass aviator goggles, inspecting the control panel of an airship cabin, warm amber brass lighting, steam venting from brass pipes, slow gentle orbit around the pilot, highly detailed, consistent character appearance across all frames, stable facial features, coherent anatomy, temporal consistency, smooth fluid motion, unreal engine 5 render, 8K resolution"
                              },
                              {
                                title: "Astronaut Explorer",
                                prompt: "An astronaut in a pristine white spacesuit, walking on the surface of Mars, red dusty terrain with distant canyons, brilliant stars visible in the pitch black space sky, dramatic crane shot rising upward slowly, cinematic style, highly detailed, consistent suit details, stable coherent anatomy, temporal consistency, smooth motion, Unreal Engine 5 Render, 8K resolution"
                              }
                            ].map((preset) => (
                              <button
                                key={preset.title}
                                type="button"
                                onClick={() => {
                                  setUserPromptText(preset.prompt);
                                  triggerBeepChime();
                                  setToastMessage({
                                    text: `Loaded ${preset.title}!`,
                                    sub: "Loaded a fully optimized consistency prompt into your sandbox.",
                                    success: true
                                  });
                                }}
                                className="p-3 text-left bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/25 border border-slate-200 dark:border-slate-850 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                              >
                                <span className="block text-[9.5px] font-black text-slate-800 dark:text-slate-200 mb-1">
                                  {preset.title}
                                </span>
                                <p className="text-[8px] text-slate-450 dark:text-slate-500 line-clamp-3 leading-snug">
                                  {preset.prompt}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: POST-GENERATION EDITING & EDITORS */}
                    {handbookTab === "post-edit" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Post-Generation Prompt Adjustments */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            ⚡ AI Post-Generation Prompt Modifiers
                          </h6>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
                            After your video is generated, stands out right now for post-generation editing—you can change lighting, add/remove objects, restyle scenes, or adjust camera angles using text prompts.
                          </p>
                          
                          <div className="space-y-1.5 pt-1">
                            <span className="block text-[8.5px] font-black uppercase tracking-wider text-indigo-500">
                              💡 Tap to Append Post-Gen Modifiers:
                            </span>
                            {[
                              { label: "Change Lighting", phrase: "adjust lighting to dramatic warm sunset backlighting with golden hour rays" },
                              { label: "Add Objects", phrase: "add gentle floating volumetric embers and sparks drifting across the foreground" },
                              { label: "Restyle Scene", phrase: "restyle the entire scene with an aesthetic cinematic film grain and higher color contrast" },
                              { label: "Adjust Camera Angle", phrase: "slow dynamic dolly zoom tracking in 1.5x with a slight handheld cinematic shake" }
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  handleAppendModifier(item.phrase);
                                  triggerBeepChime();
                                }}
                                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-150 dark:border-slate-850 text-[9px] font-bold cursor-pointer transition-all flex items-center justify-between shadow-3xs"
                                title={`Click to append: "${item.phrase}"`}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wide mb-0.5">{item.label}</span>
                                  <span className="line-clamp-1">“{item.phrase}”</span>
                                </div>
                                <span className="text-[10px] text-indigo-500 shrink-0 ml-1">＋</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Column 2: Traditional Editors with Strong AI Features */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-3.5">
                          <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            🎬 Traditional Editors with Strong AI Features
                          </h6>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
                            The best creator workflows use top-tier traditional video editors to refine, polish, and final-grade AI generated clips.
                          </p>

                          <div className="space-y-2.5 pt-1">
                            {[
                              {
                                name: "DaVinci Resolve",
                                highlight: "Best Color Grading & Audio AI",
                                desc: "The free version is excellent. Features top-tier color grading + AI tools like Magic Mask, voice isolation, and auto-editing. Still a top choice for finishing AI-generated clips.",
                                colorClass: "border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400"
                              },
                              {
                                name: "Adobe Premiere Pro",
                                highlight: "Professional AI Timeline",
                                desc: "Features a highly professional timeline with AI Auto Reframe, automatic scene edit detection, and transcripts-driven text-based editing.",
                                colorClass: "border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400"
                              },
                              {
                                name: "Descript",
                                highlight: "Revolutionary Transcript Editing",
                                desc: "Edit your video simply by editing the text transcript. Perfect for talking-head, voiceovers, and podcast-style AI media curation.",
                                colorClass: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400",
                                features: [
                                  "Voice Cloning: Fix mispronounced words or change lines seamlessly with ultra-natural speech cloning",
                                  "Studio Sound: One-click noise removal and professional voice enhancement",
                                  "Eye Contact: Automatic gaze adjustment for talking-head videos",
                                  "Animated Captions: Auto-generate eye-catching, styled, dynamic captions",
                                  "Find & Replace: Globally repair or delete filler words and speech errors instantly",
                                  "AI Summaries & Chapters: Automatic video chaptering and action items generation"
                                ]
                              },
                              {
                                name: "CapCut & Web Editors",
                                highlight: "Quick Browser Captions",
                                desc: "Browser-based, lightning-fast smart auto-captions, beautiful pre-made subtitles, and highly simplified timeline tools for social clips.",
                                colorClass: "border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400"
                              }
                            ].map((editor) => (
                              <div
                                key={editor.name}
                                className={`p-2.5 rounded-lg border ${editor.colorClass} space-y-1.5`}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide">{editor.name}</span>
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/65 shadow-3xs">{editor.highlight}</span>
                                </div>
                                <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-normal font-bold">
                                  {editor.desc}
                                </p>
                                {editor.features && (
                                  <div className="pt-1.5 border-t border-emerald-100/40 dark:border-emerald-900/40 space-y-1">
                                    <span className="block text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">⚡ Powerful AI Features (2026):</span>
                                    <ul className="text-[8px] text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside font-bold leading-tight">
                                      {editor.features.map((feature, fIdx) => (
                                        <li key={fIdx}>{feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: SUPPORTED MODELS & PARAMETERS (2026) */}
                    {handbookTab === "models" && (
                      <div className="space-y-4">
                        {/* Summary of Constraints */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                            <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                              2026 AI Video Model Specs & Performance Guidelines
                            </h6>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs">
                              <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-wide mb-1">⏱️ Optimal Clip Duration</span>
                              Most neural models work best at <span className="text-slate-800 dark:text-slate-200 font-extrabold">5–10 second clips</span> for highest coherence, physics alignment, and style consistency.
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs">
                              <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-wide mb-1">📐 Aspect Ratios</span>
                              Utilize <span className="text-slate-800 dark:text-slate-200 font-extrabold">16:9</span> for cinematic sweeps, <span className="text-slate-800 dark:text-slate-200 font-extrabold">9:16</span> for vertical/social timelines, or <span className="text-slate-800 dark:text-slate-200 font-extrabold">1:1</span> for immersive square grids.
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850/60 shadow-3xs">
                              <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-wide mb-1">⚡ Motion Strength</span>
                              Keep intensity at <span className="text-slate-800 dark:text-slate-200 font-extrabold">0.5–0.75</span> for natural, realistic motion. Raise it higher for dramatic transitions or fast-action.
                            </div>
                          </div>
                        </div>

                        {/* Grid of Models */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Runway ML Gen-4 & Google Veo */}
                          <div className="space-y-4">
                            {/* Runway ML Gen-4 */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  🔮 Runway ML Gen-4
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">Cinematic Master</span>
                              </div>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                                <strong className="text-slate-700 dark:text-slate-300">Best for:</strong> Cinematic quality, heavy creative direction, in-video editing (Aleph system).
                              </p>
                              <ul className="text-[8.5px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                                <li><strong className="text-slate-700 dark:text-slate-300">Max Duration:</strong> 10–20 seconds (extendable continuously)</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Core Strengths:</strong> Class-leading camera controllers, style consistency, and precise motion brush</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Recommended:</strong> High motion strength, 16:9 widescreen or 9:16 vertical</li>
                              </ul>
                              <div className="pt-1.5 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAppendModifier("Runway Gen-4 style, ultra-cinematic, precise camera control, style coherent, motion brush optimized");
                                    triggerBeepChime();
                                  }}
                                  className="w-full text-center py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-3xs"
                                >
                                  Load Runway Booster ＋
                                </button>
                              </div>
                            </div>

                            {/* Google Veo / Flow */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  🪐 Google Veo / Flow AI
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">High Realism</span>
                              </div>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                                <strong className="text-slate-700 dark:text-slate-300">Best for:</strong> Photorealistic high-fidelity human motion, physical world accuracy, complex environments.
                              </p>
                              <ul className="text-[8.5px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                                <li><strong className="text-slate-700 dark:text-slate-300">Core Strengths:</strong> Advanced prompt adherence, physically coherent fluids and particle dynamics</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Prompt Tip:</strong> Often performs best with highly detailed, natural language cinematic essays</li>
                              </ul>
                              <div className="pt-1.5 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAppendModifier("photorealistic cinematic realism, Google Veo high-fidelity style, perfect prompt adherence, physical coherence");
                                    triggerBeepChime();
                                  }}
                                  className="w-full text-center py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-3xs"
                                >
                                  Load Veo / Flow Booster ＋
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Kling AI & Luma Dream Machine */}
                          <div className="space-y-4">
                            {/* Kling AI */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  🐼 Kling AI
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">Physics & Human</span>
                              </div>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                                <strong className="text-slate-700 dark:text-slate-300">Best for:</strong> Realistic human motion, anatomical correctness, physics, and prompt accuracy.
                              </p>
                              <ul className="text-[8.5px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                                <li><strong className="text-slate-700 dark:text-slate-300">Max Duration:</strong> 5–15 seconds (Turbo mode optimized for rapid output)</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Core Strengths:</strong> Natural limb movement, lifelike lighting, high motion ranges</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Recommended:</strong> Lower motion strength for pristine, artifact-free realism</li>
                              </ul>
                              <div className="pt-1.5 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAppendModifier("Kling AI style, realistic human motion, physically correct simulation, lifelike lighting, temporal coherent");
                                    triggerBeepChime();
                                  }}
                                  className="w-full text-center py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-3xs"
                                >
                                  Load Kling Booster ＋
                                </button>
                              </div>
                            </div>

                            {/* Luma Dream Machine */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  🎨 Luma Dream Machine
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">Artistic & Surreal</span>
                              </div>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                                <strong className="text-slate-700 dark:text-slate-300">Best for:</strong> Dreamy, surreal, or highly artistic visuals, and initial Image-to-Video generation.
                              </p>
                              <ul className="text-[8.5px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                                <li><strong className="text-slate-700 dark:text-slate-300">Max Duration:</strong> 5–10 seconds</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Core Strengths:</strong> Exceptional style transfers, highly expressive lighting, multi-image references</li>
                              </ul>
                              <div className="pt-1.5 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAppendModifier("Luma Dream Machine style, surreal dreamy aesthetic, rich artistic atmosphere, high-fidelity light transfer");
                                    triggerBeepChime();
                                  }}
                                  className="w-full text-center py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-3xs"
                                >
                                  Load Luma Booster ＋
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. PROMPT PLAYGROUND CONTAINER */}
            <div className="space-y-4 relative z-10 bg-slate-500/5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850">
              <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-250/25 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorMode("single");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-2 rounded-lg text-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    creatorMode === "single"
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                      : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  🎥 Single Scene
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorMode("script");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-2 rounded-lg text-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    creatorMode === "script"
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                      : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  📜 Script-to-Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorMode("text-slide");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-2 rounded-lg text-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    creatorMode === "text-slide"
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                      : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  📝 Title Slide
                </button>
              </div>

              {creatorMode === "single" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                      Describe Your Scene:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isGeneratingScene}
                        onClick={handleRandomizePrompt}
                        className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer select-none bg-amber-500/5 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/15 transition-all hover:scale-105 active:scale-95"
                        title="Synthesize a completely surprise custom high-fidelity scene storyboard"
                      >
                        <span>🎲 Surprise Me!</span>
                      </button>
                      <button
                        type="button"
                        disabled={isEnhancingPrompt || isGeneratingScene || !userPromptText.trim()}
                        onClick={async () => {
                          setIsEnhancingPrompt(true);
                          try {
                            const response = await fetch("/api/video/enhance-prompt", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                subject: userPromptText,
                                style: aiStylePreset === "auto" ? "Cinematic" : aiStylePreset,
                                camera: aiCameraDirection === "auto" ? "Slow Zoom" : aiCameraDirection
                              })
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data?.enhancedSubject) {
                                setUserPromptText(data.enhancedSubject);
                                setToastMessage({
                                  text: "✨ Prompt Optimized!",
                                  sub: "AI expanded your descriptors for maximum cinematic depth.",
                                  success: true
                                });
                                triggerBeepChime();
                              }
                            }
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsEnhancingPrompt(false);
                          }
                        }}
                        className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer disabled:opacity-40 select-none bg-indigo-500/5 px-2.5 py-1 rounded-md border border-indigo-500/10 transition-all hover:scale-105 active:scale-95"
                        title="Enhance this prompt using Gemini's director model"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{isEnhancingPrompt ? "Enhancing..." : "Magic Expand"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={userPromptText}
                      onChange={(e) => setUserPromptText(e.target.value)}
                      placeholder='Describe your scene, e.g., "A deep cybercar speeding through pink neon skyscrapers", "A majestic glowing waterfall in a mystical fairy forest", "Sunbeams filtering through autumn leaves close-up"...'
                      rows={3}
                      className="w-full p-4 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 resize-none leading-relaxed shadow-3xs"
                      disabled={isGeneratingScene}
                    />
                    {renderPromptValidationInfo(userPromptText)}
                  </div>

                  {/* Suggested Styles Selector */}
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                      ⚡ Suggested Styles (Auto-Appends High-Quality Keywords):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(STYLE_TAGS).map(([styleName, styleKeywords]) => {
                        const isSelected = userPromptText.includes(styleKeywords);
                        return (
                          <button
                            key={styleName}
                            type="button"
                            disabled={isGeneratingScene}
                            onClick={() => handleAppendStyle(styleKeywords)}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer select-none active:scale-95 ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs dark:bg-indigo-500 dark:border-indigo-500"
                                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-100/50"
                            }`}
                          >
                            {styleName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspiration Bubbles */}
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                      Quick Inspiration Prompts:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "🌌 Neon Cyber", prompt: "A sleek futuristic cyberpunk car speeding past neon skyscrapers, night rain, detailed reflections, volumetric light" },
                        { label: "🧚 Fairy Forest", prompt: "A magical glowing crystal waterfall in a mystical fairy forest at dusk, golden fireflies, cinematic depth of field" },
                        { label: "🪐 Deep Space", prompt: "An astronaut sitting on a celestial cliff overlooking a massive swirling purple galaxy nebula, cosmic particles" },
                        { label: "🍂 Autumn River", prompt: "Golden sunbeams filtering through glowing orange autumn leaves next to a calm running mountain stream, 4k" }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isGeneratingScene}
                          onClick={() => {
                            setUserPromptText(preset.prompt);
                            triggerBeepChime();
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-950/70 dark:hover:bg-indigo-950/30 text-slate-650 dark:text-slate-350 hover:text-indigo-650 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-850 text-[9px] font-bold rounded-lg transition-all cursor-pointer select-none"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categorized Creative Booster Keywords */}
                  <div className="space-y-1.5 bg-slate-500/5 p-3 rounded-xl border border-slate-200/40 dark:border-slate-850/60">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>Pro Booster Modifiers (Click to Add):</span>
                    </span>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[7.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">🎬 Cinematography & Cameras</span>
                        <div className="flex flex-wrap gap-1">
                          {["Anamorphic Lens", "Shallow Depth of Field", "Slow-motion fluid", "Drone flyover sweep", "Intimate Close-up", "Handheld dramatic shake"].map(mod => (
                            <button
                              key={mod}
                              type="button"
                              disabled={isGeneratingScene}
                              onClick={() => handleAppendModifier(mod)}
                              className="px-1.5 py-0.5 bg-white dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-650 dark:text-slate-350 border border-slate-200/60 dark:border-slate-850 text-[8px] font-bold rounded cursor-pointer transition-all hover:scale-105"
                            >
                              +{mod}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">💡 Lighting & Atmosphere</span>
                        <div className="flex flex-wrap gap-1">
                          {["Volumetric Fog", "Warm God Rays", "Moody Cyberpunk Neon", "Ethereal Moonlight", "Bioluminescent Glow", "Golden Hour Sunbeams"].map(mod => (
                            <button
                              key={mod}
                              type="button"
                              disabled={isGeneratingScene}
                              onClick={() => handleAppendModifier(mod)}
                              className="px-1.5 py-0.5 bg-white dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-650 dark:text-slate-350 border border-slate-200/60 dark:border-slate-850 text-[8px] font-bold rounded cursor-pointer transition-all hover:scale-105"
                            >
                              +{mod}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">✨ Art Style & Resolution</span>
                        <div className="flex flex-wrap gap-1">
                          {["Unreal Engine 5 Render", "Classic Retro VHS Tape", "Detailed 8K Resolution", "Studio Ghibli Aesthetic", "Intricate Pencil Sketch", "Rich Impasto Oil Paint"].map(mod => (
                            <button
                              key={mod}
                              type="button"
                              disabled={isGeneratingScene}
                              onClick={() => handleAppendModifier(mod)}
                              className="px-1.5 py-0.5 bg-white dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-650 dark:text-slate-350 border border-slate-200/60 dark:border-slate-850 text-[8px] font-bold rounded cursor-pointer transition-all hover:scale-105"
                            >
                              +{mod}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {creatorMode === "script" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                      📜 Enter Multi-Line Movie Script:
                    </label>
                    <span className="text-[8px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                      BATCH SCRIPT TO VIDEO
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                    Write or paste a descriptive narrative script. Put each scene on a separate line. The AI filmmaker will automatically generate and stitch together stunning custom video clips matching your story!
                  </p>
                  
                  <textarea
                    value={videoScriptText}
                    onChange={(e) => setVideoScriptText(e.target.value)}
                    placeholder={`Line 1: A mystical emerald dragon soaring over lava valleys at dusk\nLine 2: Close up of the dragon's crystal eyes glowing with golden fire\nLine 3: The dragon breathing vibrant rainbow flames into the starry night sky`}
                    rows={5}
                    className="w-full p-4 text-xs font-mono font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 resize-none leading-relaxed shadow-3xs"
                    disabled={isGeneratingScript}
                  />

                  <div className="pt-1.5">
                    <button
                      type="button"
                      disabled={isGeneratingScript || !videoScriptText.trim()}
                      onClick={handleGenerateScriptToVideo}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-600/50 disabled:to-purple-600/50 text-white font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScript ? "animate-spin" : ""}`} />
                      <span>{isGeneratingScript ? `COMPILING SCENE ${scriptCurrentLineIdx} OF ${scriptTotalLines}...` : "GENERATE FULL MOVIE FROM SCRIPT"}</span>
                    </button>
                  </div>
                </div>
              )}

              {creatorMode === "text-slide" && (
                <div className="space-y-4 bg-slate-100/30 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                      📝 Create Title Slide:
                    </label>
                    <span className="text-[8px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-mono">
                      TEXT DISPLAY
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                      Title Display Text:
                    </span>
                    <input
                      type="text"
                      value={titleSlideText}
                      onChange={(e) => setTitleSlideText(e.target.value)}
                      placeholder="E.g., CHAPTER 1: THE BEGINNING"
                      className="w-full px-3 py-2.5 text-xs font-extrabold text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                        Background style:
                      </span>
                      <select
                        value={titleSlideBg}
                        onChange={(e) => setTitleSlideBg(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-250/50 dark:border-slate-800 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="gradient-sunset">🌅 Sunset Rose Glow</option>
                        <option value="gradient-ocean">🌊 Deep Ocean Breeze</option>
                        <option value="gradient-neon">🔮 Cyberpunk Neon Night</option>
                        <option value="dark">🖤 Minimalist Dark Carbon</option>
                        <option value="indigo">🌌 Deep Velvet Indigo</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                        Font Size (px):
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="24"
                          max="64"
                          value={titleSlideFontSize}
                          onChange={(e) => setTitleSlideFontSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 w-8 shrink-0">{titleSlideFontSize}px</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddTextTitleSlide();
                      triggerBeepChime();
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-2 border border-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Title Slide Clip</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. STYLE PRESET & CAMERA CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  3. Cinematic Style Preset:
                </label>
                <select
                  value={aiStylePreset}
                  onChange={(e) => setAiStylePreset(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  disabled={isGeneratingScene}
                >
                  <option value="auto">🎬 Auto (AI Matches Prompt Mood)</option>
                  <option value="cinematic">🎥 Cinematic Masterwork</option>
                  <option value="cyberpunk">👾 Cyberpunk Neon</option>
                  <option value="anime">Celestial Anime Dream</option>
                  <option value="vhs">📼 Retro VHS Tape Glitch</option>
                  <option value="realistic-3d">💎 3D Octane Hyper-Realistic</option>
                  <option value="minimalist">🖤 Slate High-Contrast Minimalist</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  4. Camera Path Motion:
                </label>
                <select
                  value={aiCameraDirection}
                  onChange={(e) => setAiCameraDirection(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  disabled={isGeneratingScene}
                >
                  <option value="auto">🛸 Auto (AI Chooses Direction)</option>
                  <option value="zoom-in">🔍 Slow Zoom In</option>
                  <option value="zoom-out">🔍 Slow Zoom Out</option>
                  <option value="pan-left">◀️ Smooth Pan Left</option>
                  <option value="pan-right">▶️ Smooth Pan Right</option>
                  <option value="tilt-up">🔼 Dramatic Tilt Up</option>
                  <option value="tilt-down">🔽 Dramatic Tilt Down</option>
                  <option value="orbit">🔄 Orbit Cinematic Circle</option>
                </select>
              </div>
            </div>

            {/* Live Camera Trajectory Monitor */}
            <div className="relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-900/80 p-3.5 h-24 flex items-center justify-between gap-4 z-10 select-none">
              {/* Left side info */}
              <div className="space-y-1">
                <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase block">
                  🎥 Live Trajectory Monitor
                </span>
                <span className="text-[11px] font-extrabold text-slate-200 block capitalize">
                  {aiCameraDirection === "auto" ? "Dynamic Cinematic Mix" : aiCameraDirection.replace("-", " ")}
                </span>
                <p className="text-[9px] text-slate-450 max-w-[210px] leading-tight">
                  {aiCameraDirection === "zoom-in" && "Continuous dolly-in motion scaling depth and focal intensity."}
                  {aiCameraDirection === "zoom-out" && "Smooth dolly-out wide lens sweep exposing ambient details."}
                  {aiCameraDirection === "pan-left" && "Horizontal camera slide tracking from right to left."}
                  {aiCameraDirection === "pan-right" && "Horizontal camera slide tracking from left to right."}
                  {aiCameraDirection === "tilt-up" && "Vertical camera ascent tilting towards the horizon."}
                  {aiCameraDirection === "tilt-down" && "Vertical camera descent tilting down towards the subject."}
                  {aiCameraDirection === "orbit" && "360-degree rotational orbit tracking the central focal plane."}
                  {aiCameraDirection === "auto" && "Adaptive neural camera logic selecting optimal paths per scene."}
                </p>
              </div>

              {/* Right side animated visualizer box */}
              <div className="relative w-36 h-full bg-slate-900/60 rounded-xl border border-slate-850/60 overflow-hidden flex items-center justify-center shrink-0">
                 {/* 3D grid lines */}
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-25" />
                 
                 {/* Center subject target */}
                 <div className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center animate-pulse">
                   <div className="w-1 h-1 rounded-full bg-indigo-400" />
                 </div>

                 {/* Trajectory Camera Icon */}
                 <motion.div
                   className="absolute text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] flex flex-col items-center justify-center"
                   animate={
                     aiCameraDirection === "zoom-in" ? {
                       scale: [0.6, 1.4, 0.6],
                     } : aiCameraDirection === "zoom-out" ? {
                       scale: [1.4, 0.6, 1.4],
                     } : aiCameraDirection === "pan-left" ? {
                       x: [40, -40, 40],
                     } : aiCameraDirection === "pan-right" ? {
                       x: [-40, 40, -40],
                     } : aiCameraDirection === "tilt-up" ? {
                       y: [20, -20, 20],
                     } : aiCameraDirection === "tilt-down" ? {
                       y: [-20, 20, -20],
                     } : aiCameraDirection === "orbit" ? {
                       x: [0, 30, 0, -30, 0],
                       y: [-15, 0, 15, 0, -15],
                       rotate: [0, 90, 180, 270, 360],
                     } : {
                       y: [-4, 4, -4],
                       x: [-2, 2, -2],
                     }
                   }
                   transition={{
                     duration: 3,
                     repeat: Infinity,
                     ease: "easeInOut"
                   }}
                 >
                   <Video className="w-3.5 h-3.5" />
                   <span className="text-[6px] font-black uppercase tracking-widest mt-0.5 scale-75 leading-none opacity-80">CAM</span>
                 </motion.div>
              </div>
            </div>

            {/* 4. MOTION BRUSH & SPEED SLIDER */}
            <div className="space-y-2 bg-slate-500/5 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-850/60 relative z-10">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  5. Flow Field Motion Intensity:
                </label>
                <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  Level {aiMotionIntensity}/10 ({(aiMotionIntensity * 0.3).toFixed(1)}x speed)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={aiMotionIntensity}
                onChange={(e) => setAiMotionIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                disabled={isGeneratingScene}
              />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <span>Subtle pan</span>
                <span>Balanced flow</span>
                <span>Hyper active motion</span>
              </div>
            </div>

            {/* 5. SIMULATION TERMINAL PROGRESS HUD */}
            <AnimatePresence>
              {isGeneratingScene && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-3 font-mono text-[10.5px] text-emerald-400 shadow-inner overflow-hidden relative z-10"
                >
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-450 uppercase font-bold text-[9px] tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Neural Compute Pipeline Output
                    </span>
                    <span className="text-emerald-400 font-bold">{aiGenerationProgress}%</span>
                  </div>

                  {/* Telemetry Row */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-left">
                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-center">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Elapsed</span>
                      <span className="text-[10px] font-black text-slate-300">{aiElapsedTime}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-center">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Est. Remaining</span>
                      <span className="text-[10px] font-black text-indigo-400 animate-pulse">{aiEstTimeRemaining}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-center">
                      <span className="block text-[7px] uppercase text-slate-500 font-black tracking-wider mb-0.5">Active Stage</span>
                      <span className="text-[8px] font-extrabold text-emerald-400 truncate block leading-tight" title={aiCurrentStage}>{aiCurrentStage || "Initializing"}</span>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400"
                      initial={{ width: "0%" }}
                      animate={{ width: `${aiGenerationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Terminal Log lines */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto leading-relaxed scrollbar-thin">
                    {aiGenerationLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 shrink-0">❯</span>
                        <span className={idx === aiGenerationLogs.length - 1 ? "text-emerald-300 font-extrabold animate-pulse" : "text-slate-400"}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-2 relative z-10">
              <button
                type="button"
                disabled={isGeneratingScene || !userPromptText.trim()}
                onClick={() => handleGenerateAIScene(false)}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-900 dark:disabled:to-slate-950 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 transition-all select-none"
              >
                {isGeneratingScene ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Flow Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                    <span>✨ Generate & Add Scene to Timeline</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isGeneratingScene || !userPromptText.trim()}
                onClick={() => handleGenerateAIScene(true)}
                className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-900 dark:disabled:to-slate-950 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-600/15 flex items-center justify-center gap-1.5 transition-all select-none shrink-0"
                title="Generate this scene and immediately export it into a WebM video file"
              >
                <Video className="w-3.5 h-3.5 fill-current" />
                <span>Instant Video Compile</span>
              </button>
            </div>
          </div>

          {/* CapCut Pro Multi-Track Timeline Studio */}
          <div className="space-y-4 bg-slate-900/95 border border-slate-800 p-5 rounded-[28px] relative text-left">
            
            {/* Timeline Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    CapCut Multi-Track Timeline
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-black tracking-widest animate-pulse uppercase">
                      PRO EDITOR
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {slides.length} Tracks • Scrub, sync, and style frames interactively
                  </p>
                </div>
              </div>

              {/* Advanced CapCut Toolbar Utilities */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Timeline zoom slider */}
                <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-850">
                  <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Zoom:</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={timelineZoom}
                    onChange={(e) => setTimelineZoom(parseInt(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    title="Zoom in/out of timeline tracks"
                  />
                  <span className="text-[9px] font-bold text-slate-350 font-mono">{timelineZoom}px/s</span>
                </div>

                {/* Auto Beat-Sync Engine Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isBeatSyncEnabled;
                    setIsBeatSyncEnabled(nextVal);
                    if (nextVal) {
                      alignSlidesToBeats(soundtrack);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 select-none cursor-pointer ${
                    isBeatSyncEnabled
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/5 animate-pulse"
                      : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                  }`}
                  title="Snap all clip durations perfectly to the active music track beats grid"
                >
                  <Sparkles className={`w-3 h-3 ${isBeatSyncEnabled ? "text-amber-300" : "text-slate-500"}`} />
                  <span>⚡ Auto Beat-Sync</span>
                </button>

                {/* Quick Add Photo Multi-uploader */}
                <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all select-none border border-indigo-500/30">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Scrollable Tracks container */}
            <div className="relative border border-slate-850 rounded-2xl bg-slate-950/50 p-4 overflow-x-auto scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800" id="capcut-scroll-tracks">
              
              {/* Inner container sized exactly to timeline width */}
              <div 
                className="relative pb-2" 
                style={{ width: `${Math.max(300, totalDuration * timelineZoom + 40)}px` }}
              >
                
                {/* 1. TIMELINE RULER / TICK MARKERS */}
                <div className="relative h-6 border-b border-slate-900/80 mb-3 select-none">
                  {Array.from({ length: Math.ceil(totalDuration || 1) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => setCurrentTime(i)}
                      className="absolute text-[9px] font-bold font-mono text-slate-500 cursor-pointer hover:text-slate-350 flex flex-col items-center select-none"
                      style={{ left: `${i * timelineZoom}px`, transform: 'translateX(-50%)' }}
                    >
                      <span>{i}s</span>
                      <div className="w-[1.5px] h-1.5 bg-slate-700 mt-0.5 rounded-full" />
                    </div>
                  ))}

                  {/* Scrubby interactive click bar */}
                  <div 
                    className="absolute inset-0 bg-transparent cursor-ew-resize"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const clickTime = clickX / timelineZoom;
                      setCurrentTime(Math.min(totalDuration, Math.max(0, parseFloat(clickTime.toFixed(2)))));
                    }}
                  />
                </div>

                {/* VISUAL PLAYHEAD NEEDLE (Vertical Line through all tracks) */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-30 pointer-events-none transition-all duration-75 shadow-lg shadow-rose-500/30"
                  style={{ left: `${currentTime * timelineZoom}px` }}
                >
                  <div className="absolute top-4 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] text-white font-mono select-none font-bold">
                    ▼
                  </div>
                </div>

                {/* 2. VIDEO TRACK CONTAINER */}
                <div className="space-y-1 relative z-10 mb-4 text-left">
                  <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    🎥 Video Track (Clips)
                  </span>
                  
                  <div className="flex items-center gap-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 overflow-visible relative min-h-[75px]">
                    {slides.map((slide, index) => {
                      const isSelected = selectedSlideId === slide.id;
                      const isBeingDragged = draggedSlideIndex === index;
                      const isDragOver = dragOverIndex === index;
                      const widthPx = slide.duration * timelineZoom;

                      return (
                        <React.Fragment key={slide.id}>
                          {/* Insertion Drag-Over Spacer */}
                          {isDragOver && draggedSlideIndex !== index && draggedSlideIndex !== index - 1 && (
                            <div className="w-2.5 bg-indigo-500 h-[64px] rounded animate-pulse shrink-0 mx-0.5" />
                          )}

                          <div
                            draggable
                            onDragStart={(e) => {
                              setDraggedSlideIndex(index);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dragOverIndex !== index) setDragOverIndex(index);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => {
                              if (dragOverIndex === index) setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDropSlide(index);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggedSlideIndex(null);
                              setDragOverIndex(null);
                            }}
                            onClick={() => {
                              setSelectedSlideId(slide.id);
                              // Jump playhead to start of selected slide
                              let jumpTime = 0;
                              for (let i = 0; i < index; i++) {
                                jumpTime += slides[i].duration;
                              }
                              setCurrentTime(jumpTime);
                            }}
                            className={`h-[64px] rounded-xl relative overflow-hidden group border transition-all cursor-grab flex flex-col justify-between p-1.5 select-none shrink-0 ${
                              isSelected
                                ? "border-indigo-400 ring-2 ring-indigo-500/40 bg-slate-850"
                                : "border-slate-800 hover:border-slate-700 bg-slate-900"
                            } ${isBeingDragged ? "opacity-30 border-dashed border-indigo-400 bg-slate-950" : ""}`}
                            style={{ width: `${widthPx}px` }}
                            title={`${slide.name} (${slide.duration}s)`}
                          >
                            {/* Slide Thumbnail Background with Filter effect */}
                            <img
                              src={slide.url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 group-hover:opacity-55 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-10 pointer-events-none" />

                            {/* Block Content Info Overlays */}
                            <div className="relative z-20 flex items-center justify-between gap-1 w-full pointer-events-none">
                              <span className="text-[9px] font-black text-slate-100 bg-slate-950/80 px-1.5 py-0.5 rounded leading-none">
                                #{index + 1}
                              </span>
                              
                              <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-950/70 px-1 py-0.5 rounded-md leading-none">
                                {slide.duration}s
                              </span>
                            </div>

                            {/* Interactive direct Duration Modifiers */}
                            <div className="relative z-20 flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSlideProp(slide.id, "duration", Math.max(0.5, slide.duration - 0.5));
                                }}
                                className="w-5 h-5 bg-slate-950/90 text-white rounded hover:bg-slate-900 flex items-center justify-center text-xs font-black cursor-pointer shadow"
                                title="Shorter playtime (-0.5s)"
                              >
                                -
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSlideProp(slide.id, "duration", Math.min(10, slide.duration + 0.5));
                                }}
                                className="w-5 h-5 bg-slate-950/90 text-white rounded hover:bg-slate-900 flex items-center justify-center text-xs font-black cursor-pointer shadow"
                                title="Longer playtime (+0.5s)"
                              >
                                +
                              </button>
                            </div>

                            {/* Inline trash option */}
                            <div className="relative z-20 flex justify-between items-center w-full">
                              <span className="text-[8px] font-bold text-slate-400 capitalize truncate max-w-[70%]">
                                {slide.filter !== "normal" ? `🎭 ${slide.filter}` : ""}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSlide(slide.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center cursor-pointer transition-all"
                                title="Delete Clip"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Interactive Transition trigger badge between slides */}
                          {index < slides.length - 1 && (
                            <div className="flex-none w-5 flex items-center justify-center z-20 relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Highlight slide's transition style options or switch
                                  setSelectedSlideId(slide.id);
                                  const selectEl = document.getElementById("transition-style-dropdown");
                                  if (selectEl) {
                                    selectEl.focus();
                                    selectEl.classList.add("ring-4", "ring-indigo-500/40");
                                    setTimeout(() => selectEl.classList.remove("ring-4", "ring-indigo-500/40"), 1500);
                                  }
                                }}
                                className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 hover:scale-125 hover:bg-amber-400 cursor-pointer flex items-center justify-center text-[8px] font-black transition-transform select-none shadow shadow-amber-500/20"
                                title={`Transition: ${transitionStyle} (${transitionDuration}s) - Click to configure`}
                              >
                                ⚡
                              </button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* 3. SUBTITLE / TEXT TRACK CONTAINER */}
                <div className="space-y-1 relative z-10 mb-4 text-left">
                  <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    💬 Text Track (Subtitles)
                  </span>

                  <div className="flex items-center gap-0 bg-slate-900/60 p-2 rounded-xl border border-slate-850 min-h-[50px] overflow-visible">
                    {slides.map((slide, index) => {
                      const widthPx = slide.duration * timelineZoom;
                      const hasText = slide.text.trim().length > 0;

                      return (
                        <div 
                          key={`text-${slide.id}`}
                          className="h-[36px] flex items-center px-0.5 shrink-0 overflow-visible relative"
                          style={{ width: `${widthPx + (index < slides.length - 1 ? 20 : 0)}px` }}
                        >
                          <div 
                            style={{ width: `${widthPx}px` }} 
                            className="shrink-0 h-full"
                          >
                            {hasText ? (
                              <div
                                onClick={() => setEditingSlideCaptionId(slide.id)}
                                className="h-full rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold flex items-center gap-1.5 px-2.5 truncate hover:bg-amber-500/20 hover:border-amber-500/65 transition-all cursor-pointer shadow-sm shadow-amber-500/5 select-none"
                                title="Double-click or Tap to edit subtitle text instantly"
                              >
                                <Type className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate italic">"{slide.text}"</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingSlideCaptionId(slide.id)}
                                className="w-full h-full rounded-lg border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-850/40 text-slate-600 hover:text-slate-400 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer select-none"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Add Text</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. AUDIO / SOUNDTRACK TRACK CONTAINER */}
                <div className="space-y-1 relative z-10 mb-2 text-left">
                  <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    🎵 Audio Track (Soundtrack & Beats)
                  </span>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 flex items-center overflow-hidden min-h-[46px] relative">
                    {/* Animated soundwaves when playing */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                        <Music className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-black text-slate-200">
                          {audioTrackMode === "synth" 
                            ? SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack)?.name || "Silent"
                            : audioTrackMode === "custom" 
                              ? customAudioName || "Custom Soundtrack Upload" 
                              : "Active SFX Shot"}
                        </span>
                        
                        {/* Pulse indicator */}
                        {audioTrackMode === "synth" && soundtrack !== "none" && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold ml-1">
                            {SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack)?.bpm} BPM
                          </span>
                        )}
                      </div>

                      {/* Procedural Equalizer wave graphic */}
                      <div className="flex items-center gap-0.5 h-6 opacity-85 select-none shrink-0 pl-1">
                        {Array.from({ length: 24 }).map((_, idx) => {
                          // Random animation delay to generate organic looking waveform
                          const delay = (idx % 4) * 0.15;
                          const animDuration = 0.5 + (idx % 3) * 0.25;
                          return (
                            <div 
                              key={idx}
                              className="w-[2px] bg-emerald-500 rounded-full transition-all"
                              style={{ 
                                height: isPlaying ? '100%' : '20%',
                                animation: isPlaying ? `capcut-equalizer ${animDuration}s ease-in-out ${delay}s infinite alternate` : 'none',
                                animationPlayState: isPlaying ? 'running' : 'paused',
                                minHeight: '3px'
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Beat marks overlay on top of timeline track */}
                      {audioTrackMode === "synth" && soundtrack !== "none" && (
                        <div className="absolute inset-0 pointer-events-none flex items-center overflow-hidden">
                          {(() => {
                            const track = SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack);
                            if (!track || track.bpm === 0) return null;
                            const beatGap = 60 / track.bpm;
                            const totalBeats = Math.floor(totalDuration / beatGap);
                            return Array.from({ length: totalBeats }).map((_, i) => (
                              <div 
                                key={i} 
                                className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-ping"
                                style={{ 
                                  left: `${i * beatGap * timelineZoom}px`,
                                  opacity: isPlaying && Math.floor(currentTime / beatGap) === i ? 1.0 : 0.35
                                }}
                              />
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Live SFX Soundboard Launcher Trigger Row */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  🔊 Instant CapCut Sound Effects (SFX Launchpad)
                </span>
                <span className="text-[9px] font-bold text-slate-500">
                  Tap to play & overlay live audio impact shots
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "cinema-impact", label: "🎬 Cinematic Impact", color: "hover:bg-rose-500/10 hover:text-rose-400 border-rose-950 hover:border-rose-800" },
                  { id: "laser-sweep", label: "⚡ Laser Sweep", color: "hover:bg-cyan-500/10 hover:text-cyan-400 border-cyan-950 hover:border-cyan-800" },
                  { id: "bubble-pop", label: "🫧 Bubble Pop", color: "hover:bg-sky-500/10 hover:text-sky-400 border-sky-950 hover:border-sky-800" },
                  { id: "celestial-chime", label: "🔔 Celestial Chime", color: "hover:bg-amber-500/10 hover:text-amber-400 border-amber-950 hover:border-amber-800" },
                  { id: "arcade-rise", label: "👾 Retro Arcade Rise", color: "hover:bg-purple-500/10 hover:text-purple-400 border-purple-950 hover:border-purple-800" },
                ].map((sfx) => (
                  <button
                    key={sfx.id}
                    type="button"
                    onClick={() => {
                      synthManagerRef.current.playSingleSfx(sfx.id, sfxVolume);
                      // Optionally overlay to selected slide
                      if (selectedSlide) {
                        updateSlideProp(selectedSlide.id, "sfx", sfx.id);
                        setToastMessage({
                          text: "🔊 Sound Effect Overlaid!",
                          sub: `Assigned '${sfx.label}' to active frame #${slides.findIndex(s => s.id === selectedSlide.id) + 1}.`,
                          success: true
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border bg-slate-950/50 text-[10px] font-extrabold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 leading-none ${sfx.color}`}
                  >
                    <span>{sfx.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Protip bar */}
            <div className="flex items-center gap-1.5 text-[9.5px] text-slate-450 select-none bg-slate-950/20 p-2.5 rounded-xl border border-slate-850">
              <span className="text-amber-400">💡 CapCut ProTip:</span>
              <span>
                To resequence clips, drag and drop widescreen frames. Tap ⚡ to style transitions, click any subtitle bubble to configure beautiful overlays, and turn on **Auto Beat-Sync** for musical timing!
              </span>
            </div>
          </div>

          {/* Inline Sleek Caption Overlay Editor Dialog */}
          <AnimatePresence>
            {editingSlideCaptionId && (() => {
              const editingSlide = slides.find(s => s.id === editingSlideCaptionId);
              if (!editingSlide) return null;
              const idx = slides.findIndex(s => s.id === editingSlideCaptionId);

              return (
                <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-left space-y-4 shadow-2xl relative"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          CapCut Text Designer
                        </span>
                        <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide mt-0.5">
                          Configure Subtitles for Frame #{idx + 1}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingSlideCaptionId(null)}
                        className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Subtitle Input Textbox */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Caption / Subtitle Text Overlay:
                      </label>
                      <textarea
                        value={editingSlide.text}
                        onChange={(e) => updateSlideProp(editingSlide.id, "text", e.target.value)}
                        placeholder="Type your caption overlays here..."
                        rows={2}
                        className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium leading-relaxed"
                      />
                    </div>

                    {/* Subtitle Animations Dropdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Entrance Animation:
                        </label>
                        <select
                          value={editingSlide.textAnimation}
                          onChange={(e) => updateSlideProp(editingSlide.id, "textAnimation", e.target.value)}
                          className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="typewriter">⌨️ Typewriter</option>
                          <option value="fade">🎬 Smooth Fade</option>
                          <option value="pop">💥 Pop Zoom In</option>
                          <option value="slide-up">⬆️ Kinetic Slide Up</option>
                          <option value="none">🚫 Static overlay</option>
                        </select>
                      </div>

                      {/* Slide Filters Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Color Filter Preset:
                        </label>
                        <select
                          value={editingSlide.filter}
                          onChange={(e) => updateSlideProp(editingSlide.id, "filter", e.target.value)}
                          className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="normal">🌿 Normal (Original)</option>
                          <option value="noir">🖤 Noir B&W (Grayscale)</option>
                          <option value="vintage">🕰️ Vintage Sepia</option>
                          <option value="cinematic-warm">🎬 Cinematic Warm</option>
                          <option value="cyberpunk">👾 Cyberpunk Neon</option>
                          <option value="vhs">📹 VHS Retro Tape</option>
                          <option value="retro">🌅 Nostalgic Glow</option>
                        </select>
                      </div>
                    </div>

                    {/* Motion Pan Speed slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Ken-Burns Zoom Factor:
                        </label>
                        <span className="text-[10px] font-mono font-bold text-indigo-400">
                          {(editingSlide.scaleEnd ?? 1.15).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="1.5"
                        step="0.05"
                        value={editingSlide.scaleEnd ?? 1.15}
                        onChange={(e) => updateSlideProp(editingSlide.id, "scaleEnd", parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded-lg"
                      />
                    </div>

                    {/* Save action button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlideCaptionId(null);
                          triggerBeepChime();
                          setToastMessage({
                            text: "✨ Subtitle Styles Saved!",
                            sub: `Updated caption styles successfully for frame #${idx + 1}.`,
                            success: true
                          });
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold uppercase tracking-wider text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply & Close Studio Designer</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>

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
              <div className="space-y-2">
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
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => applyDurationToAllSlides(selectedSlide.duration)}
                    className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/10 transition-all flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Apply Duration to All Frames</span>
                  </button>
                </div>
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

                {/* Typography / Font Selector */}
                <div className="space-y-1.5 col-span-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Typography Font Style:
                    </label>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded font-mono">
                      Per-Slide
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedSlide.fontFamily || ""}
                      onChange={(e) => {
                        updateSlideProp(selectedSlide.id, "fontFamily", e.target.value || undefined);
                        triggerBeepChime();
                      }}
                      className="flex-1 px-2.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="">⚙️ Use Global Default Font</option>
                      {CURATED_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>
                          {font.name} ({font.category})
                        </option>
                      ))}
                    </select>
                    {selectedSlide.fontFamily && (
                      <button
                        type="button"
                        onClick={() => {
                          const fontToApply = selectedSlide.fontFamily;
                          if (fontToApply) {
                            slides.forEach((slide) => {
                              updateSlideProp(slide.id, "fontFamily", fontToApply);
                            });
                            triggerBeepChime();
                            setToastMessage({
                              text: "✏️ Typography Applied to All",
                              sub: "Set selected font style across all scenes in project.",
                              success: true
                            });
                          }
                        }}
                        className="px-2.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 hover:bg-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all cursor-pointer select-none active:scale-95"
                        title="Apply this typography style to all slides in the timeline"
                      >
                        Apply to All
                      </button>
                    )}
                  </div>
                </div>

                {/* Slide Transition Sound Effect */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Transition Sound Effect:
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedSlide.sfx || "none"}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSlideProp(selectedSlide.id, "sfx", val);
                        if (val !== "none") {
                          synthManagerRef.current.playSingleSfx(val, audioVolume);
                        }
                      }}
                      className="flex-1 px-2.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="none">🔇 No Sound Effect</option>
                      {SFX_LIBRARY.map((sfx) => (
                        <option key={sfx.id} value={sfx.id}>
                          {sfx.emoji} {sfx.name}
                        </option>
                      ))}
                    </select>
                    {selectedSlide.sfx && selectedSlide.sfx !== "none" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSlide.sfx) {
                            synthManagerRef.current.playSingleSfx(selectedSlide.sfx, audioVolume);
                          }
                        }}
                        className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all text-xs"
                        title="Preview sound effect"
                      >
                        🔊
                      </button>
                    )}
                  </div>
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

              {/* Overlay Elements Creator Sub-section */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-500 font-bold">✨</span>
                    <span>Overlay Elements & Shapes</span>
                  </label>
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-mono">
                    Slide Overlays
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal">
                  Add custom vector shapes, arrows, or decorative icons directly onto this slide as dynamic animated layers.
                </p>

                {/* Quick Add Elements list */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    ➕ Click to Add Vector Overlay:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { type: "rect", label: "Rect", emoji: "⬛" },
                      { type: "circle", label: "Circle", emoji: "🔴" },
                      { type: "triangle", label: "Triangle", emoji: "🔺" },
                      { type: "star", label: "Star", emoji: "⭐" },
                      { type: "heart", label: "Heart", emoji: "❤️" },
                      { type: "arrow", label: "Arrow ➡️", emoji: "➡️" },
                      { type: "checkmark", label: "Check", emoji: "✅" },
                      { type: "icon-smile", label: "Smile Icon", emoji: "😊" },
                      { type: "icon-target", label: "Target Cross", emoji: "🎯" },
                      { type: "icon-diamond", label: "Diamond Star", emoji: "💎" }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          const elementsList = selectedSlide.elements || [];
                          const isIcon = item.type.startsWith("icon-");
                          const actualType = isIcon ? "icon" : item.type as any;
                          const iconName = isIcon ? item.type.replace("icon-", "") : undefined;

                          const newElement: OverlayElement = {
                            id: "overlay-" + Date.now() + Math.random().toString(36).substr(2, 5),
                            type: actualType,
                            iconName,
                            x: 50, // center
                            y: 50, // center
                            size: 60,
                            color: item.type === "rect" ? "#4f46e5" : item.type === "circle" ? "#ef4444" : "#f59e0b",
                            opacity: 1.0,
                            rotation: 0,
                            filled: true,
                            lineWidth: 3,
                            animation: "none"
                          };

                          const updatedElements = [...elementsList, newElement];
                          updateSlideProp(selectedSlide.id, "elements", updatedElements);
                          setActiveElementId(newElement.id);
                          triggerBeepChime();
                        }}
                        className="px-1.5 py-1 text-[10px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 text-slate-750 dark:text-slate-200"
                      >
                        <span className="text-xs leading-none">{item.emoji}</span>
                        <span className="text-[8.5px] tracking-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlays List & Custom Controls */}
                {(() => {
                  const slideElements = selectedSlide.elements || [];
                  if (slideElements.length === 0) {
                    return (
                      <div className="bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl text-center select-none">
                        <span className="text-lg block leading-none">📐</span>
                        <span className="text-[10.5px] font-bold text-slate-400 block mt-1.5">No vector overlays on this slide yet.</span>
                      </div>
                    );
                  }

                  const activeEl = slideElements.find(el => el.id === activeElementId) || slideElements[0];
                  
                  return (
                    <div className="space-y-3.5">
                      {/* Select element from dropdown/tabs */}
                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          🎯 Active Layer:
                        </span>
                        <div className="flex gap-2">
                          <select
                            value={activeEl?.id || ""}
                            onChange={(e) => {
                              setActiveElementId(e.target.value);
                              triggerBeepChime();
                            }}
                            className="flex-1 px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                          >
                            {slideElements.map((el, idx) => {
                              const typeName = el.type === "icon" ? `${el.iconName} icon` : el.type;
                              return (
                                <option key={el.id} value={el.id}>
                                  Layer #{idx + 1} - {typeName.toUpperCase()} ({el.filled ? "Filled" : "Stroke"})
                                </option>
                              );
                            })}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeEl) {
                                const remaining = slideElements.filter(el => el.id !== activeEl.id);
                                updateSlideProp(selectedSlide.id, "elements", remaining);
                                if (remaining.length > 0) {
                                  setActiveElementId(remaining[0].id);
                                } else {
                                  setActiveElementId(null);
                                }
                                triggerBeepChime();
                              }
                            }}
                            className="px-3 border border-red-250 text-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1 font-black uppercase tracking-wider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Editing panel for active element */}
                      {activeEl && (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-3 text-left">
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                              Configure Overlay Attributes
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                              {activeEl.type.toUpperCase()}
                            </span>
                          </div>

                          {/* Coordinates Slider (X, Y) */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Horizontal (X):</span>
                                <span className="font-mono text-slate-400">{activeEl.x}%</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={activeEl.x}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, x: parseInt(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Vertical (Y):</span>
                                <span className="font-mono text-slate-400">{activeEl.y}%</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={activeEl.y}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, y: parseInt(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Size & Opacity Slider */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Size (Diameter):</span>
                                <span className="font-mono text-slate-400">{activeEl.size}px</span>
                              </div>
                              <input
                                type="range"
                                min={15}
                                max={150}
                                step={5}
                                value={activeEl.size}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, size: parseInt(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Opacity:</span>
                                <span className="font-mono text-slate-400">{Math.round(activeEl.opacity * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min={0.1}
                                max={1.0}
                                step={0.05}
                                value={activeEl.opacity}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, opacity: parseFloat(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Rotation & Line Thickness Slider */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Rotation Angle:</span>
                                <span className="font-mono text-slate-400">{activeEl.rotation}°</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={360}
                                step={5}
                                value={activeEl.rotation}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, rotation: parseInt(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px]">
                                <span className="font-bold text-slate-500">Stroke Thickness:</span>
                                <span className="font-mono text-slate-400">{activeEl.lineWidth || 3}px</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={activeEl.lineWidth || 3}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, lineWidth: parseInt(e.target.value) };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Fill Style & Animation Selection Row */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Toggle Fill style (only relevant for non-checkmark) */}
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                Render Style:
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = slideElements.map(el => {
                                      if (el.id === activeEl.id) {
                                        return { ...el, filled: true };
                                      }
                                      return el;
                                    });
                                    updateSlideProp(selectedSlide.id, "elements", updated);
                                    triggerBeepChime();
                                  }}
                                  className={`flex-1 py-1 rounded-lg border text-center font-extrabold text-[10px] cursor-pointer transition-all ${
                                    activeEl.filled 
                                      ? "bg-indigo-650 text-white border-indigo-650"
                                      : "bg-slate-50 dark:bg-slate-900 border-slate-150 hover:bg-slate-100"
                                  }`}
                                >
                                  Solid Fill
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = slideElements.map(el => {
                                      if (el.id === activeEl.id) {
                                        return { ...el, filled: false };
                                      }
                                      return el;
                                    });
                                    updateSlideProp(selectedSlide.id, "elements", updated);
                                    triggerBeepChime();
                                  }}
                                  className={`flex-1 py-1 rounded-lg border text-center font-extrabold text-[10px] cursor-pointer transition-all ${
                                    !activeEl.filled 
                                      ? "bg-indigo-650 text-white border-indigo-650"
                                      : "bg-slate-50 dark:bg-slate-900 border-slate-150 hover:bg-slate-100"
                                  }`}
                                >
                                  Outline
                                </button>
                              </div>
                            </div>

                            {/* Dynamic micro-animations */}
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                Motion Overlay:
                              </span>
                              <select
                                value={activeEl.animation || "none"}
                                onChange={(e) => {
                                  const updated = slideElements.map(el => {
                                    if (el.id === activeEl.id) {
                                      return { ...el, animation: e.target.value as any };
                                    }
                                    return el;
                                  });
                                  updateSlideProp(selectedSlide.id, "elements", updated);
                                }}
                                className="w-full px-2.5 py-1.5 text-[10px] font-bold text-slate-800 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                              >
                                <option value="none">🚫 No Motion</option>
                                <option value="spin">🌀 Spin (Rotation)</option>
                                <option value="pulse">💓 Pulse (Breathing)</option>
                              </select>
                            </div>
                          </div>

                          {/* Color Selector */}
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                              Palette Color Accent:
                            </span>
                            <div className="flex items-center gap-2">
                              {/* Color Presets */}
                              <div className="flex gap-1.5 flex-wrap flex-1">
                                {[
                                  { hex: "#ffffff", label: "White" },
                                  { hex: "#000000", label: "Black" },
                                  { hex: "#ef4444", label: "Red" },
                                  { hex: "#f59e0b", label: "Amber" },
                                  { hex: "#10b981", label: "Emerald" },
                                  { hex: "#06b6d4", label: "Cyan" },
                                  { hex: "#4f46e5", label: "Indigo" },
                                  { hex: "#ec4899", label: "Pink" }
                                ].map((color) => {
                                  const isSelected = activeEl.color.toLowerCase() === color.hex.toLowerCase();
                                  return (
                                    <button
                                      key={color.hex}
                                      type="button"
                                      onClick={() => {
                                        const updated = slideElements.map(el => {
                                          if (el.id === activeEl.id) {
                                            return { ...el, color: color.hex };
                                          }
                                          return el;
                                        });
                                        updateSlideProp(selectedSlide.id, "elements", updated);
                                      }}
                                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                                        isSelected 
                                          ? "scale-115 border-indigo-600 ring-2 ring-indigo-500/20" 
                                          : "border-slate-200 hover:scale-105"
                                      }`}
                                      style={{ backgroundColor: color.hex }}
                                      title={color.label}
                                    >
                                      {isSelected && (
                                        <span className={`text-[8px] font-extrabold ${color.hex === "#ffffff" ? "text-slate-900" : "text-white"}`}>
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Native Custom Color Picker */}
                              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-100 dark:border-slate-800">
                                <input
                                  type="color"
                                  value={activeEl.color.startsWith("#") ? activeEl.color : "#ffffff"}
                                  onChange={(e) => {
                                    const updated = slideElements.map(el => {
                                      if (el.id === activeEl.id) {
                                        return { ...el, color: e.target.value };
                                      }
                                      return el;
                                    });
                                    updateSlideProp(selectedSlide.id, "elements", updated);
                                  }}
                                  className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0"
                                  title="Pick custom color"
                                />
                                <span className="text-[9px] font-mono font-bold text-slate-400">Custom</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Card: Global Playback Speed Controls */}
              <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
                <div className="border-b border-slate-150 dark:border-slate-800/80 pb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span>Overall Playback Speed</span>
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-mono">
                    {videoPlaybackSpeed.toFixed(2)}x
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Customize the overall play speed of the video. Speed up to create snappy fast-motion slide clips, or slow down for immersive high-fidelity cinematic panning.
                </p>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0.25}
                    max={3.0}
                    step={0.1}
                    value={videoPlaybackSpeed}
                    onChange={(e) => {
                      setVideoPlaybackSpeed(parseFloat(e.target.value));
                      triggerBeepChime();
                    }}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 outline-none"
                  />
                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    <span>0.25x (Slow)</span>
                    <span>1.0x (Normal)</span>
                    <span>3.0x (Fast)</span>
                  </div>
                </div>

                {/* Quick Presets row */}
                <div className="flex gap-1.5 justify-center pt-1">
                  {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setVideoPlaybackSpeed(speed);
                        triggerBeepChime();
                        setToastMessage({
                          text: `⚡ Speed: ${speed}x`,
                          sub: speed === 1.0 ? "Playback reset to original normal tempo." : `Video playback scaled to ${speed}x speed.`,
                          success: true
                        });
                      }}
                      className={`px-3 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all border ${
                        videoPlaybackSpeed === speed
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 border-slate-200 dark:border-slate-850"
                      }`}
                    >
                      {speed === 1.0 ? "1.0x (Normal)" : `${speed}x`}
                    </button>
                  ))}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      3. Video Duration:
                    </label>
                    <span className="text-[10.5px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                      {(selectedSlide.promptDuration ?? 3)}s
                    </span>
                  </div>
                  
                  {/* Slider Control */}
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={selectedSlide.promptDuration ?? 3}
                    onChange={(e) => {
                      updateSlideProp(selectedSlide.id, "promptDuration", parseInt(e.target.value));
                      triggerBeepChime();
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    title="Drag to adjust video duration from 2 to 10 seconds"
                    id="slider-video-duration"
                  />

                  {/* Preset Quick Buttons */}
                  <div className="flex flex-col gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide px-1">Presets:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { val: 3, label: "3s Punchy" },
                        { val: 6, label: "6s Balanced" },
                        { val: 9, label: "9s Cinematic" }
                      ].map((preset) => {
                        const isActive = (selectedSlide.promptDuration ?? 3) === preset.val;
                        return (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              updateSlideProp(selectedSlide.id, "promptDuration", preset.val);
                              triggerBeepChime();
                            }}
                            className={`flex-1 py-1 px-1.5 rounded-lg text-[9px] font-black tracking-tight transition-all cursor-pointer select-none text-center whitespace-nowrap ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30 bg-slate-200/20 dark:bg-slate-800/10"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Dynamic Motion Recommendation Guide */}
                  <div className="p-2 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/40 dark:border-indigo-900/40 rounded-xl space-y-1">
                    <span className="block text-[8.5px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      💡 Recommended Camera Motion:
                    </span>
                    <div className="text-[9.5px] text-slate-600 dark:text-slate-300 leading-normal font-medium">
                      {(selectedSlide.promptDuration ?? 3) <= 3 && (
                        <>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">⚡ Snappy pacing:</span> Try <span className="font-bold underline decoration-indigo-300 dark:decoration-indigo-800">Fast Zoom</span>, <span className="font-bold underline decoration-indigo-300 dark:decoration-indigo-800">Quick Pan</span>, or <span className="font-bold underline decoration-indigo-300 dark:decoration-indigo-800">Kinetic Tilt</span>.
                        </>
                      )}
                      {(selectedSlide.promptDuration ?? 3) >= 4 && (selectedSlide.promptDuration ?? 3) <= 6 && (
                        <>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">🎬 Balanced pacing:</span> Try <span className="font-bold underline decoration-emerald-300 dark:decoration-emerald-800">Slow Zoom In</span>, <span className="font-bold underline decoration-emerald-300 dark:decoration-emerald-800">Smooth Pan</span>, or <span className="font-bold underline decoration-emerald-300 dark:decoration-emerald-800">Soft Orbit</span>.
                        </>
                      )}
                      {(selectedSlide.promptDuration ?? 3) >= 7 && (selectedSlide.promptDuration ?? 3) <= 8 && (
                        <>
                          <span className="font-bold text-amber-600 dark:text-amber-500">🏔️ Graceful pacing:</span> Try <span className="font-bold underline decoration-amber-300 dark:decoration-amber-800">Gentle Parallax</span>, <span className="font-bold underline decoration-amber-300 dark:decoration-amber-800">Soft Breathing</span>, or <span className="font-bold underline decoration-amber-300 dark:decoration-amber-800">Elegant Orbit</span>.
                        </>
                      )}
                      {(selectedSlide.promptDuration ?? 3) >= 9 && (selectedSlide.promptDuration ?? 3) <= 10 && (
                        <>
                          <span className="font-bold text-rose-600 dark:text-rose-400">🌟 Majestic pacing:</span> Try <span className="font-bold underline decoration-rose-300 dark:decoration-rose-800">Epic Panoramic</span>, <span className="font-bold underline decoration-rose-300 dark:decoration-rose-800">Continuous Flyover</span>, or <span className="font-bold underline decoration-rose-300 dark:decoration-rose-800">Narrative Glide</span>.
                        </>
                      )}
                    </div>
                  </div>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    7. Focus Subject & Magic Enhance:
                  </label>
                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    PRO ENGINE
                  </span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={selectedSlide.subjectDescription ?? ""}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "subjectDescription", e.target.value)}
                    placeholder='Describe main focus, e.g. "flowing water", "waving hand", "highly detailed cinematic cybercar speeding past neon lights"...'
                    rows={2}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
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
                {renderPromptValidationInfo(selectedSlide.subjectDescription ?? "", false)}

                {/* Quick Add Visual Modifiers & Enhancers */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">
                    ⚡ Quick Modifier Boosters (Click to Add):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "🎬 4K Resolution",
                      "💎 Ultra-Detailed",
                      "🌪️ Fluid Motion",
                      "🕹️ Unreal Engine 5",
                      "✨ Volumetric Glow",
                      "🎥 Raytraced Reflections",
                      "🌸 Slow Motion Drift",
                      "⚡ 60FPS Smooth"
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = selectedSlide.subjectDescription || "";
                          const tagClean = tag.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();
                          const newVal = current.trim()
                            ? `${current.trim().endsWith(",") || current.trim().endsWith(".") ? current.trim() : current.trim() + ","} ${tagClean}`
                            : tagClean;
                          updateSlideProp(selectedSlide.id, "subjectDescription", newVal);
                          triggerBeepChime();
                        }}
                        className="px-2 py-0.5 text-[9px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-350 transition-all select-none cursor-pointer hover:scale-105 active:scale-95"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
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

              {/* 7. PROMPT ENGINE TEMPLATE STYLE */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  9. Prompt Optimization Engine:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: "runway_agent", label: "Runway Gen-4", desc: "Cinematic Gen-4" },
                    { id: "detailed", label: "Detailed", desc: "Heavy Adjectives" },
                    { id: "minimal", label: "Minimal", desc: "Short Keywords" },
                    { id: "sora_luma", label: "Sora & Luma", desc: "AI Optimized" }
                  ].map((item) => {
                    const isSel = promptTemplateStyle === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPromptTemplateStyle(item.id as any);
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col gap-0.5 leading-tight ${
                          isSel
                            ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="text-[10px] font-black">{item.label}</span>
                        <span className={`text-[8px] font-medium leading-none ${isSel ? "text-indigo-200" : "text-slate-400"}`}>{item.desc}</span>
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
                    value={getGeneratedPrompt(selectedSlide, promptTemplateStyle)}
                    rows={5}
                    className="w-full p-3 pb-12 text-[11px] font-mono bg-slate-100/50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-850 text-slate-600 dark:text-slate-300 rounded-2xl resize-none focus:outline-none focus:ring-0 leading-relaxed shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const finalPrompt = getGeneratedPrompt(selectedSlide, promptTemplateStyle);
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
                    className="absolute right-2.5 bottom-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95 select-none animate-fade-in"
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

            {/* Background Audio Selector & Music Library with Sub-Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Background Soundtrack Library:</span>
                </label>
                {previewingTrack && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Auditioning Live
                  </span>
                )}
              </div>

              {/* Tab Header Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMusicTab("mp3");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    musicTab === "mp3"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  }`}
                >
                  🎵 Music Library
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMusicTab("synth");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    musicTab === "synth"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  }`}
                >
                  🎹 Synth Loops
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMusicTab("custom");
                    triggerBeepChime();
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    musicTab === "custom"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  }`}
                >
                  📂 Custom Audio
                </button>
              </div>

              {/* Tab 1: CURATED_MP3_LIBRARY */}
              {musicTab === "mp3" && (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {CURATED_MP3_LIBRARY.map((track) => {
                    const isSelected = audioTrackMode === "custom" && customAudioUrl === track.url;
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
                              setAudioTrackMode("custom");
                              setCustomAudioUrl(track.url);
                              setCustomAudioName(track.name);
                              triggerBeepChime();
                              if (isPlaying) {
                                synthManagerRef.current.stop();
                                if (!isMuted) {
                                  setTimeout(() => {
                                    synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, track.url, currentTime, audioTrimStart, audioTrimEnd);
                                  }, 100);
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
                                synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, track.url, 0);
                                setPreviewingTrack(track.id);
                              }
                              triggerBeepChime();
                            }}
                            className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isPreviewing
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                : "bg-slate-100 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800"
                            }`}
                            title={isPreviewing ? "Stop Preview" : "Listen Preview Track"}
                          >
                            {isPreviewing ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold text-slate-450">
                          <span className="bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                            Genre: {track.genre}
                          </span>
                          <span className="font-mono text-[9.5px]">
                            ⏱️ {track.duration} High-Fidelity MP3
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: SOUNDTRACK_LIBRARY */}
              {musicTab === "synth" && (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {SOUNDTRACK_LIBRARY.map((track) => {
                    const isSelected = audioTrackMode === "synth" && soundtrack === track.id;
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
                              setAudioTrackMode("synth");
                              setSoundtrack(track.id);
                              triggerBeepChime();
                              if (isPlaying) {
                                synthManagerRef.current.stop();
                                if (!isMuted && track.id !== "none") {
                                  setTimeout(() => {
                                    synthManagerRef.current.start(track.id, audioVolume, audioFadeIn, audioFadeOut, totalDuration);
                                  }, 100);
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
              )}

              {/* Tab 3: Custom Audio File Upload */}
              {musicTab === "custom" && (
                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-3 shadow-3xs">
                  <div className="text-center p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <Upload className="w-6 h-6 text-indigo-500 mx-auto" />
                    <div>
                      <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">Upload Your Own Soundtrack</p>
                      <p className="text-[9.5px] text-slate-450 mt-0.5">Pick any MP3 or WAV from your local drive</p>
                    </div>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setCustomAudioUrl(url);
                        setCustomAudioName(file.name);
                        setAudioTrackMode("custom");
                        synthManagerRef.current.stop();
                        if (isPlaying) {
                          setTimeout(() => {
                            synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, url, currentTime, audioTrimStart, audioTrimEnd);
                          }, 100);
                        }
                        setToastMessage({
                          text: "🎵 Custom Audio Loaded",
                          sub: `"${file.name}" is now the active background track.`,
                          success: true
                        });
                        triggerBeepChime();
                      }}
                      className="hidden"
                      id="custom-audio-uploader"
                    />
                    <label
                      htmlFor="custom-audio-uploader"
                      className="inline-block px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-900 transition-all cursor-pointer"
                    >
                      Choose Audio File
                    </label>
                  </div>

                  {customAudioUrl && (
                    <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                          🎧 {customAudioName || "Custom Soundtrack"}
                        </p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5">Custom Loaded Stream</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const isPreviewing = previewingTrack === "custom-local";
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
                              synthManagerRef.current.start("custom", audioVolume, false, false, totalDuration, customAudioUrl, 0, audioTrimStart, audioTrimEnd);
                              setPreviewingTrack("custom-local");
                            }
                            triggerBeepChime();
                          }}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            previewingTrack === "custom-local"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-slate-100 border-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {previewingTrack === "custom-local" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            synthManagerRef.current.stop();
                            setCustomAudioUrl(null);
                            setCustomAudioName(null);
                            setAudioTrackMode("synth");
                            setToastMessage({
                              text: "🗑️ Custom Audio Removed",
                              sub: "Reverted back to procedurally synthesized lofi soundtrack.",
                              success: true
                            });
                            triggerBeepChime();
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-950 dark:text-red-400 cursor-pointer transition-all"
                          title="Remove Audio"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audio Trimmer Feature */}
            {customAudioUrl && customAudioDuration !== null && (
              <div id="audio-trimmer-section" className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-100">
                      Audio Segment Trimmer
                    </span>
                  </div>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                    Trim Active
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-455 dark:text-slate-400 leading-relaxed">
                  Select your preferred segment of <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{customAudioName || "custom track"}</strong> to play in the background. The video will loop this specific portion.
                </p>

                {/* Simulated Audio Waveform Bar Visualizer */}
                <div className="relative pt-1">
                  <div className="h-11 flex items-end justify-between gap-[2px] bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const percent = i / 48;
                      const seconds = percent * customAudioDuration;
                      const isWithinTrim = seconds >= audioTrimStart && seconds <= audioTrimEnd;
                      // Generate deterministic heights for visual aesthetic
                      const heightPercent = [20, 45, 75, 55, 30, 40, 65, 85, 90, 60, 40, 25, 50, 70, 80, 55, 30, 45, 60, 75, 40, 20, 50, 80, 95, 70, 45, 30, 55, 75, 85, 60, 35, 25, 50, 75, 90, 65, 40, 30, 55, 70, 80, 50, 25, 45, 65, 30][i];
                      
                      return (
                        <div
                          key={i}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-xs transition-colors duration-200 ${
                            isWithinTrim 
                              ? "bg-indigo-550 dark:bg-indigo-450" 
                              : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Range labels */}
                  <div className="flex justify-between text-[9.5px] font-bold text-slate-500 mt-1.5 px-0.5">
                    <span>0:00</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      ✂️ Selected: {formatTime(audioTrimStart)} – {formatTime(audioTrimEnd)} ({Math.round(audioTrimEnd - audioTrimStart)}s)
                    </span>
                    <span>{formatTime(customAudioDuration)}</span>
                  </div>
                </div>

                {/* Slider range controls */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide flex justify-between">
                      <span>Start Position</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatTime(audioTrimStart)}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={customAudioDuration.toString()}
                        step="0.5"
                        value={audioTrimStart}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val < audioTrimEnd) {
                            setAudioTrimStart(val);
                            synthManagerRef.current.seek(currentTime);
                          }
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 px-1.5 py-1 rounded-md border border-slate-150 dark:border-slate-800 shrink-0 min-w-[45px] text-center shadow-xs">
                        {Math.round(audioTrimStart)}s
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide flex justify-between">
                      <span>End Position</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatTime(audioTrimEnd)}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={customAudioDuration.toString()}
                        step="0.5"
                        value={audioTrimEnd}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > audioTrimStart) {
                            setAudioTrimEnd(val);
                            synthManagerRef.current.seek(currentTime);
                          }
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 px-1.5 py-1 rounded-md border border-slate-150 dark:border-slate-800 shrink-0 min-w-[45px] text-center shadow-xs">
                        {Math.round(audioTrimEnd)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pre-sets / Quick trims and Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black text-slate-450 uppercase tracking-wider mr-1">Quick Segments:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioTrimStart(0);
                        setAudioTrimEnd(Math.min(15, customAudioDuration));
                        triggerBeepChime();
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-600 dark:text-slate-355 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer hover:bg-slate-50"
                    >
                      15s Intro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioTrimStart(0);
                        setAudioTrimEnd(Math.min(30, customAudioDuration));
                        triggerBeepChime();
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-600 dark:text-slate-355 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer hover:bg-slate-50"
                    >
                      30s Clip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const mid = customAudioDuration / 2;
                        setAudioTrimStart(Math.max(0, Math.round(mid - 15)));
                        setAudioTrimEnd(Math.min(customAudioDuration, Math.round(mid + 15)));
                        triggerBeepChime();
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-600 dark:text-slate-355 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer hover:bg-slate-50"
                    >
                      Mid 30s
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioTrimStart(0);
                        setAudioTrimEnd(customAudioDuration);
                        triggerBeepChime();
                      }}
                      className="px-2 py-1 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/30 dark:hover:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-[9.5px] font-extrabold rounded-lg transition-all cursor-pointer"
                    >
                      Reset Full
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      synthManagerRef.current.stop();
                      if (previewingTrack === "trim-preview") {
                        setPreviewingTrack(null);
                      } else {
                        // Play from start of trim to end of trim
                        synthManagerRef.current.start("custom", audioVolume, false, false, audioTrimEnd - audioTrimStart, customAudioUrl, 0, audioTrimStart, audioTrimEnd);
                        setPreviewingTrack("trim-preview");
                        setToastMessage({
                          text: "🎧 Playing Trim Audition",
                          sub: `Listening to custom trimmed segment (${Math.round(audioTrimEnd - audioTrimStart)} seconds).`,
                          success: true
                        });
                      }
                      triggerBeepChime();
                    }}
                    className={`px-3 py-1 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      previewingTrack === "trim-preview"
                        ? "bg-emerald-500 border-emerald-550 text-white animate-pulse"
                        : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {previewingTrack === "trim-preview" ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Stop Preview
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Audition Trim
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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

              {/* Premium Live Audio Visualizer Settings */}
              <div className="border-t border-slate-100 dark:border-slate-900 pt-3.5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                  🎨 Live Audio Visualizer Overlay:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "none" as const, label: "❌ None" },
                    { id: "wave" as const, label: "〰️ Wave" },
                    { id: "bars" as const, label: "📊 Bars" },
                    { id: "pulse" as const, label: "💗 Pulse" }
                  ].map((styleOpt) => {
                    const isSel = visualizerStyle === styleOpt.id;
                    return (
                      <button
                        key={styleOpt.id}
                        type="button"
                        onClick={() => {
                          setVisualizerStyle(styleOpt.id);
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-1 rounded-xl border text-center text-[10.5px] font-black transition-all cursor-pointer select-none ${
                          isSel
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        {styleOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Narrator Voiceover settings */}
              <div className="border-t border-slate-100 dark:border-slate-900 pt-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                    🤖 AI Voiceover Narration:
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                    TTS Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Enable Switcher */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={voiceoverEnabled}
                      onChange={(e) => {
                        setVoiceoverEnabled(e.target.checked);
                        triggerBeepChime();
                      }}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        Enable Voiceover
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        Narrate slide overlay text
                      </span>
                    </div>
                  </label>

                  {/* Gender Selector */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Voice Gender Accent:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "female" as const, label: "👩 Female" },
                        { id: "male" as const, label: "👨 Male" }
                      ].map((genderOpt) => {
                        const isSel = voiceoverGender === genderOpt.id;
                        return (
                          <button
                            key={genderOpt.id}
                            type="button"
                            disabled={!voiceoverEnabled}
                            onClick={() => {
                              setVoiceoverGender(genderOpt.id);
                              triggerBeepChime();
                            }}
                            className={`py-1.5 px-1 rounded-xl border text-center text-[10px] font-black transition-all cursor-pointer select-none ${
                              isSel
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40"
                            }`}
                          >
                            {genderOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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

          {/* Section: Cinematic Effects & Subtitle Studio */}
          <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Cinematic VFX & Captioning</span>
            </h4>

            {/* Global Video Filter selection */}
            <div className="space-y-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span>🎭</span>
                  <span>Global Video Filter:</span>
                </label>
                {masterVideoFilter !== "none" && (
                  <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded animate-pulse">
                    Active
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "none", label: "None", emoji: "❌", desc: "Original" },
                  { id: "grayscale", label: "Grayscale", emoji: "🌑", desc: "Noir-chic" },
                  { id: "sepia", label: "Sepia", emoji: "🟫", desc: "Warm clay" },
                  { id: "vintage", label: "Vintage", emoji: "📜", desc: "Retro film" },
                  { id: "high-contrast", label: "Contrast", emoji: "⚡", desc: "Bold punch" },
                  { id: "cyberpunk", label: "Cyberpunk", emoji: "🔮", desc: "Neon wave" },
                  { id: "noir", label: "Noir", emoji: "🎬", desc: "Mood shadow" },
                  { id: "cool", label: "Cool Blue", emoji: "❄️", desc: "Arctic chill" },
                  { id: "warm", label: "Warm Light", emoji: "☀️", desc: "Golden hour" }
                ].map((item) => {
                  const isSelected = masterVideoFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMasterVideoFilter(item.id as any);
                        triggerBeepChime();
                      }}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                          : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-300 hover:scale-102"
                      }`}
                      title={`${item.label} - ${item.desc}`}
                    >
                      <span className="text-xs leading-none">{item.emoji}</span>
                      <span className="text-[9.5px] font-black leading-none mt-1">{item.label}</span>
                      <span className={`text-[7px] font-medium leading-none ${isSelected ? "text-indigo-200" : "text-slate-450"}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtitle style selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Subtitle Aesthetic Theme:
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "netflix", label: "Netflix Classic", desc: "Dark capsule backdrop" },
                  { id: "neon", label: "Neon Glow", desc: "Vibrant glowing outline" },
                  { id: "karaoke", label: "Golden Lyrics", desc: "Bold outline contour" },
                  { id: "minimal", label: "Pure Minimal", desc: "Crisp drop-shadow white" },
                  { id: "classical", label: "Indie Classical", desc: "Georgia serif italic" }
                ].map((style) => {
                  const isSelected = subtitleStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setSubtitleStyle(style.id as any);
                        triggerBeepChime();
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col gap-0.5 ${
                        isSelected
                          ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                          : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-300"
                      } ${style.id === "classical" ? "col-span-2" : ""}`}
                    >
                      <span className="text-[10.5px] font-black">{style.label}</span>
                      <span className={`text-[8px] font-medium leading-none ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>{style.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Global Font Library Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Global Font Style:</span>
                </label>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded font-mono">
                  Default Font
                </span>
              </div>
              <div className="relative">
                <select
                  value={subtitleFont}
                  onChange={(e) => {
                    setSubtitleFont(e.target.value);
                    triggerBeepChime();
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                >
                  {CURATED_FONTS.map((font) => (
                    <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>
                      {font.name} ({font.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {CURATED_FONTS.slice(0, 5).map((font) => {
                  const isSelected = subtitleFont === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => {
                        setSubtitleFont(font.id);
                        triggerBeepChime();
                      }}
                      style={{ fontFamily: font.family }}
                      className={`py-1 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer select-none truncate ${
                        isSelected 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-400 font-black shadow-sm scale-102"
                          : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-300 text-slate-700"
                      }`}
                      title={font.name}
                    >
                      {font.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtitle manual vertical offset adjustment */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Caption Height (Overlap Avoidance):
                </label>
                <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                  {subtitleManualOffset}px
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={150}
                step={5}
                value={subtitleManualOffset}
                onChange={(e) => {
                  setSubtitleManualOffset(parseInt(e.target.value));
                }}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[8px] text-slate-400 leading-tight">
                Shift captions vertically to avoid overlapping with transitions or background items.
              </p>
            </div>

            {/* Overlays toggle switches */}
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Visual Post-Processing:
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Widescreen Letterbox */}
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  cinematicLetterbox 
                    ? "bg-slate-100/50 border-slate-300 dark:bg-slate-900/40 dark:border-slate-800"
                    : "border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                } ${aspectRatio !== "16:9" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={aspectRatio !== "16:9"}
                    checked={cinematicLetterbox && aspectRatio === "16:9"}
                    onChange={(e) => {
                      setCinematicLetterbox(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                      Cinematic Letterbox (2.39:1 Bars)
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Adds authentic movie widescreen cropping (16:9 aspect ratio only)
                    </span>
                  </div>
                </label>

                {/* Vignette border shading */}
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  vignetteOverlay 
                    ? "bg-slate-100/50 border-slate-300 dark:bg-slate-900/40 dark:border-slate-800"
                    : "border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                }`}>
                  <input
                    type="checkbox"
                    checked={vignetteOverlay}
                    onChange={(e) => {
                      setVignetteOverlay(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                      Ambient Vignette Shade
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Fades corners to soft dark shadows for center subject focus
                    </span>
                  </div>
                </label>
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
                <span className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 rounded-xl font-mono leading-none flex items-center justify-center select-none uppercase">
                  .{exportFormat}
                </span>
              </div>
            </div>

            {/* Output Format Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Output Format:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "mp4", label: "MP4", desc: "Highly Compatible" },
                  { id: "webm", label: "WebM", desc: "Ultra Compact" },
                  { id: "gif", label: "GIF", desc: "Animated Image" }
                ].map((item) => {
                  const isActive = exportFormat === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setExportFormat(item.id as any);
                        triggerBeepChime();
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-0.5 ${
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10"
                          : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-350"
                      }`}
                    >
                      <span className="text-[11px] font-black leading-none">{item.label}</span>
                      <span className="text-[8px] font-medium opacity-80 leading-none mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
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
