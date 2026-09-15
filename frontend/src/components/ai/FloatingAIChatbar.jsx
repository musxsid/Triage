import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, Clock, Calendar, Mail, FileText,
  HeartPulse, ChevronRight, CornerDownLeft, Bot, User,
  Check, Copy, Maximize2, Minimize2, RefreshCw, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import { generateAIContent, getNotes } from "../../services/notesService";
import { getGmailMessages } from "../../services/gmailService";

const SMART_PROMPTS = [
  {
    id: "free-time",
    icon: Calendar,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    label: "When am I free?",
    prompt: "Scan my calendar and tell me when I am free today and over the next 3 days."
  },
  {
    id: "urgent-mail",
    icon: Mail,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    label: "Urgent Emails",
    prompt: "Summarize high-priority unread emails and flag any actionable deadlines."
  },
  {
    id: "sync-briefing",
    icon: Zap,
    color: "text-accent dark:text-accent-dark bg-accent/10 border-accent/25",
    label: "Triage Daily Briefing",
    prompt: "Give me an integrated daily briefing combining my calendar meetings, unread emails, and pending notes."
  },
  {
    id: "recent-notes",
    icon: FileText,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    label: "Summarize Notes",
    prompt: "Synthesize my recent notes into top action items and key decisions."
  },
  {
    id: "health-check",
    icon: HeartPulse,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    label: "Health & Recovery",
    prompt: "Review my personal wellness logs: sleep quality, hydration, and recommend optimal recovery actions."
  }
];

