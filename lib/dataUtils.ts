import type {
  ColTypeEnum,
  ColStats,
  DataRow,
  PrepLog,
} from "@/types";

// ─── 통계 유틸 ─────────────────────────────────────────────────────────────

function sortedNums(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function stdDev(nums: number[], mean: number): number {
  if (nums.length < 2) return 0;
  const variance =
    nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

// ─── 컬럼 타입 감지 ────────────────────────────────────────────────────────

export function detectType(
  values: (string | number | null)[]
): ColTypeEnum {
  const nonNull = values.filter(
    (v) => v !== null && v !== "" && v !== undefined
  );
  if (nonNull.length === 0) return "empty";

  const numCount = nonNull.filter((v) => !isNaN(Number(v))).length;
  const numRatio = numCount / nonNull.length;
  if (numRatio > 0.8) return "numeric";

  const unique = new Set(nonNull).size;
  const uniqueRatio = unique / nonNull.length;
  return uniqueRatio < 0.2 ? "categorical" : "text";
}

// ─── 컬럼 통계 계산 ────────────────────────────────────────────────────────

export function colStats(
  values: (string | number | null)[],
  type: ColTypeEnum
): ColStats | null {
  if (type === "numeric") {
    const nums = values
      .map((v) => Number(v))
      .filter((v) => !isNaN(v) && isFinite(v));
    if (nums.length === 0) return null;

    const sorted = sortedNums(nums);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const q1 = percentile(sorted, 25);
    const q3 = percentile(sorted, 75);
    const iqr = q3 - q1;

    return {
      count: nums.length,
      mean: round(mean, 3),
      std: round(stdDev(nums, mean), 3),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: percentile(sorted, 50),
      q1,
      q3,
      iqr,
      missing: values.filter((v) => v === null || v === "" || v === undefined)
        .length,
      outlierLow: q1 - 1.5 * iqr,
      outlierHigh: q3 + 1.5 * iqr,
    };
  } else {
    const nonNull = values.filter((v) => v !== null && v !== "");
    const freq: Record<string, number> = {};
    nonNull.forEach((v) => {
      const s = String(v);
      freq[s] = (freq[s] || 0) + 1;
    });
    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    return {
      count: nonNull.length,
      mean: 0,
      std: 0,
      min: 0,
      max: 0,
      median: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      missing: values.filter((v) => v === null || v === "").length,
      outlierLow: 0,
      outlierHigh: 0,
      unique: Object.keys(freq).length,
      top,
    };
  }
}

// ─── 전처리 ────────────────────────────────────────────────────────────────

export function preprocess(
  data: DataRow[],
  colTypes: Record<string, ColTypeEnum>,
  statsMap: Record<string, ColStats>
): { cleaned: DataRow[]; log: PrepLog[] } {
  const cleaned = data.map((row) => ({ ...row }));
  const log: PrepLog[] = [];

  for (const [col, type] of Object.entries(colTypes)) {
    const stats = statsMap[col];
    if (!stats) continue;

    if (type === "numeric") {
      // 결측값 → 중앙값 대체
      let missingCount = 0;
      cleaned.forEach((row) => {
        const v = row[col];
        if (v === null || v === "" || v === undefined || isNaN(Number(v))) {
          row[col] = stats.median;
          missingCount++;
        } else {
          row[col] = Number(v);
        }
      });
      if (missingCount > 0) {
        log.push({
          col,
          action: "결측값 대체",
          detail: `${missingCount}개 → 중앙값(${round(stats.median, 3)}) 대체`,
          count: missingCount,
          type: "missing",
        });
      }

      // 이상치 클리핑 (IQR 기준)
      if (stats.iqr > 0) {
        let outlierCount = 0;
        cleaned.forEach((row) => {
          const v = Number(row[col]);
          if (v < stats.outlierLow || v > stats.outlierHigh) {
            row[col] = Math.max(stats.outlierLow, Math.min(stats.outlierHigh, v));
            outlierCount++;
          }
        });
        if (outlierCount > 0) {
          log.push({
            col,
            action: "이상치 처리",
            detail: `${outlierCount}개 → IQR 범위(${round(stats.outlierLow, 2)}~${round(stats.outlierHigh, 2)}) 클리핑`,
            count: outlierCount,
            type: "outlier",
          });
        }
      }
    } else if (type === "categorical") {
      // 결측값 → 최빈값 대체
      const top = stats.top?.[0] ?? "N/A";
      let missingCount = 0;
      cleaned.forEach((row) => {
        if (row[col] === null || row[col] === "" || row[col] === undefined) {
          row[col] = top;
          missingCount++;
        }
      });
      if (missingCount > 0) {
        log.push({
          col,
          action: "범주 결측 대체",
          detail: `${missingCount}개 → 최빈값('${top}') 대체`,
          count: missingCount,
          type: "missing",
        });
      }
    }
  }

  return { cleaned, log };
}

// ─── AI 컨텍스트 빌드 ─────────────────────────────────────────────────────

export function buildContext(
  data: DataRow[],
  colTypes: Record<string, ColTypeEnum>,
  statsMap: Record<string, ColStats>,
  units: Record<string, string>,
  question: string,
  koreanNames: Record<string, string> = {}
): object {
  const numCols = Object.entries(colTypes)
    .filter(([, t]) => t === "numeric")
    .map(([c]) => c);

  // 상관관계 계산
  const corrs: { a: string; b: string; r: number }[] = [];
  if (numCols.length >= 2) {
    for (let i = 0; i < numCols.length; i++) {
      for (let j = i + 1; j < numCols.length; j++) {
        const r = pearsonCorr(
          data.map((row) => Number(row[numCols[i]])),
          data.map((row) => Number(row[numCols[j]]))
        );
        if (!isNaN(r)) corrs.push({ a: numCols[i], b: numCols[j], r: round(r, 4) });
      }
    }
    corrs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }

  const colsInfo = Object.entries(colTypes).map(([col, type]) => {
    const s = statsMap[col];
    const base: Record<string, unknown> = {
      n: col,
      display: koreanNames[col] || col,
      t: type,
      u: units[col] || null,
    };
    if (type === "numeric" && s) {
      base.min = s.min;
      base.max = s.max;
      base.mean = round(s.mean, 3);
      base.std = round(s.std, 3);
      base.median = round(s.median, 3);
      base.missing = s.missing;
    } else if (type === "categorical" && s) {
      base.unique = s.unique;
      base.top = s.top?.slice(0, 3);
      base.missing = s.missing;
    }
    return base;
  });

  return {
    rows: data.length,
    cols: colsInfo,
    topCorr: corrs.slice(0, 8),
    question,
  };
}

// ─── 피어슨 상관계수 ────────────────────────────────────────────────────────

function pearsonCorr(xs: number[], ys: number[]): number {
  const pairs = xs
    .map((x, i) => [x, ys[i]])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b) && isFinite(a) && isFinite(b));
  if (pairs.length < 2) return NaN;

  const n = pairs.length;
  const mx = pairs.reduce((s, [a]) => s + a, 0) / n;
  const my = pairs.reduce((s, [, b]) => s + b, 0) / n;
  const num = pairs.reduce((s, [a, b]) => s + (a - mx) * (b - my), 0);
  const den = Math.sqrt(
    pairs.reduce((s, [a]) => s + (a - mx) ** 2, 0) *
      pairs.reduce((s, [, b]) => s + (b - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

// ─── CSV / Excel 파싱 ──────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<DataRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return parseCSV(file);
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(file);
  }
  throw new Error("지원하지 않는 파일 형식입니다. CSV 또는 Excel(.xlsx/.xls) 파일을 업로드해 주세요.");
}

async function parseCSV(file: File): Promise<DataRow[]> {
  const Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => resolve(result.data as DataRow[]),
      error: reject,
    });
  });
}

