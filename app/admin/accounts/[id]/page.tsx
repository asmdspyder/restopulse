"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Key,
  Calendar,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";

export default function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Expiry Modal
  const [isExpiryOpen, setIsExpiryOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [isLifetime, setIsLifetime] = useState(false);
  const [updatingExpiry, setUpdatingExpiry] = useState(false);

  // Password Reset Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`);
      if (!res.ok) throw new Error("Account not found");
      const resData = await res.json();
      setData(resData);
      if (resData.subscription?.currentPeriodEnd) {
        setNewExpiryDate(resData.subscription.currentPeriodEnd.split("T")[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    const currentStatus = data.restaurant.accountStatus;
    const nextStatus = currentStatus === "active" ? "manually_deactivated" : "active";

    const confirmMessage =
      nextStatus === "manually_deactivated"
        ? "Deactivate this restaurant account? They will immediately lose workspace access."
        : "Reactivate this restaurant account?";

    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      setBanner({ type: "success", text: `Account is now ${nextStatus === "active" ? "Active" : "Deactivated"}` });
      loadAccount();
    } catch (e) {
      setBanner({ type: "error", text: "Failed to update account status" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingExpiry(true);

    try {
      const targetDate = isLifetime ? "2099-12-31" : newExpiryDate;
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_expiry",
          expiryDate: targetDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to update expiry date");
      setBanner({ type: "success", text: isLifetime ? "Account granted Lifetime Access!" : `Expiry updated to ${formatDate(targetDate)}` });
      setIsExpiryOpen(false);
      loadAccount();
    } catch (e: any) {
      setBanner({ type: "error", text: e.message || "Failed to update expiry" });
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      setBanner({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          userId: selectedUser.id,
          newPassword,
        }),
      });

      if (!res.ok) throw new Error("Failed to reset password");
      setBanner({ type: "success", text: `Password successfully updated for ${selectedUser.email}` });
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (e: any) {
      setBanner({ type: "error", text: e.message || "Failed to reset password" });
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-white">Restaurant account not found</h3>
        <Link href="/admin/accounts" className="text-xs text-emerald-400 mt-2 inline-block">
          ← Back to Accounts
        </Link>
      </div>
    );
  }

  const { restaurant, users: accountUsers, subscription, stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/accounts"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{restaurant.businessName}</h1>
          <span className="text-xs text-slate-400">Account ID: {restaurant.id}</span>
        </div>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            banner.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Top Banner with Manual Status Control */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Access State</span>
          <div className="flex items-center gap-2 mt-1">
            {restaurant.accountStatus === "active" ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Active & Operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800">
                <ShieldAlert className="w-4 h-4" /> Manually Deactivated by Admin
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          disabled={actionLoading}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 ${
            restaurant.accountStatus === "active"
              ? "bg-rose-900 hover:bg-rose-800 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {actionLoading
            ? "Updating..."
            : restaurant.accountStatus === "active"
            ? "Deactivate Workspace"
            : "Reactivate Workspace"}
        </button>
      </div>

      {/* Information Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Business Information</span>
          </h3>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Contact Person:</span>
            <span className="font-semibold text-white">{restaurant.contactName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Primary Email:</span>
            <span className="font-semibold text-white">{restaurant.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Phone:</span>
            <span className="font-semibold text-white">{restaurant.phone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Address:</span>
            <span className="font-semibold text-white">{restaurant.address || "—"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Signup Date:</span>
            <span className="font-semibold text-white">{formatDate(restaurant.createdAt)}</span>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Subscription & Expiry Details</span>
            </h3>
            <button
              onClick={() => setIsExpiryOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Edit Expiry</span>
            </button>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Plan Type:</span>
            <span className="font-bold text-white capitalize">{subscription?.planType || "Monthly"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Plan Amount:</span>
            <span className="font-bold text-emerald-400">{formatCurrency(subscription?.amount || 199)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Subscription Status:</span>
            <span className="font-semibold text-white capitalize">{subscription?.status || "Active"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Access Expiry Date:</span>
            <span className="font-bold text-white">
              {subscription?.currentPeriodEnd ? (
                new Date(subscription.currentPeriodEnd).getFullYear() > 2090 ? (
                  <span className="text-emerald-400 font-bold">Lifetime Access</span>
                ) : (
                  formatDate(subscription.currentPeriodEnd)
                )
              ) : (
                "Lifetime Access"
              )}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Total Logged Wastage:</span>
            <span className="font-extrabold text-white">
              {formatCurrency(stats?.totalWastageValue)} ({stats?.totalWastageRecords} records)
            </span>
          </div>
        </div>
      </div>

      {/* Associated Restaurant Users & Password Reset */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Users Under This Restaurant ({accountUsers.length})</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage user credentials and permissions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email / Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accountUsers.map((u: any) => (
                <tr key={u.id}>
                  <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4 capitalize font-semibold">{u.role}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setNewPassword("");
                        setIsPasswordModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset Password</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expiry Modal */}
      {isExpiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Set Account Expiry Date</h3>
              <button onClick={() => setIsExpiryOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpiry} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">New Expiry Date</label>
                <input
                  type="date"
                  disabled={isLifetime}
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs disabled:opacity-40 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lifetimeToggle"
                  checked={isLifetime}
                  onChange={(e) => setIsLifetime(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="lifetimeToggle" className="font-semibold text-slate-300 cursor-pointer">
                  Grant Lifetime Access (Permanent)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpiryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingExpiry || (!isLifetime && !newExpiryDate)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {updatingExpiry ? "Updating..." : "Save Expiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Reset Password</h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword || newPassword.length < 6}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {resettingPassword ? "Saving..." : "Set New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
