"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [metricsRes, accountsRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/accounts"),
      ]);

      const metricsData = await metricsRes.json();
      const accountsData = await accountsRes.json();

      setMetrics(metricsData);
      setAccounts(accountsData.accounts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "manually_deactivated" : "active";
    const confirmMessage =
      nextStatus === "manually_deactivated"
        ? "Are you sure you want to deactivate this restaurant workspace? They will be immediately blocked from accessing the application regardless of active payment."
        : "Reactivate this restaurant workspace?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${accountId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      loadAdminData();
    } catch (e) {
      console.error("Failed to update account status");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Platform Business Overview</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor restaurant subscriptions, MRR, ARR, and manage workspace access.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Workspaces</span>
          <div className="text-3xl font-extrabold text-white mt-2">{metrics?.totalRestaurants}</div>
          <span className="text-xs text-emerald-400 mt-1 block">
            {metrics?.activeAccounts} active • {metrics?.deactivatedAccounts} deactivated
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approx. Monthly MRR</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(metrics?.approxMRR)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {metrics?.monthlySubscriptions} monthly • {metrics?.yearlySubscriptions} annual
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approx. Annual ARR</span>
          <div className="text-3xl font-extrabold text-white mt-2">
            {formatCurrency(metrics?.approxARR)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Annualized Run Rate</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
          <div className="text-3xl font-extrabold text-white mt-2">
            {(metrics?.monthlySubscriptions || 0) + (metrics?.yearlySubscriptions || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Razorpay active plans</span>
        </div>
      </div>

      {/* Subscriber Accounts Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Subscribed Restaurant Accounts</h3>
            <span className="text-xs text-slate-400">All registered workspaces and independent access controls</span>
          </div>
          <Link
            href="/admin/accounts"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Restaurant</th>
                <th className="py-3.5 px-4">Contact & Email</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Signup Date</th>
                <th className="py-3.5 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <Link href={`/admin/accounts/${acc.id}`} className="hover:text-emerald-400 underline">
                      {acc.businessName}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{acc.contactName}</div>
                    <div className="text-[11px] text-slate-500">{acc.email}</div>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold text-slate-300">
                    {acc.subPlan || "Monthly"} (₹{acc.subAmount || "199"})
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold uppercase">
                      {acc.subStatus || "Active"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {acc.accountStatus === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <XCircle className="w-3.5 h-3.5" /> Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(acc.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(acc.id, acc.accountStatus)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        acc.accountStatus === "active"
                          ? "bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800"
                          : "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {acc.accountStatus === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
