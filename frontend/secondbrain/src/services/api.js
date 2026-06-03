const API_BASE_URL = "http://localhost:3000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
};

// Notes
export const getNotes = async ({ q, tag } = {}) => {
  const params = new URLSearchParams();

  if (q) params.append("q", q);
  if (tag) params.append("tag", tag);

  const query = params.toString();
  return request(`/notes${query ? `?${query}` : ""}`);
};

// Backward-compatible alias for existing code
export const fetchNotes = async (queryString = "") => {
  return request(`/notes${queryString}`);
};

export const createNote = (note) =>
  request("/notes", {
    method: "POST",
    body: JSON.stringify(note),
  });

export const deleteNote = (id) =>
  request(`/notes/${id}`, {
    method: "DELETE",
  });

// AI
export const askAI = (question) =>
  request("/api/ai/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });

export const testRetrieval = (question) =>
  request("/api/ai/test-retrieval", {
    method: "POST",
    body: JSON.stringify({ question }),
  });

// Chat
export const createChat = () =>
  request("/api/chat/new", {
    method: "POST",
  });

export const getChat = (chatId) => request(`/api/chat/${chatId}`);

export const sendChatMessage = (chatId, message) =>
  request(`/api/chat/${chatId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });