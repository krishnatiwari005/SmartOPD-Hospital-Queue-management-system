/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bell, MapPin, Clock, Users, CheckCircle2, RefreshCw, BellOff, Tv, ChevronRight } from "lucide-react";
import SmartNavbar from "@/components/SmartNavbar";

export default function PatientTracker() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification state
  const [notifyMinsInput, setNotifyMinsInput] = useState("10");
  const [notificationScheduled, setNotificationScheduled] = useState(false);
  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/patient/${id}`);
      if (!res.ok) { setError(true); return; }
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleScheduleNotification = async () => {
    const mins = parseInt(notifyMinsInput, 10);
    if (isNaN(mins) || mins < 1) return;

    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        alert("Please allow notifications in your browser to use this feature.");
        return;
      }
    }

    if (notifyTimer.current) clearTimeout(notifyTimer.current);

    const currentWait = data?.liveTracking?.estimatedWaitMins ?? mins;
    const delayMins = Math.max(currentWait - mins, 0);
    const delayMs = delayMins > 0 ? delayMins * 60 * 1000 : 10000;

    notifyTimer.current = setTimeout(() => {
      new Notification("SmartOPD — Your Turn is Near!", {
        body: `Token ${data?.patient?.tokenId}: Head to ${data?.doctor?.room} now. Approximately ${mins} min remaining.`,
        icon: "/favicon.ico",
        tag: "smartopd-notify",
      });
      setNotificationScheduled(false);
    }, delayMs);

    setNotificationScheduled(true);
  };

  const cancelNotification = () => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    setNotificationScheduled(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin opacity-50" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-8 text-center w-full max-w-sm">
        <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-300 mb-2">Token Expired</h2>
        <p className="text-zinc-500 text-[14px]">This token is no longer valid.</p>
      </div>
    </div>
  );

  const { patient, doctor, liveTracking } = data;
  const isCompleted = patient.status === "COMPLETED";
  const isInCabin = patient.status === "IN_CABIN";

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <SmartNavbar badge="Live Tracker" />

      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center w-full max-w-md mx-auto gap-4">

        {/* ===== COMPLETED STATE ===== */}
        <AnimatePresence mode="wait">
          {isCompleted && (
            <motion.div key="completed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full mt-16">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h1 className="text-3xl font-black tracking-tight mb-2">All Done!</h1>
              <p className="text-zinc-500">Your consultation is complete. Wish you a speedy recovery!</p>
            </motion.div>
          )}

          {/* ===== IN CABIN STATE ===== */}
          {isInCabin && !isCompleted && (
            <motion.div key="incabin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full mt-10">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500/20">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                  <Activity className="w-8 h-8 text-black" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2 text-emerald-400">Please Enter Cabin!</h1>
              <p className="text-zinc-400 mb-6">The doctor is ready for you right now.</p>
              <div className="bg-[#111113] border border-emerald-500/20 rounded-2xl p-6 text-center">
                <p className="text-[11px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Your Token</p>
                <p className="text-5xl font-black font-mono text-white">{patient.tokenId}</p>
                <p className="text-[14px] text-zinc-400 mt-2">{doctor.name} · {doctor.room}</p>
              </div>
            </motion.div>
          )}

          {/* ===== WAITING STATE ===== */}
          {!isCompleted && !isInCabin && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">

              {/* Live pill */}
              <div className="flex justify-center pt-2">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">Tracking Live</span>
                </div>
              </div>

              {/* ★ THE KEY CARD: Currently Serving vs Your Token ★ */}
              <div className="bg-[#111113] border border-[#27272a] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-[#27272a]">
                  {/* Left: Now Serving */}
                  <div className="p-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Now Serving</p>
                    <p className={`text-3xl font-black font-mono ${liveTracking.currentlyServing ? "text-emerald-400" : "text-zinc-600"}`}>
                      {liveTracking.currentlyServing ?? "---"}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${liveTracking.currentlyServing ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                    </div>
                  </div>
                  {/* Right: Your Token */}
                  <div className="p-5 text-center bg-[#0d0d0f]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Your Token</p>
                    <p className="text-3xl font-black font-mono text-white">{patient.tokenId}</p>
                    <div className="mt-2 flex justify-center">
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Waiting</span>
                    </div>
                  </div>
                </div>
                {/* Progress hint */}
                <div className="px-5 py-3 border-t border-[#1e1e22] flex items-center justify-between text-[13px]">
                  <span className="text-zinc-500 flex items-center gap-1.5"><Users className="w-4 h-4" /> {liveTracking.peopleAhead} ahead of you</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Clock className="w-4 h-4" /> ~{liveTracking.estimatedWaitMins} min wait</span>
                </div>
              </div>

              {/* ETA Big Display */}
              <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 text-center">
                <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Estimated Time to Your Turn</p>
                <div className="flex items-baseline justify-center gap-1 my-3">
                  <span className="text-7xl font-black tracking-tighter tabular-nums">
                    {liveTracking.estimatedWaitMins}
                  </span>
                  <span className="text-2xl font-bold text-zinc-500">min</span>
                </div>
                <p className="text-zinc-600 text-[12px]">
                  Based on {doctor.name}&apos;s avg: ~{doctor.currentAverageMins}m/patient
                </p>
              </div>

              {/* Doctor Card */}
              <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-white">{doctor.name}</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{doctor.department} · {doctor.room}
                  </p>
                </div>
                {liveTracking.isNext && (
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> YOU&apos;RE NEXT
                  </span>
                )}
              </div>

              {/* Queue Position List */}
              {liveTracking.queueList && liveTracking.queueList.length > 0 && (
                <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1e1e22] flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">Queue Position</p>
                    <p className="text-[12px] text-zinc-600">{liveTracking.queueList.length} in line</p>
                  </div>
                  <div className="divide-y divide-[#1e1e22]">
                    {liveTracking.queueList.slice(0, 8).map((item: any, idx: number) => (
                      <div key={idx} className={`px-4 py-3 flex items-center justify-between ${item.isYou ? "bg-emerald-500/5 border-l-2 border-emerald-500" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-zinc-600 w-5 font-mono">{idx + 1}.</span>
                          <span className={`font-mono font-bold text-[15px] ${item.isYou ? "text-emerald-400" : "text-zinc-200"}`}>
                            {item.tokenId}
                          </span>
                          {item.isYou && (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">YOU</span>
                          )}
                        </div>
                        <span className="text-[12px] text-zinc-500">+{idx * doctor.currentAverageMins}m</span>
                      </div>
                    ))}
                    {liveTracking.queueList.length > 8 && (
                      <div className="px-4 py-3 text-center text-[12px] text-zinc-600">
                        +{liveTracking.queueList.length - 8} more in queue
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notification Section */}
              <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
                <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  Notify Me Before My Turn
                </p>

                {!notificationScheduled ? (
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#27272a] rounded-lg px-3 flex-1">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={notifyMinsInput}
                        onChange={(e) => setNotifyMinsInput(e.target.value)}
                        className="w-full bg-transparent text-lg font-bold text-white focus:outline-none py-2"
                      />
                      <span className="text-zinc-500 text-sm font-semibold shrink-0">min before</span>
                    </div>
                    <button
                      onClick={handleScheduleNotification}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5 active:scale-95"
                    >
                      <Bell className="w-4 h-4" /> Set
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Bell className="w-4 h-4" />
                      Alert set for {notifyMinsInput} min before your turn
                    </div>
                    <button onClick={cancelNotification} className="text-zinc-500 hover:text-red-400 transition-colors ml-3">
                      <BellOff className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-zinc-600 mt-2">You can leave the hospital and we&apos;ll alert you when it&apos;s almost time.</p>
              </div>

              {/* Link to TV Queue Board */}
              <a
                href={`/display/${patient.doctorId}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 bg-[#111113] border border-[#27272a] hover:bg-[#18181b] text-zinc-400 hover:text-white py-3 rounded-xl font-semibold text-[13px] transition-colors"
              >
                <Tv className="w-4 h-4" /> View OPD Queue Display
              </a>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
