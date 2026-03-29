import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Zod schema - định nghĩa cấu trúc JSON bắt buộc AI phải trả về
export const VocabSchema = z.object({
  word: z.string().describe("Từ tiếng Anh đúng chính tả"),
  phonetic: z.string().describe("Phiên âm IPA, ví dụ: /ˈhæpɪ/"),
  meaning: z
    .string()
    .describe(
      "Nghĩa tiếng Việt được giải thích hài hước theo phong cách Cô Lành"
    ),
  example: z
    .string()
    .describe(
      "Một câu ví dụ bằng tiếng Anh vừa nhây vừa bựa nhưng đúng ngữ pháp"
    ),
  example_vi: z.string().describe("Dịch câu ví dụ sang tiếng Việt"),
  grammar_notes: z
    .array(z.string())
    .describe("Danh sách 2-4 lưu ý ngữ pháp quan trọng của từ này"),
  level: z
    .enum(["Dễ", "Trung bình", "Khó"])
    .describe("Cấp độ khó của từ vựng"),
  word_family: z
    .array(z.string())
    .describe(
      "Các dạng từ liên quan: danh từ, động từ, tính từ, trạng từ nếu có"
    ),
});

export type VocabResult = z.infer<typeof VocabSchema>;

const VOCAB_SYSTEM_PROMPT = `Bạn là Cô Lành — một cuốn từ điển sống động cực kỳ hài hước và "nhây".

PHONG CÁCH CỦA BẠN:
- Giải thích nghĩa từ theo kiểu hài hước, dễ nhớ, đôi khi hơi "bựa" nhưng vẫn chính xác
- Câu ví dụ phải vừa đúng ngữ pháp vừa buồn cười, gần gũi với học viên Việt Nam
- Dùng emoji thỉnh thoảng trong phần meaning để thêm màu sắc
- Lưu ý ngữ pháp phải thiết thực, không quá hàn lâm

QUAN TRỌNG: Chỉ phân tích đúng 1 từ tiếng Anh được cung cấp. Nếu input không phải từ tiếng Anh hợp lệ, vẫn hãy cố gắng xử lý hoặc giải thích.`;

export async function POST(req: Request) {
  const { word } = await req.json();

  if (!word || typeof word !== "string" || word.trim().length === 0) {
    return Response.json({ error: "Vui lòng nhập một từ tiếng Anh!" }, { status: 400 });
  }

  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      mode: "json",
      system: VOCAB_SYSTEM_PROMPT,
      prompt: `Hãy phân tích từ tiếng Anh: "${word.trim()}" và trả về dữ liệu đúng định dạng JSON yêu cầu.`,
      schema: VocabSchema,
    });

    return Response.json({ data: result.object });
  } catch (error) {
    console.error("generateObject error:", error);
    return Response.json(
      { error: "Cô Lành đang bận 'nặn' từ điển, thử lại sau nhé! 😅" },
      { status: 500 }
    );
  }
}
