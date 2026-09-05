import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, SlidersHorizontal, Shield } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import axios from "axios";

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safe display fallbacks
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ""}`.trim() 
    : user?.username || "Loading...";
  const displayEmail = user?.email || `${user?.username || "user"}@simplynotes.io`;
  const seedName = user?.firstName || user?.username || "Siddh";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-accent/30 hover:border-accent/60 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30 glass overflow-hidden"
      >
        <img 
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seedName}&backgroundColor=transparent`} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-2xl p-2 z-50 origin-top-right"
          >
            <div className="px-3 py-2 mb-1 border-b border-white/15 dark:border-white/8">
              <p className="text-[13px] font-bold text-text-primary dark:text-text-darkPrimary truncate">{displayName}</p>
              <p className="text-[11px] text-text-secondary truncate">{displayEmail}</p>
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false);
                setIsEditModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 text-text-primary dark:text-text-darkPrimary transition text-[13px] font-semibold mt-1"
            >
              <Pencil size={15} className="text-text-secondary" /> Edit Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 text-text-primary dark:text-text-darkPrimary transition text-[13px] font-semibold">
              <SlidersHorizontal size={15} className="text-text-secondary" /> Account Preferences
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/8 text-text-primary dark:text-text-darkPrimary transition text-[13px] font-semibold">
              <Shield size={15} className="text-text-secondary" /> Security
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <EditProfileModal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        userData={user} 
        onUpdated={fetchUser} 
      />
    </div>
  );
};

export default ProfileMenu;