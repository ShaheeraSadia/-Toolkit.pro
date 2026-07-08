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
  Copy,
  Sliders,
  Scissors,
  Clock,
  Gauge,
  GripVertical,
  Move,
  BookOpen,
  Lightbulb,
  Zap,
  Flame,
  Mic,
  ListChecks,
  Grid
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
  filter: "normal" | "noir" | "vintage" | "cinematic-warm" | "cyberpunk" | "vhs" | "retro" | "glitch-synth" | "dreamy-pastel" | "matrix-code" | "grayscale" | "sepia" | "high-contrast";
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

  // Real-time audio node properties
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
      try {
        this.audioElement.playbackRate = factor;
      } catch (e) {
        console.warn("Could not set playbackRate on audio element:", e);
      }
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

    if (this.isPlaying) {
      this.stop();
    }

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

      if (this.fadeOut && this.totalDuration > 1.5) {
        const fadeStartTime = now + this.totalDuration - 1.5;
        this.gainNode.gain.setValueAtTime(this.volume, fadeStartTime);
        this.gainNode.gain.linearRampToValueAtTime(0.0001, now + this.totalDuration);
      }

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      // Instantiate Filter Node (Lowpass)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(this.filterCutoff, now);

      // Instantiate Feedback Delay Node
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.35, now); // 350ms echo time
      
      this.delayGainNode = this.ctx.createGain();
      this.delayGainNode.gain.setValueAtTime(this.delayFeedback, now);

      // Create Delay feedback loop
      this.delayNode.connect(this.delayGainNode);
      this.delayGainNode.connect(this.delayNode);

      // Connect dry/wet main chain:
      // Sources -> filterNode
      // filterNode -> gainNode (dry)
      // filterNode -> delayNode -> gainNode (wet echo)
      this.filterNode.connect(this.gainNode);
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.gainNode);

      // Master output: gainNode -> analyser -> destination
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isPlaying = true;

      // Handle custom audio source
      if (track === "custom" && customAudioUrl) {
        this.audioElement = new Audio(customAudioUrl);
        this.audioElement.volume = volume;
        this.audioElement.crossOrigin = "anonymous";
        this.audioNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioNode.connect(this.filterNode || this.gainNode);
        
        // Apply playbackRate based on tempoFactor
        try {
          this.audioElement.playbackRate = this.tempoFactor;
        } catch (e) {
          console.warn("Could not set playbackRate:", e);
        }

        const hasTrim = this.trimEnd > this.trimStart;
        this.audioElement.loop = loopAudio && !hasTrim; // Native loop only if not trimmed and looping is enabled
        
        // Seek to correct start time
        const startOffset = this.trimStart;
        if (hasTrim) {
          const trimDur = this.trimEnd - this.trimStart;
          this.audioElement.currentTime = startOffset + (startTime % (trimDur || 1));
          
          this.audioElement.addEventListener("timeupdate", () => {
            if (this.audioElement && this.audioElement.currentTime >= this.trimEnd) {
              if (loopAudio) {
                this.audioElement.currentTime = this.trimStart;
              } else {
                this.audioElement.pause();
              }
            }
          });
        } else {
          this.audioElement.currentTime = startOffset + startTime;
          
          if (!loopAudio) {
            this.audioElement.addEventListener("ended", () => {
              if (this.audioElement) {
                this.audioElement.pause();
              }
            });
          }
        }

        return new Promise<void>((resolve) => {
          if (!this.audioElement) {
            resolve();
            return;
          }

          const onCanPlay = () => {
            if (this.audioElement) {
              this.audioElement.removeEventListener("canplaythrough", onCanPlay);
              this.audioElement.removeEventListener("error", onError);
              this.audioElement.play()
                .then(() => resolve())
                .catch(e => {
                  console.warn("Failed to play custom audio in Synth:", e);
                  resolve();
                });
            } else {
              resolve();
            }
          };

          const onError = () => {
            if (this.audioElement) {
              this.audioElement.removeEventListener("canplaythrough", onCanPlay);
              this.audioElement.removeEventListener("error", onError);
            }
            resolve();
          };

          if (this.audioElement.readyState >= 3) {
            this.audioElement.play()
              .then(() => resolve())
              .catch(e => {
                console.warn("Failed to play custom audio:", e);
                resolve();
              });
          } else {
            this.audioElement.addEventListener("canplaythrough", onCanPlay);
            this.audioElement.addEventListener("error", onError);
            setTimeout(onCanPlay, 3000); // 3 seconds fallback
          }
        });
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
        return Promise.resolve();
      }

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
      console.warn("Failed to initialize synth soundtrack:", e);
      return Promise.resolve();
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
    g.connect(this.filterNode || this.gainNode);

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
    id: "garrey-space-preset",
    name: "Garrey Cosmic Space",
    url: garreySpaceUrl,
    category: "Adventure",
    text: "Garrey Space Odyssey",
    cameraMovement: "Slow Zoom",
    subjectDescription: "cute fluffy space explorer Garrey wearing astronaut suit and bubble helmet floating in colorful cosmic nebulae",
    style: "Cinematic",
    sfx: "arcade-rise"
  },
  {
    id: "adventure-mountain-camp",
    name: "Starlit Mountain Camp",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop",
    category: "Adventure",
    text: "Night Under the Stars",
    cameraMovement: "Slow Zoom",
    subjectDescription: "cozy glowing camp fire and yellow tent under a breathtaking Milky Way night sky filled with millions of stars",
    style: "Cinematic",
    sfx: "cinema-impact"
  },
  {
    id: "adventure-bridge",
    name: "Mystic Forest Bridge",
    url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&auto=format&fit=crop",
    category: "Adventure",
    text: "Journey to the Unknown",
    cameraMovement: "Pan Left",
    subjectDescription: "a solitary traveler walking across an ancient suspension bridge enveloped in dense mountain fog and ancient pine trees",
    style: "Dreamy",
    sfx: "none"
  },
  {
    id: "adventure-highway",
    name: "Desert Highway Roadtrip",
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop",
    category: "Adventure",
    text: "The Open Road Awaits",
    cameraMovement: "Pan Right",
    subjectDescription: "classic red retro station wagon driving on a long straight highway heading towards majestic red rock canyon formations at sunset",
    style: "Cinematic",
    sfx: "none"
  },
  {
    id: "adventure-cappadocia",
    name: "Cappadocia Balloons",
    url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
    category: "Adventure",
    text: "Floating Over Valleys",
    cameraMovement: "Slow Zoom",
    subjectDescription: "dozens of colorful hot air balloons rising into the golden morning sky above the unique rock valleys of Turkey",
    style: "Realistic",
    sfx: "celestial-chime"
  },
  {
    id: "adventure-climber",
    name: "Peak Ascent Challenge",
    url: "https://images.unsplash.com/photo-1486915307831-2acac87a54c8?w=800&auto=format&fit=crop",
    category: "Adventure",
    text: "Conquering the Heights",
    cameraMovement: "Tilt Up",
    subjectDescription: "a climber in red gear navigating a steep snow-covered ridge with a vast panorama of sharp icy peaks behind them",
    style: "Cinematic",
    sfx: "cinema-impact"
  },
  {
    id: "garrey-deepsea-preset",
    name: "Garrey Deep Sea",
    url: garreyDeepSeaUrl,
    category: "Nature",
    text: "Garrey Deep-Sea Adventure",
    cameraMovement: "Pan Left",
    subjectDescription: "cute fluffy deep-sea explorer Garrey wearing brass diving helmet surrounded by luminous coral reef and bubbles",
    style: "Cinematic",
    sfx: "bubble-pop"
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
    id: "nature-sunbeams",
    name: "Sunbeams of Redwood",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Sanctuary of Light",
    cameraMovement: "Slow Zoom",
    subjectDescription: "intense beautiful sunbeams filtering through giant redwood trees onto a lush green forest floor",
    style: "Cinematic",
    sfx: "celestial-chime"
  },
  {
    id: "nature-aurora",
    name: "Cosmic Aurora Nights",
    url: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Celestial Light Show",
    cameraMovement: "Pan Left",
    subjectDescription: "vibrant glowing green and purple aurora borealis waving across a starry night sky above a snowy forest",
    style: "Dreamy",
    sfx: "celestial-chime"
  },
  {
    id: "nature-waterfall",
    name: "Yosemite Valley Falls",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Roar of the Falls",
    cameraMovement: "Tilt Down",
    subjectDescription: "powerful waterfall cascading down giant granite cliffs into a mist-filled river valley surrounded by golden trees",
    style: "Realistic",
    sfx: "bubble-pop"
  },
  {
    id: "nature-jungle",
    name: "Mystical Sunlit Jungle",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop",
    category: "Nature",
    text: "Deep Jungle Canopy",
    cameraMovement: "Slow Pan",
    subjectDescription: "lush tropical green ferns and ancient moss-covered tree roots catching soft shafts of morning light",
    style: "Oil Painting 🎨",
    sfx: "bubble-pop"
  },
  {
    id: "garrey-cyber-preset",
    name: "Garrey Cyber Hacker",
    url: garreyCyberHackerUrl,
    category: "Cyberpunk",
    text: "Garrey Cyber Security Lab",
    cameraMovement: "Tilt Up",
    subjectDescription: "cute fluffy hacker Garrey wearing tech hoodie and glowing goggles in cozy futuristic room surrounded by neon computer screens",
    style: "Retro VHS 📹",
    sfx: "laser-sweep"
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
    id: "cyber-neon-street",
    name: "Seoul Synthwave Hub",
    url: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "Neon Night Grid",
    cameraMovement: "Slow Zoom",
    subjectDescription: "a hyper-futuristic street with neon pink and blue storefront signs, high-tech flying cars passing above, and reflection puddles",
    style: "Cinematic",
    sfx: "laser-sweep"
  },
  {
    id: "cyber-desk",
    name: "Hacker Battlestation",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "Initialize Mainframe",
    cameraMovement: "Pan Right",
    subjectDescription: "a clean futuristic programmer room featuring multiple glowing widescreen monitors displaying complex green terminal scripts and cyan ambient lights",
    style: "Realistic",
    sfx: "arcade-rise"
  },
  {
    id: "cyber-grid",
    name: "Synthwave Sunset Grid",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "Outrun the Future",
    cameraMovement: "Slow Zoom",
    subjectDescription: "an endless glowing wireframe grid with a giant neon sun setting in a hazy 80s pink purple background",
    style: "Retro VHS 📹",
    sfx: "arcade-rise"
  },
  {
    id: "cyber-hologram",
    name: "Nebula Hologram Orb",
    url: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&auto=format&fit=crop",
    category: "Cyberpunk",
    text: "AI Overlord Core",
    cameraMovement: "Tilt Up",
    subjectDescription: "a floating complex glass holographic sphere emitting purple and magenta rays of light in a dark technological server room",
    style: "Cinematic",
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
  },
  {
    id: "abstract-hardware",
    name: "Silicon Circuit Mind",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Quantum Processor",
    cameraMovement: "Slow Zoom",
    subjectDescription: "abstract macro photography of high-tech motherboard circuits with glowing gold pathways and microchips",
    style: "3D Render 🪐",
    sfx: "cinema-impact"
  },
  {
    id: "abstract-paint",
    name: "Cosmic Acrylic Swirls",
    url: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Interstellar Flow",
    cameraMovement: "Pan Left",
    subjectDescription: "beautiful slow moving macro marble swirls of cyan blue, gold, and magenta liquid acrylic paint in absolute zero gravity",
    style: "Oil Painting 🎨",
    sfx: "celestial-chime"
  },
  {
    id: "abstract-neon-wave",
    name: "Neon Luminescence",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Pulse of the Grid",
    cameraMovement: "Slow Zoom",
    subjectDescription: "glowing neon wireframe glass wave curves crossing over each other in dark space with pink and blue laser gradients",
    style: "3D Render 🪐",
    sfx: "laser-sweep"
  },
  {
    id: "abstract-gradient",
    name: "Vibrant Dawn Horizon",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop",
    category: "Abstract",
    text: "Ethereal Aura",
    cameraMovement: "Slow Pan",
    subjectDescription: "ultra soft warm orange and rich velvet violet aesthetic grainy smooth gradient mesh",
    style: "Dreamy",
    sfx: "celestial-chime"
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
    id: "golden-hour-drive",
    name: "Golden Hour Drive",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "Guitar Pop/Rock",
    emoji: "🚗",
    desc: "An upbeat, driving pop-rock track with sparkling electric guitars and steady energetic drums.",
    duration: "7:05"
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
    id: "electric-flow",
    name: "Electric Flow Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Upbeat Techno",
    emoji: "⚡",
    desc: "Pulsating electric synthesizers, driving retro drum patterns, and dynamic high-energy stabs.",
    duration: "5:02"
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
    id: "peaceful-meadow",
    name: "Peaceful Meadow Acoustic",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    genre: "Acoustic Folk",
    emoji: "🏡",
    desc: "Soft warm acoustic folk guitars fingerpicking sweet, positive morning chords in a slow tempo.",
    duration: "5:38"
  },
  {
    id: "midnight-groove",
    name: "Midnight Funk Groove",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    genre: "Funk / Groove",
    emoji: "🕺",
    desc: "A funky, bouncing slap-bass groove with retro Rhodes electric keys and offbeat drum hi-hats.",
    duration: "6:18"
  },
  {
    id: "cosmic-explorer",
    name: "Cosmic Sci-Fi Ambient",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    genre: "Sci-Fi Drone",
    emoji: "🪐",
    desc: "Suspenseful space exploration drones, echoing solar wind noise, and mysterious deep-space bells.",
    duration: "5:10"
  },
  {
    id: "acoustic-journey",
    name: "Coastal Breeze Acoustic",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    genre: "Acoustic Pop",
    emoji: "🎸",
    desc: "Upbeat organic acoustic guitars paired with warm piano harmonies and a positive rhythm.",
    duration: "7:03"
  },
  {
    id: "hacker-lounge",
    name: "Cyber Hacker Lounge",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    genre: "Chill Electronic",
    emoji: "💻",
    desc: "Cool futuristic digital soundscapes, liquid sub-bass drops, and steady mid-tempo electronic beats.",
    duration: "7:44"
  },
  {
    id: "epic-symphony",
    name: "Symphony of the Universe",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    genre: "Orchestral Epic",
    emoji: "🎻",
    desc: "A powerful dramatic rising orchestral track with soaring strings, woodwinds, and colossal brass accents.",
    duration: "6:50"
  },
  {
    id: "dreamwave-odyssey",
    name: "Dreamwave Analog Odyssey",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    genre: "Dreamwave Chill",
    emoji: "🕯️",
    desc: "Cozy analogue synthesizer swells, soft nostalgic vinyl dust noises, and slow breathing snare hits.",
    duration: "7:12"
  }
];

