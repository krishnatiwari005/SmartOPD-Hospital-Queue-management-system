/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Activity, Monitor } from "lucide-react";

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

  const { doctor, inCabin, upNext, queueDetails } = data;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Banner */}
      <header className="px-10 py-6 flex items-center justify-between border-b-[2px] border-[#27272a] bg-[#09090b]">
         <div className="flex items-center gap-4">
            <Activity className="w-10 h-10 text-emerald-500" />
            <h1 className="text-3xl font-black tracking-tight">SmartOPD</h1>
         </div>
         <div className="text-right">
            <h2 className="text-4xl font-black">{doctor.name}</h2>
            <p className="text-xl text-zinc-400 font-bold uppercase tracking-widest mt-1">{doctor.department} · {doctor.room}</p>
         </div>
      </header>

      <main className="flex-1 flex w-full h-[calc(100vh-120px)]">
        
        {/* Left: NOW SERVING (Big Focus) */}
        <div className="w-[65%] border-r-[2px] border-[#27272a] bg-gradient-to-b from-[#111113] to-black flex flex-col items-center justify-center p-12 relative overflow-hidden">
           
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] blur-[200px] rounded-full opacity-20 pointer-events-none ${inCabin ? 'bg-emerald-500' : 'bg-transparent'}`} />

           <div className="relative z-10 w-full text-center">
             <h3 className="text-3xl font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Inside Cabin</h3>
             
             <AnimatePresence mode="wait">
               {inCabin ? (
                 <motion.div
                   key={inCabin.id}
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, y: -50 }}
                   className="flex flex-col items-center"
                 >
                   <div className="bg-emerald-500/10 border-4 border-emerald-500/30 rounded-full px-16 py-6 inline-flex items-center gap-6 mb-12 shadow-[0_0_100px_rgba(16,185,129,0.15)]">
                     <div className="w-6 h-6 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[120px] leading-none font-black font-mono tracking-tighter text-emerald-400">
                       {inCabin.tokenId}
                     </span>
                   </div>
                   <h2 className="text-7xl font-bold tracking-tight w-full truncate px-10">
                     {inCabin.name}
                   </h2>
                 </motion.div>
               ) : (
                 <motion.div
                   key="empty"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                 >
                   <Monitor className="w-32 h-32 text-zinc-800 mx-auto mb-8" />
                   <h2 className="text-5xl font-bold text-zinc-600">PLEASE WAIT</h2>
                   <p className="text-2xl text-zinc-500 mt-4">Cabin is empty.</p>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Right: UP NEXT and Queue */}
        <div className="w-[35%] bg-[#09090b] flex flex-col p-10">
           
           {/* Up Next Showcase */}
           <div className="mb-10 min-h-[250px] bg-[#111113] border-[2px] border-[#27272a] rounded-3xl p-8 flex flex-col justify-center">
             <h3 className="text-xl font-bold uppercase tracking-[0.2em] text-emerald-500 mb-6 flex items-center gap-3">
               <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" /> Up Next
             </h3>
             {upNext ? (
               <div>
                  <p className="text-7xl font-black font-mono tracking-tighter mb-4">{upNext.tokenId}</p>
                  <p className="text-3xl font-bold text-zinc-400 truncate">{upNext.name}</p>
               </div>
             ) : (
               <p className="text-2xl font-bold text-zinc-600">No one waiting.</p>
             )}
           </div>

           {/* Remaining Queue list */}
           <div className="flex-1 flex flex-col">
             <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-500 mb-4 px-2">Waiting Queue</h3>
             <div className="flex-1 overflow-hidden relative">
               
               {/* Fade out mask for long lists */}
               <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-10" />

               <div className="space-y-4">
                 <AnimatePresence>
                   {queueDetails.slice(1).map((p: any) => (
                     <motion.div
                       key={p.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="bg-[#111113] border border-[#1e1e22] rounded-2xl p-5 flex items-center justify-between"
                     >
                       <span className="text-4xl font-bold font-mono text-zinc-300">{p.tokenId}</span>
                       <span className="text-xl font-semibold text-zinc-500 truncate max-w-[50%]">{p.name}</span>
                     </motion.div>
                   ))}
                   {queueDetails.length <= 1 && (
                     <div className="p-10 text-center border-dashed border-[2px] border-[#27272a] rounded-2xl h-full flex items-center justify-center">
                       <span className="text-xl font-bold text-zinc-600">Queue is clear</span>
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
