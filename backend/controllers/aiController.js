const { askLLM, buildNotesContext } = require("../services/aiService");
const { getRelevantNotes } = require("../services/retrievalService");

const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "question is required",
      });
    }

    const notes = await getRelevantNotes(question);

    if (notes.length === 0) {
      return res.json({
        answer: "I couldn't find anything relevant in your notes.",
      });
    }

    const context = buildNotesContext(notes);

    const prompt = `You are a personal knowledge assistant.

Answer ONLY using the information provided in the context.

If the answer cannot be found in the context,
respond exactly:

"I couldn't find that information in your notes."

Context:

${context}

Question:
${question.trim()}`;

    const answer = await askLLM(prompt);

    res.json({ answer });
  } catch (error) {
    console.error("AI Controller error:", error.response?.data || error.message);

    res.status(500).json({
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to get a response from Ollama",
    });
  }
};

const testRetrieval = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "question is required",
      });
    }

    const notes = await getRelevantNotes(question);

    if (notes.length === 0) {
      return res.json({
        message: "No relevant notes found.",
        notes: [],
      });
    }

    res.json(notes);
  } catch (error) {
    console.error("Retrieval test error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to retrieve notes",
    });
  }
};

module.exports = {
  askQuestion,
  testRetrieval,
};