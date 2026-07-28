"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./cart-context";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { totalItems } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchUserRole = async (currentUser: User) => {
      const { data } = await supabase.from("users").select("role").eq("id", currentUser.id).single();
      setRole(data?.role || "customer");
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchUserRole(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user);
      else setRole(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, supabase]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const customerLinks = [
    { href: "/products", label: "🏪 Products" },
    { href: "/orders", label: "📦 Orders" },
    { href: "/my-devices", label: "📡 My Devices" },
    { href: "/downloads", label: "⬇️ Downloads" },
    { href: "/register", label: "🔑 Register Device" },
  ];

  const publicLinks = [
    { href: "/products", label: "🏪 Products" },
  ];

  const navLinks = user && role === "customer" ? customerLinks : publicLinks;

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <Image src="/logo.png" alt="Summit Gear" width={120} height={40} className="navbar-logo-img" style={{ width: "auto", height: "34px" }} priority />
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="navbar-link">
              {/* Strip emoji prefix for desktop */}
              {l.label.replace(/^[\p{Emoji}\s]+/u, "")}
            </Link>
          ))}

          {user && role === "admin" && (
            <Link href="/admin" className="navbar-admin-btn">Admin Panel</Link>
          )}

          <Link href="/cart" className="navbar-link navbar-cart">
            🛒 {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {user ? (
            <button onClick={handleLogout} className="navbar-btn-logout">Log Out</button>
          ) : (
            <Link href="/login" className="navbar-btn-login">Log In</Link>
          )}
        </div>

        {/* Mobile right side */}
        <div className="mobile-right">
          <Link href="/cart" className="navbar-link navbar-cart" style={{ fontSize: "1.2rem" }}>
            🛒 {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              // X icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              // Hamburger icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel — slides down from the navbar */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="mobile-menu-link">
              {l.label}
            </Link>
          ))}

          {user && role === "admin" && (
            <Link href="/admin" className="mobile-menu-link mobile-menu-admin">
              🛡️ Admin Panel
            </Link>
          )}

          <div className="mobile-menu-divider" />

          {user ? (
            <button onClick={handleLogout} className="mobile-menu-logout">
              🚪 Log Out
            </button>
          ) : (
            <Link href="/login" className="mobile-menu-link">
              Log In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
