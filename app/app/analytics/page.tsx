"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      const resData = await res.json();
      setData(resData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const trendFormatted =
    data?.trend?.map((t: any) => ({
      ...t,
      displayDate: t.date.slice(5),
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deep-dive operational wastage breakdown, trend pareto, and financial ratios.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl self-start sm:self-auto">
          {(["today", "week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                period === p
                  ? "bg-white text-emerald-800 shadow-sm shadow-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                ? "This Week"
                : p === "month"
                ? "This Month"
                : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-xs font-semibold text-slate-500">Calculating analytics...</span>
        </div>
      ) : (
        <>
          {/* Main Trend Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Wastage Time-Series Trend</h3>
                <span className="text-xs text-slate-500">Financial wastage over selected timeframe</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                {formatCurrency(data?.totalWastage)} Total Wastage
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendFormatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;

                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                            <p className="font-bold text-slate-300">{d.date}</p>
                            <p className="text-emerald-400 font-extrabold text-sm">
                              Wastage: {formatCurrency(d.wastageValue)}
                            </p>
                            <p className="text-slate-400">{d.recordsCount} record(s) logged</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wastageValue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#analyticsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two-Column Breakdowns */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Wastage by Reason */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Loss by Wastage Reason</h3>
              <p className="text-xs text-slate-500 mb-6">Pareto breakdown of root causes</p>

              <div className="space-y-4">
                {data?.topReasons?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No reason data recorded.</p>
                ) : (
                  data?.topReasons?.map((r: any) => (
                    <div key={r.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{r.name}</span>
                        <span className="text-slate-900">
                          {formatCurrency(r.value)} <span className="text-slate-400 font-normal">({r.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, r.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wastage by Category */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Loss by Category</h3>
              <p className="text-xs text-slate-500 mb-6">Distribution across inventory categories</p>

              <div className="space-y-4">
                {data?.topCategories?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No category data recorded.</p>
                ) : (
                  data?.topCategories?.map((c: any) => (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{c.name}</span>
                        <span className="text-slate-900">
                          {formatCurrency(c.value)} <span className="text-slate-400 font-normal">({c.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, c.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top Cost Driver Items Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs overflow-hidden">
            <h3 className="font-bold text-slate-900 text-base mb-1">Top Wasted Items Ranking</h3>
            <p className="text-xs text-slate-500 mb-4">Ranked by total financial wastage value</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Total Qty Discarded</th>
                    <th className="py-3 px-4">Financial Wastage</th>
                    <th className="py-3 px-4">% of Total Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.topItems?.map((item: any, idx: number) => (
                    <tr key={item.name} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {formatCurrency(item.value)}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
