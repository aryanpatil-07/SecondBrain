import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createChat, getChat, sendChatMessage } from "../services/api";

const ChatPage = ({ selectedNote, prefillTopic, onPrefillUsed }) => {
  const [chats, setChats]               = useState({}); // { noteId: chatId }
  const [noteTitles, setNoteTitles]     = useState({}); // { noteId: title }
  const [currentChatId, setCurrentChatId] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState("");
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const bottomRef                       = useRef(null);
  const sentPrefillRef                  = useRef(false);

  // Load all existing chats from localStorage on initial mount
  useEffect(() => {
    const loadAllChats = async () => {
      try {
        setSidebarLoading(true);
        const storedChats = localStorage.getItem("noteChats");
        
        if (storedChats) {
          const chatsData = JSON.parse(storedChats);
          setChats(chatsData.chats || {});
          setNoteTitles(chatsData.titles || {});
          
          // Auto-load the first chat if available
          const firstNoteId = Object.keys(chatsData.chats || {})[0];
          if (firstNoteId) {
            const chatId = chatsData.chats[firstNoteId];
            setCurrentChatId(chatId);
            setCurrentNoteId(firstNoteId);
            try {
              const res = await getChat(chatId);
              setMessages(res.messages || []);
            } catch (error) {
              console.error("Error loading chat:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading chats from localStorage:", error);
      } finally {
        setSidebarLoading(false);
      }
    };

    loadAllChats();
  }, []);

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(chats).length > 0) {
      localStorage.setItem("noteChats", JSON.stringify({ chats, titles: noteTitles }));
    }
  }, [chats, noteTitles]);

  // Initialize or switch to a note's chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!selectedNote?._id) return;

      // Check if we already have a chat for this note
      const existingChatId = chats[selectedNote._id];
      
      if (existingChatId) {
        // Load existing chat
        setCurrentChatId(existingChatId);
        setCurrentNoteId(selectedNote._id);
        try {
          const res = await getChat(existingChatId);
          setMessages(res.messages || []);
        } catch (error) {
          console.error("Error loading chat:", error);
        }
      } else {
        // Create new chat for this note
        try {
          const res = await createChat(selectedNote._id);
          const newChatId = res._id;
          setChats((prev) => {
            const updated = { ...prev, [selectedNote._id]: newChatId };
            return updated;
          });
          setNoteTitles((prev) => {
            const updated = { ...prev, [selectedNote._id]: selectedNote.title };
            return updated;
          });
          setCurrentChatId(newChatId);
          setCurrentNoteId(selectedNote._id);
          setMessages(res.messages || []);
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      }
    };

    initializeChat();
  }, [selectedNote?._id]);

  // Handle prefill topic - send once when ready
  useEffect(() => {
    if (prefillTopic && currentChatId && !sentPrefillRef.current) {
      sentPrefillRef.current = true;
      setInput(prefillTopic);
      // Send immediately (not via setTimeout to avoid double-send)
      sendMessageNow(prefillTopic);
      onPrefillUsed?.();
    }
  }, [prefillTopic, currentChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageNow = async (text) => {
    const msg = text.trim();
    if (!msg || !currentChatId) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    try {
      const res = await sendChatMessage(currentChatId, msg, currentNoteId || null);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageNow(input);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 0, height: "calc(100vh - 120px)" }}>
      {/* Left Sidebar - Chat List */}
      <div style={{
        background: "var(--panel-2)",
        border: "1px solid var(--border)",
        borderRadius: "16px 0 0 16px",
        padding: "24px 18px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div>
          <p style={{ 
            fontSize: "0.72rem", 
            fontWeight: 700, 
            letterSpacing: "0.08em", 
            textTransform: "uppercase", 
            color: "var(--muted)", 
            margin: 0,
          }}>
            Note Conversations
          </p>
        </div>

        {Object.keys(chats).length === 0 ? (
          <div style={{ 
            fontSize: "0.85rem", 
            color: "var(--muted)",
            textAlign: "center",
            padding: "20px 0",
          }}>
            {sidebarLoading ? "Loading chats..." : "No chats yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(chats).map(([noteId, chatId]) => {
              const isActive = currentChatId === chatId;
              const title = noteTitles[noteId] || `Note ${noteId.slice(0, 8)}...`;
              return (
                <button
                  key={noteId}
                  onClick={() => {
                    setCurrentChatId(chatId);
                    setCurrentNoteId(noteId);
                    // Load messages for this chat
                    getChat(chatId).then(res => setMessages(res.messages || []));
                  }}
                  style={{
                    padding: "12px 14px",
                    background: isActive ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)",
                    border: isActive ? "1.5px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: isActive ? "#c4b5fd" : "var(--text-2)",
                    transition: "all 0.18s ease",
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = "rgba(139,92,246,0.1)";
                      e.target.style.borderColor = "rgba(139,92,246,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = isActive ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)";
                    e.target.style.borderColor = isActive ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)";
                  }}
                >
                  {title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column - Main Chat Area */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "0 16px 16px 0",
        background: "var(--panel)",
        border: "1px solid var(--border-2)",
      }}>
        {/* Chat Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
        }}>
          <h1 style={{ 
            fontSize: "1.8rem", 
            fontWeight: 800, 
            margin: "0 0 4px", 
            letterSpacing: "-0.03em",
          }}>
            Chat
          </h1>
          <p style={{ 
            fontSize: "0.88rem", 
            color: "var(--muted)", 
            margin: 0,
          }}>
            {noteTitles[currentNoteId] ? `Chatting about: ${noteTitles[currentNoteId]}` : "Select a note to start chatting"}
          </p>
        </div>

        {/* Chat Messages Window */}
        <div style={{
          flex: 1,
          minHeight: "500px",
          maxHeight: "calc(100vh - 320px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          padding: "24px 28px",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border-2) transparent",
        }}>
          {messages.length === 0 ? (
            <div style={{
              padding: "40px 24px",
              background: "rgba(255,255,255,0.015)",
              border: "1px dashed var(--border-2)",
              borderRadius: "12px",
              color: "var(--muted)",
              fontSize: "0.9rem",
              textAlign: "center",
              lineHeight: 1.6,
            }}>
              Start a conversation — ask anything about your notes.
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "4px",
                }}
              >
                <div 
                  style={{
                    maxWidth: msg.role === "user" ? "74%" : "84%",
                    padding: msg.role === "user" ? "16px 22px" : "18px 24px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    lineHeight: 1.8,
                    fontSize: msg.role === "user" ? "0.95rem" : "0.96rem",
                    background: msg.role === "user" ? "var(--accent-dim)" : "var(--panel-2)",
                    border: msg.role === "user" ? "1px solid var(--accent-glow)" : "1px solid var(--border-2)",
                    color: "var(--text)",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div 
                      className="markdown-body"
                      style={{
                        color: "inherit",
                        fontSize: "inherit",
                        lineHeight: "inherit",
                      }}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 style={{marginTop: "1.4em", marginBottom: "0.6em", fontSize: "1.55rem"}} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{marginTop: "1.3em", marginBottom: "0.5em", fontSize: "1.3rem"}} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{marginTop: "1.2em", marginBottom: "0.4em", fontSize: "1.1rem"}} {...props} />,
                          p: ({node, ...props}) => <p style={{margin: "0.8em 0"}} {...props} />,
                          ul: ({node, ...props}) => <ul style={{paddingLeft: "1.8em", margin: "0.8em 0 1em"}} {...props} />,
                          ol: ({node, ...props}) => <ol style={{paddingLeft: "1.8em", margin: "0.8em 0 1em"}} {...props} />,
                          li: ({node, ...props}) => <li style={{margin: "0.5em 0", lineHeight: "1.7"}} {...props} />,
                          blockquote: ({node, ...props}) => <blockquote style={{borderLeft: "4px solid #8b5cf6", margin: "1.2em 0", padding: "12px 0 12px 18px", fontStyle: "italic", background: "rgba(139,92,246,0.05)", borderRadius: "0 6px 6px 0"}} {...props} />,
                          code: ({node, ...props}) => <code style={{background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd", padding: "3px 8px", borderRadius: "5px", fontSize: "0.88em"}} {...props} />,
                          pre: ({node, ...props}) => <pre style={{background: "#1c2029", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "16px 18px", overflow: "auto", margin: "1.2em 0"}} {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
            }}>
              <div style={{
                padding: "18px 24px",
                background: "var(--panel-2)",
                borderRadius: "18px 18px 18px 4px",
                border: "1px solid var(--border-2)",
              }}>
                <div style={{
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <span 
                      key={i}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "var(--muted)",
                        animation: `typing-bounce 1.2s infinite ease-in-out`,
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Chat Input */}
        <div style={{
          padding: "20px 28px",
          borderTop: "1px solid var(--border)",
          background: "var(--panel)",
          borderRadius: "0 0 16px 0",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "12px",
        }}>
          <input
            type="text"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            style={{
              width: "100%",
              background: "var(--panel-2)",
              border: "1.5px solid var(--border-2)",
              color: "var(--text)",
              padding: "13px 18px",
              borderRadius: "999px",
              outline: "none",
              fontSize: "0.93rem",
              transition: "border-color 0.2s ease",
              cursor: "text",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
              e.target.style.boxShadow = "0 0 0 3px var(--accent-dim)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border-2)";
              e.target.style.boxShadow = "none";
            }}
          />
          <button 
            className="primary-button" 
            onClick={sendMessage} 
            disabled={loading}
            style={{
              minWidth: "80px",
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-7px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
