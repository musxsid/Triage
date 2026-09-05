import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Star, FolderOpen, Trash2, Pin, Copy, Bookmark } from "lucide-react";
import toast from "react-hot-toast";

import ConfirmModal from "../ui/ConfirmModal";
import MoveToFolderModal from "../ui/MoveToFolderModal"; 
import { toggleFavoriteNote } from "../../services/notesService";

function NoteRow({ note, onDelete }) {
  const navigate = useNavigate();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(note.isFavorite || note.favorite || false); 
  
  const menuRef = useRef(null);

  const handleClick = () => {
    if (!note?.id) return;
    navigate(`/notes/${note.id}`);
  };

  useEffect(() => {
    if (showConfirm || showMoveModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [showConfirm, showMoveModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    const newFavStatus = !isFavorite;
    setIsFavorite(newFavStatus);
    
    try {
      await toggleFavoriteNote(note.id);
      if (newFavStatus) toast.success("Added to Favorites");
      else toast("Removed from Favorites", { icon: "🌟" });
    } catch (err) {
      setIsFavorite(!newFavStatus);
      toast.error("Failed to update favorite");
    }
  };

  const handleMove = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setShowMoveModal(true); 
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "").trim();
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    const diffWeek = Math.floor(diffDay / 7);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hours ago`;
    if (diffDay === 1) return "1 day ago";
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffWeek === 1) return "1 week ago";
    return `${diffWeek} weeks ago`;
  };

  const contentPreview = stripHtml(note.content) || "No content yet...";
  const displayTitle = note.title || "Untitled";

  return (
    <>
      <div
        onClick={handleClick}
        className="
          group relative cursor-pointer
          glass-subtle rounded-2xl
          transition-all duration-300
          hover:shadow-glassHover dark:hover:shadow-glassDark
          hover:-translate-y-0.5
          p-5 px-6
        "
      >
        {/* ═══ ROW 1: Title + Actions ═══ */}
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <h3 className="font-semibold text-[15px] text-text-primary dark:text-text-darkPrimary leading-snug flex items-center gap-2 flex-1">
            {isFavorite && <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
            {displayTitle}
          </h3>

          {/* Action icons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-lg text-text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
              title={isFavorite ? "Remove favorite" : "Add to favorites"}
            >
              <Star size={15} className={isFavorite ? "text-yellow-500 fill-yellow-500" : ""} />
            </button>

            <button
              onClick={handleMove}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              title="Move to folder"
            >
              <Bookmark size={15} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(stripHtml(note.content) || "");
                toast.success("Content copied!");
              }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
              title="Copy content"
            >
              <Copy size={15} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
              >
                <MoreVertical size={15} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, transformOrigin: "top right" }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 w-44 z-20 glass rounded-xl shadow-xl overflow-hidden py-1"
                  >
                    <button 
                      onClick={handleFavorite}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                    >
                      <Star size={14} className={isFavorite ? "text-yellow-500 fill-yellow-500" : "text-text-secondary"} /> 
                      {isFavorite ? "Remove Favorite" : "Add to Favorites"}
                    </button>
                    
                    <button 
                      onClick={handleMove}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                    >
                      <FolderOpen size={14} className="text-accent" /> Move to...
                    </button>
                    
                    <div className="h-px bg-white/20 dark:bg-white/8 my-1 mx-2" />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        setShowConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} /> Delete Note
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ═══ ROW 2: Author + Time + Folder Tag ═══ */}
        <div className="flex items-center gap-2 mb-3 text-[12px] text-text-secondary">
          <div className="w-5 h-5 rounded-full bg-accent/15 dark:bg-accent-dark/20 flex items-center justify-center text-[9px] font-bold text-accent dark:text-accent-dark overflow-hidden flex-shrink-0">
            {(note.author || "U").charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{note.author || "You"}</span>
          <span className="opacity-50">•</span>
          <span>{getTimeAgo(note.updatedAt)}</span>
          
          {note.folder && (
            <>
              <span className="opacity-50">•</span>
              <span className="px-2 py-0.5 rounded-md bg-accent/8 dark:bg-accent-dark/12 text-accent dark:text-accent-dark font-semibold text-[11px] max-w-[120px] truncate">
                {note.folder.name}
              </span>
            </>
          )}
        </div>

        {/* ═══ ROW 3: Content Preview ═══ */}
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
          {contentPreview}
        </p>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete(note);
          setShowConfirm(false);
        }}
        title="Delete Note?"
        message="This note will be permanently deleted. This action cannot be undone."
      />

      <MoveToFolderModal
        open={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        note={note}
        onMoved={() => {
          window.dispatchEvent(new Event("workspaceChanged"));
        }}
      />
    </>
  );
}

export default NoteRow;
