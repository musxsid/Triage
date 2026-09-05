import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function FolderCreateModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
      />

      {/* MODAL — Glassmorphic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="
          relative z-[100000]
          w-full max-w-sm
          rounded-2xl
          glass
          shadow-2xl
          p-6
        "
      >
        <h2 className="text-lg font-bold mb-4 text-text-primary dark:text-text-darkPrimary">
          Create Folder
        </h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name..."
          className="
            w-full h-11 px-4 rounded-xl
            glass-subtle
            text-sm text-text-primary dark:text-text-darkPrimary
            placeholder:text-text-secondary/50
            outline-none focus:shadow-glassHover transition-all
          "
        />

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold glass-subtle text-text-primary dark:text-text-darkPrimary hover:shadow-glassHover transition-all"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate(name.trim());
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-accent to-accent-secondary text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>,
    document.body 
  );
}

export default FolderCreateModal;