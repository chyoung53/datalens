"use client";

import { useEffect, useMemo } from "react";
import { detectType, colStats, colValues } from "@/lib/dataUtils";
import type { StepProps, ColTypeEnum, ColStats } from "@/types";

const TYPE_COLOR: Record<ColTypeEnum, string> = {
  numeric: "#0ea5e9",
  categorical: "#6366f1",
  text: "#10b981",
  empty: "#94a3b8",
};

export default function Step1DataCheck({ state, onUpdate, onNext, onBack }: StepProps) {
  const { dfRaw, columns } = state;

  // 컬럼 타입 자동 감지 및 통계 계산
  useEffect(() => {
    if (!dfRaw || Object.keys(state.colTypes).length > 0) return;

    const colTypes: Record<string, ColTypeEnum> = {};
    const colStatsMap: Record<string, ColStats> = {};

    columns.forEach((col) => {
      const vals = colValues(dfRaw, col);
      const type = detectType(vals);
      colTypes[col] = type;
      const stats = colStats(vals, type);
      if (stats) colStatsMap[col] = stats;
    });

    onUpdate({ colTypes, colStatsMap });
  }, [dfRaw, columns]);

  const preview = useMemo(() => dfRaw?.slice(0, 20) ?? [], [dfRaw]);

  const missingPct = (col: string) => {
    const s = state.colStatsMap[col];
    if (!s || !dfRaw) return 0;
    return Math.round((s.missing / dfRaw.length) * 100);
  };

  if (!dfRaw) return null;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 02</div>
      <h2 style={{ fontSize: 24, marginBottom: 6, marginTop: 0 }}>데이터 확인</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        데이터 미리보기와 컬럼별 정보를 확인하세요.
      </p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "총 행", value: dfRaw.length.toLocaleString(), color: "#0ea5e9" },
          { label: "총 열", value: columns.length, color: "#6366f1" },
          { label: "수치형", value: Object.values(state.colTypes).filter((t) => t === "numeric").length, color: "#10b981" },
          { label: "범주형", value: Object.values(state.colTypes).filter((t) => t === "categorical").length, color: "#f59e0b" },
        ].map((c) => (
          <div key={c.label} className="kpi-card" style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 13, color: "#64748b", fontFamily: "DM Sans,sans-serif", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Column Info Table */}
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>컬럼 정보</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {["컬럼명", "타입", "결측 %", "고유값 수", "샘플 값"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => {
                const type = state.colTypes[col] || "text";
                const stats = state.colStatsMap[col];
                const sampleVals = dfRaw
                  .slice(0, 3)
                  .map((r) => String(r[col] ?? ""))
                  .filter((v) => v)
                  .join(", ");
                return (
                  <tr key={col}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{col}</td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        fontSize: 10, fontWeight: 600, fontFamily: "DM Mono,monospace",
                        background: `${TYPE_COLOR[type]}18`,
                        color: TYPE_COLOR[type],
                        border: `1px solid ${TYPE_COLOR[type]}40`,
                      }}>
                        {type}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: missingPct(col) > 20 ? "#ef4444" : missingPct(col) > 5 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
                        {missingPct(col)}%
                      </span>
                    </td>
                    <td>{type === "categorical" ? (stats?.unique ?? "—") : "—"}</td>
                    <td style={{ color: "#64748b", fontSize: 11 }}>{sampleVals || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Preview */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>데이터 미리보기 (상위 20행)</h3>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 340 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: "#94a3b8" }}>{i + 1}</td>
                  {columns.map((c) => (
                    <td key={c}>{row[c] !== null ? String(row[c]) : <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>다음: 피처 설정 →</button>
      </div>
    </div>
  );
}
