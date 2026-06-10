import Link from "next/link";

const portalLinks = [
  { label: "Dashboard", href: "/portal/dashboard" },
  { label: "Devices", href: "/portal/devices" },
  { label: "Register Device", href: "/portal/register-device" },
  { label: "Downloads", href: "/portal/downloads" },
  { label: "Basecamp Software", href: "/portal/basecamp-software" },
  { label: "Mobile App", href: "/portal/mobile-app" },
  { label: "Firmware Updater", href: "/portal/firmware" },
  { label: "Repeater Node", href: "/portal/repeater" },
  { label: "Setup Workflow", href: "/portal/setup" },
  { label: "Documentation", href: "/portal/docs" },
  { label: "Releases", href: "/portal/releases" },
  { label: "Support", href: "/portal/support" },
];
export default function PortalLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-slate-900 px-6 py-6 lg:border-b-0 lg:border-r">
          <Link href="/" className="block">
            <p className="text-xl font-bold">MountainSafety</p>
            <p className="text-sm text-slate-400">Customer Portal Prototype</p>
          </Link>

          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <p className="text-sm text-emerald-300">Demo Basecamp</p>
            <p className="mt-1 font-semibold">BC-DEMO-001</p>
            <p className="mt-2 text-xs text-slate-400">
              Prototype account. Real login and database will be added later.
            </p>
          </div>

          <nav className="mt-8 grid gap-2">
            {portalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="mt-8 block rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-300 hover:bg-white/10"
          >
            Back to Website
          </Link>
        </aside>

        <section className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
                Portal Prototype
              </p>
              <h1 className="mt-3 text-4xl font-bold">{title}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">{description}</p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}