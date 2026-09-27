"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckSquare,
  History,
  UtensilsCrossed,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Loader2,
  PlusCircle,
  ClipboardList,
  Layers,
  Building2,
  TrendingDown,
  ArrowLeft,
  Sliders,
  Sparkles,
  Shield,
} from "lucide-react";
import QuickRecordModal from "@/components/app/quick-record-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [authContext, setAuthContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [isExitingImpersonation, setIsExitingImpersonation] = useState(false);

  useEffect(() => {
    checkSession();
  }, [pathname]);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();

      if (!data.canAccessApp) {
        router.push(`/blocked?reason=${data.blockReason || "deactivated"}`);
        return;
      }

      setAuthContext(data);

      // Staff Role Protection: Staff are strictly restricted to checklists and recording wastage
      if (data?.user?.role === "staff") {
        const staffRestrictedPaths = [
          "/app/checklists/builder",
          "/app/checklists/history",
          "/app/history",
          "/app/items",
          "/app/dashboard",
          "/app/analytics",
          "/app/account",
          "/app/users",
          "/app/settings",
        ];
        if (staffRestrictedPaths.some((p) => pathname.startsWith(p))) {
          router.replace("/app/checklists");
          return;
        }
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleExitImpersonation = async () => {
    setIsExitingImpersonation(true);
    try {
      const res = await fetch("/api/admin/impersonate/exit", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = "/admin/accounts";
      }
    } catch (err) {
      console.error("Failed to exit impersonation:", err);
      window.location.href = "/admin/accounts";
    }
  };

  const isStaff = authContext?.user?.role === "staff";
  const isHub = pathname === "/app";

  // Determine current active module context
  let currentModule: "hub" | "sop" | "wastage" | "account" = "hub";

  if (pathname.startsWith("/app/checklists")) {
    currentModule = "sop";
  } else if (
    pathname.startsWith("/app/dashboard") ||
    pathname.startsWith("/app/wastage") ||
    pathname.startsWith("/app/history") ||
    pathname.startsWith("/app/items") ||
    pathname.startsWith("/app/analytics")
  ) {
    currentModule = "wastage";
  } else if (
    pathname.startsWith("/app/account") ||
    pathname.startsWith("/app/users") ||
    pathname.startsWith("/app/settings")
  ) {
    currentModule = "account";
  } else {
    currentModule = "hub";
  }

  // Define module-specific navigation items (Staff only sees allowed items)
  const sopNavItems = isStaff
    ? [{ name: "Daily Checklist", href: "/app/checklists", icon: CheckSquare, exact: true }]
    : [
        { name: "Daily Checklist", href: "/app/checklists", icon: CheckSquare, exact: true },
        { name: "Checklist History", href: "/app/checklists/history", icon: ClipboardList },
        { name: "Checklist Builder", href: "/app/checklists/builder", icon: Layers },
      ];

  const wastageNavItems = isStaff
    ? [{ name: "Record Wastage", href: "/app/wastage", icon: PlusCircle, exact: true }]
    : [
        { name: "Record Wastage", href: "/app/wastage", icon: PlusCircle, exact: true },
        { name: "Wastage History", href: "/app/history", icon: History },
        { name: "Items & Prices", href: "/app/items", icon: UtensilsCrossed },
        { name: "Overview Summary", href: "/app/dashboard", icon: BarChart3 },
        { name: "Cost Reports", href: "/app/analytics", icon: TrendingDown },
      ];

  const accountNavItems = [
    { name: "Team Members", href: "/app/account?tab=users", icon: Users },
    { name: "Restaurant Profile", href: "/app/account?tab=restaurant", icon: Building2 },
    { name: "Shifts & Areas", href: "/app/account?tab=operations", icon: Sliders },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 animate-pulse">
            R
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span className="text-xs font-semibold text-slate-400 tracking-wide">Loading workspace...</span>
        </div>
      </div>
    );
  }

  // A. OPERATIONS HUB VIEW (/app) -> CLEAN FULL-WIDTH HEADER + CENTERED WORKSPACE
  if (isHub) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 font-sans selection:bg-amber-500 selection:text-slate-950">
        {/* Superadmin Impersonation Notice Bar */}
        {authContext?.isImpersonating && (
          <div className="bg-amber-400 text-slate-950 px-4 sm:px-8 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-amber-500 sticky top-0 z-50">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 animate-pulse">
                Admin Impersonation
              </span>
              <span className="truncate">
                Managing <strong>{authContext?.restaurant?.businessName}</strong> ({authContext?.user?.name})
              </span>
            </div>
            <button
              onClick={handleExitImpersonation}
              disabled={isExitingImpersonation}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              {isExitingImpersonation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Restoring Admin Session...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Impersonation</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between shadow-2xs w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xl shadow-md border border-slate-800">
              R
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 block leading-tight">
                {authContext?.restaurant?.businessName || "RestoPulse"}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider block">
                {isStaff ? "Staff Operations" : "Restaurant Manager Hub"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQuickRecordOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Log Wastage</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block">{authContext?.user?.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{authContext?.user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Quick Record Modal */}
        <QuickRecordModal
          isOpen={isQuickRecordOpen}
          onClose={() => setIsQuickRecordOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  // B. INSIDE OPERATIONAL MODULE (CHECKLISTS, WASTAGE, ACCOUNT) -> SLEEK MODERN SIDEBAR ON DESKTOP & TOP BAR
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row pb-16 md:pb-0 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 z-30 shadow-2xs">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Restaurant Name */}
          <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-lg shadow-2xs border border-slate-800">
              R
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-sm text-slate-900 block truncate">
                {authContext?.restaurant?.businessName || "Restaurant"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {isStaff ? "Staff Portal" : "RestoPulse Hub"}
              </span>
            </div>
          </div>

          {/* Back Button to Operations Hub */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/app"
              className="w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 font-bold text-xs flex items-center gap-2 border border-slate-200/60 transition group"
              title="Back to Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Operations Hub</span>
            </Link>
          </div>

          {/* Module Header Title */}
          <div className="px-4 py-2 mt-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {currentModule === "sop" && "Shift Checklists"}
              {currentModule === "wastage" && "Food Waste Tracking"}
              {currentModule === "account" && "Settings & Team"}
            </div>
          </div>

          {/* Quick Wastage Logger Primary Button (when inside Wastage module) */}
          {currentModule === "wastage" && (
            <div className="px-3 pb-2">
              <button
                onClick={() => setIsQuickRecordOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm shadow-slate-900/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>+ Log Wastage</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
            {/* A. CHECKLISTS MODULE NAVIGATION */}
            {currentModule === "sop" && (
              <>
                {sopNavItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-amber-400" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* B. WASTAGE MODULE NAVIGATION */}
            {currentModule === "wastage" && (
              <>
                {wastageNavItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-amber-400" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* C. ACCOUNT MODULE NAVIGATION (Admins Only) */}
            {currentModule === "account" && !isStaff && (
              <>
                {accountNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Module Switcher Shortcuts (Hidden for Staff) */}
          {!isStaff && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
                Quick Switch
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {currentModule !== "sop" && (
                  <Link
                    href="/app/checklists"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 text-center transition"
                  >
                    📋 Checklists
                  </Link>
                )}
                {currentModule !== "wastage" && (
                  <Link
                    href="/app/wastage"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 text-center transition"
                  >
                    🗑️ Wastage
                  </Link>
                )}
                {currentModule !== "account" && (
                  <Link
                    href="/app/account"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 text-center transition"
                  >
                    ⚙️ Settings
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="min-w-0 flex-1 mr-2">
              <span className="font-bold text-xs text-slate-900 block truncate">
                {authContext?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-slate-500 block truncate capitalize">
                {authContext?.user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="Back to Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-900 truncate block max-w-[140px]">
              {authContext?.restaurant?.businessName || "RestoPulse"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickRecordOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Waste</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {authContext?.restaurant?.businessName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {authContext?.user?.name} ({authContext?.user?.role})
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Quick navigation for Mobile */}
            <div className="space-y-1">
              <Link
                href="/app/checklists"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Daily Checklists</span>
              </Link>
              <Link
                href="/app/wastage"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Record Wastage</span>
              </Link>
              {!isStaff && (
                <>
                  <Link
                    href="/app/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
                  >
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Wastage History</span>
                  </Link>
                  <Link
                    href="/app/items"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-slate-600" />
                    <span>Items & Prices</span>
                  </Link>
                  <Link
                    href="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    <span>Reports Dashboard</span>
                  </Link>
                  <Link
                    href="/app/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800"
                  >
                    <Sliders className="w-4 h-4 text-slate-600" />
                    <span>Settings & Team</span>
                  </Link>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
