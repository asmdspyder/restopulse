import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getChecklistTemplateWithStructure } from "@/lib/services/checklists";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const template = await getChecklistTemplateWithStructure(id, auth.restaurant.id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("GET /api/checklists/templates/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch template" }, { status: 500 });
  }
}
