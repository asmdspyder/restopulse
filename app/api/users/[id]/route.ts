import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { eq, and, ne } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can edit users" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, role, status, canManageChecklists, password } = body;

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.restaurantId, auth.restaurant.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name && name.trim()) {
      updateFields.name = name.trim();
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existing.email.toLowerCase()) {
        const [duplicate] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, cleanEmail), ne(users.id, id)))
          .limit(1);

        if (duplicate) {
          return NextResponse.json({ error: "This email address is already in use by another user" }, { status: 400 });
        }
        updateFields.email = cleanEmail;
      }
    }

    if (role) {
      updateFields.role = role === "admin" ? "admin" : "staff";
      if (role === "admin") updateFields.canManageChecklists = true;
    }
    if (status) {
      updateFields.status = status === "active" ? "active" : "inactive";
    }
    if (canManageChecklists !== undefined && role !== "admin") {
      updateFields.canManageChecklists = Boolean(canManageChecklists);
    }
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
      updateFields.passwordHash = await hashPassword(password.trim());
    }

    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        canManageChecklists: users.canManageChecklists,
        status: users.status,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting own user account
    if (id === auth.user.id) {
      return NextResponse.json({ error: "You cannot delete your own logged-in admin account" }, { status: 400 });
    }

    await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.restaurantId, auth.restaurant.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
