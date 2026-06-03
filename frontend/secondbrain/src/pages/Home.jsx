import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import TagFilter from "../components/TagFilter";
import NoteCard from "../components/NoteCard";
import AddNote from "../components/AddNote";
import { deleteNote, getNotes } from "../services/api";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      try {
        setLoading(true);
        const res = await getNotes({
          q: searchQuery || undefined,
          tag: selectedTag || undefined,
        });

        if (!cancelled) {
          setNotes(Array.isArray(res) ? res : []);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
        if (!cancelled) {
          setNotes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedTag]);

  const handleCreated = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((note) => note._id !== id));
  };

  return (
    <div className="page">
      <div className="hero">
        <h1>Second Brain</h1>
        <p>Your clean, intelligent note workspace.</p>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <AddNote onCreated={handleCreated} />
        </aside>

        <main className="content">
          <div className="toolbar">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <TagFilter
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
            />
          </div>

          {loading ? (
            <div className="state-card">Loading notes...</div>
          ) : !Array.isArray(notes) || notes.length === 0 ? (
            <div className="state-card">No notes found.</div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <NoteCard key={note._id} note={note} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;