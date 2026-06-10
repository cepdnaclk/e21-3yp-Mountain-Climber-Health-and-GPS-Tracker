import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminAccessRequestsClient from "./AdminAccessRequestsClient";

export default async function AdminAccessRequestsPage() {
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

  const { data: requests, error } = await supabaseAdmin
    .from("basecamp_access_requests")
    .select(
      "id, full_name, organization_name, email, phone, location, expected_device_count, reason, status, admin_note, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Admin Verification
          </p>

          <h1 className="mt-3 text-4xl font-bold">Basecamp Access Requests</h1>

          <p className="mt-3 text-gray-400">
            Approve verified basecamp owners and send Supabase login
            invitations without opening the database manually.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/10"
        >
          Back to Admin
        </Link>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
          {error.message}
        </div>
      )}

      <AdminAccessRequestsClient requests={requests || []} />
    </main>
  );
}