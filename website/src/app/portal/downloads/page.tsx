import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccountStatus } from "@/lib/account/requireVerifiedAccount";

type SoftwarePackage = {
  id: string;
  title: string;
  description: string | null;
  package_type: string;
  required_device_type: string;
  version: string;
  install_supported: boolean | null;
};

export default async function DownloadsPage() {
  const accountStatus = await getCurrentAccountStatus();

  if (!accountStatus.loggedIn) {
    redirect("/login");
  }

  if (!accountStatus.isVerified) {
    redirect("/portal");
  }

  const supabase = await createSupabaseServerClient();

  const { data: devices } = await supabase
    .from("devices")
    .select("device_type")
    .eq("owner_id", accountStatus.user.id)
    .in("status", ["assigned", "active"]);

  const ownedDeviceTypes = Array.from(
    new Set((devices || []).map((device) => device.device_type))
  );

  const allowedTypes = ["any", ...ownedDeviceTypes];

  const { data: packages, error } = await supabase
    .from("software_packages")
    .select(
      "id, title, description, package_type, required_device_type, version, install_supported"
    )
    .eq("is_active", true)
    .in("required_device_type", allowedTypes)
    .order("package_type", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-4xl font-black">Downloads</h1>

      <p className="mt-4 text-slate-400">
        Downloads are unlocked based on your registered MountainSafety devices.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="font-bold">Registered device access</p>

        {ownedDeviceTypes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {ownedDeviceTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-emerald-400/40 px-3 py-1 text-sm font-bold text-emerald-300"
              >
                {type}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-slate-400">
            No devices registered yet. Claim your physical device first to
            unlock product downloads.
          </p>
        )}
      </div>

      {error && <p className="mt-6 text-red-300">{error.message}</p>}

      <div className="mt-8 grid gap-4">
        {((packages || []) as SoftwarePackage[]).map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{pkg.title}</h2>

                <p className="mt-2 text-slate-400">
                  {pkg.description || "No description provided."}
                </p>

                <p className="mt-3 text-sm text-slate-500">
                  {pkg.package_type} · requires {pkg.required_device_type} · v
                  {pkg.version}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {pkg.install_supported && (
                <a
                  href={`/portal/install/${pkg.id}`}
                  className="inline-block rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950"
                >
                  Install in Browser
                </a>
              )}

              <a
                href={`/api/downloads/${pkg.id}`}
                className="inline-block rounded-xl border border-white/15 px-5 py-3 font-bold"
              >
                Download
              </a>
            </div>
          </div>
        ))}

        {(!packages || packages.length === 0) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
            No downloads available for your current registered devices.
          </div>
        )}
      </div>
    </main>
  );
}