const Tesseract = require("tesseract.js");

const extractTextFromImage = async (imagePath) => {
  const result = await Tesseract.recognize(imagePath, "eng");

  const text = String(result?.data?.text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  const words = Array.isArray(result?.data?.words)
    ? result.data.words
        .map((word) => ({
          text: word.text || "",
          confidence: word.confidence ?? null,
          bbox: word.bbox || null,
        }))
        .filter((word) => word.text)
    : [];

  return {
    text,
    blocks: words,
    confidence: result?.data?.confidence ?? null,
  };
};

module.exports = {
  extractTextFromImage,
};