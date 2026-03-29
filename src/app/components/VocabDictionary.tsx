"use client";

import {
  AudioOutlined,
  BookOutlined,
  BulbOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  message,
  Skeleton,
  Tag,
  Typography
} from "antd";
import { useState } from "react";
import type { VocabResult } from "../api/vocab/route";

const { Title, Text, Paragraph } = Typography;

const LEVEL_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; emoji: string }
> = {
  Dễ: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    emoji: "🟢",
  },
  "Trung bình": {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    emoji: "🟡",
  },
  Khó: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    emoji: "🔴",
  },
};

const EXAMPLE_WORDS = [
  "serendipity",
  "resilience",
  "eloquent",
  "procrastinate",
  "ephemeral",
  "tenacious",
];

export default function VocabDictionary() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabResult | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSearch = async (searchWord?: string) => {
    const target = (searchWord ?? word).trim();
    if (!target) {
      messageApi.warning("Nhập từ vào đi bạn ơi! 🙄");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: target }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        messageApi.error(json.error ?? "Có lỗi xảy ra, thử lại nhé!");
        return;
      }

      setResult(json.data);
    } catch {
      messageApi.error("Mạng bị lag rồi bạn ơi! Thử lại sau nhé 😭");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleExampleClick = (w: string) => {
    setWord(w);
    handleSearch(w);
  };

  const levelCfg = result ? LEVEL_CONFIG[result.level] : null;

  return (
    <div className="vocab-page">
      {contextHolder}

      {/* Header */}
      <div className="vocab-header">
        <div className="vocab-header-icon">📖</div>
        <div>
          <h1 className="vocab-title">Từ Điển Cô Lành</h1>
          <p className="vocab-subtitle">
            Tra từ vựng tiếng Anh với AI hài hước — guaranteed nhớ ngay! 🎯
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="vocab-search-box">
        <Input
          id="vocab-input"
          size="large"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập một từ tiếng Anh... (VD: resilience, ephemeral)"
          prefix={<SearchOutlined style={{ color: "var(--primary-light)" }} />}
          suffix={
            <Button
              id="vocab-search-btn"
              type="primary"
              loading={loading}
              onClick={() => handleSearch()}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                border: "none",
                borderRadius: 8,
              }}
            >
              Tra ngay
            </Button>
          }
          style={{
            background: "var(--bg-input)",
            border: "1.5px solid var(--border-medium)",
            borderRadius: 12,
            color: "var(--text-primary)",
            fontSize: 15,
          }}
        />

        {/* Example words */}
        <div className="vocab-examples">
          <span className="vocab-examples-label">Thử ngay:</span>
          {EXAMPLE_WORDS.map((w) => (
            <button
              key={w}
              className="vocab-example-chip"
              onClick={() => handleExampleClick(w)}
              id={`example-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="vocab-result-area">
          <Card
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
            }}
          >
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      )}

      {/* Result */}
      {!loading && result && levelCfg && (
        <div className="vocab-result-area" id="vocab-result">
          {/* Main word card */}
          <Card
            className="vocab-word-card"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            {/* Card top banner */}
            <div className="vocab-card-banner">
              <div className="vocab-card-banner-left">
                <Title
                  level={2}
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontFamily: "var(--font-ui)",
                    fontSize: 32,
                    fontWeight: 800,
                  }}
                >
                  {result.word}
                </Title>
                <div className="vocab-phonetic">
                  <AudioOutlined style={{ marginRight: 6, opacity: 0.8 }} />
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>
                    {result.phonetic}
                  </Text>
                </div>
              </div>
              <div className="vocab-card-banner-right">
                <Tag
                  id="vocab-level-tag"
                  style={{
                    background: levelCfg.bg,
                    border: `1px solid ${levelCfg.border}`,
                    color: levelCfg.color,
                    borderRadius: 99,
                    padding: "4px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {levelCfg.emoji} {result.level}
                </Tag>
              </div>
            </div>

            {/* Meaning */}
            <div className="vocab-meaning-section">
              <div className="vocab-section-label">
                <BulbOutlined style={{ marginRight: 8 }} />
                Nghĩa (theo Cô Lành 😜)
              </div>
              <Paragraph
                style={{
                  color: "var(--text-primary)",
                  fontSize: 15,
                  lineHeight: 1.75,
                  margin: 0,
                  background: "rgba(124,58,237,0.06)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {result.meaning}
              </Paragraph>
            </div>

            {/* Example */}
            <div className="vocab-meaning-section">
              <div className="vocab-section-label">
                <ThunderboltOutlined style={{ marginRight: 8 }} />
                Câu ví dụ nhây bựa
              </div>
              <div className="vocab-example-block">
                <p className="vocab-example-en">&ldquo;{result.example}&rdquo;</p>
                <p className="vocab-example-vi">→ {result.example_vi}</p>
              </div>
            </div>
          </Card>

          {/* Details card */}
          <div className="vocab-details-grid">
            {/* Grammar notes */}
            <Card
              title={
                <span style={{ color: "var(--primary-light)", fontWeight: 700 }}>
                  📝 Ghi chú Ngữ pháp
                </span>
              }
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                flex: 1,
              }}
              headStyle={{
                background: "transparent",
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <ul className="vocab-grammar-list" id="vocab-grammar-list">
                {result.grammar_notes.map((note, i) => (
                  <li key={i} className="vocab-grammar-item">
                    <span className="vocab-grammar-num">{i + 1}</span>
                    <span style={{ color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6 }}>
                      {note}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Word family */}
            <Card
              title={
                <span style={{ color: "var(--primary-light)", fontWeight: 700 }}>
                  <BookOutlined style={{ marginRight: 8 }} />
                  Họ hàng của từ
                </span>
              }
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                flex: 1,
              }}
              headStyle={{
                background: "transparent",
                borderBottom: "1px solid var(--border-subtle)",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div className="vocab-family-tags" id="vocab-family-tags">
                {result.word_family.map((w, i) => (
                  <Tag
                    key={i}
                    style={{
                      background: "rgba(124,58,237,0.12)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-secondary)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 13,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                    onClick={() => handleExampleClick(w.split(" ")[0])}
                  >
                    {w}
                  </Tag>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div className="vocab-empty">
          <div className="vocab-empty-icon">📖</div>
          <p className="vocab-empty-text">
            Nhập một từ tiếng Anh và Cô Lành sẽ &quot;nặn&quot; ra giải thích siêu hài hước cho bạn! 😄
          </p>
        </div>
      )}
    </div>
  );
}
