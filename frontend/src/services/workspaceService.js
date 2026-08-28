import axios from "axios";

const API = "http://localhost:8080/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export const getWorkspaces = () => {
  return axios.get(`${API}/workspaces`, getAuthConfig());
};

export const createWorkspace = (data) => {
  return axios.post(`${API}/workspaces`, data, getAuthConfig());
};

export const updateWorkspace = (id, data) => {
  return axios.put(`${API}/workspaces/${id}`, data, getAuthConfig());
};

export const deleteWorkspace = (id) => {
  return axios.delete(`${API}/workspaces/${id}`, getAuthConfig());
};

export const uploadWorkspaceCover = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API}/upload/image`, formData, getAuthConfig());
};