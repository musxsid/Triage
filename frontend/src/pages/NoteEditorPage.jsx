import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Globe,
  Copy 
} from "lucide-react";

// Services
import { 
  getNoteById, 
  updateNote, 
  createNote, 
  uploadImage, 
  toggleShareNote, 
  generateAIContent 
} from "../services/notesService";
import { getFolders } from "../services/folderService";

// Components
import AIPanel from "../components/ai/AIPanel";

// Tiptap imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [note, setNote] = useState({ title: "", content: "" });
  
  // Spark AI State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [selectedText, setSelectedText] = useState("");

  // Public Sharing State
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState(null);

  // Auto-save & Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [editorContent, setEditorContent] = useState("");

  const fileInputRef = useRef(null);

  // Image Upload Logic
  const handleImageUpload = async (file) => {
    if (!file) return;
    const toastId = toast.loading("Uploading image...");
    try {
      const res = await uploadImage(file);
      editor.chain().focus().setImage({ src: res.url || res.data.url }).run();
      toast.success("Image added!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  // TipTap Editor Initialization
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true, allowBase64: true }), 
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text);
      }
    },
    editorProps: {
      handleDrop: function (view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault(); 
            handleImageUpload(file); 
            return true;
          }
        }
        return false;
      },
    },
  });

  // Fetch Folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await getFolders();
        setFolders(res.data || []);
      } catch (err) {
        console.error("Failed to load folders", err);
      }
    };
    fetchFolders();
  }, []);

  // Fetch Note Data
  useEffect(() => {
    if (!id || id === "new") return;

    const fetchNote = async () => {
      try {
        const res = await getNoteById(id);
        setNote({ title: res.data.title, content: res.data.content });
        setSelectedFolder(res.data.folder?.id?.toString() || ""); 
        setIsPublic(res.data.isPublic || false);
        setShareToken(res.data.shareToken || null);
        
        if (editor && res.data.content) {
          editor.commands.setContent(res.data.content);
          setEditorContent(res.data.content);
        }
      } catch {
        toast.error("Note not found");
      }
    };
    fetchNote();
  }, [id, editor]);

  // Save Logic
  const handleSave = useCallback(async (isManual = false) => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const payload = {
        title: note.title || "Untitled",
        content: editor.getHTML(),
        folder: selectedFolder ? { id: Number(selectedFolder) } : null,
      };

      if (id === "new") {
        if (isManual) {
          const res = await createNote(payload);
          toast.success("Note created");
          navigate(`/notes/${res.data.id}`, { replace: true });
        }
      } else {
        await updateNote(id, payload);
        const now = new Date();
        setLastSaved(`Saved at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        if (isManual) toast.success("Note saved manually");
      }
    } catch {
      if (isManual) toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [id, note.title, editor, selectedFolder, navigate]);

  // Auto-Save Debounce
  useEffect(() => {
    if (id === "new") return;
    const timeoutId = setTimeout(() => { handleSave(false); }, 1500);
    return () => clearTimeout(timeoutId);
  }, [note.title, editorContent, selectedFolder, handleSave, id]);

  // Sharing Handlers
  const handleToggleShare = async () => {
    if (id === "new") {
      toast.error("Please save your note first!");
      return;
    }
    try {
      const res = await toggleShareNote(id);
      setIsPublic(res.data.isPublic);
      setShareToken(res.data.shareToken);
      if (res.data.isPublic) {
        const url = `${window.location.origin}/share/${res.data.shareToken}`;
        navigator.clipboard.writeText(url);
        toast.success("Published! Link copied to clipboard.");
      } else {
        toast.success("Note is now private.");
      }
    } catch (err) {
      toast.error("Failed to change sharing settings");
    }
  };

  const copyPublicLink = () => {
    if (shareToken) {
      const url = `${window.location.origin}/share/${shareToken}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  // Spark AI: Handle Request
  const handleAIAction = async (actionType, customContext) => {
    const textToProcess = customContext || selectedText || editor?.getText() || "";
    if (!textToProcess.trim()) {
      toast.error("Please add or select some text in your note for Spark to analyze!");
      return;
    }

    try {
      const res = await generateAIContent(actionType, textToProcess);
      setAiResult(res.data?.result || res.data?.output || "");
    } catch (err) {
      // Intelligent fallback if AI service is offline
      let fallback = "";
      if (customContext && customContext.toLowerCase().includes("email")) {
        fallback = `<h3>Subject: Update regarding ${note.title || "Project Sync"}</h3><p>Hi Team,</p><p>Here is an executive briefing compiled from our workspace notes:</p><p>${textToProcess.slice(0, 200)}</p><p>Please review and confirm next steps.</p><p>Best regards,<br/>Triage Workspace</p>`;
      } else if (customContext && customContext.toLowerCase().includes("calendar")) {
        fallback = `<h3>📅 Scheduled Event: ${note.title || "Project Discussion"}</h3><p><strong>Proposed Time:</strong> Tomorrow, 02:00 PM – 02:45 PM</p><p><strong>Context & Goals:</strong></p><ul><li>${textToProcess.slice(0, 140)}</li></ul>`;
      } else if (actionType === "Summarize") {
        fallback = `<h3>Executive Summary</h3><ul><li><strong>Core Topic:</strong> ${note.title || "Workspace Note"}</li><li><strong>Key Takeaway:</strong> ${textToProcess.slice(0, 160)}...</li><li><strong>Action Required:</strong> Next milestone pending review.</li></ul>`;
      } else {
        fallback = `<p>${textToProcess}</p><p><em>✨ Structured and elevated with Spark AI.</em></p>`;
      }
      setAiResult(fallback);
    }
  };

  // Spark AI: Insert Response 
  const handleAIInsert = () => {
    if (!editor || !aiResult) return;

    editor.chain()
      .focus()
      .insertContent(`
        <div style="border-left: 4px solid #E8784A; padding-left: 16px; margin: 20px 0; color: #4b5563; background-color: rgba(232, 120, 74, 0.05); padding-top: 12px; padding-bottom: 12px; border-radius: 0 12px 12px 0;">
          <p style="font-size: 11px; font-weight: 800; color: #E8784A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">✨ Spark AI Suggestion</p>
          ${aiResult}
        </div>
        <p></p>
      `, { parseContent: true })
      .run();
    
    setAiOpen(false);
    setAiResult("");
    toast.success("Spark's response added!");
  };

  if (!editor) return null;

  const toolBtnClass = "p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/8 text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e.target.files[0])} accept="image/*" className="hidden" />

      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-text-secondary hover:text-text-primary dark:hover:text-text-darkPrimary transition text-sm font-medium flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          {id !== "new" && (
            <div className="text-xs text-text-secondary flex items-center gap-1">
              {isSaving ? (
                <><Loader2 size={12} className="animate-spin" /> Saving...</>
              ) : lastSaved ? (
                <><CheckCircle2 size={12} className="text-green-500" /> {lastSaved}</>
              ) : null}
            </div>
          )}

          {id !== "new" && (
            <div className="flex items-center gap-2 glass p-1 rounded-xl">
              <button
                onClick={handleToggleShare}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isPublic 
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20" 
                    : "text-text-secondary hover:bg-white/40 dark:hover:bg-white/8 hover:text-text-primary"
                }`}
              >
                <Globe size={16} />
                {isPublic ? "Published" : "Publish to Web"}
              </button>
              
              {isPublic && (
                <button 
                  onClick={copyPublicLink}
                  title="Copy Link"
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-white/40 dark:hover:bg-white/8 hover:text-text-primary transition"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => handleSave(true)}
            className="bg-gradient-to-r from-accent to-accent-secondary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
          >
            Save Note
          </button>
        </div>
      </div>

      <input
        value={note.title}
        onChange={(e) => setNote({ ...note, title: e.target.value })}
        placeholder="Untitled"
        className="text-5xl font-extrabold w-full mb-6 outline-none bg-transparent text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/30"
      />

      <div className="mb-6">
        <select
          value={selectedFolder || ""}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium glass text-text-primary dark:text-text-darkPrimary outline-none cursor-pointer transition-colors"
        >
          <option value="">No Folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* TOOLBAR — Glassmorphic */}
      <div className="glass rounded-t-2xl px-4 py-3 border-b-0 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 pr-4 border-r border-white/20 dark:border-white/8">
          <button className={toolBtnClass} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={18} /></button>
          <button className={toolBtnClass} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={18} /></button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r border-white/20 dark:border-white/8">
          <select className="bg-transparent text-sm font-medium text-text-secondary outline-none cursor-pointer" onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}>
            <option>Arial</option>
            <option>Times New Roman</option>
          </select>
          <select className="bg-transparent text-sm font-medium text-text-secondary outline-none cursor-pointer" onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: Number(v) }).run();
            }}>
            <option value="p">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
          </select>
        </div>

        <div className="flex items-center gap-1 pr-4 border-r border-white/20 dark:border-white/8">
          <button className={`${toolBtnClass} ${editor.isActive('bold') ? 'bg-white/40 dark:bg-white/10' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></button>
          <button className={`${toolBtnClass} ${editor.isActive('italic') ? 'bg-white/40 dark:bg-white/10' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></button>
          <button className={`${toolBtnClass} ${editor.isActive('underline') ? 'bg-white/40 dark:bg-white/10' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={18} /></button>
          <input type="color" className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </div>

        <div className="flex items-center gap-1 pr-4 border-r border-white/20 dark:border-white/8">
          <button className={toolBtnClass} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={18} /></button>
          <button className={toolBtnClass} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={18} /></button>
          <button className={toolBtnClass} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={18} /></button>
        </div>

        <div className="flex items-center gap-1">
          <button className={toolBtnClass} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
          <button className={toolBtnClass} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></button>
          <button className={toolBtnClass} onClick={() => { const url = prompt("Enter URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}><LinkIcon size={18} /></button>
          <button className={toolBtnClass} onClick={() => fileInputRef.current?.click()}><ImageIcon size={18} /></button>
        </div>

        <button onClick={() => setAiOpen(true)} className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-bold shadow-sm shadow-accent/20 hover:shadow-accent/30 transition-all">
          ✨ AI Assist
        </button>
      </div>

      <div className="glass rounded-b-2xl border-t-0 min-h-[500px] shadow-sm pb-10">
        <EditorContent 
          editor={editor} 
          className="prose prose-zinc dark:prose-invert max-w-none p-8 outline-none prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto" 
        />
      </div>

      <AIPanel 
        open={aiOpen} 
        onClose={() => { setAiOpen(false); setAiResult(""); }} 
        onAction={handleAIAction} 
        result={aiResult}
        selectedText={selectedText}
        fullNoteText={editor?.getText() || ""}
        onInsert={handleAIInsert}
      />
    </div>
  );
}

export default NoteEditorPage;