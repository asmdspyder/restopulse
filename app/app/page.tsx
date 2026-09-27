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

  const isStaff = authContext?.user?.role === "staff";
  const userName = authContext?.user?.name || "Team";
  const businessName = authContext?.restaurant?.businessName || "Restaurant";
  const checklistRecord = todayChecklist?.dailyRecord;
  const completionPercent = Math.round(Number(checklistRecord?.completionPercent || 0));
  const completedCount = Number(checklistRecord?.completedItemsCount || 0);
  const totalRequired = Number(checklistRecord?.totalRequiredItemsCount || 0);
  const isCompleted = checklistRecord?.status === "completed";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP WELCOME HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-700/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                Operations Hub
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-300 font-medium">{todayFormatted}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {getGreeting()}, {userName.split(" ")[0]} 👋
              </h1>
              <span className="text-xs text-slate-400 font-medium hidden md:inline">
                • {businessName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app/checklists"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Checklist</span>
            </Link>
            <Link
              href="/app/wastage"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Wastage</span>
            </Link>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-600/10 blur-xl pointer-events-none" />
      </div>

      {/* 2. THE PRIMARY MODULE CARDS - COMPACT, SIMPLE & EASY TO UNDERSTAND */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {isStaff ? "Shift Tasks" : "Operations Modules"}
          </h2>
          <p className="text-xs text-slate-500">
            {isStaff ? "Complete your daily checklist and record kitchen wastage" : "Quick access to daily restaurant tools"}
          </p>
        </div>

        <div className={`grid gap-4 sm:gap-5 ${isStaff ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {/* CARD 1: DAILY CHECKLISTS */}
          <Link
            href="/app/checklists"
            className="group bg-white rounded-2xl border-2 border-slate-200/90 hover:border-emerald-600 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-600" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200/80 group-hover:scale-105 transition">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : completedCount > 0
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : completedCount > 0 ? `${completionPercent}% Done` : "Not Started"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  Daily Checklists
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Morning opening tasks, equipment checks, cash float, and manager sign-off.
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Today&apos;s Progress</span>
                  <span className="text-emerald-800">{completedCount} / {totalRequired} tasks</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
              <span>Open Daily Checklist</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 2: KITCHEN WASTAGE */}
          <Link
            href="/app/wastage"
            className="group bg-white rounded-2xl border-2 border-slate-200/90 hover:border-teal-600 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-teal-600" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold border border-teal-200/80 group-hover:scale-105 transition">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-300">
                  {wastageMetrics?.recordCount || 0} logs this month
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition">
                  Kitchen Wastage
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Log thrown-away food in 10 seconds with live camera photos and loss tracking.
                </p>
              </div>

              {/* Loss Metric Pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  This Month&apos;s Loss
                </span>
                <div className="text-lg font-extrabold text-slate-900">
                  {formatCurrency(wastageMetrics?.totalWastage || 0)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:text-teal-900">
              <span>Record Waste Item</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 3: RESTAURANT SETTINGS (Managers & Owners Only) */}
          {!isStaff && (
            <Link
              href="/app/account"
              className="group bg-white rounded-2xl border-2 border-slate-200/90 hover:border-blue-600 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer"
            >
              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-600" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold border border-blue-200/80 group-hover:scale-105 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {usersCount} {usersCount === 1 ? "User" : "Users"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition">
                    Restaurant Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Manage staff team logins, permissions, and restaurant profile details.
                  </p>
                </div>

                {/* Team Pill */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Staff Team
                  </span>
                  <div className="text-lg font-extrabold text-slate-900">
                    {usersCount} Active Member{usersCount === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-800">
                <span>Manage Settings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
