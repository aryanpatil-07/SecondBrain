const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../middleware/upload");

const {
  createNote,
  createImageNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require("../controllers/noteController");

router.post("/", createNote);
router.post("/upload", uploadSingleImage, createImageNote);
router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;