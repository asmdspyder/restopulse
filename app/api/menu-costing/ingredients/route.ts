import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  getIngredients,
  createIngredient,
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

    const data = await getIngredients(auth.restaurant.id, search);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/menu-costing/ingredients error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ingredients" },
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
    const { name, purchaseQuantity, purchaseUnit, purchasePrice, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Ingredient name is required" },
        { status: 400 }
      );
    }
    if (purchaseQuantity === undefined || purchaseQuantity === null || Number(purchaseQuantity) <= 0) {
      return NextResponse.json(
        { error: "Valid purchase quantity (> 0) is required" },
        { status: 400 }
      );
    }
    if (!purchaseUnit) {
      return NextResponse.json(
        { error: "Purchase unit (kg, g, L, ml, pcs) is required" },
        { status: 400 }
      );
    }
    if (purchasePrice === undefined || purchasePrice === null || Number(purchasePrice) < 0) {
      return NextResponse.json(
        { error: "Valid purchase price is required" },
        { status: 400 }
      );
    }

    const created = await createIngredient(auth.restaurant.id, {
      name,
      purchaseQuantity: Number(purchaseQuantity),
      purchaseUnit,
      purchasePrice: Number(purchasePrice),
      notes,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/menu-costing/ingredients error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create ingredient" },
      { status: 400 }
    );
  }
}
