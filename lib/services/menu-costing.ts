import { db } from "@/lib/db";
import {
  ingredients,
  menuItems,
  menuItemIngredients,
  menuItemSteps,
} from "@/lib/db/schema";
import { eq, and, desc, asc, sql, ilike, inArray } from "drizzle-orm";
import {
  StandardUnit,
  normalizeUnit,
  areUnitsCompatible,
  calculateCostPerBaseUnit,
  calculatePortionCost,
  getStandardCostDisplay,
  calculateMenuItemEconomics,
  MenuItemEconomics,
} from "@/lib/menu-costing/units";

export interface IngredientInput {
  name: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  purchasePrice: number;
  notes?: string;
}

export interface MenuItemIngredientInput {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface MenuItemStepInput {
  stepNumber: number;
  instruction: string;
}

export interface MenuItemInput {
  name: string;
  sellingPrice: number;
  category?: string;
  description?: string;
  isActive?: boolean;
  ingredients?: MenuItemIngredientInput[];
  steps?: MenuItemStepInput[];
}

export interface ImpactReportItem {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  oldTotalCost: number;
  newTotalCost: number;
  costChange: number; // positive = increased cost, negative = decreased cost
  costChangePercent: number;
  oldGrossProfit: number;
  newGrossProfit: number;
  oldGrossMarginPercent: number;
  newGrossMarginPercent: number;
}

export interface IngredientImpactReport {
  ingredientId: string;
  ingredientName: string;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldPurchaseUnit: string;
  newPurchaseUnit: string;
  affectedMenuItemsCount: number;
  affectedItems: ImpactReportItem[];
}

/**
 * Get all ingredients for a restaurant, with usage count in recipes
 */
export async function getIngredients(restaurantId: string, search?: string) {
  const whereConditions = [eq(ingredients.restaurantId, restaurantId)];

  if (search && search.trim()) {
    whereConditions.push(ilike(ingredients.name, `%${search.trim()}%`));
  }

  const list = await db
    .select({
      id: ingredients.id,
      restaurantId: ingredients.restaurantId,
      name: ingredients.name,
      purchaseQuantity: ingredients.purchaseQuantity,
      purchaseUnit: ingredients.purchaseUnit,
      purchasePrice: ingredients.purchasePrice,
      costPerBaseUnit: ingredients.costPerBaseUnit,
      notes: ingredients.notes,
      createdAt: ingredients.createdAt,
      updatedAt: ingredients.updatedAt,
      usedInCount: sql<number>`cast(count(distinct ${menuItemIngredients.menuItemId}) as integer)`,
    })
    .from(ingredients)
    .leftJoin(
      menuItemIngredients,
      eq(ingredients.id, menuItemIngredients.ingredientId)
    )
    .where(and(...whereConditions))
    .groupBy(ingredients.id)
    .orderBy(asc(ingredients.name));

  return list.map((item) => {
    const qty = Number(item.purchaseQuantity);
    const price = Number(item.purchasePrice);
    const unit = item.purchaseUnit;
    const display = getStandardCostDisplay(qty, unit, price);

    return {
      ...item,
      purchaseQuantity: qty,
      purchasePrice: price,
      costPerBaseUnit: Number(item.costPerBaseUnit),
      usedInCount: Number(item.usedInCount || 0),
      standardCostDisplay: display.primary,
      standardUnit: display.standardUnit,
      ratePerStandardUnit: display.ratePerStandardUnit,
    };
  });
}

/**
 * Create a new ingredient
 */
export async function createIngredient(
  restaurantId: string,
  input: IngredientInput
) {
  const normUnit = normalizeUnit(input.purchaseUnit);
  if (!normUnit) {
    throw new Error(`Invalid measurement unit: ${input.purchaseUnit}`);
  }

  const quantity = Number(input.purchaseQuantity);
  const price = Number(input.purchasePrice);

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Purchase quantity must be greater than 0");
  }
  if (isNaN(price) || price < 0) {
    throw new Error("Purchase price must be 0 or greater");
  }

  const costPerBaseUnit = calculateCostPerBaseUnit(quantity, normUnit, price);

  const [created] = await db
    .insert(ingredients)
    .values({
      restaurantId,
      name: input.name.trim(),
      purchaseQuantity: quantity.toFixed(3),
      purchaseUnit: normUnit,
      purchasePrice: price.toFixed(2),
      costPerBaseUnit: costPerBaseUnit.toFixed(6),
      notes: input.notes?.trim() || null,
    })
    .returning();

  return created;
}

/**
 * Update an ingredient and compute price change impact report on affected dishes
 */
