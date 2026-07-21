import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function Chat() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [subjectContext, setSubjectContext] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Load history on mount
    api
      .getChatHistory(token)
      .then((history) => {
        setMessages(history.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userMsg = { role: "user", content: inputVal };
    const msgText = inputVal;
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const payload = {
        message: msgText,
        subjectContext: subjectContext
          ? subjectContext.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await api.sendChatMessage(payload, token);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again. " + err.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">Instant academic assistance</span>
          <h1>Study AI Assistant</h1>
        </div>

        <div className="chat-layout-container">
          <div className="card chat-context-card">
            <div className="field" style={{ margin: 0 }}>
              <label>Define Study Context (optional, e.g. "Physics, Biology")</label>
              <input
                placeholder="Limits AI answers to these subjects..."
                value={subjectContext}
                onChange={(e) => setSubjectContext(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-shell">
            <div className="chat-messages">
              {loadingHistory ? (
                <p className="spinner-text">Retrieving chat history…</p>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <h3>Ask me anything</h3>
                  <p>Ask a doubt, ask to explain a topic, or request study tips.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role}`}>
                    <div className="chat-bubble-text" style={{ whiteSpace: "pre-line" }}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="chat-bubble assistant loading-bubble">
                  <span className="spinner-text">Thinking…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-row">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask your study question..."
                disabled={loading}
                required
              />
              <button type="submit" className="chat-send-btn" disabled={loading}>
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
