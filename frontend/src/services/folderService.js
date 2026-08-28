import axios from "axios";

const API = "http://localhost:8080/api/folders";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export const getFolders = () => {
  const workspaceId = localStorage.getItem("activeWorkspaceId");
  return axios.get(API, {
    ...getAuthConfig(),
    params: { workspaceId } 
  });
};

export const deleteFolder = (id) => {
  return axios.delete(`${API}/${id}`, getAuthConfig());
};