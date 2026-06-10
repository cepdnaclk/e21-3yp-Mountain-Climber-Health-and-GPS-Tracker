"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");

    if (password !== confirmPassword) {
      setLoading(false);
      setSuccess(false);
      setMessage("Passwords do not match.");
      return;
    }

    const body = {
      full_name: formData.get("full_name"),
      organization_name: formData.get("organization_name"),
      email: formData.get("email"),
      password,
      phone: formData.get("phone"),
      location: formData.get("location"),
      expected_device_count: formData.get("expected_device_count"),
      reason: formData.get("reason"),
    };

    try {
      const response = await fetch("/api/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess(true);
      setMessage(data.message);
      form.reset();
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while registering."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Verified basecamp owner registration
      </p>

      <h1 className="mt-3 text-4xl font-black">
        Create a Basecamp Owner Account
      </h1>

      <p className="mt-4 text-slate-400">
        Create your account with email and password. Your account will remain
        pending until the MountainSafety team verifies your basecamp request.
      </p>

      <form
        onSubmit={submitRequest}
        className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <input
          name="full_name"
          required
          placeholder="Full name"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="organization_name"
          required
          placeholder="Organization / basecamp name"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Create password"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="confirm_password"
          type="password"
          required
          minLength={8}
          placeholder="Confirm password"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="phone"
          placeholder="Phone number"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="location"
          required
          placeholder="Basecamp location"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <input
          name="expected_device_count"
          type="number"
          min="1"
          defaultValue="1"
          placeholder="Expected number of devices"
          className="w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <textarea
          name="reason"
          required
          placeholder="Why do you need access to MountainSafety?"
          className="min-h-32 w-full rounded-xl border border-white/15 px-4 py-3"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Pending Account"}
        </button>

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 ${
              success
                ? "border-emerald-400 text-emerald-300"
                : "border-red-400 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <p className="text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-emerald-300">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}