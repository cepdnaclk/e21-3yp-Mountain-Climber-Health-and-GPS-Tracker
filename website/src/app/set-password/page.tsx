"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function setPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (password.length < 8) {
      setLoading(false);
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setLoading(false);
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-4xl font-black">Set your portal password</h1>

      <p className="mt-4 text-slate-400">
        Use this page after clicking the invitation email from MountainSafety.
      </p>

      <form onSubmit={setPassword} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <input name="password" type="password" required placeholder="New password" className="w-full rounded-xl border border-white/15 px-4 py-3" />
        <input name="confirm" type="password" required placeholder="Confirm password" className="w-full rounded-xl border border-white/15 px-4 py-3" />

        <button disabled={loading} className="w-full rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-50">
          {loading ? "Saving..." : "Set Password"}
        </button>

        {message && <p className="text-red-300">{message}</p>}
      </form>
    </main>
  );
}