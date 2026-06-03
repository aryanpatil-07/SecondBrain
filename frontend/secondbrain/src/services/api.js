import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:3000" });

// Notes
export const createNote = (note) => API.post("/notes", note);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
export const getNotes = ({ q, tag } = {}) =>
  API.get("/notes", { params: { q, tag } });

// AI / retrieval
export const askAI = (question) => API.post("/api/ai/ask", { question });
export const testRetrieval = (question) => API.post("/api/ai/test-retrieval", { question });

// Chat
export const createChat = () => API.post("/api/chat/new");
export const getChat = (chatId) => API.get(`/api/chat/${chatId}`);
export const sendChatMessage = (chatId, message) =>
  API.post(`/api/chat/${chatId}`, { message });