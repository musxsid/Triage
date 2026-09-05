import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Folder, Command, X } from "lucide-react";

import { getNotes } from "../../services/notesService";
import { getFolders } from "../../services/folderService";

const OmniSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch data when opened
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [notesRes, foldersRes] = await Promise.all([
            getNotes(),
            getFolders()
          ]);
          setNotes(notesRes.data || []);
          setFolders(foldersRes.data || []);
        } catch (error) {
          console.error("Failed to fetch data for search", error);
        }
      };
      fetchData();
      
      // Auto-focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery(""); // Clear query on close
    }
  }, [isOpen]);

  // Filter Results
  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(query.toLowerCase()) || 
    n.content?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFolders = folders.filter(f => 
    f.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNote = (id) => {
    setIsOpen(false);
    navigate(`/notes/${id}`);
  };

  const handleSelectFolder = (id) => {
    setIsOpen(false);
    navigate(`/dashboard?folder=${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] px-4"
          >
            {/* MODAL — Glassmorphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              
              {/* SEARCH INPUT AREA */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/15 dark:border-white/8">
                <Search size={20} className="text-text-secondary" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search notes, folders, or commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[16px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50"
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md bg-white/30 dark:bg-white/8 text-text-secondary text-xs font-bold border border-white/20 dark:border-white/10"
                >
                  ESC
                </button>
              </div>

              {/* RESULTS AREA */}
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
                
                {query && filteredFolders.length === 0 && filteredNotes.length === 0 && (
                  <div className="py-12 text-center text-text-secondary text-sm">
                    No results found for "{query}"
                  </div>
                )}

                {/* FOLDERS */}
                {filteredFolders.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Folders
                    </div>
                    {filteredFolders.map(folder => (
                      <button
                        key={`folder-${folder.id}`}
                        onClick={() => handleSelectFolder(folder.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 transition-colors text-left"
                      >
                        <Folder size={18} className="text-accent dark:text-accent-dark" />
                        <span className="text-sm font-medium text-text-primary dark:text-text-darkPrimary">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* NOTES */}
                {filteredNotes.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Notes
                    </div>
                    {filteredNotes.map(note => (
                      <button
                        key={`note-${note.id}`}
                        onClick={() => handleSelectNote(note.id)}
                        className="w-full flex flex-col gap-1 px-3 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-text-secondary" />
                          <span className="text-sm font-medium text-text-primary dark:text-text-darkPrimary truncate">
                            {note.title || "Untitled"}
                          </span>
                        </div>
                        <div className="pl-8 text-xs text-text-secondary truncate max-w-md">
                          {note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 80) : "No content..."}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {!query && notes.length === 0 && folders.length === 0 && (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-text-secondary">
                    <Command size={24} className="opacity-50" />
                    <p className="text-sm font-medium">Type to start searching...</p>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OmniSearch;