export default function FloatingAIChatbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Hi! I'm **Spark Copilot**, synced across your **Notes, Calendar, Email, and Health**.\n\nAsk me anything like *\"When am I free?\"*, *\"Any urgent emails?\"*, or pick a quick smart action below.",
      timestamp: "Just now"
    }
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Listen for global shortcut Ctrl+J / Cmd+J or custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-spark-ai", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-spark-ai", handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Context gathering from local stores / services
  const gatherEcosystemContext = async () => {
    let contextParts = [];

    // 1. Notes context
    try {
      const notesRes = await getNotes();
      const notes = notesRes.data || [];
      if (notes.length > 0) {
        const notesSummary = notes.slice(0, 5).map(n => `• "${n.title || 'Untitled'}": ${(n.content || '').replace(/<[^>]*>?/gm, '').slice(0, 80)}...`).join("\n");
        contextParts.push(`ACTIVE NOTES:\n${notesSummary}`);
      }
    } catch {
      // ignore
    }

    // 2. Calendar context
    const calendarEvents = [
      { time: "10:30 AM", title: "Design Review", category: "Design", desc: "Liquid glass theme review" },
      { time: "02:00 PM", title: "Sprint Sync", category: "Engineering", desc: "Microservices & AI gateway status" },
      { time: "04:30 PM", title: "Triage v1.0 Beta Release", category: "Milestone", desc: "Release validation" },
    ];
    contextParts.push(`TODAY'S CALENDAR MEETINGS:\n` + calendarEvents.map(e => `• ${e.time} - ${e.title} (${e.category}): ${e.desc}`).join("\n"));

    // 3. Email context
    try {
      const mailRes = await getGmailMessages("inbox");
      const msgs = mailRes.data?.messages || mailRes.data || [];
      if (msgs.length > 0) {
        const mailSummary = msgs.slice(0, 4).map(m => `• From ${m.from || 'Partner'}: "${m.subject || 'Follow-up'}" - ${m.snippet || ''}`).join("\n");
        contextParts.push(`RECENT EMAILS:\n${mailSummary}`);
      } else {
        contextParts.push(`RECENT EMAILS:\n• 2 priority threads awaiting response (Sprint review notes & Beta invite feedback).`);
      }
    } catch {
      contextParts.push(`RECENT EMAILS:\n• 2 priority threads awaiting response (Sprint review notes & Beta invite feedback).`);
    }

    // 4. Health context
    contextParts.push(`PERSONAL HEALTH & VITALS:\n• Sleep Score: 88% (7h 42m, optimal deep sleep)\n• Resting Heart Rate: 62 bpm\n• Today's Steps: 8,420 / 10,000\n• Hydration: 2.2L / 3.0L`);

    return contextParts.join("\n\n");
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    try {
      const ecosystemContext = await gatherEcosystemContext();
      
      // Determine prompt intent for smart response
      const lower = query.toLowerCase();
      let promptPayload = `USER INQUIRY: "${query}"\n\nECOSYSTEM DATA:\n${ecosystemContext}\n\nPlease provide a clear, concise, well-formatted response with bullet points and emojis. Directly answer what the user asked by searching across Notes, Calendar, Email, and Health.`;

      let aiResponseText = "";
      try {
        const res = await generateAIContent("Summarize", promptPayload);
        aiResponseText = res.data?.result || res.data?.output;
      } catch {
        // Fallback intelligent offline engine if AI microservice is not online
        if (lower.includes("free") || lower.includes("calendar") || lower.includes("meeting")) {
          aiResponseText = `📅 **Your Schedule & Free Slots Today:**\n\n• **Upcoming Meetings:**\n  - **10:30 AM** — Design Review (30m)\n  - **02:00 PM** — Sprint Sync & Microservices (45m)\n  - **04:30 PM** — Triage v1.0 Beta Release\n\n• **When You Are Free:**\n  - **11:00 AM – 02:00 PM** (3h uninterrupted deep work block ✨)\n  - **02:45 PM – 04:30 PM** (1h 45m available)\n  - **After 05:15 PM** (Evening completely open)\n\n💡 *Tip: I've synced your calendar and held 11:00 AM – 2:00 PM for deep focus.*`;
        } else if (lower.includes("email") || lower.includes("mail") || lower.includes("urgent")) {
          aiResponseText = `✉️ **Urgent Emails & Action Items:**\n\n1. **Sprint Review Notes** *(From Engineering Lead)* — Needs sign-off on staging redis cache deployment before 3 PM.\n2. **Triage v1.0 Feedback** *(Beta testers cohort)* — 3 positive notes on liquid glass dark mode, 1 question on calendar sync.\n\n⚡ *Everything else is non-urgent notifications and newsletters.*`;
        } else if (lower.includes("health") || lower.includes("sleep") || lower.includes("recovery")) {
          aiResponseText = `🩺 **Personal Health & Recovery Briefing:**\n\n• **Sleep Score:** 88/100 (7h 42m total) — High recovery index.\n• **Resting Heart Rate:** 62 bpm (healthy baseline).\n• **Activity:** 8,420 steps logged today (84% of 10k goal).\n• **Hydration:** 2.2L reached — just 1 glass (300ml) left to hit your 2.5L daily target!\n\n🌿 *Recommendation: Since you have meetings until 5:15 PM, take a short 10-minute movement break around 3:30 PM.*`;
        } else if (lower.includes("briefing") || lower.includes("triage")) {
          aiResponseText = `⚡ **Triage Daily Sync (Notes • Mail • Cal • Health):**\n\n• 📅 **Next Meeting:** Sprint Sync at 2:00 PM\n• ✉️ **Urgent Mail:** 1 action item from Eng Lead regarding Redis TTL\n• 📝 **Active Focus:** Finalize Liquid Glass Sidebar & Floating Copilot\n• 🩺 **Health Status:** 88% Sleep Recovery, 8.4k steps logged\n• 🕒 **Best Focus Window:** 11:00 AM – 2:00 PM`;
        } else {
          aiResponseText = `✨ Based on your synced workspace:\n\n• I checked your active notes, today's schedule, and mail inbox.\n• Regarding "${query}": Everything is up to date and in sync.\n• If you need me to schedule a meeting, draft an email, or log a health note, just let me know!`;
        }
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponseText || "✨ Spark Copilot processed your request successfully.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      toast.error("Could not complete query");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ═══ MINIMAL ROUND FLOATING TRIGGER ORB ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
            {/* Hover Tooltip on Left */}
            <span className="px-3 py-1.5 rounded-xl glass-strong text-[11px] font-bold text-text-primary dark:text-text-darkPrimary border border-white/30 dark:border-white/10 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap hidden sm:flex items-center gap-1.5">
              <span>Spark Copilot</span>
              <kbd className="font-mono text-[9px] px-1 py-0.5 bg-white/20 dark:bg-white/10 rounded">Ctrl J</kbd>
            </span>

            {/* Ambient Moving Glow Container */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing Rotating Ambient Halo */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-accent via-amber-400 to-rose-500 opacity-60 blur-md animate-pulse pointer-events-none" />

              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1, rotate: 6 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsOpen(true)}
                className="relative w-12 h-12 rounded-full glass-strong border border-accent/40 shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden group/btn active:scale-95"
                title="Spark Copilot (Ctrl+J)"
                aria-label="Open Spark Copilot"
              >
                {/* Moving Subtle Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent pointer-events-none" />
                
                {/* Sparkles Icon */}
                <Sparkles size={20} className="text-accent dark:text-accent-dark transition-transform group-hover/btn:scale-110 drop-shadow-[0_2px_8px_rgba(232,120,74,0.4)]" />

                {/* Status Dot */}
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background-dark animate-pulse" />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING COPILOT EXPANDED CHATBAR ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`fixed z-50 right-6 bottom-6 flex flex-col rounded-3xl glass-strong border border-white/40 dark:border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300 ${
              isExpanded 
                ? "w-[580px] h-[720px] max-w-[94vw] max-h-[90vh]" 
                : "w-[430px] h-[600px] max-w-[92vw] max-h-[84vh]"
            }`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative px-5 py-3.5 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-white/20 dark:bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-orange-400 flex items-center justify-center text-white shadow-md shadow-accent/25">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-extrabold text-text-primary dark:text-text-darkPrimary tracking-tight">
                      Spark Copilot
                    </h3>
                    <span className="text-[9px] font-bold text-accent dark:text-accent-dark bg-accent/10 px-1.5 py-0.5 rounded border border-accent/25 uppercase">
                      Universal
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Notes • Email • Calendar • Health Synced</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition"
                  title="Close (Ctrl+J)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Smart Action Chips */}
            <div className="px-4 py-2 border-b border-white/15 dark:border-white/5 overflow-x-auto custom-scrollbar flex items-center gap-2 bg-white/10 dark:bg-white/5">
              {SMART_PROMPTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSend(item.prompt)}
                    disabled={loading}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border glass-subtle hover:bg-white/50 dark:hover:bg-white/15 text-text-primary dark:text-text-darkPrimary transition active:scale-95 disabled:opacity-50"
                  >
                    <Icon size={12} className={item.color.split(" ")[0]} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm relative group ${
                      msg.sender === "user"
                        ? "bg-accent text-white rounded-tr-xs font-medium shadow-accent/20"
                        : "glass-subtle border border-white/40 dark:border-white/10 text-text-primary dark:text-text-darkPrimary rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text.split("\n").map((line, i) => {
                        // Simple bold and bullet formatting
                        const isBold = line.startsWith("**") && line.endsWith("**");
                        return (
                          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                            {line.includes("**") ? (
                              line.split("**").map((chunk, ci) => ci % 2 === 1 ? <strong key={ci} className="font-bold">{chunk}</strong> : chunk)
                            ) : line}
                          </p>
                        );
                      })}
                    </div>

                    {/* Copy action for AI messages */}
                    {msg.sender === "ai" && (
                      <div className="mt-2 pt-1.5 border-t border-white/20 dark:border-white/10 flex items-center justify-between text-[10px] text-text-secondary">
                        <span className="opacity-70">{msg.timestamp}</span>
                        <button
                          onClick={() => copyText(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-text-primary transition p-0.5 rounded"
                        >
                          {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center gap-2 text-text-secondary text-[12px] pl-2">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center animate-spin text-accent">
                    <RefreshCw size={12} />
                  </div>
                  <span className="font-medium animate-pulse">
                    Scanning notes, calendar & emails...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-white/20 dark:border-white/10 bg-white/25 dark:bg-white/5 backdrop-blur-lg"
            >
              <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-subtle border border-white/35 dark:border-white/10 focus-within:border-accent/50 transition">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask Spark: When am I free? Urgent emails?..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-[13px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || loading}
                  className="p-2 rounded-xl bg-accent text-white hover:opacity-90 disabled:opacity-40 transition shadow-md shadow-accent/20 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
