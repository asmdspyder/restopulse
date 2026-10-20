import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { updateDemoRequestStatus, deleteDemoRequest } from "@/lib/services/admin";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status || !["pending", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await updateDemoRequestStatus(id, status, notes);
    return NextResponse.json({ success: true, demo: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/demos/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update demo request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { id } = await context.params;
    await deleteDemoRequest(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/demos/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete demo request" },
      { status: 500 }
    );
  }
}
