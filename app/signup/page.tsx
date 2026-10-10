"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Lock,
} from "lucide-react";
import { loadRazorpayScript } from "@/components/razorpay-checkout-button";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan");
  const initialPlan: "trial" | "monthly" | "yearly" =
    rawPlan === "monthly" || rawPlan === "yearly" || rawPlan === "trial"
      ? rawPlan
      : "trial";

  const [plan, setPlan] = useState<"trial" | "monthly" | "yearly">(initialPlan);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string | null>(null);
  const [paymentPendingData, setPaymentPendingData] = useState<{
    plan: "monthly" | "yearly";
    bizName: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Directly launches Razorpay Standard Checkout for monthly or yearly plans
  const handleDirectPayment = async (
    selectedPlan: "monthly" | "yearly",
    customerEmail: string,
    customerPhone: string,
    customerName: string
  ) => {
    try {
      setPaymentStatusText("Initializing Razorpay checkout...");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Unable to load Razorpay payment SDK. Please verify your internet connection."
        );
      }

      // 1. Create Order on backend
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initialize payment order");
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_TmAcAQ44tFd1V5";

      // 2. Open standard Razorpay modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RestoPulse",
        description:
          orderData.planName ||
          `${selectedPlan === "yearly" ? "Annual" : "Monthly"} Restaurant Workspace Subscription`,
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#047857",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStatusText(null);
            setPaymentPendingData({
              plan: selectedPlan,
              bizName: customerName,
              message:
                "Payment was not completed. You can complete payment to activate, or proceed into your workspace on the 7-day free trial.",
            });
          },
        },
        handler: async (response: any) => {
          setPaymentStatusText("Verifying payment signature...");
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            // Payment verified and subscription is active!
            router.push("/app/onboarding");
            router.refresh();
          } catch (vErr: any) {
            setError(vErr.message || "Failed to verify payment");
            setLoading(false);
            setPaymentStatusText(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp: any) => {
        setLoading(false);
        setPaymentStatusText(null);
        setError(resp.error?.description || "Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setPaymentStatusText(null);
      setError(err.message || "Payment process could not be completed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentPendingData(null);
    setPaymentStatusText(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // 1. Create account & initialize defaults
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          password,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // If user chose Free Trial: directly proceed to onboarding
      if (plan === "trial") {
        router.push("/app/onboarding");
        router.refresh();
        return;
      }

      // User chose direct payment (Monthly or Yearly) -> open Razorpay Checkout modal
      await handleDirectPayment(plan, email, phone, contactName);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
      setPaymentStatusText(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-500/20">
            R
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Restopulse</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Create your restaurant workspace
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {paymentPendingData && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-3">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Account Created • Payment Incomplete</span>
              </div>
              <p>{paymentPendingData.message}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDirectPayment(paymentPendingData.plan, email, phone, contactName)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Retry Payment ({paymentPendingData.plan === "yearly" ? "₹3,999" : "₹399"})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/app/onboarding");
                    router.refresh();
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Continue with 7-Day Free Trial
                </button>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Plan Selector: 3 Separate Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Choose Workspace Plan
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {plan === "trial"
                    ? "7-Day Free Trial"
                    : plan === "yearly"
                    ? "Annual Plan (Save ₹789)"
                    : "Monthly Plan"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Free Trial */}
                <button
                  type="button"
                  onClick={() => setPlan("trial")}
                  className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                    plan === "trial"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Free Trial</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        7 Days
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                      ₹0<span className="text-[11px] font-normal text-slate-500"> / 7 days</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium mt-2">
                    Zero payment today • Full access
                  </span>
                </button>

                {/* 2. Monthly Plan */}
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                    plan === "monthly"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Monthly Plan</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        Direct Pay
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                      ₹399<span className="text-[11px] font-normal text-slate-500"> / month</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium mt-2">
                    Flexible monthly • Instant active
                  </span>
                </button>

                {/* 3. Yearly Plan */}
                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                    plan === "yearly"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">Annual Plan</span>
                      <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Save ₹789
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                      ₹3,999<span className="text-[11px] font-normal text-slate-500"> / year</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-2">
                    2 Months Free (₹333/mo)
                  </span>
                </button>
              </div>

              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                {plan === "trial" ? (
                  <span>
                    <strong>7-Day Free Trial:</strong> Full access to all features. No card charged today.
                  </span>
                ) : plan === "monthly" ? (
                  <span>
                    <strong>Direct Monthly Subscription:</strong> ₹399/mo via Razorpay with immediate workspace activation.
                  </span>
                ) : (
                  <span>
                    <strong>Direct Annual Subscription:</strong> ₹3,999/yr (Save ₹789 / 2 months free) via Razorpay.
                  </span>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Restaurant / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Restaurant Name"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Restaurant Location & Address Details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Restaurant Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building, street or landmark"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    State
                  </label>
                  <input
                    type="text"
                    list="indian-states"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                  <datalist id="indian-states">
                    <option value="Andhra Pradesh" />
                    <option value="Arunachal Pradesh" />
                    <option value="Assam" />
                    <option value="Bihar" />
                    <option value="Chhattisgarh" />
                    <option value="Goa" />
                    <option value="Gujarat" />
                    <option value="Haryana" />
                    <option value="Himachal Pradesh" />
                    <option value="Jharkhand" />
                    <option value="Karnataka" />
                    <option value="Kerala" />
                    <option value="Madhya Pradesh" />
                    <option value="Maharashtra" />
                    <option value="Manipur" />
                    <option value="Meghalaya" />
                    <option value="Mizoram" />
                    <option value="Nagaland" />
                    <option value="Odisha" />
                    <option value="Punjab" />
                    <option value="Rajasthan" />
                    <option value="Sikkim" />
                    <option value="Tamil Nadu" />
                    <option value="Telangana" />
                    <option value="Tripura" />
                    <option value="Uttar Pradesh" />
                    <option value="Uttarakhand" />
                    <option value="West Bengal" />
                    <option value="Delhi" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 400001"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {plan === "trial"
                  ? "7-day full access free trial. Cancel or upgrade anytime."
                  : "Instant workspace activation. 256-bit SSL secured payment via Razorpay."}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{paymentStatusText || "Setting up your workspace..."}</span>
                </>
              ) : plan === "trial" ? (
                <>
                  <span>Start 7-Day Free Trial (₹0)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : plan === "monthly" ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹399 & Activate Workspace</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹3,999 & Activate Workspace (Save ₹789)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
