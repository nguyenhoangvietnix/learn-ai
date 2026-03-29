# 👩‍🏫 Cô Minh English — AI Chatbot Bài Tập 1

> AI Chatbot dạy tiếng Anh hài hước với nhân cách "Cô Minh" — xây dựng bằng Next.js, Vercel AI SDK v4, và Ant Design.

## 🛠 Tech Stack

| Công nghệ | Mô tả |
|---|---|
| **Next.js 15** (App Router) | Framework React với routing hiện đại |
| **Vercel AI SDK v4** | Streaming AI responses, `useChat` hook |
| **@ai-sdk/openai** | OpenAI provider (GPT-4o-mini) |
| **Ant Design 5** | UI components (Tooltip, Icons) |
| **TypeScript** | Type safety |

## 🚀 Cách Chạy

### 1. Cài đặt Node.js
Tải và cài đặt Node.js (v18 trở lên) tại: https://nodejs.org/

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình API Key
Mở file `.env.local` và điền OpenAI API Key của bạn:
```env
OPENAI_API_KEY=sk-your_actual_api_key_here
```

> 🔑 Lấy API key tại: https://platform.openai.com/api-keys

### 4. Chạy development server
```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 📋 Mục Tiêu Bài Tập Đã Đạt Được

### ✅ System Prompt & Tính cách AI
- Cô Minh được cấu hình với tính cách hài hước, nhây, hay trêu chọc học viên
- Đan xen tiếng Anh - tiếng Việt tự nhiên
- File: `src/app/api/chat/route.ts`

### ✅ Chat History Management (Context Window)
- Giới hạn **20 tin nhắn gần nhất** bằng `messages.slice(-20)` 
- Hiển thị Context Indicator thanh tiến độ ở góc input
- File: `src/app/api/chat/route.ts` (server) + `src/app/page.tsx` (client)

### ✅ Vercel AI SDK + Streaming
- Dùng `streamText` ở server → streaming thời gian thực
- Dùng `useChat` hook ở client → tự động xử lý state
- Typing indicator animation khi AI đang trả lời

### ✅ UI với Ant Design
- Dùng `Tooltip` component, các `Icon` từ `@ant-design/icons`
- Kết hợp với custom CSS cho design premium, dark mode

---

## 🏗 Cấu Trúc Dự Án

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts    # AI API endpoint (System Prompt ở đây!)
│   ├── globals.css          # Toàn bộ styling (dark theme, animations)
│   ├── layout.tsx           # Root layout + Google Fonts
│   └── page.tsx             # Main chat UI component
└── .env.local               # API Key (không commit!)
```

## 🎨 Tính Năng Nổi Bật

- 🌑 **Dark Mode Premium** — Glassmorphism, gradient, glow effects
- ⚡ **Streaming Real-time** — Tin nhắn xuất hiện từng chữ như ChatGPT
- 📊 **Context Indicator** — Thanh tiến độ hiển thị mức dùng context window
- 💡 **Quick Prompts** — Gợi ý câu hỏi nhanh khi mới bắt đầu
- ⌨️ **Auto-resize Textarea** — Ô nhập tự động mở rộng theo nội dung
- 🔄 **Clear Chat** — Reset cuộc trò chuyện dễ dàng
