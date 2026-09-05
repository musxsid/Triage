import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import SimplyNotesMockup from "../components/ui/SimplyNotesMockup";
import {
  FileText,
  Zap,
  Layout,
  Brain,
  Search,
  Users,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  FolderOpen,
  Keyboard,
  Star,
  ExternalLink,
  ChevronDown,
  Check,
  HelpCircle,
  Code2,
  Compass,
  Layers,
  Palette,
  Lightbulb,
  Heart,
  Menu,
  X,
  Lock,
  Cloud,
  MousePointerClick
} from "lucide-react";

// ANIMATION VARIANTS
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [annualBilling, setAnnualBilling] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Explore section state
  const [exploreCategory, setExploreCategory] = useState("engineering");
  
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Hero interactive background mouse hover tracking
  const [heroMousePos, setHeroMousePos] = useState({ x: 0, y: 0 });
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHeroMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const exploreData = {
    engineering: {
      title: "Distributed Cache Architecture & Fallbacks",
      tag: "Engineering Docs",
      author: "Alex Rivers",
      avatar: "A",
      time: "Updated 2h ago",
      snippet: "Outlined the read-through caching layer using Redis clusters. Ensured graceful degradation to primary database replica pools with circuit breaker trips at 99.5th percentile latency.",
      code: `// Health check ping for Redis cluster\nconst isHealthy = await cacheCluster.ping();\nif (!isHealthy) return fallbackDatabase.fetch();`,
      highlights: ["Zero-downtime cache invalidation", "Sub-5ms response thresholds", "Automated retry backoff"]
    },
    design: {
      title: "Liquid Glass System — Light Refraction Spec",
      tag: "Design & UX",
      author: "Mia Lin",
      avatar: "M",
      time: "Updated 4h ago",
      snippet: "Defined token specifications for frosted glass refraction borders. Uses 24px dual-layer backdrop blur with a 1px white highlight rim to mimic physical crystal surfaces.",
      code: `/* Liquid Glass Refraction Token */\nbackdrop-filter: blur(28px) saturate(1.4);\nborder: 1px solid rgba(255, 255, 255, 0.22);`,
      highlights: ["Physical light simulation", "Adaptive dark mode contrast", "Consistent border illumination"]
    },
    writing: {
      title: "The Solitude of Morning Thoughts",
      tag: "Personal Journal",
      author: "Siddharth",
      avatar: "S",
      time: "Updated Yesterday",
      snippet: "There is an unspoken clarity in the first hour of daylight. Without notifications or inbox clutter, words assemble themselves naturally, free from artificial urgency.",
      code: `"Creativity is not forced from pressure; it unfolds when the mind is offered quiet room to breathe."`,
      highlights: ["Distraction-free focus", "Auto-markdown formatting", "End-to-end encrypted storage"]
    },
    product: {
      title: "Q4 Roadmap: Real-time Multi-User Boards",
      tag: "Product Strategy",
      author: "Elena Rostova",
      avatar: "E",
      time: "Updated 3 days ago",
      snippet: "Synthesized feedback from beta cohort. 88% requested real-time cursor presence inside boards. Prioritizing CRDT-based synchronization protocol for collaborative editing.",
      code: `Milestone 1: WebRTC DataChannels (Oct 15)\nMilestone 2: Multi-cursor presence indicators (Nov 01)`,
      highlights: ["CRDT Conflict-free sync", "Workspace permission gates", "Public link sharing"]
    }
  };

  const faqs = [
    {
      q: "How does SimplyNotes differ from traditional note taking apps?",
      a: "SimplyNotes is engineered around calm productivity. Instead of chaotic nested folders, it organizes your thoughts into a clean, chronological activity feed with flexible project boards, frosted glass surfaces, and built-in Spark AI for immediate synthesis."
    },
    {
      q: "Can I use SimplyNotes completely free?",
      a: "Yes! The Starter tier is 100% free forever with unlimited notes, workspaces, and full light/dark mode support. No credit card is required to get started."
    },
    {
      q: "How does Spark AI work with my notes?",
      a: "Spark AI is an intelligent workspace partner that can summarize lengthy meeting notes, reformat messy brain-dumps into structured action items, fix grammar, and brainstorm creative angles—all with one click."
    },
    {
      q: "Is my data private and secure?",
      a: "Your notes belong to you. All communication is encrypted via TLS/SSL, user passwords use BCrypt salting, and public sharing is strictly opt-in per note with cryptographically secure tokens."
    },
    {
      q: "Can I access my notes on mobile devices?",
      a: "Yes. SimplyNotes is fully responsive with liquid glass mobile views, slide-out drawers, and adaptive touch-friendly action controls."
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-500 relative selection:bg-accent/30 selection:text-text-primary">
      
      {/* ═══════════════════════════════════════════════ */}
      {/*  MARBLE BACKGROUND & AMBIENT GLOW ORBS         */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <img
          src={darkMode ? "/dark-marble-bg.jpg" : "/peach-marble-bg.jpg"}
          alt="Marble Texture"
          className="w-full h-full object-cover object-center transition-opacity duration-700 opacity-90 scale-105"
        />
        {darkMode ? (
          <div className="absolute inset-0 bg-[#1A1412]/50 backdrop-blur-[2px]" />
        ) : (
          <div className="absolute inset-0 bg-[#FFF8F3]/40 backdrop-blur-[1px]" />
        )}

        {/* Ambient Glowing Orbs with Pulse & Float Animation */}
        <div className="absolute top-[8%] left-[-6%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[130px] animate-pulse-glow" />
        <div className="absolute top-[35%] right-[-8%] w-[600px] h-[600px] rounded-full bg-[#E8784A]/15 blur-[150px] animate-float-slow" />
        <div className="absolute bottom-[15%] left-[25%] w-[450px] h-[450px] rounded-full bg-[#FFA278]/15 blur-[140px] animate-float-reverse" />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*  FIXED TOP NAVBAR (STAYS PERMANENTLY IN PLACE) */}
      {/* ═══════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 md:px-12 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto glass rounded-2xl px-5 sm:px-6 py-3 flex justify-between items-center shadow-glass dark:shadow-glassDark backdrop-blur-xl border border-white/60 dark:border-white/15">
          
          {/* Brand Logo */}
          <div 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl btn-coral flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <FileText size={18} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-text-primary"}`}>
                SimplyNotes
              </span>
              <span className="text-[10px] font-bold text-accent dark:text-[#FFA278] bg-accent/15 dark:bg-accent/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Beta
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Smooth Scroll without Losing Navbar) */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-text-secondary dark:text-[#D6CBC4]">
            <a href="#features" className="hover:text-accent dark:hover:text-white transition-colors">Features</a>
            <a href="#explore" className="hover:text-accent dark:hover:text-white transition-colors">Explore</a>
            <a href="#about" className="hover:text-accent dark:hover:text-white transition-colors">About</a>
            <a href="#pricing" className="hover:text-accent dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-accent dark:hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Nav Right Controls */}
          <div className="flex gap-2.5 items-center">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl glass-subtle hover:scale-105 active:scale-95 transition-all text-base border border-white/30 dark:border-white/10"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "🌞" : "🌙"}
            </button>

            {/* Sign In */}
            <button
              onClick={() => navigate("/login")}
              className={`hidden sm:inline-block px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                darkMode
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-text-primary hover:bg-white/50"
              }`}
            >
              Sign In
            </button>

            {/* Get Started Button */}
            <button
              onClick={() => navigate("/signup")}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm btn-coral hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
            >
              Get Started <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl glass-subtle text-text-primary dark:text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 p-4 glass rounded-2xl max-w-6xl mx-auto shadow-2xl flex flex-col gap-3 text-sm font-semibold border border-white/40 dark:border-white/15"
            >
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="px-3 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5">Features</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#explore" className="px-3 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5">Explore</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#about" className="px-3 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5">About</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="px-3 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5">Pricing</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#faq" className="px-3 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5">FAQ</a>
              <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-xl glass text-left px-3">Sign In</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════════════════════════════════════════ */}
      {/* 1. HERO SECTION WITH BACKGROUND ANIMATIONS      */}
      {/* ═══════════════════════════════════════════════ */}
      <section 
        onMouseMove={handleHeroMouseMove}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className="relative pt-32 sm:pt-36 md:pt-40 pb-16 px-6 text-center overflow-hidden"
      >
        {/* ─── DYNAMIC MOUSE-TRACKING COLOR SPOTLIGHT IN HERO BACKGROUND ─── */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700 -z-0"
          style={{
            opacity: isHeroHovered ? 0.85 : 0.4,
            background: isHeroHovered
              ? `radial-gradient(750px circle at ${heroMousePos.x}px ${heroMousePos.y}px, ${
                  darkMode ? 'rgba(232, 120, 74, 0.15)' : 'rgba(232, 120, 74, 0.11)'
                }, ${
                  darkMode ? 'rgba(255, 162, 120, 0.05)' : 'rgba(255, 178, 142, 0.06)'
                } 40%, transparent 70%)`
              : `radial-gradient(700px circle at 50% 35%, ${
                  darkMode ? 'rgba(232, 120, 74, 0.12)' : 'rgba(232, 120, 74, 0.08)'
                }, transparent 70%)`
          }}
        />



        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto relative z-10"
        >
          {/* Floating Pill Badge */}
          <motion.div
            variants={fadeUp}
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-subtle mb-6 border border-accent/25 shadow-sm"
          >
            <Sparkles size={14} className="text-accent dark:text-[#FFA278] animate-spin-slow" />
            <span className="text-xs font-semibold text-accent dark:text-[#FFA278]">
              Tempo UI + Liquid Glass Architecture
            </span>
          </motion.div>

          {/* Main Title with Staggered Entrance */}
          <motion.h1
            variants={fadeUp}
            className={`text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight ${
              darkMode ? "text-white" : "text-text-primary"
            }`}
          >
            Your Thoughts, <br className="hidden sm:block" />
            <span className="text-gradient-coral">
              Organized Intelligently.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed ${
              darkMode ? "text-[#D6CBC4]" : "text-text-secondary"
            }`}
          >
            A calm, distraction-free workspace designed with liquid glass aesthetics.
            Capture thoughts in an activity feed, organize into boards, and refine with built-in AI.
          </motion.p>

          {/* CTA Buttons with Spring Physics */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center items-center gap-4 mt-10">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/signup")}
              className="px-8 py-4 rounded-2xl font-bold text-[15px] btn-coral flex items-center gap-2 group shadow-xl"
            >
              Start Writing Free
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              className={`px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all glass hover:shadow-glassHover ${
                darkMode ? "text-white" : "text-text-primary"
              }`}
            >
              Explore Live Workspace
            </motion.button>
          </motion.div>

          {/* Trust Highlights with Liquid Glass Pills */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-text-secondary dark:text-[#D6CBC4]">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle border border-white/20 dark:border-white/10">
              <CheckCircle2 size={14} className="text-accent dark:text-[#FFA278]" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle border border-white/20 dark:border-white/10">
              <CheckCircle2 size={14} className="text-accent dark:text-[#FFA278]" /> Instant Ctrl+K search
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle border border-white/20 dark:border-white/10">
              <CheckCircle2 size={14} className="text-accent dark:text-[#FFA278]" /> Light & Dark mode
            </span>
          </motion.div>
        </motion.div>

        {/* ═══ LIVE REPLICATED APP SHOWCASE (WITH AUTOMATED WORKFLOW DEMO) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 md:mt-20 max-w-6xl mx-auto px-2 sm:px-6 relative z-10"
        >
          <div className="relative rounded-[28px] p-2 sm:p-3 glass glass-shimmer shadow-2xl border border-white/40 dark:border-white/15">
            
            {/* Desktop Window Chrome */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/20 dark:border-white/10 bg-surface/90 dark:bg-[#1E1613]">
              
              {/* Window Header */}
              <div className="px-4 py-3 bg-white/40 dark:bg-white/5 border-b border-border/50 dark:border-border-dark/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  <span className="ml-3 text-xs font-mono text-text-secondary dark:text-[#D6CBC4] opacity-70 hidden sm:inline">
                    simplynotes.app — Live Workflow Demonstration
                  </span>
                </div>

                {/* View Switchers */}
                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("feed")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === "feed"
                        ? "bg-white dark:bg-white/15 text-text-primary dark:text-white shadow-sm font-bold"
                        : "text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary"
                    }`}
                  >
                    Activity Feed
                  </button>
                  <button
                    onClick={() => setActiveTab("ai")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === "ai"
                        ? "bg-white dark:bg-white/15 text-text-primary dark:text-white shadow-sm font-bold"
                        : "text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary"
                    }`}
                  >
                    Spark AI
                  </button>
                </div>
              </div>

              {/* Native SimplyNotes Automated Video Mockup */}
              <div className="relative w-full overflow-hidden">
                <SimplyNotesMockup darkMode={darkMode} activeTab={activeTab} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 2. STATS BAR WITH COUNTER REVEAL               */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/15 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: "10,000+", label: "Notes Captured", color: "text-accent dark:text-[#FFA278]" },
            { num: "100ms", label: "Ctrl+K Search", color: "text-text-primary dark:text-white" },
            { num: "100%", label: "Liquid Glass Theme", color: "text-text-primary dark:text-white" },
            { num: "99.9%", label: "Cloud Uptime", color: "text-accent dark:text-[#FFA278]" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="p-3 rounded-2xl glass-subtle transition-all cursor-default"
            >
              <h4 className={`text-3xl font-extrabold ${stat.color}`}>{stat.num}</h4>
              <p className="text-xs font-semibold text-text-secondary dark:text-[#D6CBC4] uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 3. CORE FEATURES (TILT CARDS & 3D ART)        */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="features" className="scroll-mt-28 py-24 md:py-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/10 dark:bg-accent/25 px-3 py-1 rounded-full"
          >
            Engineered For Clarity
          </motion.span>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 ${darkMode ? "text-white" : "text-text-primary"}`}>
            Crafted for thinkers, creators & builders.
          </h2>
          <p className="text-base sm:text-lg text-text-secondary dark:text-[#D6CBC4] max-w-2xl mx-auto mt-3">
            Every screen is thoughtfully designed to remove cognitive noise and keep your creative flow going.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Feature 1: Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="glass glass-shimmer rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all border border-white/40 dark:border-white/10 hover:border-accent/40"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/20 dark:bg-white/5">
              <img
                src="/feature-editor.jpg"
                alt="Distraction-Free Editor"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 p-2.5 rounded-xl glass shadow-md text-accent dark:text-[#FFA278]">
                <Zap size={20} />
              </div>
            </div>
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-text-primary"}`}>
                  Fluid Writing Canvas
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary dark:text-[#D6CBC4]">
                  Rich formatting, seamless markdown, inline drag-and-drop image uploads, and clean typography that makes journaling a joy.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-accent dark:text-[#FFA278]">
                <span>Try the editor</span> <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: AI */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass glass-shimmer rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all border border-accent/30 hover:border-accent"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/20 dark:bg-white/5">
              <img
                src="/feature-ai.jpg"
                alt="Spark AI Intelligence"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 p-2.5 rounded-xl glass shadow-md text-accent dark:text-[#FFA278]">
                <Brain size={20} />
              </div>
            </div>
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-text-primary"}`}>
                  Spark AI Partner
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary dark:text-[#D6CBC4]">
                  Summarize key meeting takeaways, polish drafts, brainstorm new directions, and structure chaotic thoughts into actionable plans.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-accent dark:text-[#FFA278]">
                <span>Explore AI capabilities</span> <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Boards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass glass-shimmer rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all border border-white/40 dark:border-white/10 hover:border-accent/40"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/20 dark:bg-white/5">
              <img
                src="/feature-boards.jpg"
                alt="Organized Boards & Workspaces"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 p-2.5 rounded-xl glass shadow-md text-accent dark:text-[#FFA278]">
                <Layout size={20} />
              </div>
            </div>
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-text-primary"}`}>
                  Boards & Workspaces
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary dark:text-[#D6CBC4]">
                  Keep projects, personal reflections, and team notes separated in distinct workspaces with customizable icons and folder boards.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-accent dark:text-[#FFA278]">
                <span>Manage workspaces</span> <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 4. EXPLORE SECTION: INTERACTIVE WORKSPACE LAB   */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="explore" className="scroll-mt-28 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/10 dark:bg-accent/25 px-3 py-1 rounded-full">
            Live Workspace Explorer
          </span>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 ${darkMode ? "text-white" : "text-text-primary"}`}>
            Adapts to whatever you create.
          </h2>
          <p className="text-base text-text-secondary dark:text-[#D6CBC4] max-w-xl mx-auto mt-3">
            Switch between use cases to see how SimplyNotes formats notes, code, reflections, and roadmaps.
          </p>
        </div>

        {/* Category Pill Switcher */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 max-w-2xl mx-auto">
          {[
            { id: "engineering", label: "Engineering Docs", icon: Code2 },
            { id: "design", label: "Design & UX", icon: Palette },
            { id: "writing", label: "Personal Journal", icon: Heart },
            { id: "product", label: "Product Strategy", icon: Compass },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = exploreCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setExploreCategory(cat.id)}
                className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? "btn-coral text-white shadow-lg scale-105"
                    : "glass hover:shadow-glassHover text-text-secondary dark:text-[#D6CBC4]"
                }`}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Animated Explorer Content Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={exploreCategory}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="glass rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/40 dark:border-white/10 max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20 dark:border-white/10 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-accent dark:text-[#FFA278] mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent dark:bg-[#FFA278] animate-ping" />
                  <span className="px-2.5 py-0.5 rounded-md bg-accent/15 font-bold uppercase tracking-wider text-[10px]">
                    {exploreData[exploreCategory].tag}
                  </span>
                </div>
                <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-text-primary"}`}>
                  {exploreData[exploreCategory].title}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-[#D6CBC4]">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent dark:text-[#FFA278] font-bold flex items-center justify-center">
                  {exploreData[exploreCategory].avatar}
                </div>
                <div>
                  <p className="font-bold text-text-primary dark:text-white leading-tight">{exploreData[exploreCategory].author}</p>
                  <p className="text-[11px] leading-tight">{exploreData[exploreCategory].time}</p>
                </div>
              </div>
            </div>

            {/* Snippet text */}
            <p className="text-sm sm:text-base leading-relaxed text-text-secondary dark:text-[#E2D8D2] mb-6">
              {exploreData[exploreCategory].snippet}
            </p>

            {/* Code / Highlight preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-black/40 border border-white/20 dark:border-white/10 font-mono text-xs text-text-primary dark:text-[#FFA278] mb-6 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{exploreData[exploreCategory].code}</pre>
            </div>

            {/* Feature bullets */}
            <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 dark:border-white/10">
              {exploreData[exploreCategory].highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-text-secondary dark:text-[#D6CBC4]">
                  <CheckCircle2 size={15} className="text-accent dark:text-[#FFA278] flex-shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 5. ABOUT SECTION: THE LIQUID GLASS PHILOSOPHY  */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="about" className="scroll-mt-28 py-24 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/10 dark:bg-accent/25 px-3 py-1 rounded-full">
              The SimplyNotes Philosophy
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6 ${darkMode ? "text-white" : "text-text-primary"}`}>
              Built for depth in a world of endless noise.
            </h2>
            <p className="text-base leading-relaxed text-text-secondary dark:text-[#D6CBC4] mb-4">
              Modern note apps have become overwhelming databases of widgets, complex databases, and constant alerts. We built SimplyNotes on a different thesis: <em>your ideas deserve peace</em>.
            </p>
            <p className="text-base leading-relaxed text-text-secondary dark:text-[#D6CBC4] mb-8">
              Our <strong>Liquid Glass design system</strong> simulates physical frosted glass—offering depth and ambient light refraction without distracting clutter. Notes appear in an organic timeline feed, just like your daily stream of consciousness.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl glass border border-white/30 dark:border-white/10 shadow-sm">
                <h4 className="font-bold text-sm text-text-primary dark:text-white mb-1">Zero Lock-In</h4>
                <p className="text-xs text-text-secondary dark:text-[#D6CBC4]">Export notes to standard Markdown or JSON at any moment.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl glass border border-white/30 dark:border-white/10 shadow-sm">
                <h4 className="font-bold text-sm text-text-primary dark:text-white mb-1">Sub-100ms Latency</h4>
                <p className="text-xs text-text-secondary dark:text-[#D6CBC4]">Optimized database reads ensure instantaneous navigation.</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Layered Glass Showcase Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass glass-shimmer rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-white/10 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl btn-coral flex items-center justify-center text-white">
                  <Layers size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-text-primary dark:text-white">Three Pillars of Clarity</h4>
                  <p className="text-xs text-text-secondary dark:text-[#D6CBC4]">Engineered for flow state</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: "1. Capture", desc: "Instantly jot down thoughts with quick keyboard triggers." },
                  { title: "2. Organize", desc: "Group seamlessly into boards without rigid hierarchies." },
                  { title: "3. Synthesize", desc: "Let Spark AI distill meetings, books, and brainstorms." }
                ].map((step, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 6 }}
                    className="p-4 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 flex items-start gap-3.5 transition-all cursor-default"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent dark:text-[#FFA278] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-text-primary dark:text-white">{step.title}</h5>
                      <p className="text-xs text-text-secondary dark:text-[#D6CBC4] mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Ambient Backing Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-[#FFA278]/20 rounded-3xl blur-2xl -z-10" />
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 6. PRICING SECTION (PERFECTLY ALIGNED & UNCUT)  */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="pricing" className="scroll-mt-28 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/10 dark:bg-accent/25 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 ${darkMode ? "text-white" : "text-text-primary"}`}>
            Simple, honest plans for everyone.
          </h2>
          <p className="text-base text-text-secondary dark:text-[#D6CBC4] max-w-md mx-auto mt-3">
            Start completely free. Upgrade whenever you need advanced AI and collaborative boards.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 glass rounded-2xl shadow-md border border-white/30 dark:border-white/10">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !annualBilling
                  ? "btn-coral text-white shadow-md"
                  : "text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                annualBilling
                  ? "btn-coral text-white shadow-md"
                  : "text-text-secondary dark:text-[#D6CBC4] hover:text-text-primary"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* ─── PRICING CARDS GRID (ALL 3 EQUALLY SIZED & BASELINE ALIGNED) ─── */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch pt-2">
          
          {/* Plan 1: Starter */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass rounded-3xl p-7 sm:p-8 shadow-xl flex flex-col justify-between border border-white/40 dark:border-white/10 hover:border-accent/40 transition-all h-full"
          >
            <div>
              {/* Card Top Category Tag */}
              <div className="flex items-center justify-between mb-4 h-7">
                <span className="text-[11px] font-bold text-text-secondary dark:text-[#D6CBC4] bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Personal
                </span>
              </div>

              <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-text-primary"}`}>Starter</h3>
              <p className="text-xs text-text-secondary dark:text-[#D6CBC4] mt-1">For casual daily thinkers</p>
              
              <div className="mt-6 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-text-primary dark:text-white">$0</span>
                <span className="text-xs text-text-secondary dark:text-[#D6CBC4] ml-2">forever</span>
              </div>

              <div className="space-y-3 text-xs font-medium text-text-secondary dark:text-[#D6CBC4]">
                {["Unlimited personal notes", "Up to 5 custom workspace boards", "Instant Ctrl+K OmniSearch", "Light & Dark Mode", "Community support"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-accent dark:text-[#FFA278] flex-shrink-0 font-bold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/signup")}
              className="mt-8 w-full py-3.5 rounded-2xl glass font-bold text-sm text-text-primary dark:text-white hover:shadow-glassHover hover:scale-[1.02] active:scale-95 transition-all border border-white/40 dark:border-white/10"
            >
              Get Started Free
            </button>
          </motion.div>

          {/* Plan 2: Pro Thinker (Popular, Fully Contained Header, No Clipping) */}
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            className="glass glass-shimmer rounded-3xl p-7 sm:p-8 shadow-2xl flex flex-col justify-between border-2 border-accent dark:border-[#FFA278] relative transition-all h-full bg-accent/[0.03] dark:bg-accent/[0.05]"
          >
            <div>
              {/* Card Top Category Tag with "Most Popular" (Contained inside card, NEVER clipped) */}
              <div className="flex items-center justify-between mb-4 h-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full btn-coral text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                  <Sparkles size={12} /> Most Popular
                </div>
                <span className="text-[11px] font-bold text-accent dark:text-[#FFA278] bg-accent/15 dark:bg-accent/25 px-2.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </div>

              <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-text-primary"}`}>Pro Thinker</h3>
              <p className="text-xs text-text-secondary dark:text-[#D6CBC4] mt-1">For creators & power writers</p>
              
              <div className="mt-6 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-accent dark:text-[#FFA278]">
                  {annualBilling ? "$6" : "$8"}
                </span>
                <span className="text-xs text-text-secondary dark:text-[#D6CBC4] ml-2">/ month, billed {annualBilling ? "annually" : "monthly"}</span>
              </div>

              <div className="space-y-3 text-xs font-medium text-text-secondary dark:text-[#D6CBC4]">
                {[
                  "Everything in Starter",
                  "Unlimited boards & workspaces",
                  "Spark AI Assistant (1,000 monthly credits)",
                  "1-Click Public Web Sharing with custom links",
                  "Custom board cover artwork & icons",
                  "Priority cloud backup & sync"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-accent dark:text-[#FFA278] flex-shrink-0 font-bold" />
                    <span className="font-semibold text-text-primary dark:text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/signup")}
              className="mt-8 w-full py-3.5 rounded-2xl btn-coral font-bold text-sm text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Start 14-Day Free Trial
            </button>
          </motion.div>

          {/* Plan 3: Studio Team */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass rounded-3xl p-7 sm:p-8 shadow-xl flex flex-col justify-between border border-white/40 dark:border-white/10 hover:border-accent/40 transition-all h-full"
          >
            <div>
              {/* Card Top Category Tag */}
              <div className="flex items-center justify-between mb-4 h-7">
                <span className="text-[11px] font-bold text-text-secondary dark:text-[#D6CBC4] bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Enterprise
                </span>
              </div>

              <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-text-primary"}`}>Studio Team</h3>
              <p className="text-xs text-text-secondary dark:text-[#D6CBC4] mt-1">For teams & research collectives</p>
              
              <div className="mt-6 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-text-primary dark:text-white">
                  {annualBilling ? "$12" : "$16"}
                </span>
                <span className="text-xs text-text-secondary dark:text-[#D6CBC4] ml-2">/ seat / month</span>
              </div>

              <div className="space-y-3 text-xs font-medium text-text-secondary dark:text-[#D6CBC4]">
                {[
                  "Everything in Pro Thinker",
                  "Shared team workspaces",
                  "Multi-user permission levels",
                  "Unlimited Spark AI for all members",
                  "Dedicated account manager",
                  "99.99% uptime SLA"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-accent dark:text-[#FFA278] flex-shrink-0 font-bold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/signup")}
              className="mt-8 w-full py-3.5 rounded-2xl glass font-bold text-sm text-text-primary dark:text-white hover:shadow-glassHover hover:scale-[1.02] active:scale-95 transition-all border border-white/40 dark:border-white/10"
            >
              Contact Team Sales
            </button>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 7. FAQ ACCORDION SECTION                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="faq" className="scroll-mt-28 py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/10 dark:bg-accent/25 px-3 py-1 rounded-full">
            Answers & Clarity
          </span>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 ${darkMode ? "text-white" : "text-text-primary"}`}>
            Frequently Asked Questions
          </h2>
          <p className="text-base text-text-secondary dark:text-[#D6CBC4] max-w-md mx-auto mt-3">
            Everything you need to know about SimplyNotes and the Liquid Glass architecture.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <motion.div
                key={idx}
                initial={false}
                className="glass rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden shadow-sm hover:border-accent/30 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-text-primary dark:text-white"
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-accent dark:text-[#FFA278] flex-shrink-0"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-text-secondary dark:text-[#D6CBC4] leading-relaxed border-t border-white/15 dark:border-white/8 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 8. FINAL CALL TO ACTION                        */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[32px] glass glass-shimmer p-12 md:p-20 shadow-2xl overflow-hidden border-2 border-accent/30 hover:border-accent/60 transition-all"
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-accent dark:text-[#FFA278] uppercase tracking-widest bg-accent/15 px-3 py-1 rounded-full">
              Begin Your Journey
            </span>
            <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight mt-5 mb-4 ${darkMode ? "text-white" : "text-text-primary"}`}>
              Start writing with clarity today.
            </h2>
            <p className="text-base text-text-secondary dark:text-[#D6CBC4] mb-8 max-w-lg mx-auto leading-relaxed">
              Join thousands organizing their ideas in SimplyNotes. Free forever for your personal notes and ideas.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/signup")}
                className="px-8 py-4 rounded-2xl font-bold text-base btn-coral shadow-2xl"
              >
                Create Free Workspace
              </motion.button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-2xl font-semibold text-base glass hover:shadow-glassHover transition-all text-text-primary dark:text-white"
              >
                Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 9. FOOTER                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <footer className="border-t border-white/20 dark:border-white/10 py-12 px-6 text-center text-xs font-medium text-text-secondary dark:text-[#D6CBC4]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-coral flex items-center justify-center text-white text-xs font-bold">
              SN
            </div>
            <span className="font-bold text-sm text-text-primary dark:text-white">SimplyNotes</span>
            <span className="opacity-60">— All rights reserved © 2026.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 font-semibold">
            <a href="#features" className="hover:text-accent dark:hover:text-white transition-colors">Features</a>
            <a href="#explore" className="hover:text-accent dark:hover:text-white transition-colors">Explore</a>
            <a href="#about" className="hover:text-accent dark:hover:text-white transition-colors">About</a>
            <a href="#pricing" className="hover:text-accent dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-accent dark:hover:text-white transition-colors">FAQ</a>
            <span onClick={() => navigate("/login")} className="cursor-pointer hover:text-accent dark:hover:text-white transition-colors">Sign In</span>
            <span onClick={() => navigate("/signup")} className="cursor-pointer hover:text-accent dark:hover:text-white transition-colors">Sign Up</span>
          </div>
        </div>
      </footer>

    </div>
  );
}