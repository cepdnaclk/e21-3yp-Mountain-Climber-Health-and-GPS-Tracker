"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  email: string;
  role: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string | null;
  device_count: number;
  is_admin: boolean;
  is_current_admin: boolean;
};

export default function AdminUsersClient({ users }: { users: UserRow[] }) {
  const router = useRouter();

  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateUserStatus(userId: string, status: string) {
    const confirmMessage =
      status === "suspended"
        ? "Suspend this user? They will lose portal/download access."
        : `Change user status to ${status}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoadingUserId(userId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          verification_status: status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update user.");
      }

      setMessage(data.message || "User updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoadingUserId(null);
    }
  }

  async function removeUser(user: UserRow) {
    if (user.is_current_admin) {
      setMessage("You cannot remove your own admin account.");
      return;
    }

    if (user.is_admin) {
      setMessage("Admin accounts cannot be removed from this page.");
      return;
    }

    const typedEmail = window.prompt(
      `This will delete the login account for ${user.email}, clear device ownership, and remove portal access.\n\nType the user's email to confirm:`
    );

    if (typedEmail !== user.email) {
      setMessage("Remove cancelled. Email confirmation did not match.");
      return;
    }

    setLoadingUserId(user.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to remove user.");
      }

      setMessage(data.message || "User removed.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoadingUserId(null);
    }
  }

  function statusClass(status: string | null) {
    if (status === "verified") {
      return "border-emerald-400/50 text-emerald-300";
    }

    if (status === "suspended") {
      return "border-red-400/50 text-red-300";
    }

    return "border-yellow-400/50 text-yellow-300";
  }

  return (
    <section className="mt-10">
      {message && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-bold">User Records</h2>

          <p className="mt-2 text-sm text-slate-400">
            Suspend is safer than remove. Use remove mainly for test accounts or
            incorrect registrations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Devices</th>
                <th className="p-4">Created</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="p-4 align-top">
                    <div className="font-bold">{user.full_name || "-"}</div>
                    <div className="text-slate-400">{user.email}</div>

                    {user.is_current_admin && (
                      <div className="mt-2 text-xs font-bold text-emerald-300">
                        Current admin
                      </div>
                    )}

                    {user.is_admin && !user.is_current_admin && (
                      <div className="mt-2 text-xs font-bold text-emerald-300">
                        Admin
                      </div>
                    )}
                  </td>

                  <td className="p-4 align-top">
                    {user.organization_name || "-"}
                  </td>

                  <td className="p-4 align-top">{user.role || "-"}</td>

                  <td className="p-4 align-top">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                        user.verification_status
                      )}`}
                    >
                      {user.verification_status || "pending"}
                    </span>
                  </td>

                  <td className="p-4 align-top">{user.device_count}</td>

                  <td className="p-4 align-top text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {user.verification_status !== "verified" && (
                        <button
                          disabled={loadingUserId === user.id}
                          onClick={() =>
                            updateUserStatus(user.id, "verified")
                          }
                          className="rounded-lg border border-emerald-400/50 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-40"
                        >
                          Approve
                        </button>
                      )}

                      {user.verification_status !== "pending" && (
                        <button
                          disabled={loadingUserId === user.id}
                          onClick={() => updateUserStatus(user.id, "pending")}
                          className="rounded-lg border border-yellow-400/50 px-3 py-2 text-xs font-bold text-yellow-300 disabled:opacity-40"
                        >
                          Pending
                        </button>
                      )}

                      {user.verification_status !== "suspended" && (
                        <button
                          disabled={
                            loadingUserId === user.id || user.is_current_admin
                          }
                          onClick={() =>
                            updateUserStatus(user.id, "suspended")
                          }
                          className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
                        >
                          Suspend
                        </button>
                      )}

                      {!user.is_admin && (
                        <button
                          disabled={
                            loadingUserId === user.id || user.is_current_admin
                          }
                          onClick={() => removeUser(user)}
                          className="rounded-lg border border-red-500 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No registered users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}