import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabaseSchema } from "@/lib/db";
import { users, restaurants } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide email and password" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if logging in as Super Admin
    if (
      cleanEmail === (process.env.ADMIN_EMAIL || "admin@wasteflow.io").toLowerCase() &&
      password === (process.env.ADMIN_PASSWORD || "AdminSecurePassword123!")
    ) {
      const token = await createSessionToken({
        userId: "00000000-0000-0000-0000-000000000001",
        email: cleanEmail,
        name: "Platform Administrator",
        role: "superadmin",
      });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Platform Administrator",
          email: cleanEmail,
          role: "superadmin",
        },
        redirect: "/admin",
      });
    }

    // 2. Standard Restaurant User Login
    const [userRecord] = await db
      .select({
        id: users.id,
        restaurantId: users.restaurantId,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!userRecord) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (userRecord.status !== "active") {
      return NextResponse.json(
        { error: "Your user account is inactive. Please contact your restaurant manager." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, userRecord.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userRecord.id));

    // Fetch restaurant name
    let businessName = "Restaurant";
    if (userRecord.restaurantId) {
      const [rest] = await db
        .select({ name: restaurants.businessName })
        .from(restaurants)
        .where(eq(restaurants.id, userRecord.restaurantId))
        .limit(1);
      if (rest) businessName = rest.name;
    }

    // Create session token
    const token = await createSessionToken({
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role as "admin" | "staff",
      restaurantId: userRecord.restaurantId || undefined,
      businessName,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
      restaurant: {
        id: userRecord.restaurantId,
        businessName,
      },
      redirect: "/app",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
