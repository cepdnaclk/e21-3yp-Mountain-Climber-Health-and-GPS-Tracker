"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const next = searchParams.get("next");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const { data: isAdminData, error: adminError } = await supabase.rpc(
      "is_admin"
    );

    if (adminError) {
      console.error("Admin check error:", adminError);
    }

    const isAdmin = Boolean(isAdminData);

    setLoading(false);

    if (next) {
      router.push(next);
    } else if (isAdmin) {
      router.push("/admin");
    } else {
      router.push("/portal");
    }

    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-5xl font-black">Login to MountainSafety Portal</h1>

      <p className="mt-4 text-slate-400">
        Only verified and invited basecamp owners can log in.
      </p>

      <form
        onSubmit={login}
        className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="text-red-300">{message}</p>}

        <p className="text-slate-400">
          Need access?{" "}
          <Link href="/register" className="font-bold text-emerald-300">
            Request verified basecamp owner access
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-6 py-14">
          <p className="text-slate-400">Loading login page...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
