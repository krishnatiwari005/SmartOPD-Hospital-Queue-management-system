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
    const q = query.toLowerCase().trim();

    // Helper to check if any keyword in an array is present in the query
    const matches = (keywords: string[]) => keywords.some(k => q.includes(k));

    // 1. GREETINGS
    if (matches(["hi", "hello", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening"])) {
      return "Hello! I'm your SmartOPD Assistant. I can help you check your wait time, find the pharmacy, or explain how our AI triage works. What's on your mind?";
    }

    // 2. LIVE STATUS & WAIT TIME (Context Aware)
    if (matches(["status", "turn", "wait", "time", "queue", "ahead", "position", "token"])) {
      if (patientId) {
        try {
          const res = await fetch(`/api/patient/${patientId}`);
          const json = await res.json();
          if (json.success) {
            const { liveTracking, doctor, patient } = json.data;
            return `Hi ${patient.name}! You are currently at position #${liveTracking.peopleAhead + 1} for ${doctor.name}. Our ML predicts your turn will come in approximately ${liveTracking.estimatedWaitMins} minutes.`;
          }
        } catch (e) {
          console.error("Chatbot fetching status error:", e);
        }
      }
      
      // Fallback if no patientId or fetch fails, use Insights if available
      if (insights) {
        return `The current system-wide average wait time is ${insights.avgWaitTimeMins} minutes. ${insights.todayPatientsCount > 0 ? `We have served ${insights.todayPatientsCount} patients today.` : ""}`;
      }
      
      return "I can check your specific wait time if you are on your live tracking page. Generally, our wait times are between 10-20 minutes depending on the department.";
    }

    // 3. HOSPITAL NAVIGATION
    if (matches(["pharmacy", "medicine", "drug", "chemist", "medical store"])) {
      return "The pharmacy is on the Ground Floor, near the exit. It operates 24/7 for all patients.";
    }
    if (matches(["room", "cabin", "where is doc", "cabin", "hall", "floor"])) {
      return "Most consultation rooms (Cabins) are on the 1st Floor. Your specific cabin number is printed on your digital receipt (Parcha).";
    }
    if (matches(["lab", "report", "test", "blood", "pathology", "collect"])) {
      return "The Pathology Lab is on the 1st Floor (East Wing). Reports are usually ready within 4-6 hours for most tests.";
    }
    if (matches(["washroom", "toilet", "restroom", "water"])) {
      return "Restrooms and drinking water stations are available at the end of every corridor on each floor.";
    }

    // 4. SMARTOPD / AI PROCEDURES
    if (matches(["triage", "priority", "critical", "urgent", "how works", "ai", "machine learning"])) {
      return "Our AI Assistant analyzes symptoms to prioritize cases. Critical/Emergency cases are moved to the front of the queue to ensure safety. This is why some tokens might move faster than others.";
    }
    if (matches(["skip", "missed", "not there", "absent"])) {
      return "If you aren't present when called, you are 'skipped' and moved to the end of the current queue. You won't lose your registration, but you'll have to wait for the next cycle.";
    }

    // 5. HELP / EMERGENCY
    if (matches(["help", "emergency", "serious", "pain", "doctor now", "dying", "accident"])) {
      return "🔴 EMERGENCY: If you have severe pain or a life-threatening emergency, please DO NOT WAIT. Inform the nearest staff member IMMEDIATELY or go to the Emergency Wing on the Ground Floor!";
    }

    // 6. ADVICE / SYSTEM INFO
    if (matches(["who are you", "what is this", "smartopd", "bot"])) {
      return "I'm the SmartOPD Digital Assistant. I help patients navigate the hospital, track their tokens, and understand our AI-driven queue system for a better experience.";
    }
    if (matches(["thank", "thanks", "ok", "okay", "understand", "cool"])) {
      return "You're welcome! Please let me know if you have any other questions. Stay healthy!";
    }

    return "I'm sorry, I didn't quite catch that. You can ask me things like: 'Where is the pharmacy?', 'What is my wait time?', 'How does triage work?', or 'What should I do if I missed my turn?'";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    
    setIsTyping(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, patientId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: "bot", text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: "I'm having trouble thinking clearly. Please try again in a moment." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: "Something went wrong. Please check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { text: "My Wait Time / Kab ayega?", icon: Clock },
    { text: "Pharmacy / Dawai?", icon: MapPin },
    { text: "Triage / Kyu der ho rhi?", icon: Info },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
        )}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-x-4 bottom-32 top-6 md:top-auto md:bottom-24 md:right-6 md:left-auto md:w-[400px] md:h-[600px] z-[999] bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
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

      <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-[1000]">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative transition-all duration-500 backdrop-blur-2xl border-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        >
          {/* Glowing Pulse Rings */}
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse" />

          <div className="relative z-10">
            <Bot className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full shadow-lg"></div>
          </div>


        </motion.button>
      </div>
    </>
  );
}
