"use client";

import Link from "next/link";
import { useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Utensils,
  Coffee,
  Store,
  ChefHat,
  DollarSign,
  AlertTriangle,
  HelpCircle,
  CheckSquare,
  ClipboardList,
  Layers,
  Users,
  UserPlus,
  Shield,
  Calendar,
  Lock,
  Smartphone,
  Check,
} from "lucide-react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white font-sans">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 font-bold text-xl">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">RestoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Operations Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#modules" className="hover:text-emerald-700 transition">Core Modules</a>
            <a href="#checklists" className="hover:text-emerald-700 transition">SOP & Checklists</a>
            <a href="#wastage" className="hover:text-emerald-700 transition">Wastage Tracking</a>
            <a href="#team" className="hover:text-emerald-700 transition">Staff Accounts</a>
            <a href="#pricing" className="hover:text-emerald-700 transition">Pricing</a>
            <a href="#faq" className="hover:text-emerald-700 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl shadow-sm shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300/80 text-emerald-900 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>All-In-One Restaurant Operations & Daily SOP Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight md:leading-[1.15]">
            Run Flawless Daily Shifts.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600">
              Cut Wastage. Empower Your Team.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Eliminate chaotic paper forms and untracked kitchen losses. RestoPulse equips your restaurant with interactive opening SOP checklists, 10-second food waste logging, real-time cost analytics, and granular staff account controls.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-700/25 hover:bg-emerald-800 transition flex items-center justify-center gap-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#modules"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Instant Setup in 2 Minutes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Mobile-Optimized for Kitchen Staff
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Unlimited Staff Users
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Cancel Anytime
            </span>
          </div>

          {/* 3. HERO INTERACTIVE DASHBOARD PREVIEW */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl shadow-slate-200/80 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-500 ml-2">RestoPulse Live Operations Hub</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                <span className="px-3 py-1 bg-white rounded-lg shadow-xs text-emerald-800">Shift Active</span>
                <span className="px-3 py-1 text-slate-500">Opening Checklist: 92%</span>
              </div>
            </div>

            {/* 3 Unified Modules Showcase Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">SOP & Checklists</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">23/25 Tasks Completed Today</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Wastage Analytics</span>
                  <span className="text-[11px] text-teal-800 font-semibold">₹828 Recorded Today (-14%)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Team & Roles</span>
                  <span className="text-[11px] text-blue-800 font-semibold">6 Staff Logins Active</span>
                </div>
              </div>
            </div>

            {/* Live Operational Insight Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Morning Readiness & Inspection: Ready for Lunch Service</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Line inspection, grill calibration, and ₹5,000 cash float verified by Shift Manager at 10:15 AM. 2 food wastage entries logged for morning prep trimming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE CORE MODULES OVERVIEW */}
      <section id="modules" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Unified Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">The 3 Pillars of Restaurant Operations</h2>
            <p className="text-slate-600 mt-3 text-base">
              Everything your managers and staff need to run standard procedures, record kitchen data, and control team access—in one cohesive workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: SOP & Checklists */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 relative flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900">1. Digital SOPs & Opening Checklists</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Replace lost paper clipboards. Digitize morning prep inspections, station readiness audits, opening cash float tally, and manager sign-offs with real-time timestamps.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Station-by-station inspections & checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Opening cash float & petty expense logging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Visual SOP Template Builder with drag & drop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Historical calendar audits & staff markings</span>
                  </li>
                </ul>
              </div>
              <a href="#checklists" className="mt-8 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                <span>Learn about SOP checklists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Pillar 2: Wastage Recording */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 relative flex flex-col justify-between hover:shadow-lg hover:border-teal-300 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900">2. Wastage Recording & Cost Control</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Fast 10-second food & beverage waste entry directly on kitchen smartphones. Instant monetary loss calculation, Pareto cost-driver ranking, and automated insight cards.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Instant 10-second smartphone waste logging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Automatic ₹ cost calculation per item unit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Root-cause Pareto driver analysis (Overprep, Spoilage)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Comprehensive historical trends & CSV export</span>
                  </li>
                </ul>
              </div>
              <a href="#wastage" className="mt-8 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800">
                <span>Learn about wastage control</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Pillar 3: Staff & Account Management */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 relative flex flex-col justify-between hover:shadow-lg hover:border-blue-300 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900">3. Staff Accounts & Permissions</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Provision individual logins for your head chef, baristas, line cooks, and shift supervisors. Granular permission switches, instant password resets, and audit trail of every checklist click.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Unlimited staff logins with custom credentials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Role segregation (Restaurant Admin vs Floor Staff)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>SOP Template Builder permission toggle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>1-click password reset & account deactivation</span>
                  </li>
                </ul>
              </div>
              <a href="#team" className="mt-8 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                <span>Learn about staff management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEEP DIVE: SOP / CHECKLIST MANAGEMENT */}
      <section id="checklists" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Paperless Restaurant SOPs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Transform Paper Clipboards into Dynamic Digital Checklists
              </h2>
              <p className="mt-4 text-slate-600 text-base leading-relaxed">
                Ensure daily operational consistency across morning opening, station setups, hygiene protocols, and closing routines. Never wonder if the deep fryers were filtered or if the cash float was reconciled.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-700">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Real-time Staff Name & Timestamp Tracking</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      When a line cook checks off an item, RestoPulse immediately records their name and exact time, establishing true kitchen accountability.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Opening Cash Float & Petty Purchase Table</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Record morning register floats (e.g. ₹5,000 cash balance) and dynamic vendor purchase logs directly within the daily opening inspection.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Interactive Calendar & Historical Audit Log</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Navigate to any date on the calendar. Review past checklist completion rates, manager sign-offs, and inspect previous shift notes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Checklist UI Illustration */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Daily Opening Checklist</span>
                  <span className="text-sm font-extrabold text-slate-900">Today's Inspection • Station Line</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  92% Completed
                </span>
              </div>

              {/* Sample Checklist Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Kitchen & Prep Station</span>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 line-through">Deep fryer oil quality & temperature checked</span>
                      <span className="text-[10px] text-slate-400 block">Completed by Rahul (Chef) at 09:45 AM</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 line-through">Walk-in chiller temperature logged (3.2°C)</span>
                      <span className="text-[10px] text-slate-400 block">Completed by Rahul (Chef) at 09:50 AM</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md border border-slate-300" />
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Fresh garnish & salad bar ice setup</span>
                      <span className="text-[10px] text-amber-600 block">Pending verification</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Cash Float Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Opening Cash Float Tally</span>
                  <span className="text-[11px] text-slate-500">Verified by Store Manager</span>
                </div>
                <div className="text-right font-extrabold text-emerald-800 text-sm">
                  ₹5,000.00
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEEP DIVE: WASTAGE TRACKING */}
      <section id="wastage" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Financial Loss Prevention</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Cut Food Wastage by up to 25%</h2>
            <p className="text-slate-600 mt-3 text-base">
              Staff won't fill complex forms during busy rushes. Our streamlined 10-second logger captures every burnt sauce, over-prepped batch, and expired ingredient with zero friction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900">10-Second Quick Logger</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Pick your item, enter quantity, tap the waste reason button. Unit prices are auto-populated and financial loss is stored permanently.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900">Cost-Driver Ranking</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Discover which items represent 80% of your total loss (Pareto analysis). Focus recipe adjustments where they save the most money.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-bold text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900">Rule-Based Insights</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Our intelligence engine detects spikes, abnormal over-prep patterns, and station anomalies to suggest direct kitchen remedies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DEEP DIVE: STAFF ACCOUNTS & PERMISSIONS */}
      <section id="team" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Staff Card Illustration */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-4 order-2 lg:order-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Active Restaurant Team</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Unlimited Seats
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Vikram Mehta</span>
                    <span className="text-[10px] text-slate-500">vikram@kitchen.com • Admin</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Full Access
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Rahul Sharma</span>
                    <span className="text-[10px] text-slate-500">rahul@kitchen.com • Staff</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-teal-100 text-teal-800 text-[10px] font-bold">
                    SOP Editor
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pooja Nair</span>
                    <span className="text-[10px] text-slate-500">pooja@kitchen.com • Staff</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold">
                    Checklist & Wastage
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-950 font-medium">
                  Admins can reset passwords, edit email addresses, or deactivate staff instantly when shifts change.
                </span>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Multi-User Team Management</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Empower Every Kitchen Role with Dedicated Logins
              </h2>
              <p className="mt-4 text-slate-600 text-base leading-relaxed">
                Never share a single generic login. RestoPulse lets you create dedicated accounts for your entire kitchen brigade, front-of-house staff, and management with tailored privileges.
              </p>

              <div className="mt-6 space-y-3.5 text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                  <span><strong>Granular Permissions:</strong> Assign staff as standard operators or grant them SOP Template Builder editing rights.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                  <span><strong>Security & Control:</strong> Edit user email addresses, update forgotten passwords, or deactivate accounts with a single toggle.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                  <span><strong>Audit Trail:</strong> Every checklist task marked and wastage logged is tied directly to the logged-in staff member.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. UNIVERSAL USE CASES */}
      <section id="universal" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Built for Every Food Business</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Universal Operations Platform</h2>
            <p className="text-slate-600 mt-3 text-base">
              Whether you run a 20-seat café or a high-volume cloud kitchen chain, RestoPulse adapts seamlessly with custom SOP templates, units, and categories.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cafés & Coffee Shops</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Daily espresso machine calibration SOPs, milk pitcher waste tracking, pastry expiry audits, and morning cash register tally.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Casual & Fine Dining</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Line station prep checklists, trimming losses on meats/fish, over-portioned sides, burnt sauces, and service remakes.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Bakeries & Patisseries</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Morning oven preheat SOPs, proofing checks, day-end unsold bread logs, and cream/butter spoilage tracking.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cloud Kitchens & QSRs</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Multi-brand prep verification, hygiene station readiness, high-velocity sauce waste tracking, and shift handovers.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Bars & Pubs</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Draught beer line cleaning SOPs, ice machine sanitization, broken glassware tracking, and liquor inventory spoilage.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Food Trucks & Pop-ups</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Rapid morning generator & gas safety checklists, fast mobile wastage logging during peak service rushes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRICING SECTION (DEFAULT MONTHLY) */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Simple & Transparent</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">All-In-One Restaurant Plan</h2>
            <p className="text-slate-600 mt-3 text-base">
              One single subscription covers your entire restaurant workspace. Unlimited staff accounts, SOP checklists, and wastage records.
            </p>

            {/* Monthly / Yearly Switcher - Default Monthly */}
            <div className="mt-8 inline-flex items-center bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === "yearly" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="max-w-lg mx-auto rounded-3xl bg-white border-2 border-emerald-600 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
              Complete Operations Access
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">RestoPulse Full Suite</h3>
            <p className="text-xs text-slate-500 mt-1">Full access to SOP Checklists, Wastage Analytics & Staff Management</p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900">
                {billingCycle === "monthly" ? "₹199" : "₹1,999"}
              </span>
              <span className="text-slate-500 text-sm font-semibold">
                / {billingCycle === "monthly" ? "month" : "year"}
              </span>
            </div>
            {billingCycle === "yearly" && (
              <p className="text-xs font-bold text-emerald-700 mt-1">
                Equivalent to ₹166/month (Save ₹389/year)
              </p>
            )}

            <div className="mt-8 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Unlimited Digital SOPs & Opening Checklists</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Visual SOP Template Builder with custom sections</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Opening Cash Float & Daily Expense Tracker</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>10-second fast kitchen wastage recording</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Pareto cost drivers & rule-based insight engine</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Multi-user staff accounts & custom permissions</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Historical calendar audit logs & CSV exports</span>
              </div>
            </div>

            <Link
              href={`/signup?plan=${billingCycle}`}
              className="mt-8 w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm text-center block shadow-lg shadow-emerald-700/25 transition cursor-pointer"
            >
              Start Free Restaurant Trial
            </Link>

            <p className="text-center text-[11px] text-slate-400 mt-3">
              Fast, secure onboarding via Razorpay. Cancel anytime with 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Frequently Asked Questions</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Everything You Need to Know</h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base">How does the digital SOP & Checklist module work?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                RestoPulse provides ready-to-use opening & station checklists covering prep inspections, food hygiene, fryer checks, and cash float tally. Staff simply open the checklist on their smartphones or tablet, tap items as completed, and the system records who completed each task with exact timestamps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base">Can I customize checklist sections and questions?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Yes! With the built-in SOP Template Builder, managers can add new custom sections (e.g., Bar Opening, Night Closing, Weekly Deep Clean), add customized questions, set priorities, and reorder items smoothly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base">Can I create separate accounts for all my staff?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Yes. Under your single restaurant subscription, you can create unlimited staff user accounts with unique logins for your head chef, baristas, line cooks, and managers. You can also control who has permission to edit SOP templates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base">How is wastage cost calculated?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Each item has a configured purchase or recipe cost per unit. When a staff member logs 1.5 kg of Cooked Rice (configured at ₹95/kg), RestoPulse instantly computes and stores ₹142.50. If you update the item price next month, your past records remain completely accurate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-slate-100">RestoPulse</span>
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} RestoPulse Operations Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition">Sign Up</Link>
            <Link href="/admin/login" className="text-slate-500 hover:text-slate-300 transition">Owner Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
