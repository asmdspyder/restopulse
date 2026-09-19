"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  Filter,
  ArrowLeft,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import QuickRecordModal from "@/components/app/quick-record-modal";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [userContext, setUserContext] = useState<any>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [period, customStart, customEnd]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?period=${period}`;
      if (period === "custom" && customStart && customEnd) {
        url += `&customStart=${customStart}&customEnd=${customEnd}`;
      }

      const [analyticsRes, authRes] = await Promise.all([
        fetch(url),
        fetch("/api/auth/me"),
      ]);

      const analyticsData = await analyticsRes.json();
      const authData = await authRes.json();

      setData(analyticsData);
      setUserContext(authData);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formattedChartData =
    data?.trend?.map((t: any) => ({
      ...t,
      displayDate: t.date.slice(5), // MM-DD
    })) || [];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PERIOD SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#bed6c2] text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-bold text-xs shadow-xs transition group"
            title="Return to Operations Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Operations Hub</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {userContext?.user?.name?.split(" ")[0] || "Chef"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your restaurant's wastage and margin analysis for {data?.periodLabel || "this month"}.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          {(["today", "week", "month", "year", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                if (p === "custom") {
                  setShowCustomModal(true);
                } else {
                  setPeriod(p);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
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
                : p === "year"
                ? "This Year"
                : "Custom Range"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-xs font-semibold text-slate-500">Aggregating wastage numbers...</span>
        </div>
      ) : (
        <>
          {/* 2. KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Wastage */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Wastage</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {formatCurrency(data?.totalWastage)}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {data?.prevTotalWastage > 0 ? (
                  data?.wastagePercentChange?.direction === "down" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {data.wastagePercentChange.formatted} vs previous period
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {data.wastagePercentChange.formatted} vs previous period
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-400">Base period</span>
                )}
              </div>
            </div>

            {/* KPI 2: Top Waste Driver */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Waste Driver</span>
              {data?.topWasteReason ? (
                <>
                  <div className="text-2xl font-extrabold text-emerald-800 mt-2 truncate">
                    {data.topWasteReason.name}
                  </div>
                  <span className="text-xs text-slate-500 mt-2 block">
                    {formatCurrency(data.topWasteReason.value)} ({data.topWasteReason.percentage}% of total)
                  </span>
                </>
              ) : (
                <>
                  <div className="text-base font-bold text-slate-400 mt-2">No waste logged</div>
                  <span className="text-xs text-slate-400 mt-2 block">Awaiting logs</span>
                </>
              )}
            </div>

            {/* KPI 3: Number of Wastage Incidents */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Wastage Incidents</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {data?.recordCount}
              </div>
              <span className="text-xs text-slate-500 mt-2 block">
                {data?.recordCount > 0
                  ? `Avg. ${formatCurrency(data.totalWastage / data.recordCount)} per log`
                  : "No events recorded"}
              </span>
            </div>

            {/* KPI 4: Daily Average Wastage */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Average</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {formatCurrency(data?.averageWastagePerDay)}
                <span className="text-xs font-normal text-slate-400">/day</span>
              </div>
              <span className="text-xs text-slate-500 mt-2 block">
                Based on active period days
              </span>
            </div>
          </div>

          {/* 3. SIGNATURE RULE-BASED INSIGHT ENGINE CARDS ("WHAT WENT WRONG?") */}
          {data?.insights && data.insights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Actionable Insights & Observations</h3>
                </div>
                <span className="text-[11px] text-slate-400">Rule-based statistical detection</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {data.insights.map((insight: any) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                      insight.type === "critical"
                        ? "bg-rose-50/60 border-rose-200/80 text-rose-950"
                        : insight.type === "warning"
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-950"
                        : insight.type === "positive"
                        ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {insight.type === "critical" ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : insight.type === "warning" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : insight.type === "positive" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Info className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm leading-snug">{insight.title}</h4>
                        {insight.metric && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white shadow-2xs">
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="mt-2 text-[11px] font-semibold flex items-center gap-1.5 opacity-90">
                          <span className="underline">Tip:</span>
                          <span>{insight.recommendation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MAIN CHARTS & BREAKDOWNS */}
          {data?.recordCount === 0 ? (
            /* EMPTY STATE */
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No wastage recorded yet for this period</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Record your first wastage event to start understanding where money is being lost and identify trends.
              </p>
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Record First Wastage</span>
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Wastage Trend Chart (2 Columns) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Wastage Trend</h3>
                    <span className="text-xs text-slate-500">Daily wastage value over time</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {formatCurrency(data.totalWastage)} Total
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
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
                        stroke="#059669"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#wasteGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Wastage Reasons (1 Column) */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Why are we wasting?</h3>
                    <span className="text-xs text-slate-500">Top causes by cost</span>
                  </div>
                  <Link href="/app/analytics" className="text-xs font-semibold text-emerald-600 hover:underline">
                    View all
                  </Link>
                </div>

                <div className="flex-1 space-y-3.5">
                  {data?.topReasons?.slice(0, 5).map((r: any) => (
                    <div key={r.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{r.name}</span>
                        <span className="text-slate-900">
                          {formatCurrency(r.value)} <span className="text-slate-400 font-normal">({r.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, r.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. WHAT IS COSTING US (TOP ITEMS) */}
          {data?.recordCount > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">What is costing us?</h3>
                  <span className="text-xs text-slate-500">Highest financial wastage items this period</span>
                </div>
                <Link href="/app/items" className="text-xs font-semibold text-emerald-600 hover:underline">
                  Manage items
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.topItems?.slice(0, 4).map((item: any, idx: number) => (
                  <div key={item.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {formatCurrency(item.value)}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {item.quantity} {item.unit} ({item.percentage}% of loss)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Select Custom Date Range</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customStart && customEnd) {
                    setPeriod("custom");
                    setShowCustomModal(false);
                  }
                }}
                disabled={!customStart || !customEnd}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
