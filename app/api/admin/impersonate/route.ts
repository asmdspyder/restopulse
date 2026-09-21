import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, restaurants } from "@/lib/db/schema";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { eq, asc, sql } from "drizzle-orm";

async function handleImpersonateRequest(req: NextRequest) {
  try {
    const currentSession = await getSession();
    
    // Security: Only superadmin or an already impersonating superadmin can trigger impersonation
    const isSuperAdmin = currentSession?.role === "superadmin" || Boolean(currentSession?.impersonatorAdminId);
    if (!currentSession || !isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Platform Superadmin access required" },
        { status: 403 }
      );
    }

    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const { searchParams } = new URL(req.url);
    const restaurantId = body?.restaurantId || body?.accountId || body?.id || searchParams.get("restaurantId") || searchParams.get("accountId") || searchParams.get("id");
    const userId = body?.userId || searchParams.get("userId");

    if (!restaurantId && !userId) {
      return NextResponse.json(
        { error: "Please provide restaurantId or userId to impersonate" },
        { status: 400 }
      );
    }

    let targetUser: any = null;
    let targetRestaurant: any = null;

    if (userId) {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!foundUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }
      targetUser = foundUser;

      if (foundUser.restaurantId) {
        const [foundRest] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, foundUser.restaurantId))
          .limit(1);
        targetRestaurant = foundRest;
      }
    } else if (restaurantId) {
      const [foundRest] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!foundRest) {
        return NextResponse.json({ error: "Target restaurant not found" }, { status: 404 });
      }
      targetRestaurant = foundRest;

      // Find primary admin user or first active user for this restaurant
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.restaurantId, restaurantId))
        .orderBy(sql`CASE WHEN ${users.role} = 'admin' THEN 0 ELSE 1 END`, asc(users.createdAt))
        .limit(1);

      if (foundUser) {
        targetUser = foundUser;
      } else {
        // Auto-create a primary admin user if none exists for this restaurant
        const [createdUser] = await db
          .insert(users)
          .values({
            restaurantId: foundRest.id,
            name: foundRest.contactName || "Restaurant Admin",
            email: foundRest.email,
            passwordHash: "$2b$10$defaultPlaceholderHashNotUsedDirectly",
            role: "admin",
            status: "active",
            canManageChecklists: true,
          })
          .returning();
        targetUser = createdUser;
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Could not find or create a user for this account" }, { status: 400 });
    }

    // Preserve original superadmin ID in the session token
    const originalAdminId = currentSession.impersonatorAdminId || currentSession.userId || "00000000-0000-0000-0000-000000000001";

    // Generate impersonated session token
    const token = await createSessionToken({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role as "admin" | "staff",
      restaurantId: targetRestaurant?.id || targetUser.restaurantId,
      businessName: targetRestaurant?.businessName || "Restaurant",
      isImpersonating: true,
      impersonatorAdminId: originalAdminId,
    });

    await setSessionCookie(token);

    if (req.method === "GET") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      restaurant: {
        id: targetRestaurant?.id,
        businessName: targetRestaurant?.businessName,
      },
      redirect: "/app",
    });
  } catch (error: any) {
    console.error("impersonate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to impersonate account" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleImpersonateRequest(req);
}

export async function GET(req: NextRequest) {
  return handleImpersonateRequest(req);
}
