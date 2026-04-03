/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, RefreshCw, LogOut, Shield } from "lucide-react";
import SmartNavbar from "@/components/SmartNavbar";

export default function AdminDashboardClient() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystem = async () => {
    try {
      const res = await fetch("/api/system");
      const data = await res.json();
      if (data.success) setDoctors(data.doctors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystem();
    const interval = setInterval(fetchSystem, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <SmartNavbar active="admin" extra={
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-red-400 transition-colors border border-[#27272a] px-3 py-1.5 rounded-lg hover:border-red-500/30"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      }/>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              <h1 className="text-2xl font-bold tracking-tight">Admin Master Dashboard</h1>
            </div>
            <p className="text-[14px] text-zinc-500">Real-time view of all OPD queues and doctor efficiency.</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE UPDATES
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Waiting</p>
            <p className="text-4xl font-black text-white">{doctors.reduce((sum, d) => sum + d.queueLength, 0)}</p>
          </div>
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Active OPDs</p>
            <p className="text-4xl font-black text-emerald-400">{doctors.filter(d => d.currentPatient).length}</p>
          </div>
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Seen Today</p>
            <p className="text-4xl font-black text-white">{doctors.reduce((sum, d) => sum + d.patientsSeenToday, 0)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin opacity-50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-[#111113] border border-[#27272a] rounded-2xl flex flex-col overflow-hidden hover:border-zinc-600 transition-colors">
                <div className="p-5 border-b border-[#1e1e22] bg-[#0d0d0f] flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-bold text-zinc-100">{doc.name}</h3>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">{doc.department}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-[#1e1e22] text-zinc-400 rounded border border-[#27272a]">
                    {doc.room}
                  </span>
                </div>

                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="bg-[#18181b] p-4 rounded-lg border border-[#27272a]">
                    <Users className="w-4 h-4 text-zinc-500 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Waiting</p>
                    <p className={`text-3xl font-bold ${doc.queueLength > 5 ? "text-amber-400" : "text-zinc-100"}`}>
                      {doc.queueLength}
                    </p>
                  </div>
                  <div className="bg-[#18181b] p-4 rounded-lg border border-[#27272a]">
                    <Clock className="w-4 h-4 text-emerald-500 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-500">Avg Time</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {doc.averageWaitMins}<span className="text-base text-emerald-500/50">m</span>
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between text-[13px] border-t border-[#1e1e22] pt-4">
                    <span className="text-zinc-500">In Cabin Now:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border ${doc.currentPatient ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-zinc-600 bg-[#18181b] border-[#27272a]"}`}>
                      {doc.currentPatient ? `${doc.currentPatient.tokenId} — ${doc.currentPatient.name}` : "EMPTY"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] mt-2">
                    <span className="text-zinc-500">Seen Today:</span>
                    <span className="font-bold text-white">{doc.patientsSeenToday}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0d0d0f] border-t border-[#1e1e22] flex gap-2">
                  <a href={`/doctor/${doc.id}`} className="flex-1 text-center text-[12px] font-semibold text-emerald-500 hover:text-emerald-400 py-1.5 transition-colors bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                    Doctor Console →
                  </a>
                  <a href={`/display/${doc.id}`} className="flex-1 text-center text-[12px] font-semibold text-zinc-400 hover:text-white py-1.5 transition-colors bg-[#18181b] hover:bg-[#27272a] rounded-lg border border-[#27272a]">
                    TV Display →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
