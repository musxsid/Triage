import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createWorkspace, uploadWorkspaceCover } from "../../services/workspaceService";

function CreateWorkspaceModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💼");
  const [coverImage, setCoverImage] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  const presetIcons = ["💼", "🚀", "🎓", "💻", "📚", "🎨", "🏡", "🧠"];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadWorkspaceCover(file);
      setCoverImage(res.data.url || res.url); 
      toast.success("Cover image uploaded!");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Workspace name is required");

    setIsLoading(true);
    try {
      await createWorkspace({ name, icon, coverImage });
      toast.success("Workspace created!");
      setName("");
      setIcon("💼");
      setCoverImage(null);
      onCreated(); 
      onClose();   
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err.response?.data?.message || "Failed to create workspace");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md glass-strong rounded-3xl shadow-2xl overflow-hidden border border-white/35 dark:border-white/10"
          >
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 dark:border-white/8">
              <h3 className="text-lg font-bold text-text-primary dark:text-text-darkPrimary">
                Create Workspace
              </h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 text-text-secondary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Cover Image (Optional)</label>
                <div onClick={() => !isUploading && fileInputRef.current?.click()} className="h-32 w-full rounded-xl border-2 border-dashed border-border dark:border-border-dark flex items-center justify-center cursor-pointer hover:bg-muted dark:hover:bg-muted-dark transition overflow-hidden relative group">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-text-secondary" />
                  ) : coverImage ? (
                    <>
                      <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full font-medium">Change Image</span></div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-text-secondary"><ImageIcon size={24} /><span className="text-xs font-medium">Click to upload</span></div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Icon</label>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-muted dark:bg-muted-dark border border-border dark:border-border-dark flex items-center justify-center text-2xl">{icon}</div>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {presetIcons.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setIcon(emoji)} className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted dark:hover:bg-muted-dark transition-colors ${icon === emoji ? 'bg-muted dark:bg-muted-dark border border-text-secondary/30' : 'border border-transparent'}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Work, Personal, Side Project..." className="w-full px-4 py-3 rounded-xl glass-subtle text-text-primary dark:text-text-darkPrimary outline-none focus:shadow-glassHover transition-all" />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-muted dark:hover:bg-muted-dark">Cancel</button>
                <button type="submit" disabled={isLoading || !name.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-accent to-accent-secondary text-white disabled:opacity-50 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30">
                  {isLoading ? "Creating..." : <><Plus size={16} /> Create</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default CreateWorkspaceModal;