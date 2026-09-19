import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { updateDailyVerification } from "@/lib/services/checklists";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();

    const result = await updateDailyVerification(id, body, auth.user);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("POST /api/checklists/daily/[id]/verify error:", error);
    return NextResponse.json({ error: error.message || "Failed to update verification" }, { status: 500 });
  }
}
