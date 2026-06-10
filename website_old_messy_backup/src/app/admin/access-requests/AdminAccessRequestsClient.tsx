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
  updated_at: string | null;
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

      setMessage(data.message || "Request approved and invite sent.");
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
    const note =
      window.prompt("Reason for rejection / admin note:") ||
      "Rejected by admin.";

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
          admin_note: note,
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

  function statusClass(status: AccessRequest["status"]) {
    if (status === "pending") {
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    }

    if (status === "invited" || status === "approved") {
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    }

    if (status === "rejected") {
      return "border-red-300 bg-red-50 text-red-800";
    }

    return "border-gray-300 bg-gray-50 text-gray-800";
  }

  return (
    <section className="mt-10">
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-gray-300">
            <tr>
              <th className="p-4">Requester</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Location</th>
              <th className="p-4">Devices</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-white/10">
                <td className="p-4 align-top">
                  <div className="font-semibold">{request.full_name}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(request.created_at).toLocaleString()}
                  </div>

                  {request.reason && (
                    <div className="mt-3 max-w-xs text-xs text-gray-400">
                      {request.reason}
                    </div>
                  )}
                </td>

                <td className="p-4 align-top">
                  {request.organization_name || "-"}
                </td>

                <td className="p-4 align-top">
                  <div>{request.email}</div>
                  <div className="mt-1 text-gray-400">
                    {request.phone || "-"}
                  </div>
                </td>

                <td className="p-4 align-top">{request.location || "-"}</td>

                <td className="p-4 align-top">
                  {request.expected_device_count || 1}
                </td>

                <td className="p-4 align-top">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>

                  {request.admin_note && (
                    <div className="mt-2 max-w-xs text-xs text-gray-400">
                      {request.admin_note}
                    </div>
                  )}
                </td>

                <td className="p-4 align-top">
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={
                        loadingId === request.id ||
                        request.status === "invited" ||
                        request.status === "rejected"
                      }
                      onClick={() => approveRequest(request.id)}
                      className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
                    >
                      {loadingId === request.id
                        ? "Processing..."
                        : "Approve & Send Invite"}
                    </button>

                    <button
                      disabled={
                        loadingId === request.id ||
                        request.status === "invited" ||
                        request.status === "rejected"
                      }
                      onClick={() => rejectRequest(request.id)}
                      className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-300 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td className="p-8 text-center text-gray-400" colSpan={7}>
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