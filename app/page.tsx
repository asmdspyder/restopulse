"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardCheck,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Camera,
  CheckCircle2,
  Smartphone,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  FileCheck2,
  Lock,
  Eye,
  Layers,
  Award,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 font-black text-xl tracking-tight">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">RestoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Operations & SOP Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-700 transition">Features</a>
            <a href="#camera-proof" className="hover:text-emerald-700 transition">Live Camera Proof</a>
            <a href="#accountability" className="hover:text-emerald-700 transition">Staff Accountability</a>
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
      <section className="relative pt-14 pb-16 md:pt-22 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Digital SOP Checklists • Food Wastage Tracking • Photo Verification</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            Flawless Kitchen Shifts with{" "}
            <span className="text-emerald-700 underline decoration-emerald-400 decoration-wavy decoration-2">
              Live Camera Proof
            </span>{" "}
            & Staff Accountability.
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            RestoPulse replaces paper logs with simple mobile workflows. Ensure spotless opening hygiene, record discarded food in seconds, and maintain 100% staff accountability with direct back-camera photo proof.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 hover:bg-emerald-800 transition flex items-center justify-center gap-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center shadow-xs"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Back-camera photo proof
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Works on any smartphone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Named staff audit trail
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Instant setup
            </span>
          </div>

          {/* 3. HERO PREVIEW TILES */}
          <div className="mt-12 max-w-4xl mx-auto rounded-3xl border border-slate-300 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-700 ml-1.5">Daily Operations Hub</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
                Live Shift Status
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Box 1: Checklist with Photo Proof */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border-2 border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-teal-800" />
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Morning SOP Checklist</span>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-white px-2 py-0.5 rounded-lg border border-teal-200">92% Done</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 pt-1">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Deep Freezer Temp Check</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      <Camera className="w-3 h-3" /> Photo Attached
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cash Counter Float Verified</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">By Rahul (Shift Lead)</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Wastage Logged with Proof */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-emerald-800" />
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Food Wastage Log</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">Real-time</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 pt-1">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">1.5 kg Paneer (Expiry)</div>
                      <div className="text-[11px] text-slate-500">Station: Kitchen Main Line</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Camera className="w-3 h-3" /> Live Proof
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">0.5 L Milk (Curdled)</div>
                      <div className="text-[11px] text-slate-500">Recorded by: Amit (Barista)</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      08:42 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY PILLARS: CAMERA PROOF & ACCOUNTABILITY */}
      <section id="camera-proof" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
                <Camera className="w-4 h-4 text-blue-700" />
                <span>Zero Fake Check-Offs</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Direct Back-Camera Photo Verification
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                No more guessing if the kitchen was actually cleaned or if temperature gauges were truly checked. Staff snap quick live photos using their phone's back camera directly inside the app.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-semibold">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Visual Hygiene Audit:</strong> Capture fryer cleanliness, sanitized countertops, and organized prep areas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Waste Proof:</strong> Snap photo evidence of spoiled raw material or burnt dishes before disposal.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Fast & Mobile-Optimized:</strong> Directly opens the back camera with seamless compression and cloud sync.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Live Camera Proof Modal</h4>
                    <p className="text-[11px] text-slate-500">Streamlined Back Camera Capture</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  Reliable
                </span>
              </div>

              <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
                <Camera className="w-12 h-12 text-slate-300 mb-2 z-20" />
                <p className="text-xs text-slate-300 font-bold z-20">Back Camera Viewfinder Active</p>
                <p className="text-[11px] text-slate-400 z-20">Point at task item or food waste</p>
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center z-20 text-[10px] text-slate-300 font-medium">
                  <span>Auto-Focus: On</span>
                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">Capture Ready</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Fast On-Demand Viewing</span>
                  <span className="text-slate-500 text-[11px]">Photos load only when clicked to keep lists snappy</span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  [ 📷 View Photo ]
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STAFF ACCOUNTABILITY SECTION */}
      <section id="accountability" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Clear Responsibility
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Staff Accountability & Complete Audit Trail
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Eliminate confusion, excuses, and finger-pointing with verified timestamps and dedicated staff roles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Individual Staff Accounts</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Create dedicated login credentials for line cooks, baristas, duty managers, and kitchen supervisors. Staff see only what they need to execute their daily shift.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Exact Time & Date Stamps</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Every checklist tick and wastage entry records the exact minute it occurred. You always know whether opening duties were completed on time before doors opened.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Named Recorded Records</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Every wastage record and checklist task displays who logged it (e.g., &ldquo;Logged by: Sunil, Lead Cook&rdquo;). Celebrate your most diligent team members and train those who need help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPLETE FEATURES GRID */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Complete Toolset
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Everything Needed for Modern Restaurant Shifts
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Built for speed on busy kitchen lines and simple clarity for restaurant owners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1: Wastage */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">10-Second Food Waste Log</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Log spoiled raw materials, over-prepared items, or customer returns with category, unit, quantity, and reason classification in seconds.
              </p>
            </div>

            {/* Feature 2: SOP Checklist */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Daily Opening SOP Checklists</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Interactive mobile checklists across Kitchen, Barista, Dining, and Storage stations with high-contrast completion status.
              </p>
            </div>

            {/* Feature 3: Template Builder */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Customizable SOP Builder</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Easily tailor categories, duty items, and photo requirements to fit your specific restaurant, pizzeria, bakery, or cafe layout.
              </p>
            </div>

            {/* Feature 4: Analytics */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Management Analytics & Reports</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Identify recurring waste causes, peak spoilage days, checklist compliance rates, and export structured Excel CSV reports.
              </p>
            </div>

            {/* Feature 5: Multi-Role Access */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Role-Based Access Control</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Kitchen staff get simple checklists and wastage logging; owners and general managers retain full control over configuration and raw material prices.
              </p>
            </div>

            {/* Feature 6: Zero Hardware */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Zero Proprietary Hardware</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                No expensive POS upgrades or custom tablets. Runs smoothly on existing Android smartphones, iPhones, and desktop browsers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              3 Simple Steps
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              How RestoPulse Operates in Your Kitchen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Configure Items & Checklists</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Add your restaurant's raw material list (dairy, produce, protein, bakery) and customize your station opening checklist templates.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Staff Execute Daily Routines</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Team members mark morning tasks, snap photo proof with their back cameras, and record any discarded items with reasons in seconds.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Maintain High Standards</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Review shift summaries, verify photo logs, identify operational bottlenecks, and maintain consistent hygiene and prep standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Clear Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            One Comprehensive Plan. All Features Included.
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            No per-user fees, no device lock-in. Everything your restaurant needs for full operational control.
          </p>

          <div className="mt-10 max-w-md mx-auto bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-xl relative text-left">
            <div className="absolute -top-3.5 right-6 px-3.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              All-In-One Plan
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">RestoPulse Pro</h3>
            <p className="text-xs text-slate-500 mt-1">SOP Checklists + Food Waste Tracking + Camera Verification</p>

            <div className="mt-5 pb-5 border-b border-slate-200 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">₹399</span>
              <span className="text-xs sm:text-sm font-bold text-slate-500">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700 font-semibold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Food Wastage Logs & Items</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Station Opening & Closing SOP Checklists</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Back-Camera Photo Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom SOP Template Builder</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Staff Logins & Named Audit Trail</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Management Analytics & Excel CSV Export</span>
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
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">
              Instant setup • Cancel anytime with 1 click
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Questions & Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the live camera proof work?",
                a: "When staff complete a critical checklist task (like fridge temp reading or line cleanliness) or record wasted food, they can tap the camera button. The app opens their phone's back camera directly, captures the photo, and uploads it securely to attach with that specific record.",
              },
              {
                q: "How does staff accountability work?",
                a: "Every staff member has their own login. Whenever a task is ticked or food waste is recorded, their name and an exact timestamp are automatically permanently logged with the entry. This eliminates confusion and creates a clear record of daily operations.",
              },
              {
                q: "Can I customize the checklists for my restaurant type?",
                a: "Yes! Using the SOP Template Builder, you can add custom categories (e.g., Barista, Pizza Line, Deep Fryers, Storage, Dining) and add/edit checklist items to match your exact standard operating procedures.",
              },
              {
                q: "Do staff need to download an app from app stores?",
                a: "No installation is required. RestoPulse runs smoothly as a responsive web app directly in any browser (Chrome, Safari, Edge) on any smartphone, tablet, or laptop.",
              },
              {
                q: "Can multiple staff members log in at the same time?",
                a: "Yes! Multiple kitchen team members can use the app simultaneously during the same shift without overwriting each other's data.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer hover:bg-slate-50"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. BOTTOM CTA */}
      <section className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Standardize Your Kitchen Operations?
          </h2>
          <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            Join smart restaurant and cafe operators running structured daily checklists, verifying tasks with photo proof, and tracking kitchen waste with RestoPulse.
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

      {/* 11. FOOTER */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
              R
            </div>
            <span className="font-extrabold text-slate-800">RestoPulse</span>
            <span>• Daily Restaurant Operations, SOP Checklists & Wastage Control</span>
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
