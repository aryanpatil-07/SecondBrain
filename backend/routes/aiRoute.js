const express = require("express");
const router = express.Router();
const { askQuestion, testRetrieval, noteAction, getLearningDiagnosis } = require("../controllers/aiController");
const { reAnalyzeNote } = require("../controllers/noteController");

router.post("/ask", askQuestion);
router.post("/test-retrieval", testRetrieval);
router.post("/note-action", noteAction);

// Re-run analysis for a specific note
router.post("/analyze/:id", reAnalyzeNote);

// Learning diagnosis engine - analyzes all notes with specified tags
router.post("/learning-diagnosis", getLearningDiagnosis);

module.exports = router;
