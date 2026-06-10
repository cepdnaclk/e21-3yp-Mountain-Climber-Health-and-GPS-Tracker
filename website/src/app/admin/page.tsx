import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";

export default async function AdminPage() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Admin Access Required</h1>

        <p className="mt-4 text-slate-400">{adminCheck.message}</p>

        <Link
          href="/login?next=/admin"
          className="mt-6 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950"
        >
          Login as Admin
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-black">Admin Panel</h1>

      <p className="mt-4 text-slate-400">
        Manage customers, approvals, product device UIDs, and software
        downloads.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/access-requests"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Access Requests</h2>
          <p className="mt-2 text-slate-400">
            Approve registered basecamp owners.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="mt-2 text-slate-400">
            View, approve, suspend, or remove customers.
          </p>
        </Link>

        <Link
          href="/admin/devices"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Devices</h2>
          <p className="mt-2 text-slate-400">
            Create UIDs and claim codes for manufacturing.
          </p>
        </Link>

        <Link
          href="/portal/downloads"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Downloads</h2>
          <p className="mt-2 text-slate-400">
            Check customer-visible package records.
          </p>
        </Link>
      </div>
    </main>
  );
}