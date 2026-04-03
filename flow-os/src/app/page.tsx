/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Plus, FileText, Download, ArrowUpRight, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SmartNavbar from "@/components/SmartNavbar";
import LaserFlow from "@/components/LaserFlow";

export default function ReceptionDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
        body: JSON.stringify({ name, phone, doctorId: selectedDoctor }),
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
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
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
    } finally {
      setDownloading(false);
    }
  };

  const trackerUrl = typeof window !== "undefined" && ticket
    ? `${window.location.origin}/p/${ticket.id}`
    : "";

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

      <div className="relative z-10 flex flex-col min-h-screen">
        <SmartNavbar active="reception" badge="Reception Desk" />

      <main className="flex-1 flex flex-col lg:flex-row px-6 py-8 gap-8 max-w-6xl mx-auto w-full">
        
        {/* Left Side: Form */}
        <div className="w-full lg:max-w-md">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Patient Registration</h1>
          <p className="text-zinc-500 text-[14px] mb-8">Generate a digital parcha and assign a token instantly.</p>

          <form onSubmit={handleGenerateParcha} className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-xl">
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full px-4 py-3 bg-[#0d0d0f] border border-[#27272a] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 hover:border-zinc-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-4 py-3 bg-[#0d0d0f] border border-[#27272a] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 hover:border-zinc-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Assign Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={doctors.length === 0}
                  className="w-full px-4 py-3 bg-[#0d0d0f] border border-[#27272a] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 hover:border-zinc-700 transition-colors appearance-none"
                >
                  {doctors.length === 0 ? <option>Loading doctors...</option> : null}
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.department} (Queue: {doc.queueLength})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-[14px] mt-4"
              >
                {loading ? "Generating..." : <><Plus className="w-4 h-4" /> Generate Digital Parcha</>}
              </button>
            </div>
          </form>
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
                      <Activity className="w-5 h-5" />
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
                      <QRCodeSVG
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
                className="text-center text-zinc-600 flex flex-col items-center border border-dashed border-[#27272a] rounded-2xl p-16 w-full"
              >
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium text-zinc-500">Parcha will appear here</p>
                <p className="text-sm opacity-60 mt-1">Fill the form and click Generate to create a digital parcha.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
}
