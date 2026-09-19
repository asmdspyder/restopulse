import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { checkYesterdaySales } from "@/lib/services/sales";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked" }, { status: 403 });
    }

    const result = await checkYesterdaySales(auth.restaurant.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/sales/check-yesterday error:", error);
    return NextResponse.json({ error: error.message || "Failed to check sales" }, { status: 500 });
  }
}
