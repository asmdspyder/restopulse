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
  LogIn,
  CalendarCheck,
  Clock,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [demos, setDemos] = useState<any[]>([]);
  const [demoMetrics, setDemoMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [demoActionLoadingId, setDemoActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [metricsRes, accountsRes, demosRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/accounts"),
        fetch("/api/admin/demos"),
      ]);

      const metricsData = await metricsRes.json();
      const accountsData = await accountsRes.json();
      const demosData = await demosRes.json();

      setMetrics(metricsData);
      setAccounts(accountsData.accounts || []);
      setDemos(demosData.demos || []);
      setDemoMetrics(demosData.metrics || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDemoStatus = async (demoId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setDemoActionLoadingId(demoId);
    try {
      const res = await fetch(`/api/admin/demos/${demoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update demo status");

      setDemos((prev) =>
        prev.map((d) => (d.id === demoId ? { ...d, status: nextStatus } : d))
      );
      if (demoMetrics) {
        setDemoMetrics({
          ...demoMetrics,
          pending: nextStatus === "completed" ? demoMetrics.pending - 1 : demoMetrics.pending + 1,
          completed: nextStatus === "completed" ? demoMetrics.completed + 1 : demoMetrics.completed - 1,
        });
      }
    } catch (err) {
      alert("Error updating demo status");
    } finally {
      setDemoActionLoadingId(null);
    }
  };

  const handleImpersonate = async (accountId: string) => {
    setImpersonatingId(accountId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to log in as user");
        return;
      }
      window.location.href = data.redirect || "/app";
    } catch (err) {
      alert("Error connecting to workspace");
    } finally {
      setImpersonatingId(null);
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

  const activeAccountsCount = accounts.filter((a) => a.accountStatus === "active").length;

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
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{accounts.length}</div>
          <span className="text-[11px] text-emerald-400 font-semibold">{activeAccountsCount} Active Workspaces</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Subscriptions</span>
            <CreditCard className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{metrics?.activeSubscriptions || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">
            {metrics?.totalAccounts ? Math.round((metrics.activeSubscriptions / metrics.totalAccounts) * 100) : 0}% Paid Retention
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Monthly MRR</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatCurrency(metrics?.approxMRR || metrics?.monthlyRecurringRevenue || 0)}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            {metrics?.monthlySubscriptions || 0} monthly • {metrics?.yearlySubscriptions || 0} annual
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Food Waste Tracked</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatCurrency(metrics?.totalWasteValueTracked || 0)}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">{metrics?.totalWastageRecords || 0} records logged</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Demo Requests</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {demoMetrics?.total ?? demos.length}
          </div>
          <span className="text-[11px] text-amber-400 font-semibold">
            {demoMetrics?.pending ?? 0} Pending • {demoMetrics?.completed ?? 0} Done
          </span>
        </div>
      </div>

      {/* Demo Bookings Quick Action Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Recent Product Demo Requests</h2>
              {(demoMetrics?.pending ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                  {demoMetrics.pending} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Prospective restaurant & cafe owners who requested a 1-on-1 walkthrough</p>
          </div>
          <Link
            href="/admin/demos"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All ({demos.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {demos.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No demo requests received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Restaurant / Cafe</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Preferred Slot</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {demos.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{d.restaurantName}</div>
                      {d.referralSource && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80">
                          Via: {d.referralSource}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{d.name}</div>
                      <div className="text-[11px] text-slate-500">{d.phone} • {d.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{d.demoDate}</div>
                      <div className="text-[11px] text-teal-400">{d.demoSlot}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400">{d.address}</td>
                    <td className="py-3.5 px-4">
                      {d.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleDemoStatus(d.id, d.status)}
                        disabled={demoActionLoadingId === d.id}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
                          d.status === "completed"
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                        }`}
                        title={d.status === "completed" ? "Mark back as pending" : "Mark demo completed"}
                      >
                        {demoActionLoadingId === d.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>{d.status === "completed" ? "Completed" : "Mark Completed"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Restaurant Accounts */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Customer Accounts</h2>
            <p className="text-xs text-slate-500">Fast access to customer workspaces and account settings</p>
          </div>
          <Link
            href="/admin/accounts"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All ({accounts.length})</span>
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
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleImpersonate(acc.id)}
                      disabled={impersonatingId === acc.id}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Log in directly as this restaurant user"
                    >
                      {impersonatingId === acc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      <span>{impersonatingId === acc.id ? "Connecting..." : "Login"}</span>
                    </button>
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
