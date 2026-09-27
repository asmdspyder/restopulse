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
        <Loader2 className="w-8 h-8 animate-spin text-slate-800 mb-2" />
        <span className="text-xs font-semibold text-slate-500">Loading Operations Hub...</span>
      </div>
    );
  }

  const isStaff = authContext?.user?.role === "staff";
  const userName = authContext?.user?.name || "Team";
  const businessName = authContext?.restaurant?.businessName || "RestoPulse";
  const checklistRecord = todayChecklist?.dailyRecord;
  const completionPercent = Math.round(Number(checklistRecord?.completionPercent || 0));
  const completedCount = Number(checklistRecord?.completedItemsCount || 0);
  const totalRequired = Number(checklistRecord?.totalRequiredItemsCount || 0);
  const isCompleted = checklistRecord?.status === "completed";

  // STAFF ONLY VIEW: 2 BIG SIMPLE CARDS
  if (isStaff) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Welcome Header */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  Staff Workspace
                </span>
                <span className="text-xs text-slate-400 font-medium">• {todayFormatted}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {getGreeting()}, {userName.split(" ")[0]} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{businessName}</p>
            </div>
          </div>
        </div>

        {/* 2 Big Action Cards for Staff */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Card 1: Checklists */}
          <Link
            href="/app/checklists"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-amber-400 transition duration-300">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : completedCount > 0
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : completedCount > 0 ? `In Progress (${completionPercent}%)` : "Not Started"}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-slate-950 transition">
                  Daily Checklists
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Mark shift checklist tasks, capture live camera proof, and complete inspection items.
                </p>
              </div>

              {/* Progress bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Today's Progress</span>
                  <span className="font-extrabold text-slate-900">{completionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="w-full py-3 px-4 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition">
                <span>Open Checklists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Record Wastage */}
          <Link
            href="/app/wastage"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-amber-400 transition duration-300">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  10-Sec Quick Log
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-slate-950 transition">
                  Record Wastage
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Log food waste or damaged ingredients, pick the reason, and optionally take a live camera photo proof.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Actions
                </span>
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Live Camera Proof Supported</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="w-full py-3 px-4 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition">
                <span>Record Wastage</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // ADMIN / MANAGER VIEW: FULL OPERATIONS MODULES
  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Manager Hub
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-300 font-medium">{todayFormatted}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {getGreeting()}, {userName.split(" ")[0]} 👋
              </h1>
              <span className="text-xs text-slate-400 font-medium hidden md:inline">
                • {businessName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/app/checklists"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Checklist</span>
            </Link>
            <Link
              href="/app/wastage"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
              <span>Log Wastage</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Primary Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Restaurant Operations</h2>
            <p className="text-xs text-slate-500">Select a module to manage daily kitchen workflow</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Checklists */}
          <Link
            href="/app/checklists"
            className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-slate-900 group-hover:text-amber-400 transition">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : completedCount > 0
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : completedCount > 0 ? `In Progress (${completionPercent}%)` : "Not Started"}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-slate-950 transition">
                Shift Checklists
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                Daily opening audits, station verification tasks, photo proofs, and manager digital sign-off.
              </p>

              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Today's Progress</span>
                  <span className="font-extrabold text-slate-900">{completionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {completedCount} of {totalRequired} required checks completed
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition">
                <span>Open Checklists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Wastage */}
          <Link
            href="/app/wastage"
            className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-slate-900 group-hover:text-amber-400 transition">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {wastageMetrics?.recordCount || 0} logs this month
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-slate-950 transition">
                Food Waste Tracking
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                10-second food waste entry with live camera photos, root-cause reports, and cost catalog.
              </p>

              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  This Month's Wastage
                </span>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(wastageMetrics?.totalWastage || 0)}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  Top reason: <strong className="text-slate-800">{wastageMetrics?.topWasteReason?.name || "None recorded"}</strong>
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition">
                <span>Record Wastage</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Admin & Settings */}
          <Link
            href="/app/account"
            className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-slate-900 group-hover:text-amber-400 transition">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-slate-950 transition">
                Settings & Team
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                Restaurant profile, team staff accounts, shift hours, and station zones.
              </p>

              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Team Members
                </span>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  {usersCount} {usersCount === 1 ? "User" : "Users"}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Manage staff logins and roles
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition">
                <span>Manage Settings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
