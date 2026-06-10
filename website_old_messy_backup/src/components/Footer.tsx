import Link from "next/link";

const websiteLinks = [
  { label: "Features", href: "/features" },
  { label: "Architecture", href: "/architecture" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const portalLinks = [
  { label: "Portal Dashboard", href: "/portal/dashboard" },
  { label: "Register Device", href: "/portal/register-device" },
  { label: "Devices", href: "/portal/devices" },
  { label: "Downloads", href: "/portal/downloads" },
  { label: "Firmware", href: "/portal/firmware" },
  { label: "Support", href: "/portal/support" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 font-black text-slate-950">
              MS
            </div>

            <div>
              <p className="font-bold">MountainSafety</p>
              <p className="text-sm text-slate-400">
                LoRa-based climber safety system
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Mountain Climber IoT Safety Tracking System is a University of
            Peradeniya Department of Computer Engineering third year project.
            The online portal manages product records, support, device
            registration, and downloads. Real-time climber tracking remains
            local at the basecamp through LoRa and the Flask dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <p className="text-sm font-semibold text-emerald-300">
              Local-first safety architecture
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Climber ESP32 → LoRa → Basecamp ESP32 → USB Serial → Local Flask
              Dashboard
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Website
          </h2>

          <div className="mt-4 grid gap-3">
            {websiteLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Portal
          </h2>

          <div className="mt-4 grid gap-3">
            {portalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © 2026 Mountain Climber IoT Safety Tracking System. Academic product
          prototype.
        </p>

        <p>
          University of Peradeniya · Department of Computer Engineering · 3YP
        </p>
      </div>
    </footer>
  );
}