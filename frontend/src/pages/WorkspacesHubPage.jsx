import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Image as ImageIcon, MoreVertical, Edit2, Pin, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { getWorkspaces, deleteWorkspace } from "../services/workspaceService";
import CreateWorkspaceModal from "../components/ui/CreateWorkspaceModal";
import EditWorkspaceModal from "../components/ui/EditWorkspaceModal"; 
import ConfirmModal from "../components/ui/ConfirmModal"; 

import ProfileMenu from "../components/ui/ProfileMenu";

function WorkspacesHubPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [pinnedId, setPinnedId] = useState(localStorage.getItem("pinnedWorkspaceId"));
  
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data || []);
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectWorkspace = (ws) => {
    localStorage.setItem("activeWorkspaceId", ws.id);
    window.dispatchEvent(new Event("workspaceChanged"));
    navigate("/dashboard");
  };

  const handlePinWorkspace = (e, id) => {
    e.stopPropagation(); 
    localStorage.setItem("pinnedWorkspaceId", id);
    setPinnedId(id.toString());
    setOpenDropdownId(null);
    toast.success("Workspace Pinned! App will open this by default.", { icon: "📌" });
  };

  const handleUnpinWorkspace = (e) => {
    e.stopPropagation();
    localStorage.removeItem("pinnedWorkspaceId");
    setPinnedId(null);
    setOpenDropdownId(null);
    toast("Workspace unpinned");
  };

  const handleDeleteConfirm = async () => {
    if (!workspaceToDelete) return;
    try {
      await deleteWorkspace(workspaceToDelete.id);
      toast.success("Workspace deleted");
      
      if (localStorage.getItem("activeWorkspaceId") == workspaceToDelete.id) localStorage.removeItem("activeWorkspaceId");
      if (localStorage.getItem("pinnedWorkspaceId") == workspaceToDelete.id) {
        localStorage.removeItem("pinnedWorkspaceId");
        setPinnedId(null);
      }
      
      setWorkspaceToDelete(null);
      fetchWorkspaces();
    } catch (err) {
      toast.error("Failed to delete workspace");
    }
  };

  const renderIcon = (iconString) => {
    if (!iconString) return <Briefcase size={20} />;
    if (iconString.length > 2) return iconString.charAt(0).toUpperCase(); 
    return iconString; 
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 relative">
      
      <div className="fixed top-6 right-8 z-[100] hidden md:block">
        <ProfileMenu />
      </div>

      <div className="flex items-center justify-between mb-10 mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-darkPrimary mb-2">
            Your Workspaces
          </h1>
          <p className="text-text-secondary text-[14px]">
            Select a workspace to jump in, or create a new one.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all text-[14px]"
        >
          <Plus size={18} /> New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => setShowCreateModal(true)}
          className="group cursor-pointer h-64 rounded-2xl border-2 border-dashed border-border dark:border-border-dark flex flex-col items-center justify-center gap-3 text-text-secondary hover:text-accent dark:hover:text-accent-dark hover:border-accent/40 dark:hover:border-accent-dark/40 transition-colors hover:bg-accent/5 dark:hover:bg-accent-dark/5"
        >
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="font-semibold">Create New</span>
        </motion.div>

        {workspaces.map((ws) => (
          <motion.div
            key={ws.id}
            whileHover={{ y: -4 }}
            onClick={() => handleSelectWorkspace(ws)}
            className="cursor-pointer h-64 rounded-2xl glass glass-shimmer shadow-sm hover:shadow-glassHover dark:hover:shadow-glassDark transition-all flex flex-col relative overflow-hidden"
          >
            {pinnedId == ws.id && (
              <div className="absolute top-3 left-3 z-10 bg-accent/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm">
                <Pin size={10} className="fill-white" /> Pinned
              </div>
            )}

            <div className="h-32 w-full relative rounded-t-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(232,120,74,0.08) 0%, rgba(240,221,208,0.15) 100%)' }}>
              {ws.coverImage ? (
                <img src={ws.coverImage} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <ImageIcon size={40} />
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col relative">
              <div className="absolute -top-6 left-5 w-12 h-12 glass rounded-xl shadow-md flex items-center justify-center text-xl font-bold overflow-hidden">
                {renderIcon(ws.icon)}
              </div>
              
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setOpenDropdownId(openDropdownId === ws.id ? null : ws.id);
                  }}
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>

                <AnimatePresence>
                  {openDropdownId === ws.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()} 
                      className="absolute right-0 top-8 w-44 z-50 glass rounded-xl shadow-xl overflow-hidden py-1"
                    >
                      <button 
                        onClick={() => { setWorkspaceToEdit(ws); setOpenDropdownId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                      >
                        <Edit2 size={16} className="text-accent" /> Edit Workspace
                      </button>

                      {pinnedId == ws.id ? (
                        <button 
                          onClick={(e) => handleUnpinWorkspace(e)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                        >
                          <Pin size={16} className="text-text-secondary opacity-50" /> Unpin
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => handlePinWorkspace(e, ws.id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary dark:text-text-darkPrimary hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
                        >
                          <Pin size={16} className="text-yellow-500" /> Pin as Default
                        </button>
                      )}

                      <div className="h-px bg-white/20 dark:bg-white/8 my-1 mx-2" />

                      <button 
                        onClick={() => { setWorkspaceToDelete(ws); setOpenDropdownId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex-1 pr-8">
                <h3 className="text-lg font-bold text-text-primary dark:text-text-darkPrimary truncate">
                  {ws.name}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <CreateWorkspaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={fetchWorkspaces} />
      
      <EditWorkspaceModal open={!!workspaceToEdit} workspace={workspaceToEdit} onClose={() => setWorkspaceToEdit(null)} onUpdated={fetchWorkspaces} />
      
      <ConfirmModal
        open={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All notes inside will be lost forever.`}
      />
    </div>
  );
}

export default WorkspacesHubPage;