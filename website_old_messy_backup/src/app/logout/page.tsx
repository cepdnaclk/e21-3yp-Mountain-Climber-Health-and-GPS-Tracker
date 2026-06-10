"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LogoutPage() {
  const supabase = createSupabaseBrowserClient();
  const [message, setMessage] = useState("Signing out...");

  useEffect(() => {
    async function logout() {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("Logout failed. Please try again.");
        console.error("Logout error:", error);
        return;
      }

      setMessage("Logged out successfully. Redirecting...");
      window.location.href = "/";
    }

    logout();
  }, [supabase.auth]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            Logout
          </p>

          <h1 className="mt-4 text-4xl font-bold">Signing out</h1>

          <p className="mt-6 text-slate-300">{message}</p>
        </section>
      </main>

      <Footer />
    </>
  );
}