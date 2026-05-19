import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userMessage, maxTokens = 4096 } = await req.json();
const apiKey = process.env.GEMINI_API_KEY!;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 없습니다. 사이드바에서 Gemini API 키를 입력해 주세요." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = "";

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3,
          },
        });

        const result = await model.generateContent(userMessage);
        const text = result.response.text();
        return NextResponse.json({ text, model: modelName });
      } catch (e: unknown) {
        lastError = e instanceof Error ? e.message : String(e);
        // 다음 모델 시도
        continue;
      }
    }

    return NextResponse.json(
      { error: `모든 모델 실패: ${lastError}` },
      { status: 500 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 }
    );
  }
}
