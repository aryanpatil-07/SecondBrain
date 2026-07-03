const express = require("express");
const router = express.Router();

const { askQuestion, testRetrieval, noteAction } = require("../controllers/aiController");

router.post("/ask", askQuestion);
router.post("/test-retrieval", testRetrieval);
router.post("/note-action", noteAction);

module.exports = router;