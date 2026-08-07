/**
 * @file upload.js
 * @concept Middleware
 * @concept File upload handling
 * @concept JavaScript — Promises vs callbacks (Multer disk storage callbacks)
 * @concept Role-based authorization checks & security guards
 */

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure Multer Storage Engine
 * @concept JavaScript — Promises vs callbacks (uses callback cb(null, destination))
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeBaseName = path
      .parse(file.originalname || "note-image")
      .name
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40) || "note-image";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname || "").toLowerCase();

    cb(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
  },
});

/**
 * Express Upload Middleware Middleware
 * @concept Middleware
 * @concept File upload handling (10MB limit enforcement)
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = {
  uploadSingleImage: upload.single("image"),
  uploadsDir,
};