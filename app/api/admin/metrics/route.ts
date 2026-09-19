import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getAdminOverviewMetrics } from "@/lib/services/admin";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const metrics = await getAdminOverviewMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("GET /api/admin/metrics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
