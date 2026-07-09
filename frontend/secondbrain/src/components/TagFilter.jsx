import { useState } from "react";

const TagFilter = ({ selectedTag, setSelectedTag, noteTags = [] }) => {
  const [inputValue, setInputValue] = useState("");
  const [customTags, setCustomTags] = useState([]);

  // Merge note tags with custom typed tags, deduplicated
  const allTags = [...new Set([...noteTags, ...customTags])];

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase().replace(/,/g, "");
      if (newTag && !allTags.includes(newTag)) {
        setCustomTags((prev) => [...prev, newTag]);
      }
      setSelectedTag(newTag);
      setInputValue("");
    }
  };

  return (
    <div className="tag-filter-wrapper">
      <div className="tag-input-row">
        <input
          type="text"
          className="tag-type-input"
          placeholder="Type a tag and press Enter…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={selectedTag === tag ? "tag active" : "tag"}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTag && (
            <button className="tag clear" onClick={() => setSelectedTag("")}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
