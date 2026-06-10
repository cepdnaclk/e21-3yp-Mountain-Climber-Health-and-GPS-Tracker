"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Architecture", href: "/architecture" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Packages", href: "/packages" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const portalLinks = [
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Portal", href: "/portal" },
  { label: "Logout", href: "/logout" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-white sm:px-6">
        <Link href="/" onClick={closeMenu} className="group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-black text-slate-950">
              MS
            </div>

            <div>
              <p className="text-sm font-bold leading-4 sm:text-base">
                MountainSafety
              </p>
              <p className="text-xs text-slate-400">LoRa Rescue System</p>
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-5 text-sm text-slate-300 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}

          <Link href="/login" className="hover:text-white">
            Login
          </Link>

          <Link href="/register" className="hover:text-white">
            Register
          </Link>

          <Link
            href="/portal"
            className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Portal
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="text-2xl leading-none">{isOpen ? "×" : "☰"}</span>
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-5 text-white lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Website
              </p>

              <div className="grid gap-2">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  Home
                </Link>

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Portal
              </p>

              <div className="grid gap-2">
                {portalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={
                      link.href === "/portal"
                        ? "rounded-xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-slate-950"
                        : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}