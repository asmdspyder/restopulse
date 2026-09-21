import { NextRequest, NextResponse } from "next/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.isImpersonating && !session?.impersonatorAdminId) {
      return NextResponse.json({ error: "No active impersonation session found" }, { status: 400 });
    }

    // Restore original Super Admin session
    const adminEmail = process.env.ADMIN_EMAIL || "admin@wasteflow.io";
    const adminId = session.impersonatorAdminId || "00000000-0000-0000-0000-000000000001";

    const token = await createSessionToken({
      userId: adminId,
      email: adminEmail,
      name: "Platform Administrator",
      role: "superadmin",
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      redirect: "/admin/accounts",
    });
  } catch (error: any) {
    console.error("POST /api/admin/impersonate/exit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to exit impersonation" },
      { status: 500 }
    );
  }
}
