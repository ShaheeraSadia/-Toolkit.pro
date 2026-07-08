// Web Audio API Procedural Ambient Sound Synthesizer
// Generates high-fidelity, infinite, non-loop-point focus sounds completely in-browser

export type AmbientSoundType = "none" | "rain" | "cafe" | "ocean" | "white" | "thunderstorm" | "forest" | "fireplace";

class AmbientSynthClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private activeSound: AmbientSoundType = "none";
  private currentVolume = (() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ambient-volume");
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    }
    return 0.35;
  })();

  // Sound-specific nodes
  private waveOscillator: OscillatorNode | null = null;
  private waveGain: GainNode | null = null;
  private waveLfo: OscillatorNode | null = null;
  private chatterFilter: BiquadFilterNode | null = null;
  private chatterGain: GainNode | null = null;

  // Forest & fire-specific nodes
  private windOsc: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private fireplaceLowSource: AudioBufferSourceNode | null = null;
  private fireplaceFilter: BiquadFilterNode | null = null;

  // Timer trackers for randomized procedural events (droplets, clinks, thunders, birds, crackles)
  private dropletTimer: any = null;
  private clinkTimer: any = null;
  private thunderTimer: any = null;
  private birdTimer: any = null;
  private crackleTimer: any = null;

  constructor() {
    // Lazy initialization on first play to obey browser autoplay restrictions
  }

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64; // small fft size is perfectly enough for a tiny elegant dropdown visualizer
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
  }

  // Helper: Generates Pink Noise Buffer
  // Pink noise has a spectral density of 1/f and sounds much warmer and more natural than white noise
  private createPinkNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // compensate peak amplification
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Helper: Generates Brown Noise Buffer
  // Brown noise has a 1/f^2 spectral density, resulting in a deep, rumbling lower-frequency profile
  private createBrownNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // boost back to standard amplitude levels
    }
    return buffer;
  }

  // Helper: Generates White Noise Buffer
  private createWhiteNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Plays a randomized rain droplet hit
  private playRaindroplet() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    // Randomized high resonance tone
    const startFreq = 1600 + Math.random() * 2400;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.05);

    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 1.0;

    const dropletVolume = 0.025 * Math.random();
    gain.gain.setValueAtTime(dropletVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Loop timer for scheduling raindrops in a natural organic pattern
  private scheduleRaindrops() {
    if (!this.isPlaying) return;
    this.playRaindroplet();
    // Rain droplets strike with irregular spacing
    const delay = 10 + Math.random() * 55;
    this.dropletTimer = setTimeout(() => this.scheduleRaindrops(), delay);
  }

  // Plays a metallic cup, plate or spoon clink for the coffee shop environment
  private playCafeClink() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Coffee shop clinks are highly resonant metallic sounds with multiple dissonant components
    const f1 = 2800 + Math.random() * 1200;
    const f2 = 4200 + Math.random() * 1800;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(f1, this.ctx.currentTime);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(f2, this.ctx.currentTime);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    const clinkVol = 0.003 + Math.random() * 0.006;
    gainNode.gain.setValueAtTime(clinkVol, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(this.ctx.currentTime);
    osc2.start(this.ctx.currentTime);
    osc1.stop(this.ctx.currentTime + 0.2);
    osc2.stop(this.ctx.currentTime + 0.2);
  }

  // Loop timer for cafe events
  private scheduleCafeEvents() {
    if (!this.isPlaying) return;
    this.playCafeClink();
    // Clinks happen periodically, every 2 to 9 seconds
    const delay = 2500 + Math.random() * 6500;
    this.clinkTimer = setTimeout(() => this.scheduleCafeEvents(), delay);
  }

  // Distant or sharp crackling thunder strikes
  private playThunder() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const isClose = Math.random() > 0.6; // some close, some distant

    // 1. Rumble base (Brown noise with lowpass filter)
    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = this.createBrownNoiseBuffer();
    rumbleSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    
    // Thunder rumble envelope
    const duration = 4.0 + Math.random() * 5.0; // 4 to 9 seconds rumble
    gain.gain.setValueAtTime(0.001, now);
    if (isClose) {
      // Sudden sharp thunder crack
      gain.gain.exponentialRampToValueAtTime(0.12 * Math.random() + 0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.8);
    } else {
      // Distant rolling thunder
      gain.gain.linearRampToValueAtTime(0.06 * Math.random() + 0.03, now + 1.2);
    }
    
    // Add rumble jitter/rolling effect using a slow gain modulation
    const modOsc = this.ctx.createOscillator();
    modOsc.type = "sine";
    modOsc.frequency.setValueAtTime(5 + Math.random() * 8, now); // 5-13 Hz shaking
    
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(0.02, now); // modulation depth

    modOsc.connect(modGain);
    modGain.connect(filter.frequency); // modulate lowpass cutoff for rolling sound
    
    // Exponential decay of rumble
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    rumbleSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    modOsc.start(now);
    rumbleSource.start(now);

    modOsc.stop(now + duration);
    rumbleSource.stop(now + duration);

    // 2. High-freq crackle for close strikes
    if (isClose) {
      const crackleSource = this.ctx.createBufferSource();
      crackleSource.buffer = this.createPinkNoiseBuffer();
      
      const crackleFilter = this.ctx.createBiquadFilter();
      crackleFilter.type = "bandpass";
      crackleFilter.frequency.setValueAtTime(800, now);
      
      const crackleGain = this.ctx.createGain();
      crackleGain.gain.setValueAtTime(0.05, now);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      crackleSource.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(this.masterGain);

      crackleSource.start(now);
      crackleSource.stop(now + 0.55);
    }
  }

  // Loop timer for thunderstorm rolls
  private scheduleThunder() {
    if (!this.isPlaying) return;
    this.playThunder();
    // Thunder rolls every 15 to 35 seconds
    const delay = 12000 + Math.random() * 20000;
    this.thunderTimer = setTimeout(() => this.scheduleThunder(), delay);
  }

  // High-pitched sweet procedural bird chirps
  private playBirdChirp() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const numChirps = 2 + Math.floor(Math.random() * 3); // 2 to 4 rapid chirps
    const baseFreq = 2200 + Math.random() * 1000; // unique pitch for this bird
    const sweepRange = 1000 + Math.random() * 800; // pitch sweep depth
    const duration = 0.08 + Math.random() * 0.07; // duration of one single chirp

    let startTime = now;
    for (let i = 0; i < numChirps; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, startTime);
      // Pitch sweeps upwards rapidly
      osc.frequency.exponentialRampToValueAtTime(baseFreq + sweepRange, startTime + duration);

      filter.type = "bandpass";
      filter.frequency.value = baseFreq + sweepRange / 2;
      filter.Q.value = 1.0;

      const chirpVol = 0.008 + Math.random() * 0.012;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(chirpVol, startTime + duration * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);

      // spacing between individual chirps in a single call
      startTime += duration + 0.04 + Math.random() * 0.06;
    }
  }

  // Loop timer for bird calls
  private scheduleBirds() {
    if (!this.isPlaying) return;
    this.playBirdChirp();
    // Birds sing every 5 to 14 seconds
    const delay = 4500 + Math.random() * 9500;
    this.birdTimer = setTimeout(() => this.scheduleBirds(), delay);
  }

  // Fire crackling popping sound generator
  private playFireCrackle() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Generate a tiny sharp burst of noise (crackle pop)
    const popSource = this.ctx.createBufferSource();
    popSource.buffer = this.createWhiteNoiseBuffer();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2500 + Math.random() * 3500, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    const duration = 0.003 + Math.random() * 0.008; // 3ms to 11ms popping impulse
    
    const popVol = 0.012 + Math.random() * 0.024;
    gain.gain.setValueAtTime(popVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    popSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    popSource.start(now);
    popSource.stop(now + duration + 0.01);

    // Sometimes play a slightly deeper wooden "thud" or "snap"
    if (Math.random() > 0.88) {
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      
      snapOsc.type = "triangle";
      snapOsc.frequency.setValueAtTime(150 + Math.random() * 100, now);
      snapOsc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

      snapGain.gain.setValueAtTime(0.018 * Math.random(), now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      snapOsc.connect(snapGain);
      snapGain.connect(this.masterGain);

      snapOsc.start(now);
      snapOsc.stop(now + 0.05);
    }
  }

  // Loop timer for fire embers crackles
  private scheduleFireCrackles() {
    if (!this.isPlaying) return;
    this.playFireCrackle();
    // Crackles strike very rapidly at randomized intervals (average 8-15 per second)
    const delay = 35 + Math.random() * 125;
    this.crackleTimer = setTimeout(() => this.scheduleFireCrackles(), delay);
  }

  // Stop current active noise sources cleanly
  private stopActiveNodes() {
    // Clear scheduled timers
    if (this.dropletTimer) {
      clearTimeout(this.dropletTimer);
      this.dropletTimer = null;
    }
    if (this.clinkTimer) {
      clearTimeout(this.clinkTimer);
      this.clinkTimer = null;
    }
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    if (this.birdTimer) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.crackleTimer) {
      clearTimeout(this.crackleTimer);
      this.crackleTimer = null;
    }

    // Stop and disconnect primary noise buffer source
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch (e) {
        // Source might have been stopped already
      }
      this.noiseSource = null;
    }

    // Ocean swell oscillators
    if (this.waveLfo) {
      try { this.waveLfo.stop(); this.waveLfo.disconnect(); } catch (e) {}
      this.waveLfo = null;
    }
    if (this.waveOscillator) {
      try { this.waveOscillator.stop(); this.waveOscillator.disconnect(); } catch (e) {}
      this.waveOscillator = null;
    }
    if (this.waveGain) {
      try { this.waveGain.disconnect(); } catch (e) {}
      this.waveGain = null;
    }

    // Coffee chatter elements
    if (this.chatterFilter) {
      try { this.chatterFilter.disconnect(); } catch (e) {}
      this.chatterFilter = null;
    }
    if (this.chatterGain) {
      try { this.chatterGain.disconnect(); } catch (e) {}
      this.chatterGain = null;
    }

    // Forest wind elements
    if (this.windOsc) {
      try { this.windOsc.stop(); this.windOsc.disconnect(); } catch (e) {}
      this.windOsc = null;
    }
    if (this.windGain) {
      try { this.windGain.disconnect(); } catch (e) {}
      this.windGain = null;
    }
    if (this.windFilter) {
      try { this.windFilter.disconnect(); } catch (e) {}
      this.windFilter = null;
    }

    // Fireplace base roar elements
    if (this.fireplaceLowSource) {
      try { this.fireplaceLowSource.stop(); this.fireplaceLowSource.disconnect(); } catch (e) {}
      this.fireplaceLowSource = null;
    }
    if (this.fireplaceFilter) {
      try { this.fireplaceFilter.disconnect(); } catch (e) {}
      this.fireplaceFilter = null;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getActiveSound(): AmbientSoundType {
    return this.activeSound;
  }

  public isSoundPlaying(): boolean {
    return this.isPlaying;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public stop() {
    this.isPlaying = false;
    this.activeSound = "none";
    this.stopActiveNodes();
    if (this.ctx && this.ctx.state === "running") {
      // Suspend context to save resources when inactive
      this.ctx.suspend().catch((e) => console.warn("Failed to suspend AudioContext:", e));
    }
  }

  public play(sound: AmbientSoundType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Wake context if suspended
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch((e) => console.warn("Failed to resume AudioContext:", e));
    }

    // If same sound is already playing, do nothing
    if (sound === this.activeSound && this.isPlaying) {
      return;
    }

    // Stop current sound first
    this.stopActiveNodes();

    if (sound === "none") {
      this.isPlaying = false;
      this.activeSound = "none";
      return;
    }

    this.isPlaying = true;
    this.activeSound = sound;
    const now = this.ctx.currentTime;

    switch (sound) {
      case "white": {
        // Standard white noise slightly muffled for long-term comfort
        const buffer = this.createWhiteNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(3200, now);

        this.noiseSource.connect(filter);
        filter.connect(this.masterGain);
        this.noiseSource.start(now);
        break;
      }

      case "ocean": {
        // Deep brown noise representing oceanic power
        const buffer = this.createBrownNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(450, now);

        // Sine LFO that modulates the gain to simulate tidal wave swell
        this.waveGain = this.ctx.createGain();
        this.waveGain.gain.setValueAtTime(0.4, now);

        this.waveLfo = this.ctx.createOscillator();
        this.waveLfo.type = "sine";
        this.waveLfo.frequency.value = 0.08; // extremely slow oscillation (approx 12 seconds per tide wave)

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.35; // depth of tidal swells

        // Connect LFO modulation chain
        this.waveLfo.connect(lfoGain);
        lfoGain.connect(this.waveGain.gain);

        this.noiseSource.connect(lowpass);
        lowpass.connect(this.waveGain);
        this.waveGain.connect(this.masterGain);

        this.waveLfo.start(now);
        this.noiseSource.start(now);
        break;
      }

      case "rain": {
        // High-fidelity natural storm simulation
        // 1. Continuous rain wash (Pink noise with broadband bandpass filtering)
        const washBuffer = this.createPinkNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = washBuffer;
        this.noiseSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(1400, now);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(250, now);

        this.noiseSource.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(this.masterGain);
        this.noiseSource.start(now);

        // 2. Randomized crisp rain droplets
        this.scheduleRaindrops();
        break;
      }

      case "cafe": {
        // Cozy ambient coffeehouse atmosphere
        // 1. Rumble wash (Deep lowpassed brown noise to simulate room ventilation/crowd body)
        const rumbleBuffer = this.createBrownNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = rumbleBuffer;
        this.noiseSource.loop = true;

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = "lowpass";
        rumbleFilter.frequency.setValueAtTime(250, now);

        const rumbleGain = this.ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.65, now);

        this.noiseSource.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(this.masterGain);
        this.noiseSource.start(now);

        // 2. Continuous speech-like murmuring chatter (bandpassed noise with slow envelope oscillations)
        const chatterBuffer = this.createPinkNoiseBuffer();
        const chatterSource = this.ctx.createBufferSource();
        chatterSource.buffer = chatterBuffer;
        chatterSource.loop = true;

        this.chatterFilter = this.ctx.createBiquadFilter();
        this.chatterFilter.type = "bandpass";
        this.chatterFilter.frequency.setValueAtTime(450, now);
        this.chatterFilter.Q.setValueAtTime(1.5, now);

        this.chatterGain = this.ctx.createGain();
        this.chatterGain.gain.setValueAtTime(0.12, now);

        // Slow varying filter sweep to mimic voice rise and falls
        const vocalOsc = this.ctx.createOscillator();
        vocalOsc.type = "sine";
        vocalOsc.frequency.value = 0.25; // 4 second swell

        const vocalMod = this.ctx.createGain();
        vocalMod.gain.value = 100;

        vocalOsc.connect(vocalMod);
        vocalMod.connect(this.chatterFilter.frequency);

        chatterSource.connect(this.chatterFilter);
        this.chatterFilter.connect(this.chatterGain);
        this.chatterGain.connect(this.masterGain);

        vocalOsc.start(now);
        chatterSource.start(now);

        // Save reference so we can stop chatter source during cleanups
        const originalStopActive = this.stopActiveNodes.bind(this);
        this.stopActiveNodes = () => {
          originalStopActive();
          try {
            vocalOsc.stop();
            vocalOsc.disconnect();
          } catch (e) {}
          try {
            chatterSource.stop();
            chatterSource.disconnect();
          } catch (e) {}
        };

        // 3. Periodic metal cutlery / porcelain coffee cup clinks
        this.scheduleCafeEvents();
        break;
      }

      case "thunderstorm": {
        // Continuous background storm rain wash
        const washBuffer = this.createPinkNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = washBuffer;
        this.noiseSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(800, now); // darker than standard rain

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(150, now);

        this.noiseSource.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(this.masterGain);
        this.noiseSource.start(now);

        // Schedule rain drops & thunder strikes
        this.scheduleRaindrops();
        this.scheduleThunder();
        break;
      }

      case "forest": {
        // Continuous organic leaf rustle wind
        const windBuffer = this.createPinkNoiseBuffer();
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = windBuffer;
        this.noiseSource.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = "bandpass";
        this.windFilter.frequency.setValueAtTime(500, now);
        this.windFilter.Q.setValueAtTime(1.0, now);

        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(0.2, now); // soft base volume

        // Low frequency oscillator for rustling breeze sweeps
        this.windOsc = this.ctx.createOscillator();
        this.windOsc.type = "sine";
        this.windOsc.frequency.value = 0.05; // 20-second cycles

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 250; // sweep range ±250Hz

        // Modulation connections
        this.windOsc.connect(lfoGain);
        lfoGain.connect(this.windFilter.frequency);

        this.noiseSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);

        this.windOsc.start(now);
        this.noiseSource.start(now);

        // Schedule randomized sweet woodland birds
        this.scheduleBirds();
        break;
      }

      case "fireplace": {
        // Continuous low log fire flame rumble
        const roarBuffer = this.createBrownNoiseBuffer();
        this.fireplaceLowSource = this.ctx.createBufferSource();
        this.fireplaceLowSource.buffer = roarBuffer;
        this.fireplaceLowSource.loop = true;

        this.fireplaceFilter = this.ctx.createBiquadFilter();
        this.fireplaceFilter.type = "lowpass";
        this.fireplaceFilter.frequency.setValueAtTime(100, now); // extremely warm low embers

        const rumbleGain = this.ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.5, now);

        // Fire flame flutter (slightly dynamic volume)
        const flutterOsc = this.ctx.createOscillator();
        flutterOsc.type = "sine";
        flutterOsc.frequency.value = 1.8; // 1.8Hz small combustion sweeps

        const flutterGain = this.ctx.createGain();
        flutterGain.gain.value = 0.12;

        flutterOsc.connect(flutterGain);
        flutterGain.connect(rumbleGain.gain);

        this.fireplaceLowSource.connect(this.fireplaceFilter);
        this.fireplaceFilter.connect(rumbleGain);
        rumbleGain.connect(this.masterGain);

        flutterOsc.start(now);
        this.fireplaceLowSource.start(now);

        // Save reference for cleanups
        const originalStopActive = this.stopActiveNodes.bind(this);
        this.stopActiveNodes = () => {
          originalStopActive();
          try {
            flutterOsc.stop();
            flutterOsc.disconnect();
          } catch (e) {}
        };

        // Schedule fireplace crackles & logs popping
        this.scheduleFireCrackles();
        break;
      }
    }
  }
}

// Single instance exported globally so playing state is preserved across components and view swaps
export const ambientSynth = new AmbientSynthClass();
