import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { subscriptions, restaurants } from "@/lib/db/schema";
import { PRICING_PLANS, PlanKey } from "@/lib/razorpay";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Accept both snake_case and camelCase parameters
    const order_id = body.razorpay_order_id || body.order_id || body.orderId;
    const payment_id = body.razorpay_payment_id || body.payment_id || body.paymentId;
    const razorpay_signature = body.razorpay_signature || body.signature;
    const plan = (body.plan || "monthly") as PlanKey;

    // Validate required fields
    if (!order_id || !payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required verification fields. Expected order_id, payment_id, and signature.",
        },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error: Razorpay secret not set" },
        { status: 500 }
      );
    }

    // STEP 3: Verify HMAC-SHA256 Signature
    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${order_id}|${payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const isSignatureValid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );

    if (!isSignatureValid) {
      console.warn("Razorpay signature verification failed for order:", order_id);
      return NextResponse.json(
        {
          error: "Invalid payment signature. Verification failed.",
          verified: false,
        },
        { status: 400 }
      );
    }

    // Signature verified successfully! Now update workspace records if restaurant is associated
    const auth = await getAuthContext();
    let subscriptionRecord = null;

    if (auth?.restaurant) {
      const planConfig = PRICING_PLANS[plan] || PRICING_PLANS.monthly;
      const now = new Date();
      const periodEnd = new Date(now);

      if (plan === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // 1. Check if subscription already exists for this restaurant
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.restaurantId, auth.restaurant.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      if (existingSub) {
        // Update existing subscription record in place
        const [updatedSub] = await db
          .update(subscriptions)
          .set({
            razorpayPaymentId: payment_id,
            razorpaySubscriptionId: order_id,
            planType: plan,
            billingInterval: planConfig.interval,
            amount: planConfig.amount.toFixed(2),
            currency: "INR",
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextBillingAt: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub.id))
          .returning();

        subscriptionRecord = updatedSub;
      } else {
        // Insert new subscription record if none exists
        const [newSub] = await db
          .insert(subscriptions)
          .values({
            restaurantId: auth.restaurant.id,
            razorpayPaymentId: payment_id,
            razorpaySubscriptionId: order_id,
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

        subscriptionRecord = newSub;
      }

      // 2. Mark restaurant account as active
      await db
        .update(restaurants)
        .set({
          accountStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, auth.restaurant.id));
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Payment verified and processed successfully",
      order_id,
      payment_id,
      subscription: subscriptionRecord,
    });
  } catch (error: any) {
    console.error("POST /api/verify-payment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error verifying payment" },
      { status: 500 }
    );
  }
}
