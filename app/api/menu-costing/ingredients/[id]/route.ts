import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  updateIngredient,
  deleteIngredient,
} from "@/lib/services/menu-costing";

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
        { error: "Purchase unit is required" },
        { status: 400 }
      );
    }
    if (purchasePrice === undefined || purchasePrice === null || Number(purchasePrice) < 0) {
      return NextResponse.json(
        { error: "Valid purchase price is required" },
        { status: 400 }
      );
    }

    const result = await updateIngredient(auth.restaurant.id, id, {
      name,
      purchaseQuantity: Number(purchaseQuantity),
      purchaseUnit,
      purchasePrice: Number(purchasePrice),
      notes,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/menu-costing/ingredients/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ingredient" },
      { status: 400 }
    );
  }
}

export async function DELETE(
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
    const result = await deleteIngredient(auth.restaurant.id, id);

    if (result.inUse) {
      return NextResponse.json(
        {
          error: "in_use",
          message: result.message,
          usedInMenuNames: result.usedInMenuNames,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/menu-costing/ingredients/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete ingredient" },
      { status: 500 }
    );
  }
}
