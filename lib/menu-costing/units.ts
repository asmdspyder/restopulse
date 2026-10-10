/**
 * Menu Costing Unit Conversion and Calculation Utilities
 * 
 * Measurement Categories:
 * 1. Weight: kg, g (Base unit: g, 1 kg = 1000 g)
 * 2. Volume: L, ml (Base unit: ml, 1 L = 1000 ml)
 * 3. Count: pcs (Base unit: pcs, 1 pcs = 1 pcs)
 * 
 * Rules:
 * - Conversions between different measurement categories (e.g. Weight to Volume)
 *   are strictly disallowed to prevent incorrect costing.
 */

export type MeasurementCategory = "weight" | "volume" | "count";

export type StandardUnit = "kg" | "g" | "L" | "ml" | "pcs";

export interface UnitDefinition {
  symbol: StandardUnit;
  label: string;
  category: MeasurementCategory;
  toBaseFactor: number; // Multiplier to convert to category base unit (g, ml, or pcs)
}

export const SUPPORTED_UNITS: Record<StandardUnit, UnitDefinition> = {
  kg: { symbol: "kg", label: "Kilogram (kg)", category: "weight", toBaseFactor: 1000 },
  g: { symbol: "g", label: "Gram (g)", category: "weight", toBaseFactor: 1 },
  L: { symbol: "L", label: "Litre (L)", category: "volume", toBaseFactor: 1000 },
  ml: { symbol: "ml", label: "Millilitre (ml)", category: "volume", toBaseFactor: 1 },
  pcs: { symbol: "pcs", label: "Piece (pcs)", category: "count", toBaseFactor: 1 },
};

export const UNIT_OPTIONS: Array<{ value: StandardUnit; label: string; category: MeasurementCategory }> = [
  { value: "kg", label: "Kilogram (kg)", category: "weight" },
  { value: "g", label: "Gram (g)", category: "weight" },
  { value: "L", label: "Litre (L)", category: "volume" },
  { value: "ml", label: "Millilitre (ml)", category: "volume" },
  { value: "pcs", label: "Piece (pcs)", category: "count" },
];

/**
 * Normalizes unit string to standard unit symbol
 */
export function normalizeUnit(rawUnit: string): StandardUnit | null {
  if (!rawUnit) return null;
  const cleaned = rawUnit.trim().toLowerCase();
  if (cleaned === "kg" || cleaned === "kilogram" || cleaned === "kilograms") return "kg";
  if (cleaned === "g" || cleaned === "gram" || cleaned === "grams") return "g";
  if (cleaned === "l" || cleaned === "litre" || cleaned === "liter" || cleaned === "litres" || cleaned === "liters") return "L";
  if (cleaned === "ml" || cleaned === "millilitre" || cleaned === "milliliter" || cleaned === "millilitres" || cleaned === "milliliters") return "ml";
  if (cleaned === "pcs" || cleaned === "pc" || cleaned === "piece" || cleaned === "pieces") return "pcs";
  return null;
}

/**
 * Returns the measurement category for a unit
 */
export function getMeasurementCategory(unit: string): MeasurementCategory | null {
  const norm = normalizeUnit(unit);
  if (!norm) return null;
  return SUPPORTED_UNITS[norm].category;
}

/**
 * Returns compatible units for a given unit or category
 */
export function getCompatibleUnits(unitOrCategory: string): StandardUnit[] {
  const norm = normalizeUnit(unitOrCategory);
  const category = norm ? SUPPORTED_UNITS[norm].category : (unitOrCategory as MeasurementCategory);

  if (category === "weight") return ["kg", "g"];
  if (category === "volume") return ["L", "ml"];
  if (category === "count") return ["pcs"];
  return ["kg", "g", "L", "ml", "pcs"];
}

/**
 * Checks whether two units belong to the same measurement category
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const catA = getMeasurementCategory(unitA);
  const catB = getMeasurementCategory(unitB);
  if (!catA || !catB) return false;
  return catA === catB;
}

/**
 * Converts a quantity to its measurement category base unit (g, ml, or pcs)
 */
export function convertToBaseUnits(quantity: number, unit: string): number {
  const norm = normalizeUnit(unit);
  if (!norm) {
    throw new Error(`Unsupported measurement unit: ${unit}`);
  }
  const factor = SUPPORTED_UNITS[norm].toBaseFactor;
  return quantity * factor;
}

/**
 * Converts a base quantity (g, ml, pcs) to target unit
 */
