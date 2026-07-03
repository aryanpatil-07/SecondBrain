const NoteDetail = ({
  note,
  imageSrc,
  draft,
  draftMode,
  actionLoading,
  onRunAction,
  onApplyDraft,
  onDelete,
  onOpenChat,
}) => {
  if (!note) {
    return (
      <div className="note-detail empty-state">
        <div className="state-card">Select a note to see the digital version, original image, and AI tools.</div>
      </div>
    );
  }

  const content = String(note.content || note.ocrText || "").trim();

  return (
    <section className="note-detail">
      <div className="note-detail-header">
        <div>
          <p className="detail-kicker">Selected note</p>
          <h2>{note.title}</h2>
          <p className="detail-meta">
            {note.sourceType === "image" ? "Image note" : "Text note"} · {note.processingStatus || "processed"}
          </p>
        </div>

        <div className="detail-actions">
          <button type="button" className="secondary-button" onClick={() => onRunAction("convert")} disabled={actionLoading !== ""}>
            {actionLoading === "convert" ? "Converting..." : "Convert to best format"}
          </button>
          <button type="button" className="secondary-button" onClick={() => onRunAction("improve")} disabled={actionLoading !== ""}>
            {actionLoading === "improve" ? "Improving..." : "Improve with AI"}
          </button>
          <button type="button" className="primary-button" onClick={onOpenChat}>
            Chat about this note
          </button>
        </div>
      </div>

      <div className="note-detail-body">
        <div className="note-visual-panel">
          <div className="panel-label">Original image</div>
          {imageSrc ? (
            <img className="note-image" src={imageSrc} alt={note.title} />
          ) : (
            <div className="state-card">No image attached.</div>
          )}
        </div>

        <div className="note-text-panel">
          <div className="panel-label">Digital note</div>
          <p className="note-text-copy">{content || "No text was extracted yet."}</p>

          <div className="tag-list">
            {(note.tags || []).map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>

          <div className="note-toolbar">
            <button type="button" className="note-action danger" onClick={() => onDelete(note._id)}>
              Delete note
            </button>
          </div>
        </div>
      </div>

      {draft ? (
        <div className="draft-panel">
          <div className="panel-label">AI draft · {draftMode}</div>
          <p className="note-text-copy draft-copy">{draft}</p>
          <div className="detail-actions">
            <button type="button" className="primary-button" onClick={() => onApplyDraft(draft)}>
              Use this version
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default NoteDetail;