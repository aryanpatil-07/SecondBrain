const NoteCard = ({ note, onDelete }) => {
  return (
    <div className="note-card">
      <div className="note-card-header">
        <h3>{note.title}</h3>
        {onDelete && (
          <button className="icon-button danger" onClick={() => onDelete(note._id)}>
            Delete
          </button>
        )}
      </div>

      <p>{note.content}</p>

      <div className="tag-list">
        {note.tags?.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default NoteCard;