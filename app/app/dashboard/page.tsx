"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  PlusCircle,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Loader2,
  Trash2,
  Lightbulb,
  Utensils,
  HelpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import QuickRecordModal from "@/components/app/quick-record-modal";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [userContext, setUserContext] = useState<any>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, authRes] = await Promise.all([
        fetch(`/api/analytics?period=${period}`),
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
      displayDate: new Date(t.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    })) || [];

  const totalLoss = Number(data?.totalWastage || 0);
  const recordCount = Number(data?.recordCount || 0);
  const dailyAverage = Number(data?.averageWastagePerDay || 0);
  const topReason = data?.topWasteReason;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & TIME FILTER */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#bed6c2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition group flex items-center justify-center shrink-0"
            title="Back to Operations Hub"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {userContext?.user?.name?.split(" ")[0] || "Chef"} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Simple summary of kitchen food waste and money saved.
            </p>
          </div>
        </div>

        {/* Simple Period Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
          {(["today", "week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === p
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
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
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
          <span className="text-xs font-semibold text-slate-600">Loading summary...</span>
        </div>
      ) : (
        <>
          {/* 2. THREE SIMPLE KEY NUMBER CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CARD 1: TOTAL MONEY LOST */}
            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Food Waste Loss
                </span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
                  ₹ Loss
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {formatCurrency(totalLoss)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {recordCount} items logged in {period === "today" ? "today" : period === "week" ? "this week" : period === "month" ? "this month" : "this year"}
              </p>
            </div>

            {/* CARD 2: BIGGEST REASON */}
            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Main Cause of Waste
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs">
                  Reason
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 truncate">
                {topReason ? topReason.name : "None logged"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {topReason ? `${formatCurrency(topReason.value)} (${topReason.percentage}% of total waste)` : "No waste recorded"}
              </p>
            </div>

            {/* CARD 3: DAILY AVERAGE */}
            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daily Average Loss
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs">
                  Per Day
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {formatCurrency(dailyAverage)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Average money thrown in trash per day
              </p>
            </div>
          </div>

          {/* 3. SIMPLE ADVICE BOX */}
          {totalLoss > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-800 space-y-0.5">
                <strong className="text-slate-900 font-bold block text-sm">
                  Quick Kitchen Tip:
                </strong>
                <p className="leading-relaxed">
                  {topReason ? (
                    `Most of your food waste is due to "${topReason.name}". Review your daily prep quantities or check storage fridge temperature to save money.`
                  ) : (
                    "Keep logging thrown food daily. Consistent tracking reduces kitchen food costs by 30%."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 4. MAIN CONTENT: CHART & TOP WASTED ITEMS */}
          {recordCount === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-[#bed6c2] text-center max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No food waste logged for this period!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Whenever food spoils, burns, or gets thrown away in your kitchen, log it here in 10 seconds.
              </p>
              <Link
                href="/app/wastage"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Food Waste</span>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* LEFT: SIMPLE DAILY LOSS BAR CHART */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Daily Waste (₹)
                      </h3>
                      <p className="text-xs text-slate-500">How much money was thrown each day</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      {formatCurrency(totalLoss)} Total
                    </span>
                  </div>

                  <div className="h-60 sm:h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5">
                                  <p className="font-bold text-slate-300">{d.displayDate}</p>
                                  <p className="text-emerald-400 font-extrabold text-sm">
                                    Loss: {formatCurrency(d.wastageValue)}
                                  </p>
                                  <p className="text-slate-400 text-[11px]">{d.recordsCount} items logged</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="wastageValue" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-2">
                  Tip: Taller bars mean more food was wasted on that day.
                </p>
              </div>

              {/* RIGHT: TOP WASTED INGREDIENTS */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Top Wasted Items
                      </h3>
                      <p className="text-xs text-slate-500">Items costing your kitchen the most money</p>
                    </div>
                    <Link
                      href="/app/items"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      View Items →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {data?.topItems?.slice(0, 5).map((item: any, idx: number) => (
                      <div
                        key={item.name}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.quantity} {item.unit} thrown away
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-sm text-slate-900 block">
                            {formatCurrency(item.value)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                            {item.percentage}% of waste
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Want to see all waste logs?</span>
                  <Link
                    href="/app/history"
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View History Log →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 5. WHY ARE WE WASTING FOOD? (REASONS BREAKDOWN) */}
          {recordCount > 0 && data?.topReasons && data.topReasons.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <div className="mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Reasons Why Food Was Thrown Away
                </h3>
                <p className="text-xs text-slate-500">
                  See what went wrong so your kitchen team can fix it
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.topReasons.map((r: any) => (
                  <div
                    key={r.name}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{r.name}</span>
                      <span className="text-slate-900">{formatCurrency(r.value)}</span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, r.percentage)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {r.percentage}% of total waste cost
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
