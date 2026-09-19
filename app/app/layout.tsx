"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  CheckSquare,
  History,
  UtensilsCrossed,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  PlusCircle,
  ClipboardList,
  Layers,
  Building2,
  TrendingDown,
  ArrowLeft,
  Sliders,
} from "lucide-react";
import QuickRecordModal from "@/components/app/quick-record-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [authContext, setAuthContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

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

  // Define module-specific navigation items
  const sopNavItems = [
    { name: "Daily Checklist", href: "/app/checklists", icon: CheckSquare, exact: true },
    { name: "Checklist History", href: "/app/checklists/history", icon: ClipboardList },
    { name: "SOP Template Builder", href: "/app/checklists/builder", icon: Layers },
  ];

  // Wastage Nav items: 1. Record Wastage, 2. Wastage History, 3. Items Catalog, 4. Dashboard, 5. Analytics
  const wastageNavItems = [
    { name: "Record Wastage", href: "/app/wastage", icon: PlusCircle, exact: true },
    { name: "Wastage History", href: "/app/history", icon: History },
    { name: "Items Catalog", href: "/app/items", icon: UtensilsCrossed },
    { name: "Wastage Dashboard", href: "/app/dashboard", icon: BarChart3 },
    { name: "Wastage Analytics", href: "/app/analytics", icon: TrendingDown },
  ];

  const accountNavItems = [
    { name: "Team & Permissions", href: "/app/account?tab=users", icon: Users },
    { name: "Restaurant Profile", href: "/app/account?tab=restaurant", icon: Building2 },
    { name: "Operational Config", href: "/app/account?tab=operations", icon: Sliders },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dcece1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-700/20">
            W
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mt-2" />
          <span className="text-xs font-semibold text-slate-600">Loading restaurant operations...</span>
        </div>
      </div>
    );
  }

  // A. IF USER IS ON THE OPERATIONS HUB (/app) -> FULL-WIDTH HEADER + CLEAN CENTERED CONTENT (NO SIDEBAR)
  if (isHub) {
    return (
      <div className="min-h-screen bg-[#dcece1] flex flex-col pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#c2dac7] px-4 sm:px-8 h-16 flex items-center justify-between shadow-xs w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-emerald-700/20">
              W
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 block leading-tight">
                {authContext?.restaurant?.businessName || "WasteFlow"}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Restaurant Operations Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQuickRecordOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Quick Wastage</span>
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

        {/* Full-width Main Hub Content */}
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

  // B. IF INSIDE A MODULE (SOP, WASTAGE, ACCOUNT) -> MODULE SIDEBAR ON DESKTOP & TOP BAR
  return (
    <div className="min-h-screen bg-[#dcece1] flex flex-col md:flex-row pb-16 md:pb-0">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#c2dac7] z-30 shadow-xs">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Restaurant Name */}
          <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-700/20">
              W
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-sm text-slate-900 block truncate">
                {authContext?.restaurant?.businessName || "Restaurant"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operations Platform
              </span>
            </div>
          </div>

          {/* Custom Back Button to Operations Hub */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/app"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-2 border border-slate-200/80 transition group"
              title="Return to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Operations Hub</span>
            </Link>
          </div>

          {/* Module Header Banner */}
          <div className="px-4 py-2 mt-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {currentModule === "sop" && "SOP / Checklist Module"}
              {currentModule === "wastage" && "Wastage Recording Module"}
              {currentModule === "account" && "Account & Admin Module"}
            </div>
          </div>

          {/* Quick Wastage Logger Primary Button (when inside Wastage module) */}
          {currentModule === "wastage" && (
            <div className="px-3 pb-2">
              <button
                onClick={() => setIsQuickRecordOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Quick Wastage</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
            {/* A. SOP MODULE NAVIGATION */}
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
                          ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-emerald-700" : "text-slate-400"
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
                          ? "bg-teal-50 text-teal-900 font-bold border border-teal-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-teal-700" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* C. ACCOUNT MODULE NAVIGATION */}
            {currentModule === "account" && (
              <>
                {accountNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Module Switcher Quick Shortcuts at Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Switch Module
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {currentModule !== "sop" && (
                <Link
                  href="/app/checklists"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-900 text-center transition"
                >
                  📋 SOP
                </Link>
              )}
              {currentModule !== "wastage" && (
                <Link
                  href="/app/wastage"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-teal-50 text-[10px] font-bold text-slate-700 hover:text-teal-900 text-center transition"
                >
                  📉 Wastage
                </Link>
              )}
              {currentModule !== "account" && (
                <Link
                  href="/app/account"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-[10px] font-bold text-slate-700 hover:text-blue-900 text-center transition"
                >
                  🏢 Admin
                </Link>
              )}
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="min-w-0 flex-1 mr-2">
              <span className="font-semibold text-xs text-slate-900 block truncate">
                {authContext?.user?.name || "Staff"}
              </span>
              <span className="text-[10px] text-slate-500 block truncate capitalize">
                {authContext?.user?.role} • {authContext?.user?.canManageChecklists ? "SOP Lead" : "Staff"}
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

      {/* 2. MOBILE TOP HEADER (WHEN INSIDE A MODULE) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#c2dac7] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app"
            className="p-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-900 truncate block max-w-[130px]">
              {authContext?.restaurant?.businessName || "WasteFlow"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickRecordOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record</span>
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
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
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

            {/* Quick module selection */}
            <div className="grid grid-cols-4 gap-2 pb-2">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-center text-xs font-bold border bg-slate-50 text-slate-700"
              >
                🏠 Hub
              </Link>
              <Link
                href="/app/checklists"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                  currentModule === "sop" ? "bg-emerald-700 text-white" : "bg-slate-50 text-slate-700"
                }`}
              >
                📋 SOP
              </Link>
              <Link
                href="/app/wastage"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                  currentModule === "wastage" ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-700"
                }`}
              >
                📉 Wastage
              </Link>
              <Link
                href="/app/account"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                  currentModule === "account" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"
                }`}
              >
                🏢 Admin
              </Link>
            </div>

            {/* Active Module Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Navigation
              </div>

              {(currentModule === "sop" ? sopNavItems : currentModule === "wastage" ? wastageNavItems : currentModule === "account" ? accountNavItems : []).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-emerald-700" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full p-2.5 rounded-xl text-rose-600 font-bold text-xs hover:bg-rose-50 flex items-center gap-3 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA (WITH md:pl-64 FOR MODULE PAGES) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <main className="flex-1 min-w-0 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>

      {/* 4. MOBILE BOTTOM ACTION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around h-14 px-2">
        <Link
          href="/app"
          className="flex flex-col items-center justify-center w-14 h-full text-[9px] font-medium text-slate-500"
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>Hub</span>
        </Link>
        <Link
          href="/app/checklists"
          className={`flex flex-col items-center justify-center w-14 h-full text-[9px] font-medium ${
            pathname.startsWith("/app/checklists") ? "text-emerald-700 font-bold" : "text-slate-500"
          }`}
        >
          <CheckSquare className="w-4 h-4 mb-0.5" />
          <span>SOP</span>
        </Link>
        <button
          onClick={() => setIsQuickRecordOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-700/30 cursor-pointer"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
        <Link
          href="/app/wastage"
          className={`flex flex-col items-center justify-center w-14 h-full text-[9px] font-medium ${
            pathname.startsWith("/app/dashboard") || pathname.startsWith("/app/wastage") || pathname.startsWith("/app/history") || pathname.startsWith("/app/items") || pathname.startsWith("/app/analytics")
              ? "text-teal-700 font-bold"
              : "text-slate-500"
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Wastage</span>
        </Link>
        <Link
          href="/app/account"
          className={`flex flex-col items-center justify-center w-14 h-full text-[9px] font-medium ${
            pathname.startsWith("/app/account") ? "text-blue-600 font-bold" : "text-slate-500"
          }`}
        >
          <Building2 className="w-4 h-4 mb-0.5" />
          <span>Admin</span>
        </Link>
      </nav>

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        onSuccess={() => {
          if (pathname.includes("/dashboard") || pathname.includes("/history") || pathname.includes("/analytics") || pathname.includes("/wastage")) {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
