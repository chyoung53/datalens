export type ColTypeEnum = "numeric" | "categorical" | "text" | "empty";

export interface ColStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  missing: number;
  outlierLow: number;
  outlierHigh: number;
  unique?: number;
  top?: string[];
}

export interface PrepLog {
  col: string;
  action: string;
  detail: string;
  count: number;
  type: "missing" | "outlier";
}

export interface ChartConfig {
  type: "bar" | "pie" | "scatter" | "line" | "area";
  xColumn: string;
  yColumn?: string;
  title: string;
  description: string;
}

export interface EDAResult {
  summary: string;
  insights: string[];
  targetVariable: string;
  suggestedModelType: string;
  chartConfig: ChartConfig[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: "positive" | "negative";
}

export interface ModelResult {
  selectedModel: string;
  features: FeatureImportance[];
  performance: {
    metric: string;
    value?: number;
  };
  recommendation: string;
}

export interface TopInsight {
  rank: number;
  emoji: string;
  title: string;
  finding: string;
  impact: string;
  action: string;
}

export interface KPI {
  label: string;
  value: string;
  status: "good" | "warning" | "bad";
  note: string;
}

export interface Risk {
  risk: string;
  severity: "high" | "medium" | "low";
  mitigation: string;
}

export interface DashResult {
  executiveSummary: string;
  topInsights: TopInsight[];
  kpis: KPI[];
  risks: Risk[];
  nextSteps: string[];
}

export type DataRow = Record<string, string | number | null>;

export interface AppState {
  step: number;
  dfRaw: DataRow[] | null;
  dfClean: DataRow[] | null;
  columns: string[];
  colTypes: Record<string, ColTypeEnum>;
  colStatsMap: Record<string, ColStats>;
  units: Record<string, string>;
  colKoreanNames: Record<string, string>;
  prepLog: PrepLog[];
  question: string;
  edaResult: EDAResult | null;
  modelResult: ModelResult | null;
  dashResult: DashResult | null;
  geminiApiKey: string;
  apiVerified: boolean;
}

export interface StepProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}
