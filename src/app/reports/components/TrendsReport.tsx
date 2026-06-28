"use client";

import { useMemo } from "react";
import { Card } from "@/app/components/ui";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

export interface TrendDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface TrendSeries {
  key: string;
  name: string;
  color?: string;
}

interface TrendsReportProps {
  data?: TrendDataPoint[];
  series?: TrendSeries[];
  title?: string;
  description?: string;
  type?: "line" | "area";
  isLoading?: boolean;
}

const DEFAULT_COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#0d9488", "#0f766e", "#115e59"];

export function TrendsReport({
  data = [],
  series = [],
  title = "Trends",
  description,
  type = "line",
}: TrendsReportProps) {
  const enrichedData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  const summaryStats = useMemo(() => {
    if (data.length < 2) return null;

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    const avgValue = data.reduce((sum, p) => sum + p.value, 0) / data.length;
    const maxValue = Math.max(...data.map((p) => p.value));
    const minValue = Math.min(...data.map((p) => p.value));

    return { change, changePercent, avgValue, maxValue, minValue };
  }, [data]);

  const renderChart = () => {
    if (enrichedData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            No trend data available
          </p>
        </div>
      );
    }

    const chartProps = {
      data: enrichedData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const axes = (
      <>
        <CartesianGrid strokeDasharray="3 3" className="stroke-emerald-500/10 dark:stroke-emerald-500/5" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-gray-400"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toLocaleString()}
          className="text-gray-400"
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "12px",
            fontSize: "11px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
          labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
        />
        {series.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "16px" }}
            iconType="line"
          />
        )}
      </>
    );

    if (type === "area") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart {...chartProps}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {axes}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fill={`url(#gradient-${s.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart {...chartProps}>
          {axes}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats - Emerald gradient cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card 
            variant="glass" 
            padding="md" 
            className="flex items-center gap-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Current</p>
              <p className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                {data[data.length - 1]?.value.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            padding="md" 
            className="flex items-center gap-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              summaryStats.change >= 0 ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10" : "bg-gradient-to-br from-rose-500/20 to-red-500/10"
            }`}>
              <Activity size={20} className={summaryStats.change >= 0 ? "text-emerald-500" : "text-rose-500"} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Change</p>
              <p className={`text-xl font-black ${summaryStats.change >= 0 ? "bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent"}`}>
                {summaryStats.change >= 0 ? "+" : ""}{summaryStats.change.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            padding="md" 
            className="flex items-center gap-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Average</p>
              <p className="text-xl font-black bg-gradient-to-r from-cyan-600 to-sky-500 bg-clip-text text-transparent">
                {summaryStats.avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            padding="md" 
            className="flex items-center gap-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              summaryStats.changePercent >= 0 ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10" : "bg-gradient-to-br from-rose-500/20 to-red-500/10"
            }`}>
              <Activity size={20} className={summaryStats.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Change %</p>
              <p className={`text-xl font-black ${summaryStats.changePercent >= 0 ? "bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent"}`}>
                {summaryStats.changePercent >= 0 ? "+" : ""}{summaryStats.changePercent.toFixed(1)}%
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Chart - Glassmorphism container */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        {/* Emerald accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {renderChart()}
      </Card>
    </div>
  );
}

export default TrendsReport;