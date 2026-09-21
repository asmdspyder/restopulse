"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Layers,
  ArrowLeft,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Sliders,
  HelpCircle,
  Copy,
  Clock,
  FileText,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function ChecklistBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authContext, setAuthContext] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Current editing template structure
  const [title, setTitle] = useState("Daily Opening Checklist");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetTime, setTargetTime] = useState("10:00 AM");
  const [sections, setSections] = useState<any[]>([]);

  // UI state
  const [collapsedSections, setCollapsedSections] = useState<{ [secIdx: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Focus helper for newly added items
  const lastAddedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [authRes, templRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/checklists/templates"),
      ]);

      const authData = await authRes.json();
      setAuthContext(authData);

      if (templRes.ok) {
        const data = await templRes.json();
        const tList = data.templates || [];
        setTemplates(tList);

        if (tList.length > 0) {
          const firstId = tList[0].id;
          setSelectedTemplateId(firstId);
          await loadTemplateStructure(firstId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateStructure = async (templateId: string) => {
    try {
      const res = await fetch(`/api/checklists/templates/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        const t = data.template;
        setTitle(t.title || "Daily Opening Checklist");
        setDescription(t.description || "");
        setFrequency(t.frequency || "daily");
        setTargetTime(t.targetTime || "10:00 AM");

        const loadedSections = (t.sections || []).filter(
          (s: any) => s.sectionType === "checklist" || !s.sectionType || (s.items && s.items.length > 0)
        );
        setSections(loadedSections);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Section Management
  const handleAddSection = () => {
    const nextCode = String.fromCharCode(65 + sections.length);
    const newSecNumber = sections.length + 1;
    const newSec = {
      sectionCode: nextCode,
      title: `New Category ${newSecNumber}`,
      description: "",
      sectionType: "checklist",
      displayOrder: newSecNumber,
      items: [
        {
          label: "First check task",
          fieldType: "checkbox",
          isRequired: true,
          allowsRemarks: true,
          remarksRequired: false,
          displayOrder: 1,
        },
      ],
    };

    const updated = [...sections, newSec];
    setSections(updated);
    showToast(`Added new category "${newSec.title}"`);

    // Ensure it is expanded
    setCollapsedSections((prev) => ({ ...prev, [updated.length - 1]: false }));

    // Scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleDeleteSection = (secIdx: number) => {
    if (sections.length <= 1) {
      setErrorMessage("At least one category is required in the SOP template.");
      return;
    }
    const secTitle = sections[secIdx]?.title || "Category";

    setConfirmDialog({
      isOpen: true,
      title: `Delete "${secTitle}"?`,
      message: `This will remove the category and all ${(sections[secIdx]?.items || []).length} check items inside it.`,
      onConfirm: () => {
        const updated = sections.filter((_, i) => i !== secIdx);
        setSections(updated);
        showToast(`Deleted category "${secTitle}"`);
        setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleMoveSection = (secIdx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const copy = [...sections];
    const temp = copy[secIdx];
    copy[secIdx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSections(copy);
  };

  const toggleCollapseSection = (secIdx: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secIdx]: !prev[secIdx],
    }));
  };

  const toggleAllSections = (collapse: boolean) => {
    const map: { [secIdx: number]: boolean } = {};
    sections.forEach((_, i) => {
      map[i] = collapse;
    });
    setCollapsedSections(map);
  };

  // Item Management inside a Section
  const handleAddItem = (secIdx: number) => {
    const copy = [...sections];
    const sec = copy[secIdx];
    if (!sec) return;
    sec.items = sec.items || [];
    const newItemIdx = sec.items.length;
    sec.items.push({
      label: "",
      fieldType: "checkbox",
      isRequired: true,
      allowsRemarks: true,
      remarksRequired: false,
      displayOrder: newItemIdx + 1,
    });
    setSections(copy);

    // Expand section if collapsed
    setCollapsedSections((prev) => ({ ...prev, [secIdx]: false }));

    setTimeout(() => {
      if (lastAddedInputRef.current) {
        lastAddedInputRef.current.focus();
      }
    }, 50);
  };

  const handleDeleteItem = (secIdx: number, itemIdx: number) => {
    const copy = [...sections];
    const sec = copy[secIdx];
    if (!sec) return;
    sec.items = sec.items.filter((_: any, i: number) => i !== itemIdx);
    setSections(copy);
  };

  const handleMoveItem = (secIdx: number, itemIdx: number, direction: "up" | "down") => {
    const copy = [...sections];
    const sec = copy[secIdx];
    if (!sec || !sec.items) return;
    const targetIdx = direction === "up" ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= sec.items.length) return;

    const temp = sec.items[itemIdx];
    sec.items[itemIdx] = sec.items[targetIdx];
    sec.items[targetIdx] = temp;
    setSections(copy);
  };

  const handleDuplicateItem = (secIdx: number, itemIdx: number) => {
    const copy = [...sections];
    const sec = copy[secIdx];
    if (!sec || !sec.items) return;
    const original = sec.items[itemIdx];
    const duplicated = {
      ...original,
      id: undefined, // New ID will be generated
      label: `${original.label} (Copy)`,
      displayOrder: sec.items.length + 1,
    };
    sec.items.splice(itemIdx + 1, 0, duplicated);
    setSections(copy);
    showToast(`Duplicated task`);
  };

  // Save Template with Full Screen Modal Spinner
  const handleSaveTemplate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    if (!title.trim()) {
      setErrorMessage("Please enter a template title");
      return;
    }

    if (sections.length === 0) {
      setErrorMessage("Please create at least one category/section");
      return;
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const s = sections[sIdx];
      if (!s.title.trim()) {
        setErrorMessage(`Category ${sIdx + 1} is missing a title`);
        return;
      }
      if (!s.items || s.items.length === 0) {
        setErrorMessage(`Category "${s.title}" has no check items. Please add at least 1 item or delete the category.`);
        return;
      }
      for (let itIdx = 0; itIdx < s.items.length; itIdx++) {
        const it = s.items[itIdx];
        if (!it.label.trim()) {
          setErrorMessage(`Category "${s.title}", Task #${itIdx + 1} cannot have an empty name.`);
          return;
        }
      }
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/checklists/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplateId || undefined,
          title: title.trim(),
          description: description.trim(),
          frequency,
          targetTime,
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save template");
        return;
      }

      showToast(`Template saved successfully as Version ${data.version || 1}!`);
      await fetchTemplates();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-3 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        </div>
        <span className="text-xs font-bold text-slate-700">Loading SOP Template Customizer...</span>
      </div>
    );
  }

  const canManage = authContext?.user?.role === "admin" || authContext?.user?.canManageChecklists === true;

  if (!canManage) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-[#bed6c2] text-center max-w-md mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">SOP Customizer Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Template customization is restricted to Restaurant Admins and authorized managers.
        </p>
        <Link
          href="/app/checklists"
          className="mt-6 inline-flex px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
        >
          Back to Today's Checklist
        </Link>
      </div>
    );
  }

  const totalItemsCount = sections.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* 1. CENTERED FULL-SCREEN SAVING OVERLAY MODAL */}
      {saving && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Saving SOP Template</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Updating version & synchronizing checklist items with your workspace...
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-2/3 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: () => {} })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP HEADER & ACTION BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#bed6c2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/checklists"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition group flex items-center justify-center shrink-0"
            title="Back to Daily Checklist"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                SOP Template Customizer
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                {sections.length} Categories • {totalItemsCount} Tasks
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Easily add, rename, and organize categories and check tasks for your staff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleAddSection}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-800 hover:text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>+ Add Category</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveTemplate()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="cursor-pointer text-rose-400 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. CONTROLS BAR: SEARCH & COLLAPSE ALL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#bed6c2] text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => toggleAllSections(false)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            onClick={() => toggleAllSections(true)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* 4. VISUAL SECTION CARDS LIST */}
      <div className="space-y-4">
        {sections.map((section: any, secIdx: number) => {
          const isCollapsed = collapsedSections[secIdx];
          const items = section.items || [];
          const matchesSearch =
            !searchQuery.trim() ||
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            items.some((it: any) => it.label.toLowerCase().includes(searchQuery.toLowerCase()));

          if (!matchesSearch) return null;

          return (
            <div
              key={secIdx}
              className="bg-white rounded-3xl border border-[#bed6c2] shadow-xs overflow-hidden transition-all duration-200 hover:border-emerald-300"
            >
              {/* Category Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {section.sectionCode || String.fromCharCode(65 + secIdx)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      required
                      value={section.title || ""}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[secIdx].title = e.target.value;
                        setSections(copy);
                      }}
                      placeholder="Category Title (e.g. Kitchen Station, Dining Area)"
                      className="w-full p-2 px-3 rounded-xl border border-transparent hover:border-slate-300 focus:border-emerald-600 bg-transparent focus:bg-white font-extrabold text-sm sm:text-base text-slate-900 transition focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Header Action Controls - Clear, prominent buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
                    {items.length} {items.length === 1 ? "task" : "tasks"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAddItem(secIdx)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Add task to this category"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleMoveSection(secIdx, "up")}
                      disabled={secIdx === 0}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 cursor-pointer transition"
                      title="Move Category Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSection(secIdx, "down")}
                      disabled={secIdx === sections.length - 1}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 cursor-pointer transition"
                      title="Move Category Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(secIdx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollapseSection(secIdx)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition"
                      title={isCollapsed ? "Expand Category" : "Collapse Category"}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List inside Section */}
              {!isCollapsed && (
                <div className="p-3 sm:p-4 space-y-2.5 bg-white">
                  {items.length === 0 ? (
                    <div className="py-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-2">
                      <p>No check tasks in this category yet.</p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(secIdx)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        + Add First Task
                      </button>
                    </div>
                  ) : (
                    items.map((item: any, itIdx: number) => {
                      const isLast = itIdx === items.length - 1;

                      return (
                        <div
                          key={itIdx}
                          className="group p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/70 hover:border-emerald-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          {/* Task Checkbox & Name */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 bg-white">
                              {itIdx + 1}
                            </span>

                            <input
                              type="text"
                              ref={isLast ? lastAddedInputRef : undefined}
                              required
                              value={item.label || ""}
                              onChange={(e) => {
                                const copy = [...sections];
                                copy[secIdx].items[itIdx].label = e.target.value;
                                setSections(copy);
                              }}
                              placeholder="Type check task (e.g. Clean oil filters, Check refrigeration)"
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                            />
                          </div>

                          {/* Task Options (Required, Remarks, Move, Delete) */}
                          <div className="flex items-center gap-2 self-end sm:self-auto text-xs shrink-0">
                            {/* Required Toggle */}
                            <label
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer select-none transition ${
                                item.isRequired
                                  ? "bg-amber-50 border-amber-300 text-amber-900"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={item.isRequired ?? false}
                                onChange={(e) => {
                                  const copy = [...sections];
                                  copy[secIdx].items[itIdx].isRequired = e.target.checked;
                                  setSections(copy);
                                }}
                                className="sr-only"
                              />
                              <span>{item.isRequired ? "★ Required" : "Optional"}</span>
                            </label>

                            {/* Remarks/Notes Toggle */}
                            <label
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer select-none transition ${
                                item.allowsRemarks ?? true
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={item.allowsRemarks ?? true}
                                onChange={(e) => {
                                  const copy = [...sections];
                                  copy[secIdx].items[itIdx].allowsRemarks = e.target.checked;
                                  setSections(copy);
                                }}
                                className="sr-only"
                              />
                              <span>💬 Remarks</span>
                            </label>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(secIdx, itIdx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Duplicate Task"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(secIdx, itIdx, "up")}
                                disabled={itIdx === 0}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Task Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(secIdx, itIdx, "down")}
                                disabled={itIdx === items.length - 1}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Task Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(secIdx, itIdx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Inline Add Task at Bottom of Section */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem(secIdx)}
                      className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>+ Add Task to {section.title || "Category"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. BOTTOM BIG ADD CATEGORY BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAddSection}
          className="w-full py-4 rounded-3xl bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-600 hover:bg-emerald-50/60 text-emerald-900 font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-5 h-5 text-emerald-700" />
          <span>+ Add Another Category / Station</span>
        </button>
      </div>

      {/* 7. STICKY BOTTOM SAVE FLOATING DOCK */}
      <div className="fixed bottom-4 inset-x-0 z-30 pointer-events-none flex justify-center px-4">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white p-3 px-6 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-6 max-w-xl w-full animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {sections.length} Categories • {totalItemsCount} Tasks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/checklists"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => handleSaveTemplate()}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
