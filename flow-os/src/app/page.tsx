/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Plus, FileText, Download, ArrowUpRight, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import SmartNavbar from "@/components/SmartNavbar";
import LaserFlow from "@/components/LaserFlow";

export default function ReceptionDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<{
    id: string;
    token: string;
    patientName: string;
    patientPhone: string;
    docName: string;
    department: string;
    room: string;
    date: string;
  } | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // Check if app is already running in standalone/installed mode
    if (typeof window !== "undefined") {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isiOSStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isDisplayStandalone || isiOSStandalone);
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.error('Service worker registration failed:', err));
    }

    // Listen for the PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    fetch("/api/system")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDoctors(data.doctors);
          if (data.doctors.length > 0) setSelectedDoctor(data.doctors[0].id);
        }
      });
  }, []);

  const handleGenerateParcha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !selectedDoctor) return;

    setLoading(true);
    try {
      const res = await fetch("/api/reception/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, doctorId: selectedDoctor, symptoms }),
      });
      const data = await res.json();
      if (data.success) {
        const doc = doctors.find(d => d.id === selectedDoctor);
        const now = new Date();
        setTicket({
          id: data.patientId,
          token: data.tokenId,
          patientName: name,
          patientPhone: phone,
          docName: doc?.name || "Unknown",
          department: doc?.department || "",
          room: doc?.room || "",
          date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        });
        setName("");
        setPhone("");
        setSymptoms("");
      } else {
        alert(data.error);
      }
    } catch {
      alert("Error generating parcha");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !ticket) return;
    setDownloading(true);
    try {
      const imgData = await toPng(ticketRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 3, 
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [90, 150],
      });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = 90;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SmartOPD-Parcha-${ticket.token}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Something went wrong while generating the receipt.");
    } finally {
      setDownloading(false);
    }
  };

  const trackerUrl = typeof window !== "undefined" && ticket
    ? `${window.location.origin}/p/${ticket.id}`
    : "";

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      alert("To install this app, tap your browser's menu (⋮ or ⬆️) and select 'Add to Home Screen' or 'Install App'.");
    }
  };

  return (
    <div className="min-h-screen relative text-zinc-100 flex flex-col overflow-hidden">
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
        <SmartNavbar active="reception" badge="Reception Desk" />

      <main className="flex-1 flex flex-col lg:flex-row px-4 md:px-6 py-6 md:py-8 gap-8 max-w-6xl mx-auto w-full">
        
        {/* Left Side: Form */}
        <div className="w-full lg:max-w-[440px] relative group">
          
          <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 via-teal-500/5 to-transparent rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-70 transition duration-1000 pointer-events-none"></div>

          <div className="relative bg-[#09090b]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50">
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex-shrink-0">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white mb-1">AI Triage Node</h1>
                  <p className="text-zinc-500 text-[12px] font-medium uppercase tracking-widest">Intake & Auto-Sorting</p>
                </div>
              </div>

              {!isStandalone && (
                <button 
                  onClick={handleInstallClick}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-lg"
                  title="Install SmartOPD"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleGenerateParcha} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 pl-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 hover:border-white/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 pl-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 hover:border-white/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 pl-1">
                  Assign Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={doctors.length === 0}
                  className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 hover:border-white/10 transition-all font-medium appearance-none cursor-pointer"
                >
                  {doctors.length === 0 ? <option>Loading network...</option> : null}
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.department} (Queue: {doc.queueLength})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative group/ai mt-6">
                <div className="flex justify-between mb-3 px-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    Machine Learning NLP Input
                  </label>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Activity className="w-3 h-3" /> Live Triage Sync
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/10 rounded-xl blur opacity-40 group-focus-within/ai:opacity-100 transition duration-500 pointer-events-none"></div>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms for AI to categorize priority..."
                    required
                    rows={3}
                    className="relative w-full px-5 py-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-sm text-white placeholder:text-emerald-500/40 focus:outline-none focus:border-emerald-400 transition-all resize-none shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] font-medium leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden group/btn bg-white text-black py-4 rounded-xl font-black text-[14px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                {loading ? (
                  <><Activity className="w-5 h-5 animate-spin" /> Processing AI Logic...</>
                ) : (
                  <><Plus className="w-5 h-5" /> Execute & Generate</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Digital Parcha */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <AnimatePresence mode="wait">
            {ticket ? (
              <motion.div
                key="ticket"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex flex-col items-center gap-4 w-full max-w-sm"
              >
                {/* Printable white ticket */}
                <div ref={ticketRef} className="bg-white text-black w-full rounded-2xl shadow-2xl overflow-hidden">
                  {/* Header Band */}
                  <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded overflow-hidden">
                         <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                       </div>
                      <span className="font-black text-lg">SmartOPD</span>
                    </div>
                    <span className="text-[11px] opacity-60 uppercase tracking-widest">Digital Parcha</span>
                  </div>

                  {/* Token Big */}
                  <div className="text-center py-6 border-b-2 border-dashed border-gray-200">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Your Token</p>
                    <h1 className="text-6xl font-black tracking-tighter">{ticket.token}</h1>
                  </div>

                  {/* Info Section */}
                  <div className="px-6 py-4 grid grid-cols-2 gap-3 text-[13px] border-b-2 border-dashed border-gray-200">
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Patient Name</p>
                      <p className="font-bold text-[14px]">{ticket.patientName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Phone</p>
                      <p className="font-bold text-[14px]">{ticket.patientPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Assigned Doctor</p>
                      <p className="font-bold">{ticket.docName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Department</p>
                      <p className="font-bold">{ticket.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Room</p>
                      <p className="font-bold">{ticket.room}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold mb-0.5">Date</p>
                      <p className="font-bold text-[11px]">{ticket.date}</p>
                    </div>
                  </div>

                  {/* QR + Instructions */}
                  <div className="px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Scan to Track Live</p>
                      <QRCodeCanvas
                        value={trackerUrl || `https://smartopd.in/p/${ticket.id}`}
                        size={90}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-[11px] text-gray-400 text-right max-w-[120px]">
                      Scan QR code or visit the SmartOPD patient link for real-time updates without waiting in queue.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? "Generating PDF..." : "Download Parcha"}
                  </button>
                  <a
                    href={`/p/${ticket.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-white py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    Live Tracker <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
                <button
                  onClick={() => setTicket(null)}
                  className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  New Patient ↩
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex flex-col items-center justify-center border border-white/5 bg-black/20 backdrop-blur-md rounded-[2.5rem] p-12 w-full h-[500px] overflow-hidden lg:ml-8"
              >
                {/* Holographic Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                
                {/* Radial gradient mask for grid */}
                <div className="absolute inset-0 bg-black/40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-emerald-500/5 rounded-full flex items-center justify-center border-2 border-emerald-500/20 mb-8 relative shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-30 duration-3000"></div>
                    <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-ping opacity-20 delay-300 duration-2000"></div>
                    <FileText className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-2xl text-white mb-3 font-mono tracking-widest drop-shadow-md">NODE STANDBY</h3>
                  <p className="text-[15px] font-medium text-zinc-400 max-w-[280px] leading-relaxed">
                    Awaiting symptom input to generate AI-triaged digital parcha.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
}
