import axios from "axios";

const API = "http://localhost:8080/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

// ================= NOTES =================

export const getNotes = () => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  return axios.get(`${API}/notes`, {
    ...getAuthConfig(),
    params: { workspaceId } 
  });
};

export const getNoteById = (id) => {
  return axios.get(`${API}/notes/${id}`, getAuthConfig());
};

export const createNote = (data) => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  return axios.post(`${API}/notes`, data, {
    ...getAuthConfig(),
    params: { workspaceId } 
  });
};

export const updateNote = (id, data) => {
  return axios.put(`${API}/notes/${id}`, data, getAuthConfig());
};

export const deleteNote = (id) => {
  return axios.delete(`${API}/notes/${id}`, getAuthConfig());
};

export const toggleFavoriteNote = (id) => {
  return axios.put(`${API}/notes/${id}/favorite`, {}, getAuthConfig());
};

export const moveNoteToFolder = (noteId, folderId) => {
  const targetFolderId = folderId === null ? 0 : folderId; 
  return axios.put(`${API}/notes/${noteId}/folder/${targetFolderId}`, {}, getAuthConfig());
};

export const toggleShareNote = (id) => {
  return axios.put(`${API}/notes/${id}/share`, {}, getAuthConfig());
};

export const getPublicNote = (shareToken) => {
  return axios.get(`${API}/notes/public/${shareToken}`);
};

// ================= AUTH =================

export const login = (data) => {
  return axios.post(`${API}/auth/login`, data, { withCredentials: true });
};

export const signup = (data) => {
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