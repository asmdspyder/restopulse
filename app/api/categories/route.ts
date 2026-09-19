import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, auth.restaurant.id))
      .orderBy(desc(categories.isDefault), categories.name);

    return NextResponse.json({ categories: rows });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(categories)
      .values({
        restaurantId: auth.restaurant.id,
        name: name.trim(),
        isDefault: false,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, category: created });
  } catch (error: any) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(categories)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.restaurantId, auth.restaurant.id)))
      .returning();

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("PUT /api/categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}
