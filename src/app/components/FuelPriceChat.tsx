"use client";

import {
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useChat } from "ai/react";
import { Tooltip } from "antd";
import { KeyboardEvent, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUICK_CHIPS = [
  "⛽ Xăng hôm nay bao nhiêu?",
  "🛻 So sánh RON 95 và E5 RON 92",
  "📊 Báo giá đầy đủ cho tôi",
];

export default function FuelPriceChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } =
    useChat({
      api: "/api/fuel",
      maxSteps: 5,
    });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgTimestamps = useRef<Map<string, Date>>(new Map());

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (!msgTimestamps.current.has(msg.id)) {
        msgTimestamps.current.set(msg.id, new Date());
      }
    });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };


  return (
    <div className="fuel-chat-container">
      {/* Header */}
      <div className="fuel-header">
        <div className="fuel-header-left">
          <div className="fuel-avatar-wrap">
            <div className="fuel-avatar">⛽</div>
            <div className="fuel-status-dot" />
          </div>
          <div className="fuel-header-info">
            <span className="fuel-name">Cô Kiều ⛽</span>
            <span className="fuel-subtitle">● Chuyên gia giá xăng dầu AI</span>
          </div>
        </div>
        <div className="fuel-header-actions">
          <Tooltip title="Cuộc trò chuyện mới">
            <button
              className="fuel-header-btn"
              onClick={() => setMessages([])}
              id="btn-fuel-clear"
              aria-label="Xóa chat"
            >
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Chat window */}
      <div className="fuel-chat-window" id="fuel-chat-window" role="log" aria-live="polite">
        {/* Welcome */}
        {messages.length === 0 && (
          <div className="fuel-welcome">
            <div className="fuel-welcome-icon">
              <span>⛽</span>
              <div className="fuel-icon-glow" />
            </div>
            <h2 className="fuel-welcome-title">
              Chào mừng đến với <span>Cô Kiều Giá Xăng!</span>
            </h2>
            <p className="fuel-welcome-desc">
              Tui là Cô Kiều — chuyên gia đau khổ vì giá xăng nhất Việt Nam! 😭⛽
              <br />
              Hỏi tui về giá xăng, tui sẽ đi lấy dữ liệu thực từ PVOIL ngay!
            </p>

            {/* Tool badges */}
            <div className="fuel-tool-badges">
              <div className="fuel-tool-badge">
                <ThunderboltOutlined />
                <span>get_fuel_prices</span>
              </div>
              <div className="fuel-tool-badge">
                <span>🔔</span>
                <span>send_discord_report</span>
              </div>
            </div>

            {/* Quick chips */}
            <div className="fuel-quick-chips">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className="fuel-chip"
                  onClick={() => {
                    setInput(chip);
                    const formEl = document.getElementById("fuel-chat-form") as HTMLFormElement | null;
                    if (formEl) {
                      setTimeout(() => formEl.requestSubmit(), 80);
                    }
                  }}
                  disabled={isLoading}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const timestamp = msgTimestamps.current.get(msg.id);

          // Skip tool / tool-result messages — they're internal
          if (!msg.content && !msg.parts?.length) return null;

          // Show tool invocation indicator for assistant messages containing tool calls
          const hasToolCall = msg.parts?.some((p: { type: string }) => p.type === "tool-invocation");

          return (
            <div
              key={msg.id}
              className={`fuel-msg-row ${isUser ? "fuel-user-row" : ""}`}
              id={`fuel-msg-${msg.id}`}
            >
              <div className={`fuel-msg-avatar ${isUser ? "fuel-user-avatar" : "fuel-ai-avatar"}`}>
                {isUser ? "🙋" : "⛽"}
              </div>
              <div className="fuel-msg-group">
                <span className="fuel-msg-sender">
                  {isUser ? "Hoàng (bạn)" : "Cô Kiều"}
                </span>


                {msg.content && (
                  <div className={`fuel-msg-bubble ${isUser ? "fuel-user-bubble" : "fuel-ai-bubble"}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {timestamp && (
                  <span className="fuel-msg-time">{formatTime(timestamp)}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Processing Spinner (While tool is calling or initial wait) */}
        {isLoading && !messages[messages.length - 1]?.content && (
          <div className="fuel-processing-row">
            <div className="fuel-msg-avatar fuel-ai-avatar">⛽</div>
            <div className="fuel-msg-group">
              <span className="fuel-msg-sender">Cô Kiều</span>
              <div className="fuel-processing-card">
                <div className="fuel-spinner-large" />
                <span>Đang xử lý dữ liệu...</span>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator (Only show briefly between chunks or if streaming is slow) */}
        {isLoading && messages[messages.length - 1]?.content && (
          <div className="fuel-msg-row" id="fuel-typing">
            <div className="fuel-msg-avatar fuel-ai-avatar">⛽</div>
            <div className="fuel-msg-group">
              <span className="fuel-msg-sender">Cô Kiều</span>
              <div className="fuel-typing-bubble">
                <div className="fuel-typing-dot" />
                <div className="fuel-typing-dot" />
                <div className="fuel-typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="fuel-input-area">
        <form id="fuel-chat-form" onSubmit={handleSubmit}>
          <div className="fuel-input-wrapper">
            <textarea
              ref={textareaRef}
              id="fuel-chat-input"
              className="fuel-textarea"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi Cô Kiều về giá xăng... ví dụ: 'xăng hôm nay bao nhiêu?' ⛽"
              rows={1}
              aria-label="Nhập câu hỏi về giá xăng"
              disabled={isLoading}
            />
            <Tooltip title={isLoading ? "Đang xử lý..." : "Gửi"}>
              <button
                type="submit"
                id="btn-fuel-send"
                className="fuel-send-btn"
                disabled={isLoading || !input.trim()}
                aria-label="Gửi"
              >
                <SendOutlined />
              </button>
            </Tooltip>
          </div>
        </form>
        <div className="fuel-input-footer">
          <span className="fuel-input-hint">
            {messages.length > 0
              ? `${messages.length} tin nhắn`
              : "Bắt đầu hỏi về giá xăng!"}
          </span>
          <div className="fuel-powered-badge">
            <ThunderboltOutlined />
            <span>AI Tools: get_fuel_prices + send_discord_report</span>
          </div>
        </div>
      </div>
    </div>
  );
}
