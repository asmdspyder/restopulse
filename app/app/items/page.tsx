"use client";

import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("kg");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [defaultResponsibleArea, setDefaultResponsibleArea] = useState("Kitchen");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/categories"),
      ]);

      const itemsData = await itemsRes.json();
      const catData = await catRes.json();

      setItems(itemsData.items || []);
      setCategories(catData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCategoryId("");
    setDefaultUnit("kg");
    setCostPerUnit("");
    setDefaultResponsibleArea("Kitchen");
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.categoryId || "");
    setDefaultUnit(item.defaultUnit);
    setCostPerUnit(item.costPerUnit);
    setDefaultResponsibleArea(item.defaultResponsibleArea || "Kitchen");
    setIsActive(item.isActive);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !defaultUnit || !costPerUnit) {
      setError("Please fill required fields (Name, Unit, Cost)");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch("/api/items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            name,
            categoryId: categoryId || null,
            defaultUnit,
            costPerUnit: parseFloat(costPerUnit),
            defaultResponsibleArea,
            isActive,
          }),
        });
        if (!res.ok) throw new Error("Failed to update item");
      } else {
        // Create
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            categoryId: categoryId || null,
            defaultUnit,
            costPerUnit: parseFloat(costPerUnit),
            defaultResponsibleArea,
          }),
        });
        if (!res.ok) throw new Error("Failed to create item");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Item Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your food, ingredient, beverage, and packaging costs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <span className="text-xs font-semibold text-slate-500">Loading item catalog...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No items found</h3>
            <p className="text-xs text-slate-500 mt-1">Add items to enable rapid 10-second wastage logging.</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Item</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Default Unit</th>
                  <th className="py-3.5 px-4">Cost / Unit</th>
                  <th className="py-3.5 px-4">Responsible Area</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.categoryName || "General"}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{item.defaultUnit}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(item.costPerUnit)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.defaultResponsibleArea || "Kitchen"}</td>
                    <td className="py-3.5 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cooked Rice, Milk, Chicken"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Unit *</label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="portion">portion</option>
                    <option value="pack">pack</option>
                    <option value="bottle">bottle</option>
                    <option value="tray">tray</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost per Unit (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="e.g. 95.00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsible Area</label>
                  <input
                    type="text"
                    value={defaultResponsibleArea}
                    onChange={(e) => setDefaultResponsibleArea(e.target.value)}
                    placeholder="Kitchen / Bar"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {editingItem && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActiveCheck" className="font-semibold text-slate-700">
                    Active (available in record logger)
                  </label>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
