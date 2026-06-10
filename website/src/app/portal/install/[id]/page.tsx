import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountStatus } from "@/lib/account/requireVerifiedAccount";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function FirmwareInstallPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const packageId = resolvedParams.id;

  const accountStatus = await getCurrentAccountStatus();

  if (!accountStatus.loggedIn) {
    redirect("/login");
  }

  if (!accountStatus.isVerified) {
    redirect("/portal");
  }

  const { data: pkg, error } = await supabaseAdmin
    .from("software_packages")
    .select(
      "id, title, description, required_device_type, version, install_supported"
    )
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (error || !pkg) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Package not found</h1>
        <Link href="/portal/downloads" className="mt-6 inline-block underline">
          Back to Downloads
        </Link>
      </main>
    );
  }

  if (!pkg.install_supported) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black">Browser install not available</h1>
        <p className="mt-4 text-slate-400">
          This package can only be downloaded.
        </p>
        <Link href="/portal/downloads" className="mt-6 inline-block underline">
          Back to Downloads
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="module"
        src="https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module"
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Browser Firmware Installer
      </p>

      <h1 className="mt-3 text-4xl font-black">{pkg.title}</h1>

      <p className="mt-4 text-slate-400">
        {pkg.description || "Install MountainSafety firmware using your browser."}
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Before you install</h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-300">
          <li>Use Chrome or Edge browser.</li>
          <li>Connect the correct ESP32 device using a USB data cable.</li>
          <li>Do not disconnect the cable during installation.</li>
          <li>Install only the firmware for the matching device type.</li>
        </ol>

        <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-100">
          Device UID should already be saved during manufacturing. This
          installer updates firmware only. Claim Code is never written to the
          device.
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <h2 className="text-2xl font-bold">Install Firmware</h2>

        <div className="mt-5">
          {React.createElement("esp-web-install-button", {
            manifest: `/api/firmware-manifest/${packageId}`,
          } as any)}
        </div>
      </div>

      <Link
        href="/portal/downloads"
        className="mt-8 inline-block rounded-xl border border-white/15 px-5 py-3 font-bold"
      >
        Back to Downloads
      </Link>
    </main>
  );
}
