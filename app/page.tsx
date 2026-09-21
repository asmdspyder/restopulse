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
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 font-black text-xl">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">RestoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Restaurant Operations
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-700 transition">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-700 transition">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-700 transition">Pricing</a>
            <a href="#faq" className="hover:text-emerald-700 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Built specifically for Restaurants, Cafes & Cloud Kitchens</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            Stop Food Waste in Your Kitchen.{" "}
            <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy decoration-2">
              Run Smooth Daily Shifts.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            The simple daily app for restaurant owners and staff. Log kitchen waste in 10 seconds, tick daily opening checklists on phone, and protect ₹15,000 to ₹50,000 every month.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 hover:bg-emerald-800 transition flex items-center justify-center gap-2"
            >
              <span>Start For ₹199 / month</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center shadow-xs"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Takes 2 mins to start
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Works on any smartphone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Unlimited staff logins
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Cancel anytime
            </span>
          </div>

          {/* 3. HERO VISUAL PREVIEW CARD */}
          <div className="mt-12 max-w-4xl mx-auto rounded-3xl border border-[#bed6c2] bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/80 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600 ml-1.5">Live Shift Overview</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
                Today's Summary
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Box 1: Wastage Tracked */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-emerald-800" />
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Kitchen Waste Logged</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-white px-2 py-0.5 rounded-lg border border-rose-200">₹340 Loss</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <div className="flex justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                    <span>1.5 kg Paneer (Expiry)</span>
                    <strong className="text-slate-900">₹240</strong>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                    <span>0.5 L Milk (Curdled)</span>
                    <strong className="text-slate-900">₹35</strong>
                  </div>
                </div>
              </div>

              {/* Box 2: Checklist Progress */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-teal-800" />
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Morning Opening SOP</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">92% Ready</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Deep freezer temperature at -18°C</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cash counter opening float: ₹5,000 verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 2 BIG RESTAURANT PROBLEMS WE SOLVE */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Why Restaurants Lose Money
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Paper Checklists & Untracked Waste Are Eating Your Profits
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Problem */}
            <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm uppercase tracking-wider">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>The Old Way (Without RestoPulse)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-black">✕</span>
                  <span>Kitchen food waste gets tossed in the trash without anyone recording the cost.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-black">✕</span>
                  <span>Staff forgets cleaning or fridge checks because paper sheets get lost or dirty.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-black">✕</span>
                  <span>You only find out you lost money at the end of the month when bills arrive.</span>
                </li>
              </ul>
            </div>

            {/* The RestoPulse Solution */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/70 border border-emerald-300 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>The RestoPulse Way</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-800 font-semibold">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-black">✓</span>
                  <span>Staff logs thrown food on phone in 10 seconds with exact money loss calculated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-black">✓</span>
                  <span>Interactive opening checklists ensure spotless hygiene and zero missed prep tasks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-black">✓</span>
                  <span>You see real-time daily reports and save ₹15,000–₹50,000 every single month.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURES (SIMPLE ENGLISH) */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Simple Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Everything You Need to Run Your Restaurant Easily
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              No complex training or complicated software. Just clean tools for everyday cafe and restaurant shifts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1: Wastage Tracker */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">10-Second Food Waste Log</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When milk curdles, veggies spoil, or orders get burnt, staff log it in 2 taps. You instantly see how much money was lost and why.
              </p>
            </div>

            {/* Feature 2: Daily Checklists */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Daily Opening SOP Checklists</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Staff check off kitchen hygiene, fridge temperature, prep readiness, and cash drawer counting before customers walk in.
              </p>
            </div>

            {/* Feature 3: SOP Customizer */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Easy Checklist Customizer</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Add, rename, or reorder categories (Kitchen, Dining, Bar, Storage) and tasks in seconds to match your exact restaurant workflow.
              </p>
            </div>

            {/* Feature 4: Waste Analytics */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Clear Loss Reports</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                See top wasted ingredients, weekly cost graphs, and food loss trends without needing an accountant.
              </p>
            </div>

            {/* Feature 5: Staff Logins */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Staff & Manager Logins</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Create separate logins for your chefs and supervisors. Staff can tick checklists and log waste; only you control prices and settings.
              </p>
            </div>

            {/* Feature 6: Mobile Friendly */}
            <div className="p-6 rounded-3xl bg-white border border-[#bed6c2] shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Works on Any Phone</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                No expensive hardware or tablet needed. Open RestoPulse on any Android phone or iPhone and your kitchen is ready to go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Quick Setup
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              How RestoPulse Works in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Create Your Restaurant</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sign up in 1 minute. Add your common raw materials (milk, cheese, chicken, veggies) and daily checklist tasks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Staff Checks & Logs Daily</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your kitchen team marks morning opening tasks on their phones and logs any thrown-away food in 10 seconds.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Save Money & Run Smooth Shifts</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cut monthly food losses by 30%–50%, ensure high kitchen hygiene standards, and sleep peacefully knowing your restaurant is running like clockwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Simple Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            One Simple Plan. Full Access.
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            No hidden fees, no per-user charges, no expensive hardware. Everything your restaurant needs.
          </p>

          <div className="mt-10 max-w-md mx-auto bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl relative text-left">
            <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              Most Popular
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">RestoPulse Pro</h3>
            <p className="text-xs text-slate-500 mt-1">Complete food waste control & SOP checklists</p>

            <div className="mt-5 pb-5 border-b border-slate-100 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">₹199</span>
              <span className="text-xs sm:text-sm font-bold text-slate-500">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700 font-semibold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Kitchen Food Waste Logs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily Opening & Closing SOP Checklists</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SOP Checklist Template Customizer</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Staff & Manager Logins</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cost Analytics & Excel CSV Export</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mobile-Optimized for any Smartphone</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="mt-8 w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-700/20"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">
              Instant activation • Cancel anytime with 1 click
            </p>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Do my kitchen staff need to install an app from Play Store?",
                a: "No! RestoPulse works directly in any mobile browser (Chrome, Safari, etc.). You simply open the link on your phone, log in, and it's ready to use.",
              },
              {
                q: "Can I customize the checklist tasks for my cafe or cloud kitchen?",
                a: "Yes, 100%! With our SOP Template Builder, you can easily add, rename, or delete categories (e.g. Kitchen Line, Barista Station, Dining, Storage) and create custom check items for your kitchen.",
              },
              {
                q: "How does logging food waste save money?",
                a: "Most restaurants lose 4% to 10% of their total raw material purchases to spoiled or discarded food. By logging waste daily, you immediately find out which items (e.g. excess milk, spoiled paneer, burnt cuts) are causing losses so you can adjust ordering and save ₹15,000 to ₹50,000/month.",
              },
              {
                q: "Can multiple staff members log in at the same time?",
                a: "Yes! You can create individual logins for your cooks, baristas, and shift managers. Staff can check tasks and log waste simultaneously without overwriting each other.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer hover:bg-slate-100/60"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Run a Smoother, More Profitable Kitchen?
          </h2>
          <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
            Join smart restaurant and cafe owners cutting food waste and running flawless daily opening checklists with RestoPulse.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
            >
              <span>Get Started in 2 Minutes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
              R
            </div>
            <span className="font-extrabold text-slate-800">RestoPulse</span>
            <span>• Daily Restaurant Operations & Wastage Control</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <Link href="/login" className="hover:text-emerald-700 transition">Sign In</Link>
            <Link href="/signup" className="hover:text-emerald-700 transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
