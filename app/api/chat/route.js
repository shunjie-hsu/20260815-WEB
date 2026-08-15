import { buildSystemInstruction } from "../../../lib/knowledgeBase.js";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3.5-flash";

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "伺服器尚未設定 GEMINI_API_KEY 環境變數。" },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "缺少對話內容 messages。" }, { status: 400 });
    }

    // messages: [{ role: "user" | "assistant", content: string }, ...]
    // 轉換成 Gemini 的 contents 格式（role 只能是 user / model）
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      systemInstruction: {
        parts: [{ text: buildSystemInstruction() }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return Response.json(
        { error: "呼叫 Gemini API 失敗，請稍後再試。" },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ??
      "抱歉，目前無法產生回覆，請再試一次。";

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json({ error: "伺服器發生錯誤，請稍後再試。" }, { status: 500 });
  }
}
