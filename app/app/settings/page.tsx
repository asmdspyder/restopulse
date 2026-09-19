"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Building,
  CreditCard,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Shifts & Areas
  const [shiftsEnabled, setShiftsEnabled] = useState(false);
  const [shiftNamesText, setShiftNamesText] = useState("");
  const [responsibleAreasText, setResponsibleAreasText] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();

      if (data.restaurant) {
        setRestaurant(data.restaurant);
        setBusinessName(data.restaurant.businessName || "");
        setContactName(data.restaurant.contactName || "");
        setPhone(data.restaurant.phone || "");
        setAddress(data.restaurant.address || "");
        setCurrency(data.restaurant.currency || "INR");
        setTimezone(data.restaurant.timezone || "Asia/Kolkata");
        setShiftsEnabled(Boolean(data.restaurant.shiftsEnabled));
        setShiftNamesText((data.restaurant.shiftNames || ["Morning", "Evening"]).join(", "));
        setResponsibleAreasText(
          (data.restaurant.responsibleAreas || ["Kitchen", "Bar", "Bakery", "Service", "Storage"]).join(", ")
        );
      }
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const shiftNames = shiftNamesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const responsibleAreas = responsibleAreasText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          phone,
          address,
          currency,
          timezone,
          shiftsEnabled,
          shiftNames,
          responsibleAreas,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSuccessMessage("Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings & Workspace</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your restaurant profile, operational shift schedules, and Razorpay subscription.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Subscription & Plan</h3>
              <span className="text-xs text-slate-500">Managed via Razorpay Subscriptions</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold capitalize">
            {subscription?.status || "Active"}
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase block mb-1">Current Plan</span>
            <span className="text-sm font-extrabold text-slate-900 capitalize">
              {subscription?.planType || "Monthly"} Plan
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase block mb-1">Billing Amount</span>
            <span className="text-sm font-extrabold text-slate-900">
              {formatCurrency(subscription?.amount || 199)} / {subscription?.planType === "yearly" ? "year" : "month"}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase block mb-1">Next Renewal</span>
            <span className="text-sm font-extrabold text-slate-900">
              {subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Business Details & Operation Config Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Building className="w-5 h-5 text-slate-600" />
          <span>Restaurant Information</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Business / Restaurant Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Contact Person</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-700 mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Operational Configurations */}
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <span>Operational Configurations</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="shiftsToggle"
                checked={shiftsEnabled}
                onChange={(e) => setShiftsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <label htmlFor="shiftsToggle" className="font-bold text-slate-900 text-sm block cursor-pointer">
                  Enable Shift Tracking
                </label>
                <span className="text-[11px] text-slate-500">
                  Allow logging wastage against specific shifts (e.g. Morning, Afternoon, Evening or Lunch, Dinner).
                </span>
              </div>
            </div>

            {shiftsEnabled && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">Custom Shift Names (Comma separated)</label>
                <input
                  type="text"
                  value={shiftNamesText}
                  onChange={(e) => setShiftNamesText(e.target.value)}
                  placeholder="Morning, Evening"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Responsible Kitchen Areas (Comma separated)
            </label>
            <input
              type="text"
              value={responsibleAreasText}
              onChange={(e) => setResponsibleAreasText(e.target.value)}
              placeholder="Kitchen, Bar, Bakery, Service, Storage, Other"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
