const express = require("express");
const router = express.Router();

const {
  createNote,
  getAllNotes,
  getNoteById,
  deleteNote
} = require("../controllers/noteController");

router.post("/", createNote);
router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.delete("/:id", deleteNote);

module.exports = router;