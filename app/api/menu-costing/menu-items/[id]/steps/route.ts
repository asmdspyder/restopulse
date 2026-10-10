import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  getMenuItemById,
  updateMenuItemSteps,
} from "@/lib/services/menu-costing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json(
        { error: "Access blocked", blockReason: auth.blockReason },
        { status: 403 }
      );
    }
    if (auth.user.role === "staff") {
      return NextResponse.json(
        { error: "Access restricted to managers and administrators" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const item = await getMenuItemById(auth.restaurant.id, id);

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(item.steps || []);
  } catch (error: any) {
    console.error("GET /api/menu-costing/menu-items/[id]/steps error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch steps" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json(
        { error: "Access blocked", blockReason: auth.blockReason },
        { status: 403 }
      );
    }
    if (auth.user.role === "staff") {
      return NextResponse.json(
        { error: "Access restricted to managers and administrators" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const steps = Array.isArray(body.steps) ? body.steps : [];

    const updatedSteps = await updateMenuItemSteps(auth.restaurant.id, id, steps);
    return NextResponse.json(updatedSteps);
  } catch (error: any) {
    console.error("PUT /api/menu-costing/menu-items/[id]/steps error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update steps" },
      { status: 400 }
    );
  }
}
