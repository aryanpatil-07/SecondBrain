const tags= ["react", "forntend", "mern", "backend", "ai", "javascript"];

const TagFilter=({selectedTag,setSelectedTag}) => {
    return(
        <div>
            {
                tags.map((tag) => (
                    <button key={tag} onClick={() => setSelectedTag(tag)}>
                        {tag}
                    </button>
                ))
            };

            <button onClick={() => setSelectedTag("")}>clear</button>
        </div>
    );
};

export default TagFilter;