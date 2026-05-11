export const fetchNotes= async(query="") => {
    const res= await fetch(`http://localhost:3000/notes${query}`);
    return res.json();
};