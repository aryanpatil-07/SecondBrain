const cardTones = ["tone-coral", "tone-yellow", "tone-cream", "tone-mint"];

/** Returns the first non-empty line of text from markdown/plain content */
const getFirstLine = (text = "") => {
  const stripped = text
    .replace(/^#+\s*/gm, "")   // strip heading markers
    .replace(/\*\*|__|\*|_|~~|`/g, "") // strip inline markers
    .trim();
  const firstLine = stripped.split("\n").find((l) => l.trim() !== "");
  return firstLine?.trim() || "";
};

const NoteCard = ({ note, onDelete, onSelect, index = 0, active = false }) => {
  const toneClass = cardTones[index % cardTones.length];
  const preview = getFirstLine(note.content);

  return (
    <div
      className={`note-card ${toneClass} ${active ? "selected" : ""}`}
      onClick={() => onSelect?.(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(note)}
    >
      <div className="note-card-header">
        <div className="note-card-titles">
          <h3>{note.title}</h3>
          <p className="note-card-subtitle">
            {note.sourceType === "image" ? "📎 Image note" : "📝 Text note"}
            {note.processingStatus ? ` · ${note.processingStatus}` : ""}
          </p>
        </div>
        {onDelete && (
          <button
            className="note-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
            type="button"
            aria-label="Delete note"
            style={{
              flexShrink: 0,
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: "rgba(239,68,68,0.12)",
              color: "#fca5a5",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(239,68,68,0.25)";
              e.target.style.borderColor = "rgba(239,68,68,0.6)";
              e.target.style.color = "#ff9999";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(239,68,68,0.12)";
              e.target.style.borderColor = "rgba(239,68,68,0.35)";
              e.target.style.color = "#fca5a5";
            }}
          >
            Delete
          </button>
        )}
      </div>

      {preview && <p className="note-card-copy">{preview}</p>}

      {note.tags?.length > 0 && (
        <div className="tag-list">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      {note.imageUrl ? <span className="attachment-badge">📷 Has image</span> : null}
    </div>
  );
};

export default NoteCard;