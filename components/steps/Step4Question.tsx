"use client";

import { buildContext } from "@/lib/dataUtils";
import type { StepProps } from "@/types";
import { MessageSquare } from "lucide-react";

const EXAMPLES = [
  "매출에 가장 큰 영향을 미치는 요인은 무엇인가요?",
  "고객 이탈률을 예측하는 핵심 변수를 찾아주세요.",
  "어떤 제품 카테고리가 가장 높은 수익을 창출하나요?",
  "직원 성과와 관련된 주요 패턴을 분석해 주세요.",
];

export default function Step4Question({ state, onUpdate, onNext, onBack }: StepProps) {
  const { dfClean, colTypes, colStatsMap, units, colKoreanNames, question } = state;

  const ctxPreview = dfClean
    ? JSON.stringify(
        buildContext(dfClean.slice(0, 50), colTypes, colStatsMap, units, "...", colKoreanNames),
        null,
        2
      ).slice(0, 600) + "..."
    : "";

  const canProceed = question.trim().length >= 1;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 800, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 05</div>
      <h2 style={{ fontSize: 24, marginBottom: 6, marginTop: 0 }}>분석 질문 입력</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        데이터를 통해 답을 얻고 싶은 비즈니스 질문을 입력하세요.
      </p>

      {/* Question Input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          <MessageSquare size={16} color="#0ea5e9" />
          분석 질문
        </label>
        <textarea
          rows={4}
          placeholder="예: 이 데이터에서 매출에 가장 큰 영향을 미치는 요인은 무엇인가요?"
          value={question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          style={{ resize: "vertical", minHeight: 100, fontSize: 14 }}
        />
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
  {question.length}자
</div>
      </div>

      {/* Examples */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>💡 질문 예시</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onUpdate({ question: ex })}
              style={{
                textAlign: "left", padding: "10px 14px",
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#475569",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f0f9ff";
                e.currentTarget.style.borderColor = "#0ea5e9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              → {ex}
            </button>
          ))}
        </div>
      </div>

  

      {/* Context Preview */}
      {ctxPreview && (
        <details style={{ marginBottom: 24 }}>
          <summary style={{ fontSize: 12, color: "#64748b", cursor: "pointer", marginBottom: 8 }}>
            🔍 AI에 전달되는 데이터 컨텍스트 미리보기
          </summary>
          <pre style={{
            background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10,
            padding: "12px 14px", fontSize: 11, color: "#475569",
            overflow: "auto", maxHeight: 200, fontFamily: "DM Mono,monospace",
          }}>
            {ctxPreview}
          </pre>
        </details>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext} disabled={!canProceed}>
          {question.trim().length < 1 ? "질문을 입력해 주세요" : "AI 분석 시작 →"}
        </button>
      </div>
    </div>
  );
}
