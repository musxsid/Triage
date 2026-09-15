import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/notesService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Shield, Sparkles, ArrowRight, User, Lock } from "lucide-react";
import TriageLogo from "../components/ui/TriageLogo";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("username");
    if (token) {
      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("username", user);
        localStorage.setItem("user", JSON.stringify({
          username: user,
          email: `${user}@triage.io`,
          firstName: user,
        }));
      }
      toast.success("Welcome back!");
      navigate("/workspaces");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await login({ username, password });
      const token = res.data.token || res.data.accessToken || res.data.sessionId;
      if (token) {
        localStorage.setItem("token", token);
      }
      const loggedUser = {
        username: res.data.username || username,
        email: `${res.data.username || username}@triage.io`,
        firstName: res.data.username || username,
      };
      localStorage.setItem("username", res.data.username || username);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      toast.success("Welcome back!");

      navigate("/workspaces");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Instant note creation & search" },
    { icon: Shield, title: "Secure", desc: "End-to-end encrypted workspaces" },
    { icon: Sparkles, title: "AI Powered", desc: "Smart suggestions & summaries" },
  ];

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      
      {/* ═══ ABSOLUTE TOP-LEFT LOGO ═══ */}
      <div 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 lg:top-10 lg:left-12 z-50 cursor-pointer group"
      >
        <TriageLogo size={38} showWordmark={true} textClassName="text-text-primary dark:text-text-darkPrimary lg:text-white dark:lg:text-white" />
      </div>

      {/* ═══ LEFT PANEL — BRAND SHOWCASE ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-center p-12 overflow-hidden"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8784A] via-[#D4805C] to-[#C96B3C]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60" />
        
        {/* Floating Orbs */}
        <div className="absolute w-[300px] h-[300px] bg-white/10 blur-[80px] rounded-full top-[-50px] right-[-50px] animate-pulse-glow" />
        <div className="absolute w-[200px] h-[200px] bg-white/8 blur-[60px] rounded-full bottom-[20%] left-[-40px] animate-float-slow" />
        <div className="absolute w-[150px] h-[150px] bg-[#FFD4B8]/15 blur-[50px] rounded-full top-[40%] right-[20%] animate-float-reverse" />

        {/* Center — Hero Content */}
        <div className="relative z-10 max-w-lg mt-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight"
          >
            Your thoughts,<br />
            <span className="text-white/80">organized beautifully.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/70 text-lg leading-relaxed"
          >
            A minimal, AI-powered workspace that helps you capture ideas, 
            organize projects, and think clearly.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all cursor-default"
              >
                <f.icon size={16} className="text-white/90" />
                <div>
                  <p className="text-white text-xs font-semibold">{f.title}</p>
                  <p className="text-white/60 text-[10px]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom — Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-12 z-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#D4805C] bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm"
                />
              ))}
            </div>
            <p className="text-white/80 text-sm">
              <span className="text-white font-semibold">2,000+</span> creators love Triage
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══ RIGHT PANEL — LOGIN FORM ═══ */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Animated App-Themed Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden bg-[#FFF8F3] dark:bg-[#1A1412]">
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-[#FDDCC4]/40 via-[#FFF0E6]/20 to-transparent blur-[100px] top-[-100px] right-[-50px] rounded-full" />
          <div className="absolute w-[300px] h-[300px] bg-gradient-to-tl from-[#F8C9A8]/30 via-[#FDE8D8]/15 to-transparent blur-[80px] bottom-[-80px] left-[-50px] rounded-full" />
          
          {/* Floating Note 1 */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[10%] w-48 h-32 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/80 dark:border-white/10 shadow-lg p-4 transform rotate-12 hidden md:block"
          >
            <div className="w-2/3 h-2 bg-accent/30 rounded-full mb-3" />
            <div className="w-full h-1.5 bg-text-secondary/20 rounded-full mb-2" />
            <div className="w-4/5 h-1.5 bg-text-secondary/20 rounded-full mb-2" />
            <div className="w-1/2 h-1.5 bg-text-secondary/20 rounded-full" />
          </motion.div>
          
          {/* Floating Folder */}
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] lg:bottom-[15%] left-[5%] lg:-left-12 w-44 h-40 bg-accent/5 backdrop-blur-md rounded-xl border border-accent/10 shadow-lg p-4 transform -rotate-6 hidden md:block"
          >
             <div className="w-1/2 h-8 bg-accent/10 rounded-t-lg absolute -top-8 left-0 border-t border-l border-r border-accent/10" />
            <div className="flex items-center gap-2 mb-3 mt-2">
              <div className="w-3 h-3 rounded-full bg-accent/40" />
              <div className="w-20 h-2 bg-accent/20 rounded-full" />
            </div>
            <div className="w-full h-16 bg-white/40 dark:bg-white/5 rounded-lg border border-white/40 dark:border-white/10 shadow-sm" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[400px] px-8 z-10"
        >
          {/* Header */}
          <div className="mb-8 mt-12 lg:mt-0 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-darkPrimary tracking-tight">
              Welcome back
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wide">Username</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/40 group-focus-within:text-accent transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl glass-strong text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/40 outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm shadow-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wide">Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/40 group-focus-within:text-accent transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl glass-strong text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/40 outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent to-accent-secondary text-white shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              <>
                Sign in
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
            <span className="text-xs font-medium text-text-secondary/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>

          {/* Google Sign In Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => window.location.href = "http://localhost:8080/api/auth/google/login"}
            className="w-full py-3 rounded-xl border border-white/40 dark:border-white/10 glass hover:bg-white/40 dark:hover:bg-white/10 text-text-primary dark:text-text-darkPrimary font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign in with Google
          </motion.button>

          {/* Sign Up Link */}
          <p className="text-sm text-text-secondary text-center font-medium">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-accent dark:text-accent-dark cursor-pointer hover:underline font-bold"
            >
              Create one
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;