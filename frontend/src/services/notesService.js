import axios from "axios";
import { CacheService } from "./cacheService";

const API = "http://localhost:8080/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

// ================= NOTES =================

export const getNotes = async () => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  const response = await axios.get(`${API}/notes`, {
    ...getAuthConfig(),
    params: { workspaceId } 
  });
  
  if (response.data && Array.isArray(response.data)) {
    CacheService.setCachedNotes(workspaceId, response.data);
  }
  
  return response;
};

// Helper for Stale-While-Revalidate Instant Loading
export const getNotesWithCache = async (onFreshData) => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  const cachedData = CacheService.getCachedNotes(workspaceId);

  // Return cached data immediately if present
  let initialResult = null;
  if (cachedData) {
    initialResult = { data: cachedData, fromCache: true };
  }

  // Trigger background fetch to revalidate
  getNotes().then((res) => {
    if (onFreshData && res.data) {
      onFreshData(res.data);
    }
  }).catch((err) => {
    console.warn("Background revalidation failed:", err);
  });

  return initialResult || getNotes();
};

export const getNoteById = (id) => {
  return axios.get(`${API}/notes/${id}`, getAuthConfig());
};

export const createNote = async (data) => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  const res = await axios.post(`${API}/notes`, data, {
    ...getAuthConfig(),
    params: { workspaceId } 
  });
  // Invalidate / refresh cache
  getNotes();
  return res;
};

export const updateNote = async (id, data) => {
  const res = await axios.put(`${API}/notes/${id}`, data, getAuthConfig());
  getNotes();
  return res;
};

export const deleteNote = async (id) => {
  const res = await axios.delete(`${API}/notes/${id}`, getAuthConfig());
  getNotes();
  return res;
};

export const toggleFavoriteNote = async (id) => {
  const res = await axios.put(`${API}/notes/${id}/favorite`, {}, getAuthConfig());
  getNotes();
  return res;
};

export const moveNoteToFolder = async (noteId, folderId) => {
  const targetFolderId = folderId === null ? 0 : folderId; 
  const res = await axios.put(`${API}/notes/${noteId}/folder/${targetFolderId}`, {}, getAuthConfig());
  getNotes();
  return res;
};

export const toggleShareNote = (id) => {
  return axios.put(`${API}/notes/${id}/share`, {}, getAuthConfig());
};

export const getPublicNote = (shareToken) => {
  return axios.get(`${API}/notes/public/${shareToken}`);
};

// ================= AUTH =================

export const login = (data) => {
  CacheService.clearCache();
  return axios.post(`${API}/auth/login`, data, { withCredentials: true });
};

export const signup = (data) => {
  CacheService.clearCache();
  return axios.post(`${API}/auth/register`, data, { withCredentials: true });
};

// UPLOAD IMAGE
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API}/upload/image`, formData, getAuthConfig());
};

export const generateAIContent = (action, context) => {
  return axios.post(`${API}/ai/generate`, { action, context }, getAuthConfig());
};