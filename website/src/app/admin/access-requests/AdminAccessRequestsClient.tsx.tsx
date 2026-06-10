"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccessRequest = {
  id: string;
  full_name: string;
  organization_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  expected_device_count: number | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "invited";
  admin_note: string | null;
  created_at: string;
};

export default function AdminAccessRequestsClient({
  requests,
}: {
  requests: AccessRequest[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function approveRequest(id: string) {
    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/access-requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: id }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Approval failed.");
      }

      setMessage(data.message || "Account approved.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function rejectRequest(id: string) {
    const admin_note =
      window.prompt("Reason for rejection:") || "Rejected by admin.";

    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/access-requests/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: id,
          admin_note,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Rejection failed.");
      }

      setMessage(data.message || "Request rejected.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="mt-10">
      {message && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Email</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-white/10">
                <td className="p-4 align-top">
                  <div className="font-bold">{request.full_name}</div>
                  <div className="mt-2 max-w-xs text-xs text-slate-400">
                    {request.reason || "-"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </td>

                <td className="p-4 align-top">
                  {request.organization_name || "-"}
                </td>

                <td className="p-4 align-top">{request.email}</td>

                <td className="p-4 align-top">{request.location || "-"}</td>

                <td className="p-4 align-top">
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold">
                    {request.status}
                  </span>

                  {request.admin_note && (
                    <div className="mt-2 max-w-xs text-xs text-slate-400">
                      {request.admin_note}
                    </div>
                  )}
                </td>

                <td className="p-4 align-top">
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={loadingId === request.id || request.status === "approved"}
                      onClick={() => approveRequest(request.id)}
                      className="rounded-lg bg-emerald-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-40"
                    >
                      {loadingId === request.id ? "Processing..." : "Approve Account"}
                    </button>

                    <button
                      disabled={
                        loadingId === request.id ||
                        request.status === "approved" ||
                        request.status === "rejected"
                      }
                      onClick={() => rejectRequest(request.id)}
                      className="rounded-lg border border-red-400 px-4 py-2 font-bold text-red-300 disabled:opacity-40"
                    >
                      Reject
                    </button>
                                      </div>
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No access requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}