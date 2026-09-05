import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/notesService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await login({ username, password });
      localStorage.setItem("token", res.data.token);
      toast.success("Welcome back");
      
      //  PINNING LOGIC: Check if they have a pinned workspace
      const pinnedWorkspaceId = localStorage.getItem("pinnedWorkspaceId");
      if (pinnedWorkspaceId) {
        localStorage.setItem("activeWorkspaceId", pinnedWorkspaceId);
        navigate("/dashboard"); // Teleport directly to their pinned workspace
      } else {
        navigate("/workspaces"); // Otherwise, show them the Hub
      }
      
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const darkMode = document.documentElement.classList.contains("dark");

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ═══ MARBLED PEACH BACKGROUND ═══ */}
      <div className="absolute inset-0 -z-10">
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1412] via-[#1E1714] to-[#141210]" />
            <div className="absolute w-[500px] h-[500px] bg-[#E8784A]/10 blur-[140px] top-[-120px] left-[-120px] rounded-full" />
            <div className="absolute w-[400px] h-[400px] bg-[#D4805C]/8 blur-[140px] bottom-[-120px] right-[-120px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#FFF8F3]" />
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-[#FDDCC4]/60 via-[#FFF0E6]/30 to-transparent blur-[100px] top-[-200px] right-[-150px] rounded-full" />
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-tl from-[#F8C9A8]/40 via-[#FDE8D8]/20 to-transparent blur-[100px] bottom-[-150px] left-[-100px] rounded-full" />
            <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-[#FFE4D0]/30 to-transparent blur-[60px] top-[30%] left-[20%] rounded-full" />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass glass-shimmer rounded-3xl shadow-2xl p-8 w-96 text-center relative z-10"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/20">
            <FileText size={15} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-darkPrimary">
            SimplyNotes
          </h1>
        </div>

        <p className="text-sm text-text-secondary mb-6">
          Your workspace, organized quietly.
        </p>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-3 rounded-xl glass-subtle text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none focus:shadow-glassHover transition-all text-[14px]"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-5 p-3 rounded-xl glass-subtle text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none focus:shadow-glassHover transition-all text-[14px]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-[14px] bg-gradient-to-r from-accent to-accent-secondary text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all active:scale-95 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm mt-5 text-text-secondary">
          New here?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-accent dark:text-accent-dark cursor-pointer hover:underline font-semibold"
          >
            Create account
          </span>
        </p>

      </motion.div>
    </div>
  );
}

export default LoginPage;