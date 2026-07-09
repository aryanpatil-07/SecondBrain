import { useState } from "react";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";

function App() {
  const [activePage, setActivePage]     = useState("notes");
  const [selectedNote, setSelectedNote] = useState(null);
  const [prefillTopic, setPrefillTopic] = useState("");

  const openChat = () => {
    setPrefillTopic("");
    setActivePage("chat");
  };

  // Called from flowchart node click: switches to chat with a pre-filled question
  const openChatWithTopic = (topicLabel, note) => {
    setSelectedNote(note);
    setPrefillTopic(`Explain "${topicLabel}" to me in the context of ${note.title}`);
    setActivePage("chat");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Second Brain</div>
          <p className="brand-subtitle">Notes, search, and chat in one workspace.</p>
        </div>
        <nav className="nav">
          <button
            className={activePage === "notes" ? "nav-pill active" : "nav-pill"}
            onClick={() => setActivePage("notes")}
          >
            Notes
          </button>
          <button
            className={activePage === "chat" ? "nav-pill active" : "nav-pill"}
            onClick={() => setActivePage("chat")}
          >
            Chat
          </button>
        </nav>
      </header>

      {activePage === "notes" ? (
        <Home
          selectedNote={selectedNote}
          setSelectedNote={setSelectedNote}
          openChat={openChat}
          openChatWithTopic={openChatWithTopic}
        />
      ) : (
        <ChatPage
          selectedNote={selectedNote}
          prefillTopic={prefillTopic}
          onPrefillUsed={() => setPrefillTopic("")}
        />
      )}
    </div>
  );
}

export default App;
