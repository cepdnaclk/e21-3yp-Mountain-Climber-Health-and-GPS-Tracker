"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeviceRow = {
  id: string;
  device_uid: string;
  device_type: string;
  hardware_version: string | null;
  firmware_version: string | null;
  serial_number: string | null;
  status: string;
  owner_id: string | null;
  owner_email: string | null;
  owner_organization: string | null;
  registered_at: string | null;
  created_at: string;
};

type CreatedDevice = {
  device_uid: string;
  claim_code: string;
  device_type: string;
  hardware_version: string;
  firmware_version: string;
  serial_number: string | null;
};

export default function AdminDevicesClient({
  devices,
}: {
  devices: DeviceRow[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [createdDevice, setCreatedDevice] = useState<CreatedDevice | null>(
    null
  );

  async function createDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setCreatedDevice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/devices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_type: formData.get("device_type"),
          hardware_version: formData.get("hardware_version"),
          firmware_version: formData.get("firmware_version"),
          serial_number: formData.get("serial_number"),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to create device.");
      }

      setMessage("Device created. Save/print the claim code now.");
      setCreatedDevice({
        device_uid: data.device_uid,
        claim_code: data.claim_code,
        device_type: data.device_type,
        hardware_version: data.hardware_version,
        firmware_version: data.firmware_version,
        serial_number: data.serial_number,
      });

      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateDeviceStatus(deviceId: string, status: string) {
    const confirmMessage =
      status === "unassigned"
        ? "This will remove the owner from this device. Continue?"
        : `Change device status to ${status}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setStatusLoadingId(deviceId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/devices/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: deviceId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update status.");
      }

      setMessage(data.message || "Device status updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setStatusLoadingId(null);
    }
  }

  function statusBadgeClass(status: string) {
    if (status === "active") {
      return "border-emerald-400/50 text-emerald-300";
    }

    if (status === "assigned") {
      return "border-blue-400/50 text-blue-300";
    }

    if (status === "disabled" || status === "lost") {
      return "border-red-400/50 text-red-300";
    }

    return "border-white/15 text-slate-300";
  }

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Create New Device</h2>

        <p className="mt-2 text-sm text-slate-400">
          This creates a UID and claim code for a physical product. Print them
          on the product label before shipping.
        </p>

        <form onSubmit={createDevice} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-300">
              Device Type
            </span>

            <select
              name="device_type"
              required
              defaultValue="climber"
              className="mt-2 w-full rounded-xl border border-white/15 px-4 py-3"
            >
              <option value="climber">Climber Device / Kit</option>
              <option value="basecamp">Basecamp Gateway</option>
              <option value="repeater">Repeater Node</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-300">
              Hardware Version
            </span>

            <input
              name="hardware_version"
              defaultValue="HW-1.0"
              className="mt-2 w-full rounded-xl border border-white/15 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-300">
              Firmware Version
            </span>

            <input
              name="firmware_version"
              defaultValue="FW-1.0.0"
              className="mt-2 w-full rounded-xl border border-white/15 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-300">
              Serial Number / Board Note
            </span>

            <input
              name="serial_number"
              placeholder="Optional, e.g. CLIMBER-BOARD-001"
              className="mt-2 w-full rounded-xl border border-white/15 px-4 py-3"
            />
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create UID + Claim Code"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-4 text-sm">
            {message}
          </div>
        )}

        {createdDevice && (
          <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              Print this label
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400">Device UID</p>
                <p className="font-mono text-xl font-black">
                  {createdDevice.device_uid}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Claim Code</p>
                <p className="font-mono text-xl font-black text-emerald-300">
                  {createdDevice.claim_code}
                </p>
              </div>

              <div className="text-sm text-slate-400">
                {createdDevice.device_type} · {createdDevice.hardware_version} ·{" "}
                {createdDevice.firmware_version}
              </div>
            </div>

            <p className="mt-4 text-xs text-yellow-200">
              Important: the claim code is shown only now. Print it or save it
              securely. The database stores only the hashed version.
            </p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-bold">Device Records</h2>

          <p className="mt-2 text-sm text-slate-400">
            Assigned or active devices are claimed by customers. Unassigned
            devices are ready for manufacturing or shipping. Disabled/lost
            devices cannot unlock downloads.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-4">UID</th>
                <th className="p-4">Type</th>
                <th className="p-4">HW</th>
                <th className="p-4">FW</th>
                <th className="p-4">Serial</th>
                <th className="p-4">Status</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t border-white/10">
                  <td className="p-4 font-mono font-bold">
                    {device.device_uid}
                  </td>

                  <td className="p-4">{device.device_type}</td>

                  <td className="p-4">{device.hardware_version || "-"}</td>

                  <td className="p-4">{device.firmware_version || "-"}</td>

                  <td className="p-4">{device.serial_number || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(
                        device.status
                      )}`}
                    >
                      {device.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {device.owner_email ? (
                      <div>
                        <div className="font-bold">{device.owner_email}</div>
                        <div className="text-xs text-slate-400">
                          {device.owner_organization || "-"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">Not claimed</span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {device.owner_id && device.status !== "active" && (
                        <button
                          disabled={statusLoadingId === device.id}
                          onClick={() =>
                            updateDeviceStatus(device.id, "active")
                          }
                          className="rounded-lg border border-emerald-400/50 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-40"
                        >
                          Active
                        </button>
                      )}

                      {device.owner_id && device.status !== "assigned" && (
                        <button
                          disabled={statusLoadingId === device.id}
                          onClick={() =>
                            updateDeviceStatus(device.id, "assigned")
                          }
                          className="rounded-lg border border-blue-400/50 px-3 py-2 text-xs font-bold text-blue-300 disabled:opacity-40"
                        >
                          Assigned
                        </button>
                      )}

                      {device.status !== "disabled" && (
                        <button
                          disabled={statusLoadingId === device.id}
                          onClick={() =>
                            updateDeviceStatus(device.id, "disabled")
                          }
                          className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
                        >
                          Disable
                        </button>
                      )}

                      {device.status !== "lost" && (
                        <button
                          disabled={statusLoadingId === device.id}
                          onClick={() => updateDeviceStatus(device.id, "lost")}
                          className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
                        >
                          Lost
                        </button>
                      )}

                      {device.status !== "unassigned" && (
                        <button
                          disabled={statusLoadingId === device.id}
                          onClick={() =>
                            updateDeviceStatus(device.id, "unassigned")
                          }
                          className="rounded-lg border border-yellow-400/50 px-3 py-2 text-xs font-bold text-yellow-300 disabled:opacity-40"
                        >
                          Unassign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {devices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No devices created yet.
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