import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getRazorpayClient, PRICING_PLANS, PlanKey } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = (body.plan || "monthly") as PlanKey;
    const planConfig = PRICING_PLANS[plan] || PRICING_PLANS.monthly;

    const rzp = getRazorpayClient();

    if (rzp) {
      // Create Razorpay Order or Subscription
      const order = await rzp.orders.create({
        amount: planConfig.amountInPaise,
        currency: "INR",
        receipt: `rcpt_${auth.restaurant.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          restaurantId: auth.restaurant.id,
          plan,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        businessName: auth.restaurant.businessName,
        planName: planConfig.name,
      });
    }

    // Realistic Demo/Sandbox fallback
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      orderId: mockOrderId,
      amount: planConfig.amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_simulated",
      businessName: auth.restaurant.businessName,
      planName: planConfig.name,
      isSimulated: true,
    });
  } catch (error: any) {
    console.error("POST /api/razorpay/create-order error:", error);
    return NextResponse.json({ error: error.message || "Failed to create subscription order" }, { status: 500 });
  }
}
