"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalLayout from "@/components/PortalLayout";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type BasecampAccount = {
  id: string;
  basecamp_code: string;
  name: string;
};

type Device = {
  id: string;
  device_type: string;
  serial_number: string;
};

type FirmwareVersion = {
  id: string;
  device_type: string;
  version: string;
  file_name: string;
  status: string;
  release_notes: string | null;
  created_at: string;
};

const updaterSteps = [
  "Login to the portal",
  "Register your physical device",
  "Open firmware page",
  "Select matching firmware record",
  "Download firmware package when production downloads are enabled",
  "Flash ESP32 using the future firmware updater tool",
  "Restart device and confirm status",
];

function getDeviceLabel(deviceType: string) {
  if (deviceType === "CLIMBER_DEVICE") return "Climber ESP32 Device";
  if (deviceType === "BASECAMP_NODE") return "Basecamp ESP32 LoRa Node";
  if (deviceType === "ARMBAND_H2") return "ESP32-H2 Armband";
  if (deviceType === "REPEATER_NODE") return "LoRa Repeater Node";
  return deviceType;
}

function getFirmwareDescription(item: FirmwareVersion) {
  if (item.release_notes) return item.release_notes;

  if (item.device_type === "CLIMBER_DEVICE") {
    return "Firmware for the main climber device with GPS, LoRa, Wi-Fi API, SOS, OLED, and mobile app support.";
  }

  if (item.device_type === "BASECAMP_NODE") {
    return "Firmware for the basecamp LoRa node that bridges LoRa packets to the local Flask dashboard through USB serial.";
  }

  if (item.device_type === "ARMBAND_H2") {
    return "Firmware for the ESP32-H2 armband module prepared for MAX30102 heart-rate integration.";
  }

  if (item.device_type === "REPEATER_NODE") {
    return "Firmware for the future LoRa repeater node used to extend field communication range.";
  }

  return "Firmware version record.";
}

