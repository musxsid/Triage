import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles, Send, Copy, Check, Plus, RefreshCw,
  Wand2, Lightbulb, ListChecks, AlignLeft,
  BookOpen, Trash2, ArrowRight, CornerDownLeft, RotateCcw
} from "lucide-react";
import { generateAIContent, createNote, getNotes } from "../services/notesService";
import ProfileMenu from "../components/ui/ProfileMenu";

const QUICK_ACTIONS = [
  { id: "Summarize", label: "Summarize", icon: AlignLeft, description: "Extract key points into a brief, high-impact overview" },
  { id: "Improve Writing", label: "Improve Writing", icon: Wand2, description: "Polish tone, cadence, clarity, and conciseness" },
  { id: "Brainstorm Ideas", label: "Brainstorm Ideas", icon: Lightbulb, description: "Generate creative concepts and strategic solutions" },
  { id: "Format Notes", label: "Format Notes", icon: ListChecks, description: "Turn messy thoughts into structured headings and tasks" },
];

const STARTER_CHIPS = [
  {
    title: "Executive Brief",
    action: "Summarize",
    icon: "📋",
    prompt: "Team sync highlights:\n- Discussed Q3 roadmap and target deliverables\n- Frontend liquid glass redesign completed ahead of schedule\n- Next priority: CRDT real-time collaborative editing\n- Blockers: Redis session TTL verification on secondary nodes",
  },
  {
    title: "Product Ideation",
    action: "Brainstorm Ideas",
    icon: "💡",
    prompt: "Brainstorm 5 high-impact features for a personal productivity note app that focuses on distraction-free writing, speed, and ambient liquid glass design.",
  },
  {
    title: "Polish & Elevate",
    action: "Improve Writing",
    icon: "✨",
    prompt: "SimplyNotes is very fast and looks really nice with glass effects and it lets users keep their notes in one spot without complicated folders or slow loading times.",
  },
  {
    title: "Project Milestone",
    action: "Format Notes",
    icon: "🎯",
    prompt: "Launch plan notes: finalize auth token expiry tests, configure redis key eviction policy, run lighthouse performance audits, ship v1.0 beta release, collect initial user feedback.",
  }
];

