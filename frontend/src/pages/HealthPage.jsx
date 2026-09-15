import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HeartPulse, Activity, Moon, Droplets, Flame, Plus,
  Sparkles, Calendar, FileText, CheckCircle2, ChevronRight,
  TrendingUp, Pill, Stethoscope, Dumbbell, Apple, Clock,
  ArrowUpRight, RefreshCw, Send, AlertCircle, Check
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote, getNotes, generateAIContent } from "../services/notesService";

const HEALTH_SLIDER_TABS = [
  { id: "ai", label: "Health AI Copilot", icon: Sparkles },
  { id: "records", label: "Medical & Health Records", icon: FileText },
  { id: "schedule", label: "Schedule & Daily Habits", icon: Calendar },
];

export default function HealthPage() {
  const navigate = useNavigate();
  const [hydration, setHydration] = useState(2250); // ml
  const hydrationGoal = 3000;
  
  const [healthNotes, setHealthNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  // AI Health Assistant State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Daily Habits State
  const [habits, setHabits] = useState([
    { id: 1, text: "Morning 500ml water + electrolytes", done: true },
    { id: 2, text: "15m natural sunlight exposure", done: true },
    { id: 3, text: "Hit 10,000 active steps (currently at 8,420)", done: false },
    { id: 4, text: "No screens 45 mins before bedtime", done: false },
  ]);

  // Quick prompt presets for health
  const HEALTH_AI_PRESETS = [
    {
      title: "Sleep & Recovery Analysis",
      prompt: "Based on my sleep score of 88% and resting heart rate of 62 bpm, how should I pace my deep work and workouts today?",
      icon: Moon,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      title: "Post-Workout Nutrition",
      prompt: "Suggest a healthy, anti-inflammatory lunch rich in protein and micronutrients after an 8,400-step active morning.",
      icon: Apple,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Medication & Supplement Routine",
      prompt: "Structure an optimal daily timing plan for Vitamin D3, Omega-3, and Magnesium Glycinate.",
      icon: Pill,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Ergonomics & Movement",
      prompt: "I have 4 hours of desk meetings today. Give me a 3-minute posture and eye relief protocol.",
      icon: Activity,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    }
  ];

  // Fetch health-related notes
  useEffect(() => {
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const res = await getNotes();
        const allNotes = res.data || [];
        const filtered = allNotes.filter(
          (n) =>
            n.title?.toLowerCase().includes("health") ||
            n.title?.toLowerCase().includes("doctor") ||
            n.title?.toLowerCase().includes("med") ||
            n.title?.toLowerCase().includes("workout") ||
            n.content?.toLowerCase().includes("health") ||
            n.content?.toLowerCase().includes("prescription")
        );
        setHealthNotes(filtered);
      } catch (err) {
        console.error("Could not fetch notes", err);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, []);

  const handleAddWater = () => {
    const next = Math.min(hydration + 250, 4000);
    setHydration(next);
    toast.success(`Logged 250ml water (${next} / ${hydrationGoal} ml)`);
  };

  const handleCreateHealthNote = async () => {
    try {
      const res = await createNote({
        title: `Health Log — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        content: `<p><strong>Vitals Summary:</strong></p><ul><li>Sleep: 7h 42m (Score: 88%)</li><li>Resting HR: 62 bpm</li><li>Hydration: ${hydration} ml</li></ul><p><strong>Notes & Symptoms:</strong></p><p>Feeling focused and high energy today.</p>`
      });
      toast.success("Health log note created");
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      toast.error("Failed to create health note");
    }
  };

  const handleAskHealthAi = async (overridePrompt) => {
    const promptToRun = overridePrompt || aiPrompt;
    if (!promptToRun.trim()) return;

    setLoadingAi(true);
    setAiResponse("");

    try {
      const payload = `User health query: "${promptToRun}". Context: Sleep score 88%, Resting HR 62 bpm, Steps 8,420, Hydration ${hydration}ml. Provide actionable wellness advice with clear headers and bullet points.`;
      
      let resultText = "";
      try {
        const res = await generateAIContent("Summarize", payload);
        resultText = res.data?.result || res.data?.output;
      } catch {
        resultText = `🌿 **Personal Wellness Recommendation:**\n\n• **Physical Readiness: Excellent (88% Recovery)**\n  Your 7h 42m sleep cycle with balanced REM and 62 bpm resting HR indicates optimal parasympathetic nervous system recovery.\n\n• **Movement & Energy:**\n  You're already at 8,420 steps. A brisk 15-minute walk later will comfortably surpass your 10,000-step target.\n\n• **Hydration & Focus:**\n  You're at ${hydration}ml of your ${hydrationGoal}ml goal. Drink a 250ml glass of electrolyte water prior to your 2:00 PM sprint sync to prevent afternoon cognitive fatigue.`;
      }

      setAiResponse(resultText);
    } catch (err) {
      toast.error("Health AI consultation error");
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* ═══ TOP HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold shadow-sm">
            <HeartPulse size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary leading-tight">
                Personal Health & Vitals
              </h1>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                88% Recovery
              </span>
            </div>
            <p className="text-[11.5px] text-text-secondary">
              Biometric synchronization, medical logs & AI wellness coaching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleCreateHealthNote}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-white font-bold text-[12px] shadow-md shadow-accent/20 hover:opacity-95 active:scale-95 transition"
          >
            <Plus size={14} /> <span>New Health Log</span>
          </button>
          <ProfileMenu />
        </div>
      </div>

      {/* ═══ SURFACE 1: MASTER UNIFIED VITALS RIBBON (ONE CLEAN CARD) ═══ */}
      <div className="glass-strong rounded-3xl p-5 border border-white/35 dark:border-white/10 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-white/20 dark:divide-white/8">
          
          {/* 1. Sleep Quality */}
          <div className="pt-2 md:pt-0 md:pr-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Sleep Quality</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Moon size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text-primary dark:text-text-darkPrimary">88%</span>
              <span className="text-[11px] font-bold text-emerald-500">7h 42m</span>
            </div>
            <div className="w-full bg-white/20 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[88%]" />
            </div>
          </div>

          {/* 2. Resting HR */}
          <div className="pt-3 md:pt-0 md:px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Resting HR</span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <Activity size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text-primary dark:text-text-darkPrimary">62</span>
              <span className="text-[11px] font-semibold text-text-secondary">bpm • HRV 58ms</span>
            </div>
            <div className="w-full bg-white/20 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full w-[65%]" />
            </div>
          </div>

          {/* 3. Daily Steps */}
          <div className="pt-3 md:pt-0 md:px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Daily Steps</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Flame size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text-primary dark:text-text-darkPrimary">8,420</span>
              <span className="text-[11px] font-semibold text-text-secondary">/ 10k steps</span>
            </div>
            <div className="w-full bg-white/20 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[84%]" />
            </div>
          </div>

          {/* 4. Hydration */}
          <div className="pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Hydration</span>
              <button
                onClick={handleAddWater}
                className="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition text-[10px] font-bold flex items-center gap-1 border border-sky-500/20"
                title="Log 250ml"
              >
                <Plus size={10} /> 250ml
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text-primary dark:text-text-darkPrimary">
                {(hydration / 1000).toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-text-secondary">/ 3.0 L</span>
            </div>
            <div className="w-full bg-white/20 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((hydration / hydrationGoal) * 100, 100)}%` }} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* ═══ STANDALONE FLOATING SLIDER BAR (THE SLIDER THEME) ═══ */}
      <div className="py-1">
        <div className="glass-pill rounded-2xl p-1 inline-flex items-center gap-1 border border-white/35 dark:border-white/10 shadow-md relative">
          {HEALTH_SLIDER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-2 transition-colors whitespace-nowrap z-10 ${
                  isActive
                    ? "text-text-primary dark:text-text-darkPrimary"
                    : "text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary"
                }`}
              >
                {/* Smooth Animated Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="health-tab-slider"
                    className="absolute inset-0 bg-white/70 dark:bg-white/15 rounded-xl shadow-xs border border-white/40 dark:border-white/15 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon size={14} className={isActive ? "text-accent" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ SURFACE 2: MASTER INTERACTIVE HEALTH STUDIO (ONE CLEAN CANVAS) ═══ */}
      <div className="glass-strong rounded-3xl p-6 border border-white/35 dark:border-white/10 shadow-2xl min-h-[460px]">
        
        {/* ── TAB 1: HEALTH AI COPILOT ── */}
        {activeTab === "ai" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary dark:text-text-darkPrimary">
                    Spark AI Health Coach
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Personalized biometric guidance based on your recovery & habits
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-spark-ai", {
                    detail: { prompt: "Review my personal health logs and give me a full recovery recommendation." }
                  }));
                }}
                className="text-[11px] font-bold text-accent dark:text-accent-dark hover:underline flex items-center gap-1"
              >
                Open in Floating Copilot <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Quick Consultation Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {HEALTH_AI_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(preset.prompt);
                      handleAskHealthAi(preset.prompt);
                    }}
                    className="flex flex-col p-3 rounded-2xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 text-left border border-white/30 dark:border-white/10 transition group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${preset.color}`}>
                        <Icon size={13} />
                      </div>
                      <h4 className="text-[12px] font-bold text-text-primary dark:text-text-darkPrimary group-hover:text-accent transition truncate">
                        {preset.title}
                      </h4>
                    </div>
                    <p className="text-[10.5px] text-text-secondary line-clamp-2 leading-relaxed">
                      {preset.prompt}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Consultation Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskHealthAi();
              }}
              className="flex items-center gap-2 p-1.5 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 focus-within:border-accent/50 transition"
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask about workouts, recovery, nutrition, supplements..."
                className="flex-1 bg-transparent px-3 py-1.5 text-[13px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim() || loadingAi}
                className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-[12px] flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition shadow-md shadow-accent/20"
              >
                {loadingAi ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Consult Coach</span>
              </button>
            </form>

            {/* AI Response Card */}
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl glass-subtle border border-accent/25 text-[13px] leading-relaxed text-text-primary dark:text-text-darkPrimary space-y-2 whitespace-pre-wrap shadow-sm"
              >
                {aiResponse.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: MEDICAL & HEALTH RECORDS ── */}
        {activeTab === "records" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/8">
              <div>
                <h3 className="text-sm font-bold text-text-primary dark:text-text-darkPrimary">
                  Medical & Health Records
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Prescriptions, doctor summaries, and physical logs synced directly with your notes
                </p>
              </div>
              <button
                onClick={handleCreateHealthNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 text-accent dark:text-accent-dark font-bold text-xs hover:bg-accent/25 transition border border-accent/20"
              >
                <Plus size={13} /> Add Health Record
              </button>
            </div>

            {loadingNotes ? (
              <div className="py-20 flex flex-col items-center justify-center text-text-secondary">
                <RefreshCw size={20} className="animate-spin text-accent mb-2" />
                <span className="text-xs">Loading health notes...</span>
              </div>
            ) : healthNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {healthNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate(`/notes/${note.id}`)}
                    className="p-4 rounded-2xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between border border-white/30 dark:border-white/10 transition group"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-[13px] font-bold text-text-primary dark:text-text-darkPrimary truncate group-hover:text-accent transition">
                        {note.title || "Untitled Health Note"}
                      </h4>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5">
                        {(note.content || "").replace(/<[^>]*>?/gm, "").slice(0, 100)}...
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-text-secondary group-hover:text-accent transition flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-2xl glass-subtle border border-dashed border-white/30 dark:border-white/10">
                <Stethoscope size={30} className="mx-auto text-text-secondary/60 mb-2" />
                <p className="text-[13px] font-semibold text-text-primary dark:text-text-darkPrimary">
                  No health records logged yet
                </p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Keep doctor recommendations, prescription updates, and lab reports organized in one spot.
                </p>
                <button
                  onClick={handleCreateHealthNote}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-accent text-white text-[11px] font-bold shadow-md shadow-accent/20 hover:opacity-90 transition inline-flex items-center gap-1.5"
                >
                  <Plus size={12} /> Create First Health Note
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 3: SCHEDULE & DAILY HABITS ── */}
        {activeTab === "schedule" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Left: Health Appointments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/20 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-rose-400" />
                  <h4 className="text-xs font-bold text-text-primary dark:text-text-darkPrimary uppercase tracking-wider">
                    Upcoming Appointments
                  </h4>
                </div>
                <button
                  onClick={() => navigate("/calendar")}
                  className="text-[11px] font-bold text-accent dark:text-accent-dark hover:underline"
                >
                  View Calendar
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h5 className="text-[12.5px] font-bold text-rose-500 dark:text-rose-400">
                      Dental Cleaning & Hygiene Checkup
                    </h5>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Dr. Martinez • Downtown Dental Clinic • 10:00 AM
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Sep 18
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h5 className="text-[12.5px] font-bold text-indigo-400">
                      Mobility & Spinal Alignment Yoga
                    </h5>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      30-min restorative stretch session • 06:30 PM
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Tomorrow
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Daily Wellness Habits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/20 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-text-primary dark:text-text-darkPrimary uppercase tracking-wider">
                    Daily Wellness Protocol
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-500">
                  {habits.filter(h => h.done).length} / {habits.length} Done
                </span>
              </div>

              <div className="space-y-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="p-3 rounded-2xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 border border-white/30 dark:border-white/10 flex items-center gap-3 cursor-pointer transition"
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                      habit.done
                        ? "bg-accent text-white shadow-xs"
                        : "border border-white/40 dark:border-white/20"
                    }`}>
                      {habit.done && <Check size={12} className="stroke-[3]" />}
                    </div>
                    <span className={`text-[12.5px] font-medium transition ${
                      habit.done ? "line-through opacity-60 text-text-secondary" : "text-text-primary dark:text-text-darkPrimary"
                    }`}>
                      {habit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
