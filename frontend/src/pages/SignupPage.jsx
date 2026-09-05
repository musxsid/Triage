import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import axios from "axios";

const signup = async (data) => {
  return axios.post("http://localhost:8080/api/auth/register", data);
};

function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username || !password || !firstName || !lastName || !email) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await signup({ firstName, lastName, email, username, password });
      toast.success("Account created successfully!");
      
      localStorage.removeItem("token");
      localStorage.removeItem("activeWorkspaceId");
      localStorage.removeItem("pinnedWorkspaceId");
      
      navigate("/login");
    } catch (err) {
      const errorMsg = err.response?.data || "Signup failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const darkMode = document.documentElement.classList.contains("dark");

  const inputClass = "w-full mb-3 p-3 rounded-xl glass-subtle text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none focus:shadow-glassHover transition-all text-[14px]";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ═══ MARBLED PEACH BACKGROUND ═══ */}
      <div className="absolute inset-0 -z-10">
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1412] via-[#1E1714] to-[#141210]" />
            <div className="absolute w-[500px] h-[500px] bg-[#D4805C]/10 blur-[140px] top-[-120px] right-[-120px] rounded-full" />
            <div className="absolute w-[400px] h-[400px] bg-[#E8784A]/8 blur-[140px] bottom-[-120px] left-[-120px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#FFF8F3]" />
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-[#FDDCC4]/60 via-[#FFF0E6]/30 to-transparent blur-[100px] top-[-200px] left-[-150px] rounded-full" />
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-tl from-[#F8C9A8]/40 via-[#FDE8D8]/20 to-transparent blur-[100px] bottom-[-150px] right-[-100px] rounded-full" />
            <div className="absolute w-[250px] h-[250px] bg-gradient-to-r from-[#FFE4D0]/30 to-transparent blur-[60px] top-[40%] right-[25%] rounded-full" />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glass-shimmer rounded-3xl shadow-2xl p-8 w-[420px] text-center z-10 relative"
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
          Build your workspace, your way.
        </p>

        {/* Profile Name Grid */}
        <div className="flex gap-2">
           <input
            type="text"
            placeholder="First Name"
            className={inputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            className={inputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Email Address */}
        <input
          type="email"
          placeholder="Email Address"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Authentication Credentials */}
        <input
          type="text"
          placeholder="Username"
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-xl glass-subtle text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none focus:shadow-glassHover transition-all text-[14px]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-[14px] bg-gradient-to-r from-accent to-accent-secondary text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all active:scale-95 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-sm mt-5 text-text-secondary">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-accent dark:text-accent-dark cursor-pointer hover:underline font-semibold"
          >
            Log in
          </span>
        </p>

      </motion.div>
    </div>
  );
}

export default SignupPage;