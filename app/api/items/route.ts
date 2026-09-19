import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { items, categories } from "@/lib/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const conditions = [eq(items.restaurantId, auth.restaurant.id)];
    if (activeOnly) {
      conditions.push(eq(items.isActive, true));
    }
    if (search && search.trim()) {
      conditions.push(ilike(items.name, `%${search.trim()}%`));
    }

    const rows = await db
      .select({
        id: items.id,
        name: items.name,
        categoryId: items.categoryId,
        categoryName: categories.name,
        defaultUnit: items.defaultUnit,
        costPerUnit: items.costPerUnit,
        defaultResponsibleArea: items.defaultResponsibleArea,
        isActive: items.isActive,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(items.createdAt));

    return NextResponse.json({ items: rows });
  } catch (error: any) {
    console.error("GET /api/items error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const body = await req.json();
    const { name, categoryId, defaultUnit, costPerUnit, defaultResponsibleArea } = body;

    if (!name || !defaultUnit || costPerUnit === undefined || isNaN(Number(costPerUnit))) {
      return NextResponse.json(
        { error: "Item name, unit, and valid cost per unit are required" },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert(items)
      .values({
        restaurantId: auth.restaurant.id,
        name: name.trim(),
        categoryId: categoryId || null,
        defaultUnit: defaultUnit.trim(),
        costPerUnit: parseFloat(costPerUnit).toFixed(2),
        defaultResponsibleArea: defaultResponsibleArea ? defaultResponsibleArea.trim() : "Kitchen",
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("POST /api/items error:", error);
    return NextResponse.json({ error: error.message || "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, categoryId, defaultUnit, costPerUnit, defaultResponsibleArea, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(items)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        defaultUnit: defaultUnit !== undefined ? defaultUnit.trim() : undefined,
        costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit).toFixed(2) : undefined,
        defaultResponsibleArea: defaultResponsibleArea !== undefined ? defaultResponsibleArea.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.restaurantId, auth.restaurant.id)))
      .returning();

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PUT /api/items error:", error);
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}
