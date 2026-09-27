"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  History,
  ArrowLeft,
  UtensilsCrossed,
  Camera,
  RotateCcw,
  Trash2,
  ZoomIn,
  X,
  Clock,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { WastageCameraModal } from "@/components/app/wastage-camera-modal";

const STANDARD_UNITS = ["kg", "g", "L", "ml", "pcs", "portion", "pack", "bottle", "tray"];

export default function RecordWastagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [searchItem, setSearchItem] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("kg");
  const [unitCost, setUnitCost] = useState<string>("");
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  // Optional "More details"
  const [showDetails, setShowDetails] = useState(false);
  const [shift, setShift] = useState<string>("");
  const [responsibleArea, setResponsibleArea] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Camera Photo State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [reuploadTarget, setReuploadTarget] = useState<{ id: string; itemName: string } | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    blob: Blob;
    previewUrl: string;
    sizeBytes: number;
  } | null>(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, reasonsRes, historyRes] = await Promise.all([
        fetch("/api/items?activeOnly=true"),
        fetch("/api/reasons"),
        fetch("/api/wastage?limit=6"),
      ]);

      const itemsData = await itemsRes.json();
      const reasonsData = await reasonsRes.json();
      const historyData = await historyRes.json();

      setItems(itemsData.items || []);
      setReasons((reasonsData.reasons || []).filter((r: any) => r.isActive));
      setRecentRecords(historyData.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setUnit(item.defaultUnit || "kg");
    setUnitCost(item.costPerUnit || "0");
    if (item.defaultResponsibleArea) {
      setResponsibleArea(item.defaultResponsibleArea);
    }
    setSearchItem("");
  };

  const handleCreateNewItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const existing = items.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleSelectItem(existing);
      return;
    }

    setSelectedItem({
      id: "new",
      name: trimmed,
      isNew: true,
      defaultUnit: "kg",
      costPerUnit: "",
    });
    setUnit("kg");
    setUnitCost("");
    setSearchItem("");
  };

  const numQty = parseFloat(quantity) || 0;
  const activeRate = parseFloat(unitCost) || (selectedItem?.costPerUnit ? parseFloat(selectedItem.costPerUnit) : 0);
  const computedValue = numQty * activeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (!selectedItem) {
      setError("Please select or enter an item");
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }
    if (!unitCost || isNaN(Number(unitCost)) || Number(unitCost) < 0) {
      setError("Please enter a valid unit rate (₹)");
      return;
    }
    if (!selectedReasonId) {
      setError("Please select a wastage reason");
      return;
    }

    setSaving(true);
    try {
      // 1. Upload captured photo to Cloudflare R2 if available
      let imageUrl: string | undefined = undefined;
      if (capturedPhoto?.blob) {
        const formData = new FormData();
        formData.append("file", capturedPhoto.blob, `wastage_${Date.now()}.webp`);
        formData.append("itemName", selectedItem.name);
        const uploadRes = await fetch("/api/wastage/images", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      const payload: any = {
        reasonId: selectedReasonId,
        quantity: numQty,
        unit,
        ratePerUnit: activeRate,
        updateItemCost: updateCatalogPrice,
        shift: shift || undefined,
        responsibleArea: responsibleArea || undefined,
        notes: notes || undefined,
        imageUrl,
      };

      if (selectedItem.isNew) {
        payload.newItemName = selectedItem.name;
      } else {
        payload.itemId = selectedItem.id;
      }

      const res = await fetch("/api/wastage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record wastage");
      }

      setSuccessBanner(
        `${selectedItem.name} (${numQty} ${unit} • ${formatCurrency(computedValue)}) saved!`
      );

      // Reset form fields
      setSelectedItem(null);
      setQuantity("1");
      setUnitCost("");
      setSelectedReasonId("");
      setShowDetails(false);
      setNotes("");
      setCapturedPhoto(null);

      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const cleanSearch = searchItem.trim();
  const exactMatchExists = items.some(
    (i) => i.name.toLowerCase() === cleanSearch.toLowerCase()
  );

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Loading wastage module...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* 1. COMPACT TOP HEADER */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-2 rounded-xl bg-white border border-[#bed6c2] hover:bg-emerald-50 text-slate-700 shadow-xs transition group"
            title="Back to Operations Hub"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Record Wastage
            </h1>
            <p className="text-xs text-slate-500">
              Quick kitchen logging, camera photo verification & price tracking
            </p>
          </div>
        </div>

        <Link
          href="/app/items"
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Items Catalog</span>
        </Link>
      </div>

      {/* 2. MAIN COMPACT GRID */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left Form: Compact & Clean (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          {successBanner && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: ITEM SELECTION / INLINE CREATION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Item Name *
              </label>

              {selectedItem ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate block">
                        {selectedItem.name}
                      </span>
                      {selectedItem.isNew && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[9px] font-extrabold uppercase shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-800">
                      Unit: {unit} {selectedItem.categoryName ? `• ${selectedItem.categoryName}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setCapturedPhoto(null);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && cleanSearch) {
                          e.preventDefault();
                          if (filteredItems.length === 1 && filteredItems[0].name.toLowerCase() === cleanSearch.toLowerCase()) {
                            handleSelectItem(filteredItems[0]);
                          } else {
                            handleCreateNewItem(cleanSearch);
                          }
                        }
                      }}
                      placeholder="Type or search item name..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-hidden"
                    />
                  </div>

                  {/* Dropdown suggestions */}
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/70 p-1">
                    {cleanSearch && !exactMatchExists && (
                      <button
                        type="button"
                        onClick={() => handleCreateNewItem(cleanSearch)}
                        className="w-full text-left p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center justify-between text-xs font-bold text-emerald-900 cursor-pointer mb-1 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Plus className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">Create &quot;{cleanSearch}&quot;</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-800 px-2 py-0.5 rounded bg-emerald-200 shrink-0">
                          + Add & Set Price
                        </span>
                      </button>
                    )}

                    {filteredItems.length === 0 && !cleanSearch && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">No items configured yet.</p>
                        <p className="text-[11px] text-slate-400">Type any item name above to log it on the fly!</p>
                      </div>
                    )}

                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full text-left p-2 hover:bg-emerald-50/80 transition flex items-center justify-between rounded-lg cursor-pointer text-xs"
                      >
                        <span className="font-semibold text-slate-900 truncate mr-2">{item.name}</span>
                        <span className="font-extrabold text-slate-700 shrink-0 text-[11px]">
                          {formatCurrency(item.costPerUnit)} / {item.defaultUnit}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: QUANTITY, UNIT & RATE IN 1 COMPACT ROW */}
            {selectedItem && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Unit Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Unit *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rate / Unit */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Rate / {unit} (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="Price"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Instant Calculated Badge & Catalog checkbox */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="saveCatalogCost"
                      checked={updateCatalogPrice}
                      onChange={(e) => setUpdateCatalogPrice(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="saveCatalogCost" className="cursor-pointer text-[11px] text-slate-600 font-medium">
                      Save ₹{activeRate.toFixed(2)}/{unit} in Item Catalog
                    </label>
                  </div>

                  {numQty > 0 && (
                    <div className="font-extrabold text-slate-900 text-xs sm:text-right">
                      <span className="text-slate-500 font-medium mr-1">{numQty} {unit} =</span>
                      <span className="text-emerald-800 text-sm">{formatCurrency(computedValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: REASON BUTTONS */}
            {selectedItem && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Wastage Reason *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {reasons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReasonId(r.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border cursor-pointer ${
                        selectedReasonId === r.id
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: CAMERA PHOTO PROOF (OPTIONAL) */}
            {selectedItem && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Photo Proof (Optional)
                </label>

                {capturedPhoto ? (
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 border border-amber-300 shadow-xs cursor-pointer group shrink-0"
                        onClick={() => setViewingPhotoUrl(capturedPhoto.previewUrl)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhoto.previewUrl}
                          alt="Captured preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Camera Photo Attached
                        </span>
                        <span className="text-[10px] text-amber-800 font-mono">
                          {(capturedPhoto.sizeBytes / 1024).toFixed(0)} KB • Ready to save
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReuploadTarget(null);
                          setIsCameraModalOpen(true);
                        }}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Retake or re-upload photo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Retake / Re-upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapturedPhoto(null)}
                        className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReuploadTarget(null);
                      setIsCameraModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-600 hover:text-amber-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span>Open Camera & Snap Photo (Optional)</span>
                  </button>
                )}
              </div>
            )}

            {/* OPTIONAL MORE DETAILS */}
            {selectedItem && (
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Shift, Area, Notes</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showDetails && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-600 text-[10px] mb-0.5">Shift</label>
                        <input
                          type="text"
                          value={shift}
                          onChange={(e) => setShift(e.target.value)}
                          placeholder="Morning / Lunch / Evening"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 text-[10px] mb-0.5">Area</label>
                        <input
                          type="text"
                          value={responsibleArea}
                          onChange={(e) => setResponsibleArea(e.target.value)}
                          placeholder="Kitchen / Bar / Bakery"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 text-[10px] mb-0.5">Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observation context..."
                        className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={saving || !selectedItem || !selectedReasonId || !quantity}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Wastage & Photo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    Save Wastage {computedValue > 0 ? `(${formatCurrency(computedValue)})` : ""}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Feed: Recent Wastage Logs (1 Column) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recent Logs</h3>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {recentRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No logs recorded yet today.</p>
            ) : (
              recentRecords.map((rec) => (
                <div key={rec.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate mr-2">{rec.itemName}</span>
                    <span className="text-emerald-800 shrink-0">{formatCurrency(rec.wastageValue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>
                      {rec.quantity} {rec.unit} • {rec.reasonName}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(rec.recordedAt)}</span>
                  </div>

                  {/* Photo Proof Actions: View, Re-upload / Change, Add */}
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                    {rec.imageUrl ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingPhotoUrl(rec.imageUrl)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg hover:bg-emerald-200/90 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-emerald-700" />
                          <span>View Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReuploadTarget({ id: rec.id, itemName: rec.itemName });
                            setIsCameraModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          title="Re-upload or update photo for this log"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Re-upload</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReuploadTarget({ id: rec.id, itemName: rec.itemName });
                          setIsCameraModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg hover:bg-amber-100 transition cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-amber-700" />
                        <span>+ Add Live Photo</span>
                      </button>
                    )}
                  </div>

                  {rec.notes && (
                    <p className="text-[10px] text-slate-600 bg-amber-50/70 border border-amber-200/60 p-1.5 rounded-lg italic">
                      "{rec.notes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {isCameraModalOpen && (
        <WastageCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => {
            setIsCameraModalOpen(false);
            setReuploadTarget(null);
          }}
          itemName={reuploadTarget ? reuploadTarget.itemName : selectedItem?.name || "Wastage Item"}
          onPhotoCaptured={async (data) => {
            if (reuploadTarget) {
              // Direct upload & update for existing record
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
                setSuccessBanner(`Photo proof for ${reuploadTarget.itemName} updated successfully!`);
                loadData();
              } catch (err: any) {
                setError(err.message || "Failed to update photo proof");
              } finally {
                setReuploadTarget(null);
                setIsCameraModalOpen(false);
              }
            } else {
              setCapturedPhoto(data);
              setIsCameraModalOpen(false);
            }
          }}
        />
      )}

      {/* Photo Lightbox Preview */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setViewingPhotoUrl(null)}
              className="p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingPhotoUrl}
            alt="Wastage photo proof"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
