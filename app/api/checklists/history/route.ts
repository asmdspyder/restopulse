import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getChecklistHistory } from "@/lib/services/checklists";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const history = await getChecklistHistory(auth.restaurant.id, templateId, limit, offset);
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("GET /api/checklists/history error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch history" }, { status: 500 });
  }
}
