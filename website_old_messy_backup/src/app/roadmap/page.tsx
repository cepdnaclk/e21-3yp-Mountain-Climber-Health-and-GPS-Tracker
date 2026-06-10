import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const roadmap = [
  {
    phase: "Current Stable Version",
    title: "Working LoRa Climber Safety System",
    status: "Completed / Stable",
    description:
      "The system now works as a LoRa-based off-grid climber tracking and communication prototype with GPS, SOS, two-way messaging, dashboard monitoring, mobile app support, and session logs.",
    items: [
      "NEO-6M GPS tracking",
      "Phone GPS fallback",
      "LoRa communication",
      "Hardware and mobile SOS",
      "Clear SOS workflow",
      "Check-in / I am OK button",
      "Two-way messaging",
      "OLED device status",
      "Flask dashboard",
      "Flutter mobile app",
      "Session log export",
      "GPS jitter filtering",
    ],
  },
  {
    phase: "Next Development Stage",
    title: "Solar LoRa Repeater Node",
    status: "Next",
    description:
      "The next hardware and firmware stage is a repeater node to extend LoRa communication range in mountainous terrain.",
    items: [
      "Repeater ESP32 + LoRa module",
      "Packet forwarding",
      "Duplicate packet filtering",
      "Hop count and repeater ID",
      "Signal path shown on dashboard",
      "Battery/solar power planning",
      "Outdoor enclosure planning",
    ],
  },
  {
    phase: "Hardware Improvement",
    title: "Product-Level Device Design",
    status: "Planned",
    description:
      "The current prototype should be improved with better battery monitoring, compact enclosure design, reliable wiring/PCB planning, and field-ready packaging.",
    items: [
      "Real battery percentage monitoring",
      "Compact enclosure",
      "Improved wiring or custom PCB",
      "Field LoRa range testing",
      "Weather-resistant design",
      "Stable antenna mounting",
    ],
  },
  {
    phase: "Health Monitoring Upgrade",
    title: "MAX30102 Armband Integration",
    status: "Planned",
    description:
      "The ESP32-H2 armband is prepared for future health monitoring using the MAX30102 heart-rate sensor.",
    items: [
      "MAX30102 heart-rate integration",
      "BPM forwarding",
      "Armband battery reporting",
      "Sensor status reporting",
      "Mobile app health status",
      "Dashboard health field support",
    ],
  },
  {
    phase: "Production Packaging",
    title: "Installer, APK, Firmware Packages",
    status: "Future",
    description:
      "The system should later be packaged for non-technical basecamp users as installers, APK files, firmware binaries, setup guides, and portal downloads.",
    items: [
      "Basecamp software installer",
      "Flutter APK package",
      "Firmware updater",
      "Firmware .bin releases",
      "Setup documentation",
      "Troubleshooting guides",
      "Device registration portal",
    ],
  },
  {
    phase: "Larger Deployment",
    title: "Multi-Climber Field Deployment",
    status: "Future",
    description:
      "After repeater and packaging improvements, the system can be tested with multiple climber devices and larger field deployment scenarios.",
    items: [
      "Multiple climber devices",
      "Multi-climber dashboard testing",
      "Repeater-supported route testing",
      "Ranger/rescue team testing",
      "Session report review",
      "Production beta feedback",
    ],
  },
];

const currentScope = [
  "Working LoRa-based climber tracking",
  "NEO-6M GPS + phone GPS fallback",
  "SOS from hardware and mobile app",
  "Clear SOS from hardware and dashboard",
  "Check-in / I am OK button",
  "Two-way messaging",
  "Flask web dashboard",
  "Flutter mobile app",
  "Multi-climber-ready dashboard",
  "Session log export",
];

const futureScope = [
  "Real battery percentage monitoring",
  "MAX30102 heart-rate integration",
  "Compact enclosure",
  "Field LoRa range testing",
  "Solar LoRa repeater",
  "Larger multi-climber deployment",
];

export default function RoadmapPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            Development Roadmap
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold sm:text-6xl">
            From stable LoRa prototype to field-ready safety product.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
            The project has moved from an early concept into a working LoRa-based
            off-grid climber tracking and safety communication system. The next
            focus is repeater-node development, product-level hardware
            improvement, and production packaging.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
              <h2 className="text-2xl font-bold">Current Stable Scope</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {currentScope.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-400/30 bg-orange-400/10 p-6">
              <h2 className="text-2xl font-bold">Future Improvements</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {futureScope.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8">
            {roadmap.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      {phase.phase}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">{phase.title}</h2>
                    <p className="mt-4 max-w-4xl leading-7 text-slate-300">
                      {phase.description}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
                    {phase.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {phase.items.map((item) => (
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
            <h2 className="text-2xl font-bold">Recommended Immediate Step</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Freeze the current stable LoRa version in GitHub, then start the
              solar LoRa repeater node in a separate development branch. After
              repeater communication works, update the dashboard to show signal
              path, repeater ID, hop count, and RSSI/SNR diagnostics.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}