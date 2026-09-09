import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicNote } from "../services/notesService";
import { Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import TriageLogo from "../components/ui/TriageLogo";

function PublicNotePage() {
  const { token } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await getPublicNote(token);
        setNote(res.data);
      } catch (err) {
        console.error("Failed to fetch public note", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent dark:text-accent-dark mb-4" />
        <p className="text-text-secondary font-medium">Loading note...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-6">
          <FileText size={24} className="text-text-secondary opacity-50" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-darkPrimary mb-2">
          Note Not Found
        </h1>
        <p className="text-text-secondary mb-8 max-w-md">
          This link is invalid, or the owner has made the note private.
        </p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
        >
          Create your own notes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6">
      
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl flex justify-between items-center mb-12"
      >
        <div className="flex items-center gap-2.5 text-text-secondary dark:text-text-darkSecondary">
          <TriageLogo size={22} />
          <span className="font-bold tracking-tight text-sm uppercase">Shared via Triage</span>
        </div>
        
        <Link 
          to="/signup" 
          className="text-xs font-bold text-accent dark:text-accent-dark bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition"
        >
          Get Triage
        </Link>
      </motion.div>

      {/* The Note Content — Glassmorphic */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl glass glass-shimmer rounded-3xl p-10 md:p-16 shadow-xl relative"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary dark:text-text-darkPrimary mb-8 tracking-tight relative z-10">
          {note.title || "Untitled"}
        </h1>

        <div 
          className="prose prose-zinc dark:prose-invert max-w-none 
          prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto relative z-10"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </motion.div>
      
    </div>
  );
}

export default PublicNotePage;