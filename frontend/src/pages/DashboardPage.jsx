import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, FileText, Plus, Star, ChevronDown } from "lucide-react";

import { getNotes, getNotesWithCache, deleteNote } from "../services/notesService";
import { getFolders } from "../services/folderService";
import NotesGrid from "../components/notes/NotesGrid";

import ProfileMenu from "../components/ui/ProfileMenu";

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(location.search);
  const activeFolder = params.get("folder");
  
  const isFavoritesActive = params.get("favorites") === "true";

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await getFolders();
        setFolders(res.data || []);
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    };
    fetchFolders();
  }, []);

  const fetchNotes = async () => {
    try {
      const initial = await getNotesWithCache((freshNotes) => {
        setNotes(freshNotes || []);
        setLoading(false);
      });
      if (initial && initial.data) {
        setNotes(initial.data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        localStorage.removeItem("activeWorkspaceId");
        toast.error("Please select a workspace to continue.");
        navigate("/workspaces"); 
      } else {
        toast.error("Failed to load notes");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentWorkspaceId = localStorage.getItem("activeWorkspaceId");
    if (!currentWorkspaceId) {
      navigate("/workspaces");
      return;
    }
    fetchNotes();
  }, [isFavoritesActive, activeFolder, navigate]);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      fetchNotes();
      setQuery(""); 
    };
    window.addEventListener("workspaceChanged", handleWorkspaceChange);
    return () => window.removeEventListener("workspaceChanged", handleWorkspaceChange);
  }, []);

  const groupedNotes = useMemo(() => {
    const map = {};

    notes.forEach((note) => {
      const folderId = note.folder?.id;
      const folderName = note.folder?.name || "Ungrouped";

      if (activeFolder && String(folderId) !== activeFolder) return;
      if (isFavoritesActive && note.isFavorite !== true && note.favorite !== true) return;
      
      if (
        query &&
        !note.title?.toLowerCase().includes(query.toLowerCase()) &&
        !note.content?.toLowerCase().includes(query.toLowerCase())
      ) {
        return;
      }

      if (!map[folderName]) map[folderName] = [];
      map[folderName].push(note);
    });

    return map;
  }, [notes, activeFolder, isFavoritesActive, query]);

  const handleDelete = useCallback(async (note) => {
    try {
      await deleteNote(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      toast.success("Note deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete note");
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/40 border-t-accent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-text-secondary">Syncing workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">

      {/* Profile Menu — Top Right */}
      <div className="fixed top-6 right-8 z-[100] hidden md:block">
        <ProfileMenu />
      </div>

      {/* ═══ HEADER: Title + Activity + New Note ═══ */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5 mt-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary flex items-center gap-3">
            {isFavoritesActive && <Star size={28} className="text-yellow-500 fill-yellow-500" />}
            {isFavoritesActive ? "Your Favorites" : "Home"}
          </h1>
          <p className="text-[14px] text-text-secondary mt-1.5">
            {isFavoritesActive 
              ? "Your starred and most important ideas." 
              : "Capture ideas, stay organized, and focus on what matters."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Activity Filter */}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold glass text-text-primary dark:text-text-darkPrimary hover:shadow-glassHover transition-all">
            Activity <ChevronDown size={14} className="text-text-secondary" />
          </button>

          {/* New Note Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/notes/new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-secondary text-white text-[13px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-200"
          >
            <Plus size={16} /> New Note
          </motion.button>
        </div>
      </div>

      {/* ═══ SEARCH BAR ═══ */}
      {notes.length > 0 && (
        <div className="relative mb-8 max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-60" />
          <input
            type="text"
            placeholder="Search your thoughts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl glass text-[14px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none focus:shadow-glassHover transition-shadow"
          />
        </div>
      )}

      {/* ═══ CONTENT: Feed Layout ═══ */}
      {!loading && notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6">
            <FileText size={32} className="text-text-secondary opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-text-primary dark:text-text-darkPrimary tracking-tight">
            It's quiet in here
          </h3>
          <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
            This workspace doesn't have any notes yet. Start capturing your ideas or create a new project.
          </p>
          <button 
            onClick={() => navigate("/notes/new")}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-xl text-[13px] font-bold transition-colors shadow-lg shadow-accent/20"
          >
            Create your first note
          </button>
        </div>
      ) : (
        Object.keys(groupedNotes).length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
             {isFavoritesActive ? (
                <>
                  <Star size={48} className="text-text-secondary opacity-20 mb-4" />
                  <p className="text-text-primary font-medium text-[15px]">No favorites yet</p>
                  <p className="text-text-secondary text-[13px] mt-1">Star a note to see it here.</p>
                </>
             ) : (
                <p className="text-text-secondary text-[14px]">No notes match your search.</p>
             )}
          </div>
        ) : (
          Object.entries(groupedNotes).map(([folderName, notesGroup]) => (
            <div key={folderName} className="mb-10">
              <h2 className="text-[11px] font-bold mb-3 text-text-secondary/70 uppercase tracking-[0.14em] ml-1">
                {folderName}
              </h2>
              <NotesGrid
                notes={notesGroup}
                onDelete={handleDelete}
              />
            </div>
          ))
        )
      )}

    </div>
  );
}

export default DashboardPage;