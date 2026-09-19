"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Utensils,
  Trash2,
  Loader2,
} from "lucide-react";
import { DEFAULT_SAMPLE_ITEMS, DEFAULT_WASTAGE_REASONS } from "@/lib/db/defaults";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [itemsList, setItemsList] = useState<any[]>(
    DEFAULT_SAMPLE_ITEMS.map((item, idx) => ({
      id: `init_${idx}`,
      name: item.name,
      categoryName: item.category,
      unit: item.defaultUnit,
      costPerUnit: parseFloat(item.costPerUnit),
      responsibleArea: item.defaultResponsibleArea,
      selected: idx < 4, // Pre-select first 4
    }))
  );

  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("kg");
  const [customCost, setCustomCost] = useState("");
  const [customCategory, setCustomCategory] = useState("Food");

  const [saving, setSaving] = useState(false);

  const toggleItem = (index: number) => {
    const updated = [...itemsList];
    updated[index].selected = !updated[index].selected;
    setItemsList(updated);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCost) return;

    setItemsList([
      ...itemsList,
      {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        categoryName: customCategory,
        unit: customUnit,
        costPerUnit: parseFloat(customCost),
        responsibleArea: "Kitchen",
        selected: true,
      },
    ]);

    setCustomName("");
    setCustomCost("");
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    try {
      const selectedItemsToSave = itemsList
        .filter((i) => i.selected)
        .map((i) => ({
          name: i.name,
          categoryName: i.categoryName,
          unit: i.unit,
          costPerUnit: i.costPerUnit,
          responsibleArea: i.responsibleArea,
        }));

      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItemsToSave,
          complete: true,
        }),
      });

      router.push("/app");
      router.refresh();
    } catch (err) {
      console.error(err);
      router.push("/app");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span>Step {step} of 2</span>
          <span>{step === 1 ? "Add Common Items" : "Confirm Wastage Reasons"}</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl">
        {step === 1 ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add your first items</h2>
                <p className="text-xs text-slate-500">
                  Select commonly wasted items or add your own. You can customize costs anytime.
                </p>
              </div>
            </div>

            {/* Pre-made item cards */}
            <div className="mt-6 space-y-2">
              {itemsList.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(index)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    item.selected
                      ? "border-emerald-500 bg-emerald-50/60"
                      : "border-slate-200 hover:bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        item.selected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {item.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.categoryName} • Default: {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{item.costPerUnit.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400"> / {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Item Quick Form */}
            <form onSubmit={handleAddCustomItem} className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">+ Add a custom item</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="portion">portion</option>
                </select>
                <input
                  type="number"
                  placeholder="Cost / unit (₹)"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
                >
                  Add Item
                </button>
              </div>
            </form>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Default Wastage Reasons</h2>
                <p className="text-xs text-slate-500">
                  We've configured industry-standard wastage causes. You can add or rename reasons later in Settings.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_WASTAGE_REASONS.map((r) => (
                <div
                  key={r.name}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{r.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleFinishOnboarding}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
