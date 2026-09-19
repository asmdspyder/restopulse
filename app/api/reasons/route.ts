import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { wastageReasons } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(wastageReasons)
      .where(eq(wastageReasons.restaurantId, auth.restaurant.id))
      .orderBy(desc(wastageReasons.isDefault), wastageReasons.name);

    return NextResponse.json({ reasons: rows });
  } catch (error: any) {
    console.error("GET /api/reasons error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch wastage reasons" }, { status: 500 });
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
      return NextResponse.json({ error: "Reason name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(wastageReasons)
      .values({
        restaurantId: auth.restaurant.id,
        name: name.trim(),
        isDefault: false,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, reason: created });
  } catch (error: any) {
    console.error("POST /api/reasons error:", error);
    return NextResponse.json({ error: error.message || "Failed to create reason" }, { status: 500 });
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
      return NextResponse.json({ error: "Reason ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(wastageReasons)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(wastageReasons.id, id), eq(wastageReasons.restaurantId, auth.restaurant.id)))
      .returning();

    return NextResponse.json({ success: true, reason: updated });
  } catch (error: any) {
    console.error("PUT /api/reasons error:", error);
    return NextResponse.json({ error: error.message || "Failed to update reason" }, { status: 500 });
  }
}
