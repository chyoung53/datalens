"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig, DataRow } from "@/types";

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
            .slice(0, 12)
            .map(([name, vals]) => ({
              name,
              평균: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
            }));
          return (
            <ChartWrapper title={title}>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="평균" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
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
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, count]) => ({ name, count }));
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

      case "scatter": {
        if (!yColumn || !data[0].hasOwnProperty(yColumn)) return null;
        const chartData = data
          .slice(0, 300)
          .map((row) => ({ x: Number(row[xColumn]), y: Number(row[yColumn]) }))
          .filter((d) => !isNaN(d.x) && !isNaN(d.y));
        return (
          <ChartWrapper title={title}>
            <ResponsiveContainer width="100%" height={height}>
              <ScatterChart margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" name={xColumn} tick={{ fontSize: 10, fill: "#64748b" }} label={{ value: xColumn, position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis dataKey="y" name={yColumn} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Scatter data={chartData} fill={COLORS[0]} opacity={0.7} />
              </ScatterChart>
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
