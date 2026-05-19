import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userMessage, maxTokens = 4096 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY!;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userMessage}` }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API 오류");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });

  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 }
    );
  }
}