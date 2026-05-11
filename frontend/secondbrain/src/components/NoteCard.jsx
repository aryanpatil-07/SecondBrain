const NoteCard= ({note}) => {
    return(
        <div>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <small>{note.tags.join(", ")}</small>
        </div>
    );
};

export default NoteCard;