"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.user?.role !== "superadmin") {
        throw new Error(data.error || "Invalid administrator credentials");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate admin");
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@wasteflow.io");
    setPassword("AdminSecurePassword123!");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
          A
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          Administrator Access
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Platform management portal for restaurant workspaces & subscriptions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wasteflow.io"
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Platform Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Fill Default Admin Credentials (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
