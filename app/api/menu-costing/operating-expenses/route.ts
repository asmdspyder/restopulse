import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  getOperatingExpensesConfig,
  saveOperatingExpensesConfig,
} from "@/lib/services/menu-costing";

export async function GET() {
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

    const data = await getOperatingExpensesConfig(auth.restaurant.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/menu-costing/operating-expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch operating expenses configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const { mode, manualPercentage, monthlySalesRevenue, expenses, isEnabled } = body;

    // Validation
    if (mode === "manual") {
      if (manualPercentage !== undefined && manualPercentage !== null && manualPercentage !== "") {
        const num = Number(manualPercentage);
        if (isNaN(num) || num < 0 || num > 100) {
          return NextResponse.json(
            { error: "Operating expense percentage must be a number between 0% and 100%" },
            { status: 400 }
          );
        }
      }
    } else if (mode === "calculated") {
      if (monthlySalesRevenue !== undefined && monthlySalesRevenue !== null && monthlySalesRevenue !== "") {
        const rev = Number(monthlySalesRevenue);
        if (isNaN(rev) || rev <= 0) {
          return NextResponse.json(
            { error: "Estimated monthly sales revenue must be greater than zero to calculate the percentage" },
            { status: 400 }
          );
        }
      }
    }

    if (expenses && Array.isArray(expenses)) {
      for (const exp of expenses) {
        if (exp.amount !== undefined && exp.amount !== null) {
          const amt = Number(exp.amount);
          if (isNaN(amt) || amt < 0) {
            return NextResponse.json(
              { error: `Expense amount for "${exp.name || "Expense"}" cannot be negative` },
              { status: 400 }
            );
          }
        }
      }
    }

    const updated = await saveOperatingExpensesConfig(auth.restaurant.id, {
      mode: mode === "manual" ? "manual" : "calculated",
      manualPercentage:
        manualPercentage !== undefined && manualPercentage !== null && manualPercentage !== ""
          ? Number(manualPercentage)
          : null,
      monthlySalesRevenue:
        monthlySalesRevenue !== undefined && monthlySalesRevenue !== null && monthlySalesRevenue !== ""
          ? Number(monthlySalesRevenue)
          : null,
      expenses: expenses || [],
      isEnabled: isEnabled !== false,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/menu-costing/operating-expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save operating expenses configuration" },
      { status: 500 }
    );
  }
}
