import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getAdminAccounts, createAdminManagedAccount } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const accounts = await getAdminAccounts(search, status);
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("GET /api/admin/accounts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || auth.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const body = await req.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      password,
      planType,
      plan,
      expiryDate,
      isLifetime,
    } = body;

    if (!businessName || !contactName || !email || !password) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
    }

    const calculatedExpiry = isLifetime ? "2099-12-31" : expiryDate || undefined;

    const result = await createAdminManagedAccount({
      businessName,
      contactName,
      email,
      phone: phone || "",
      address,
      password,
      planType: plan || planType || "manual_managed",
      expiryDate: calculatedExpiry,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/admin/accounts error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
