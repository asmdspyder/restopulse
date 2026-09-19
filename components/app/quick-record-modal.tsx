"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sparkles,
  IndianRupee,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ItemOption {
  id: string;
  name: string;
  categoryName?: string;
  defaultUnit: string;
  costPerUnit: string;
  defaultResponsibleArea?: string;
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
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("kg");
  const [unitCost, setUnitCost] = useState<string>("");
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  // Optional "More details" State
  const [showDetails, setShowDetails] = useState(false);
  const [shift, setShift] = useState<string>("");
  const [responsibleArea, setResponsibleArea] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

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
    setUnit(item.defaultUnit);
    setUnitCost(item.costPerUnit);
    if (item.defaultResponsibleArea) {
      setResponsibleArea(item.defaultResponsibleArea);
    }
    setSearchItem("");
  };

  const resetForm = () => {
    setSelectedItem(null);
    setSearchItem("");
    setQuantity("");
    setUnitCost("");
    setUpdateCatalogPrice(true);
    setSelectedReasonId("");
    setShowDetails(false);
    setShift("");
    setResponsibleArea("");
    setNotes("");
    setError(null);
    setSuccessMessage(null);
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  // Auto-calculated Wastage Value Preview
  const numQty = parseFloat(quantity) || 0;
  const activeRate = parseFloat(unitCost) || (selectedItem ? parseFloat(selectedItem.costPerUnit) : 0);
  const computedValue = numQty * activeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedItem) {
      setError("Please select an item");
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
      const res = await fetch("/api/wastage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          reasonId: selectedReasonId,
          quantity: numQty,
          unit,
          ratePerUnit: activeRate,
          updateItemCost: updateCatalogPrice,
          shift: shift || undefined,
          responsibleArea: responsibleArea || undefined,
          notes: notes || undefined,
        }),
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
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
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

              {/* STEP 1: SELECT ITEM */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. What was wasted? *
                </label>

                {selectedItem ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-base block">{selectedItem.name}</span>
                      <span className="text-xs text-emerald-800 font-medium">
                        Unit: {selectedItem.defaultUnit}
                        {selectedItem.categoryName && ` • ${selectedItem.categoryName}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition"
                    >
                      Change Item
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        placeholder="Search items (e.g. Cooked Rice, Milk, Chicken)..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                      {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          {items.length === 0
                            ? "No items configured yet. Please add items in the Items tab."
                            : "No matching items found."}
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className="w-full text-left p-2.5 hover:bg-emerald-50/70 transition flex items-center justify-between group"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 text-sm group-hover:text-emerald-800">
                                {item.name}
                              </span>
                              {item.categoryName && (
                                <span className="text-[11px] text-slate-500 ml-2">({item.categoryName})</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                              {formatCurrency(item.costPerUnit)} / {item.defaultUnit}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: QUANTITY & EDITABLE UNIT PRICE */}
              {selectedItem && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Quantity *
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
                        <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center min-w-[50px]">
                          {unit}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Rate / {unit} (₹)
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
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="updateCatalogCost" className="cursor-pointer">
                      Save new rate (₹{activeRate.toFixed(2)}) as default in item catalog
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

              {/* STEP 3: REASON (BIG TAP BUTTONS) */}
              {selectedItem && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    3. Why was it wasted? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {reasons.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReasonId(r.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition text-center border ${
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

              {/* OPTIONAL: MORE DETAILS ACCORDION */}
              {selectedItem && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
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
                        <label className="block font-semibold text-slate-600 mb-1">Incident Notes</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Over-prepped for lunch rush"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTON */}
              <button
                type="submit"
                disabled={saving || !selectedItem || !selectedReasonId || !quantity}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>
                      Save Wastage Record {computedValue > 0 ? `(${formatCurrency(computedValue)})` : ""}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
