import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus, Sparkles, Trash2, Copy, FileText,
  RotateCcw, Palette, Pin, Check, ArrowRight,
  Maximize2, Move, Lightbulb, Zap, SendHorizontal,
  MousePointer, Square, Diamond, Type, PenTool,
  Eraser, Download, Milestone, GitFork, Undo2,
  ChevronRight, Compass, Layers, ShieldCheck,
  Grid, Bookmark, HelpCircle
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote, generateAIContent } from "../services/notesService";

// Authentic Physical Sticky Note Palettes (Real Post-It Paper Shades)
const STICKY_PALETTES = {
  yellow: {
    id: "yellow",
    name: "Classic Yellow",
    bg: "bg-[#FFF9A6] dark:bg-[#FDF073]",
    border: "border-[#F5E642]",
    text: "text-[#3D2B05]",
    secondaryText: "text-[#6E5316]",
    pinColor: "#EF4444", // Red pushpin
    dot: "bg-[#F5E642]",
    hex: "#FDE047",
    rotate: "-1deg",
  },
  pink: {
    id: "pink",
    name: "Neon Rose",
    bg: "bg-[#FFD1DC] dark:bg-[#FBAEC4]",
    border: "border-[#F883A6]",
    text: "text-[#4A0424]",
    secondaryText: "text-[#831843]",
    pinColor: "#EC4899", // Rose pushpin
    dot: "bg-[#F883A6]",
    hex: "#F472B6",
    rotate: "1.2deg",
  },
  green: {
    id: "green",
    name: "Pastel Mint",
    bg: "bg-[#D1FADF] dark:bg-[#A6F4C5]",
    border: "border-[#6CE9A6]",
    text: "text-[#053321]",
    secondaryText: "text-[#065F46]",
    pinColor: "#10B981", // Emerald pushpin
    dot: "bg-[#6CE9A6]",
    hex: "#6EE7B7",
    rotate: "-0.8deg",
  },
  blue: {
    id: "blue",
    name: "Sky Cyan",
    bg: "bg-[#D1E9FF] dark:bg-[#B2DDFF]",
    border: "border-[#84CAFF]",
    text: "text-[#0A2540]",
    secondaryText: "text-[#0C4A6E]",
    pinColor: "#3B82F6", // Blue pushpin
    dot: "bg-[#84CAFF]",
    hex: "#7DD3FC",
    rotate: "0.8deg",
  },
  purple: {
    id: "purple",
    name: "Lavender",
    bg: "bg-[#EBE9FE] dark:bg-[#D9D6FE]",
    border: "border-[#BDB4FE]",
    text: "text-[#2E125E]",
    secondaryText: "text-[#581C87]",
    pinColor: "#8B5CF6", // Violet pushpin
    dot: "bg-[#BDB4FE]",
    hex: "#C084FC",
    rotate: "-1.4deg",
  },
  orange: {
    id: "orange",
    name: "Warm Peach",
    bg: "bg-[#FFE8CC] dark:bg-[#FFD8A8]",
    border: "border-[#FFC078]",
    text: "text-[#4A2408]",
    secondaryText: "text-[#7C2D12]",
    pinColor: "#F59E0B", // Gold pushpin
    dot: "bg-[#FFC078]",
    hex: "#FB923C",
    rotate: "1deg",
  },
};

const PALETTE_LIST = Object.values(STICKY_PALETTES);

// Initial Authentic Pinned Sticky Notes
const INITIAL_STICKIES = [
  {
    id: "s1",
    x: 50,
    y: 110,
    title: "🚀 Q1 Discovery & Core",
    content: "Interview early beta users. Benchmark API latency. Lock down unified Notes USP and liquid glass spec.",
    color: "yellow",
  },
  {
    id: "s2",
    x: 350,
    y: 110,
    title: "⚡ Q2 Connected Ecosystem",
    content: "Integrate Google OAuth for Calendar and Email. Build interactive Whiteboard with authentic paper notes.",
    color: "pink",
  },
  {
    id: "s3",
    x: 650,
    y: 110,
    title: "🌟 Q3 Ambient Intelligence",
    content: "Universal floating AI Copilot querying calendar schedules, urgent emails, and notes simultaneously.",
    color: "green",
  },
];

// Initial Diagram & Roadmap Nodes
const INITIAL_NODES = [
  {
    id: "m1",
    nodeType: "milestone",
    x: 50,
    y: 40,
    title: "PHASE 1: FOUNDATION",
    subtitle: "Architecture & Schema",
    color: "yellow",
  },
  {
    id: "m2",
    nodeType: "milestone",
    x: 350,
    y: 40,
    title: "PHASE 2: WORKSPACE",
    subtitle: "Google Auth & Whiteboard",
    color: "pink",
  },
  {
    id: "m3",
    nodeType: "milestone",
    x: 650,
    y: 40,
    title: "PHASE 3: AMBIENT AI",
    subtitle: "Autonomous Workflows",
    color: "green",
  },
];

const INITIAL_ARROWS = [
  { id: "a1", startX: 250, startY: 60, endX: 340, endY: 60, label: "Phase 2", color: "#F59E0B" },
  { id: "a2", startX: 550, startY: 60, endX: 640, endY: 60, label: "Phase 3", color: "#EC4899" },
];

const INITIAL_TEXTS = [
  { id: "t1", x: 50, y: 340, text: "📌 Product Roadmap & Strategic Milestones", fontSize: 18, color: "#E8784A" },
];

