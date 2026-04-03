/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Activity, Monitor, AlertTriangle } from "lucide-react";
import LaserFlow from "@/components/LaserFlow";

export default function WaitingRoomDisplay() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDisplayData = useCallback(async () => {
    try {
      const res = await fetch(`/api/doctor/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 3000); // 3 sec auto refresh
    return () => clearInterval(interval);
  }, [fetchDisplayData]);

  if (loading) return <div className="min-h-screen bg-black" />;

  if (!data || !data.doctor) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white text-3xl font-bold tracking-widest">OPD DISPLAY OFFLINE</div>;
  }

  const { doctor, inCabin, upNext, queueDetails = [] } = data;

  return (
    <div className="min-h-screen relative bg-[#09090b] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Dynamic Laser Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <LaserFlow
          color={inCabin?.triageLevel === "CRITICAL" ? "#ef4444" : "#10b981"}
          wispDensity={inCabin?.triageLevel === "CRITICAL" ? 3 : 1.5}
          flowSpeed={inCabin?.triageLevel === "CRITICAL" ? 0.8 : 0.3}
          verticalSizing={2}
          horizontalSizing={1}
          fogIntensity={0.5}
          fogScale={0.4}
          wispSpeed={20}
          wispIntensity={6}
          flowStrength={0.3}
          decay={1.1}
          horizontalBeamOffset={0}
          verticalBeamOffset={0}
        />
      </div>

      {/* Top Banner */}
      <header className="relative z-10 px-4 md:px-10 py-4 md:py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
         <div className="flex items-center gap-2 md:gap-4">
            <a href={`/doctor/${id}`} className="mr-0 md:mr-2 p-1 md:p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </a>
            <img src="/logo.png" alt="Logo" className="w-8 h-8 md:w-12 md:h-12" />
            <h1 className="text-xl md:text-3xl font-black tracking-tight">SmartOPD</h1>
         </div>
         <div className="text-right">
            <h2 className="text-xl md:text-4xl font-black">{doctor.name}</h2>
            <p className="text-xs md:text-xl text-zinc-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">{doctor.department} · {doctor.room}</p>
         </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row w-full h-auto min-h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)]">
        
        {/* Left: NOW SERVING (Big Focus) */}
        <div className="w-full lg:w-[65%] border-b lg:border-r border-white/5 bg-black/20 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden backdrop-blur-sm min-h-[400px]">
           
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] blur-[200px] rounded-full opacity-20 pointer-events-none ${!inCabin ? 'bg-transparent' : inCabin.triageLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-emerald-500'}`} />

           <div className="relative z-10 w-full text-center">
             <h3 className="text-xl md:text-3xl font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 md:mb-8 drop-shadow-md">Inside Cabin</h3>
             
             <AnimatePresence mode="wait">
               {inCabin ? (
                 <motion.div
                   key={inCabin.id}
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, y: -50 }}
                   className="flex flex-col items-center"
                 >
                   <div className={`border-2 md:border-4 rounded-full px-8 md:px-16 py-3 md:py-6 inline-flex items-center gap-3 md:gap-6 mb-6 md:mb-12 backdrop-blur-xl ${inCabin.triageLevel === "CRITICAL" ? "bg-red-500/10 border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.2)]" : "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.15)]"}`}>
                     <div className={`w-3 md:w-6 h-3 md:h-6 rounded-full animate-pulse ${inCabin.triageLevel === "CRITICAL" ? "bg-red-500" : "bg-emerald-500"}`} />
                     <span className={`text-[48px] md:text-[120px] leading-none font-black font-mono tracking-tighter ${inCabin.triageLevel === "CRITICAL" ? "text-red-400" : "text-emerald-400"}`}>
                       {inCabin.tokenId}
                     </span>
                   </div>
                   <h2 className="text-4xl md:text-7xl font-bold tracking-tight w-full truncate px-4 md:px-10 mb-2 md:mb-4 drop-shadow-lg">
                     {inCabin.name}
                   </h2>
                   {inCabin.triageLevel === "CRITICAL" && (
                     <span className="inline-flex items-center gap-2 text-[14px] md:text-2xl bg-red-500/20 text-red-400 px-4 md:px-6 py-1.5 md:py-2 rounded-full uppercase tracking-widest border border-red-500/30 font-bold animate-pulse mt-2">
                        <AlertTriangle className="w-5 md:w-8 h-5 md:h-8" /> Critical Emergency
                     </span>
                   )}
                 </motion.div>
               ) : (
                 <motion.div
                   key="empty"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                 >
                   <Monitor className="w-16 md:w-32 h-16 md:h-32 text-zinc-800 mx-auto mb-4 md:mb-8" />
                   <h2 className="text-3xl md:text-5xl font-bold text-zinc-600">PLEASE WAIT</h2>
                   <p className="text-xl md:text-2xl text-zinc-500 mt-2 md:mt-4">Cabin is empty.</p>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Right: UP NEXT and Queue */}
        <div className="w-full lg:w-[35%] bg-black/60 backdrop-blur-xl flex flex-col p-6 md:p-10 border-l border-white/5">
           
           {/* Up Next Showcase */}
           <div className={`mb-6 md:mb-10 min-h-[180px] md:min-h-[250px] border rounded-3xl p-6 md:p-8 flex flex-col justify-center backdrop-blur-2xl shadow-xl transition-all ${upNext?.triageLevel === "CRITICAL" ? "bg-red-500/10 border-red-500/40" : "bg-white/5 border-white/10"}`}>
             <h3 className={`text-md md:text-xl font-bold uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-2 md:gap-3 ${upNext?.triageLevel === "CRITICAL" ? "text-red-500" : "text-emerald-500"}`}>
               <span className={`w-2 md:w-3 h-2 md:h-3 rounded-full animate-bounce ${upNext?.triageLevel === "CRITICAL" ? "bg-red-500" : "bg-emerald-500"}`} /> Up Next
             </h3>
             {upNext ? (
               <div>
                  <p className="text-4xl md:text-7xl font-black font-mono tracking-tighter mb-2 md:mb-4 drop-shadow-md">{upNext.tokenId}</p>
                  <p className="text-xl md:text-3xl font-bold text-zinc-300 truncate">{upNext.name}</p>
                  {upNext.triageLevel === "CRITICAL" && <p className="text-xs md:text-lg text-red-500 font-bold uppercase tracking-widest mt-1 md:mt-2">Critical Triage</p>}
                  {upNext.triageLevel === "URGENT" && <p className="text-xs md:text-lg text-orange-500 font-bold uppercase tracking-widest mt-1 md:mt-2">Urgent Triage</p>}
               </div>
             ) : (
               <p className="text-lg md:text-2xl font-bold text-zinc-600">No one waiting.</p>
             )}
           </div>

           {/* Remaining Queue list */}
           <div className="flex-1 flex flex-col max-h-[400px] lg:max-h-full">
             <h3 className="text-sm md:text-lg font-bold uppercase tracking-widest text-zinc-500 mb-3 md:mb-4 px-2">Waiting Queue</h3>
             <div className="flex-1 overflow-y-auto relative min-h-[300px]">
               
               {/* Fade out mask for long lists */}
               <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-10" />

               <div className="space-y-3 md:space-y-4 pb-16">
                 <AnimatePresence>
                   {queueDetails.slice(1).map((p: any) => (
                     <motion.div
                       key={p.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className={`border rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between backdrop-blur-md ${p.triageLevel === "CRITICAL" ? "bg-red-500/10 border-red-500/30" : p.triageLevel === "URGENT" ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/5"}`}
                     >
                       <div className="flex flex-col">
                         <span className="text-2xl md:text-4xl font-bold font-mono text-zinc-200 drop-shadow-md">{p.tokenId}</span>
                         {p.triageLevel === "CRITICAL" && <span className="text-[9px] md:text-[11px] text-red-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">EMERGENCY</span>}
                       </div>
                       <span className="text-sm md:text-xl font-semibold text-zinc-400 truncate max-w-[50%]">{p.name}</span>
                     </motion.div>
                   ))}
                   {queueDetails.length <= 1 && (
                     <div className="p-6 md:p-10 text-center border-dashed border-[2px] border-[#27272a] rounded-2xl h-32 md:h-full flex items-center justify-center">
                       <span className="text-sm md:text-xl font-bold text-zinc-600">Queue is clear</span>
                     </div>
                   )}
                 </AnimatePresence>
               </div>

             </div>
           </div>

        </div>

      </main>
    </div>
  );
}
