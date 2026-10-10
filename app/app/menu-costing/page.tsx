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
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  BookOpen,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  X,
  Loader2,
  Percent,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
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
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

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
        // PUT update
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

        // Check if price changed and affected recipes
        if (data.impactReport && data.impactReport.affectedMenuItemsCount > 0) {
          setImpactReport(data.impactReport);
        }

        await fetchAllData();
      } else {
        // POST create
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
      category: "",
      description: "",
      ingredients: [
        {
          ingredientId: ingredients[0]?.id || "",
          quantity: "100",
          unit: ingredients[0] ? getCompatibleUnits(ingredients[0].purchaseUnit)[0] : "g",
        },
      ],
    });
    setItemError("");
    setIsItemModalOpen(true);
  };

  const openEditDishModal = async (item: MenuItem) => {
    setEditingItem(item);
    setItemError("");

    // Fetch full details with recipe rows
    try {
      const res = await fetch(`/api/menu-costing/menu-items/${item.id}`);
      if (res.ok) {
        const detailed = await res.json();
        setItemForm({
          name: detailed.name,
          sellingPrice: detailed.sellingPrice.toString(),
          category: detailed.category || "",
          description: detailed.description || "",
          ingredients: detailed.ingredients && detailed.ingredients.length > 0
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
          quantity: "100",
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
          // If current unit is incompatible, reset to first compatible unit
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
        name: itemForm.name,
        sellingPrice,
        category: itemForm.category,
        description: itemForm.description,
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
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Menu Engineering & Costing
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Portion Accuracy & Margin Protection
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dish Costing & Recipes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Calculate exact dish prep costs, gross profit margins, preparation SOP steps, and simulate price changes instantly.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {activeTab === "items" ? (
            <button
              onClick={openAddDishModal}
              disabled={ingredients.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dish Recipe</span>
            </button>
          ) : (
            <button
              onClick={openAddIngredientModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Raw Ingredient</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menu Dishes</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {summaryMetrics.totalDishes}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {summaryMetrics.completedDishesCount} fully costed
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ingredients Library</span>
            <Layers className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {summaryMetrics.totalIngredients}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Standard unit conversions
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {summaryMetrics.avgGrossMargin}%
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Selling price - Portion cost
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Food Cost %</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {summaryMetrics.avgFoodCost}%
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Target benchmark: &lt; 32%
          </div>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("items")}
            className={`pb-3 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "items"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dishes & Recipes ({menuItems.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("ingredients")}
            className={`pb-3 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "ingredients"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Raw Ingredients ({ingredients.length})</span>
          </button>
        </div>

        {/* Quick hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mb-2">
          <Info className="w-3.5 h-3.5" />
          <span>Updating an ingredient price immediately recalculates all affected dish margins.</span>
        </div>
      </div>

      {/* 4. FILTERS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "items" ? "Search dishes..." : "Search ingredients..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-slate-900 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab === "items" && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

      {/* 5. LOADING SPINNER */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
          <span className="text-xs font-semibold text-slate-600">Loading Menu Costing & Recipes...</span>
        </div>
      ) : activeTab === "items" ? (
        /* ========================================================= */
        /* TAB 1: MENU ITEMS & RECIPES CARDS GRID                    */
        /* ========================================================= */
        filteredMenuItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {menuItems.length === 0 ? "No Menu Items Costed Yet" : "No Matching Dishes Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {menuItems.length === 0
                ? "Start adding your restaurant dishes with recipe ingredients to unlock gross margins, food cost % and price change impact analysis."
                : "Try clearing your search query or selecting a different category."}
            </p>
            {menuItems.length === 0 ? (
              <button
                onClick={openAddDishModal}
                disabled={ingredients.length === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Your First Dish</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            {ingredients.length === 0 && menuItems.length === 0 && (
              <p className="text-[11px] text-amber-700 font-semibold mt-3">
                💡 Tip: Add your raw ingredients first in the &quot;Ingredients Library&quot; tab.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMenuItems.map((item) => {
              const econ = item.economics;
              // Food cost health status
              const isHealthy = econ.foodCostPercent <= 30;
              const isModerate = econ.foodCostPercent > 30 && econ.foodCostPercent <= 40;
              const isHigh = econ.foodCostPercent > 40;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Title, Category, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        {item.category && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-200/60">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-800 transition truncate">
                          {item.name}
                        </h3>
                      </div>

                      {econ.isComplete ? (
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                            isHealthy
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isModerate
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {isHealthy ? "🟢 " : isModerate ? "🟡 " : "🔴 "}
                          {econ.foodCostPercent}% Food Cost
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Incomplete Recipe
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Financial Economics Grid */}
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Selling Price
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {formatCurrency(item.sellingPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kitchen Prep Cost
                          </span>
                          <span className="text-sm font-black text-emerald-800">
                            {econ.isComplete ? formatCurrency(econ.totalIngredientCost) : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            You Keep (Profit)
                          </span>
                          <span
                            className={`text-sm font-black ${
                              econ.grossProfit >= 0 ? "text-slate-900" : "text-rose-600"
                            }`}
                          >
                            {econ.isComplete ? formatCurrency(econ.grossProfit) : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Profit Margin
                          </span>
                          <span
                            className={`text-sm font-black ${
                              econ.grossMarginPercent >= 60
                                ? "text-emerald-700"
                                : econ.grossMarginPercent >= 50
                                ? "text-amber-700"
                                : "text-rose-600"
                            }`}
                          >
                            {econ.isComplete ? `${econ.grossMarginPercent}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recipe & SOP summary pills */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {item.ingredientCount} {item.ingredientCount === 1 ? "ingredient" : "ingredients"}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        {item.stepCount} {item.stepCount === 1 ? "step" : "steps"}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openStepsModal(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="View & Edit Preparation SOP Steps"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Cooking SOP ({item.stepCount})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditDishModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Edit Dish Recipe & Selling Price"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Recipe & Cost</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========================================================= */
        /* TAB 2: INGREDIENTS LIBRARY LIST                           */
        /* ========================================================= */
        filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {ingredients.length === 0 ? "No Raw Ingredients Added Yet" : "No Ingredients Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {ingredients.length === 0
                ? "Add your raw ingredients (like Paneer, Butter, Cooking Oil, Vegetables) with purchase quantities and prices to establish base unit rates."
                : "No ingredients match your search query."}
            </p>
            {ingredients.length === 0 ? (
              <button
                onClick={openAddIngredientModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Raw Ingredient</span>
              </button>
            ) : (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
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
                    <th className="py-3 px-4">Ingredient Name</th>
                    <th className="py-3 px-4">Bought Package</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">Unit Rate</th>
                    <th className="py-3 px-4">Dish Usage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIngredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {ing.name}
                        </span>
                        {ing.notes && (
                          <span className="text-[11px] text-slate-400 block line-clamp-1">
                            {ing.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {ing.purchaseQuantity} {ing.purchaseUnit}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatCurrency(ing.purchasePrice)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block">
                          {ing.standardCostDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {ing.usedInCount > 0 ? (
                          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            Used in {ing.usedInCount} {ing.usedInCount === 1 ? "recipe" : "recipes"}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
      {/* MODAL 1: ADD / EDIT INGREDIENT MODAL                       */}
      {/* ========================================================= */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingIngredient ? "Edit Raw Ingredient" : "Add New Raw Ingredient"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set purchase packaging & price for standard unit conversion.
                </p>
              </div>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-5 space-y-4">
              {ingredientError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
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
                  placeholder="e.g. Malai Paneer, Cooking Oil, Tomatoes"
                  value={ingredientForm.name}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Purchase Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="e.g. 1, 5, 500"
                    value={ingredientForm.purchaseQuantity}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({ ...prev, purchaseQuantity: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Purchase Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ingredientForm.purchaseUnit}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({
                        ...prev,
                        purchaseUnit: e.target.value as StandardUnit,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Purchase Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 240.00"
                    value={ingredientForm.purchasePrice}
                    onChange={(e) =>
                      setIngredientForm((prev) => ({ ...prev, purchasePrice: e.target.value }))
                    }
                    required
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* LIVE UNIT COST PREVIEW */}
              {ingredientModalLiveCost && (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Calculated Unit Cost
                    </span>
                    <span className="text-sm font-black text-emerald-900">
                      {ingredientModalLiveCost.primary}
                    </span>
                  </div>
                  {ingredientModalLiveCost.secondary && (
                    <span className="text-[11px] font-extrabold text-emerald-700">
                      {ingredientModalLiveCost.secondary}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Optional Supplier / Brand Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amul Dairy supplier, Pack of 5L"
                  value={ingredientForm.notes}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              {editingIngredient && editingIngredient.usedInCount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>
                    Used in {editingIngredient.usedInCount} recipe(s). Changing this price will trigger the Price Impact Report.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIngredient}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
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
      {/* MODAL 2: INGREDIENT PRICE CHANGE IMPACT REPORT DIALOG      */}
      {/* ========================================================= */}
      {impactReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-400/30">
                  Live Financial Simulation
                </span>
                <h3 className="text-base font-black">
                  Ingredient Price Impact Report
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Price change on <strong>{impactReport.ingredientName}</strong> has been recalculated across all recipes.
                </p>
              </div>
              <button
                onClick={() => setImpactReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Old Purchase Price
                  </span>
                  <span className="text-sm font-black text-slate-700">
                    {formatCurrency(impactReport.oldPurchasePrice)} / {impactReport.oldPurchaseUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    New Purchase Price
                  </span>
                  <span className="text-sm font-black text-emerald-800">
                    {formatCurrency(impactReport.newPurchasePrice)} / {impactReport.newPurchaseUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dishes Affected
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {impactReport.affectedMenuItemsCount} {impactReport.affectedMenuItemsCount === 1 ? "dish" : "dishes"}
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  Selling prices have remained untouched. Observe how dish prep costs and margins have shifted below:
                </span>
              </div>

              {/* Impact Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Affected Dish</th>
                        <th className="py-2.5 px-3">Prep Cost</th>
                        <th className="py-2.5 px-3">Cost Change</th>
                        <th className="py-2.5 px-3">Gross Margin</th>
                        <th className="py-2.5 px-3 text-right">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {impactReport.affectedItems.map((item) => {
                        const isCostIncreased = item.costChange > 0;
                        const isCostDecreased = item.costChange < 0;

                        return (
                          <tr key={item.menuItemId} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-900 block">
                                {item.menuItemName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Selling at {formatCurrency(item.sellingPrice)}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-semibold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span className="line-through text-slate-400">
                                  {formatCurrency(item.oldTotalCost)}
                                </span>
                                <span>&rarr;</span>
                                <span className="font-black text-slate-900">
                                  {formatCurrency(item.newTotalCost)}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                  isCostIncreased
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : isCostDecreased
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isCostIncreased ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : isCostDecreased ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {isCostIncreased ? "+" : ""}
                                {formatCurrency(item.costChange)} ({item.costChangePercent > 0 ? "+" : ""}
                                {item.costChangePercent}%)
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1 text-[11px] font-bold">
                                <span className="text-slate-400">{item.oldGrossMarginPercent}%</span>
                                <span>&rarr;</span>
                                <span
                                  className={
                                    item.newGrossMarginPercent < item.oldGrossMarginPercent
                                      ? "text-rose-600 font-extrabold"
                                      : "text-emerald-700 font-extrabold"
                                  }
                                >
                                  {item.newGrossMarginPercent}%
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="text-[11px] font-bold">
                                <span className="text-slate-400">{formatCurrency(item.oldGrossProfit)}</span>
                                <span className="mx-1">&rarr;</span>
                                <span className="text-slate-900 font-black">
                                  {formatCurrency(item.newGrossProfit)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                onClick={() => setImpactReport(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Done & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: IN-USE DELETION CONFLICT DIALOG                   */}
      {/* ========================================================= */}
      {inUseConflict && inUseConflict.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-amber-50 text-amber-900">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">Cannot Delete Ingredient</h3>
                <p className="text-xs text-amber-700">Currently in use by active dish recipes</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>&quot;{inUseConflict.ingredientName}&quot;</strong> is actively linked to the following recipe(s). To protect recipe costing data integrity, remove it from these dishes first before deleting:
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                {inUseConflict.usedInMenuNames.map((name, i) => (
                  <div key={i} className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setInUseConflict(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close & Keep Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD / EDIT DISH & RECIPE BUILDER MODAL            */}
      {/* ========================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? `Edit Recipe: ${editingItem.name}` : "Create New Dish Recipe"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define ingredients per single serving & live margin economics.
                </p>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto p-5 space-y-5">
              {itemError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{itemError}</span>
                </div>
              )}

              {/* Basic Dish Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dish Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Butter Masala, Cold Coffee"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mains, Starters"
                    value={itemForm.category}
                    onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      step="0.01"
                      min="0"
                      placeholder="e.g. 280.00"
                      value={itemForm.sellingPrice}
                      onChange={(e) =>
                        setItemForm((p) => ({ ...p, sellingPrice: e.target.value }))
                      }
                      required
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Signature cottage cheese in creamy tomato gravy"
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>
              </div>

              {/* RECIPE INGREDIENTS BUILDER */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Recipe Ingredients (Per Serving)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Select ingredients and specify portion sizes. Units are constrained to compatible categories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                {itemForm.ingredients.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                    <p className="text-xs text-slate-500 mb-2">
                      No ingredients added to this dish yet.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                    >
                      + Add First Ingredient
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                          className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-2.5"
                        >
                          {/* Ingredient Select */}
                          <div className="flex-1 w-full sm:w-auto">
                            <select
                              value={row.ingredientId}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "ingredientId", e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold text-slate-900"
                            >
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.standardCostDisplay})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity Input */}
                          <div className="w-full sm:w-28">
                            <input
                              type="number"
                              step="0.01"
                              min="0.001"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "quantity", e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-900 font-semibold"
                            />
                          </div>

                          {/* Unit Select (strictly compatible) */}
                          <div className="w-full sm:w-24">
                            <select
                              value={row.unit}
                              onChange={(e) =>
                                handleIngredientRowChange(idx, "unit", e.target.value)
                              }
                              className="w-full px-2 py-2 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-900 font-bold"
                            >
                              {compatibleUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Live Portion Cost Badge */}
                          <div className="w-full sm:w-28 text-right font-black text-xs text-slate-900 shrink-0">
                            {formatCurrency(portionCost)}
                          </div>

                          {/* Delete row */}
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove Ingredient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LIVE MARGIN & FINANCIAL PREVIEW BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Live Financial Preview
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      itemModalEconomics.foodCostPercent <= 30
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : itemModalEconomics.foodCostPercent <= 40
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                    }`}
                  >
                    {itemModalEconomics.foodCostPercent}% Food Cost
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-1 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Prep Cost</span>
                    <span className="text-base font-black text-emerald-400">
                      {formatCurrency(itemModalEconomics.totalIngredientCost)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross Profit</span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(itemModalEconomics.grossProfit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross Margin</span>
                    <span className="text-base font-black text-emerald-300">
                      {itemModalEconomics.grossMarginPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {savingItem ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Dish...</span>
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
      {/* MODAL 5: RECIPE PREPARATION SOP STEPS MODAL                */}
      {/* ========================================================= */}
      {isStepsModalOpen && activeStepsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-200">
                  Kitchen SOP Standard
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Preparation SOP: {activeStepsItem.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered instructions for kitchen staff to ensure taste and consistency.
                </p>
              </div>
              <button
                onClick={() => setIsStepsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {recipeSteps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No steps defined yet.
                </div>
              ) : (
                recipeSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg">
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
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder={`Describe step ${step.stepNumber}...`}
                      value={step.instruction}
                      onChange={(e) => handleStepInstructionChange(idx, e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 resize-none font-medium"
                    />
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={handleAddStep}
                className="w-full py-2.5 rounded-xl border border-dashed border-emerald-400/80 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Next Step</span>
              </button>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsStepsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSteps}
                disabled={savingSteps}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {savingSteps ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving SOP...</span>
                  </>
                ) : (
                  <span>Save Preparation SOP</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
