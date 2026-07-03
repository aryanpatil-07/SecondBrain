import { useState } from "react";
import { createImageNote, createNote } from "../services/api";

const AddNote = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setSubmitting(true);

    try {
      const res = imageFile
        ? await (async () => {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            formData.append("tags", tagArray.join(","));
            formData.append("image", imageFile);
            return createImageNote(formData);
          })()
        : await createNote({
            title,
            content,
            tags: tagArray,
          });

      onCreated?.(res);

      setTitle("");
      setContent("");
      setTags("");
      setImageFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-note-card" onSubmit={handleSubmit}>
      <div className="add-note-header">
        <h2>Add Note</h2>
        <p>Capture ideas quickly.</p>
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        placeholder="Write your note..."
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

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />

      <button type="submit" className="add-note-button" disabled={submitting}>
        {submitting ? "Saving..." : imageFile ? "Upload Note Image" : "Add Note"}
      </button>
    </form>
  );
};

export default AddNote;