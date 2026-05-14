"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Tab = "login" | "register";
type Msg = { type: "error" | "success"; text: string } | null;

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("login");
  const [msg, setMsg] = useState<Msg>(null);
  const [loading, setLoading] = useState(false);

  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // 회원가입 폼
  const [regEmail, setRegEmail] = useState("");
  const [regNick, setRegNick] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regPw2, setRegPw2] = useState("");

  const switchTab = (t: Tab) => {
    setTab(t);
    setMsg(null);
  };

  // ── 로그인 ──────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPw,
    });

    if (error) {
      setMsg({ type: "error", text: "이메일 또는 비밀번호가 올바르지 않습니다." });
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  // ── 회원가입 ─────────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (regPw !== regPw2) {
      setMsg({ type: "error", text: "비밀번호가 일치하지 않습니다." });
      setLoading(false);
      return;
    }
    if (!regNick.trim()) {
      setMsg({ type: "error", text: "닉네임을 입력해 주세요." });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPw,
    });

    if (error) {
      setMsg({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    // profiles 테이블에 닉네임 저장
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        nickname: regNick.trim(),
      });
    }

    setMsg({ type: "success", text: "회원가입 완료! 로그인해 주세요. (이메일 인증이 필요할 수 있습니다)" });
    setTab("login");
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#fff",
            boxShadow: "0 4px 14px rgba(14,165,233,.35)",
          }}>◈</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#0ea5e9", letterSpacing: "-0.5px" }}>
            DataLens AI
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>
          no-code · AI powered · Gemini 2.0
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 22, padding: "36px 40px", width: "100%", maxWidth: 440,
        boxShadow: "0 8px 32px rgba(14,165,233,0.10)",
      }}>
        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                border: tab === t ? "none" : "1.5px solid #e2e8f0",
                background: tab === t ? "#0ea5e9" : "#f8fafc",
                color: tab === t ? "#fff" : "#64748b",
                fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {t === "login" ? "🔑 로그인" : "✏️ 회원가입"}
            </button>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            background: msg.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${msg.type === "error" ? "rgba(239,68,68,0.28)" : "rgba(16,185,129,0.28)"}`,
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, color: msg.type === "error" ? "#b91c1c" : "#065f46",
            marginBottom: 16,
          }}>
            {msg.type === "error" ? "⚠️" : "✅"} {msg.text}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>이메일</label>
              <input
                type="email" required placeholder="example@email.com"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>비밀번호</label>
              <input
                type="password" required placeholder="비밀번호를 입력하세요"
                value={loginPw} onChange={(e) => setLoginPw(e.target.value)}
              />
            </div>
            <button
              type="submit" className="btn-primary" disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
            >
              {loading ? <><span className="spinner" /> 로그인 중...</> : "로그인"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>이메일</label>
              <input
                type="email" required placeholder="example@email.com"
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>닉네임</label>
              <input
                type="text" required placeholder="화면에 표시될 이름"
                value={regNick} onChange={(e) => setRegNick(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>비밀번호 (6자 이상)</label>
              <input
                type="password" required minLength={6} placeholder="비밀번호"
                value={regPw} onChange={(e) => setRegPw(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>비밀번호 확인</label>
              <input
                type="password" required placeholder="비밀번호 재입력"
                value={regPw2} onChange={(e) => setRegPw2(e.target.value)}
              />
            </div>
            <button
              type="submit" className="btn-primary" disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
            >
              {loading ? <><span className="spinner" /> 처리 중...</> : "회원가입"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#94a3b8", lineHeight: 1.9 }}>
          업로드한 데이터는 서버에 저장되지 않습니다<br />
          회원 정보는 Supabase에 안전하게 보관됩니다
        </p>
      </div>
    </div>
  );
}
