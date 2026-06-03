const axios = require("axios");

const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.2";

const askLLM = async (prompt) => {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt is required!");
  }

  const response = await axios.post(
    OLLAMA_URL,
    {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000,
    }
  );

  return response.data?.response || "";
};

const buildNotesContext = (notes) => {
  if (!Array.isArray(notes) || notes.length === 0) {
    return "";
  }

  return notes
    .map((note) => {
      return `Title: ${note.title || "Untitled"}

Content:
${note.content || ""}`;
    })
    .join("\n\n------------------\n\n");
};

module.exports = {
  askLLM,
  buildNotesContext,
};