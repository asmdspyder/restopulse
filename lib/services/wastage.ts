import { db } from "@/lib/db";
import { wastageRecords, items, wastageReasons, categories, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, ilike } from "drizzle-orm";

export interface RecordWastageInput {
  restaurantId: string;
  itemId?: string;
  newItemName?: string;
  categoryId?: string;
  reasonId: string;
  quantity: number;
  unit?: string;
  ratePerUnit?: number; // Optional override; defaults to item's costPerUnit
  updateItemCost?: boolean; // If true, updates the default cost in items table for future recordings
  shift?: string;
  responsibleArea?: string;
  notes?: string;
  recordedAt?: Date;
  createdBy?: string;
}

export async function recordWastage(input: RecordWastageInput) {
  const {
    restaurantId,
    itemId,
    newItemName,
    reasonId,
    quantity,
    updateItemCost = true,
    shift,
    responsibleArea,
    notes,
    recordedAt = new Date(),
    createdBy,
  } = input;

  let targetItem: {
    id: string;
    name: string;
    costPerUnit: string;
    defaultUnit: string;
    categoryId: string | null;
    defaultResponsibleArea: string | null;
    categoryName: string | null;
  } | null = null;

  // 1. If itemId is provided and not 'new', fetch item
  if (itemId && itemId !== "new") {
    const [existingItem] = await db
      .select({
        id: items.id,
        name: items.name,
        costPerUnit: items.costPerUnit,
        defaultUnit: items.defaultUnit,
        categoryId: items.categoryId,
        defaultResponsibleArea: items.defaultResponsibleArea,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(and(eq(items.id, itemId), eq(items.restaurantId, restaurantId)))
      .limit(1);

    if (existingItem) {
      targetItem = existingItem;
    }
  }

  // 1b. If no item found but newItemName is provided, find or create the item
  if (!targetItem && newItemName && newItemName.trim()) {
    const cleanName = newItemName.trim();
    
    // Check if item with this name already exists
    const [existingByName] = await db
      .select({
        id: items.id,
        name: items.name,
        costPerUnit: items.costPerUnit,
        defaultUnit: items.defaultUnit,
        categoryId: items.categoryId,
        defaultResponsibleArea: items.defaultResponsibleArea,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(and(ilike(items.name, cleanName), eq(items.restaurantId, restaurantId)))
      .limit(1);

    if (existingByName) {
      targetItem = existingByName;
    } else {
      // Find or create default category
      let categoryId = input.categoryId;
      let categoryName = "Food";

      if (!categoryId) {
        const [firstCat] = await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(eq(categories.restaurantId, restaurantId))
          .limit(1);

        if (firstCat) {
          categoryId = firstCat.id;
          categoryName = firstCat.name;
        } else {
          const [newCat] = await db
            .insert(categories)
            .values({
              restaurantId,
              name: "Food",
              isDefault: true,
              isActive: true,
            })
            .returning();
          categoryId = newCat.id;
          categoryName = newCat.name;
        }
      }

      const initialRate = (input.ratePerUnit !== undefined && input.ratePerUnit >= 0)
        ? input.ratePerUnit.toFixed(2)
        : "0.00";
      const initialUnit = input.unit || "kg";

      const [createdItem] = await db
        .insert(items)
        .values({
          restaurantId,
          name: cleanName,
          categoryId,
          defaultUnit: initialUnit,
          costPerUnit: initialRate,
          defaultResponsibleArea: responsibleArea || "Kitchen",
          isActive: true,
        })
        .returning();

      targetItem = {
        id: createdItem.id,
        name: createdItem.name,
        costPerUnit: createdItem.costPerUnit,
        defaultUnit: createdItem.defaultUnit,
        categoryId: createdItem.categoryId,
        defaultResponsibleArea: createdItem.defaultResponsibleArea,
        categoryName,
      };
    }
  }

  if (!targetItem) {
    throw new Error("Please specify a valid item name or select an existing item");
  }

  const item = targetItem;

  // 2. Fetch reason
  const [reason] = await db
    .select({
      id: wastageReasons.id,
      name: wastageReasons.name,
    })
    .from(wastageReasons)
    .where(and(eq(wastageReasons.id, reasonId), eq(wastageReasons.restaurantId, restaurantId)))
    .limit(1);

  if (!reason) {
    throw new Error("Wastage reason not found or does not belong to this restaurant");
  }

  // 3. Compute immutable snapshot values
  const rate = input.ratePerUnit !== undefined ? input.ratePerUnit : parseFloat(item.costPerUnit);
  const unit = input.unit || item.defaultUnit;
  const wastageValue = parseFloat((quantity * rate).toFixed(2));
  const assignedArea = responsibleArea || item.defaultResponsibleArea || "Kitchen";

  // 4. Update the item's catalog cost in items table if requested
  if (updateItemCost && input.ratePerUnit !== undefined && Math.abs(input.ratePerUnit - parseFloat(item.costPerUnit)) > 0.001) {
    await db
      .update(items)
      .set({
        costPerUnit: rate.toFixed(2),
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, item.id), eq(items.restaurantId, restaurantId)));
  }

  // 5. Insert transactional record with immutable snapshot
  const [created] = await db
    .insert(wastageRecords)
    .values({
      restaurantId,
      itemId: item.id,
      categoryId: item.categoryId,
      reasonId: reason.id,
      itemNameSnapshot: item.name,
      categoryNameSnapshot: item.categoryName || "General",
      reasonNameSnapshot: reason.name,
      quantity: quantity.toString(),
      unit,
      ratePerUnit: rate.toFixed(2),
      wastageValue: wastageValue.toFixed(2),
      shift: shift || null,
      responsibleArea: assignedArea,
      notes: notes || null,
      recordedAt,
      createdBy: createdBy || null,
    })
    .returning();

  return created;
}

export interface WastageFilterOptions {
  restaurantId: string;
  startDate?: Date;
  endDate?: Date;
  itemId?: string;
  reasonId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getWastageHistory(options: WastageFilterOptions) {
  const {
    restaurantId,
    startDate,
    endDate,
    itemId,
    reasonId,
    categoryId,
    search,
    limit = 50,
    offset = 0,
  } = options;

  const conditions = [eq(wastageRecords.restaurantId, restaurantId)];

  if (startDate) {
    conditions.push(gte(wastageRecords.recordedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(wastageRecords.recordedAt, endDate));
  }
  if (itemId) {
    conditions.push(eq(wastageRecords.itemId, itemId));
  }
  if (reasonId) {
    conditions.push(eq(wastageRecords.reasonId, reasonId));
  }
  if (categoryId) {
    conditions.push(eq(wastageRecords.categoryId, categoryId));
  }
  if (search && search.trim()) {
    conditions.push(ilike(wastageRecords.itemNameSnapshot, `%${search.trim()}%`));
  }

  const whereClause = and(...conditions);

  const [records, totalCountResult] = await Promise.all([
    db
      .select({
        id: wastageRecords.id,
        itemId: wastageRecords.itemId,
        itemName: wastageRecords.itemNameSnapshot,
        categoryName: wastageRecords.categoryNameSnapshot,
        reasonName: wastageRecords.reasonNameSnapshot,
        quantity: wastageRecords.quantity,
        unit: wastageRecords.unit,
        ratePerUnit: wastageRecords.ratePerUnit,
        wastageValue: wastageRecords.wastageValue,
        shift: wastageRecords.shift,
        responsibleArea: wastageRecords.responsibleArea,
        notes: wastageRecords.notes,
        recordedAt: wastageRecords.recordedAt,
        userName: users.name,
      })
      .from(wastageRecords)
      .leftJoin(users, eq(wastageRecords.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(wastageRecords.recordedAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(wastageRecords)
      .where(whereClause),
  ]);

  return {
    records,
    totalCount: totalCountResult[0]?.count || 0,
    limit,
    offset,
  };
}
