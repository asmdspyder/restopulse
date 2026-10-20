import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getDemoRequests, getDemoMetrics } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const [demos, metrics] = await Promise.all([
      getDemoRequests(search, status),
      getDemoMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      demos,
      metrics,
    });
  } catch (error: any) {
    console.error("GET /api/admin/demos error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch demo requests" },
      { status: 500 }
    );
  }
}
