import axios from "axios";

const API = "http://localhost:8080/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export const getGmailStatus = async () => {
  return axios.get(`${API}/auth/google/gmail/status`, getAuthConfig());
};

export const getGoogleAuthUrl = async () => {
  return axios.get(`${API}/auth/google/gmail`, getAuthConfig());
};

export const getGmailMessages = async (folder = "inbox", q = "") => {
  return axios.get(`${API}/gmail/messages`, {
    ...getAuthConfig(),
    params: { folder, q, maxResults: 30 },
  });
};

export const getGmailMessageById = async (id) => {
  return axios.get(`${API}/gmail/messages/${id}`, getAuthConfig());
};

export const sendGmailMessage = async ({ to, subject, body }) => {
  return axios.post(`${API}/gmail/messages/send`, { to, subject, body }, getAuthConfig());
};

export const toggleStarMessage = async (id, starred) => {
  return axios.post(`${API}/gmail/messages/${id}/star`, { starred }, getAuthConfig());
};

export const trashMessage = async (id) => {
  return axios.post(`${API}/gmail/messages/${id}/trash`, {}, getAuthConfig());
};

export const archiveMessage = async (id) => {
  return axios.post(`${API}/gmail/messages/${id}/archive`, {}, getAuthConfig());
};
