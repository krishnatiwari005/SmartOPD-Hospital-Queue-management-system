"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, User, Stethoscope, DoorOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import LaserFlow from "@/components/LaserFlow";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    room: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setStep(3); // Show success state
        setTimeout(() => {
          router.push(`/doctor/${data.id}`);
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || "Registration failed. Please check your details.");
      }
    } catch {
      setError("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      <LaserFlow />
      
      <div className="w-full max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
            <Activity className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">SmartOPD</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Join the Medical Personnel Network</p>
        </div>

        <div className="bg-[#111113]/80 backdrop-blur-xl border border-[#27272a] rounded-3xl p-10 shadow-2xl relative">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Official Identity</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Full Name (Dr.)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Official Hospital Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="name@hospital.com"
                    className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                onClick={() => (formData.name && formData.email) && setStep(2)}
                disabled={!formData.name || !formData.email}
                className="w-full btn-primary py-4 text-[15px] font-black flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-6">
               <div className="flex items-center gap-3 mb-6">
                <Stethoscope className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Department Details</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Specialization</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateField("department", e.target.value)}
                      placeholder="e.g. Orthopedics"
                      required
                      className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Room No.</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => updateField("room", e.target.value)}
                      placeholder="e.g. 101"
                      required
                      className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#27272a] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-[13px] font-semibold tracking-wide">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-[#27272a] hover:bg-zinc-900 transition-all font-bold text-zinc-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-4 text-[15px] font-black shadow-lg shadow-emerald-500/20"
                >
                  {loading ? "Creating Account..." : "Create Official Account"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Registration Complete!</h2>
              <p className="text-zinc-500 text-sm">Welcome to the hospital network, Dr. {formData.name.split(' ')[0]}. Accessing your cabin now...</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm font-semibold">
            Already registered? <Link href="/doctor/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">Authorize Login Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
