"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Invalid Admin ID or Password. Please try again.");
      }
    } catch {
      setError("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">SmartOPD</h1>
          <p className="text-zinc-500 text-sm mt-1">Secure Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111113] border border-[#27272a] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            Administrator Login
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Admin ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@hospital.com"
                required
                className="w-full px-4 py-3 bg-[#0d0d0f] border border-[#27272a] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3 bg-[#0d0d0f] border border-[#27272a] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold mt-2"
            >
              {loading ? "Authenticating..." : "Login to Admin Panel"}
            </button>
          </div>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