export async function updateIngredient(
  restaurantId: string,
  id: string,
  input: IngredientInput
): Promise<{ ingredient: any; impactReport: IngredientImpactReport | null }> {
  const [existing] = await db
    .select()
    .from(ingredients)
    .where(and(eq(ingredients.id, id), eq(ingredients.restaurantId, restaurantId)));

  if (!existing) {
    throw new Error("Ingredient not found");
  }

  const normUnit = normalizeUnit(input.purchaseUnit);
  if (!normUnit) {
    throw new Error(`Invalid measurement unit: ${input.purchaseUnit}`);
  }

  const newQty = Number(input.purchaseQuantity);
  const newPrice = Number(input.purchasePrice);
  const oldPrice = Number(existing.purchasePrice);
  const oldQty = Number(existing.purchaseQuantity);

  if (isNaN(newQty) || newQty <= 0) {
    throw new Error("Purchase quantity must be greater than 0");
  }
  if (isNaN(newPrice) || newPrice < 0) {
    throw new Error("Purchase price must be 0 or greater");
  }

  const newCostPerBaseUnit = calculateCostPerBaseUnit(newQty, normUnit, newPrice);
  const oldCostPerBaseUnit = Number(existing.costPerBaseUnit);

  // Check if cost changed
  const costChanged =
    newCostPerBaseUnit !== oldCostPerBaseUnit ||
    newPrice !== oldPrice ||
    newQty !== oldQty ||
    normUnit !== existing.purchaseUnit;

  let impactReport: IngredientImpactReport | null = null;

  if (costChanged) {
    // Find all recipes that use this ingredient
    const affectedRecipes = await db
      .select({
        menuItemId: menuItemIngredients.menuItemId,
        menuItemName: menuItems.name,
        sellingPrice: menuItems.sellingPrice,
        recipeQty: menuItemIngredients.quantity,
        recipeUnit: menuItemIngredients.unit,
      })
      .from(menuItemIngredients)
      .innerJoin(menuItems, eq(menuItemIngredients.menuItemId, menuItems.id))
      .where(
        and(
          eq(menuItemIngredients.ingredientId, id),
          eq(menuItems.restaurantId, restaurantId)
        )
      );

    if (affectedRecipes.length > 0) {
      // For each affected menu item, get all its ingredients to calculate total costs
      const affectedMenuItemIds = affectedRecipes.map((r) => r.menuItemId);

      const allRecipeItems = await db
        .select({
          menuItemId: menuItemIngredients.menuItemId,
          ingredientId: menuItemIngredients.ingredientId,
          recipeQty: menuItemIngredients.quantity,
          recipeUnit: menuItemIngredients.unit,
          currentCostPerBaseUnit: ingredients.costPerBaseUnit,
          purchaseUnit: ingredients.purchaseUnit,
        })
        .from(menuItemIngredients)
        .innerJoin(ingredients, eq(menuItemIngredients.ingredientId, ingredients.id))
        .where(inArray(menuItemIngredients.menuItemId, affectedMenuItemIds));

      // Group by menuItemId
      const grouped = new Map<string, typeof allRecipeItems>();
      for (const item of allRecipeItems) {
        const group = grouped.get(item.menuItemId) || [];
        group.push(item);
        grouped.set(item.menuItemId, group);
      }

      const impactItems: ImpactReportItem[] = [];

      for (const recipe of affectedRecipes) {
        const allIngs = grouped.get(recipe.menuItemId) || [];
        const sellingPrice = Number(recipe.sellingPrice);

        // Old total cost calculation
        let oldTotalCost = 0;
        let newTotalCost = 0;

        for (const ing of allIngs) {
          const rQty = Number(ing.recipeQty);
          const rUnit = ing.recipeUnit;

          // Old cost
          const oldBaseCost = Number(ing.currentCostPerBaseUnit);
          try {
            const oldPortion = calculatePortionCost(
              rQty,
              rUnit,
              oldBaseCost,
              ing.purchaseUnit
            );
            oldTotalCost += oldPortion;
          } catch {
            // ignore unit mismatch in old calculation
          }

          // New cost: if this is the updated ingredient, use newCostPerBaseUnit and normUnit
          const isThisIngredient = ing.ingredientId === id;
          const targetBaseCost = isThisIngredient ? newCostPerBaseUnit : oldBaseCost;
          const targetPurchaseUnit = isThisIngredient ? normUnit : ing.purchaseUnit;

          try {
            const newPortion = calculatePortionCost(
              rQty,
              rUnit,
              targetBaseCost,
              targetPurchaseUnit
            );
            newTotalCost += newPortion;
          } catch {
            // ignore unit mismatch
          }
        }

        oldTotalCost = Number(oldTotalCost.toFixed(2));
        newTotalCost = Number(newTotalCost.toFixed(2));
        const costChange = Number((newTotalCost - oldTotalCost).toFixed(2));
        const costChangePercent =
          oldTotalCost > 0
            ? Number(((costChange / oldTotalCost) * 100).toFixed(1))
            : 0;

        const oldEcon = calculateMenuItemEconomics(sellingPrice, [oldTotalCost]);
        const newEcon = calculateMenuItemEconomics(sellingPrice, [newTotalCost]);

        impactItems.push({
          menuItemId: recipe.menuItemId,
          menuItemName: recipe.menuItemName,
          sellingPrice,
          oldTotalCost,
          newTotalCost,
          costChange,
          costChangePercent,
          oldGrossProfit: oldEcon.grossProfit,
          newGrossProfit: newEcon.grossProfit,
          oldGrossMarginPercent: oldEcon.grossMarginPercent,
          newGrossMarginPercent: newEcon.grossMarginPercent,
        });
      }

      impactReport = {
        ingredientId: id,
        ingredientName: input.name.trim(),
        oldPurchasePrice: oldPrice,
        newPurchasePrice: newPrice,
        oldPurchaseUnit: existing.purchaseUnit,
        newPurchaseUnit: normUnit,
        affectedMenuItemsCount: impactItems.length,
        affectedItems: impactItems,
      };
    }
  }

  // Update in database
  const [updated] = await db
    .update(ingredients)
    .set({
      name: input.name.trim(),
      purchaseQuantity: newQty.toFixed(3),
      purchaseUnit: normUnit,
      purchasePrice: newPrice.toFixed(2),
      costPerBaseUnit: newCostPerBaseUnit.toFixed(6),
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(ingredients.id, id), eq(ingredients.restaurantId, restaurantId)))
    .returning();

  return {
    ingredient: updated,
    impactReport,
  };
}

