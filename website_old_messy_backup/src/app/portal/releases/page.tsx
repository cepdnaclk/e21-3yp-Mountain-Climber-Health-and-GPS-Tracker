"use client";

import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { supabase } from "@/lib/supabaseClient";

type ReleaseNote = {
  id: string;
  version: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

const components = [
  {
    name: "Climber Main Firmware",
    current: "Development build",
    next: "v1.0.0 firmware package",
  },
  {
    name: "Basecamp LoRa Firmware",
    current: "Development build",
    next: "v1.0.0 firmware package",
  },
  {
    name: "Armband ESP32-H2 Firmware",
    current: "Prototype module",
    next: "v1.0.0 firmware package",
  },
  {
    name: "Repeater Node Firmware",
    current: "Planned",
    next: "v0.3 prototype",
  },
  {
    name: "Flutter Mobile App",
    current: "Development build",
    next: "Android APK package",
  },
  {
    name: "Flask Basecamp Dashboard",
    current: "Prototype available",
    next: "Windows installer package",
  },
];

function getReleaseItems(release: ReleaseNote) {
  if (release.version === "v0.2-current-lora-system") {
    return [
      "NEO-6M GPS tracking",
      "Phone GPS fallback",
      "LoRa-based off-grid communication",
      "SOS from hardware button and mobile app",
      "Two-way messaging",
      "Local Flask dashboard",
      "Flutter mobile app",
      "Session logs and export support",
    ];
  }

  if (release.version === "v0.3-repeater-node") {
    return [
      "Solar LoRa repeater node planning",
      "Packet forwarding",
      "Duplicate packet filtering",
      "Hop count and repeater ID support",
      "Dashboard signal path update",
      "Field LoRa range testing",
    ];
  }

  return [
    "Product version record",
    "Software and firmware tracking",
    "Package management support",
    "Portal release documentation",
  ];
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReleases() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("release_notes")
        .select("*")
        .order("created_at", { ascending: true });

      setIsLoading(false);

      if (error) {
        console.error("Release notes load error:", error);
        setErrorMessage("Could not load release note records.");
        return;
      }

      setReleases(data ?? []);
    }

    loadReleases();
  }, []);

  return (
    <PortalLayout
      title="Release Notes"
      description="Release notes track current and planned software, firmware, and portal milestones."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Version Tracking Strategy</h2>

        <p className="mt-3 leading-7 text-slate-300">
          Each firmware and software module should have its own version number.
          Stable milestones should be tagged in GitHub before major changes such
          as repeater-node development, software packaging, or production portal
          integration.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Component Version Status</h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          This section summarizes the current stage and next expected package for
          each major system component.
        </p>

        {/* Mobile card layout */}
        <div className="mt-5 grid gap-4 md:hidden">
          {components.map((component) => (
            <div
              key={component.name}
              className="rounded-2xl border border-white/10 bg-slate-950 p-5"
            >
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Component
              </p>

              <h3 className="mt-1 text-lg font-bold">{component.name}</h3>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-500">Current</p>
                  <p className="mt-1 text-slate-200">{component.current}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-500">Next Package</p>
                  <p className="mt-1 text-slate-200">{component.next}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table layout */}
        <div className="mt-5 hidden overflow-hidden rounded-xl border border-white/10 md:block">
          <div className="grid grid-cols-3 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-300">
            <p>Component</p>
            <p>Current</p>
            <p>Next Package</p>
          </div>

          {components.map((component) => (
            <div
              key={component.name}
              className="grid grid-cols-3 border-t border-white/10 px-4 py-3 text-sm"
            >
              <p className="font-semibold">{component.name}</p>
              <p className="text-slate-300">{component.current}</p>
              <p className="text-slate-300">{component.next}</p>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 sm:p-6">
          Loading release note records...
        </div>
      )}

      {errorMessage && (
        <div className="mt-8 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 text-orange-300 sm:p-6">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && releases.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 sm:p-6">
          No release note records found yet.
        </div>
      )}

      {!isLoading && !errorMessage && releases.length > 0 && (
        <div className="mt-8 grid gap-6">
          {releases.map((release) => (
            <div
              key={release.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                    Product Release
                  </p>

                  <h2 className="mt-2 break-words text-2xl font-bold">
                    {release.version}
                  </h2>

                  <p className="mt-2 break-words text-lg font-semibold text-slate-200">
                    {release.title}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Created: {new Date(release.created_at).toLocaleString()}
                  </p>
                </div>

                <span className="w-fit shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-slate-300">
                  {release.status}
                </span>
              </div>

              <p className="mt-4 max-w-4xl leading-7 text-slate-300">
                {release.description ?? "No release description added yet."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {getReleaseItems(release).map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Release Management Note</h2>

        <p className="mt-3 leading-7 text-slate-300">
          Release notes in this portal are used for product and project tracking.
          Real deployment packages should be connected to stable GitHub tags,
          firmware version records, and protected download records when the
          system is prepared for field deployment.
        </p>
      </div>
    </PortalLayout>
  );
}