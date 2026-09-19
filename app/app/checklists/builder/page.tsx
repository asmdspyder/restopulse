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
} from "lucide-react";

export default function ChecklistBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authContext, setAuthContext] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Current editing template structure
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetTime, setTargetTime] = useState("10:00 AM");
  const [sections, setSections] = useState<any[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Highlighting & animation state
  const [highlightedSecIdx, setHighlightedSecIdx] = useState<number | null>(null);
  const [highlightedItemIdx, setHighlightedItemIdx] = useState<number | null>(null);

  // Custom modal / alerts state (Zero window.alert)
  const [toastMsg, setToastMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

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
        setTitle(t.title || "");
        setDescription(t.description || "");
        setFrequency(t.frequency || "daily");
        setTargetTime(t.targetTime || "10:00 AM");

        // Keep checklist task sections
        const loadedSections = (t.sections || []).filter(
          (s: any) => s.sectionType === "checklist" || !s.sectionType || s.items?.length > 0
        );
        setSections(loadedSections);
        if (loadedSections.length > 0) {
          setActiveSectionIndex(0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Section Management with Smooth Scroll & Pulse Animation
  const handleAddSection = () => {
    const nextCode = String.fromCharCode(65 + sections.length);
    const newSecNumber = sections.length + 1;
    const newSec = {
      sectionCode: nextCode,
      title: `New Section ${newSecNumber}`,
      description: "Standard checklist tasks",
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

    const updatedSections = [...sections, newSec];
    const newIndex = updatedSections.length - 1;
    setSections(updatedSections);
    setActiveSectionIndex(newIndex);
    setHighlightedSecIdx(newIndex);
    showToast(`Added Section ${nextCode}`);

    // Auto-scroll to bottom of sections panel
    setTimeout(() => {
      if (sectionsContainerRef.current) {
        sectionsContainerRef.current.scrollTo({
          top: sectionsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);

    // Remove highlight pulse after 1.8s
    setTimeout(() => {
      setHighlightedSecIdx(null);
    }, 1800);
  };

  const handleDeleteSection = (secIdx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sections.length <= 1) {
      setErrorMessage("At least one section is required in the SOP template.");
      return;
    }
    const secTitle = sections[secIdx]?.title || "Section";

    setConfirmDialog({
      isOpen: true,
      title: "Delete Section",
      message: `Are you sure you want to delete "${secTitle}" and its checklist items?`,
      onConfirm: () => {
        const updated = sections.filter((_, i) => i !== secIdx);
        setSections(updated);

        if (activeSectionIndex >= updated.length) {
          setActiveSectionIndex(Math.max(0, updated.length - 1));
        } else if (activeSectionIndex === secIdx) {
          setActiveSectionIndex(Math.max(0, secIdx - 1));
        }
        showToast(`Deleted section "${secTitle}"`);
        setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleMoveSection = (secIdx: number, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetIdx = direction === "up" ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const copy = [...sections];
    const temp = copy[secIdx];
    copy[secIdx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSections(copy);
    setActiveSectionIndex(targetIdx);
  };

  // Item Management inside Active Section with Smooth Scroll & Pulse Animation
  const handleAddItem = (secIdx: number) => {
    const copy = [...sections];
    const sec = copy[secIdx];
    if (!sec) return;
    sec.items = sec.items || [];
    const newItemIdx = sec.items.length;
    sec.items.push({
      label: `Check item ${newItemIdx + 1}`,
      fieldType: "checkbox",
      isRequired: true,
      allowsRemarks: true,
      remarksRequired: false,
      displayOrder: newItemIdx + 1,
    });
    setSections(copy);
    setHighlightedItemIdx(newItemIdx);

    // Auto-scroll to bottom of items panel
    setTimeout(() => {
      if (itemsContainerRef.current) {
        itemsContainerRef.current.scrollTo({
          top: itemsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);

    // Remove highlight pulse after 1.8s
    setTimeout(() => {
      setHighlightedItemIdx(null);
    }, 1800);
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

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/checklists/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplateId || undefined,
          title: title.trim() || "Opening Checklist",
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
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Loading SOP Template Builder...</span>
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
        <h3 className="font-bold text-slate-900 text-base">SOP Builder Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Template customization is restricted to Restaurant Admins and authorized SOP managers.
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

  const activeSection = sections[activeSectionIndex] || sections[0];

  return (
    <form onSubmit={handleSaveTemplate} className="h-[calc(100vh-100px)] flex flex-col space-y-3 max-w-7xl mx-auto pb-4">
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER & SAVE BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#bed6c2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-xs transition group"
            title="Return to Operations Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Operations Hub</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                SOP Template Customizer
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                {sections.length} Sections
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Template Title"
              className="p-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white w-40 sm:w-48"
            />
            <input
              type="text"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder="10:00 AM"
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white w-24"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer transition shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Version</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. FIXED MASTER-DETAIL WORKSPACE */}
      <div className="flex-1 grid lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: SCROLLABLE SECTIONS LIST */}
        <div className="lg:col-span-4 h-full flex flex-col bg-white rounded-3xl border border-[#bed6c2] p-3 sm:p-4 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Checklist Sections</h2>
              <span className="text-[10px] text-slate-400">Select section to edit tasks</span>
            </div>
            <button
              type="button"
              onClick={handleAddSection}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Scrollable Section Items List */}
          <div ref={sectionsContainerRef} className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1">
            {sections.map((sec, idx) => {
              const isSelected = idx === activeSectionIndex;
              const isHighlighted = idx === highlightedSecIdx;
              const itemCount = (sec.items || []).length;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveSectionIndex(idx)}
                  className={`p-2.5 rounded-2xl border transition duration-300 flex items-center justify-between gap-2 cursor-pointer ${
                    isHighlighted
                      ? "bg-amber-100 border-amber-500 ring-2 ring-emerald-500 scale-[1.02] shadow-md"
                      : isSelected
                      ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs"
                      : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-5 h-5 rounded-lg text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {sec.sectionCode || String.fromCharCode(65 + idx)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs block truncate">
                        {sec.title || `Section ${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {itemCount} check items
                      </span>
                    </div>
                  </div>

                  {/* Section Controls */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleMoveSection(idx, "up", e)}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveSection(idx, "down", e)}
                      disabled={idx === sections.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSection(idx, e)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 ml-0.5"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 text-slate-600 hover:text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Section</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SCROLLABLE ITEMS WORKSPACE */}
        <div className="lg:col-span-8 h-full flex flex-col bg-white rounded-3xl border border-[#bed6c2] p-4 sm:p-5 shadow-xs overflow-hidden">
          {activeSection ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Active Section Header Settings */}
              <div className="pb-3 border-b border-slate-100 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center">
                      {activeSection.sectionCode || String.fromCharCode(65 + activeSectionIndex)}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Section {activeSectionIndex + 1} Configuration
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Section Title</label>
                    <input
                      type="text"
                      required
                      value={activeSection.title || ""}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[activeSectionIndex].title = e.target.value;
                        setSections(copy);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Code</label>
                    <input
                      type="text"
                      value={activeSection.sectionCode || ""}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[activeSectionIndex].sectionCode = e.target.value;
                        setSections(copy);
                      }}
                      placeholder="e.g. A"
                      className="w-full p-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={activeSection.description || ""}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[activeSectionIndex].description = e.target.value;
                        setSections(copy);
                      }}
                      placeholder="Optional station guidance note..."
                      className="w-full p-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Items Action Subheader */}
              <div className="flex items-center justify-between pt-2 pb-1 shrink-0">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Check Items List</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {(activeSection.items || []).length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleAddItem(activeSectionIndex)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Scrollable Items Container */}
              <div ref={itemsContainerRef} className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                {(!activeSection.items || activeSection.items.length === 0) && (
                  <div className="py-12 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-2">
                    <CheckSquare className="w-6 h-6 text-slate-300 mx-auto" />
                    <p>No check items in this section yet.</p>
                    <button
                      type="button"
                      onClick={() => handleAddItem(activeSectionIndex)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs"
                    >
                      + Add First Check Item
                    </button>
                  </div>
                )}

                {(activeSection.items || []).map((item: any, itIdx: number) => {
                  const isItemHighlighted = itIdx === highlightedItemIdx;

                  return (
                    <div
                      key={itIdx}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isItemHighlighted
                          ? "bg-amber-100 border-amber-500 ring-2 ring-emerald-500 scale-[1.01] shadow-sm"
                          : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">
                          {itIdx + 1}.
                        </span>
                        <input
                          type="text"
                          required
                          value={item.label || ""}
                          onChange={(e) => {
                            const copy = [...sections];
                            copy[activeSectionIndex].items[itIdx].label = e.target.value;
                            setSections(copy);
                          }}
                          placeholder="e.g. Check refrigerator temperature (1°C - 4°C)"
                          className="flex-1 p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs shrink-0">
                        {/* Required Toggle */}
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-600 text-[11px] font-medium">
                          <input
                            type="checkbox"
                            checked={item.isRequired ?? false}
                            onChange={(e) => {
                              const copy = [...sections];
                              copy[activeSectionIndex].items[itIdx].isRequired = e.target.checked;
                              setSections(copy);
                            }}
                            className="w-3.5 h-3.5 rounded text-emerald-700"
                          />
                          <span>Required</span>
                        </label>

                        {/* Remarks Toggle */}
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-600 text-[11px] font-medium">
                          <input
                            type="checkbox"
                            checked={item.allowsRemarks ?? true}
                            onChange={(e) => {
                              const copy = [...sections];
                              copy[activeSectionIndex].items[itIdx].allowsRemarks = e.target.checked;
                              setSections(copy);
                            }}
                            className="w-3.5 h-3.5 rounded text-emerald-700"
                          />
                          <span>Remarks</span>
                        </label>

                        {/* Reorder & Delete */}
                        <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(activeSectionIndex, itIdx, "up")}
                            disabled={itIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(activeSectionIndex, itIdx, "down")}
                            disabled={itIdx === (activeSection.items?.length || 0) - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(activeSectionIndex, itIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Add Item Trigger */}
              <div className="pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddItem(activeSectionIndex)}
                  className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 text-slate-600 hover:text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item to {activeSection.title || "Section"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
              <Layers className="w-8 h-8 text-slate-300 mb-2" />
              <p>No section selected. Click a section on the left or add a new one.</p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
