"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Filter,
  Plus,
  X,
  Key,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Managed Account Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly" | "lifetime">("yearly");
  const [expiryDate, setExpiryDate] = useState("");
  const [isLifetime, setIsLifetime] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [search, statusFilter]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/accounts?status=${statusFilter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!businessName || !contactName || !email || !password) {
      setModalError("Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      setModalError("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          email,
          phone,
          password,
          plan,
          expiryDate: isLifetime ? null : expiryDate || null,
          isLifetime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create managed account");
      }

      setIsCreateOpen(false);
      // Reset form
      setBusinessName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setExpiryDate("");
      setIsLifetime(false);
      loadAccounts();
    } catch (err: any) {
      setModalError(err.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "manually_deactivated" : "active";
    const confirmMessage =
      nextStatus === "manually_deactivated"
        ? "Deactivate this restaurant workspace? They will immediately lose access."
        : "Reactivate this restaurant workspace?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${accountId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      loadAccounts();
    } catch (e) {
      console.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Restaurant Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">Manage, create, and audit customer workspaces with full admin control</p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsCreateOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Managed Account</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name, contact, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="manually_deactivated">Deactivated Only</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No restaurant accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Plan & Expiry</th>
                  <th className="py-3.5 px-4">Subscription Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Signup Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      <div className="capitalize">{acc.subPlan || "Monthly"} ({formatCurrency(acc.subAmount || 199)})</div>
                      <div className="text-[11px] text-slate-500">
                        {acc.currentPeriodEnd ? `Expires: ${formatDate(acc.currentPeriodEnd)}` : "Lifetime Access"}
                      </div>
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
                      <Link
                        href={`/admin/accounts/${acc.id}`}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition inline-block"
                      >
                        Manage
                      </Link>
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
        )}
      </div>

      {/* Create Managed Account Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Create Managed Restaurant Account</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Manually create a fully-controlled restaurant account with custom username, password, expiry date, or lifetime access (bypasses regular subscription checkout).
            </p>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Grand Bistro"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Manager John"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Account Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@bistro.com"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Plan / Access Tier</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="yearly">Yearly (Annual)</option>
                    <option value="monthly">Monthly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    disabled={isLifetime}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs disabled:opacity-40 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lifetimeCheck"
                  checked={isLifetime}
                  onChange={(e) => setIsLifetime(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="lifetimeCheck" className="font-semibold text-slate-300 text-xs cursor-pointer">
                  Grant Permanent Lifetime Access (No expiry)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
