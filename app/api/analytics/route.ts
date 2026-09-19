import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getDashboardAnalytics, PeriodType } from "@/lib/services/analytics";

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
    const period = (searchParams.get("period") || "month") as PeriodType;
    const customStart = searchParams.get("customStart") || undefined;
    const customEnd = searchParams.get("customEnd") || undefined;

    const data = await getDashboardAnalytics(
      auth.restaurant.id,
      period,
      customStart,
      customEnd
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate analytics" }, { status: 500 });
  }
}