/**
 * Safely delete an ingredient - blocks if ingredient is used in any recipes
 */
export async function deleteIngredient(restaurantId: string, id: string) {
  // Check usage
  const usages = await db
    .select({
      menuItemId: menuItemIngredients.menuItemId,
      menuItemName: menuItems.name,
    })
    .from(menuItemIngredients)
    .innerJoin(menuItems, eq(menuItemIngredients.menuItemId, menuItems.id))
    .where(
      and(
        eq(menuItemIngredients.ingredientId, id),
        eq(menuItems.restaurantId, restaurantId)
      )
    );

  if (usages.length > 0) {
    const dishNames = Array.from(new Set(usages.map((u) => u.menuItemName)));
    return {
      success: false,
      inUse: true,
      usedInMenuNames: dishNames,
      message: `Cannot delete ingredient because it is used in ${dishNames.length} recipe(s): ${dishNames.join(", ")}`,
    };
  }

  await db
    .delete(ingredients)
    .where(and(eq(ingredients.id, id), eq(ingredients.restaurantId, restaurantId)));

  return {
    success: true,
    inUse: false,
    usedInMenuNames: [],
  };
}

/**
 * Get all menu items with economics and recipe counts
 */
export async function getMenuItems(
  restaurantId: string,
  search?: string,
  category?: string
) {
  const whereConditions = [eq(menuItems.restaurantId, restaurantId)];

  if (search && search.trim()) {
    whereConditions.push(ilike(menuItems.name, `%${search.trim()}%`));
  }
  if (category && category.trim()) {
    whereConditions.push(eq(menuItems.category, category.trim()));
  }

  const itemsList = await db
    .select()
    .from(menuItems)
    .where(and(...whereConditions))
    .orderBy(asc(menuItems.name));

  if (itemsList.length === 0) return [];

  const itemIds = itemsList.map((i) => i.id);

  // Fetch all ingredients for these menu items
  const recipeRows = await db
    .select({
      menuItemId: menuItemIngredients.menuItemId,
      ingredientId: menuItemIngredients.ingredientId,
      quantity: menuItemIngredients.quantity,
      unit: menuItemIngredients.unit,
      costPerBaseUnit: ingredients.costPerBaseUnit,
      purchaseUnit: ingredients.purchaseUnit,
      ingredientName: ingredients.name,
    })
    .from(menuItemIngredients)
    .innerJoin(ingredients, eq(menuItemIngredients.ingredientId, ingredients.id))
    .where(inArray(menuItemIngredients.menuItemId, itemIds));

  // Fetch step counts
  const stepsCountRows = await db
    .select({
      menuItemId: menuItemSteps.menuItemId,
      count: sql<number>`cast(count(${menuItemSteps.id}) as integer)`,
    })
    .from(menuItemSteps)
    .where(inArray(menuItemSteps.menuItemId, itemIds))
    .groupBy(menuItemSteps.menuItemId);

  const stepsCountMap = new Map<string, number>();
  for (const row of stepsCountRows) {
    stepsCountMap.set(row.menuItemId, Number(row.count));
  }

  // Group recipe rows by menuItemId
  const recipesMap = new Map<string, typeof recipeRows>();
  for (const row of recipeRows) {
    const list = recipesMap.get(row.menuItemId) || [];
    list.push(row);
    recipesMap.set(row.menuItemId, list);
  }

  return itemsList.map((item) => {
    const sellingPrice = Number(item.sellingPrice);
    const itemIngredients = recipesMap.get(item.id) || [];
    const portionCosts: number[] = [];

    for (const ing of itemIngredients) {
      try {
        const portion = calculatePortionCost(
          Number(ing.quantity),
          ing.unit,
          Number(ing.costPerBaseUnit),
          ing.purchaseUnit
        );
        portionCosts.push(portion);
      } catch {
        portionCosts.push(0);
      }
    }

    const economics: MenuItemEconomics = calculateMenuItemEconomics(
      sellingPrice,
      portionCosts
    );

    return {
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      sellingPrice,
      category: item.category,
      description: item.description,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      ingredientCount: itemIngredients.length,
      stepCount: stepsCountMap.get(item.id) || 0,
      economics,
    };
  });
}

