"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Modules", href: "#modules" },
  { label: "How it works", href: "#workflow" },
  { label: "For every role", href: "#roles" },
];

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hasSurface = scrolled || menuOpen;

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200 ${hasSurface ? "border-slate-200 bg-white" : "border-transparent bg-transparent"}`}>
      <div className="mx-auto flex h-[62px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] focus-visible:ring-offset-2" aria-label="Prodisenyo ProBuild home">
          <Image src="/prodisenyo-building-mark.png" alt="" width={38} height={34} className={`h-8 w-9 object-contain transition ${hasSurface ? "" : "brightness-0 invert"}`} priority />
          <span className="leading-tight">
            <span className={`block text-[15px] font-bold tracking-[-0.03em] transition-colors ${hasSurface ? "text-[#076966]" : "text-white"}`}>Prodisenyo ProBuild</span>
            <span className={`block text-[9px] font-medium uppercase tracking-[0.16em] transition-colors ${hasSurface ? "text-[#3e8a87]" : "text-teal-50/70"}`}>Construction ERP</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className={`text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] ${hasSurface ? "text-slate-600 hover:text-[#076d69]" : "text-teal-50/85 hover:text-white"}`}>{item.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href="/auth/login?switch=1" className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] ${hasSurface ? "border-[#076d69]/35 bg-white text-[#076966] hover:bg-teal-50" : "border-white/60 bg-transparent text-white hover:bg-white/10"}`}>Sign In</Link>
          <Link href="/auth/login?switch=1" className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] ${hasSurface ? "bg-[#076d69] text-white hover:bg-[#055f5b]" : "bg-white text-[#076966] hover:bg-teal-50"}`}>Open ProBuild</Link>
        </div>

        <button type="button" aria-expanded={menuOpen} aria-controls="landing-mobile-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((current) => !current)} className={`rounded-lg border p-2 transition-colors lg:hidden ${hasSurface ? "border-slate-200 text-[#076966] hover:bg-teal-50" : "border-white/50 text-white hover:bg-white/10"}`}>
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen ? (
        <div id="landing-mobile-nav" className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <nav className="mx-auto flex max-w-[1320px] flex-col gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#076966]">{item.label}</a>)}
            <Link href="/auth/login?switch=1" className="mt-2 rounded-lg bg-[#076d69] px-4 py-2.5 text-center text-sm font-semibold text-white">Sign In</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
