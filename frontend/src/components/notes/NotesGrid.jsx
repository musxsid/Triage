import { motion } from "framer-motion";
import NoteRow from "./NoteRow";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const NotesGrid = ({ notes, onDelete, onEdit, searchTerm }) => {
  // EMPTY STATE
  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div
          className="
            mb-4 flex items-center justify-center
            w-16 h-16 rounded-2xl
            glass
            text-xl
          "
        >
          📝
        </div>

        <p className="text-lg font-semibold text-text-primary dark:text-text-darkPrimary">
          {searchTerm ? "No results found" : "No notes yet"}
        </p>

        <p className="text-sm text-text-secondary mt-2">
          {searchTerm
            ? "Try a different keyword"
            : "Start by creating your first note"}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      {notes.map((note) => (
        <motion.div key={note.id} variants={item}>
          <NoteRow
            note={note}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default NotesGrid;