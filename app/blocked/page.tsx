"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, ShieldAlert, LogOut, Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";

function BlockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonParam = searchParams.get("reason") || "trial_expired";

  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setAuthStatus(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleRenew = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initialize payment");
      }

      // 2. Open Razorpay Checkout modal if live SDK is available, else simulated fallback
      if (
        typeof window !== "undefined" &&
        (window as any).Razorpay &&
        !orderData.isSimulated &&
        orderData.key &&
        !orderData.key.includes("placeholder")
      ) {
        const rzpInstance = new (window as any).Razorpay({
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "RestoPulse",
          description: orderData.planName || "Restaurant Workspace Subscription",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id || orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  plan,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
              router.push("/app/dashboard");
              router.refresh();
            } catch (e: any) {
              setError(e.message || "Failed to verify payment");
              setLoading(false);
            }
          },
          theme: { color: "#047857" },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        });
        rzpInstance.open();
      } else {
        // Simulated / Sandbox activation
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_sub_${Date.now()}`,
            signature: "simulated_valid_signature",
            plan,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Payment verification failed");
        }

        router.push("/app/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to activate subscription");
      setLoading(false);
    }
  };

  const isDeactivated = reasonParam === "deactivated" || authStatus?.isDeactivated;
  const isTrialExpired =
    reasonParam === "trial_expired" ||
    authStatus?.blockReason === "trial_expired" ||
    (!isDeactivated && authStatus?.isTrial && !authStatus?.isSubscriptionActive);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-700/20">
              R
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">RestoPulse</span>
          </Link>
        </div>

        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-200 text-center">
          {isDeactivated ? (
            /* MANUAL DEACTIVATION STATE */
            <>
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Account Deactivated
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed text-left">
                <p className="font-semibold text-slate-900 mb-1">
                  Your restaurant account has been deactivated by the administrator.
                </p>
                <p className="text-xs text-slate-600">
                  Please contact the administrator or support at{" "}
                  <span className="font-mono text-emerald-700 font-semibold">support@restopulse.io</span> to reactivate your account.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* TRIAL EXPIRED OR SUBSCRIPTION INACTIVE STATE */
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-5 border border-amber-200">
                {isTrialExpired ? <Clock className="w-9 h-9" /> : <CreditCard className="w-9 h-9" />}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isTrialExpired ? "Your 7-Day Free Trial Has Ended" : "Subscription Inactive"}
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isTrialExpired
                  ? "Your 7-day free trial period has concluded. To reactivate your restaurant workspace and continue using daily SOP checklists, food waste tracking, and recipe costing, please choose a plan below."
                  : "Your subscription payment was not completed or your subscription has expired. Please choose a plan below to reactivate your workspace."}
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                  {error}
                </div>
              )}

              {/* Plan Choice for Renewal */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`p-3.5 rounded-2xl border text-xs transition cursor-pointer ${
                    plan === "monthly"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block">Monthly</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Standard
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">₹399<span className="text-xs font-normal text-slate-500"> / mo</span></div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Flexible monthly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  className={`p-3.5 rounded-2xl border text-xs transition relative cursor-pointer ${
                    plan === "yearly"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block">Annual</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">
                      Save ₹789
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">₹3,999<span className="text-xs font-normal text-slate-500"> / yr</span></div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">2 Months Free</span>
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isTrialExpired ? "Subscribe & Unlock Workspace" : "Renew Subscription"} (
                        {plan === "yearly" ? "₹3,999/yr" : "₹399/mo"})
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <BlockedContent />
    </Suspense>
  );
}
