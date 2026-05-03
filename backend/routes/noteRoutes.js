const express = require("express");
const router = express.Router();

const {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require("../controllers/noteController");

router.post("/", createNote);
router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;