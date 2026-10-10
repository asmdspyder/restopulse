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
  UtensilsCrossed,
} from "lucide-react";
import { formatCurrency, formatLocalDateToYMD } from "@/lib/utils";

export default function RestaurantOperationsHub() {
  const [loading, setLoading] = useState(true);
  const [authContext, setAuthContext] = useState<any>(null);
  const [todayChecklist, setTodayChecklist] = useState<any>(null);
  const [wastageMetrics, setWastageMetrics] = useState<any>(null);
  const [usersCount, setUsersCount] = useState<number>(1);
  const [costingStats, setCostingStats] = useState<{ menuItemsCount: number; ingredientsCount: number }>({
    menuItemsCount: 0,
    ingredientsCount: 0,
  });

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

      // Fetch Menu Costing stats for non-staff
      if (authData?.user?.role !== "staff") {
        try {
          const [mRes, iRes] = await Promise.all([
            fetch("/api/menu-costing/menu-items"),
            fetch("/api/menu-costing/ingredients"),
          ]);
          if (mRes.ok && iRes.ok) {
            const mData = await mRes.json();
            const iData = await iRes.json();
            setCostingStats({
              menuItemsCount: Array.isArray(mData) ? mData.length : 0,
              ingredientsCount: Array.isArray(iData) ? iData.length : 0,
            });
          }
        } catch (cErr) {
          console.error("Failed to fetch costing stats:", cErr);
        }
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

      {/* 2. THE PRIMARY MODULE CARDS - MODERN, SLEEK, HIGH-CONVERTING CARDS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {isStaff ? "Your Shift Tasks" : "Restaurant Operations Hub"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStaff ? "Access your assigned station checklist and record kitchen wastage" : "Real-time kitchen inspections, loss prevention & team management"}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className={`grid gap-5 ${isStaff ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4"}`}>
          {/* CARD 1: DAILY CHECKLISTS & SOP */}
          <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Top gradient accent glow */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <span
                  className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : completedCount > 0
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : completedCount > 0 ? `${completionPercent}% Done` : "Ready to Start"}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-800 transition">
                  Daily Opening Checklists
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Morning station readiness, hygiene audit, equipment check & manager digital sign-off.
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Today&apos;s Checklist</span>
                  <span className="text-emerald-800 font-extrabold">{completedCount} of {totalRequired} tasks</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              </div>

            {/* High-impact Action Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                href="/app/checklists"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98 transition group/btn"
              >
                <span>Open Daily Checklist</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 2: KITCHEN FOOD WASTAGE */}
          <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Top gradient accent glow */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-400" />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition-all duration-300">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-300 shadow-2xs">
                  {wastageMetrics?.recordCount || 0} logs this month
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-teal-800 transition">
                  Kitchen Food Wastage
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Log spoiled, burnt, or expired food in 10 seconds with live photo proof & loss metrics.
                </p>
              </div>

              {/* Monthly Loss Metric Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Tracked Waste
                  </span>
                  <div className="text-lg font-black text-slate-900">
                    {formatCurrency(wastageMetrics?.totalWastage || 0)}
                  </div>
                </div>
                <span className="text-xs font-extrabold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-lg">
                  {wastageMetrics?.recordCount || 0} items
                </span>
              </div>
            </div>

            {/* High-impact Action Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                href="/app/wastage"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-98 transition group/btn"
              >
                <span>Record Waste Item</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 3: MENU COSTING & RECIPES (OWNER & MANAGER ONLY) */}
          {!isStaff && (
            <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Top gradient accent glow */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
                    {costingStats.menuItemsCount} Dishes Costed
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-800 transition">
                    Menu Costing & Margins
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Accurate portion ingredient costs, preparation SOP steps, gross margin & price impact simulation.
                  </p>
                </div>

                {/* Recipe & Ingredients Metric Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ingredients Library
                    </span>
                    <div className="text-lg font-black text-slate-900">
                      {costingStats.ingredientsCount} Items
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    Live Margins
                  </span>
                </div>
              </div>

              {/* High-impact Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href="/app/menu-costing"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98 transition group/btn"
                >
                  <span>Open Menu Costing</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* CARD 4: RESTAURANT SETTINGS & STAFF (ADMIN ONLY) */}
          {!isStaff && (
            <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Top gradient accent glow */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-700 to-slate-900" />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                    {usersCount} {usersCount === 1 ? "Staff Login" : "Staff Logins"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-slate-800 transition">
                    Team & Settings
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Staff logins, checklist customization, station areas, shifts & restaurant profile.
                  </p>
                </div>

                {/* Team & SOP Summary Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Access Management
                  </span>
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Role-based Staff logins</span>
                    <span className="text-emerald-700 font-extrabold">Active</span>
                  </div>
                </div>
              </div>

              {/* High-impact Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href="/app/account"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 active:scale-98 transition group/btn"
                >
                  <span>Manage Team & Settings</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