export function convertFromBaseUnits(baseQuantity: number, targetUnit: string): number {
  const norm = normalizeUnit(targetUnit);
  if (!norm) {
    throw new Error(`Unsupported measurement unit: ${targetUnit}`);
  }
  const factor = SUPPORTED_UNITS[norm].toBaseFactor;
  return baseQuantity / factor;
}

/**
 * Calculates cost per category base unit (cost per gram, cost per ml, or cost per piece)
 */
export function calculateCostPerBaseUnit(
  purchaseQuantity: number,
  purchaseUnit: string,
  purchasePrice: number
): number {
  if (purchaseQuantity <= 0) return 0;
  if (purchasePrice < 0) return 0;

  const baseQuantity = convertToBaseUnits(purchaseQuantity, purchaseUnit);
  if (baseQuantity <= 0) return 0;

  return purchasePrice / baseQuantity;
}

/**
 * Calculates portion cost for a recipe ingredient
 */
export function calculatePortionCost(
  recipeQuantity: number,
  recipeUnit: string,
  costPerBaseUnit: number,
  purchaseUnit: string
): number {
  if (recipeQuantity <= 0 || costPerBaseUnit <= 0) return 0;

  if (!areUnitsCompatible(recipeUnit, purchaseUnit)) {
    throw new Error(
      `Cannot convert between incompatible units: recipe unit "${recipeUnit}" and purchase unit "${purchaseUnit}"`
    );
  }

  const recipeBaseQuantity = convertToBaseUnits(recipeQuantity, recipeUnit);
  return Number((recipeBaseQuantity * costPerBaseUnit).toFixed(4));
}

/**
 * Formats cost per standard display unit (e.g. ₹120/kg, ₹160/L, ₹5/piece)
 */
export function getStandardCostDisplay(
  purchaseQuantity: number,
  purchaseUnit: string,
  purchasePrice: number
): {
  primary: string;
  secondary?: string;
  ratePerStandardUnit: number;
  standardUnit: string;
} {
  const norm = normalizeUnit(purchaseUnit);
  if (!norm || purchaseQuantity <= 0 || purchasePrice < 0) {
    return { primary: "₹0", ratePerStandardUnit: 0, standardUnit: purchaseUnit };
  }

  const costPerBase = calculateCostPerBaseUnit(purchaseQuantity, purchaseUnit, purchasePrice);
  const category = SUPPORTED_UNITS[norm].category;

  if (category === "weight") {
    const costPerKg = costPerBase * 1000;
    const costPerGram = costPerBase;
    return {
      primary: `₹${costPerKg.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: costPerKg % 1 === 0 ? 0 : 2 })} / kg`,
      secondary: `₹${costPerGram.toFixed(4)} / g`,
      ratePerStandardUnit: costPerKg,
      standardUnit: "kg",
    };
  }

  if (category === "volume") {
    const costPerLitre = costPerBase * 1000;
    const costPerMl = costPerBase;
    return {
      primary: `₹${costPerLitre.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: costPerLitre % 1 === 0 ? 0 : 2 })} / L`,
      secondary: `₹${costPerMl.toFixed(4)} / ml`,
      ratePerStandardUnit: costPerLitre,
      standardUnit: "L",
    };
  }

  // Count
  const costPerPiece = costPerBase;
  return {
    primary: `₹${costPerPiece.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: costPerPiece % 1 === 0 ? 0 : 2 })} / piece`,
    ratePerStandardUnit: costPerPiece,
    standardUnit: "pcs",
  };
}

/**
 * Calculates complete menu item financial economics
 */
export interface MenuItemEconomics {
  totalIngredientCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  foodCostPercent: number;
  isComplete: boolean;
  hasSellingPrice: boolean;
}

export function calculateMenuItemEconomics(
  sellingPrice: number,
  ingredientPortionCosts: number[]
): MenuItemEconomics {
  const totalIngredientCost = Number(
    ingredientPortionCosts.reduce((sum, cost) => sum + cost, 0).toFixed(2)
  );

  const isComplete = ingredientPortionCosts.length > 0;
  const hasSellingPrice = sellingPrice > 0;

  const grossProfit = Number((sellingPrice - totalIngredientCost).toFixed(2));

  let grossMarginPercent = 0;
  let foodCostPercent = 0;

  if (hasSellingPrice) {
    grossMarginPercent = Number((((sellingPrice - totalIngredientCost) / sellingPrice) * 100).toFixed(1));
    foodCostPercent = Number(((totalIngredientCost / sellingPrice) * 100).toFixed(1));
  }

  return {
    totalIngredientCost,
    grossProfit,
    grossMarginPercent,
    foodCostPercent,
    isComplete,
    hasSellingPrice,
  };
}
