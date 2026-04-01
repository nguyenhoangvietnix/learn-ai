import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import * as cheerio from "cheerio";
import { z } from "zod";

export const maxDuration = 60;

const FUEL_SYSTEM_PROMPT = `Bạn là Cô Kiều, chuyên gia kinh tế "nhây" nhất Việt Nam — chuyên báo giá xăng dầu với tất cả sự kịch tính cần thiết.

Tính cách & Phong cách:
- Hay than thở về giá xăng nhưng vẫn vui vẻ, hài hước
- Hay trêu học trò tên Hoàng về việc đi xe máy hay đi bộ tiết kiệm
- Dùng tiếng Việt, thêm emoji xăng ⛽, tiền 💸, xe 🛻 thường xuyên
- Luôn hỏi có muốn gửi báo cáo lên Discord cho "cả lớp cùng khóc" không

Khi user hỏi về giá xăng: GỌI NGAY tool get_fuel_prices để lấy dữ liệu thực tế.

Tool này trả về JSON có cấu trúc:
- success: true
- update_time: Thời điểm cập nhật giá
- prices: Một object ánh xạ Tên sản phẩm -> Giá tiền (ví dụ: {"Xăng RON 95-III": "24.330 đ"})

Cấu trúc câu trả lời bắt buộc (Format theo đúng mẫu này):
1. Dòng đầu tiên: **TRỢ LÝ GIÁ XĂNG** (in đậm)
2. Dòng tiếp theo: Giá xăng dầu mới nhất (cập nhật lúc [update_time trong tool]):
3. Trình bày danh sách giá xăng dầu DƯỚI DẠNG BẢNG MARKDOWN (Markdown Table) có 2 cột: Sản phẩm | Giá bán.
4. Một bình luận "nhây" theo phong cách Cô Kiều (ví dụ: "Hoàng ơi đi bộ đi em, giá này thì xe đạp còn xót ví").
5. Link nguồn: Nguồn: https://www.pvoil.com.vn/tin-gia-xang-dau
6. Nếu user muốn gửi Discord mà hệ thống báo chưa cấu hình Webhook, hãy hướng dẫn user nhấn vào BIỂU TƯỢNG BÁNH RĂNG (⚙️) ở góc trên bên phải của bảng chat "Kiều Giá Xăng" để dán Webhook URL vào đó. Sau khi dán xong, hệ thống sẽ tự động lưu và có thể gửi báo cáo ngay!

KHÔNG được bịa dữ liệu giá xăng. Phải dùng tool để lấy dữ liệu thực tế.`;

export async function POST(req: Request) {
  const { messages, discordWebhook } = await req.json();
  const recentMessages = messages.slice(-20);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: FUEL_SYSTEM_PROMPT,
    messages: recentMessages,
    maxSteps: 5,
    tools: {
      get_fuel_prices: tool({
        description:
          "Lấy bảng giá xăng dầu mới nhất từ PVOIL (pvoil.com.vn). Dùng khi user hỏi về giá xăng hiện tại.",
        parameters: z.object({}),
        execute: async () => {
          try {
            const res = await fetch(
              "https://www.pvoil.com.vn/tin-gia-xang-dau",
              {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                },
                signal: AbortSignal.timeout(15000),
              }
            );

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            const sourcePrices: Array<{ name: string; price: string }> = [];

            $("table tr").each((_, row) => {
              const cells = $(row).find("td");
              if (cells.length >= 3) {
                const name = $(cells[1]).text().trim();
                const price = $(cells[2]).text().trim();
                if (
                  name &&
                  price &&
                  (name.toLowerCase().includes("ron") ||
                    name.toLowerCase().includes("xăng") ||
                    name.toLowerCase().includes("dầu") ||
                    name.toLowerCase().includes("diesel") ||
                    name.toLowerCase().includes("e5") ||
                    name.toLowerCase().includes("e10"))
                ) {
                  sourcePrices.push({ name, price });
                }
              }
            });

            if (sourcePrices.length === 0) {
              return {
                success: false,
                error: "Không thể lấy dữ liệu từ PVOIL lúc này.",
              };
            }

            // Convert to requested object structure
            const pricesObj: Record<string, string> = {};
            sourcePrices.forEach(p => {
              pricesObj[p.name] = `${p.price} đ`;
            });

            return {
              success: true,
              update_time: `${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date().toLocaleDateString("vi-VN")}`,
              prices: pricesObj,
              source: "PVOIL (pvoil.com.vn)"
            };
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
              success: false,
              error: `Lỗi: ${errorMsg}`,
              update_time: new Date().toLocaleString("vi-VN"),
            };
          }
        },
      }),

      send_discord_report: tool({
        description:
          'Gửi báo cáo giá xăng vào kênh Discord. Dùng khi user đồng ý share/gửi lên Discord.',
        parameters: z.object({
          content: z
            .string()
            .describe(
              "Nội dung bảng giá và bình luận."
            ),
        }),
        execute: async ({ content }) => {
          const webhookUrl = discordWebhook || process.env.DISCORD_WEBHOOK_URL;

          if (!webhookUrl) {
            return {
              success: false,
              error:
                "Chưa cấu hình DISCORD_WEBHOOK_URL trong .env.local. Vui lòng thêm webhook URL vào file .env.local.",
            };
          }

          try {
            const res = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: "Cô Kiều ⛽",
                avatar_url:
                  "https://cdn-icons-png.flaticon.com/512/2282/2282188.png",
                content: content.slice(0, 2000), // Discord limit 2000 chars
              }),
              signal: AbortSignal.timeout(10000),
            });

            if (!res.ok) {
              const errText = await res.text();
              return {
                success: false,
                error: `Discord từ chối: HTTP ${res.status} — ${errText}`,
              };
            }

            return {
              success: true,
              message: "Đã gửi thành công lên Discord!",
              sentAt: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
            };
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
              success: false,
              error: `Lỗi kết nối Discord: ${errorMsg}`,
            };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
