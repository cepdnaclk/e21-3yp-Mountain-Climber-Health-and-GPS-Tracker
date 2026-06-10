"use client";

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

    const body = {
      full_name: formData.get("full_name"),
      organization_name: formData.get("organization_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      location: formData.get("location"),
      expected_device_count: formData.get("expected_device_count"),
      reason: formData.get("reason"),
    };

    const response = await fetch("/api/request-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    setMessage(data.message || "Request submitted.");
    setSuccess(Boolean(data.ok));
    setLoading(false);

    if (data.ok) {
      form.reset();
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Verified basecamp owner registration
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Request Basecamp Owner Access
      </h1>

      <p className="mt-4 text-gray-600">
        MountainSafety accounts are only created for verified basecamp owners,
        guide teams, research teams, or rescue operators. Submit your request
        and the project team will review it before sending a login invitation.
      </p>

      <form onSubmit={submitRequest} className="mt-8 space-y-4">
        <input
          name="full_name"
          required
          placeholder="Full name"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="organization_name"
          placeholder="Organization / basecamp name"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="phone"
          placeholder="Phone number"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="location"
          placeholder="Basecamp location"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="expected_device_count"
          type="number"
          min="1"
          defaultValue="1"
          placeholder="Expected number of devices"
          className="w-full rounded-xl border px-4 py-3"
        />

        <textarea
          name="reason"
          required
          placeholder="Why do you need access to the MountainSafety system?"
          className="min-h-32 w-full rounded-xl border px-4 py-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Access Request"}
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
    </main>
  );
}