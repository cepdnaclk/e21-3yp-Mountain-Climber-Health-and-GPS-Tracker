import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminAccessRequestsClient from "./AdminAccessRequestsClient.tsx";

export default async function AdminAccessRequestsPage() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Admin Access Required</h1>

        <p className="mt-4 text-slate-400">{adminCheck.message}</p>

        <Link
          href="/login?next=/admin/access-requests"
          className="mt-6 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950"
        >
          Login as Admin
        </Link>
      </main>
    );
  }

  const { data: requests, error } = await supabaseAdmin
    .from("basecamp_access_requests")
    .select(
      "id, full_name, organization_name, email, phone, location, expected_device_count, reason, status, admin_note, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="text-4xl font-black">Access Requests</h1>

      <p className="mt-4 text-slate-400">
        Approve verified basecamp owners and send invite emails.
      </p>

      {error && <p className="mt-6 text-red-300">{error.message}</p>}

      <AdminAccessRequestsClient requests={requests || []} />
    </main>
  );
}