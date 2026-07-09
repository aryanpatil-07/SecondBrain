import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import TagFilter from "../components/TagFilter";
import NoteCard from "../components/NoteCard";
import AddNote from "../components/AddNote";
import NoteDetail from "../components/NoteDetail";
import KnowledgeAnalysis from "../components/KnowledgeAnalysis";
import { API_BASE_URL, askNoteAction, deleteNote, getNote, getNotes, updateNote, reAnalyzeNote } from "../services/api";

const Home = ({ selectedNote, setSelectedNote, openChat, openChatWithTopic }) => {
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedTag, setSelectedTag]   = useState("");
  const [notes, setNotes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [draft, setDraft]               = useState("");
  const [draftMode, setDraftMode]       = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [showAddNote, setShowAddNote]   = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadNotes = async () => {
      try {
        setLoading(true);
        const res = await getNotes({ q: searchQuery || undefined, tag: selectedTag || undefined });
        if (!cancelled) setNotes(Array.isArray(res) ? res : []);
      } catch {
        if (!cancelled) setNotes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadNotes();
    return () => { cancelled = true; };
  }, [searchQuery, selectedTag]);

  const noteTags = [...new Set(notes.flatMap((n) => n.tags || []))];

  const handleCreated = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setDraft(""); setDraftMode("");
    setShowAddNote(false);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
    if (selectedNote?._id === id) {
      setSelectedNote(null); setDraft(""); setDraftMode("");
      setShowAnalysis(false);
    }
  };

  const handleSelect = async (note) => {
    setDraft(""); setDraftMode("");
    setShowAnalysis(false);
    // Fetch fresh note from DB — background analysis may have completed since page load
    try {
      const fresh = await getNote(note._id);
      setSelectedNote(fresh);
    } catch {
      setSelectedNote(note);
    }
    // Open the detail modal — user clicks "Analyse Knowledge" from there
  };

  const handleCloseDetail = () => {
    setSelectedNote(null); setDraft(""); setDraftMode("");
  };

  const handleRunAction = async (mode) => {
    if (!selectedNote?._id) return;
    setActionLoading(mode); setDraft(""); setDraftMode(mode);
    try {
      const res = await askNoteAction({ noteId: selectedNote._id, mode });
      setDraft(res.draft || "");
    } finally { setActionLoading(""); }
  };

  const handleApplyDraft = async (draftText) => {
    if (!selectedNote?._id) return;
    const updated = await updateNote(selectedNote._id, {
      title: selectedNote.title, content: draftText, tags: selectedNote.tags || [],
    });
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
    setSelectedNote(updated); 
    setDraft(""); 
    setDraftMode("");
    
    // Trigger re-analysis and then fetch updated note
    try {
      const reAnalyzed = await reAnalyzeNote(selectedNote._id);
      // Update the selected note with the new analysis
      if (reAnalyzed?.analysis) {
        const updatedWithAnalysis = { ...updated, analysis: reAnalyzed.analysis };
        setSelectedNote(updatedWithAnalysis);
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updatedWithAnalysis : n)));
      }
    } catch (error) {
      console.error("Re-analysis error:", error);
    }
  };

  // Called when a flowchart node is clicked — opens chat with a pre-filled question
  const handleTopicChat = (topicLabel, note) => {
    setShowAnalysis(false);
    setSelectedNote(note);
    openChatWithTopic(topicLabel, note);
  };

  return (
    <div className="page">
      <div className="hero hero-row">
        <div>
          <h1>Second Brain</h1>
          <p>Your intelligent note workspace.</p>
        </div>
        <button className="add-note-fab" onClick={() => setShowAddNote(true)} aria-label="Add new note">
          <span>+</span>
        </button>
      </div>

      <div className="toolbar">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <TagFilter selectedTag={selectedTag} setSelectedTag={setSelectedTag} noteTags={noteTags} />
      </div>

      {loading ? (
        <div className="state-card">Loading notes…</div>
      ) : !notes.length ? (
        <div className="state-card">No notes yet — hit <strong>+</strong> to add one.</div>
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

      {/* Add note overlay */}
      {showAddNote && (
        <AddNote onCreated={handleCreated} onClose={() => setShowAddNote(false)} />
      )}

      {/* Note detail overlay */}
      {selectedNote && !showAnalysis && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleCloseDetail()}>
          <div className="detail-modal">
            <button className="modal-close detail-modal-close" onClick={handleCloseDetail} aria-label="Close">×</button>
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
              onOpenAnalysis={() => setShowAnalysis(true)}
            />
          </div>
        </div>
      )}

      {/* Knowledge analysis overlay */}
      {selectedNote && showAnalysis && (
        <KnowledgeAnalysis
          note={selectedNote}
          onClose={() => setShowAnalysis(false)}
          onTopicChat={handleTopicChat}
        />
      )}
    </div>
  );
};

export default Home;
