import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Code2, 
  Palette, 
  Zap, 
  PenTool, 
  RefreshCw,
  Cpu,
  Download,
  ShieldAlert
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  modelUsed?: string;
  systemRole?: string;
}

interface GeminiChatbotProps {
  theme?: "light" | "dark";
}

export function GeminiChatbot({ theme = "light" }: GeminiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("toolkit-pro-gemini-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "welcome-1",
        role: "model",
        content: "Hello! I am your AI Assistant powered by Google Gemini. How can I help you build, design, code, or generate content today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: "gemini-3.5-flash",
        systemRole: "general"
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [systemRole, setSystemRole] = useState<string>("general");
  const [modelChoice, setModelChoice] = useState<string>("gemini-3.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem("toolkit-pro-gemini-chat-history", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customText) setInputMessage("");
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Build history for API endpoint (excluding system welcome message if desired)
      const historyPayload = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyPayload,
          message: textToSend.trim(),
          modelChoice,
          systemRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to receive response from Gemini.");
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.reply || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || modelChoice,
        systemRole
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err.message || "An error occurred while talking to Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the conversation history?")) {
      const resetMsgs: ChatMessage[] = [
        {
          id: Date.now().toString(),
          role: "model",
          content: "Conversation history cleared. What would you like to explore next?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: modelChoice,
          systemRole
        }
      ];
      setMessages(resetMsgs);
      localStorage.removeItem("toolkit-pro-gemini-chat-history");
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const text = messages
      .map(m => `[${m.timestamp}] ${m.role === "user" ? "User" : "Gemini"}: ${m.content}`)
      .join("\n\n");
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gemini-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickPills = [
    { label: "Refactor React Hook", icon: Code2, role: "code_expert", model: "gemini-3.1-pro-preview", prompt: "How do I optimize a complex React useEffect hook to prevent unnecessary re-renders?" },
    { label: "Design Palette Advice", icon: Palette, role: "design_guru", model: "gemini-3.5-flash", prompt: "Suggest a modern WCAG-compliant color palette for a fintech dashboard with high contrast." },
    { label: "Draft SEO Meta Tags", icon: PenTool, role: "copywriter", model: "gemini-3.5-flash", prompt: "Write compelling SEO titles and meta descriptions for a cloud file conversion tool." },
    { label: "Fast Code Explanation", icon: Zap, role: "fast_helper", model: "gemini-3.1-flash-lite", prompt: "Explain the difference between WebSockets and Server-Sent Events (SSE) in 3 bullet points." }
  ];

  return (
    <div className={`flex flex-col h-[calc(100vh-140px)] min-h-[600px] max-w-6xl mx-auto rounded-3xl border overflow-hidden shadow-xl ${
      theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
    }`}>
      {/* Header Controls Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
        theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">Gemini AI Chatbot</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Multi-Turn Thread
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Interactive multi-turn conversation engine powered by Google Gemini
            </p>
          </div>
        </div>

        {/* Controls: Persona Role & Model Choice */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Persona Role Select */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-2">Role:</span>
            <select
              aria-label="Select AI System Role Persona"
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value)}
              className={`text-xs font-bold rounded-lg px-2.5 py-1 border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                theme === "dark" ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"
              }`}
            >
              <option value="general">General Assistant</option>
              <option value="code_expert">Senior Dev & Architect</option>
              <option value="design_guru">UI/UX Designer</option>
              <option value="fast_helper">Fast Helper</option>
              <option value="copywriter">Brand Copywriter</option>
            </select>
          </div>

          {/* Model Selection */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/50">
            <Cpu className="w-3.5 h-3.5 text-indigo-500 ml-1.5" />
            <select
              aria-label="Select Gemini Model"
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
              className={`text-xs font-bold rounded-lg px-2.5 py-1 border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                theme === "dark" ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"
              }`}
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Reasoning)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Speed)</option>
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleExportTranscript}
            title="Export Conversation Transcript"
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Pills Bar */}
      <div className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 ${
        theme === "dark" ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-100/60 border-slate-200/60"
      }`}>
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Prompts:
        </span>
        {quickPills.map((pill, idx) => {
          const PillIcon = pill.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                setSystemRole(pill.role);
                setModelChoice(pill.model);
                handleSendMessage(pill.prompt);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800/60 hover:bg-indigo-900/40 border-slate-700 hover:border-indigo-500/50 text-slate-300"
                  : "bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-700 shadow-2xs"
              }`}
            >
              <PillIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-4xl ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              msg.role === "user"
                ? "bg-indigo-600 text-white"
                : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-1.5 max-w-[85%] ${msg.role === "user" ? "items-end text-right" : "items-start"}`}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono text-slate-400">
                  {msg.role === "user" ? "You" : "Gemini AI"} • {msg.timestamp}
                </span>
                {msg.modelUsed && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {msg.modelUsed}
                  </span>
                )}
              </div>

              <div className={`p-4 rounded-2xl relative group ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                  : theme === "dark"
                    ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                    : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none"
              }`}>
                {/* Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                  {msg.content}
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.role === "user"
                      ? "text-indigo-200 hover:bg-indigo-700"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 mr-auto max-w-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className={`p-4 rounded-2xl rounded-tl-none border flex items-center gap-3 ${
              theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs font-medium">Gemini is thinking and composing a response...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 max-w-2xl mx-auto">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className={`p-4 border-t shrink-0 ${
        theme === "dark" ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-3 max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini anything... (Press Enter to send, Shift+Enter for new line)"
              rows={2}
              className={`w-full px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
                theme === "dark"
                  ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3.5 rounded-2xl font-bold text-white transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer ${
              !inputMessage.trim() || isLoading
                ? "bg-slate-400 dark:bg-slate-800 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
