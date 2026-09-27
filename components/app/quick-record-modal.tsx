"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  Camera,
  RotateCcw,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { WastageCameraModal } from "@/components/app/wastage-camera-modal";

const STANDARD_UNITS = ["kg", "g", "L", "ml", "pcs", "portion", "pack", "bottle", "tray"];

interface ItemOption {
  id: string;
  name: string;
  categoryName?: string;
  defaultUnit: string;
  costPerUnit: string;
  defaultResponsibleArea?: string;
  isNew?: boolean;
}

interface ReasonOption {
  id: string;
  name: string;
}

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultItemId?: string;
}

export default function QuickRecordModal({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}: QuickRecordModalProps) {
  const [items, setItems] = useState<ItemOption[]>([]);
  const [reasons, setReasons] = useState<ReasonOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form State
  const [searchItem, setSearchItem] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("kg");
  const [unitCost, setUnitCost] = useState<string>("");
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  // Optional "More details" State
  const [showDetails, setShowDetails] = useState(false);
  const [shift, setShift] = useState<string>("");
  const [responsibleArea, setResponsibleArea] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Camera Photo Proof State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    blob: Blob;
    previewUrl: string;
    sizeBytes: number;
  } | null>(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [itemsRes, reasonsRes] = await Promise.all([
        fetch("/api/items?activeOnly=true"),
        fetch("/api/reasons"),
      ]);
      const itemsData = await itemsRes.json();
      const reasonsData = await reasonsRes.json();

      setItems(itemsData.items || []);
      const activeReasons = (reasonsData.reasons || []).filter((r: any) => r.isActive);
      setReasons(activeReasons);

      if (defaultItemId && itemsData.items) {
        const found = itemsData.items.find((i: any) => i.id === defaultItemId);
        if (found) {
          handleSelectItem(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSelectItem = (item: ItemOption) => {
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

  const resetForm = () => {
    setSelectedItem(null);
    setSearchItem("");
    setQuantity("1");
    setUnitCost("");
    setUnit("kg");
    setUpdateCatalogPrice(true);
    setSelectedReasonId("");
    setShowDetails(false);
    setShift("");
    setResponsibleArea("");
    setNotes("");
    setCapturedPhoto(null);
    setError(null);
    setSuccessMessage(null);
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const cleanSearch = searchItem.trim();
  const exactMatchExists = items.some(
    (i) => i.name.toLowerCase() === cleanSearch.toLowerCase()
  );

  // Auto-calculated Wastage Value Preview
  const numQty = parseFloat(quantity) || 0;
  const activeRate = parseFloat(unitCost) || (selectedItem?.costPerUnit ? parseFloat(selectedItem.costPerUnit) : 0);
  const computedValue = numQty * activeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      setSuccessMessage(
        `${selectedItem.name} — ${numQty} ${unit} (${formatCurrency(computedValue)}) recorded!`
      );

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save record");
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Wastage</h3>
              <span className="text-[11px] text-slate-500">Fast 10-second logging</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successMessage ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Wastage Recorded</h4>
              <p className="text-emerald-700 font-medium text-sm mt-1">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: SELECT OR CREATE ITEM */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. What was wasted? *
                </label>

                {selectedItem ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base block">{selectedItem.name}</span>
                        {selectedItem.isNew && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase">
                            ✨ New Item
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-800 font-medium">
                        Unit: {unit}
                        {selectedItem.categoryName && ` • ${selectedItem.categoryName}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(null);
                        setCapturedPhoto(null);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
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
                        placeholder="Search item or type to create new..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Suggestions List */}
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                      {cleanSearch && !exactMatchExists && (
                        <button
                          type="button"
                          onClick={() => handleCreateNewItem(cleanSearch)}
                          className="w-full text-left p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border-b border-emerald-200 transition flex items-center justify-between text-xs font-bold text-emerald-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-emerald-600" />
                            <span>Create &quot;{cleanSearch}&quot;</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-700 px-2 py-0.5 rounded bg-emerald-200/70">
                            + Add & Set Price
                          </span>
                        </button>
                      )}

                      {filteredItems.length === 0 && !cleanSearch && (
                        <div className="p-4 text-center text-xs text-slate-400">
                          <p>No catalog items found.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Type an item name above to add on the fly.</p>
                        </div>
                      )}

                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className="w-full text-left p-2.5 hover:bg-emerald-50/60 transition flex items-center justify-between cursor-pointer text-xs"
                        >
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="font-bold text-slate-600">
                            {formatCurrency(item.costPerUnit)} / {item.defaultUnit}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: QUANTITY, UNIT & RATE */}
              {selectedItem && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Quantity & Unit *
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="any"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g. 1.5"
                          className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                        >
                          {STANDARD_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Rate / {unit} (₹) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        placeholder="Cost per unit"
                        className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Auto-update catalog price checkbox */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      id="updateCatalogCost"
                      checked={updateCatalogPrice}
                      onChange={(e) => setUpdateCatalogPrice(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="updateCatalogCost" className="cursor-pointer font-medium text-[11px]">
                      {selectedItem.isNew
                        ? `Save "${selectedItem.name}" to Item Catalog for future logs`
                        : `Update default rate (₹${activeRate.toFixed(2)}) in Item Catalog`}
                    </label>
                  </div>

                  {/* Instant Value Badge */}
                  {numQty > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        {numQty} {unit} × {formatCurrency(activeRate)} =
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(computedValue)} Wastage
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: REASON */}
              {selectedItem && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    2. Why was it wasted? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {reasons.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReasonId(r.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition text-center border cursor-pointer ${
                          selectedReasonId === r.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    3. Photo Proof (Optional)
                  </label>

                  {capturedPhoto ? (
                    <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-14 h-11 rounded-xl overflow-hidden bg-slate-900 border border-amber-300 shadow-xs cursor-pointer group shrink-0"
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
                          <span className="text-xs font-bold text-slate-900 block">
                            Photo Attached
                          </span>
                          <span className="text-[10px] text-amber-800 font-mono">
                            {(capturedPhoto.sizeBytes / 1024).toFixed(0)} KB • Ready
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCameraModalOpen(true)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Retake photo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Retake</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCapturedPhoto(null)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-600 hover:text-amber-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span>Snap Photo with Live Camera (Optional)</span>
                    </button>
                  )}
                </div>
              )}

              {/* OPTIONAL: MORE DETAILS ACCORDION */}
              {selectedItem && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>More details (Shift, Area, Notes)</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showDetails && (
                    <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Shift (Optional)</label>
                          <input
                            type="text"
                            value={shift}
                            onChange={(e) => setShift(e.target.value)}
                            placeholder="Morning / Lunch / Dinner"
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Responsible Area</label>
                          <input
                            type="text"
                            value={responsibleArea}
                            onChange={(e) => setResponsibleArea(e.target.value)}
                            placeholder="Kitchen / Bar / Bakery"
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Observation / Notes</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Fridge temperature was high overnight"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
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
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Wastage & Photo...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save Wastage {computedValue > 0 ? `(${formatCurrency(computedValue)})` : ""}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      {isCameraModalOpen && (
        <WastageCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          itemName={selectedItem?.name || "Wastage Item"}
          onPhotoCaptured={(data) => {
            setCapturedPhoto(data);
            setIsCameraModalOpen(false);
          }}
        />
      )}

      {/* Photo Lightbox */}
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
