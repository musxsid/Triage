import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings, User, Sparkles, Mail, Calendar, HeartPulse,
  Moon, Sun, Shield, Bell, Check, RefreshCw, Smartphone
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [autoSync, setAutoSync] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [healthSync, setHealthSync] = useState(true);

  const toggleTheme = (isDark) => {
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast.success(`${isDark ? "Dark" : "Light"} mode enabled`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent dark:text-accent-dark flex items-center justify-center">
              <Settings size={18} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-[13px] text-text-secondary">
            Manage your cross-app AI sync, integrations, and workspace appearance.
          </p>
        </div>
        <ProfileMenu />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appearance & Liquid Glass */}
        <div className="glass p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <Moon size={18} className="text-accent" />
            <h2 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
              Appearance & Theme
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleTheme(false)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                !darkMode
                  ? "bg-white border-accent shadow-md text-text-primary"
                  : "glass-subtle border-white/20 text-text-secondary hover:text-text-primary"
              }`}
            >
              <Sun size={20} className="text-amber-500" />
              <span className="text-[13px] font-bold">Light Sand</span>
            </button>

            <button
              onClick={() => toggleTheme(true)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                darkMode
                  ? "bg-white/15 border-accent shadow-md text-text-darkPrimary"
                  : "glass-subtle border-white/20 text-text-secondary hover:text-text-primary"
              }`}
            >
              <Moon size={20} className="text-accent-dark" />
              <span className="text-[13px] font-bold">Liquid Dark</span>
            </button>
          </div>
        </div>

        {/* AI & Copilot Configuration */}
        <div className="glass p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-accent" />
            <h2 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
              Spark AI Copilot
            </h2>
          </div>

          <div className="space-y-3 text-[13px]">
            <label className="flex items-center justify-between p-3 rounded-2xl glass-subtle border border-white/20 cursor-pointer">
              <div>
                <p className="font-semibold text-text-primary dark:text-text-darkPrimary">
                  Cross-App Intelligence
                </p>
                <p className="text-[11px] text-text-secondary">
                  Allow Spark to scan Calendar, Mail & Notes for free time & deadlines.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.checked);
                  toast.success("AI sync preferences updated");
                }}
                className="w-4 h-4 accent-accent rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl glass-subtle border border-white/20 cursor-pointer">
              <div>
                <p className="font-semibold text-text-primary dark:text-text-darkPrimary">
                  Smart Proactive Suggestions
                </p>
                <p className="text-[11px] text-text-secondary">
                  Suggest calendar blocks for unread emails and tasks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={aiSuggestions}
                onChange={(e) => {
                  setAiSuggestions(e.target.checked);
                  toast.success("Suggestion preferences updated");
                }}
                className="w-4 h-4 accent-accent rounded"
              />
            </label>
          </div>
        </div>

        {/* Ecosystem Connections */}
        <div className="glass p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <RefreshCw size={18} className="text-emerald-500" />
            <h2 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
              Ecosystem & Service Connections
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            {/* Google Mail & Cal */}
            <div className="p-4 rounded-2xl glass-subtle border border-white/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-text-darkPrimary">Gmail & Calendar</h4>
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold">
                    <Check size={11} /> Connected & Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Triage DB */}
            <div className="p-4 rounded-2xl glass-subtle border border-white/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-text-darkPrimary">Notes Knowledge Base</h4>
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold">
                    <Check size={11} /> Real-time Redis Sync
                  </span>
                </div>
              </div>
            </div>

            {/* Apple Health / Google Fit */}
            <div className="p-4 rounded-2xl glass-subtle border border-white/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <HeartPulse size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-text-darkPrimary">Personal Vitals & Health</h4>
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold">
                    <Check size={11} /> Biometric Sync Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
