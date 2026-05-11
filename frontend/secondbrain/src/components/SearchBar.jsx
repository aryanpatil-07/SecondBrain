const SearchBar=({searchQuery,setSearchQuery}) => {
    return(
        <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}/>
    );
};

export default SearchBar;