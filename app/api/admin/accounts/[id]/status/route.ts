import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { setAccountStatus } from "@/lib/services/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (status !== "active" && status !== "manually_deactivated") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'manually_deactivated'" },
        { status: 400 }
      );
    }

    const updated = await setAccountStatus(id, status);

    return NextResponse.json({
      success: true,
      message: `Account has been ${status === "active" ? "activated" : "deactivated"} successfully`,
      restaurant: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/accounts/[id]/status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update account status" }, { status: 500 });
  }
}
