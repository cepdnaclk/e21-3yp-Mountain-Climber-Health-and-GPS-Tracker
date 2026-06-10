import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminUsersClient from "./AdminUsersClient";

type AccountRow = {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  email: string;
  role: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string | null;
};

type DeviceRow = {
  owner_id: string | null;
  status: string | null;
};

type AdminRow = {
  user_id: string;
};

export default async function AdminUsersPage() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Admin Access Required</h1>

        <p className="mt-4 text-slate-400">{adminCheck.message}</p>

        <Link
          href="/login?next=/admin/users"
          className="mt-6 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950"
        >
          Login as Admin
        </Link>
      </main>
    );
  }

  const { data: accountsData, error: accountsError } = await supabaseAdmin
    .from("basecamp_accounts")
    .select(
      "id, full_name, organization_name, email, role, verification_status, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const { data: devicesData } = await supabaseAdmin
    .from("devices")
    .select("owner_id, status");

  const { data: adminsData } = await supabaseAdmin
    .from("app_admins")
    .select("user_id");

  const accounts = (accountsData || []) as AccountRow[];
  const devices = (devicesData || []) as DeviceRow[];
  const admins = (adminsData || []) as AdminRow[];

  const adminIds = new Set(admins.map((admin) => admin.user_id));

  const deviceCountByOwner = new Map<string, number>();

  for (const device of devices) {
    if (!device.owner_id) continue;

    const previousCount = deviceCountByOwner.get(device.owner_id) || 0;
    deviceCountByOwner.set(device.owner_id, previousCount + 1);
  }

  const rows = accounts.map((account) => {
    return {
      ...account,
      device_count: deviceCountByOwner.get(account.id) || 0,
      is_admin: adminIds.has(account.id),
      is_current_admin: account.id === adminCheck.user.id,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Customer Management
          </p>

          <h1 className="mt-3 text-4xl font-black">Registered Users</h1>

          <p className="mt-4 max-w-3xl text-slate-400">
            View basecamp owner accounts, approve or suspend access, and remove
            test/customer users when needed.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-white/15 px-5 py-3 font-bold"
        >
          Back to Admin
        </Link>
      </div>

      {accountsError && (
        <div className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-red-300">
          {accountsError.message}
        </div>
      )}

      <AdminUsersClient users={rows} />
    </main>
  );
}