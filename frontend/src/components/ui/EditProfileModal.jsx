import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Copy, KeyRound, Trash2, Bell, Loader2, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const EditProfileModal = ({ open, onClose, userData, onUpdated }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: "" 
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        profilePicture: userData.profilePicture || "" 
      });
    }
  }, [userData, open]);

  if (!open) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/upload/image", uploadData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        }
      });
      
      setFormData(prev => ({ ...prev, profilePicture: res.data.url }));
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put("http://localhost:8080/api/auth/update", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const stored = localStorage.getItem("user");
      const current = stored ? JSON.parse(stored) : {};
      const updatedUser = {
        ...current,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        email: formData.email,
        profilePicture: formData.profilePicture
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updatedUser }));
      toast.success("Profile updated successfully!");
      if (onUpdated) onUpdated(); // Refresh data in the menu
      onClose();
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const seedName = userData?.firstName || userData?.username || "Siddh";
  
  const currentAvatar = formData.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${seedName}&backgroundColor=transparent`;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass p-6 rounded-[24px] shadow-2xl w-full max-w-md"
        >
          {/* Header & Avatar */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-2xl bg-muted dark:bg-muted-dark border border-border dark:border-border-dark overflow-hidden flex items-center justify-center text-2xl font-bold text-text-primary dark:text-text-darkPrimary shadow-inner">
                {uploading ? (
                  <Loader2 size={32} className="animate-spin text-accent" />
                ) : (
                  <img 
                    src={currentAvatar} 
                    alt="Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:opacity-75 transition"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-2xl">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent dark:text-accent-dark">
                Active Member
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1 mt-1"
              >
                <Camera size={13} /> Change photo
              </button>
              {formData.profilePicture && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, profilePicture: "" }))}
                  className="text-[11px] text-text-secondary hover:text-red-500 transition"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name" 
                  className="w-full px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm text-text-primary dark:text-text-darkPrimary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name" 
                  className="w-full px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm text-text-primary dark:text-text-darkPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com" 
                className="w-full px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm text-text-primary dark:text-text-darkPrimary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted dark:hover:bg-muted-dark text-text-primary dark:text-text-darkPrimary transition text-sm font-medium">
              <KeyRound size={16} className="text-text-secondary" /> Change Password
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-text-primary dark:text-text-darkPrimary hover:text-red-500 transition text-sm font-medium">
              <Trash2 size={16} className="text-text-secondary" /> Delete Account
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50 dark:border-border-dark/50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:text-text-primary transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-accent to-accent-secondary text-white hover:shadow-accent/30 transition shadow-lg shadow-accent/20 flex items-center gap-2 disabled:opacity-70"
            >
              {(saving || uploading) && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default EditProfileModal;