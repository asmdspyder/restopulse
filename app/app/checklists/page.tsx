"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  History,
  Plus,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Check,
  Sparkles,
  Loader2,
  Sliders,
  UserCheck,
  HelpCircle,
  X,
  Layers,
  ArrowRight,
  PenTool,
  IndianRupee,
  ArrowLeft,
  User,
} from "lucide-react";
import { formatCurrency, formatLocalDateToYMD } from "@/lib/utils";

export default function DailyChecklistPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return formatLocalDateToYMD();
  });

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [authContext, setAuthContext] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any>(null);

  // Calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Repeatable rows local state
  const [purchaseRows, setPurchaseRows] = useState<any[]>([]);
  const [expenseRows, setExpenseRows] = useState<any[]>([]);

  // Cash and Manager verification state
  const [openingCashDrawer, setOpeningCashDrawer] = useState<string>("");
  const [smallChange, setSmallChange] = useState<string>("");
  const [openingManagerName, setOpeningManagerName] = useState<string>("");
  const [cashierName, setCashierName] = useState<string>("");
  const [verifiedByName, setVerifiedByName] = useState<string>("");
  const [pendingIssues, setPendingIssues] = useState<string>("");
  const [managerSignature, setManagerSignature] = useState<string>("");

  // Audit trail drawer state
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Remarks open modal/toggle map
  const [expandedRemarks, setExpandedRemarks] = useState<{ [itemKey: string]: boolean }>({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    fetchDailyChecklist(selectedDate);
  }, [selectedDate]);

  // Click outside to close calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const fetchDailyChecklist = async (dateStr: string) => {
    setLoading(true);
    try {
      const [authRes, checkRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/checklists/daily?date=${dateStr}`),
      ]);

      const authData = await authRes.json();
      setAuthContext(authData);

      if (checkRes.ok) {
        const data = await checkRes.json();
        setChecklistData(data);

        // Populate repeatable rows
        const pRows = (data.repeatableRows || [])
          .filter((r: any) => r.sectionCode === "purchase")
          .map((r: any) => r.data);
        setPurchaseRows(pRows.length > 0 ? pRows : [{ item: "", qty: "", vendor: "", amount: "", paymentMode: "Cash" }]);

        const eRows = (data.repeatableRows || [])
          .filter((r: any) => r.sectionCode === "expense")
          .map((r: any) => r.data);
        setExpenseRows(
          eRows.length > 0
            ? eRows
            : [
                { expense: "Packaging", amount: "", remarks: "" },
                { expense: "Gas", amount: "", remarks: "" },
                { expense: "Staff Advance", amount: "", remarks: "" },
                { expense: "Other", amount: "", remarks: "" },
              ]
        );

        // Populate header / verification fields
        const rec = data.dailyRecord || {};
        setOpeningManagerName(rec.openingManagerName || "");
        setCashierName(rec.cashierName || "");
        setVerifiedByName(rec.verifiedByName || "");
        setPendingIssues(rec.pendingIssues || "");
        setManagerSignature(rec.managerSignature || "");

        // Find opening cash values if saved
        const drawerVal = (data.values || []).find((v: any) => v.itemKey === "opening_cash_drawer");
        if (drawerVal) setOpeningCashDrawer(drawerVal.valueNumber ? String(drawerVal.valueNumber) : drawerVal.valueText || "");

        const changeVal = (data.values || []).find((v: any) => v.itemKey === "small_change_available");
        if (changeVal) setSmallChange(changeVal.valueNumber ? String(changeVal.valueNumber) : changeVal.valueText || "");

        if (data.auditLogs) {
          setAuditLogs(data.auditLogs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = formatLocalDateToYMD();
  const isToday = selectedDate === todayStr;

  // Toggle Checkbox Item
  const handleToggleItem = async (item: any, section: any) => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    const itemKey = item.id || item.label;
    const existingVal = (checklistData.values || []).find((v: any) => v.itemKey === itemKey || v.itemId === item.id);
    const nextBool = !(existingVal?.valueBoolean === true);
    const currentUserName = authContext?.user?.name || "Staff";

    // Optimistic UI update
    setSavingStatus("saving");
    const updatedValues = (checklistData.values || []).filter((v: any) => v.itemKey !== itemKey && v.itemId !== item.id);
    updatedValues.push({
      itemKey,
      itemId: item.id,
      sectionId: section.id,
      valueBoolean: nextBool,
      remarks: existingVal?.remarks,
      updatedByName: currentUserName,
    });

    let totalReq = 0;
    let completed = 0;
    (checklistData.structure?.sections || []).forEach((sec: any) => {
      (sec.items || []).forEach((it: any) => {
        const v = updatedValues.find((val: any) => val.itemId === it.id || val.itemKey === it.id || val.itemKey === it.label);
        let isDone = false;
        if (it.fieldType === "checkbox" || it.field_type === "checkbox") {
          isDone = v?.valueBoolean === true;
        } else if (it.fieldType === "currency" || it.field_type === "currency" || it.fieldType === "number" || it.field_type === "number") {
          isDone = v !== undefined && v.valueNumber !== null && String(v.valueNumber).trim() !== "";
        } else if (it.fieldType === "signature" || it.field_type === "signature") {
          isDone = (v !== undefined && !!v.valueText?.trim()) || Boolean(checklistData.dailyRecord?.managerSignature?.trim());
        } else if (it.label === "Opening Manager Name") {
          isDone = (v !== undefined && !!v.valueText?.trim()) || Boolean(checklistData.dailyRecord?.openingManagerName?.trim());
        } else {
          isDone = v !== undefined && (v.valueBoolean === true || (typeof v.valueText === "string" && v.valueText.trim() !== ""));
        }
        if (it.isRequired || it.is_required) {
          totalReq++;
          if (isDone) completed++;
        }
      });
    });

    const newPercent = totalReq > 0 ? Math.round((completed / totalReq) * 100) : 100;

    setChecklistData((prev: any) => ({
      ...prev,
      values: updatedValues,
      dailyRecord: {
        ...prev.dailyRecord,
        completedItemsCount: completed,
        totalRequiredItemsCount: totalReq,
        completionPercent: newPercent,
        status: completed === 0 ? "not_started" : completed >= totalReq ? "completed" : "in_progress",
      },
    }));

    try {
      const res = await fetch("/api/checklists/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRecordId,
          itemKey,
          payload: {
            itemId: item.id,
            sectionId: section.id,
            valueBoolean: nextBool,
            remarks: existingVal?.remarks,
            sectionTitle: section.title,
            itemLabel: item.label,
          },
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        setSavingStatus("saved");
        setChecklistData((prev: any) => ({
          ...prev,
          dailyRecord: {
            ...prev.dailyRecord,
            completedItemsCount: resData.completedItemsCount,
            totalRequiredItemsCount: resData.totalRequiredItemsCount,
            completionPercent: Math.round(Number(resData.completionPercent || 0)),
            status: resData.status,
          },
        }));
      } else {
        setSavingStatus("error");
      }
    } catch (err) {
      setSavingStatus("error");
    }
  };

  // Update Item Remarks
  const handleUpdateRemarks = async (item: any, section: any, text: string) => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    const itemKey = item.id || item.label;
    const existingVal = (checklistData.values || []).find((v: any) => v.itemKey === itemKey || v.itemId === item.id);

    setSavingStatus("saving");
    try {
      const res = await fetch("/api/checklists/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRecordId,
          itemKey,
          payload: {
            itemId: item.id,
            sectionId: section.id,
            valueBoolean: existingVal?.valueBoolean,
            remarks: text.trim(),
            sectionTitle: section.title,
            itemLabel: item.label,
          },
        }),
      });

      if (res.ok) {
        setSavingStatus("saved");
        const updatedValues = (checklistData.values || []).map((v: any) => {
          if (v.itemKey === itemKey || v.itemId === item.id) {
            return { ...v, remarks: text.trim() };
          }
          return v;
        });
        setChecklistData({ ...checklistData, values: updatedValues });
      } else {
        setSavingStatus("error");
      }
    } catch (err) {
      setSavingStatus("error");
    }
  };

  // Save Cash Drawer float values
  const handleSaveCashValues = async () => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    setSavingStatus("saving");
    try {
      const [, res2] = await Promise.all([
        fetch("/api/checklists/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dailyRecordId,
            itemKey: "opening_cash_drawer",
            payload: {
              valueNumber: openingCashDrawer ? parseFloat(openingCashDrawer) : null,
              sectionTitle: "Cash & Billing Summary",
              itemLabel: "Opening Cash Drawer",
            },
          }),
        }),
        fetch("/api/checklists/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dailyRecordId,
            itemKey: "small_change_available",
            payload: {
              valueNumber: smallChange ? parseFloat(smallChange) : null,
              sectionTitle: "Cash & Billing Summary",
              itemLabel: "Small Change Available",
            },
          }),
        }),
      ]);
      if (res2.ok) {
        const lastRes = await res2.json();
        if (lastRes?.completedItemsCount !== undefined) {
          setChecklistData((prev: any) => ({
            ...prev,
            dailyRecord: {
              ...prev.dailyRecord,
              completedItemsCount: lastRes.completedItemsCount,
              totalRequiredItemsCount: lastRes.totalRequiredItemsCount,
              completionPercent: Math.round(Number(lastRes.completionPercent || 0)),
              status: lastRes.status,
            },
          }));
        }
      }
      setSavingStatus("saved");
      showToast("Cash drawer float saved");
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Save Purchases Table
  const handleSavePurchases = async () => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;
    setSavingStatus("saving");
    try {
      const filtered = purchaseRows.filter((r) => r.item?.trim() || r.amount);
      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionCode: "purchase",
          rows: filtered,
        }),
      });
      if (res.ok) {
        setSavingStatus("saved");
        showToast("Purchases log saved");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Save Expenses Table
  const handleSaveExpenses = async () => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;
    setSavingStatus("saving");
    try {
      const filtered = expenseRows.filter((r) => r.amount || r.remarks?.trim());
      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionCode: "expense",
          rows: filtered,
        }),
      });
      if (res.ok) {
        setSavingStatus("saved");
        showToast("Expenses log saved");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Sign & Verify Checklist
  const handleManagerVerification = async (isSigning: boolean) => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    setSavingStatus("saving");
    try {
      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingManagerName,
          cashierName,
          verifiedByName,
          pendingIssues,
          managerSignature: isSigning ? managerSignature || authContext?.user?.name || "Manager" : undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setChecklistData({ ...checklistData, dailyRecord: updated.record });
        setSavingStatus("saved");
        showToast(isSigning ? "Checklist signed & verified!" : "Verification details saved");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  const fetchAuditLogs = async () => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;
    try {
      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Loading daily checklist...</span>
      </div>
    );
  }

  const structure = checklistData?.structure || {};
  const sections = structure.sections || [];
  const dailyRecord = checklistData?.dailyRecord || {};
  const values = checklistData?.values || [];
  const valuesMap = new Map<string, any>(values.map((v: any) => [v.itemKey, v]));

  const completionPercent = Math.round(Number(dailyRecord.completionPercent || 0));
  const completedCount = Number(dailyRecord.completedItemsCount || 0);
  const totalRequired = Number(dailyRecord.totalRequiredItemsCount || 0);
  const isCompleted = dailyRecord.status === "completed";

  // Calculate purchase & expense totals
  const totalPurchase = purchaseRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalExpense = expenseRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  // Generate Calendar Days for Popover
  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSelected = dateStr === selectedDate;
      const isCurrentDay = dateStr === todayStr;

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => {
            setSelectedDate(dateStr);
            setIsCalendarOpen(false);
          }}
          className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
            isSelected
              ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/30 scale-105"
              : isCurrentDay
              ? "bg-emerald-100 text-emerald-900 border border-emerald-400 font-extrabold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const dateFormatted = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER & INTERACTIVE CALENDAR PICKER */}
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

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {structure.title || "Daily Opening Checklist"}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
              v{dailyRecord.versionNumber || "1"}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Standard operating procedure verification & morning audit checklist.
          </p>
        </div>

        {/* Calendar Trigger and Audit Button */}
        <div className="flex items-center gap-2 relative">
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="px-3.5 py-2 rounded-2xl bg-white border border-[#bed6c2] hover:border-emerald-600 text-slate-800 text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-700" />
              <span>{isToday ? `Today (${dateFormatted})` : dateFormatted}</span>
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            {/* Calendar Popover */}
            {isCalendarOpen && (
              <div className="absolute right-0 top-12 z-50 bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 w-72 space-y-3 animate-in fade-in zoom-in-95">
                {/* Month/Year Navigation */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(calendarMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarMonth(prev);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-900">
                    {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(calendarMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarMonth(next);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 place-items-center">
                  {renderCalendarDays()}
                </div>

                {/* Quick Today Shortcut */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setCalendarMonth(new Date());
                      setIsCalendarOpen(false);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Jump to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsAuditDrawerOpen(true);
              fetchAuditLogs();
            }}
            className="p-2.5 rounded-2xl bg-white border border-[#bed6c2] hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="View Audit Log"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRESS SUMMARY STRIP */}
      <div className="bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Checklist Completion</span>
            <span className="text-slate-900 font-extrabold text-sm">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {savingStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {savingStatus === "saved" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Saved</span>
            </span>
          )}
          {savingStatus === "error" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Save error</span>
            </span>
          )}

          {!isToday && !isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3" />
              <span>{Math.max(0, totalRequired - completedCount)} items missed</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. DYNAMIC SECTIONS RENDERER */}
      <div className="space-y-5">
        {sections.map((section: any, sIdx: number) => {
          // A. Standard Checklist Section (Checkboxes)
          if (section.sectionType === "checklist" || !section.sectionType) {
            return (
              <div key={section.id || sIdx} className="bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                      {section.sectionCode || sIdx + 1}
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">{section.title}</h2>
                      {section.description && <p className="text-[10px] text-slate-500">{section.description}</p>}
                    </div>
                  </div>
                </div>

                {/* 2 to 3 Columns Grid for Optimal Space Usage */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(section.items || []).map((item: any) => {
                    const itemKey = item.id || item.label;
                    const val = valuesMap.get(itemKey);
                    const isChecked = val?.valueBoolean === true;
                    const remarks = val?.remarks || "";
                    const isRemarksOpen = expandedRemarks[itemKey] || !!remarks;
                    const markedByName = val?.updatedByName || (isChecked ? authContext?.user?.name || "Staff" : "");

                    return (
                      <div
                        key={itemKey}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition flex flex-col justify-between ${
                          isChecked
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                            : "bg-slate-50/70 border-slate-200/80 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleItem(item, section)}
                              className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer shrink-0"
                            />
                            <span className={`text-xs leading-snug ${isChecked ? "font-semibold text-slate-900 line-through opacity-85" : "font-medium text-slate-800"}`}>
                              {item.label}
                            </span>
                          </label>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* CLEAR NAME DISPLAY OF WHO MARKED IT */}
                            {isChecked && markedByName && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>{markedByName}</span>
                              </span>
                            )}
                            {item.allowsRemarks && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRemarks((prev) => ({
                                    ...prev,
                                    [itemKey]: !isRemarksOpen,
                                  }))
                                }
                                className={`p-1 rounded-md text-[10px] transition ${
                                  remarks
                                    ? "text-emerald-800 bg-emerald-100/80 font-bold"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                                title="Add remark / temperature log"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Remarks Input */}
                        {isRemarksOpen && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                            <input
                              type="text"
                              defaultValue={remarks}
                              placeholder="Add note or reading..."
                              onBlur={(e) => handleUpdateRemarks(item, section, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdateRemarks(item, section, e.currentTarget.value);
                                }
                              }}
                              className="w-full p-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] bg-white text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // B. Purchase & Expense Tables (Section F in Paper Checklist)
          if (section.sectionType === "table_purchase_expense" || section.sectionCode === "F") {
            return (
              <div key={section.id || sIdx} className="bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                    {section.sectionCode || "F"}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{section.title}</h2>
                    <p className="text-[10px] text-slate-500">Quick entry for morning market purchases and daily cash expenses.</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Purchase Table */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Purchase Quick Record</span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        Total: {formatCurrency(totalPurchase)}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {purchaseRows.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 text-xs items-center">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={row.item || ""}
                            onChange={(e) => {
                              const copy = [...purchaseRows];
                              copy[idx].item = e.target.value;
                              setPurchaseRows(copy);
                            }}
                            className="col-span-5 p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Vendor"
                            value={row.vendor || ""}
                            onChange={(e) => {
                              const copy = [...purchaseRows];
                              copy[idx].vendor = e.target.value;
                              setPurchaseRows(copy);
                            }}
                            className="col-span-3 p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                          <input
                            type="number"
                            placeholder="₹"
                            value={row.amount || ""}
                            onChange={(e) => {
                              const copy = [...purchaseRows];
                              copy[idx].amount = e.target.value;
                              setPurchaseRows(copy);
                            }}
                            className="col-span-3 p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setPurchaseRows(purchaseRows.filter((_, i) => i !== idx))}
                            className="col-span-1 text-slate-400 hover:text-rose-600 text-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseRows([
                            ...purchaseRows,
                            { item: "", qty: "", vendor: "", amount: "", paymentMode: "Cash" },
                          ])
                        }
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900"
                      >
                        + Add Purchase Row
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePurchases}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                      >
                        Save Purchases
                      </button>
                    </div>
                  </div>

                  {/* Expense Table */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Expenses Quick Record</span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        Total: {formatCurrency(totalExpense)}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {expenseRows.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 text-xs items-center">
                          <input
                            type="text"
                            placeholder="Category"
                            value={row.expense || ""}
                            onChange={(e) => {
                              const copy = [...expenseRows];
                              copy[idx].expense = e.target.value;
                              setExpenseRows(copy);
                            }}
                            className="col-span-4 p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                          <input
                            type="number"
                            placeholder="₹"
                            value={row.amount || ""}
                            onChange={(e) => {
                              const copy = [...expenseRows];
                              copy[idx].amount = e.target.value;
                              setExpenseRows(copy);
                            }}
                            className="col-span-3 p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={row.remarks || ""}
                            onChange={(e) => {
                              const copy = [...expenseRows];
                              copy[idx].remarks = e.target.value;
                              setExpenseRows(copy);
                            }}
                            className="col-span-4 p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setExpenseRows(expenseRows.filter((_, i) => i !== idx))}
                            className="col-span-1 text-slate-400 hover:text-rose-600 text-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpenseRows([...expenseRows, { expense: "", amount: "", remarks: "" }])
                        }
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900"
                      >
                        + Add Expense Row
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveExpenses}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                      >
                        Save Expenses
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // C. Cash & Billing Section (Section G)
          if (section.sectionType === "cash_summary" || section.sectionCode === "G") {
            return (
              <div key={section.id || sIdx} className="bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                    {section.sectionCode || "G"}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{section.title}</h2>
                    <p className="text-[10px] text-slate-500">Opening register cash float and cashier handover.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Opening Cash Drawer Float (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      value={openingCashDrawer}
                      onChange={(e) => setOpeningCashDrawer(e.target.value)}
                      onBlur={handleSaveCashValues}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Small Change Available (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={smallChange}
                      onChange={(e) => setSmallChange(e.target.value)}
                      onBlur={handleSaveCashValues}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          }

          // D. Manager Verification & Sign-off Section (Section I)
          if (section.sectionType === "manager_signoff" || section.sectionCode === "I") {
            return (
              <div key={section.id || sIdx} className="bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                    {section.sectionCode || "I"}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{section.title}</h2>
                    <p className="text-[10px] text-slate-500">Manager sign-off and pending operational notes.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Opening Manager Name</label>
                    <input
                      type="text"
                      value={openingManagerName}
                      onChange={(e) => setOpeningManagerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Cashier Name</label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="e.g. Amit Kumar"
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pending Issues / Notes</label>
                    <textarea
                      rows={2}
                      value={pendingIssues}
                      onChange={(e) => setPendingIssues(e.target.value)}
                      placeholder="Equipment issues, stock shortages, or notes for evening shift..."
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    {dailyRecord.managerSignature ? (
                      <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Signed by {dailyRecord.managerSignature} at {new Date(dailyRecord.verifiedAt || dailyRecord.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Pending manager digital signature</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleManagerVerification(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Save Notes
                    </button>
                    {!dailyRecord.managerSignature && (
                      <button
                        type="button"
                        onClick={() => handleManagerVerification(true)}
                        className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Sign & Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Audit Drawer */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-slate-900">Audit Trail ({selectedDate})</h3>
              </div>
              <button onClick={() => setIsAuditDrawerOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No audit trail recorded for this date yet.
                </div>
              ) : (
                auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">{log.userName || "User"}</span>
                      <span className="text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      <span className="font-bold text-emerald-800 capitalize">{log.action}: </span>
                      <span>{log.itemLabel || log.sectionTitle}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
