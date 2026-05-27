"use client";

import { useState, useEffect } from "react";
import { buildContext, safeJSON, histogramData } from "@/lib/dataUtils";
import ChartRenderer, {
  Histogram,
  ClusterScatterChart,
  CorrelationHeatmapChart,
  BoxPlotChart,
  OutlierScatterChart,
  ParetoChart,
} from "@/components/ChartRenderer";
import type { StepProps, EDAResult, ChartConfig } from "@/types";

// 사용자 질문에서 심화 분석 유형을 감지
function detectAdvancedFromQuestion(question: string): Set<string> {
  const q = question.toLowerCase();
  const result = new Set<string>();
  if (/군집|클러스터|cluster|segment|그룹화|세그먼트/.test(q)) result.add("clustering");
  if (/상관관계|상관|연관성|연관|correlation/.test(q)) result.add("correlation");
  if (/분포|박스플롯|사분위|iqr|상자 그림/.test(q)) result.add("boxplot");
  if (/이상값|이상치|outlier|anomaly|비정상/.test(q)) result.add("outlier");
  if (/파레토|pareto|누적|상위.*%|80\/20/.test(q)) result.add("pareto");
  return result;
}

const ADVANCED_LABEL: Record<string, string> = {
  clustering: "K-means 군집화",
  correlation: "상관관계 히트맵",
  boxplot: "박스플롯",
  outlier: "이상값 탐지",
  pareto: "파레토 차트",
};
const ALL_ADVANCED = ["clustering", "correlation", "boxplot", "outlier", "pareto"];

