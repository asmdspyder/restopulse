"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Loader2,
  Calendar,
  Layers,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Lightbulb,
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
      displayDate: new Date(t.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    })) || [];

  const totalLoss = Number(data?.totalWastage || 0);
  const recordCount = Number(data?.recordCount || 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & PERIOD SWITCHER */}
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
              Food Waste Analytics & Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear breakdown of where your restaurant is losing food and money.
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
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
          <span className="text-xs font-semibold text-slate-600">Calculating numbers...</span>
        </div>
      ) : (
        <>
          {/* 2. SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Wastage Loss
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {formatCurrency(totalLoss)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {recordCount} wastage entries in {period === "today" ? "today" : period === "week" ? "this week" : period === "month" ? "this month" : "this year"}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                #1 Most Wasted Item
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 truncate">
                {data?.topItems?.[0]?.name || "None yet"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data?.topItems?.[0]
                  ? `${formatCurrency(data.topItems[0].value)} (${data.topItems[0].quantity} ${data.topItems[0].unit})`
                  : "No data"}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#bed6c2] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                #1 Cause of Waste
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 truncate">
                {data?.topReasons?.[0]?.name || "None yet"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data?.topReasons?.[0]
                  ? `${formatCurrency(data.topReasons[0].value)} (${data.topReasons[0].percentage}% of total)`
                  : "No data"}
              </p>
            </div>
          </div>

          {recordCount === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-[#bed6c2] text-center max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No waste data for this period</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Log your kitchen wastage daily to see automatic reports and cost rankings.
              </p>
              <Link
                href="/app/wastage"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                <span>+ Log Food Waste</span>
              </Link>
            </div>
          ) : (
            <>
              {/* 3. SIMPLE DAILY BAR CHART */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#bed6c2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Daily Wastage (₹)
                    </h3>
                    <p className="text-xs text-slate-500">Money lost on each date</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl">
                    {formatCurrency(totalLoss)} Total
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendFormatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <Bar dataKey="wastageValue" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. TWO-COLUMN BREAKDOWN: REASONS & INGREDIENTS */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Loss by Reason */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#bed6c2] shadow-xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Why Did Food Get Wasted?</h3>
                    <p className="text-xs text-slate-500">Breakdown of reasons by cost</p>
                  </div>

                  <div className="space-y-3">
                    {data?.topReasons?.map((r: any) => (
                      <div key={r.name} className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{r.name}</span>
                          <span className="text-slate-900">
                            {formatCurrency(r.value)} <span className="text-slate-400 font-normal">({r.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-700 h-full rounded-full"
                            style={{ width: `${Math.min(100, r.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loss by Category */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#bed6c2] shadow-xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Loss by Category</h3>
                    <p className="text-xs text-slate-500">Which section of inventory lost the most</p>
                  </div>

                  <div className="space-y-3">
                    {data?.topCategories?.map((c: any) => (
                      <div key={c.name} className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{c.name}</span>
                          <span className="text-slate-900">
                            {formatCurrency(c.value)} <span className="text-slate-400 font-normal">({c.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, c.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. TOP WASTED ITEMS TABLE (SIMPLE & CLEAR) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#bed6c2] shadow-xs overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">All Wasted Items Ranking</h3>
                    <p className="text-xs text-slate-500">Ranked from highest money lost to lowest</p>
                  </div>
                  <Link
                    href="/app/history"
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View Full History Log →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4"># Rank</th>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Quantity Discarded</th>
                        <th className="py-3 px-4">Total Money Lost</th>
                        <th className="py-3 px-4">% of Total Waste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.topItems?.map((item: any, idx: number) => (
                        <tr key={item.name} className="hover:bg-emerald-50/40 transition">
                          <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-800">
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
        </>
      )}
    </div>
  );
}
