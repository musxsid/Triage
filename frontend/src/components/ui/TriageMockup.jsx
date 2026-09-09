import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Pin,
  Bookmark,
  Copy,
  MoreVertical,
  Sparkles,
  X,
  Play,
  Pause,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Zap,
  FolderOpen
} from "lucide-react";
import TriageLogo from "./TriageLogo";

export default function TriageMockup({ darkMode, activeTab }) {
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Repeating animated workflow state ("like a video")
  const [workflowStep, setWorkflowStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedText, setTypedText] = useState("");
  
  const fullNoteText = "Refactored distributed caching with Redis & automated DB failover.";

  // Workflow cycling loop (repeats continuously)
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setWorkflowStep((prev) => (prev + 1) % 4);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Handle step-specific interactions (like typewriter & opening AI modal)
  useEffect(() => {
    if (workflowStep === 0) {
      // Step 0: Typing
      setShowAiModal(false);
      setTypedText("");
      let curr = 0;
      const typeInterval = setInterval(() => {
        if (curr <= fullNoteText.length) {
          setTypedText(fullNoteText.slice(0, curr));
          curr += 2;
        } else {
          clearInterval(typeInterval);
        }
      }, 45);
      return () => clearInterval(typeInterval);
    } else if (workflowStep === 1) {
      // Step 1: Tagging to Board
      setTypedText(fullNoteText);
      setShowAiModal(false);
    } else if (workflowStep === 2) {
      // Step 2: Spark AI Synthesizing
      setTypedText(fullNoteText);
      setShowAiModal(true);
    } else if (workflowStep === 3) {
      // Step 3: Cloud Sync Complete
      setTypedText(fullNoteText);
      setShowAiModal(false);
    }
  }, [workflowStep]);

  // Sync external tab click with modal
  useEffect(() => {
    if (activeTab === "ai") {
      setShowAiModal(true);
      setIsPlaying(false);
    }
  }, [activeTab]);

  const workflowSteps = [
    { label: "1. Capture", icon: Zap, desc: "Live Drafting" },
    { label: "2. Organize", icon: FolderOpen, desc: "Auto-Routing" },
    { label: "3. Spark AI", icon: Sparkles, desc: "Synthesize" },
    { label: "4. Cloud Sync", icon: Cloud, desc: "Instant Backup" },
  ];

  return (
    <div className="relative w-full h-full min-h-[640px] p-2 sm:p-5 md:p-7 flex flex-col items-center justify-center select-none overflow-hidden">
      
      {/* ═══ MARBLE BACKGROUND OF THE APP MOCKUP ═══ */}
      <div className="absolute inset-0 -z-10">
        <img
          src={darkMode ? "/dark-marble-bg.jpg" : "/peach-marble-bg.jpg"}
          alt="Marble Texture"
          className="w-full h-full object-cover object-center opacity-85"
        />
        <div className={`absolute inset-0 ${darkMode ? 'bg-[#1A1412]/50' : 'bg-[#FFF8F3]/30'}`} />
      </div>

      {/* ═══ WORKFLOW DEMO VIDEO CONTROLLER BAR ═══ */}
      <div className="w-full max-w-5xl mb-3 flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl glass-subtle dark:bg-[#1F1714]/80 border border-white/40 dark:border-white/10 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-xl btn-coral text-white shadow-sm flex items-center gap-1 text-[11px] font-bold"
            title={isPlaying ? "Pause Automated Workflow" : "Play Automated Workflow"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? "Live Demo Playing" : "Paused"}</span>
          </button>
          <span className="text-[11px] font-semibold text-text-secondary dark:text-[#D6CBC4] hidden sm:inline">
            Workflow Loop:
          </span>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-1 sm:gap-2">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = workflowStep === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setWorkflowStep(idx);
                  setIsPlaying(false);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "btn-coral text-white shadow-md scale-105"
                    : "glass hover:bg-white/30 text-text-secondary dark:text-[#D6CBC4]"
                }`}
              >
                <Icon size={12} className={isActive ? "animate-pulse" : ""} />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ FLOATING MAIN WINDOW CARD ═══ */}
      <div className="w-full max-w-5xl rounded-[24px] sm:rounded-[28px] glass-strong dark:bg-[#1E1613]/95 shadow-2xl border border-white/60 dark:border-white/15 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="w-full md:w-56 p-4 sm:p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#F0DDD0]/60 dark:border-white/10 bg-white/40 dark:bg-[#1A1310]/95">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <TriageLogo size={24} showWordmark={true} betaTag={true} />
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-6 text-xs font-medium">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/12 text-text-primary dark:text-white font-semibold shadow-xs border border-transparent dark:border-white/10">
                <FileText size={15} className="text-accent dark:text-[#FFA278]" /> Home
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary dark:hover:text-white transition-colors">
                <div className="flex items-center gap-2.5">
                  <Search size={15} /> Search
                </div>
                <span className="text-[9px] bg-black/5 dark:bg-white/10 dark:text-white/90 px-1.5 py-0.5 rounded font-mono font-bold border border-transparent dark:border-white/15">
                  Ctrl K
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary dark:hover:text-white transition-colors">
                <Trash2 size={15} /> Trash
              </div>
            </div>

            {/* Boards Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-text-secondary/70 dark:text-[#C5B8AF]">
                <span>Boards</span>
                <Plus size={13} className="cursor-pointer hover:text-accent dark:hover:text-white" />
              </div>
              <div className="space-y-1 text-xs text-text-secondary dark:text-[#D6CBC4] font-medium">
                {["Gourmet Adventures", "Creative Projects", "Ideas to Explore", "My Dream Journal", "Inspiration Board"].map((board, idx) => {
                  const isHighlighted = (idx === 1 && workflowStep >= 1);
                  return (
                    <div
                      key={board}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate flex items-center justify-between ${
                        isHighlighted
                          ? 'text-accent dark:text-[#FFA278] font-bold bg-accent/15 dark:bg-accent/25 border border-accent/30 shadow-xs'
                          : 'hover:bg-white/40 dark:hover:bg-white/8 hover:dark:text-white'
                      }`}
                    >
                      <span>{board}</span>
                      {isHighlighted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#FFA278] animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-4 mt-4 border-t border-white/30 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/20 dark:bg-accent/30 text-accent dark:text-[#FFA278] font-bold text-xs flex items-center justify-center">
                S
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-text-primary dark:text-white leading-tight">Siddharth</p>
                <p className="text-[10px] text-text-secondary dark:text-[#B8ACA3] leading-tight truncate w-24">user@triage.io</p>
              </div>
            </div>
            <ChevronUp size={14} className="text-text-secondary dark:text-[#D6CBC4]" />
          </div>
        </div>

        {/* ─── MAIN FEED CONTENT ─── */}
        <div className="flex-1 p-5 sm:p-7 relative overflow-hidden bg-white/50 dark:bg-[#1E1714]/80">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white tracking-tight">
                Home
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[10px] font-bold text-accent dark:text-[#FFA278]">
                <span className="w-2 h-2 rounded-full bg-accent dark:bg-[#FFA278] animate-ping" />
                <span>{workflowSteps[workflowStep].desc}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass dark:bg-[#2C211C] dark:text-[#DDD3CC] dark:border-white/15 text-text-secondary shadow-sm">
                Activity <ChevronDown size={13} />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold btn-coral shadow-sm">
                <Plus size={14} /> Create Board
              </button>
            </div>
          </div>

          {/* Activity Feed Notes */}
          <div className="space-y-4">
            
            {/* ═══ DYNAMIC WORKFLOW DEMO NOTE CARD (ACTS LIKE VIDEO) ═══ */}
            <motion.div
              layout
              className={`p-4 rounded-2xl glass transition-all text-left relative overflow-hidden ${
                workflowStep === 0
                  ? 'border-2 border-accent shadow-[0_0_25px_rgba(232,120,74,0.3)] bg-accent/[0.04]'
                  : workflowStep === 1
                  ? 'border-2 border-[#E8784A] dark:border-[#FFA278] bg-white/70 dark:bg-[#281F1A]'
                  : 'border border-white/40 dark:border-white/12 dark:bg-[#251D19]/90'
              }`}
            >
              {/* Top Banner indicating workflow status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-text-primary dark:text-white">
                    Distributed Caching Architecture
                  </h4>
                  {workflowStep >= 1 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 rounded-md bg-accent/15 dark:bg-accent/25 text-accent dark:text-[#FFA982] text-[10px] font-bold"
                    >
                      Creative Projects
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-text-secondary/60 dark:text-[#C5B8AF]">
                  <Pin size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                  <Copy size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                  <MoreVertical size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                </div>
              </div>

              {/* Author & Timestamp */}
              <div className="flex items-center gap-2 text-[11px] text-text-secondary dark:text-[#C4B7AE] mb-2">
                <span className="w-4 h-4 rounded bg-accent/20 dark:bg-accent/30 text-accent dark:text-[#FFA278] font-bold text-[9px] flex items-center justify-center">S</span>
                <span className="font-semibold text-text-primary dark:text-white">Siddharth</span>
                <span>•</span>
                <span>Just now</span>
                <span>•</span>
                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {workflowStep === 3 ? "Synced in 12ms" : "Auto-saving..."}
                </span>
              </div>

              {/* Animated Typing Body Text */}
              <p className="text-xs text-text-secondary dark:text-[#E2D8D2] leading-relaxed font-mono sm:font-sans">
                {typedText}
                {workflowStep === 0 && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-accent dark:bg-[#FFA278] animate-pulse" />
                )}
              </p>

              {/* Spark AI Generated Summary Card when on Step 2 or 3 */}
              {workflowStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pl-3 border-l-2 border-accent dark:border-[#FFA278] bg-accent/[0.06] dark:bg-white/[0.05] py-2 pr-3 rounded-r-xl"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent dark:text-[#FFA278] mb-1">
                    <Sparkles size={12} />
                    <span>Spark AI Synthesis:</span>
                  </div>
                  <p className="text-[11px] text-text-primary dark:text-[#F3ECE7] leading-relaxed">
                    ✓ Read-through Redis caching reduces DB strain by 78%<br />
                    ✓ Automated circuit-breaker ensures zero customer downtime
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Note 2: Whimsical Widgets */}
            <div className="p-4 rounded-2xl glass-subtle dark:bg-[#251D19]/90 border border-white/40 dark:border-white/12 hover:shadow-glassHover dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all text-left group">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h4 className="text-sm font-bold text-text-primary dark:text-white">
                  Whimsical Widgets
                </h4>
                <div className="flex items-center gap-1.5 text-text-secondary/60 dark:text-[#C5B8AF]">
                  <Pin size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                  <Bookmark size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                  <Copy size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                  <MoreVertical size={13} className="hover:text-accent dark:hover:text-white cursor-pointer" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] text-text-secondary dark:text-[#C4B7AE] mb-2">
                <span className="w-4 h-4 rounded bg-accent/20 dark:bg-accent/30 text-accent dark:text-[#FFA278] font-bold text-[9px] flex items-center justify-center">K</span>
                <span className="font-semibold text-text-primary dark:text-white">Kevin</span>
                <span>•</span>
                <span>16 hours ago</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-accent/10 dark:bg-accent/25 text-accent dark:text-[#FFA982] text-[10px] font-bold">
                  Creative Projects
                </span>
              </div>

              <p className="text-xs text-text-secondary dark:text-[#E2D8D2] leading-relaxed line-clamp-2">
                I've completed the design for Whimsical Widgets, opting for direct interactions with the Enchanted Database instead of relying on the Magical RPC. Everything has been thoroughly reviewed and tested.
              </p>
            </div>

            {/* Note 3: Gourmet Cuisine */}
            <div className="p-4 rounded-2xl glass-subtle dark:bg-[#251D19]/90 border border-white/40 dark:border-white/12 hover:shadow-glassHover dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all text-left group">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h4 className="text-sm font-bold text-text-primary dark:text-white">
                  I explored gourmet cuisine through unique dishes like rich truffle risotto and vibrant saffron paella.
                </h4>
                <Copy size={13} className="text-text-secondary/60 dark:text-[#C5B8AF] hover:text-accent dark:hover:text-white cursor-pointer flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-text-secondary dark:text-[#C4B7AE] mb-2">
                <span className="w-4 h-4 rounded bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-200 font-bold text-[9px] flex items-center justify-center">S</span>
                <span className="font-semibold text-text-primary dark:text-white">Siddharth</span>
                <span>•</span>
                <span>14 hours ago</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/25 text-amber-600 dark:text-amber-200 text-[10px] font-bold">
                  Gourmet Adventures
                </span>
              </div>

              <p className="text-xs text-text-secondary dark:text-[#E2D8D2] leading-relaxed line-clamp-2">
                I'm enjoying gourmet adventures with local chefs. Recently, I had a spicy lamb tagine with mint tea and a delicious chocolate fondant.
              </p>
            </div>

          </div>

          {/* ═══ FLOATING "+ NEW SNIPPET" CORAL PILL ═══ */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass dark:bg-[#281F1A]/95 shadow-2xl border border-white/50 dark:border-white/20 z-10">
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full btn-coral text-xs font-bold shadow-md hover:scale-105 transition-transform">
              <Plus size={13} /> New Snippet
            </button>
            <div className="w-px h-4 bg-border/60 dark:bg-white/20" />
            <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary dark:text-white/80">
              <Plus size={13} />
            </button>
            <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary dark:text-white/80">
              <MoreVertical size={13} />
            </button>
          </div>

          {/* ═══ SPARK AI OVERLAY CARD (INTERACTIVE MODAL) ═══ */}
          <AnimatePresence>
            {showAiModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md p-6 flex items-center justify-center z-30"
              >
                <div className="w-full max-w-md glass dark:bg-[#2A201B] p-6 rounded-2xl shadow-2xl border border-accent/40 dark:border-accent/60 text-left relative">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary dark:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center justify-between mb-3 pr-6">
                    <div className="flex items-center gap-2 text-accent dark:text-[#FFA278] font-bold text-sm">
                      <Sparkles size={16} className="animate-spin-slow" /> Spark AI Assistant
                    </div>
                    <span className="text-[10px] bg-accent/15 dark:bg-accent/30 text-accent dark:text-[#FFA278] px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-primary dark:text-[#F3ECE7] mb-5 leading-relaxed font-medium">
                    "Summary of <strong className="text-accent dark:text-[#FFB393]">Distributed Caching</strong>: Implementation replaces synchronous DB queries with Redis clusters, boosting read throughput by 4.2x with zero customer disruption."
                  </p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAiModal(false)}
                      className="flex-1 py-2 rounded-xl btn-coral text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      Insert into Note
                    </button>
                    <button 
                      onClick={() => setShowAiModal(false)}
                      className="px-4 py-2 rounded-xl glass dark:bg-white/10 dark:text-white dark:border-white/15 text-xs font-semibold hover:bg-white/20 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
