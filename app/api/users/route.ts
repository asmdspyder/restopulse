import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        canManageChecklists: users.canManageChecklists,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.restaurantId, auth.restaurant.id))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: rows });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch team users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }
    if (auth.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can add team users" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = "staff", canManageChecklists } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const isChecklistManager = role === "admin" ? true : Boolean(canManageChecklists);

    const [newUser] = await db
      .insert(users)
      .values({
        restaurantId: auth.restaurant.id,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role === "admin" ? "admin" : "staff",
        canManageChecklists: isChecklistManager,
        status: "active",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        canManageChecklists: users.canManageChecklists,
        status: users.status,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message || "Failed to add user" }, { status: 500 });
  }
}
