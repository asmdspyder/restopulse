"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  CreditCard,
  Building,
  LogOut,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user?.role !== "superadmin") {
          router.push("/admin/login");
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Restaurant Accounts", href: "/admin/accounts", icon: Building },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-white">
            A
          </div>
          <div>
            <span className="font-extrabold text-sm block text-white tracking-tight">RestoPulse Admin</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Platform Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">Owner Admin</span>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
