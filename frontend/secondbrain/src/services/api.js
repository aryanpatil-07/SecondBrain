export const API_BASE_URL = "http://localhost:3000";

const request = async (path, options = {}) => {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const { headers: customHeaders, ...restOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: isFormData
      ? { ...(customHeaders || {}) }
      : { "Content-Type": "application/json", ...(customHeaders || {}) },
    ...restOptions,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Request failed");
  return data;
};

// ── Notes ──────────────────────────────────────────────────────────────────
export const getNotes = ({ q, tag } = {}) => {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (tag) params.append("tag", tag);
  const query = params.toString();
  return request(`/notes${query ? `?${query}` : ""}`);
};

export const fetchNotes = (queryString = "") => request(`/notes${queryString}`);

export const createNote = (note) =>
  request("/notes", { method: "POST", body: JSON.stringify(note) });

export const createImageNote = (formData) =>
  request("/notes/upload", { method: "POST", body: formData });

export const deleteNote = (id) =>
  request(`/notes/${id}`, { method: "DELETE" });

export const updateNote = (id, note) =>
  request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(note) });

export const getNote = (id) => request(`/notes/${id}`);

// ── AI ─────────────────────────────────────────────────────────────────────
export const askAI = (question) =>
  request("/api/ai/ask", { method: "POST", body: JSON.stringify({ question }) });

export const testRetrieval = (question) =>
  request("/api/ai/test-retrieval", { method: "POST", body: JSON.stringify({ question }) });

export const askNoteAction = ({ noteId, mode }) =>
  request("/api/ai/note-action", { method: "POST", body: JSON.stringify({ noteId, mode }) });

// Re-run knowledge analysis for a note; returns { analysis }
export const reAnalyzeNote = (noteId) =>
  request(`/api/ai/analyze/${noteId}`, { method: "POST" });

// Learning diagnosis engine - comprehensive analysis across multiple notes with same tags
export const getLearningDiagnosis = (tags) =>
  request("/api/ai/learning-diagnosis", { 
    method: "POST", 
    body: JSON.stringify({ tags }) 
  });

// ── Chat ───────────────────────────────────────────────────────────────────
export const createChat = (noteId = null) =>
  request("/api/chat/new", { method: "POST", body: JSON.stringify({ noteId }) });

export const getChat = (chatId) => request(`/api/chat/${chatId}`);

export const sendChatMessage = (chatId, message, noteId = null) =>
  request(`/api/chat/${chatId}`, {
    method: "POST",
    body: JSON.stringify({ message, noteId }),
  });
