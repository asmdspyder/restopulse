"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckSquare,
  TrendingDown,
  ClipboardCheck,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Utensils,
  Coffee,
  Store,
  DollarSign,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Smartphone,
  Sliders,
  ChevronDown,
  ChevronUp,
  Receipt,
  Layers,
  Clock,
  Trash2,
  Camera,
  Check,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"checklist" | "wastage" | "reports">("checklist");

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "How does live camera proof work in checklists?",
      a: "When staff check an inspection item (like kitchen cleanliness or fridge temp), they can tap the camera button. The live camera opens directly on their phone or tablet to snap instant visual proof. Photos are securely stored with timestamps so owners can verify shift compliance anytime.",
    },
    {
      q: "How fast is recording food waste during busy kitchen hours?",
      a: "It takes under 10 seconds! Staff simply search or tap the ingredient name, enter the quantity (e.g. 2 kg), select the reason (spoilage, overcooked, expired), and tap Save. The app automatically calculates the exact rupee value lost based on your purchase cost.",
    },
    {
      q: "Can I use RestoPulse on my staff's regular mobile phones?",
      a: "Yes! RestoPulse is 100% cloud-based and mobile-first. There is nothing to install from an app store. Staff can open it directly in any mobile browser on Android or iPhone, log in with their staff PIN or password, and complete tasks seamlessly.",
    },
    {
      q: "Can I customize the checklists for my restaurant?",
      a: "Absolutely. With our easy Checklist Builder, you can create custom sections (Opening, Kitchen Prep, Bar, Closing), add checkboxes, number fields, temperature checks, manager signature boxes, and petty cash expense trackers.",
    },
    {
      q: "What is included in the ₹399 monthly plan?",
      a: "Everything! You get unlimited staff accounts, unlimited daily shift checklists, full live camera photo proof storage, complete food waste tracking with cost calculations, exportable reports, and dedicated customer support.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">RestoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                Kitchen OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-400">
            <a href="#features" className="hover:text-amber-400 transition">Features</a>
            <a href="#preview" className="hover:text-amber-400 transition">Live Demo</a>
            <a href="#pricing" className="hover:text-amber-400 transition">Pricing</a>
            <a href="#faq" className="hover:text-amber-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 px-4 py-2 rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glow ambient gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-amber-300 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Built for Restaurants, Cafes & Cloud Kitchens</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Run Flawless Kitchen Shifts.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Stop Food Waste.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            The remarkably simple daily app for restaurant managers and staff. Complete opening shift checklists with live camera proof, log wasted food in 10 seconds, and protect your profits.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started for ₹399 / month</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-850 hover:text-white transition flex items-center justify-center"
            >
              View Live Preview
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Live camera photo verification
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Works on any smartphone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Unlimited staff logins
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT PREVIEW SECTION */}
      <section id="preview" className="py-16 md:py-24 bg-slate-900/60 border-y border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              See How RestoPulse Works in Your Kitchen
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Intuitive controls designed for busy chefs, staff, and restaurant managers.
            </p>

            {/* Tab switcher */}
            <div className="mt-6 inline-flex p-1.5 rounded-2xl bg-slate-950 border border-slate-800 gap-1.5">
              <button
                onClick={() => setActiveTab("checklist")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "checklist"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📋 Daily Checklists & Photos
              </button>
              <button
                onClick={() => setActiveTab("wastage")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "wastage"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🗑️ 10-Sec Wastage Logger
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "reports"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📊 Cost Reports & Insights
              </button>
            </div>
          </div>

          {/* Interactive Card Display */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {activeTab === "checklist" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Kitchen Opening Checklist
                    </span>
                    <h3 className="text-base font-extrabold text-white">Morning Prep & Station Inspection</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-800/80">
                    ✓ 3 of 4 Done
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Verify walk-in chiller temperature (&lt; 4°C)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">3.2°C • 8:15 AM</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Sanitize food prep tables & cutting boards
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 text-[10px] font-bold border border-amber-400/20 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Photo Attached
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg border border-slate-700 bg-slate-950" />
                      <span className="text-xs font-medium text-slate-300">
                        Check oil quality in deep fryers
                      </span>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Snap Photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wastage" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Fast 10-Second Log
                    </span>
                    <h3 className="text-base font-extrabold text-white">Food & Ingredient Wastage Entry</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800">
                    Auto Cost Calculation
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-left">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Item</span>
                    <span className="text-xs font-bold text-white">Paneer (Cottage Cheese)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Quantity & Reason</span>
                    <span className="text-xs font-bold text-white">1.5 kg • Spoilage / Expired</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">Calculated Loss</span>
                    <span className="text-sm font-black text-amber-300">₹450.00</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Live Camera Proof Captured • Ready to save</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">Logged by Chef Rahul</span>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Monthly Overview
                    </span>
                    <h3 className="text-base font-extrabold text-white">Wastage Loss & Root Cause Breakdown</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-bold border border-rose-800/80">
                    ₹8,420 Lost This Month
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Top Wasted Items</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-white">
                        <span>1. Chicken Breast</span>
                        <span className="text-rose-400">₹3,200</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-300">
                        <span>2. Fresh Cream</span>
                        <span className="text-rose-400">₹1,850</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-300">
                        <span>3. Paneer</span>
                        <span className="text-rose-400">₹1,450</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Main Waste Causes</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-white">
                        <span>Over-prep during lunch</span>
                        <span className="text-amber-400">54%</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-300">
                        <span>Spoilage / Storage</span>
                        <span className="text-amber-400">28%</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-300">
                        <span>Kitchen cooking error</span>
                        <span className="text-amber-400">18%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Why Restaurants Choose RestoPulse
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Everything You Need to Run Tight, Profitable Shifts
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Camera Proof</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No fake tickmarks. Staff take live photo proof of stations, food prep, and cleanliness directly from their camera.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">10-Second Wastage Logging</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quick food waste recording by kitchen staff with automatic unit pricing snapshots and rupee loss calculations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-400/10 text-blue-400 flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Custom SOP Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Build custom opening, closing, and hygiene checklists with manager digital signatures and petty cash logs.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION - ₹399/mo & ₹3,999/yr */}
      <section id="pricing" className="py-20 md:py-28 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            One Plan. All Features Included.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            No hidden charges, no per-user pricing. Full access for your whole restaurant team.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                billingPeriod === "monthly"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                billingPeriod === "yearly"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-black border border-emerald-800">
                Save ₹789
              </span>
            </button>
          </div>

          {/* Pricing Card */}
          <div className="mt-10 max-w-md mx-auto rounded-3xl border-2 border-amber-400/80 bg-slate-950 p-8 shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md">
              Complete Restaurant Access
            </div>

            <div className="text-center mt-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {billingPeriod === "yearly" ? "₹3,999" : "₹399"}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {billingPeriod === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {billingPeriod === "yearly"
                  ? "Billed annually (approx ₹333/month • 2 months free)"
                  : "Billed monthly • Cancel anytime"}
              </p>
            </div>

            <ul className="mt-8 space-y-3 text-left text-xs font-medium text-slate-300 border-y border-slate-800/80 py-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unlimited Staff & Manager Logins</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Daily Shift Checklists & Custom Builder</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Live Camera Photo Proof with Cloud Storage</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>10-Second Food Waste Logging with Cost Snapshots</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Digital Manager Signature & Cash Expense Logs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Exportable CSV Reports & Analytics</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Free Trial Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white hover:text-amber-400 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    openFaq === idx ? "rotate-180 text-amber-400" : "text-slate-500"
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-800/80 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              R
            </div>
            <span className="font-bold text-slate-300">RestoPulse</span>
            <span>• Restaurant Shift Operations & Waste Management</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-300 transition">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
