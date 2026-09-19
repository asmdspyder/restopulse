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
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
        fetch("/api/wastage?limit=5"),
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
    setUnit(item.defaultUnit);
    setUnitCost(item.costPerUnit);
    if (item.defaultResponsibleArea) {
      setResponsibleArea(item.defaultResponsibleArea);
    }
    setSearchItem("");
  };

  const numQty = parseFloat(quantity) || 0;
  const activeRate = parseFloat(unitCost) || (selectedItem ? parseFloat(selectedItem.costPerUnit) : 0);
  const computedValue = numQty * activeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

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

      setSuccessBanner(
        `Wastage recorded: ${selectedItem.name} — ${numQty} ${unit} (${formatCurrency(computedValue)})`
      );

      // Reset form fields
      setSelectedItem(null);
      setQuantity("1");
      setUnitCost("");
      setSelectedReasonId("");
      setShowDetails(false);
      setNotes("");

      // Refresh recent records list
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#bed6c2] text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-bold text-xs shadow-xs transition group"
            title="Return to Operations Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Operations Hub</span>
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Record Wastage</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fast 10-second logging. The system automatically retrieves and snapshot-preserves unit costs and timestamps.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Main Recording Form (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          {successBanner && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: SELECT ITEM */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. What was wasted? *
              </label>

              {selectedItem ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-base block">{selectedItem.name}</span>
                    <span className="text-xs text-emerald-800 font-semibold">
                      Unit: {selectedItem.defaultUnit}
                      {selectedItem.categoryName && ` • ${selectedItem.categoryName}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-1.5 rounded-xl transition"
                  >
                    Change Item
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      placeholder="Search items (e.g. Cooked Rice, Milk, Chicken, Croissant)..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {items.length === 0
                          ? "No items configured yet. Please configure items in Items tab."
                          : "No matching items found."}
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className="w-full text-left p-3 hover:bg-emerald-50/80 transition flex items-center justify-between group"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 text-sm group-hover:text-emerald-800">
                              {item.name}
                            </span>
                            {item.categoryName && (
                              <span className="text-[11px] text-slate-500 ml-2">({item.categoryName})</span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-slate-700 group-hover:text-emerald-700">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
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
                        className="block w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                      <div className="px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 font-extrabold text-xs text-slate-700 flex items-center justify-center min-w-[55px]">
                        {unit}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Rate / {unit} (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="Cost per unit"
                      className="block w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Auto-update catalog price toggle */}
                <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                  <input
                    type="checkbox"
                    id="updateCatalogCostWastage"
                    checked={updateCatalogPrice}
                    onChange={(e) => setUpdateCatalogPrice(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="updateCatalogCostWastage" className="cursor-pointer">
                    Save new rate (₹{activeRate.toFixed(2)}) as default in item catalog for future logs
                  </label>
                </div>

                {numQty > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      {numQty} {unit} × {formatCurrency(activeRate)} =
                    </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {formatCurrency(computedValue)} Wastage
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: REASON BUTTONS */}
            {selectedItem && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Why was it wasted? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {reasons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReasonId(r.id)}
                      className={`p-3 rounded-2xl text-xs font-bold transition text-center border ${
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

            {/* OPTIONAL MORE DETAILS */}
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
                  <div className="mt-3 space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Shift (Optional)</label>
                        <input
                          type="text"
                          value={shift}
                          onChange={(e) => setShift(e.target.value)}
                          placeholder="Morning / Evening"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Responsible Area</label>
                        <input
                          type="text"
                          value={responsibleArea}
                          onChange={(e) => setResponsibleArea(e.target.value)}
                          placeholder="Kitchen / Bar / Bakery"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Context or observation..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
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
              className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    Save Wastage Event {computedValue > 0 ? `(${formatCurrency(computedValue)})` : ""}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Feed (1 Column) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Wastage Logs</h3>
          </div>

          <div className="space-y-3">
            {recentRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No logs recorded yet today.</p>
            ) : (
              recentRecords.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{rec.itemName}</span>
                    <span className="text-emerald-700">{formatCurrency(rec.wastageValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 mt-1">
                    <span>
                      {rec.quantity} {rec.unit} • {rec.reasonName}
                    </span>
                    <span className="text-[10px]">{formatDateTime(rec.recordedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
