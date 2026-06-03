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

    onCreated?.(res.data);

    setTitle("");
    setContent("");
    setTags("");
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Note title"
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
        placeholder="Tags separated by commas"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <button type="submit" className="primary-button">
        Add Note
      </button>
    </form>
  );
};

export default AddNote;