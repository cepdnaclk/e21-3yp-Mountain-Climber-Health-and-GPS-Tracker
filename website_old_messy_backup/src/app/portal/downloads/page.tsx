import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DownloadsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: packages, error } = await supabase
    .from("software_packages")
    .select(
      "id, title, description, package_type, required_device_type, version, hardware_version"
    )
    .eq("is_active", true)
    .order("package_type", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Device-based access
      </p>

      <h1 className="mt-3 text-3xl font-bold">Downloads</h1>

      <p className="mt-3 text-gray-600">
        Downloads are shown automatically based on your registered device types.
      </p>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {(packages || []).map((pkg) => (
          <div key={pkg.id} className="rounded-xl border p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{pkg.title}</h2>

                <p className="mt-1 text-gray-600">{pkg.description}</p>

                <p className="mt-3 text-sm text-gray-500">
                  Type: {pkg.package_type} · Required device:{" "}
                  {pkg.required_device_type} · Version: {pkg.version}
                </p>
              </div>

              <a
                href={`/api/downloads/${pkg.id}`}
                className="rounded-xl bg-black px-5 py-3 text-center font-semibold text-white"
              >
                Download
              </a>
            </div>
          </div>
        ))}

        {(!packages || packages.length === 0) && (
          <div className="rounded-xl border bg-gray-50 p-6 text-gray-600">
            No downloads available. Register a verified device first.
          </div>
        )}
      </div>
    </main>
  );
}