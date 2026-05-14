"use client";

import type { StepProps, ColTypeEnum } from "@/types";

const TYPE_OPTIONS: ColTypeEnum[] = ["numeric", "categorical", "text"];

export default function Step2FeatureSetup({ state, onUpdate, onNext, onBack }: StepProps) {
  const { columns, colTypes, colKoreanNames, units } = state;

  function setType(col: string, type: ColTypeEnum) {
    onUpdate({ colTypes: { ...colTypes, [col]: type } });
  }

  function setKorean(col: string, val: string) {
    onUpdate({ colKoreanNames: { ...colKoreanNames, [col]: val } });
  }

  function setUnit(col: string, val: string) {
    onUpdate({ units: { ...units, [col]: val } });
  }

  const numericCount = Object.values(colTypes).filter((t) => t === "numeric").length;
  const catCount = Object.values(colTypes).filter((t) => t === "categorical").length;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 03</div>
      <h2 style={{ fontSize: 24, marginBottom: 6, marginTop: 0 }}>피처 설정</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>
        컬럼 타입을 검토하고 한국어 이름·단위를 추가하면 AI 분석이 더 정확해집니다.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 12, background: "rgba(14,165,233,0.1)", color: "#0284c7", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 8, padding: "3px 10px" }}>
          수치형 {numericCount}개
        </span>
        <span style={{ fontSize: 12, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "3px 10px" }}>
          범주형 {catCount}개
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "200px 130px 1fr 120px",
          gap: 10, padding: "8px 14px",
          fontSize: 11, fontWeight: 700, color: "#64748b",
          fontFamily: "DM Sans,sans-serif", letterSpacing: ".04em", textTransform: "uppercase",
          background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0",
        }}>
          <span>컬럼명</span>
          <span>데이터 타입</span>
          <span>한국어 이름 (선택)</span>
          <span>단위 (선택)</span>
        </div>

        {columns.map((col) => {
          const type = colTypes[col] || "text";
          const stats = state.colStatsMap[col];
          return (
            <div key={col} style={{
              display: "grid", gridTemplateColumns: "200px 130px 1fr 120px",
              gap: 10, padding: "12px 14px",
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 10, alignItems: "center",
              transition: "box-shadow 0.15s",
            }}>
              {/* Col name */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", wordBreak: "break-all" }}>{col}</div>
                {stats && type === "numeric" && (
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono,monospace", marginTop: 2 }}>
                    avg: {stats.mean.toFixed(2)} | σ: {stats.std.toFixed(2)}
                  </div>
                )}
                {stats && type === "categorical" && (
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono,monospace", marginTop: 2 }}>
                    {stats.unique}개 고유값
                  </div>
                )}
              </div>

              {/* Type selector */}
              <select
                value={type}
                onChange={(e) => setType(col, e.target.value as ColTypeEnum)}
                style={{
                  padding: "6px 10px", fontSize: 12, borderRadius: 8,
                  border: "1.5px solid #cbd5e1", background: "#fff",
                  cursor: "pointer",
                }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Korean name */}
              <input
                type="text"
                placeholder={`${col} (한국어명)`}
                value={colKoreanNames[col] || ""}
                onChange={(e) => setKorean(col, e.target.value)}
                style={{ fontSize: 12, padding: "6px 10px" }}
              />

              {/* Unit */}
              <input
                type="text"
                placeholder="예: 원, kg, %"
                value={units[col] || ""}
                onChange={(e) => setUnit(col, e.target.value)}
                style={{ fontSize: 12, padding: "6px 10px" }}
                disabled={type !== "numeric"}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>다음: 전처리 →</button>
      </div>
    </div>
  );
}
