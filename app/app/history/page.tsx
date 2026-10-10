"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  History,
  Search,
  Download,
  Calendar,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import WastageCameraModal from "@/components/app/wastage-camera-modal";

export default function WastageHistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Re-upload Camera State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [reuploadTarget, setReuploadTarget] = useState<{ id: string; itemName: string } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const handleRemovePhoto = async (recordId: string) => {
    if (!confirm("Are you sure you want to remove this photo proof?")) return;
    try {
      const res = await fetch(`/api/wastage/images?recordId=${recordId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove photo");
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, imageUrl: null } : r))
      );
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord((prev: any) => ({ ...prev, imageUrl: null }));
      }
      setActionSuccess("Photo proof removed successfully");
    } catch (err: any) {
      setActionError(err.message || "Failed to remove photo");
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, reasonId, startDate, endDate]);

  const fetchReasons = async () => {
    try {
      const res = await fetch("/api/reasons");
      const data = await res.json();
      setReasons(data.reasons || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Lock body scrolling and listen to Escape key when photo lightbox is open
  useEffect(() => {
    if (viewingPhoto) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setViewingPhoto(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [viewingPhoto]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      let url = `/api/wastage?limit=${limit}&offset=${offset}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (reasonId) url += `&reasonId=${reasonId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      const data = await res.json();
      setRecords(data.records || []);
      setTotalCount(data.totalCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const exportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      "Date & Time",
      "Item",
      "Category",
      "Quantity",
      "Unit",
      "Rate (₹)",
      "Wastage Value (₹)",
      "Reason",
      "Responsible Area",
      "Shift",
      "Logged By",
      "Notes",
      "Photo Proof URL",
    ];

    const rows = records.map((r) => [
      formatDateTime(r.recordedAt),
      `"${r.itemName}"`,
      `"${r.categoryName || ""}"`,
      r.quantity,
      r.unit,
      r.ratePerUnit,
      r.wastageValue,
      `"${r.reasonName}"`,
      `"${r.responsibleArea || ""}"`,
      `"${r.shift || ""}"`,
      `"${r.userName || ""}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
      r.imageUrl ? `"${typeof window !== "undefined" ? window.location.origin : ""}${r.imageUrl}"` : `""`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wastage_history_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/app"
              className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:bg-emerald-50 text-slate-700 shadow-xs transition group flex items-center justify-center shrink-0"
              title="Back to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wastage History</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete historical record of every logged wastage event with preserved pricing snapshots.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={records.length === 0}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Reason Select */}
          <div>
            <select
              value={reasonId}
              onChange={(e) => {
                setReasonId(e.target.value);
                setPage(1);
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="">All Reasons</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Apply Filters
          </button>
        </form>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="p-1.5 rounded-lg border border-slate-300 text-xs"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="p-1.5 rounded-lg border border-slate-300 text-xs"
          />
          {(startDate || endDate || reasonId || search) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setReasonId("");
                setSearch("");
                setPage(1);
              }}
              className="ml-auto text-xs text-rose-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="w-4 h-4 text-rose-700" />
          </button>
        </div>
      )}

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <span className="text-xs font-semibold text-slate-500">Loading history logs...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No wastage logs found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or record a new wastage event.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Photo Proof</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Rate Snapshot</th>
                    <th className="py-3.5 px-4">Wastage Value</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Area</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4">Logged By</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {formatDateTime(r.recordedAt)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.itemName}</td>
                      <td className="py-3.5 px-4">
                        {r.imageUrl ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingPhoto(r.imageUrl)}
                              className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                              title="Click to view photo proof"
                            >
                              <Camera className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-[10px] font-bold">View Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReuploadTarget({ id: r.id, itemName: r.itemName });
                                setIsCameraModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                              title="Re-upload or replace photo"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReuploadTarget({ id: r.id, itemName: r.itemName });
                              setIsCameraModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 text-slate-500 hover:text-amber-800 text-[10px] font-bold transition cursor-pointer"
                            title="Add live camera photo"
                          >
                            <Camera className="w-3 h-3 text-amber-600" />
                            <span>Add Photo</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{r.categoryName || "General"}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatCurrency(r.ratePerUnit)} / {r.unit}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatCurrency(r.wastageValue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[11px] text-slate-700">
                          {r.reasonName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{r.responsibleArea || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px]">
                        {r.notes ? (
                          <span className="inline-block truncate max-w-[180px] text-slate-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium" title={r.notes}>
                            {r.notes}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{r.userName || "Staff"}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {records.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{r.itemName}</span>
                      {r.imageUrl ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingPhoto(r.imageUrl)}
                            className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReuploadTarget({ id: r.id, itemName: r.itemName });
                              setIsCameraModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Re-upload</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReuploadTarget({ id: r.id, itemName: r.itemName });
                            setIsCameraModalOpen(true);
                          }}
                          className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Add Photo</span>
                        </button>
                      )}
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">{formatCurrency(r.wastageValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {r.quantity} {r.unit} • {r.reasonName}
                    </span>
                    <span>{formatDateTime(r.recordedAt)}</span>
                  </div>
                  {r.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{r.notes}"</p>}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {records.length} of {totalCount} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Wastage Record Details</h3>
              <button onClick={() => setSelectedRecord(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-900">{selectedRecord.itemName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{selectedRecord.categoryName || "General"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Quantity Logged:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.quantity} {selectedRecord.unit}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Historical Unit Rate:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(selectedRecord.ratePerUnit)} / {selectedRecord.unit}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Calculated Wastage Value:</span>
                <span className="font-extrabold text-base text-emerald-700">
                  {formatCurrency(selectedRecord.wastageValue)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Reason:</span>
                <span className="font-bold text-slate-800">{selectedRecord.reasonName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Responsible Area:</span>
                <span className="font-semibold text-slate-800">{selectedRecord.responsibleArea || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Shift:</span>
                <span className="font-semibold text-slate-800">{selectedRecord.shift || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Recorded At:</span>
                <span className="font-semibold text-slate-800">{formatDateTime(selectedRecord.recordedAt)}</span>
              </div>
              {selectedRecord.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 text-slate-700 italic">"{selectedRecord.notes}"</p>
                </div>
              )}

              {/* Photo Proof Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-slate-500 font-bold block mb-1">Live Photo Proof:</span>
                {selectedRecord.imageUrl ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setViewingPhoto(selectedRecord.imageUrl)}
                      className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group cursor-pointer block"
                    >
                      <img
                        src={selectedRecord.imageUrl}
                        alt="Wastage proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                        <Eye className="w-4 h-4" />
                        <span>Click to view full photo</span>
                      </div>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReuploadTarget({ id: selectedRecord.id, itemName: selectedRecord.itemName });
                          setIsCameraModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Re-upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(selectedRecord.id)}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReuploadTarget({ id: selectedRecord.id, itemName: selectedRecord.itemName });
                      setIsCameraModalOpen(true);
                    }}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-700 hover:text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Open Camera & Add Live Photo Proof</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal for Re-upload / Add Photo */}
      {isCameraModalOpen && (
        <WastageCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => {
            setIsCameraModalOpen(false);
            setReuploadTarget(null);
          }}
          itemName={reuploadTarget?.itemName || "Wastage Item"}
          onPhotoCaptured={async (data) => {
            if (!reuploadTarget) return;
            try {
              const formData = new FormData();
              formData.append("file", data.blob, `wastage_${reuploadTarget.id}_${Date.now()}.webp`);
              formData.append("itemName", reuploadTarget.itemName);
              formData.append("recordId", reuploadTarget.id);
              const res = await fetch("/api/wastage/images", {
                method: "POST",
                body: formData,
              });
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update photo");
              }
              const resData = await res.json();
              const newUrl = resData.url;
              setRecords((prev) =>
                prev.map((r) => (r.id === reuploadTarget.id ? { ...r, imageUrl: newUrl } : r))
              );
              if (selectedRecord && selectedRecord.id === reuploadTarget.id) {
                setSelectedRecord((prev: any) => ({ ...prev, imageUrl: newUrl }));
              }
              setActionSuccess(`Photo proof for ${reuploadTarget.itemName} updated successfully!`);
            } catch (err: any) {
              setActionError(err.message || "Failed to update photo proof");
            } finally {
              setReuploadTarget(null);
              setIsCameraModalOpen(false);
            }
          }}
        />
      )}

      {/* Full Photo Lightbox Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none overscroll-none"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Food Wastage Photo Proof</h4>
                  <p className="text-[11px] text-slate-400">Captured on site</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
                title="Close Photo Viewer"
              >
                <X className="w-4 h-4" />
                <span>Close (Esc)</span>
              </button>
            </div>

            {/* Photo Body */}
            <div className="p-3 sm:p-4 bg-black/70 flex items-center justify-center overflow-auto flex-1 min-h-[260px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingPhoto}
                alt="Wastage Proof Full"
                className="max-w-full max-h-[68vh] object-contain rounded-2xl shadow-xl mx-auto"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="text-[11px]">Visual audit verification</span>
              <div className="flex items-center gap-2">
                <a
                  href={viewingPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingPhoto(null)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
