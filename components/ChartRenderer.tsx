"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList,
} from "recharts";
import type { ChartConfig, ColStats, DataRow } from "@/types";
import { kMeans, correlationMatrix, formatNumber } from "@/lib/dataUtils";

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#8b5cf6", "#06b6d4"];

interface ChartRendererProps {
  config: ChartConfig;
  data: DataRow[];
  height?: number;
}

export default function ChartRenderer({ config, data, height = 240 }: ChartRendererProps) {
  const { type, xColumn, yColumn, title } = config;

  if (!xColumn || !data.length) return null;
  if (!data[0].hasOwnProperty(xColumn)) return null;

  try {
    switch (type) {
      case "bar": {
        if (yColumn && data[0].hasOwnProperty(yColumn)) {
          // 집계 바 차트 (xColumn별 yColumn 평균)
          const groups: Record<string, number[]> = {};
          data.forEach((row) => {
            const k = String(row[xColumn] ?? "");
            const v = Number(row[yColumn]);
            if (!isNaN(v)) {
              groups[k] = groups[k] || [];
              groups[k].push(v);
            }
          });
          const chartData = Object.entries(groups)
  .map(([name, vals]) => ({
    name,
    평균: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
  }))
  .sort((a, b) => b.평균 - a.평균)
  .slice(0, 12);
          const minVal = chartData.reduce((m, d) => Math.min(m, d.평균), Infinity);
          const yMin = Math.floor(minVal * 0.95 * 10) / 10;
          return (
            <ChartWrapper title={title}>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={[yMin, "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="평균" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <LabelList dataKey="평균" position="top" style={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          );
        } else {
          // 빈도 바 차트
          const freq: Record<string, number> = {};
          data.forEach((row) => {
            const k = String(row[xColumn] ?? "");
            freq[k] = (freq[k] || 0) + 1;
          });
          const chartData = Object.entries(freq)
  .map(([name, count]) => ({ name: isNaN(Number(name)) ? name : Number(name), count, sortKey: isNaN(Number(name)) ? name : Number(name) }))
  .sort((a, b) => typeof a.sortKey === "number" ? a.sortKey - (b.sortKey as number) : String(a.sortKey).localeCompare(String(b.sortKey)))
  .slice(0, 12)
  .map(({ name, count }) => ({ name: String(name), count }));
          return (
            <ChartWrapper title={title}>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          );
        }
      }

      case "pie": {
        const freq: Record<string, number> = {};
        data.forEach((row) => {
          const k = String(row[xColumn] ?? "");
          freq[k] = (freq[k] || 0) + 1;
        });
        const chartData = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([name, value]) => ({ name, value }));
        return (
          <ChartWrapper title={title}>
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={chartData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius="40%" outerRadius="70%"
                  paddingAngle={2}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );
      }

      // ✅ 새 코드 (교체)
case "scatter": {
  if (!yColumn || !data[0].hasOwnProperty(yColumn)) return null;

  const chartData = data
    .slice(0, 300)
    .map((row) => ({ x: Number(row[xColumn]), y: Number(row[yColumn]) }))
    .filter((d) => !isNaN(d.x) && !isNaN(d.y));

  // ✅ 1. 회귀선 계산
  const n = chartData.length;
  const mx = chartData.reduce((s, d) => s + d.x, 0) / n;
  const my = chartData.reduce((s, d) => s + d.y, 0) / n;
  const slope =
    chartData.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0) /
    chartData.reduce((s, d) => s + (d.x - mx) ** 2, 0);
  const intercept = my - slope * mx;
  const xMin = Math.min(...chartData.map((d) => d.x));
  const xMax = Math.max(...chartData.map((d) => d.x));
  const trendData = [
    { x: xMin, y: Math.round((slope * xMin + intercept) * 100) / 100 },
    { x: xMax, y: Math.round((slope * xMax + intercept) * 100) / 100 },
  ];

  // ✅ 2. X축 tick을 최대 8개로 제한하고 소수점 2자리 포맷
  const xStep = parseFloat(((xMax - xMin) / 7).toFixed(3));
  const xTicks = Array.from({ length: 8 }, (_, i) =>
    Math.round((xMin + xStep * i) * 1000) / 1000
  );

  return (
    <ChartWrapper title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart margin={{ top: 4, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          {/* ✅ 3. type="number" 로 수치형 강제 → 정렬 보장 */}
          <XAxis
            dataKey="x"
            type="number"
            name={xColumn}
            domain={["auto", "auto"]}
            ticks={xTicks}
            tickFormatter={(v) => Number(v).toFixed(2)}
            tick={{ fontSize: 10, fill: "#64748b" }}
            label={{ value: xColumn, position: "insideBottom", offset: -10, fontSize: 10 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={yColumn}
            tick={{ fontSize: 10, fill: "#64748b" }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />

          {/* 데이터 포인트 */}
          <Scatter data={chartData} fill={COLORS[0]} opacity={0.6} />

          {/* ✅ 4. 회귀선 (Line으로 표현) */}
          <Line
            data={trendData}
            type="linear"
            dataKey="y"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

      case "line": {
        if (!yColumn || !data[0].hasOwnProperty(yColumn)) return null;
        const chartData = data.slice(0, 80).map((row) => ({
          name: String(row[xColumn] ?? ""),
          value: Number(row[yColumn]),
        })).filter((d) => !isNaN(d.value));
        return (
          <ChartWrapper title={title}>
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="value" stroke={COLORS[0]} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );
      }

      case "area": {
        if (!yColumn || !data[0].hasOwnProperty(yColumn)) return null;
        const chartData = data.slice(0, 80).map((row) => ({
          name: String(row[xColumn] ?? ""),
          value: Number(row[yColumn]),
        })).filter((d) => !isNaN(d.value));
        return (
          <ChartWrapper title={title}>
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ─── Histogram ─────────────────────────────────────────────────────────────
interface HistogramProps {
  data: { range: string; count: number }[];
  title: string;
  height?: number;
}
export function Histogram({ data, title, height = 200 }: HistogramProps) {
  return (
    <ChartWrapper title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Bar dataKey="count" fill="#0ea5e9" opacity={0.8} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── Horizontal Feature Bar ────────────────────────────────────────────────
interface FeatureBarProps {
  features: { feature: string; importance: number; direction: string }[];
}
export function FeatureBar({ features }: FeatureBarProps) {
  const data = features
    .slice(0, 10)
    .map((f) => ({
      name: f.feature,
      value: Math.min(Math.round(f.importance * 100), 100),
      fill: f.direction === "positive" ? "#0ea5e9" : "#ef4444",
    }));

  return (
    <ChartWrapper title="피처 영향도 순위">
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} unit="%" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} width={90} />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── K-means 군집 산점도 ───────────────────────────────────────────────────
interface ClusterScatterProps {
  data: DataRow[];
  xCol: string;
  yCol: string;
  k?: number;
  height?: number;
}
export function ClusterScatterChart({ data, xCol, yCol, k = 3, height = 280 }: ClusterScatterProps) {
  const clustered = useMemo(() => kMeans(data, xCol, yCol, k), [data, xCol, yCol, k]);

  const groups = useMemo(
    () => Array.from({ length: k }, (_, ci) =>
      clustered.filter((p) => p.cluster === ci).map((p) => ({ x: p.x, y: p.y }))
    ),
    [clustered, k]
  );

  const xVals = clustered.map((p) => p.x);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const xStep = (xMax - xMin) / 7 || 1;
  const xTicks = Array.from({ length: 8 }, (_, i) => Math.round((xMin + xStep * i) * 100) / 100);

  if (clustered.length === 0) return null;

  return (
    <ChartWrapper title={`K-means 군집화 (${xCol} vs ${yCol}, k=${k})`}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 4, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={["auto", "auto"]}
            ticks={xTicks}
            tickFormatter={(v) => Number(v).toFixed(1)}
            tick={{ fontSize: 10, fill: "#64748b" }}
            label={{ value: xCol, position: "insideBottom", offset: -10, fontSize: 10 }}
          />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          {groups.map((pts, ci) => (
            <Scatter key={ci} name={`군집 ${ci + 1}`} data={pts} fill={COLORS[ci % COLORS.length]} opacity={0.65} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── 상관관계 히트맵 ──────────────────────────────────────────────────────
interface CorrelationHeatmapProps {
  data: DataRow[];
  numCols: string[];
}
export function CorrelationHeatmapChart({ data, numCols }: CorrelationHeatmapProps) {
  const cols = numCols.slice(0, 8);
  const matrix = useMemo(() => correlationMatrix(data, cols), [data, cols]);
  if (cols.length < 2) return null;

  const cell = Math.min(60, Math.floor(340 / cols.length));
  const padL = 82, padT = 82;
  const W = padL + cols.length * cell;
  const H = padT + cols.length * cell;

  const getColor = (v: number) => {
    if (v >= 0.7) return "rgb(37,99,235)";
    if (v >= 0.4) return "rgb(147,197,253)";
    if (v >= 0.1) return "rgb(219,234,254)";
    if (v >= -0.1) return "rgb(241,245,249)";
    if (v >= -0.4) return "rgb(252,165,165)";
    if (v >= -0.7) return "rgb(248,113,113)";
    return "rgb(239,68,68)";
  };

  return (
    <ChartWrapper title="상관관계 히트맵 (Pearson r)">
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ display: "block" }}>
          {cols.map((col, ci) => (
            <text
              key={`ch-${ci}`}
              x={padL + ci * cell + cell / 2}
              y={padT - 6}
              textAnchor="end"
              fontSize={9}
              fill="#475569"
              transform={`rotate(-40 ${padL + ci * cell + cell / 2} ${padT - 6})`}
            >
              {col.length > 14 ? col.slice(0, 14) + "…" : col}
            </text>
          ))}
          {cols.map((col, ri) => (
            <text
              key={`rh-${ri}`}
              x={padL - 6}
              y={padT + ri * cell + cell / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fill="#475569"
            >
              {col.length > 14 ? col.slice(0, 14) + "…" : col}
            </text>
          ))}
          {matrix.map((entry, idx) => {
            const ci = cols.indexOf(entry.col);
            const ri = cols.indexOf(entry.row);
            if (ci < 0 || ri < 0) return null;
            return (
              <g key={idx}>
                <rect
                  x={padL + ci * cell}
                  y={padT + ri * cell}
                  width={cell}
                  height={cell}
                  fill={getColor(entry.value)}
                  stroke="#fff"
                  strokeWidth={1}
                />
                {cell >= 38 && (
                  <text
                    x={padL + ci * cell + cell / 2}
                    y={padT + ri * cell + cell / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(10, cell / 5)}
                    fill={Math.abs(entry.value) > 0.35 ? "#fff" : "#334155"}
                    fontWeight={600}
                  >
                    {entry.value.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "center", alignItems: "center", fontSize: 10, color: "#64748b" }}>
        <span style={{ width: 14, height: 10, background: "rgb(239,68,68)", display: "inline-block", borderRadius: 2 }} />
        강한 음의 상관
        <span style={{ width: 14, height: 10, background: "rgb(241,245,249)", border: "1px solid #e2e8f0", display: "inline-block", borderRadius: 2 }} />
        무상관
        <span style={{ width: 14, height: 10, background: "rgb(37,99,235)", display: "inline-block", borderRadius: 2 }} />
        강한 양의 상관
      </div>
    </ChartWrapper>
  );
}

// ─── 박스플롯 ─────────────────────────────────────────────────────────────
interface BoxPlotProps {
  cols: string[];
  statsMap: Record<string, ColStats>;
  height?: number;
}
export function BoxPlotChart({ cols, statsMap, height = 220 }: BoxPlotProps) {
  const valid = cols.filter((c) => statsMap[c] && statsMap[c].iqr >= 0).slice(0, 8);
  if (valid.length === 0) return null;

  const padL = 52, padR = 10, padT = 14, padB = 34;
  const W = Math.max(400, valid.length * 70 + padL + padR);
  const plotH = height - padT - padB;
  const plotW = W - padL - padR;
  const colW = plotW / valid.length;

  const allVals = valid.flatMap((c) => [
    statsMap[c].outlierLow, statsMap[c].q1, statsMap[c].median,
    statsMap[c].q3, statsMap[c].outlierHigh,
  ]).filter(isFinite);
  const gMin = Math.min(...allVals);
  const gMax = Math.max(...allVals);
  const range = gMax - gMin || 1;
  const toY = (v: number) => padT + plotH - ((v - gMin) / range) * plotH;

  return (
    <ChartWrapper title="수치형 컬럼 박스플롯 (Q1·중앙값·Q3·수염)">
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={height} style={{ display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padT + plotH * (1 - p);
            const v = gMin + range * p;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="2 3" />
                <text x={padL - 5} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                  {formatNumber(v)}
                </text>
              </g>
            );
          })}
          {valid.map((col, ci) => {
            const s = statsMap[col];
            const cx = padL + (ci + 0.5) * colW;
            const bw = Math.min(colW * 0.45, 30);
            const wLow = Math.max(s.outlierLow, s.min);
            const wHigh = Math.min(s.outlierHigh, s.max);
            const q1y = toY(s.q1), q3y = toY(s.q3), medY = toY(s.median);
            const wLowY = toY(wLow), wHighY = toY(wHigh);
            const color = COLORS[ci % COLORS.length];
            return (
              <g key={col}>
                <line x1={cx} y1={wHighY} x2={cx} y2={q3y} stroke={color} strokeWidth={1.5} />
                <line x1={cx} y1={q1y} x2={cx} y2={wLowY} stroke={color} strokeWidth={1.5} />
                <line x1={cx - bw / 3} y1={wHighY} x2={cx + bw / 3} y2={wHighY} stroke={color} strokeWidth={1.5} />
                <line x1={cx - bw / 3} y1={wLowY} x2={cx + bw / 3} y2={wLowY} stroke={color} strokeWidth={1.5} />
                <rect
                  x={cx - bw / 2} y={q3y}
                  width={bw} height={Math.max(q1y - q3y, 2)}
                  fill={`${color}28`} stroke={color} strokeWidth={1.5}
                />
                <line x1={cx - bw / 2} y1={medY} x2={cx + bw / 2} y2={medY} stroke={color} strokeWidth={2.5} />
                <text x={cx} y={height - padB + 14} textAnchor="middle" fontSize={9} fill="#475569">
                  {col.length > 11 ? col.slice(0, 11) + "…" : col}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, fontSize: 10, color: "#94a3b8" }}>
        <span>━ 중앙값</span>
        <span>□ IQR (Q1-Q3)</span>
        <span>| 수염 (이상값 경계)</span>
      </div>
    </ChartWrapper>
  );
}

// ─── 이상값 탐지 산점도 ───────────────────────────────────────────────────
interface OutlierScatterProps {
  data: DataRow[];
  xCol: string;
  yCol: string;
  statsMap: Record<string, ColStats>;
  height?: number;
}
export function OutlierScatterChart({ data, xCol, yCol, statsMap, height = 260 }: OutlierScatterProps) {
  const { normal, outliers } = useMemo(() => {
    const xs = statsMap[xCol], ys = statsMap[yCol];
    const pts = data.slice(0, 500).reduce<{
      normal: { x: number; y: number }[];
      outliers: { x: number; y: number }[];
    }>((acc, row) => {
      const x = Number(row[xCol]), y = Number(row[yCol]);
      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return acc;
      const xOut = xs ? (x < xs.outlierLow || x > xs.outlierHigh) : false;
      const yOut = ys ? (y < ys.outlierLow || y > ys.outlierHigh) : false;
      (xOut || yOut ? acc.outliers : acc.normal).push({ x, y });
      return acc;
    }, { normal: [], outliers: [] });
    return pts;
  }, [data, xCol, yCol, statsMap]);

  if (normal.length + outliers.length === 0) return null;

  const allX = [...normal, ...outliers].map((p) => p.x);
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const xStep = (xMax - xMin) / 7 || 1;
  const xTicks = Array.from({ length: 8 }, (_, i) => Math.round((xMin + xStep * i) * 100) / 100);
  const outlierPct = Math.round((outliers.length / (normal.length + outliers.length)) * 100);

  return (
    <ChartWrapper title={`이상값 탐지 — ${xCol} vs ${yCol} · 이상값 비율 ${outlierPct}%`}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 4, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="x" type="number" domain={["auto", "auto"]}
            ticks={xTicks} tickFormatter={(v) => Number(v).toFixed(1)}
            tick={{ fontSize: 10, fill: "#64748b" }}
            label={{ value: xCol, position: "insideBottom", offset: -10, fontSize: 10 }}
          />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Scatter name={`정상 (${normal.length}개)`} data={normal} fill="#0ea5e9" opacity={0.45} />
          <Scatter name={`이상값 (${outliers.length}개)`} data={outliers} fill="#ef4444" opacity={0.85} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── 파레토 차트 ──────────────────────────────────────────────────────────
interface ParetoProps {
  data: DataRow[];
  xCol: string;
  yCol?: string;
  height?: number;
}
export function ParetoChart({ data, xCol, yCol, height = 280 }: ParetoProps) {
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach((row) => {
      const k = String(row[xCol] ?? "");
      if (!k) return;
      if (yCol) {
        const v = Number(row[yCol]);
        if (!isNaN(v)) groups[k] = (groups[k] || 0) + v;
      } else {
        groups[k] = (groups[k] || 0) + 1;
      }
    });
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    let cum = 0;
    return sorted.map(([name, value]) => {
      cum += value;
      return {
        name: name.length > 10 ? name.slice(0, 10) + "…" : name,
        value: Math.round(value * 100) / 100,
        cumPct: Math.round((cum / total) * 1000) / 10,
      };
    });
  }, [data, xCol, yCol]);

  if (chartData.length === 0) return null;
  const yLabel = yCol ? `${yCol} 합계` : "빈도";

  return (
    <ChartWrapper title={`파레토 차트 — ${xCol}${yCol ? ` (${yCol} 기준)` : ""}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 44, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="value" name={yLabel} radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
          <Line yAxisId="right" type="monotone" dataKey="cumPct" name="누적 %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── Wrapper ───────────────────────────────────────────────────────────────
function ChartWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-soft" style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10, fontFamily: "DM Sans, sans-serif" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
