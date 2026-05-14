"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import Step0Upload from "@/components/steps/Step0Upload";
import Step1DataCheck from "@/components/steps/Step1DataCheck";
import Step2FeatureSetup from "@/components/steps/Step2FeatureSetup";
import Step3Preprocess from "@/components/steps/Step3Preprocess";
import Step4Question from "@/components/steps/Step4Question";
import Step5EDA from "@/components/steps/Step5EDA";
import Step6Modeling from "@/components/steps/Step6Modeling";
import Step7Dashboard from "@/components/steps/Step7Dashboard";
import type { AppState } from "@/types";

const INITIAL_STATE: AppState = {
  step: 0,
  dfRaw: null,
  dfClean: null,
  columns: [],
  colTypes: {},
  colStatsMap: {},
  units: {},
  colKoreanNames: {},
  prepLog: [],
  question: "",
  edaResult: null,
  modelResult: null,
  dashResult: null,
  geminiApiKey: "",
  apiVerified: false,
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ email: string; nickname: string } | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 로드
  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { window.location.href = "/auth"; return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", u.id)
        .single();

      setUser({ email: u.email ?? "", nickname: profile?.nickname ?? u.email?.split("@")[0] ?? "사용자" });
      setLoading(false);
    }
    loadUser();
  }, []);

  function updateState(updates: Partial<AppState>) {
    setAppState((prev) => ({ ...prev, ...updates }));
  }

  function goNext() {
    setAppState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 7) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setAppState((prev) => {
      const newStep = Math.max(prev.step - 1, 0);
      // 뒤로 가면 이후 AI 결과 초기화
      const updates: Partial<AppState> = { step: newStep };
      if (newStep < 5) updates.edaResult = null;
      if (newStep < 6) updates.modelResult = null;
      if (newStep < 7) updates.dashResult = null;
      return { ...prev, ...updates };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    setAppState({ ...INITIAL_STATE, geminiApiKey: appState.geminiApiKey, apiVerified: appState.apiVerified });
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const stepProps = {
    state: appState,
    onUpdate: updateState,
    onNext: goNext,
    onBack: goBack,
  };

  const steps = [
    <Step0Upload {...stepProps} key={0} />,
    <Step1DataCheck {...stepProps} key={1} />,
    <Step2FeatureSetup {...stepProps} key={2} />,
    <Step3Preprocess {...stepProps} key={3} />,
    <Step4Question {...stepProps} key={4} />,
    <Step5EDA {...stepProps} key={5} />,
    <Step6Modeling {...stepProps} key={6} />,
    <Step7Dashboard {...stepProps} key={7} />,
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Sidebar */}
      <Sidebar
        nickname={user?.nickname ?? "사용자"}
        email={user?.email ?? ""}
        apiKey={appState.geminiApiKey}
        apiVerified={appState.apiVerified}
        onApiKeyChange={(key) => updateState({ geminiApiKey: key })}
        onApiVerified={(ok) => updateState({ apiVerified: ok })}
        onReset={resetAll}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        {/* Step Indicator */}
        <StepIndicator current={appState.step} />

        {/* Step Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {steps[appState.step]}
        </div>
      </div>
    </div>
  );
}
