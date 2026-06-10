import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminDevicesClient from "./AdminDevicesClient";

type DeviceRow = {
  id: string;
  device_uid: string;
  device_type: string;
  hardware_version: string | null;
  firmware_version: string | null;
  serial_number: string | null;
  status: string;
  owner_id: string | null;
  registered_at: string | null;
  created_at: string;
};

type OwnerAccount = {
  id: string;
  email: string;
  organization_name: string | null;
};

export default async function AdminDevicesPage() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Admin Access Required</h1>

        <p className="mt-4 text-slate-400">{adminCheck.message}</p>

        <Link
          href="/login?next=/admin/devices"
          className="mt-6 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950"
        >
          Login as Admin
        </Link>
      </main>
    );
  }

  const { data: devicesData, error: devicesError } = await supabaseAdmin
    .from("devices")
    .select(
      "id, device_uid, device_type, hardware_version, firmware_version, serial_number, status, owner_id, registered_at, created_at"
    )
    .order("created_at", { ascending: false });

  const devices = (devicesData || []) as DeviceRow[];

  const ownerIds = Array.from(
    new Set(
      devices
        .map((device) => device.owner_id)
        .filter((ownerId): ownerId is string => Boolean(ownerId))
    )
  );

  let ownerAccounts: OwnerAccount[] = [];

  if (ownerIds.length > 0) {
    const { data: ownersData } = await supabaseAdmin
      .from("basecamp_accounts")
      .select("id, email, organization_name")
      .in("id", ownerIds);

    ownerAccounts = (ownersData || []) as OwnerAccount[];
  }

  const ownersById = new Map<string, OwnerAccount>();

  for (const owner of ownerAccounts) {
    ownersById.set(owner.id, owner);
  }

  const rows = devices.map((device) => {
    const owner = device.owner_id ? ownersById.get(device.owner_id) : null;

    return {
      ...device,
      owner_email: owner?.email || null,
      owner_organization: owner?.organization_name || null,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Factory Device Management
          </p>

          <h1 className="mt-3 text-4xl font-black">Devices</h1>

          <p className="mt-4 max-w-3xl text-slate-400">
            Create product device UIDs and claim codes for manufacturing,
            labeling, customer registration, and device-based downloads.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-white/15 px-5 py-3 font-bold"
        >
          Back to Admin
        </Link>
      </div>

      {devicesError && (
        <div className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-red-300">
          {devicesError.message}
        </div>
      )}

      <AdminDevicesClient devices={rows} />
    </main>
  );
}