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
Sau khi có dữ liệu: Trình bày dữ liệu DƯỚI DẠNG BẢNG MARKDOWN (Markdown Table) thật chuyên nghiệp và chỉn chu. Thêm các bình luận "nhây" theo phong cách của Cô Kiều sau đó, rồi hỏi có muốn share lên Discord cho cả lớp ngầu không.
Khi user đồng ý gửi Discord: GỌI tool send_discord_report với nội dung đã soạn (copy nguyên cái bảng markdown qua luôn cho đẹp).

KHÔNG được bịa dữ liệu giá xăng. Phải dùng tool để lấy dữ liệu thực tế.`;

export async function POST(req: Request) {
  const { messages } = await req.json();
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

            const prices: Array<{ name: string; price: string; unit: string }> =
              [];

            // Try multiple selectors as PVOIL may vary HTML structure
            // Selector 1: table rows
            $("table tr").each((_, row) => {
              const cells = $(row).find("td");
              if (cells.length >= 2) {
                const name = $(cells[0]).text().trim();
                const price = $(cells[1]).text().trim();
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
                  prices.push({ name, price, unit: "đồng/lít" });
                }
              }
            });

            // Selector 2: price list items
            if (prices.length === 0) {
              $(".price-item, .fuel-price, .gia-xang, [class*='price']").each(
                (_, el) => {
                  const text = $(el).text().trim();
                  if (text && text.length < 200) {
                    const nameEl = $(el).find(
                      ".name, .title, h3, h4, strong"
                    );
                    const priceEl = $(el).find(".price, .value, span");
                    if (nameEl.length && priceEl.length) {
                      prices.push({
                        name: nameEl.first().text().trim(),
                        price: priceEl.first().text().trim(),
                        unit: "đồng/lít",
                      });
                    }
                  }
                }
              );
            }

            // Selector 3: search by text pattern (numbers that look like fuel prices)
            if (prices.length === 0) {
              const bodyText = $("body").text();
              const lines = bodyText.split("\n").map((l) => l.trim()).filter(Boolean);
              const fuelKeywords = ["Ron 95", "RON 95", "E5", "Diesel", "Dầu DO", "Ron 92", "RON 92", "Dầu hỏa"];
              let lastFuelName = "";
              lines.forEach((line) => {
                const isFuelName = fuelKeywords.some((k) =>
                  line.toLowerCase().includes(k.toLowerCase())
                );
                if (isFuelName) lastFuelName = line;
                const priceMatch = line.match(/(\d{2,3}\.\d{3}|\d{5,6})\s*(đồng|vnđ|vnd)?/i);
                if (priceMatch && lastFuelName && prices.length < 10) {
                  if (!prices.find((p) => p.name === lastFuelName)) {
                    prices.push({
                      name: lastFuelName,
                      price: priceMatch[0],
                      unit: "đồng/lít",
                    });
                  }
                  lastFuelName = "";
                }
              });
            }

            if (prices.length === 0) {
              // Fallback: return notice that site might be blocking
              return {
                success: false,
                error: "Không thể lấy được bảng giá từ PVOIL lúc này (website có thể đang bảo trì hoặc chặn request). Thử lại sau hoặc trả lời dựa theo giá thị trường ước tính gần đây.",
                timestamp: new Date().toLocaleString("vi-VN"),
              };
            }

            return {
              success: true,
              source: "PVOIL (pvoil.com.vn)",
              timestamp: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
              prices,
            };
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
              success: false,
              error: `Lỗi khi truy cập PVOIL: ${errorMsg}. Hãy thông báo cho user rằng không thể lấy dữ liệu thực tế lúc này.`,
              timestamp: new Date().toLocaleString("vi-VN"),
            };
          }
        },
      }),

      send_discord_report: tool({
        description:
          'Gửi báo cáo giá xăng vào kênh Discord của lớp qua Webhook. Dùng khi user đồng ý share/gửi lên Discord.',
        parameters: z.object({
          content: z
            .string()
            .describe(
              "Nội dung tin nhắn đã được AI biên soạn theo phong cách nhây của Cô Kiều. Bao gồm bảng giá xăng và bình luận hài hước."
            ),
        }),
        execute: async ({ content }) => {
          const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

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
