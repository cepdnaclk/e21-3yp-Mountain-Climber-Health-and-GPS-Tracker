"use client";

import { useState } from "react";

export default function RegisterDevicePage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function claimDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const body = {
      device_uid: formData.get("device_uid"),
      claim_code: formData.get("claim_code"),
    };

    const response = await fetch("/api/device/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    setMessage(data.message || "Done.");
    setSuccess(Boolean(data.ok));
    setLoading(false);

    if (data.ok) {
      form.reset();
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Device identity system
      </p>

      <h1 className="mt-3 text-3xl font-bold">Register Device</h1>

      <p className="mt-3 text-gray-600">
        Enter the Device UID and Claim Code printed on your MountainSafety
        device label or QR card.
      </p>

      <form onSubmit={claimDevice} className="mt-8 space-y-4">
        <input
          name="device_uid"
          required
          placeholder="Example: MCS-CL-2026-0001"
          className="w-full rounded-xl border px-4 py-3 uppercase"
        />

        <input
          name="claim_code"
          required
          placeholder="Example: 8K29-XP41"
          className="w-full rounded-xl border px-4 py-3 uppercase"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register Device"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 ${
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-8 rounded-xl border bg-gray-50 p-5 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">How this works</p>
        <p className="mt-2">
          Devices are created by the project team during provisioning. A
          verified basecamp owner can only claim a real device using its UID and
          claim code.
        </p>
      </div>
    </main>
  );
}