import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { upsertDailySales, getSalesHistory } from "@/lib/services/sales";

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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = parseInt(searchParams.get("limit") || "60", 10);

    const records = await getSalesHistory(auth.restaurant.id, startDate, endDate, limit);

    return NextResponse.json({ sales: records });
  } catch (error: any) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sales" }, { status: 500 });
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
    const { date, salesAmount = 0, isClosed = false, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!isClosed && (salesAmount === undefined || isNaN(Number(salesAmount)) || Number(salesAmount) < 0)) {
      return NextResponse.json(
        { error: "Valid date and non-negative sales amount are required" },
        { status: 400 }
      );
    }

    const record = await upsertDailySales({
      restaurantId: auth.restaurant.id,
      date,
      salesAmount: isClosed ? 0 : parseFloat(salesAmount),
      isClosed: Boolean(isClosed),
      notes: isClosed ? notes || "Restaurant Closed" : notes,
      createdBy: auth.user.id,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: error.message || "Failed to record sales" }, { status: 500 });
  }
}
