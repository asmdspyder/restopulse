import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { updateRepeatableRows } from "@/lib/services/checklists";

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
    const { sectionCode, rows } = body;

    if (!sectionCode || !Array.isArray(rows)) {
      return NextResponse.json({ error: "sectionCode and rows array are required" }, { status: 400 });
    }

    const result = await updateRepeatableRows(id, sectionCode, rows, auth.user);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/checklists/daily/[id]/rows error:", error);
    return NextResponse.json({ error: error.message || "Failed to update rows" }, { status: 500 });
  }
}
