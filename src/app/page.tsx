"use client";

import {
  BookOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useChat } from "ai/react";
import { Tooltip } from "antd";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import FuelPriceChat from "./components/FuelPriceChat";
import VocabDictionary from "./components/VocabDictionary";

// Sidebar nav items
const NAV_ITEMS = [
  {
    id: "chat",
    icon: <MessageOutlined />,
    label: "Cô Minh English",
    badge: "AI",
  },
  {
    id: "vocab",
    icon: <BookOutlined />,
    label: "Từ điển Cô Lành",
    badge: null,
  },
  {
    id: "fuel",
    icon: <ThunderboltOutlined />,
    label: "Kiều Giá Xăng ⛽",
    badge: "Tools",
  },
];

// Header config per tab
const HEADER_CONFIG: Record<string, { name: string; status: string; avatar: string }> = {
  chat: { name: "Cô Minh", status: "● Đang trực tuyến", avatar: "👩‍🏫" },
  vocab: { name: "Cô Lành", status: "● Từ điển AI", avatar: "📖" },
  fuel: { name: "Cô Kiều ⛽", status: "● Giá xăng thời gian thực", avatar: "⛽" },
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("chat");

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({ api: "/api/chat" });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [msgTimestamps] = useState<Map<string, Date>>(new Map());

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Track timestamps for new messages
  useEffect(() => {
    messages.forEach((msg) => {
      if (!msgTimestamps.has(msg.id)) {
        msgTimestamps.set(msg.id, new Date());
      }
    });
  }, [messages, msgTimestamps]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleClearChat = () => setMessages([]);

  const headerCfg = HEADER_CONFIG[activeTab];

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">📚</div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-title">English Hub</span>
            <span className="sidebar-brand-sub">Học tiếng Anh cùng AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Bài tập</div>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              id={`nav-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab(item.id)}
              onKeyDown={(e) => e.key === "Enter" && setActiveTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.label}</span>
              {item.badge && (
                <span className="nav-item-badge">{item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-hint">
            <strong>💡 Mẹo:</strong> Nhấn{" "}
            <kbd style={{ background: "rgba(124,58,237,0.2)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 10 }}>
              Enter
            </kbd>{" "}
            để gửi,{" "}
            <kbd style={{ background: "rgba(124,58,237,0.2)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 10 }}>
              Shift+Enter
            </kbd>{" "}
            để xuống dòng
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {/* Shared Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="teacher-avatar">
              <div className="teacher-avatar-img">{headerCfg.avatar}</div>
              <div className="teacher-status-dot" />
            </div>
            <div className="teacher-info">
              <span className="teacher-name">{headerCfg.name}</span>
              <span className="teacher-status">{headerCfg.status}</span>
            </div>
          </div>
          <div className="chat-header-right">
            {activeTab === "chat" && (
              <Tooltip title="Bắt đầu cuộc trò chuyện mới">
                <button
                  className="header-btn"
                  onClick={handleClearChat}
                  id="btn-clear-chat"
                  aria-label="Xóa lịch sử chat"
                >
                  <ReloadOutlined />
                </button>
              </Tooltip>
            )}
            <Tooltip title="Thông tin">
              <button className="header-btn" id="btn-info" aria-label="Thông tin">
                <InfoCircleOutlined />
              </button>
            </Tooltip>
          </div>
        </header>

        {/* ===== TAB: CHAT ===== */}
        {activeTab === "chat" && (
          <>
            <div className="chat-window" id="chat-window" role="log" aria-live="polite">
              {/* Welcome banner */}
              {messages.length === 0 && (
                <div className="welcome-banner">
                  <div className="welcome-avatar">👩‍🏫</div>
                  <h1 className="welcome-title">
                    Chào mừng đến với <span>Cô Minh English!</span>
                  </h1>
                  <p className="welcome-desc">
                    Tui là Cô Minh — giáo viên tiếng Anh hài hước nhất vũ trụ! 😜
                    Cùng học tiếng Anh thật vui nào, Viết ơi!
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => {
                const isUser = message.role === "user";
                const timestamp = msgTimestamps.get(message.id);
                return (
                  <div
                    key={message.id}
                    className={`message-row ${isUser ? "user-row" : ""}`}
                    id={`msg-${message.id}`}
                  >
                    <div className={`msg-avatar ${isUser ? "user-avatar-bubble" : "ai-avatar"}`}>
                      {isUser ? "🙋" : "👩‍🏫"}
                    </div>
                    <div className="message-group">
                      <span className="message-sender">
                        {isUser ? "Viết (bạn)" : "Cô Minh"}
                      </span>
                      <div className={`message-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
                        {message.content}
                      </div>
                      {timestamp && (
                        <span className="message-time">{formatTime(timestamp)}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="message-row" id="typing-indicator">
                  <div className="msg-avatar ai-avatar">👩‍🏫</div>
                  <div className="message-group">
                    <span className="message-sender">Cô Minh</span>
                    <div className="typing-bubble">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="input-area">
              <form id="chat-form" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <textarea
                    ref={textareaRef}
                    id="chat-input"
                    className="chat-textarea"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi Cô Minh điều gì đó... ví dụ: 'Cô ơi, dạy tôi về Past Perfect đi!' 🙋"
                    rows={1}
                    aria-label="Nhập tin nhắn"
                    disabled={isLoading}
                  />
                  <Tooltip title={isLoading ? "Đang trả lời..." : "Gửi tin nhắn"}>
                    <button
                      type="submit"
                      id="btn-send"
                      className="send-btn"
                      disabled={isLoading || !input.trim()}
                      aria-label="Gửi"
                    >
                      <SendOutlined />
                    </button>
                  </Tooltip>
                </div>
              </form>
              <div className="input-footer">
                <span className="input-hint">
                  {messages.length > 0
                    ? `${messages.length} tin nhắn`
                    : "Bắt đầu cuộc trò chuyện!"}
                </span>
                <div className="context-indicator">
                  <span>Context: {Math.min(messages.length, 20)}/20</span>
                  <div className="context-bar">
                    <div
                      className="context-fill"
                      style={{ width: `${Math.min((messages.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== TAB: VOCAB ===== */}
        {activeTab === "vocab" && (
          <div className="vocab-tab-container">
            <VocabDictionary />
          </div>
        )}

        {/* ===== TAB: FUEL ===== */}
        {activeTab === "fuel" && (
          <FuelPriceChat />
        )}
      </main>
    </div>
  );
}
