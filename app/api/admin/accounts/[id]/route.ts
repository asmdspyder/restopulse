import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  getAdminAccountDetails,
  updateAccountExpiry,
  resetAccountUserPassword,
} from "@/lib/services/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { id } = await params;
    const details = await getAdminAccountDetails(id);

    if (!details) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error: any) {
    console.error("GET /api/admin/accounts/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch account details" }, { status: 500 });
  }
}

export async function PUT(
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
    const { action, expiryDate, userId, newPassword } = body;

    if (action === "update_expiry" && expiryDate) {
      const updatedSub = await updateAccountExpiry(id, expiryDate);
      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    if (action === "reset_password" && userId && newPassword) {
      const updatedUser = await resetAccountUserPassword(userId, newPassword);
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/admin/accounts/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update account" }, { status: 500 });
  }
}
