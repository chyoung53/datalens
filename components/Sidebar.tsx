"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  nickname: string;
  email: string;
  apiKey: string;
  apiVerified: boolean;
  onApiKeyChange: (key: string) => void;
  onApiVerified: (ok: boolean) => void;
  onReset: () => void;
}

export default function Sidebar({ nickname, email, onReset }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <aside style={{
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
    }}>
      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute", top: 16, right: 8, zIndex: 20,
          width: 28, height: 28, borderRadius: "50%",
          background: "#0ea5e9", color: "#fff",
          border: "2px solid #fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(14,165,233,0.4)",
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
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={15} color="#ef4444" />
          {!collapsed && <span style={{ color: "#ef4444", fontWeight: 600 }}>로그아웃</span>}
        </button>

        <div style={{ height: 1, background: "#e2e8f0", marginBottom: 16 }} />

        {/* New Analysis */}
        {!collapsed && (
          <button
            onClick={onReset}
            style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: "auto",
              background: "transparent", border: "1px solid #e2e8f0",
              borderRadius: 9, padding: "8px 14px", color: "#64748b",
              fontSize: 13, cursor: "pointer", width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <BarChart3 size={15} color="#0ea5e9" />
            <span>새 분석 시작</span>
          </button>
        )}
      </div>
    </aside>
  );
}