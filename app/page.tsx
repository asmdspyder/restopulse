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
  Utensils,
  AlertTriangle,
  Building2,
  Check,
  Flame,
  Award,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
                Restaurant Operations Management
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-700 transition">How It Works</a>
            <a href="#checklists" className="hover:text-emerald-700 transition">SOP Checklists</a>
            <a href="#camera-proof" className="hover:text-emerald-700 transition">Camera Proof</a>
            <a href="#wastage" className="hover:text-emerald-700 transition">Wastage Tracking</a>
            <a href="#accountability" className="hover:text-emerald-700 transition">Staff Accountability</a>
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
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>The Complete Restaurant Operations Management Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            Run a Smooth, Stress-Free Kitchen Shift{" "}
            <span className="text-emerald-700 underline decoration-emerald-400 decoration-wavy decoration-2">
              Every Single Day.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
            RestoPulse brings order to your daily restaurant shifts. Create station opening checklists, let staff verify tasks with live phone camera proof, log kitchen food waste in 10 seconds, and maintain 100% staff accountability.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 hover:bg-emerald-800 transition flex items-center justify-center gap-2"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#story"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center shadow-xs"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Works on any smartphone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Live camera photo proof
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Named staff audit trail
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 1-minute setup
            </span>
          </div>

          {/* 3. HERO LIVE DASHBOARD PREVIEW CARD */}
          <div className="mt-12 max-w-4xl mx-auto rounded-3xl border-2 border-slate-300 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-700 ml-1.5">Live Shift Activity</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
                Today&apos;s Operations Status
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
                  <span className="text-xs font-bold text-teal-800 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200">92% Ready</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 pt-1">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Deep Freezer Temp Check</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      <Camera className="w-3 h-3" /> Photo Attached
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cash Counter Float Verified</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">By Rahul (Lead)</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Wastage Logged with Proof */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-emerald-800" />
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Kitchen Wastage Log</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">Real-time</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 pt-1">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">1.5 kg Paneer (Expiry)</div>
                      <div className="text-[11px] text-slate-500">Station: Kitchen Main Line</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Camera className="w-3 h-3" /> Photo Proof
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

      {/* 4. STORY ACT 1: THE DAILY KITCHEN REALITY & PAIN POINTS */}
      <section id="story" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 px-3.5 py-1 rounded-full border border-rose-300">
              The Daily Kitchen Problem
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 leading-snug">
              Why Managing Restaurant Shifts Is So Stressful
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Without structured digital routines, small oversights during morning setup turn into costly customer complaints and daily food waste.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-3xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Forgotten Tasks</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Fryers not cleaned, fridge door left loose, or coffee station unprepared before customers arrive.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Fake Paper Ticks</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Paper sheets get signed quickly at the end of the day without anyone actually checking the equipment.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Untracked Food Waste</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Spoiled ingredients, burnt cuts, and over-prepped dishes get thrown into dustbins with zero records.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Staff Finger Pointing</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                No record of who was responsible for what station, creating confusion and endless shift disputes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STORY ACT 2: STEP 1 — CREATE SOP CHECKLISTS */}
      <section id="checklists" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                <span>Step 1: Standardize Your Routines</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Create Station SOP Checklists for Everyday Readiness
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                Set up clear, repeatable opening checklists for every area of your restaurant. Your team knows exactly what needs to be cleaned, inspected, and prepped before unlocking the doors.
              </p>

              <div className="space-y-3 pt-1 text-xs sm:text-sm text-slate-700 font-semibold">
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Custom Station Categories</span>
                    <span className="text-slate-500 font-normal">Kitchen Line, Barista Counter, Dining Floor, Cold Storage & Cash Counter.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Interactive Mobile Check-Off</span>
                    <span className="text-slate-500 font-normal">Staff simply tap tasks on their phones as they complete each station check.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Easy SOP Builder</span>
                    <span className="text-slate-500 font-normal">Add, rename, or adjust checklist tasks anytime to match your restaurant flow.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    SOP
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Morning Kitchen Line Checklist</h4>
                    <p className="text-[11px] text-slate-500">Daily Station Opening</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  Active Shift
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Deep fryer oil clean & heated to 180°C</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">Done</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Prep station cutting boards sanitized</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">Done</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-md border-2 border-slate-400 shrink-0" />
                    <span>Vegetable prep bins stocked & dated</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STORY ACT 3: STEP 2 — LIVE CAMERA PHOTO PROOF */}
      <section id="camera-proof" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Visual Phone Card */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm order-2 md:order-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Phone Camera Verification</h4>
                    <p className="text-[11px] text-slate-500">Back-Camera Stream</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-300">
                  Live View
                </span>
              </div>

              <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
                <Camera className="w-12 h-12 text-slate-300 mb-2 z-20" />
                <p className="text-xs text-slate-200 font-bold z-20">Back Camera Active</p>
                <p className="text-[11px] text-slate-400 z-20">Point at fridge gauge or clean station</p>
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center z-20 text-[10px] text-slate-300 font-medium">
                  <span>Photo Slot #1</span>
                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">Ready to Snap</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Fast On-Demand Viewing</span>
                  <span className="text-slate-500 text-[11px]">Managers can view attached photos anytime with 1 click</span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  [ 📷 View Photo ]
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-5 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-300">
                <Camera className="w-4 h-4 text-blue-700" />
                <span>Step 2: Live Camera Proof</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Zero Fake Ticks with Direct Live Photo Proof
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                No more wondering if the fridge was actually at -18°C or if the counter was truly sanitized. Staff snap quick live photos using their phone&apos;s back camera directly inside the app.
              </p>

              <div className="space-y-3 pt-1 text-xs sm:text-sm text-slate-700 font-semibold">
                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Visual Proof for Key Tasks</span>
                    <span className="text-slate-500 font-normal">Attach photos of fridge temperature dials, clean equipment, or sanitized stations.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Direct & Simple Capture</span>
                    <span className="text-slate-500 font-normal">Opens the back camera instantly with a large tap-to-capture button. No gallery uploads.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Permanent Visual Record</span>
                    <span className="text-slate-500 font-normal">Photos are saved securely alongside the task date and staff name for easy manager audits.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. STORY ACT 4: STEP 3 — 10-SECOND WASTAGE TRACKING */}
      <section id="wastage" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <Trash2 className="w-4 h-4 text-emerald-700" />
                <span>Step 3: Track Food Wastage</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Log Discarded Food in 10 Seconds
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                When milk curdles, vegetables spoil, or a dish gets burnt, kitchen staff log it on their phone in seconds instead of tossing it away quietly.
              </p>

              <div className="space-y-3 pt-1 text-xs sm:text-sm text-slate-700 font-semibold">
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Clear Reason Categorization</span>
                    <span className="text-slate-500 font-normal">Identify why food was wasted (Expiry, Spoilage, Burnt/Cooking Error, Prep Waste, Quality Rejection).</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Photo Evidence for Discards</span>
                    <span className="text-slate-500 font-normal">Staff snap a quick photo of the spoiled item before disposal for complete transparency.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Actionable Kitchen Insights</span>
                    <span className="text-slate-500 font-normal">Spot recurring spoilage patterns and adjust raw material ordering with confidence.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">10-Second Wastage Record</h4>
                    <p className="text-[11px] text-slate-500">Quick Kitchen Logging</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-teal-900 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-300">
                  Logged
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">Fresh Paneer (Dairy)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                      Reason: Expiry
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span>Quantity: <strong>1.5 kg</strong> • Station: <strong>Main Line</strong></span>
                    <span className="font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Photo Attached
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                    <span>Logged by: <strong>Sunil (Line Cook)</strong></span>
                    <span>Today, 09:15 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. STORY ACT 5: STEP 4 — STAFF ACCOUNTABILITY */}
      <section id="accountability" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 bg-purple-100 px-3.5 py-1 rounded-full border border-purple-300">
              Step 4: Accountability
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              100% Staff Accountability & Audit Trail
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Every single checklist task and wastage record is tied to a specific staff member and exact timestamp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Dedicated Staff Logins</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Provide individual accounts for cooks, baristas, and duty managers. Staff see simple check-offs and wastage logging without complex settings.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Exact Minute Timestamps</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Know exactly what time morning opening duties were finished and verify if inspections took place before restaurant doors opened.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-300 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Clear Name Records</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                No more confusion or finger-pointing. Every log clearly displays the staff member responsible (e.g., &ldquo;Logged by: Sunil, Lead Cook&rdquo;).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
              Simple Setup
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              How RestoPulse Operates in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Set Up Your Restaurant</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Sign up in 1 minute. Add your common raw materials (dairy, produce, bakery) and customize your station opening checklists.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Staff Check & Log Daily</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Team members mark morning opening tasks, snap back-camera photo proof on their phones, and log discarded food in 10 seconds.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Gain Complete Operational Clarity</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Review shift completion reports, inspect verified photos, spot kitchen bottlenecks, and run smooth daily shifts with peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PRICING SECTION WITH MONTHLY / YEARLY TOGGLE */}
      <section id="pricing" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
            Clear Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            One Simple Plan. Full Access to All Features.
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-xl mx-auto font-medium">
            No per-user fees, no hidden setup charges. Everything your restaurant needs for complete operations management.
          </p>

          {/* Billing Cycle Selector Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-100 border-2 border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Yearly Billing</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                billingCycle === "yearly" ? "bg-emerald-900 text-emerald-100" : "bg-emerald-100 text-emerald-800"
              }`}>
                2 Months Free
              </span>
            </button>
          </div>

          <div className="mt-8 max-w-md mx-auto bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-xl relative text-left">
            <div className="absolute -top-3.5 right-6 px-3.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              All-In-One Plan
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">RestoPulse Pro</h3>
            <p className="text-xs text-slate-500 mt-1">Complete SOP Checklists + Food Waste Tracking + Photo Proof</p>

            <div className="mt-5 pb-5 border-b border-slate-200 flex items-baseline gap-2">
              {billingCycle === "monthly" ? (
                <>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">₹399</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500">/ month</span>
                </>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">₹3,999</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500">/ year</span>
                  <span className="ml-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Save ₹789
                  </span>
                </>
              )}
            </div>

            <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700 font-semibold">
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
                <span>Unlimited Food Wastage Logs & Reasons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom SOP Template Builder</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Staff Logins with Named Records</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Management Reports & Excel CSV Export</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Runs smoothly on any Android phone or iPhone</span>
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

      {/* 11. FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
              Questions & Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the live camera photo proof work?",
                a: "When staff complete a checklist item (such as checking fridge temperature, cleaning fryers, or inspecting counters) or log wasted food, they tap the camera button. The app directly opens their phone's back camera to snap a live photo and attach it to that task.",
              },
              {
                q: "How does staff accountability work?",
                a: "Every staff member logs in with their own name and role. When a task is checked off or food waste is recorded, their name and an exact timestamp are permanently logged. This eliminates confusion and ensures everyone takes pride in their station.",
              },
              {
                q: "Can I customize the checklists for my specific cafe or kitchen?",
                a: "Yes! Using the SOP Template Builder, you can add custom categories (e.g., Barista Counter, Pizza Line, Deep Storage, Dining Area) and write custom check items to match your exact standard operating procedures.",
              },
              {
                q: "Do staff need to install an app from app stores?",
                a: "No installation is required. RestoPulse works directly in any mobile browser (Chrome, Safari, etc.) on any smartphone or tablet. Just open the link, log in, and start.",
              },
              {
                q: "Can multiple team members log in at the same time?",
                a: "Yes! Multiple kitchen team members can use the app at the same time during the same shift without overwriting each other's work.",
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

      {/* 12. BOTTOM CTA */}
      <section className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Standardize Your Kitchen Operations?
          </h2>
          <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            Join smart restaurant and cafe operators running structured daily opening checklists, verifying tasks with photo proof, and tracking kitchen food waste with RestoPulse.
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

      {/* 13. FOOTER */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
              R
            </div>
            <span className="font-extrabold text-slate-800">RestoPulse</span>
            <span>• Restaurant Operations Management Platform</span>
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
