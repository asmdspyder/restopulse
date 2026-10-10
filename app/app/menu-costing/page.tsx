"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  BookOpen,
  MoveUp,
  MoveDown,
  X,
  Loader2,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  UNIT_OPTIONS,
  StandardUnit,
  getCompatibleUnits,
  calculateCostPerBaseUnit,
  calculatePortionCost,
  getStandardCostDisplay,
  calculateMenuItemEconomics,
} from "@/lib/menu-costing/units";

interface Ingredient {
  id: string;
  restaurantId: string;
  name: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  purchasePrice: number;
  costPerBaseUnit: number;
  notes: string | null;
  usedInCount: number;
  standardCostDisplay: string;
  standardUnit: string;
  ratePerStandardUnit: number;
}

interface MenuItemIngredientRow {
  id?: string;
  ingredientId: string;
  quantity: string | number;
  unit: string;
  ingredientName?: string;
  portionCost?: number;
  standardCostDisplay?: string;
}

interface MenuItemStep {
  id?: string;
  stepNumber: number;
  instruction: string;
}

interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  sellingPrice: number;
  category: string | null;
  description: string | null;
  isActive: boolean;
  ingredientCount: number;
  stepCount: number;
  previousCost?: number | null;
  lastCostChange?: number | null;
  lastCostChangeAt?: string | Date | null;
  ingredients?: MenuItemIngredientRow[];
  steps?: MenuItemStep[];
  economics: {
    totalIngredientCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    foodCostPercent: number;
    isComplete: boolean;
    hasSellingPrice: boolean;
  };
}

interface ImpactReportItem {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  oldTotalCost: number;
  newTotalCost: number;
  costChange: number;
  costChangePercent: number;
  oldGrossProfit: number;
  newGrossProfit: number;
  oldGrossMarginPercent: number;
  newGrossMarginPercent: number;
}

interface IngredientImpactReport {
  ingredientId: string;
  ingredientName: string;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldPurchaseUnit: string;
  newPurchaseUnit: string;
  affectedMenuItemsCount: number;
  affectedItems: ImpactReportItem[];
}

