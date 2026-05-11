const mongoose = require("mongoose");
const Note = require("./models/Note");
require("dotenv").config();

const seedNotes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing notes (optional but useful)
    await Note.deleteMany();

    const notes = [
      {
        title: "React Basics",
        content: "Hooks, state, and props are core concepts in React.",
        tags: ["react", "frontend"],
      },
      {
        title: "MERN Stack",
        content: "MongoDB, Express, React, Node form the MERN stack.",
        tags: ["mern", "fullstack"],
      },
      {
        title: "JavaScript Closures",
        content: "Closures allow functions to access outer scope variables.",
        tags: ["javascript"],
      },
      {
        title: "Node.js API",
        content: "Express is used to build REST APIs in Node.js.",
        tags: ["node", "backend"],
      },
      {
        title: "AI Notes",
        content: "RAG combines retrieval with generation.",
        tags: ["ai"],
      },
    ];

    await Note.insertMany(notes);

    console.log("Mock notes inserted");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedNotes();