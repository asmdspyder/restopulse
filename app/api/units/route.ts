import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(units)
      .where(
        or(
          eq(units.restaurantId, auth.restaurant.id),
          isNull(units.restaurantId)
        )
      );

    return NextResponse.json({ units: rows });
  } catch (error: any) {
    console.error("GET /api/units error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, symbol } = body;

    if (!name || !symbol) {
      return NextResponse.json({ error: "Unit name and symbol are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(units)
      .values({
        restaurantId: auth.restaurant.id,
        name: name.trim(),
        symbol: symbol.trim(),
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, unit: created });
  } catch (error: any) {
    console.error("POST /api/units error:", error);
    return NextResponse.json({ error: error.message || "Failed to create unit" }, { status: 500 });
  }
}
