import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Mail, Inbox, Send, Star, FileText, Trash2,
  Search, Plus, Reply, Forward, Archive, FileEdit,
  Clock, X, Check, ShieldAlert, Sparkles, Filter,
  Loader2, RefreshCw, AlertCircle, ChevronDown, UserPlus,
  Paperclip, Download, File, Image as ImageIcon, Zap,
  Flame, Briefcase, Bell, CheckCircle2, CornerDownLeft, Coffee
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote, generateAIContent } from "../services/notesService";
import { CacheService } from "../services/cacheService";
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

// Outside Primary Slider Tabs: AI High, Medium, Low, All, Starred, Sent
const PRIORITY_TABS = [
  { id: "high", label: "High Priority", icon: Flame, badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "medium", label: "Medium Priority", icon: Briefcase, badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { id: "low", label: "Low Priority", icon: Coffee, badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "inbox", label: "All Inbox", icon: Inbox, folder: "inbox" },
  { id: "starred", label: "Starred", icon: Star, folder: "starred" },
  { id: "sent", label: "Sent", icon: Send, folder: "sent" },
  { id: "archive", label: "Archive", icon: Archive, folder: "archive" },
];

// Helper to get company logos
const getSenderLogo = (senderEmail) => {
  if (!senderEmail || !senderEmail.includes("@")) return null;
  const domain = senderEmail.split("@")[1].toLowerCase().trim();
  let mainDomain = domain;
  if (domain.includes("reddit")) mainDomain = "reddit.com";
  else if (domain.includes("linkedin")) mainDomain = "linkedin.com";
  else if (domain.includes("axisbank") || domain.includes("axis.bank")) mainDomain = "axisbank.in";
  else if (domain.includes("google") || domain.includes("gmail")) mainDomain = "google.com";
  else if (domain.includes("github")) mainDomain = "github.com";
  else if (domain.includes("twitter") || domain.includes("x.com")) mainDomain = "twitter.com";
  else if (domain.includes("amazon")) mainDomain = "amazon.com";
  else if (domain.includes("soundcore") || domain.includes("anker")) mainDomain = "anker.com";

  return `https://www.google.com/s2/favicons?domain=${mainDomain}&sz=128`;
};

// Format attachment file sizes
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const FileIcon = ({ mimeType }) => {
  if (!mimeType) return <FileText size={15} />;
  if (mimeType.startsWith("image/")) return <ImageIcon size={15} />;
  if (mimeType.includes("pdf")) return <FileText size={15} className="text-red-500" />;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return <Archive size={15} />;
  return <File size={15} />;
};

// Clean raw snippet text
const cleanSnippetText = (str) => {
  if (!str) return "";
  try {
    const doc = new DOMParser().parseFromString(str, "text/html");
    const raw = doc.body.textContent || "";
    return raw
      .replace(/&#(x?[0-9a-fA-F]+);/g, "")
      .replace(/[\u8199\u65279\u0847\u200B\u200C\u200D\uFEFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (e) {
    return str.replace(/<[^>]*>/g, "").replace(/&#\d+;/g, "").trim();
  }
};

// Precise AI Priority Classification Engine: High, Medium, Low
const classifyEmail = (email) => {
  const from = (email.sender || email.email || "").toLowerCase();
  const subject = (email.subject || "").toLowerCase();
  const preview = (email.preview || email.body || "").toLowerCase();

  // 1. High Priority (Urgent, Action Required, Deadlines, Meeting, Starred, Personal Key Sender)
  if (
    email.starred ||
    subject.includes("urgent") ||
    subject.includes("asap") ||
    subject.includes("action required") ||
    subject.includes("deadline") ||
    subject.includes("interview") ||
    subject.includes("meeting") ||
    subject.includes("contract") ||
    subject.includes("invoice") ||
    subject.includes("payment") ||
    subject.includes("security alert") ||
    subject.includes("verify your") ||
    from.includes("manager") ||
    from.includes("client") ||
    from.includes("lead")
  ) {
    return {
      level: "high",
      badge: "⚡ High Priority",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/25",
      dot: "bg-amber-500",
      reason: "Actionable deadlines, critical update, or starred"
    };
  }

  // 2. Medium Priority (Work & Engineering, GitHub, Jira, AWS, Code Reviews, System Builds)
  if (
    from.includes("github") ||
    from.includes("gitlab") ||
    from.includes("slack") ||
    from.includes("jira") ||
    from.includes("linear") ||
    from.includes("google") ||
    from.includes("aws") ||
    from.includes("vercel") ||
    from.includes("mosh") ||
    subject.includes("build") ||
    subject.includes("sprint") ||
    subject.includes("roadmap") ||
    subject.includes("release") ||
    subject.includes("commit") ||
    subject.includes("pull request") ||
    subject.includes("deploy")
  ) {
    return {
      level: "medium",
      badge: "📌 Medium Priority",
      color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
      dot: "bg-sky-400",
      reason: "Work notifications, tool alerts, and team updates"
    };
  }

  // 3. Low Priority (Newsletters, Promos, Reddit, Social Digests, Marketing)
  return {
    level: "low",
    badge: "☕ Low Priority",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    dot: "bg-purple-400",
    reason: "Newsletters, community digests, and promotions"
  };
};

function SenderAvatar({ email, sender, size = "w-7 h-7" }) {
  const logoUrl = getSenderLogo(email);
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={sender}
        onError={() => setImgError(true)}
        className={`${size} rounded-lg object-contain bg-white/90 p-0.5 shadow-xs border border-white/20 shrink-0`}
      />
    );
  }

  const initial = sender ? sender.charAt(0).toUpperCase() : "?";
  return (
    <span className={`${size} rounded-lg bg-accent/15 text-accent dark:text-accent-dark flex items-center justify-center text-[11px] font-extrabold shrink-0 border border-accent/20`}>
      {initial}
    </span>
  );
}

// Seamless Dark Theme Email Content Renderer
function EmailBodyViewer({ content }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current || !content) return;
    try {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      doc.open();
      const styledHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 13.5px;
                line-height: 1.65;
                color: #D8CDC5;
                background-color: transparent !important;
                margin: 0;
                padding: 16px;
                word-break: break-word;
              }
              p, div, span, td, th {
                color: inherit !important;
                background-color: transparent !important;
              }
              img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 8px;
              }
              img[src=""], img:not([src]) {
                display: none !important;
              }
              a {
                color: #FFA278 !important;
                text-decoration: none;
                font-weight: 600;
              }
              a:hover {
                text-decoration: underline;
              }
              table {
                max-width: 100% !important;
                border-collapse: collapse;
              }
              blockquote {
                border-left: 3px solid rgba(255, 162, 120, 0.4);
                margin: 8px 0;
                padding-left: 12px;
                color: #8F7C6E !important;
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `;
      doc.write(styledHtml);
      doc.close();

      const adjustHeight = () => {
        if (iframeRef.current && doc.body) {
          iframeRef.current.style.height = `${Math.max(340, doc.body.scrollHeight + 30)}px`;
        }
      };

      setTimeout(adjustHeight, 150);
      setTimeout(adjustHeight, 500);

      const imgs = doc.querySelectorAll("img");
      imgs.forEach((img) => img.addEventListener("load", adjustHeight));
    } catch (e) {
      console.warn("Iframe write error:", e);
    }
  }, [content]);

  const isHtml = /<[a-z][\s\S]*>/i.test(content || "");

  if (!isHtml) {
    return (
      <div className="text-[13.5px] leading-relaxed text-text-primary dark:text-text-darkPrimary whitespace-pre-line py-2 px-1">
        {cleanSnippetText(content)}
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title="Email Content"
      className="w-full border-0 min-h-[340px] rounded-2xl bg-white/5 dark:bg-black/20 backdrop-blur-sm transition-all"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}

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
  const [activeTab, setActiveTab] = useState("high");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmailDetails, setSelectedEmailDetails] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Compose State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [convertingNote, setConvertingNote] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState("");

  const searchTimeoutRef = useRef(null);
  const [linkedAccounts, setLinkedAccounts] = useState(() => CacheService.getLinkedEmailAccounts());
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // 1. Initial Status Check
  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    const pictureParam = searchParams.get("picture");
    const nameParam = searchParams.get("name");
    const emailParam = searchParams.get("email");

    if (connectedParam === "true" && emailParam) {
      try {
        const stored = localStorage.getItem("user");
        const userObj = stored ? JSON.parse(stored) : {};
        if (pictureParam) userObj.profilePicture = pictureParam;
        if (nameParam) userObj.name = nameParam;
        userObj.email = emailParam;
        localStorage.setItem("user", JSON.stringify(userObj));

        const existing = CacheService.getLinkedEmailAccounts();
        if (!existing.some((acc) => acc.email === emailParam)) {
          const updatedAccs = [...existing, { email: emailParam, name: nameParam || emailParam, picture: pictureParam }];
          setLinkedAccounts(updatedAccs);
          CacheService.saveLinkedEmailAccounts(updatedAccs);
        }

        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      toast.success(`Connected account ${emailParam} successfully!`);
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
        const email = res.data.email || "";
        setConnectedEmail(email);

        if (email) {
          const existing = CacheService.getLinkedEmailAccounts();
          if (!existing.some((acc) => acc.email === email)) {
            const updatedAccs = [...existing, { email, name: email }];
            setLinkedAccounts(updatedAccs);
            CacheService.saveLinkedEmailAccounts(updatedAccs);
          }
        }

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

  // 2. Fetch Messages
  const loadEmails = async (folder = "inbox", q = "", isManualSync = false) => {
    const targetFolder = ["sent", "trash", "starred", "archive"].includes(folder) ? folder : "inbox";

    if (!q && !isManualSync) {
      const cached = CacheService.getCachedEmails(connectedEmail, targetFolder);
      if (cached && cached.length > 0) {
        setEmails(cached);
        if (targetFolder === "inbox") {
          setUnreadCount(cached.filter((m) => m.unread).length);
        }
        if (!selectedEmailId && cached[0]) {
          setSelectedEmailId(cached[0].id);
          loadEmailDetails(cached[0].id);
        }
      }
    }

    setLoadingMessages(true);
    try {
      const res = await getGmailMessages(targetFolder, q);
      const fetched = res.data?.messages || [];
      setEmails(fetched);

      if (!q) {
        CacheService.setCachedEmails(connectedEmail, targetFolder, fetched);
      }

      if (targetFolder === "inbox") {
        setUnreadCount(fetched.filter((m) => m.unread).length);
      }

      if (fetched.length > 0 && !selectedEmailId) {
        const firstId = fetched[0].id;
        setSelectedEmailId(firstId);
        loadEmailDetails(firstId);
      }

      if (isManualSync) {
        toast.success("Synced latest emails!");
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (err.response?.status === 428) {
        setGmailConnected(false);
      } else if (isManualSync) {
        toast.error("Failed to sync emails from Gmail");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Switch Account
  const handleSwitchAccount = (accountEmail) => {
    setShowAccountDropdown(false);
    setConnectedEmail(accountEmail);
    const cached = CacheService.getCachedEmails(accountEmail, "inbox");
    if (cached) {
      setEmails(cached);
    }
    loadEmails("inbox", searchQuery, true);
    toast.success(`Switched account to ${accountEmail}`);
  };

  // 3. Load full email body
  const loadEmailDetails = async (id) => {
    if (!id) return;
    setLoadingBody(true);
    setAiSummary(null);
    try {
      const res = await getGmailMessageById(id);
      setSelectedEmailDetails(res.data);
      setEmails((prev) =>
        prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to load email details:", err);
    } finally {
      setLoadingBody(false);
    }
  };

  // Tab switching with sliding control
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setAiSummary(null);
    const tabObj = PRIORITY_TABS.find((t) => t.id === tabId);
    if (tabObj?.folder) {
      loadEmails(tabObj.folder, searchQuery);
    } else {
      loadEmails("inbox", searchQuery);
    }
  };

  // Search input debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (gmailConnected) {
        const tabObj = PRIORITY_TABS.find((t) => t.id === activeTab);
        loadEmails(tabObj?.folder || "inbox", query);
      }
    }, 450);
  };

  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);
    loadEmailDetails(email.id);
  };

  // Star Toggle
  const handleToggleStar = async (e, email) => {
    e.stopPropagation();
    const newStar = !email.starred;

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
      toast.error("Failed to update star");
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id ? { ...item, starred: !newStar } : item
        )
      );
    }
  };

  // Trash Email
  const handleMoveToTrash = async (emailId) => {
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
      loadEmails(activeTab, searchQuery);
    }
  };

  // Archive Email
  const handleMoveToArchive = async (emailId) => {
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
      loadEmails(activeTab, searchQuery);
    }
  };

  // Turn into Note
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

      toast.success("Note created in workspace!");
      if (res.data && res.data.id) {
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      toast.error("Failed to convert email to note");
    } finally {
      setConvertingNote(false);
    }
  };

  // Spark AI Summary of Active Email
  const handleGenerateAiSummary = async () => {
    const activeEmail = selectedEmailDetails || emails.find((e) => e.id === selectedEmailId);
    if (!activeEmail) return;

    setGeneratingAi(true);
    try {
      const contentToSummarize = `Subject: ${activeEmail.subject}\nFrom: ${activeEmail.sender}\nBody: ${cleanSnippetText(activeEmail.body || activeEmail.preview)}`;
      
      let summaryText = "";
      try {
        const res = await generateAIContent("Summarize", contentToSummarize);
        summaryText = res.data?.result || res.data?.output;
      } catch {
        const cls = classifyEmail(activeEmail);
        summaryText = `📌 **Spark AI Summary (${cls.badge}):**\n• **Subject:** ${activeEmail.subject}\n• **Sender:** ${activeEmail.sender}\n• **Priority Reason:** ${cls.reason}\n• **Action Required:** Review attachment or reply if deadline applies.`;
      }
      setAiSummary(summaryText);
      toast.success("Spark AI summary generated");
    } catch {
      toast.error("Could not generate summary");
    } finally {
      setGeneratingAi(false);
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

      if (activeTab === "sent") {
        loadEmails("sent", searchQuery);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Send Inline Quick Reply
  const handleSendInlineReply = async (e) => {
    e.preventDefault();
    const activeEmail = selectedEmailDetails || emails.find((e) => e.id === selectedEmailId);
    if (!activeEmail || !inlineReplyText.trim()) return;

    const toastId = toast.loading("Sending quick reply...");
    try {
      await sendGmailMessage({
        to: activeEmail.email,
        subject: activeEmail.subject.startsWith("Re:") ? activeEmail.subject : `Re: ${activeEmail.subject}`,
        body: inlineReplyText,
      });
      toast.success("Reply sent!", { id: toastId });
      setInlineReplyText("");
    } catch (err) {
      toast.error("Failed to send reply", { id: toastId });
    }
  };

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const res = await getGoogleAuthUrl();
      const authUrl = res.data?.url || res.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast.error("Could not generate Google authorization link.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Google OAuth client is not configured.");
    } finally {
      setConnecting(false);
    }
  };

  // Download Attachment
  const handleDownloadAttachment = async (att) => {
    if (!selectedEmailDetails || !att) return;
    const toastId = toast.loading(`Downloading ${att.filename}...`);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8080/api/gmail/messages/${selectedEmailDetails.id}/attachments/${att.attachmentId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
          withCredentials: true,
        }
      );
      const blob = new Blob([res.data], { type: att.mimeType || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", att.filename || "attachment");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${att.filename}`, { id: toastId });
    } catch (e) {
      toast.error("Failed to download attachment", { id: toastId });
    }
  };

  // Filter emails based on AI Priority Level (High, Medium, Low) or Folder
  const filteredEmails = useMemo(() => {
    let list = emails;

    if (onlyUnread) {
      list = list.filter((m) => m.unread);
    }

    if (activeTab === "high") {
      return list.filter((m) => classifyEmail(m).level === "high");
    }

    if (activeTab === "medium") {
      return list.filter((m) => classifyEmail(m).level === "medium");
    }

    if (activeTab === "low") {
      return list.filter((m) => classifyEmail(m).level === "low");
    }

    return list;
  }, [emails, activeTab, onlyUnread]);

  // Compute counts for the tabs
  const tabCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    emails.forEach((m) => {
      const cls = classifyEmail(m);
      if (cls.level === "high") high++;
      else if (cls.level === "medium") medium++;
      else if (cls.level === "low") low++;
    });
    return { high, medium, low, inbox: unreadCount || emails.length };
  }, [emails, unreadCount]);

  // Ensure an active email is selected whenever the filtered list updates
  useEffect(() => {
    if (filteredEmails.length > 0) {
      const exists = filteredEmails.some((e) => e.id === selectedEmailId);
      if (!exists) {
        setSelectedEmailId(filteredEmails[0].id);
        loadEmailDetails(filteredEmails[0].id);
      }
    }
  }, [filteredEmails, selectedEmailId]);

  const activeEmail = selectedEmailDetails || emails.find((e) => e.id === selectedEmailId);
  const activeClassification = activeEmail ? classifyEmail(activeEmail) : null;

  return (
    <div className="space-y-3.5 pb-12">
      
      {/* ═══ 1. TOP HEADER: BRAND, CONNECTED ACCOUNT & ACTIONS ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent/15 text-accent dark:text-accent-dark flex items-center justify-center font-bold shadow-sm">
              <Mail size={18} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary leading-tight">
                Triage Mail
              </h1>
              <p className="text-[11.5px] text-text-secondary">
                Intelligent email prioritization & 1-click workspace sync
              </p>
            </div>
          </div>

          {/* Connected Account Dropdown */}
          {gmailConnected && (
            <div className="relative ml-1">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl glass-subtle border border-white/30 dark:border-white/10 hover:bg-white/50 text-[11px] font-bold text-text-primary dark:text-text-darkPrimary transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{connectedEmail}</span>
                <ChevronDown size={11} className="text-text-secondary" />
              </button>

              {showAccountDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-60 glass-strong rounded-2xl shadow-2xl z-50 p-1.5 border border-white/30 dark:border-white/15">
                  {linkedAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleSwitchAccount(acc.email)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/10 transition"
                    >
                      <span className="truncate">{acc.email}</span>
                      {acc.email === connectedEmail && <Check size={13} className="text-accent" />}
                    </button>
                  ))}
                  <div className="h-px bg-white/20 dark:bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      handleConnectGmail();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-accent hover:bg-accent/10 flex items-center gap-1.5 transition"
                  >
                    <UserPlus size={13} /> Add Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Right Controls: Search, Sync, Compose, Profile */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative w-44 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search mail..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-8 pl-7 pr-2.5 rounded-xl glass-subtle text-[12px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none border border-white/25 dark:border-white/10 focus:border-accent/50 transition"
            />
          </div>

          {gmailConnected && (
            <button
              onClick={() => loadEmails(activeTab, searchQuery, true)}
              disabled={loadingMessages}
              title="Sync latest emails"
              className="p-2 rounded-xl glass-subtle hover:bg-white/40 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition"
            >
              <RefreshCw size={14} className={loadingMessages ? "animate-spin text-accent" : ""} />
            </button>
          )}

          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white text-[12px] font-bold shadow-md shadow-accent/20 hover:opacity-95 active:scale-95 transition"
          >
            <Plus size={14} /> <span>Compose</span>
          </button>

          <ProfileMenu />
        </div>
      </div>

      {/* ═══ 2. STANDALONE FLOATING SLIDER BAR (OUTSIDE THE MAIN DIV) ═══ */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar py-0.5">
        <div className="glass-pill rounded-2xl p-1 flex items-center gap-1 border border-white/35 dark:border-white/10 shadow-md relative">
          {PRIORITY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Extract count
            let badge = null;
            if (tab.id === "high") badge = tabCounts.high;
            else if (tab.id === "medium") badge = tabCounts.medium;
            else if (tab.id === "low") badge = tabCounts.low;
            else if (tab.id === "inbox") badge = tabCounts.inbox;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap z-10 ${
                  isActive
                    ? "text-text-primary dark:text-text-darkPrimary"
                    : "text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary"
                }`}
              >
                {/* Smooth Animated Sliding Pill */}
                {isActive && (
                  <motion.div
                    layoutId="outside-email-slider"
                    className="absolute inset-0 bg-white/70 dark:bg-white/15 rounded-xl shadow-xs border border-white/40 dark:border-white/15 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}

                <Icon size={13} className={isActive && tab.id === "starred" ? "text-yellow-500 fill-yellow-500" : ""} />
                <span>{tab.label}</span>
                {badge !== null && badge > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-accent text-white shadow-xs" : "bg-white/20 dark:bg-white/10 text-text-secondary"
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Unread Toggle */}
        <button
          onClick={() => setOnlyUnread(!onlyUnread)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition shrink-0 ${
            onlyUnread
              ? "bg-accent/15 text-accent dark:text-accent-dark border-accent/30 shadow-xs"
              : "glass-subtle border-white/25 text-text-secondary hover:text-text-primary"
          }`}
        >
          {onlyUnread ? "• Unread Only" : "Show All"}
        </button>
      </div>

      {/* ═══ 3. MASTER UNIFIED WORKSTATION SURFACE ═══ */}
      <div className="glass-strong rounded-3xl border border-white/35 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[78vh] min-h-[580px]">
        
        {loadingStatus ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <Loader2 size={30} className="animate-spin text-accent mb-2" />
            <p className="text-xs font-semibold text-text-secondary">Checking Google Workspace connection...</p>
          </div>
        ) : !gmailConnected ? (
          /* On-Demand Connection Hero */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/5 dark:bg-black/10">
            <div className="w-16 h-16 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mb-4 border border-accent/25 shadow-xl">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-text-primary dark:text-text-darkPrimary mb-1.5">
              Connect Gmail to Triage
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
              Seamlessly read, classify, and prioritize your live emails into High, Medium, and Low streams. Convert actionable threads into notes with 1-click.
            </p>
            <button
              onClick={handleConnectGmail}
              disabled={connecting}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/25 hover:opacity-90 transition flex items-center gap-2"
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              <span>Connect Google Workspace</span>
            </button>
          </div>
        ) : (
          <>
            {/* ═══ LEFT PANE: EMAIL THREAD STREAM ═══ */}
            <div className="w-full md:w-[380px] lg:w-[410px] flex-shrink-0 border-b md:border-b-0 md:border-r border-white/20 dark:border-white/8 flex flex-col overflow-hidden bg-white/10 dark:bg-black/10">
              
              {/* List Header */}
              <div className="px-3.5 py-2.5 border-b border-white/15 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-text-secondary">
                <span className="uppercase tracking-wider">
                  {filteredEmails.length} {activeTab.toUpperCase()} MESSAGES
                </span>
                {loadingMessages && <Loader2 size={13} className="animate-spin text-accent" />}
              </div>

              {/* Email Rows */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loadingMessages ? (
                  <div className="py-20 flex flex-col items-center justify-center text-text-secondary">
                    <Loader2 size={22} className="animate-spin text-accent mb-2" />
                    <span className="text-xs">Fetching messages from Gmail...</span>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="py-20 text-center text-text-secondary text-xs">
                    No emails found in this category.
                  </div>
                ) : (
                  filteredEmails.map((email) => {
                    const isSelected = email.id === selectedEmailId;
                    const classification = classifyEmail(email);

                    return (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-150 relative text-left border ${
                          isSelected
                            ? "bg-white/60 dark:bg-white/15 border-accent/40 shadow-xs"
                            : "border-transparent hover:bg-white/30 dark:hover:bg-white/5"
                        }`}
                      >
                        {/* Sender & Time */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 truncate">
                            <SenderAvatar email={email.email} sender={email.sender} size="w-6 h-6" />
                            <span className={`text-[12.5px] truncate ${
                              email.unread ? "font-extrabold text-text-primary dark:text-text-darkPrimary" : "font-semibold text-text-secondary"
                            }`}>
                              {email.sender}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => handleToggleStar(e, email)}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star
                                size={12}
                                className={email.starred ? "text-yellow-500 fill-yellow-500" : "text-text-secondary/40"}
                              />
                            </button>
                            <span className="text-[10px] text-text-secondary/70">
                              {email.date}
                            </span>
                          </div>
                        </div>

                        {/* Subject */}
                        <p className={`text-[12px] truncate ${
                          email.unread ? "font-bold text-text-primary dark:text-text-darkPrimary" : "font-medium text-text-primary/90 dark:text-text-darkPrimary/90"
                        }`}>
                          {email.subject}
                        </p>

                        {/* Snippet */}
                        <p className="text-[11px] text-text-secondary/70 line-clamp-1 mt-0.5">
                          {cleanSnippetText(email.preview)}
                        </p>

                        {/* Priority Pill */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${classification.color}`}>
                            {classification.badge}
                          </span>
                          {email.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-accent-dark animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* ═══ RIGHT PANE: READING & ACTION WORKSPACE ═══ */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white/5 dark:bg-black/5">
              {loadingBody ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                  <Loader2 size={24} className="animate-spin text-accent mb-2" />
                  <span className="text-xs">Loading email content...</span>
                </div>
              ) : activeEmail ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  
                  {/* Header Details */}
                  <div className="pb-4 border-b border-white/20 dark:border-white/8 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        {activeClassification && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeClassification.color}`}>
                              {activeClassification.badge}
                            </span>
                            <span className="text-[11px] text-text-secondary">
                              • {activeClassification.reason}
                            </span>
                          </div>
                        )}
                        <h2 className="text-lg font-bold tracking-tight text-text-primary dark:text-text-darkPrimary leading-snug">
                          {activeEmail.subject}
                        </h2>
                      </div>

                      {/* Top Actions: Spark AI, Turn into Note, Archive, Trash */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleGenerateAiSummary}
                          disabled={generatingAi}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-accent to-orange-400 text-white text-[11px] font-bold shadow-md shadow-accent/20 hover:opacity-90 transition disabled:opacity-50"
                          title="Generate instant AI bullet summary"
                        >
                          <Sparkles size={13} />
                          <span>{generatingAi ? "Summarizing..." : "Spark Summary"}</span>
                        </button>

                        <button
                          onClick={handleTurnIntoNote}
                          disabled={convertingNote}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle border border-white/30 dark:border-white/10 text-[11px] font-bold text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 transition"
                          title="Turn this email into a workspace note"
                        >
                          <FileText size={13} className="text-accent" />
                          <span>{convertingNote ? "Saving..." : "Turn into Note"}</span>
                        </button>

                        <button
                          onClick={() => handleMoveToArchive(activeEmail.id)}
                          className="p-1.5 rounded-xl glass-subtle hover:bg-white/30 text-text-secondary hover:text-text-primary transition"
                          title="Archive"
                        >
                          <Archive size={14} />
                        </button>

                        <button
                          onClick={() => handleMoveToTrash(activeEmail.id)}
                          className="p-1.5 rounded-xl glass-subtle hover:bg-red-500/20 text-text-secondary hover:text-red-500 transition"
                          title="Move to Trash"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Sender Meta */}
                    <div className="flex items-center gap-2.5 text-[12px] text-text-secondary flex-wrap">
                      <SenderAvatar email={activeEmail.email} sender={activeEmail.sender} size="w-7 h-7" />
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

                  {/* Spark AI Summary Card if generated */}
                  {aiSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl glass border border-accent/30 shadow-md space-y-1 text-[12.5px] leading-relaxed text-text-primary dark:text-text-darkPrimary"
                    >
                      <div className="flex items-center justify-between mb-1 text-[11px] font-extrabold text-accent">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} /> Spark AI Executive Digest
                        </span>
                        <button onClick={() => setAiSummary(null)} className="text-text-secondary hover:text-text-primary">
                          <X size={12} />
                        </button>
                      </div>
                      {aiSummary.split("\n").map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </motion.div>
                  )}

                  {/* Attachments */}
                  {activeEmail.attachments && activeEmail.attachments.length > 0 && (
                    <div className="p-3.5 rounded-2xl glass-subtle border border-white/25 dark:border-white/10">
                      <p className="text-[11px] font-bold text-text-primary dark:text-text-darkPrimary mb-2 flex items-center gap-1.5">
                        <Paperclip size={13} className="text-accent" />
                        <span>{activeEmail.attachments.length} Attachment(s)</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeEmail.attachments.map((att, idx) => (
                          <div
                            key={att.attachmentId || idx}
                            className="p-2.5 rounded-xl glass border border-white/20 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <FileIcon mimeType={att.mimeType} />
                              <div className="truncate text-[11px]">
                                <p className="font-bold truncate text-text-primary dark:text-text-darkPrimary">{att.filename}</p>
                                <p className="text-text-secondary">{formatFileSize(att.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadAttachment(att)}
                              className="p-1 rounded-lg hover:bg-white/30 text-text-secondary hover:text-accent transition"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Email Body Content */}
                  <EmailBodyViewer content={activeEmail.body || activeEmail.preview} />

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 text-text-secondary">
                  <Mail size={36} className="opacity-30 mb-2" />
                  <p className="text-sm font-bold text-text-primary dark:text-text-darkPrimary">
                    Select an email to view
                  </p>
                  <p className="text-xs mt-0.5">
                    Choose any message from the left priority stream.
                  </p>
                </div>
              )}

              {/* Quick Inline Reply Bar at Bottom */}
              {activeEmail && (
                <form
                  onSubmit={handleSendInlineReply}
                  className="p-3 border-t border-white/20 dark:border-white/8 bg-white/10 dark:bg-black/10 flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 p-1.5 rounded-2xl glass-subtle border border-white/30 dark:border-white/10 focus-within:border-accent/50 transition">
                    <input
                      type="text"
                      value={inlineReplyText}
                      onChange={(e) => setInlineReplyText(e.target.value)}
                      placeholder={`Quick reply to ${activeEmail.sender}...`}
                      className="flex-1 bg-transparent px-3 py-1 text-[12.5px] text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!inlineReplyText.trim()}
                      className="px-3 py-1.5 rounded-xl bg-accent text-white font-bold text-[11px] hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1 shadow-xs"
                    >
                      <Send size={12} /> Reply
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setComposeData({
                        to: activeEmail.email,
                        subject: activeEmail.subject.startsWith("Re:") ? activeEmail.subject : `Re: ${activeEmail.subject}`,
                        body: `\n\n--- On ${activeEmail.date}, ${activeEmail.sender} wrote:\n> ${(activeEmail.body || activeEmail.preview || "").replace(/\n/g, "\n> ")}`
                      });
                      setShowComposeModal(true);
                    }}
                    className="px-3 py-2 rounded-2xl glass-subtle border border-white/25 hover:bg-white/40 text-[11px] font-bold text-text-secondary hover:text-text-primary transition shrink-0"
                  >
                    Expand
                  </button>
                </form>
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
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-strong p-6 rounded-3xl shadow-2xl w-full max-w-lg border border-white/40 dark:border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                    <Send size={14} />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary dark:text-text-darkPrimary">
                    New Message
                  </h3>
                </div>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-1 rounded-lg hover:bg-white/30 text-text-secondary hover:text-text-primary transition"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3">
                <input
                  type="email"
                  placeholder="To: recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-xl glass-subtle text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none border border-white/25 focus:border-accent"
                />

                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-xl glass-subtle text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none border border-white/25 focus:border-accent"
                />

                <textarea
                  placeholder="Write your email..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  rows={8}
                  className="w-full p-3 rounded-xl glass-subtle text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/60 outline-none border border-white/25 focus:border-accent resize-none custom-scrollbar"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 rounded-xl glass text-xs font-bold text-text-secondary hover:text-text-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{sendingEmail ? "Sending..." : "Send Email"}</span>
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
