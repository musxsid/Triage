import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FileText, Star, Sparkles, Settings, LogOut,
  Moon, Sun, Plus, ChevronDown, Check,
  Briefcase, Folder, LayoutGrid, Trash2,
  Search, Mail, Calendar, HeartPulse, Zap,
  FolderPlus
} from "lucide-react";
import FolderCreateModal from "../ui/FolderCreateModal";
import CreateWorkspaceModal from "../ui/CreateWorkspaceModal";
import TriageLogo from "../ui/TriageLogo";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { deleteFolder } from "../../services/folderService";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const isNotesActive = location.pathname === "/dashboard" || location.pathname.startsWith("/notes");
  
  const [folderToDelete, setFolderToDelete] = useState(null);
  const ICON_SIZE = 16;

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [isFavoritesActive, setIsFavoritesActive] = useState(false); 
  
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const folderFromURL = params.get("folder");
    const favoritesFromURL = params.get("favorites");

    if (folderFromURL) setActiveFolder(Number(folderFromURL));
    else setActiveFolder(null);

    if (favoritesFromURL === "true") setIsFavoritesActive(true);
    else setIsFavoritesActive(false);
  }, [location]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getWorkspaces = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8080/api/workspaces", {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedWorkspaces = res.data || [];
      setWorkspaces(fetchedWorkspaces);
      if (fetchedWorkspaces.length > 0) {
        const storedId = localStorage.getItem("activeWorkspaceId");
        const match = fetchedWorkspaces.find(w => w.id.toString() === storedId);
        setActiveWorkspace(match || fetchedWorkspaces[0]);
      } else {
        setActiveWorkspace({ name: "Personal", icon: "💼" });
      }
    } catch (err) {
      console.error("Failed to load workspaces", err);
      setActiveWorkspace({ name: "Personal", icon: "💼" });
    }
  };

  const getFolders = async (workspaceId) => {
    if (!workspaceId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:8080/api/folders?workspaceId=${workspaceId}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setFolders(res.data || []);
    } catch (err) {
      console.error("Failed to load folders", err);
    }
  };

  useEffect(() => { getWorkspaces(); }, []);
  useEffect(() => { if (activeWorkspace?.id) getFolders(activeWorkspace.id); }, [activeWorkspace]);

  useEffect(() => {
    const syncWorkspace = () => {
      const storedId = localStorage.getItem("activeWorkspaceId");
      if (storedId && workspaces.length > 0) {
        const match = workspaces.find(w => w.id.toString() === storedId);
        if (match) setActiveWorkspace(match);
      }
    };
    window.addEventListener("workspaceChanged", syncWorkspace);
    return () => window.removeEventListener("workspaceChanged", syncWorkspace);
  }, [workspaces]);

  const handleCreateFolder = async (name) => {
    try {
      await axios.post(
        `http://localhost:8080/api/folders?workspaceId=${activeWorkspace.id}`,
        { name },
        { 
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
        }
      );
      await getFolders(activeWorkspace.id);
      toast.success("Folder created");
    } catch (err) {
      toast.error("Failed to create folder");
    }
  };

  const promptDeleteFolder = (e, folderId, folderName) => {
    e.stopPropagation();
    setFolderToDelete({ id: folderId, name: folderName });
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolder(folderToDelete.id);
      toast.success("Folder deleted");
      if (activeFolder === folderToDelete.id) {
        setActiveFolder(null);
        navigate("/dashboard");
      }
      getFolders(activeWorkspace.id); 
    } catch (err) {
      toast.error("Failed to delete folder");
    } finally {
      setFolderToDelete(null); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeWorkspaceId");
    localStorage.removeItem("pinnedWorkspaceId"); 
    toast.success("Logged out");
    navigate("/login");
  };

  // Nav item style classes
  const navItemBase = "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative";
  const navItemActive = "bg-white/60 dark:bg-white/10 text-text-primary dark:text-text-darkPrimary shadow-xs backdrop-blur-md border border-white/40 dark:border-white/10 font-semibold";
  const navItemInactive = "text-text-secondary hover:bg-white/35 dark:hover:bg-white/5 hover:text-text-primary dark:hover:text-text-darkPrimary";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col justify-between glass-strong z-40 border-r border-white/25 dark:border-white/10 select-none">
      
      {/* ═══ TOP: BRAND & WORKSPACE & SEARCH ═══ */}
      <div className="px-3.5 pt-4 pb-2 space-y-2.5">
        
        {/* Brand */}
        <div 
          className="flex items-center justify-between px-1 cursor-pointer group"
          onClick={() => navigate("/dashboard")}
        >
          <TriageLogo size={28} showWordmark={true} betaTag={true} />
        </div>

        {/* Workspace Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl glass-subtle hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200 group border border-white/30 dark:border-white/10"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 flex-shrink-0 rounded-lg bg-accent/15 dark:bg-accent-dark/20 text-accent dark:text-accent-dark flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs">
                {activeWorkspace?.icon?.length > 2 
                  ? activeWorkspace.icon.charAt(0).toUpperCase() 
                  : (activeWorkspace?.icon || "💼")}
              </div>
              <span className="text-[12px] font-bold text-text-primary dark:text-text-darkPrimary truncate max-w-[130px] text-left leading-tight">
                {activeWorkspace?.name || "Personal"}
              </span>
            </div>
            <ChevronDown 
              size={13} 
              className={`text-text-secondary flex-shrink-0 transition-transform duration-200 ${isWorkspaceDropdownOpen ? "rotate-180" : ""}`} 
            />
          </button>

          <AnimatePresence>
            {isWorkspaceDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 w-full mt-1.5 p-1.5 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/30 dark:border-white/15"
              >
                <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-0.5">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        localStorage.setItem("activeWorkspaceId", ws.id);
                        window.dispatchEvent(new Event("workspaceChanged"));
                        setIsWorkspaceDropdownOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-medium rounded-xl hover:bg-white/40 dark:hover:bg-white/10 transition text-text-primary dark:text-text-darkPrimary"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{ws.icon || "💼"}</span>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {activeWorkspace?.id === ws.id && <Check size={13} className="text-accent dark:text-accent-dark flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                
                <div className="h-px bg-white/20 dark:bg-white/10 my-1"></div>
                
                <button 
                  onClick={() => { setIsWorkspaceDropdownOpen(false); navigate("/workspaces"); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary hover:bg-white/30 dark:hover:bg-white/5 rounded-lg transition"
                >
                  <LayoutGrid size={13} /> View All Workspaces
                </button>

                <button 
                  onClick={() => { setIsWorkspaceDropdownOpen(false); setShowCreateWorkspaceModal(true); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-accent dark:text-accent-dark hover:bg-accent/10 rounded-lg transition"
                >
                  <Plus size={13} /> Create Workspace
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Universal Search Pill */}
        <div
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl glass-subtle border border-white/30 dark:border-white/10 text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer transition group"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="group-hover:text-accent transition-colors" />
            <span className="text-[12px] font-medium">Search anything...</span>
          </div>
          <kbd className="text-[9px] font-extrabold font-mono text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/15 px-1.5 py-0.5 rounded border border-accent/20">
            Ctrl K
          </kbd>
        </div>

      </div>

      {/* ═══ SCROLLABLE MAIN NAVIGATION ═══ */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar py-2 space-y-4">
        
        {/* ── SECTION 1: NOTES (USP CORE) ── */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-[0.14em]">
              Notes
            </p>
            <button
              onClick={() => navigate("/notes/new")}
              className="text-[10px] font-bold text-accent dark:text-accent-dark hover:underline flex items-center gap-1"
              title="Create New Note"
            >
              <Plus size={11} /> New Note
            </button>
          </div>

          <div className="space-y-0.5">
            {/* All Notes */}
            <div
              onClick={() => { setActiveFolder(null); navigate("/dashboard"); }}
              className={`${navItemBase} cursor-pointer justify-between ${
                isNotesActive && !isFavoritesActive && activeFolder === null
                  ? navItemActive
                  : navItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-[12px] shadow-xs">
                  📝
                </span>
                <span className="font-bold">All Notes</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-accent/10 text-accent dark:text-accent-dark border border-accent/20">
                USP
              </span>
            </div>

            {/* Favorites */}
            <div
              onClick={() => { setActiveFolder(null); navigate("/dashboard?favorites=true"); }}
              className={`${navItemBase} cursor-pointer justify-between ${
                isFavoritesActive
                  ? navItemActive
                  : navItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  ⭐
                </span>
                <span className="font-semibold">Favorites</span>
              </div>
            </div>

            {/* Folders Accordion (Spacious & Clean) */}
            <div className="pt-1.5">
              <div className="flex items-center justify-between px-2 py-1 group">
                <div
                  onClick={() => setIsFoldersOpen(!isFoldersOpen)}
                  className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary/80 hover:text-text-primary transition"
                >
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 ${!isFoldersOpen ? "-rotate-90" : ""}`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Folders ({folders.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="p-1 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition"
                  title="New Folder"
                >
                  <Plus size={11} />
                </button>
              </div>

              <AnimatePresence>
                {isFoldersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 mt-0.5 pl-2"
                  >
                    {folders.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => { setActiveFolder(f.id); navigate(`/dashboard?folder=${f.id}`); }}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition ${
                          activeFolder === f.id && !isFavoritesActive
                            ? "bg-white/60 dark:bg-white/10 text-text-primary dark:text-text-darkPrimary font-bold shadow-xs border border-white/30 dark:border-white/10"
                            : "text-text-secondary hover:text-text-primary hover:bg-white/25 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[11px] flex-shrink-0">📁</span>
                          <span className="truncate">{f.name}</span>
                        </div>
                        <button
                          onClick={(e) => promptDeleteFolder(e, f.id, f.name)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all flex-shrink-0"
                          title="Delete folder"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: WORKSPACE ECOSYSTEM ── */}
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-[0.14em]">
            Ecosystem
          </p>

          <div className="space-y-0.5">
            {/* Whiteboard & Canvas */}
            <NavLink
              to="/board"
              className={({ isActive }) => `
                ${navItemBase} justify-between group
                ${isActive ? navItemActive : navItemInactive}
              `}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  🎨
                </span>
                <span className="font-semibold">Whiteboard</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                Canvas
              </span>
            </NavLink>

            {/* Email Tab */}
            <NavLink
              to="/email"
              className={({ isActive }) => `
                ${navItemBase} justify-between group
                ${isActive ? navItemActive : navItemInactive}
              `}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  ✉️
                </span>
                <span className="font-semibold">Email</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent/15 text-accent dark:text-accent-dark">
                Inbox
              </span>
            </NavLink>

            {/* Calendar Tab */}
            <NavLink
              to="/calendar"
              className={({ isActive }) => `
                ${navItemBase} justify-between group
                ${isActive ? navItemActive : navItemInactive}
              `}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  📅
                </span>
                <span className="font-semibold">Calendar</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Google
              </span>
            </NavLink>
          </div>
        </div>

        {/* ── SECTION 3: INTELLIGENCE ── */}
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-[0.14em]">
            Intelligence
          </p>

          <div className="space-y-0.5">
            <NavLink
              to="/ai"
              className={({ isActive }) => `
                ${navItemBase} justify-between group
                ${isActive ? navItemActive : navItemInactive}
              `}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  ✨
                </span>
                <span className="font-semibold">Spark AI Studio</span>
              </div>
              <span className="text-[9px] font-extrabold text-accent dark:text-accent-dark bg-accent/10 px-1.5 py-0.5 rounded border border-accent/25 uppercase">
                Studio
              </span>
            </NavLink>

            <div
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-spark-ai"));
              }}
              className={`${navItemBase} cursor-pointer justify-between text-text-secondary hover:text-accent dark:hover:text-accent-dark hover:bg-accent/10 border border-transparent hover:border-accent/20 transition`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[12px] shadow-xs">
                  ⚡
                </span>
                <span className="font-semibold">Ask Spark Copilot</span>
              </div>
              <kbd className="text-[9px] font-mono font-bold text-text-secondary bg-white/20 dark:bg-white/10 px-1.5 py-0.5 rounded">
                Ctrl J
              </kbd>
            </div>
          </div>
        </div>

      </div>

      {/* ═══ BOTTOM SECTION: HORIZONTAL PILL CONTROLS ═══ */}
      <div className="px-3 pb-3 pt-2 border-t border-white/20 dark:border-white/8 flex flex-col gap-2">
        
        {/* Liquid Glass Horizontal Control Pill */}
        <div className="glass-pill rounded-2xl p-1 flex items-center justify-around border border-white/35 dark:border-white/10 shadow-lg relative">
          
          {/* Theme Toggle Button with Tooltip */}
          <div className="relative group/pill flex items-center justify-center">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition-all duration-200 active:scale-95"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-[10px] font-bold glass text-text-primary dark:text-text-darkPrimary whitespace-nowrap pointer-events-none opacity-0 scale-90 group-hover/pill:opacity-100 group-hover/pill:scale-100 transition-all duration-200 shadow-xl border border-white/30 dark:border-white/10 z-50">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-white/25 dark:bg-white/10" />

          {/* Settings Button with Tooltip */}
          <div className="relative group/pill flex items-center justify-center">
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `
                p-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center
                ${isActive 
                  ? 'bg-white/50 dark:bg-white/15 text-text-primary dark:text-text-darkPrimary shadow-sm' 
                  : 'text-text-secondary hover:bg-white/40 dark:hover:bg-white/10 hover:text-text-primary dark:hover:text-text-darkPrimary'
                }
              `}
              aria-label="Settings"
            >
              <Settings size={16} />
            </NavLink>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-[10px] font-bold glass text-text-primary dark:text-text-darkPrimary whitespace-nowrap pointer-events-none opacity-0 scale-90 group-hover/pill:opacity-100 group-hover/pill:scale-100 transition-all duration-200 shadow-xl border border-white/30 dark:border-white/10 z-50">
              Settings
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-white/25 dark:bg-white/10" />

          {/* Logout Button with Tooltip */}
          <div className="relative group/pill flex items-center justify-center">
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-xl hover:bg-red-500/15 text-red-500 hover:text-red-600 transition-all duration-200 active:scale-95"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-[10px] font-bold glass text-red-500 whitespace-nowrap pointer-events-none opacity-0 scale-90 group-hover/pill:opacity-100 group-hover/pill:scale-100 transition-all duration-200 shadow-xl border border-white/30 dark:border-white/10 z-50">
              Logout
            </span>
          </div>

        </div>
      </div>

      <FolderCreateModal open={showCreateFolderModal} onClose={() => setShowCreateFolderModal(false)} onCreate={handleCreateFolder} />
      
      <CreateWorkspaceModal 
        open={showCreateWorkspaceModal} 
        onClose={() => setShowCreateWorkspaceModal(false)} 
        onCreated={() => {
          getWorkspaces(); 
          navigate("/workspaces"); 
        }} 
      />

      {typeof document !== "undefined" && folderToDelete && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-strong p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-white/35 dark:border-white/10"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-darkPrimary mb-2 tracking-tight">
                Delete Folder?
              </h3>
              <p className="text-[14px] text-text-secondary mb-8 leading-relaxed">
                Are you sure you want to delete the <strong className="text-text-primary dark:text-text-darkPrimary">"{folderToDelete.name}"</strong> folder? Any notes inside will become ungrouped.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setFolderToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-[13px] glass text-text-primary dark:text-text-darkPrimary hover:opacity-80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteFolder}
                  className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-red-500 text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20 active:scale-95"
                >
                  Delete Folder
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

    </aside>
  );
};

export default Sidebar;