import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  getMenuItems,
  createMenuItem,
} from "@/lib/services/menu-costing";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const data = await getMenuItems(auth.restaurant.id, search, category);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/menu-costing/menu-items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, sellingPrice, category, description, isActive, ingredients, steps } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Dish name is required" },
        { status: 400 }
      );
    }

    const created = await createMenuItem(auth.restaurant.id, {
      name,
      sellingPrice: Number(sellingPrice) || 0,
      category,
      description,
      isActive,
      ingredients,
      steps,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/menu-costing/menu-items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create menu item" },
      { status: 400 }
    );
  }
}
