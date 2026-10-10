"use client";

import { useState } from "react";
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface RazorpayCheckoutButtonProps {
  plan?: "monthly" | "yearly";
  amount?: number; // In paise (optional)
  currency?: string;
  buttonText?: string;
  className?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Helper to ensure Razorpay checkout script is loaded
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  plan = "monthly",
  amount,
  currency = "INR",
  buttonText,
  className = "",
  onSuccess,
  onError,
  children,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"error" | "success" | "info" | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      // 1. Ensure Razorpay script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Unable to load Razorpay SDK. Please check your internet connection.");
      }

      // 2. Call backend to create Razorpay Order
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          amount,
          currency,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to initialize payment order");
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_TmAcAQ44tFd1V5";

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RestoPulse",
        description:
          orderData.planName ||
          `${plan === "yearly" ? "Annual" : "Monthly"} Restaurant Workspace Subscription`,
        image: "https://cdn-icons-png.flaticon.com/512/3448/3448609.png",
        order_id: orderData.order_id || orderData.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setStatusMessage("Verifying payment signature...");
            setStatusType("info");

            // 4. Send payment details to verification endpoint
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            setStatusMessage("Payment successful! Workspace activated.");
            setStatusType("success");
            setLoading(false);

            if (onSuccess) {
              onSuccess(verifyData);
            } else {
              window.location.reload();
            }
          } catch (verifyErr: any) {
            console.error("Payment verification error:", verifyErr);
            const errMsg = verifyErr.message || "Failed to verify payment signature";
            setStatusMessage(errMsg);
            setStatusType("error");
            setLoading(false);
            if (onError) onError(errMsg);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#047857", // Emerald-700
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatusMessage("Checkout window closed by user");
            setStatusType("info");
          },
        },
      };

      // 5. Open Razorpay modal
      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      rzpInstance.on("payment.failed", function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        const errMsg = response.error?.description || "Payment failed. Please try again.";
        setStatusMessage(errMsg);
        setStatusType("error");
        setLoading(false);
        if (onError) onError(errMsg);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Checkout initialization error:", err);
      const errMsg = err.message || "Failed to start payment checkout";
      setStatusMessage(errMsg);
      setStatusType("error");
      setLoading(false);
      if (onError) onError(errMsg);
    }
  };

  const defaultText =
    buttonText ||
    (plan === "yearly"
      ? "Subscribe Annual Plan (₹3,999/yr)"
      : "Subscribe Monthly Plan (₹399/mo)");

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Opening Razorpay Checkout...</span>
          </>
        ) : children ? (
          children
        ) : (
          <>
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>{defaultText}</span>
          </>
        )}
      </button>

      {statusMessage && (
        <div
          className={`mt-2 p-2 rounded-xl text-xs flex items-center gap-1.5 ${
            statusType === "error"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : statusType === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {statusType === "error" && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />}
          {statusType === "success" && (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
