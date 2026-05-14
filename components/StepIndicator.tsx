"use client";

const STEPS = ["업로드", "데이터확인", "피처설정", "전처리", "질문", "EDA", "모델링", "대시보드"];

interface StepIndicatorProps {
  current: number;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div style={{
      padding: "14px 24px",
      borderBottom: "1px solid #e2e8f0",
      background: "#fff",
      overflowX: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: "max-content" }}>
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {/* Step dot + label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: done ? "#0ea5e9" : active ? "#0ea5e9" : "#e2e8f0",
                  color: done || active ? "#fff" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, fontFamily: "DM Mono, monospace",
                  boxShadow: active ? "0 0 0 4px rgba(14,165,233,0.18)" : "none",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#0284c7" : done ? "#64748b" : "#94a3b8",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 32, height: 2, margin: "0 4px",
                  marginBottom: 18,
                  background: i < current ? "#0ea5e9" : "#e2e8f0",
                  transition: "background 0.3s",
                  flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
