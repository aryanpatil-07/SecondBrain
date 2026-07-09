const Note = require("../models/Note");
const Chat = require("../models/Chat");
const fs = require("fs");
const path = require("path");
const { extractTextFromImage } = require("../services/ocrService");
const { analyzeNote } = require("../services/analysisService");

const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) return tagsInput.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tagsInput === "string") return tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
};

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.error(e.message); }
};

// Run analysis in background — never blocks the response
const runAnalysisAsync = (noteId, note) => {
  setImmediate(async () => {
    try {
      const analysis = await analyzeNote(note);
      if (analysis) {
        await Note.findByIdAndUpdate(noteId, { analysis });
        console.log(`Analysis completed for note ${noteId}`);
      }
    } catch (err) {
      console.error(`Background analysis error for note ${noteId}:`, err.message);
    }
  });
};

// CREATE TEXT NOTE
exports.createNote = async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    const note = new Note({
      title: String(title || "").trim(),
      content: String(content || "").trim(),
      tags: parseTags(tags),
      sourceType: "text",
      processingStatus: "processed",
    });
    const saved = await note.save();
    res.status(201).json(saved);
    // Fire-and-forget analysis after responding
    runAnalysisAsync(saved._id, saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE FROM IMAGE
exports.createImageNote = async (req, res) => {
  const uploadedFile = req.file;
  try {
    if (!uploadedFile) return res.status(400).json({ error: "image is required" });

    const { title, content, tags = [] } = req.body;
    const parsedTags = parseTags(tags);
    const imagePath = path.posix.join("uploads", uploadedFile.filename);
    const imageUrl = `/${imagePath}`;
    const noteTitle = String(title || "").trim() || path.parse(uploadedFile.originalname).name || "Untitled Note";

    let ocrText = "", ocrBlocks = [], ocrConfidence = null, processingStatus = "needs_review";
    try {
      const ocrResult = await extractTextFromImage(uploadedFile.path);
      ocrText = ocrResult.text || "";
      ocrBlocks = ocrResult.blocks || [];
      ocrConfidence = ocrResult.confidence;
      processingStatus = ocrText ? "processed" : "needs_review";
    } catch (ocrError) {
      console.error("OCR error:", ocrError.message);
    }

    const note = new Note({
      title: noteTitle,
      content: String(content || ocrText || "").trim(),
      tags: parsedTags,
      sourceType: "image",
      imagePath, imageUrl,
      originalFilename: uploadedFile.originalname || "",
      processingStatus, ocrText, ocrBlocks, ocrConfidence,
    });
    const saved = await note.save();
    res.status(201).json(saved);
    runAnalysisAsync(saved._id, saved);
  } catch (err) {
    deleteFileIfExists(uploadedFile?.path);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getAllNotes = async (req, res) => {
  try {
    const { tag, q } = req.query;
    const filter = {};
    if (tag) filter.tags = tag;
    if (q) filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
      { ocrText: { $regex: q, $options: "i" } },
    ];
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const updated = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, tags: parseTags(tags) },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.imagePath) deleteFileIfExists(path.join(__dirname, "..", note.imagePath));
    await Chat.deleteMany({ noteId: note._id });
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RE-ANALYZE (called from aiRoute)
exports.reAnalyzeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    const analysis = await analyzeNote(note);
    if (!analysis) return res.status(422).json({ error: "Analysis could not be generated — note may be too short." });
    const updated = await Note.findByIdAndUpdate(req.params.id, { analysis }, { new: true });
    res.json({ analysis: updated.analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
