import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getRazorpayClient, PRICING_PLANS, PlanKey } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await getAuthContext();

    // Determine amount and currency
    let amountInPaise: number;
    let plan = body.plan as PlanKey | undefined;

    if (body.amount !== undefined && body.amount !== null) {
      amountInPaise = Number(body.amount);
    } else if (plan && PRICING_PLANS[plan]) {
      amountInPaise = PRICING_PLANS[plan].amountInPaise;
    } else {
      // Default to monthly plan
      plan = "monthly";
      amountInPaise = PRICING_PLANS.monthly.amountInPaise;
    }

    // Validation: Minimum amount 100 paise (₹1.00)
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1.00)" },
        { status: 400 }
      );
    }

    const currency = (body.currency || "INR").toUpperCase();
    const receipt =
      body.receipt ||
      `rcpt_${auth?.restaurant?.id ? auth.restaurant.id.slice(0, 8) : "user"}_${Date.now()}`;

    const rzp = getRazorpayClient();
    if (!rzp) {
      console.error("Razorpay client initialization failed: Missing key ID or secret");
      return NextResponse.json(
        { error: "Payment gateway configuration error. Please check server credentials." },
        { status: 500 }
      );
    }

    // Call Razorpay API: POST https://api.razorpay.com/v1/orders
    const order = await rzp.orders.create({
      amount: Math.round(amountInPaise),
      currency,
      receipt,
      notes: {
        restaurantId: auth?.restaurant?.id || "direct_checkout",
        plan: plan || "custom",
        restaurantName: auth?.restaurant?.businessName || "RestoPulse Customer",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      receipt: order.receipt,
      planName: plan && PRICING_PLANS[plan] ? PRICING_PLANS[plan].name : "Standard Plan",
    });
  } catch (error: any) {
    console.error("POST /api/create-order error:", error);
    return NextResponse.json(
      { error: error?.error?.description || error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
