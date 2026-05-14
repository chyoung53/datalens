-- ============================================================
-- DataLens AI — Supabase Schema
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- ─── profiles 테이블 (닉네임 저장) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nickname  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인만 조회/수정 가능
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── (선택) analysis_history 테이블 (분석 기록 저장) ─────────
-- 분석 결과 이력을 저장하려면 아래 테이블도 생성하세요.
-- 현재 앱은 세션 내 메모리만 사용하므로 필수가 아닙니다.

CREATE TABLE IF NOT EXISTS public.analysis_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  question     TEXT,
  summary      TEXT,
  row_count    INTEGER,
  col_count    INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history: select own"
  ON public.analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "history: insert own"
  ON public.analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history: delete own"
  ON public.analysis_history FOR DELETE
  USING (auth.uid() = user_id);

-- ─── (선택) 이메일 인증 없이 바로 로그인 허용하려면 ─────────
-- Supabase Dashboard > Authentication > Email > "Confirm email" 을 OFF로 설정하세요.
-- SQL로는 설정할 수 없으며 대시보드에서만 변경 가능합니다.