export default function BoardPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Surface Theme: 'whiteboard' (magnetic grid) | 'pinboard' (warm cork)
  const [boardTheme, setBoardTheme] = useState("pinboard");

  // Tools: 'select' | 'sticky' | 'step' | 'decision' | 'mindmap' | 'arrow' | 'text' | 'pen' | 'eraser'
  const [activeTool, setActiveTool] = useState("select");
  const [activeColor, setActiveColor] = useState("yellow");
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Canvas Elements State
  const [stickies, setStickies] = useState(() => {
    try {
      const saved = localStorage.getItem("triage_whiteboard_stickies_v2");
      return saved ? JSON.parse(saved) : INITIAL_STICKIES;
    } catch {
      return INITIAL_STICKIES;
    }
  });

  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem("triage_whiteboard_nodes_v2");
      return saved ? JSON.parse(saved) : INITIAL_NODES;
    } catch {
      return INITIAL_NODES;
    }
  });

  const [arrows, setArrows] = useState(() => {
    try {
      const saved = localStorage.getItem("triage_whiteboard_arrows_v2");
      return saved ? JSON.parse(saved) : INITIAL_ARROWS;
    } catch {
      return INITIAL_ARROWS;
    }
  });

  const [texts, setTexts] = useState(() => {
    try {
      const saved = localStorage.getItem("triage_whiteboard_texts_v2");
      return saved ? JSON.parse(saved) : INITIAL_TEXTS;
    } catch {
      return INITIAL_TEXTS;
    }
  });

  const [drawings, setDrawings] = useState(() => {
    try {
      const saved = localStorage.getItem("triage_whiteboard_drawings_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Interactive drawing & connector state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const [arrowPreview, setArrowPreview] = useState(null);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTab, setAiTab] = useState("roadmap"); // 'roadmap' | 'mindmap' | 'flowchart' | 'kanban' | 'ideas' | 'templates'
  const [aiTopic, setAiTopic] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem("triage_whiteboard_stickies_v2", JSON.stringify(stickies));
  }, [stickies]);

  useEffect(() => {
    localStorage.setItem("triage_whiteboard_nodes_v2", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("triage_whiteboard_arrows_v2", JSON.stringify(arrows));
  }, [arrows]);

  useEffect(() => {
    localStorage.setItem("triage_whiteboard_texts_v2", JSON.stringify(texts));
  }, [texts]);

  useEffect(() => {
    localStorage.setItem("triage_whiteboard_drawings_v2", JSON.stringify(drawings));
  }, [drawings]);

  // Coordinate math
  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  // Canvas Interactions
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest(".whiteboard-interactive-card")) return;

    const { x, y } = getCanvasCoords(e);
    const selectedPalette = STICKY_PALETTES[activeColor] || STICKY_PALETTES.yellow;

    if (activeTool === "sticky") {
      const newSticky = {
        id: `s_${Date.now()}`,
        x: Math.max(20, x - 110),
        y: Math.max(20, y - 80),
        title: "New Thought",
        content: "Type your notes or action items here...",
        color: activeColor,
      };
      setStickies((prev) => [...prev, newSticky]);
      setActiveTool("select");
      toast.success("Sticky note pinned to board!");
    } else if (activeTool === "step") {
      const newNode = {
        id: `n_${Date.now()}`,
        nodeType: "step",
        x: Math.max(20, x - 90),
        y: Math.max(20, y - 35),
        title: "Process Step",
        subtitle: "Click to edit description",
        color: activeColor,
      };
      setNodes((prev) => [...prev, newNode]);
      setActiveTool("select");
      toast.success("Flowchart step placed!");
    } else if (activeTool === "decision") {
      const newNode = {
        id: `n_${Date.now()}`,
        nodeType: "decision",
        x: Math.max(20, x - 60),
        y: Math.max(20, y - 45),
        title: "Decision?",
        subtitle: "Yes / No branch",
        color: activeColor,
      };
      setNodes((prev) => [...prev, newNode]);
      setActiveTool("select");
      toast.success("Decision diamond placed!");
    } else if (activeTool === "mindmap") {
      const newNode = {
        id: `n_${Date.now()}`,
        nodeType: "mindmap",
        x: Math.max(20, x - 70),
        y: Math.max(20, y - 25),
        title: "Core Concept",
        subtitle: "Branch Thought",
        color: activeColor,
      };
      setNodes((prev) => [...prev, newNode]);
      setActiveTool("select");
      toast.success("Mindmap node placed!");
    } else if (activeTool === "text") {
      const newText = {
        id: `t_${Date.now()}`,
        x: Math.max(20, x),
        y: Math.max(20, y - 10),
        text: "Section Heading",
        fontSize: 18,
        color: selectedPalette.hex,
      };
      setTexts((prev) => [...prev, newText]);
      setActiveTool("select");
      toast.success("Text label placed!");
    } else if (activeTool === "arrow") {
      setArrowStart({ x, y });
    } else if (activeTool === "pen") {
      setIsDrawing(true);
      setCurrentLine({
        id: `d_${Date.now()}`,
        points: [{ x, y }],
        color: selectedPalette.hex,
        width: strokeWidth,
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    if (activeTool === "pen" && isDrawing && currentLine) {
      setCurrentLine((prev) => ({
        ...prev,
        points: [...prev.points, { x, y }],
      }));
    } else if (activeTool === "arrow" && arrowStart) {
      setArrowPreview({
        startX: arrowStart.x,
        startY: arrowStart.y,
        endX: x,
        endY: y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (activeTool === "pen" && isDrawing && currentLine) {
      if (currentLine.points.length > 1) {
        setDrawings((prev) => [...prev, currentLine]);
      }
      setIsDrawing(false);
      setCurrentLine(null);
    } else if (activeTool === "arrow" && arrowStart && arrowPreview) {
      const selectedPalette = STICKY_PALETTES[activeColor] || STICKY_PALETTES.yellow;
      const newArrow = {
        id: `a_${Date.now()}`,
        startX: arrowPreview.startX,
        startY: arrowPreview.startY,
        endX: arrowPreview.endX,
        endY: arrowPreview.endY,
        label: "",
        color: selectedPalette.hex,
      };
      setArrows((prev) => [...prev, newArrow]);
      setArrowStart(null);
      setArrowPreview(null);
      setActiveTool("select");
      toast.success("Connector arrow placed!");
    }
  };

  // Convert any sticky or node to workspace note
  const handleConvertToNote = async (item, fallbackTitle = "Whiteboard Item") => {
    try {
      const title = item.title || item.text || fallbackTitle;
      const content = `<h3>${title}</h3><p>${item.content || item.subtitle || ""}</p><p><em>Exported from Triage Whiteboard & Roadmap Canvas.</em></p>`;
      const res = await createNote({ title, content });
      toast.success("Converted into workspace note!");
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      }
    } catch {
      toast.error("Failed to convert item to note");
    }
  };

  // AI & Blueprint Loading Engines
  const loadBlueprint = (type) => {
    if (type === "roadmap") {
      setNodes([
        { id: "m1", nodeType: "milestone", x: 50, y: 40, title: "PHASE 1: FOUNDATION", subtitle: "Architecture & Schema", color: "yellow" },
        { id: "m2", nodeType: "milestone", x: 350, y: 40, title: "PHASE 2: WORKSPACE", subtitle: "Google Auth & Whiteboard", color: "pink" },
        { id: "m3", nodeType: "milestone", x: 650, y: 40, title: "PHASE 3: AMBIENT AI", subtitle: "Autonomous Workflows", color: "green" },
      ]);
      setStickies([
        { id: "s1", x: 50, y: 110, title: "🚀 Discovery & Core", content: "Interview early beta users. Lock down unified Notes USP and liquid glass spec.", color: "yellow" },
        { id: "s2", x: 50, y: 260, title: "⚡ Keycloak Auth", content: "Audit refresh tokens and session storage in Redis gateway.", color: "yellow" },
        { id: "s3", x: 350, y: 110, title: "📅 Google Sync", content: "Connect Google Calendar and Gmail under unified OAuth token.", color: "pink" },
        { id: "s4", x: 350, y: 260, title: "🎨 Whiteboard Canvas", content: "Interactive pinboard with draggable authentic paper stickies and marker pen.", color: "pink" },
        { id: "s5", x: 650, y: 110, title: "✨ Floating Orb Copilot", content: "Ambient AI responding to cross-app queries: 'When am I free?', 'Urgent emails'.", color: "green" },
      ]);
      setArrows([
        { id: "a1", startX: 250, startY: 60, endX: 340, endY: 60, label: "Phase 2", color: "#F59E0B" },
        { id: "a2", startX: 550, startY: 60, endX: 640, endY: 60, label: "Phase 3", color: "#EC4899" },
      ]);
      setTexts([
        { id: "t1", x: 50, y: 430, text: "🗺️ 2026 SaaS Product Roadmap & Milestones", fontSize: 18, color: "#E8784A" },
      ]);
      toast.success("Loaded 2026 Product Roadmap blueprint!");
    } else if (type === "mindmap") {
      setNodes([
        { id: "mm_c", nodeType: "mindmap", x: 380, y: 180, title: "🧠 TRIAGE CORE", subtitle: "Ambient Workspace", color: "yellow" },
        { id: "mm_1", nodeType: "mindmap", x: 100, y: 80, title: "📝 Notes USP", subtitle: "Rich Text & Folders", color: "orange" },
        { id: "mm_2", nodeType: "mindmap", x: 660, y: 80, title: "✨ Spark Copilot", subtitle: "Unified Cross-App AI", color: "purple" },
        { id: "mm_3", nodeType: "mindmap", x: 100, y: 290, title: "✉️ Smart Email", subtitle: "Priority Sorting", color: "pink" },
        { id: "mm_4", nodeType: "mindmap", x: 660, y: 290, title: "📅 Google Calendar", subtitle: "OAuth Live Sync", color: "blue" },
      ]);
      setStickies([
        { id: "s1", x: 100, y: 420, title: "💡 Notes Focus", content: "Uncluttered sidebar hierarchy with full focus on note taking and folder organization.", color: "orange" },
        { id: "s2", x: 660, y: 420, title: "⚡ Copilot Trigger", content: "Circular ambient floating orb with Ctrl+J universal shortcut.", color: "purple" },
      ]);
      setArrows([
        { id: "a1", startX: 380, startY: 195, endX: 250, endY: 105, label: "Core", color: "#FB923C" },
        { id: "a2", startX: 530, startY: 195, endX: 660, endY: 105, label: "Copilot", color: "#C084FC" },
        { id: "a3", startX: 380, startY: 215, endX: 250, endY: 305, label: "Triage", color: "#F472B6" },
        { id: "a4", startX: 530, startY: 215, endX: 660, endY: 305, label: "Schedule", color: "#7DD3FC" },
      ]);
      setTexts([
        { id: "t1", x: 50, y: 25, text: "🧠 Triage Architecture Mindmap", fontSize: 18, color: "#C084FC" },
      ]);
      toast.success("Loaded Workspace Mindmap blueprint!");
    } else if (type === "flowchart") {
      setNodes([
        { id: "fc1", nodeType: "step", x: 60, y: 120, title: "1. Client Request", subtitle: "User asks Copilot", color: "blue" },
        { id: "fc2", nodeType: "step", x: 270, y: 120, title: "2. Gateway Auth", subtitle: "Redis Session Check", color: "purple" },
        { id: "fc3", nodeType: "decision", x: 480, y: 110, title: "Token Valid?", subtitle: "Check Signature", color: "yellow" },
        { id: "fc4", nodeType: "step", x: 690, y: 120, title: "4. Business Logic", subtitle: "Execute AI Synthesis", color: "green" },
        { id: "fc5", nodeType: "step", x: 480, y: 270, title: "Reject: 401", subtitle: "Redirect to OAuth", color: "pink" },
      ]);
      setStickies([
        { id: "s1", x: 690, y: 240, title: "📋 Cache Hit", content: "Returns response in <200ms with Redis distributed caching layer.", color: "green" },
      ]);
      setArrows([
        { id: "fa1", startX: 190, startY: 145, endX: 265, endY: 145, label: "HTTP", color: "#7DD3FC" },
        { id: "fa2", startX: 400, startY: 145, endX: 475, endY: 145, label: "Validate", color: "#C084FC" },
        { id: "fa3", startX: 605, startY: 145, endX: 685, endY: 145, label: "Yes", color: "#6EE7B7" },
        { id: "fa4", startX: 545, startY: 195, endX: 545, endY: 265, label: "No", color: "#F472B6" },
      ]);
      setTexts([
        { id: "t1", x: 60, y: 40, text: "🔀 Microservices & OAuth Flowchart", fontSize: 18, color: "#7DD3FC" },
      ]);
      toast.success("Loaded Microservices Flowchart blueprint!");
    }
    setShowAiModal(false);
  };

  // AI Generation on Topic
  const handleExecuteAIGeneration = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setGeneratingAi(true);
    try {
      if (aiTab === "roadmap") {
        const m1 = { id: `m1_${Date.now()}`, nodeType: "milestone", x: 60, y: 40, title: "PHASE 1: SCOPE", subtitle: `${aiTopic} Discovery`, color: "yellow" };
        const m2 = { id: `m2_${Date.now()}`, nodeType: "milestone", x: 370, y: 40, title: "PHASE 2: BUILD", subtitle: "Core Implementation", color: "pink" };
        const m3 = { id: `m3_${Date.now()}`, nodeType: "milestone", x: 680, y: 40, title: "PHASE 3: SCALE", subtitle: "Launch & Iterate", color: "green" };

        const s1 = { id: `s1_${Date.now()}`, x: 60, y: 110, title: "1. Requirement Audit", content: `Audit architecture and design constraints for ${aiTopic}.`, color: "yellow" };
        const s2 = { id: `s2_${Date.now()}`, x: 370, y: 110, title: "2. Prototype Engine", content: "Build functional proof of concept and gather stakeholder feedback.", color: "pink" };
        const s3 = { id: `s3_${Date.now()}`, x: 680, y: 110, title: "3. Global Rollout", content: `Deploy ${aiTopic} to production cluster and monitor metrics.`, color: "green" };

        const a1 = { id: `a1_${Date.now()}`, startX: 255, startY: 60, endX: 360, endY: 60, label: "Next", color: "#FDE047" };
        const a2 = { id: `a2_${Date.now()}`, startX: 565, startY: 60, endX: 670, endY: 60, label: "Launch", color: "#F472B6" };
        const t1 = { id: `t_${Date.now()}`, x: 60, y: 320, text: `🗺️ ${aiTopic} — Product Roadmap`, fontSize: 18, color: "#E8784A" };

        setNodes((prev) => [...prev, m1, m2, m3]);
        setStickies((prev) => [...prev, s1, s2, s3]);
        setArrows((prev) => [...prev, a1, a2]);
        setTexts((prev) => [...prev, t1]);
        toast.success(`Spark generated full roadmap for "${aiTopic}"!`);

      } else if (aiTab === "mindmap") {
        const centerNode = { id: `mmc_${Date.now()}`, nodeType: "mindmap", x: 380, y: 170, title: aiTopic.toUpperCase(), subtitle: "Central Concept", color: "yellow" };
        const b1 = { id: `mm1_${Date.now()}`, nodeType: "mindmap", x: 100, y: 90, title: "Strategy & Scope", subtitle: "Core Pillars", color: "orange" };
        const b2 = { id: `mm2_${Date.now()}`, nodeType: "mindmap", x: 660, y: 90, title: "Execution Plan", subtitle: "Action Items", color: "purple" };
        const b3 = { id: `mm3_${Date.now()}`, nodeType: "mindmap", x: 100, y: 280, title: "Metrics & KPIs", subtitle: "Success Criteria", color: "blue" };
        const b4 = { id: `mm4_${Date.now()}`, nodeType: "mindmap", x: 660, y: 280, title: "Risks & Mitigations", subtitle: "Contingencies", color: "pink" };

        const a1 = { id: `ma1_${Date.now()}`, startX: 380, startY: 185, endX: 240, endY: 110, label: "", color: "#FB923C" };
        const a2 = { id: `ma2_${Date.now()}`, startX: 530, startY: 185, endX: 660, endY: 110, label: "", color: "#C084FC" };
        const a3 = { id: `ma3_${Date.now()}`, startX: 380, startY: 200, endX: 240, endY: 295, label: "", color: "#7DD3FC" };
        const a4 = { id: `ma4_${Date.now()}`, startX: 530, startY: 200, endX: 660, endY: 295, label: "", color: "#F472B6" };

        const header = { id: `t_${Date.now()}`, x: 60, y: 30, text: `🧠 ${aiTopic} — Mindmap Tree`, fontSize: 18, color: "#C084FC" };

        setNodes((prev) => [...prev, centerNode, b1, b2, b3, b4]);
        setArrows((prev) => [...prev, a1, a2, a3, a4]);
        setTexts((prev) => [...prev, header]);
        toast.success(`Spark generated mindmap for "${aiTopic}"!`);

      } else {
        // Brainstorm Stickies
        let rawResult = "";
        try {
          const res = await generateAIContent(
            "Brainstorm Ideas",
            `Brainstorm 4 distinct, actionable whiteboard ideas for: "${aiTopic}". Separate each idea with "---" and include a short Title and 1-2 sentence description.`
          );
          rawResult = res.data?.result || res.data?.output || "";
        } catch {
          rawResult = `💡 ${aiTopic} Strategy\nFocus on rapid prototyping and high-leverage workflows.\n---\n⚡ Architecture Tuning\nImplement caching to cut network round-trips by 60%.\n---\n🎯 Core Differentiator\nPrioritize Notes USP and ambient AI assistance.`;
        }

        const chunks = rawResult.split("---").filter((c) => c.trim().length > 0);
        const paletteKeys = Object.keys(STICKY_PALETTES);

        const newNotes = chunks.map((chunk, index) => {
          const lines = chunk.trim().split("\n").filter((l) => l.trim().length > 0);
          const title = lines[0]?.replace(/<[^>]*>?/gm, "").replace(/^[-*•#\d.]+\s*/, "").slice(0, 40) || "Whiteboard Concept";
          const body = lines.slice(1).join(" ").replace(/<[^>]*>?/gm, "").slice(0, 150) || "Explore this direction further.";

          return {
            id: `s_${Date.now() + index}`,
            x: 60 + (index % 3) * 290,
            y: 90 + Math.floor(index / 3) * 230,
            title,
            content: body,
            color: paletteKeys[index % paletteKeys.length],
          };
        });

        setStickies((prev) => [...prev, ...newNotes]);
        toast.success(`Spark pinned ${newNotes.length} authentic stickies to your board!`);
      }

      setShowAiModal(false);
      setAiTopic("");
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleClearWhiteboard = () => {
    if (window.confirm("Clear all pinned stickies, roadmaps, and drawings?")) {
      setStickies([]);
      setNodes([]);
      setArrows([]);
      setTexts([]);
      setDrawings([]);
      toast.success("Whiteboard cleared");
    }
  };

  return (
    <div className="space-y-3 pb-8 select-none">
      
      {/* ═══ TOP HEADER & CANVAS CONTROLS ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-orange-400 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-accent/20">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary leading-tight">
                Whiteboard & Canvas
              </h1>
              <span className="text-[10px] font-extrabold text-accent dark:text-accent-dark bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {boardTheme === "pinboard" ? "📌 Cork Pinboard" : "📐 Magnetic Board"}
              </span>
            </div>
            <p className="text-[12px] text-text-secondary">
              Freeform spatial workspace with authentic pinned sticky notes, roadmaps, mindmaps, and marker sketching
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Surface Theme Toggle */}
          <button
            onClick={() => setBoardTheme(boardTheme === "pinboard" ? "whiteboard" : "pinboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-[11px] font-bold text-text-secondary hover:text-text-primary transition"
            title="Toggle Pinboard / Whiteboard texture"
          >
            {boardTheme === "pinboard" ? "📐 Switch to Whiteboard" : "📌 Switch to Pinboard"}
          </button>

          {/* AI Generator Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-tr from-accent to-orange-400 text-white text-[12px] font-bold shadow-md shadow-accent/20 hover:opacity-95 active:scale-95 transition"
          >
            <Sparkles size={14} /> <span>Spark AI Studio</span>
          </button>

          {/* Clear Canvas */}
          <button
            onClick={handleClearWhiteboard}
            className="p-2 rounded-xl glass hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition"
            title="Clear Board"
          >
            <Trash2 size={14} />
          </button>

          <ProfileMenu />
        </div>
      </div>

      {/* ═══ FLOATING ERGONOMIC TOOLBAR ═══ */}
      <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-2xl glass-strong border border-white/35 dark:border-white/10 shadow-lg flex-wrap">
        
        {/* Tool Selectors */}
        <div className="flex items-center gap-1">
          {/* Select & Drag */}
          <button
            onClick={() => setActiveTool("select")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "select"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Select & Move (V)"
          >
            <MousePointer size={14} />
            <span className="hidden md:inline">Select</span>
          </button>

          {/* Authentic Sticky Note */}
          <button
            onClick={() => setActiveTool("sticky")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "sticky"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Pin Sticky Note (S)"
          >
            <Bookmark size={14} />
            <span className="hidden md:inline">Sticky Note</span>
          </button>

          {/* Mindmap Node */}
          <button
            onClick={() => setActiveTool("mindmap")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "mindmap"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Add Mindmap Node"
          >
            <Compass size={14} />
            <span className="hidden md:inline">Mindmap</span>
          </button>

          {/* Process Step */}
          <button
            onClick={() => setActiveTool("step")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "step"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Flowchart Step"
          >
            <Square size={14} />
            <span className="hidden md:inline">Step</span>
          </button>

          {/* Decision Diamond */}
          <button
            onClick={() => setActiveTool("decision")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "decision"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Decision Diamond"
          >
            <Diamond size={14} />
            <span className="hidden md:inline">Decision</span>
          </button>

          {/* Arrow Connector */}
          <button
            onClick={() => setActiveTool("arrow")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "arrow"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Connector Arrow"
          >
            <ArrowRight size={14} />
            <span className="hidden md:inline">Arrow</span>
          </button>

          {/* Text Box */}
          <button
            onClick={() => setActiveTool("text")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "text"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Text Heading (T)"
          >
            <Type size={14} />
            <span className="hidden md:inline">Text</span>
          </button>

          {/* Freehand Marker */}
          <button
            onClick={() => setActiveTool("pen")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTool === "pen"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary"
            }`}
            title="Marker Pen (P)"
          >
            <PenTool size={14} />
            <span className="hidden md:inline">Marker</span>
          </button>
        </div>

        {/* Paper Color Palette & Stroke Controls */}
        <div className="flex items-center gap-3">
          {/* Marker Width Toggle */}
          {activeTool === "pen" && (
            <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl">
              {[2, 4, 7].map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    strokeWidth === w ? "bg-white/30 text-white" : "text-text-secondary"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          )}

          {/* Post-it Paper Colors */}
          <div className="flex items-center gap-1.5">
            {PALETTE_LIST.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveColor(c.id)}
                className={`w-4 h-4 rounded-full ${c.dot} transition-transform ${
                  activeColor === c.id ? "scale-125 ring-2 ring-white shadow-md" : "hover:scale-110 opacity-70 hover:opacity-100"
                }`}
                title={c.name}
              />
            ))}
          </div>

          {/* Undo Marker Line */}
          {drawings.length > 0 && (
            <button
              onClick={() => setDrawings((prev) => prev.slice(0, -1))}
              className="p-1.5 rounded-xl glass text-text-secondary hover:text-text-primary transition text-xs flex items-center gap-1"
              title="Undo last marker line"
            >
              <Undo2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ INTERACTIVE PINBOARD & WHITEBOARD CANVAS ═══ */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className={`relative w-full h-[76vh] min-h-[580px] rounded-3xl border border-white/35 dark:border-white/10 shadow-2xl overflow-hidden select-none transition-all ${
          boardTheme === "pinboard"
            ? "bg-[#1E1714] bg-[radial-gradient(#2A201C_1.5px,transparent_1.5px)] [background-size:20px_20px]"
            : "bg-[#161210] bg-[radial-gradient(rgba(232,120,74,0.08)_1.5px,transparent_1.5px)] [background-size:28px_28px]"
        } ${
          activeTool === "pen" || activeTool === "arrow"
            ? "cursor-crosshair"
            : activeTool === "select"
            ? "cursor-default"
            : "cursor-cell"
        }`}
      >
        {/* Subtle Cork / Board Border Bevel */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl border-4 border-amber-950/20 shadow-inner z-0" />

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-3 left-6 pointer-events-none text-[11px] font-semibold text-text-secondary/70 flex items-center gap-2 z-10">
          <Move size={12} />
          <span>Freely drag stickies, mindmaps & flowcharts • Use Marker to sketch • Spark AI to drop blueprints</span>
        </div>

        {/* ── SVG LAYER: DRAWINGS, ARROWS & CURVES ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="whiteboard-arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#E8784A" />
            </marker>
          </defs>

          {/* Render Marker Drawings */}
          {drawings.map((line) => (
            <polyline
              key={line.id}
              points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={line.color}
              strokeWidth={line.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          ))}

          {/* In-Progress Drawing Line */}
          {currentLine && (
            <polyline
              points={currentLine.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={currentLine.color}
              strokeWidth={currentLine.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
          )}

          {/* Render Arrows */}
          {arrows.map((arr) => {
            const midX = (arr.startX + arr.endX) / 2;
            const midY = (arr.startY + arr.endY) / 2;
            return (
              <g key={arr.id}>
                <line
                  x1={arr.startX}
                  y1={arr.startY}
                  x2={arr.endX}
                  y2={arr.endY}
                  stroke={arr.color || "#E8784A"}
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  markerEnd="url(#whiteboard-arrowhead)"
                  opacity="0.9"
                />
                {arr.label && (
                  <text
                    x={midX}
                    y={midY - 8}
                    fill={arr.color || "#E8784A"}
                    fontSize="10.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {arr.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow In-Progress Preview */}
          {arrowPreview && (
            <line
              x1={arrowPreview.startX}
              y1={arrowPreview.startY}
              x2={arrowPreview.endX}
              y2={arrowPreview.endY}
              stroke="#E8784A"
              strokeWidth="2.5"
              strokeDasharray="3 3"
              markerEnd="url(#whiteboard-arrowhead)"
              opacity="0.75"
            />
          )}
        </svg>

        {/* ── TEXT LABELS LAYER ── */}
        <AnimatePresence>
          {texts.map((t) => (
            <motion.div
              key={t.id}
              drag={activeTool === "select"}
              dragConstraints={canvasRef}
              dragMomentum={false}
              initial={{ opacity: 0, x: t.x, y: t.y }}
              animate={{ opacity: 1, x: t.x, y: t.y }}
              exit={{ opacity: 0 }}
              onDragEnd={(e, info) => {
                setTexts((prev) =>
                  prev.map((item) =>
                    item.id === t.id
                      ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y }
                      : item
                  )
                );
              }}
              className="absolute z-10 group whiteboard-interactive-card"
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={t.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTexts((prev) =>
                      prev.map((item) => (item.id === t.id ? { ...item, text: val } : item))
                    );
                  }}
                  className="bg-transparent font-extrabold outline-none tracking-tight"
                  style={{ color: t.color || "#E8784A", fontSize: `${t.fontSize || 18}px` }}
                />
                <button
                  onClick={() => setTexts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-text-secondary transition"
                  title="Remove text"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── FLOWCHART, MILESTONE & MINDMAP NODES LAYER ── */}
        <AnimatePresence>
          {nodes.map((node) => {
            const palette = STICKY_PALETTES[node.color] || STICKY_PALETTES.yellow;
            const isMilestone = node.nodeType === "milestone";
            const isDecision = node.nodeType === "decision";
            const isMindmap = node.nodeType === "mindmap";

            return (
              <motion.div
                key={node.id}
                drag={activeTool === "select"}
                dragConstraints={canvasRef}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9, x: node.x, y: node.y }}
                animate={{ opacity: 1, scale: 1, x: node.x, y: node.y }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.02 }}
                onDragEnd={(e, info) => {
                  setNodes((prev) =>
                    prev.map((item) =>
                      item.id === node.id
                        ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y }
                        : item
                    )
                  );
                }}
                className={`absolute z-10 whiteboard-interactive-card shadow-xl transition-all ${
                  isMilestone
                    ? "px-4 py-2.5 rounded-2xl glass-strong border-2 border-accent text-text-primary dark:text-white font-extrabold"
                    : isDecision
                    ? "p-4 rounded-3xl glass-strong border-2 border-dashed border-amber-400 min-w-[150px]"
                    : isMindmap
                    ? "px-5 py-3 rounded-full glass-strong border-2 border-purple-400/60 shadow-purple-500/10 min-w-[160px]"
                    : "p-3.5 rounded-2xl glass-strong border border-white/30 dark:border-white/10 min-w-[160px]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${palette.dot} shadow-xs`} />
                    <input
                      type="text"
                      value={node.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((item) => (item.id === node.id ? { ...item, title: val } : item))
                        );
                      }}
                      className="bg-transparent font-extrabold text-[12.5px] text-text-primary dark:text-text-darkPrimary outline-none truncate max-w-[140px]"
                    />
                  </div>

                  <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleConvertToNote(node, "Diagram Node")}
                      className="p-1 hover:text-accent text-text-secondary transition"
                      title="Convert to Note"
                    >
                      <FileText size={11} />
                    </button>
                    <button
                      onClick={() => setNodes((prev) => prev.filter((item) => item.id !== node.id))}
                      className="p-1 hover:text-red-500 text-text-secondary transition"
                      title="Delete node"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {node.subtitle && (
                  <input
                    type="text"
                    value={node.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((item) => (item.id === node.id ? { ...item, subtitle: val } : item))
                      );
                    }}
                    className="w-full mt-1 bg-transparent text-[10.5px] text-text-secondary outline-none truncate font-medium"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* ── AUTHENTIC PAPER STICKY NOTES LAYER (WITH 3D PUSHPINS) ── */}
        <AnimatePresence>
          {stickies.map((sticky) => {
            const palette = STICKY_PALETTES[sticky.color] || STICKY_PALETTES.yellow;

            return (
              <motion.div
                key={sticky.id}
                drag={activeTool === "select"}
                dragConstraints={canvasRef}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.88, x: sticky.x, y: sticky.y }}
                animate={{ opacity: 1, scale: 1, x: sticky.x, y: sticky.y }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.025, zIndex: 30 }}
                onDragEnd={(e, info) => {
                  setStickies((prev) =>
                    prev.map((s) =>
                      s.id === sticky.id
                        ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y }
                        : s
                    )
                  );
                }}
                className={`absolute z-10 w-64 p-4 rounded-xl border flex flex-col justify-between whiteboard-interactive-card transition-all ${palette.bg} ${palette.border} ${palette.text} ${palette.shadow}`}
                style={{
                  transform: `rotate(${palette.rotate})`,
                }}
              >
                {/* 3D Realistic Pushpin Thumbtack */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none drop-shadow-md">
                  <div
                    className="w-4 h-4 rounded-full relative shadow-md ring-1 ring-black/20"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${palette.pinColor} 55%, #1a1a1a 100%)`,
                    }}
                  >
                    <div className="absolute top-0.5 left-1 w-1.5 h-1 rounded-full bg-white/70 blur-[0.4px]" />
                  </div>
                  <div className="w-1.5 h-1 bg-black/50 rounded-full blur-[0.5px] -mt-0.5" />
                </div>

                {/* Top Note Bar */}
                <div className="flex items-center justify-between mb-1.5 pt-0.5">
                  <input
                    type="text"
                    value={sticky.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStickies((prev) =>
                        prev.map((s) => (s.id === sticky.id ? { ...s, title: val } : s))
                      );
                    }}
                    className="bg-transparent font-black text-[13px] outline-none w-40 truncate tracking-tight text-inherit"
                    placeholder="Note Title..."
                  />

                  <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleConvertToNote(sticky, "Pinned Sticky Note")}
                      className="p-1 hover:text-black transition"
                      title="Convert to Workspace Note"
                    >
                      <FileText size={12} />
                    </button>
                    <button
                      onClick={() => {
                        const duplicate = {
                          ...sticky,
                          id: `s_${Date.now()}`,
                          x: sticky.x + 25,
                          y: sticky.y + 25,
                          title: `${sticky.title} (Copy)`,
                        };
                        setStickies((prev) => [...prev, duplicate]);
                        toast.success("Duplicated sticky note!");
                      }}
                      className="p-1 hover:text-black transition"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => setStickies((prev) => prev.filter((s) => s.id !== sticky.id))}
                      className="p-1 hover:text-red-700 transition"
                      title="Remove from board"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Note Content Area */}
                <textarea
                  value={sticky.content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStickies((prev) =>
                      prev.map((s) => (s.id === sticky.id ? { ...s, content: val } : s))
                    );
                  }}
                  rows={3}
                  className="w-full bg-transparent resize-none text-[12px] font-semibold leading-relaxed outline-none custom-scrollbar placeholder:text-inherit/50 text-inherit"
                  placeholder="Jot down tasks, ideas, or questions..."
                />

                {/* Paper Footer: Palette Switcher & Turn into Note */}
                <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {PALETTE_LIST.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setStickies((prev) =>
                            prev.map((s) => (s.id === sticky.id ? { ...s, color: c.id } : s))
                          );
                        }}
                        className={`w-3.5 h-3.5 rounded-full ${c.dot} border border-black/15 transition-transform ${
                          sticky.color === c.id ? "scale-125 ring-1 ring-black shadow-xs" : "hover:scale-110"
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleConvertToNote(sticky, "Pinned Sticky Note")}
                    className="text-[10px] font-extrabold hover:underline flex items-center gap-0.5 text-inherit"
                  >
                    <span>Turn into Note</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ═══ SPARK AI STUDIO: ROADMAPS, MINDMAPS & FLOWCHARTS MODAL ═══ */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-strong p-6 rounded-3xl shadow-2xl w-full max-w-xl border border-white/40 dark:border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-orange-400 text-white flex items-center justify-center shadow-md">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-text-primary dark:text-text-darkPrimary">
                      Spark AI Whiteboard Studio
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      Instantly generate roadmaps, mindmaps, system flowcharts, and sticky clusters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1 rounded-lg hover:bg-white/30 text-text-secondary hover:text-text-primary transition"
                >
                  ✕
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAiTab("roadmap")}
                  className={`p-2.5 rounded-2xl text-center border transition ${
                    aiTab === "roadmap"
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "glass border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-base block mb-0.5">🗺️</span>
                  <span className="text-[11px] block font-bold">Roadmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiTab("mindmap")}
                  className={`p-2.5 rounded-2xl text-center border transition ${
                    aiTab === "mindmap"
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "glass border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-base block mb-0.5">🧠</span>
                  <span className="text-[11px] block font-bold">Mindmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiTab("flowchart")}
                  className={`p-2.5 rounded-2xl text-center border transition ${
                    aiTab === "flowchart"
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "glass border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-base block mb-0.5">🔀</span>
                  <span className="text-[11px] block font-bold">Flowchart</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiTab("ideas")}
                  className={`p-2.5 rounded-2xl text-center border transition ${
                    aiTab === "ideas"
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "glass border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-base block mb-0.5">💡</span>
                  <span className="text-[11px] block font-bold">Ideas Swarm</span>
                </button>
              </div>

              {/* Instant Blueprint Loader ("Display All") */}
              <div className="mb-4 p-3 rounded-2xl glass-subtle border border-white/20 dark:border-white/8">
                <p className="text-[10.5px] font-extrabold text-text-secondary uppercase tracking-wider mb-2">
                  ⚡ Or Load Ready Blueprint:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => loadBlueprint("roadmap")}
                    className="p-2 rounded-xl glass hover:bg-white/40 dark:hover:bg-white/10 text-left text-text-primary dark:text-white transition group"
                  >
                    <span className="text-xs font-bold block group-hover:text-accent">🚀 2026 SaaS Roadmap</span>
                    <span className="text-[9.5px] text-text-secondary">Q1 to Q3 Milestones</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadBlueprint("mindmap")}
                    className="p-2 rounded-xl glass hover:bg-white/40 dark:hover:bg-white/10 text-left text-text-primary dark:text-white transition group"
                  >
                    <span className="text-xs font-bold block group-hover:text-accent">🧠 Workspace Mindmap</span>
                    <span className="text-[9.5px] text-text-secondary">4 Radial Pillars</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadBlueprint("flowchart")}
                    className="p-2 rounded-xl glass hover:bg-white/40 dark:hover:bg-white/10 text-left text-text-primary dark:text-white transition group"
                  >
                    <span className="text-xs font-bold block group-hover:text-accent">🔀 Microservices Flow</span>
                    <span className="text-[9.5px] text-text-secondary">OAuth & Gateway</span>
                  </button>
                </div>
              </div>

              {/* Custom AI Prompt Input */}
              <form onSubmit={handleExecuteAIGeneration} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    {aiTab === "roadmap"
                      ? "Product or Goal for Roadmap"
                      : aiTab === "mindmap"
                      ? "Central Concept for Mindmap"
                      : aiTab === "flowchart"
                      ? "Process or System to Flowchart"
                      : "Brainstorm Topic"}
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder={
                      aiTab === "roadmap"
                        ? "e.g. AI Coding Assistant v2.0, Mobile Banking App..."
                        : aiTab === "mindmap"
                        ? "e.g. Company Growth Strategy, Cloud Security Tree..."
                        : aiTab === "flowchart"
                        ? "e.g. Stripe Checkout Flow, User Onboarding Funnel..."
                        : "e.g. Q4 Growth Hacks, Feature Ideation..."
                    }
                    autoFocus
                    className="w-full h-11 px-3.5 rounded-xl glass-subtle text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 focus:border-accent font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2.5 rounded-xl glass text-xs font-bold text-text-secondary hover:text-text-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generatingAi || !aiTopic.trim()}
                    className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {generatingAi ? <Sparkles size={13} className="animate-spin" /> : <SendHorizontal size={13} />}
                    <span>{generatingAi ? "Architecting..." : "Generate & Drop on Canvas"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