/**
 * Get detailed menu item including ingredients list and preparation steps
 */
export async function getMenuItemById(restaurantId: string, id: string) {
  const [item] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));

  if (!item) return null;

  // Recipe ingredients
  const recipeRows = await db
    .select({
      id: menuItemIngredients.id,
      ingredientId: menuItemIngredients.ingredientId,
      quantity: menuItemIngredients.quantity,
      unit: menuItemIngredients.unit,
      ingredientName: ingredients.name,
      purchaseQuantity: ingredients.purchaseQuantity,
      purchaseUnit: ingredients.purchaseUnit,
      purchasePrice: ingredients.purchasePrice,
      costPerBaseUnit: ingredients.costPerBaseUnit,
    })
    .from(menuItemIngredients)
    .innerJoin(ingredients, eq(menuItemIngredients.ingredientId, ingredients.id))
    .where(eq(menuItemIngredients.menuItemId, id));

  const ingredientsWithCost = recipeRows.map((r) => {
    const qty = Number(r.quantity);
    const baseCost = Number(r.costPerBaseUnit);
    let portionCost = 0;
    try {
      portionCost = calculatePortionCost(qty, r.unit, baseCost, r.purchaseUnit);
    } catch {
      portionCost = 0;
    }

    const standardDisplay = getStandardCostDisplay(
      Number(r.purchaseQuantity),
      r.purchaseUnit,
      Number(r.purchasePrice)
    );

    return {
      id: r.id,
      ingredientId: r.ingredientId,
      ingredientName: r.ingredientName,
      quantity: qty,
      unit: r.unit,
      purchaseUnit: r.purchaseUnit,
      purchasePrice: Number(r.purchasePrice),
      portionCost,
      standardCostDisplay: standardDisplay.primary,
    };
  });

  // Steps
  const steps = await db
    .select({
      id: menuItemSteps.id,
      stepNumber: menuItemSteps.stepNumber,
      instruction: menuItemSteps.instruction,
    })
    .from(menuItemSteps)
    .where(eq(menuItemSteps.menuItemId, id))
    .orderBy(asc(menuItemSteps.stepNumber));

  const sellingPrice = Number(item.sellingPrice);
  const economics = calculateMenuItemEconomics(
    sellingPrice,
    ingredientsWithCost.map((i) => i.portionCost)
  );

  return {
    ...item,
    sellingPrice,
    ingredients: ingredientsWithCost,
    steps: steps.map((s) => ({
      id: s.id,
      stepNumber: Number(s.stepNumber),
      instruction: s.instruction,
    })),
    economics,
  };
}

/**
 * Create a new menu item with optional initial ingredients and steps
 */
