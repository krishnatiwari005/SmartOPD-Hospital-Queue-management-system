"use client";

import Link from "next/link";
import { Activity, Home, LayoutDashboard, User } from "lucide-react";

interface SmartNavbarProps {
  active?: "reception" | "admin" | "doctor" | "display" | "patient";
  badge?: string; // optional badge like the doctor name
  extra?: React.ReactNode; // extra right-side elements
}

export default function SmartNavbar({ active, badge, extra }: SmartNavbarProps) {
  const links = [
    { href: "/", label: "Reception Desk", key: "reception", icon: Home },
    { href: "/doctor/register", label: "Doctor Sign Up", key: "doctor-reg", icon: User },
    { href: "/doctor/login", label: "Doctor Portal", key: "doctor", icon: LayoutDashboard },
  ];

  return (
    <nav className="border-b border-[#1e1e22] px-6 py-4 flex items-center justify-between bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-50">
      {/* Logo + Brand */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Activity className="w-5 h-5 text-emerald-500" />
          <span className="text-[16px] font-bold tracking-tight text-white">SmartOPD</span>
        </Link>

        {badge && (
          <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded tracking-wider uppercase border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>

      {/* Center Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {links.map(({ href, label, key, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              active === key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-white hover:bg-[#18181b]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Right side extras */}
      <div className="flex items-center gap-3">
        {extra}
      </div>
    </nav>
  );
}
