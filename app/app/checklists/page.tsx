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
  Camera,
  FileCheck2,
  Receipt,
  Banknote,
  DollarSign,
  ChevronDown,
  Sparkle,
  CheckCheck,
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import { formatCurrency, formatLocalDateToYMD } from "@/lib/utils";
import {
  ChecklistCameraModal,
  ChecklistItemImage,
} from "@/components/app/checklist-camera-modal";

export default function DailyChecklistPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return formatLocalDateToYMD();
  });

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [authContext, setAuthContext] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any>(null);

  // Active Category Filter / Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");

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

  // Digital Signature Canvas
  const [isSignPadOpen, setIsSignPadOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Remarks open map
  const [expandedRemarks, setExpandedRemarks] = useState<{ [itemKey: string]: boolean }>({});
  const [toastMsg, setToastMsg] = useState("");

  // Camera Modal State
  const [cameraModalItem, setCameraModalItem] = useState<{
    item: any;
    section: any;
    itemKey: string;
    itemLabel: string;
    sectionTitle: string;
    images: ChecklistItemImage[];
  } | null>(null);

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
        setPurchaseRows(
          pRows.length > 0
            ? pRows
            : [{ item: "", qty: "", vendor: "", amount: "", paymentMode: "Cash" }]
        );

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
        const drawerVal = (data.values || []).find(
          (v: any) => v.itemKey === "opening_cash_drawer"
        );
        if (drawerVal)
          setOpeningCashDrawer(
            drawerVal.valueNumber
              ? String(drawerVal.valueNumber)
              : drawerVal.valueText || ""
          );

        const changeVal = (data.values || []).find(
          (v: any) => v.itemKey === "small_change_available"
        );
        if (changeVal)
          setSmallChange(
            changeVal.valueNumber
              ? String(changeVal.valueNumber)
              : changeVal.valueText || ""
          );

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
    const existingVal = (checklistData.values || []).find(
      (v: any) =>
        (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
        (item.label &&
          (v.itemKey === item.label ||
            v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
    );
    const nextBool = !(existingVal?.valueBoolean === true);
    const currentUserName = authContext?.user?.name || "Staff";

    // Optimistic UI update
    setSavingStatus("saving");
    const updatedValues = (checklistData.values || []).filter(
      (v: any) =>
        !(
          (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
          (item.label &&
            (v.itemKey === item.label ||
              v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
        )
    );
    updatedValues.push({
      itemKey,
      itemId: item.id,
      sectionId: section.id,
      valueBoolean: nextBool,
      valueJson: existingVal?.valueJson,
      remarks: existingVal?.remarks,
      updatedByName: currentUserName,
    });

    let totalReq = 0;
    let completed = 0;
    (checklistData.structure?.sections || []).forEach((sec: any) => {
      (sec.items || []).forEach((it: any) => {
        const v = updatedValues.find(
          (val: any) =>
            (it.id && (val.itemId === it.id || val.itemKey === it.id)) ||
            (it.label &&
              (val.itemKey === it.label ||
                val.itemKey?.toLowerCase().trim() === it.label.toLowerCase().trim()))
        );
        let isDone = false;
        if (it.fieldType === "checkbox" || it.field_type === "checkbox") {
          isDone = v?.valueBoolean === true;
        } else if (
          it.fieldType === "currency" ||
          it.field_type === "currency" ||
          it.fieldType === "number" ||
          it.field_type === "number"
        ) {
          isDone =
            v !== undefined &&
            v.valueNumber !== null &&
            String(v.valueNumber).trim() !== "";
        } else if (it.fieldType === "signature" || it.field_type === "signature") {
          isDone =
            (v !== undefined && !!v.valueText?.trim()) ||
            Boolean(checklistData.dailyRecord?.managerSignature?.trim());
        } else if (it.label === "Opening Manager Name") {
          isDone =
            (v !== undefined && !!v.valueText?.trim()) ||
            Boolean(checklistData.dailyRecord?.openingManagerName?.trim());
        } else {
          isDone =
            v !== undefined &&
            (v.valueBoolean === true ||
              (typeof v.valueText === "string" && v.valueText.trim() !== ""));
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
        status:
          completed === 0
            ? "not_started"
            : completed >= totalReq
            ? "completed"
            : "in_progress",
      },
    }));

    try {
      const res = await fetch("/api/checklists/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRecordId,
          itemId: item.id,
          sectionId: section.id,
          itemKey,
          payload: {
            valueBoolean: nextBool,
            remarks: existingVal?.remarks,
            valueJson: existingVal?.valueJson,
            sectionTitle: section.title,
            itemLabel: item.label,
          },
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.completedItemsCount !== undefined) {
          setChecklistData((prev: any) => ({
            ...prev,
            dailyRecord: {
              ...prev.dailyRecord,
              completedItemsCount: result.completedItemsCount,
              totalRequiredItemsCount: result.totalRequiredItemsCount,
              completionPercent: Math.round(Number(result.completionPercent || 0)),
              status: result.status,
            },
          }));
        }
        setSavingStatus("saved");
      } else {
        setSavingStatus("error");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Change Value Input (number, text, temp)
  const handleChangeValue = async (
    item: any,
    section: any,
    val: { text?: string; number?: number }
  ) => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    const itemKey = item.id || item.label;
    const existingVal = (checklistData.values || []).find(
      (v: any) =>
        (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
        (item.label &&
          (v.itemKey === item.label ||
            v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
    );

    setSavingStatus("saving");
    try {
      const res = await fetch("/api/checklists/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRecordId,
          itemId: item.id,
          sectionId: section.id,
          itemKey,
          payload: {
            valueText: val.text !== undefined ? val.text : existingVal?.valueText,
            valueNumber: val.number !== undefined ? val.number : existingVal?.valueNumber,
            valueBoolean: existingVal?.valueBoolean,
            remarks: existingVal?.remarks,
            valueJson: existingVal?.valueJson,
            sectionTitle: section.title,
            itemLabel: item.label,
          },
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const updatedValues = (checklistData.values || []).filter(
          (v: any) =>
            !(
              (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
              (item.label &&
                (v.itemKey === item.label ||
                  v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
            )
        );
        updatedValues.push({
          itemKey,
          itemId: item.id,
          sectionId: section.id,
          valueText: val.text !== undefined ? val.text : existingVal?.valueText,
          valueNumber: val.number !== undefined ? val.number : existingVal?.valueNumber,
          valueBoolean: existingVal?.valueBoolean,
          remarks: existingVal?.remarks,
          valueJson: existingVal?.valueJson,
        });

        setChecklistData((prev: any) => ({
          ...prev,
          values: updatedValues,
          dailyRecord: {
            ...prev.dailyRecord,
            completedItemsCount: result.completedItemsCount ?? prev.dailyRecord.completedItemsCount,
            totalRequiredItemsCount:
              result.totalRequiredItemsCount ?? prev.dailyRecord.totalRequiredItemsCount,
            completionPercent: Math.round(
              Number(result.completionPercent ?? prev.dailyRecord.completionPercent)
            ),
            status: result.status ?? prev.dailyRecord.status,
          },
        }));
        setSavingStatus("saved");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Save Item Remarks
  const handleSaveRemarks = async (item: any, section: any, text: string) => {
    const dailyRecordId = checklistData?.dailyRecord?.id;
    if (!dailyRecordId) return;

    const itemKey = item.id || item.label;
    const existingVal = (checklistData.values || []).find(
      (v: any) =>
        (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
        (item.label &&
          (v.itemKey === item.label ||
            v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
    );

    setSavingStatus("saving");
    try {
      const res = await fetch("/api/checklists/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRecordId,
          itemId: item.id,
          sectionId: section.id,
          itemKey,
          payload: {
            remarks: text,
            valueBoolean: existingVal?.valueBoolean,
            valueText: existingVal?.valueText,
            valueNumber: existingVal?.valueNumber,
            valueJson: existingVal?.valueJson,
            sectionTitle: section.title,
            itemLabel: item.label,
          },
        }),
      });

      if (res.ok) {
        const updatedValues = (checklistData.values || []).map((v: any) => {
          if (
            (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
            (item.label &&
              (v.itemKey === item.label ||
                v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim()))
          ) {
            return { ...v, remarks: text };
          }
          return v;
        });

        setChecklistData((prev: any) => ({ ...prev, values: updatedValues }));
        setSavingStatus("saved");
        showToast("Note saved");
      }
    } catch (e) {
      setSavingStatus("error");
    }
  };

  // Handle Images Updated from Camera Modal
  const handleImagesUpdated = (itemKey: string, newImages: ChecklistItemImage[]) => {
    let found = false;
    const updatedValues = (checklistData?.values || []).map((v: any) => {
      if (
        (cameraModalItem?.item.id &&
          (v.itemId === cameraModalItem.item.id || v.itemKey === cameraModalItem.item.id)) ||
        (cameraModalItem?.item.label &&
          (v.itemKey === cameraModalItem.item.label ||
            v.itemKey?.toLowerCase().trim() ===
              cameraModalItem.item.label.toLowerCase().trim())) ||
        v.itemKey === itemKey
      ) {
        found = true;
        return {
          ...v,
          valueJson: {
            ...(v.valueJson || {}),
            images: newImages,
          },
        };
      }
      return v;
    });

    if (!found && cameraModalItem) {
      updatedValues.push({
        itemKey,
        itemId: cameraModalItem.item.id,
        sectionId: cameraModalItem.section.id,
        valueJson: { images: newImages },
      });
    }

    setChecklistData((prev: any) => ({
      ...prev,
      values: updatedValues,
    }));

    if (cameraModalItem) {
      setCameraModalItem({
        ...cameraModalItem,
        images: newImages,
      });
    }

    showToast(`Saved ${newImages.length} photo${newImages.length === 1 ? "" : "s"}`);
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
      showToast("Cash float updated");
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
          managerSignature: isSigning
            ? managerSignature || authContext?.user?.name || "Manager"
            : undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setChecklistData({ ...checklistData, dailyRecord: updated.record });
        setSavingStatus("saved");
        showToast(
          isSigning ? "Checklist signed & verified!" : "Verification details saved"
        );
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

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#09090b";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setManagerSignature(dataUrl);
    setIsSignPadOpen(false);
    showToast("Signature captured");
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 mb-3" />
        <span className="text-xs font-semibold text-zinc-500">Loading daily checklist...</span>
      </div>
    );
  }

  const structure = checklistData?.structure || { sections: [] };
  const dailyRecord = checklistData?.dailyRecord || {};
  const sections = structure.sections || [];
  const values = checklistData?.values || [];

  const completionPercent = Math.round(Number(dailyRecord.completionPercent || 0));
  const completedCount = Number(dailyRecord.completedItemsCount || 0);
  const totalRequired = Number(dailyRecord.totalRequiredItemsCount || 0);
  const isCompleted = dailyRecord.status === "completed";

  // Calculate purchase & expense totals
  const totalPurchase = purchaseRows.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );
  const totalExpense = expenseRows.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  // SEPARATE CHECKLIST SECTIONS (TOP) VS OPERATIONAL SUMMARY / EXPENSE / CASH / SIGN-OFF (BOTTOM)
  const isNonChecklistSection = (sec: any) =>
    sec.sectionType === "table_purchase_expense" ||
    sec.sectionType === "cash_summary" ||
    sec.sectionType === "manager_signoff" ||
    ["F", "G", "I"].includes(sec.sectionCode);

  const checklistSectionsList = sections.filter((s: any) => !isNonChecklistSection(s));
  const nonChecklistSectionsList = sections.filter((s: any) => isNonChecklistSection(s));

  // Filter sections by active category tab
  const displayedChecklistSections =
    activeCategoryTab === "all"
      ? checklistSectionsList
      : checklistSectionsList.filter((s: any) => s.id === activeCategoryTab || s.sectionCode === activeCategoryTab);

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
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
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
          className={`w-8 h-8 rounded-xl text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
            isSelected
              ? "bg-zinc-900 text-white shadow-xs font-bold"
              : isCurrentDay
              ? "bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold"
              : "hover:bg-zinc-100 text-zinc-600"
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
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER & CALENDAR PICKER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/app"
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 shadow-xs transition group flex items-center justify-center shrink-0"
              title="Back to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {structure.title || "Daily Operational Checklist"}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-semibold border border-zinc-200">
              v{dailyRecord.versionNumber || "1"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Standard operating procedures, temperature logs, and cash verification.
          </p>
        </div>

        {/* Action Controls & Calendar */}
        <div className="flex items-center gap-2 relative">
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 text-xs font-medium shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-zinc-500" />
              <span>{isToday ? `Today (${dateFormatted})` : dateFormatted}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            {/* Calendar Popover */}
            {isCalendarOpen && (
              <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl p-4 shadow-xl border border-zinc-200 w-72 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(calendarMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarMonth(prev);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-zinc-900">
                    {calendarMonth.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(calendarMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarMonth(next);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-zinc-400">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                <div className="grid grid-cols-7 gap-1 place-items-center">
                  {renderCalendarDays()}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setCalendarMonth(new Date());
                      setIsCalendarOpen(false);
                    }}
                    className="text-[11px] font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer"
                  >
                    Jump to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {authContext?.user?.role !== "staff" && (
            <Link
              href="/app/checklists/builder"
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Customize Checklist Template"
            >
              <Sliders className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">Customize</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              fetchAuditLogs();
              setIsAuditDrawerOpen(true);
            }}
            className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="View Audit Log & Changes"
          >
            <History className="w-4 h-4 text-zinc-500" />
            <span className="hidden sm:inline">Audit Log</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRESS STRIP & STATS */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-800"
            }`}>
              {isCompleted ? <CheckCheck className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">
                  {completedCount} of {totalRequired} tasks completed
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : completedCount > 0
                    ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                    : "bg-zinc-100 text-zinc-500"
                }`}>
                  {isCompleted ? "Fully Completed" : completedCount > 0 ? "In Progress" : "Not Started"}
                </span>
              </div>
              <span className="text-xs text-zinc-500 block mt-0.5">
                {dailyRecord.verifiedByName
                  ? `Verified by ${dailyRecord.verifiedByName}`
                  : "Pending manager sign-off"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-900">{completionPercent}%</span>
              <span className="text-[10px] text-zinc-400 block">Progress</span>
            </div>
            <div className="w-28 sm:w-36 h-2 rounded-full bg-zinc-100 overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isCompleted ? "bg-emerald-500" : "bg-zinc-900"
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY PILL FILTER */}
      {checklistSectionsList.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategoryTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategoryTab === "all"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            All Categories ({checklistSectionsList.length})
          </button>
          {checklistSectionsList.map((sec: any) => {
            const secItems = sec.items || [];
            const doneInSec = secItems.filter((it: any) => {
              const v = values.find(
                (val: any) =>
                  (it.id && (val.itemId === it.id || val.itemKey === it.id)) ||
                  (it.label &&
                    (val.itemKey === it.label ||
                      val.itemKey?.toLowerCase().trim() === it.label.toLowerCase().trim()))
              );
              return v?.valueBoolean === true || (v?.valueText && v.valueText.trim() !== "");
            }).length;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveCategoryTab(sec.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  activeCategoryTab === sec.id
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span>{sec.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeCategoryTab === sec.id
                    ? "bg-zinc-800 text-zinc-300"
                    : "bg-zinc-100 text-zinc-500"
                }`}>
                  {doneInSec}/{secItems.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. MAIN CHECKLIST SECTIONS */}
      <div className="space-y-6">
        {displayedChecklistSections.map((section: any, sIdx: number) => {
          const items = section.items || [];
          return (
            <div
              key={section.id || sIdx}
              className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{section.title}</h3>
                  {section.description && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">{section.description}</p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {items.length} task{items.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100">
                {items.map((item: any) => {
                  const itemKey = item.id || item.label;
                  const val = values.find(
                    (v: any) =>
                      (item.id && (v.itemId === item.id || v.itemKey === item.id)) ||
                      (item.label &&
                        (v.itemKey === item.label ||
                          v.itemKey?.toLowerCase().trim() === item.label.toLowerCase().trim())) ||
                      v.itemKey === itemKey
                  );

                  const isChecked = val?.valueBoolean === true;
                  const itemImages: ChecklistItemImage[] = val?.valueJson?.images || [];
                  const remarksText = val?.remarks || "";
                  const isRemarksExpanded = expandedRemarks[itemKey] || Boolean(remarksText);

                  return (
                    <div
                      key={item.id || item.label}
                      className={`p-4 transition-colors ${
                        isChecked ? "bg-emerald-50/20" : "hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox & Title */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item, section)}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition shrink-0 mt-0.5 cursor-pointer ${
                              isChecked
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "border border-zinc-300 hover:border-zinc-400 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => handleToggleItem(item, section)}
                                className={`text-xs font-semibold cursor-pointer select-none ${
                                  isChecked ? "text-zinc-900" : "text-zinc-800"
                                }`}
                              >
                                {item.label}
                              </span>
                              {(item.isRequired || item.is_required) && (
                                <span className="text-[10px] text-zinc-400 font-medium">*</span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-zinc-500 mt-0.5">{item.description}</p>
                            )}

                            {/* Attached Camera Photos Thumbnails */}
                            {itemImages.length > 0 && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {itemImages.map((img, i) => (
                                  <div
                                    key={i}
                                    onClick={() =>
                                      setCameraModalItem({
                                        item,
                                        section,
                                        itemKey,
                                        itemLabel: item.label,
                                        sectionTitle: section.title,
                                        images: itemImages,
                                      })
                                    }
                                    className="relative w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer group shadow-xs shrink-0"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={img.url}
                                      alt="Photo proof"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <ZoomIn className="w-3 h-3" />
                                    </div>
                                  </div>
                                ))}
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {itemImages.length} photo proof attached
                                </span>
                              </div>
                            )}

                            {/* Inline Value Input for Temperature / Text fields */}
                            {(item.fieldType === "number" ||
                              item.field_type === "number" ||
                              item.fieldType === "temperature") && (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Enter reading / °C"
                                  defaultValue={val?.valueNumber ?? ""}
                                  onBlur={(e) =>
                                    handleChangeValue(item, section, {
                                      number: e.target.value ? parseFloat(e.target.value) : undefined,
                                    })
                                  }
                                  className="w-32 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400"
                                />
                                <span className="text-[11px] text-zinc-400">°C</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Camera Proof & Remarks */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setCameraModalItem({
                                item,
                                section,
                                itemKey,
                                itemLabel: item.label,
                                sectionTitle: section.title,
                                images: itemImages,
                              })
                            }
                            className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                              itemImages.length > 0
                                ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                            }`}
                            title="Capture photo proof"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {itemImages.length > 0 && (
                              <span className="text-[10px] font-bold">{itemImages.length}</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRemarks((prev) => ({
                                ...prev,
                                [itemKey]: !prev[itemKey],
                              }))
                            }
                            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                              remarksText
                                ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                            }`}
                            title="Add note / remarks"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Remarks Drawer */}
                      {isRemarksExpanded && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-100">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add a note or issue report..."
                              defaultValue={remarksText}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveRemarks(item, section, e.currentTarget.value);
                                }
                              }}
                              onBlur={(e) => handleSaveRemarks(item, section, e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-zinc-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. PURCHASES & EXPENSES REPEATABLE TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cash Purchases Table */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-bold text-zinc-900">Direct Purchases</h3>
            </div>
            <span className="text-xs font-bold text-zinc-900">{formatCurrency(totalPurchase)}</span>
          </div>

          <div className="p-4 space-y-3">
            {purchaseRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={row.item || ""}
                  onChange={(e) => {
                    const next = [...purchaseRows];
                    next[idx].item = e.target.value;
                    setPurchaseRows(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-white"
                />
                <input
                  type="text"
                  placeholder="Qty"
                  value={row.qty || ""}
                  onChange={(e) => {
                    const next = [...purchaseRows];
                    next[idx].qty = e.target.value;
                    setPurchaseRows(next);
                  }}
                  className="w-16 px-2 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-white"
                />
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={row.amount || ""}
                  onChange={(e) => {
                    const next = [...purchaseRows];
                    next[idx].amount = e.target.value;
                    setPurchaseRows(next);
                  }}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 font-semibold bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseRows(purchaseRows.filter((_, i) => i !== idx));
                  }}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() =>
                  setPurchaseRows([
                    ...purchaseRows,
                    { item: "", qty: "", vendor: "", amount: "", paymentMode: "Cash" },
                  ])
                }
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Purchase Row</span>
              </button>

              <button
                type="button"
                onClick={handleSavePurchases}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
              >
                Save Purchases
              </button>
            </div>
          </div>
        </div>

        {/* Daily Cash Expenses Table */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-bold text-zinc-900">Shift Expenses</h3>
            </div>
            <span className="text-xs font-bold text-zinc-900">{formatCurrency(totalExpense)}</span>
          </div>

          <div className="p-4 space-y-3">
            {expenseRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Expense description"
                  value={row.expense || ""}
                  onChange={(e) => {
                    const next = [...expenseRows];
                    next[idx].expense = e.target.value;
                    setExpenseRows(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-white"
                />
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={row.amount || ""}
                  onChange={(e) => {
                    const next = [...expenseRows];
                    next[idx].amount = e.target.value;
                    setExpenseRows(next);
                  }}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 font-semibold bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setExpenseRows(expenseRows.filter((_, i) => i !== idx));
                  }}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() =>
                  setExpenseRows([...expenseRows, { expense: "", amount: "", remarks: "" }])
                }
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense Row</span>
              </button>

              <button
                type="button"
                onClick={handleSaveExpenses}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
              >
                Save Expenses
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. CASH FLOAT & SHIFT VERIFICATION DRAWER */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900">Cash Float & Shift Sign-Off</h3>
          </div>
          {dailyRecord.verifiedByName && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Signed by {dailyRecord.verifiedByName}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Float Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Opening Cash Drawer (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={openingCashDrawer}
                  onChange={(e) => setOpeningCashDrawer(e.target.value)}
                  onBlur={handleSaveCashValues}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Small Change Available (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={smallChange}
                  onChange={(e) => setSmallChange(e.target.value)}
                  onBlur={handleSaveCashValues}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Verification Names & Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Duty Manager Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={openingManagerName}
                onChange={(e) => setOpeningManagerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Cashier / Line Lead Name
              </label>
              <input
                type="text"
                placeholder="e.g. Priya K."
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Pending Issues */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
              Shift Handover Notes & Pending Items
            </label>
            <textarea
              rows={2}
              placeholder="Any maintenance issues, stock shortages, or notes for next shift..."
              value={pendingIssues}
              onChange={(e) => setPendingIssues(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Digital Signature */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-zinc-900 block">Digital Manager Signature</span>
              <span className="text-[11px] text-zinc-400">
                {managerSignature ? "Signature captured & verified" : "Sign on screen to finalize today's audit"}
              </span>

              {managerSignature && (
                <div className="mt-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={managerSignature} alt="Manager signature" className="h-10 object-contain" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSignPadOpen(true)}
                className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5 text-zinc-500" />
                <span>{managerSignature ? "Redraw Signature" : "Sign with Finger/Mouse"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleManagerVerification(true)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify & Sign Shift</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNATURE MODAL */}
      {isSignPadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Sign Checklist Handover</h3>
                <p className="text-[11px] text-zinc-500">Use your finger or mouse to draw signature below</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignPadOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-zinc-200 rounded-2xl bg-zinc-50 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={360}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignPadOpen(false)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCanvasSignature}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA PROOF MODAL */}
      {cameraModalItem && (
        <ChecklistCameraModal
          isOpen={true}
          onClose={() => setCameraModalItem(null)}
          dailyRecordId={dailyRecord.id}
          itemKey={cameraModalItem.itemKey}
          itemId={cameraModalItem.item.id}
          sectionId={cameraModalItem.section.id}
          itemLabel={cameraModalItem.itemLabel}
          sectionTitle={cameraModalItem.sectionTitle}
          initialImages={cameraModalItem.images}
          onImagesUpdated={(imgs) => handleImagesUpdated(cameraModalItem.itemKey, imgs)}
        />
      )}

      {/* AUDIT TRAIL SLIDE-OVER */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Checklist Audit Trail</h3>
                <p className="text-xs text-zinc-500">Live timestamped logs for {dateFormatted}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No modifications recorded for this date yet.
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{log.userName || "Staff"}</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-600 block">{log.action || log.description}</span>
                    {log.itemKey && (
                      <span className="text-[10px] text-zinc-400 font-mono block">Item: {log.itemKey}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
