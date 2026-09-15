import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Copy, Check, Wand2, Zap, Brain,
  LayoutList, ArrowRight, Quote, Terminal, Send,
  ChevronDown, ChevronUp, Mail, Calendar, HeartPulse,
  CornerDownLeft, RefreshCw, FileText, CheckCircle2,
  CalendarPlus, SendHorizontal
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function AIPanel({ open, onClose, onAction, result, selectedText, fullNoteText, onInsert }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useFullNote, setUseFullNote] = useState(!selectedText);
  const [thoughtLogs, setThoughtLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // Sync selection mode when selectedText changes
  useEffect(() => {
    if (selectedText) {
      setUseFullNote(false);
    } else {
      setUseFullNote(true);
    }
  }, [selectedText]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // AI Tool Definitions: Writing tools + Cross-app sync tools
  const TOOL_CATEGORIES = [
    {
      category: "Writing & Thought",
      tools: [
        {
          id: "Summarize",
          label: "Summarize",
          desc: "Key takeaways & brief insights",
          icon: LayoutList,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
        },
        {
          id: "Improve Writing",
          label: "Polish & Fix",
          desc: "Elevate tone, clarity & flow",
          icon: Wand2,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20"
        },
        {
          id: "Brainstorm Ideas",
          label: "Brainstorm",
          desc: "5 creative angles & next steps",
          icon: Brain,
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        },
        {
          id: "Format Notes",
          label: "Structure & Action Tasks",
          desc: "Headings, bullet lists & checklists",
          icon: Zap,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        },
      ]
    },
    {
      category: "Cross-App Sync Tools",
      tools: [
        {
          id: "Make Email",
          label: "Draft Email",
          desc: "Convert note to professional email",
          icon: Mail,
          color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
          promptPrefix: "Transform this note content into a ready-to-send professional email draft with Subject: and Email Body:\n\n"
        },
        {
          id: "Make Event",
          label: "Schedule Event",
          desc: "Extract meeting time & calendar invite",
          icon: CalendarPlus,
          color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
          promptPrefix: "Extract a calendar event from this note with Event Title, Date, Time, Duration, and Agenda:\n\n"
        },
        {
          id: "Log Health",
          label: "Sync Health Log",
          desc: "Format for personal wellness & vitals",
          icon: HeartPulse,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          promptPrefix: "Extract and summarize any health, wellness, sleep, recovery, or fitness points from this note:\n\n"
        }
      ]
    }
  ];

  const activeContextText = (useFullNote ? fullNoteText : selectedText) || fullNoteText || "";

  const runThoughtLogs = async (actionLabel) => {
    setThoughtLogs([
      { id: 1, text: `🔍 Ingesting ${useFullNote ? "full note" : "selected text"} context...`, status: "active" },
    ]);

    await new Promise((r) => setTimeout(r, 450));
    setThoughtLogs((prev) => [
      ...prev.map((log) => ({ ...log, status: "done" })),
      { id: 2, text: `🧠 Spark AI executing: ${actionLabel}...`, status: "active" },
    ]);

    await new Promise((r) => setTimeout(r, 550));
    setThoughtLogs((prev) => [
      ...prev.map((log) => ({ ...log, status: "done" })),
      { id: 3, text: "✨ Formatted intelligent response ready", status: "done" },
    ]);
  };

  const handleTriggerAction = async (tool) => {
    if (!activeContextText.trim()) {
      toast.error("Please add or select some text first!");
      return;
    }

    setActiveAction(tool.label || tool.id);
    setLoading(true);
    setCopied(false);
    runThoughtLogs(tool.label || tool.id);

    const payloadContext = tool.promptPrefix
      ? tool.promptPrefix + activeContextText
      : activeContextText;

    const backendAction = tool.promptPrefix ? "Improve Writing" : tool.id;

    await onAction(backendAction, payloadContext);
    setLoading(false);
  };

  const handleSubmitCustomPrompt = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const combinedContext = `Instruction: "${customPrompt}"\n\nContext text:\n${activeContextText}`;
    setActiveAction(customPrompt);
    setLoading(true);
    runThoughtLogs("Custom Prompt");
    onAction("Improve Writing", combinedContext);
    setCustomPrompt("");
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const clean = result.replace(/<[^>]*>?/gm, "");
    navigator.clipboard.writeText(clean);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Open generated draft in Triage Mail
  const handleOpenInEmail = () => {
    const clean = (result || "").replace(/<[^>]*>?/gm, "");
    let subject = "Note Update";
    let body = clean;

    if (clean.includes("Subject:")) {
      const parts = clean.split("Subject:");
      const afterSubject = parts[1] || "";
      const lines = afterSubject.trim().split("\n");
      subject = lines[0] || "Note Update";
      body = lines.slice(1).join("\n").replace(/^Body:/i, "").trim();
    }

    sessionStorage.setItem("draft_email", JSON.stringify({ subject, body }));
    toast.success("Opening in Triage Mail...");
    onClose();
    navigate("/email");
  };

  // Open generated event in Calendar
  const handleOpenInCalendar = () => {
    toast.success("Navigating to Calendar...");
    onClose();
    navigate("/calendar");
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [result, loading, thoughtLogs]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          
          {/* ═══ MASTER CENTERED AI STUDIO MODAL ═══ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-3xl lg:max-w-4xl max-h-[88vh] glass-strong rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            {/* Ambient Background Gradient Orbs */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* ── TOP HEADER ── */}
            <div className="relative px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-white/20 dark:bg-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent to-orange-400 text-white shadow-md shadow-accent/25 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary">
                      Spark AI Studio
                    </h2>
                    <span className="text-[9px] font-bold text-accent dark:text-accent-dark bg-accent/10 px-2 py-0.5 rounded-full border border-accent/25 uppercase tracking-wider">
                      Centered Copilot
                    </span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary">
                    Transform note content, draft emails, and schedule calendar events in 1-click
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── CONTEXT / SELECTED TEXT RIBBON ── */}
            <div className="px-6 py-2.5 bg-white/10 dark:bg-black/15 border-b border-white/15 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Quote size={13} className="text-accent shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent shrink-0">
                  {useFullNote ? "Entire Note" : "Selected Text"}:
                </span>
                <p className="text-[12px] text-text-secondary truncate italic min-w-0">
                  "{activeContextText.slice(0, 110) || "No text available"}{activeContextText.length > 110 ? "..." : ""}"
                </p>
              </div>

              {selectedText && (
                <button
                  onClick={() => setUseFullNote(!useFullNote)}
                  className="text-[11px] font-semibold text-accent hover:underline shrink-0 self-end sm:self-auto"
                >
                  {useFullNote ? "Switch to Highlighted Selection" : "Switch to Entire Note"}
                </button>
              )}
            </div>

            {/* ── SCROLLABLE WORKSPACE: TOOLS + RESULTS ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* 1. ALL AI TOOLS GRID */}
              <div className="space-y-4">
                {TOOL_CATEGORIES.map((cat, ci) => (
                  <div key={ci} className="space-y-2">
                    <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-text-secondary/70">
                      {cat.category}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {cat.tools.map((tool) => {
                        const Icon = tool.icon;
                        const isTriggered = activeAction === (tool.label || tool.id) && loading;

                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleTriggerAction(tool)}
                            disabled={loading}
                            className={`p-3 rounded-2xl glass-subtle text-left border transition-all duration-200 group flex flex-col justify-between ${
                              isTriggered
                                ? "border-accent shadow-md bg-white/50 dark:bg-white/15"
                                : "border-white/30 dark:border-white/10 hover:border-accent/40 hover:bg-white/40 dark:hover:bg-white/10"
                            } active:scale-98`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-2xs ${tool.color}`}>
                                <Icon size={14} />
                              </div>
                              {isTriggered && <RefreshCw size={12} className="animate-spin text-accent" />}
                            </div>

                            <div>
                              <h4 className="text-[12.5px] font-bold text-text-primary dark:text-text-darkPrimary group-hover:text-accent transition">
                                {tool.label}
                              </h4>
                              <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1 leading-tight">
                                {tool.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. REAL-TIME THOUGHT LOGS */}
              {thoughtLogs.length > 0 && (
                <div className="glass-subtle rounded-2xl p-3 border border-white/20 text-[11.5px] space-y-1.5">
                  <div
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-text-secondary cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-accent" />
                      <span>Execution Trace</span>
                    </div>
                    {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>

                  {showLogs && (
                    <div className="space-y-1 pt-1.5 border-t border-white/10 font-mono text-[11px]">
                      {thoughtLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-text-secondary">
                          {log.status === "active" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                          ) : (
                            <Check size={12} className="text-emerald-500" />
                          )}
                          <span>{log.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. GENERATED RESULT CANVAS */}
              {result && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-5 rounded-2xl border border-accent/35 shadow-lg space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Sparkles size={13} /> Generated by Spark AI
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11.5px] font-semibold text-text-secondary hover:text-accent transition"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copied ? "Copied" : "Copy Output"}</span>
                    </button>
                  </div>

                  {/* Rendered Result */}
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed max-h-[260px] overflow-y-auto custom-scrollbar pr-2"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />

                  {/* Cross-App Action Triggers */}
                  <div className="pt-2 border-t border-white/20 dark:border-white/8 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* Make Email Action Link */}
                      <button
                        onClick={handleOpenInEmail}
                        className="px-3.5 py-1.5 rounded-xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 text-xs font-bold text-sky-400 border border-sky-500/25 flex items-center gap-1.5 transition"
                      >
                        <Mail size={13} /> Open in Triage Mail
                      </button>

                      {/* Make Calendar Event Action Link */}
                      <button
                        onClick={handleOpenInCalendar}
                        className="px-3.5 py-1.5 rounded-xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 text-xs font-bold text-orange-400 border border-orange-500/25 flex items-center gap-1.5 transition"
                      >
                        <CalendarPlus size={13} /> Add to Calendar
                      </button>
                    </div>

                    {/* Insert into Note Button */}
                    <button
                      onClick={onInsert}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-orange-400 text-white font-bold text-xs shadow-md shadow-accent/20 hover:opacity-90 transition flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Insert into Note</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* ── BOTTOM CUSTOM PROMPT COMMAND BAR ── */}
            <form
              onSubmit={handleSubmitCustomPrompt}
              className="px-6 py-3.5 bg-white/20 dark:bg-white/5 border-t border-white/20 dark:border-white/10 backdrop-blur-lg flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 p-1.5 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 focus-within:border-accent/50 transition">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask Spark: 'Summarize into 3 bullets', 'Translate to Spanish', 'Draft meeting minutes'..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-1 text-[13px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !customPrompt.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-accent text-white font-bold text-[12px] flex items-center gap-1 hover:opacity-90 disabled:opacity-40 transition shadow-xs"
                >
                  <SendHorizontal size={13} />
                  <span>Execute</span>
                </button>
              </div>
            </form>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}

export default AIPanel;