async function parseExcel(file: File): Promise<DataRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null }) as DataRow[];
}

// ─── JSON 안전 파싱 ────────────────────────────────────────────────────────

export function safeJSON(raw: string): Record<string, unknown> {
  if (!raw) throw new Error("빈 응답");
  
  // 마크다운 코드블록 제거
  let s = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  
  // JSON 시작점 찾기
  const start = s.indexOf("{");
  if (start === -1) throw new Error(`JSON 없음. 응답: ${raw.slice(0, 200)}`);
  s = s.slice(start);
  
  // JSON 끝점 찾기
  const end = s.lastIndexOf("}");
  if (end !== -1) s = s.slice(0, end + 1);

  // 1차 파싱 시도
  try {
    return JSON.parse(s);
  } catch {
    // 2차: 일반적인 오류 수정
    try {
      const fixed = s
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
      return JSON.parse(fixed);
    } catch {
      // 3차: 잘린 JSON 복구
      try {
        let truncated = s;
        // 열린 배열/객체 닫기
        const opens = (truncated.match(/\[/g) || []).length;
        const closes = (truncated.match(/\]/g) || []).length;
        for (let i = 0; i < opens - closes; i++) truncated += "]";
        const objOpens = (truncated.match(/\{/g) || []).length;
        const objCloses = (truncated.match(/\}/g) || []).length;
        for (let i = 0; i < objOpens - objCloses; i++) truncated += "}";
        return JSON.parse(truncated);
      } catch {
        throw new Error(`JSON 파싱 실패: ${s.slice(0, 200)}`);
      }
    }
  }
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  if (Math.abs(n) < 0.01 && n !== 0) return n.toExponential(2);
  return n.toFixed(2);
}

// 컬럼에서 값 배열 추출
export function colValues(
  data: DataRow[],
  col: string
): (string | number | null)[] {
  return data.map((row) => row[col] ?? null);
}

// 수치형 컬럼 히스토그램 데이터 (30 bins)
export function histogramData(
  data: DataRow[],
  col: string
): { range: string; count: number }[] {
  const nums = colValues(data, col)
    .map(Number)
    .filter((v) => !isNaN(v) && isFinite(v));
  if (nums.length === 0) return [];

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const bins = 20;
  const binSize = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);

  nums.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
    counts[idx]++;
  });

  return counts.map((count, i) => ({
    range: `${formatNumber(min + i * binSize)}`,
    count,
  }));
}

// 상관관계 매트릭스 (heatmap용)
export function correlationMatrix(
  data: DataRow[],
  numCols: string[]
): { row: string; col: string; value: number }[] {
  const result: { row: string; col: string; value: number }[] = [];
  for (const a of numCols) {
    for (const b of numCols) {
      const va = data.map((r) => Number(r[a])).filter((v) => !isNaN(v));
      const vb = data.map((r) => Number(r[b])).filter((v) => !isNaN(v));
      result.push({
        row: a,
        col: b,
        value: round(pearsonCorr(va, vb), 2),
      });
    }
  }
  return result;
}
