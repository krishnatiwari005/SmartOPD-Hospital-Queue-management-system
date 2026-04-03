"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, Send, X, User, Sparkles, MapPin, Clock, Info } from "lucide-react";
import { useParams } from "next/navigation";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I am your SmartOPD Assistant. How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const patientId = params.id as string;

  useEffect(() => {
    fetch("/api/ai/insights")
      .then(res => res.json())
      .then(data => {
        if (data.success) setInsights(data.insights);
      });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getSmartResponse = async (query: string): Promise<string> => {
    const q = query.toLowerCase();

    // 1. Context-Aware Queries (Needs Patient ID)
    if (patientId && (q.includes("my status") || q.includes("my turn") || q.includes("wait time"))) {
      try {
        const res = await fetch(`/api/patient/${patientId}`);
        const json = await res.json();
        if (json.success) {
          const { liveTracking, doctor, patient } = json.data;
          return `Hi ${patient.name}, you are currently at position #${liveTracking.peopleAhead + 1} for ${doctor.name}. Estimated wait is around ${liveTracking.estimatedWaitMins} minutes.`;
        }
      } catch {
        return "I'm having trouble fetching your live status right now, but you can see it on your dashboard!";
      }
    }

    // 2. Learned Hospital Insights (Self-Learning Logic)
    if (q.includes("busy") || q.includes("crowd") || q.includes("how is hospital") || q.includes("traffic")) {
      if (!insights) return "The hospital is operating normally today. Most departments have a standard wait time of 10-15 minutes.";
      return `Today, we have served ${insights.todayPatientsCount} patients so far. The busiest department is ${insights.busiestDepartment}, while ${insights.fastestDepartment} is moving the fastest!`;
    }

    if (q.includes("fast") || q.includes("quick")) {
      if (!insights) return "Wait times vary by department, but we aim for under 15 minutes per consultation.";
      return `Currently, ${insights.fastestDepartment} is the most efficient department today. ${insights.efficiencyGain > 0 ? `Overall efficiency is up by ${insights.efficiencyGain}%!` : ""}`;
    }

    if (q.includes("average wait") || q.includes("long")) {
      if (!insights) return "Average wait time is roughly 10-15 minutes across all departments.";
      return `The current average consultation duration across all departments is ${insights.avgWaitTimeMins} minutes today.`;
    }

    // 3. Hospital General FAQ Logic
    if (q.includes("pharmacy") || q.includes("medicine")) return "The pharmacy is located on the Ground Floor, right next to the main exit. It's open 24/7.";
    if (q.includes("report") || q.includes("lab")) return "Laboratory reports can be collected from the Pathology department on the 1st Floor between 9 AM and 5 PM.";
    if (q.includes("triage") || q.includes("priority")) return "Our AI analyzes symptoms to prioritize critical cases. Critical patients are seen first to ensure safety, even if they arrived later.";
    if (q.includes("missed") || q.includes("skip")) return "If you miss your turn, our 'Smart Skip' logic moves you to the end of the queue rather than deleting you. You'll get another chance soon!";
    if (q.includes("room")) return "Most consultation rooms are on the 1st and 2nd floors. Check your digital parcha for your specific room number.";
    if (q.includes("emergency") || q.includes("help")) return "If this is a medical emergency, please alert the nearest staff member immediately or head to the Emergency Room at the East Wing.";

    // 3. Greeting & Generic
    if (q.includes("hello") || q.includes("hi")) return "Hello! I'm here to answer any questions about your visit or SmartOPD procedures.";
    if (q.includes("thank")) return "You're very welcome! I'm here if you need anything else.";

    return "I'm sorry, I didn't quite understand that. You can ask about your 'wait time', 'pharmacy location', 'triage logic', or 'collecting reports'.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    
    setIsTyping(true);
    // Mimic thinking time
    setTimeout(async () => {
      const botResponse = await getSmartResponse(userMsg);
      setMessages(prev => [...prev, { role: "bot", text: botResponse }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1000);
  };

  const suggestions = [
    { text: "My Wait Time", icon: Clock },
    { text: "Pharmacy Location", icon: MapPin },
    { text: "Triage Logic", icon: Info },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[550px] bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-white">SmartOPD AI</h3>
                  <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest leading-none">Assistant Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[13.5px] leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-emerald-500 text-black font-bold rounded-tr-none" 
                      : "bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length < 4 && (
              <div className="px-5 py-2 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                        setInput(s.text);
                        // Delay execution slightly for better UX
                        setTimeout(handleSend, 100);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all font-bold uppercase tracking-wider"
                  >
                    <s.icon className="w-3.5 h-3.5" /> {s.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center bg-[#111113] border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/40">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                  <button 
                    onClick={handleSend}
                    className="p-3 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative transition-all duration-500 ${
          isOpen ? "bg-white text-black rotate-90" : "bg-emerald-500 text-black"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
              <Bot className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-ping"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
            <div className="absolute -top-10 right-0 bg-[#09090b] border border-white/10 text-[10px] text-zinc-300 py-1.5 px-3 rounded-xl whitespace-nowrap shadow-xl pointer-events-none uppercase font-black tracking-widest animate-bounce">
                Ask Hub <Sparkles className="inline-block w-3 h-3 ml-1 text-emerald-400" />
            </div>
        )}
      </motion.button>
    </div>
  );
}
