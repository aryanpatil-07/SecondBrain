import { useState,useEffect } from "react";
import SearchBar from "../components/SearchBar";
import NoteCard from "../components/NoteCard";
import { fetchNotes } from "../services/api";
import TagFilter from "../components/TagFilter"

const Home=() => {
    const[searchQuery,setSearchQuery]= useState("");
    const [notes,setNotes]= useState([]);
    const [selectedTag,setSelectedTag]= useState("");

    useEffect(() => {

        const loadNotes= async() => {
            const params= new URLSearchParams();

        if(searchQuery){
            params.append("q",searchQuery);
        }
        if(selectedTag){
            params.append("tag",selectedTag);
        }
        const query=`?${params.toString()}`;

        const data= await fetchNotes(query);
        setNotes(data);
        }      
    

        loadNotes();
    }, [searchQuery,selectedTag]);

    return(
        <div>
            <h1>My Notes</h1>

            <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}/>
            <TagFilter
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}/>

            <div>
                {notes.map((note) => (
                    <NoteCard key={note._id} note={note}/>
                ))}
            </div>

        </div>

    );
};

export default Home;