const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);