import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccountStatus } from "@/lib/account/requireVerifiedAccount";

export default async function DevicesPage() {
  const accountStatus = await getCurrentAccountStatus();

  if (!accountStatus.loggedIn) {
    redirect("/login");
  }

  if (!accountStatus.isVerified) {
    redirect("/portal");
  }

  const supabase = await createSupabaseServerClient();

  const { data: devices, error } = await supabase
    .from("devices")
    .select(
      "id, device_uid, device_type, hardware_version, firmware_version, serial_number, status, registered_at"
    )
    .order("registered_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-4xl font-black">My Devices</h1>

      {error && <p className="mt-6 text-red-300">{error.message}</p>}

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">UID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Hardware</th>
              <th className="p-4">Firmware</th>
              <th className="p-4">Serial</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {(devices || []).map((device) => (
              <tr key={device.id} className="border-t border-white/10">
                <td className="p-4 font-mono">{device.device_uid}</td>
                <td className="p-4">{device.device_type}</td>
                <td className="p-4">{device.hardware_version}</td>
                <td className="p-4">{device.firmware_version}</td>
                <td className="p-4">{device.serial_number || "-"}</td>
                <td className="p-4">{device.status}</td>
              </tr>
            ))}

            {(!devices || devices.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No devices registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}