export default function AiAssistantPage() {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState("Summarize");
  const [contextInput, setContextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [workspaceNotes, setWorkspaceNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [viewMode, setViewMode] = useState("input"); // "input" | "result" | "split"

  const activeWorkspaceName = localStorage.getItem("activeWorkspaceName") || "Workspace";

  useEffect(() => {
    const fetchExistingNotes = async () => {
      try {
        const res = await getNotes();
        setWorkspaceNotes(res.data || []);
      } catch (err) {
        console.error("Could not fetch notes for AI context selector", err);
      }
    };
    fetchExistingNotes();
  }, []);

  const handleSelectExistingNote = (noteId) => {
    setSelectedNoteId(noteId);
    if (!noteId) return;
    const found = workspaceNotes.find((n) => String(n.id) === String(noteId));
    if (found) {
      const cleanContent = (found.content || "").replace(/<[^>]*>?/gm, "").trim();
      setContextInput(cleanContent || found.title || "");
      toast.success(`Loaded "${found.title || 'Untitled'}" into context`);
    }
  };

  const handleGenerate = async (overrideAction, overrideContext) => {
    const action = overrideAction || selectedAction;
    const text = overrideContext !== undefined ? overrideContext : contextInput;

    if (!text.trim()) {
      toast.error("Please enter or select some text first.");
      return;
    }

    setLoading(true);

    try {
      const res = await generateAIContent(action, text);
      const output = res.data?.result || res.data?.output || "";
      if (output) {
        setAiResult(output);
        setViewMode("result");
      } else {
        toast.error("Spark did not return content. Try another prompt.");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      toast.error(err.response?.data?.error || "Failed to generate AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleCopy = () => {
    if (!aiResult) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = aiResult;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!aiResult) return;
    setSavingNote(true);
    try {
      const firstLineMatch = aiResult.replace(/<[^>]*>?/gm, " ").trim().split("\n")[0] || "Spark Note";
      const title = `AI: ${selectedAction} - ${firstLineMatch.substring(0, 30)}...`;

      const res = await createNote({
        title,
        content: aiResult,
      });
      toast.success("Saved as new note!");
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      toast.error("Failed to save note from AI output.");
    } finally {
      setSavingNote(false);
    }
  };

  const activeActionObj = QUICK_ACTIONS.find(a => a.id === selectedAction) || QUICK_ACTIONS[0];
  const wordCount = contextInput.trim() ? contextInput.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-[calc(100vh-40px)] flex flex-col">
      
      {/* Profile Menu Top Right */}
      <div className="fixed top-6 right-8 z-[100] hidden md:block">
        <ProfileMenu />
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/25 text-white flex-shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary">
                Spark AI Assistant
              </h1>
              <span className="text-[10px] font-extrabold text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/15 px-2.5 py-0.5 rounded-full border border-accent/25 uppercase tracking-wider">
                Online
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-0.5">
              Intelligent drafting, summarization, and formatting inside {activeWorkspaceName}
            </p>
          </div>
        </div>

        {/* View Switcher if Result is available */}
        {aiResult && (
          <div className="flex items-center glass-pill p-1 rounded-2xl border border-white/20 dark:border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("input")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "input"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary"
              }`}
            >
              Edit Prompt
            </button>
            <button
              onClick={() => setViewMode("result")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "result"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary"
              }`}
            >
              <Sparkles size={12} />
              AI Result
            </button>
          </div>
        )}
      </div>

      {/* ═══ SLEEK SEGMENTED ACTION CAPSULE BAR ═══ */}
      <div className="glass-strong p-1.5 rounded-2xl border border-white/30 dark:border-white/10 shadow-lg mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = selectedAction === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedAction(item.id)}
                className={`relative px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center gap-2.5 ${
                  isActive
                    ? "bg-accent text-white shadow-md shadow-accent/25 font-bold"
                    : "hover:bg-white/40 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary font-medium"
                }`}
              >
                <Icon size={16} className={isActive ? "text-white flex-shrink-0" : "text-text-secondary flex-shrink-0"} />
                <div className="min-w-0">
                  <p className="text-[13px] truncate leading-tight">{item.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ UNIFIED AI STUDIO WORKSTATION ═══ */}
      <div className="glass-strong rounded-3xl border border-white/35 dark:border-white/10 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-[520px]">
        
        {/* Workstation Header Strip */}
        <div className="px-5 py-3.5 border-b border-white/20 dark:border-white/8 bg-white/10 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark animate-pulse" />
            <span className="text-xs font-bold text-text-primary dark:text-text-darkPrimary">
              {activeActionObj.label}
            </span>
            <span className="text-xs text-text-secondary hidden sm:inline">
              — {activeActionObj.description}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary glass-pill px-3 py-1 rounded-xl">
              <BookOpen size={13} className="text-accent flex-shrink-0" />
              <span className="hidden md:inline">Source:</span>
              <span className="font-semibold text-text-primary dark:text-text-darkPrimary truncate max-w-[110px]">
                {activeWorkspaceName}
              </span>
            </div>

            {workspaceNotes.length > 0 && (
              <select
                value={selectedNoteId}
                onChange={(e) => handleSelectExistingNote(e.target.value)}
                className="text-xs glass px-3 py-1 rounded-xl outline-none text-text-primary dark:text-text-darkPrimary border border-white/20 dark:border-white/10 bg-transparent max-w-[160px] truncate cursor-pointer hover:border-accent/40 transition"
              >
                <option value="" className="dark:bg-[#1E1612]">Load a note...</option>
                {workspaceNotes.map((note) => (
                  <option key={note.id} value={note.id} className="dark:bg-[#1E1612]">
                    {note.title || "Untitled Note"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Workstation Main Canvas */}
        <div className="flex-1 flex flex-col p-5 sm:p-6 overflow-hidden">
          
          {/* VIEW: RESULT MODE */}
          {viewMode === "result" && aiResult ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Result Control Toolbar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/20 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-accent/15 text-accent dark:text-accent-dark">
                    <Sparkles size={14} />
                  </span>
                  <span className="text-xs font-bold text-text-primary dark:text-text-darkPrimary">
                    Generated with Spark
                  </span>
                  <span className="text-[11px] text-text-secondary hidden sm:inline">
                    ({selectedAction})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("input")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs font-semibold text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition"
                    title="Edit context prompt"
                  >
                    <RotateCcw size={13} />
                    <span>Edit Prompt</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs font-semibold text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 transition"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleSaveAsNote}
                    disabled={savingNote}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-secondary transition active:scale-95 disabled:opacity-50"
                  >
                    <Plus size={13} />
                    <span>{savingNote ? "Saving..." : "Save to Notes"}</span>
                  </button>
                </div>
              </div>

              {/* Rendered AI HTML */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-2">
                <div
                  className="prose dark:prose-invert max-w-none text-[14px] leading-relaxed text-text-primary dark:text-text-darkPrimary space-y-3 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-accent dark:[&>h3]:text-accent-dark [&>h3]:mt-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ol]:list-decimal [&>ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: aiResult }}
                />
              </div>
            </div>
          ) : (
            /* VIEW: INPUT / CANVAS MODE */
            <div className="flex-1 flex flex-col h-full">
              <div className="relative flex-1 flex flex-col">
                <textarea
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type or paste text to ${selectedAction.toLowerCase()}... Or choose a quick starter below.`}
                  className="w-full flex-1 bg-white/20 dark:bg-black/20 rounded-2xl p-4 sm:p-5 text-[14px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent/50 dark:focus:border-accent-dark/50 transition-all resize-none custom-scrollbar leading-relaxed font-normal min-h-[220px]"
                />

                {contextInput && (
                  <button
                    onClick={() => { setContextInput(""); setSelectedNoteId(""); }}
                    className="absolute top-3.5 right-3.5 p-1.5 rounded-lg glass text-text-secondary hover:text-red-500 transition-colors"
                    title="Clear text"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Compact Quick Inspiration Chips */}
              <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/8">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={13} className="text-accent" />
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Quick Starters
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STARTER_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedAction(chip.action);
                        setContextInput(chip.prompt);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-white/50 dark:hover:bg-white/10 border border-white/25 dark:border-white/10 text-xs text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition group"
                    >
                      <span>{chip.icon}</span>
                      <span className="font-semibold">{chip.title}</span>
                      <span className="text-[10px] text-accent opacity-70 group-hover:opacity-100">
                        ({chip.action})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Workstation Action Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20 dark:border-white/8">
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                  <span className="hidden sm:inline text-text-secondary/40">•</span>
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-text-secondary/70">
                    <CornerDownLeft size={11} />
                    <span>Ctrl + Enter to run</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {aiResult && (
                    <button
                      onClick={() => setViewMode("result")}
                      className="px-4 py-2 rounded-xl glass text-xs font-bold text-text-secondary hover:text-text-primary transition"
                    >
                      View Last Result
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerate()}
                    disabled={loading || !contextInput.trim()}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[13px] font-bold text-white shadow-lg transition-all duration-200 ${
                      loading || !contextInput.trim()
                        ? "opacity-50 cursor-not-allowed bg-accent/60"
                        : "bg-gradient-to-r from-accent to-accent-secondary shadow-accent/25 hover:shadow-accent/40"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Run {selectedAction}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

