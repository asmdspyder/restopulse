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
} from "lucide-react";
import { formatCurrency, formatLocalDateToYMD } from "@/lib/utils";

export default function RestaurantOperationsHub() {
  const [loading, setLoading] = useState(true);
  const [authContext, setAuthContext] = useState<any>(null);
  const [todayChecklist, setTodayChecklist] = useState<any>(null);
  const [wastageMetrics, setWastageMetrics] = useState<any>(null);
  const [usersCount, setUsersCount] = useState<number>(1);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const todayStr = formatLocalDateToYMD();
      const [authRes, checklistRes, analyticsRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/checklists/daily?date=${todayStr}`),
        fetch("/api/analytics?period=month"),
        fetch("/api/users"),
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

      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (uData?.users) setUsersCount(uData.users.length);
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Loading Restaurant Operations Hub...</span>
      </div>
    );
  }

  const userName = authContext?.user?.name || "Team";
  const businessName = authContext?.restaurant?.businessName || "Restaurant";
  const checklistRecord = todayChecklist?.dailyRecord;
  const completionPercent = Math.round(Number(checklistRecord?.completionPercent || 0));
  const completedCount = Number(checklistRecord?.completedItemsCount || 0);
  const totalRequired = Number(checklistRecord?.totalRequiredItemsCount || 0);
  const isCompleted = checklistRecord?.status === "completed";

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP WELCOME HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-9 rounded-3xl shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                Operations Hub
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-300 font-medium">{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, {userName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Welcome to <strong className="text-white font-bold">{businessName}</strong>. Choose a module below to inspect daily opening checklists, record kitchen food waste, or manage your workspace team.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/app/wastage"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Wastage</span>
            </Link>
          </div>
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />
        <div className="absolute right-36 -top-10 w-36 h-36 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />
      </div>

      {/* 2. THE THREE PRIMARY MODULE CARDS */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Operations Modules</h2>
            <p className="text-xs text-slate-600">Select any module to open directly</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* CARD 1: SOP & CHECKLIST */}
          <Link
            href="/app/checklists"
            className="group bg-white rounded-3xl border border-[#bed6c2] p-6 shadow-sm hover:shadow-xl hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-600 group-hover:h-2 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shadow-sm border border-emerald-200/80 group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white transition duration-300">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <span
                  className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : completedCount > 0
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : completedCount > 0 ? `In Progress (${completionPercent}%)` : "Not Started"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Module 01
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-800 transition">
                SOP & Checklists
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed min-h-[40px]">
                Daily opening audits, station verification tasks, purchase & expense logs, and manager digital sign-off.
              </p>

              {/* Progress metric card */}
              <div className="mt-5 p-4 rounded-2xl bg-[#f4faf6] border border-emerald-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Today's Audit Progress</span>
                  <span className="text-emerald-900 font-extrabold text-sm">{completionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 block font-medium">
                  {completedCount} of {totalRequired} required inspection tasks completed
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="w-full py-3 px-4 rounded-2xl bg-emerald-700 group-hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition">
                <span>Open SOP & Checklists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* CARD 2: WASTAGE RECORDING */}
          <Link
            href="/app/wastage"
            className="group bg-white rounded-3xl border border-[#bed6c2] p-6 shadow-sm hover:shadow-xl hover:border-teal-600 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-teal-600 group-hover:h-2 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold shadow-sm border border-teal-200/80 group-hover:scale-110 group-hover:bg-teal-700 group-hover:text-white transition duration-300">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-300">
                  {wastageMetrics?.recordCount || 0} logs this month
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                  Module 02
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-800 transition">
                Wastage Recording
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed min-h-[40px]">
                Fast 10-second food waste entry, root-cause Pareto analytics, cost rankings, and items price catalog.
              </p>

              {/* Loss metric card */}
              <div className="mt-5 p-4 rounded-2xl bg-[#f0f8f5] border border-teal-100 space-y-1">
                <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                  This Month's Wastage Loss
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(wastageMetrics?.totalWastage || 0)}
                </div>
                <span className="text-[11px] text-slate-500 block font-medium truncate">
                  Top Cause: <strong className="text-slate-800">{wastageMetrics?.topWasteReason?.name || "None recorded"}</strong>
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="w-full py-3 px-4 rounded-2xl bg-teal-700 group-hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition">
                <span>Open Wastage Recording</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* CARD 3: ACCOUNT & ADMIN */}
          <Link
            href="/app/account"
            className="group bg-white rounded-3xl border border-[#bed6c2] p-6 shadow-sm hover:shadow-xl hover:border-blue-600 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600 group-hover:h-2 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold shadow-sm border border-blue-200/80 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Workspace
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  Module 03
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-800 transition">
                Account & Admin
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed min-h-[40px]">
                Restaurant outlet profile, team members, SOP editor permissions, operational shifts, and station zones.
              </p>

              {/* Team metric card */}
              <div className="mt-5 p-4 rounded-2xl bg-[#f0f5fc] border border-blue-100 space-y-1">
                <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">
                  Workspace Team
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {usersCount} {usersCount === 1 ? "Staff Member" : "Staff Members"}
                </div>
                <span className="text-[11px] text-slate-500 block font-medium">
                  Configured shifts & station permissions
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="w-full py-3 px-4 rounded-2xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition">
                <span>Open Account & Admin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
