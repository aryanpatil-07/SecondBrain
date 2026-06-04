import { useState } from "react";
import { createNote } from "../services/api";

const AddNote = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const res = await createNote({
      title,
      content,
      tags: tagArray,
    });

    onCreated?.(res);

    setTitle("");
    setContent("");
    setTags("");
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

      <button type="submit" className="add-note-button">
        Add Note
      </button>
    </form>
  );
};

export default AddNote;