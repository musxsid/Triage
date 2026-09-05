import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

import { getFolders } from "../../services/folderService";
import { moveNoteToFolder } from "../../services/notesService";

function MoveToFolderModal({ open, onClose, note, onMoved }) {
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchFolders = async () => {
        try {
          const res = await getFolders();
          setFolders(res.data || []);
        } catch (err) {
          console.error("Failed to load folders", err);
        }
      };
      fetchFolders();
    }
  }, [open]);

  const handleMove = async (folderId) => {
    if (!note) return;
    
    setIsLoading(true);
    try {
      await moveNoteToFolder(note.id, folderId);
      toast.success("Note moved successfully!");
      onMoved(); 
      onClose(); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to move note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md glass rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 dark:border-white/8">
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-text-darkPrimary">
                  Move Note
                </h3>
                <p className="text-sm text-text-secondary truncate max-w-[250px]">
                  {note?.title || "Untitled Note"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 text-text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* FOLDER LIST */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              
              {/* Option to remove from folder (move to All Notes) */}
              <button
                disabled={isLoading}
                onClick={() => handleMove(null)} 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 transition-colors text-left border border-transparent hover:border-white/20 dark:hover:border-white/10"
              >
                <div className="w-10 h-10 rounded-lg bg-text-secondary/10 flex items-center justify-center text-text-secondary">
                  <LayoutGrid size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-text-primary dark:text-text-darkPrimary">
                    Remove from Folder
                  </h4>
                  <p className="text-xs text-text-secondary">Send to All Notes</p>
                </div>
              </button>

              <div className="h-px bg-white/15 dark:bg-white/8 my-2 mx-2" />

              {folders.length === 0 ? (
                <div className="text-center py-6 text-sm text-text-secondary">
                  You don't have any folders yet.
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    disabled={isLoading}
                    onClick={() => handleMove(folder.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 transition-colors text-left border border-transparent hover:border-white/20 dark:hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent dark:text-accent-dark">
                      <Folder size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[15px] font-semibold text-text-primary dark:text-text-darkPrimary">
                        {folder.name}
                      </h4>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default MoveToFolderModal;