export default function MenuCostingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab: 'items' or 'ingredients'
  const activeTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"items" | "ingredients">(
    activeTabParam === "ingredients" ? "ingredients" : "items"
  );

  useEffect(() => {
    if (activeTabParam === "ingredients") {
      setActiveTab("ingredients");
    } else {
      setActiveTab("items");
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: "items" | "ingredients") => {
    setActiveTab(tab);
    router.replace(`/app/menu-costing?tab=${tab}`);
  };

  // Main Data States
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Ingredient Form Modal State
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    purchaseQuantity: "1",
    purchaseUnit: "kg" as StandardUnit,
    purchasePrice: "",
    notes: "",
  });
  const [savingIngredient, setSavingIngredient] = useState(false);
  const [ingredientError, setIngredientError] = useState("");

  // Impact Report Dialog State
  const [impactReport, setImpactReport] = useState<IngredientImpactReport | null>(null);

  // In-Use Delete Conflict Dialog
  const [inUseConflict, setInUseConflict] = useState<{
    isOpen: boolean;
    ingredientName: string;
    usedInMenuNames: string[];
  } | null>(null);

  // Menu Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    sellingPrice: "",
    category: "",
    description: "",
    ingredients: [] as MenuItemIngredientRow[],
  });
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState("");

  // Recipe SOP Steps Modal State
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false);
  const [activeStepsItem, setActiveStepsItem] = useState<MenuItem | null>(null);
  const [recipeSteps, setRecipeSteps] = useState<Array<{ stepNumber: number; instruction: string }>>([]);
  const [savingSteps, setSavingSteps] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ingRes, itemsRes] = await Promise.all([
        fetch("/api/menu-costing/ingredients"),
        fetch("/api/menu-costing/menu-items"),
      ]);

      if (ingRes.ok) {
        const data = await ingRes.json();
        setIngredients(data);
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error("Failed to load costing data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Categories list derived from menu items
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [menuItems]);

  // Overall Financial Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalDishes = menuItems.length;
    const completedDishes = menuItems.filter((i) => i.economics.isComplete);
    const avgMargin =
      completedDishes.length > 0
        ? completedDishes.reduce((acc, curr) => acc + curr.economics.grossMarginPercent, 0) /
          completedDishes.length
        : 0;
    const avgFoodCost =
      completedDishes.length > 0
        ? completedDishes.reduce((acc, curr) => acc + curr.economics.foodCostPercent, 0) /
          completedDishes.length
        : 0;

    return {
      totalDishes,
      completedDishesCount: completedDishes.length,
      totalIngredients: ingredients.length,
      avgGrossMargin: Math.round(avgMargin * 10) / 10,
      avgFoodCost: Math.round(avgFoodCost * 10) / 10,
    };
  }, [menuItems, ingredients]);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) return ingredients;
    const query = searchTerm.toLowerCase();
    return ingredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(query) ||
        (ing.notes && ing.notes.toLowerCase().includes(query))
    );
  }, [ingredients, searchTerm]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  // ==========================================
  // INGREDIENT ACTIONS & LIVE MODAL PREVIEW
  // ==========================================
  const openAddIngredientModal = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: "",
      purchaseQuantity: "1",
      purchaseUnit: "kg",
      purchasePrice: "",
      notes: "",
    });
    setIngredientError("");
    setIsIngredientModalOpen(true);
  };

  const openEditIngredientModal = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      purchaseQuantity: ing.purchaseQuantity.toString(),
      purchaseUnit: ing.purchaseUnit as StandardUnit,
      purchasePrice: ing.purchasePrice.toString(),
      notes: ing.notes || "",
    });
    setIngredientError("");
    setIsIngredientModalOpen(true);
  };

  const ingredientModalLiveCost = useMemo(() => {
    const qty = parseFloat(ingredientForm.purchaseQuantity);
    const price = parseFloat(ingredientForm.purchasePrice);
    if (!qty || qty <= 0 || isNaN(price) || price < 0) return null;
    return getStandardCostDisplay(qty, ingredientForm.purchaseUnit, price);
  }, [ingredientForm.purchaseQuantity, ingredientForm.purchaseUnit, ingredientForm.purchasePrice]);

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngredientError("");

    if (!ingredientForm.name.trim()) {
      setIngredientError("Please provide an ingredient name.");
      return;
    }
    const qty = parseFloat(ingredientForm.purchaseQuantity);
    if (isNaN(qty) || qty <= 0) {
      setIngredientError("Purchase quantity must be greater than 0.");
      return;
    }
    const price = parseFloat(ingredientForm.purchasePrice);
    if (isNaN(price) || price < 0) {
      setIngredientError("Purchase price must be 0 or greater.");
      return;
    }

    setSavingIngredient(true);
    try {
      if (editingIngredient) {
        const res = await fetch(`/api/menu-costing/ingredients/${editingIngredient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ingredientForm.name,
            purchaseQuantity: qty,
            purchaseUnit: ingredientForm.purchaseUnit,
            purchasePrice: price,
            notes: ingredientForm.notes,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update ingredient");
        }

        const data = await res.json();
        setIsIngredientModalOpen(false);

        if (data.impactReport && data.impactReport.affectedMenuItemsCount > 0) {
          setImpactReport(data.impactReport);
        }

        await fetchAllData();
      } else {
        const res = await fetch("/api/menu-costing/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ingredientForm.name,
            purchaseQuantity: qty,
            purchaseUnit: ingredientForm.purchaseUnit,
            purchasePrice: price,
            notes: ingredientForm.notes,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create ingredient");
        }

        setIsIngredientModalOpen(false);
        await fetchAllData();
      }
    } catch (err: any) {
      setIngredientError(err.message || "An error occurred while saving.");
    } finally {
      setSavingIngredient(false);
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    if (!confirm(`Are you sure you want to delete "${ing.name}"?`)) return;

    try {
      const res = await fetch(`/api/menu-costing/ingredients/${ing.id}`, {
        method: "DELETE",
      });

      if (res.status === 409) {
        const conflictData = await res.json();
        setInUseConflict({
          isOpen: true,
          ingredientName: ing.name,
          usedInMenuNames: conflictData.usedInMenuNames || [],
        });
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete ingredient");
        return;
      }

      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete ingredient");
    }
  };

  // ==========================================
  // MENU ITEM ACTIONS & RECIPE BUILDER
  // ==========================================
  const openAddDishModal = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      sellingPrice: "",
      category: categories[0] || "",
      description: "",
      ingredients: [],
    });
    setItemError("");
    setIsItemModalOpen(true);
  };

  const openEditDishModal = async (item: MenuItem) => {
    setEditingItem(item);
    setItemError("");

    try {
      const res = await fetch(`/api/menu-costing/menu-items/${item.id}`);
      if (res.ok) {
        const detailed = await res.json();
        setItemForm({
          name: detailed.name,
          sellingPrice: detailed.sellingPrice.toString(),
          category: detailed.category || "",
          description: detailed.description || "",
          ingredients:
            detailed.ingredients && detailed.ingredients.length > 0
              ? detailed.ingredients.map((ing: any) => ({
                  ingredientId: ing.ingredientId,
                  quantity: ing.quantity.toString(),
                  unit: ing.unit,
                }))
              : [],
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsItemModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    const firstIng = ingredients[0];
    if (!firstIng) return;
    const compatibleUnits = getCompatibleUnits(firstIng.purchaseUnit);
    setItemForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredientId: firstIng.id,
          quantity: "",
          unit: compatibleUnits[0] || firstIng.purchaseUnit,
        },
      ],
    }));
  };

  const handleRemoveIngredientRow = (index: number) => {
    setItemForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index),
    }));
  };

  const handleIngredientRowChange = (
    index: number,
    field: "ingredientId" | "quantity" | "unit",
    value: string
  ) => {
    setItemForm((prev) => {
      const updated = [...prev.ingredients];
      const target = { ...updated[index] };

      if (field === "ingredientId") {
        target.ingredientId = value;
        const matchingIng = ingredients.find((i) => i.id === value);
        if (matchingIng) {
          const compatible = getCompatibleUnits(matchingIng.purchaseUnit);
          if (!compatible.includes(target.unit as StandardUnit)) {
            target.unit = compatible[0];
          }
        }
      } else if (field === "quantity") {
        target.quantity = value;
      } else if (field === "unit") {
        target.unit = value;
      }

      updated[index] = target;
      return { ...prev, ingredients: updated };
    });
  };

  // Live Recipe Economics inside Dish Modal
  const itemModalEconomics = useMemo(() => {
    const sellingPrice = parseFloat(itemForm.sellingPrice) || 0;
    const portionCosts: number[] = [];

    itemForm.ingredients.forEach((row) => {
      const ing = ingredients.find((i) => i.id === row.ingredientId);
      const qty = parseFloat(row.quantity as string) || 0;
      if (ing && qty > 0 && row.unit) {
        try {
          const cost = calculatePortionCost(qty, row.unit, ing.costPerBaseUnit, ing.purchaseUnit);
          portionCosts.push(cost);
        } catch {
          portionCosts.push(0);
        }
      }
    });

    return calculateMenuItemEconomics(sellingPrice, portionCosts);
  }, [itemForm.sellingPrice, itemForm.ingredients, ingredients]);

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError("");

    if (!itemForm.name.trim()) {
      setItemError("Dish name is required.");
      return;
    }
    const sellingPrice = parseFloat(itemForm.sellingPrice) || 0;

    setSavingItem(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        sellingPrice,
        category: itemForm.category?.trim() || null,
        description: null, // Dish name is enough
        ingredients: itemForm.ingredients
          .filter((i) => i.ingredientId && parseFloat(i.quantity as string) > 0)
          .map((i) => ({
            ingredientId: i.ingredientId,
            quantity: parseFloat(i.quantity as string),
            unit: i.unit,
          })),
      };

      if (editingItem) {
        const res = await fetch(`/api/menu-costing/menu-items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update dish");
        }
      } else {
        const res = await fetch("/api/menu-costing/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create dish");
        }
      }

      setIsItemModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      setItemError(err.message || "Failed to save dish");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}" and its recipe?`)) return;

    try {
      const res = await fetch(`/api/menu-costing/menu-items/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete dish");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete dish");
    }
  };

  // ==========================================
  // RECIPE SOP STEPS MODAL
  // ==========================================
  const openStepsModal = async (item: MenuItem) => {
    setActiveStepsItem(item);
    setRecipeSteps([]);
    setIsStepsModalOpen(true);

    try {
      const res = await fetch(`/api/menu-costing/menu-items/${item.id}/steps`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setRecipeSteps(data);
        } else {
          setRecipeSteps([
            { stepNumber: 1, instruction: "" },
            { stepNumber: 2, instruction: "" },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
      setRecipeSteps([{ stepNumber: 1, instruction: "" }]);
    }
  };

  const handleAddStep = () => {
    setRecipeSteps((prev) => [
      ...prev,
      { stepNumber: prev.length + 1, instruction: "" },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setRecipeSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  const handleStepInstructionChange = (index: number, text: string) => {
    setRecipeSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], instruction: text };
      return updated;
    });
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === recipeSteps.length - 1)
    ) {
      return;
    }

    setRecipeSteps((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      return copy.map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    });
  };

  const handleSaveSteps = async () => {
    if (!activeStepsItem) return;
    setSavingSteps(true);
    try {
      const validSteps = recipeSteps
        .filter((s) => s.instruction.trim().length > 0)
        .map((s, idx) => ({ stepNumber: idx + 1, instruction: s.instruction.trim() }));

      const res = await fetch(`/api/menu-costing/menu-items/${activeStepsItem.id}/steps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: validSteps }),
      });

      if (!res.ok) {
        throw new Error("Failed to save SOP steps");
      }

      setIsStepsModalOpen(false);
      await fetchAllData();
    } catch (e: any) {
      alert(e.message || "Error saving steps");
    } finally {
      setSavingSteps(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. COMPACT, CLEAN HEADER (Space-saving) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dish Costing & Recipes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Recipe ingredient costs, profit margins & cooking steps
          </p>
        </div>

        {/* Global Action Button (NO double plus) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "items" ? (
            <button
              onClick={openAddDishModal}
              disabled={ingredients.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          ) : (
            <button
              onClick={openAddIngredientModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ingredient</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. COMPACT STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dishes on Menu</span>
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-lg font-black text-slate-900">{summaryMetrics.totalDishes}</div>
          <div className="text-[10px] text-slate-500 font-semibold">{summaryMetrics.completedDishesCount} costed</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Raw Ingredients</span>
            <Layers className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="text-lg font-black text-slate-900">{summaryMetrics.totalIngredients}</div>
          <div className="text-[10px] text-slate-500 font-semibold">Standard unit rates</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Profit Margin</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700">{summaryMetrics.avgGrossMargin}%</div>
          <div className="text-[10px] text-slate-500 font-semibold">Selling price − Cost</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Food Cost</span>
            <Percent className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black text-slate-900">{summaryMetrics.avgFoodCost}%</div>
          <div className="text-[10px] text-slate-500 font-semibold">Benchmark: &lt; 32%</div>
        </div>
      </div>

      {/* 3. CLEAN SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("items")}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "items"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dishes & Recipes ({menuItems.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("ingredients")}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "ingredients"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Raw Ingredients ({ingredients.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 mb-1.5 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Changing ingredient prices automatically updates all dish margins.</span>
        </div>
      </div>

      {/* 4. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "items" ? "Search dishes..." : "Search ingredients..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeTab === "items" && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-0.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Dishes
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. CONTENT */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-700 mb-2" />
          <span className="text-xs font-semibold text-slate-600">Loading Menu Costing...</span>
        </div>
      ) : activeTab === "items" ? (
        /* ========================================================= */
        /* TAB 1: MENU ITEMS & RECIPES (CLEAN, COMPACT CARDS)        */
        /* ========================================================= */
        filteredMenuItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {menuItems.length === 0 ? "No Menu Dishes Yet" : "No Matching Dishes Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
              {menuItems.length === 0
                ? "Add your restaurant dishes with portion recipes to calculate profit margins."
                : "Try clearing your search query."}
            </p>
            {menuItems.length === 0 ? (
              <button
                onClick={openAddDishModal}
                disabled={ingredients.length === 0}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Dish</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredMenuItems.map((item) => {
              const econ = item.economics;
              const isHealthy = econ.foodCostPercent <= 30;
              const isModerate = econ.foodCostPercent > 30 && econ.foodCostPercent <= 40;

              return (
                <div
                  key={item.id}
                  className="bg-slate-100/70 rounded-2xl border-2 border-slate-300/90 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Distinct Card Header */}
                  <div className="bg-white px-3.5 py-2.5 border-b border-slate-200/90 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800 transition truncate">
                        {item.name}
                      </h3>
                      {item.category && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {econ.isComplete ? (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${
                          isHealthy
                            ? "bg-emerald-100/90 text-emerald-900 border-emerald-300"
                            : isModerate
                            ? "bg-amber-100/90 text-amber-900 border-amber-300"
                            : "bg-rose-100/90 text-rose-900 border-rose-300"
                        }`}
                      >
                        {isHealthy ? "🟢 " : isModerate ? "🟡 " : "🔴 "}
                        {econ.grossMarginPercent}% Margin
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 shrink-0">
                        Incomplete Recipe
                      </span>
                    )}
                  </div>

                  {/* Compact Card Body */}
                  <div className="p-3 space-y-2 bg-slate-100/70 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      {/* Selling Price & Making Cost Tiles */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Selling Price */}
                        <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            Selling Price
                          </span>
                          <span className="text-sm font-black text-slate-900 mt-0.5">
                            {formatCurrency(item.sellingPrice)}
                          </span>
                        </div>

                        {/* Making Cost (Prep Cost) */}
                        <div className="bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/90 shadow-2xs flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                            Making Cost
                          </span>
                          <span className="text-sm font-black text-emerald-800 mt-0.5">
                            {econ.isComplete ? formatCurrency(econ.totalIngredientCost) : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Net Profit & Food Cost Line */}
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px] shadow-2xs">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-500">Net Profit:</span>
                          <span
                            className={`font-black ${
                              econ.grossProfit >= 0 ? "text-slate-900" : "text-rose-600"
                            }`}
                          >
                            {econ.isComplete ? formatCurrency(econ.grossProfit) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-slate-500 text-[10px]">
                          <span>{econ.isComplete ? `${econ.foodCostPercent}% Food Cost` : "No Recipe"}</span>
                        </div>
                      </div>

                      {/* Recent Cost Impact Indicator (if ingredient price updated recently) */}
                      {item.lastCostChange !== null &&
                        item.lastCostChange !== undefined &&
                        item.lastCostChange !== 0 && (
                          <div
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] shadow-2xs ${
                              item.lastCostChange > 0
                                ? "bg-amber-50 border-amber-300 text-amber-950"
                                : "bg-emerald-50 border-emerald-300 text-emerald-950"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px]">
                              <div className="flex items-center gap-1 truncate">
                                <span>{item.lastCostChange > 0 ? "📈" : "📉"}</span>
                                <span className="truncate">
                                  Cost {item.lastCostChange > 0 ? "+" : ""}{formatCurrency(item.lastCostChange)}
                                </span>
                                {item.previousCost !== null && item.previousCost !== undefined && (
                                  <span className="text-slate-500 font-medium">
                                    (was {formatCurrency(item.previousCost)})
                                  </span>
                                )}
                              </div>
                              {item.lastCostChangeAt && (
                                <span className="text-[9px] font-medium text-slate-400 shrink-0 ml-1">
                                  {new Date(item.lastCostChangeAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Ingredients & Steps Metadata */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>
                            {item.ingredientCount} {item.ingredientCount === 1 ? "ingredient" : "ingredients"}
                          </span>
                        </div>
                        <span>•</span>
                        <div>
                          <span>{item.stepCount} cooking steps</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => openStepsModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-2xs transition cursor-pointer"
                        title="Cooking SOP Steps"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cooking SOP</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDishModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="Edit Recipe & Cost"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Recipe & Cost</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========================================================= */
        /* TAB 2: INGREDIENTS LIBRARY (CLEAN, SLEEK MODERN TABLE)    */
        /* ========================================================= */
        filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {ingredients.length === 0 ? "No Raw Ingredients Yet" : "No Ingredients Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
              Add your raw kitchen ingredients with bought package and cost.
            </p>
            {ingredients.length === 0 ? (
              <button
                onClick={openAddIngredientModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ingredient</span>
              </button>
            ) : (
              <button
                onClick={() => setSearchTerm("")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3.5">Ingredient Name</th>
                    <th className="py-2.5 px-3.5">Bought Package</th>
                    <th className="py-2.5 px-3.5">Purchase Cost</th>
                    <th className="py-2.5 px-3.5">Unit Rate</th>
                    <th className="py-2.5 px-3.5">Dish Usage</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIngredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {ing.name}
                        </span>
                        {ing.notes && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {ing.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-700">
                        {ing.purchaseQuantity} {ing.purchaseUnit}
                      </td>
                      <td className="py-3 px-3.5 font-extrabold text-slate-900">
                        {formatCurrency(ing.purchasePrice)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block text-[11px]">
                          {ing.standardCostDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {ing.usedInCount > 0 ? (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {ing.usedInCount} {ing.usedInCount === 1 ? "dish" : "dishes"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditIngredientModal(ing)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit Ingredient"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT INGREDIENT (SIMPLE & DIRECT INPUTS)   */}
      {/* ========================================================= */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingIngredient ? "Edit Ingredient" : "Add Raw Ingredient"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  e.g. 1 kg rice @ ₹100, or 500 ml oil @ ₹75
                </p>
              </div>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-4 space-y-3.5">
              {ingredientError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{ingredientError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ingredient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Malai Paneer, Cooking Oil"
                  value={ingredientForm.name}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                />
              </div>

              {/* Purchase Package: Quantity + Unit */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bought Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 1, 5, 500"
                    value={ingredientForm.purchaseQuantity}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({ ...prev, purchaseQuantity: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ingredientForm.purchaseUnit}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({
                        ...prev,
                        purchaseUnit: e.target.value as StandardUnit,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Price (step="any" so any manual number is accepted without 'nearest value' errors) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Total Price Paid (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 100 or 320"
                    value={ingredientForm.purchasePrice}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({ ...prev, purchasePrice: e.target.value }))
                    }
                    required
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold text-sm"
                  />
                </div>
              </div>

              {/* LIVE UNIT RATE PREVIEW */}
              {ingredientModalLiveCost && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">
                    Unit Rate:
                  </span>
                  <span className="font-black text-emerald-900 text-sm">
                    {ingredientModalLiveCost.primary}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Supplier / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local vendor, Brand"
                  value={ingredientForm.notes}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              {editingIngredient && editingIngredient.usedInCount > 0 && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                  <span>
                    Used in {editingIngredient.usedInCount} dishes. Price changes trigger an Impact Report.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIngredient}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingIngredient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Ingredient</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INGREDIENT PRICE IMPACT REPORT DIALOG            */}
      {/* ========================================================= */}
      {impactReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <span>Price Impact Report: {impactReport.ingredientName}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {formatCurrency(impactReport.oldPurchasePrice)} → {formatCurrency(impactReport.newPurchasePrice)} / {impactReport.newPurchaseUnit} ({impactReport.affectedMenuItemsCount} dishes affected)
                </p>
              </div>
              <button
                onClick={() => setImpactReport(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-amber-700" />
                <span>Selling prices stay unchanged. See updated dish prep costs and margins below:</span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Dish</th>
                      <th className="py-2 px-3">Prep Cost</th>
                      <th className="py-2 px-3">Cost Change</th>
                      <th className="py-2 px-3">Margin %</th>
                      <th className="py-2 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {impactReport.affectedItems.map((item) => (
                      <tr key={item.menuItemId} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <span className="font-extrabold text-slate-900 block">{item.menuItemName}</span>
                          <span className="text-[10px] text-slate-400">Sell at {formatCurrency(item.sellingPrice)}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {formatCurrency(item.oldTotalCost)} → <span className="font-bold text-slate-900">{formatCurrency(item.newTotalCost)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              item.costChange > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.costChange > 0 ? "+" : ""}{formatCurrency(item.costChange)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span className="text-slate-400">{item.oldGrossMarginPercent}%</span> →{" "}
                          <span className={item.newGrossMarginPercent < item.oldGrossMarginPercent ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                            {item.newGrossMarginPercent}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.newGrossProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setImpactReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: IN-USE DELETION CONFLICT DIALOG                  */}
      {/* ========================================================= */}
      {inUseConflict && inUseConflict.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2.5 bg-amber-50 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0" />
              <div>
                <h3 className="text-sm font-black">Cannot Delete Ingredient</h3>
                <p className="text-xs text-amber-700">Currently in use by active recipes</p>
              </div>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <p className="text-slate-600">
                <strong>&quot;{inUseConflict.ingredientName}&quot;</strong> is used in these dishes:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto space-y-1">
                {inUseConflict.usedInMenuNames.map((name, i) => (
                  <div key={i} className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setInUseConflict(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RECIPE BUILDER (SLEEK, CLEAN & INTUITIVE)        */}
      {/* ========================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? `Edit Recipe: ${editingItem.name}` : "Create Dish Recipe"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set dish name, price & ingredients per serving
                </p>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto p-4 space-y-4">
              {itemError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{itemError}</span>
                </div>
              )}

              {/* Dish Name & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dish Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Butter Masala"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 280"
                      value={itemForm.sellingPrice}
                      onChange={(e) =>
                        setItemForm((p) => ({ ...p, sellingPrice: e.target.value }))
                      }
                      required
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Dropdown Suggestions + Free Typing */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category (Select existing or type new)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Select or type new category..."
                    value={itemForm.category}
                    onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                  />
                  <datalist id="category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>

                  {/* Quick-select chips */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-bold">Existing:</span>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setItemForm((p) => ({ ...p, category: cat }))}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                            itemForm.category === cat
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipe Ingredients Section */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Recipe Ingredients (1 Serving)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                {itemForm.ingredients.length === 0 ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50/60">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                      <Layers className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">No ingredients added yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-3">Add the ingredients used to prepare one serving of this dish</p>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-700/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Ingredient</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {itemForm.ingredients.map((row, idx) => {
                      const selectedIng = ingredients.find((i) => i.id === row.ingredientId);
                      const compatibleUnits = selectedIng
                        ? getCompatibleUnits(selectedIng.purchaseUnit)
                        : ["kg", "g", "L", "ml", "pcs"];

                      let portionCost = 0;
                      if (selectedIng && parseFloat(row.quantity as string) > 0) {
                        try {
                          portionCost = calculatePortionCost(
                            parseFloat(row.quantity as string),
                            row.unit,
                            selectedIng.costPerBaseUnit,
                            selectedIng.purchaseUnit
                          );
                        } catch {
                          portionCost = 0;
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-2"
                        >
                          {/* Ingredient Select */}
                          <div className="flex-1 w-full sm:w-auto">
                            <select
                              value={row.ingredientId}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "ingredientId", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 font-semibold text-slate-900 focus:outline-none"
                            >
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.standardCostDisplay})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="w-full sm:w-24">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "quantity", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none"
                            />
                          </div>

                          {/* Unit */}
                          <div className="w-full sm:w-20">
                            <select
                              value={row.unit}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "unit", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 font-bold focus:outline-none"
                            >
                              {compatibleUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Portion Cost */}
                          <div className="w-full sm:w-24 text-right font-black text-xs text-slate-900 shrink-0">
                            {formatCurrency(portionCost)}
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LIVE MARGIN & SUMMARY BANNER */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">Financial Summary</span>
                  {itemModalEconomics.hasSellingPrice && itemModalEconomics.totalIngredientCost > 0 ? (
                    <span
                      className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                        itemModalEconomics.foodCostPercent <= 30
                          ? "bg-emerald-500/20 text-emerald-300"
                          : itemModalEconomics.foodCostPercent <= 40
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {itemModalEconomics.foodCostPercent}% Food Cost
                    </span>
                  ) : (
                    <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                      Live Preview
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Prep Cost</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {formatCurrency(itemModalEconomics.totalIngredientCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">You Make</span>
                    <span className="font-black text-white text-sm">
                      {formatCurrency(itemModalEconomics.grossProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Margin</span>
                    <span className="font-black text-emerald-300 text-sm">
                      {itemModalEconomics.grossMarginPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingItem ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Dish Recipe</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: COOKING SOP STEPS MODAL                          */}
      {/* ========================================================= */}
      {isStepsModalOpen && activeStepsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Cooking SOP: {activeStepsItem.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Step-by-step instructions for kitchen staff
                </p>
              </div>
              <button
                onClick={() => setIsStepsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {recipeSteps.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500">
                  No cooking steps added yet.
                </div>
              ) : (
                recipeSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Step {step.stepNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move step up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "down")}
                          disabled={idx === recipeSteps.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move step down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder={`Step ${step.stepNumber} instruction...`}
                      value={step.instruction}
                      onChange={(e) => handleStepInstructionChange(idx, e.target.value)}
                      className="w-full p-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 resize-none font-medium"
                    />
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={handleAddStep}
                className="w-full py-2 rounded-xl border border-dashed border-emerald-400/80 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Next Step</span>
              </button>
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsStepsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSteps}
                disabled={savingSteps}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingSteps ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Cooking SOP</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
