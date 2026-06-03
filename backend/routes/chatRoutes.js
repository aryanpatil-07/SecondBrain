const express = require("express");
const router = express.Router();

const {
  createChat,
  getChat,
  sendMessage,
} = require("../controllers/chatController");

router.post("/new", createChat);
router.get("/:chatId", getChat);
router.post("/:chatId", sendMessage);

module.exports = router;