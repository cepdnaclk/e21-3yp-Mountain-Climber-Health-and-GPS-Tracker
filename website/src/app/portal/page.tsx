import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountStatus } from "@/lib/account/requireVerifiedAccount";

export default async function PortalPage() {
  const accountStatus = await getCurrentAccountStatus();

  if (!accountStatus.loggedIn) {
    redirect("/login");
  }

  if (!accountStatus.isVerified) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
          Pending approval
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Your account is waiting for approval
        </h1>

        <p className="mt-4 text-slate-400">
          Your account was created successfully, but the MountainSafety team has
          not approved it yet. Device registration, downloads, and product tools
          will unlock after approval.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-slate-300">
            Logged in as:{" "}
            <span className="font-bold">{accountStatus.user.email}</span>
          </p>

          <p className="mt-2 text-slate-400">
            Current status:{" "}
            <span className="font-bold text-yellow-300">
              {accountStatus.status}
            </span>
          </p>
        </div>

        <a
          href="/logout"
          className="mt-6 inline-block rounded-xl border border-white/15 px-5 py-3 font-bold"
        >
          Logout
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Basecamp Portal
          </p>

          <h1 className="mt-3 text-4xl font-black">Welcome</h1>

          <p className="mt-3 text-slate-400">{accountStatus.user.email}</p>
        </div>

        <a
          href="/logout"
          className="rounded-xl border border-white/15 px-5 py-3 font-bold"
        >
          Logout
        </a>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <Link
          href="/portal/register-device"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Register Device</h2>
          <p className="mt-2 text-slate-400">
            Claim a real device using UID and claim code.
          </p>
        </Link>

        <Link
          href="/portal/devices"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">My Devices</h2>
          <p className="mt-2 text-slate-400">
            View registered climber, basecamp, and repeater devices.
          </p>
        </Link>

        <Link
          href="/portal/downloads"
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-2xl font-bold">Downloads</h2>
          <p className="mt-2 text-slate-400">
            Download firmware, apps, and dashboard packages.
          </p>
        </Link>
      </section>
    </main>
  );
}