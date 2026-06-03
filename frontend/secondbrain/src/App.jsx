import { useState } from "react";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";

function App() {
  const [activePage, setActivePage] = useState("notes");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Second Brain</div>
          <p className="brand-subtitle">Notes, search, and chat in one clean workspace.</p>
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

      {activePage === "notes" ? <Home /> : <ChatPage />}
    </div>
  );
}

export default App;