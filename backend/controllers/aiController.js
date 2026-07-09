const Note = require("../models/Note");
const { askLLM, buildNotesContext } = require("../services/aiService");
const { getRelevantNotes } = require("../services/retrievalService");
const { analyzeLearningPath } = require("../services/analysisService");

const buildNoteActionPrompt = (note, mode) => {
  const baseContext = `Title: ${note.title || "Untitled"}\n\nTags: ${(note.tags || []).join(", ") || "none"}\n\nCurrent Digital Note:\n${note.content || note.ocrText || "No text extracted."}`;

  if (mode === "convert") {
    return `Convert the note below into the most efficient study format. Use short headings, clear bullets, and a structure that is easy to review later. Preserve the meaning, but improve the organization.\n\n${baseContext}`;
  }

  return `Improve the note below by filling in missing details where reasonable, clarifying vague phrasing, and making it easier to understand. If something is uncertain, keep that uncertainty explicit instead of inventing facts. Preserve the original meaning.\n\n${baseContext}`;
};

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
        "Failed to get a response from OpenRouter",
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

const noteAction = async (req, res) => {
  try {
    const { noteId, mode } = req.body;

    if (!noteId) {
      return res.status(400).json({ error: "noteId is required" });
    }

    if (!mode || !["convert", "improve"].includes(mode)) {
      return res.status(400).json({ error: "mode must be convert or improve" });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const prompt = buildNoteActionPrompt(note, mode);
    const draft = await askLLM(prompt);

    res.json({
      noteId: note._id,
      mode,
      draft,
    });
  } catch (error) {
    console.error("Note action error:", error.response?.data || error.message);

    res.status(500).json({
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to process note action",
    });
  }
};

const getLearningDiagnosis = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "tags array is required and must not be empty" });
    }

    // Fetch all notes with the specified tags
    const allNotes = await Note.find({
      tags: { $in: tags }
    }).lean();

    if (allNotes.length === 0) {
      return res.status(404).json({ error: "No notes found with specified tags" });
    }

    // Run learning diagnosis
    const diagnosis = await analyzeLearningPath(allNotes, tags);

    if (!diagnosis) {
      return res.status(500).json({ error: "Failed to generate learning diagnosis" });
    }

    res.json(diagnosis);
  } catch (error) {
    console.error("Learning diagnosis error:", error.response?.data || error.message);

    res.status(500).json({
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to generate learning diagnosis",
    });
  }
};

module.exports = {
  askQuestion,
  testRetrieval,
  noteAction,
  getLearningDiagnosis,
};