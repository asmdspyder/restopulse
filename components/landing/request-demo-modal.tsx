"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = [
  { id: "10-11", label: "10:00 AM - 11:00 AM", startHour: 10 },
  { id: "11-12", label: "11:00 AM - 12:00 PM", startHour: 11 },
  { id: "12-13", label: "12:00 PM - 01:00 PM", startHour: 12 },
  { id: "13-14", label: "01:00 PM - 02:00 PM", startHour: 13 },
  { id: "14-15", label: "02:00 PM - 03:00 PM", startHour: 14 },
  { id: "15-16", label: "03:00 PM - 04:00 PM", startHour: 15 },
  { id: "16-17", label: "04:00 PM - 05:00 PM", startHour: 16 },
  { id: "17-18", label: "05:00 PM - 06:00 PM", startHour: 17 },
  { id: "18-19", label: "06:00 PM - 07:00 PM", startHour: 18 },
  { id: "19-20", label: "07:00 PM - 08:00 PM", startHour: 19 },
  { id: "20-21", label: "08:00 PM - 09:00 PM", startHour: 20 },
  { id: "21-22", label: "09:00 PM - 10:00 PM", startHour: 21 },
];

const REFERRAL_OPTIONS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "google", label: "Google" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "other", label: "Other" },
];

export default function RequestDemoModal({ isOpen, onClose }: RequestDemoModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [otherSourceDetail, setOtherSourceDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Set default date to today
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const localDate = now.toISOString().split("T")[0];
      setSelectedDate(localDate);
      setSelectedSlot("");
      setReferralSource("");
      setOtherSourceDetail("");
      setErrorMessage("");
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Fetch already-booked slots whenever selectedDate changes
  useEffect(() => {
    if (!isOpen || !selectedDate) {
      setBookedSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);
    fetch(`/api/demo-request?date=${encodeURIComponent(selectedDate)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
        }
      })
      .catch((err) => {
        console.error("Failed to load booked slots:", err);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedDate]);

  // Clear selectedSlot if it is already booked
  useEffect(() => {
    if (selectedSlot && bookedSlots.includes(selectedSlot)) {
      setSelectedSlot("");
    }
  }, [bookedSlots, selectedSlot]);

  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const currentHour = now.getHours();
  const isToday = selectedDate === todayStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage("Please enter a valid phone or WhatsApp number.");
      return;
    }
    if (!restaurantName.trim()) {
      setErrorMessage("Please enter your restaurant or cafe name.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Please enter your restaurant location or address.");
      return;
    }
    if (!selectedDate) {
      setErrorMessage("Please select a date for the demo.");
      return;
    }
    if (!selectedSlot) {
      setErrorMessage("Please select an available 1-hour time slot.");
      return;
    }

    const finalReferralSource =
      referralSource === "Other"
        ? (otherSourceDetail.trim() ? `Other: ${otherSourceDetail.trim()}` : "Other")
        : referralSource;

    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          restaurantName: restaurantName.trim(),
          address: address.trim(),
          demoDate: selectedDate,
          demoSlot: selectedSlot,
          referralSource: finalReferralSource,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          fetch(`/api/demo-request?date=${encodeURIComponent(selectedDate)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.bookedSlots) setBookedSlots(d.bookedSlots);
            })
            .catch(() => {});
        }
        throw new Error(data.error || "Failed to submit demo request.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setName("");
    setEmail("");
    setPhone("");
    setRestaurantName("");
    setAddress("");
    setSelectedSlot("");
    setReferralSource("");
    setOtherSourceDetail("");
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-5 sm:p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>1-on-1 Personalized Product Walkthrough</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Request a Live Demo</h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-md font-medium leading-relaxed">
            See how RestoPulse automates kitchen SOPs, tracks food wastage, and calculates exact dish costs for your restaurant.
          </p>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Demo Request Confirmed!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-slate-900">{name}</strong>. We have reserved your requested demo slot for{" "}
                <strong className="text-emerald-800">{restaurantName}</strong>.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Scheduled Date:</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> {selectedDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Selected 1-Hour Slot:</span>
                <span className="font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" /> {selectedSlot}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">WhatsApp / Phone:</span>
                <span className="font-bold text-slate-800">{phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Email:</span>
                <span className="font-bold text-slate-800">{email}</span>
              </div>
              {referralSource && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Found Us Via:</span>
                  <span className="font-bold text-emerald-800">
                    {referralSource === "Other" && otherSourceDetail.trim()
                      ? otherSourceDetail.trim()
                      : referralSource}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium">
              💡 Our product team will connect with you on WhatsApp / Email before the slot with your personalized meeting link.
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm transition shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Step 1: Restaurant & Contact Details */}
            <div className="space-y-3.5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                1. Restaurant & Contact Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium"
                    />
                  </div>
                </div>

                {/* Restaurant / Cafe Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Restaurant / Cafe Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Spice Symphony Cafe"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Restaurant Location / City & Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Indiranagar 100ft Road, Bengaluru, Karnataka"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Where did you find us? */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Where did you find us? <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {REFERRAL_OPTIONS.map((opt) => {
                  const isSelected = referralSource === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setReferralSource(opt.label);
                        if (opt.label !== "Other") {
                          setOtherSourceDetail("");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/30"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {referralSource === "Other" && (
                <div className="pt-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    placeholder="Please specify where you found us (e.g. YouTube, Expo, Friend recommendation)..."
                    value={otherSourceDetail}
                    onChange={(e) => setOtherSourceDetail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-medium"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Step 2: Date & 1-Hour Time Slot Selection */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  2. Choose Demo Date & 1-Hour Slot
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  10:00 AM – 10:00 PM
                </span>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Date (Today or Future Date) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedDate === todayStr
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(tomorrowStr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedDate === tomorrowStr
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(dayAfterStr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedDate === dayAfterStr
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    In 2 Days
                  </button>
                </div>

                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition font-bold cursor-pointer"
                  />
                </div>
              </div>

              {/* 1-Hour Time Slots Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>Pick a 1-Hour Slot <span className="text-rose-500">*</span></span>
                    {loadingSlots && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                      </span>
                    )}
                  </span>
                  {selectedSlot && (
                    <span className="text-[11px] font-extrabold text-emerald-800">
                      Selected: {selectedSlot}
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot.label);
                    const isPassed = isToday && slot.startHour <= currentHour;
                    const isDisabled = isBooked || isPassed;
                    const isSelected = selectedSlot === slot.label;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedSlot(slot.label)}
                        className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between gap-1.5 transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-600"
                            : isBooked
                            ? "bg-rose-50/70 text-slate-400 border border-rose-200 cursor-not-allowed opacity-85"
                            : isPassed
                            ? "bg-slate-200/60 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/50"
                        }`}
                        title={isBooked ? "This slot is already booked" : isPassed ? "This slot has already passed" : slot.label}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className={`w-3 h-3 shrink-0 ${isSelected ? "text-white" : isBooked ? "text-rose-400" : isPassed ? "text-slate-400" : "text-emerald-700"}`} />
                          <span className={isPassed || isBooked ? "line-through text-slate-500" : ""}>{slot.label}</span>
                        </div>
                        {isBooked ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800 border border-rose-300 shrink-0">
                            Booked
                          </span>
                        ) : isPassed ? (
                          <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                            Passed
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {isToday && currentHour >= 21 && (
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    Note: Evening slots for today are ending soon. Feel free to choose tomorrow for more slot options!
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking Your Demo...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Demo Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Free 30-min session
                </span>
                <span>•</span>
                <span>Zero sales pressure</span>
                <span>•</span>
                <span>Tailored to your menu & kitchen</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
