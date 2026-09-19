import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { recordWastage, getWastageHistory } from "@/lib/services/wastage";

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
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const itemId = searchParams.get("itemId") || undefined;
    const reasonId = searchParams.get("reasonId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const history = await getWastageHistory({
      restaurantId: auth.restaurant.id,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      itemId,
      reasonId,
      categoryId,
      search,
      limit,
      offset,
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("GET /api/wastage error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch wastage records" }, { status: 500 });
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
    const { itemId, newItemName, reasonId, quantity, unit, ratePerUnit, updateItemCost = true, shift, responsibleArea, notes, recordedAt } = body;

    if ((!itemId && !newItemName) || !reasonId || quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json(
        { error: "Please provide a valid item name, wastage reason, and quantity greater than 0" },
        { status: 400 }
      );
    }

    const record = await recordWastage({
      restaurantId: auth.restaurant.id,
      itemId: itemId || undefined,
      newItemName: newItemName ? newItemName.trim() : undefined,
      reasonId,
      quantity: parseFloat(quantity),
      unit,
      ratePerUnit: ratePerUnit !== undefined ? parseFloat(ratePerUnit) : undefined,
      updateItemCost: Boolean(updateItemCost),
      shift,
      responsibleArea,
      notes,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      createdBy: auth.user.id,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("POST /api/wastage error:", error);
    return NextResponse.json({ error: error.message || "We couldn't save this wastage record. Please try again." }, { status: 500 });
  }
}