interface BatchItem {
  id: string;
  url: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  resultUrl?: string;
  slide?: ImageSlide;
}

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

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchGenerationMode, setBatchGenerationMode] = useState<"individual" | "sequence">("individual");

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
  const [originalVideoVolume, setOriginalVideoVolume] = useState<number>(0.5);
  const [audioBalance, setAudioBalance] = useState<number>(0.5); // 0.0 Soundtrack, 0.5 Equal, 1.0 Original Video
  const [masterVolume, setMasterVolume] = useState<number>(0.8);

  const soundtrackBalanceFactor = audioBalance < 0.5 ? 1.0 : (1.0 - audioBalance) * 2;
  const videoBalanceFactor = audioBalance > 0.5 ? 1.0 : audioBalance * 2;

  const [smartAutoMix, setSmartAutoMix] = useState<boolean>(false);
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState<boolean>(false);
  const [isVideoAudioActive, setIsVideoAudioActive] = useState<boolean>(false);
  const [duckingFactor, setDuckingFactor] = useState<number>(1.0);

  const videoSourcesRef = useRef<Map<HTMLVideoElement, any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [autoNormalize, setAutoNormalize] = useState<boolean>(false);
  const [normalizationGains, setNormalizationGains] = useState<Record<string, number>>({});
  const [isNormalizing, setIsNormalizing] = useState<boolean>(false);

  const analyzeAndNormalizeTrack = async (trackUrl: string, trackId: string) => {
    if (!trackUrl || normalizationGains[trackId] !== undefined) return;
    setIsNormalizing(true);
    try {
      const response = await fetch(trackUrl, { headers: { Range: "bytes=0-1000000" } }).catch(() => fetch(trackUrl));
      if (!response.ok) throw new Error("Network response was not OK");
      const arrayBuffer = await response.arrayBuffer();
      
      const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
      
      let sumOfSquares = 0;
      let sampleCount = 0;
      
      const channelData = decodedBuffer.getChannelData(0);
      const step = Math.max(1, Math.floor(channelData.length / 50000));
      for (let i = 0; i < channelData.length; i += step) {
        sumOfSquares += channelData[i] * channelData[i];
        sampleCount++;
      }
      
      const rms = Math.sqrt(sumOfSquares / sampleCount);
      const targetDb = -14;
      const targetRms = Math.pow(10, targetDb / 20);
      
      let gainMultiplier = targetRms / (rms || 0.0001);
      gainMultiplier = Math.max(0.3, Math.min(2.5, gainMultiplier));
      
      setNormalizationGains(prev => ({
        ...prev,
        [trackId]: gainMultiplier
      }));
    } catch (err) {
      console.warn("Audio normalization analysis failed, using fallback gain for:", trackId, err);
      const fallbackGains: Record<string, number> = {
        "lofi-study": 1.0,
        "acoustic-breeze": 0.85,
        "golden-hour-drive": 0.9,
        "cinematic-dreams": 1.1,
        "electric-flow": 0.75,
        "synthwave-80s": 0.8,
        "peaceful-meadow": 1.2,
        "midnight-groove": 0.85,
        "cosmic-explorer": 1.3,
        "acoustic-journey": 0.9,
        "hacker-lounge": 0.95,
        "epic-symphony": 0.7,
        "dreamwave-odyssey": 1.15
      };
      const fallback = fallbackGains[trackId] || 1.0;
      setNormalizationGains(prev => ({
        ...prev,
        [trackId]: fallback
      }));
    } finally {
      setIsNormalizing(false);
    }
  };

  useEffect(() => {
    if (autoNormalize) {
      if (audioTrackMode === "custom" && customAudioUrl) {
        analyzeAndNormalizeTrack(customAudioUrl, "custom");
      } else {
        const foundTrack = CURATED_MP3_LIBRARY.find(t => t.id === soundtrack);
        if (foundTrack) {
          analyzeAndNormalizeTrack(foundTrack.url, foundTrack.id);
        }
      }
    }
  }, [autoNormalize, soundtrack, customAudioUrl, audioTrackMode]);

  const currentTrackGain = autoNormalize ? (normalizationGains[audioTrackMode === "custom" ? "custom" : soundtrack] || 1.0) : 1.0;
  const effectiveSoundtrackVolume = audioVolume * soundtrackBalanceFactor * masterVolume * currentTrackGain * duckingFactor;
  const effectiveOriginalVideoVolume = originalVideoVolume * videoBalanceFactor * masterVolume;

  const [loopAudio, setLoopAudio] = useState<boolean>(true);

  const [audioFadeIn, setAudioFadeIn] = useState<boolean>(true);
  const [audioFadeOut, setAudioFadeOut] = useState<boolean>(true);
  const [transitionStyle, setTransitionStyle] = useState<"fade" | "slide-left" | "slide-right" | "zoom" | "flash" | "cross-zoom" | "curtain-wipe" | "blur-fade" | "glitch-wave" | "spiral-spin" | "pixelate-fade" | "radial-wipe" | "none">("fade");
  const [transitionDuration, setTransitionDuration] = useState<number>(0.6);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1.0);
  const [canvasGuideGrid, setCanvasGuideGrid] = useState<"none" | "thirds" | "safe-zone" | "all">("none");
  
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
  const [defaultSlideDuration, setDefaultSlideDuration] = useState<number>(3);
  const [previewMode, setPreviewMode] = useState<"canvas" | "slideshow">("canvas");
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isAudioDragging, setIsAudioDragging] = useState<boolean>(false);
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
  const [aiSceneImageSource, setAiSceneImageSource] = useState<"gemini" | "unsplash">("gemini");
  const [synthTempoFactor, setSynthTempoFactor] = useState<number>(1.0);
  const [synthFilterCutoff, setSynthFilterCutoff] = useState<number>(8000);
  const [synthDelayFeedback, setSynthDelayFeedback] = useState<number>(0.15);
  const [aiSceneDuration, setAiSceneDuration] = useState<number>(4);
  const [aiGenerationProgress, setAiGenerationProgress] = useState<number>(0);
  const [aiGenerationLogs, setAiGenerationLogs] = useState<string[]>([]);
  const [aiCurrentStage, setAiCurrentStage] = useState<string>("");
  const [aiEstTimeRemaining, setAiEstTimeRemaining] = useState<string>("Calculating...");
  const [aiElapsedTime, setAiElapsedTime] = useState<string>("0.0s");

  // Slide-specific Google Flow AI state variables
  const [isGeneratingFlowAi, setIsGeneratingFlowAi] = useState<boolean>(false);
  const [flowAiLogs, setFlowAiLogs] = useState<string[]>([]);
  const [flowAiProgress, setFlowAiProgress] = useState<number>(0);
  const [flowAiActiveStage, setFlowAiActiveStage] = useState<string>("");
  const [flowAiPromptText, setFlowAiPromptText] = useState<string>("");
  const [flowAiNegativePromptText, setFlowAiNegativePromptText] = useState<string>("");
  const [flowAiIntensityValue, setFlowAiIntensityValue] = useState<number>(1.0);
  const [flowAiFailures, setFlowAiFailures] = useState<Record<string, boolean>>({});

  // AI Subtitle Generator states
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(false);
  const [subtitleGenerationMode, setSubtitleGenerationMode] = useState<"prompt" | "audio" | "stt">("prompt");
  const [subtitleThemePrompt, setSubtitleThemePrompt] = useState<string>("");

  // New Speech-to-Text (STT) Auto-Captioning States
  const [sttIsListening, setSttIsListening] = useState<boolean>(false);
  const [sttTranscript, setSttTranscript] = useState<string>("");
  const [sttLanguage, setSttLanguage] = useState<string>("en-US");
  const [sttIndividualSlideId, setSttIndividualSlideId] = useState<string | null>(null);
  const sttRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const active = slides.find(s => s.id === selectedSlideId);
    if (active) {
      setFlowAiPromptText(active.flowAiPrompt || "");
      setFlowAiNegativePromptText(active.flowAiNegativePrompt || "");
      setFlowAiIntensityValue(active.flowAiIntensity ?? 1.0);
    } else {
      setFlowAiPromptText("");
      setFlowAiNegativePromptText("");
      setFlowAiIntensityValue(1.0);
    }
  }, [selectedSlideId, slides]);

  const handleIntensityChange = (val: number) => {
    setFlowAiIntensityValue(val);
    if (selectedSlide) {
      updateSlideProp(selectedSlide.id, "flowAiIntensity", val);
    }
  };

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
  const [exportResolution, setExportResolution] = useState<"720p" | "1080p" | "4K">("1080p");
  const [subtitleManualOffset, setSubtitleManualOffset] = useState<number>(0);
  const [subtitleVerticalAlign, setSubtitleVerticalAlign] = useState<"top" | "middle" | "bottom">("bottom");
  const [subtitleFontSizeFactor, setSubtitleFontSizeFactor] = useState<number>(1.0);
  const [subtitleTextColor, setSubtitleTextColor] = useState<string>("#ffffff");
  const [subtitleBgColor, setSubtitleBgColor] = useState<string>("#000000");
  const [subtitleBgOpacity, setSubtitleBgOpacity] = useState<number>(0.65);
  const [subtitleStrokeColor, setSubtitleStrokeColor] = useState<string>("#000000");
  const [subtitleStrokeWidth, setSubtitleStrokeWidth] = useState<number>(4);

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

  // AI Image Generator State Variables
  const [activeImageTab, setActiveImageTab] = useState<"presets" | "ai_create">("presets");
  const [aiImagePrompt, setAiImagePrompt] = useState<string>("");
  const [aiImageAspectRatio, setAiImageAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [aiImageStyle, setAiImageStyle] = useState<string>("none");
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [aiImageError, setAiImageError] = useState<string | null>(null);
  const [aiImageProgressStage, setAiImageProgressStage] = useState<string>("");

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

  const getVideoMetadata = () => {
    let descriptionParts = [
      `AI Video Generation Metadata`,
      `---------------------------`,
      `Export Resolution: ${exportResolution}`,
      `Export Format: ${exportFormat}`,
      `Aspect Ratio: ${aspectRatio}`,
      `Total Slides: ${slides.length}`,
      `Created Time: ${new Date().toISOString()}`,
      ``,
      `Storyboard Scenes:`
    ];

    slides.forEach((slide, idx) => {
      descriptionParts.push(`- Scene ${idx + 1} (${slide.name || "Untitled"}):`);
      descriptionParts.push(`  * Duration: ${slide.duration}s`);
      descriptionParts.push(`  * Caption: "${slide.text || "None"}"`);
      if (slide.cameraMovement) {
        descriptionParts.push(`  * Camera Movement: ${slide.cameraMovement}`);
      }
      if (slide.filter && slide.filter !== "normal") {
        descriptionParts.push(`  * Filter: ${slide.filter}`);
      }
      if (slide.flowAiPrompt) {
        descriptionParts.push(`  * Flow AI Prompt: "${slide.flowAiPrompt}"`);
      }
      if (slide.flowAiNegativePrompt) {
        descriptionParts.push(`  * Flow AI Negative Prompt: "${slide.flowAiNegativePrompt}"`);
      }
      if (slide.flowAiEffect && slide.flowAiEffect !== "none") {
        descriptionParts.push(`  * Flow AI Effect: ${slide.flowAiEffect}`);
      }
      if (slide.flowAiIntensity !== undefined) {
        descriptionParts.push(`  * Flow AI Intensity: ${slide.flowAiIntensity}x`);
      }
    });

    const fileDescription = descriptionParts.join("\n");

    const fileProperties: Record<string, string> = {
      resolution: exportResolution,
      format: exportFormat,
      aspectRatio: aspectRatio,
      slideCount: String(slides.length),
      hasFlowAi: slides.some(s => s.flowAiPrompt) ? "true" : "false"
    };

    return { description: fileDescription, properties: fileProperties };
  };

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
          const meta = getVideoMetadata();
          await uploadFileToDrive(
            accessToken,
            videoNameWithExtension,
            mimeType,
            base64DataUrl,
            undefined, // parentId
            meta.description,
            meta.properties
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

  // Smooth transition of ducking factor for Smart Auto-Mix
  useEffect(() => {
    if (!isPlaying) {
      setDuckingFactor(1.0);
      return;
    }
    let animId: number;
    const target = (smartAutoMix && (isSpeechSpeaking || isVideoAudioActive)) ? 0.25 : 1.0;
    
    const update = () => {
      setDuckingFactor(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * 0.15; // smooth interpolation step
      });
      animId = requestAnimationFrame(update);
    };
    
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [smartAutoMix, isSpeechSpeaking, isVideoAudioActive, isPlaying]);

  // Speech Synthesis resilient checking for active narration
  useEffect(() => {
    if (!isPlaying || !voiceoverEnabled) {
      setIsSpeechSpeaking(false);
      return;
    }
    
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setIsSpeechSpeaking(window.speechSynthesis.speaking);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, [isPlaying, voiceoverEnabled]);

  // Video track Web Audio speech & volume analyzer
  useEffect(() => {
    if (!isPlaying || !smartAutoMix) {
      setIsVideoAudioActive(false);
      return;
    }
    
    let cumulativeTime = 0;
    let activeIndex = 0;
    for (let i = 0; i < slides.length; i++) {
      if (currentTime >= cumulativeTime && currentTime < cumulativeTime + slides[i].duration) {
        activeIndex = i;
        break;
      }
      cumulativeTime += slides[i].duration;
    }
    
    const activeSlide = slides[activeIndex];
    if (!activeSlide) {
      setIsVideoAudioActive(false);
      return;
    }
    
    const video = imageCacheRef.current[activeSlide.id];
    if (!(video instanceof HTMLVideoElement) || video.paused || video.muted) {
      setIsVideoAudioActive(false);
      return;
    }
    
    let active = true;
    let checkVolumeTimer: any;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
      const analyser = analyserRef.current;
      
      // Connect the video if not already connected
      let source = videoSourcesRef.current.get(video);
      if (!source) {
        source = ctx.createMediaElementSource(video);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        videoSourcesRef.current.set(video, source);
      }
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkVolume = () => {
        if (!active) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Human speech is concentrated in the 85Hz - 1000Hz range.
        // Speech frequencies fall into bins 1-6.
        let sum = 0;
        let count = 0;
        for (let i = 1; i < Math.min(8, bufferLength); i++) {
          sum += dataArray[i];
          count++;
        }
        const avgSpeechVolume = count > 0 ? sum / count : 0;
        
        // Active human speech/audio is generally above a low threshold
        setIsVideoAudioActive(avgSpeechVolume > 15);
        
        if (isPlaying && !video.paused) {
          checkVolumeTimer = requestAnimationFrame(checkVolume);
        } else {
          setIsVideoAudioActive(false);
        }
      };
      
      checkVolume();
    } catch (err) {
      console.warn("Web Audio API not supported or video node connection failed:", err);
      setIsVideoAudioActive(originalVideoVolume > 0.1);
    }
    
    return () => {
      active = false;
      if (checkVolumeTimer) cancelAnimationFrame(checkVolumeTimer);
      setIsVideoAudioActive(false);
    };
  }, [isPlaying, currentTime, smartAutoMix, slides, originalVideoVolume]);

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
        synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, customAudioUrl, currentTimeRef.current, audioTrimStart, audioTrimEnd, loopAudio);
      } else if (audioTrackMode === "sfx" && selectedSfxId) {
        synthManagerRef.current.start("none");
        synthManagerRef.current.playSingleSfx(selectedSfxId, effectiveSoundtrackVolume);
      } else {
        synthManagerRef.current.start(soundtrack, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
      }
    } else {
      synthManagerRef.current.stop();
    }
  }, [isPlaying, soundtrack, audioTrackMode, selectedSfxId, customAudioUrl, isMuted, audioFadeIn, audioFadeOut, totalDuration, audioTrimStart, audioTrimEnd, effectiveSoundtrackVolume, loopAudio]);

  // Synchronize custom audio timeline scrubbing when paused
  useEffect(() => {
    if (!isPlaying && audioTrackMode === "custom") {
      synthManagerRef.current.seek(currentTime);
    }
  }, [currentTime, isPlaying, audioTrackMode]);

  // Synchronize real-time synth and playback parameter modifications
  useEffect(() => {
    if (synthManagerRef.current) {
      synthManagerRef.current.setTempoFactor(synthTempoFactor);
      synthManagerRef.current.setFilterCutoff(synthFilterCutoff);
      synthManagerRef.current.setDelayFeedback(synthDelayFeedback);
    }
  }, [synthTempoFactor, synthFilterCutoff, synthDelayFeedback]);

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
        synthManagerRef.current.playSingleSfx(slide.sfx, effectiveSoundtrackVolume);
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
  }, [currentTime, isPlaying, slides, isMuted, effectiveSoundtrackVolume, voiceoverVolume, voiceoverEnabled, voiceoverGender]);

  // Dynamic live volume adjustments during playback
  useEffect(() => {
    synthManagerRef.current.setVolume(effectiveSoundtrackVolume);
  }, [effectiveSoundtrackVolume]);

  // Sync video elements audio & playback
  useEffect(() => {
    let cumulativeTime = 0;
    slides.forEach((slide) => {
      const img = imageCacheRef.current[slide.id];
      if (img instanceof HTMLVideoElement) {
        if (isPlaying) {
          const isCurrent = currentTime >= cumulativeTime && currentTime < cumulativeTime + slide.duration;
          if (isCurrent) {
            const relativeTime = currentTime - cumulativeTime;
            // Seek if there is a drift
            if (Math.abs(img.currentTime - relativeTime) > 0.15) {
              img.currentTime = relativeTime;
            }
            img.muted = isMuted;
            img.volume = Math.min(1.0, Math.max(0, effectiveOriginalVideoVolume));
            if (img.paused) {
              img.play().catch(() => {});
            }
          } else {
            img.pause();
          }
        } else {
          img.pause();
          const relativeTime = currentTime >= cumulativeTime && currentTime < cumulativeTime + slide.duration
            ? currentTime - cumulativeTime
            : 0;
          if (Math.abs(img.currentTime - relativeTime) > 0.15) {
            img.currentTime = relativeTime;
          }
        }
      }
      cumulativeTime += slide.duration;
    });
  }, [isPlaying, currentTime, isMuted, slides, effectiveOriginalVideoVolume]);

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
          synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, customAudioUrl, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
        } else if (audioTrackMode === "sfx" && selectedSfxId) {
          synthManagerRef.current.start("none");
          synthManagerRef.current.playSingleSfx(selectedSfxId, effectiveSoundtrackVolume);
        } else {
          synthManagerRef.current.start(soundtrack, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
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

  const stepBackward = () => {
    setCurrentTime((prev) => Math.max(0, prev - 0.1));
    triggerBeepChime();
  };

  const stepForward = () => {
    setCurrentTime((prev) => Math.min(totalDuration, prev + 0.1));
    triggerBeepChime();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentTime((prev) => Math.max(0, prev - 0.5));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setCurrentTime((prev) => Math.min(totalDuration, prev + 0.5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, totalDuration]);

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
      duration: defaultSlideDuration,
      text: preset.text,
      textAnimation: "typewriter",
      filter: "normal",
      scaleStart: 1.0,
      scaleEnd: 1.15,
      promptDuration: defaultSlideDuration,
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

  const handleGenerateAiImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingAiImage(true);
    setAiImageError(null);
    setAiImageProgressStage("Connecting to Google Gemini Cloud...");
    triggerBeepChime();

    // Stage updates
    const stages = [
      "Contacting Gemini Imagen Server...",
      "Analyzing and enhancing prompt structures...",
      "Configuring aspect ratio and aesthetic dimensions...",
      "Running diffusion noise loops (Step 1/4)...",
      "Refining high-res pixel parameters (Step 2/4)...",
      "Harmonizing lighting and shadows (Step 3/4)...",
      "Polishing final color gradient masks (Step 4/4)...",
      "Converting raw tensors to high-fidelity PNG stream..."
    ];

    let currentStageIndex = 0;
    const stageTimer = setInterval(() => {
      if (currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        setAiImageProgressStage(stages[currentStageIndex]);
      }
    }, 1200);

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: aiImagePrompt,
          aspectRatio: aiImageAspectRatio,
          style: aiImageStyle
        })
      });

      clearInterval(stageTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Image generation timed out. Please try again." }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setToastMessage({
          text: "✨ Image Created successfully!",
          sub: "Your custom AI creation is ready. Add it to your timeline!",
          success: true
        });
      } else {
        throw new Error("No image data returned from the server.");
      }
    } catch (err: any) {
      clearInterval(stageTimer);
      console.error("AI Image Generation Error:", err);
      setAiImageError(err.message || "An unexpected error occurred during generation.");
      setToastMessage({
        text: "❌ Image Generation Failed",
        sub: err.message || "An unexpected error occurred during generation.",
        success: false
      });
    } finally {
      setIsGeneratingAiImage(false);
      setAiImageProgressStage("");
    }
  };

  const handleAddGeneratedImageToTimeline = () => {
    if (!generatedImageUrl) return;

    const styleNameMap: Record<string, string> = {
      none: "Raw Prompt",
      cinematic: "Cinematic",
      anime: "Anime style",
      oil_painting: "Oil Painting style",
      sketch: "Graphite Sketch style",
      render_3d: "3D Octane Render",
      retro_vhs: "Retro VHS look"
    };

    const styleName = styleNameMap[aiImageStyle] || "Custom style";

    const slide: ImageSlide = {
      id: `generated-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: generatedImageUrl,
      name: `Gemini AI Image - ${styleName}.png`,
      duration: defaultSlideDuration,
      text: aiImagePrompt.substring(0, 30) + (aiImagePrompt.length > 30 ? "..." : ""),
      textAnimation: "typewriter",
      filter: "normal",
      scaleStart: 1.0,
      scaleEnd: 1.15,
      promptDuration: defaultSlideDuration,
      cameraMovement: "Slow Zoom",
      subjectDescription: aiImagePrompt,
      style: "Cinematic",
      sfx: "none"
    };

    // Cache the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = generatedImageUrl;
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
      text: "📸 AI Image added to Timeline!",
      sub: replaceOnUpload
        ? `Timeline replaced with generated frame. Click 'Create Video Now' to export!`
        : `Appended generated AI image to the end of the timeline.`,
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
      if (file.type.startsWith("video/")) {
        const urlStr = URL.createObjectURL(file);
        const slide: ImageSlide = {
          id: `uploaded-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          url: urlStr,
          name: file.name,
          duration: defaultSlideDuration,
          text: file.name.replace(/\.[^/.]+$/, "").substring(0, 24),
          textAnimation: "typewriter",
          filter: "normal",
          scaleStart: 1.0,
          scaleEnd: 1.05,
          promptDuration: defaultSlideDuration,
          cameraMovement: "None",
          subjectDescription: "",
          style: "Cinematic",
          isVideo: true
        };
        uploadedSlides.push(slide);

        // Preload/cache the video element instantly
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = urlStr;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        video.onloadeddata = () => {
          imageCacheRef.current[slide.id] = video as any;
        };
        video.load();

        loadedCount++;
        if (loadedCount === filesArray.length) {
          applyUploadedSlides(uploadedSlides);
        }
        return;
      }

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
            duration: defaultSlideDuration,
            text: file.name.replace(/\.[^/.]+$/, "").substring(0, 24),
            textAnimation: "typewriter",
            filter: "normal",
            scaleStart: 1.0,
            scaleEnd: 1.15,
            promptDuration: defaultSlideDuration,
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

  // Duplicate slide
  const duplicateSlide = (id: string) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const slideToDup = prev[idx];
      const duplicated: ImageSlide = {
        ...slideToDup,
        id: `dup-${slideToDup.id}-${Date.now()}`,
        name: slideToDup.name.includes(" (Copy)") ? slideToDup.name : `${slideToDup.name} (Copy)`
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
    triggerBeepChime();
    setToastMessage({
      text: "👯 Slide Duplicated",
      sub: "Cloned slide and inserted it in the timeline track.",
      success: true
    });
  };

  // Split slide at playhead
  const splitSlideAtPlayhead = () => {
    let cumulativeTime = 0;
    let targetIndex = -1;
    for (let i = 0; i < slides.length; i++) {
      if (currentTime >= cumulativeTime && currentTime < cumulativeTime + slides[i].duration) {
        targetIndex = i;
        break;
      }
      cumulativeTime += slides[i].duration;
    }

    if (targetIndex === -1) {
      setToastMessage({
        text: "⚠️ Split Failed",
        sub: "The playhead must be positioned over a slide to split.",
        success: false
      });
      return;
    }

    const slideToSplit = slides[targetIndex];
    const localTime = currentTime - cumulativeTime;

    if (localTime < 0.2 || localTime > slideToSplit.duration - 0.2) {
      setToastMessage({
        text: "⚠️ Split Failed",
        sub: "Cannot split too close to the beginning or end of a clip.",
        success: false
      });
      return;
    }

    const firstHalf: ImageSlide = {
      ...slideToSplit,
      duration: parseFloat(localTime.toFixed(2)),
    };

    const secondHalf: ImageSlide = {
      ...slideToSplit,
      id: `split-${slideToSplit.id}-${Date.now()}`,
      name: `${slideToSplit.name} (Part 2)`,
      duration: parseFloat((slideToSplit.duration - localTime).toFixed(2)),
    };

    setSlides((prev) => {
      const copy = [...prev];
      copy.splice(targetIndex, 1, firstHalf, secondHalf);
      return copy;
    });

    triggerBeepChime();
    setToastMessage({
      text: "✂️ Clip Split Successfully",
      sub: `Split clip into two parts at ${currentTime.toFixed(1)}s.`,
      success: true
    });
  };

  // Update slide property
  const updateSlideProp = (id: string, prop: keyof ImageSlide, value: any) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [prop]: value } : s))
    );
  };

  const updateSlideMultipleProps = (id: string, props: Partial<ImageSlide>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...props } : s))
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
        let imageUrl = "";
        if (aiSceneImageSource === "gemini") {
          try {
            let imgStyle = "none";
            if (aiStylePreset === "cinematic") imgStyle = "cinematic";
            else if (aiStylePreset === "anime") imgStyle = "anime";
            else if (aiStylePreset === "vhs") imgStyle = "retro_vhs";
            else if (aiStylePreset === "realistic-3d") imgStyle = "render_3d";

            const imgResponse = await fetch("/api/image/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: currentLinePrompt,
                aspectRatio: "16:9",
                style: imgStyle
              })
            });

            if (imgResponse.ok) {
              const imgData = await imgResponse.json();
              imageUrl = imgData.imageUrl;
            } else {
              throw new Error("AI Image Generation model error");
            }
          } catch (imgErr) {
            console.warn("Imagen generation failed in script, falling back to Unsplash stock:", imgErr);
            const unsplashKeywords = data.keywords || "nature";
            imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}-${i}`;
          }
        } else {
          const unsplashKeywords = data.keywords || "nature";
          imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}-${i}`;
        }
        
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
      duration: aiSceneDuration,
      text: titleSlideText,
      textAnimation: "none", // Since text is drawn inside the center, we don't double draw the caption
      filter: "normal",
      scaleStart: 1.0,
      scaleEnd: intensityScale, // Centered zoom works perfectly
      promptDuration: aiSceneDuration,
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

      let imageUrl = "";
      if (aiSceneImageSource === "gemini") {
        appendLog(`[3/5] Querying Gemini Imagen 3 engine for a custom high-fidelity image canvas...`, 60);
        try {
          let imgStyle = "none";
          if (aiStylePreset === "cinematic") imgStyle = "cinematic";
          else if (aiStylePreset === "anime") imgStyle = "anime";
          else if (aiStylePreset === "vhs") imgStyle = "retro_vhs";
          else if (aiStylePreset === "realistic-3d") imgStyle = "render_3d";

          const imgResponse = await fetch("/api/image/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: userPromptText,
              aspectRatio: "16:9",
              style: imgStyle
            })
          });

          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            imageUrl = imgData.imageUrl;
            appendLog(`[3/5] Success! Authentic custom AI canvas generated at 16:9 widescreen.`, 75);
          } else {
            throw new Error("AI Image Generation model error");
          }
        } catch (imgErr) {
          console.warn("Imagen generation failed, falling back to Unsplash stock:", imgErr);
          appendLog(`[3/5] ⚠️ Gemini Imagen busy. Seamlessly falling back to high-res Unsplash stock library...`, 65);
          const unsplashKeywords = data.keywords || "nature,beautiful";
          imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}`;
        }
      } else {
        const unsplashKeywords = data.keywords || "nature,beautiful";
        imageUrl = `https://images.unsplash.com/featured/800x450/?${encodeURIComponent(unsplashKeywords)}&sig=${Date.now()}`;
        appendLog(`[3/5] Selected stock scene geometry from Unsplash: "${unsplashKeywords}"`, 75);
      }

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
        duration: aiSceneDuration,
        text: data.caption || userPromptText.substring(0, 30),
        textAnimation: "typewriter",
        filter: aiStylePreset === "auto" ? (data.filter || "normal") : (aiStylePreset === "cinematic" ? "cinematic-warm" : aiStylePreset as any),
        scaleStart: scaleStartValue,
        scaleEnd: scaleEndValue,
        promptDuration: aiSceneDuration,
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

  const handleRunFlowAiForSlide = async () => {
    if (!selectedSlide) {
      setToastMessage({
        text: "Please select a slide",
        sub: "Select an image frame from the timeline first.",
        success: false
      });
      return;
    }

    if (!flowAiPromptText.trim()) {
      setToastMessage({
        text: "Please describe the motion",
        sub: "Type a prompt like 'lightning flash' or 'glowing electric sparks' to guide Flow AI.",
        success: false
      });
      return;
    }

    setFlowAiFailures((prev) => ({ ...prev, [selectedSlide.id]: false }));
    setIsGeneratingFlowAi(true);
    setFlowAiProgress(10);
    setFlowAiActiveStage("Initializing Pipeline");
    setFlowAiLogs(["[0/5] Booting Google Flow AI Neural Video pipeline workspace..."]);

    const appendFlowLog = (msg: string, progress: number, stage: string) => {
      setFlowAiProgress(progress);
      setFlowAiActiveStage(stage);
      setFlowAiLogs((prev) => [...prev, msg]);
    };

    try {
      // Step 1: Parsing prompt & vectorizing frame boundaries
      await new Promise((r) => setTimeout(r, 800));
      appendFlowLog("[1/5] Vectorizing frame composition boundaries & contrast points...", 25, "Analyzing image layout");

      // Step 2: Running text-to-motion prompt parsing
      await new Promise((r) => setTimeout(r, 900));
      appendFlowLog(`[2/5] Running Google Flow text-to-motion parser on prompt: "${flowAiPromptText.substring(0, 45)}..."`, 45, "Parsing motion prompts");

      // We call the API endpoint /api/video/generate-scene to analyze the prompt!
      const response = await fetch("/api/video/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: flowAiPromptText })
      });

      let promptKeywords = "";
      if (response.ok) {
        const data = await response.json();
        promptKeywords = (data.keywords || "").toLowerCase();
      }

      // Step 3: Determining the matching visual effect shader
      await new Promise((r) => setTimeout(r, 800));
      appendFlowLog("[3/5] Synthesizing volumetric fluid simulation maps...", 65, "Fluid mapping");

      // Smart semantic mapping
      const combinedSearch = (flowAiPromptText.toLowerCase() + " " + promptKeywords).trim();
      let matchedEffect: "lightning" | "sparks" | "fire-embers" | "glitch-cyber" = "sparks"; // Default is gorgeous sparks
      
      if (combinedSearch.includes("lightning") || combinedSearch.includes("thunder") || combinedSearch.includes("storm") || combinedSearch.includes("flash") || combinedSearch.includes("strobe")) {
        matchedEffect = "lightning";
      } else if (combinedSearch.includes("spark") || combinedSearch.includes("electric") || combinedSearch.includes("arc") || combinedSearch.includes("energy") || combinedSearch.includes("neon") || combinedSearch.includes("flow")) {
        matchedEffect = "sparks";
      } else if (combinedSearch.includes("fire") || combinedSearch.includes("ember") || combinedSearch.includes("flame") || combinedSearch.includes("burn") || combinedSearch.includes("smoke") || combinedSearch.includes("warm")) {
        matchedEffect = "fire-embers";
      } else if (combinedSearch.includes("glitch") || combinedSearch.includes("cyber") || combinedSearch.includes("tech") || combinedSearch.includes("hologram") || combinedSearch.includes("matrix") || combinedSearch.includes("digital")) {
        matchedEffect = "glitch-cyber";
      }

      // Step 4: Compiling shader arrays & rendering particles
      await new Promise((r) => setTimeout(r, 900));
      appendFlowLog(`[4/5] Compiling custom particle physics shader array: [Effect: ${matchedEffect.toUpperCase()}]...`, 85, "Compiling visual particles");

      // Step 5: Encoding 60 FPS visual stream to project timeline
      await new Promise((r) => setTimeout(r, 700));
      appendFlowLog("[5/5] Encoding 60 FPS visual simulation layer directly onto slide timeline. Generation complete!", 100, "Encoding flow vectors");
      await new Promise((r) => setTimeout(r, 400));

      // If user prompt mentions lightning or electric, we can also auto-assign beat-sync or soundtrack for extra polish!
      if (matchedEffect === "lightning" || matchedEffect === "sparks") {
        updateSlideProp(selectedSlide.id, "sfx", "cinema-impact");
      }

      // Update slide props
      updateSlideProp(selectedSlide.id, "flowAiEffect", matchedEffect);
      updateSlideProp(selectedSlide.id, "flowAiPrompt", flowAiPromptText);
      updateSlideProp(selectedSlide.id, "flowAiNegativePrompt", flowAiNegativePromptText);
      updateSlideProp(selectedSlide.id, "flowAiIntensity", flowAiIntensityValue);

      setFlowAiFailures((prev) => ({ ...prev, [selectedSlide.id]: false }));

      setToastMessage({
        text: "⚡ Google Flow AI Motion Generated!",
        sub: `Successfully generated ${matchedEffect.toUpperCase()} video animation for this image!`,
        success: true
      });
      triggerBeepChime();

    } catch (err: any) {
      console.error(err);
      if (selectedSlide) {
        setFlowAiFailures((prev) => ({ ...prev, [selectedSlide.id]: true }));
      }
      setToastMessage({
        text: "Flow AI motion failed",
        sub: err.message || "An unexpected pipeline error occurred.",
        success: false
      });
    } finally {
      setIsGeneratingFlowAi(false);
    }
  };

  // Helper functions for Speech-to-Text (STT) Auto-Captioning
  const startStt = (slideId: string | null = null) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMessage({
        text: "Speech-to-Text Unsupported",
        sub: "Your browser does not support standard Speech Recognition. Try Google Chrome.",
        success: false
      });
      return;
    }

    // Stop existing if any
    if (sttRecognitionRef.current) {
      try {
        sttRecognitionRef.current.stop();
      } catch (e) {}
    }

    setSttIndividualSlideId(slideId);
    setSttIsListening(true);
    setSttTranscript("");

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = sttLanguage;

    rec.onstart = () => {
      triggerBeepChime();
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const currentText = final || interim;
      setSttTranscript(currentText);

      if (slideId) {
        setSlides(prev => prev.map(s => s.id === slideId ? { ...s, text: currentText } : s));
      }
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      if (e.error !== "no-speech") {
        setToastMessage({
          text: "Speech Recognition Error",
          sub: `An error occurred: ${e.error}. Check browser microphone permissions.`,
          success: false
        });
      }
      setSttIsListening(false);
    };

    rec.onend = () => {
      setSttIsListening(false);
    };

    sttRecognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  };

  const stopStt = () => {
    if (sttRecognitionRef.current) {
      try {
        sttRecognitionRef.current.stop();
      } catch (e) {}
    }
    setSttIsListening(false);
  };

  const handleGenerateSubtitles = async () => {
    if (slides.length === 0) {
      setToastMessage({
        text: "No slides in timeline",
        sub: "Please add at least one image or scene to the timeline first.",
        success: false
      });
      return;
    }

    setIsGeneratingSubtitles(true);
    triggerBeepChime();

    try {
      // Find the visual contexts of each slide
      const slideContexts = slides.map((slide, idx) => {
        return `Slide #${idx + 1}: name="${slide.name || ""}", current_caption="${slide.text || ""}", visual_prompt="${slide.subjectDescription || ""}"`;
      });

      // Get information about selected soundtrack
      let selectedTrackName = "Custom Track";
      let selectedTrackGenre = "Ambient";
      let selectedTrackDesc = "Atmospheric background score";

      if (audioTrackMode === "synth") {
        const found = SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack);
        if (found) {
          selectedTrackName = found.name;
          selectedTrackGenre = found.genre;
          selectedTrackDesc = found.desc;
        }
      } else if (audioTrackMode === "custom") {
        selectedTrackName = customAudioName || "Custom Soundtrack Upload";
        selectedTrackGenre = "User Uploaded";
        selectedTrackDesc = "Custom background music track";
      }

      const activePrompt = subtitleThemePrompt.trim() || userPromptText.trim() || "A beautiful scenic slideshow journey";

      const response = await fetch("/api/video/generate-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: subtitleGenerationMode,
          prompt: activePrompt,
          audioName: selectedTrackName,
          audioGenre: selectedTrackGenre,
          audioDescription: selectedTrackDesc,
          numSlides: slides.length,
          slideContexts
        })
      });

      if (!response.ok) {
        throw new Error("Subtitle generation failed from AI");
      }

      const data = await response.json();
      
      if (data.subtitles && Array.isArray(data.subtitles)) {
        setSlides(prev => prev.map((slide, idx) => ({
          ...slide,
          text: data.subtitles[idx] || slide.text
        })));

        setToastMessage({
          text: "✨ AI Subtitles Generated!",
          sub: `Successfully generated ${data.subtitles.length} thematic slide captions matching your video flow!`,
          success: true
        });
        triggerBeepChime();
      } else {
        throw new Error("Invalid subtitles format received");
      }

    } catch (err: any) {
      console.error("Failed to generate subtitles:", err);
      setToastMessage({
        text: "Subtitle generation failed",
        sub: err.message || "Something went wrong. Please check your connection.",
        success: false
      });
    } finally {
      setIsGeneratingSubtitles(false);
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

    // Use slide's individual transition if set, otherwise fallback to global transitionStyle
    const getActiveTransitionStyle = (targetSlide: ImageSlide): string => {
      const effect = targetSlide.transitionEffect;
      if (!effect || effect === "Inherit") return transitionStyle;
      
      const lower = effect.toLowerCase();
      if (lower === "fade" || lower === "cross-dissolve") return "fade";
      if (lower === "slide" || lower === "slide-left") return "slide-left";
      if (lower === "slide-right") return "slide-right";
      if (lower === "zoom" || lower === "camera zoom transition") return "zoom";
      if (lower === "blur" || lower === "blur-fade" || lower === "dreamy blur fade") return "blur-fade";
      if (lower === "wipe" || lower === "curtain-wipe" || lower === "sliding curtain wipe") return "curtain-wipe";
      if (lower === "flash") return "flash";
      if (lower === "glitch" || lower === "glitch-wave") return "glitch-wave";
      if (lower === "spiral-spin" || lower === "spiral") return "spiral-spin";
      if (lower === "pixelate-fade" || lower === "pixelate") return "pixelate-fade";
      if (lower === "radial-wipe" || lower === "radial") return "radial-wipe";
      if (lower === "none") return "none";
      return transitionStyle;
    };

    const activeTransStyle = currentSlideIndex > 0 ? getActiveTransitionStyle(slide) : "none";

    // Check if we are inside a transition boundary
    // Transition happens in the first `transitionDuration` seconds of Slide N
    const isTransitioning = currentSlideIndex > 0 && slideLocalTime < transitionDuration && activeTransStyle !== "none";
    
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
        } else if (targetSlide.filter === "glitch-synth") {
          activeFilter = "contrast(135%) saturate(220%) hue-rotate(90deg) brightness(110%)";
        } else if (targetSlide.filter === "dreamy-pastel") {
          activeFilter = "brightness(118%) saturate(80%) contrast(92%) sepia(12%)";
        } else if (targetSlide.filter === "matrix-code") {
          activeFilter = "hue-rotate(65deg) saturate(160%) contrast(125%) brightness(88%)";
        } else if (targetSlide.filter === "grayscale") {
          activeFilter = "grayscale(100%)";
        } else if (targetSlide.filter === "sepia") {
          activeFilter = "sepia(100%)";
        } else if (targetSlide.filter === "high-contrast") {
          activeFilter = "contrast(150%) brightness(105%)";
        }
      }
      ctx.filter = activeFilter;

      // Slide Transitions Positioning
      let slideX = 0;
      let slideY = 0;
      if (isTransitioning) {
        if (activeTransStyle === "slide-left") {
          // Slide in from right (offsetProgress is progress, 0 means previous slide, 1 means current slide)
          // current slide slides from width to 0, previous slides from 0 to -width
          if (targetSlide.id === slide.id) {
            slideX = width * (1 - offsetProgress);
          } else {
            slideX = -width * offsetProgress;
          }
        } else if (activeTransStyle === "slide-right") {
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
        // Draw Image/Video cropped to fill / fit the aspect ratio with dynamic scale
        const isVid = img instanceof HTMLVideoElement;
        const intrinsicWidth = isVid ? (img as HTMLVideoElement).videoWidth || 640 : img.width || 640;
        const intrinsicHeight = isVid ? (img as HTMLVideoElement).videoHeight || 360 : img.height || 360;
        
        const imgRatio = intrinsicWidth / intrinsicHeight;
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

      if (activeTransStyle === "fade") {
        // Double rendering blend
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
      } 
      else if (activeTransStyle === "slide-left" || activeTransStyle === "slide-right") {
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0, transProgress);
        drawSlideWithTransformAndFilter(slide, slideProgress, 1.0, transProgress);
      } 
      else if (activeTransStyle === "zoom") {
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
      else if (activeTransStyle === "flash") {
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
      else if (activeTransStyle === "cross-zoom") {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        const prevZoom = 1.0 + transProgress * 0.5;
        ctx.scale(prevZoom, prevZoom);
        ctx.translate(-width / 2, -height / 2);
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        ctx.restore();

        ctx.save();
        ctx.translate(width / 2, height / 2);
        const nextZoom = 0.5 + transProgress * 0.5;
        ctx.scale(nextZoom, nextZoom);
        ctx.translate(-width / 2, -height / 2);
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
        ctx.restore();
      }
      else if (activeTransStyle === "curtain-wipe") {
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0);

        ctx.save();
        ctx.beginPath();
        const curtainWidth = width * transProgress;
        ctx.rect((width - curtainWidth) / 2, 0, curtainWidth, height);
        ctx.clip();
        drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
        ctx.restore();
      }
      else if (activeTransStyle === "blur-fade") {
        ctx.save();
        const oldBlur = transProgress * 15;
        ctx.filter = `blur(${oldBlur}px)`;
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        ctx.restore();

        ctx.save();
        const newBlur = (1 - transProgress) * 15;
        ctx.filter = `blur(${newBlur}px)`;
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
        ctx.restore();
      }
      else if (activeTransStyle === "glitch-wave") {
        ctx.save();
        if (transProgress < 0.5) {
          const shift = Math.sin(transProgress * 40) * 15;
          ctx.translate(shift, 0);
          drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        } else {
          const shift = Math.cos(transProgress * 40) * 15;
          ctx.translate(shift, 0);
          drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
        }
        ctx.restore();
        
        ctx.save();
        ctx.fillStyle = `rgba(244, 63, 94, ${0.15 * Math.sin(transProgress * Math.PI)})`;
        ctx.fillRect(0, (transProgress * height) % height, width, 12);
        ctx.fillStyle = `rgba(6, 182, 212, ${0.15 * Math.cos(transProgress * Math.PI)})`;
        ctx.fillRect(0, ((1 - transProgress) * height) % height, width, 8);
        ctx.restore();
      }
      else if (activeTransStyle === "spiral-spin") {
        // Draw previous slide spinning and scaling up
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(transProgress * Math.PI * 1.5);
        const spinScalePrev = 1.0 + transProgress * 0.8;
        ctx.scale(spinScalePrev, spinScalePrev);
        ctx.translate(-width / 2, -height / 2);
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1 - transProgress);
        ctx.restore();

        // Draw current slide spinning in from small scale
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((1 - transProgress) * -Math.PI * 1.5);
        const spinScaleCur = 0.2 + transProgress * 0.8;
        ctx.scale(spinScaleCur, spinScaleCur);
        ctx.translate(-width / 2, -height / 2);
        drawSlideWithTransformAndFilter(slide, slideProgress, transProgress);
        ctx.restore();
      }
      else if (activeTransStyle === "pixelate-fade") {
        // Render previous slide
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0);

        // Overlay current slide revealed via a retro digital grid blocks transition
        ctx.save();
        const cols = 24;
        const rows = Math.round(cols * (height / width));
        const cellW = width / cols;
        const cellH = height / rows;

        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            // Seeded diagonal wave random formula
            const threshold = (c + r) / (cols + rows);
            const cellRand = (Math.sin(c * 12.9 + r * 78.2) + 1) / 2;
            const blockProgress = transProgress * 1.4;

            if (blockProgress > threshold * 0.7 + cellRand * 0.3) {
              ctx.rect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            }
          }
        }
        ctx.clip();
        drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
        ctx.restore();
      }
      else if (activeTransStyle === "radial-wipe") {
        drawSlideWithTransformAndFilter(prevSlide, 1.0, 1.0);

        ctx.save();
        ctx.beginPath();
        const maxRadius = Math.sqrt(width * width + height * height) / 2;
        const currentRadius = maxRadius * transProgress;
        ctx.arc(width / 2, height / 2, currentRadius, 0, Math.PI * 2);
        ctx.clip();
        drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
        ctx.restore();
      }
    } else {
      // Standard static slide display
      drawSlideWithTransformAndFilter(slide, slideProgress, 1.0);
    }

    // DRAW GOOGLE FLOW AI PROCEDURAL MOTION EFFECTS
    if (slide && slide.flowAiEffect && slide.flowAiEffect !== "none") {
      ctx.save();
      const effect = slide.flowAiEffect;
      const intensity = slide.flowAiIntensity ?? 1.0;

      if (effect === "lightning") {
        // High-Fidelity procedural lightning strike engine with motion intensity scaling
        // Deterministic timing of strikes based on playback time & intensity
        const pulseTime = time * 2.5 * (0.6 + intensity * 0.4);
        const strikeIndex = Math.floor(pulseTime);
        const strikeOffset = pulseTime - strikeIndex; // 0.0 to 1.0 within this cycle

        // A strike starts with a high-intensity flash, then a secondary discharge, then fades
        if (strikeOffset < 0.35 && strikeIndex % 2 === 0) {
          // 1. Draw lightning bolts
          ctx.shadowBlur = 30 * intensity;
          ctx.shadowColor = "#38bdf8"; // cyan-blue energy
          ctx.lineWidth = Math.max(1.5, 3.5 * (width / 800) * intensity);
          ctx.strokeStyle = "#ffffff";
          ctx.lineCap = "round";

          // Seeded random-like generation using deterministic trig functions
          const baseBoltCount = 1 + (strikeIndex % 2);
          const boltCount = Math.max(1, Math.round(baseBoltCount * intensity));
          for (let b = 0; b < boltCount; b++) {
            ctx.beginPath();
            let startX = (0.2 + 0.6 * ((Math.sin(strikeIndex * 4.7 + b * 2.3) + 1) / 2)) * width;
            let startY = 0;
            ctx.moveTo(startX, startY);

            const segments = 12;
            let curX = startX;
            let curY = startY;
            const segmentH = height / segments;

            for (let s = 1; s <= segments; s++) {
              const drift = Math.sin(s * 1.5 + strikeIndex * 5.9 + b * 1.7) * 35 * (width / 800) * (0.5 + intensity * 0.5);
              curX += drift;
              curY = s * segmentH;
              ctx.lineTo(curX, curY);

              // Create brief fork branches
              if (s === 5 && strikeIndex % 4 === 0) {
                ctx.save();
                ctx.lineWidth = ctx.lineWidth * 0.5;
                ctx.beginPath();
                ctx.moveTo(curX, curY);
                ctx.lineTo(curX + 60 * Math.cos(strikeIndex) * intensity, curY + segmentH * 2);
                ctx.stroke();
                ctx.restore();
              }
            }
            ctx.stroke();
          }

          // 2. Draw screen strobe flash overlay
          const flashAlpha = (strikeOffset < 0.12 ? 0.65 : (1 - (strikeOffset / 0.35)) * 0.45) * Math.min(1.0, intensity);
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
        }
      }
      else if (effect === "sparks") {
        // Glowing neon-blue/cyan electrical arcs spinning and pulsing around the central frame
        ctx.save();
        ctx.shadowBlur = 20 * intensity;
        ctx.shadowColor = "#00f0ff"; // Intense electric cyan
        ctx.strokeStyle = `rgba(0, 240, 255, ${Math.min(1.0, 0.55 + intensity * 0.3)})`;
        ctx.lineWidth = Math.max(1.5, 4 * (width / 800) * intensity);
        ctx.lineCap = "round";

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.28;

        // Draw electrical spinning arcs scaling with motion intensity
        const arcCount = Math.max(1, Math.round(3 * intensity));
        for (let a = 0; a < arcCount; a++) {
          const baseAngle = time * (1.5 + a * 0.5) * (0.5 + intensity * 0.5) + (a * Math.PI * 2) / arcCount;
          ctx.beginPath();
          
          const segments = 24;
          const arcLength = Math.PI * 0.6; // ~110 degrees arcs
          
          for (let s = 0; s <= segments; s++) {
            const ratio = s / segments;
            const angle = baseAngle + ratio * arcLength;
            
            // Add high-frequency electrical jitter to the radius
            const jitter = Math.sin(time * 65 * intensity + s * 12.5 + a * 5) * 12 * (width / 800) * intensity;
            const currentRad = radius + jitter;
            
            const x = centerX + Math.cos(angle) * currentRad;
            const y = centerY + Math.sin(angle) * currentRad;
            
            if (s === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
        ctx.restore();

        // Draw particle sparkles/floating embers
        ctx.save();
        ctx.shadowBlur = 10 * intensity;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#ffffff";
        const particleCount = Math.max(2, Math.round(15 * intensity));
        for (let p = 0; p < particleCount; p++) {
          // Use deterministic math so particles flow and wrap elegantly
          const speed = (0.4 + (p % 4) * 0.15) * (0.6 + intensity * 0.4);
          const orbitAngle = time * speed + (p * 15.3);
          const orbitRad = radius * (0.4 + (p % 6) * 0.2) + Math.cos(time * 3 + p) * 15;
          
          const px = centerX + Math.cos(orbitAngle) * orbitRad + Math.sin(time * 2.5 + p) * 10 * intensity;
          const py = centerY + Math.sin(orbitAngle) * orbitRad + Math.cos(time * 2.5 + p) * 10 * intensity;
          
          const pSize = (1.5 + (p % 3) * 1.5) * (width / 800) * (0.6 + intensity * 0.4);
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      else if (effect === "fire-embers") {
        // High-fidelity glowing floating warm fire embers rising from the bottom
        ctx.save();
        ctx.shadowBlur = 15 * intensity;
        ctx.shadowColor = "#f97316"; // warm glowing orange
        
        const emberCount = Math.max(3, Math.round(22 * intensity));
        for (let i = 0; i < emberCount; i++) {
          // Deterministic horizontal drift and vertical speed
          const xBase = (i / emberCount) * width;
          const speedY = (45 + (i % 5) * 15) * (0.5 + intensity * 0.5); // pixels per second
          const driftX = Math.sin(time * 1.5 + i * 2.4) * 25 * (width / 800) * intensity;
          
          let y = height - ((time * speedY + i * 35) % (height + 40));
          if (y < -20) y += height + 40;
          
          const x = xBase + driftX;
          const size = (2 + (i % 4) * 2) * (width / 800) * (0.6 + intensity * 0.4);
          const opacity = (0.35 + 0.65 * (y / height)) * Math.min(1.0, 0.4 + intensity * 0.6); // fade out as they reach the top
          
          ctx.fillStyle = `rgba(253, 116, 34, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      else if (effect === "glitch-cyber") {
        // Neon grid lines overlay + horizontal chromatic aberration bars
        const pulse = Math.sin(time * 4 * intensity) * 0.5 + 0.5;
        
        // 1. Draw glowing neon cyber grid
        ctx.save();
        ctx.strokeStyle = `rgba(139, 92, 246, ${(0.08 + pulse * 0.05) * intensity})`; // neon purple
        ctx.lineWidth = Math.max(0.5, 1 * intensity);
        
        // Horizontal lines
        const gridLines = 15;
        const spacing = height / gridLines;
        for (let i = 0; i < gridLines; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * spacing);
          ctx.lineTo(width, i * spacing);
          ctx.stroke();
        }
        // Vertical perspective-like lines radiating from center top or straight
        const vLines = 20;
        const vSpacing = width / vLines;
        for (let i = 0; i < vLines; i++) {
          ctx.beginPath();
          ctx.moveTo(i * vSpacing, 0);
          ctx.lineTo(i * vSpacing, height);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Horizontal sliding glitch stripes with frequency matching intensity
        const threshold = 1 - 0.28 * intensity;
        if (Math.sin(time * 18 * intensity) > threshold) {
          ctx.save();
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(6, 182, 212, ${0.15 + 0.2 * Math.sin(time * 45 * intensity)})`; // cyan
          const hY = ((time * 1200 * intensity) % height);
          const barH = (15 + Math.sin(time * 30) * 10) * intensity;
          ctx.fillRect(0, hY, width, barH);

          ctx.fillStyle = `rgba(236, 72, 153, ${0.12 + 0.15 * Math.cos(time * 45 * intensity)})`; // hot pink
          ctx.fillRect(0, (hY + height * 0.35) % height, width, barH * 0.75);
          ctx.restore();
        }
      }

      ctx.restore();
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

      const hexToRgba = (hex: string, alpha: number) => {
        let cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
        }
        const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
        const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
        const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // Configure font based on aspect ratio sizing & subtitleStyle selection
      const textRatioScale = width / 800;
      const fontSize = Math.round(28 * textRatioScale * subtitleFontSizeFactor);
      
      const fontId = slide.fontFamily || subtitleFont || "space-grotesk";
      const fontObj = CURATED_FONTS.find((f) => f.id === fontId) || CURATED_FONTS[0];
      const selectedFontFamily = fontObj.family;

      if (subtitleStyle === "classical" && fontId === "space-grotesk") {
        ctx.font = `italic 500 ${Math.round(26 * textRatioScale * subtitleFontSizeFactor)}px "Playfair Display", "Georgia", serif`;
      } else if (subtitleStyle === "classical") {
        ctx.font = `italic 500 ${Math.round(26 * textRatioScale * subtitleFontSizeFactor)}px ${selectedFontFamily}`;
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

      // Calculate rectY based on alignment (top, middle, bottom)
      let rectY = 0;
      if (subtitleVerticalAlign === "top") {
        rectY = Math.round(45 * textRatioScale) + offsetY + extraOffsetY + subtitleManualOffset;
      } else if (subtitleVerticalAlign === "middle") {
        rectY = (height - rectHeight) / 2 + offsetY + subtitleManualOffset;
      } else { // bottom
        rectY = height - rectHeight - Math.round(45 * textRatioScale) + offsetY + extraOffsetY - subtitleManualOffset;
      }

      // Draw Subtitle Styles (netflix, neon, karaoke, minimal, classical) using customizable colors and metrics
      if (subtitleStyle === "netflix") {
        // Draw stylized backdrop pill (accessibility friendly)
        ctx.fillStyle = hexToRgba(subtitleBgColor, subtitleBgOpacity);
        ctx.beginPath();
        const radius = 12;
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, radius);
        ctx.fill();

        // Double styled border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = subtitleTextColor;
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        if (subtitleStrokeWidth > 0) {
          ctx.strokeStyle = subtitleStrokeColor;
          ctx.lineWidth = subtitleStrokeWidth * textRatioScale;
          ctx.lineJoin = "round";
          if (textScale !== 1.0) {
            ctx.save();
            ctx.translate(width / 2, rectY + rectHeight / 2);
            ctx.scale(textScale, textScale);
            ctx.strokeText(textToShow, 0, rectHeight / 2 - paddingY - 2);
            ctx.restore();
          } else {
            ctx.strokeText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
          }
        }

        if (textScale !== 1.0) {
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY - 2);
        } else {
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "neon") {
        // Neon Glow Style (No backing pill)
        ctx.fillStyle = subtitleTextColor;
        ctx.shadowColor = subtitleStrokeColor; // Neon highlight glow
        ctx.shadowBlur = (subtitleStrokeWidth || 12) * textRatioScale;
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
        // Karaoke Style (Outline contour + customizable text & outline colors)
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Render outline stroke
        ctx.strokeStyle = subtitleStrokeColor;
        ctx.lineWidth = Math.round(subtitleStrokeWidth * textRatioScale);
        ctx.lineJoin = "round";

        if (textScale !== 1.0) {
          ctx.save();
          ctx.translate(width / 2, rectY + rectHeight / 2);
          ctx.scale(textScale, textScale);
          ctx.strokeText(textToShow, 0, rectHeight / 2 - paddingY / 2);
          ctx.fillStyle = subtitleTextColor;
          ctx.fillText(textToShow, 0, rectHeight / 2 - paddingY / 2);
          ctx.restore();
        } else {
          ctx.strokeText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
          ctx.fillStyle = subtitleTextColor;
          ctx.fillText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
        }
      } 
      else if (subtitleStyle === "minimal") {
        // Soft Elegant Drop Shadow
        ctx.fillStyle = subtitleTextColor;
        ctx.shadowColor = hexToRgba(subtitleBgColor, subtitleBgOpacity);
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        if (subtitleStrokeWidth > 0) {
          ctx.strokeStyle = subtitleStrokeColor;
          ctx.lineWidth = subtitleStrokeWidth * textRatioScale;
          ctx.lineJoin = "round";
          if (textScale !== 1.0) {
            ctx.save();
            ctx.translate(width / 2, rectY + rectHeight / 2);
            ctx.scale(textScale, textScale);
            ctx.strokeText(textToShow, 0, rectHeight / 2 - paddingY / 2);
            ctx.restore();
          } else {
            ctx.strokeText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
          }
        }

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
        ctx.fillStyle = subtitleTextColor;
        ctx.shadowColor = hexToRgba(subtitleBgColor, subtitleBgOpacity);
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        if (subtitleStrokeWidth > 0) {
          ctx.strokeStyle = subtitleStrokeColor;
          ctx.lineWidth = subtitleStrokeWidth * textRatioScale;
          ctx.lineJoin = "round";
          if (textScale !== 1.0) {
            ctx.save();
            ctx.translate(width / 2, rectY + rectHeight / 2);
            ctx.scale(textScale, textScale);
            ctx.strokeText(textToShow, 0, rectHeight / 2 - paddingY / 2);
            ctx.restore();
          } else {
            ctx.strokeText(textToShow, width / 2, rectY + rectHeight - paddingY - 2);
          }
        }

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

    // Draw Safe Area & Guidelines Overlay on the canvas
    if (canvasGuideGrid && canvasGuideGrid !== "none") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // 1. Draw Rule of Thirds Grid lines
      if (canvasGuideGrid === "thirds" || canvasGuideGrid === "all") {
        ctx.beginPath();
        ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height);
        ctx.moveTo((width * 2) / 3, 0); ctx.lineTo((width * 2) / 3, height);
        ctx.moveTo(0, height / 3); ctx.lineTo(width, height / 3);
        ctx.moveTo(0, (height * 2) / 3); ctx.lineTo(width, (height * 2) / 3);
        ctx.stroke();
      }

      // 2. Draw Safe-Zone borders (10% action safe margin, 20% title safe margin)
      if (canvasGuideGrid === "safe-zone" || canvasGuideGrid === "all") {
        ctx.strokeStyle = "rgba(234, 179, 8, 0.45)"; // yellow safe area
        
        // Action Safe (10% inward margin)
        const asmX = width * 0.1;
        const asmY = height * 0.1;
        ctx.beginPath();
        ctx.rect(asmX, asmY, width * 0.8, height * 0.8);
        ctx.stroke();

        // Title Safe (20% inward margin)
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // red title-safe bounds
        const tsmX = width * 0.2;
        const tsmY = height * 0.2;
        ctx.beginPath();
        ctx.rect(tsmX, tsmY, width * 0.6, height * 0.6);
        ctx.stroke();

        // Center crosshairs
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(width / 2 - 10, height / 2);
        ctx.lineTo(width / 2 + 10, height / 2);
        ctx.moveTo(width / 2, height / 2 - 10);
        ctx.lineTo(width / 2, height / 2 + 10);
        ctx.stroke();
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
  }, [slides, transitionStyle, transitionDuration, subtitleStyle, subtitleFont, cinematicLetterbox, vignetteOverlay, aspectRatio, subtitleManualOffset, visualizerStyle, masterVideoFilter, subtitleVerticalAlign, subtitleFontSizeFactor, subtitleTextColor, subtitleBgColor, subtitleBgOpacity, subtitleStrokeColor, subtitleStrokeWidth, canvasGuideGrid]);

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
  }, [currentTime, aspectRatio, slides, transitionStyle, transitionDuration, drawVideoFrame, subtitleStyle, subtitleFont, cinematicLetterbox, vignetteOverlay, subtitleManualOffset, masterVideoFilter, subtitleVerticalAlign, subtitleFontSizeFactor, subtitleTextColor, subtitleBgColor, subtitleBgOpacity, subtitleStrokeColor, subtitleStrokeWidth, canvasGuideGrid]);

  // Sync the ref with the latest drawVideoFrame callback on each change
  useEffect(() => {
    drawVideoFrameRef.current = drawVideoFrame;
  }, [drawVideoFrame]);

  // Batch Queue Handlers
  const handleBatchAddFiles = (filesList: FileList) => {
    const filesArray = Array.from(filesList) as File[];
    const itemsToAdd: BatchItem[] = [];

    filesArray.forEach((file, index) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const urlStr = event.target.result as string;
          const slide: ImageSlide = {
            id: `batch-slide-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            url: urlStr,
            name: file.name,
            duration: defaultSlideDuration,
            text: file.name.replace(/\.[^/.]+$/, "").substring(0, 24),
            textAnimation: "typewriter",
            filter: "normal",
            scaleStart: 1.0,
            scaleEnd: 1.15,
            promptDuration: defaultSlideDuration,
            cameraMovement: "Slow Zoom",
            subjectDescription: "",
            style: "Cinematic"
          };

          const newItem: BatchItem = {
            id: slide.id,
            url: urlStr,
            name: file.name,
            status: "pending",
            progress: 0,
            slide
          };

          // Cache the image immediately to avoid blank frame previews
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = urlStr;
          img.onload = () => {
            imageCacheRef.current[slide.id] = img;
          };

          setBatchItems((prev) => [...prev, newItem]);
        }
      };
      reader.readAsDataURL(file);
    });

    setToastMessage({
      text: "📋 Added to Batch Queue",
      sub: `Successfully loaded image(s) into the Batch Processing Queue!`,
      success: true
    });
    triggerBeepChime();
  };

  const handleBatchRemoveItem = (itemId: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== itemId));
    triggerBeepChime();
  };

  const handleBatchClear = () => {
    setBatchItems([]);
    triggerBeepChime();
  };

  const processBatchItem = async (item: BatchItem) => {
    // 1. Set status to processing
    setBatchItems((prev) =>
      prev.map((bi) => (bi.id === item.id ? { ...bi, status: "processing", progress: 10 } : bi))
    );

    const slide = item.slide!;

    // Wait until cached
    if (!imageCacheRef.current[slide.id]) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = slide.url;
        img.onload = () => {
          imageCacheRef.current[slide.id] = img;
          resolve();
        };
        img.onerror = () => resolve();
      });
    }

    // Canvas sizes
    const renderCanvas = document.createElement("canvas");
    let exportWidth = 1280;
    if (exportResolution === "720p") {
      exportWidth = aspectRatio === "9:16" ? 720 : 1280;
    } else if (exportResolution === "1080p") {
      exportWidth = aspectRatio === "9:16" ? 1080 : 1920;
    } else if (exportResolution === "4K") {
      exportWidth = aspectRatio === "9:16" ? 2160 : 3840;
    }
    let exportHeight = Math.round(exportWidth * (9 / 16));
    if (aspectRatio === "9:16") {
      exportHeight = Math.round(exportWidth * (16 / 9));
    } else if (aspectRatio === "1:1") {
      exportHeight = exportWidth;
    }

    renderCanvas.width = exportWidth;
    renderCanvas.height = exportHeight;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) throw new Error("Could not initialize 2D context");

    // Audio setup
    const renderSynthManager = new RoyaltyFreeSynthManager();
    let renderAudioStream: MediaStream | null = null;
    const hasAudio = !isMuted && (
      (audioTrackMode === "custom" && customAudioUrl) ||
      (audioTrackMode === "sfx" && selectedSfxId) ||
      (audioTrackMode === "synth" && soundtrack !== "none")
    );

    if (hasAudio) {
      if (audioTrackMode === "custom" && customAudioUrl) {
        await renderSynthManager.start("custom", effectiveSoundtrackVolume, false, false, slide.duration, customAudioUrl, 0, audioTrimStart, audioTrimEnd, loopAudio);
      } else if (audioTrackMode === "sfx" && selectedSfxId) {
        await renderSynthManager.start("none");
        renderSynthManager.playSingleSfx(selectedSfxId, effectiveSoundtrackVolume);
      } else if (soundtrack !== "none") {
        await renderSynthManager.start(soundtrack, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, slide.duration, null, 0, 0, 0, loopAudio);
      }
      const renderDest = renderSynthManager.getDestination();
      if (renderDest) {
        renderAudioStream = renderDest.stream;
      }
    }

    const canvasStream = renderCanvas.captureStream(30);
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (hasAudio && renderAudioStream) {
      combinedTracks.push(...renderAudioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(combinedTracks);

    let options: any = { 
      mimeType: "video/webm;codecs=vp8,opus",
      videoBitsPerSecond: 8000000
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
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const fps = 30;
    const totalFrames = Math.round((slide.duration / videoPlaybackSpeed) * fps);
    let currentFrame = 0;

    return new Promise<void>((resolve, reject) => {
      mediaRecorder.start();

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          setBatchItems((prev) =>
            prev.map((bi) => (bi.id === item.id ? { ...bi, progress: 95 } : bi))
          );
          setTimeout(() => {
            mediaRecorder.stop();
          }, 400);
          return;
        }

        const renderTime = (currentFrame / fps) * videoPlaybackSpeed;

        // Draw image frame
        renderCtx.clearRect(0, 0, exportWidth, exportHeight);
        const img = imageCacheRef.current[slide.id];
        if (img) {
          renderCtx.save();
          let activeFilter = "none";
          if (masterVideoFilter !== "none") {
            if (masterVideoFilter === "grayscale") activeFilter = "grayscale(100%)";
            else if (masterVideoFilter === "sepia") activeFilter = "sepia(100%)";
            else if (masterVideoFilter === "vintage") activeFilter = "sepia(60%) contrast(90%) brightness(105%) saturate(110%)";
            else if (masterVideoFilter === "high-contrast") activeFilter = "contrast(150%) brightness(105%)";
            else if (masterVideoFilter === "cyberpunk") activeFilter = "hue-rotate(180deg) saturate(185%) contrast(125%)";
            else if (masterVideoFilter === "noir") activeFilter = "grayscale(100%) contrast(140%) brightness(90%)";
            else if (masterVideoFilter === "cool") activeFilter = "hue-rotate(30deg) saturate(115%) brightness(95%) contrast(105%)";
            else if (masterVideoFilter === "warm") activeFilter = "sepia(30%) saturate(130%) hue-rotate(-10deg) brightness(105%)";
          } else if (slide.filter && slide.filter !== "normal") {
            if (slide.filter === "noir") activeFilter = "grayscale(100%) contrast(120%)";
            else if (slide.filter === "vintage") activeFilter = "sepia(80%) contrast(95%)";
            else if (slide.filter === "cinematic-warm") activeFilter = "sepia(25%) saturate(120%) contrast(105%)";
            else if (slide.filter === "cyberpunk") activeFilter = "hue-rotate(150deg) saturate(150%)";
          }
          if (activeFilter !== "none") renderCtx.filter = activeFilter;

          const progress = renderTime / slide.duration;
          const scaleStart = slide.scaleStart ?? 1.0;
          const scaleEnd = slide.scaleEnd ?? 1.15;
          const scale = scaleStart + (scaleEnd - scaleStart) * progress;

          const iw = img.width;
          const ih = img.height;
          const r = Math.min(exportWidth / iw, exportHeight / ih);
          const nw = iw * r * scale;
          const nh = ih * r * scale;
          const cx = (exportWidth - nw) / 2;
          const cy = (exportHeight - nh) / 2;
          renderCtx.drawImage(img, cx, cy, nw, nh);
          renderCtx.restore();
        } else {
          renderCtx.fillStyle = "#1e293b";
          renderCtx.fillRect(0, 0, exportWidth, exportHeight);
        }

        // Draw subtitle text
        if (slide.text) {
          renderCtx.save();
          renderCtx.shadowColor = "rgba(0, 0, 0, 0.8)";
          renderCtx.shadowBlur = 8;
          renderCtx.fillStyle = subtitleTextColor || "#ffffff";
          renderCtx.font = `bold ${Math.round(40 * (subtitleFontSizeFactor || 1))}px sans-serif`;
          renderCtx.textAlign = "center";
          
          let yPos = exportHeight - 80;
          if (subtitleVerticalAlign === "top") yPos = 80;
          else if (subtitleVerticalAlign === "middle") yPos = exportHeight / 2;

          renderCtx.fillText(slide.text, exportWidth / 2, yPos);
          renderCtx.restore();
        }

        currentFrame++;
        const percent = Math.round((currentFrame / totalFrames) * 80) + 10;
        setBatchItems((prev) =>
          prev.map((bi) => (bi.id === item.id ? { ...bi, progress: percent } : bi))
        );

        requestAnimationFrame(renderNextFrame);
      };

      requestAnimationFrame(renderNextFrame);

      mediaRecorder.onstop = () => {
        renderSynthManager.stop();
        const finalBlob = new Blob(chunks, { type: options.mimeType });
        const resultUrl = URL.createObjectURL(finalBlob);

        // Auto-download file
        const ext = exportFormat === "gif" ? "gif" : (exportFormat === "webm" ? "webm" : "mp4");
        const cleanName = `${slide.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}_clip.${ext}`;
        triggerFileDownload(finalBlob, cleanName);

        setBatchItems((prev) =>
          prev.map((bi) =>
            bi.id === item.id ? { ...bi, status: "completed", progress: 100, resultUrl } : bi
          )
        );
        resolve();
      };

      mediaRecorder.onerror = (e) => {
        renderSynthManager.stop();
        setBatchItems((prev) =>
          prev.map((bi) => (bi.id === item.id ? { ...bi, status: "failed" } : bi))
        );
        reject(e);
      };
    });
  };

  const handleStartBatchGeneration = async () => {
    if (batchItems.length === 0) return;
    setIsBatchProcessing(true);

    if (batchGenerationMode === "sequence") {
      // 1. Build a sequenced timeline using the batch queue slides
      const newSlides = batchItems.map((item) => item.slide!);
      setSlides(newSlides);
      setSelectedSlideId(newSlides[0].id);
      setCurrentTime(0);

      setToastMessage({
        text: "⚡ Queue Loaded into Timeline!",
        sub: `Timeline populated with all ${batchItems.length} images. Starting standard render...`,
        success: true
      });
      triggerBeepChime();

      // Start main export sequence
      setTimeout(() => {
        handleCreateVideo();
        setIsBatchProcessing(false);
      }, 500);

    } else {
      // 2. Individual clips sequence
      setToastMessage({
        text: "⚙️ Starting Batch Queue Processing...",
        sub: `Rendering ${batchItems.length} individual clips sequentially in background.`,
        success: true
      });
      triggerBeepChime();

      // Reset statuses
      setBatchItems((prev) => prev.map((bi) => ({ ...bi, status: "pending", progress: 0 })));

      try {
        for (let i = 0; i < batchItems.length; i++) {
          await processBatchItem(batchItems[i]);
        }
        setToastMessage({
          text: "🎉 Batch Rendering Completed!",
          sub: `Successfully generated and downloaded all ${batchItems.length} individual clips.`,
          success: true
        });
        triggerBeepChime();
      } catch (err) {
        console.error("Batch processing error:", err);
        setToastMessage({
          text: "❌ Batch Render Interrupted",
          sub: `An error occurred during queue rendering: ${err instanceof Error ? err.message : String(err)}`,
          success: false
        });
      } finally {
        setIsBatchProcessing(false);
      }
    }
  };

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
      let exportWidth = 1920;
      if (exportResolution === "720p") {
        exportWidth = aspectRatio === "9:16" ? 720 : 1280;
      } else if (exportResolution === "1080p") {
        exportWidth = aspectRatio === "9:16" ? 1080 : 1920;
      } else if (exportResolution === "4K") {
        exportWidth = aspectRatio === "9:16" ? 2160 : 3840;
      }

      let exportHeight = Math.round(exportWidth * (9 / 16));
      if (aspectRatio === "9:16") {
        exportHeight = Math.round(exportWidth * (16 / 9));
      } else if (aspectRatio === "1:1") {
        exportHeight = exportWidth;
      }

      renderCanvas.width = exportWidth;
      renderCanvas.height = exportHeight;
      const renderCtx = renderCanvas.getContext("2d");
      if (!renderCtx) throw new Error("Could not initialize 2D render context");

      // Set up offscreen audio synthesis to record sound synced with frame capture
      const renderSynthManager = new RoyaltyFreeSynthManager();
      let renderAudioStream: MediaStream | null = null;
      
      // Connect synthesis directly to our render stream destination node
      if (!isMuted) {
        if (audioTrackMode === "custom" && customAudioUrl) {
          await renderSynthManager.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, customAudioUrl, 0, audioTrimStart, audioTrimEnd, loopAudio);
        } else if (audioTrackMode === "sfx" && selectedSfxId) {
          await renderSynthManager.start("none");
          renderSynthManager.playSingleSfx(selectedSfxId, effectiveSoundtrackVolume);
        } else if (soundtrack !== "none") {
          await renderSynthManager.start(soundtrack, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
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
        drawVideoFrame(renderCtx, exportWidth, exportHeight, renderTime);
        
        // Capture GIF frames if GIF format is selected
        if (exportFormat === "gif") {
          const frameStep = Math.max(1, Math.round(fps / gifFps));
          if (currentFrame % frameStep === 0) {
            const gifCanvas = document.createElement("canvas");
            gifCanvas.width = 480;
            gifCanvas.height = Math.round(480 * (exportHeight / exportWidth));
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
                renderSynthManager.playSingleSfx(slide.sfx, effectiveSoundtrackVolume);
              }
            }
          } else {
            // Trigger first slide SFX at frame 0
            const firstSlide = slides[0];
            if (firstSlide && firstSlide.sfx && firstSlide.sfx !== "none") {
              renderSynthManager.playSingleSfx(firstSlide.sfx, effectiveSoundtrackVolume);
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
                  const meta = getVideoMetadata();
                  await uploadFileToDrive(
                    accessToken,
                    fileNameWithExt,
                    mime,
                    base64DataUrl,
                    undefined, // parentId
                    meta.description,
                    meta.properties
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
            gifHeight: Math.round(480 * (exportHeight / exportWidth)),
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
          {slides.length > 0 && selectedSlide ? (
            <div className="border border-indigo-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 rounded-3xl p-6 relative overflow-hidden text-left shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LHS: Image Preview */}
                <div className="w-full lg:w-5/12 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                      <span>📸 Uploaded Image (Active Frame)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      This image will be used as the starting canvas for your generated video clip.
                    </p>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-slate-200 dark:border-slate-850 group/preview shadow-md">
                    <img 
                      src={selectedSlide.url} 
                      alt={selectedSlide.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                      <span className="text-[9px] font-bold text-white font-mono truncate">
                        File: {selectedSlide.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions for image */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition-all text-center select-none active:scale-97 flex items-center justify-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveImageTab("ai_create");
                        triggerBeepChime();
                        const el = document.getElementById("ai-image-generator-section");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="flex-1 py-2 px-2.5 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-650 text-white border border-violet-500/30 rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition-all text-center select-none active:scale-97 flex items-center justify-center gap-1 shadow-sm"
                      title="Generate a brand new image using Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI Generate</span>
                    </button>

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
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 text-rose-500 rounded-xl transition-all cursor-pointer"
                      title="Clear Timeline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* RHS: Video Generation Prompt & Controls */}
                <div className="w-full lg:w-7/12 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-850 pt-5 lg:pt-0 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Google Flow AI Video Prompt</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Define descriptive instructions below to simulate rich motion on top of your image.
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-mono">
                      VEV-CORE
                    </span>
                  </div>

                  {/* Prompt Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-450">
                      Define Video Generation Prompt / Description:
                    </label>
                    <textarea
                      rows={2}
                      value={flowAiPromptText}
                      onChange={(e) => setFlowAiPromptText(e.target.value)}
                      placeholder='e.g., "lightning bolt striking over the landscape with glowing blue electric sparks" or "warm glowing fire embers rising upwards with smoke"'
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 resize-none shadow-inner"
                    />
                  </div>

                  {/* Negative Prompt Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-450">
                      Negative Prompt (Elements to avoid):
                    </label>
                    <textarea
                      rows={1}
                      value={flowAiNegativePromptText}
                      onChange={(e) => setFlowAiNegativePromptText(e.target.value)}
                      placeholder='e.g., "blur, low resolution, bad anatomy, text, watermark, fast motion"'
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 resize-none shadow-inner"
                    />
                  </div>

                  {/* Motion Intensity Range Control */}
                  <div className="space-y-2.5 bg-amber-500/5 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/10">
                    <div className="flex justify-between items-center gap-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Adjust Motion Intensity Preset:
                      </label>
                      <select
                        value={(() => {
                          const matched = [0.4, 1.0, 1.5, 2.0].find(v => Math.abs(v - flowAiIntensityValue) < 0.05);
                          return matched !== undefined ? matched.toString() : "custom";
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "custom") {
                            handleIntensityChange(parseFloat(val));
                            triggerBeepChime();
                          }
                        }}
                        className="text-[9.5px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer shadow-sm"
                      >
                        <option value="custom" disabled>Custom ({flowAiIntensityValue.toFixed(1)}x)</option>
                        <option value="0.4">Subtle (0.4x)</option>
                        <option value="1.0">Dynamic (1.0x)</option>
                        <option value="1.5">Cinematic (1.5x)</option>
                        <option value="2.0">Extreme (2.0x)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase">
                        <span>Fine-tune Intensity / Speed Slider:</span>
                        <span className="text-[9.5px] font-mono font-black text-amber-600 dark:text-amber-400">
                          {flowAiIntensityValue.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8.5px] font-black uppercase text-slate-400 font-mono">0.2x</span>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.1"
                          value={flowAiIntensityValue}
                          onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <span className="text-[8.5px] font-black uppercase text-slate-400 font-mono">2.0x</span>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Preset motion bubbles */}
                  <div className="space-y-1.5">
                    <span className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                      ⚡ Quick Presets (Click to load prompt):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          label: "⚡ Lightning Strike",
                          prompt: "lightning strike: intense lightning and thunder bolt flashes over image"
                        },
                        {
                          label: "🌀 Electric Sparks",
                          prompt: "electric sparks: glowing neon-blue particle vortex rings rotating around center"
                        },
                        {
                          label: "🔥 Fire Embers",
                          prompt: "fire embers: dynamic warm floating embers rising with ambient heat"
                        },
                        {
                          label: "👾 Glitch Cyber",
                          prompt: "glitch cyber: digital chromatic glitch distortions and neon cyber grids"
                        }
                      ].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFlowAiPromptText(p.prompt);
                            triggerBeepChime();
                          }}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-amber-500/5 border border-slate-250/60 dark:border-slate-850 hover:border-amber-400/50 rounded-xl text-[9px] font-extrabold text-slate-700 dark:text-slate-350 transition-all cursor-pointer truncate active:scale-95 text-center"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generation Status vs Trigger Button */}
                  {isGeneratingFlowAi ? (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black text-amber-500 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>SYNTHESIZING FLOW VECTOR LAYER</span>
                        </span>
                        <span className="font-mono font-black text-amber-500">
                          {flowAiProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300" 
                          style={{ width: `${flowAiProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedSlide && flowAiFailures[selectedSlide.id] && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[9.5px] rounded-xl flex items-center gap-2 font-black uppercase tracking-wider">
                          <span>⚠️ Generation failed. Click Regenerate to retry with current parameters.</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handleRunFlowAiForSlide}
                          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>Run Flow AI (Render Effects)</span>
                        </button>

                        {selectedSlide && (flowAiFailures[selectedSlide.id] || (selectedSlide.flowAiEffect && selectedSlide.flowAiEffect !== "none")) && (
                          <button
                            type="button"
                            onClick={handleRunFlowAiForSlide}
                            className="py-2.5 px-4 bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-650 hover:to-red-750 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-97 transition-all"
                            title="Quickly resubmit with existing parameters"
                          >
                            <RotateCcw className="w-4 h-4 text-white" />
                            <span>Regenerate</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isExporting}
                          onClick={handleCreateVideo}
                          className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-all select-none shadow-md"
                        >
                          <Video className="w-4 h-4 fill-current animate-pulse" />
                          <span>Export Cinematic Video</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
                  Drag & Drop or click below to upload your images. We'll instantly build a gorgeous animated video from them!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg pt-1.5 justify-center">
                {/* Custom styled File Upload Label */}
                <label className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none border border-indigo-500/30 active:scale-97">
                  <Plus className="w-4 h-4" />
                  <span>Upload Images/Videos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Generate with Gemini AI Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTab("ai_create");
                    triggerBeepChime();
                    const el = document.getElementById("ai-image-generator-section");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-650 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none border border-violet-500/30 active:scale-97 shadow-sm"
                  title="Generate a brand new image using Gemini AI"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Generate with Gemini AI</span>
                </button>

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
          )}

          {/* Dual-Tab Selector: Presets vs AI Image Creator */}
          <div id="ai-image-generator-section" className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-5">
            <div className="flex border-b border-slate-150 dark:border-slate-850 pb-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveImageTab("presets");
                  triggerBeepChime();
                }}
                className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                  activeImageTab === "presets"
                    ? "border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                }`}
              >
                📚 Curated Presets Library
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveImageTab("ai_create");
                  triggerBeepChime();
                }}
                className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                  activeImageTab === "ai_create"
                    ? "border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                }`}
              >
                ✨ Create AI Image with Gemini
              </button>
            </div>

            {activeImageTab === "presets" ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5 text-left">
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
                              ? "bg-indigo-650 text-white shadow-xs font-bold"
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
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Describe the image you want to create:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const suggestions = [
                          "A futuristic sports car speeding on a cyberpunk neon-lit wet highway at night, sunset background",
                          "A cozy wooden cabin deep in an autumn forest with warm light shining from windows and river reflecting",
                          "An astronaut fluffy red panda floating in cosmic colorful nebulas with a glowing helmet",
                          "A serene tropical beach with golden sunbeams, gentle turquoise waves, and tall palm trees",
                          "A magnificent medieval castle on top of a mist-covered mountain during golden hour, cinematic lighting"
                        ];
                        setAiImagePrompt(suggestions[Math.floor(Math.random() * suggestions.length)]);
                        triggerBeepChime();
                      }}
                      className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Get a creative prompt idea"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-500 animate-bounce" />
                      <span>Suggest Idea</span>
                    </button>
                  </div>
                  
                  <textarea
                    value={aiImagePrompt}
                    onChange={(e) => setAiImagePrompt(e.target.value)}
                    placeholder="e.g., A futuristic sports car speeding on a cyberpunk neon-lit highway..."
                    className="w-full min-h-[80px] p-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-950/90 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-850 dark:text-slate-150 transition-all font-medium leading-relaxed resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Aspect Ratio Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Aspect Ratio:
                    </label>
                    <div className="grid grid-cols-5 gap-1 bg-slate-100/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850/60">
                      {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            setAiImageAspectRatio(ratio);
                            triggerBeepChime();
                          }}
                          className={`py-1.5 text-[9px] font-black rounded-md cursor-pointer transition-all ${
                            aiImageAspectRatio === ratio
                              ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-450 shadow-3xs"
                              : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-300"
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style Preset Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Aesthetic Style:
                    </label>
                    <select
                      value={aiImageStyle}
                      onChange={(e) => {
                        setAiImageStyle(e.target.value);
                        triggerBeepChime();
                      }}
                      className="w-full p-2 text-xs font-bold rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-950/90 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-indigo-500 transition-all"
                    >
                      <option value="none">None (Raw Prompt)</option>
                      <option value="cinematic">Cinematic 🎬</option>
                      <option value="anime">Anime 🌸</option>
                      <option value="oil_painting">Oil Painting 🎨</option>
                      <option value="sketch">Sketch ✏️</option>
                      <option value="render_3d">3D Render 🪐</option>
                      <option value="retro_vhs">Retro VHS 📹</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button & Progress */}
                <div className="pt-1 flex flex-col gap-3">
                  {aiImageError && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 text-[11px] font-medium text-rose-750 dark:text-rose-400 text-left">
                      ⚠️ {aiImageError}
                    </div>
                  )}

                  {isGeneratingAiImage ? (
                    <div className="p-4.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/50 flex flex-col items-center justify-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className="w-9 h-9 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <Sparkles className="w-4 h-4 text-indigo-500 absolute animate-pulse" />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-wider animate-pulse">
                          Generating custom canvas image...
                        </p>
                        <p className="text-[10px] text-slate-550 dark:text-slate-400 font-mono font-medium">
                          {aiImageProgressStage || "Contacting Gemini Imagen Server..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateAiImage}
                      disabled={!aiImagePrompt.trim()}
                      className={`w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        aiImagePrompt.trim()
                          ? "bg-gradient-to-r from-indigo-650 to-violet-700 hover:from-indigo-600 hover:to-violet-650 text-white shadow-md hover:shadow-lg active:scale-98"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Create AI Image with Gemini</span>
                    </button>
                  )}

                  {/* Resulting Image Preview card */}
                  {generatedImageUrl && !isGeneratingAiImage && (
                    <div className="mt-2 border border-indigo-150 dark:border-slate-850 bg-white/40 dark:bg-slate-950/20 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-1 text-left">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest border border-emerald-150/40">
                          <Check className="w-2.5 h-2.5" />
                          <span>AI Masterpiece Created</span>
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal italic truncate">
                          &ldquo;{aiImagePrompt}&rdquo;
                        </p>
                      </div>

                      <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 dark:border-slate-850 group/result shadow-sm">
                        <img
                          src={generatedImageUrl}
                          alt="AI Generated Masterpiece"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/result:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              triggerFileDownload(generatedImageUrl, `gemini-ai-image-${Date.now()}.png`);
                              triggerBeepChime();
                            }}
                            className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                            title="Download generated image as PNG"
                          >
                            <Download className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleAddGeneratedImageToTimeline}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-[10.5px] font-extrabold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Load this brand new AI creation into your video timeline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Timeline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerFileDownload(generatedImageUrl, `gemini-ai-image-${Date.now()}.png`);
                            triggerBeepChime();
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-[10.5px] font-extrabold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl border border-slate-200/50 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
                          title="Save PNG locally"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Download PNG</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Player Mode Select Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-xs gap-2">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 pl-1">
              🖥️ Live Player Screen
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setPreviewMode("canvas");
                  triggerBeepChime();
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === "canvas"
                    ? "bg-indigo-650 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Live Render Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode("slideshow");
                  triggerBeepChime();
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === "slideshow"
                    ? "bg-indigo-650 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Slideshow Video Player</span>
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
              } ${isExporting || showFinalOutput || previewMode === "slideshow" ? "hidden" : "block"}`}
            />

            {/* Premium Slideshow Video Player */}
            {!isExporting && !showFinalOutput && previewMode === "slideshow" && (
              <div 
                className={`relative overflow-hidden shadow-2xl transition-all duration-300 bg-slate-950 flex flex-col justify-center items-center ${
                  aspectRatio === "9:16" ? "h-[450px] aspect-[9/16]" : aspectRatio === "1:1" ? "h-[360px] aspect-square" : "w-full aspect-[16/9]"
                }`}
              >
                {slides.length === 0 ? (
                  <div className="text-center p-6 space-y-2">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No Slides Found</p>
                    <p className="text-[10px] text-slate-400">Add or pre-load images to watch a gorgeous live slideshow preview!</p>
                  </div>
                ) : (() => {
                  // Determine active slide and transitions
                  let cumulativeTime = 0;
                  let activeSlideIndex = 0;
                  for (let i = 0; i < slides.length; i++) {
                    if (currentTime >= cumulativeTime && currentTime < cumulativeTime + slides[i].duration) {
                      activeSlideIndex = i;
                      break;
                    }
                    cumulativeTime += slides[i].duration;
                  }
                  if (activeSlideIndex >= slides.length) {
                    activeSlideIndex = Math.max(0, slides.length - 1);
                  }
                  const activeSlide = slides[activeSlideIndex] || slides[0];
                  
                  // Compute start offset for the active slide
                  let slideStartTime = 0;
                  for (let i = 0; i < activeSlideIndex; i++) {
                    slideStartTime += slides[i].duration;
                  }
                  const slideLocalTime = currentTime - slideStartTime;
                  const progress = activeSlide ? Math.min(1, Math.max(0, slideLocalTime / activeSlide.duration)) : 0;

                  // Define master filters
                  let activeFilter = "";
                  const currentFilter = masterVideoFilter !== "none" ? masterVideoFilter : (activeSlide ? activeSlide.filter : "normal");
                  if (currentFilter === "grayscale") {
                    activeFilter = "grayscale(100%)";
                  } else if (currentFilter === "sepia") {
                    activeFilter = "sepia(100%)";
                  } else if (currentFilter === "vintage") {
                    activeFilter = "sepia(60%) contrast(90%) brightness(105%) saturate(110%)";
                  } else if (currentFilter === "high-contrast") {
                    activeFilter = "contrast(150%) brightness(105%)";
                  } else if (currentFilter === "cyberpunk") {
                    activeFilter = "hue-rotate(180deg) saturate(185%) contrast(125%)";
                  } else if (currentFilter === "noir") {
                    activeFilter = "grayscale(100%) contrast(140%) brightness(90%)";
                  } else if (currentFilter === "cool") {
                    activeFilter = "hue-rotate(30deg) saturate(115%) brightness(95%) contrast(105%)";
                  } else if (currentFilter === "warm") {
                    activeFilter = "sepia(30%) saturate(130%) hue-rotate(-10deg) brightness(105%)";
                  } else if (currentFilter === "cinematic-warm") {
                    activeFilter = "sepia(20%) saturate(135%) hue-rotate(-10deg) contrast(110%)";
                  } else if (currentFilter === "vhs") {
                    activeFilter = "contrast(112%) saturate(125%) hue-rotate(5deg) brightness(98%)";
                  } else if (currentFilter === "retro") {
                    activeFilter = "sepia(42%) saturate(108%) contrast(95%)";
                  }

                  // Define Ken Burns / Camera Motion transform values
                  const motionVal = activeSlide?.cameraMovement || "Slow Zoom";
                  const startScale = activeSlide?.scaleStart ?? 1.0;
                  const endScale = activeSlide?.scaleEnd ?? 1.15;
                  const scale = startScale + (endScale - startScale) * progress;
                  
                  let translateX = 0;
                  let translateY = 0;
                  let rotate = 0;
                  const motionSpeedFactor = activeSlide?.motionSpeed !== undefined ? activeSlide.motionSpeed : 1.0;
                  const baseCamOffset = 22 * motionSpeedFactor * progress; // drift up to 22 pixels

                  if (motionVal === "Pan Left") {
                    translateX = baseCamOffset;
                  } else if (motionVal === "Pan Right") {
                    translateX = -baseCamOffset;
                  } else if (motionVal === "Tilt Up" || motionVal === "Pan Up") {
                    translateY = baseCamOffset;
                  } else if (motionVal === "Tilt Down" || motionVal === "Pan Down") {
                    translateY = -baseCamOffset;
                  } else if (motionVal.toLowerCase().includes("drone") || motionVal.toLowerCase().includes("forward")) {
                    translateY = baseCamOffset * 0.5;
                  }

                  // Subtitles processing
                  let textToShow = activeSlide?.text || "";
                  let textAlpha = 1.0;
                  let textScale = 1.0;
                  let subtitleYOffset = 0;

                  if (activeSlide) {
                    if (activeSlide.textAnimation === "typewriter") {
                      const charCount = Math.floor(activeSlide.text.length * Math.min(1, progress * 2));
                      textToShow = activeSlide.text.substring(0, charCount);
                    } else if (activeSlide.textAnimation === "fade") {
                      if (progress < 0.2) {
                        textAlpha = progress / 0.2;
                      } else if (progress > 0.8) {
                        textAlpha = (1 - progress) / 0.2;
                      }
                    } else if (activeSlide.textAnimation === "pop") {
                      if (progress < 0.15) {
                        textScale = 0.7 + (progress / 0.15) * 0.3;
                      }
                    } else if (activeSlide.textAnimation === "slide-up") {
                      if (progress < 0.25) {
                        const anim = 1 - (progress / 0.25);
                        subtitleYOffset = 25 * anim;
                        textAlpha = progress / 0.25;
                      }
                    }
                  }

                  // Subtitle style mapping
                  let subtitleClassName = "";
                  if (subtitleStyle === "netflix") {
                    subtitleClassName = "bg-black/65 text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-center font-sans tracking-wide leading-normal";
                  } else if (subtitleStyle === "neon") {
                    subtitleClassName = "text-white font-black tracking-widest uppercase drop-shadow-[0_0_12px_rgba(99,102,241,0.95)]";
                  } else if (subtitleStyle === "karaoke") {
                    subtitleClassName = "text-yellow-400 font-extrabold tracking-wide drop-shadow-[0_2px_0_#000] [text-shadow:2px_2px_0_#000,-2px_2px_0_#000,2px_-2px_0_#000,-2px_-2px_0_#000]";
                  } else if (subtitleStyle === "minimal") {
                    subtitleClassName = "text-slate-100 font-medium tracking-normal drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)] text-center";
                  } else if (subtitleStyle === "classical") {
                    subtitleClassName = "text-slate-50 italic tracking-wider font-serif drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-center";
                  }

                  // Subtitle font mapping
                  let fontStyleClass = "font-sans";
                  const activeFontId = activeSlide?.fontFamily || subtitleFont || "space-grotesk";
                  if (activeFontId === "space-grotesk") {
                    fontStyleClass = "font-sans tracking-tight";
                  } else if (activeFontId === "jetbrains-mono") {
                    fontStyleClass = "font-mono text-[10.5px] uppercase tracking-wider";
                  } else if (activeFontId === "playfair-display") {
                    fontStyleClass = "font-serif italic";
                  }

                  return (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      {/* Panoramic Background Glow for atmosphere */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110 pointer-events-none transition-all duration-700"
                        style={{ backgroundImage: `url(${activeSlide.url})` }}
                      />

                      {/* Video Aspect Ratio Box container */}
                      <div 
                        className="relative w-full h-full flex items-center justify-center overflow-hidden"
                      >
                        {/* Slide Image with active camera movement & filters */}
                        <motion.img
                          key={activeSlide.id}
                          src={activeSlide.url}
                          alt={activeSlide.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-all"
                          style={{
                            filter: activeFilter || "none",
                            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
                            transformOrigin: "center center"
                          }}
                        />

                        {/* Cinematic Letterboxing Overlay option */}
                        {cinematicLetterbox && (
                          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none z-10">
                            <div className="w-full h-[8%] bg-black" />
                            <div className="w-full h-[8%] bg-black" />
                          </div>
                        )}

                        {/* Vignette dark corner overlay */}
                        {vignetteOverlay && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)] pointer-events-none z-10" />
                        )}

                        {/* Slide Caption / Subtitles HUD overlay */}
                        {textToShow && (
                          <div 
                            className="absolute bottom-10 left-4 right-4 flex items-center justify-center z-20 pointer-events-none"
                            style={{ 
                              transform: `translateY(${-subtitleManualOffset + subtitleYOffset}px) scale(${textScale})`,
                              opacity: textAlpha,
                              transition: "transform 0.05s ease-out, opacity 0.05s ease-out"
                            }}
                          >
                            <span className={`${subtitleClassName} ${fontStyleClass} text-xs px-3 py-1.5 max-w-[85%] inline-block`}>
                              {textToShow}
                            </span>
                          </div>
                        )}

                        {/* Active Slide Specs HUD badge */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-20 pointer-events-none font-mono">
                          <span className="text-[7.5px] font-black uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            <span>Clip {activeSlideIndex + 1}/{slides.length}</span>
                          </span>
                          <span className="text-[7px] font-bold text-slate-300 bg-slate-950/65 backdrop-blur-md px-1.5 py-0.5 rounded-sm uppercase">
                            {motionVal} • {activeSlide.style || "Cinematic"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

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
                        referrerPolicy="no-referrer"
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
            
            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 dark:text-slate-500 font-mono mt-1 select-none">
              <span>⌨️ Shortcuts:</span>
              <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-1 py-0.5 rounded text-[7.5px]">Space</span>
              <span>Play/Pause</span>
              <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-1 py-0.5 rounded text-[7.5px]">←</span>
              <span className="bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-1 py-0.5 rounded text-[7.5px]">→</span>
              <span>Seek 0.5s</span>
            </div>
          </div>

          {/* Timeline control row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stepBackward}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-350 shrink-0"
                title="Previous Frame (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className={`p-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isPlaying
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                title={isPlaying ? "Pause timeline preview (Space)" : "Play timeline preview (Space)"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={stepForward}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-350 shrink-0"
                title="Next Frame (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
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

              {/* Pro Safe Area Grid Guides Switcher */}
              <button
                type="button"
                onClick={() => {
                  const sequence: ("none" | "thirds" | "safe-zone" | "all")[] = ["none", "thirds", "safe-zone", "all"];
                  const nextIndex = (sequence.indexOf(canvasGuideGrid) + 1) % sequence.length;
                  setCanvasGuideGrid(sequence[nextIndex]);
                  triggerBeepChime();
                  setToastMessage({
                    text: `📐 Alignment Grid: ${sequence[nextIndex].toUpperCase()}`,
                    sub: "Safe-zone alignment overlays loaded on player viewport.",
                    success: true
                  });
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-[10px] font-black border ${
                  canvasGuideGrid !== "none"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 border-transparent"
                }`}
                title="Toggle Rule of Thirds grid, Action-Safe boundaries, and Title-Safe templates on the canvas"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline uppercase tracking-wider text-[8.5px]">
                  Guides: {canvasGuideGrid === "none" ? "OFF" : canvasGuideGrid.toUpperCase()}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Transitions:
                </span>
                <select
                  id="transition-style-dropdown"
                  value={transitionStyle}
                  onChange={(e) => setTransitionStyle(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl shadow-3xs cursor-pointer outline-none"
                >
                  <option value="fade">🎬 Cross Dissolve (Fade)</option>
                  <option value="slide-left">⚡ Slide Left</option>
                  <option value="slide-right">⚡ Slide Right</option>
                  <option value="zoom">🔍 Scaling Zoom</option>
                  <option value="flash">✨ Flash Transition</option>
                  <option value="cross-zoom">🎯 Cinematic Cross Zoom</option>
                  <option value="curtain-wipe">🚪 Sliding Curtain Wipe</option>
                  <option value="blur-fade">🌫️ Dreamy Blur Fade</option>
                  <option value="glitch-wave">👾 Digital Glitch Wave</option>
                  <option value="spiral-spin">🌀 Spiral Vortex Spin</option>
                  <option value="pixelate-fade">👾 Retro Pixelate Reveal</option>
                  <option value="radial-wipe">⭕ Radial Expanding Wipe</option>
                  <option value="none">❌ Cut (No Transition)</option>
                </select>
              </div>

              {transitionStyle !== "none" && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 py-1 px-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    Duration:
                  </span>
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.1}
                    value={transitionDuration}
                    onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                    className="w-20 sm:w-24 h-1.5 bg-slate-200 dark:bg-slate-750 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-350 font-mono w-8">{transitionDuration.toFixed(1)}s</span>
                </div>
              )}
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

                  {/* Image Generation Source Selector */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-850/70 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                      🎨 Scene Base Canvas Source:
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-250/20 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isGeneratingScene}
                        onClick={() => {
                          setAiSceneImageSource("gemini");
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider ${
                          aiSceneImageSource === "gemini"
                            ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>🌌 Gemini AI Model</span>
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingScene}
                        onClick={() => {
                          setAiSceneImageSource("unsplash");
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider ${
                          aiSceneImageSource === "unsplash"
                            ? "bg-white dark:bg-slate-950 text-indigo-650 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 text-emerald-500" />
                        <span>📸 Stock Photo (Fast)</span>
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold leading-normal italic pl-1">
                      {aiSceneImageSource === "gemini" 
                        ? "🌌 Text-To-Video: Gemini Imagen 3 generates a fully custom, unique high-fidelity 16:9 widescreen canvas." 
                        : "📸 Speed Mode: Auto-retrieves beautifully-curated photography assets directly from Unsplash."}
                    </p>
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

                  {/* Image Generation Source Selector for Script-to-Video */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-850/70 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                      🎨 Scene Base Canvas Source:
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-250/20 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isGeneratingScript}
                        onClick={() => {
                          setAiSceneImageSource("gemini");
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider ${
                          aiSceneImageSource === "gemini"
                            ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>🌌 Gemini AI Model</span>
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingScript}
                        onClick={() => {
                          setAiSceneImageSource("unsplash");
                          triggerBeepChime();
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider ${
                          aiSceneImageSource === "unsplash"
                            ? "bg-white dark:bg-slate-950 text-indigo-650 dark:text-indigo-400 shadow-3xs border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 text-emerald-500" />
                        <span>📸 Stock Photo (Fast)</span>
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold leading-normal italic pl-1">
                      {aiSceneImageSource === "gemini" 
                        ? "🌌 Text-To-Video: Gemini Imagen 3 generates a fully custom, unique high-fidelity 16:9 widescreen canvas." 
                        : "📸 Speed Mode: Auto-retrieves beautifully-curated photography assets directly from Unsplash."}
                    </p>
                  </div>

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

            {/* 5. GENERATED VIDEO DURATION SLIDER */}
            <div className="space-y-2 bg-slate-500/5 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-850/60 relative z-10">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  6. Desired Video Duration:
                </label>
                <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  {aiSceneDuration} Seconds
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={aiSceneDuration}
                onChange={(e) => setAiSceneDuration(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                disabled={isGeneratingScene}
              />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <span>2s Punchy</span>
                <span>4s Standard</span>
                <span>10s Cinematic</span>
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
                  <span>Add Media</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
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
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Audio Track (Soundtrack & Beats)
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Quick Select Dropdown */}
                      <div className="relative">
                        <select
                          id="quick-timeline-audio-select"
                          value={
                            audioTrackMode === "synth" 
                              ? `synth:${soundtrack}` 
                              : audioTrackMode === "custom" && customAudioUrl 
                                ? `custom:${customAudioUrl}` 
                                : "silent"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "silent") {
                              setAudioTrackMode("synth");
                              setSoundtrack("none");
                              setCustomAudioUrl(null);
                              setCustomAudioName(null);
                              synthManagerRef.current.stop();
                              setToastMessage({
                                text: "🔇 Sound muted",
                                sub: "Reverted back to silent.",
                                success: true
                              });
                            } else if (val.startsWith("synth:")) {
                              const trackId = val.split(":")[1];
                              setAudioTrackMode("synth");
                              setSoundtrack(trackId);
                              triggerBeepChime();
                              if (isPlaying) {
                                synthManagerRef.current.stop();
                                if (!isMuted && trackId !== "none") {
                                  setTimeout(() => {
                                    synthManagerRef.current.start(trackId, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
                                  }, 100);
                                }
                              }
                            } else if (val.startsWith("custom:")) {
                              const audioUrl = val.replace("custom:", "");
                              const isMp3Track = CURATED_MP3_LIBRARY.find(t => t.url === audioUrl);
                              setAudioTrackMode("custom");
                              setCustomAudioUrl(audioUrl);
                              if (isMp3Track) {
                                setCustomAudioName(isMp3Track.name);
                              }
                              triggerBeepChime();
                              if (isPlaying) {
                                synthManagerRef.current.stop();
                                if (!isMuted) {
                                  setTimeout(() => {
                                    synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, audioUrl, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
                                  }, 100);
                                }
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-black bg-slate-900 border border-slate-800 rounded-lg text-slate-200 outline-none cursor-pointer focus:border-indigo-500 max-w-[150px] sm:max-w-[200px]"
                        >
                          <option value="silent">🔇 Silent (None)</option>
                          <optgroup label="🎵 Music Library (MP3s)">
                            {CURATED_MP3_LIBRARY.map((track) => (
                              <option key={track.id} value={`custom:${track.url}`}>
                                {track.emoji} {track.name} ({track.duration})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🎹 Synth Loops">
                            {SOUNDTRACK_LIBRARY.filter(t => t.id !== "none").map((track) => (
                              <option key={track.id} value={`synth:${track.id}`}>
                                {track.emoji} {track.name} ({track.bpm} BPM)
                              </option>
                            ))}
                          </optgroup>
                          {customAudioUrl && !CURATED_MP3_LIBRARY.some(t => t.url === customAudioUrl) && (
                            <optgroup label="📂 Your Uploaded File">
                              <option value={`custom:${customAudioUrl}`}>
                                🎧 {customAudioName || "Custom Track"}
                              </option>
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {/* Quick Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="audio/*"
                          id="timeline-audio-uploader"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = URL.createObjectURL(file);
                            setCustomAudioUrl(url);
                            setCustomAudioName(file.name);
                            setAudioTrackMode("custom");
                            setMusicTab("custom");
                            synthManagerRef.current.stop();
                            if (isPlaying) {
                              setTimeout(() => {
                                synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, url, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
                              }, 100);
                            }
                            setToastMessage({
                              text: "🎵 Background Audio Loaded",
                              sub: `"${file.name}" is now the active background track.`,
                              success: true
                            });
                            triggerBeepChime();
                          }}
                        />
                        <label
                          htmlFor="timeline-audio-uploader"
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm select-none"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload File</span>
                        </label>
                      </div>
                    </div>
                  </div>

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
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Caption / Subtitle Text Overlay:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (sttIsListening && sttIndividualSlideId === editingSlide.id) {
                              stopStt();
                            } else {
                              startStt(editingSlide.id);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            sttIsListening && sttIndividualSlideId === editingSlide.id
                              ? "bg-rose-600 text-white animate-pulse shadow-sm"
                              : "bg-slate-850 text-slate-305 hover:bg-slate-800 hover:text-white border border-slate-800"
                          }`}
                          title="Speak to dictate subtitles using Speech-to-Text"
                        >
                          <Mic className="w-2.5 h-2.5" />
                          <span>
                            {sttIsListening && sttIndividualSlideId === editingSlide.id
                              ? "Listening..."
                              : "STT Dictate"}
                          </span>
                        </button>
                      </div>
                      <textarea
                        value={editingSlide.text}
                        onChange={(e) => updateSlideProp(editingSlide.id, "text", e.target.value)}
                        placeholder="Type your caption overlays here or click STT Dictate to speak..."
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
                          <option value="glitch-synth">👾 Cyberpunk Glitch Synth</option>
                          <option value="dreamy-pastel">☁️ Dreamy Soft Pastel</option>
                          <option value="matrix-code">📟 Futuristic Matrix Code</option>
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

        {/* Section: Batch Processing Studio Queue */}
        <div className="border border-slate-150 dark:border-slate-850 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
          <div className="border-b border-slate-150 dark:border-slate-800/80 pb-3 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Batch Processing Studio Queue</span>
            </h4>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full leading-none">
              Batch Mode
            </span>
          </div>

          <p className="text-[11px] font-medium text-slate-550 dark:text-slate-400">
            Upload multiple photos to generate a compiled video sequence or render individual clips for each photo with a single click.
          </p>

          {/* 1. File Upload Dropzone for Batch Queue */}
          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/80 rounded-2xl p-4 text-center transition-all bg-slate-100/40 dark:bg-slate-950/10">
            <input
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleBatchAddFiles(e.target.files);
                }
              }}
              disabled={isBatchProcessing}
            />
            <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1 animate-bounce" />
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop multiple images here</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">or click to browse from device</span>
          </div>

          {/* 2. Generation Mode Selector */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Queue Processing Mode:
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setBatchGenerationMode("individual")}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  batchGenerationMode === "individual"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-450 hover:text-slate-950 dark:hover:text-slate-200"
                }`}
                disabled={isBatchProcessing}
              >
                <span>🎞️ Individual Clips</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchGenerationMode("sequence")}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  batchGenerationMode === "sequence"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-450 hover:text-slate-950 dark:hover:text-slate-200"
                }`}
                disabled={isBatchProcessing}
              >
                <span>📹 Sequence (Stitched)</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {batchGenerationMode === "individual"
                ? "💡 Renders and downloads a separate video/GIF clip for each image one after the other."
                : "💡 Stitches all queued images into a single cinematic timeline for immediate exporting."}
            </p>
          </div>

          {/* 3. Queue List */}
          {batchItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Queued Items ({batchItems.length})</span>
                <button
                  type="button"
                  onClick={handleBatchClear}
                  className="text-rose-500 hover:text-rose-600 cursor-pointer uppercase text-[9px] font-black tracking-widest bg-rose-500/10 dark:bg-rose-500/5 px-2 py-0.5 rounded-md"
                  disabled={isBatchProcessing}
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar animate-fadeIn">
                {batchItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200/50 dark:border-slate-850/80 bg-slate-100/50 dark:bg-slate-950/20"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-900">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-0.5 font-bold rounded-tl">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                        {item.status === "processing" && (
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.status === "pending" && (
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide bg-amber-500/10 dark:bg-amber-500/5 px-1.5 py-0.5 rounded-full select-none">
                          Pending ⏳
                        </span>
                      )}
                      {item.status === "processing" && (
                        <span className="text-[9px] font-extrabold text-blue-500 dark:text-blue-450 uppercase tracking-wide bg-blue-500/10 dark:bg-blue-450/5 px-1.5 py-0.5 rounded-full animate-pulse select-none">
                          {item.progress}% ⚙️
                        </span>
                      )}
                      {item.status === "completed" && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-extrabold text-emerald-500 dark:text-emerald-450 uppercase tracking-wide bg-emerald-500/10 dark:bg-emerald-450/5 px-1.5 py-0.5 rounded-full select-none">
                            Ready! ✅
                          </span>
                          {item.resultUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = item.resultUrl!;
                                a.download = `${item.name.replace(/\.[^/.]+$/, "")}_clip.${exportFormat === "gif" ? "gif" : (exportFormat === "webm" ? "webm" : "mp4")}`;
                                a.click();
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg cursor-pointer"
                              title="Redownload Clip"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                      {item.status === "failed" && (
                        <span className="text-[9px] font-extrabold text-rose-500 dark:text-rose-450 uppercase tracking-wide bg-rose-500/10 dark:bg-rose-450/5 px-1.5 py-0.5 rounded-full select-none">
                          Failed ❌
                        </span>
                      )}

                      {!isBatchProcessing && (
                        <button
                          type="button"
                          onClick={() => handleBatchRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Process Action Button */}
          <button
            type="button"
            onClick={handleStartBatchGeneration}
            disabled={batchItems.length === 0 || isBatchProcessing}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm select-none flex items-center justify-center gap-2 cursor-pointer ${
              batchItems.length === 0
                ? "bg-slate-100 dark:bg-slate-850 text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                : isBatchProcessing
                  ? "bg-indigo-600/50 text-slate-200 cursor-wait animate-pulse"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-md hover:scale-[1.01] active:scale-95"
            }`}
          >
            {isBatchProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Queue...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 animate-bounce" />
                <span>
                  {batchGenerationMode === "individual"
                    ? `Start Batch Rendering (${batchItems.length} Clips)`
                    : `Compile Single Video (${batchItems.length} Slides)`}
                </span>
              </>
            )}
          </button>
        </div>

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

              {/* Quick Clip Actions (Duplicate, Split) */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Frame Actions:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateSlide(selectedSlide.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl border border-slate-200/50 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
                    title="Clone this slide with its filters, captions, and zoom factor"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={splitSlideAtPlayhead}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl border border-slate-200/50 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
                    title="Split this clip into two at the current timeline playhead"
                  >
                    <Scissors className="w-3.5 h-3.5 text-rose-500" />
                    <span>Split Clip</span>
                  </button>
                </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sttIsListening && sttIndividualSlideId === selectedSlide.id) {
                          stopStt();
                        } else {
                          startStt(selectedSlide.id);
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        sttIsListening && sttIndividualSlideId === selectedSlide.id
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                      title="Speak to dictate subtitles using Speech-to-Text"
                    >
                      <Mic className="w-2.5 h-2.5 text-indigo-500" />
                      <span>
                        {sttIsListening && sttIndividualSlideId === selectedSlide.id
                          ? "Listening..."
                          : "Speak Caption"}
                      </span>
                    </button>
                    <span className="text-[10px] text-slate-405 font-mono">{selectedSlide.text.length}/24 chars</span>
                  </div>
                </div>
                <input
                  type="text"
                  maxLength={24}
                  value={selectedSlide.text}
                  onChange={(e) => updateSlideProp(selectedSlide.id, "text", e.target.value)}
                  placeholder="Type overlay subtitles or click Speak Caption..."
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
                    <option value="grayscale">🌑 Grayscale</option>
                    <option value="sepia">🟫 Sepia</option>
                    <option value="high-contrast">⚡ High-Contrast</option>
                    <option value="vintage">📜 Vintage Sepia</option>
                    <option value="noir">⚫ Noir (Greyscale Dark)</option>
                    <option value="cinematic-warm">☀️ Warm Cinematic</option>
                    <option value="cyberpunk">👾 Cyberpunk Hue</option>
                    <option value="vhs">📼 VHS Glitch</option>
                    <option value="retro">🎞️ Retro Film</option>
                    <option value="glitch-synth">👾 Cyberpunk Glitch Synth</option>
                    <option value="dreamy-pastel">☁️ Dreamy Soft Pastel</option>
                    <option value="matrix-code">📟 Futuristic Matrix Code</option>
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
                          synthManagerRef.current.playSingleSfx(val, effectiveSoundtrackVolume);
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
                            synthManagerRef.current.playSingleSfx(selectedSlide.sfx, effectiveSoundtrackVolume);
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
                  <div className="space-y-1 col-span-2 border-t border-slate-100 dark:border-slate-850/50 pt-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Camera Drift Speed:</span>
                      <span className="text-indigo-500 font-bold">{((selectedSlide.motionSpeed !== undefined ? selectedSlide.motionSpeed : 1.0)).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={selectedSlide.motionSpeed !== undefined ? selectedSlide.motionSpeed : 1.0}
                      onChange={(e) => updateSlideProp(selectedSlide.id, "motionSpeed", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="col-span-2 space-y-1.5 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider">
                      ⚡ Quick Ken Burns Presets:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "🔍 Slow Zoom In", scaleStart: 1.0, scaleEnd: 1.25, motionSpeed: 1.0, cameraMovement: "Slow Zoom" },
                        { label: "🔎 Slow Zoom Out", scaleStart: 1.25, scaleEnd: 1.0, motionSpeed: 1.0, cameraMovement: "Slow Zoom" },
                        { label: "◀️ Steady Pan Left", scaleStart: 1.15, scaleEnd: 1.15, motionSpeed: 1.2, cameraMovement: "Pan Left" },
                        { label: "▶️ Steady Pan Right", scaleStart: 1.15, scaleEnd: 1.15, motionSpeed: 1.2, cameraMovement: "Pan Right" },
                        { label: "🛸 Epic Drone Glide", scaleStart: 1.0, scaleEnd: 1.3, motionSpeed: 1.6, cameraMovement: "Cinematic drone shot moving forward" },
                        { label: "✨ Surreal 3D Drift", scaleStart: 1.1, scaleEnd: 1.25, motionSpeed: 1.4, cameraMovement: "Surreal motion graphics, smooth 3D animation" }
                      ].map((preset) => {
                        const isMatching = 
                          selectedSlide.scaleStart === preset.scaleStart && 
                          selectedSlide.scaleEnd === preset.scaleEnd && 
                          selectedSlide.cameraMovement === preset.cameraMovement &&
                          (selectedSlide.motionSpeed ?? 1.0) === preset.motionSpeed;

                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              updateSlideMultipleProps(selectedSlide.id, {
                                scaleStart: preset.scaleStart,
                                scaleEnd: preset.scaleEnd,
                                cameraMovement: preset.cameraMovement,
                                motionSpeed: preset.motionSpeed
                              });
                              triggerBeepChime();
                              setToastMessage({
                                text: `🎬 Applied Preset: ${preset.label.substring(3)}`,
                                sub: "Ken Burns dynamic scale and camera parameters updated.",
                                success: true
                              });
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[9px] font-bold text-left border transition-all cursor-pointer ${
                              isMatching
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
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

              {/* Card: Google Flow AI Image-to-Video Motion Generator */}
              <div className="border border-amber-250/85 dark:border-amber-900/30 p-5 rounded-3xl bg-amber-500/5 dark:bg-amber-500/5 space-y-4">
                <div className="border-b border-amber-200/50 dark:border-amber-900/20 pb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Google Flow AI Motion & Special Effects</span>
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-mono">
                    FLOW VEO v2.0
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Turn this static image into a high-fidelity cinematic video by describing desired motion and special effects.
                </p>

                {/* Status Badges */}
                {selectedSlide.flowAiEffect && selectedSlide.flowAiEffect !== "none" && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-left">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">
                        Active Motion Overlay
                      </span>
                      <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase">
                        {selectedSlide.flowAiEffect === "lightning" && "⚡ LIGHTNING FLASHER"}
                        {selectedSlide.flowAiEffect === "sparks" && "🌀 CYAN ELECTRIC SPARKS"}
                        {selectedSlide.flowAiEffect === "fire-embers" && "🔥 RISING FIRE EMBERS"}
                        {selectedSlide.flowAiEffect === "glitch-cyber" && "👾 CYBER GLITCH PERSPECTIVE"}
                      </div>
                      {selectedSlide.flowAiPrompt && (
                        <p className="text-[9.5px] italic text-slate-450 truncate max-w-[210px] mt-0.5">
                          "{selectedSlide.flowAiPrompt}"
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateSlideProp(selectedSlide.id, "flowAiEffect", "none");
                        updateSlideProp(selectedSlide.id, "flowAiPrompt", "");
                        setToastMessage({
                          text: "Effect removed",
                          sub: "Google Flow AI visual layer cleared from this frame.",
                          success: true
                        });
                        triggerBeepChime();
                      }}
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-650 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Textarea Prompt Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-450 text-left">
                    Describe Motion / Special FX Prompt:
                  </label>
                  <textarea
                    rows={2}
                    value={flowAiPromptText}
                    onChange={(e) => setFlowAiPromptText(e.target.value)}
                    placeholder="Describe the animation (e.g., 'thunder lightning flash over logo, with blue electric sparks circling around it')"
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 dark:text-white"
                  />
                </div>

                {/* Negative Prompt Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-450 text-left">
                    Negative Prompt (Elements to avoid):
                  </label>
                  <textarea
                    rows={1}
                    value={flowAiNegativePromptText}
                    onChange={(e) => setFlowAiNegativePromptText(e.target.value)}
                    placeholder='e.g., "blur, low resolution, bad anatomy, text, watermark, fast motion"'
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 dark:text-white"
                  />
                </div>

                {/* Motion Intensity Range Control */}
                <div className="space-y-2.5 bg-amber-500/5 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/10">
                  <div className="flex justify-between items-center gap-2">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
                      Motion Intensity Preset:
                    </label>
                    <select
                      value={(() => {
                        const matched = [0.4, 1.0, 1.5, 2.0].find(v => Math.abs(v - flowAiIntensityValue) < 0.05);
                        return matched !== undefined ? matched.toString() : "custom";
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          handleIntensityChange(parseFloat(val));
                          triggerBeepChime();
                        }
                      }}
                      className="text-[9.5px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer shadow-sm text-left"
                    >
                      <option value="custom" disabled>Custom ({flowAiIntensityValue.toFixed(1)}x)</option>
                      <option value="0.4">Subtle (0.4x)</option>
                      <option value="1.0">Dynamic (1.0x)</option>
                      <option value="1.5">Cinematic (1.5x)</option>
                      <option value="2.0">Extreme (2.0x)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase">
                      <span className="text-left">Fine-tune Slider:</span>
                      <span className="text-[9.5px] font-mono font-black text-amber-600 dark:text-amber-400">
                        {flowAiIntensityValue.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8.5px] font-black uppercase text-slate-400 font-mono">0.2x</span>
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={flowAiIntensityValue}
                        onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                      <span className="text-[8.5px] font-black uppercase text-slate-400 font-mono">2.0x</span>
                    </div>
                  </div>
                </div>

                {/* Preset Prompt Suggestion bubbles */}
                <div className="space-y-1.5">
                  <span className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400 text-left">
                    💡 Click a Quick Suggestion to load:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-left">
                    {[
                      {
                        label: "⚡ Lightning Strike",
                        prompt: "lightning strike: intense lightning and thunder bolt flashes over image"
                      },
                      {
                        label: "🌀 Electric Sparks",
                        prompt: "electric sparks: glowing neon-blue particle vortex rings rotating around center"
                      },
                      {
                        label: "🔥 Fire Embers",
                        prompt: "fire embers: dynamic warm floating embers rising with ambient heat"
                      },
                      {
                        label: "👾 Glitch Cyber",
                        prompt: "glitch cyber: digital chromatic glitch distortions and neon cyber grids"
                      }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFlowAiPromptText(p.prompt);
                          triggerBeepChime();
                        }}
                        className="px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-amber-400/50 rounded-xl text-[9px] font-extrabold text-slate-700 dark:text-slate-350 transition-all cursor-pointer truncate active:scale-95"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Run Button and Active Flow Progress logs */}
                {isGeneratingFlowAi ? (
                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Flow AI Layer</span>
                      </span>
                      <span className="text-xs font-mono font-black text-amber-500">
                        {flowAiProgress}%
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${flowAiProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350 text-left truncate">
                      Stage: <span className="text-amber-500 font-extrabold uppercase">{flowAiActiveStage}</span>
                    </p>

                    {/* Dynamic logs terminal */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 h-[70px] overflow-y-auto font-mono text-[8.5px] leading-relaxed text-emerald-400 text-left space-y-1">
                      {flowAiLogs.map((log, idx) => (
                        <div key={idx} className="truncate">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSlide && flowAiFailures[selectedSlide.id] && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] rounded-2xl flex items-center gap-2 font-black uppercase tracking-wider text-left">
                        <span>⚠️ Generation failed. Click Regenerate to retry with current parameters.</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleRunFlowAiForSlide}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Run Flow AI</span>
                      </button>

                      {selectedSlide && (flowAiFailures[selectedSlide.id] || (selectedSlide.flowAiEffect && selectedSlide.flowAiEffect !== "none")) && (
                        <button
                          type="button"
                          onClick={handleRunFlowAiForSlide}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-650 hover:to-red-750 text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-97 transition-all"
                          title="Quickly resubmit with existing parameters"
                        >
                          <RotateCcw className="w-4 h-4 text-white" />
                          <span>Regenerate</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                    value={selectedSlide.transitionEffect ?? "Inherit"}
                    onChange={(e) => updateSlideProp(selectedSlide.id, "transitionEffect", e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Inherit">🎬 Use Global Setting</option>
                    <option value="Fade">🎬 Fade Dissolve</option>
                    <option value="Slide">🎬 Slide Motion</option>
                    <option value="Zoom">🎬 Camera Zoom Transition</option>
                    <option value="Blur">🎬 Dreamy Blur Fade</option>
                    <option value="Cross-dissolve">🎬 Cross-Dissolve</option>
                    <option value="Wipe">🎬 Sliding Curtain Wipe</option>
                    <option value="Flash">🎬 Flash Transition</option>
                    <option value="Glitch">🎬 Digital Glitch Wave</option>
                    <option value="None">❌ Cut (No Transition)</option>
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

            {/* Direct Background Audio File Input Card with Drag-and-Drop */}
            <div 
              className={`p-4 rounded-2xl border transition-all text-left space-y-3 shadow-3xs ${
                isAudioDragging
                  ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 scale-[1.01]"
                  : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsAudioDragging(true);
              }}
              onDragLeave={() => setIsAudioDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsAudioDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("audio/")) {
                  setToastMessage({
                    text: "⚠️ Invalid File Format",
                    sub: "Please upload an audio file (MP3, WAV, M4A, etc.)",
                    success: false
                  });
                  return;
                }
                const url = URL.createObjectURL(file);
                setCustomAudioUrl(url);
                setCustomAudioName(file.name);
                setAudioTrackMode("custom");
                setMusicTab("custom");
                synthManagerRef.current.stop();
                if (isPlaying) {
                  setTimeout(() => {
                    synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, url, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
                  }, 100);
                }
                setToastMessage({
                  text: "🎵 Background Audio Loaded",
                  sub: `"${file.name}" is now the active background track.`,
                  success: true
                });
                triggerBeepChime();
              }}
              id="bg-audio-drag-uploader"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  Background Audio File (MP3 / WAV)
                </span>
                {customAudioUrl && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Soundtrack
                  </span>
                )}
              </div>

              {!customAudioUrl ? (
                <div className="relative border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-450 dark:hover:border-indigo-800 rounded-xl transition-all">
                  <input
                    type="file"
                    accept="audio/*"
                    id="direct-bg-audio-uploader-input"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setCustomAudioUrl(url);
                      setCustomAudioName(file.name);
                      setAudioTrackMode("custom");
                      setMusicTab("custom");
                      synthManagerRef.current.stop();
                      if (isPlaying) {
                        setTimeout(() => {
                          synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, url, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
                        }, 100);
                      }
                      setToastMessage({
                        text: "🎵 Background Audio Loaded",
                        sub: `"${file.name}" is now the active background track.`,
                        success: true
                      });
                      triggerBeepChime();
                    }}
                  />
                  <div className="p-4 flex flex-col items-center justify-center text-center space-y-1.5">
                    <Music className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10.5px] font-black text-slate-700 dark:text-slate-300">
                        Upload Your Own Soundtrack File
                      </p>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500">
                        Drag and drop or click here to select background music or sound
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                      🎧 {customAudioName || "Custom Background Track"}
                    </p>
                    <p className="text-[9.5px] text-slate-450 dark:text-slate-500 mt-0.5">
                      Loaded Locally • {customAudioDuration ? formatTime(customAudioDuration) : "Analyzing duration..."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                          synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, customAudioUrl, 0, audioTrimStart, audioTrimEnd, loopAudio);
                          setPreviewingTrack("custom-local");
                        }
                        triggerBeepChime();
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        previewingTrack === "custom-local"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                      title={previewingTrack === "custom-local" ? "Pause Audition" : "Audition Soundtrack"}
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
                          sub: "Reverted back to procedurally synthesized soundtrack.",
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
                                    synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, track.url, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
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
                                synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, track.url, 0, 0, 0, loopAudio);
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
                                    synthManagerRef.current.start(track.id, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
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
                                  synthManagerRef.current.start(track.id, effectiveSoundtrackVolume, audioFadeIn, audioFadeOut, totalDuration, null, 0, 0, 0, loopAudio);
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
                            synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, url, currentTime, audioTrimStart, audioTrimEnd, loopAudio);
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
                              synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, totalDuration, customAudioUrl, 0, audioTrimStart, audioTrimEnd, loopAudio);
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
                        synthManagerRef.current.start("custom", effectiveSoundtrackVolume, false, false, audioTrimEnd - audioTrimStart, customAudioUrl, 0, audioTrimStart, audioTrimEnd, loopAudio);
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

              {/* Master Volume & Audio Mixer Panel */}
              <div className="space-y-3">
                {/* Master Volume */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      {masterVolume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                      🎚️ Master Volume
                    </span>
                    <span className="font-mono text-[10.5px] bg-indigo-100/50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                      {Math.round(masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMasterVolume(val);
                      if (val > 0 && isMuted) {
                        setIsMuted(false);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Soundtrack Volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-emerald-500" />
                      Soundtrack Volume
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
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
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* 🎛️ Live Effects & Synth Customizers Panel */}
                <div className="p-3 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/40 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-100/50 dark:border-emerald-950/30 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      🎛️ Live Synth & Effects Deck
                    </span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Real-time
                    </span>
                  </div>

                  {/* 1. Live Tempo Speed Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        Tempo Speed Multiplier
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                          {synthTempoFactor.toFixed(2)}x
                        </span>
                        <button
                          type="button"
                          onClick={() => setSynthTempoFactor(1.0)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                          title="Reset to 1.0x"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={synthTempoFactor}
                      onChange={(e) => setSynthTempoFactor(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* 2. Resonant Lowpass Filter Cutoff */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-3 h-3 text-emerald-500" />
                        Lowpass Filter Cutoff
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                          {synthFilterCutoff >= 12000 ? "Bypass" : `${synthFilterCutoff} Hz`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSynthFilterCutoff(8000)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                          title="Reset to 8000Hz"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="12000"
                      step="100"
                      value={synthFilterCutoff}
                      onChange={(e) => setSynthFilterCutoff(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                      Muffle the background audio with a smooth, warm filter sweep.
                    </p>
                  </div>

                  {/* 3. Canyon Space Echo Feedback */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-emerald-500" />
                        Spatial Echo Feedback
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                          {synthDelayFeedback === 0 ? "Dry" : `${Math.round(synthDelayFeedback * 100)}%`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSynthDelayFeedback(0.15)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                          title="Reset to 15%"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.85"
                      step="0.05"
                      value={synthDelayFeedback}
                      onChange={(e) => setSynthDelayFeedback(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                      Add a massive 3D ambient delay feedback echo loop.
                    </p>
                  </div>
                </div>

                {/* Voiceover Narration Volume */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-slate-150/50 dark:border-slate-850/40">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mic className={`w-3.5 h-3.5 ${voiceoverEnabled ? "text-indigo-500 animate-pulse" : "text-slate-400"}`} />
                      <span className={voiceoverEnabled ? "text-indigo-700 dark:text-indigo-300 font-extrabold" : ""}>
                        Voiceover Narration
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceoverEnabled(!voiceoverEnabled);
                          triggerBeepChime();
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                          voiceoverEnabled 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {voiceoverEnabled ? "Active" : "Disabled"}
                      </button>
                      <span className="text-slate-500">
                        {Math.round(voiceoverVolume * 100)}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!voiceoverEnabled}
                    value={voiceoverVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVoiceoverVolume(val);
                    }}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${
                      voiceoverEnabled ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-100/50 dark:bg-slate-850 opacity-40 cursor-not-allowed"
                    }`}
                  />
                  {!voiceoverEnabled && (
                    <p className="text-[8.5px] text-slate-400/80 leading-none">
                      Enable Voiceover to activate and adjust relative voice mixing volume.
                    </p>
                  )}
                </div>

                {/* Original Video Volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-blue-500" />
                      Original Video Audio
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {Math.round(originalVideoVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={originalVideoVolume}
                    onChange={(e) => {
                      setOriginalVideoVolume(parseFloat(e.target.value));
                    }}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Balance Slider */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      ⚖️ Mix Balance
                    </span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                      {audioBalance === 0.5 ? "Equal Mix" : audioBalance < 0.5 ? `${Math.round((1 - audioBalance) * 105)}% Soundtrack` : `${Math.round(audioBalance * 100)}% Video`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioBalance}
                    onChange={(e) => {
                      setAudioBalance(parseFloat(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-500 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
                    <span>🎵 Soundtrack Only</span>
                    <span>Equal</span>
                    <span>📹 Video Only</span>
                  </div>
                </div>
              </div>

              {/* Fade & Loop Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Loop Audio */}
                <label className="col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={loopAudio}
                    onChange={(e) => {
                      setLoopAudio(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                      🔄 Loop Background Soundtrack
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Automatically restart the track if it is shorter than your video duration
                    </span>
                  </div>
                </label>

                {/* Auto-Normalize Volume */}
                <label className="col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoNormalize}
                    onChange={(e) => {
                      setAutoNormalize(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        🔊 Auto-Normalize Volume
                      </span>
                      {isNormalizing && (
                        <span className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                          Analyzing...
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Dynamically process and balance track waveforms to maintain a consistent target loudness (-14 dBFS)
                    </span>
                  </div>
                </label>

                {/* Smart Auto-Mix */}
                <label className="col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smartAutoMix}
                    onChange={(e) => {
                      setSmartAutoMix(e.target.checked);
                      triggerBeepChime();
                    }}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        🧠 Smart Auto-Mix (Audio Ducking)
                      </span>
                      {smartAutoMix && (isSpeechSpeaking || isVideoAudioActive) ? (
                        <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 animate-pulse bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="h-1 w-1 bg-amber-500 rounded-full animate-ping"></span>
                          Ducking Active
                        </span>
                      ) : smartAutoMix ? (
                        <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          Ready
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      Intelligently lower soundtrack volume (-12dB) during active voiceover TTS narration or speech segments in video slides
                    </span>
                  </div>
                </label>
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
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Default Image Duration:</span>
                </label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 rounded-lg">
                  {defaultSlideDuration}s per image
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={defaultSlideDuration}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDefaultSlideDuration(val);
                  setSlides((prev) => prev.map((s) => ({ ...s, duration: val, promptDuration: val })));
                }}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Adjust the screen duration for each image. This automatically updates all active slides in the timeline sequence.
              </p>
            </div>

            {/* Video Aspect Ratio selector layout options */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-3">
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

            {/* AI Subtitles Generator block */}
            <div className="border border-indigo-100 dark:border-indigo-950/60 p-4 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Gemini AI Subtitles Generator</span>
                </span>
                <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                  3.5 Flash
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/60 dark:bg-slate-950 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSubtitleGenerationMode("prompt");
                    triggerBeepChime();
                  }}
                  className={`py-1 text-[8.5px] font-extrabold uppercase rounded-lg transition-all cursor-pointer text-center ${
                    subtitleGenerationMode === "prompt"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  📝 Prompt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubtitleGenerationMode("audio");
                    triggerBeepChime();
                  }}
                  className={`py-1 text-[8.5px] font-extrabold uppercase rounded-lg transition-all cursor-pointer text-center ${
                    subtitleGenerationMode === "audio"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  🎵 Audio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubtitleGenerationMode("stt");
                    triggerBeepChime();
                  }}
                  className={`py-1 text-[8.5px] font-extrabold uppercase rounded-lg transition-all cursor-pointer text-center ${
                    subtitleGenerationMode === "stt"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  🎙️ STT Mic
                </button>
              </div>

              {/* Theme Prompt Input Box */}
              {subtitleGenerationMode === "prompt" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                      Narrative Prompt Theme:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSubtitleThemePrompt(userPromptText || "A mysterious journey through the golden mist of autumn");
                        triggerBeepChime();
                      }}
                      className="text-[8.5px] text-indigo-600 hover:text-indigo-500 hover:underline font-bold cursor-pointer"
                    >
                      Sync Video Prompt
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={subtitleThemePrompt}
                    onChange={(e) => setSubtitleThemePrompt(e.target.value)}
                    placeholder={userPromptText || "Describe your narrative arc, lyrics, or cinematic story path..."}
                    className="w-full text-[11px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <p className="text-[8px] text-slate-400 leading-tight">
                    Gemini will compose a perfectly matched story subtitle sequence spread sequentially across all timeline frames.
                  </p>
                </div>
              )}

              {subtitleGenerationMode === "audio" && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-indigo-100/50 bg-indigo-50/10 dark:bg-slate-950/40 text-[10px] space-y-1.5 leading-snug">
                    <span className="font-extrabold block text-indigo-500 dark:text-indigo-400 text-[9px] uppercase tracking-wider">
                      Active Background Audio:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 truncate">
                      <span>🎵</span>
                      <span className="font-bold truncate">
                        {audioTrackMode === "synth"
                          ? SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack)?.name || "Silent"
                          : customAudioName || "Custom Soundtrack Upload"}
                      </span>
                    </div>
                    <div className="text-[8px] text-slate-450 italic leading-normal">
                      {audioTrackMode === "synth"
                        ? SOUNDTRACK_LIBRARY.find(t => t.id === soundtrack)?.desc || "Procedural atmospheric soundtrack"
                        : "User-uploaded background sound track"}
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 leading-tight">
                    Gemini will analyze the theme, bpm, and feel of this track to transcribe or generate beautiful synchronistic subtitle lyric layers.
                  </p>
                </div>
              )}

              {subtitleGenerationMode === "stt" && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-wider">
                      STT Dictation Language:
                    </label>
                    <select
                      value={sttLanguage}
                      onChange={(e) => setSttLanguage(e.target.value)}
                      className="text-[9px] bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-none"
                    >
                      <option value="en-US">🇺🇸 English (US)</option>
                      <option value="es-ES">🇪🇸 Spanish (Spain)</option>
                      <option value="fr-FR">🇫🇷 French (France)</option>
                      <option value="de-DE">🇩🇪 German (Germany)</option>
                      <option value="ja-JP">🇯🇵 Japanese (Japan)</option>
                      <option value="zh-CN">🇨🇳 Chinese (Simplified)</option>
                    </select>
                  </div>

                  {/* Real-time transcription box */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-205 dark:border-slate-850 bg-white/40 dark:bg-slate-950/40 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      <span>Real-time Transcription:</span>
                      {sttIsListening && !sttIndividualSlideId && (
                        <span className="flex items-center gap-1 text-rose-500 animate-pulse font-black text-[8px]">
                          <span className="w-1.5 h-1.5 bg-rose-550 rounded-full" />
                          LISTENING...
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 min-h-[55px] leading-relaxed max-h-[120px] overflow-y-auto pr-1">
                      {sttTranscript ? (
                        <span>"{sttTranscript}"</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Click "Start Dictating" below and speak clearly...</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[8px] text-slate-400 leading-tight">
                    Our Speech-to-Text service listens and transcribes. Click "Apply Subtitles" to divide your sentences across timeline frames!
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sttIsListening) {
                          stopStt();
                        } else {
                          startStt(null); // start global STT
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        sttIsListening && !sttIndividualSlideId
                          ? "bg-rose-600 text-white animate-pulse shadow-sm"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Mic className="w-3 h-3 text-rose-500" />
                      <span>
                        {sttIsListening && !sttIndividualSlideId
                          ? "Stop Mic"
                          : "Start Dictating"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!sttTranscript}
                      onClick={() => {
                        const sentences = sttTranscript.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
                        const words = sttTranscript.split(/\s+/).filter(Boolean);
                        let captions: string[] = [];

                        if (sentences.length > 0) {
                          captions = sentences;
                        } else if (words.length > 0) {
                          const wordsPerSlide = Math.max(3, Math.ceil(words.length / slides.length));
                          for (let i = 0; i < slides.length; i++) {
                            const chunk = words.slice(i * wordsPerSlide, (i + 1) * wordsPerSlide).join(" ");
                            if (chunk) captions.push(chunk);
                          }
                        }

                        if (captions.length > 0) {
                          setSlides(prev => prev.map((slide, idx) => ({
                            ...slide,
                            text: captions[idx] || slide.text || `Scene #${idx + 1}`
                          })));

                          setToastMessage({
                            text: "✨ Subtitles Applied!",
                            sub: `Successfully generated ${Math.min(captions.length, slides.length)} subtitles across your timeline!`,
                            success: true
                          });
                          triggerBeepChime();
                        }
                      }}
                      className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:opacity-40 text-white font-black uppercase tracking-wider text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>Apply Subtitles</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {subtitleGenerationMode !== "stt" && (
                <button
                  type="button"
                  onClick={handleGenerateSubtitles}
                  disabled={isGeneratingSubtitles}
                  className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {isGeneratingSubtitles ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Flow & Generating Subtitles...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Cinematic Subtitles</span>
                    </>
                  )}
                </button>
              )}
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

            {/* Quick Style Presets & Advanced Caption Controls */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Presets & Advanced Subtitle Styling:
                </label>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-1 select-none">
                {[
                  { id: "netflix-preset", name: "🎬 Netflix", style: "netflix", font: "space-grotesk", size: 1.0, text: "#ffffff", bg: "#000000", bgOp: 0.65, stroke: "#000000", strokeW: 0 },
                  { id: "tiktok-preset", name: "📱 Reels", style: "karaoke", font: "bebas-neue", size: 1.3, text: "#facc15", bg: "#000000", bgOp: 0.0, stroke: "#000000", strokeW: 6 },
                  { id: "indie-preset", name: "🌾 Indie", style: "classical", font: "playfair", size: 0.9, text: "#f8fafc", bg: "#000000", bgOp: 0.0, stroke: "#000000", strokeW: 2 },
                  { id: "cyber-preset", name: "👾 Cyber", style: "neon", font: "jetbrains-mono", size: 1.1, text: "#00f0ff", bg: "#1e1b4b", bgOp: 0.8, stroke: "#8b5cf6", strokeW: 4 },
                  { id: "retro-preset", name: "🕹️ Retro", style: "minimal", font: "outfit", size: 1.15, text: "#ec4899", bg: "#000000", bgOp: 0.0, stroke: "#ffffff", strokeW: 4 }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSubtitleStyle(preset.style as any);
                      setSubtitleFont(preset.font);
                      setSubtitleFontSizeFactor(preset.size);
                      setSubtitleTextColor(preset.text);
                      setSubtitleBgColor(preset.bg);
                      setSubtitleBgOpacity(preset.bgOp);
                      setSubtitleStrokeColor(preset.stroke);
                      setSubtitleStrokeWidth(preset.strokeW);
                      triggerBeepChime();
                    }}
                    className="py-1 px-0.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-900 text-[8.5px] font-black text-center hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-650 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-all cursor-pointer truncate"
                    title={`Apply ${preset.name} styling preset`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Subtitle Vertical Align Selector */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Vertical Alignment position:</span>
                <div className="grid grid-cols-3 gap-1.5 select-none">
                  {[
                    { id: "top", label: "⬆️ Top" },
                    { id: "middle", label: "↕️ Center" },
                    { id: "bottom", label: "⬇️ Bottom" }
                  ].map((align) => {
                    const isSelected = subtitleVerticalAlign === align.id;
                    return (
                      <button
                        key={align.id}
                        type="button"
                        onClick={() => {
                          setSubtitleVerticalAlign(align.id as any);
                          triggerBeepChime();
                        }}
                        className={`py-1 rounded-lg border text-center transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-650 text-white shadow-xs font-black text-[9.5px]"
                            : "bg-white dark:bg-slate-950 border-slate-150 hover:border-slate-300 text-slate-700 text-[9px] font-bold"
                        }`}
                      >
                        {align.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders Block */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Font Size slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450">Font Size scale:</span>
                    <span className="text-[9.5px] font-mono font-bold text-slate-500">{subtitleFontSizeFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={subtitleFontSizeFactor}
                    onChange={(e) => setSubtitleFontSizeFactor(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Stroke Width slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450">Stroke thickness:</span>
                    <span className="text-[9.5px] font-mono font-bold text-slate-500">{subtitleStrokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={subtitleStrokeWidth}
                    onChange={(e) => setSubtitleStrokeWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Backdrop Opacity slider */}
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450">Backdrop/Shadow opacity:</span>
                    <span className="text-[9.5px] font-mono font-bold text-slate-500">{Math.round(subtitleBgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={subtitleBgOpacity}
                    onChange={(e) => setSubtitleBgOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Color Pickers Block */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {/* Text Color */}
                <div className="flex flex-col items-center p-1 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 select-none">
                  <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 mb-0.5">Text color</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={subtitleTextColor}
                      onChange={(e) => setSubtitleTextColor(e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500">{subtitleTextColor}</span>
                  </div>
                </div>

                {/* Backdrop Color */}
                <div className="flex flex-col items-center p-1 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 select-none">
                  <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 mb-0.5">Backdrop color</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={subtitleBgColor}
                      onChange={(e) => setSubtitleBgColor(e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500">{subtitleBgColor}</span>
                  </div>
                </div>

                {/* Stroke/Glow Color */}
                <div className="flex flex-col items-center p-1 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 select-none">
                  <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 mb-0.5">Stroke/Glow</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={subtitleStrokeColor}
                      onChange={(e) => setSubtitleStrokeColor(e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500">{subtitleStrokeColor}</span>
                  </div>
                </div>
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

            {/* Output Resolution Dropdown Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quality / Resolution:
                </label>
                <span className="text-[10px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shadow-sm">
                  {(() => {
                    let w = 1920;
                    if (exportResolution === "720p") {
                      w = aspectRatio === "9:16" ? 720 : 1280;
                    } else if (exportResolution === "1080p") {
                      w = aspectRatio === "9:16" ? 1080 : 1920;
                    } else if (exportResolution === "4K") {
                      w = aspectRatio === "9:16" ? 2160 : 3840;
                    }
                    let h = Math.round(w * (9 / 16));
                    if (aspectRatio === "9:16") {
                      h = Math.round(w * (16 / 9));
                    } else if (aspectRatio === "1:1") {
                      h = w;
                    }
                    return `${w} × ${h} px`;
                  })()}
                </span>
              </div>
              <select
                value={exportResolution}
                onChange={(e) => {
                  setExportResolution(e.target.value as any);
                  triggerBeepChime();
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-extrabold cursor-pointer shadow-sm"
              >
                <option value="720p">720p HD Standard (Fast Rendering)</option>
                <option value="1080p">1080p Full HD (High Quality & Sharp)</option>
                <option value="4K">4K Ultra HD (Cinematic Masterpiece)</option>
              </select>
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
