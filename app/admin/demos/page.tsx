"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Trash2,
  MessageSquare,
  Check,
  RotateCcw,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  address: string;
  demoDate: string;
  demoSlot: string;
  status: "pending" | "completed" | "cancelled";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadDemos();
  }, [statusFilter]);

  const loadDemos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/demos?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDemos(data.demos || []);
        setMetrics(data.metrics || null);
      }
    } catch (e) {
      console.error("Failed to load demo requests", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDemos();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/demos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      // Update state locally
      setDemos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: nextStatus as any } : d))
      );

      // Refresh metrics
      if (metrics) {
        setMetrics({
          ...metrics,
          pending: nextStatus === "completed" ? metrics.pending - 1 : metrics.pending + 1,
          completed: nextStatus === "completed" ? metrics.completed + 1 : metrics.completed - 1,
        });
      }
    } catch (err: any) {
      alert(err.message || "Error updating demo status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, restName: string) => {
    if (!confirm(`Are you sure you want to delete the demo request for "${restName}"?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/demos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete demo request");

      setDemos((prev) => prev.filter((d) => d.id !== id));
      if (metrics) {
        setMetrics({ ...metrics, total: metrics.total - 1 });
      }
    } catch (err: any) {
      alert(err.message || "Error deleting demo request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned; // default India code if 10 digits
    }
    return cleaned;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-400" />
            <span>Product Demo Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track, schedule, and mark completed demos requested by restaurant & cafe operators from the landing page.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Requests</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {metrics?.total ?? demos.length}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">All-time demo bookings</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending Demos</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
            {metrics?.pending ?? demos.filter((d) => d.status === "pending").length}
          </div>
          <span className="text-[11px] text-amber-400/80 font-semibold">Waiting to be conducted</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Completed Demos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {metrics?.completed ?? demos.filter((d) => d.status === "completed").length}
          </div>
          <span className="text-[11px] text-emerald-400/80 font-semibold">Successfully delivered</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Scheduled For Today</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400 tracking-tight">
            {metrics?.today ?? 0}
          </div>
          <span className="text-[11px] text-teal-400/80 font-semibold">Today&apos;s upcoming sessions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 w-full sm:w-auto">
          {[
            { id: "all", label: "All Requests" },
            { id: "pending", label: "Pending" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search restaurant, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Demos List / Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Demo Leads & Requests</h2>
            <p className="text-xs text-slate-500">
              Showing {demos.length} request{demos.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={loadDemos}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Refresh list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : demos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">No demo requests found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== "all"
                ? "Try clearing your search or status filters."
                : "Prospective customers who click 'Request Demo' on the landing page will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Restaurant / Cafe</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Preferred Slot</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Requested On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {demos.map((d) => {
                  const isActionLoading = actionLoadingId === d.id;
                  const waNumber = cleanPhoneForWhatsApp(d.phone);

                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition">
                      {/* Restaurant Name */}
                      <td className="py-4 px-4 font-bold text-white align-top">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-white font-extrabold">{d.restaurantName}</span>
                        </div>
                        {d.notes && (
                          <div className="text-[11px] text-slate-400 font-normal mt-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 max-w-xs">
                            💬 {d.notes}
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="font-bold text-slate-200">{d.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <a href={`mailto:${d.email}`} className="hover:text-emerald-400 underline">
                            {d.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <a href={`tel:${d.phone}`} className="hover:text-emerald-400 underline">
                            {d.phone}
                          </a>
                          {waNumber && (
                            <a
                              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                `Hi ${d.name}, this is from RestoPulse regarding your requested demo for ${d.restaurantName}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition text-[10px] font-bold"
                              title="Chat on WhatsApp"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Demo Date & Slot */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{d.demoDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-teal-400" />
                          <span>{d.demoSlot}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{d.address}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        {d.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Demo</span>
                          </span>
                        )}
                      </td>

                      {/* Requested At */}
                      <td className="py-4 px-4 align-top text-slate-400 whitespace-nowrap">
                        {formatDate(d.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right space-x-2 whitespace-nowrap">
                        {/* Completed / Pending Button */}
                        <button
                          onClick={() => handleToggleStatus(d.id, d.status)}
                          disabled={isActionLoading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                            d.status === "completed"
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          }`}
                          title={d.status === "completed" ? "Mark back as pending" : "Mark demo as completed"}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : d.status === "completed" ? (
                            <RotateCcw className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{d.status === "completed" ? "Mark Pending" : "Mark Completed"}</span>
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(d.id, d.restaurantName)}
                          disabled={isActionLoading}
                          className="p-1.5 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-xl transition cursor-pointer"
                          title="Delete demo request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
