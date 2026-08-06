import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  Bot, 
  Play, 
  Square, 
  Settings, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Sliders,
  Check
} from "lucide-react";

interface VoiceAssistantProps {
  theme?: "light" | "dark";
}

// Convert Float32Array PCM (-1.0 to 1.0) to 16-bit PCM Base64 string
function pcmFloat32ToBase64Pcm16(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 16-bit PCM to AudioBuffer for 24kHz playback
function base64Pcm16ToAudioBuffer(
  base64: string, 
  audioCtx: AudioContext, 
  sampleRate: number = 24000
): AudioBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  const audioBuffer = audioCtx.createBuffer(1, float32.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}

export function VoiceAssistant({ theme = "light" }: VoiceAssistantProps) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "active" | "speaking" | "error">("disconnected");
  const [voiceName, setVoiceName] = useState<string>("Zephyr");
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "You are a helpful, natural, and friendly AI voice assistant for digital creators. Keep your answers clear, concise, and conversational."
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ sender: "user" | "model"; text: string; time: string }>>([]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  // Web Audio & WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopSession = () => {
    // Stop mic stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio contexts
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    // Stop output sources
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
    setVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    stopSession();
    setStatus("connecting");
    setErrorMsg(null);

    try {
      // 1. Get User Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup Input AudioContext (16kHz for Gemini Live input)
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      // 3. Setup Output AudioContext (24kHz for Gemini Live audio output)
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      // 4. Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(voiceName)}&systemInstruction=${encodeURIComponent(systemInstruction)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Live Voice] WebSocket connected");
        setStatus("active");
        
        // Connect mic stream to processor
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const channelData = e.inputBuffer.getChannelData(0);
            
            // Calculate RMS volume level for UI visualizer
            let sum = 0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sum / channelData.length);
            setVolumeLevel(Math.min(100, Math.round(rms * 400)));

            const base64Pcm = pcmFloat32ToBase64Pcm16(channelData);
            ws.send(JSON.stringify({ audio: base64Pcm }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.error) {
            setErrorMsg(msg.error);
            setStatus("error");
            stopSession();
            return;
          }

          if (msg.interrupted) {
            // Stop current playback sources on user interrupt
            activeSourcesRef.current.forEach((src) => {
              try { src.stop(); } catch (e) {}
            });
            activeSourcesRef.current = [];
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setStatus("active");
          }

          if (msg.modelText) {
            setTranscripts(prev => [
              ...prev,
              { sender: "model", text: msg.modelText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
          }

          if (msg.audio && outputAudioCtxRef.current) {
            setStatus("speaking");
            const audioBuffer = base64Pcm16ToAudioBuffer(msg.audio, outputAudioCtxRef.current, 24000);
            const sourceNode = outputAudioCtxRef.current.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(outputAudioCtxRef.current.destination);

            const now = outputAudioCtxRef.current.currentTime;
            if (nextStartTimeRef.current < now) {
              nextStartTimeRef.current = now;
            }

            sourceNode.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;

            activeSourcesRef.current.push(sourceNode);

            sourceNode.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== sourceNode);
              if (activeSourcesRef.current.length === 0) {
                setStatus("active");
              }
            };
          }
        } catch (err: any) {
          console.error("Error handling WebSocket audio message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setErrorMsg("Failed to connect to Live Voice server endpoint.");
        setStatus("error");
        stopSession();
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        if (status !== "error") {
          setStatus("disconnected");
        }
      };

    } catch (err: any) {
      console.error("Failed to start Live Audio session:", err);
      setErrorMsg(err.message || "Failed to access microphone or connect to Live API.");
      setStatus("error");
      stopSession();
    }
  };

  return (
    <div className={`max-w-4xl mx-auto rounded-3xl border overflow-hidden shadow-xl p-6 sm:p-8 space-y-8 ${
      theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Live Voice Studio</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                gemini-3.1-flash-live-preview
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Low-latency real-time voice conversation engine using Gemini Live API
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono border ${
            status === "active"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : status === "speaking"
                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/30 animate-pulse"
                : status === "connecting"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : status === "error"
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === "active" ? "bg-emerald-500 animate-ping" :
              status === "speaking" ? "bg-indigo-500 animate-bounce" :
              status === "connecting" ? "bg-amber-500 animate-spin" :
              status === "error" ? "bg-rose-500" : "bg-slate-400"
            }`} />
            <span className="capitalize">{status === "speaking" ? "Gemini Speaking" : status}</span>
          </span>
        </div>
      </div>

      {/* Main Interactive Stage & Audio Waveform Visualizer */}
      <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center space-y-6 text-center relative overflow-hidden transition-all ${
        theme === "dark" 
          ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800" 
          : "bg-gradient-to-b from-slate-50 to-indigo-50/30 border-slate-200"
      }`}>
        {/* Glow Aura Background Effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-rose-500/10 rounded-3xl blur-2xl transition-opacity duration-500"
          style={{ opacity: status === "speaking" || status === "active" ? 1 : 0.2 }}
        />

        {/* Dynamic Pulsing Visualizer Orbs */}
        <div className="relative z-10 flex items-center justify-center">
          <div 
            className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              status === "speaking"
                ? "bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 scale-110 shadow-indigo-500/50"
                : status === "active"
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/40"
                  : status === "connecting"
                    ? "bg-gradient-to-tr from-amber-500 to-orange-500 animate-pulse"
                    : "bg-slate-800 border-4 border-slate-700"
            }`}
            style={{
              transform: status === "active" ? `scale(${1 + volumeLevel / 150})` : undefined
            }}
          >
            <div className="w-28 h-28 rounded-full bg-slate-950 flex flex-col items-center justify-center text-white">
              {status === "speaking" ? (
                <Volume2 className="w-10 h-10 text-indigo-400 animate-bounce" />
              ) : status === "active" ? (
                <Mic className="w-10 h-10 text-emerald-400 animate-pulse" />
              ) : status === "connecting" ? (
                <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
              ) : (
                <MicOff className="w-10 h-10 text-slate-500" />
              )}
            </div>
          </div>
        </div>

        {/* Audio Input Level Meter Bar */}
        {status === "active" && (
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-rose-400 transition-all duration-75"
              style={{ width: `${volumeLevel}%` }}
            />
          </div>
        )}

        {/* Action Toggle Button */}
        <div className="relative z-10 flex items-center justify-center gap-4">
          {status === "disconnected" || status === "error" ? (
            <button
              onClick={startSession}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span>Start Live Conversation</span>
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>End Voice Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuration Drawer: Voice Selection & Persona */}
      <div className={`p-6 rounded-2xl border space-y-4 ${
        theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Voice & Persona Settings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-300">
              Voice Character
            </label>
            <select
              disabled={status !== "disconnected"}
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                theme === "dark" ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              <option value="Zephyr">Zephyr (Balanced & Warm)</option>
              <option value="Kore">Kore (Clear & Professional)</option>
              <option value="Puck">Puck (Energetic & Friendly)</option>
              <option value="Charon">Charon (Deep & Direct)</option>
              <option value="Fenrir">Fenrir (Confident & Expressive)</option>
            </select>
          </div>

          {/* System Instruction */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-300">
              AI Persona / System Instruction
            </label>
            <input
              type="text"
              disabled={status !== "disconnected"}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                theme === "dark" ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Text Transcript Feed */}
      {transcripts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Live Conversation Transcript
          </h4>
          <div className={`max-h-48 overflow-y-auto p-4 rounded-2xl border space-y-2 text-xs font-sans ${
            theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            {transcripts.map((t, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 font-mono">[{t.time}] Gemini:</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
