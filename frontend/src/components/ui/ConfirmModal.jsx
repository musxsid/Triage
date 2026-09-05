import { motion } from "framer-motion";
import { createPortal } from "react-dom";

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
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
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="
          relative z-[100000]
          glass
          rounded-2xl shadow-2xl
          p-6 w-96
        "
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2 text-text-primary dark:text-text-darkPrimary">
          {title}
        </h2>

        <p className="text-sm text-text-secondary mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-subtle font-semibold text-[13px] text-text-primary dark:text-text-darkPrimary hover:shadow-glassHover transition-all"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-[13px] hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>,
    document.body 
  );
}

export default ConfirmModal;