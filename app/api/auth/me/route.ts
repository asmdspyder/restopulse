import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
    restaurant: auth.restaurant,
    subscription: auth.subscription,
    isDeactivated: auth.isDeactivated,
    isSubscriptionActive: auth.isSubscriptionActive,
    canAccessApp: auth.canAccessApp,
    blockReason: auth.blockReason,
    isImpersonating: auth.isImpersonating,
    impersonatorAdminId: auth.impersonatorAdminId,
  });
}
