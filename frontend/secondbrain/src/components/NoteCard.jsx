const cardTones = ["tone-coral", "tone-yellow", "tone-cream", "tone-mint"];

const NoteCard = ({ note, onDelete, index = 0 }) => {
  const toneClass = cardTones[index % cardTones.length];

  return (
    <div className={`note-card ${toneClass}`}>
      <div className="note-card-header">
        <h3>{note.title}</h3>
        {onDelete && (
          <button
            className="note-action"
            onClick={() => onDelete(note._id)}
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
    </div>
  );
};

export default NoteCard;