/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, CheckCircle2, ChevronRight, RefreshCw, Monitor, Users, X, Phone, Brain, Clock, ArrowDownUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SmartNavbar from "@/components/SmartNavbar";
import LaserFlow from "@/components/LaserFlow";

export default function DoctorConsole() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [inCabin, setInCabin] = useState<any>(null);
  const [upNext, setUpNext] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const fetchDoctorState = useCallback(async () => {
    try {
      const res = await fetch(`/api/doctor/${id}`);
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setInCabin(data.inCabin);
        setUpNext(data.upNext);
        setQueue(data.queueDetails || []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load + auth check + auto-refresh every 4 seconds
  useEffect(() => {
    const checkAuth = async () => {
      // Small delay to ensure cookies are readable if just logged in
      try {
        const res = await fetch("/api/doctor/login"); // We'll use GET to check session
        // Wait, I need a GET endpoint for login to check session.
        // Or check document.cookie.
        const doctorIdInCookie = document.cookie
          .split("; ")
          .find(row => row.startsWith("smartopd_doctor_id="))
          ?.split("=")[1];

        if (doctorIdInCookie !== id) {
          router.push("/doctor/login");
          return;
        }
        setIsAuthorized(true);
        fetchDoctorState();
      } catch (e) {
        router.push("/doctor/login");
      }
    };

    checkAuth();
    const interval = setInterval(() => {
      if (document.cookie.includes(`smartopd_doctor_id=${id}`)) {
        fetchDoctorState();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchDoctorState, id, router]);



  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/doctor/${id}/next`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setInCabin(data.inCabin);
        setUpNext(data.upNext);
        setQueue(data.queueDetails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/doctor/${id}/skip`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Fetch fresh state after skip
        const refresh = await fetch(`/api/doctor/${id}`).then(r => r.json());
        if (refresh.success) {
          setDoctor(refresh.doctor);
          setInCabin(refresh.inCabin);
          setUpNext(refresh.upNext);
          setQueue(refresh.queueDetails);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrectTriage = async (patientId: string, newLevel: string) => {
    try {
      const res = await fetch(`/api/doctor/${id}/correct-triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, triageLevel: newLevel }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh state to reflect updated triage
        fetchDoctorState();
      }
    } catch (err) {
      console.error("Triage correction error:", err);
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin opacity-50" />
      </div>
    );
  }

  if (!doctor) {
    return <div className="text-white p-10">Doctor not found in system.</div>;
  }

  return (
    <div className="min-h-screen relative flex flex-col text-white overflow-hidden">
      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedPatient(null)} />
          <div className="relative z-10 bg-[#0d0d0f] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-black/80">
            {/* Close */}
            <button onClick={() => setSelectedPatient(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-2xl border ${
                selectedPatient.triageLevel === "CRITICAL" ? "bg-red-500/10 border-red-500/30" :
                selectedPatient.triageLevel === "URGENT" ? "bg-orange-500/10 border-orange-500/30" :
                "bg-emerald-500/10 border-emerald-500/20"
              }`}>
                <User className={`w-6 h-6 ${
                  selectedPatient.triageLevel === "CRITICAL" ? "text-red-400" :
                  selectedPatient.triageLevel === "URGENT" ? "text-orange-400" :
                  "text-emerald-400"
                }`} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{selectedPatient.name}</h2>
                <p className="text-[12px] text-zinc-500 font-mono tracking-widest">{selectedPatient.tokenId}</p>
              </div>
            </div>

            {/* Triage Badge */}
            <div className={`mb-6 px-4 py-3 rounded-2xl border flex items-center gap-3 ${
              selectedPatient.triageLevel === "CRITICAL" ? "bg-red-500/10 border-red-500/30" :
              selectedPatient.triageLevel === "URGENT" ? "bg-orange-500/10 border-orange-500/30" :
              "bg-emerald-500/5 border-emerald-500/20"
            }`}>
              <Brain className={`w-5 h-5 ${
                selectedPatient.triageLevel === "CRITICAL" ? "text-red-500" :
                selectedPatient.triageLevel === "URGENT" ? "text-orange-500" :
                "text-emerald-500"
              }`} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">AI Triage Priority</p>
                <p className={`text-sm font-bold uppercase tracking-widest ${
                  selectedPatient.triageLevel === "CRITICAL" ? "text-red-400" :
                  selectedPatient.triageLevel === "URGENT" ? "text-orange-400" :
                  "text-emerald-400"
                }`}>{selectedPatient.triageLevel || "STANDARD"}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</p>
                <p className="text-sm font-bold text-zinc-200">{selectedPatient.phone}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Registered</p>
                <p className="text-sm font-bold text-zinc-200">{new Date(selectedPatient.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>

            {/* Symptoms (The AI Input) */}
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5" /> Patient Symptoms (ML Input)
              </p>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {selectedPatient.symptoms || <span className="text-zinc-500 italic">No symptoms recorded.</span>}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* LaserFlow Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LaserFlow
          color="#7a7fff"
          wispDensity={1}
          flowSpeed={0.35}
          verticalSizing={2}
          horizontalSizing={0.5}
          fogIntensity={0.45}
          fogScale={0.3}
          wispSpeed={15}
          wispIntensity={5}
          flowStrength={0.25}
          decay={1.1}
          horizontalBeamOffset={0}
          verticalBeamOffset={-0.5}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pb-28 md:pb-0">
        <SmartNavbar active="doctor" badge="Doctor Console" extra={
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Avg Speed</p>
              <p className="font-bold text-emerald-400">{Math.round(doctor.averageConsultationTimeMs / 60000)}m / patient</p>
            </div>
            <a href={`/display/${id}`} target="_blank" className="flex text-[12px] font-bold bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
              TV Display →
            </a>
          </div>
        } />

        <main className="flex-1 flex flex-col md:flex-row px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6 max-w-[1400px] mx-auto w-full">
        
        {/* Left Side: Active Session Control */}
        <div className="flex-[2] flex flex-col gap-6">
          <div className="card p-5 md:p-8 flex flex-col items-center justify-center text-center min-h-[280px] md:min-h-[400px] bg-gradient-to-b from-[#111113] to-[#09090b] border-[#27272a] relative overflow-hidden">
            
            {/* Dynamic Background Glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 blur-[100px] pointer-events-none rounded-full opacity-20 ${inCabin ? 'bg-emerald-500' : 'bg-zinc-500'}`} />

            <h2 className="text-[12px] font-bold text-zinc-500 tracking-widest uppercase mb-6 relative z-10">
              Current Patient In Cabin
            </h2>

            <AnimatePresence mode="wait">
              {inCabin ? (
                <motion.div
                  key={inCabin.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative z-10 flex flex-col items-center w-full"
                >
                  <div className="bg-[#18181b] border border-[#27272a] px-5 py-2 rounded-full flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[13px] font-semibold text-emerald-400 font-mono tracking-widest">
                      {inCabin.tokenId}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 w-full truncate px-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => inCabin && setSelectedPatient(inCabin)}
                      className="hover:text-emerald-400 transition-colors cursor-pointer"
                      title="View patient details"
                    >
                      {inCabin.name}
                    </button>
                    {inCabin.triageLevel === "CRITICAL" && <span className="text-[12px] bg-red-500/20 text-red-500 px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/30">CRITICAL</span>}
                    {inCabin.triageLevel === "URGENT" && <span className="text-[12px] bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/30">URGENT</span>}
                  </h1>
                  <p className="text-zinc-500 font-medium mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> {inCabin.phone}
                  </p>

                  {/* 🧠 AI Triage Correction — Doctor Feedback Loop */}
                  <div className="mb-8 w-full max-w-md px-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                      <ArrowDownUp className="w-3 h-3" /> Correct AI Triage
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      {(["CRITICAL", "URGENT", "STANDARD"] as const).map((level) => {
                        const isActive = inCabin.triageLevel === level;
                        const styles = {
                          CRITICAL: isActive
                            ? "bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30"
                            : "bg-transparent text-zinc-600 border-[#27272a] hover:text-red-400 hover:border-red-500/30",
                          URGENT: isActive
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40 ring-1 ring-orange-500/30"
                            : "bg-transparent text-zinc-600 border-[#27272a] hover:text-orange-400 hover:border-orange-500/30",
                          STANDARD: isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20"
                            : "bg-transparent text-zinc-600 border-[#27272a] hover:text-emerald-400 hover:border-emerald-500/30",
                        };
                        return (
                          <button
                            key={level}
                            onClick={() => !isActive && handleCorrectTriage(inCabin.id, level)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${styles[level]}`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-zinc-700 mt-1.5 text-center">Your correction trains the AI model</p>
                  </div>

                  <div className="flex items-center justify-center gap-3 w-full px-4 md:px-10">
                    <button
                      onClick={handleSkip}
                      disabled={actionLoading}
                      className="px-6 py-4 rounded-xl font-bold tracking-wide text-[13px] border border-[#27272a] bg-[#0d0d0f] hover:bg-[#18181b] text-zinc-400 transition-colors"
                    >
                      Missing / Skip
                    </button>
                    
                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading}
                      className="flex-1 btn-primary py-4 text-[16px] shadow-lg shadow-emerald-500/20"
                    >
                      {actionLoading ? "Processing..." : "Complete & Call Next"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative z-10"
                >
                  <Monitor className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-zinc-400 mb-2">Cabin is Empty</h1>
                  <p className="text-zinc-500 mb-8 max-w-sm">
                    No active consultation. Click below to bring the next person in from the queue.
                  </p>
                  <button
                    onClick={handleCallNext}
                    disabled={actionLoading || queue.length === 0}
                    className="btn-primary px-8 py-3 w-full max-w-xs"
                  >
                    Call Next Patient
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="card p-6 bg-[#0d0d0f] border-[#27272a]">
             <h3 className="text-[12px] font-bold text-zinc-500 tracking-widest uppercase mb-4 flex items-center justify-between">
               <span>Next Up</span>
               <span className="text-emerald-500">{upNext ? upNext.tokenId : "None"}</span>
             </h3>
             {upNext ? (
               <div className="flex items-center justify-between bg-[#18181b] p-4 rounded-lg border border-[#27272a]">
                 <div>
                   <p className="text-xl font-bold flex items-center gap-2">
                     {upNext.name}
                     {upNext.triageLevel === "CRITICAL" && <span className="text-[9px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase tracking-widest border border-red-500/30">CRITICAL</span>}
                     {upNext.triageLevel === "URGENT" && <span className="text-[9px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded uppercase tracking-widest border border-orange-500/30">URGENT</span>}
                   </p>
                   <p className="text-[13px] text-zinc-500 mt-1">{upNext.phone}</p>
                 </div>
                 <ChevronRight className="w-6 h-6 text-zinc-600" />
               </div>
             ) : (
               <div className="p-4 text-center text-zinc-600 border border-dashed border-[#27272a] rounded-lg">
                 Queue is perfectly clear.
               </div>
             )}
          </div>
        </div>

        {/* Right Side: Virtual Queue */}
        <div className="flex-1 flex flex-col items-stretch card p-0 border-[#27272a] overflow-hidden max-h-[400px] md:max-h-[800px]">
          <div className="p-5 border-b border-[#1e1e22] bg-[#111113] flex items-center justify-between sticky top-0">
             <h2 className="text-[13px] font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
               <Users className="w-4 h-4 text-emerald-500" />
               Waiting Queue
             </h2>
             <span className="bg-[#18181b] text-zinc-300 px-2.5 py-1 rounded text-[11px] font-bold">
               {queue.length} Total
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 bg-[#0d0d0f]">
            <AnimatePresence>
              {queue.length === 0 ? (
                <div className="p-10 text-center text-zinc-500 flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-[#27272a]" />
                  <p className="text-[14px]">Queue is completely empty.</p>
                </div>
              ) : (
                queue.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-4 bg-[#111113] border border-[#1e1e22] rounded-lg mb-2 relative group"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#27272a] rounded-l-lg group-hover:bg-emerald-500 transition-colors" />
                    <div className="pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                          {p.tokenId}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            NEXT
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-[15px] flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="hover:text-emerald-400 transition-colors cursor-pointer text-left"
                          title="View patient details"
                        >
                          {p.name}
                        </button>
                        {p.triageLevel === "CRITICAL" && <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 tracking-widest">CRITICAL</span>}
                        {p.triageLevel === "URGENT" && <span className="text-[9px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/20 tracking-widest">URGENT</span>}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-zinc-500 font-bold uppercase tracking-widest bg-[#18181b] px-2 py-1 rounded">
                      Pos: {idx + 1}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Stethoscope(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
