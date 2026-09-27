"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  BarChart3,
  Building2,
  ArrowRight,
  PlusCircle,
  Loader2,
  Sparkles,
  ClipboardCheck,
  TrendingDown,
  ShieldCheck,
  Zap,
  Camera,
  Layers,
  History,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatLocalDateToYMD } from "@/lib/utils";

export default function RestaurantOperationsHub() {
  const [loading, setLoading] = useState(true);
  const [authContext, setAuthContext] = useState<any>(null);
  const [todayChecklist, setTodayChecklist] = useState<any>(null);
  const [wastageMetrics, setWastageMetrics] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const todayStr = formatLocalDateToYMD();
      const [authRes, checklistRes, analyticsRes, historyRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/checklists/daily?date=${todayStr}`),
        fetch("/api/analytics?period=month"),
        fetch("/api/wastage?limit=5"),
      ]);

      const authData = await authRes.json();
      setAuthContext(authData);

      if (checklistRes.ok) {
        const cData = await checklistRes.json();
        setTodayChecklist(cData);
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setWastageMetrics(aData);
      }

      if (historyRes.ok) {
        const hData = await historyRes.json();
        setRecentRecords(hData.records || []);
      }
    } catch (e) {
      console.error(e);
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

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 mb-3" />
        <span className="text-xs font-semibold text-zinc-500">Loading operations hub...</span>
      </div>
    );
  }

  const isStaff = authContext?.user?.role === "staff";
  const userName = authContext?.user?.name || "Team";
  const businessName = authContext?.restaurant?.businessName || "Restaurant Hub";
  const checklistRecord = todayChecklist?.dailyRecord;
  const completionPercent = Math.round(Number(checklistRecord?.completionPercent || 0));
  const completedCount = Number(checklistRecord?.completedItemsCount || 0);
  const totalRequired = Number(checklistRecord?.totalRequiredItemsCount || 0);
  const isCompleted = checklistRecord?.status === "completed";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* 1. TOP WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-400 block mb-1">
            {todayFormatted} • {businessName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isStaff
              ? "Your active shift launchpad. Mark today's checklists and record kitchen waste."
              : "Live restaurant operations, food safety adherence, and cost metrics."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/checklists"
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Open Checklist</span>
          </Link>
          <Link
            href="/app/wastage"
            className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-zinc-500" />
            <span>Log Waste</span>
          </Link>
        </div>
      </div>

      {/* 2. STAFF SHIFT LAUNCHPAD (Focused 2 Large Action Cards) */}
      {isStaff ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Checklist Card */}
          <Link
            href="/app/checklists"
            className="p-6 rounded-3xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-md transition group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : completedCount > 0
                    ? "bg-zinc-100 text-zinc-800 border border-zinc-200"
                    : "bg-zinc-100 text-zinc-500"
                }`}>
                  {isCompleted ? "Completed" : `${completionPercent}% Done`}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900">Today&apos;s Checklist</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Complete opening hygiene, food temperature logs, line setup, and cash verification.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                  <span>Progress</span>
                  <span>{completedCount} / {totalRequired} tasks</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted ? "bg-emerald-500" : "bg-zinc-900"
                    }`}
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs font-bold text-zinc-900 group-hover:text-zinc-700">
              <span>{isCompleted ? "Review Completed Checklist" : "Continue Shift Tasks"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Record Wastage Card */}
          <Link
            href="/app/wastage"
            className="p-6 rounded-3xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-md transition group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
                  Kitchen POS
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900">Record Wastage</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Log expired or spoiled ingredients with instant quantity presets and live camera photo proof.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Quick Feature
                </span>
                <span className="text-xs text-zinc-700 block font-medium">
                  Direct camera capture without opening photo gallery
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs font-bold text-zinc-900 group-hover:text-zinc-700">
              <span>Launch Wastage Logger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      ) : (
        /* 3. MANAGER / OWNER OPERATIONS PULSE */
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Checklist Status */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Today&apos;s Checklist
                </span>
                <ClipboardCheck className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-zinc-900">{completionPercent}%</span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  {completedCount} of {totalRequired} tasks completed
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-zinc-900"}`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Monthly Waste */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Monthly Wastage
                </span>
                <TrendingDown className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-zinc-900">
                  {formatCurrency(Number(wastageMetrics?.summary?.totalCost || 0))}
                </span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  {wastageMetrics?.summary?.totalQuantity || 0} units recorded
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Top Reason: {wastageMetrics?.byReason?.[0]?.name || "Spoilage / Expiry"}
              </div>
            </div>

            {/* Metric 3: Active Shift Handover */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Shift Sign-Off
                </span>
                <ShieldCheck className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <span className="text-base font-bold text-zinc-900 block">
                  {checklistRecord?.verifiedByName ? `Signed: ${checklistRecord.verifiedByName}` : "Pending Verification"}
                </span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  {checklistRecord?.verifiedByName ? "Digital manager verification saved" : "Awaiting duty manager signature"}
                </span>
              </div>
              <Link
                href="/app/checklists"
                className="text-[11px] font-semibold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Verify Shift</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Operations Modules & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Links (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Operational Modules
                </h3>
                <span className="text-[11px] text-zinc-400">Quick Shortcuts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/app/checklists"
                  className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 transition flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-900 block">Daily Checklist</span>
                    <span className="text-[11px] text-zinc-500 block">Fill opening & closing SOPs</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </Link>

                <Link
                  href="/app/wastage"
                  className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 transition flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-900 block">Record Wastage</span>
                    <span className="text-[11px] text-zinc-500 block">Fast 1-tap food waste entry</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </Link>

                <Link
                  href="/app/items"
                  className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 transition flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-900 block">Item Catalog</span>
                    <span className="text-[11px] text-zinc-500 block">Manage prices & base units</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </Link>

                <Link
                  href="/app/analytics"
                  className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 transition flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-900 block">Cost Reports</span>
                    <span className="text-[11px] text-zinc-500 block">Export trends & root causes</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Recent Wastage Logs (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Recent Wastage
                </h3>
                <Link href="/app/history" className="text-[11px] font-semibold text-zinc-900 hover:text-zinc-600">
                  View All
                </Link>
              </div>

              {recentRecords.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No records logged today.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {recentRecords.map((r) => (
                    <div key={r.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">{r.itemName}</span>
                        <span className="text-[10px] text-zinc-400">
                          {r.quantity} {r.unit} • {r.reason?.name || "Waste"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 font-mono">
                        {formatCurrency(Number(r.totalCost || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
