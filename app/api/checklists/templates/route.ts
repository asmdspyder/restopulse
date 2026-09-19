import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getChecklistTemplates, saveChecklistTemplate } from "@/lib/services/checklists";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await getChecklistTemplates(auth.restaurant.id);
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("GET /api/checklists/templates error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Check if user is admin or has canManageChecklists flag
    const canManage = auth.user.role === "admin" || (auth.user as any).canManageChecklists === true;
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create or edit checklist templates." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await saveChecklistTemplate(auth.restaurant.id, body, auth.user);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/checklists/templates error:", error);
    return NextResponse.json({ error: error.message || "Failed to save template" }, { status: 500 });
  }
}
