import { useEffect, useState } from "react";
import { createChat, getChat, sendChatMessage } from "../services/api";

export default function ChatPage() {
  const [chatId, setChatId] = useState(() => localStorage.getItem("chatId") || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) {
      createChat().then(res => {
        const id = res.data._id;
        setChatId(id);
        localStorage.setItem("chatId", id);
        setMessages(res.data.messages || []);
      }).catch(console.error);
    } else {
      getChat(chatId).then(res => setMessages(res.data.messages || [])).catch(console.error);
    }
  }, [chatId]);

  const send = async () => {
    if (!input.trim() || !chatId) return;
    const userMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChatMessage(chatId, input.trim());
      const answer = res.data.answer;
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
      // Optionally show error to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div style={{border:"1px solid #ddd", padding:12, height:400, overflow:"auto"}}>
        {messages.map((m, i) => (
          <div key={i} style={{margin:8}}>
            <b>{m.role === "user" ? "You" : "Assistant"}:</b> {m.content}
          </div>
        ))}
      </div>
      <div style={{marginTop:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask something..." style={{width:"70%"}} />
        <button onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}