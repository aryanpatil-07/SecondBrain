import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import TagFilter from "../components/TagFilter";
import NoteCard from "../components/NoteCard";
import AddNote from "../components/AddNote";
import NoteDetail from "../components/NoteDetail";
import { API_BASE_URL, askNoteAction, deleteNote, getNotes, updateNote } from "../services/api";

const Home = ({ selectedNote, setSelectedNote, openChat }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [draftMode, setDraftMode] = useState("");
  const [actionLoading, setActionLoading] = useState("");

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
    setSelectedNote(newNote);
    setDraft("");
    setDraftMode("");
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((note) => note._id !== id));
    if (selectedNote?._id === id) {
      setSelectedNote(null);
      setDraft("");
      setDraftMode("");
    }
  };

  const handleSelect = (note) => {
    setSelectedNote(note);
    setDraft("");
    setDraftMode("");
  };

  const handleRunAction = async (mode) => {
    if (!selectedNote?._id) return;

    setActionLoading(mode);
    setDraft("");
    setDraftMode(mode);

    try {
      const res = await askNoteAction({ noteId: selectedNote._id, mode });
      setDraft(res.draft || "");
    } finally {
      setActionLoading("");
    }
  };

  const handleApplyDraft = async (draftText) => {
    if (!selectedNote?._id) return;

    const updated = await updateNote(selectedNote._id, {
      title: selectedNote.title,
      content: draftText,
      tags: selectedNote.tags || [],
    });

    setNotes((prev) =>
      prev.map((note) => (note._id === updated._id ? updated : note))
    );
    setSelectedNote(updated);
    setDraft("");
    setDraftMode("");
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

          <div className="notes-and-detail">
            <div>
              {loading ? (
                <div className="state-card">Loading notes...</div>
              ) : !Array.isArray(notes) || notes.length === 0 ? (
                <div className="state-card">No notes found.</div>
              ) : (
                <div className="notes-grid">
                  {notes.map((note, index) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      index={index}
                      onDelete={handleDelete}
                      onSelect={handleSelect}
                      active={selectedNote?._id === note._id}
                    />
                  ))}
                </div>
              )}
            </div>

            <NoteDetail
              note={selectedNote}
              imageSrc={selectedNote?.imageUrl ? `${API_BASE_URL}${selectedNote.imageUrl}` : ""}
              draft={draft}
              draftMode={draftMode}
              actionLoading={actionLoading}
              onRunAction={handleRunAction}
              onApplyDraft={handleApplyDraft}
              onDelete={handleDelete}
              onOpenChat={openChat}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;