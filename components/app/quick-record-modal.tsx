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
    setSearchItem("");
    setSelectedItem(null);
    setQuantity("1");
    setUnit("kg");
    setUnitCost("");
    setUpdateCatalogPrice(true);
    setSelectedReasonId("");
    setShowDetails(false);
    setShift("");
    setResponsibleArea("");
    setNotes("");
    setCapturedPhoto(null);
    setViewingPhotoUrl(null);
    setSaving(false);
    setSuccessMessage(null);
    setError(null);
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

      // 1. Upload captured photo to Cloudflare R2 if attached
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
        setError(data.error || "Failed to log wastage");
        return;
      }

      setSuccessMessage(
        `Logged ${quantity} ${unit} of ${selectedItem.name} (${formatCurrency(computedValue)})`
      );

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Quick Record Wastage</h2>
            <p className="text-[11px] text-zinc-500">Log food waste in seconds with live rate calculations</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Wastage Logged Successfully</h3>
            <p className="text-xs text-zinc-600">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: ITEM SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  1. Item *
                </label>
                {selectedItem && (
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedItem ? (
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-zinc-700" />
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">{selectedItem.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ₹{parseFloat(selectedItem.costPerUnit || "0").toFixed(2)}/{selectedItem.defaultUnit || "kg"}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    Selected
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search or enter item name..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchItem.trim()) {
                          e.preventDefault();
                          handleCreateNewItem(searchItem);
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  {/* Filtered suggestions */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {filteredItems.slice(0, 8).map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => handleSelectItem(it)}
                        className="p-2 rounded-xl text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-zinc-900 block truncate">{it.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ₹{parseFloat(it.costPerUnit || "0").toFixed(0)}/{it.defaultUnit || "kg"}
                        </span>
                      </button>
                    ))}

                    {searchItem.trim() && (
                      <button
                        type="button"
                        onClick={() => handleCreateNewItem(searchItem)}
                        className="p-2 rounded-xl text-left bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer col-span-2 flex items-center justify-between"
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
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    2. Quantity & Rate *
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustQty(-1)}
                      className="px-1.5 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQty(0.5)}
                      className="px-1.5 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold cursor-pointer"
                    >
                      +0.5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQty(1)}
                      className="px-1.5 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400 cursor-pointer"
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
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-500">Calculated Cost:</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(computedValue)}</span>
                </div>
              </div>
            )}

            {/* STEP 3: REASON PILLS */}
            {selectedItem && (
              <div className="pt-3 border-t border-zinc-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  3. Reason *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {reasons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReasonId(r.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center border cursor-pointer truncate ${
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
              <div className="pt-3 border-t border-zinc-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  4. Photo Proof (Optional)
                </label>

                {capturedPhoto ? (
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-8 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-300 cursor-pointer shrink-0"
                        onClick={() => setViewingPhotoUrl(capturedPhoto.previewUrl)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhoto.previewUrl}
                          alt="Captured preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">Photo Attached</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapturedPhoto(null)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Attach Camera Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* STEP 5: SUBMIT BUTTON */}
            {selectedItem && (
              <div className="pt-3 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Save Record ({formatCurrency(computedValue)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* CAMERA MODAL */}
      <WastageCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={(photo) => setCapturedPhoto(photo)}
      />

      {/* PHOTO PREVIEW MODAL */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="relative max-w-sm max-h-[80vh] rounded-2xl overflow-hidden bg-zinc-900">
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingPhotoUrl}
              alt="Photo preview"
              className="w-full h-full object-contain max-h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
