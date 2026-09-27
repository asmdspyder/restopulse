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
  CheckCheck,
  Shield,
  ArrowUpRight,
} from "lucide-react";

export default function LandingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"checklist" | "wastage" | "reports">("checklist");

  // Interactive Simulator States
  const [simChecklist, setSimChecklist] = useState([
    { id: 1, text: "Fryer oil temp checked (175°C - 180°C)", done: true, hasPhoto: true, time: "09:15 AM", user: "Chef Rahul" },
    { id: 2, text: "Walk-in chiller & deep freezer temps logged (3°C)", done: true, hasPhoto: true, time: "09:22 AM", user: "Chef Rahul" },
    { id: 3, text: "Meat prep counters sanitized with food-grade spray", done: true, hasPhoto: false, time: "09:30 AM", user: "Vikram S." },
    { id: 4, text: "Bar draught lines flushed and sanitized", done: false, hasPhoto: false, time: "", user: "" },
    { id: 5, text: "POS cash float counted & verified (₹5,000)", done: false, hasPhoto: false, time: "", user: "" },
  ]);

  const [simWastages, setSimWastages] = useState([
    { id: 1, item: "Fresh Paneer Cubes", qty: "1.2 kg", cost: "₹420", reason: "Expired / Sour", photo: true, time: "11:45 AM" },
    { id: 2, item: "Tomato Gravy Base", qty: "3.5 L", cost: "₹385", reason: "Burnt batch", photo: true, time: "02:15 PM" },
    { id: 3, item: "Burger Buns (Pack of 12)", qty: "2 packs", cost: "₹190", reason: "Damaged in transit", photo: false, time: "04:30 PM" },
  ]);

  const toggleChecklistItem = (id: number) => {
    setSimChecklist((prev) =>
      prev.map((item) => {
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
      })
    );
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

  const simCompletedCount = simChecklist.filter((i) => i.done).length;
  const simPercent = Math.round((simCompletedCount / simChecklist.length) * 100);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* 1. TOP NAVIGATION */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              RP
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900">RestoPulse</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              Start 14-Day Trial
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-20 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
          <span>The Modern Standard for Restaurant Operations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
          Kitchen SOPs, daily audits, & food waste reduction.
        </h1>

        <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Replace messy clipboards and lost inventory. RestoPulse empowers kitchen teams with
          1-tap daily checklists, live camera audit proof, and instant food waste logging.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Start Free 14-Day Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#simulator"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-800 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <span>Try Interactive Simulator</span>
          </a>
        </div>

        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
          <span>✓ No credit card required</span>
          <span>✓ 2-minute setup</span>
          <span>✓ ₹399/month all-inclusive</span>
        </div>
      </section>

      {/* 3. INTERACTIVE SIMULATOR SECTION */}
      <section id="simulator" className="py-16 px-4 sm:px-6 bg-zinc-50/70 border-y border-zinc-200/80">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Experience RestoPulse in Action</h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Interactive preview: click tasks to mark them complete or view logged shift wastage.
            </p>
          </div>

          {/* Simulator Tabs */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "checklist"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              1. Opening Checklist & SOPs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wastage")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "wastage"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              2. Rapid Wastage POS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "reports"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              3. Cost Breakdown
            </button>
          </div>

          {/* Simulator Window */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xl max-w-3xl mx-auto space-y-6">
            {activeTab === "checklist" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Morning Kitchen Audit Checklist</span>
                    <span className="text-[11px] text-zinc-400">{simCompletedCount} of {simChecklist.length} tasks marked</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {simPercent}% Done
                  </span>
                </div>

                <div className="space-y-2">
                  {simChecklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        item.done
                          ? "bg-emerald-50/30 border-emerald-200"
                          : "bg-zinc-50/50 border-zinc-200 hover:bg-zinc-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                            item.done ? "bg-emerald-600 text-white" : "border border-zinc-300 bg-white"
                          }`}
                        >
                          {item.done && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                        <span className={`text-xs font-semibold ${item.done ? "text-zinc-900" : "text-zinc-700"}`}>
                          {item.text}
                        </span>
                      </div>

                      {item.hasPhoto && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium flex items-center gap-1 shrink-0">
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>Photo Verified</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "wastage" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Live Shift Wastage Stream</span>
                    <span className="text-[11px] text-zinc-400">Total Loss: ₹995 today</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Cloudflare R2 Sync
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {simWastages.map((w) => (
                    <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">{w.item}</span>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>{w.qty}</span>
                          <span>•</span>
                          <span className="text-zinc-700 font-medium">{w.reason}</span>
                          {w.photo && (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                              <Camera className="w-3 h-3" /> Photo Attached
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 font-mono">{w.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-900">Monthly Wastage & Spoilage Analysis</span>
                  <span className="text-xs font-mono font-bold text-zinc-900">₹14,250 Total Loss</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block font-semibold">Top Reason</span>
                    <span className="text-xs font-bold text-zinc-900 block mt-1">Spoilage / Expiry</span>
                    <span className="text-[10px] text-zinc-500">48% of total loss</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block font-semibold">Highest Loss Item</span>
                    <span className="text-xs font-bold text-zinc-900 block mt-1">Dairy & Paneer</span>
                    <span className="text-[10px] text-zinc-500">₹5,400 monthly</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block font-semibold">SOP Completion</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-1">94.2%</span>
                    <span className="text-[10px] text-zinc-500">28 of 30 shifts signed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. KEY PILLARS GRID */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Built specifically for busy restaurants</h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            No bloated enterprise complexity. Zero training required for kitchen line staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Live Camera Audits (No Gallery Uploads)</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Staff can only snap live photos through their camera. Eliminates fake checklists and guarantees
              oil temperatures, prep hygiene, and clean counters are verified in real time.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Sub-10s Food Wastage POS</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kitchen staff tap the ingredient, select quick presets (+1kg, +0.5kg), pick a reason, and snap proof.
              Instantly calculates rupee loss and alerts managers to food cost leaks.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Digital Manager Sign-Off & Cash Float</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Duty managers sign off shift handovers directly on mobile touchscreens. Track opening cash float,
              small change, and direct purchase expenses on a single unified audit ledger.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Staff Mode: 2-Button Simplicity</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kitchen staff are protected with an isolated 2-button interface (Checklist & Wastage).
              Managers and owners retain complete control over pricing catalogs, reports, and templates.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section className="py-20 px-4 sm:px-6 bg-zinc-50/70 border-t border-zinc-200/80">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Simple, transparent pricing</h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              One straightforward plan. Everything included. Unlimited staff.
            </p>
          </div>

          {/* Billing Switcher */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-200/80">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingPeriod === "monthly" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                billingPeriod === "yearly" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Save 17%
              </span>
            </button>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Pro Restaurant License</h3>
                <p className="text-xs text-zinc-500">All features & unlimited team members</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold">
                14-Day Free Trial
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-zinc-900">
                  {billingPeriod === "monthly" ? "₹399" : "₹3,999"}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {billingPeriod === "monthly" ? "/ month" : "/ year (₹333/mo)"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">All-inclusive pricing. No hidden fees.</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Staff & Kitchen Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Daily SOP & Hygiene Checklists</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Camera Photo Proofs on Cloudflare R2</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sub-10s Food Wastage POS with Rupee Loss Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Digital Canvas Manager Signature Handover</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Visual Drag & Drop Checklist Builder</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>Get Started with 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-zinc-500">Everything you need to know about RestoPulse.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-zinc-200 rounded-2xl bg-white overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-zinc-900 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. MINIMALIST FOOTER */}
      <footer className="border-t border-zinc-100 py-8 px-4 sm:px-6 text-center text-xs text-zinc-400 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-zinc-900">
          <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px]">
            RP
          </div>
          <span>RestoPulse</span>
        </div>
        <p>© {new Date().getFullYear()} RestoPulse. All rights reserved. Built for high-efficiency kitchen teams.</p>
      </footer>
    </div>
  );
}
