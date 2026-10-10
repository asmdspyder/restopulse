import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { restaurants, subscriptions, users } from "@/lib/db/schema";
import { PRICING_PLANS } from "@/lib/razorpay";
import { eq } from "drizzle-orm";

// Helper to find associated restaurant from webhook data
async function findRestaurant(
  restaurantIdNote?: string,
  email?: string,
  orderId?: string
) {
  // 1. Check notes.restaurantId if it's a valid UUID
  if (
    restaurantIdNote &&
    restaurantIdNote !== "direct_checkout" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantIdNote)
  ) {
    const [found] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantIdNote))
      .limit(1);
    if (found) return found;
  }

  // 2. Check by order ID in subscriptions
  if (orderId) {
    const [sub] = await db
      .select({
        restaurant: restaurants,
      })
      .from(subscriptions)
      .leftJoin(restaurants, eq(subscriptions.restaurantId, restaurants.id))
      .where(eq(subscriptions.razorpaySubscriptionId, orderId))
      .limit(1);
    if (sub?.restaurant) return sub.restaurant;
  }

  // 3. Check by customer email
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const [byEmail] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.email, cleanEmail))
      .limit(1);
    if (byEmail) return byEmail;

    const [user] = await db
      .select({
        restaurant: restaurants,
      })
      .from(users)
      .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
      .where(eq(users.email, cleanEmail))
      .limit(1);
    if (user?.restaurant) return user.restaurant;
  }

  return null;
}

// GET: Health check & info for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/razorpay",
    message: "Razorpay Webhook endpoint is active and listening for POST notifications.",
  });
}

// POST: Main Razorpay Webhook Handler
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    if (!signature) {
      console.warn("[Razorpay Webhook] Missing x-razorpay-signature header");
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && webhookSecret !== "rzp_webhook_secret_placeholder") {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const isSignatureValid =
        expectedSignature.length === signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf-8"),
          Buffer.from(signature, "utf-8")
        );

      if (!isSignatureValid) {
        console.error("[Razorpay Webhook] Invalid webhook signature received");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    } else {
      console.warn(
        "[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not set in .env. Skipping signature verification."
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received event: ${eventType} (ID: ${event.id})`);

    switch (eventType) {
      // 1. Payment Captured (Standard Web Checkout success)
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const orderId = payment.order_id;
        const paymentId = payment.id;
        const amountPaise = Number(payment.amount) || 39900;
        const planType =
          payment.notes?.plan === "yearly" || amountPaise >= 100000
            ? "yearly"
            : "monthly";

        const restaurant = await findRestaurant(
          payment.notes?.restaurantId,
          payment.email,
          orderId
        );

        if (restaurant) {
          const planConfig = PRICING_PLANS[planType] || PRICING_PLANS.monthly;
          const now = new Date();
          const periodEnd = new Date(now);
          if (planType === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Idempotency check: see if payment was already recorded
          const [existingPaymentSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.razorpayPaymentId, paymentId))
            .limit(1);

          if (!existingPaymentSub) {
            await db.insert(subscriptions).values({
              restaurantId: restaurant.id,
              razorpayPaymentId: paymentId,
              razorpaySubscriptionId: orderId || null,
              planType,
              billingInterval: planConfig.interval,
              amount: (amountPaise / 100).toFixed(2),
              currency: payment.currency || "INR",
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              nextBillingAt: periodEnd,
            });
          }

          // Ensure restaurant is activated
          await db
            .update(restaurants)
            .set({
              accountStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(restaurants.id, restaurant.id));

          console.log(
            `[Razorpay Webhook] Successfully activated workspace for restaurant: ${restaurant.businessName} (${restaurant.id})`
          );
        } else {
          console.warn(
            `[Razorpay Webhook] payment.captured: Could not link payment ${paymentId} to a workspace`
          );
        }
        break;
      }

      // 2. Order Paid
      case "order.paid": {
        const order = event.payload?.order?.entity;
        if (!order) break;

        const orderId = order.id;
        const restaurant = await findRestaurant(
          order.notes?.restaurantId,
          undefined,
          orderId
        );

        if (restaurant) {
          await db
            .update(restaurants)
            .set({
              accountStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(restaurants.id, restaurant.id));
        }
        break;
      }

      // 3. Recurring Subscription Charged / Renewed
      case "subscription.charged":
      case "subscription.activated": {
        const subEntity = event.payload?.subscription?.entity;
        if (!subEntity) break;

        const razorpaySubId = subEntity.id;
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId))
          .limit(1);

        if (existingSub) {
          const now = new Date();
          const periodEnd = new Date(now);
          if (existingSub.planType === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await db
            .update(subscriptions)
            .set({
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              nextBillingAt: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSub.id));

          await db
            .update(restaurants)
            .set({
              accountStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(restaurants.id, existingSub.restaurantId));
        }
        break;
      }

      // 4. Subscription Cancelled or Halted
      case "subscription.cancelled":
      case "subscription.halted": {
        const subEntity = event.payload?.subscription?.entity;
        if (!subEntity) break;

        const razorpaySubId = subEntity.id;
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId))
          .limit(1);

        if (existingSub) {
          await db
            .update(subscriptions)
            .set({
              status: eventType === "subscription.cancelled" ? "cancelled" : "halted",
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSub.id));
        }
        break;
      }

      // 5. Payment Failed
      case "payment.failed": {
        const failedPayment = event.payload?.payment?.entity;
        console.warn(
          `[Razorpay Webhook] Payment failed: ${failedPayment?.id} - Error: ${failedPayment?.error_description}`
        );
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    // Acknowledge receipt to Razorpay
    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