export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput
) {
  const sellingPrice = Number(input.sellingPrice) || 0;

  const [created] = await db
    .insert(menuItems)
    .values({
      restaurantId,
      name: input.name.trim(),
      sellingPrice: sellingPrice.toFixed(2),
      category: input.category?.trim() || null,
      description: input.description?.trim() || null,
      isActive: input.isActive !== undefined ? input.isActive : true,
    })
    .returning();

  // If ingredients provided, validate and insert
  if (input.ingredients && input.ingredients.length > 0) {
    const validIngredients = input.ingredients.filter(
      (i) => i.ingredientId && Number(i.quantity) > 0 && i.unit
    );

    if (validIngredients.length > 0) {
      await db.insert(menuItemIngredients).values(
        validIngredients.map((ing) => ({
          menuItemId: created.id,
          ingredientId: ing.ingredientId,
          quantity: Number(ing.quantity).toFixed(3),
          unit: normalizeUnit(ing.unit) || ing.unit,
        }))
      );
    }
  }

  // If steps provided, insert
  if (input.steps && input.steps.length > 0) {
    const validSteps = input.steps.filter((s) => s.instruction?.trim());
    if (validSteps.length > 0) {
      await db.insert(menuItemSteps).values(
        validSteps.map((step, idx) => ({
          menuItemId: created.id,
          stepNumber: (idx + 1).toString(),
          instruction: step.instruction.trim(),
        }))
      );
    }
  }

  return getMenuItemById(restaurantId, created.id);
}

/**
 * Update a menu item, optionally replacing its recipe ingredients and steps
 */
export async function updateMenuItem(
  restaurantId: string,
  id: string,
  input: MenuItemInput
) {
  const [existing] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));

  if (!existing) {
    throw new Error("Menu item not found");
  }

  const sellingPrice =
    input.sellingPrice !== undefined
      ? Number(input.sellingPrice)
      : Number(existing.sellingPrice);

  await db
    .update(menuItems)
    .set({
      name: input.name ? input.name.trim() : existing.name,
      sellingPrice: sellingPrice.toFixed(2),
      category:
        input.category !== undefined
          ? input.category?.trim() || null
          : existing.category,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));

  // Update ingredients if explicitly passed
  if (input.ingredients !== undefined) {
    await db
      .delete(menuItemIngredients)
      .where(eq(menuItemIngredients.menuItemId, id));

    const validIngredients = input.ingredients.filter(
      (i) => i.ingredientId && Number(i.quantity) > 0 && i.unit
    );

    if (validIngredients.length > 0) {
      await db.insert(menuItemIngredients).values(
        validIngredients.map((ing) => ({
          menuItemId: id,
          ingredientId: ing.ingredientId,
          quantity: Number(ing.quantity).toFixed(3),
          unit: normalizeUnit(ing.unit) || ing.unit,
        }))
      );
    }
  }

  // Update steps if explicitly passed
  if (input.steps !== undefined) {
    await db.delete(menuItemSteps).where(eq(menuItemSteps.menuItemId, id));

    const validSteps = input.steps.filter((s) => s.instruction?.trim());
    if (validSteps.length > 0) {
      await db.insert(menuItemSteps).values(
        validSteps.map((step, idx) => ({
          menuItemId: id,
          stepNumber: (idx + 1).toString(),
          instruction: step.instruction.trim(),
        }))
      );
    }
  }

  return getMenuItemById(restaurantId, id);
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(restaurantId: string, id: string) {
  const [existing] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));

  if (!existing) {
    throw new Error("Menu item not found");
  }

  await db
    .delete(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));

  return { success: true };
}

/**
 * Update preparation SOP steps for a menu item
 */
export async function updateMenuItemSteps(
  restaurantId: string,
  menuItemId: string,
  steps: Array<{ stepNumber: number; instruction: string }>
) {
  const [item] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, menuItemId), eq(menuItems.restaurantId, restaurantId)));

  if (!item) {
    throw new Error("Menu item not found");
  }

  await db
    .delete(menuItemSteps)
    .where(eq(menuItemSteps.menuItemId, menuItemId));

  const validSteps = steps.filter((s) => s.instruction?.trim());

  if (validSteps.length > 0) {
    await db.insert(menuItemSteps).values(
      validSteps.map((step, idx) => ({
        menuItemId,
        stepNumber: (idx + 1).toString(),
        instruction: step.instruction.trim(),
      }))
    );
  }

  return db
    .select({
      id: menuItemSteps.id,
      stepNumber: menuItemSteps.stepNumber,
      instruction: menuItemSteps.instruction,
    })
    .from(menuItemSteps)
    .where(eq(menuItemSteps.menuItemId, menuItemId))
    .orderBy(asc(menuItemSteps.stepNumber));
}
