import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const packages = [
  {
    title: "Basic Basecamp Kit",
    badge: "Prototype Target",
    items: [
        "1 × Basecamp ESP32 LoRa Gateway",
        "Multiple Climber ESP32 Devices",
        "1 × LoRa Repeater Node",
        "Firmware Updater Package",
        "Device Registration Support",
      ],
  },
  {
    title: "Ranger Team Kit",
    badge: "Next Product Stage",
    items: [
      "1 × Basecamp LoRa Gateway",
      "Multiple Climber Devices",
      "1 × LoRa Repeater Node",
      "Device Registration Support",
      "Firmware Update Package",
    ],
  },
  {
    title: "Rescue Network Kit",
    badge: "Future Expansion",
    items: [
      "Multiple Basecamp / Repeater Nodes",
      "Multi-climber Monitoring",
      "Cloud Account Support",
      "Remote Logs and Reports",
      "Maintenance and Support Plan",
    ],
  },
];

export default function PackagesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            Product Packages
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-6xl">
            Hardware and software packages for basecamp users.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            The final product should be delivered as an easy-to-install safety kit,
            not as raw source code. The basecamp user should receive a packaged
            local dashboard installer, firmware updater, ESP32 firmware packages,
            Flutter mobile APK, setup guides, and optional repeater support.
            </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {packages.map((pack) => (
              <div
                key={pack.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                  {pack.badge}
                </span>
                <h2 className="mt-5 text-2xl font-bold">{pack.title}</h2>

                <div className="mt-6 grid gap-3">
                  {pack.items.map((item) => (
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

          <div className="mt-12 rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-2xl font-bold">Future download package</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The customer portal will later provide Basecamp Software Installer,
              Firmware Updater, Climber Firmware, Basecamp Node Firmware,
              Repeater Firmware, Mobile App APK, and PDF setup guides.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}