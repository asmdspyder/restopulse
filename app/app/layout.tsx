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
  LayoutDashboard,
  Calendar,
  Settings,
  Sparkle,
  Plus,
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

  // Navigation Items
  const navItems = isStaff
    ? [
        { name: "Shift Hub", href: "/app", icon: LayoutDashboard, exact: true },
        { name: "Daily Checklist", href: "/app/checklists", icon: CheckSquare },
        { name: "Record Wastage", href: "/app/wastage", icon: PlusCircle },
      ]
    : [
        { name: "Operations Hub", href: "/app", icon: LayoutDashboard, exact: true },
        { name: "Daily Checklist", href: "/app/checklists", icon: CheckSquare },
        { name: "Checklist History", href: "/app/checklists/history", icon: ClipboardList },
        { name: "Checklist Builder", href: "/app/checklists/builder", icon: Layers },
        { name: "Record Wastage", href: "/app/wastage", icon: PlusCircle },
        { name: "Wastage History", href: "/app/history", icon: History },
        { name: "Item Catalog", href: "/app/items", icon: UtensilsCrossed },
        { name: "Analytics & Reports", href: "/app/analytics", icon: TrendingDown },
        { name: "Team & Staff", href: "/app/users", icon: Users },
        { name: "Settings & Billing", href: "/app/account", icon: Settings },
      ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
          <p className="text-xs font-semibold text-zinc-500">Loading RestoPulse...</p>
        </div>
      </div>
    );
  }

  const businessName = authContext?.restaurant?.businessName || "Restaurant";
  const userName = authContext?.user?.name || "User";
  const userRole = authContext?.user?.role || "staff";

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Impersonation Banner */}
      {authContext?.impersonating && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
            <span>
              Impersonating restaurant account: <strong>{businessName}</strong>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            disabled={isExitingImpersonation}
            className="px-3 py-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            {isExitingImpersonation ? "Exiting..." : "Exit Impersonation"}
          </button>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex flex-1 min-h-0">
        {/* DESKTOP SIDEBAR RAIL */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-zinc-200/80 shrink-0">
          {/* Brand Logo & Restaurant Name */}
          <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-xs shrink-0">
              RP
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-zinc-900 block truncate leading-tight">
                {businessName}
              </span>
              <span className="text-[10px] text-zinc-400 capitalize font-medium">
                {userRole === "staff" ? "Staff Mode" : `${userRole} Access`}
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-3 border-b border-zinc-100">
            <button
              type="button"
              onClick={() => setIsQuickRecordOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Record Waste</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-semibold shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Bottom Section */}
          <div className="p-3 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-900 block truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">{userRole}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Mobile Bar */}
          <header className="lg:hidden bg-white border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                RP
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block leading-tight">{businessName}</span>
                <span className="text-[10px] text-zinc-400 capitalize">{userRole}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickRecordOpen(true)}
                className="p-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs"
                title="Quick Record"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
              <div className="w-72 bg-white h-full shadow-2xl p-5 flex flex-col animate-in slide-in-from-left">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                      RP
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">{businessName}</span>
                      <span className="text-[10px] text-zinc-400 capitalize">{userRole}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? "bg-zinc-100 text-zinc-900 font-semibold"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-700">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-zinc-900">{userName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Viewport Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Global Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />
    </div>
  );
}
