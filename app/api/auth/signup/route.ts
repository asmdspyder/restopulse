import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabaseSchema } from "@/lib/db";
import { restaurants, users, subscriptions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { seedRestaurantDefaults } from "@/lib/services/onboarding";
import { PRICING_PLANS, PlanKey } from "@/lib/razorpay";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      password,
      plan = "monthly",
    } = body;

    if (!businessName || !contactName || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user/restaurant email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const selectedPlan = PRICING_PLANS[plan as PlanKey] || PRICING_PLANS.monthly;

    // 1. Create Restaurant Workspace
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        address: address ? address.trim() : null,
        currency: "INR",
        timezone: "Asia/Kolkata",
        accountStatus: "active",
        onboardingCompleted: false,
      })
      .returning();

    // 2. Create Owner User Account
    const [user] = await db
      .insert(users)
      .values({
        restaurantId: restaurant.id,
        name: contactName.trim(),
        email: cleanEmail,
        passwordHash,
        role: "admin",
        status: "active",
      })
      .returning();

    // 3. Seed Default Categories, Units, Reasons
    await seedRestaurantDefaults(restaurant.id);

    // 4. Create Initial Subscription Record (Active period for test / checkout flow)
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const [sub] = await db
      .insert(subscriptions)
      .values({
        restaurantId: restaurant.id,
        planType: plan,
        billingInterval: selectedPlan.interval,
        amount: selectedPlan.amount.toFixed(2),
        currency: "INR",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
      })
      .returning();

    // 5. Generate Session Token & Set Cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "admin",
      restaurantId: restaurant.id,
      businessName: restaurant.businessName,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      restaurant: {
        id: restaurant.id,
        businessName: restaurant.businessName,
      },
      subscription: {
        id: sub.id,
        planType: sub.planType,
        amount: sub.amount,
        status: sub.status,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
