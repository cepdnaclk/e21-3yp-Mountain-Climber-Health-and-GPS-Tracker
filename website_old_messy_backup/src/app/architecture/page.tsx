import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const modules = [
  {
    title: "Main Climber Device",
    description:
      "ESP32-based climber unit with SX1278/Ra-02 LoRa, NEO-6M GPS, OLED display, and SOS / Clear / OK buttons.",
    items: [
      "NEO-6M GPS tracking",
      "SX1278/Ra-02 LoRa communication",
      "OLED device status",
      "SOS button",
      "Clear SOS button",
      "I am OK / check-in button",
      "Wi-Fi AP for Flutter app",
    ],
  },
  {
    title: "ESP32-H2 Armband",
    description:
      "Bluetooth armband module prepared for health monitoring expansion using the MAX30102 heart-rate sensor.",
    items: [
      "ESP32-H2 Bluetooth module",
      "Armband status support",
      "Prepared for MAX30102 integration",
      "Future BPM data forwarding",
      "Future wearable health monitoring",
    ],
  },
  {
    title: "Basecamp LoRa Node",
    description:
      "ESP32 + SX1278/Ra-02 LoRa gateway connected to the basecamp laptop through USB serial.",
    items: [
      "Receives LoRa packets from climber devices",
      "Sends basecamp replies through LoRa",
      "USB serial bridge to laptop",
      "Supports dashboard command forwarding",
      "RSSI/SNR packet diagnostics",
    ],
  },
  {
    title: "Flask Web Dashboard",
    description:
      "Local dashboard running on the basecamp laptop for monitoring climber location, alerts, messages, and session logs.",
    items: [
      "Multi-climber cards",
      "Alert panel",
      "Distance map",
      "Conversation panel",
      "Basecamp GPS setup",
      "Session log export",
    ],
  },
  {
    title: "Flutter Mobile App",
    description:
      "Climber-side mobile app connected to the climber ESP32 Wi-Fi AP for status, SOS, messages, and phone GPS fallback.",
    items: [
      "Status display",
      "Quick messages",
      "Mobile SOS",
      "Phone GPS fallback",
      "Distance from basecamp",
      "Armband status",
    ],
  },
];

const flows = [
  {
    title: "Normal GPS Tracking",
    flow:
      "NEO-6M GPS → Main Climber ESP32 → LoRa → Basecamp ESP32 → USB Serial → Flask Web Dashboard",
  },
  {
    title: "SOS Flow",
    flow:
      "SOS Button / Mobile SOS → Main Climber ESP32 → LoRa → Basecamp ESP32 → Web Dashboard Alert Panel",
  },
  {
    title: "Messaging Flow",
    flow:
      "Flutter Mobile App → Wi-Fi AP → Main Climber ESP32 → LoRa → Basecamp Dashboard",
  },
  {
    title: "Basecamp Reply Flow",
    flow:
      "Web Dashboard → USB Serial → Basecamp ESP32 → LoRa → Main Climber ESP32 → Flutter App",
  },
  {
    title: "Phone GPS Fallback",
    flow:
      "Phone GPS → Flutter App → ESP32 Wi-Fi AP → Main Climber ESP32 → LoRa → Web Dashboard",
  },
];

const hardware = [
  "ESP32 main climber device",
  "SX1278/Ra-02 LoRa module",
  "NEO-6M GPS module",
  "OLED display",
  "SOS / Clear / OK buttons",
  "ESP32 basecamp LoRa node",
  "ESP32-H2 armband",
  "MAX30102 planned",
];

export default function ArchitecturePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            System Architecture
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold sm:text-6xl">
            Current stable LoRa architecture for off-grid climber safety.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
            The system is built as a local off-grid communication network. The
            climber device sends GPS, SOS, messages, and status data through
            LoRa. The basecamp ESP32 forwards data to a laptop through USB
            serial, where the Flask web dashboard provides live monitoring.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <h2 className="text-xl font-bold">{module.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {module.description}
                </p>

                <div className="mt-5 grid gap-2">
                  {module.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
            <h2 className="text-2xl font-bold">Current Data Flows</h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {flows.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                >
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.flow}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-2xl font-bold">Hardware Stack</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {hardware.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}