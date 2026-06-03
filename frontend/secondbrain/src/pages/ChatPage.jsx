import { useEffect, useState } from "react";
import { createChat, getChat, sendChatMessage } from "../services/api";

const ChatPage = () => {
  const [chatId, setChatId] = useState(localStorage.getItem("chatId") || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      if (!chatId) {
        const res = await createChat();
        localStorage.setItem("chatId", res._id);
        setChatId(res._id);
        setMessages(res.messages || []);
      } else {
        const res = await getChat(chatId);
        setMessages(res.messages || []);
      }
    };

    initChat();
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await sendChatMessage(chatId, userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero">
        <h1>Chat</h1>
        <p>Ask questions from your notes with conversation memory.</p>
      </div>

      <div className="chat-shell">
        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="state-card">Start a conversation.</div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user" ? "message user" : "message assistant"
                }
              >
                {message.content}
              </div>
            ))
          )}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="primary-button" onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;