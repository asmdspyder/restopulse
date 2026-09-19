"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertOctagon, CreditCard, ShieldAlert, LogOut, Loader2, CheckCircle2 } from "lucide-react";

function BlockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonParam = searchParams.get("reason") || "deactivated";

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
        throw new Error(orderData.error || "Failed to initialize renewal payment");
      }

      // 2. Verify / activate subscription
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_renew_${Date.now()}`,
          signature: "simulated_valid_signature",
          plan,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      // Redirect to dashboard
      router.push("/app/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to renew subscription");
      setLoading(false);
    }
  };

  const isDeactivated = reasonParam === "deactivated" || authStatus?.isDeactivated;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/60 sm:rounded-2xl sm:px-10 border border-slate-200/80 text-center">
          {isDeactivated ? (
            /* MANUAL DEACTIVATION STATE (NO PAYMENT OPTION) */
            <>
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Account Deactivated
              </h2>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed text-left">
                <p className="font-semibold text-slate-900 mb-1">
                  Your account has been deactivated by the administrator.
                </p>
                <p className="text-xs text-slate-600">
                  Please contact the administrator or your support team at{" "}
                  <span className="font-mono text-emerald-700">support@restopulse.io</span> to continue using the application.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* SUBSCRIPTION INACTIVE / EXPIRED STATE */
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-5">
                <CreditCard className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Your subscription is inactive
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Your subscription payment was not completed or your subscription has expired. Please renew your subscription to continue using the application.
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                  {error}
                </div>
              )}

              {/* Plan Choice for Renewal */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`p-3 rounded-xl border text-xs transition ${
                    plan === "monthly"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Monthly</span>
                  <span className="text-slate-700 font-extrabold text-sm">₹199 / mo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  className={`p-3 rounded-xl border text-xs transition relative ${
                    plan === "yearly"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Annual</span>
                  <span className="text-emerald-700 font-extrabold text-sm">₹1,999 / yr</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-800">Save 17%</span>
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Renewal...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Renew Subscription ({plan === "yearly" ? "₹1,999/yr" : "₹199/mo"})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
      <BlockedContent />
    </Suspense>
  );
}
