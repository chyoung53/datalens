"use client";

import { useState, useEffect } from "react";
import { buildContext, safeJSON, histogramData, colValues } from "@/lib/dataUtils";
import ChartRenderer, { Histogram } from "@/components/ChartRenderer";
import type { StepProps, EDAResult, ChartConfig } from "@/types";

export default function Step5EDA({ state, onUpdate, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eda = state.edaResult;
  const numCols = Object.entries(state.colTypes).filter(([, t]) => t === "numeric").map(([c]) => c);
  const catCols = Object.entries(state.colTypes).filter(([, t]) => t === "categorical").map(([c]) => c);

  async function runEDA() {
    if (!state.dfClean) return;
    setLoading(true);
    setError("");

    const ctx = buildContext(
      state.dfClean,
      state.colTypes,
      state.colStatsMap,
      state.units,
      state.question,
      state.colKoreanNames
    );

    const systemPrompt =
      "데이터 분석 전문가. 순수 JSON만 반환. 마크다운 없음. 모든 문자열 값은 빈 문자열 없이 채워야 함.\n" +
      '{"summary":"전체 요약 2-3문장","insights":["인사이트1","인사이트2","인사이트3","인사이트4"],' +
      '"targetVariable":"예측 또는 분석의 핵심 변수명","suggestedModelType":"regression|classification|clustering|timeseries|descriptive",' +
      '"chartConfig":[{"type":"bar|pie|scatter|line|area","xColumn":"컬럼명","yColumn":"컬럼명 또는 null","title":"차트 제목","description":"설명"}]}';

    const userMsg = `분석 질문: ${state.question}\n데이터 컨텍스트: ${JSON.stringify(ctx)}`;

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: state.geminiApiKey, systemPrompt, userMessage: userMsg, maxTokens: 3000 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const parsed = safeJSON(data.text) as unknown as EDAResult;

      // 차트 설정 보강
      let charts: ChartConfig[] = Array.isArray(parsed.chartConfig) ? parsed.chartConfig : [];
      if (catCols.length && !charts.find((c) => c.type === "pie")) {
        charts.push({ type: "pie", xColumn: catCols[0], title: `${catCols[0]} 분포`, description: "" });
      }
      if (numCols.length >= 2 && !charts.find((c) => c.type === "scatter")) {
        charts.push({ type: "scatter", xColumn: numCols[0], yColumn: numCols[1], title: `${numCols[0]} vs ${numCols[1]}`, description: "" });
      }

      onUpdate({
        edaResult: {
          summary: String(parsed.summary || ""),
          insights: Array.isArray(parsed.insights) ? parsed.insights.map(String) : [],
          targetVariable: String(parsed.targetVariable || ""),
          suggestedModelType: String(parsed.suggestedModelType || "descriptive"),
          chartConfig: charts.slice(0, 6),
        },
        modelResult: null,
        dashResult: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "EDA 분석 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!eda) runEDA();
  }, []);

  if (loading) return <LoadingState label="EDA 분석 중" />;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 06</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>탐색적 데이터 분석 (EDA)</h2>
        <button className="btn-secondary" onClick={runEDA} style={{ fontSize: 12, padding: "6px 14px" }}>
          🔄 재분석
        </button>
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>AI가 데이터를 탐색하고 핵심 인사이트를 도출합니다.</p>

      {error && <div className="warn-box" style={{ marginBottom: 20, fontSize: 13 }}>⚠️ {error}</div>}

      {eda && (
        <>
          {/* Summary */}
          {eda.summary && (
            <div className="summary-box" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".09em", marginBottom: 10 }}>
                EDA SUMMARY
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.85, margin: 0, color: "#1e293b" }}>{eda.summary}</p>
              {eda.targetVariable && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#0284c7", fontFamily: "DM Mono,monospace" }}>핵심 변수:</span>
                  <span style={{
                    background: "rgba(14,165,233,0.12)", color: "#0284c7",
                    borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 700,
                  }}>{eda.targetVariable}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>| 모델 유형: {eda.suggestedModelType}</span>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {eda.insights.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>🔍 핵심 발견</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {eda.insights.map((ins, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 10, padding: "12px 16px",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: `linear-gradient(135deg,${["#0ea5e9","#6366f1","#10b981","#f59e0b"][i % 4]},${["#6366f1","#10b981","#f59e0b","#0ea5e9"][i % 4]})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: "DM Mono,monospace",
                    }}>{i + 1}</div>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.75 }}>{ins}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          {eda.chartConfig.length > 0 && state.dfClean && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>📊 데이터 시각화</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {eda.chartConfig.map((cfg, i) => (
                  <ChartRenderer key={i} config={cfg} data={state.dfClean!} />
                ))}
              </div>
            </div>
          )}

          {/* Distribution histograms */}
          {numCols.length > 0 && state.dfClean && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>📐 수치형 컬럼 분포</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {numCols.slice(0, 6).map((col) => (
                  <Histogram
                    key={col}
                    data={histogramData(state.dfClean!, col)}
                    title={`${col} 분포`}
                    height={180}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext} disabled={!eda}>
          다음: 모델링 →
        </button>
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#0284c7" }}>{label}...</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>Gemini AI가 데이터를 분석 중입니다</div>
    </div>
  );
}