export default function Step5EDA({ state, onUpdate, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const eda = state.edaResult;
  const numCols = Object.entries(state.colTypes).filter(([, t]) => t === "numeric").map(([c]) => c);
  const catCols = Object.entries(state.colTypes).filter(([, t]) => t === "categorical").map(([c]) => c);

  // 자동 표시할 심화 분석 유형 계산 (AI 제안 + 키워드 감지)
  const autoTypes = new Set<string>();
  if (Array.isArray(eda?.suggestedAdvanced)) {
    (eda!.suggestedAdvanced as string[]).forEach((t) => autoTypes.add(t));
  }
  detectAdvancedFromQuestion(state.question || "").forEach((t) => autoTypes.add(t));
  const visibleTypes = showAll ? new Set(ALL_ADVANCED) : autoTypes;

  async function runEDA() {
    if (!state.dfClean) return;
    setLoading(true);
    setError("");
    setShowAll(false);

    const ctx = buildContext(
      state.dfClean,
      state.colTypes,
      state.colStatsMap,
      state.units,
      state.question,
      state.colKoreanNames
    );

    const systemPrompt =
      "데이터 분석 전문가. 순수 JSON만 반환. 마크다운 없음.\n" +
      "차트 선택 규칙: 수치형vs수치형=scatter, 범주형 빈도=pie, 범주형vs수치형 평균비교=bar, 시계열=line.\n" +
      "bar차트는 반드시 yColumn(수치형)과 xColumn(범주형)을 지정할 것.\n" +
      "scatter차트 규칙: xColumn과 yColumn은 반드시 수치형(number) 컬럼만 사용할 것.\n" +
      "scatter차트에서 두 수치형 변수 간 상관관계가 존재할 경우 trendline:true 포함.\n" +
      "scatter차트의 xAxis는 tickCount를 8 이하로 제한하고 소수점 2자리 포맷을 사용할 것.\n" +
      "【심화 분석 감지】 사용자 질문을 분석하여 suggestedAdvanced 배열에 해당 항목 포함:\n" +
      "  군집/클러스터/그룹/segment 분석 → 'clustering'\n" +
      "  상관관계/연관성 분석 → 'correlation'\n" +
      "  분포/박스플롯/사분위/IQR → 'boxplot'\n" +
      "  이상값/anomaly/비정상 탐지 → 'outlier'\n" +
      "  파레토/누적비율/상위N% → 'pareto'\n" +
      "  해당 없으면 빈 배열 []\n" +
      '{"summary":"전체 요약 2-3문장","insights":["인사이트1","인사이트2","인사이트3","인사이트4"],' +
      '"targetVariable":"핵심 변수명","suggestedModelType":"regression|classification|clustering",' +
      '"suggestedAdvanced":["해당 심화 분석 유형들"],' +
      '"chartConfig":[{"type":"bar|pie|scatter|line|area","xColumn":"컬럼명","yColumn":"컬럼명",' +
      '"trendline":false,"title":"차트제목"}]}';

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: state.geminiApiKey, systemPrompt, userMessage: JSON.stringify(ctx, null, 2), maxTokens: 3000 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const parsed = safeJSON(data.text) as unknown as EDAResult;

      let charts: ChartConfig[] = Array.isArray(parsed.chartConfig) ? parsed.chartConfig : [];
      if (catCols.length && !charts.find((c) => c.type === "pie")) {
        charts.push({ type: "pie", xColumn: catCols[0], title: `${catCols[0]} 분포`, description: "" });
      }
      if (numCols.length >= 2 && !charts.find((c) => c.type === "scatter")) {
        charts.push({ type: "scatter", xColumn: numCols[0], yColumn: numCols[1], title: `${numCols[0]} vs ${numCols[1]}`, description: "" });
      }

      const suggestedAdvanced = Array.isArray(parsed.suggestedAdvanced)
        ? (parsed.suggestedAdvanced as string[]).filter((t) => ALL_ADVANCED.includes(t))
        : [];

      onUpdate({
        edaResult: {
          summary: String(parsed.summary || ""),
          insights: Array.isArray(parsed.insights) ? parsed.insights.map(String) : [],
          targetVariable: String(parsed.targetVariable || ""),
          suggestedModelType: String(parsed.suggestedModelType || "descriptive"),
          chartConfig: charts.slice(0, 6),
          suggestedAdvanced,
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

  // 각 차트 유형의 렌더링 조건
  const canShow = {
    clustering: numCols.length >= 2,
    correlation: numCols.length >= 3,
    boxplot: numCols.length >= 1,
    outlier: numCols.length >= 2,
    pareto: catCols.length >= 1,
  };

  function renderAdvancedChart(type: string) {
    if (!state.dfClean) return null;
    switch (type) {
      case "clustering":
        return canShow.clustering ? (
          <ClusterScatterChart key="clustering" data={state.dfClean} xCol={numCols[0]} yCol={numCols[1]} k={3} />
        ) : null;
      case "correlation":
        return canShow.correlation ? (
          <CorrelationHeatmapChart key="correlation" data={state.dfClean} numCols={numCols} />
        ) : null;
      case "boxplot":
        return canShow.boxplot ? (
          <BoxPlotChart key="boxplot" cols={numCols} statsMap={state.colStatsMap} />
        ) : null;
      case "outlier":
        return canShow.outlier ? (
          <OutlierScatterChart key="outlier" data={state.dfClean} xCol={numCols[0]} yCol={numCols[1]} statsMap={state.colStatsMap} />
        ) : null;
      case "pareto":
        return canShow.pareto ? (
          <ParetoChart key="pareto" data={state.dfClean} xCol={catCols[0]} yCol={numCols[0]} />
        ) : null;
      default:
        return null;
    }
  }

  // 버튼에 표시할 남은 심화 분석 목록
  const remainingTypes = ALL_ADVANCED.filter(
    (t) => !autoTypes.has(t) && canShow[t as keyof typeof canShow]
  );

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
                  <span style={{ background: "rgba(14,165,233,0.12)", color: "#0284c7", borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>
                    {eda.targetVariable}
                  </span>
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

          {/* Basic charts */}
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
                  <Histogram key={col} data={histogramData(state.dfClean!, col)} title={`${col} 분포`} height={180} />
                ))}
              </div>
            </div>
          )}

          {/* ── 심화 분석 섹션 ────────────────────────────────────── */}
          {state.dfClean && (
            <div style={{ marginBottom: 28 }}>

              {/* 자동 감지된 심화 분석 */}
              {autoTypes.size > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, margin: 0 }}>🤖 질문 기반 심화 분석</h3>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Array.from(autoTypes).map((t) => (
                        <span key={t} style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 20,
                          background: "rgba(99,102,241,0.1)", color: "#6366f1",
                          fontWeight: 600, fontFamily: "DM Mono,monospace",
                        }}>
                          {ADVANCED_LABEL[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Array.from(autoTypes).map((t) => renderAdvancedChart(t))}
                  </div>
                </div>
              )}

              {/* 나머지 / 전체 심화 분석 버튼 */}
              {!showAll && (remainingTypes.length > 0 || autoTypes.size === 0) && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowAll(true)}
                  style={{
                    width: "100%", padding: "13px", fontSize: 13,
                    borderStyle: "dashed", borderColor: "#6366f1",
                    color: "#6366f1", background: "rgba(99,102,241,0.04)",
                  }}
                >
                  🔬 심화 분석 {autoTypes.size > 0 ? "더 보기" : "보기"} &nbsp;—&nbsp;{" "}
                  {(autoTypes.size === 0 ? ALL_ADVANCED : remainingTypes)
                    .filter((t) => canShow[t as keyof typeof canShow])
                    .map((t) => ADVANCED_LABEL[t])
                    .join(" · ")}
                </button>
              )}

              {/* 전체 표시 중일 때 추가 차트 */}
              {showAll && (
                <>
                  {remainingTypes.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h3 style={{ fontSize: 16, margin: 0 }}>🔬 추가 심화 분석</h3>
                        <button className="btn-secondary" onClick={() => setShowAll(false)} style={{ fontSize: 12, padding: "4px 12px" }}>
                          접기
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {remainingTypes.map((t) => renderAdvancedChart(t))}
                      </div>
                    </div>
                  )}
                  {autoTypes.size === 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h3 style={{ fontSize: 16, margin: 0 }}>🔬 심화 분석</h3>
                        <button className="btn-secondary" onClick={() => setShowAll(false)} style={{ fontSize: 12, padding: "4px 12px" }}>
                          접기
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {ALL_ADVANCED.filter((t) => canShow[t as keyof typeof canShow]).map((t) => renderAdvancedChart(t))}
                      </div>
                    </div>
                  )}
                </>
              )}
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
