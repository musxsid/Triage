import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Plus, Clock, Tag, FileText, Trash2, CheckCircle2,
  AlertCircle, X
} from "lucide-react";
import ProfileMenu from "../components/ui/ProfileMenu";
import { createNote } from "../services/notesService";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INITIAL_EVENTS = [
  {
    id: 1,
    day: 8,
    month: 8, // September (0-indexed: 8)
    year: 2026,
    time: "10:30 AM",
    title: "Liquid Glass Design Review",
    category: "Design",
    color: "bg-accent",
    description: "Verify specular bevels, horizontal pill tooltip animation, and dark mode saturation.",
  },
  {
    id: 2,
    day: 8,
    month: 8,
    year: 2026,
    time: "02:00 PM",
    title: "Sprint Planning & Microservices Sync",
    category: "Milestone",
    color: "bg-purple-500",
    description: "Check Gateway Redis session filter reliability and AI service response speed.",
  },
  {
    id: 3,
    day: 11,
    month: 8,
    year: 2026,
    time: "04:30 PM",
    title: "Triage v1.0 Beta Release",
    category: "Milestone",
    color: "bg-amber-500",
    description: "Deploy to staging cluster and invite initial user cohort for feedback.",
  },
  {
    id: 4,
    day: 15,
    month: 8,
    year: 2026,
    time: "11:00 AM",
    title: "Keycloak Token Expiry Verification",
    category: "Security",
    color: "bg-emerald-500",
    description: "Verify 24h refresh token longevity and session invalidation on logout.",
  },
];

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 8)); // September 8, 2026
  const [selectedDay, setSelectedDay] = useState(8);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "10:00 AM",
    category: "Meeting",
    description: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const handleToday = () => {
    const today = new Date(2026, 8, 8);
    setCurrentDate(today);
    setSelectedDay(8);
  };

  const selectedDayEvents = events.filter(
    (e) => e.year === year && e.month === month && e.day === selectedDay
  );

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      toast.error("Please provide an event title.");
      return;
    }

    const created = {
      id: Date.now(),
      day: selectedDay,
      month,
      year,
      time: newEvent.time,
      title: newEvent.title,
      category: newEvent.category,
      color:
        newEvent.category === "Milestone"
          ? "bg-purple-500"
          : newEvent.category === "Security"
          ? "bg-emerald-500"
          : "bg-accent",
      description: newEvent.description,
    };

    setEvents([...events, created]);
    setShowAddModal(false);
    setNewEvent({ title: "", time: "10:00 AM", category: "Meeting", description: "" });
    toast.success("Event added to calendar!");
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter((e) => e.id !== id));
    toast.success("Event removed");
  };

  const handleCreateNoteFromEvent = async (eventItem) => {
    try {
      const noteContent = `<h3>Event: ${eventItem.title}</h3><p><b>Date:</b> ${monthNames[month]} ${eventItem.day}, ${year}</p><p><b>Time:</b> ${eventItem.time}</p><p><b>Category:</b> ${eventItem.category}</p><hr/><p>${eventItem.description || "Agenda and action items for this event."}</p>`;

      const res = await createNote({
        title: `Event: ${eventItem.title}`,
        content: noteContent,
      });

      toast.success("Created note for event!");
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to create note from event:", err);
      toast.error("Failed to create note from event");
    }
  };

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
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary dark:text-text-darkPrimary">
                Calendar & Schedules
              </h1>
              <span className="text-[10px] font-extrabold text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/15 px-2 py-0.5 rounded-full border border-accent/25 uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-[14px] text-text-secondary mt-0.5">
              Plan your deadlines, track workspace milestones, and link events to notes.
            </p>
          </div>
        </div>

        {/* Add Event Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-secondary text-white text-[13px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Add Event
        </motion.button>
      </div>

      {/* ═══ UNIFIED SINGLE WORKSTATION CONTAINER (GRID + AGENDA) ═══ */}
      <div className="glass-strong rounded-3xl overflow-hidden border border-white/35 dark:border-white/10 shadow-2xl flex flex-col lg:flex-row min-h-[580px]">
        
        {/* Left Pane: Calendar Grid */}
        <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-white/20 dark:border-white/8 flex flex-col justify-between">
          
          <div>
            {/* Month Navigator */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/15 dark:border-white/5">
              <h2 className="text-lg font-bold tracking-tight text-text-primary dark:text-text-darkPrimary">
                {monthNames[month]} {year}
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToday}
                  className="px-3 py-1 rounded-xl glass text-xs font-bold text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/10 transition"
                >
                  Today
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl glass text-text-secondary hover:text-text-primary transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl glass text-text-secondary hover:text-text-primary transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_OF_WEEK.map((d) => (
                <span key={d} className="text-[11px] font-bold text-text-secondary uppercase tracking-wider py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Blank offset days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-14 p-1 rounded-2xl opacity-10" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDay === dayNum;
                const isToday = dayNum === 8 && month === 8 && year === 2026;
                const dayEvents = events.filter(
                  (e) => e.year === year && e.month === month && e.day === dayNum
                );

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`h-14 p-1 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col items-center justify-between border ${
                      isSelected
                        ? "bg-white/60 dark:bg-white/15 border-accent/50 shadow-sm scale-105"
                        : "border-transparent hover:bg-white/30 dark:hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-0.5 ${
                        isToday
                          ? "bg-accent text-white shadow-sm"
                          : isSelected
                          ? "text-accent dark:text-accent-dark font-extrabold"
                          : "text-text-primary dark:text-text-darkPrimary"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Dots for events */}
                    <div className="flex items-center gap-1 mb-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`w-1.5 h-1.5 rounded-full ${e.color}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 dark:border-white/5 flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Meeting</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Milestone</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Security</span>
          </div>
        </div>

        {/* Right Pane: Day Agenda Schedule (Uniformly integrated) */}
        <div className="w-full lg:w-[380px] p-6 bg-white/5 dark:bg-black/10 flex flex-col justify-between overflow-hidden">
          
          <div>
            {/* Agenda Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20 dark:border-white/8">
              <div>
                <p className="text-[11px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                  Schedule
                </p>
                <h3 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
                  {monthNames[month]} {selectedDay}, {year}
                </h3>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 rounded-xl glass text-text-secondary hover:text-accent transition"
                title="Add event on this day"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Events List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="py-20 text-center text-text-secondary flex flex-col items-center">
                  <CalendarIcon size={36} className="opacity-30 mb-2" />
                  <p className="text-sm font-semibold text-text-primary dark:text-text-darkPrimary">
                    No events for this date
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Click '+' to schedule a task or meeting.
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((eventItem) => (
                  <div
                    key={eventItem.id}
                    className="glass p-4 rounded-2xl border border-white/25 dark:border-white/8 hover:border-accent/30 transition-all group text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-dark bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                          {eventItem.category}
                        </span>
                        <h4 className="text-[13px] font-bold text-text-primary dark:text-text-darkPrimary mt-1.5">
                          {eventItem.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(eventItem.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 transition"
                        title="Delete event"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-2">
                      <Clock size={12} />
                      <span>{eventItem.time}</span>
                    </div>

                    {eventItem.description && (
                      <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                        {eventItem.description}
                      </p>
                    )}

                    {/* Turn into Note action */}
                    <div className="mt-3 pt-2 border-t border-white/15 dark:border-white/5 flex items-center justify-end">
                      <button
                        onClick={() => handleCreateNoteFromEvent(eventItem)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-accent dark:text-accent-dark hover:underline"
                      >
                        <FileText size={12} /> Create Note for Event
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 dark:border-white/5 flex items-center justify-between text-xs text-text-secondary">
            <span>{selectedDayEvents.length} items scheduled</span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="font-bold text-accent dark:text-accent-dark hover:underline"
            >
              + Quick Add
            </button>
          </div>

        </div>

      </div>

      {/* ═══ ADD EVENT MODAL (PORTALED) ═══ */}
      {typeof document !== "undefined" && showAddModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-strong rounded-3xl p-6 shadow-2xl w-full max-w-md border border-white/35 dark:border-white/12"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-accent" />
                  <h3 className="text-base font-bold text-text-primary dark:text-text-darkPrimary">
                    Add Event for {monthNames[month]} {selectedDay}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg glass text-text-secondary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Review, Architecture Sync..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-xl glass text-xs font-semibold text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl glass text-xs font-bold text-text-primary dark:text-text-darkPrimary outline-none border border-white/25 dark:border-white/10 focus:border-accent bg-transparent"
                    >
                      <option value="Meeting" className="dark:bg-[#1E1612]">Meeting</option>
                      <option value="Milestone" className="dark:bg-[#1E1612]">Milestone</option>
                      <option value="Design" className="dark:bg-[#1E1612]">Design</option>
                      <option value="Security" className="dark:bg-[#1E1612]">Security</option>
                      <option value="Personal" className="dark:bg-[#1E1612]">Personal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                    Description / Agenda
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief notes, objectives, or action items..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-3.5 rounded-xl glass text-xs text-text-primary dark:text-text-darkPrimary placeholder:text-text-secondary/50 outline-none border border-white/25 dark:border-white/10 focus:border-accent resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold glass text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-secondary transition active:scale-95"
                  >
                    <Plus size={14} /> Add to Calendar
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
