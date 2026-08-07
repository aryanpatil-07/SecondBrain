/**
 * @file AddNote.jsx
 * @concept React component composition
 * @concept Form handling — controlled inputs
 * @concept State management with useState
 * @concept File upload handling
 * @concept JavaScript — async/await
 * @concept JavaScript — Promises vs callbacks
 * @concept JavaScript — Event loop
 * @concept JavaScript — Closures
 * @concept JavaScript — Hoisting
 */

import { useState } from "react";
import { createImageNote, createNote } from "../services/api";

/**
 * Function Declaration Hoisting Example
 * @concept JavaScript — Hoisting
 * Function declarations are hoisted to the top of execution scope during creation phase
 */
function parseTagsWithClosure(delimiter = ",") {
  // @concept JavaScript — Closures
  // Lexical closure retaining access to outer delimiter parameter
  return function (inputString) {
    return String(inputString || "")
      .split(delimiter)
      .map((t) => t.trim())
      .filter(Boolean);
  };
}

/**
 * Promisify Callback Utility Example
 * @concept JavaScript — Promises vs callbacks
 * Converts legacy Node error-first callbacks (err, result) into ES6 Promises
 */
export const promisifyCallback = (fn) => (...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (err, res) => (err ? reject(err) : resolve(res)));
  });

/**
 * Event Loop Task Scheduler Example
 * @concept JavaScript — Event loop
 * Demonstrates Microtask Queue scheduling via queueMicrotask / Promise resolution
 */
export const scheduleMicrotask = (task) => {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task);
  } else {
    Promise.resolve().then(task);
  }
};

const AddNote = ({ onCreated, onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Async Form Submission Handler
   * @concept JavaScript — async/await
   * @concept Form handling — controlled inputs
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const parseTags = parseTagsWithClosure(",");
    const tagArray = parseTags(tags);

    setSubmitting(true);
    try {
      let res;
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("tags", tagArray.join(","));
        formData.append("image", imageFile);
        res = await createImageNote(formData);
      } else {
        res = await createNote({ title, content, tags: tagArray });
      }

      // Schedule callback via Browser Event Loop Microtask Queue
      scheduleMicrotask(() => {
        onCreated?.(res);
        onClose?.();
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Add note">
        <div className="modal-header">
          <div>
            <h2>New Note</h2>
            <p>Capture an idea, thought, or image.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Write your note… (markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Tags, separated by commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <label className="file-label">
            <span>{imageFile ? imageFile.name : "Attach an image (optional)"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Saving…" : imageFile ? "Upload & Save" : "Add Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNote;
