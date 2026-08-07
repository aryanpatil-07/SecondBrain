/**
 * @file Chat.js
 * @concept Schema modeling (Mongo)
 * @concept Embedding vs referencing relationships (ref: "Note" Foreign Linkage)
 * @concept Aggregation pipelines & Indexing for query performance (Mongo)
 */

const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
      index: true, // @concept Indexing for query performance (Mongo)
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