import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const MODELS = ["gemini-2.0-flash"];

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userMessage, maxTokens = 4096 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY!;

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: MODELS[0],
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 }
    );
  }
}