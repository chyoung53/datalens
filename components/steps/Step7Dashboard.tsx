"use client";

import { useEffect, useState } from "react";
import { safeJSON } from "@/lib/dataUtils";
import ChartRenderer, { Histogram } from "@/components/ChartRenderer";
import { histogramData } from "@/lib/dataUtils";
import type { StepProps, DashResult } from "@/types";

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#ef4444"];

export default function Step7Dashboard({ state, onUpdate, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const dash = state.dashResult;
  const numCols = Object.entries(state.colTypes).filter(([, t]) => t === "numeric").map(([c]) => c);
  const catCols = Object.entries(state.colTypes).filter(([, t]) => t === "categorical").map(([c]) => c);

  async function runDashboard() {
    if (!state.geminiApiKey || !state.edaResult) return;
    setLoading(true);
    setError("");

    const edaSlim = {
      summary: state.edaResult.summary,
      insights: state.edaResult.insights.slice(0, 3),
      targetVariable: state.edaResult.targetVariable,
      modelType: state.edaResult.suggestedModelType,
    };
    const modelSlim = state.modelResult
      ? {
          model: state.modelResult.selectedModel,
          performance: state.modelResult.performance?.metric,
          recommendation: state.modelResult.recommendation,
        }
      : null;

    const sys1 =
      "비즈니스 전략 컨설턴트. 순수 JSON만 반환. 마크다운 없음. 모든 값 반드시 채워진 문자열.\n" +
      '{"executiveSummary":"요약 2-3문장","topInsights":[' +
      '{"rank":1,"emoji":"💰","title":"제목","finding":"수치 포함 설명","impact":"임팩트","action":"실행 액션"},' +
      '{"rank":2,"emoji":"📊","title":"제목","finding":"설명","impact":"임팩트","action":"실행 액션"},' +
      '{"rank":3,"emoji":"🎯","title":"제목","finding":"설명","impact":"임팩트","action":"실행 액션"}]}';

    const sys2 =
      "비즈니스 분석가. 순수 JSON만 반환. 마크다운 없음.\n" +
      '{"kpis":[{"label":"KPI이름","value":"수치와단위","status":"good","note":"설명"}],' +
      '"risks":[{"risk":"내용","severity":"high","mitigation":"대응방안"}],' +
      '"nextSteps":["이번 주 실행","1개월 내 실행","3개월 전략"]}';

    const ctxMsg = `질문: ${state.question}\nEDA: ${JSON.stringify(edaSlim)}\n모델: ${JSON.stringify(modelSlim)}`;

    try {
      const [r1Res, r2Res] = await Promise.all([
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: state.geminiApiKey, systemPrompt: sys1, userMessage: `${ctxMsg}\nexecutiveSummary와 topInsights 3개를 작성하세요.`, maxTokens: 2000 }),
        }),
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: state.geminiApiKey, systemPrompt: sys2, userMessage: `${ctxMsg}\nkpis 3개, risks 2개, nextSteps 3개를 작성하세요.`, maxTokens: 1500 }),
        }),
      ]);

      const [d1, d2] = await Promise.all([r1Res.json(), r2Res.json()]);
      if (d1.error) throw new Error(d1.error);
      if (d2.error) throw new Error(d2.error);

      const p1 = safeJSON(d1.text) as {executiveSummary?: string; topInsights?: {rank?: number; emoji?: string; title?: string; finding?: string; impact?: string; action?: string}[]};
      const p2 = safeJSON(d2.text) as {kpis?: {label?: string; value?: string; status?: string; note?: string}[]; risks?: {risk?: string; severity?: string; mitigation?: string}[]; nextSteps?: string[]};

      const sstr = (v: unknown) => (v == null ? "" : String(v));
      onUpdate({
        dashResult: {
          executiveSummary: sstr(p1.executiveSummary),
          topInsights: (p1.topInsights ?? []).map((ins) => ({
            rank: Number(ins.rank ?? 1),
            emoji: sstr(ins.emoji) || "💡",
            title: sstr(ins.title),
            finding: sstr(ins.finding),
            impact: sstr(ins.impact),
            action: sstr(ins.action),
          })),
          kpis: (p2.kpis ?? []).map((k) => ({
            label: sstr(k.label),
            value: sstr(k.value),
            status: (["good", "warning", "bad"].includes(k.status ?? "") ? k.status : "good") as "good" | "warning" | "bad",
            note: sstr(k.note),
          })),
          risks: (p2.risks ?? []).map((r) => ({
            risk: sstr(r.risk),
            severity: (["high", "medium", "low"].includes(r.severity ?? "") ? r.severity : "medium") as "high" | "medium" | "low",
            mitigation: sstr(r.mitigation),
          })),
          nextSteps: (p2.nextSteps ?? []).map(sstr),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "대시보드 생성 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  async function exportPDF() {
    if (!dash) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;
      const usable = pageW - margin * 2;
      let y = 20;

      const addLine = (text: string, size = 10, bold = false, color = "#1e293b") => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        const rgb = hexToRgb(color);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        const lines = doc.splitTextToSize(text, usable);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 3;
      };

      const addSection = (title: string) => {
        y += 4;
        doc.setFillColor(14, 165, 233);
        doc.rect(margin, y, usable, 0.5, "F");
        y += 5;
        addLine(title, 13, true, "#0f172a");
      };

      // Header
      doc.setFillColor(14, 165, 233);
      doc.rect(margin, y, usable, 1.5, "F");
      y += 8;
      addLine("DataLens AI — Business Dashboard Report", 18, true, "#0f172a");
      addLine(new Date().toLocaleDateString("ko-KR"), 9, false, "#64748b");
      addLine(`분석 질문: ${state.question}`, 10, false, "#475569");
      y += 4;

      if (dash.executiveSummary) {
        addSection("Executive Summary");
        addLine(dash.executiveSummary, 10);
      }

      if (dash.kpis.length) {
        addSection("KPIs");
        dash.kpis.forEach((k) => addLine(`• ${k.label}: ${k.value}  — ${k.note}`, 10));
      }

      if (dash.topInsights.length) {
        addSection("핵심 비즈니스 인사이트");
        dash.topInsights.forEach((ins) => {
          addLine(`${ins.emoji} ${ins.title}`, 11, true, "#0f172a");
          addLine(ins.finding, 10);
          addLine(`임팩트: ${ins.impact}`, 9, false, "#64748b");
          addLine(`실행: ${ins.action}`, 9, false, "#0284c7");
          y += 2;
        });
      }

      if (dash.risks.length) {
        addSection("리스크");
        dash.risks.forEach((r) => {
          addLine(`[${r.severity.toUpperCase()}] ${r.risk}`, 10, true);
          addLine(`대응: ${r.mitigation}`, 9, false, "#64748b");
        });
      }

      if (dash.nextSteps.length) {
        addSection("실행 로드맵");
        const labels = ["이번 주", "1개월 내", "3개월 내"];
        dash.nextSteps.forEach((s, i) => addLine(`[${labels[i] ?? ""}] ${s}`, 10));
      }

      doc.save(`datalens_report_${Date.now()}.pdf`);
    } catch (e) {
      alert("PDF 생성 실패: " + String(e));
    }
    setPdfLoading(false);
  }

  useEffect(() => {
    if (!dash) runDashboard();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div className="step-tag" style={{ marginBottom: 8 }}>STEP 08</div>
          <h2 style={{ fontSize: 24, margin: 0 }}>📈 비즈니스 인사이트 대시보드</h2>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={runDashboard} style={{ fontSize: 12, padding: "6px 14px" }}>🔄 재생성</button>
          <button className="btn-primary" onClick={exportPDF} disabled={!dash || pdfLoading} style={{ fontSize: 12, padding: "6px 14px" }}>
            {pdfLoading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> PDF 생성 중</> : "📥 PDF 다운로드"}
          </button>
        </div>
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>즉시 실행 가능한 전략 인사이트</p>

      {error && <div className="warn-box" style={{ marginBottom: 20, fontSize: 13 }}>⚠️ {error}</div>}

      {dash && (
        <>
          {/* Executive Summary */}
          {dash.executiveSummary && (
            <div className="summary-box" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".09em", marginBottom: 10 }}>
                EXECUTIVE SUMMARY
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.85, margin: 0, color: "#1e293b" }}>{dash.executiveSummary}</p>
            </div>
          )}

          {/* KPI Cards */}
          {dash.kpis.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(dash.kpis.length, 4)}, 1fr)`, gap: 12, marginBottom: 28 }}>
              {dash.kpis.map((kpi, i) => {
                const sc = kpi.status === "good" ? "#10b981" : kpi.status === "bad" ? "#ef4444" : "#f59e0b";
                return (
                  <div key={i} className="kpi-card" style={{ borderTop: `3px solid ${sc}` }}>
                    <div style={{ fontSize: 9, color: "#64748b", fontFamily: "DM Mono,monospace", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>{kpi.label}</div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 800, color: sc, marginBottom: 4 }}>{kpi.value}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{kpi.note}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Charts */}
          {state.edaResult?.chartConfig && state.dfClean && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>📊 데이터 시각화</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {state.edaResult.chartConfig.map((cfg, i) => (
                  <ChartRenderer key={i} config={cfg} data={state.dfClean!} />
                ))}
              </div>
            </div>
          )}

          {/* Distribution */}
          {numCols.length > 0 && state.dfClean && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>📐 수치형 분포</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {numCols.slice(0, 3).map((col) => (
                  <Histogram key={col} data={histogramData(state.dfClean!, col)} title={`${col} 분포`} height={180} />
                ))}
              </div>
            </div>
          )}

          {/* Top Insights */}
          {dash.topInsights.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>💡 핵심 비즈니스 인사이트</h3>
              {dash.topInsights.map((ins, i) => (
                <div key={i} className={`insight-card ${i === 0 ? "top" : ""}`}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: `linear-gradient(135deg,${COLORS[i % COLORS.length]},${COLORS[(i + 1) % COLORS.length]})`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                    }}>
                      {ins.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: i === 0 ? "#0284c7" : "#0f172a", marginBottom: 6 }}>
                        {ins.title}
                      </div>
                      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.75, margin: "0 0 10px" }}>{ins.finding}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#065f46" }}>
                          💰 {ins.impact}
                        </span>
                        <span style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#0284c7" }}>
                          ▶ {ins.action}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risks + Roadmap */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Risks */}
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>⚠️ 리스크</h3>
              {dash.risks.map((r, i) => {
                const sc = r.severity === "high" ? "#ef4444" : "#f59e0b";
                return (
                  <div key={i} className="kpi-card" style={{ borderLeft: `3px solid ${sc}`, padding: "11px 14px", marginBottom: 8, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.risk}</span>
                      <span style={{ fontSize: 9, padding: "1px 8px", borderRadius: 10, background: `${sc}18`, color: sc, fontWeight: 700, fontFamily: "DM Mono,monospace" }}>
                        {r.severity.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.mitigation}</div>
                  </div>
                );
              })}
            </div>

            {/* Roadmap */}
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>🗓 실행 로드맵</h3>
              {["이번 주", "1개월 내", "3개월 내"].map((label, i) => (
                dash.nextSteps[i] && (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: COLORS[i % COLORS.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 12, color: "#fff",
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 9, color: "#64748b", fontFamily: "DM Mono,monospace" }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, marginTop: 2 }}>{dash.nextSteps[i]}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#0284c7" }}>대시보드 생성 중...</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>비즈니스 인사이트를 종합 중입니다 (AI 2회 호출)</div>
    </div>
  );
}
