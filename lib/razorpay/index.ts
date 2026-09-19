import crypto from "crypto";
import Razorpay from "razorpay";

export const PRICING_PLANS = {
  monthly: {
    id: "plan_monthly_199",
    name: "Monthly Plan",
    amount: 199,
    amountInPaise: 19900,
    interval: "month",
    periodMonths: 1,
    formattedPrice: "₹199 / month",
    savingsLabel: null,
  },
  yearly: {
    id: "plan_yearly_1999",
    name: "Annual Plan",
    amount: 1999,
    amountInPaise: 199900,
    interval: "year",
    periodMonths: 12,
    formattedPrice: "₹1,999 / year",
    savingsLabel: "Save ₹389 (17% off)",
  },
} as const;

export type PlanKey = keyof typeof PRICING_PLANS;

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === "rzp_test_placeholder_key") {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholder_secret";
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body.toString())
    .digest("hex");
  return expectedSignature === signature;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expectedSignature === signature;
}
