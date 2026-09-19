import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { restaurants, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, auth.restaurant.id))
      .limit(1);

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.restaurantId, auth.restaurant.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return NextResponse.json({
      restaurant,
      subscription: sub || null,
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      contactName,
      phone,
      address,
      currency,
      timezone,
      shiftsEnabled,
      shiftNames,
      responsibleAreas,
    } = body;

    const [updated] = await db
      .update(restaurants)
      .set({
        businessName: businessName !== undefined ? businessName.trim() : undefined,
        contactName: contactName !== undefined ? contactName.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        address: address !== undefined ? address.trim() : undefined,
        currency: currency !== undefined ? currency.trim() : undefined,
        timezone: timezone !== undefined ? timezone.trim() : undefined,
        shiftsEnabled: shiftsEnabled !== undefined ? Boolean(shiftsEnabled) : undefined,
        shiftNames: shiftNames !== undefined ? shiftNames : undefined,
        responsibleAreas: responsibleAreas !== undefined ? responsibleAreas : undefined,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, auth.restaurant.id))
      .returning();

    return NextResponse.json({ success: true, restaurant: updated });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
