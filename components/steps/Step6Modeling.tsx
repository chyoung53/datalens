"use client";

import { useEffect, useState } from "react";
import { buildContext, safeJSON } from "@/lib/dataUtils";
import { FeatureBar } from "@/components/ChartRenderer";
import type { StepProps, ModelResult } from "@/types";

const MIN_ROWS = 0;

export default function Step6Modeling({ state, onUpdate, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const model = state.modelResult;
  const df = state.dfClean;

  async function runModeling() {
    if (!df) return;
    if (df.length < MIN_ROWS) return;
    setLoading(true);
    setError("");

    const ctx = buildContext(df, state.colTypes, state.colStatsMap, state.units, state.question, state.colKoreanNames);
    const edaSlim = {
      summary: state.edaResult?.summary ?? "",
      targetVariable: state.edaResult?.targetVariable ?? "",
      modelType: state.edaResult?.suggestedModelType ?? "",
    };

    const systemPrompt =
      "머신러닝 전문가. 순수 JSON만 반환. 마크다운 없음.\n" +
      '{"selectedModel":"모델명","features":[{"feature":"컬럼명","importance":0.0~1.0,"direction":"positive|negative"}],' +
      '"performance":{"metric":"R²=0.85 또는 Accuracy=87% 형태"},"recommendation":"2-3문장 권고"}';

    const userMsg = `질문: ${state.question}\nEDA: ${JSON.stringify(edaSlim)}\n데이터: ${JSON.stringify(ctx)}\n피처 중요도 상위 7개와 모델 성능을 예측해주세요.`;

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: state.geminiApiKey, systemPrompt, userMessage: userMsg, maxTokens: 2000 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const parsed = safeJSON(data.text) as unknown as ModelResult;
      onUpdate({
        modelResult: {
          selectedModel: String(parsed.selectedModel || ""),
          features: Array.isArray(parsed.features)
            ? parsed.features.map((f: {feature?: unknown; importance?: unknown; direction?: unknown}) => ({
                feature: String(f.feature || ""),
                importance: Math.min(Math.max(Number(f.importance) || 0, 0), 1),
                direction: (f.direction === "negative" ? "negative" : "positive") as "positive" | "negative",
              }))
            : [],
          performance: {
            metric: String((parsed.performance as {metric?: unknown})?.metric || ""),
          },
          recommendation: String(parsed.recommendation || ""),
        },
        dashResult: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "모델링 분석 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!model) runModeling();
  }, []);

  if (df && df.length < MIN_ROWS) {
    return (
      <div style={{ padding: "32px 28px", maxWidth: 800, margin: "0 auto" }}>
        <div className="step-tag" style={{ marginBottom: 12 }}>STEP 07</div>
        <h2 style={{ fontSize: 24, marginBottom: 16, marginTop: 0 }}>모델링 분석</h2>
        <div className="warn-box" style={{ marginBottom: 24 }}>
          ⚠️ 모델링을 위해서는 최소 {MIN_ROWS}행이 필요합니다. 현재 데이터: {df.length}행
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={onBack}>← 이전</button>
          <button className="btn-primary" onClick={onNext}>대시보드로 건너뛰기 →</button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1000, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 07</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>모델링 분석</h2>
        <button className="btn-secondary" onClick={runModeling} style={{ fontSize: 12, padding: "6px 14px" }}>
          🔄 재분석
        </button>
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>AI가 적합한 모델과 피처 중요도를 분석합니다.</p>

      {error && <div className="warn-box" style={{ marginBottom: 20, fontSize: 13 }}>⚠️ {error}</div>}

      {model && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: Model Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Selected Model */}
            <div className="card">
              <div style={{ fontSize: 10, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".08em", marginBottom: 8 }}>
                SELECTED MODEL
              </div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                {model.selectedModel}
              </div>
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 8,
                background: "rgba(14,165,233,0.1)", color: "#0284c7",
                fontSize: 13, fontWeight: 700,
              }}>
                {model.performance?.metric}
              </div>
            </div>

            {/* Recommendation */}
            <div className="summary-box">
              <div style={{ fontSize: 10, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".09em", marginBottom: 10 }}>
                AI RECOMMENDATION
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: "#1e293b" }}>
                {model.recommendation}
              </p>
            </div>

            {/* Feature table */}
            {model.features.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: 0, fontSize: 13 }}>피처 영향도</h3>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>피처</th>
                      <th>중요도</th>
                      <th>방향</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.features.map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.feature}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              height: 6, borderRadius: 3, width: `${Math.min(f.importance * 100, 100)}%`,
                              background: f.direction === "positive" ? "#0ea5e9" : "#ef4444",
                              minWidth: 4, maxWidth: 100,
                            }} />
                            <span style={{ fontSize: 11, fontFamily: "DM Mono,monospace" }}>
                              {Math.round(f.importance * 100)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 6,
                            background: f.direction === "positive" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: f.direction === "positive" ? "#065f46" : "#b91c1c",
                            fontWeight: 600,
                          }}>
                            {f.direction === "positive" ? "▲ 양의 영향" : "▼ 음의 영향"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: Feature Bar Chart */}
          {model.features.length > 0 && (
            <div>
              <FeatureBar features={model.features} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext} disabled={!model && !error}>
          다음: 대시보드 →
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#0284c7" }}>모델링 분석 중...</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>피처 중요도와 최적 모델을 탐색 중입니다</div>
    </div>
  );
}
