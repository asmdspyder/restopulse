import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { verifyRazorpaySignature, PRICING_PLANS, PlanKey } from "@/lib/razorpay";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, signature, plan = "monthly" } = body;

    const planConfig = PRICING_PLANS[plan as PlanKey] || PRICING_PLANS.monthly;

    // Verify signature if not simulated
    if (!orderId?.startsWith("order_sim_") && process.env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Insert or update active subscription
    const [sub] = await db
      .insert(subscriptions)
      .values({
        restaurantId: auth.restaurant.id,
        razorpayPaymentId: paymentId || `pay_${Date.now()}`,
        razorpaySubscriptionId: orderId,
        planType: plan,
        billingInterval: planConfig.interval,
        amount: planConfig.amount.toFixed(2),
        currency: "INR",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      subscription: sub,
    });
  } catch (error: any) {
    console.error("POST /api/razorpay/verify error:", error);
    return NextResponse.json({ error: error.message || "Payment verification failed" }, { status: 500 });
  }
}
