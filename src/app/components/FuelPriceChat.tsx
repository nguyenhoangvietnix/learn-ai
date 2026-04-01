"use client";

import {
  CheckCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useChat } from "ai/react";
import { Input, Modal, Tooltip } from "antd";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
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

function ToolInvocationView({ tool }: { tool: any }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const toolName = tool.toolName === "get_fuel_prices" ? "gia_xang" : tool.toolName;

  return (
    <div className={`fuel-tool-invocation ${isExpanded ? "expanded" : ""}`}>
      <div className="fuel-tool-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="fuel-tool-header-left">
          <span className="fuel-tool-status-icon">
            <CheckCircleOutlined />
          </span>
          <span className="fuel-tool-name">{toolName}</span>
        </div>
        <span className="fuel-tool-expand-icon">
          <UpOutlined />
        </span>
      </div>

      {isExpanded && (
        <div className="fuel-tool-body">
          {Object.keys(tool.args).length > 0 && (
            <div className="fuel-tool-section">
              <div className="fuel-tool-label">INPUT</div>
              <div className="fuel-tool-json-container">
                <pre className="fuel-tool-json">
                  {JSON.stringify(tool.args, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {"result" in tool && (
            <div className="fuel-tool-section">
              <div className="fuel-tool-label">OUTPUT</div>
              <div className="fuel-tool-json-container">
                <pre className="fuel-tool-json">
                  {JSON.stringify(tool.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FuelPriceChat() {
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedWebhook = localStorage.getItem("fuelChatDiscordWebhook");
    if (savedWebhook) {
      setDiscordWebhook(savedWebhook);
    }
  }, []);

  // Save to localStorage when changed
  const handleWebhookChange = (val: string) => {
    setDiscordWebhook(val);
    localStorage.setItem("fuelChatDiscordWebhook", val);
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } =
    useChat({
      api: "/api/fuel",
      body: { discordWebhook },
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
          <Tooltip title="Cấu hình Discord">
            <button
              className="fuel-header-btn"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Cài đặt Discord"
            >
              <SettingOutlined />
            </button>
          </Tooltip>
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

      {/* Settings Modal */}
      <Modal
        title="Cấu hình Discord"
        open={isSettingsOpen}
        onOk={() => setIsSettingsOpen(false)}
        onCancel={() => setIsSettingsOpen(false)}
        footer={[
          <div key="footer-wrap" style={{ textAlign: 'right', width: '100%' }}>
            <button 
              className="fuel-send-btn" 
              style={{ 
                borderRadius: '8px', 
                padding: '8px 24px', 
                width: 'auto', 
                height: 'auto',
                fontSize: '14px',
                display: 'inline-flex'
              }} 
              onClick={() => setIsSettingsOpen(false)}
            >
              Lưu lại
            </button>
          </div>
        ]}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            Nhập Webhook URL của bạn để Cô Kiều có thể gửi báo cáo vào lớp nhé!
          </p>
          <Input
            placeholder="https://discord.com/api/webhooks/..."
            value={discordWebhook}
            onChange={(e) => handleWebhookChange(e.target.value)}
          />
        </div>
      </Modal>

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
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const timestamp = msgTimestamps.current.get(msg.id);

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

                {/* Render Tool Invocations if any */}
                {!isUser && msg.toolInvocations?.map((toolInvocation) => (
                  <ToolInvocationView key={toolInvocation.toolCallId} tool={toolInvocation} />
                ))}

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
          
        </div>
      </div>
    </div>
  );
}
