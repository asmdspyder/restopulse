import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { addStarterItems, completeOnboarding } from "@/lib/services/onboarding";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items = [], complete = true } = body;

    if (items.length > 0) {
      await addStarterItems(auth.restaurant.id, items);
    }

    if (complete) {
      await completeOnboarding(auth.restaurant.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/onboarding error:", error);
    return NextResponse.json({ error: error.message || "Failed to save onboarding data" }, { status: 500 });
  }
}
