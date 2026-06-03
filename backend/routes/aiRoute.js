const express = require("express");
const router = express.Router();

const { askQuestion, testRetrieval } = require("../controllers/aiController");

router.post("/ask", askQuestion);
router.post("/test-retrieval", testRetrieval);

module.exports = router;