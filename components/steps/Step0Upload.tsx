"use client";

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { parseFile } from "@/lib/dataUtils";
import type { StepProps } from "@/types";

export default function Step0Upload({ state, onUpdate, onNext }: StepProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const rows = await parseFile(file);
      if (!rows.length) throw new Error("데이터가 없습니다.");
      const columns = Object.keys(rows[0]);
      onUpdate({ dfRaw: rows, columns, dfClean: null, edaResult: null, modelResult: null, dashResult: null });
      onNext();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "파일을 읽는 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <div className="step-tag" style={{ marginBottom: 14 }}>STEP 01</div>
      <h2 style={{ fontSize: 26, marginBottom: 8, marginTop: 0 }}>데이터 파일 업로드</h2>
      <p style={{ color: "#64748b", marginBottom: 32, fontSize: 14 }}>
        CSV 또는 Excel 파일을 업로드하면 AI가 자동으로 분석합니다.
      </p>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#0ea5e9" : "#cbd5e1"}`,
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(14,165,233,0.04)" : "#f8fafc",
          transition: "all 0.2s",
          marginBottom: 16,
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "linear-gradient(135deg,rgba(14,165,233,0.15),rgba(99,102,241,0.1))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Upload size={24} color="#0ea5e9" />
        </div>
        <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
          {dragging ? "여기에 놓으세요!" : "클릭하거나 파일을 드래그하세요"}
        </p>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>CSV, XLSX, XLS 지원</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#0284c7", fontSize: 14 }}>
          <span className="spinner" />
          <span>파일 파싱 중...</span>
        </div>
      )}
      {error && (
        <div className="warn-box" style={{ fontSize: 13 }}>⚠️ {error}</div>
      )}

      {/* Existing data badge */}
      {state.dfRaw && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          <FileText size={15} color="#10b981" />
          <span style={{ fontSize: 13, color: "#065f46" }}>
            이미 로드된 데이터: <strong>{state.dfRaw.length.toLocaleString()}행 × {state.columns.length}열</strong>
          </span>
          <button className="btn-primary" onClick={onNext} style={{ marginLeft: "auto", fontSize: 12, padding: "6px 14px" }}>
            계속하기 →
          </button>
        </div>
      )}

      {/* Guide */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>지원 파일 형식</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📊", title: "CSV (.csv)", desc: "쉼표 구분 텍스트. UTF-8, EUC-KR 인코딩 지원" },
            { icon: "📗", title: "Excel (.xlsx/.xls)", desc: "첫 번째 시트의 데이터를 자동으로 읽습니다" },
          ].map((f) => (
            <div key={f.title} className="card-soft" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
