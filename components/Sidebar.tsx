"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, Key, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";

interface SidebarProps {
  nickname: string;
  email: string;
  apiKey: string;
  apiVerified: boolean;
  onApiKeyChange: (key: string) => void;
  onApiVerified: (ok: boolean) => void;
  onReset: () => void;
}

export default function Sidebar({
  nickname,
  email,
  apiKey,
  apiVerified,
  onApiKeyChange,
  onApiVerified,
  onReset,
}: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  async function testApiKey() {
    setTestLoading(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          systemPrompt: "You are a test assistant. Reply only with the word: OK",
          userMessage: "test",
          maxTokens: 10,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onApiVerified(true);
      setTestMsg({ ok: true, text: "✅ 연결 성공!" });
    } catch (e) {
      onApiVerified(false);
      setTestMsg({ ok: false, text: "❌ 연결 실패: 키를 확인해 주세요." });
    }
    setTestLoading(false);
  }

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        minHeight: "100vh",
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute", top: 16, right: -13, zIndex: 10,
          width: 26, height: 26, borderRadius: "50%",
          background: "#0ea5e9", color: "#fff", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(14,165,233,0.3)",
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div style={{ padding: collapsed ? "18px 12px" : "18px 18px", display: "flex", flexDirection: "column", gap: 0, flex: 1, overflowY: "auto" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", flexShrink: 0,
          }}>◈</div>
          {!collapsed && (
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 17, color: "#0ea5e9", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
              DataLens AI
            </span>
          )}
        </div>

        {/* User Card */}
        {!collapsed && (
          <div style={{
            background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(99,102,241,0.07))",
            border: "1px solid rgba(14,165,233,0.22)",
            borderRadius: 12, padding: "11px 14px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 9, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".08em", marginBottom: 4 }}>👤 로그인된 계정</div>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 2 }}>{nickname}</div>
            <div style={{ fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="로그아웃"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "1px solid #e2e8f0",
            borderRadius: 9, padding: collapsed ? "8px 10px" : "8px 14px",
            color: "#64748b", fontSize: 13, cursor: "pointer",
            marginBottom: 16, width: "100%",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={15} color="#ef4444" />
          {!collapsed && <span style={{ color: "#ef4444", fontWeight: 600 }}>로그아웃</span>}
        </button>

        <div style={{ height: 1, background: "#e2e8f0", marginBottom: 16 }} />

        {/* API Key Section */}
        {!collapsed && (
          <>
            <div style={{ fontSize: 13, fontFamily: "Syne,sans-serif", fontWeight: 800, color: "#0284c7", marginBottom: 10 }}>
              ⚙️ 설정
            </div>
            <div style={{
              background: "#f0f9ff", border: "1px solid rgba(14,165,233,0.3)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Key size={12} color="#0284c7" />
                <span style={{ fontSize: 10, color: "#0284c7", fontFamily: "DM Mono,monospace", letterSpacing: ".08em" }}>GEMINI API KEY</span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, margin: "0 0 8px" }}>
                Google AI Studio에서 발급받은 키를 입력하세요.{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  style={{ color: "#0284c7", fontSize: 10 }}>→ 키 발급받기</a>
              </p>
              <input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => { onApiKeyChange(e.target.value); onApiVerified(false); setTestMsg(null); }}
                style={{ fontSize: 12, padding: "7px 10px", marginBottom: 8 }}
              />
              {apiKey && !apiVerified && (
                <button
                  onClick={testApiKey}
                  disabled={testLoading}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "6px 14px", width: "100%", justifyContent: "center" }}
                >
                  {testLoading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 테스트 중...</> : "🔗 연결 테스트"}
                </button>
              )}
              {testMsg && (
                <div style={{ fontSize: 11, marginTop: 6, color: testMsg.ok ? "#065f46" : "#b91c1c" }}>
                  {testMsg.text}
                </div>
              )}
              {apiVerified && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 6,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8, padding: "6px 10px",
                }}>
                  <CheckCircle size={13} color="#10b981" />
                  <span style={{ fontSize: 11, color: "#065f46", fontWeight: 600 }}>API 키 연결됨</span>
                </div>
              )}
              {!apiKey && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 4,
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 8, padding: "6px 10px",
                }}>
                  <AlertCircle size={13} color="#f59e0b" />
                  <span style={{ fontSize: 11, color: "#92400e" }}>키 입력 시 AI 분석 활성화</span>
                </div>
              )}
            </div>

            {/* New Analysis */}
            <button
              onClick={onReset}
              style={{
                display: "flex", alignItems: "center", gap: 8, marginTop: "auto",
                background: "transparent", border: "1px solid #e2e8f0",
                borderRadius: 9, padding: "8px 14px", color: "#64748b",
                fontSize: 13, cursor: "pointer", width: "100%",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <BarChart3 size={15} color="#0ea5e9" />
              <span>새 분석 시작</span>
            </button>
          </>
        )}

        {/* Collapsed icons */}
        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div title={apiVerified ? "API 연결됨" : "API 키 필요"}>
              {apiVerified
                ? <CheckCircle size={18} color="#10b981" />
                : <Key size={18} color="#f59e0b" />}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
