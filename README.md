# DataLens AI — Next.js + Supabase + Vercel

노코딩 AI 통계 분석 플랫폼. Streamlit Python → **Next.js 14 + TypeScript + Supabase + Vercel** 마이그레이션 버전.

---

## 🗂 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 인증 / DB | Supabase (Auth + PostgreSQL) |
| 배포 | Vercel |
| AI | Google Gemini 2.0/2.5 Flash |
| 차트 | Recharts |
| PDF | jsPDF |
| CSV | PapaParse |
| Excel | SheetJS (xlsx) |

---

## 🚀 로컬 실행 방법

### 1. 패키지 설치

```bash
npm install
# 또는
yarn install
```

### 2. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **SQL Editor** → `supabase/schema.sql` 전체 내용 붙여넣기 후 실행
3. **Authentication → Email** → "Confirm email" **OFF** (개발 편의 설정)
4. **Settings → API** 에서 `URL`과 `anon key` 복사

### 3. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 Supabase 정보 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

---

## ☁️ Vercel 배포

### 방법 1 — GitHub 연동 (권장)

1. 이 프로젝트를 GitHub에 push
2. [vercel.com](https://vercel.com) 에서 **Import Project** → GitHub 저장소 선택
3. **Environment Variables** 섹션에 아래 두 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 클릭

### 방법 2 — Vercel CLI

```bash
npm i -g vercel
vercel
# 대화형 설정 후 환경변수 추가:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🔑 Gemini API 키 설정

앱 UI의 **사이드바 → ⚙️ 설정** 에서 개인 Gemini API 키를 입력합니다.  
API 키는 서버에 저장되지 않으며, 세션 메모리에만 유지됩니다.

- 키 발급: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- 무료 티어로도 사용 가능

---

## 📁 프로젝트 구조

```
datalens-nextjs/
├── app/
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # / → /dashboard 리다이렉트
│   ├── globals.css              # 전역 스타일 (Syne + DM Sans)
│   ├── auth/
│   │   └── page.tsx             # 로그인 / 회원가입 페이지
│   ├── dashboard/
│   │   └── page.tsx             # 메인 앱 (8 Step 분석 플로우)
│   └── api/
│       └── gemini/
│           └── route.ts         # Gemini API 서버 라우트
│
├── components/
│   ├── Sidebar.tsx              # 사이드바 (유저 정보, API 키, 로그아웃)
│   ├── StepIndicator.tsx        # 단계 진행 표시
│   ├── ChartRenderer.tsx        # Recharts 차트 렌더러
│   └── steps/
│       ├── Step0Upload.tsx      # 파일 업로드
│       ├── Step1DataCheck.tsx   # 데이터 미리보기 + 컬럼 정보
│       ├── Step2FeatureSetup.tsx# 피처 타입 / 이름 / 단위 설정
│       ├── Step3Preprocess.tsx  # 결측값 / 이상치 전처리
│       ├── Step4Question.tsx    # 분석 질문 입력
│       ├── Step5EDA.tsx         # AI EDA + 시각화
│       ├── Step6Modeling.tsx    # AI 모델링 분석
│       └── Step7Dashboard.tsx   # 비즈니스 대시보드 + PDF
│
├── lib/
│   ├── supabase.ts              # Supabase 브라우저 클라이언트
│   └── dataUtils.ts            # 데이터 처리 유틸 (TS 포팅)
│
├── types/
│   └── index.ts                 # TypeScript 타입 정의
│
├── middleware.ts                 # 인증 라우트 보호
├── supabase/
│   └── schema.sql               # DB 스키마 (Supabase SQL Editor용)
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## 📊 분석 플로우 (8 단계)

| 단계 | 이름 | 설명 |
|------|------|------|
| 1 | 업로드 | CSV / XLSX 파일 드래그&드롭 |
| 2 | 데이터 확인 | 미리보기, 컬럼 타입 자동 감지 |
| 3 | 피처 설정 | 타입 수정, 한국어명, 단위 추가 |
| 4 | 전처리 | 결측값(중앙값/최빈값), 이상치(IQR) 자동 처리 |
| 5 | 질문 | 비즈니스 분석 질문 입력 |
| 6 | EDA | AI 탐색적 분석 + 자동 차트 생성 |
| 7 | 모델링 | AI 피처 중요도 + 최적 모델 추천 |
| 8 | 대시보드 | 경영진 요약, KPI, 리스크, 로드맵 + PDF 내보내기 |

---

## 🔄 Python(Streamlit) vs Next.js 주요 변경사항

| 항목 | Python/Streamlit | Next.js/Supabase |
|------|-----------------|------------------|
| 인증 | JSON 파일 (로컬) | Supabase Auth (이메일/비밀번호) |
| 세션 | `st.session_state` | React `useState` |
| 데이터 저장 | 메모리 (ephemeral) | 메모리 (ephemeral) — 업로드 데이터 미저장 |
| 차트 | Plotly | Recharts |
| PDF | fpdf2 | jsPDF |
| AI 호출 | 직접 호출 | `/api/gemini` 서버 라우트 경유 |
| 배포 | 수동/Streamlit Cloud | Vercel (자동 CI/CD) |

---

## 📝 License

MIT
