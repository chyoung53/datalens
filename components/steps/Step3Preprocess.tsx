"use client";

import { useState } from "react";
import { preprocess } from "@/lib/dataUtils";
import type { StepProps } from "@/types";
import { Zap } from "lucide-react";

export default function Step3Preprocess({ state, onUpdate, onNext, onBack }: StepProps) {
  const [ran, setRan] = useState(!!state.dfClean);

  function runPreprocess() {
    if (!state.dfRaw) return;
    const { cleaned, log } = preprocess(state.dfRaw, state.colTypes, state.colStatsMap);
    onUpdate({ dfClean: cleaned, prepLog: log });
    setRan(true);
  }

  const log = state.prepLog;
  const missingFixes = log.filter((l) => l.type === "missing");
  const outlierFixes = log.filter((l) => l.type === "outlier");

  return (
    <div style={{ padding: "32px 28px", maxWidth: 800, margin: "0 auto" }}>
      <div className="step-tag" style={{ marginBottom: 12 }}>STEP 04</div>
      <h2 style={{ fontSize: 24, marginBottom: 6, marginTop: 0 }}>데이터 전처리</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        결측값과 이상치를 자동으로 처리합니다.
      </p>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div className="card-soft" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>📌 결측값 처리</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
            <li>수치형 → 중앙값(median) 대체</li>
            <li>범주형 → 최빈값(mode) 대체</li>
          </ul>
        </div>
        <div className="card-soft" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>⚡ 이상치 처리</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
            <li>IQR 기준 1.5× 초과 값 클리핑</li>
            <li>범주형은 이상치 처리 없음</li>
          </ul>
        </div>
      </div>

      {!ran ? (
        <button className="btn-primary" onClick={runPreprocess} style={{ marginBottom: 24 }}>
          <Zap size={15} />
          전처리 실행
        </button>
      ) : (
        <>
          {/* Results */}
          <div style={{
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#065f46" }}>전처리 완료</div>
              <div style={{ fontSize: 12, color: "#047857" }}>
                결측값 처리 {missingFixes.length}건 · 이상치 처리 {outlierFixes.length}건
              </div>
            </div>
            <button
              onClick={runPreprocess}
              className="btn-secondary"
              style={{ marginLeft: "auto", fontSize: 12, padding: "5px 12px" }}
            >
              재실행
            </button>
          </div>

          {/* Log Table */}
          {log.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>전처리 로그</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {["컬럼", "처리 유형", "처리 건수", "상세"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{l.col}</td>
                        <td>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 6,
                            fontSize: 11, fontWeight: 600,
                            background: l.type === "missing" ? "rgba(14,165,233,0.1)" : "rgba(245,158,11,0.1)",
                            color: l.type === "missing" ? "#0284c7" : "#b45309",
                          }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{ color: l.count > 0 ? "#ef4444" : "#10b981" }}>{l.count}건</td>
                        <td style={{ color: "#64748b", fontSize: 11 }}>{l.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {log.length === 0 && (
            <div className="card-soft" style={{ padding: "16px 18px", marginBottom: 24, color: "#64748b", fontSize: 13 }}>
              🎉 처리할 결측값 또는 이상치가 없습니다. 데이터 품질이 좋습니다!
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext} disabled={!ran}>
          다음: 분석 질문 →
        </button>
      </div>
    </div>
  );
}
