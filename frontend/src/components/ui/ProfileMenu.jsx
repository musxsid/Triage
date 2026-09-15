import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, SlidersHorizontal, Shield } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import axios from "axios";

const parseJwt = (token) => {
  try {
    if (!token || !token.includes(".")) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored);
      const token = localStorage.getItem("token");
      const claims = parseJwt(token);
      if (claims) {
        return {
          username: claims.preferred_username || claims.sub || "user",
          email: claims.email || `${claims.preferred_username || "user"}@triage.io`,
          firstName: claims.given_name || claims.name || claims.preferred_username || "User",
          lastName: claims.family_name || "",
        };
      }
      const storedUser = localStorage.getItem("username");
      if (storedUser) {
        return { username: storedUser, email: `${storedUser}@triage.io`, firstName: storedUser };
      }
    } catch (e) {}
    return null;
  });
  
  const menuRef = useRef(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8080/api/auth/me", {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.username) {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } else {
        const claims = parseJwt(token);
        if (claims) {
          const u = {
            username: claims.preferred_username || claims.sub,
            email: claims.email || `${claims.preferred_username || "user"}@triage.io`,
            firstName: claims.given_name || claims.name || claims.preferred_username,
            lastName: claims.family_name || "",
          };
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      const claims = parseJwt(token);
      if (claims) {
        setUser({
          username: claims.preferred_username || claims.sub,
          email: claims.email || `${claims.preferred_username || "user"}@triage.io`,
          firstName: claims.given_name || claims.name || claims.preferred_username,
          lastName: claims.family_name || "",
        });
      }
    }
  };

  useEffect(() => {
    fetchUser();
    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {}
    };
    window.addEventListener("storage", handleProfileUpdate);
    window.addEventListener("user-profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
    };
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
  const displayName = user?.name
    ? user.name
    : user?.firstName 
    ? `${user.firstName} ${user.lastName || ""}`.trim() 
    : user?.username || "User";
  const displayEmail = user?.email || (user?.username ? `${user.username}@triage.io` : "user@triage.io");
  const seedName = user?.firstName || user?.username || "User";
  const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${seedName}&backgroundColor=transparent`;
  const avatarUrl = user?.profilePicture || user?.picture || defaultAvatar;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-accent/30 hover:border-accent/60 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30 glass overflow-hidden flex items-center justify-center"
      >
        <img 
          src={avatarUrl} 
          alt="Profile" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-60 glass rounded-2xl shadow-2xl p-2 z-50 origin-top-right"
          >
            <div className="px-3 py-2.5 mb-1 border-b border-white/15 dark:border-white/8 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-accent/30 overflow-hidden flex-shrink-0">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultAvatar;
                  }}
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-bold text-text-primary dark:text-text-darkPrimary truncate">{displayName}</p>
                <p className="text-[11px] text-text-secondary truncate">{displayEmail}</p>
              </div>
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