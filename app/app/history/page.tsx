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
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";

export default function WastageHistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

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
              className="p-2 rounded-xl bg-white border border-[#bed6c2] hover:bg-emerald-50 text-slate-700 shadow-xs transition group flex items-center justify-center shrink-0"
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
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
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
                    <span className="font-bold text-sm text-slate-900">{r.itemName}</span>
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
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
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
