import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail, Inbox, Send, Star, FileText, Trash2,
  Search, Plus, Reply, Forward, Archive, FileEdit,
  Clock, X, Check, ShieldAlert, Sparkles, Filter
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote } from "../services/notesService";

const INITIAL_EMAILS = [
  {
    id: 1,
    sender: "Sarah Lin",
    email: "sarah.lin@workspace.io",
    avatar: "👩‍💻",
    subject: "Q3 Product Architecture & Liquid Glass Redesign",
    preview: "Hey team, the obsidian and liquid glass design tokens have been finalized across the board. The specular highlights...",
    body: `Hey Siddharth,

The obsidian and liquid glass design tokens have been finalized across the board. The specular highlights, saturated backdrop blur, and dark-mode depth look truly incredible!

Key Deliverables for this week:
1. Micro-interactions and hover tooltips for sidebar actions.
2. Note-to-Calendar synchronization for deadlines.
3. Spark AI Assistant integration for one-click note synthesis.

Let me know if you want to review the live prototype together this afternoon.

Best,
Sarah Lin
Lead Product Designer`,
    date: "10:42 AM",
    folder: "inbox",
    unread: true,
    starred: true,
    tag: "Design",
  },
  {
    id: 2,
    sender: "Keycloak Security",
    email: "auth-daemon@simplynotes.internal",
    avatar: "🔐",
    subject: "Session Token Lifespan Extended to 24 Hours",
    preview: "Security audit completed: Redis session resolution is operating at 99.98% reliability with zero 401 leaks...",
    body: `Notice of System Update:

We have successfully configured the SimplyNotes realm access token lifespan to 86,400 seconds (24 hours). 

Summary of updates:
• SSO session idle timeout: 24h
• Direct Keycloak token delegation via RedisSessionFilter
• Automatic fallback for offline AI services

No action required from your end. Your workspace session is verified.`,
    date: "Yesterday",
    folder: "inbox",
    unread: false,
    starred: false,
    tag: "Security",
  },
  {
    id: 3,
    sender: "Marcus Vance",
    email: "marcus@venturecapital.com",
    avatar: "💼",
    subject: "SimplyNotes Beta Feedback & Collaboration",
    preview: "Testing SimplyNotes with our investment committee. The distraction-free workspace is exactly what our founders need...",
    body: `Hi Siddharth,

I’ve been testing SimplyNotes over the last two weeks with our investment committee. The distraction-free workspace, instant omni-search, and clean sidebar hierarchy make capturing meeting notes effortless.

Would love to schedule a quick 15-minute sync next Tuesday to discuss potential partnership opportunities.

Cheers,
Marcus Vance`,
    date: "Sep 6",
    folder: "inbox",
    unread: false,
    starred: true,
    tag: "Partnership",
  },
  {
    id: 4,
    sender: "Draft: Q4 Vision Outline",
    email: "me@simplynotes.io",
    avatar: "📝",
    subject: "Draft: Q4 Vision Outline & Multi-user Sync",
    preview: "Thoughts on CRDT real-time multi-cursor collaboration for boards and folders...",
    body: `[DRAFT NOT SENT YET]

Key pillars for Q4:
1. Multi-player real-time canvas notes.
2. End-to-end encrypted backup bundles.
3. Offline service-worker sync with indexedDB cache.`,
    date: "Sep 5",
    folder: "drafts",
    unread: false,
    starred: false,
    tag: "Draft",
  },
  {
    id: 5,
    sender: "Alex Rivers",
    email: "alex.rivers@designsystems.io",
    avatar: "🎨",
    subject: "Sent: Design Token Specifications v2.4",
    preview: "Attached are the updated design tokens for liquid glass specular borders and saturated dark mode shadows...",
    body: `Hi team,

Following up on our sync, I have pushed token release v2.4 with the updated specular border highlight values and saturated glass pills.

Check the repository docs for the full CSS variables breakdown.`,
    date: "Sep 3",
    folder: "sent",
    unread: false,
    starred: false,
    tag: "Sent",
  },
  {
    id: 6,
    sender: "GitHub Notifications",
    email: "notifications@github.com",
    avatar: "🐙",
    subject: "Archive: CI/CD Pipeline Passed for api-gateway",
    preview: "Build #412 succeeded on branch master. 0 vulnerabilities found, all container tests passed...",
    body: `Build Succeeded: simplynotes-api-gateway

Commit: feat(auth): add jwt claims decoding for /me endpoint
Status: 200 OK
Duration: 13.2s`,
    date: "Aug 29",
    folder: "archive",
    unread: false,
    starred: false,
    tag: "DevOps",
  },
  {
    id: 7,
    sender: "Stale Marketing Promo",
    email: "newsletter@generictech.co",
    avatar: "🗑️",
    subject: "Trash: 50% discount on cloud hosting subscriptions",
    preview: "Limited time discount offer for enterprise cloud hosting clusters...",
    body: `This email is in Trash. Restore or permanently delete whenever you choose.`,
    date: "Aug 20",
    folder: "trash",
    unread: false,
    starred: false,
    tag: "Promo",
  },
];

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
  const [emails, setEmails] = useState(INITIAL_EMAILS);
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [convertingNote, setConvertingNote] = useState(false);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  const filteredEmails = emails.filter((email) => {
    if (selectedFolder === "starred") {
      if (!email.starred) return false;
    } else {
      if (email.folder !== selectedFolder) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        email.sender.toLowerCase().includes(q) ||
        email.subject.toLowerCase().includes(q) ||
        email.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleStar = (e, emailId) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const handleMoveToTrash = (emailId) => {
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId ? { ...item, folder: "trash" } : item
      )
    );
    toast.success("Moved to Trash");
  };

  const handleMoveToArchive = (emailId) => {
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId ? { ...item, folder: "archive" } : item
      )
    );
    toast.success("Archived email");
  };

  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);
    if (email.unread) {
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id ? { ...item, unread: false } : item
        )
      );
    }
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject) {
      toast.error("Please provide a recipient and subject.");
      return;
    }

    const newEmail = {
      id: Date.now(),
      sender: "You",
      email: "me@simplynotes.io",
      avatar: "👤",
      subject: composeData.subject,
      preview: composeData.body.substring(0, 80) + "...",
      body: composeData.body,
      date: "Just now",
      folder: "sent",
      unread: false,
      starred: false,
      tag: "Sent",
    };

    setEmails([newEmail, ...emails]);
    setShowComposeModal(false);
    setComposeData({ to: "", subject: "", body: "" });
    toast.success("Email sent successfully!");
  };

  const handleTurnIntoNote = async () => {
    if (!selectedEmail) return;
    setConvertingNote(true);
    try {
      const noteHtml = `<h3>${selectedEmail.subject}</h3><p><b>From:</b> ${selectedEmail.sender} (${selectedEmail.email})</p><p><b>Date:</b> ${selectedEmail.date}</p><hr/><p>${selectedEmail.body.replace(/\n/g, "<br/>")}</p>`;

      const res = await createNote({
        title: `Email: ${selectedEmail.subject}`,
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

  const unreadCount = emails.filter((e) => e.folder === "inbox" && e.unread).length;

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
                SimplyMail
              </h1>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold text-white bg-accent px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[14px] text-text-secondary mt-0.5">
              Unified communication for your workspace with 1-click note conversion.
            </p>
          </div>
        </div>

        {/* Compose Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-secondary text-white text-[13px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Compose
        </motion.button>
      </div>

      {/* ═══ MAIL FOLDERS & SEARCH BAR ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        
        {/* Full Suite of Mail Options: Inbox, Starred, Sent, Drafts, Archive, Trash */}
        <div className="glass-pill rounded-2xl p-1 flex items-center flex-wrap gap-1 border border-white/30 dark:border-white/10 self-start shadow-md">
          {MAIL_FOLDERS.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFolder === f.id;
            const count =
              f.id === "inbox"
                ? unreadCount
                : emails.filter((e) => (f.id === "starred" ? e.starred : e.folder === f.id)).length;

            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
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
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? "bg-accent/15 text-accent dark:text-accent-dark font-extrabold"
                        : "bg-white/20 dark:bg-white/5 text-text-secondary"
                    }`}
                  >
                    {count}
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
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10"
          />
        </div>
      </div>

      {/* ═══ SINGLE UNIFIED CONTAINER (LIST + READER DIVIDED) ═══ */}
      <div className="glass-strong rounded-3xl overflow-hidden border border-white/35 dark:border-white/10 shadow-2xl flex flex-col md:flex-row h-[72vh] min-h-[580px]">
        
        {/* Left Pane: Email Thread List */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-b md:border-b-0 md:border-r border-white/20 dark:border-white/8 flex flex-col overflow-hidden">
          
          {/* Subheader */}
          <div className="px-4 py-3 border-b border-white/15 dark:border-white/5 flex items-center justify-between bg-white/5 dark:bg-black/5">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              {MAIL_FOLDERS.find((f) => f.id === selectedFolder)?.label} • {filteredEmails.length} messages
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
            {filteredEmails.length === 0 ? (
              <div className="py-20 text-center text-text-secondary text-sm">
                No emails in {selectedFolder}.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = email.id === selectedEmail?.id;
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
                        <span className="text-base">{email.avatar}</span>
                        <span className={`text-[13px] truncate ${email.unread ? "font-extrabold text-text-primary dark:text-text-darkPrimary" : "font-semibold text-text-secondary"}`}>
                          {email.sender}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleToggleStar(e, email.id)}
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
                        {email.tag}
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
          {selectedEmail ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 mb-5 border-b border-white/20 dark:border-white/8">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-darkPrimary mb-1.5">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                    <span className="text-lg">{selectedEmail.avatar}</span>
                    <span className="font-bold text-text-primary dark:text-text-darkPrimary">
                      {selectedEmail.sender}
                    </span>
                    <span>&lt;{selectedEmail.email}&gt;</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {selectedEmail.date}
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
                    onClick={() => handleMoveToArchive(selectedEmail.id)}
                    className="p-2 rounded-xl glass text-text-secondary hover:text-text-primary transition"
                    title="Archive email"
                  >
                    <Archive size={14} />
                  </button>

                  <button
                    onClick={() => handleMoveToTrash(selectedEmail.id)}
                    className="p-2 rounded-xl glass text-text-secondary hover:text-red-500 transition"
                    title="Move to Trash"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-[14px] leading-relaxed text-text-primary dark:text-text-darkPrimary whitespace-pre-line py-2">
                {selectedEmail.body}
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
          {selectedEmail && (
            <div className="p-4 border-t border-white/20 dark:border-white/8 bg-white/5 dark:bg-black/5 flex items-center gap-2">
              <button
                onClick={() => {
                  setComposeData({
                    to: selectedEmail.email,
                    subject: `Re: ${selectedEmail.subject}`,
                    body: `\n\n--- On ${selectedEmail.date}, ${selectedEmail.sender} wrote:\n> ${selectedEmail.body.replace(/\n/g, "\n> ")}`
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
                    subject: `Fwd: ${selectedEmail.subject}`,
                    body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender} <${selectedEmail.email}>\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
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
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-secondary transition active:scale-95"
                  >
                    <Send size={13} /> Send Email
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
