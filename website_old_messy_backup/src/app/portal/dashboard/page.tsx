"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalLayout from "@/components/PortalLayout";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type BasecampSummary = {
  id: string;
  basecamp_code: string;
  name: string;
  location: string | null;
  contact_email: string;
  status: string;
  created_at: string;
  registered_devices: number;
};

type DashboardSummary = {
  basecamps: BasecampSummary[];
  software_packages: number;
  firmware_versions: number;
  release_notes: number;
};

const modules = [
  "Climber ESP32 firmware",
  "Basecamp ESP32 LoRa firmware",
  "Armband ESP32-H2 firmware",
  "Flutter mobile app",
  "Local Flask basecamp dashboard",
  "Future LoRa repeater firmware",
];

export default function PortalDashboard() {
  const supabase = createSupabaseBrowserClient();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsCheckingAuth(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await supabase.rpc(
        "get_my_portal_dashboard_summary"
      );

      if (error) {
        console.error("Dashboard summary load error:", error);
        setErrorMessage("Could not load your portal dashboard summary.");
        setIsCheckingAuth(false);
        return;
      }

      setSummary(data as DashboardSummary);
      setIsCheckingAuth(false);
    }

    loadDashboard();
  }, [supabase]);

  if (isCheckingAuth) {
    return (
      <PortalLayout
        title="Basecamp Dashboard"
        description="Checking portal authentication..."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 sm:p-6">
          Loading dashboard...
        </div>
      </PortalLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PortalLayout
        title="Basecamp Dashboard"
        description="Login is required to view your basecamp dashboard."
      >
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Login Required</h2>

          <p className="mt-3 leading-7 text-slate-300">
            The portal dashboard is connected to real basecamp accounts. Please
            login or create a basecamp account to view your dashboard.
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

  const basecamps = summary?.basecamps ?? [];
  const primaryBasecamp = basecamps[0];

  const totalRegisteredDevices = basecamps.reduce(
    (total, basecamp) => total + Number(basecamp.registered_devices || 0),
    0
  );

  const stats = [
    {
      label: "Your Basecamps",
      value: String(basecamps.length),
      helper: "Basecamp profiles linked to your login.",
    },
    {
      label: "Registered Devices",
      value: String(totalRegisteredDevices),
      helper: "Devices assigned to your basecamp accounts.",
    },
    {
      label: "Software Packages",
      value: summary ? String(summary.software_packages) : "-",
      helper: "Product package records in the portal.",
    },
    {
      label: "Firmware Records",
      value: summary ? String(summary.firmware_versions) : "-",
      helper: "Firmware version records available by device type.",
    },
    {
      label: "Release Notes",
      value: summary ? String(summary.release_notes) : "-",
      helper: "Product and firmware milestone records.",
    },
    {
      label: "Current Stage",
      value: "Auth Portal",
      helper: "Authenticated product portal prototype.",
    },
  ];

  return (
    <PortalLayout
      title="Basecamp Dashboard"
      description="This dashboard is linked to the logged-in user's basecamp account. It is for product portal management only; real climber tracking remains local at the basecamp."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Portal Backend Scope</h2>

        <p className="mt-3 leading-7 text-slate-300">
          This online portal manages basecamp accounts, registered devices,
          support requests, software package records, firmware version records,
          and release notes. It does not perform cloud-based climber tracking.
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
            You are logged in, but no basecamp profile is connected to your
            account yet. Create a basecamp account to start registering devices.
          </p>

          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Create Basecamp Account
          </Link>
        </div>
      )}

      {primaryBasecamp && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            Primary Basecamp
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Name</p>
              <p className="mt-2 break-words font-semibold">
                {primaryBasecamp.name}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Basecamp Code</p>
              <p className="mt-2 break-words font-semibold text-emerald-300">
                {primaryBasecamp.basecamp_code}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Location</p>
              <p className="mt-2 break-words font-semibold">
                {primaryBasecamp.location ?? "Not set"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-2 font-semibold">{primaryBasecamp.status}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 break-words text-3xl font-bold">{stat.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {stat.helper}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Current Software/Firmware Stack</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module}
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
              >
                {module}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Recommended Next Actions</h2>

          <div className="mt-5 grid gap-4">
            <Link
              href="/portal/register-device"
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              Register a physical device
            </Link>

            <Link
              href="/portal/devices"
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              View registered devices
            </Link>

            <Link
              href="/portal/support"
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              Submit support ticket
            </Link>

            <Link
              href="/portal/downloads"
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              View device-based downloads
            </Link>

            <Link
              href="/portal/firmware"
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              View device-based firmware
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Local Field System Reminder</h2>

        <p className="mt-3 leading-7 text-slate-300">
          The real field operation remains offline-first: climber ESP32 devices
          communicate through LoRa to the basecamp ESP32 node, which connects to
          the local Flask dashboard through USB serial. This online portal is
          only for product support, records, and package management.
        </p>

        <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="break-words text-sm font-semibold text-emerald-300">
            Climber ESP32 → LoRa → Basecamp ESP32 → USB Serial → Local Flask
            Dashboard
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}