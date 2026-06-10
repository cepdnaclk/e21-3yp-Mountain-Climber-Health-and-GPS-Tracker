import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    title: "LoRa Communication",
    description:
      "Long-range communication between climber devices and the basecamp node without depending on mobile network coverage.",
  },
  {
    title: "GPS Tracking",
    description:
      "Climber location data is sent to the basecamp dashboard for monitoring during mountain activities.",
  },
  {
    title: "SOS Emergency Alert",
    description:
      "A physical SOS button allows the climber to send an emergency alert to the basecamp quickly.",
  },
  {
    title: "Two-Way Messages",
    description:
      "Short text messages can be exchanged between the climber device/mobile app and the basecamp dashboard.",
  },
  {
    title: "Basecamp Dashboard",
    description:
      "A local dashboard helps basecamp operators view climber status, location, messages, and alerts.",
  },
  {
    title: "Repeater Node Ready",
    description:
      "The next development stage is a LoRa repeater node to extend communication range in mountainous terrain.",
  },
];

const packageItems = [
  "Basecamp LoRa Gateway Device",
  "Climber Tracking Device",
  "Flutter Mobile Companion App",
  "Basecamp Monitoring Software",
  "Firmware Update Package",
  "Optional LoRa Repeater Node",
];

const statusItems = [
  {
    name: "Climber Device Firmware",
    status: "In Development",
  },
  {
    name: "Basecamp LoRa Node",
    status: "In Development",
  },
  {
    name: "Flutter Mobile App",
    status: "In Development",
  },
  {
    name: "Basecamp Dashboard",
    status: "Prototype Available",
  },
  {
    name: "Repeater Node",
    status: "Next Development Stage",
  },
  {
    name: "Customer Portal",
    status: "Prototype Website Stage",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.25),_transparent_35%),radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%)]" />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Product prototype under development
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Offline climber safety tracking for remote mountain basecamps.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                A LoRa-based IoT safety system for climbers, hiking guides, and
                rescue teams. Track GPS location, receive SOS alerts, exchange
                short messages, and monitor field activity from a local basecamp
                dashboard without relying on cellular coverage.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/packages"
                  className="rounded-xl bg-emerald-400 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  View Product Package
                </Link>

                <Link
                  href="/portal"
                  className="rounded-xl border border-white/15 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
                >
                  Open Portal Prototype
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-slate-900 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Live System Preview
                    </p>
                    <h2 className="text-2xl font-bold">Basecamp Dashboard</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                    Demo
                  </span>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Climber ID</p>
                    <p className="text-xl font-semibold">CLIMBER-001</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">LoRa Status</p>
                      <p className="font-semibold text-emerald-300">
                        Connected
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">SOS</p>
                      <p className="font-semibold text-sky-300">Normal</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Next Upgrade</p>
                    <p className="font-semibold">
                      LoRa Repeater Node Integration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              Core Features
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Built for low-signal mountain environments.
            </h2>

            <p className="mt-4 text-slate-300">
              The current product direction focuses on GPS tracking, LoRa
              communication, SOS alerts, short messages, and a local basecamp
              dashboard. Temperature sensing is not included in the current
              scope.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/features"
              className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              View all features →
            </Link>
          </div>
        </section>

        <section id="packages" className="bg-white text-slate-950">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                Product Package
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                A complete safety kit, not just source code.
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                The final production version should be delivered as a hardware
                and software package. Basecamp users should be able to install
                the software, connect the LoRa gateway, register devices, and
                start monitoring without coding knowledge.
              </p>

              <div className="mt-8">
                <Link
                  href="/packages"
                  className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  View Package Plans
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-2xl font-bold">Basecamp Safety Kit</h3>

              <div className="mt-6 grid gap-3">
                {packageItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
                How It Works
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Simple offline-first data flow.
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                The climber device sends compact LoRa packets to the basecamp
                node. The basecamp node connects to a laptop through USB serial,
                and the local dashboard displays climber location, alert status,
                and messages.
              </p>

              <div className="mt-8">
                <Link
                  href="/how-it-works"
                  className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  See System Flow
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
              <h3 className="text-2xl font-bold">System Flow</h3>

              <div className="mt-6 grid gap-3 text-sm text-slate-300">
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  Climber Device
                </div>
                <div className="text-center text-emerald-300">↓ LoRa</div>
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  Optional Repeater Node
                </div>
                <div className="text-center text-emerald-300">↓ LoRa</div>
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  Basecamp LoRa Node
                </div>
                <div className="text-center text-emerald-300">↓ USB Serial</div>
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  Local Basecamp Dashboard
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="status" className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              Development Status
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Current stage of the system.
            </h2>

            <p className="mt-4 text-slate-300">
              This website is started early as a professional product and portal
              prototype while firmware, circuit design, app development, and
              repeater-node development continue in parallel.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            {statusItems.map((item) => (
              <div
                key={item.name}
                className="flex flex-col justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center"
              >
                <p className="font-medium">{item.name}</p>
                <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-400 text-slate-950">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">
                Portal prototype is ready to design.
              </h2>

              <p className="mt-2 text-slate-800">
                Build customer login, downloads, device registration, and
                support pages step by step after the hardware reaches stable
                versions.
              </p>
            </div>

            <Link
              href="/portal"
              className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              View Portal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}