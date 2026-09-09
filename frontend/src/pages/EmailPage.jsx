import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail, Inbox, Send, Star, FileText, Trash2,
  Search, Plus, Reply, Forward, Archive, FileEdit,
  Clock, X, Check, ShieldAlert, Sparkles, Filter,
  Loader2, RefreshCw, AlertCircle
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote } from "../services/notesService";
import {
  getGmailStatus,
  getGoogleAuthUrl,
  getGmailMessages,
  getGmailMessageById,
  sendGmailMessage,
  toggleStarMessage,
  trashMessage,
  archiveMessage
} from "../services/gmailService";

const MAIL_FOLDERS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileEdit },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export default function EmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Connection & Auth State
  const [gmailConnected, setGmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Email List & Reader State
  const [emails, setEmails] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmailDetails, setSelectedEmailDetails] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Compose State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [convertingNote, setConvertingNote] = useState(false);

  // Ref to debounce search
  const searchTimeoutRef = useRef(null);

  // 1. Initial Status Check and OAuth Callback Check
  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connectedParam === "true") {
      toast.success("Connected to Gmail successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      toast.error("Failed to connect Gmail: " + decodeURIComponent(errorParam));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await getGmailStatus();
      if (res.data && res.data.connected) {
        setGmailConnected(true);
        setConnectedEmail(res.data.email || "");
        loadEmails("inbox", searchQuery);
      } else {
        setGmailConnected(false);
      }
    } catch (err) {
      console.warn("Gmail status check failed:", err);
      setGmailConnected(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  // 2. Fetch Messages when folder or connected status changes
  const loadEmails = async (folder, q = "") => {
    setLoadingMessages(true);
    try {
      const res = await getGmailMessages(folder, q);
      const fetched = res.data?.messages || [];
      setEmails(fetched);

      // Compute unread count for inbox
      if (folder === "inbox") {
        setUnreadCount(fetched.filter((m) => m.unread).length);
      }

      if (fetched.length > 0) {
        const firstId = fetched[0].id;
        setSelectedEmailId(firstId);
        loadEmailDetails(firstId);
      } else {
        setSelectedEmailId(null);
        setSelectedEmailDetails(null);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (err.response?.status === 428) {
        setGmailConnected(false);
      } else {
        toast.error("Failed to load messages from Gmail");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // 3. Load full email body
  const loadEmailDetails = async (id) => {
    if (!id) return;
    setLoadingBody(true);
    try {
      const res = await getGmailMessageById(id);
      setSelectedEmailDetails(res.data);
      // Mark as read in local list if it was unread
      setEmails((prev) =>
        prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
      );
      if (selectedFolder === "inbox") {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to load email details:", err);
    } finally {
      setLoadingBody(false);
    }
  };

  // Handle Folder Change
  const handleSelectFolder = (folderId) => {
    setSelectedFolder(folderId);
    if (gmailConnected) {
      loadEmails(folderId, searchQuery);
    }
  };

  // Handle Search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (gmailConnected) {
        loadEmails(selectedFolder, query);
      }
    }, 450);
  };

  // Select Email from left list
  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);
    loadEmailDetails(email.id);
  };

  // Star Toggle
  const handleToggleStar = async (e, email) => {
    e.stopPropagation();
    const newStar = !email.starred;

    // Optimistic UI update
    setEmails((prev) =>
      prev.map((item) =>
        item.id === email.id ? { ...item, starred: newStar } : item
      )
    );
    if (selectedEmailDetails && selectedEmailDetails.id === email.id) {
      setSelectedEmailDetails((prev) => ({ ...prev, starred: newStar }));
    }

    try {
      await toggleStarMessage(email.id, newStar);
    } catch (err) {
      console.error("Failed to toggle star:", err);
      toast.error("Failed to update star");
      // Revert on error
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id ? { ...item, starred: !newStar } : item
        )
      );
    }
  };

  // Trash Email
  const handleMoveToTrash = async (emailId) => {
    // Optimistic remove
    setEmails((prev) => prev.filter((item) => item.id !== emailId));
    if (selectedEmailId === emailId) {
      const remaining = emails.filter((item) => item.id !== emailId);
      if (remaining.length > 0) {
        setSelectedEmailId(remaining[0].id);
        loadEmailDetails(remaining[0].id);
      } else {
        setSelectedEmailId(null);
        setSelectedEmailDetails(null);
      }
    }
    toast.success("Moved to Trash");

    try {
      await trashMessage(emailId);
    } catch (err) {
      console.error("Failed to trash message:", err);
      toast.error("Failed to move email to trash");
      loadEmails(selectedFolder, searchQuery);
    }
  };

  // Archive Email
  const handleMoveToArchive = async (emailId) => {
    // Optimistic remove
    setEmails((prev) => prev.filter((item) => item.id !== emailId));
    if (selectedEmailId === emailId) {
      const remaining = emails.filter((item) => item.id !== emailId);
      if (remaining.length > 0) {
        setSelectedEmailId(remaining[0].id);
        loadEmailDetails(remaining[0].id);
      } else {
        setSelectedEmailId(null);
        setSelectedEmailDetails(null);
      }
    }
    toast.success("Archived email");

    try {
      await archiveMessage(emailId);
    } catch (err) {
      console.error("Failed to archive message:", err);
      toast.error("Failed to archive email");
      loadEmails(selectedFolder, searchQuery);
    }
  };

  // Connect Gmail Button Click
  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const res = await getGoogleAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Could not generate Google authorization link.");
      }
    } catch (err) {
      console.error("Google connect error:", err);
      const msg = err.response?.data?.error || "Google OAuth client is not configured in .env";
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  // Send Email Handler
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject) {
      toast.error("Please provide a recipient and subject.");
      return;
    }

    setSendingEmail(true);
    try {
      await sendGmailMessage({
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
      });

      toast.success("Email sent successfully via Gmail!");
      setShowComposeModal(false);
      setComposeData({ to: "", subject: "", body: "" });

      if (selectedFolder === "sent") {
        loadEmails("sent", searchQuery);
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      toast.error(err.response?.data?.error || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Turn into Note Handler
  const handleTurnIntoNote = async () => {
    const activeEmail = selectedEmailDetails || emails.find((e) => e.id === selectedEmailId);
    if (!activeEmail) return;

    setConvertingNote(true);
    try {
      const bodyContent = (activeEmail.body || activeEmail.preview || "").replace(/\n/g, "<br/>");
      const noteHtml = `<h3>${activeEmail.subject}</h3><p><b>From:</b> ${activeEmail.sender} &lt;${activeEmail.email}&gt;</p><p><b>Date:</b> ${activeEmail.date}</p><hr/><p>${bodyContent}</p>`;

      const res = await createNote({
        title: `Email: ${activeEmail.subject}`,
        content: noteHtml,
      });

      toast.success("Created note from email!");
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to convert email to note:", err);
      toast.error("Failed to convert email to note.");
    } finally {
      setConvertingNote(false);
    }
  };

  const activeEmail = selectedEmailDetails || emails.find((e) => e.id === selectedEmailId);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      
      {/* Top Profile Menu */}
      <div className="fixed top-6 right-8 z-[100] hidden md:block">
        <ProfileMenu />
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/25 text-white">
            <Mail size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary">
                Triage Mail
              </h1>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold text-white bg-accent px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount} new
                </span>
              )}
              {gmailConnected && connectedEmail && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {connectedEmail}
                </span>
              )}
            </div>
            <p className="text-[14px] text-text-secondary mt-0.5">
              Unified communication for your workspace with 1-click note conversion.
            </p>
          </div>
        </div>

        {/* Compose Button & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {gmailConnected && (
            <button
              onClick={() => loadEmails(selectedFolder, searchQuery)}
              disabled={loadingMessages}
              title="Refresh messages"
              className="p-2.5 rounded-2xl glass text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition hover:scale-105 active:scale-95 border border-white/20 dark:border-white/10"
            >
              <RefreshCw size={15} className={loadingMessages ? "animate-spin" : ""} />
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-secondary text-white text-[13px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
          >
            <Plus size={16} /> Compose
          </motion.button>
        </div>
      </div>

      {/* ═══ MAIL FOLDERS & SEARCH BAR ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        
        {/* Full Suite of Mail Options: Inbox, Starred, Sent, Drafts, Archive, Trash */}
        <div className="glass-pill rounded-2xl p-1 flex items-center flex-wrap gap-1 border border-white/30 dark:border-white/10 self-start shadow-md">
          {MAIL_FOLDERS.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFolder === f.id;
            const badgeCount =
              f.id === "inbox" && unreadCount > 0
                ? unreadCount
                : isSelected
                ? emails.length
                : null;

            return (
              <button
                key={f.id}
                onClick={() => handleSelectFolder(f.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isSelected
                    ? "bg-white/60 dark:bg-white/15 text-text-primary dark:text-text-darkPrimary shadow-sm"
                    : "text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary"
                }`}
              >
                <Icon
                  size={14}
                  className={isSelected && f.id === "starred" ? "text-yellow-500 fill-yellow-500" : ""}
                />
                <span>{f.label}</span>
                {badgeCount !== null && badgeCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? "bg-accent/15 text-accent dark:text-accent-dark font-extrabold"
                        : "bg-white/20 dark:bg-white/5 text-text-secondary"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search emails (Gmail syntax: from:, has:)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-3 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent"
          />
        </div>
      </div>

      {/* ═══ SINGLE UNIFIED CONTAINER (LIST + READER DIVIDED) ═══ */}
      <div className="glass-strong rounded-3xl overflow-hidden border border-white/35 dark:border-white/10 shadow-2xl flex flex-col md:flex-row h-[72vh] min-h-[580px]">
        
        {loadingStatus ? (
          /* Loading status spinner */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <Loader2 size={32} className="animate-spin text-accent mb-3" />
            <p className="text-xs font-semibold text-text-secondary">Checking Google Workspace connection...</p>
          </div>
        ) : !gmailConnected ? (
          /* On-Demand Connection Prompt */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/5 dark:bg-black/10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/15 via-accent/10 to-amber-500/15 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-xl shadow-accent/15 mb-6 backdrop-blur-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary mb-2">
                Connect your Gmail to view messages
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8">
                Link your Google Workspace or personal Gmail account to sync your live inbox, search threads in real-time, compose emails, and convert messages into workspace notes with 1-click.
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConnectGmail}
                disabled={connecting}
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-bold shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all disabled:opacity-60"
              >
                {connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Connecting to Google...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Connect Gmail Account
                  </>
                )}
              </motion.button>

              <span className="text-[11px] text-text-secondary/60 mt-5 flex items-center gap-1.5 font-medium">
                🔒 Encrypted refresh token storage • OAuth 2.0 offline access
              </span>
            </motion.div>
          </div>
        ) : (
          /* Live Gmail UI (Original Layout Preserved) */
          <>
            {/* Left Pane: Email Thread List */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-b md:border-b-0 md:border-r border-white/20 dark:border-white/8 flex flex-col overflow-hidden">
              
              {/* Subheader */}
              <div className="px-4 py-3 border-b border-white/15 dark:border-white/5 flex items-center justify-between bg-white/5 dark:bg-black/5">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  {MAIL_FOLDERS.find((f) => f.id === selectedFolder)?.label} • {emails.length} messages
                </span>
                {loadingMessages && (
                  <Loader2 size={13} className="animate-spin text-accent" />
                )}
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
                {loadingMessages ? (
                  <div className="py-20 flex flex-col items-center justify-center text-text-secondary text-sm">
                    <Loader2 size={24} className="animate-spin text-accent mb-2" />
                    <span className="text-xs">Fetching messages from Gmail...</span>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="py-20 text-center text-text-secondary text-sm">
                    No emails in {selectedFolder}.
                  </div>
                ) : (
                  emails.map((email) => {
                    const isSelected = email.id === selectedEmailId;
                    return (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-150 border text-left ${
                          isSelected
                            ? "bg-white/60 dark:bg-white/15 border-accent/40 dark:border-accent-dark/40 shadow-sm"
                            : "border-transparent hover:bg-white/30 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-6 h-6 rounded-lg bg-accent/15 text-accent dark:text-accent-dark flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {email.avatar || "👤"}
                            </span>
                            <span className={`text-[13px] truncate ${email.unread ? "font-extrabold text-text-primary dark:text-text-darkPrimary" : "font-semibold text-text-secondary"}`}>
                              {email.sender}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => handleToggleStar(e, email)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                size={13}
                                className={email.starred ? "text-yellow-500 fill-yellow-500" : "text-text-secondary/40"}
                              />
                            </button>
                            <span className="text-[10px] text-text-secondary/60">
                              {email.date}
                            </span>
                          </div>
                        </div>

                        <p className={`text-[12px] truncate ${email.unread ? "font-bold text-text-primary dark:text-text-darkPrimary" : "font-medium text-text-primary/90 dark:text-text-darkPrimary/90"}`}>
                          {email.subject}
                        </p>

                        <p className="text-[11px] text-text-secondary/70 line-clamp-2 mt-0.5 leading-relaxed">
                          {email.preview}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-accent dark:text-accent-dark bg-accent/10 px-1.5 py-0.5 rounded-md border border-accent/20">
                            {email.tag || "Mail"}
                          </span>
                          {email.unread && (
                            <span className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Reading Details View */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white/5 dark:bg-black/10">
              {loadingBody ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                  <Loader2 size={24} className="animate-spin text-accent mb-2" />
                  <span className="text-xs">Loading email contents...</span>
                </div>
              ) : activeEmail ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {/* Header Details */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 mb-5 border-b border-white/20 dark:border-white/8">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-darkPrimary mb-1.5">
                        {activeEmail.subject}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-accent/15 text-accent dark:text-accent-dark flex items-center justify-center text-[10px] font-bold">
                          {activeEmail.avatar || "👤"}
                        </span>
                        <span className="font-bold text-text-primary dark:text-text-darkPrimary">
                          {activeEmail.sender}
                        </span>
                        <span>&lt;{activeEmail.email}&gt;</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {activeEmail.date}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTurnIntoNote}
                        disabled={convertingNote}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-secondary transition disabled:opacity-50"
                        title="Turn this email into a workspace note"
                      >
                        <FileText size={13} />
                        <span>{convertingNote ? "Saving..." : "Turn into Note"}</span>
                      </motion.button>

                      <button
                        onClick={() => handleMoveToArchive(activeEmail.id)}
                        className="p-2 rounded-xl glass text-text-secondary hover:text-text-primary transition"
                        title="Archive email"
                      >
                        <Archive size={14} />
                      </button>

                      <button
                        onClick={() => handleMoveToTrash(activeEmail.id)}
                        className="p-2 rounded-xl glass text-text-secondary hover:text-red-500 transition"
                        title="Move to Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-[14px] leading-relaxed text-text-primary dark:text-text-darkPrimary whitespace-pre-line py-2">
                    {activeEmail.body || activeEmail.preview}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <Mail size={40} className="text-text-secondary/30 mb-3" />
                  <p className="text-sm font-bold text-text-primary dark:text-text-darkPrimary">
                    No email selected
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Choose an email from the list to view its contents.
                  </p>
                </div>
              )}

              {/* Quick Reply Bar at Bottom */}
              {activeEmail && (
                <div className="p-4 border-t border-white/20 dark:border-white/8 bg-white/5 dark:bg-black/5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setComposeData({
                        to: activeEmail.email,
                        subject: activeEmail.subject.startsWith("Re:") ? activeEmail.subject : `Re: ${activeEmail.subject}`,
                        body: `\n\n--- On ${activeEmail.date}, ${activeEmail.sender} wrote:\n> ${(activeEmail.body || activeEmail.preview || "").replace(/\n/g, "\n> ")}`
                      });
                      setShowComposeModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-xs font-bold text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 transition"
                  >
                    <Reply size={13} /> Reply
                  </button>

                  <button
                    onClick={() => {
                      setComposeData({
                        to: "",
                        subject: activeEmail.subject.startsWith("Fwd:") ? activeEmail.subject : `Fwd: ${activeEmail.subject}`,
                        body: `\n\n--- Forwarded Message ---\nFrom: ${activeEmail.sender} <${activeEmail.email}>\nSubject: ${activeEmail.subject}\n\n${activeEmail.body || activeEmail.preview || ""}`
                      });
                      setShowComposeModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-xs font-bold text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 transition"
                  >
                    <Forward size={13} /> Forward
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* ═══ COMPOSE MODAL (PORTALED) ═══ */}
      {typeof document !== "undefined" && showComposeModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-strong rounded-3xl p-6 shadow-2xl w-full max-w-lg border border-white/35 dark:border-white/12"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-accent" />
                  <h3 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
                    New Message
                  </h3>
                </div>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-1 rounded-lg glass text-text-secondary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Recipient email..."
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Subject..."
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-xl glass text-xs font-semibold text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent"
                  />
                </div>

                <div>
                  <textarea
                    rows={6}
                    placeholder="Write your email here..."
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    required
                    className="w-full p-3.5 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold glass text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-secondary transition active:scale-95 disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={13} /> Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
