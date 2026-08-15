"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "住宿費可以申請多少？",
  "高鐵商務車廂可以報帳嗎？",
  "報帳期限是多久？",
  "家人一起出差的費用可以報帳嗎？",
];

// 把回覆中的〔來源：...〕標註加上樣式
function renderWithCitations(text) {
  const parts = text.split(/(〔來源：[^〕]*〕)/g);
  return parts.map((part, i) =>
    part.startsWith("〔來源：") ? (
      <span className="cite" key={i}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "發生未知錯誤");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setErrorMsg(err.message || "連線失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    // 避免中文/日文等輸入法組字選字時，按 Enter 確認候選字被誤判成送出訊息
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-mark">D</div>
        <div className="header-text">
          <div className="header-title">差旅小幫手</div>
          <div className="header-sub">DAXIN TECHNOLOGY · TRAVEL POLICY BOT</div>
        </div>
      </header>

      <div className="source-strip">
        <span>
          <b>正式依據：</b>員工差旅管理辦法 2026年版（生效 2026-01-01）
        </span>
        <span>
          <b>輔助參考：</b>差旅常見問題FAQ 2025年版（文件日期 2025-06-01）
        </span>
      </div>

      <main className="chat-scroll" ref={scrollRef}>
        <div className="chat-column">
          {messages.length === 0 && (
            <div className="empty-state">
              <h2>有差旅報帳的問題嗎？</h2>
              <p>
                本機器人僅依據《員工差旅管理辦法（2026年版）》與《差旅常見問題FAQ（2025年版）》兩份文件回答，
                每個答案都會標明條號來源。若兩份文件規定不一致，會主動提醒並以正式管理辦法為準。
              </p>
              <div className="suggestion-list">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion-btn"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div className={`msg-row ${m.role}`} key={i}>
              <div className={`bubble ${m.role}`}>
                <span className="role-tag">
                  {m.role === "user" ? "我" : "差旅小幫手"}
                </span>
                {m.role === "assistant" ? renderWithCitations(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row assistant">
              <div className="bubble assistant">
                <span className="role-tag">差旅小幫手</span>
                <span className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}

          {errorMsg && <div className="error-note">⚠ {errorMsg}</div>}
        </div>
      </main>

      <div className="composer-wrap">
        <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
          <div className="composer">
            <textarea
              rows={1}
              placeholder="輸入差旅報帳相關問題，Enter 送出、Shift+Enter 換行…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              送出
            </button>
          </div>
          <div className="disclaimer">
            回答僅依據上傳之兩份文件，如資料庫無相關規定將明確告知，實際請以行政部門認定為準。
          </div>
        </div>
      </div>
    </div>
  );
}