export default function FirmwarePage() {
  const supabase = createSupabaseBrowserClient();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [basecamps, setBasecamps] = useState<BasecampAccount[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [firmwareVersions, setFirmwareVersions] = useState<FirmwareVersion[]>(
    []
  );

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadFirmwarePage() {
      setIsCheckingAuth(true);
      setIsLoadingData(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        setIsLoadingData(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: basecampData, error: basecampError } = await supabase
        .from("basecamp_accounts")
        .select("id, basecamp_code, name")
        .order("created_at", { ascending: true });

      if (basecampError) {
        console.error("Basecamp load error:", basecampError);
        setErrorMessage("Could not load your basecamp accounts.");
        setIsCheckingAuth(false);
        setIsLoadingData(false);
        return;
      }

      const loadedBasecamps = basecampData ?? [];
      setBasecamps(loadedBasecamps);

      const basecampIds = loadedBasecamps.map((basecamp) => basecamp.id);

      let loadedDevices: Device[] = [];

      if (basecampIds.length > 0) {
        const { data: deviceData, error: deviceError } = await supabase
          .from("devices")
          .select("id, device_type, serial_number")
          .in("basecamp_account_id", basecampIds);

        if (deviceError) {
          console.error("Device load error:", deviceError);
          setErrorMessage("Could not load your registered devices.");
          setIsCheckingAuth(false);
          setIsLoadingData(false);
          return;
        }

        loadedDevices = deviceData ?? [];
      }

      setDevices(loadedDevices);

      const registeredDeviceTypes = Array.from(
        new Set(loadedDevices.map((device) => device.device_type))
      );

      let loadedFirmware: FirmwareVersion[] = [];

      if (registeredDeviceTypes.length > 0) {
        const { data: firmwareData, error: firmwareError } = await supabase
          .from("firmware_versions")
          .select("*")
          .in("device_type", registeredDeviceTypes)
          .order("created_at", { ascending: true });

        if (firmwareError) {
          console.error("Firmware versions load error:", firmwareError);
          setErrorMessage("Could not load firmware version records.");
          setIsCheckingAuth(false);
          setIsLoadingData(false);
          return;
        }

        loadedFirmware = firmwareData ?? [];
      }

      setFirmwareVersions(loadedFirmware);
      setIsCheckingAuth(false);
      setIsLoadingData(false);
    }

    loadFirmwarePage();
  }, [supabase]);

  if (isCheckingAuth) {
    return (
      <PortalLayout
        title="Firmware Updater"
        description="Checking portal authentication..."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 sm:p-6">
          Checking login status...
        </div>
      </PortalLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PortalLayout
        title="Firmware Updater"
        description="Login is required to view firmware records."
      >
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Login Required</h2>

          <p className="mt-3 leading-7 text-slate-300">
            Firmware records are unlocked according to registered physical
            devices. Please login or create a basecamp account before accessing
            firmware records.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-white/10 px-5 py-3 text-center font-semibold text-white hover:bg-white/10"
            >
              Create Basecamp Account
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const registeredDeviceTypes = Array.from(
    new Set(devices.map((device) => device.device_type))
  );

  return (
    <PortalLayout
      title="Firmware Updater"
      description="Firmware records are unlocked based on registered device types under your basecamp account."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Device-Based Firmware Access</h2>

        <p className="mt-3 leading-7 text-slate-300">
          The portal checks your registered devices before showing firmware
          version records. This prevents irrelevant firmware packages from being
          shown to basecamp users and keeps the workflow closer to a real product
          portal.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-8 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 text-orange-300 sm:p-6">
          {errorMessage}
        </div>
      )}

      {basecamps.length === 0 && (
        <div className="mt-8 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">No Basecamp Account Found</h2>

          <p className="mt-3 leading-7 text-slate-300">
            Your login exists, but no basecamp account is connected yet. Create a
            basecamp account first.
          </p>

          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Create Basecamp Account
          </Link>
        </div>
      )}

      {basecamps.length > 0 && devices.length === 0 && (
        <div className="mt-8 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Register a Device First</h2>

          <p className="mt-3 leading-7 text-slate-300">
            Firmware records are unlocked after you register at least one
            physical device under your basecamp account.
          </p>

          <Link
            href="/portal/register-device"
            className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Register Device
          </Link>
        </div>
      )}

      {devices.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Registered Devices</p>
              <p className="mt-2 text-3xl font-bold">{devices.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Unlocked Firmware</p>
              <p className="mt-2 text-3xl font-bold">
                {firmwareVersions.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-slate-400">Device Types</p>
              <p className="mt-2 break-words text-lg font-bold">
                {registeredDeviceTypes.join(", ")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Access Rule</p>
              <p className="mt-2 text-lg font-bold">Matched by device type</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Firmware Updater Workflow</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This explains the planned production firmware update process.
                Actual firmware downloads are disabled in this prototype.
              </p>

              <div className="mt-5 grid gap-3">
                {updaterSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-xl border border-white/10 bg-slate-950 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400 font-bold text-slate-950">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-6 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Registered Device Types</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Firmware records below are filtered according to these device
                types.
              </p>

              <div className="mt-5 grid gap-3">
                {registeredDeviceTypes.map((deviceType) => (
                  <div
                    key={deviceType}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {getDeviceLabel(deviceType)}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">
                  Local-first safety architecture
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Firmware packages support the local field system. Real climber
                  tracking stays at the basecamp through LoRa and the Flask
                  dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-bold">Unlocked Firmware Records</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Only firmware records matching your registered device types are
              shown here.
            </p>

            {isLoadingData && (
              <p className="mt-5 text-slate-300">
                Loading firmware version records...
              </p>
            )}

            {!isLoadingData && firmwareVersions.length === 0 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="text-slate-300">
                  No matching firmware records found for your registered
                  devices.
                </p>
              </div>
            )}

            {!isLoadingData && firmwareVersions.length > 0 && (
              <div className="mt-6 grid gap-4">
                {firmwareVersions.map((firmware) => (
                  <div
                    key={firmware.id}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          {firmware.device_type}
                        </p>

                        <h3 className="mt-1 break-words text-xl font-bold">
                          {getDeviceLabel(firmware.device_type)}
                        </h3>

                        <p className="mt-2 text-sm text-emerald-300">
                          Version: {firmware.version}
                        </p>

                        <p className="mt-1 break-words text-sm text-slate-400">
                          {firmware.file_name}
                        </p>
                      </div>

                      <span className="w-fit shrink-0 rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                        {firmware.status}
                      </span>
                    </div>

                    <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
                      {getFirmwareDescription(firmware)}
                    </p>

                    <button
                      type="button"
                      disabled
                      className="mt-5 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-400 sm:w-fit"
                    >
                      Firmware download unavailable in prototype
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-bold">Firmware Security Note</h2>

            <p className="mt-3 leading-7 text-slate-300">
              This prototype displays firmware records only. In a production
              version, real firmware files should be stored in a protected
              storage system and released using temporary signed download links
              only for authenticated users with matching registered devices.
            </p>
          </div>
        </>
      )}
    </PortalLayout>
  );
}