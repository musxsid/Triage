import { motion, AnimatePresence } from "framer-motion";
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

  return (
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
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                )}
              </div>
              
              {/* Overlay Camera Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl pointer-events-none">
                <Camera size={24} className="text-white" />
              </div>

              <button className="absolute -top-2 -right-2 p-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg hover:text-accent transition shadow-sm">
                <Copy size={12} />
              </button>
            </div>

            <div className="flex flex-col items-end gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="px-4 py-2 border border-border dark:border-border-dark rounded-xl text-sm font-semibold hover:bg-muted dark:hover:bg-muted-dark transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Change Photo"}
              </button>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Max 5MB</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[12px] font-bold text-text-primary dark:text-text-darkPrimary ml-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-muted/50 dark:bg-muted-dark/50 border border-border dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition text-text-primary dark:text-text-darkPrimary"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[12px] font-bold text-text-primary dark:text-text-darkPrimary ml-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-muted/50 dark:bg-muted-dark/50 border border-border dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition text-text-primary dark:text-text-darkPrimary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-text-primary dark:text-text-darkPrimary ml-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder={`${userData?.username || "user"}@simplynotes.io`}
                className="w-full bg-muted/50 dark:bg-muted-dark/50 border border-border dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50"
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
    </AnimatePresence>
  );
};

export default EditProfileModal;