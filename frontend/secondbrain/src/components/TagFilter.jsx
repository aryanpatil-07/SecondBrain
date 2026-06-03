const tags = ["react", "frontend", "mern", "backend", "ai", "javascript"];

const TagFilter = ({ selectedTag, setSelectedTag }) => {
  return (
    <div className="tag-filter">
      {tags.map((tag) => (
        <button
          key={tag}
          className={selectedTag === tag ? "tag active" : "tag"}
          onClick={() => setSelectedTag(tag)}
        >
          {tag}
        </button>
      ))}

      <button className="tag clear" onClick={() => setSelectedTag("")}>
        Clear
      </button>
    </div>
  );
};

export default TagFilter;