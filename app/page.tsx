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
  Play,
  Star,
} from "lucide-react";

export default function LandingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"checklist" | "wastage" | "reports">("checklist");
  
  // Interactive Simulator States
  const [simChecklist, setSimChecklist] = useState([
    { id: 1, text: "Deep fry oil temp checked (175°C - 180°C)", done: true, hasPhoto: true, time: "09:15 AM", user: "Chef Rahul" },
    { id: 2, text: "Walk-in chiller & freezer temps logged (3°C)", done: true, hasPhoto: true, time: "09:22 AM", user: "Chef Rahul" },
    { id: 3, text: "Raw meat prep station sanitized with food-grade spray", done: true, hasPhoto: false, time: "09:30 AM", user: "Vikram S." },
    { id: 4, text: "Bar optics & draught lines flushed and wiped", done: false, hasPhoto: false, time: "", user: "" },
    { id: 5, text: "POS cash float counted & verified (₹5,000)", done: false, hasPhoto: false, time: "", user: "" },
  ]);

  const [simWastages, setSimWastages] = useState([
    { id: 1, item: "Fresh Paneer Cubes", qty: "1.2 kg", cost: "₹420", reason: "Expired / Sour", photo: true, time: "11:45 AM" },
    { id: 2, item: "Tomato Gravy Base", qty: "3.5 Ltr", cost: "₹385", reason: "Burnt bottom batch", photo: true, time: "02:15 PM" },
    { id: 3, item: "Burger Buns (Pack of 12)", qty: "2 packs", cost: "₹190", reason: "Crushed in delivery", photo: false, time: "04:30 PM" },
  ]);

  const toggleChecklistItem = (id: number) => {
    setSimChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextDone = !item.done;
        return {
          ...item,
          done: nextDone,
          time: nextDone ? "Just now" : "",
          user: nextDone ? "Staff" : "",
        };
      }
      return item;
    }));
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "How does live camera photo proof work?",
      a: "When staff complete an opening or hygiene checklist, they can tap the camera icon to snap real-time photographic proof. Photos are captured live through their device camera (no pre-saved gallery uploads allowed) and uploaded directly to secure Cloudflare R2 storage with timestamps.",
    },
    {
      q: "How fast is recording food wastage during a busy rush?",
      a: "Staff can record a waste item in under 8 seconds. Tap the ingredient name, enter the quantity, select a reason (spoilage, overcooked, expired), and optional photo proof. The system instantly tallies financial loss based on your cost catalogue.",
    },
    {
      q: "Can staff access this on any phone or tablet?",
      a: "Yes! RestoPulse is a mobile-first web app that works seamlessly on any Android smartphone, iPhone, iPad, or POS terminal without downloading anything from an app store. Staff get an ultra-simple 2-button interface (Checklist & Wastage).",
    },
    {
      q: "Can I customize the checklists for my restaurant?",
      a: "Yes. Our visual Checklist Builder allows you to create custom sections (Kitchen Opening, Bar Prep, Housekeeping, Manager Handover), add checkboxes, number inputs, temperature checks, cash trackers, and digital signature pads.",
    },
    {
      q: "What is included in the ₹399 monthly plan?",
      a: "Everything is included! You get unlimited staff members, unlimited daily shift checklists, complete food waste tracking with financial rupee loss calculations, Cloudflare R2 photo storage, PDF exports, and WhatsApp support.",
    },
  ];

  const simCompletedCount = simChecklist.filter(i => i.done).length;
  const simPercent = Math.round((simCompletedCount / simChecklist.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-500/20">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">RestoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Kitchen OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#preview" className="hover:text-indigo-600 transition">Live Demo</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Start 14-Day Free Trial</span>
              <span className="sm:hidden">Try Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-[#F8FAFC]">
        {/* Soft background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-indigo-100/50 via-blue-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Modern Kitchen Operations Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-slate-500 font-semibold">Over 140+ Restaurants</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            Run Your Restaurant Shifts with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
              Zero Chaos & Real Accountability
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            RestoPulse replaces messy paper logs with real-time camera-verified checklists, instant 10-second food wastage tracking, and digital shift sign-offs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Start Free Trial — ₹399/mo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center shadow-xs"
            >
              Explore Interactive Demo
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Live camera photo proof
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Works on any phone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Unlimited staff logins
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT SIMULATOR SECTION */}
      <section id="preview" className="py-16 md:py-24 bg-white border-y border-slate-200/80 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1.5">
              Interactive Product Demo
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tap & Test How It Works in Your Kitchen
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Click the items below to see instant completion updates and live camera photo triggers.
            </p>

            {/* Tab switcher */}
            <div className="mt-6 inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 gap-1.5 shadow-inner">
              <button
                onClick={() => setActiveTab("checklist")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "checklist"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📋 Daily Checklists & Photos
              </button>
              <button
                onClick={() => setActiveTab("wastage")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "wastage"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🗑️ 10-Sec Wastage Logger
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "reports"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📊 Cost Reports & Shift Handover
              </button>
            </div>
          </div>

          {/* Interactive Card Simulator */}
          <div className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {activeTab === "checklist" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Shift Opening Verification
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Kitchen & Bar Station Morning Check
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 block">
                        {simPercent}% Complete
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {simCompletedCount} of {simChecklist.length} tasks done
                      </span>
                    </div>
                    <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${simPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {simChecklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        item.done
                          ? "bg-white border-slate-200 shadow-xs"
                          : "bg-white/80 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                            item.done
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-slate-300 bg-slate-50"
                          }`}
                        >
                          {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            item.done ? "text-slate-900" : "text-slate-600"
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.hasPhoto && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Live Photo
                          </span>
                        )}
                        {item.done && item.time && (
                          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                            {item.user} • {item.time}
                          </span>
                        )}
                        {!item.done && (
                          <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                            Tap to Check
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "wastage" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Kitchen Food Waste Tracking
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Today's Wastage Log
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    Total Loss: ₹995.00
                  </span>
                </div>

                <div className="grid gap-2.5">
                  {simWastages.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{w.item}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {w.qty} • Reason: <span className="font-semibold text-slate-700">{w.reason}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          {w.cost}
                        </span>
                        {w.photo && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-indigo-600" /> Photo Proof
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Shift Handover & Financial Audit
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Evening Closing Summary
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    ✓ Verified by Manager
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Checklist Compliance</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">96%</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">18 of 19 verified</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Wastage Cost</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">₹995</span>
                    <span className="text-[11px] text-rose-600 font-semibold">3 items recorded</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Petty Cash Expenses</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">₹650</span>
                    <span className="text-[11px] text-slate-600 font-semibold">2 bills verified</span>
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
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
            Why Restaurant Owners Choose RestoPulse
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Kitchen Speed, Designed for Owner Peace of Mind
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Live Camera Proof</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              No fake tickmarks. Staff take live photo proof of stations, food prep, and cleanliness directly from their camera.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">10-Second Wastage Logging</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Quick food waste recording by kitchen staff with automatic unit pricing snapshots and rupee loss calculations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Custom SOP Builder</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Build custom opening, closing, and hygiene checklists with manager digital signatures and petty cash logs.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION - ₹399/mo & ₹3,999/yr */}
      <section id="pricing" className="py-20 md:py-28 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            One Plan. All Features Included.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            No hidden charges, no per-user pricing. Full access for your entire restaurant team.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingPeriod === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                billingPeriod === "yearly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                Save ₹789
              </span>
            </button>
          </div>

          {/* Pricing Card */}
          <div className="mt-10 max-w-md mx-auto rounded-3xl border-2 border-indigo-600 bg-white p-8 shadow-xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-md">
              Complete Restaurant Access
            </div>

            <div className="text-center mt-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                  {billingPeriod === "yearly" ? "₹3,999" : "₹399"}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {billingPeriod === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {billingPeriod === "yearly"
                  ? "Billed annually (approx ₹333/month • 2 months free)"
                  : "Billed monthly • 14-Day Free Trial • Cancel anytime"}
              </p>
            </div>

            <ul className="mt-8 space-y-3 text-left text-xs font-medium text-slate-700 border-y border-slate-100 py-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>Unlimited Staff & Manager Accounts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>Daily Shift Checklists & Custom Builder</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>Live Camera Photo Proof with Cloud Storage</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>10-Second Food Waste Logging with Cost Snapshots</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>Digital Manager Signature & Cash Expense Logs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                <span>Exportable CSV Reports & Shift History</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    openFaq === idx ? "rotate-180 text-indigo-600" : "text-slate-400"
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              R
            </div>
            <span className="font-bold text-slate-900">RestoPulse</span>
            <span>• Restaurant Shift Operations & Waste Management</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-indigo-600 transition">Sign In</Link>
            <Link href="/signup" className="hover:text-indigo-600 transition">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
