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
  Layers,
  Sparkles,
  Receipt,
  CheckCheck,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { WastageCameraModal } from "@/components/app/wastage-camera-modal";

const STANDARD_UNITS = ["kg", "g", "L", "ml", "pcs", "portion", "pack", "bottle", "tray"];

const QUICK_CATEGORIES = [
  "All",
  "Dairy & Cheese",
  "Meat & Poultry",
  "Produce & Veg",
  "Bakery & Breads",
  "Sauces & Prep",
  "Beverages",
  "Other",
];

export default function RecordWastagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Category Filter for items
  const [activeCategory, setActiveCategory] = useState("All");

  // Form State
  const [searchItem, setSearchItem] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("kg");
  const [unitCost, setUnitCost] = useState<string>("");
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  // Optional Details
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
        fetch("/api/wastage?limit=8"),
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

  const adjustQty = (amount: number) => {
    const current = parseFloat(quantity) || 0;
    const next = Math.max(0.1, current + amount);
    setQuantity(String(Math.round(next * 100) / 100));
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
      let imageUrl: string | undefined = undefined;

      // 1. Upload camera photo to Cloudflare R2 if attached
      if (capturedPhoto) {
        try {
          const formData = new FormData();
          formData.append("file", capturedPhoto.blob, `wastage-${Date.now()}.jpg`);
          formData.append("itemName", selectedItem.name);

          const uploadRes = await fetch("/api/wastage/images", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.imageUrl) {
              imageUrl = uploadData.imageUrl;
            }
          }
        } catch (uploadErr) {
          console.error("Camera photo upload error:", uploadErr);
        }
      }

      // 2. Submit Wastage Entry
      const payload: any = {
        quantity: Number(quantity),
        unit,
        unitCost: Number(unitCost),
        reasonId: selectedReasonId,
        updateCatalogPrice: Boolean(updateCatalogPrice),
        shift: shift.trim() || undefined,
        responsibleArea: responsibleArea.trim() || undefined,
        notes: notes.trim() || undefined,
        imageUrl,
      };

      if (selectedItem.isNew) {
        payload.itemName = selectedItem.name;
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
        setError(data.error || "Failed to log wastage entry");
        return;
      }

      setSuccessBanner(
        `Logged ${quantity} ${unit} of ${selectedItem.name} (${formatCurrency(computedValue)})`
      );

      // Reset form
      setSelectedItem(null);
      setQuantity("1");
      setUnitCost("");
      setNotes("");
      setCapturedPhoto(null);
      setShowDetails(false);

      // Reload history & items
      loadData();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Filter items by category & search
  const filteredItems = items.filter((i) => {
    const matchesSearch =
      !searchItem || i.name.toLowerCase().includes(searchItem.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      (i.category && i.category.toLowerCase().includes(activeCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* 1. TOP HEADER */}
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
              Kitchen Wastage Logger
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Rapid 1-tap food waste entry with live cost tracking and camera proof.
          </p>
        </div>

        <Link
          href="/app/history"
          className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-zinc-500" />
          <span>Full Wastage History</span>
        </Link>
      </div>

      {/* Success / Error Alerts */}
      {successBanner && (
        <div className="p-3.5 bg-zinc-900 text-white rounded-2xl flex items-center justify-between text-xs font-medium shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. MAIN LOGGING CARD & RECENT TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rapid POS Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* STEP 1: ITEM SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                  1. Select or Search Item *
                </label>
                {selectedItem && (
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    Change Item
                  </button>
                )}
              </div>

              {selectedItem ? (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">{selectedItem.name}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Base: ₹{parseFloat(selectedItem.costPerUnit || "0").toFixed(2)}/{selectedItem.defaultUnit || "kg"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    Selected
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Type item name (e.g. Milk, Paneer, Tomatoes)..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchItem.trim()) {
                          e.preventDefault();
                          handleCreateNewItem(searchItem);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  {/* Quick Category Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                          activeCategory === cat
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Popular / Filtered Item Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredItems.slice(0, 12).map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => handleSelectItem(it)}
                        className="p-2 rounded-xl text-left bg-zinc-50/70 hover:bg-zinc-100/90 border border-zinc-200/80 transition cursor-pointer group"
                      >
                        <span className="text-xs font-semibold text-zinc-900 block truncate group-hover:text-zinc-950">
                          {it.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          ₹{parseFloat(it.costPerUnit || "0").toFixed(0)}/{it.defaultUnit || "kg"}
                        </span>
                      </button>
                    ))}

                    {searchItem.trim() && (
                      <button
                        type="button"
                        onClick={() => handleCreateNewItem(searchItem)}
                        className="p-2 rounded-xl text-left bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer col-span-2 sm:col-span-3 flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold truncate">+ Add &quot;{searchItem}&quot;</span>
                        <span className="text-[10px] text-zinc-300">Custom Item</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: QUANTITY, UNIT & RATE */}
            {selectedItem && (
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                    2. Quantity & Cost *
                  </label>

                  {/* Quick Quantity Steppers */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustQty(-1)}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQty(0.5)}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold cursor-pointer"
                    >
                      +0.5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQty(1)}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQty(5)}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Rate / {unit} (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="Price"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>

                {/* Total Cost Badge */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="saveCatalogCost"
                      checked={updateCatalogPrice}
                      onChange={(e) => setUpdateCatalogPrice(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="saveCatalogCost" className="cursor-pointer text-[11px] text-zinc-600 font-medium">
                      Save ₹{activeRate.toFixed(2)}/{unit} in Item Catalog
                    </label>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400 mr-1.5">{numQty} {unit} =</span>
                    <span className="text-sm font-bold text-zinc-900">{formatCurrency(computedValue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REASON PILLS */}
            {selectedItem && (
              <div className="pt-4 border-t border-zinc-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  3. Wastage Reason *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {reasons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReasonId(r.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center border cursor-pointer ${
                        selectedReasonId === r.id
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: PHOTO PROOF (OPTIONAL) */}
            {selectedItem && (
              <div className="pt-4 border-t border-zinc-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  4. Photo Proof (Optional)
                </label>

                {capturedPhoto ? (
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-14 h-11 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-300 shadow-xs cursor-pointer group shrink-0"
                        onClick={() => setViewingPhotoUrl(capturedPhoto.previewUrl)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhoto.previewUrl}
                          alt="Captured preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 block">
                          Photo Attached
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
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
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                        title="Retake or re-upload photo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapturedPhoto(null)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
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
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-zinc-500" />
                    <span>Open Camera to Attach Photo Proof</span>
                  </button>
                )}
              </div>
            )}

            {/* STEP 5: SUBMIT BUTTON */}
            {selectedItem && (
              <div className="pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Entry...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Log Wastage ({formatCurrency(computedValue)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right: Live Shift Timeline / Recent Logged (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Recent Shift Logs
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">
                {recentRecords.length} recorded
              </span>
            </div>

            {recentRecords.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No wastage recorded in this shift yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 mt-2">
                {recentRecords.map((rec) => (
                  <div key={rec.id} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">{rec.itemName}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                          <span>{rec.quantity} {rec.unit}</span>
                          <span>•</span>
                          <span className="font-semibold text-zinc-700">{rec.reason?.name || "Waste"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-900 block">
                          {formatCurrency(Number(rec.totalCost || 0))}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {formatDateTime(rec.recordedAt || rec.createdAt).split(",")[1]}
                        </span>
                      </div>
                    </div>

                    {/* Attached Photo indicator & Re-upload */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-zinc-50">
                      {rec.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setViewingPhotoUrl(rec.imageUrl)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>View Photo Proof</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400">No photo proof</span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setReuploadTarget({ id: rec.id, itemName: rec.itemName });
                          setIsCameraModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{rec.imageUrl ? "Re-upload" : "Add Photo"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CAMERA MODAL */}
      <WastageCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setReuploadTarget(null);
        }}
        itemName={reuploadTarget?.itemName || selectedItem?.name || "Wastage Item"}
        onPhotoCaptured={async (photo) => {
          if (reuploadTarget) {
            try {
              const formData = new FormData();
              formData.append("file", photo.blob, `wastage-${Date.now()}.jpg`);
              formData.append("itemName", reuploadTarget.itemName);
              formData.append("wastageId", reuploadTarget.id);

              const uploadRes = await fetch("/api/wastage/images", {
                method: "POST",
                body: formData,
              });

              if (uploadRes.ok) {
                setSuccessBanner(`Updated photo for ${reuploadTarget.itemName}`);
                loadData();
              }
            } catch (err) {
              console.error("Failed to re-upload photo:", err);
            } finally {
              setReuploadTarget(null);
            }
          } else {
            setCapturedPhoto(photo);
          }
        }}
      />

      {/* PHOTO PREVIEW MODAL */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900">
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingPhotoUrl}
              alt="Full resolution proof"
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
