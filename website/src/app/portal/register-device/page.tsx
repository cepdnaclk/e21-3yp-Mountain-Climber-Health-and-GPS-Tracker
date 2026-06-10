"use client";

import { useState } from "react";

export default function RegisterDevicePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function claimDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/device/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_uid: formData.get("device_uid"),
        claim_code: formData.get("claim_code"),
      }),
    });

    const data = await response.json();

    setLoading(false);
    setMessage(data.message || "Done.");
    setSuccess(Boolean(data.ok));

    if (data.ok) {
      form.reset();
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-4xl font-black">Register Device</h1>
      <p className="mt-4 text-slate-400">
        Enter the Device UID and Claim Code printed on the product label.
      </p>

      <form onSubmit={claimDevice} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <input name="device_uid" required placeholder="MCS-CL-2026-0001" className="w-full rounded-xl border border-white/15 px-4 py-3 uppercase" />
        <input name="claim_code" required placeholder="CL01-TEST" className="w-full rounded-xl border border-white/15 px-4 py-3 uppercase" />

        <button disabled={loading} className="w-full rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-50">
          {loading ? "Registering..." : "Register Device"}
        </button>

        {message && (
          <p className={success ? "text-emerald-300" : "text-red-300"}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}