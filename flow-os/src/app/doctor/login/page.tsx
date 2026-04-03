"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import LaserFlow from "@/components/LaserFlow";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.endsWith("@hospital.com")) {
      setError("Please use your official @hospital.com email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        setError(`System Error: Expected JSON response, but received status ${res.status}. Please Refresh!`);
        setLoading(false);
        return;
      }

      if (data.success) {
        // Redirect to the specific doctor cabin
        router.push(`/doctor/${data.id}`);
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Network exception. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-8 pb-28 md:pb-8 relative overflow-hidden">
      <LaserFlow />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border border-[#27272a] shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-black">
            <img src="/logo.png" alt="SmartOPD Hospital Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">SmartOPD</h1>
          <p className="text-zinc-500 text-sm mt-2 font-medium">Official Doctor Portal Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#111113]/80 backdrop-blur-xl border border-[#27272a] rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Clinical Personnel Access
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2.5 ml-1">
                Official Hospital Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500">
                  <Mail className="w-5 h-5 text-zinc-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-[15px] text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all focus:ring-4 focus:ring-emerald-500/5 hover:border-[#37373f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500">
                  <Lock className="w-5 h-5 text-zinc-600" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-[15px] text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all focus:ring-4 focus:ring-emerald-500/5 hover:border-[#37373f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-4 rounded-xl text-[13px] font-semibold animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
            >
              {loading ? "Authenticating Official ID..." : "Authorize Login"}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-zinc-600 text-xs font-semibold tracking-wide">
            SYSTEM PROTECTED BY SMARTOPD SECURE CORE
          </p>
          <div className="flex items-center justify-center gap-1.5 grayscale opacity-50">
            <div className="w-1 h-1 bg-zinc-500 rounded-full" />
            <div className="w-1 h-1 bg-zinc-500 rounded-full" />
            <div className="w-1 h-1 bg-zinc-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
