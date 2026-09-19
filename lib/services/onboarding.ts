import { db } from "@/lib/db";
import { categories, units, wastageReasons, items, restaurants } from "@/lib/db/schema";
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, DEFAULT_WASTAGE_REASONS } from "@/lib/db/defaults";
import { eq } from "drizzle-orm";

export async function seedRestaurantDefaults(restaurantId: string) {
  // 1. Seed default categories
  const categoryInserts = DEFAULT_CATEGORIES.map((cat) => ({
    restaurantId,
    name: cat.name,
    isDefault: true,
    isActive: true,
  }));
  const createdCategories = await db.insert(categories).values(categoryInserts).returning();

  // 2. Seed default units
  const unitInserts = DEFAULT_UNITS.map((u) => ({
    restaurantId,
    name: u.name,
    symbol: u.symbol,
    isActive: true,
  }));
  await db.insert(units).values(unitInserts);

  // 3. Seed default wastage reasons
  const reasonInserts = DEFAULT_WASTAGE_REASONS.map((r) => ({
    restaurantId,
    name: r.name,
    isDefault: true,
    isActive: true,
  }));
  await db.insert(wastageReasons).values(reasonInserts);

  // 4. Seed default Opening Checklist from reference standard
  const { seedOpeningChecklist } = await import("@/lib/services/checklist-seed");
  await seedOpeningChecklist(restaurantId);

  return { categories: createdCategories };
}

export async function addStarterItems(
  restaurantId: string,
  itemsList: Array<{
    name: string;
    categoryName?: string;
    unit: string;
    costPerUnit: number;
    responsibleArea?: string;
  }>
) {
  // Fetch categories map for the restaurant
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurantId));

  const catMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));
  const defaultCatId = existingCategories.find((c) => c.name === "Food")?.id || existingCategories[0]?.id;

  const inserts = itemsList.map((item) => {
    const categoryId = item.categoryName
      ? catMap.get(item.categoryName.toLowerCase()) || defaultCatId
      : defaultCatId;

    return {
      restaurantId,
      name: item.name,
      categoryId,
      defaultUnit: item.unit || "kg",
      costPerUnit: item.costPerUnit.toFixed(2),
      defaultResponsibleArea: item.responsibleArea || "Kitchen",
      isActive: true,
    };
  });

  if (inserts.length > 0) {
    await db.insert(items).values(inserts);
  }
}

export async function completeOnboarding(restaurantId: string) {
  await db
    .update(restaurants)
    .set({
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(restaurants.id, restaurantId));
}
