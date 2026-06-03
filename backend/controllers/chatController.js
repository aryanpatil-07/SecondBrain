const Chat = require("../models/Chat");
const { askLLM, buildNotesContext } = require("../services/aiService");
const { getRelevantNotes } = require("../services/retrievalService");

const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      messages: [],
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to create chat",
    });
  }
};

const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    res.json(chat);
  } catch (error) {
    console.error("Get chat error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to load chat",
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    // Save the user's message first
    chat.messages.push({
      role: "user",
      content: message.trim(),
    });

    // Keep only recent chat history for the prompt
    const recentMessages = chat.messages.slice(-6);

    const historyText = recentMessages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    // Retrieve relevant notes using your Phase 3 logic
    const notes = await getRelevantNotes(message);

    let notesContext = "";

    if (notes.length > 0) {
      notesContext = buildNotesContext(notes);
    }

    const prompt = `You are a personal knowledge assistant.

Use the conversation history and the relevant notes below.

Answer ONLY using the information provided.
If the answer cannot be found in the notes or conversation history, reply exactly:
"I couldn't find that information in your notes."

Conversation History:
${historyText || "No previous conversation."}

Relevant Notes:
${notesContext || "No relevant notes found."}

Current Question:
${message.trim()}`;

    const answer = await askLLM(prompt);

    // Save assistant response
    chat.messages.push({
      role: "assistant",
      content: answer,
    });

    await chat.save();

    res.json({
      answer,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Send message error:", error.response?.data || error.message);

    res.status(500).json({
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to process chat message",
    });
  }
};

module.exports = {
  createChat,
  getChat,
  sendMessage,
};