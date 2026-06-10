import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";

export default async function AdminPage() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Admin Access Required</h1>
        <p className="mt-4 text-gray-500">{adminCheck.message}</p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black"
        >
          Go to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        MountainSafety Admin
      </p>

      <h1 className="mt-3 text-4xl font-bold">Admin Panel</h1>

      <p className="mt-4 text-gray-400">
        Manage verified basecamp owner requests, device identities, downloads,
        and support operations.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/access-requests"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
        >
          <h2 className="text-2xl font-bold">Access Requests</h2>
          <p className="mt-2 text-gray-400">
            Review basecamp access requests and send login invitations.
          </p>
        </Link>

        <Link
          href="/portal/devices"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
        >
          <h2 className="text-2xl font-bold">Device Records</h2>
          <p className="mt-2 text-gray-400">
            View claimed and assigned product devices.
          </p>
        </Link>
      </div>
    </main>
  );
}