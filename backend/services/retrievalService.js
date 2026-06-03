const Note = require("../models/Note");

const STOP_WORDS = new Set([
  "what", "is", "a", "an", "the", "of", "to", "for", "in", "on", "at", "by",
  "and", "or", "but", "with", "from", "how", "why", "when", "where", "who",
  "whom", "which", "does", "do", "did", "are", "was", "were", "be", "been",
  "being", "can", "could", "should", "would", "will", "shall", "may", "might",
  "about", "tell", "me", "please", "explain", "show", "give", "need", "know"
]);

const normalizeText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractKeywords = (question) => {
  const normalized = normalizeText(question);

  if (!normalized) return [];

  return normalized
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
};

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getRelevantNotes = async (question) => {
  if (!question || typeof question !== "string" || !question.trim()) {
    return [];
  }

  const keywords = extractKeywords(question);

  if (keywords.length === 0) {
    return [];
  }

  const regexes = keywords.map((keyword) => new RegExp(escapeRegex(keyword), "i"));

  const notes = await Note.find({
    $or: [
      { title: { $in: regexes } },
      { content: { $in: regexes } },
      { tags: { $in: regexes } },
    ],
  });

  const scoredNotes = notes
    .map((note) => {
      const title = normalizeText(note.title);
      const content = normalizeText(note.content);
      const tags = Array.isArray(note.tags)
        ? note.tags.map((tag) => normalizeText(tag)).join(" ")
        : "";

      let score = 0;

      for (const keyword of keywords) {
        if (title.includes(keyword)) score += 3;
        if (content.includes(keyword)) score += 2;
        if (tags.includes(keyword)) score += 3;
      }

      return { note, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.note);

  return scoredNotes;
};

module.exports = {
  getRelevantNotes,
};