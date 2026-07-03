const cardTones = ["tone-coral", "tone-yellow", "tone-cream", "tone-mint"];

const NoteCard = ({ note, onDelete, onSelect, index = 0, active = false }) => {
  const toneClass = cardTones[index % cardTones.length];

  return (
    <div
      className={`note-card ${toneClass} ${active ? "selected" : ""}`}
      onClick={() => onSelect?.(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(note)}
    >
      <div className="note-card-header">
        <div>
          <h3>{note.title}</h3>
          <p className="note-card-subtitle">
            {note.sourceType === "image" ? "Image note" : "Text note"}
            {note.processingStatus ? ` · ${note.processingStatus}` : ""}
          </p>
        </div>
        {onDelete && (
          <button
            className="note-action"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
            type="button"
            aria-label="Delete note"
          >
            ×
          </button>
        )}
      </div>

      <p className="note-card-copy">{note.content}</p>

      {note.tags?.length > 0 && (
        <div className="tag-list">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      {note.imageUrl ? <span className="attachment-badge">Has image</span> : null}
    </div>
  );
};

export default NoteCard;