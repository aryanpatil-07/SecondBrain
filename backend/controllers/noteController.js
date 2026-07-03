const Note = require("../models/Note");
const Chat = require("../models/Chat");
const fs = require("fs");
const path = require("path");
const { extractTextFromImage } = require("../services/ocrService");

const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tagsInput === "string") {
    return tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", error.message);
  }
};

// CREATE
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
    const savedNote = await note.save();

    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE FROM IMAGE
exports.createImageNote = async (req, res) => {
  const uploadedFile = req.file;

  try {
    if (!uploadedFile) {
      return res.status(400).json({ error: "image is required" });
    }

    const { title, content, tags = [] } = req.body;
    const parsedTags = parseTags(tags);
    const imagePath = path.posix.join("uploads", uploadedFile.filename);
    const imageUrl = `/${imagePath}`;
    const noteTitle = String(title || "").trim() || path.parse(uploadedFile.originalname).name || "Untitled Note";

    let ocrText = "";
    let ocrBlocks = [];
    let ocrConfidence = null;
    let processingStatus = "needs_review";

    try {
      const ocrResult = await extractTextFromImage(uploadedFile.path);
      ocrText = ocrResult.text || "";
      ocrBlocks = ocrResult.blocks || [];
      ocrConfidence = ocrResult.confidence;
      processingStatus = ocrText ? "processed" : "needs_review";
    } catch (ocrError) {
      console.error("OCR error:", ocrError.message);
      processingStatus = "needs_review";
    }

    const digitalContent = String(content || ocrText || "").trim();

    const note = new Note({
      title: noteTitle,
      content: digitalContent,
      tags: parsedTags,
      sourceType: "image",
      imagePath,
      imageUrl,
      originalFilename: uploadedFile.originalname || "",
      processingStatus,
      ocrText,
      ocrBlocks,
      ocrConfidence,
    });

    const savedNote = await note.save();

    res.status(201).json(savedNote);
  } catch (err) {
    deleteFileIfExists(uploadedFile?.path);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getAllNotes = async (req, res) => {
  try {
    const {tag,q}=req.query;

    let filter={};
    
    if(tag){
        filter.tags=tag;
    }
    if(q){
        filter.$or=[

            {title: {$regex: q, $options: "i"}},
            {content: {$regex: q, $options: "i"}},
            {ocrText: {$regex: q, $options: "i"}}

        ];
    }

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

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//UPDATE
exports.updateNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, tags: parseTags(tags) },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (note.imagePath) {
      deleteFileIfExists(path.join(__dirname, "..", note.imagePath));
    }

    await Chat.deleteMany({ noteId: note._id });
    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};