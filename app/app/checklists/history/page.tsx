"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Filter,
  Loader2,
  ChevronRight,
  ClipboardCheck,
  ArrowLeft,
} from "lucide-react";

export default function ChecklistHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checklists/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span className="text-xs font-semibold text-slate-500">Loading Checklist History...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/app"
              className="p-2 rounded-xl bg-white border border-[#bed6c2] hover:bg-emerald-50 text-slate-700 shadow-xs transition group flex items-center justify-center shrink-0"
              title="Back to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Checklist History & Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {historyList.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical operational checklist completion records, manager sign-offs, and missed item audits.
          </p>
        </div>

        <Link
          href="/app/checklists"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Open Today's Checklist</span>
        </Link>
      </div>

      {/* 2. HISTORY LIST */}
      {historyList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 font-bold">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Historical Checklists Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Open today's opening checklist and start recording station readiness.
          </p>
          <Link
            href="/app/checklists"
            className="mt-5 inline-flex px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Start Today's Checklist
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Operational Date</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Completion Status</th>
                  <th className="py-3.5 px-4">Items Progress</th>
                  <th className="py-3.5 px-4">Manager Sign-off</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((rec) => {
                  const percent = Math.round(Number(rec.completionPercent || 0));
                  const isCompleted = rec.status === "completed";
                  const totalReq = Number(rec.totalRequiredItemsCount || 0);
                  const completedCount = Number(rec.completedItemsCount || 0);
                  const missedCount = Math.max(0, totalReq - completedCount);

                  const dateFormatted = new Date(rec.date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {rec.templateTitle || "Opening Checklist"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : completedCount > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span className="capitalize">{isCompleted ? "Completed" : completedCount > 0 ? "In Progress" : "Not Started"}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 max-w-[140px]">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-600">{completedCount}/{totalReq}</span>
                            <span className="text-emerald-700">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          {!isCompleted && missedCount > 0 && (
                            <span className="text-[10px] text-rose-600 font-bold block">
                              {missedCount} missed items
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {rec.managerSignature ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Signed: {rec.managerSignature}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not signed</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/app/checklists?date=${rec.date}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                        >
                          <span>Inspect Day</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
