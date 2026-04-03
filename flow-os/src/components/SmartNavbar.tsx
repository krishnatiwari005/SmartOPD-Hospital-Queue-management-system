"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, LayoutDashboard, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface SmartNavbarProps {
  active?: "reception" | "admin" | "doctor" | "display" | "patient";
  badge?: string; 
  extra?: React.ReactNode; 
}

export default function SmartNavbar({ active, badge, extra }: SmartNavbarProps) {
  const pathname = usePathname();
  
  const links = [
    { href: "/", label: "Reception", key: "reception", icon: Home },
    { href: "/doctor/register", label: "Sign Up", key: "doctor-reg", icon: UserPlus },
    { href: "/doctor/login", label: "Doctor", key: "doctor", icon: LayoutDashboard },
  ];

  return (
    <>
      {/* 🟢 TOP NAV (Branding & Extra) */}
      <nav className="border-b border-[#1e1e22] px-4 md:px-6 py-4 flex items-center justify-between bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#27272a] shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-black flex items-center justify-center">
              <img src="/logo.png" alt="SmartOPD" className="w-full h-full object-cover" />
            </div>
            <span className="text-[17px] font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">SmartOPD</span>
          </Link>

          {badge && (
            <span className="hidden sm:inline-flex text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full tracking-widest uppercase border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              {badge}
            </span>
          )}
        </div>

        {/* Desktop Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1 bg-[#111113] p-1 rounded-xl border border-[#27272a]">
          {links.map(({ href, label, key, icon: Icon }) => {
            const isActive = active === key || pathname === href;
            return (
              <Link
                key={key}
                href={href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                  isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav"
                    className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side extras */}
        <div className="flex items-center gap-3">
          {extra}
        </div>
      </nav>

      {/* 📱 MOBILE BOTTOM NAV (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pointer-events-none">
        <div className="flex items-center justify-around bg-[#111113]/90 backdrop-blur-2xl border border-[#27272a] p-2 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl transition-all relative ${
                  isActive ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav"
                    className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
