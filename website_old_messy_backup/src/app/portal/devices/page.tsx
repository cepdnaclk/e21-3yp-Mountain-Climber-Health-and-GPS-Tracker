import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DevicesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: devices, error } = await supabase
    .from("devices")
    .select(
      "id, device_uid, device_type, hardware_version, firmware_version, serial_number, status, registered_at, last_seen_at"
    )
    .order("registered_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Registered hardware
          </p>
          <h1 className="mt-3 text-3xl font-bold">My Devices</h1>
          <p className="mt-3 text-gray-600">
            Devices linked to your verified basecamp owner account.
          </p>
        </div>

        <a
          href="/portal/register-device"
          className="rounded-xl bg-black px-5 py-3 text-center font-semibold text-white"
        >
          Register Device
        </a>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {error.message}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-4">Device UID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Hardware</th>
              <th className="p-4">Firmware</th>
              <th className="p-4">Serial</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {(devices || []).map((device) => (
              <tr key={device.id} className="border-t">
                <td className="p-4 font-mono">{device.device_uid}</td>
                <td className="p-4 capitalize">{device.device_type}</td>
                <td className="p-4">{device.hardware_version || "-"}</td>
                <td className="p-4">{device.firmware_version || "-"}</td>
                <td className="p-4">{device.serial_number || "-"}</td>
                <td className="p-4 capitalize">{device.status}</td>
              </tr>
            ))}

            {(!devices || devices.length === 0) && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={6}>
                  No devices registered yet. Register a device using its UID and
                  claim code.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}