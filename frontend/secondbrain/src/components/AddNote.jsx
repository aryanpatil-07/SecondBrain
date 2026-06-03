import { useState } from "react";
import { createNote } from "../services/api";

export default function AddNote({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const res = await createNote({ title, content, tags: tagArray });
      setTitle(""); setContent(""); setTags("");
      if (onCreated) onCreated(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to create note");
    }
  };

  return (
    <form onSubmit={submit}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" required />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Content" required />
      <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="tags (comma separated)" />
      <button type="submit">Add Note</button>
    </form>
  );
}