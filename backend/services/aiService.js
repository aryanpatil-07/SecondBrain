const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
const OPENROUTER_MODEL_FALLBACKS = [
  PRIMARY_OPENROUTER_MODEL,
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-coder:free",
  "poolside/laguna-xs-2.1:free",
].filter(Boolean);

const callOpenRouter = async (prompt, model) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model,
      messages: [
        {
          role: "system",
          content: "You are a personal knowledge assistant. Keep answers grounded, clear, and concise.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "SecondBrain",
      },
      timeout: 120000,
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
};

const askLLM = async (prompt) => {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt is required!");
  }

  let lastError = null;

  for (const model of OPENROUTER_MODEL_FALLBACKS) {
    try {
      const answer = await callOpenRouter(prompt, model);

      if (answer) {
        return answer;
      }
    } catch (error) {
      lastError = error;

      const status = error.response?.status;
      const isRetryable = status === 404 || status === 429;

      if (!isRetryable) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("OpenRouter returned no response");
};

const buildNotesContext = (notes) => {
  if (!Array.isArray(notes) || notes.length === 0) {
    return "";
  }

  return notes
    .map((note) => {
      const tagsText = Array.isArray(note.tags) && note.tags.length > 0 ? note.tags.join(", ") : "none";
      const primaryText = note.content || note.ocrText || "";

      return `Title: ${note.title || "Untitled"}
Source Type: ${note.sourceType || "text"}
Status: ${note.processingStatus || "processed"}
Tags: ${tagsText}

Content:
${primaryText}`;
    })
    .join("\n\n------------------\n\n");
};

module.exports = {
  askLLM,
  buildNotesContext,
};